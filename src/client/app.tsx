import React from "react";
import { Route, Switch } from "react-router-dom";
import { Helmet } from "react-helmet";

import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";

import "bootstrap/dist/css/bootstrap.min.css";
import "./css/colors.css";
import "./css/index.css";

import ClientPages from "./pages/client-pages";
import NotFound from "./pages/errors/404";

export default function app(): JSX.Element {
  library.add(fab, fas);

  return (
    <React.Fragment>
      <Helmet>
        <title>OpenShift Actions Connector</title>
      </Helmet>
      <div id="wrapper" className="d-flex w-100 justify-content-center">
        <main>
          <Switch>
            {
              /* Creates the Route objects that map routes to components that represent pages */
              Object.values(ClientPages).map((page) => page.route)
            }
            <Route path="*">
              <NotFound path={window.location.pathname}/>
            </Route>
          </Switch>
        </main>
      </div>
    </React.Fragment>
  );
}
