import React from "react";
import { Jumbotron, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { v4 as uuid } from "uuid";
import { useHistory } from "react-router-dom";

import ApiEndpoints from "../../../common/api-endpoints";
import getEndpointUrl from "../../util/get-endpoint-url";
import ClientPages from "../client-pages";
import { GitHubAppConfigWithSecrets } from "../../../common/types/github-app";
import DataFetcher from "../../components/data-fetcher";
import { fetchJSON } from "../../util/client-util";
import SetupPageHeader from "./setup-header";
import { APP_IS_BEING_SETUP_QP } from "../gh-app-page";

export function getAppManifest(appUrl: string): Record<string, unknown> {
  // the redirect url is the first one, which is redirected to after the app is created
  const redirectUrl = appUrl + ClientPages.SetupCreatingApp;

  // the callback url is the second one, which is redirect to after the app is installed
  const callbackUrl = appUrl + ClientPages.SetupInstalledApp;
  // eslint-disable-next-line camelcase
  // the setup url is redirected to after the app is updated
  const setupUrl = callbackUrl + "?reload=true";

  const incomingWebhookUrl = appUrl + getEndpointUrl(ApiEndpoints.Webhook.path);

  // https://docs.github.com/en/developers/apps/creating-a-github-app-from-a-manifest#github-app-manifest-parameters
  // the following parameters can also be in this payload (though you wouldn't know from the manifest doc)
  // https://docs.github.com/en/developers/apps/creating-a-github-app-using-url-parameters#github-app-configuration-parameters
  return {
    name: "OpenShift Actions Connector",
    description: "Connect your OpenShift cluster to GitHub Actions",
    url: "https://github.com/redhat-actions",
    hook_attributes: {
      url: incomingWebhookUrl,
    },
    // request_oauth_on_install: true,
    callback_url: callbackUrl,
    redirect_url: redirectUrl,
    setup_url: setupUrl,
    setup_on_update: true,
    public: false,
    default_permissions: {
      actions: "write",
      secrets: "write",
    },
    default_events: [
      "workflow_run",
    ],
  };
}

export function CreateAppPage(): JSX.Element {
  const state = uuid();

  const frontendUrl = window.location.protocol + "//" + window.location.host;

  const appManifest = getAppManifest(frontendUrl);
  const githubManifestUrl = `https://github.com/settings/apps/new?state=${state}`;

  return (
    <React.Fragment>
      <SetupPageHeader pageIndex={0}/>
      <Jumbotron className="text-black">
        <h2 className="text-center">You have to create an app now</h2>
        <p className="text-center">This is a description of what creating an app means.</p>

        <form className="row justify-content-center mt-5" method="post" action={githubManifestUrl} onSubmit={
          () => {
            fetchJSON("POST", ApiEndpoints.Setup.SetCreateAppState.path, {
              body: JSON.stringify({ state }),
            })
              .catch((console.error));
          }
        }>
          <input className="d-none" name="manifest" type="manifest" readOnly={true} value={JSON.stringify(appManifest)} />
          <Button className="btn-primary btn-lg d-flex px-5" type="submit">
            <FontAwesomeIcon icon={[ "fab", "github" ]} className="fa-2x mr-3 text-black"/>
            <div className="font-weight-bold align-self-center" title="Create your app">
              Create your app
            </div>
          </Button>
        </form>

      </Jumbotron>
    </React.Fragment>
  );
}

export function CreatingAppPage() {

  // async postAppData(appData: GitHubAppConfigWithSecrets): Promise<void> {
  //   const res = await fetchJson(ApiEndpoints.Setup.CreatingApp.path, {
  //     headers: { [HttpConstants.Headers.ContentType]: HttpConstants.ContentTypes.Json },
  //     method: "POST",
  //     body: JSON.stringify(appData),
  //   });

  //   await throwIfError(res);
  // }

  const searchParams = new URLSearchParams(window.location.search);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  return (
    <React.Fragment>
      <DataFetcher loadingDisplay="spinner" type="generic" fetchData={
        async (): Promise<GitHubAppConfigWithSecrets> => {
          return fetchJSON("POST", ApiEndpoints.Setup.CreatingApp.path, {
            body: JSON.stringify({ code, state }),
          });
        }
      }>
        {(data: GitHubAppConfigWithSecrets) => {
          const installUrl = `https://github.com/settings/apps/${data.slug}/installations`;
          console.log("Redirect to " + installUrl);
          return (
            <React.Fragment>
              <p>
                Saved app successfully. Redirecting to install page...
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

export function getAppPageUrlWithSetupQuery(): string {
  return `${ClientPages.App.path}?${APP_IS_BEING_SETUP_QP}=true`;
}

export function InstalledAppPage(): JSX.Element {
  const history = useHistory();

  const searchParams = new URLSearchParams(window.location.search);
  const installationId = searchParams.get("installation_id");
  // const setupAction = searchParams.get("setup_action");

  return (
    <React.Fragment>
      <DataFetcher loadingDisplay="spinner" type="generic" fetchData={
        async (): Promise<void> => {
          return fetchJSON("POST", ApiEndpoints.Setup.PostInstallApp.path, {
            body: JSON.stringify({ installationId }),
          });
        }
      }>
        {() => (
          <p>
            Installed app successfully. Redirecting...
            {history.replace(getAppPageUrlWithSetupQuery())}
          </p>
        )}
      </DataFetcher>
    </React.Fragment>
  );
}
