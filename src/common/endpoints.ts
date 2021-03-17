export class ApiEndpoint {

  constructor(
        private readonly parentEndpoint: ApiEndpoint | undefined,
        private readonly endpoint: string,
  ) {
    if (!this.endpoint.startsWith("/")) {
      this.endpoint = "/" + endpoint;
    }
  }

  public get path(): string {
    if (this.parentEndpoint) {
      return this.parentEndpoint.path + this.endpoint;
    }
    return this.endpoint;
  }

  public toString(): string {
    return this.path;
  }
}

const Root = new ApiEndpoint(undefined, "/");
const Health = new ApiEndpoint(undefined, "/health");

const Setup = new ApiEndpoint(undefined, "/setup");
const CreateApp = new ApiEndpoint(Setup, "/create-app");
const PostCreateApp = new ApiEndpoint(Setup, "/post-create-app");
const PostInstallApp = new ApiEndpoint(Setup, "/post-install-app");
const CreateSA = new ApiEndpoint(Setup, "/create-sa");

const App = new ApiEndpoint(undefined, "/app");

const Cluster = new ApiEndpoint(undefined, "/cluster");

const Webhook = new ApiEndpoint(undefined, "/webhook");

const Endpoints = {
  Root,
  Health,
  Setup: {
    Root: Setup,
    CreateApp,
    PostCreateApp,
    PostInstallApp,
    CreateSA,
  },
  App,
  Cluster,
  Webhook,
};

export default Endpoints;
