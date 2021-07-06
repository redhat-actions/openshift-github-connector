import React from "react";
import {
  Link, Redirect, Route,
} from "react-router-dom";

import UrlPath from "../../common/types/url-path";
import ClusterPage from "./cluster-page";
import GitHubAppPage from "./gh-app-page";
import SelectReposPage from "./setup/connect-repos-page";
import HomePage from "./home-page";
import ImageRegistriesPage from "./image-registries-page";
import { isInOpenShiftConsole } from "../util/client-util";
import { UserPage } from "./user";
import { BasePage } from "./base-page";
import SetupWizard, { getSetupPagePath } from "./setup/setup";
import AddWorkflowsPage from "./add-workflows-page";
import SetupFinishedPage from "./setup/setup-completion-page";
import { PostCreateAppCallbackPage, InstalledAppPage } from "./setup/gh-app/app-callbacks";

export class ClientPage extends UrlPath {
  constructor(
    parentPath: UrlPath | undefined,
    endpoint: string,
    public readonly title: string,
    // type copied from <Route component=> prop
    // public readonly component: React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any>,
    public readonly component: React.ComponentType<any>,
    private readonly exact: boolean = true,
  ) {
    super(parentPath, endpoint);
  }

  // public get title(): JSX.Element {
  //   return getTitle(this.pageTitle);
  // }

  public get route(): JSX.Element {
    return (
      <Route key={this.path} exact={this.exact} path={this.path} /* component={this.component} */ render={(props) => (
        <BasePage content={this.component} title={this.title} {...props} />
      )}/>
    );
  }

  public withQuery(query: Record<string, string>): string {
    const qp = new URLSearchParams(query);
    return this.path + `?${qp.toString()}`;
  }
}

const appRootPath = isInOpenShiftConsole() ? "/github-connector" : "/";

const Home = new ClientPage(undefined, appRootPath, "", HomePage);
// const Login = new ClientPage(Home, "/login", "Log in", LoginPage);
const User = new ClientPage(Home, "/user", "User", UserPage);

const Setup = new ClientPage(Home, "/setup/:page", "Set up", SetupWizard, false);
const SetupIndex = new ClientPage(Home, "/setup", "Set up", () => (<Redirect to={getSetupPagePath("WELCOME")} />));
// const SetupWelcome = new ClientPage(SetupIndex, "/welcome", "Welcome", WelcomePage);
// const SetupCreateApp = new ClientPage(SetupIndex, "/app", "Set up GitHub App", SetupAppPage);
// const SetupInstallApp = new ClientPage(SetupIndex, "/install-app", "Install App", InstallExistingAppPage);
const CreatingAppCallback = new ClientPage(Home, "/creating-app-callback", "Creating App...", PostCreateAppCallbackPage);
const InstalledAppCallback = new ClientPage(Home, "/installed-app-callback", "Installed App", InstalledAppPage);
// const SetupViewApp = new ClientPage(SetupIndex, "/view-app", "View GitHub App", GitHubAppPage);
// const SetupConnectRepos = new ClientPage(SetupIndex, "/connect-repos", "Connect Repositories", SelectReposPage);
const SetupFinished = new ClientPage(Home, "/setup-complete", "Setup Complete", SetupFinishedPage);
// const SetupPostOAuth = new ClientPage(Setup, "/oauth-callback", PostOAuthPage);

const App = new ClientPage(Home, "/app", "GitHub App", GitHubAppPage);

const AddWorkflows = new ClientPage(Home, "/add-workflows", "Add Workflows", AddWorkflowsPage);
const ConnectRepos = new ClientPage(Home, "/connect-repos", "Connect Repositories", SelectReposPage);
const Cluster = new ClientPage(Home, "/cluster", "Cluster Info", ClusterPage);

const ImageRegistries = new ClientPage(Home, "/image-registries", "Image Registries", ImageRegistriesPage);

const NotImplemented = new ClientPage(Home, "/not-implemented", "Not Implemented", (() => {
  return (
    <>
      <h2>This page {"doesn't"} exist yet</h2>
      <Link to={Home.path}>Go Home</Link>
    </>
  );
}));

const ClientPages = {
  // Welcome: SetupWelcome,
  Home,
  // Login,
  User,

  SetupIndex,
  Setup,
  // SetupWelcome,
  // SetupCreateApp,
  CreatingAppCallback,
  // SetupPostOAuth,
  // SetupInstallApp,
  InstalledAppCallback,
  // SetupViewApp,
  // SetupConnectRepos,
  SetupFinished,

  ConnectRepos,

  App,
  Cluster,
  AddWorkflows,

  ImageRegistries,

  NotImplemented,
};

export default ClientPages;
