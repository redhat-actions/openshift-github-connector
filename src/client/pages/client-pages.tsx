import React from "react";
import { Redirect, Route, RouteComponentProps } from "react-router-dom";
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

export class ClientPage extends UrlPath {
  constructor(
    parentPath: UrlPath | undefined,
    endpoint: string,
    // type copied from <Route component=> prop
    public readonly component: React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any>,
  ) {
    super(parentPath, endpoint);
  }

  public get route(): JSX.Element {
    return (
      <Route key={this.path} exact path={this.path} component={this.component} />
    );
  }

  public withQuery(query: Record<string, string>): string {
    const qp = new URLSearchParams(query);
    return this.path + `?${qp.toString()}`;
  }
}

const Home = new ClientPage(undefined, "/", HomePage);

const Setup = new ClientPage(Home, "/setup", () => (<Redirect to={SetupWelcome.path} />));
const SetupWelcome = new ClientPage(Setup, "/welcome", SetupWelcomePage);
const SetupCreateApp = new ClientPage(Setup, "/app", SetupAppPage);
const SetupCreatingApp = new ClientPage(Setup, "/creating-app", PostCreateAppPages.CreatingAppPage);
// const SetupPostOAuth = new ClientPage(Setup, "/oauth-callback", PostOAuthPage);
const SetupInstalledApp = new ClientPage(Setup, "/installed-app", PostCreateAppPages.InstalledAppPage);
const SetupFinished = new ClientPage(Setup, "/done", SetupFinishedPage);

const AddWorkflows = new ClientPage(Home, "/add-workflows", AddWorkflowsPage);
const App = new ClientPage(Home, "/app", GitHubAppPage);
const ConnectRepos = new ClientPage(Home, "/connect-repos", SelectReposPage);
const Cluster = new ClientPage(Home, "/cluster", ClusterPage);

const NotImplemented = new ClientPage(Home, "/not-implemented", (() => {
  return (<h2>This page {"doesn't"} exist yet</h2>);
}));

const ClientPages = {
  Welcome: SetupWelcome,
  Home,

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

  NotImplemented,
};

export default ClientPages;
