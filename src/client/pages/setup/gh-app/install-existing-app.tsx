import { useContext, useState } from "react";
import {
  Card, CardTitle, CardBody, Button,
} from "@patternfly/react-core";
import { ExternalLinkAltIcon } from "@patternfly/react-icons";
import {
  RowSelectVariant, TableComposable, Thead, Th, Tbody, Tr, Td,
} from "@patternfly/react-table";
import { useHistory } from "react-router-dom";

import ApiEndpoints from "../../../../common/api-endpoints";
import ApiResponses from "../../../../common/api-responses";
import DataFetcher from "../../../components/data-fetcher";
import { ExternalLink } from "../../../components/external-link";
import { getFriendlyDateTime } from "../../../../common/common-util";
import ApiRequests from "../../../../common/api-requests";
import { fetchJSON } from "../../../util/client-util";
import { CommonIcons } from "../../../util/icons";
import BtnBody from "../../../components/btn-body";
import Banner from "../../../components/banner";
import { OpenShiftUserContext } from "../../../contexts";
import { getSetupPagePath } from "../setup";

export const USE_EXISTING_TITLE = "Install Existing App";

export function InstallExistingAppPage() {
  return (
    <InstallExistingAppCard />
  );
}

export function InstallExistingAppCard(): JSX.Element {

  const { user } = useContext(OpenShiftUserContext);
  const history = useHistory();

  const [ selectedApp, setSelectedApp ] = useState<ApiResponses.ExistingAppData>();

  return (
    <>
      <Card>
        <CardTitle>
          {USE_EXISTING_TITLE}
        </CardTitle>
        <CardBody>
          <DataFetcher type="api" endpoint={ApiEndpoints.User.UserGitHub} loadingDisplay="none">{
            (res: ApiResponses.UserResponse) => {
              if (!res.success || !res.githubInstallationInfo) {
                return <></>;
              }

              return (
                <>
                  <p>
                    {CommonIcons.Warning} You have already installed <ExternalLink href={res.githubInstallationInfo.app.html_url}>
                      {res.githubInstallationInfo.app.name}
                    </ExternalLink>.
                    Installing an app below will override the existing installation.
                  </p>
                </>
              );
            }
          }
          </DataFetcher>

          <DataFetcher type="api" endpoint={ApiEndpoints.App.Root} loadingDisplay="card-body">{
            (data: ApiResponses.ClusterAppState) => {
              if (!data.success) {
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

              /*
              if (data.visibleApps.length === 1) {
                setSelectedApp(data.visibleApps[0]);
              }
              */

              // const appAvatarSize = "2em";

              return (
                <>
                  {/* <p>
                    Select an existing app:
                  </p> */}

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
                        data.visibleApps.map((app, i) => (
                          <Tr selected={app.appId === selectedApp?.appId} key={i}>
                            <Td
                              select={{
                                rowIndex: i,
                                onSelect: (e, isSelected, rowIndex) => {
                                  setSelectedApp(data.visibleApps[rowIndex]);
                                },
                                isSelected: app.appId === selectedApp?.appId,
                                // disable: i === 1,
                                variant: RowSelectVariant.radio,
                              }}>
                            </Td>
                            <Td>{app.name}</Td>
                            <Td>{app.owner.login}</Td>
                            <Td>{getFriendlyDateTime(new Date(app.created_at), true)}</Td>
                            <Td><ExternalLink href={app.appUrl} key={app.appId} icon={{ Icon: ExternalLinkAltIcon, position: "left" }} /></Td>
                          </Tr>
                        ))
                      }
                    </Tbody>
                  </TableComposable>
                  <div className="my-3"></div>

                  <ProceedSection selectedApp={selectedApp} />
                </>
              );
            }
          }
          </DataFetcher>
        </CardBody>
      </Card>
    </>
  );
}

function ProceedSection({ selectedApp }: { selectedApp?: ApiResponses.ExistingAppData}): JSX.Element {

  const [ isLoading, setIsLoading ] = useState(false);
  const [ error, setError ] = useState<string | undefined>();

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
          catch (err) {
            setError(err.message);
          }
          finally {
            await new Promise((resolve) => setTimeout(resolve, 500));
            setIsLoading(false);
          }
        }}>
          <BtnBody text={"Install " + selectedApp.name} icon={CommonIcons.GitHub} iconClasses="text-black" isLoading={isLoading}/>
        </Button>
      </div>
      <Banner display={error != null} severity="danger" title={error ?? ""} />
    </>
  );
}
