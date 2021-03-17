import React from "react";
import { Route, RouteComponentProps } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import AppPageCard from "../components/app-page-card";
import { AppPageState } from "../../common/interfaces/api-types";
import DataFetcher from "../components/data-fetcher";
import Endpoints from "../../common/endpoints";

export default class AppPage extends React.Component<RouteComponentProps> {

  render(): JSX.Element {
    const DOCS_ICON = "book";
    const EDIT_ICON = "cog";

    return (
      <DataFetcher loadingType="spinner" type="api" endpoint={Endpoints.App}>
        {(data: AppPageState) => {
          if (!data.app) {
            return (
              <Route render={ ({ history }) => {
                history.replace(Endpoints.Setup.CreateApp.path);
                return (<></>);
              }} />
            );
          }

          return (
            <React.Fragment>
              <h2 className="d-flex font-weight-bold mb-4">
                <a className="text-white" href={data.appUrls.app}>{data.appConfig.name}</a>
                <div className="ml-auto"></div>
                <button className="btn btn-lg btn-danger mr-4" title="Delete" onClick={
                  async () => {
                    await fetch(Endpoints.App.path, { method: "DELETE" });
                    window.location.reload();
                  }
                }>
                  <FontAwesomeIcon icon="times"/>
                    Delete
                </button>
                <button className="btn btn-lg btn-light" title="Refresh" onClick={() => window.location.reload()}>
                  <FontAwesomeIcon icon="sync-alt"/>
                    Refresh
                </button>
              </h2>
              <AppPageCard header="Permissions" buttons={[{
                href: "https://docs.github.com/en/developers/apps/creating-a-github-app-using-url-parameters#github-app-permissions",
                icon: DOCS_ICON,
                label: "Docs",
                tooltip: "GitHub Documentation",
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
                // eslint-disable-next-line max-len
                href: "https://docs.github.com/en/developers/apps/creating-a-github-app-using-url-parameters#github-app-webhook-events",
                icon: DOCS_ICON,
                label: "Docs",
                tooltip: "GitHub Documentation",
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
}
