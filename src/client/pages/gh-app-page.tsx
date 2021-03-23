import React from "react";
import { Route } from "react-router-dom";

import AppPageCard from "../components/app-page-card";
import DataFetcher from "../components/data-fetcher";
import ApiEndpoints from "../../common/api-endpoints";
import FaBtnBody from "../components/fa-btn-body";
import ApiResponses from "../../common/api-responses";
import ClientPages from "./client-pages";
import getEndpointUrl from "../util/get-endpoint-url";

export default function GitHubAppPage() {
  const DOCS_ICON = "book";
  const EDIT_ICON = "cog";

  return (
    <DataFetcher loadingDisplay="spinner" type="api" endpoint={ApiEndpoints.App.Root}>
      {(data: ApiResponses.GitHubAppState) => {
        if (!data.app) {
          return (
            <Route render={ ({ history }) => {
              history.replace(ClientPages.SetupApp.path);
              return (<></>);
            }} />
          );
        }

        return (
          <React.Fragment>
            <h2 className="d-flex font-weight-bold">
              <a className="text-white" href={data.appUrls.app}>{data.appConfig.name}</a>
              <div className="ml-auto"></div>
              <button className="btn btn-lg btn-danger mr-4" title="Unbind" onClick={
                async () => {
                  await fetch(getEndpointUrl(ApiEndpoints.App.Root.path), { method: "DELETE" }).catch(console.error);
                  window.location.reload();
                }
              }>
                <FaBtnBody icon="times" text="Unbind"/>
              </button>
              <button className="btn btn-lg btn-light" title="Refresh" onClick={() => window.location.reload()}>
                <FaBtnBody icon="sync-alt" text="Refresh"/>
              </button>
            </h2>
            <h4 className="mb-4">
              Created by <a href={data.appConfig.owner.html_url}>{data.appConfig.owner.login}</a>
            </h4>
            <AppPageCard header="Permissions" buttons={[{
              href: "https://docs.github.com/en/developers/apps/creating-a-github-app-using-url-parameters#github-app-permissions",
              icon: DOCS_ICON,
              label: "Docs",
              tooltip: "GitHub Documentation",
              mr: true,
            }, {
              href: data.appUrls.permissions,
              icon: EDIT_ICON,
              label: "Edit",
              tooltip: "Edit Permissions",
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
              label: "Docs",
              tooltip: "GitHub Documentation",
              mr: true,
            }, {
              href: data.appUrls.permissions,
              icon: EDIT_ICON,
              label: "Edit",
              tooltip: "Edit Events",
            }]}>
              <ul>
                {data.appConfig.events.map((event) => <li key={event}>{event}</li>)}
              </ul>
            </AppPageCard>
            <AppPageCard header="Installations" buttons={[{
              href: data.appUrls.install,
              icon: EDIT_ICON,
              label: "Install or Uninstall",
              tooltip: "Install or Uninstall",
            }]}>
              <ul>
                {data.installations.map((installation: any) => {
                  return (
                    <li key={installation.account.html_url}>
                      <a href={installation.account.html_url}>
                        {installation.account.login}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </AppPageCard>
            <AppPageCard header="Repositories" buttons={[{
              href: data.appUrls.installationSettings,
              icon: EDIT_ICON,
              label: "Edit Installation",
              tooltip: "Edit Installation",
            }]}>
              <ul>
                {data.repositories.map((repo: any) => {
                  return (
                    <li key={repo.full_name}>
                      <a href={repo.html_url}>
                        {repo.full_name}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </AppPageCard>
          </React.Fragment>
        );
      }}
    </DataFetcher>
  );
}
