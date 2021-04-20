import app from "./gh-app-route";
import cluster from "./cluster-route";
import webhook from "./webhook-route";
import appSetup from "./gh-app-setup-route";
// import saSetup from "./serviceaccount-route";
import secrets from "./gh-secrets-route";

const Routes = {
  app, cluster, webhook, appSetup, secrets,
};

export default Routes;
