import app from "./gh-app-route";
import cluster from "./cluster-route";
import webhook from "./webhook-route";
import appSetup from "./setup-gh-app-route";
// import saSetup from "./serviceaccount-route";

const Routes = {
  app, cluster, webhook, appSetup, /* saSetup, */
};

export default Routes;
