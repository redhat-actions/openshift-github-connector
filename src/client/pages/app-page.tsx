import React from "react";
import { RouteComponentProps } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import DataFetcherPage from "../components/data-fetching-page";
import AppPageCard from "../components/app-page-card";
import { AppPageState } from "../../common/interfaces/api-types";
import Paths from "../../common/paths";

export default class AppPage extends DataFetcherPage<AppPageState> {

    constructor(
        props: RouteComponentProps,
    ) {
        super(props, Paths.App.Root);
    }

    renderPage(): JSX.Element {
        const data = super.getData();

        if (!data) {
            return <span className="text-danger">Error fetching app page data</span>;
        }

        const DOCS_ICON = "book";
        const EDIT_ICON = "cog";
        return (
            <React.Fragment>
                <h2 className="d-flex font-weight-bold">
                    <a className="text-white" href={data.appUrls.app}>{data.appConfig.name}</a>
                    <div className="ml-auto"></div>
                    <button id="reload" className="btn btn-lg btn-outline-light"
                        title="Reload" data-placement="right"
                    >
                        <FontAwesomeIcon icon="sync-alt"/>
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
    }
}
