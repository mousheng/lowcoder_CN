import {
  AUTH_BIND_URL,
  AUTH_LOGIN_URL,
  AUTH_REGISTER_URL,
  OAUTH_REDIRECT,
  ORG_AUTH_LOGIN_URL,
  ORG_AUTH_REGISTER_URL,
} from "constants/routesURL";
import { InviteInfo } from "api/inviteApi";
import Login, { ThirdPartyBindCard } from "pages/userAuth/login";
import UserRegister from "pages/userAuth/register";
import { AuthRedirect } from "pages/userAuth/thirdParty/authRedirect";
import React from "react";
import {
  GoogleLoginIcon,
  GithubLoginIcon,
  OryLoginIcon,
  KeyCloakLoginIcon,
  EmailLoginIcon
} from "assets/icons";

export type AuthInviteInfo = InviteInfo & { invitationId: string };
export type AuthLocationState = { inviteInfo?: AuthInviteInfo; thirdPartyAuthError?: boolean };

export enum AuthSearchParams {
  loginType = "loginType",
  redirectUrl = "redirectUrl",
};

export type AuthSearchParamsType = {
  loginType: string | null,
  redirectUrl: string | null,
};

export type OauthRequestParam = {
  appId: string;
  redirectUri: string;
  state: string;
  agentId?: string;
  sourceType: string;
  authGoal: ThirdPartyAuthGoal;
};

export type OAuthLocationState = OauthRequestParam & {
  autoJump?: boolean;
};

export type ThirdPartyAuthType = "OAUTH2" | "CAS" | "LDAP" | "JWT";

export type ThirdPartyConfigType = {
  url: string;
  name: string;
  logo: string;
  // login source
  sourceType: string;
  // url is react router
  routeLink?: boolean;
  authType: ThirdPartyAuthType;
  clientId?: string;
  // wecom need agentId
  agentId?: string;
  id?: string;
};

export type AuthSessionStoreParams = {
  state: string;
  authType: ThirdPartyAuthType;
  authGoal: ThirdPartyAuthGoal;
  afterLoginRedirect: string | null;
  sourceType: string;
  invitationId?: string;
  invitedOrganizationId?: string;
  routeLink?: boolean;
  name: string;
  authId?: string;
};

/**
 * action after third party auth
 * bind & innerBind has different redirect action
 */
export type ThirdPartyAuthGoal = "register" | "login" | "bind" | "innerBind";

export const AuthRoutes: Array<{ path: string; component: React.ComponentType<any> }> = [
  { path: AUTH_LOGIN_URL, component: Login },
  { path: AUTH_BIND_URL, component: ThirdPartyBindCard },
  { path: AUTH_REGISTER_URL, component: UserRegister },
  { path: OAUTH_REDIRECT, component: AuthRedirect },
  { path: ORG_AUTH_LOGIN_URL, component: Login },
  { path: ORG_AUTH_REGISTER_URL, component: UserRegister },
];

export type ServerAuthType = "GOOGLE" | "GITHUB" | "FORM" | "KEYCLOAK" | "ORY";

export type ServerAuthTypeInfoValueType = { logo: string; isOAuth2?: boolean };
export const ServerAuthTypeInfo: { [key in ServerAuthType]?: ServerAuthTypeInfoValueType } = {
  GOOGLE: {
    logo: GoogleLoginIcon,
    isOAuth2: true,
  },
  GITHUB: {
    logo: GithubLoginIcon,
    isOAuth2: true
  },
  KEYCLOAK: {
    logo: KeyCloakLoginIcon,
    isOAuth2: true
  },
  ORY: {
    logo: OryLoginIcon,
    isOAuth2: true
  },
  FORM: { logo: EmailLoginIcon },
};

export function isRouteLink(authType: ServerAuthType) {
  return false;
}
