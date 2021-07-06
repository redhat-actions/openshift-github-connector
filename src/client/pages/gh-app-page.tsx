import { useState } from "react";
import {
  Button,
  Title,
  ToggleGroup,
  ToggleGroupItem,
} from "@patternfly/react-core";
import classNames from "classnames";

import { BookIcon, UserIcon, UsersIcon } from "@patternfly/react-icons";
import AppPageCard from "../components/gh-app-page-card";
import DataFetcher from "../components/data-fetcher";
import ApiEndpoints from "../../common/api-endpoints";
import BtnBody from "../components/btn-body";
import ApiResponses from "../../common/api-responses";
import ClientPages from "./client-pages";
import { fetchJSON } from "../util/client-util";
import { ExternalLink } from "../components/external-link";
import { CommonIcons } from "../util/icons";

const DOCS_ICON = BookIcon;
const EDIT_ICON = CommonIcons.Configure;

type ViewType = "owner" | "user";

export default function GitHubAppPage() {
  return (
    <>
      <DataFetcher loadingDisplay="spinner" type="api" endpoint={ApiEndpoints.User.App}>
        {
          (data: ApiResponses.UserAppState, reload) => {
            return (
              <GitHubAppPageBody data={data} reload={reload} isSetup />
            );
          }
        }
      </DataFetcher>
    </>
  );
}

function GitHubAppPageBody({
  data, reload, isSetup,
}: {
  data: ApiResponses.UserAppState, reload: () => Promise<void>, isSetup: boolean,
}): JSX.Element {

  const [ viewType, setViewType ] = useState<ViewType>();

  if (!data.success) {
    return (
      <NoApp />
    );
  }

  if (!viewType) {
    if (data.installed) {
      setViewType("user");
    }
    if (data.owned) {
      setViewType("owner");
    }
  }

  return (
    <>
      <div className="center-y my-4">
        <Title headingLevel="h2" className="m-0">
          <ExternalLink href={data.appData.html_url}>
            {data.appData.name}
          </ExternalLink>
          {/* The app avatar can be fetched from /identicons/app/app/<slug> */}
        </Title>

        <div className="ms-auto"></div>

        <div className="btn-line even">
          <Button variant="danger" className={classNames({ "d-none": isSetup })} onClick={
            async () => {
              await fetchJSON<{}, void>("DELETE", ApiEndpoints.App.Root.path);
              await reload();
            }
          }>
            <BtnBody icon={CommonIcons.Delete} text="Unbind"/>
          </Button>
          <Button onClick={() => reload()}>
            <BtnBody icon={CommonIcons.Reload} text="Reload"/>
          </Button>
        </div>
      </div>

      <div className="my-3 center-y">
        <DataFetcher type="api" endpoint={ApiEndpoints.User.UserGitHubDetails} loadingDisplay="text">{
          (userRes: ApiResponses.GitHubUserDetailsResponse) => {
            return (
              <Title headingLevel="h4" className="d-flex">
                Logged in as&nbsp;<ExternalLink href={userRes.html_url}>{userRes.login}</ExternalLink>
              </Title>
            );
          }
        }
        </DataFetcher>
        <div className="ms-auto">
          {
            data.installed && data.owned ?
              <SwitchViewButton currentView={viewType} onSwitchViewType={(newViewType) => {
                setViewType(newViewType);
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
    </>
  );
}

function SwitchViewButton(props: { currentView: ViewType | undefined, onSwitchViewType: (newViewType: ViewType) => void }): JSX.Element {

  const isOwnerActive = props.currentView === "owner";
  const isUserActive = !isOwnerActive;

  return (
    <ToggleGroup>
      <ToggleGroupItem text="View as owner"
        icon={<UserIcon />}
        onChange={() => props.onSwitchViewType("owner")}
        isSelected={isOwnerActive}
      />
      <ToggleGroupItem text="View as user"
        icon={<UsersIcon />}
        onChange={() => props.onSwitchViewType("user")}
        isSelected={isUserActive}
      />
    </ToggleGroup>
  );
}

function AppOwnerCards(props: ApiResponses.UserOwnedAppData): JSX.Element {
  return (
    <>
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
        href: props.ownerUrls.ownerInstallations,
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
    </>
  );
}

function AppInstalledCards(props: ApiResponses.UserAppInstalledData): JSX.Element {

  return (
    <>
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
    </>
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
    <>
      <p>A GitHub App has not yet been added to the connector.</p>
      <h2 className="my-3">
        <a href={ClientPages.SetupIndex.path}>Go to the Setup</a>
      </h2>
      {/* <p>You will be redirected in {countdown} ...</p> */}
    </>
  );
}
