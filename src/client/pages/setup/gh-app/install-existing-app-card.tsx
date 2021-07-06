import { useState } from "react";
import {
  Card, CardTitle, CardBody, Button,
} from "@patternfly/react-core";
import { ExternalLinkAltIcon } from "@patternfly/react-icons";
import {
  RowSelectVariant, TableComposable, Thead, Th, Tbody, Tr, Td,
} from "@patternfly/react-table";

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

export const USE_EXISTING_TITLE = "Install Existing App";

export function InstallExistingAppPage() {
  return (
    <InstallExistingAppCard />
  );
}

export function InstallExistingAppCard(): JSX.Element {

  const [ selectedApp, setSelectedApp ] = useState<ApiResponses.ExistingAppData>();

  return (
    <>
      <Card>
        <CardTitle>
          {USE_EXISTING_TITLE}
        </CardTitle>
        <CardBody>
          <DataFetcher type="api" endpoint={ApiEndpoints.App.Root} loadingDisplay="card-body">{
            (data: ApiResponses.ClusterAppState) => {
              if (!data.success) {
                return (
                  <p className="error">
                    There are no apps set up on this instance. An administrator must create a new app.
                  </p>
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
                            {/* <Td>
                              <img
                                style={{ width: appAvatarSize, height: appAvatarSize }}
                                // className="me-4"
                                src={app.avatarUrl}
                                alt={app.name + " avatar"}
                              />
                            </Td> */}
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
    return <>Select an app to proceed.</>;
  }

  return (
    <>
      <div className="my-4 centers">
        <Button isLarge disabled={isLoading} onClick={async () => {
          // if (props.selectedApp == null) {
          //   setError("No app selected");
          //   return;
          // }
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

/*
function InstallAppSection({ selectedApp }: { selectedApp: ApiResponses.ExistingAppData }): JSX.Element {
  const [ isLoading, setIsLoading ] = useState(false);
  const [ error, setError ] = useState<string>();

  const btnText = `Install ${selectedApp.name}`;

  const btnBody = (
    <BtnBody text={btnText} icon={CommonIcons.GitHub} iconClasses="text-black" isLoading={isLoading}/>
  );

  // if (props.selectedApp == null) {
  //   return (
  //     <Button isLarge disabled title="Select an app to proceed.">
  //       {btnBody}
  //     </Button>
  //   );
  // }

  const createdAt = new Date(selectedApp.created_at);
  const friendlyCreatedAt =

  return (
    <>
      <div className="center-y justify-content-center">
        <div className="center-y">

          <p>
             was created by <ExternalLink href={selectedApp.owner.html_url}>
              {selectedApp.owner.login}
            </ExternalLink>, {friendlyCreatedAt}.
          </p>
        </div>
      </div>

      <div className="mt-4 center-y justify-content-center">
        <Button isLarge disabled={isLoading} onClick={async () => {
          // if (props.selectedApp == null) {
          //   setError("No app selected");
          //   return;
          // }
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
          {btnBody}
        </Button>
      </div>
      <Banner display={error != null} severity="danger" title={error ?? ""} />
    </>
  );
}

*/
