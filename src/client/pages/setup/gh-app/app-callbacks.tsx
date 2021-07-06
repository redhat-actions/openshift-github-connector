import { useContext, useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";

import ApiEndpoints from "../../../../common/api-endpoints";
import DataFetcher from "../../../components/data-fetcher";
import { fetchJSON } from "../../../util/client-util";
import ApiRequests from "../../../../common/api-requests";
import ApiResponses from "../../../../common/api-responses";
import { UserContext } from "../../../contexts";
import { getSetupPagePath } from "../setup";

enum CallbackSearchParams {
  // APP_ID = "app_id",
  INSTALLATION_ID = "installation_id",
  CODE = "code",
  SETUP_ACTION = "setup_action",
  STATE = "state",

  REFRESHED_USER = "updated-user",
}

const REFRESHED_USER_VALUE = "true";

export function PostCreateAppCallbackPage() {

  const userContext = useContext(UserContext);
  const history = useHistory();

  const search = useLocation().search;

  const searchParams = new URLSearchParams(search);
  const code = searchParams.get(CallbackSearchParams.CODE);
  const state = searchParams.get(CallbackSearchParams.STATE);

  const didRefreshUser = searchParams.get(CallbackSearchParams.REFRESHED_USER) === REFRESHED_USER_VALUE;

  if (didRefreshUser) {
    history.replace({
      pathname: getSetupPagePath("INSTALL_APP"),
    });

    return (
      <p>
        Redirecting...
      </p>
    );
  }

  if (!code) {
    return (<p className="error">GitHub did not provide a {CallbackSearchParams.CODE} parameter in search query</p>);
  }
  if (!state) {
    return (<p className="error">GitHub did not provide a {CallbackSearchParams.STATE} parameter in search query</p>);
  }

  return (
    <>
      <DataFetcher loadingDisplay="spinner" type="generic" fetchData={
        async () => {
          await fetchJSON<ApiRequests.GitHubOAuthCallbackData, ApiResponses.CreatingAppResponse>(
            "POST",
            ApiEndpoints.Setup.CreatingApp.path, {
              code, state,
            }
          );

          history.replace({
            search: `?${CallbackSearchParams.REFRESHED_USER}=${REFRESHED_USER_VALUE}`,
          });

          await userContext.reload();

          // return res;

        }
      }>
        {() => {
          return (
            <p>
              Reloading user...
            </p>
          );
          /*
          // console.log("Redirect to " + installUrl);
          return (
            <>
              <p>
                {data.message}
              </p>
              <p>
                (Optional) <ExternalLink href={data.appInstallUrl} icon={{ Icon: GithubIcon, position: "left" }}>Install {data.appName}</ExternalLink>
              </p>
              <p>
                Or, proceed to the next step.
              </p>
            </>
          );
          */
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

  const [ error, setError ] = useState<string>();

  const history = useHistory();
  const { search } = useLocation();

  const userContext = useContext(UserContext);

  useEffect(() => {
    async function submitInstall() {
      const didRefreshUser = new URLSearchParams(search).get(CallbackSearchParams.REFRESHED_USER) === REFRESHED_USER_VALUE;

      if (didRefreshUser) {
        history.replace({
          pathname: getSetupPagePath("VIEW_APP"),
        });
      }

      const postInstallReqBody = getPostInstallParams(search);

      history.replace({
        search: `?${CallbackSearchParams.REFRESHED_USER}=${REFRESHED_USER_VALUE}`,
      });

      await fetchJSON<ApiRequests.PostInstall, ApiResponses.Result>(
        "POST", ApiEndpoints.Setup.PostInstallApp.path, postInstallReqBody
      );

      await userContext.reload();
    }

    submitInstall().catch((err) => setError(err));
  }, [ setError, search, history, userContext ]);

  return (
    <>
      {
        error ? <p className="error">{error}</p>
          : <p>Install succeeded, redirecting...</p>
      }
    </>
  );

/*
  if (didRefreshUser) {
    history.replace({
      pathname: getSetupPagePath("VIEW_APP"),
    });
    return (
      <p>
        Redirecting...
      </p>
    );
  }

  const postInstallReqBody = getPostInstallParams(search);

  return (
    <>
      <DataFetcher loadingDisplay="spinner" type="generic" fetchData={
        async () => {
          const res = fetchJSON<ApiRequests.PostInstall, ApiResponses.Result>(
            "POST", ApiEndpoints.Setup.PostInstallApp.path,
            ,
          );

          history.replace({
            search: `?${CallbackSearchParams.REFRESHED_USER}=${REFRESHED_USER_VALUE}`,
          });

          await userContext.reload();

          return res;
        }
      }>{
          () => (
            <p>
              Reloading user...
            </p>
          )
        }
      </DataFetcher>
    </>
  );

  */
}
