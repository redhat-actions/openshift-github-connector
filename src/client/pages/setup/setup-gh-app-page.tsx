import React, { useState } from "react";
import { Jumbotron, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { v4 as uuid } from "uuid";
import { useHistory } from "react-router-dom";
import classNames from "classnames";

import ApiEndpoints from "../../../common/api-endpoints";
import getEndpointUrl from "../../util/get-endpoint-url";
import ClientPages from "../client-pages";
import DataFetcher from "../../components/data-fetcher";
import { fetchJSON, getSearchParam } from "../../util/client-util";
import SetupPageHeader, { getSetupPath, SETUP_QUERYPARAM } from "./setup-header";
import { ExternalLink } from "../../components/external-link";
import ApiRequests from "../../../common/api-requests";
import Banner from "../../components/banner";
import ApiResponses from "../../../common/api-responses";

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
  /* eslint-disable camelcase */
  return {
    name: "OpenShift Actions Connector",
    description: "Connect your OpenShift cluster to GitHub Actions",
    url: "https://github.com/redhat-actions",
    hook_attributes: {
      url: incomingWebhookUrl,
    },
    request_oauth_on_install: true,
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
  /* eslint-enable camelcase */
}

export function CreateAppPage(): JSX.Element {
  const [ enterpriseChecked, setEnterpriseChecked ] = useState(false);
  const [ error, setError ] = useState<string | undefined>(undefined);

  const state = uuid();

  const frontendUrl = window.location.protocol + "//" + window.location.host;

  const manifestFormID = "manifest-form";
  const enterpriseCheckboxId = "enterprise-checkbox";

  const appManifest = getAppManifest(frontendUrl);
  const githubManifestUrl = `https://github.com/settings/apps/new?state=${state}`;

  return (
    <React.Fragment>
      {getSearchParam(SETUP_QUERYPARAM) ? <SetupPageHeader pageIndex={0} hideBtnBanner={true}/> : ""}
      <Jumbotron className="text-black text-center">
        <h2>You have to create an app now</h2>
        <p className="my-3">This is a description of what creating an app means.</p>

        <input type="checkbox"
          className="form-check-input"
          id={enterpriseCheckboxId}
          checked={enterpriseChecked}
          onClick={(e) => setEnterpriseChecked(e.currentTarget.checked)}
        />
        <label htmlFor={enterpriseCheckboxId}>I want to use GitHub Enterprise</label>
        <p className={classNames({ "d-none": !enterpriseChecked })}>Too bad, {"that's"} not implemented yet.</p>

        <form className="row justify-content-center" id={manifestFormID} method="post" action={githubManifestUrl} onSubmit={
          async (e) => {
            e.preventDefault();
            try {
              await fetchJSON<ApiRequests.InitCreateApp>("POST", ApiEndpoints.Setup.SetCreateAppState.path, {
                state,
              });
              (document.getElementById(manifestFormID) as HTMLFormElement).submit();
            }
            catch (err) {
              setError(`Failed to start creation flow: ${err.message}`);
            }
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

        <div className="py-3"></div>
        <h4>
          <ExternalLink href="https://github.com/settings/apps/" showExternalLinkIcon={true}>
            View current apps
          </ExternalLink>
        </h4>

        <Banner display={error != null} severity="error">
          {error ?? ""}
        </Banner>

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
          return fetchJSON<ApiRequests.CreatingApp, ApiResponses.CreatingAppResponse>("POST", ApiEndpoints.Setup.CreatingApp.path, {
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

export function InstalledAppPage(): JSX.Element {
  const history = useHistory();

  const searchParams = new URLSearchParams(window.location.search);
  const installationId = searchParams.get("installation_id");
  const oauthCode = searchParams.get("code");
  // const setupAction = searchParams.get("setup_action");

  if (!installationId) {
    throw new Error(`"installationId" missing from query string`);
  }
  if (!oauthCode) {
    throw new Error(`"code" missing from query string`);
  }

  return (
    <React.Fragment>
      <DataFetcher loadingDisplay="spinner" type="generic" fetchData={
        async (): Promise<ApiResponses.Result> => {
          return fetchJSON<ApiRequests.PostInstall, ApiResponses.Result>(
            "POST", ApiEndpoints.Setup.PostInstallApp.path,
            { installationId, oauthCode },
          );
        }
      }>
        {() => (
          <p>
            Installed app successfully. Redirecting to app page...
            {history.replace(getSetupPath(ClientPages.App))}
          </p>
        )}
      </DataFetcher>
    </React.Fragment>
  );
}
