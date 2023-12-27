package org.lowcoder.domain.user.service;

import java.util.Collection;
import java.util.Map;

import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.domain.user.model.Connection;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.model.UserDetail;
import org.lowcoder.infra.annotation.NonEmptyMono;
import org.lowcoder.infra.mongo.MongoUpsertHelper.PartialResourceWithId;
import org.springframework.http.codec.multipart.Part;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface UserService {

    Mono<User> create(User user);

    Mono<User> update(String userId, User user);

    Mono<User> findById(String id);

    @NonEmptyMono
    Mono<Map<String, User>> getByIds(Collection<String> ids);

    Mono<User> findBySourceAndId(String connectionSource, String connectionSourceUuid);

    Mono<Boolean> saveProfilePhoto(Part filePart, User t2);

    Mono<Boolean> bindEmail(User user, String email);

    Mono<User> findByAuthUserSourceAndRawId(AuthUser authUser);

    Mono<User> findByAuthUserRawId(AuthUser authUser);

    Mono<User> createNewUserByAuthUser(AuthUser authUser);

    Mono<Void> getUserAvatar(ServerWebExchange exchange, String userId);

    Mono<Boolean> addNewConnection(String userId, Connection connection);

    Mono<User> addNewConnectionAndReturnUser(String userId, Connection connection);

    Mono<Void> deleteProfilePhoto(User visitor);

    Mono<Boolean> updatePassword(String userId, String oldPassword, String newPassword);

    Mono<String> resetPassword(String userId);

    Mono<Boolean> setPassword(String userId, String password);

    Mono<UserDetail> buildUserDetail(User user, boolean withoutDynamicGroups);

    Mono<Boolean> markUserDeletedAndInvalidConnectionsAtEnterpriseMode(String userId);

    Flux<User> bulkCreateUser(Collection<User> users);

    Mono<Void> bulkUpdateUser(Collection<PartialResourceWithId<User>> users);

    Flux<User> findBySourceAndIds(String connectionSource, Collection<String> connectionSourceUuids);

}

