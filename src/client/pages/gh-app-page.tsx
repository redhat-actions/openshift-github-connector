import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Button } from "react-bootstrap";
import classNames from "classnames";

import AppPageCard from "../components/gh-app-page-card";
import DataFetcher from "../components/data-fetcher";
import ApiEndpoints from "../../common/api-endpoints";
import BtnBody from "../components/fa-btn-body";
import ApiResponses from "../../common/api-responses";
import ClientPages from "./client-pages";
import getEndpointUrl from "../util/get-endpoint-url";
import { fetchJSON, getSearchParam } from "../util/client-util";
import SetupPageHeader, { SETUP_QUERYPARAM } from "./setup/setup-header";
import { ExternalLink } from "../components/external-link";

export default function GitHubAppPage() {
  const DOCS_ICON = "book";
  const EDIT_ICON = "cog";
  const isSetup = getSearchParam(SETUP_QUERYPARAM);

  return (
    <React.Fragment>
      {
        isSetup ? <SetupPageHeader pageIndex={2} canProceed={true}/> : <></>
      }
      <DataFetcher loadingDisplay="spinner" type="api" endpoint={ApiEndpoints.App.Root}>
        {(data: ApiResponses.GitHubAppState, reload) => {
          if (data.app === false) {
            return (
              <NoAppRedirector />
            );
          }

          return (
            <React.Fragment>
              <div className="d-flex align-items-center my-4">
                <h2>
                  <ExternalLink className="text-light" href={data.appUrls.app}>
                    {data.appConfig.name}
                  </ExternalLink>
                  {/* The app avatar can be fetched from /identicons/app/app/<slug> */}
                </h2>

                <div className="ml-auto"></div>

                <div className="btn-line even">
                  <Button size="lg" variant="danger" className={classNames({ "d-none": isSetup })} onClick={
                    async () => {
                      await fetchJSON<{}, void>("DELETE", getEndpointUrl(ApiEndpoints.App.Root.path));
                      await reload();
                    }
                  }>
                    <BtnBody icon="times" text="Unbind"/>
                  </Button>
                  <Button size="lg" onClick={reload}>
                    <BtnBody icon="sync-alt" text="Refresh"/>
                  </Button>
                </div>
              </div>

              <h5 className="my-3">
                <DataFetcher type="api" endpoint={ApiEndpoints.User.Root} loadingDisplay="text">{
                  (userRes: ApiResponses.GitHubUserResponse) => {
                    return (
                      <React.Fragment>
                        Logged in as {userRes.login}
                      </React.Fragment>
                    );
                  }
                }
                </DataFetcher>
              </h5>
              <AppPageCard header="Permissions" buttons={[{
                href: "https://docs.github.com/en/developers/apps/creating-a-github-app-using-url-parameters#github-app-permissions",
                icon: DOCS_ICON,
                text: "Docs",
                title: "GitHub Documentation",
                mr: true,
              }, {
                href: data.appUrls.permissions,
                icon: EDIT_ICON,
                text: "Edit",
                title: "Edit Permissions",
              }]}>
                <ul>
                  {Object.entries(data.appConfig.permissions).map(([ key, value ]) => {
                    return (
                      <li key={key}>{key}: {value}</li>
                    );
                  })}
                </ul>
              </AppPageCard>
              <AppPageCard header="Event Subscriptions" buttons={[{
                href: "https://docs.github.com/en/developers/apps/creating-a-github-app-using-url-parameters#github-app-webhook-events",
                icon: DOCS_ICON,
                text: "Docs",
                title: "GitHub Documentation",
                mr: true,
              }, {
                href: data.appUrls.permissions,
                icon: EDIT_ICON,
                text: "Edit",
                title: "Edit Events",
              }]}>
                <ul>
                  {data.appConfig.events.map((event) => <li key={event}>{event}</li>)}
                </ul>
              </AppPageCard>
              <AppPageCard header="Repositories" buttons={[{
                href: data.appUrls.installationSettings,
                icon: EDIT_ICON,
                text: "Edit Installation",
                title: "Edit Installation",
              }]}>
                <ul>
                  {data.repos.map((repo) => {
                    return (
                      <li key={repo.full_name}>
                        <ExternalLink href={repo.html_url}>
                          {repo.full_name}
                        </ExternalLink>
                      </li>
                    );
                  })}
                </ul>
              </AppPageCard>
              <AppPageCard header="Installations" buttons={[{
                href: data.appUrls.install,
                icon: EDIT_ICON,
                text: "Install or Uninstall",
                title: "Install or Uninstall",
              }]}>
                <ul>
                  {data.installations.map((installation) => {
                    if (installation.account == null) {
                      return (<li className="text-danger">Installation {installation.id} missing {`"account"`}</li>);
                    }

                    return (
                      <li key={installation.account.html_url}>
                        <ExternalLink href={installation.account.html_url ?? ""}>
                          {installation.account.login}
                        </ExternalLink>
                      </li>
                    );
                  })}
                </ul>
              </AppPageCard>
            </React.Fragment>
          );
        }}
      </DataFetcher>
    </React.Fragment>
  );
}

function NoAppRedirector(): JSX.Element {
  const history = useHistory();

  const [ countdown, setCountdown ] = useState(3);

  let countdownInterval: NodeJS.Timeout | undefined;
  useEffect(() => {
    countdownInterval = setInterval(() => {
      if (countdown <= 0) {
        history.push(ClientPages.SetupCreateApp.path);
      }
      else {
        setCountdown(countdown - 1);
      }
    }, 1000);

    return function cleanup() {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  });

  return (
    <React.Fragment>
      <p>A GitHub App has not yet been added to the connector.</p>
      <h2 className="my-3">
        <a href={ClientPages.SetupCreateApp.path}>Create an App</a>
      </h2>
      <p>You will be redirected in {countdown} ...</p>
    </React.Fragment>
  );
}
