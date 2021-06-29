import React from "react";
import { Route, Switch } from "react-router-dom";
import { Spinner } from "@patternfly/react-core";

import ClientPages from "./pages/client-pages";
import NotFound from "./pages/errors/404";
import { getConsoleModifierClass } from "./util/client-util";
import ApiEndpoints from "../common/api-endpoints";
import { getTitle } from "./components/title";
import DataFetcher from "./components/data-fetcher";
import ApiResponses from "../common/api-responses";

export default function App(): JSX.Element {

  return (
    <React.Fragment>
      {getTitle(undefined)}
      <div id="wrapper" className="d-flex w-100 justify-content-center">
        <main className={getConsoleModifierClass()}>
          <DataFetcher type="api" loadingDisplay={
            <>
              <div className="centers flex-column">
                <Spinner size="lg"/>
                <p>Checking login status...</p>
              </div>
            </>
          } endpoint={ApiEndpoints.Auth.LoginStatus}
          /* fetchData={async () => {
            const loginRes = await fetch(ApiEndpoints.Auth.LoginStatus.path);
            return loginRes.text();
          }}*/ >{
              (loginResponse: ApiResponses.Result) => {

                // console.log(`LOGIN RESPONSE`, loginResponse);

                if (loginResponse.success) {
                  return (
                    <AppSwitch />
                  );
                }
                return redirectToLogin();
              }
            }

          </DataFetcher>
        </main>
      </div>
    </React.Fragment>
  );
}

function AppSwitch(): JSX.Element {
  return (
    <Switch>
      {
        /* Creates the Route objects that map routes to components that represent pages */
        Object.values(ClientPages).map((page) => page.route)
      }
      <Route path="*">
        <NotFound path={window.location.pathname}/>
      </Route>
    </Switch>
  );
}

function redirectToLogin() {
  console.log(`Redirect to login!`);

  window.location.search = "";
  window.location.pathname = (ApiEndpoints.Auth.Login.path + "/");

  return (
    <></>
  );
}
