import React, { useState } from "react";
import {
  Button, Card, CardTitle, CardBody,
} from "@patternfly/react-core";

import ApiEndpoints from "../../../../common/api-endpoints";
import ApiRequests from "../../../../common/api-requests";
import ApiResponses from "../../../../common/api-responses";
import { fetchJSON } from "../../../util/client-util";
import Banner from "../../../components/banner";
import DataFetcher from "../../../components/data-fetcher";
import { ExternalLink } from "../../../components/external-link";
import { getFriendlyDateTime } from "../../../../common/common-util";
import BtnBody from "../../../components/btn-body";
import { CommonIcons } from "../../../util/icons";

export const USE_EXISTING_TITLE = "Use Existing App";

export default function InstallExistingAppCard(): JSX.Element {

  const [ selectedApp, setSelectedApp ] = useState<ApiResponses.ExistingAppData>();

  return (
    <React.Fragment>
      <Card>
        <CardTitle>
          {USE_EXISTING_TITLE}
        </CardTitle>
        <CardBody>
          <DataFetcher type="api" endpoint={ApiEndpoints.App.Existing} loadingDisplay="card-body">{
            (data: ApiResponses.AllAppsState) => {
              if (!data.success || data.totalCount === 0) {
                return (
                  <p>
                    There are no apps set up on this instance. You must create a new app.
                  </p>
                );
              }

              if (data.visibleApps.length === 1) {
                setSelectedApp(data.visibleApps[0]);
              }

              return (
                <React.Fragment>
                  {/* <p>
                    Select an existing app:
                  </p> */}

                  <div className="d-flex align-items-center justify-content-center">
                    {/* <ListGroup className="w-50">
                      {data.visibleApps.map((app) => {
                        const active = selectedApp != null && selectedApp.appId === app.appId;

                        return (
                          <ListGroup.Item
                            key={app.appId}
                            onClick={() => setSelectedApp(app)}
                            active={active}
                            className="bg-darker clickable d-flex justify-content-between align-items-center border-light"
                          >
                            <input type="radio" checked={active} />
                            <div>
                              {app.name}
                            </div>
                            <div className="ml-auto">
                              <ExternalLink className="text-reset" href={app.appUrl}>
                                <FontAwesomeIcon icon={"external-link-alt"} fixedWidth />
                              </ExternalLink>
                            </div>
                          </ListGroup.Item>
                        );
                      })}
                    </ListGroup> */}
                  </div>
                  {
                    selectedApp != null ? (<InstallAppSection selectedApp={selectedApp} />) : (<p className="error">No app selected</p>)
                  }
                </React.Fragment>
              );
            }
          }
          </DataFetcher>

        </CardBody>
      </Card>
    </React.Fragment>
  );
}

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
  const friendlyCreatedAt = getFriendlyDateTime(createdAt, true);
  const appAvatarSize = "3rem";

  return (
    <React.Fragment>
      <div className="d-flex align-items-center justify-content-center">
        <div className="d-flex align-items-center">
          <img style={{ width: appAvatarSize, height: appAvatarSize }}
            className="mr-4"
            src={selectedApp.avatarUrl}
            alt={selectedApp.name + " avatar"}
          />
          <p>
            <ExternalLink href={selectedApp.appUrl}>
              {selectedApp.name}
            </ExternalLink> was created by <ExternalLink href={selectedApp.owner.html_url}>
              {selectedApp.owner.login}
            </ExternalLink>, {friendlyCreatedAt}.
          </p>
        </div>
      </div>

      <div className="mt-4 d-flex align-items-center justify-content-center">
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
    </React.Fragment>
  );
}
