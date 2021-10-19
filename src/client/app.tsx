import {
  Route, Switch, useHistory, useLocation,
} from "react-router-dom";

import ClientPages from "./pages/client-pages";
import NotFound from "./pages/errors/404";

import { getConsoleModifierClass, isInOpenShiftConsole } from "./util/client-util";
import ApiEndpoints from "../common/api-endpoints";
import { getTitle } from "./components/title";
import DataFetcher from "./components/data-fetcher";
import ApiResponses from "../common/api-responses";
import { InConsoleContext, ConnectorUserContext, RELOAD_USER_SEARCH } from "./contexts";

export default function App(): JSX.Element {

  const history = useHistory();
  const { search } = useLocation();

  return (
    <>
      <InConsoleContext.Provider value={isInOpenShiftConsole()}>
        {getTitle(undefined)}
        <div id="wrapper" className={getConsoleModifierClass()} /* className="d-flex w-100 justify-content-center" */>
          <DataFetcher
            type="api"
            endpoint={ApiEndpoints.User.Root}
            onError={(err) => {
              if (err.status === 401) {
                redirectToLogin();
              }
            }}
            loadingDisplay={"none"}
            /*
              <>
                <div className="centers flex-column p-5">
                  <Spinner size="xl" />
                </div>
              </>
            }*/
          >{
              (loginResponse: ApiResponses.UserResponse, reload) => {

                if (search.includes(RELOAD_USER_SEARCH)) {
                  history.replace({ search: search.replace(RELOAD_USER_SEARCH, "") });
                  reload().catch(console.error);
                }

                if (loginResponse.success) {
                  return (
                    <ConnectorUserContext.Provider value={{
                      user: loginResponse,
                      reload,
                    }}>
                      <AppSwitch />
                    </ConnectorUserContext.Provider>
                  );
                }
                // else not logged in
                return redirectToLogin();
              }
            }
          </DataFetcher>
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
