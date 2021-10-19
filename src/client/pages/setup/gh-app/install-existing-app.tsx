import {
  Button, Card, CardBody, CardTitle,
} from "@patternfly/react-core";
import { ExternalLinkAltIcon } from "@patternfly/react-icons";
import {
  RowSelectVariant, TableComposable, Tbody, Td, Th, Thead, Tr,
} from "@patternfly/react-table";
import { useContext, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import ApiEndpoints from "../../../../common/api-endpoints";
import ApiRequests from "../../../../common/api-requests";
import ApiResponses from "../../../../common/api-responses";
import { getFriendlyDateTime } from "../../../../common/common-util";
import BtnBody from "../../../components/btn-body";
import { NewTabLink } from "../../../components/external-link";
import { ConnectorUserContext } from "../../../contexts";
import { fetchJSON } from "../../../util/client-util";
import { CommonIcons } from "../../../util/icons";
import { getSetupPagePath } from "../setup";

export const RELOAD_APPS_SEARCH = "reload-apps";

export const USE_EXISTING_TITLE = "Install Existing GitHub App";

// export function InstallExistingAppPage() {
//   return (
//     <InstallExistingAppCard />
//   );
// }

export function InstallExistingAppCard(
  { appState, reloadAppState }:
  { appState: ApiResponses.AllConnectorApps, reloadAppState: () => void }
): JSX.Element {

  const { user } = useContext(ConnectorUserContext);
  const history = useHistory();

  const { search } = useLocation();
  if (search.includes(RELOAD_APPS_SEARCH)) {
    history.replace({ search: search.replace(RELOAD_APPS_SEARCH, "") });
    reloadAppState();
  }

  const [ selectedApp, setSelectedApp ] = useState<ApiResponses.ExistingAppData>();

  let headerMsg;

  if (user.githubInstallationInfo) {
    headerMsg = (
      <p>
        {CommonIcons.Warning} You have already installed <NewTabLink href={user.githubInstallationInfo.installedApp.html_url}>
          {user.githubInstallationInfo.installedApp.name}
        </NewTabLink>.
      Installing an app below will override the existing installation.
      </p>
    );
  }
  else if (user.isAdmin) {
    headerMsg = <>
      <p>
      Since you have already created an app, you can simply exit the set up and let others start using the connector.
      </p>
      <p>
      However, the connector&apos;s features will not be available to you personally until you install the app on a GitHub account or organization.
      </p>
    </>;
  }
  else {
    headerMsg = (
      <>
        <p>
          The following GitHub Apps have been created on this cluster.
        </p>
        <p>
          Install one of these apps on your GitHub account or organization, so the connector may take actions on your behalf in GitHub.
        </p>
      </>
    );
  }

  if (!appState.success || !appState.doesAnyAppExist) {
    return (
      <>
        <p className="error">
          There are no apps set up on this instance. An administrator must create a new app.
        </p>
        <p>
          {user.isAdmin ?
            <div className="centers">
              <Button isLarge onClick={() => history.push(getSetupPagePath("SETUP_APP"))}>
                Set GitHub App
              </Button>
            </div>
            : "Contact an administrator to set up an app so the Connector can be used."
          }
        </p>
      </>
    );
  }

  if (selectedApp == null && appState.visibleApps.length === 1) {
    setSelectedApp(appState.visibleApps[0]);
  }

  return (
    <>
      <Card>
        <CardTitle>
          {USE_EXISTING_TITLE}
        </CardTitle>
        <CardBody>
          {headerMsg}
          <>
            <TableComposable aria-label="Available Apps">

              <Thead>
                <Tr>
                  <Th></Th>
                  {/* <Th></Th> */}
                  <Th>Name</Th>
                  <Th>Owner</Th>
                  <Th>Creation Date</Th>
                  <Th></Th>
                </Tr>
              </Thead>

              <Tbody>
                {
                  appState.visibleApps.map((app, i) => (
                    <Tr selected={app.appId === selectedApp?.appId} key={i}>
                      <Td
                        select={{
                          rowIndex: i,
                          onSelect: (e, isSelected, rowIndex) => {
                            setSelectedApp(appState.visibleApps[rowIndex]);
                          },
                          isSelected: app.appId === selectedApp?.appId,
                          // disable: i === 1,
                          variant: RowSelectVariant.radio,
                        }}>
                      </Td>
                      <Td>{app.name}</Td>
                      <Td>{app.owner.login}</Td>
                      <Td>{getFriendlyDateTime(new Date(app.created_at), true)}</Td>
                      <Td><NewTabLink href={app.appUrl} key={app.appId} icon={{ Icon: ExternalLinkAltIcon, position: "left" }} /></Td>
                    </Tr>
                  ))
                }
              </Tbody>
            </TableComposable>
            <div className="my-3"></div>

            <ProceedSection selectedApp={selectedApp} />
          </>
        </CardBody>
      </Card>
    </>
  );
}

function ProceedSection({ selectedApp }: { selectedApp?: ApiResponses.ExistingAppData}): JSX.Element {

  const [ isLoading, setIsLoading ] = useState(false);

  if (!selectedApp) {
    return <p>Select an app to proceed.</p>;
  }

  return (
    <>
      <div className="my-4 centers">
        <Button isLarge disabled={isLoading} onClick={async () => {
          setIsLoading(true);
          try {
            await fetchJSON<ApiRequests.PreInstallApp, void>("POST", ApiEndpoints.Setup.PreInstallApp, { appId: selectedApp.appId });
            window.location.href = selectedApp.newInstallationUrl;
          }
          finally {
            await new Promise((resolve) => setTimeout(resolve, 500));
            setIsLoading(false);
          }
        }}>
          <BtnBody text={"Install " + selectedApp.name} icon={CommonIcons.GitHub} iconClasses="text-black" isLoading={isLoading}/>
        </Button>
      </div>
    </>
  );
}
