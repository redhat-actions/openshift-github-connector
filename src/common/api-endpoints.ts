import UrlPath from "./types/url-path";

const apiBasePath = process.env.API_BASE_PATH ?? "/";
// When running in the console, we have to prepend the console-determine plugin API path to reach our backend.
const apiRootPath = apiBasePath + "api/v1";

const Root = new UrlPath(undefined, apiRootPath);
const Health = new UrlPath(Root, "/health");

const Auth = new UrlPath(Root, "/auth");
const Login = new UrlPath(Auth, "/login");
// const LoginStatus = new UrlPath(Login, "/status");
// Must match helm chart value which passes callback URL env var to the pod
const OAuthCallback = new UrlPath(Auth, "/callback");

const Setup = new UrlPath(Root, "/setup");
const CreatingApp = new UrlPath(Setup, "/creating-app");
const SetCreateAppState = new UrlPath(CreatingApp, "/state");
// const SaveApp = new UrlPath(Setup, "/save-app");
const PostCreateApp = new UrlPath(Setup, "/post-create-app");
const PreInstallApp = new UrlPath(Setup, "/pre-install-app");
const PostInstallApp = new UrlPath(Setup, "/post-install-app");

const App = new UrlPath(Root, "/app");
// const AppsExisting = new UrlPath(App, "/exists");
const AppRepos = new UrlPath(App, "/repos");
const RepoSecrets = new UrlPath(AppRepos, "/secrets");
const RepoSecretDefaults = new UrlPath(RepoSecrets, "/defaults");
const Workflows = new UrlPath(App, "/workflows");

const Cluster = new UrlPath(Root, "/cluster");
const Namespaces = new UrlPath(Cluster, "/namespaces");
const ServiceAccounts = new UrlPath(Namespaces, "/service-accounts");

const OpenShiftUser = new UrlPath(Root, "/user");
const UserImageRegistries = new UrlPath(OpenShiftUser, "/image-registries");

const UserGitHub = new UrlPath(OpenShiftUser, "/github");
const UserGitHubDetails = new UrlPath(OpenShiftUser, "/github/details");
const GitHubInstallation = new UrlPath(UserGitHub, "/installation");
const GitHubInstallationToken = new UrlPath(GitHubInstallation, "/token");

const Webhook = new UrlPath(Root, "/webhook");

const ApiEndpoints = {
  Root,
  Health,
  Auth: {
    Login,
    // LoginStatus,
    OAuthCallback,
  },
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
    Root: OpenShiftUser,
    UserGitHub,
    UserGitHubDetails,
    // SetUserOAuthState,
    // PostUserOAuth,
    GitHubInstallation,
    GitHubInstallationToken,
    ImageRegistries: UserImageRegistries,
    // ServiceAccount,
  },
  App: {
    Root: App,
    // Existing: AppsExisting,
    Repos: {
      Root: AppRepos,
      Secrets: RepoSecrets,
      RepoSecretDefaults,
    },
    Workflows,
  },
  Cluster: {
    Root: Cluster,
    Namespaces: {
      Root: Namespaces,
      ServiceAccounts,
    },
  },
  Webhook,
};

export default ApiEndpoints;
