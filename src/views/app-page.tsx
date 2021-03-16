import React from "react";
import { GitHubAppUrls } from "../lib/gh-app/app";
import { GitHubAppConfigNoSecrets } from "../lib/gh-app/app-config";
import AppPageCard from "./components/app-page-card";
import Layout from "./components/layout";
import LinkButton from "./components/link-btn";

export type AppPageProps = {
    appConfig: GitHubAppConfigNoSecrets,
    appUrls: GitHubAppUrls,
    installations: any,
    repositories: any,
};

export default function appPage(props: AppPageProps): JSX.Element {
    const DOCS_ICON = "fa-book";
    const EDIT_ICON = "fa-cog";

    return (
        <Layout>
            <h2 className="d-flex font-weight-bold">
                <a className="text-white" href={props.appUrls.app}>{props.appConfig.name}</a>
                <div className="ml-auto"></div>
                <button id="reload" className="btn btn-lg btn-outline-light"
                    title="Reload" data-placement="right"
                >
                    <i className="fas fa-sync-alt ml-auto"/>
                </button>
            </h2>
            <AppPageCard header="Permissions" buttons={
                <React.Fragment>
                    {<LinkButton
                        href="https://docs.github.com/en/developers/apps/creating-a-github-app-using-url-parameters#github-app-permissions"
                        icon={DOCS_ICON}
                        label="Docs"
                        tooltip="GitHub Documentation"
                    />}
                    {<LinkButton
                        href={props.appUrls.permissions}
                        icon={EDIT_ICON}
                        label="Edit"
                        tooltip="Edit Permissions"
                    />}
                </React.Fragment>
            }>
                <ul>
                    {Object.entries(props.appConfig.permissions).map(([ key, value ]) => {
                        return (
                            <li key={key}>{key}: {value}</li>
                        );
                    })}
                </ul>
            </AppPageCard>
            <AppPageCard header="Event Subscriptions" buttons={
                <React.Fragment>
                    {<LinkButton
                        href="https://docs.github.com/en/developers/apps/creating-a-github-app-using-url-parameters#github-app-webhook-events"
                        icon={DOCS_ICON}
                        label="Docs"
                        tooltip="GitHub Documentation"
                    />}
                    {<LinkButton
                        href={props.appUrls.permissions}
                        icon={EDIT_ICON}
                        label="Edit"
                        tooltip="Edit Events"
                    />}
                </React.Fragment>
            }>
                <ul>
                    {props.appConfig.events.map((event) => <li key={event}>{event}</li>)}
                </ul>
            </AppPageCard>
            <AppPageCard header="Installations" buttons={
                <React.Fragment>
                    {<LinkButton
                        href={props.appUrls.install}
                        icon={EDIT_ICON}
                        label="Install or Uninstall"
                        tooltip="Install or Uninstall"
                    />}
                </React.Fragment>
            }>
                <ul>
                    {props.installations.map((installation: any) => {
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
            <AppPageCard header="Repositories" buttons={
                <React.Fragment>
                    {<LinkButton
                        href={props.appUrls.installationSettings}
                        icon={EDIT_ICON}
                        label="Edit Installation"
                        tooltip="Edit Installation"
                    />}
                </React.Fragment>
            }>
                <ul>
                    {props.repositories.map((repo: any) => {
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
        </Layout>
    );
}
