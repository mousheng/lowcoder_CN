package org.lowcoder.api.authentication.request.oauth2.request;

import org.apache.commons.collections4.MapUtils;
import org.apache.http.client.utils.URIBuilder;
import org.lowcoder.api.authentication.request.AuthException;
import org.lowcoder.api.authentication.request.oauth2.OAuth2RequestContext;
import org.lowcoder.api.authentication.request.oauth2.Oauth2DefaultSource;
import org.lowcoder.domain.user.model.AuthToken;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.util.JsonUtils;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.lowcoder.sdk.webclient.WebClients;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import reactor.core.publisher.Mono;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Map;

public class FeishuRequest extends AbstractOauth2Request<Oauth2SimpleAuthConfig> {

    public FeishuRequest(Oauth2SimpleAuthConfig config) {
        super(config, Oauth2DefaultSource.FEISHU);
    }

    @Override
    protected Mono<AuthToken> getAuthToken(OAuth2RequestContext context) {
        URI uri;
        try {
            uri = new URIBuilder(source.accessToken()).build();
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        }
        return WebClientBuildHelper.builder()
                .systemProxy()
                .build()
                .post()
                .uri(uri)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + getAppAccessToken())
                .bodyValue(Map.of(
                        "grant_type", "authorization_code",
                        "code", context.getCode()
                ))
                .exchangeToMono(response -> response.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                }))
                .flatMap(map -> {
                    if (!map.containsValue("success")) {
                        return Mono.error(new AuthException(JsonUtils.toJson(map)));
                    }
                    Map<String, Object> data = (Map<String, Object>) MapUtils.getMap(map, "data");
                    AuthToken authToken = AuthToken.builder()
                            .accessToken(MapUtils.getString(data, "access_token"))
                            .expireIn(MapUtils.getIntValue(data, "expires_in"))
                            .refreshToken(MapUtils.getString(data, "refresh_token"))
                            .build();
                    return Mono.just(authToken);
                });
    }

    /*
        获取App Access Token
    * */
    private String getAppAccessToken() {
        URI uri;
        try {
            uri = new URIBuilder("https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal/")
                    .addParameter("app_id", config.getClientId())
                    .addParameter("app_secret", config.getClientSecret())
                    .build();
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        }
        Map<String, Object> map = WebClients.getInstance()
                .post()
                .uri(uri)
                .contentType(MediaType.APPLICATION_JSON)
                .exchangeToMono(response -> response.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                }))
                .block();
        if (MapUtils.getIntValue(map, "code", -1) != 0) {
            throw new AuthException(JsonUtils.toJson(map));
        }
        return MapUtils.getString(map, "app_access_token");
    }

    @Override
    protected Mono<AuthToken> refreshAuthToken(String refreshToken) {
        return Mono.empty();
    }

    @Override
    protected Mono<AuthUser> getAuthUser(AuthToken authToken) {
        return WebClients.getInstance()
                .get()
                .uri(source.userInfo())
                .header("Content-Type", "application/json; charset=utf-8")
                .header("Authorization", "Bearer " + authToken.getAccessToken())
                .exchangeToMono(response -> response.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                }))
                .flatMap(map -> {
                    if (!map.containsValue("success")) {
                        return Mono.error(new AuthException(JsonUtils.toJson(map)));
                    }
                    Map<String, Object> data = (Map<String, Object>) MapUtils.getMap(map, "data");
                    String username = MapUtils.getString(data, "email");
                    AuthUser authUser = AuthUser.builder()
                            .uid(data.get("user_id").toString())
                            .username(username == null ? MapUtils.getString(data, "en_name") : username)
                            .avatar(MapUtils.getString(data, "avatar_url"))
                            .rawUserInfo(data)
                            .build();
                    return Mono.just(authUser);
                });
    }
}
