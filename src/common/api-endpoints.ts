import UrlPath from "./types/url-path";

const Api = new UrlPath(undefined, "/api/v1");
const Health = new UrlPath(Api, "/health");

const Setup = new UrlPath(Api, "/setup");
const CreatingApp = new UrlPath(Setup, "/creating-app");
const SetCreateAppState = new UrlPath(CreatingApp, "/state");
// const SaveApp = new UrlPath(Setup, "/save-app");
const PostCreateApp = new UrlPath(Setup, "/post-create-app");
const PostInstallApp = new UrlPath(Setup, "/post-install-app");

const App = new UrlPath(Api, "/app");
const AppRepos = new UrlPath(App, "/repos");

const Cluster = new UrlPath(Api, "/cluster");
const ServiceAccount = new UrlPath(Cluster, "/serviceaccount");

const Webhook = new UrlPath(Api, "/webhook");

const ApiEndpoints = {
  Api,
  Health,
  Setup: {
    Root: Setup,
    SetCreateAppState,
    CreatingApp,
    // SaveApp,
    PostCreateApp,
    PostInstallApp,
  },
  App: {
    Root: App,
    Repos: AppRepos,
  },
  Cluster: {
    Root: Cluster,
    ServiceAccount,
  },
  Webhook,
};

export default ApiEndpoints;
