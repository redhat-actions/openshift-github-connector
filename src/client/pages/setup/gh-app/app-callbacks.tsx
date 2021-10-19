import { useContext, useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";

import { Spinner } from "@patternfly/react-core";
import ApiEndpoints from "../../../../common/api-endpoints";
import DataFetcher from "../../../components/data-fetcher";
import { fetchJSON } from "../../../util/client-util";
import ApiRequests from "../../../../common/api-requests";
import ApiResponses from "../../../../common/api-responses";
import { getSetupPagePath } from "../setup";
import { RELOAD_APPS_SEARCH } from "./install-existing-app";
import { ConnectorUserContext } from "../../../contexts";

enum CallbackSearchParams {
  // APP_ID = "app_id",
  INSTALLATION_ID = "installation_id",
  CODE = "code",
  SETUP_ACTION = "setup_action",
  STATE = "state",
}

export function PostCreateAppCallbackPage() {

  const history = useHistory();

  // const pushAlert = useContext(ConnectorAlertContext);

  const search = useLocation().search;

  const searchParams = new URLSearchParams(search);
  const code = searchParams.get(CallbackSearchParams.CODE);
  const state = searchParams.get(CallbackSearchParams.STATE);

  if (!code) {
    return (<p className="error">GitHub did not provide a {CallbackSearchParams.CODE} parameter in search query</p>);
  }
  if (!state) {
    return (<p className="error">GitHub did not provide a {CallbackSearchParams.STATE} parameter in search query</p>);
  }

  return (
    <>
      <DataFetcher loadingDisplay="spinner" type="generic" fetchData={
        async (abortSignal: AbortSignal) => {
          const res = await fetchJSON<ApiRequests.GitHubOAuthCallbackData, ApiResponses.CreatingAppResponse>(
            "POST",
            ApiEndpoints.Setup.CreatingApp.path, {
              code, state,
            }, {
              signal: abortSignal,
            },
          );

          history.replace({
            pathname: getSetupPagePath("INSTALL_APP"),
            search: `?${RELOAD_APPS_SEARCH}`,
          });

          return res;
        }
      }>
        {(_res: ApiResponses.CreatingAppResponse) => {
          // pushAlert({ severity: "success", title: res.message });

          return (
            <p>
              Successfully created app, redirecting...
            </p>
          );
        }}
      </DataFetcher>
    </>
  );
}

function getPostInstallParams(search: string): ApiRequests.PostInstall {
  const searchParams = new URLSearchParams(search);

  // const appId = searchParams.get(QueryItems.APP_ID);
  const installationId = searchParams.get(CallbackSearchParams.INSTALLATION_ID);
  const oauthCode = searchParams.get(CallbackSearchParams.CODE);
  const setupAction = searchParams.get(CallbackSearchParams.SETUP_ACTION);

  const missingQueryItems = [
    CallbackSearchParams.INSTALLATION_ID,
    CallbackSearchParams.CODE,
    CallbackSearchParams.SETUP_ACTION,
  ].filter((qi) => !searchParams.get(qi));

  if (missingQueryItems.length > 0 || installationId == null || oauthCode == null || setupAction == null) {
    throw new Error(`Missing query search parameter(s): ${missingQueryItems.join(", ")}`);

  }
  return { installationId, oauthCode, setupAction };
}

export function InstalledAppPage(): JSX.Element {

  // const pushAlert = useContext(ConnectorAlertCntext);

  const [ error, setError ] = useState<string>();

  const history = useHistory();
  const { search } = useLocation();
  const { reload: reloadUser } = useContext(ConnectorUserContext);

  useEffect(() => {
    const aborter = new AbortController();

    async function submitInstall() {
      if (aborter.signal.aborted) {
        return;
      }

      const postInstallReqBody = getPostInstallParams(search);

      await fetchJSON<ApiRequests.PostInstall, ApiResponses.Result>(
        "POST", ApiEndpoints.Setup.PostInstallApp.path, postInstallReqBody,
        { signal: aborter.signal }
      );

      await reloadUser();

      // pushAlert({ severity: "success", title: res.message });

    }

    submitInstall()
      .then(() => {
        history.replace({
          pathname: getSetupPagePath("VIEW_APP"),
          // search: `?${RELOAD_USER_SEARCH}`,
        });
      })
      .catch((err) => {
        setError(err.toString());
      });

    return () => {
      aborter.abort();
    };
  }, [ setError, search, history, reloadUser ]);

  return (
    <>
      {
        error ?
          <p className="error">{error}</p>
          : <div className="center-x">
            <Spinner size="lg" /* match DataFetcher */ />
          </div>
      }
    </>
  );
}
