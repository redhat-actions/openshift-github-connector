import UrlPath from "./types/url-path";

const Root = new UrlPath(undefined, "/api/v1");
const Health = new UrlPath(Root, "/health");

const Setup = new UrlPath(Root, "/setup");
const CreatingApp = new UrlPath(Setup, "/creating-app");
const SetCreateAppState = new UrlPath(CreatingApp, "/state");
// const SaveApp = new UrlPath(Setup, "/save-app");
const PostCreateApp = new UrlPath(Setup, "/post-create-app");
const PreInstallApp = new UrlPath(Setup, "/pre-install-app");
const PostInstallApp = new UrlPath(Setup, "/post-install-app");

const App = new UrlPath(Root, "/app");
const AppsExisting = new UrlPath(App, "/exists");
const AppRepos = new UrlPath(App, "/repos");
const RepoSecrets = new UrlPath(AppRepos, "/secrets");
const RepoSecretDefaults = new UrlPath(RepoSecrets, "/defaults");
const Workflows = new UrlPath(App, "/workflows");

const Cluster = new UrlPath(Root, "/cluster");

const User = new UrlPath(Root, "/user");
const SetUserOAuthState = new UrlPath(User, "/oauth/state");
const PostUserOAuth = new UrlPath(User, "/oauth/post-redirect");
const UserApp = new UrlPath(User, "/app");
const UserImageRegistries = new UrlPath(User, "/image-registries");
// const ServiceAccount = new UrlPath(User, "/serviceaccount");

const Webhook = new UrlPath(Root, "/webhook");

const ApiEndpoints = {
  Root,
  Health,
  Setup: {
    Root: Setup,
    SetCreateAppState,
    CreatingApp,
    // SaveApp,
    PostCreateApp,
    PreInstallApp,
    PostInstallApp,
  },
  User: {
    Root: User,
    SetUserOAuthState,
    PostUserOAuth,
    App: UserApp,
    ImageRegistries: UserImageRegistries,
    // ServiceAccount,
  },
  App: {
    Root: App,
    Existing: AppsExisting,
    Repos: {
      Root: AppRepos,
      Secrets: RepoSecrets,
      RepoSecretDefaults,
    },
    Workflows,
  },
  Cluster: {
    Root: Cluster,
  },
  Webhook,
};

export default ApiEndpoints;
