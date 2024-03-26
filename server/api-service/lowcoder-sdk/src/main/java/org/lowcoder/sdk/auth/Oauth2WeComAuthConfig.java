package org.lowcoder.sdk.auth;

import com.fasterxml.jackson.annotation.JsonCreator;
import lombok.Getter;

import javax.annotation.Nullable;

import static org.lowcoder.sdk.auth.constants.Oauth2Constants.*;

/**
 * OAuth2 ORY auth config.
 */
@Getter
public class Oauth2WeComAuthConfig extends Oauth2SimpleAuthConfig {

    protected String agentId;

    @JsonCreator
    public Oauth2WeComAuthConfig(
            @Nullable String id,
            Boolean enable,
            Boolean enableRegister,
            String source,
            String sourceName,
            String clientId,
            String clientSecret,
            String agentId,
            String authType) {
        super(id, enable, enableRegister, source, sourceName, clientId, clientSecret, authType);
        this.agentId = agentId;
    }

    @Override
    public String replaceAuthUrlClientIdPlaceholder(String url) {
        return super.replaceAuthUrlClientIdPlaceholder(url)
        		.replace(AGENTID_PLACEHOLDER, agentId);
    }
}
