import { Route, Switch } from "react-router-dom";
import { Spinner } from "@patternfly/react-core";

import ClientPages from "./pages/client-pages";
import NotFound from "./pages/errors/404";

import { getConsoleModifierClass, isInOpenShiftConsole } from "./util/client-util";
import ApiEndpoints from "../common/api-endpoints";
import { getTitle } from "./components/title";
import DataFetcher from "./components/data-fetcher";
import ApiResponses from "../common/api-responses";
import { InConsoleContext, UserContext } from "./contexts";

export default function App(): JSX.Element {

  return (
    <>
      <InConsoleContext.Provider value={isInOpenShiftConsole()}>
        {getTitle(undefined)}
        <div id="wrapper" /* className="d-flex w-100 justify-content-center" */>
          <main className={getConsoleModifierClass()}>
            <DataFetcher
              type="api"
              endpoint={ApiEndpoints.User.Root}
              onError={(err) => {
                if (err.status === 401) {
                  redirectToLogin();
                }
              }}
              loadingDisplay={
                <>
                  <div className="centers flex-column p-5">
                    <Spinner size="xl" />
                    {/* <p>Checking login status...</p> */}
                  </div>
                </>
              }>{
                (loginResponse: ApiResponses.UserResponse, reload) => {

                  // console.log(`LOGIN RESPONSE`, loginResponse);

                  if (loginResponse.success) {
                    return (
                      <UserContext.Provider value={{
                        user: loginResponse,
                        reload: async () => { console.log("RELOADING USER"); await reload(); },
                      }}>
                        <AppSwitch />
                      </UserContext.Provider>
                    );
                  }
                  return redirectToLogin();
                }
              }
            </DataFetcher>
          </main>
        </div>
      </InConsoleContext.Provider>
    </>
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
