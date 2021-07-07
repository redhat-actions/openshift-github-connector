import {
  Button, Card, CardBody, CardTitle,
} from "@patternfly/react-core";
import { useContext, useState } from "react";

import ApiEndpoints from "../../common/api-endpoints";
import { ConnectorUserInfo } from "../../common/types/user-types";
import { ObjectTable } from "../components/object-table";
import { OpenShiftUserContext } from "../contexts";
import { fetchJSON } from "../util/client-util";

export function UserPage(): JSX.Element {

  const userContext = useContext(OpenShiftUserContext);

  const [ error, setError ] = useState<string>();
  const [ isLoggingOut, setIsLoggingOut ] = useState(false);

  return (
    <>
      <div className="d-flex justify-content-end">
        <div className="error">
          {error}
        </div>
        <div className="btn-line">
          <Button
            isDisabled={isLoggingOut}
            onClick={userContext.reload}
          >
            Refresh
          </Button>
          <Button
            isLoading={isLoggingOut}
            isDisabled={isLoggingOut}
            onClick={async () => {
              setIsLoggingOut(true);
              try {
                await fetchJSON("DELETE", ApiEndpoints.Auth.Login);
                window.location.reload();
              }
              catch (err) {
                setError(err);
              }
              finally {
                setIsLoggingOut(false);
              }
            }}>
            Log Out
          </Button>
        </div>
      </div>
      <div className="my-3"></div>
      <Card>
        <CardTitle>
          OpenShift User
        </CardTitle>
        <UserInfoCardBody userData={userContext.user} />
      </Card>
    </>
  );
}

function UserInfoCardBody({ userData }: { userData: ConnectorUserInfo }): JSX.Element {
  return (
    <>
      <CardBody>
        <ObjectTable label="User Info"
          obj={{
            Username: userData.name,
            "Connector Administrator": userData.isAdmin ? "Yes" : "No",
            "GitHub Username": userData.githubInfo?.name ?? "Not available",
          }}
        />
      </CardBody>
    </>
  );
}
