import React, { useState } from "react";
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

const DOCS_ICON = "book";
const EDIT_ICON = "cog";

type ViewType = "owner" | "user";

export default function GitHubAppPage() {
  const isSetup = getSearchParam(SETUP_QUERYPARAM) != null;

  return (
    <React.Fragment>
      {
        isSetup ? <SetupPageHeader pageIndex={2} canProceed={true}/> : <></>
      }
      <DataFetcher loadingDisplay="spinner" type="api" endpoint={ApiEndpoints.App.Root}>
        {
          (data: ApiResponses.GitHubAppState, reload) => {
            console.log("RENDER OUTER");
            return (
              <GitHubAppPageBody data={data} reload={reload} isSetup />
            );
          }
        }
      </DataFetcher>
    </React.Fragment>
  );
}

function GitHubAppPageBody({
  data, reload, isSetup,
}: {
  data: ApiResponses.GitHubAppState, reload: () => Promise<void>, isSetup: boolean,
}): JSX.Element {
  if (!data.success) {
    return (
      <NoApp />
    );
  }

  const [ viewType, setViewType ] = useState<ViewType>();

  if (!viewType) {
    if (data.installed) {
      setViewType("user");
    }
    if (data.owned) {
      setViewType("owner");
    }
  }

  return (
    <React.Fragment>
      <div className="d-flex align-items-center my-4">
        <h2 className="m-0">
          <ExternalLink className="text-light" href={data.appData.html_url}>
            {data.appData.name}
          </ExternalLink>
          {/* The app avatar can be fetched from /identicons/app/app/<slug> */}
        </h2>

        <div className="ml-auto"></div>

        <div className="btn-line even">
          <Button variant="danger" className={classNames({ "d-none": isSetup })} onClick={
            async () => {
              await fetchJSON<{}, void>("DELETE", getEndpointUrl(ApiEndpoints.App.Root.path));
              await reload();
            }
          }>
            <BtnBody icon="times" text="Unbind"/>
          </Button>
          <Button onClick={() => reload()}>
            <BtnBody icon="sync-alt" text="Refresh"/>
          </Button>
        </div>
      </div>

      <div className="my-3 d-flex align-items-center">
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
        <div className="ml-auto">
          {
            data.installed && data.owned ?
              <SwitchViewButton currentView={viewType} onSwitchViewType={(newViewType) => {
                setViewType(newViewType);
                console.log("NEW VIEW TYPE " + newViewType);
              }}/>
              : ("")
          }
        </div>
      </div>

      {
        viewType === "owner" && data.owned ? <AppOwnerCards {...data.ownedAppData} /> : ("")
      }
      {
        viewType === "user" && data.installed ? <AppInstalledCards {...data.installedAppData} /> : ("")
      }
    </React.Fragment>
  );
}

function SwitchViewButton(props: { currentView: ViewType | undefined, onSwitchViewType: (newViewType: ViewType) => void }): JSX.Element {

  const isOwnerActive = props.currentView === "owner";
  const isUserActive = !isOwnerActive;

  return (
    <div className="btn-line">
      <Button variant="info" active={isOwnerActive} onClick={() => props.onSwitchViewType("owner")} className="mr-2">
        <BtnBody text="View as owner" />
      </Button>
      <Button variant="info" active={isUserActive} onClick={() => props.onSwitchViewType("user")}>
        <BtnBody text="View as user" />
      </Button>
    </div>
  );
}

function AppOwnerCards(props: ApiResponses.GitHubAppOwnedData): JSX.Element {
  return (
    <React.Fragment>
      <AppPageCard header="App Permissions" buttons={[{
        href: "https://docs.github.com/en/developers/apps/creating-a-github-app-using-url-parameters#github-app-permissions",
        icon: DOCS_ICON,
        text: "Docs",
      }, {
        href: props.ownerUrls.permissions,
        icon: EDIT_ICON,
        text: "Edit",
      }]}>
        <ul>
          {Object.entries(props.appConfig.permissions).map(([ key, value ]) => {
            return (
              <li key={key}><b>{key}</b>: {value}</li>
            );
          })}
        </ul>
      </AppPageCard>
      <AppPageCard header="App Event Subscriptions" buttons={[{
        href: "https://docs.github.com/en/developers/apps/creating-a-github-app-using-url-parameters#github-app-webhook-events",
        icon: DOCS_ICON,
        text: "Docs",
      }, {
        href: props.ownerUrls.permissions,
        icon: EDIT_ICON,
        text: "Edit",
      }]}>
        <ul>
          {props.appConfig.events.map((event) => <li key={event}>{event}</li>)}
        </ul>
      </AppPageCard>
      <AppPageCard header="User Installations" buttons={[{
        href: props.ownerUrls.installations,
        icon: EDIT_ICON,
        text: "Manage Installations",
      }]}>
        <ul>
          {props.installations.map((installation) => {
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
}

function AppInstalledCards(props: ApiResponses.GitHubAppInstalledData): JSX.Element {

  return (
    <React.Fragment>
      <AppPageCard header="Enabled Repositories" buttons={[{
        href: props.installUrls.installationSettings,
        icon: EDIT_ICON,
        text: "Edit Installation",
      }]}>
        <ul>
          {props.repos.map((repo) => {
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
    </React.Fragment>
  );
}

function NoApp(): JSX.Element {

  /*
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
  */

  return (
    <React.Fragment>
      <p>A GitHub App has not yet been added to the connector.</p>
      <h2 className="my-3">
        <a href={ClientPages.SetupCreateApp.path}>Create an App</a>
      </h2>
      {/* <p>You will be redirected in {countdown} ...</p> */}
    </React.Fragment>
  );
}
