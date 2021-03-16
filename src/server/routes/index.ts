import app from "./app-route";
import cluster from "./cluster-route";
import root from "./root-route";
import webhook from "./webhook-route";
import appSetup from "./setup/app-setup";
import saSetup from "./setup/sa-setup";

const Routes = {
    root, app, cluster, webhook, appSetup, saSetup,
};

export default Routes;
