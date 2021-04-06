import app from "./app-route";
import cluster from "./cluster-route";
import webhook from "./webhook-route";
import appSetup from "./setup-app-route";
import saSetup from "./setup-sa-route";

const Routes = {
  app, cluster, webhook, appSetup, saSetup,
};

export default Routes;
