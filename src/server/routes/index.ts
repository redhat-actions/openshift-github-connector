import app from "./app-route";
import cluster from "./cluster-route";
import webhook from "./webhook-route";
import appSetup from "./app-setup-route";
import saSetup from "./sa-setup-route";

const Routes = {
  app, cluster, webhook, appSetup, saSetup,
};

export default Routes;
