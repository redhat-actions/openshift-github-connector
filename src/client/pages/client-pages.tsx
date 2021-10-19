// eslint-disable-next-line max-classes-per-file
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
import SetupFinishedPage from "./setup/setup-completion-page";
import { PostCreateAppCallbackPage, InstalledAppPage } from "./setup/gh-app/app-callbacks";
import WorkflowsWizard, { getWorkflowsWizardFirstPagePath } from "./workflows-wizard/workflows-wizard";
import SetupWizard, { getSetupPagePath } from "./setup/setup";

const WIZARD_PAGE_PARAM = "page";

export type ClientPageOptions = Partial<{
  contentProps: Record<string, unknown>,
  fullWidth: boolean,
}>;

export class ClientPage extends UrlPath {
  constructor(
    parentPath: UrlPath | undefined,
    endpoint: string,
    public readonly title: string,
    public readonly component: React.ComponentType<any>,
    protected readonly exact: boolean = true,
    protected readonly options: ClientPageOptions = {},
  ) {
    super(parentPath, endpoint);
  }

  public get route(): JSX.Element {
    return (
      <Route key={this.path} exact={this.exact} path={this.path} render={(props) => (
        <BasePage options={this.options} title={this.title} {...props}>
          <this.component />
        </BasePage>
      )}/>
    );
  }
}

/*
export class WizardClientPage extends ClientPage {
  public override readonly component: React.ComponentType<MyWizardProps>;

  public readonly indexPath: string;

  constructor(
    path: UrlPath,
    title: string,
    private readonly fetchSteps: () => Promise<MyWizardStep[]>,
    // private readonly steps: MyWizardStep[],
  ) {
    super(path, path.withParam(WIZARD_PAGE_PARAM).path, title, MyWizard, false, { fullWidth: true });

    this.indexPath = path.path;
    this.component = MyWizard;
  }

  public override get route(): JSX.Element {
    return (
      <>
        <DataF
        <Route path={this.indexPath} exact={true}>
          <Redirect to={this.steps[0].path} />
        </Route>
        <Route key={this.path} exact={this.exact} path={this.path} render={(props) => (
          <BasePage options={this.options} title={this.title} {...props} childrenProps={{ steps: this.steps }}>
            {this.component}
          </BasePage>
        )}/>
      </>
    );
  }
}
*/

const appRootPath = isInOpenShiftConsole() ? "/github-connector" : "/";

const Home = new ClientPage(undefined, appRootPath, "", HomePage);
const User = new ClientPage(Home, "/user", "User", UserPage);

const SetupIndex = new ClientPage(Home, "/setup", "Set up", () => (<Redirect to={getSetupPagePath("WELCOME")} />));
const Setup = new ClientPage(Home, "/setup/:" + WIZARD_PAGE_PARAM, "Set up", SetupWizard, false, { fullWidth: true });

const CreatingAppCallback = new ClientPage(Home, "/app-callback", "Created App", PostCreateAppCallbackPage);
const InstalledAppCallback = new ClientPage(Home, "/installation-callback", "Installed App", InstalledAppPage);
const SetupFinished = new ClientPage(Home, "/setup-complete", "Setup Complete", SetupFinishedPage);

const App = new ClientPage(Home, "/app", "View GitHub App", GitHubAppPage);

const AddWorkflowsIndex = new ClientPage(Home, "/add-workflows", "Add Workflow", () => (<Redirect to={getWorkflowsWizardFirstPagePath()} />));
const AddWorkflows = new ClientPage(Home, "/add-workflows/:" + WIZARD_PAGE_PARAM, "Add Workflow", WorkflowsWizard, false, { fullWidth: true });

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

  AddWorkflowsIndex,
  AddWorkflows,

  ImageRegistries,

  NotImplemented,
};

export default ClientPages;
