package org.lowcoder.domain.user.service;


import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.RandomStringUtils;
import org.apache.commons.lang3.StringUtils;
import org.lowcoder.domain.asset.model.Asset;
import org.lowcoder.domain.asset.service.AssetService;
import org.lowcoder.domain.authentication.AuthenticationService;
import org.lowcoder.domain.authentication.context.FormAuthRequestContext;
import org.lowcoder.domain.encryption.EncryptionService;
import org.lowcoder.domain.group.model.Group;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.group.service.GroupService;
import org.lowcoder.domain.organization.model.OrgMember;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.user.model.*;
import org.lowcoder.domain.user.model.User.TransformedUserInfo;
import org.lowcoder.domain.user.repository.UserRepository;
import org.lowcoder.infra.mongo.MongoUpsertHelper;
import org.lowcoder.infra.mongo.MongoUpsertHelper.PartialResourceWithId;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.config.dynamic.Conf;
import org.lowcoder.sdk.config.dynamic.ConfigCenter;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.constants.WorkspaceMode;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.lowcoder.sdk.util.LocaleUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.codec.multipart.Part;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.annotation.Nonnull;
import java.security.SecureRandom;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.google.common.collect.Sets.newHashSet;
import static org.lowcoder.domain.user.model.UserDetail.ANONYMOUS_CURRENT_USER;
import static org.lowcoder.sdk.constants.GlobalContext.CLIENT_IP;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;
import static org.lowcoder.sdk.util.ExceptionUtils.ofException;

@Slf4j
@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private AssetService assetService;
    @Autowired
    private ConfigCenter configCenter;
    @Autowired
    private EncryptionService encryptionService;
    @Autowired
    private MongoUpsertHelper mongoUpsertHelper;
    @Autowired
    private UserRepository repository;
    @Autowired
    private GroupMemberService groupMemberService;
    @Autowired
    private OrgMemberService orgMemberService;
    @Autowired
    private GroupService groupService;
    @Autowired
    private CommonConfig commonConfig;
    @Autowired
    private AuthenticationService authenticationService;

    private Conf<Integer> avatarMaxSizeInKb;

    @PostConstruct
    public void init() {
        avatarMaxSizeInKb = configCenter.asset().ofInteger("avatarMaxSizeInKb", 300);
    }

    @Override
    public Mono<User> create(User user) {
        return repository.save(user);
    }

    @Override
    public Mono<User> findById(String id) {
        if (id == null) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", FieldName.ID));
        }

        return repository.findById(id);
    }

    @Override
    public Mono<Map<String, User>> getByIds(Collection<String> ids) {
        Set<String> idSet = newHashSet(ids);
        return repository.findByIdIn(idSet)
                .collectList()
                .map(it -> it.stream()
                        .collect(Collectors.toMap(User::getId, Function.identity()))
                );
    }

    @Override
    public Mono<User> findBySourceAndId(String source, String sourceUuid) {
        return repository.findByConnections_SourceAndConnections_RawId(source, sourceUuid);
    }

    public Mono<User> findByName(String rawUuid) {
        return repository.findByName(rawUuid);
    }

    @Override
    public Mono<Boolean> saveProfilePhoto(Part filePart, User user) {
        String prevAvatar = ObjectUtils.defaultIfNull(user.getAvatar(), "");
        Mono<Asset> newAvatarMono = assetService.upload(filePart, avatarMaxSizeInKb.get(), true);
        return newAvatarMono
                .flatMap(newAvatar -> {
                    Mono<Boolean> updateUserAvatarMono = updateUserAvatar(newAvatar, user.getId());
                    if (StringUtils.isEmpty(prevAvatar)) {
                        return updateUserAvatarMono;
                    }

                    return assetService.remove(prevAvatar).then(updateUserAvatarMono);
                });
    }

    private Mono<Boolean> updateUserAvatar(Asset newAvatar, String userId) {
        User user = new User();
        user.setAvatar(newAvatar.getId());
        return mongoUpsertHelper.updateById(user, userId);
    }

    public Mono<User> update(String id, User updatedUser) {
        return mongoUpsertHelper.updateById(updatedUser, id)
                .flatMap(updated -> {
                    if (!updated) {
                        return ofError(BizError.NO_RESOURCE_FOUND, "NO_USER_FOUND", id);
                    }
                    return findById(id);
                });
    }

    @Override
    public Mono<User> findByAuthUserSourceAndRawId(AuthUser authUser) {
        return findBySourceAndId(authUser.getSource(), authUser.getUid());
    }

    @Override
    public Mono<User> findByAuthUserRawId(AuthUser authUser) {
        return findByName(authUser.getUsername());
    }

    @Override
    public Mono<User> createNewUserByAuthUser(AuthUser authUser) {
        User newUser = new User();
        newUser.setName(authUser.getUsername());
        newUser.setState(UserState.ACTIVATED);
        newUser.setIsEnabled(true);
        newUser.setTpAvatarLink(authUser.getAvatar());
        if (AuthSourceConstants.EMAIL.equals(authUser.getSource())
                && authUser.getAuthContext() instanceof FormAuthRequestContext formAuthRequestContext) {
            newUser.setPassword(encryptionService.encryptPassword(formAuthRequestContext.getPassword()));
        }
        Set<Connection> connections = newHashSet();
        Connection connection = authUser.toAuthConnection();
        connections.add(connection);
        newUser.setConnections(connections);
        newUser.setIsNewUser(true);
        return create(newUser);
    }

    @Override
    public Mono<Void> getUserAvatar(ServerWebExchange exchange, String userId) {
        return findById(userId)
                .flatMap(user -> assetService.makeImageResponse(exchange, user.getAvatar()));
    }

    @Override
    public Mono<Boolean> bindEmail(User user, String email) {
        Connection connection = Connection.builder()
                .source(AuthSourceConstants.EMAIL)
                .name(email)
                .rawId(email)
                .build();
        user.getConnections().add(connection);
        return repository.save(user)
                .then(Mono.just(true))
                .onErrorResume(throwable -> {
                    if (throwable instanceof DuplicateKeyException) {
                        return Mono.error(new BizException(BizError.ALREADY_BIND, "ALREADY_BIND", email, ""));
                    }
                    return Mono.error(throwable);
                });
    }

    @Override
    public Mono<Boolean> addNewConnection(String userId, Connection connection) {
        return findById(userId)
                .doOnNext(user -> user.getConnections().add(connection))
                .flatMap(repository::save)
                .then(Mono.just(true));
    }

    @Override
    public Mono<User> addNewConnectionAndReturnUser(String userId, Connection connection) {
        return findById(userId)
                .doOnNext(user -> {
                    user.getConnections().add(connection);
                    user.setActiveAuthId(connection.getAuthId());
                })
                .flatMap(repository::save);
    }

    @Override
    public Mono<Void> deleteProfilePhoto(User visitor) {
        String userAvatar = visitor.getAvatar();
        visitor.setAvatar(null);
        return repository.save(visitor).thenReturn(userAvatar)
                .flatMap(assetService::remove);
    }

    @Override
    public Mono<Boolean> updatePassword(String userId, String oldPassword, String newPassword) {
        return findById(userId)
                .<User> handle((user, sink) -> {
                    String password = user.getPassword();
                    if (StringUtils.isBlank(password)) {
                        sink.error(ofException(BizError.INVALID_PASSWORD, "INVALID_PASSWORD"));
                        return;
                    }
                    String originalEncryptPassword = user.getPassword();
                    if (!encryptionService.matchPassword(oldPassword, originalEncryptPassword)) {
                        sink.error(ofException(BizError.INVALID_PASSWORD, "INVALID_PASSWORD"));
                        return;
                    }
                    user.setPassword(encryptionService.encryptPassword(newPassword));
                    sink.next(user);
                })
                .flatMap(repository::save)
                .thenReturn(true);
    }

    @Override
    public Mono<String> resetPassword(String userId) {
        return findById(userId)
                .flatMap(user -> {
                    String password = user.getPassword();
                    if (StringUtils.isBlank(password)) {
                        return ofError(BizError.INVALID_PASSWORD, "PASSWORD_NOT_SET_YET");
                    }

                    String randomStr = generateNewRandomPwd();
                    user.setPassword(encryptionService.encryptPassword(randomStr));
                    return repository.save(user)
                            .thenReturn(randomStr);
                });
    }

    @SuppressWarnings("SpellCheckingInspection")
    @Nonnull
    private static String generateNewRandomPwd() {
        char[] possibleCharacters = ("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~`!@#$%^&*()-_=+[{]}<>?")
                .toCharArray();
        return RandomStringUtils.random(12, 0, possibleCharacters.length - 1,
                false, false, possibleCharacters, new SecureRandom());
    }

    @Override
    public Mono<Boolean> setPassword(String userId, String password) {
        return findById(userId)
                .map(user -> {
                    user.setPassword(encryptionService.encryptPassword(password));
                    return user;
                })
                .flatMap(repository::save)
                .thenReturn(true);
    }


    @Override
    public Mono<UserDetail> buildUserDetail(User user, boolean withoutDynamicGroups) {
        if (user.isAnonymous()) {
            return Mono.just(ANONYMOUS_CURRENT_USER);
        }
        return Mono.deferContextual(contextView -> {
            String ip = contextView.getOrDefault(CLIENT_IP, "");
            Locale locale = LocaleUtils.getLocale(contextView);
            return orgMemberService.getCurrentOrgMember(user.getId())
                    .zipWhen(orgMember -> buildUserDetailGroups(user.getId(), orgMember, withoutDynamicGroups, locale))
                    .map(tuple2 -> {
                        OrgMember orgMember = tuple2.getT1();
                        List<Map<String, String>> groups = tuple2.getT2();
                        return UserDetail.builder()
                                .id(user.getId())
                                .name(user.getName())
                                .avatarUrl(user.getAvatarUrl())
                                .email(convertEmail(user.getConnections()))
                                .ip(ip)
                                .groups(groups)
                                .extra(getUserDetailExtra(user, orgMember.getOrgId()))
                                .build();
                    });
        });
    }

    /**
     * In enterprise mode, user can be deleted and then related connections should be released here by appending a timestamp after the source field.
     */
    @Override
    public Mono<Boolean> markUserDeletedAndInvalidConnectionsAtEnterpriseMode(String userId) {
        if (commonConfig.getWorkspace().getMode() == WorkspaceMode.SAAS) {
            return Mono.just(false);
        }
        return repository.findById(userId)
                .flatMap(user -> {
                    user.markAsDeleted();
                    return mongoUpsertHelper.updateById(user, userId);
                });
    }

    protected Map<String, Object> getUserDetailExtra(User user, String orgId) {
        return Optional.ofNullable(user.getOrgTransformedUserInfo())
                .map(orgTransformedUserInfo -> orgTransformedUserInfo.get(orgId))
                .map(TransformedUserInfo::extra)
                .orElse(convertConnections(user.getConnections()));
    }

    protected Mono<List<Map<String, String>>> buildUserDetailGroups(String userId, OrgMember orgMember, boolean withoutDynamicGroups,
            Locale locale) {
        String orgId = orgMember.getOrgId();
        Flux<Group> groups;
        if (orgMember.isAdmin()) {
            groups = groupService.getByOrgId(orgId).sort();
        } else {
            if (withoutDynamicGroups) {
                groups = groupMemberService.getNonDynamicUserGroupIdsInOrg(orgId, userId).flatMapMany(l -> groupService.getByIds(l));
            } else {
                groups = groupMemberService.getUserGroupIdsInOrg(orgId, userId).flatMapMany(l -> groupService.getByIds(l));
            }
        }
        return groups.filter(group -> !group.isAllUsersGroup())
                .map(group -> Map.of("groupId", Objects.toString(group.getId(), ""), "groupName", group.getName(locale)))
                .collectList();
    }

    protected Map<String, Object> convertConnections(Set<Connection> connections) {
        return connections.stream()
                .filter(connection -> !AuthSourceConstants.EMAIL.equals(connection.getSource()) &&
                        !AuthSourceConstants.PHONE.equals(connection.getSource()))
                .collect(Collectors.toMap(Connection::getSource, Connection::getRawUserInfo));
    }

    protected String convertEmail(Set<Connection> connections) {
        return connections.stream().filter(connection -> AuthSourceConstants.EMAIL.equals(connection.getSource()))
                .findFirst()
                .map(Connection::getName)
                .orElse("");
    }

    @Override
    public Flux<User> bulkCreateUser(Collection<User> users) {
        return repository.saveAll(users);
    }

    @Override
    public Mono<Void> bulkUpdateUser(Collection<PartialResourceWithId<User>> partialResourceWithIds) {
        return mongoUpsertHelper.bulkUpdate(partialResourceWithIds).then();
    }

    @Override
    public Flux<User> findBySourceAndIds(String connectionSource, Collection<String> connectionSourceUuids) {
        return repository.findByConnections_SourceAndConnections_RawIdIn(connectionSource, connectionSourceUuids);
    }

}
