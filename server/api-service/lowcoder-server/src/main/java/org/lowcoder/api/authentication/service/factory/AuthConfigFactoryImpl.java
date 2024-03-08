package org.lowcoder.api.authentication.service.factory;

import static java.util.Objects.requireNonNull;
import static org.lowcoder.sdk.constants.AuthSourceConstants.*;

import java.util.Set;

import org.apache.commons.collections4.MapUtils;
import org.lowcoder.api.authentication.dto.AuthConfigRequest;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.auth.Oauth2KeycloakAuthConfig;
import org.lowcoder.sdk.auth.Oauth2OryAuthConfig;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.auth.constants.AuthTypeConstants;
import org.springframework.stereotype.Component;

@Component
public class AuthConfigFactoryImpl implements AuthConfigFactory {

    @Override
    public AbstractAuthConfig build(AuthConfigRequest authConfigRequest, boolean enable) {
        return switch (authConfigRequest.getAuthType()) {
            case AuthTypeConstants.FORM -> buildEmailAuthConfig(authConfigRequest, enable);
            case AuthTypeConstants.GITHUB -> buildOauth2SimpleAuthConfig(GITHUB, GITHUB_NAME, authConfigRequest, enable);
            case AuthTypeConstants.FEISHU -> buildOauth2SimpleAuthConfig(FEISHU, FEISHU_NAME, authConfigRequest, enable);
            case AuthTypeConstants.DINGTALK -> buildOauth2SimpleAuthConfig(DINGTALK, DINGTALK_NAME, authConfigRequest, enable);
            case AuthTypeConstants.WECHAT -> buildOauth2SimpleAuthConfig(WECHAT, WECHAT_NAME, authConfigRequest, enable);
            case AuthTypeConstants.GOOGLE -> buildOauth2SimpleAuthConfig(GOOGLE, GOOGLE_NAME, authConfigRequest, enable);
            case AuthTypeConstants.ORY -> buildOauth2OryAuthConfig(authConfigRequest, enable);
            case AuthTypeConstants.KEYCLOAK -> buildOauth2KeycloakAuthConfig(authConfigRequest, enable);
            default -> throw new UnsupportedOperationException(authConfigRequest.getAuthType());
        };
    }

    @Override
    public Set<String> supportAuthTypes() {
        return Set.of(
                AuthTypeConstants.FORM,
                AuthTypeConstants.GITHUB,
                AuthTypeConstants.GOOGLE,
                AuthTypeConstants.ORY,
                AuthTypeConstants.KEYCLOAK,
                AuthTypeConstants.FEISHU,
                AuthTypeConstants.DINGTALK,
                AuthTypeConstants.WECHAT
        );
    }

    private EmailAuthConfig buildEmailAuthConfig(AuthConfigRequest authConfigRequest, boolean enable) {
        Boolean enableRegister = MapUtils.getBoolean(authConfigRequest, "enableRegister");
        return new EmailAuthConfig(authConfigRequest.getId(), enable, enableRegister);
    }

    private Oauth2SimpleAuthConfig buildOauth2SimpleAuthConfig(String source, String sourceName, AuthConfigRequest authConfigRequest,
            boolean enable) {
        return new Oauth2SimpleAuthConfig(
                authConfigRequest.getId(),
                enable,
                authConfigRequest.isEnableRegister(),
                source,
                sourceName,
                requireNonNull(authConfigRequest.getClientId(), "clientId can not be null."),
                authConfigRequest.getClientSecret(),
                authConfigRequest.getAuthType());
    }

    private Oauth2SimpleAuthConfig buildOauth2OryAuthConfig(AuthConfigRequest authConfigRequest, boolean enable) {
        return new Oauth2OryAuthConfig(
                authConfigRequest.getId(),
                enable,
                authConfigRequest.isEnableRegister(),
                AuthTypeConstants.ORY,
                org.lowcoder.sdk.constants.AuthSourceConstants.ORY_NAME,
                requireNonNull(authConfigRequest.getClientId(), "clientId can not be null."),
                authConfigRequest.getClientSecret(),
                authConfigRequest.getString("baseUrl"),
                authConfigRequest.getString("scope"),
                authConfigRequest.getAuthType());
    }
    
    private Oauth2SimpleAuthConfig buildOauth2KeycloakAuthConfig(AuthConfigRequest authConfigRequest, boolean enable) {
        return new Oauth2KeycloakAuthConfig(
                authConfigRequest.getId(),
                enable,
                authConfigRequest.isEnableRegister(),
                AuthTypeConstants.KEYCLOAK,
                org.lowcoder.sdk.constants.AuthSourceConstants.KEYCLOAK_NAME,
                requireNonNull(authConfigRequest.getClientId(), "clientId can not be null."),
                authConfigRequest.getClientSecret(),
                authConfigRequest.getString("baseUrl"),
                authConfigRequest.getString("realm"),
                authConfigRequest.getString("scope"),
                authConfigRequest.getAuthType());
    }
    
}
