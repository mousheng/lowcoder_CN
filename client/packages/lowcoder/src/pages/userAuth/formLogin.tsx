import { FormInput, PasswordInput } from "lowcoder-design";
import {
  AuthBottomView,
  ConfirmButton,
  FormWrapperMobile,
  LoginCardTitle,
  StyledRouteLink,
} from "pages/userAuth/authComponents";
import React, { useContext, useState } from "react";
import styled from "styled-components";
import UserApi from "api/userApi";
import { useRedirectUrl } from "util/hooks";
import { checkEmailValid, checkPhoneValid } from "util/stringUtils";
import { UserConnectionSource } from "@lowcoder-ee/constants/userConstants";
import { trans } from "i18n";
import { AuthContext, useAuthSubmit } from "pages/userAuth/authUtils";
import { ThirdPartyAuth } from "pages/userAuth/thirdParty/thirdPartyAuth";
import { AUTH_REGISTER_URL, ORG_AUTH_REGISTER_URL } from "constants/routesURL";
import { useLocation, useParams } from "react-router-dom";

const AccountLoginWrapper = styled(FormWrapperMobile)`
  display: flex;
  flex-direction: column;
  margin-bottom: 106px;
`;

type FormLoginProps = {
  organizationId?: string;
}

export default function FormLogin(props: FormLoginProps) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const redirectUrl = useRedirectUrl();
  const { systemConfig, inviteInfo, fetchUserAfterAuthSuccess } = useContext(AuthContext);
  const invitationId = inviteInfo?.invitationId;
  const authId = systemConfig?.form.id;
  const location = useLocation();
  const orgId = useParams<any>().orgId;

  const { onSubmit, loading } = useAuthSubmit(
    () =>
      UserApi.formLogin({
        register: false,
        loginId: account,
        password: password,
        invitationId: invitationId,
        source: UserConnectionSource.email,
        orgId: props.organizationId,
        authId,
      }),
    false,
    redirectUrl,
    fetchUserAfterAuthSuccess,
  );

  return (
    <>
      <LoginCardTitle>{trans("userAuth.login")}</LoginCardTitle>
      <AccountLoginWrapper>
        <FormInput
          className="form-input"
          label={trans("userAuth.email")}
          onChange={(value, valid) => setAccount(valid ? value : "")}
          placeholder={trans("userAuth.inputEmail")}
          checkRule={{
            check: (value) => checkPhoneValid(value) || checkEmailValid(value),
            errorMsg: trans("userAuth.inputValidEmail"),
          }}
        />
        <PasswordInput
          className="form-input"
          onChange={(value) => setPassword(value)}
          valueCheck={() => [true, ""]}
        />
        <ConfirmButton loading={loading} disabled={!account || !password} onClick={onSubmit}>
          {trans("userAuth.login")}
        </ConfirmButton>
        
        {props.organizationId && (
          <ThirdPartyAuth
            invitationId={invitationId}
            invitedOrganizationId={props.organizationId}
            authGoal="login"
          />
        )}
      </AccountLoginWrapper>
      <AuthBottomView>
        <StyledRouteLink to={{
          pathname: orgId
            ? ORG_AUTH_REGISTER_URL.replace(':orgId', orgId)
            : AUTH_REGISTER_URL,
          state: location.state
        }}>
          {trans("userAuth.register")}
        </StyledRouteLink>
      </AuthBottomView>
    </>
  );
}
