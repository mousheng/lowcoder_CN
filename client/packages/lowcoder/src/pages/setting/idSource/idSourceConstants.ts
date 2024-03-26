import { DefaultOptionType } from "antd/lib/select";
import { trans } from "i18n";

export enum AuthType {
  Form = "FORM",
  Google = "GOOGLE",
  Github = "GITHUB",
  Ory = "ORY",
  KeyCloak = "KEYCLOAK",
  Feishu = "FEISHU",
  DingTalk = "DINGTALK",
  WeCom = "WECOM",
}

export const IdSource = [
  AuthType.Google,
  AuthType.Github,
  AuthType.Form,
  AuthType.Ory,
  AuthType.KeyCloak,
  AuthType.Feishu,
  AuthType.DingTalk,
  AuthType.WeCom,
];

export const validatorOptions = [];

export const clientIdandSecretConfig = {
  clientId: trans("idSource.clientID"),
  clientSecret: {
    label: trans("idSource.clientSecret"),
    isPassword: true,
  },
};

export const authConfig = {
  [AuthType.Form]: {
    sourceName: trans("idSource.form"),
    sourceValue: AuthType.Form,
    form: {},
  },
  [AuthType.Github]: {
    sourceName: "GitHub",
    sourceValue: AuthType.Github,
    form: clientIdandSecretConfig,
  },
  [AuthType.Google]: {
    sourceName: "Google",
    sourceValue: AuthType.Google,
    form: clientIdandSecretConfig,
  },
  [AuthType.Ory]: {
    sourceName: "Ory",
    sourceValue: AuthType.Ory,
    form: {
      ...clientIdandSecretConfig,
      baseUrl: "Base URL",
      scope: "Scope",
    },
  },
  [AuthType.KeyCloak]: {
    sourceName: "KeyCloak",
    sourceValue: AuthType.KeyCloak,
    form: {
      ...clientIdandSecretConfig,
      baseUrl: "Base URL",
      realm: "Realm",
      scope: "Scope",
    },
  },
  [AuthType.Feishu]: {
    sourceName: trans("idSource.feishu"),
    sourceValue: AuthType.Feishu,
    form: clientIdandSecretConfig,
  },
  [AuthType.DingTalk]: {
    sourceName: trans("idSource.dingTalk"),
    sourceValue: AuthType.DingTalk,
    form: clientIdandSecretConfig,
  },
  [AuthType.WeCom]: {
    sourceName: trans("idSource.weCom"),
    sourceValue: AuthType.WeCom,
    form: {
      ...clientIdandSecretConfig,
      clientId: trans("idSource.enterpriseID"),
      agentId: trans("idSource.agentid"),
    },
  },
} as { [key: string]: { sourceName: string; sourceValue: AuthType, form: FormItemType } };

export const FreeTypes = [AuthType.Google, AuthType.Github, AuthType.Form, AuthType.Ory, AuthType.KeyCloak, AuthType.Feishu, AuthType.DingTalk, AuthType.WeCom];

export const authTypeDisabled = (type: AuthType, enableEnterpriseLogin?: boolean) => {
  return !FreeTypes.includes(type);
};

export const ManualSyncTypes: Array<AuthType> = [];

export type ListForm = {
  template?: FormItemType;
  ldapsearch?: FormItemType;
}

export type ItemType = {
  label: string;
  options?: DefaultOptionType[];
  isList?: boolean;
  isRequire?: boolean;
  isPassword?: boolean;
  hasLock?: boolean;
  tip?: string;
}

export type FormItemType = {
  clientId?: string;
  clientSecret?: ItemType;
  loginUri?: string;
  prefixUri?: string;
  source?: ItemType;
  sourceName?: ItemType;
  validator?: ItemType;
  url?: string;
  subType?: ItemType;
  distinguishedNameTemplate?: ItemType;
  searchBase?: ItemType;
  filter?: ItemType;
  bindDn?: ItemType;
  password?: ItemType;
  idAttribute?: ItemType;
  domainPrefix?: string;
  authServerId?: string;
  publicKey?: ItemType;
  domain?: string;
  baseUrl?: string;
  realm?: string;
  scope?: string;
};
