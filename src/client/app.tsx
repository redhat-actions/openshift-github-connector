import React from "react";
import { Switch, Route } from "react-router-dom";
import { Helmet } from "react-helmet";

import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";

import "bootstrap/dist/css/bootstrap.min.css";
import "./css/colors.css";
import "./css/index.css";

import Homepage from "./pages/home";
import AppPage from "./pages/app-page";

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
                        <Route exact path="/" component={Homepage}></Route>
                        <Route exact path="/app" component={AppPage}></Route>
                        <Route exact path="/cluster" component={AppPage}></Route>
                    </Switch>
                </main>
            </div>
        </React.Fragment>
    );
}
