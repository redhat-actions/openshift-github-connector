import React from "react";
import { useHistory } from "react-router-dom";

import ApiEndpoints from "../../../../common/api-endpoints";
import ClientPages from "../../client-pages";
import DataFetcher from "../../../components/data-fetcher";
import { fetchJSON } from "../../../util/client-util";
import ApiRequests from "../../../../common/api-requests";
import ApiResponses from "../../../../common/api-responses";
import { SETUP_QUERYPARAM } from "../setup-header";

export function CreatingAppPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return (<p className="error">GitHub did not provide a {`"code"`} parameter in search query</p>);
  }
  if (!state) {
    return (<p className="error">GitHub did not provide a {`"state"`} parameter in search query</p>);
  }

  return (
    <React.Fragment>
      <DataFetcher loadingDisplay="spinner" type="generic" fetchData={
        async () => {
          return fetchJSON<ApiRequests.OAuthCallbackData, ApiResponses.CreatingAppResponse>("POST", ApiEndpoints.Setup.CreatingApp.path, {
            code, state,
          });
        }
      }>
        {(data: ApiResponses.CreatingAppResponse) => {
          const installUrl = data.appInstallUrl;
          console.log("Redirect to " + installUrl);
          return (
            <React.Fragment>
              <p>
                {data.message}
              </p>
              <p>
                Redirecting to install page...
                {window.location.replace(installUrl)}
              </p>
              <a href={installUrl}>{installUrl}</a>
            </React.Fragment>
          );
        }}
      </DataFetcher>
    </React.Fragment>
  );
}

enum PostInstallQueryKeys {
  // APP_ID = "app_id",
  INSTALLATION_ID = "installation_id",
  CODE = "code",
  SETUP_ACTION = "setup_action",
}

export function InstalledAppPage(): JSX.Element {
  const history = useHistory();

  const searchParams = new URLSearchParams(window.location.search);

  // const appId = searchParams.get(QueryItems.APP_ID);
  const installationId = searchParams.get(PostInstallQueryKeys.INSTALLATION_ID);
  const oauthCode = searchParams.get(PostInstallQueryKeys.CODE);
  const setupAction = searchParams.get(PostInstallQueryKeys.SETUP_ACTION);

  const missingQueryItems = Object.values(PostInstallQueryKeys).filter((qi) => !searchParams.get(qi));

  if (missingQueryItems.length > 0 || installationId == null || oauthCode == null || setupAction == null) {
    return (
      <p className="error">
        Missing query search parameter(s): {missingQueryItems.join(", ")}
      </p>
    );
  }

  return (
    <React.Fragment>
      <DataFetcher loadingDisplay="spinner" type="generic" fetchData={
        async (): Promise<ApiResponses.Result> => {
          return fetchJSON<ApiRequests.PostInstall, ApiResponses.Result>(
            "POST", ApiEndpoints.Setup.PostInstallApp.path,
            { installationId, oauthCode, setupAction },
          );
        }
      }>
        {() => (
          <p>
            Installed app successfully. Redirecting to app page...
            {history.replace(ClientPages.App.withQuery({ [SETUP_QUERYPARAM]: "true" }))}
          </p>
        )}
      </DataFetcher>
    </React.Fragment>
  );
}
