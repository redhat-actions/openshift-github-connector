import React from "react";
import {
  Link, Redirect, Route, RouteComponentProps,
} from "react-router-dom";

import UrlPath from "../../common/types/url-path";
import ClusterPage from "./cluster-page";
import GitHubAppPage from "./gh-app-page";
import SetupWelcomePage from "./setup/welcome-page";
import SelectReposPage from "./setup/connect-repos-page";
import SetupAppPage from "./setup/gh-app/setup-app";
import * as PostCreateAppPages from "./setup/gh-app/post-create-app";
import HomePage from "./home-page";
import SetupFinishedPage from "./setup/setup-completion-page";
import AddWorkflowsPage from "./add-workflows-page";
import ImageRegistriesPage from "./image-registries-page";
import { getSetupSteps } from "./setup/setup-header";
import { isInOpenShiftConsole } from "../util/client-util";
import { getTitle } from "../components/title";
import { UserPage } from "./user";

export class ClientPage extends UrlPath {
  constructor(
    parentPath: UrlPath | undefined,
    endpoint: string,
    public readonly pageTitle: string,
    // type copied from <Route component=> prop
    public readonly component: React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any>,
  ) {
    super(parentPath, endpoint);
  }

  // public get title(): JSX.Element {
  //   return getTitle(this.pageTitle);
  // }

  public get route(): JSX.Element {
    return (
      <Route key={this.path} exact path={this.path} /* component={this.component} */ render={(props) => (
        <>
          {getTitle(this.pageTitle)}
          <this.component {...props} />
        </>
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

const Setup = new ClientPage(Home, "/setup", "Set up", () => (<Redirect to={getSetupSteps()[0].path} />));
const SetupWelcome = new ClientPage(Setup, "/welcome", "Welcome", SetupWelcomePage);
const SetupCreateApp = new ClientPage(Setup, "/app", "Create GitHub App", SetupAppPage);
const SetupCreatingApp = new ClientPage(Setup, "/creating-app", "Creating App...", PostCreateAppPages.CreatingAppPage);
// const SetupPostOAuth = new ClientPage(Setup, "/oauth-callback", PostOAuthPage);
const SetupInstalledApp = new ClientPage(Setup, "/installed-app", "Installed App", PostCreateAppPages.InstalledAppPage);
const SetupFinished = new ClientPage(Setup, "/done", "Setup Complete", SetupFinishedPage);

const AddWorkflows = new ClientPage(Home, "/add-workflows", "Add Workflows", AddWorkflowsPage);
const App = new ClientPage(Home, "/app", "GitHub App", GitHubAppPage);
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
  Welcome: SetupWelcome,
  Home,
  // Login,
  User,

  Setup,
  SetupCreateApp,
  SetupCreatingApp,
  // SetupPostOAuth,
  SetupInstalledApp,
  SetupFinished,
  ConnectRepos,

  App,
  Cluster,
  AddWorkflows,

  ImageRegistries,

  NotImplemented,
};

export default ClientPages;
