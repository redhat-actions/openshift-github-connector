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

export type ClientPageOptions = Partial<{
  fullWidth: boolean,
}>;

export class ClientPage extends UrlPath {
  constructor(
    parentPath: UrlPath | undefined,
    endpoint: string,
    public readonly title: string,
    public readonly component: React.ComponentType<any>,
    private readonly exact: boolean = true,
    private readonly options: ClientPageOptions = {},
  ) {
    super(parentPath, endpoint);
  }

  public get route(): JSX.Element {
    return (
      <Route key={this.path} exact={this.exact} path={this.path} render={(props) => (
        <BasePage options={this.options} content={this.component} title={this.title} {...props} />
      )}/>
    );
  }
}

const appRootPath = isInOpenShiftConsole() ? "/github-connector" : "/";

const Home = new ClientPage(undefined, appRootPath, "", HomePage);
const User = new ClientPage(Home, "/user", "User", UserPage);

const Setup = new ClientPage(Home, "/setup/:page", "Set up", SetupWizard, false, { fullWidth: true });
const SetupIndex = new ClientPage(Home, "/setup", "Set up", () => (<Redirect to={getSetupPagePath("WELCOME")} />));
const CreatingAppCallback = new ClientPage(Home, "/app-callback", "Created App", PostCreateAppCallbackPage);
const InstalledAppCallback = new ClientPage(Home, "/installation-callback", "Installed App", InstalledAppPage);
const SetupFinished = new ClientPage(Home, "/setup-complete", "Setup Complete", SetupFinishedPage);

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
  CreatingAppCallback,
  InstalledAppCallback,
  SetupFinished,

  ConnectRepos,

  App,
  Cluster,
  AddWorkflows,

  ImageRegistries,

  NotImplemented,
};

export default ClientPages;
