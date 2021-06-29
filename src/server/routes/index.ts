import App from "server/routes/gh-app/gh-app-route";
import Cluster from "server/routes/cluster-route";
import Webhook from "server/routes/webhook-route";
import AppSetup from "server/routes/gh-app/gh-app-setup-route";
import Secrets from "server/routes/gh-app/gh-secrets-route";
import Workflows from "server/routes/gh-app/gh-workflows-route";
import User from "server/routes/user-route";
import UserApp from "server/routes/gh-app/user-app-route";
import ImageRegistries from "server/routes/image-registry-route";
import OAuthRouter from "server/routes/oauth-route";

const Routes = {
  App,
  Cluster,
  Webhook,
  AppSetup,
  Secrets,
  User,
  UserApp,
  Workflows,
  ImageRegistries,
  OAuthRouter,
};

export default Routes;
