package org.lowcoder.sdk.auth.constants;

public class Oauth2Constants {

    // placeholders
    public static final String CLIENT_ID_PLACEHOLDER = "$CLIENT_ID";
    public static final String REDIRECT_URL_PLACEHOLDER = "$REDIRECT_URL";
    public static final String STATE_PLACEHOLDER = "$STATE";
    public static final String REALM_PLACEHOLDER = "$REALM";

    public static final String BASE_URL_PLACEHOLDER = "$BASE_URL";
    public static final String SCOPE_PLACEHOLDER = "$SCOPE";
    public static final String AGENTID_PLACEHOLDER = "$AGENTID";

    // authorize url
    public static final String GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
            + "?response_type=code"
            + "&client_id=" + CLIENT_ID_PLACEHOLDER
            + "&redirect_uri=" + REDIRECT_URL_PLACEHOLDER
            + "&state=" + STATE_PLACEHOLDER
            + "&scope=";

    public static final String FEISHU_AUTHORIZE_URL = "https://open.feishu.cn/open-apis/authen/v1/index?"
            + "redirect_uri=" + REDIRECT_URL_PLACEHOLDER
            + "&app_id=" + CLIENT_ID_PLACEHOLDER
            + "&state=" + STATE_PLACEHOLDER;

    public static final String DINGTALK_AUTHORIZE_URL = "https://login.dingtalk.com/oauth2/auth?"
            + "redirect_uri=" + REDIRECT_URL_PLACEHOLDER
            + "&response_type=code"
            + "&client_id=" + CLIENT_ID_PLACEHOLDER
            + "&scope=openid"
            + "&state=" + STATE_PLACEHOLDER
            + "&prompt=consent";

    public static final String WECOM_AUTHORIZE_URL = "https://open.work.weixin.qq.com/wwopen/sso/qrConnect?"
            + "redirect_uri=" + REDIRECT_URL_PLACEHOLDER
            + "&response_type=code"
            + "&appid=" + CLIENT_ID_PLACEHOLDER
            + "&scope=snsapi_base"
            + "&agentid=" + AGENTID_PLACEHOLDER
            + "&state=" + STATE_PLACEHOLDER
            + "#self_redirect=false&version=1.2.7&login_type=jssdk";

    public static final String GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
            + "?response_type=code"
            + "&client_id=" + CLIENT_ID_PLACEHOLDER
            + "&redirect_uri=" + REDIRECT_URL_PLACEHOLDER
            + "&state=" + STATE_PLACEHOLDER
            + "&access_type=offline"
            + "&scope=openid email profile"
            + "&prompt=select_account";

    public static final String ORY_AUTHORIZE_URL = BASE_URL_PLACEHOLDER + "/oauth2/auth"
            + "?response_type=code"
            + "&client_id=" + CLIENT_ID_PLACEHOLDER
            + "&redirect_uri=" + REDIRECT_URL_PLACEHOLDER
            + "&state=" + STATE_PLACEHOLDER
            + "&scope=" + SCOPE_PLACEHOLDER;

    public static final String KEYCLOAK_AUTHORIZE_URL = BASE_URL_PLACEHOLDER + "/realms/" + REALM_PLACEHOLDER + "/protocol/openid-connect/auth"
            + "?response_type=code"
            + "&client_id=" + CLIENT_ID_PLACEHOLDER
            + "&redirect_uri=" + REDIRECT_URL_PLACEHOLDER
            + "&state=" + STATE_PLACEHOLDER
            + "&scope=" + SCOPE_PLACEHOLDER;
}
