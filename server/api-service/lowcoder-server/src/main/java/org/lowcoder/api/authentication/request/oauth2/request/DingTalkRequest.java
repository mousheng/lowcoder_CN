package org.lowcoder.api.authentication.request.oauth2.request;

import com.aliyun.dingtalkcontact_1_0.models.GetUserHeaders;
import com.aliyun.dingtalkcontact_1_0.models.GetUserResponseBody;
import com.aliyun.dingtalkoauth2_1_0.models.GetUserTokenRequest;
import com.aliyun.dingtalkoauth2_1_0.models.GetUserTokenResponse;
import com.aliyun.dingtalkoauth2_1_0.models.GetUserTokenResponseBody;
import com.aliyun.teaopenapi.models.Config;
import com.aliyun.teautil.models.RuntimeOptions;
import org.lowcoder.api.authentication.request.oauth2.OAuth2RequestContext;
import org.lowcoder.domain.user.model.AuthToken;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import reactor.core.publisher.Mono;

public class DingTalkRequest extends AbstractOauth2Request<Oauth2SimpleAuthConfig> {
    public static com.aliyun.dingtalkoauth2_1_0.Client authClient() throws Exception {
        Config config = new Config();
        config.protocol = "https";
        config.regionId = "central";
        return new com.aliyun.dingtalkoauth2_1_0.Client(config);
    }

    public static com.aliyun.dingtalkcontact_1_0.Client contactClient() throws Exception {
        Config config = new Config();
        config.protocol = "https";
        config.regionId = "central";
        return new com.aliyun.dingtalkcontact_1_0.Client(config);
    }

    public DingTalkRequest(Oauth2SimpleAuthConfig config) {
        super(config, null);
    }

    @Override
    protected Mono<AuthToken> getAuthToken(OAuth2RequestContext context) {
        return Mono.fromCallable(() -> {
            com.aliyun.dingtalkoauth2_1_0.Client client;
            try {
                client = authClient();
                GetUserTokenRequest getUserTokenRequest = new GetUserTokenRequest()
                        .setClientId(config.getClientId())
                        .setClientSecret(config.getClientSecret())
                        .setCode(context.getCode())
                        .setGrantType("authorization_code");
                GetUserTokenResponse getUserTokenResponse = client.getUserToken(getUserTokenRequest);
                GetUserTokenResponseBody tokenBody = getUserTokenResponse.getBody();
                return AuthToken.builder()
                        .accessToken(tokenBody.getAccessToken())
                        .expireIn(tokenBody.getExpireIn().intValue())
                        .refreshToken(tokenBody.getRefreshToken())
                        .build();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
    }

    @Override
    protected Mono<AuthToken> refreshAuthToken(String refreshToken) {
        return Mono.empty();
    }

    @Override
    protected Mono<AuthUser> getAuthUser(AuthToken authToken) {
        try {
            com.aliyun.dingtalkcontact_1_0.Client client = contactClient();
            GetUserHeaders getUserHeaders = new GetUserHeaders();
            getUserHeaders.xAcsDingtalkAccessToken = authToken.getAccessToken();
            GetUserResponseBody me = client.getUserWithOptions("me", getUserHeaders, new RuntimeOptions()).getBody();
            String username = me.getEmail();
            AuthUser authUser = AuthUser.builder()
                    .uid(me.getUnionId())
                    .username(username == null ? me.getNick() : username)
                    .avatar(me.getAvatarUrl())
                    .rawUserInfo(me.toMap())
                    .build();
            return Mono.just(authUser);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

    }
}
