import {
  Button, Card, CardBody, CardTitle,
} from "@patternfly/react-core";
import { SignOutAltIcon } from "@patternfly/react-icons";
import { useContext, useState } from "react";
import { useHistory } from "react-router-dom";

import ApiEndpoints from "../../common/api-endpoints";
import { joinList } from "../../common/common-util";
import { ConnectorUserInfo } from "../../common/types/user-types";
import BtnBody from "../components/btn-body";
import { NewTabLink } from "../components/external-link";
import { ObjectTable } from "../components/object-table";
import { ConnectorUserContext } from "../contexts";
import { fetchJSON } from "../util/client-util";
import { CommonIcons } from "../util/icons";

export function UserPage(): JSX.Element {

  const userContext = useContext(ConnectorUserContext);
  const history = useHistory();

  const [ error, setError ] = useState<string>();
  const [ isLoggingOut, setIsLoggingOut ] = useState(false);

  return (
    <>
      <Card>
        <CardTitle>
          <div>
            User Info
          </div>
          <div className="btn-line">
            <Button
              isDisabled={isLoggingOut}
              onClick={userContext.reload}
            >
              <BtnBody icon={CommonIcons.Reload} text="Reload" />
            </Button>
            <Button
              isLoading={isLoggingOut}
              isDisabled={isLoggingOut}
              onClick={async () => {
                setIsLoggingOut(true);
                try {
                  await fetchJSON("DELETE", ApiEndpoints.Auth.Login);
                  history.go(0);
                }
                catch (err: any) {
                  setError(err.message);
                }
                finally {
                  setIsLoggingOut(false);
                }
              }}>
              <BtnBody icon={SignOutAltIcon} text="Log Out" isLoading={isLoggingOut} />
            </Button>
          </div>
        </CardTitle>
        <div className="error">
          {error}
        </div>
        <UserInfoCardBody userData={userContext.user} />
      </Card>
    </>
  );
}

function UserInfoCardBody({ userData }: { userData: ConnectorUserInfo }): JSX.Element {
  return (
    <>
      <CardBody>
        <ObjectTable label="OpenShift User" className="mb-4"
          obj={{
            Username: userData.name,
            "Connector Administrator": userData.isAdmin ? "Yes" : "No",
          }}
        />

        <ObjectTable label="GitHub User" className="mb-4"
          obj={{
            "GitHub Username": userData.githubInfo?.name ?? "Not available",
            "Owns GitHub App": userData.ownsAppIds.length > 0
              ? joinList(userData.ownsAppIds.map((n) => n.toString())) : "None",
          }}
        />

        <ObjectTable label="GitHub App Installation"
          obj={{
            "Installed GitHub App": userData.githubInstallationInfo?.installedApp.name ?? "None",
            "Installation ID": userData.githubInstallationInfo ?
              <NewTabLink href={userData.githubInstallationInfo.installation.html_url}>
                {userData.githubInstallationInfo.installation.id}
              </NewTabLink>
              : "None",
          }}
        />
      </CardBody>
    </>
  );
}
