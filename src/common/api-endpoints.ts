import UrlPath from "./types/url-path";

const Api = new UrlPath(undefined, "/api/v1");
const Health = new UrlPath(Api, "/health");

const Setup = new UrlPath(Api, "/setup");
const CreateApp = new UrlPath(Setup, "/create-app");
const PostCreateApp = new UrlPath(Setup, "/post-create-app");
const PostInstallApp = new UrlPath(Setup, "/post-install-app");

const App = new UrlPath(Api, "/app");

const Cluster = new UrlPath(Api, "/cluster");
const ServiceAccount = new UrlPath(Cluster, "/serviceaccount");

const Webhook = new UrlPath(Api, "/webhook");

const ApiEndpoints = {
  Api,
  Health,
  Setup: {
    Root: Setup,
    CreateApp,
    PostCreateApp,
    PostInstallApp,
  },
  App: {
    Root: App,
  },
  Cluster: {
    Root: Cluster,
    ServiceAccount,
  },
  Webhook,
};

export default ApiEndpoints;
