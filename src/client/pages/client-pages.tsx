import React from "react";
import { Route, RouteComponentProps } from "react-router-dom";
import UrlPath from "../../common/types/url-path";
import ClusterPage from "./cluster-page";
import GitHubAppPage from "./gh-app-page";
import HomePage from "./home-page";
import SetupAppPage from "./setup/setup-gh-app-page";
import SetupHomePage from "./setup/setup-home-page";
import SetupSAPage from "./setup/setup-sa-page";

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
      <Route exact path={this.path} component={this.component} />
    );
  }
}

const Home = new ClientPage(undefined, "/", HomePage);

const Setup = new ClientPage(Home, "/setup", SetupHomePage);
const SetupApp = new ClientPage(Setup, "/app", SetupAppPage);
const SetupSA = new ClientPage(Setup, "/serviceaccount", SetupSAPage);

const App = new ClientPage(Home, "/app", GitHubAppPage);
const Cluster = new ClientPage(Home, "/cluster", ClusterPage);

const ClientPages = {
  Home,
  Setup,
  SetupApp,
  SetupSA,
  App,
  Cluster,
};

export default ClientPages;
