package org.lowcoder.api.authentication.request.oauth2;

import java.util.Set;

import org.lowcoder.api.authentication.request.AuthRequest;
import org.lowcoder.api.authentication.request.AuthRequestFactory;
import org.lowcoder.api.authentication.request.oauth2.request.*;
import org.lowcoder.sdk.auth.Oauth2KeycloakAuthConfig;
import org.lowcoder.sdk.auth.Oauth2OryAuthConfig;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.auth.Oauth2WeComAuthConfig;
import org.springframework.stereotype.Component;

import reactor.core.publisher.Mono;

import static org.lowcoder.sdk.auth.constants.AuthTypeConstants.*;

@Component
public class Oauth2AuthRequestFactory implements AuthRequestFactory<OAuth2RequestContext> {

    @Override
    public Mono<AuthRequest> build(OAuth2RequestContext context) {
        return Mono.fromSupplier(() -> buildRequest(context));
    }

    private AbstractOauth2Request<? extends Oauth2SimpleAuthConfig> buildRequest(OAuth2RequestContext context) {
        return switch (context.getAuthConfig().getAuthType()) {
            case GITHUB -> new GithubRequest((Oauth2SimpleAuthConfig) context.getAuthConfig());
            case FEISHU -> new FeishuRequest((Oauth2SimpleAuthConfig) context.getAuthConfig());
            case DINGTALK -> new DingTalkRequest((Oauth2SimpleAuthConfig) context.getAuthConfig());
            case WECOM -> new WeComRequest((Oauth2WeComAuthConfig) context.getAuthConfig());
            case GOOGLE -> new GoogleRequest((Oauth2SimpleAuthConfig) context.getAuthConfig());
            case ORY -> new OryRequest((Oauth2OryAuthConfig) context.getAuthConfig());
            case KEYCLOAK -> new KeycloakRequest((Oauth2KeycloakAuthConfig)context.getAuthConfig());
            default -> throw new UnsupportedOperationException(context.getAuthConfig().getAuthType());
        };
    }

    @Override
    public Set<String> supportedAuthTypes() {
        return Set.of(
                GITHUB,
                GOOGLE,
                ORY,
                KEYCLOAK,
                FEISHU,
                DINGTALK,
                WECOM);
    }
}
