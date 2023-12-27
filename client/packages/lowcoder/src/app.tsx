import { App, ConfigProvider } from "antd";
import {
  ALL_APPLICATIONS_URL,
  APP_EDITOR_URL,
  APPLICATION_VIEW_URL,
  BASE_URL,
  COMPONENT_DOC_URL,
  DATASOURCE_CREATE_URL,
  DATASOURCE_EDIT_URL,
  DATASOURCE_URL,
  FOLDER_URL,
  FOLDERS_URL,
  IMPORT_APP_FROM_TEMPLATE_URL,
  INVITE_LANDING_URL,
  isAuthUnRequired,
  ORG_AUTH_LOGIN_URL,
  ORG_AUTH_REGISTER_URL,
  QUERY_LIBRARY_URL,
  SETTING,
  TRASH_URL,
  USER_AUTH_URL,
} from "constants/routesURL";
import React from "react";
import ReactDOM from "react-dom";
import { Helmet } from "react-helmet";
import { connect, Provider } from "react-redux";
import { Redirect, Route, Router, Switch } from "react-router-dom";
import { AppState } from "redux/reducers";
import { fetchConfigAction } from "redux/reduxActions/configActions";
import { fetchUserAction } from "redux/reduxActions/userActions";
import { reduxStore } from "redux/store/store";
import { developEnv } from "util/envUtils";
import history from "util/history";
import LazyRoute from "components/LazyRoute";
import AppFromTemplate from "pages/ApplicationV2/AppFromTemplate";
import AppEditor from "pages/editor/AppEditor";
import { getAntdLocale } from "i18n/antdLocale";
import { CodeEditorTooltipContainer } from "base/codeEditor/codeEditor";
import { ProductLoading } from "components/ProductLoading";
import { language, trans } from "i18n";
import { loadComps } from "comps";
import { initApp } from "util/commonUtils";
import ApplicationHome from "./pages/ApplicationV2";
import { favicon } from "@lowcoder-ee/assets/images";
import { hasQueryParam } from "util/urlUtils";
import { isFetchUserFinished } from "redux/selectors/usersSelectors";
import { SystemWarning } from "./components/SystemWarning";
import { getBrandingConfig } from "./redux/selectors/configSelectors";
import { buildMaterialPreviewURL } from "./util/materialUtils";
import GlobalInstances from 'components/GlobalInstances';

const LazyUserAuthComp = React.lazy(() => import("pages/userAuth"));
const LazyInviteLanding = React.lazy(() => import("pages/common/inviteLanding"));
const LazyComponentDoc = React.lazy(() => import("pages/ComponentDoc"));
const LazyComponentPlayground = React.lazy(() => import("pages/ComponentPlayground"));
const LazyDebugComp = React.lazy(() => import("./debug"));
const LazyDebugNewComp = React.lazy(() => import("./debugNew"));

const Wrapper = (props: { children: React.ReactNode }) => (
  <ConfigProvider
    theme={{ hashed: false }}
    locale={getAntdLocale(language)}
  >
    <App>
      <GlobalInstances />
      {props.children}
    </App>
  </ConfigProvider>
);

type AppIndexProps = {
  isFetchUserFinished: boolean;
  currentOrgId?: string;
  orgDev: boolean;
  defaultHomePage: string | null | undefined;
  fetchConfig: (orgId?: string) => void;
  getCurrentUser: () => void;
  favicon: string;
  brandName: string;
};

class AppIndex extends React.Component<AppIndexProps, any> {
  componentDidMount() {
    this.props.getCurrentUser();
  }

  componentDidUpdate(prevProps: AppIndexProps) {
    if(prevProps.currentOrgId !== this.props.currentOrgId && this.props.currentOrgId !== '') {
      this.props.fetchConfig(this.props.currentOrgId);
    }
  }

  render() {
    const isTemplate = hasQueryParam("template");
    const pathname = history.location.pathname;
    // make sure all users in this app have checked login info
    if (!this.props.isFetchUserFinished) {
      const hideLoadingHeader = isTemplate || isAuthUnRequired(pathname);
      return <ProductLoading hideHeader={hideLoadingHeader} />;
    }
    return (
      <Wrapper>
        <Helmet>
          {<title>{this.props.brandName}</title>}
          {<link rel="icon" href={this.props.favicon} />}
          <meta name="description" content={trans("productDesc")} />
        </Helmet>
        <SystemWarning />
        <Router history={history}>
          <Switch>
            {!this.props.orgDev && !!this.props.defaultHomePage ? (
              <Redirect
                exact
                from={BASE_URL}
                to={APPLICATION_VIEW_URL(this.props.defaultHomePage, "view")}
              />
            ) : (
              <Redirect exact from={BASE_URL} to={ALL_APPLICATIONS_URL} />
            )}
            {!this.props.orgDev && !!this.props.defaultHomePage && (
              <Redirect
                exact
                from={ALL_APPLICATIONS_URL}
                to={APPLICATION_VIEW_URL(this.props.defaultHomePage, "view")}
              />
            )}
            <Route exact path={IMPORT_APP_FROM_TEMPLATE_URL} component={AppFromTemplate} />
            <Route path={APP_EDITOR_URL} component={AppEditor} />
            <Route
              path={[
                ALL_APPLICATIONS_URL,
                DATASOURCE_CREATE_URL,
                DATASOURCE_EDIT_URL,
                DATASOURCE_URL,
                QUERY_LIBRARY_URL,
                FOLDERS_URL,
                FOLDER_URL,
                TRASH_URL,
                SETTING,
              ]}
              // component={ApplicationListPage}
              component={ApplicationHome}
            />
            <LazyRoute path={USER_AUTH_URL} component={LazyUserAuthComp} />
            <LazyRoute path={ORG_AUTH_LOGIN_URL} component={LazyUserAuthComp} />
            <LazyRoute path={ORG_AUTH_REGISTER_URL} component={LazyUserAuthComp} />
            <LazyRoute path={INVITE_LANDING_URL} component={LazyInviteLanding} />
            <LazyRoute path={`${COMPONENT_DOC_URL}/:name`} component={LazyComponentDoc} />
            <LazyRoute path={`/playground/:name/:dsl`} component={LazyComponentPlayground} />
            <Redirect to={`${COMPONENT_DOC_URL}/input`} path="/components" />

            {developEnv() && (
              <>
                <LazyRoute path="/debug_comp/:name" component={LazyDebugComp} />
                <LazyRoute exact path="/debug_comp" component={LazyDebugComp} />
                <Route path="/debug_editor" component={AppEditor} />
                <LazyRoute path="/debug_new" component={LazyDebugNewComp} />
              </>
            )}
          </Switch>
        </Router>
      </Wrapper>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  isFetchUserFinished: isFetchUserFinished(state),
  orgDev: state.ui.users.user.orgDev,
  currentOrgId: state.ui.users.user.currentOrgId,
  defaultHomePage: state.ui.application.homeOrg?.commonSettings.defaultHomePage,
  favicon: getBrandingConfig(state)?.favicon
    ? buildMaterialPreviewURL(getBrandingConfig(state)?.favicon!)
    : favicon,
  brandName: getBrandingConfig(state)?.brandName ?? trans("productName"),
});

const mapDispatchToProps = (dispatch: any) => ({
  getCurrentUser: () => {
    dispatch(fetchUserAction());
  },
  fetchConfig: (orgId?: string) => dispatch(fetchConfigAction(orgId)),
});

const AppIndexWithProps = connect(mapStateToProps, mapDispatchToProps)(AppIndex);

export function bootstrap() {
  initApp();
  loadComps();
  ReactDOM.render(
    <Provider store={reduxStore}>
      <AppIndexWithProps />
    </Provider>,
    document.getElementById("root")
  );
}
