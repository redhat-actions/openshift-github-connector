import {
  Button, Card, CardBody, CardTitle,
} from "@patternfly/react-core";
import { Link } from "react-router-dom";
import ApiEndpoints from "../../common/api-endpoints";
import ApiResponses from "../../common/api-responses";
import DataFetcher from "../components/data-fetcher";
import { ObjectTable } from "../components/object-table";
import ClientPages from "./client-pages";

export function UserPage(): JSX.Element {

  return (
    <>
      <div className="d-flex justify-content-end">
        <div className="">
          <Button>
            Log Out
          </Button>
        </div>
      </div>
      <div className="my-3"></div>
      <DataFetcher type="api" endpoint={ApiEndpoints.User.Root}>{
        (userData: ApiResponses.UserResponse) => {
          if (!userData.success) {
            return (
              <p>
                {userData.message}
              </p>
            );
          }

          return (
            <>
              <Card>
                <CardTitle>
                  OpenShift User
                </CardTitle>
                <OpenShiftUserInfoCardBody userData={userData} />
              </Card>

              <Card>
                <CardTitle>
                  GitHub User
                </CardTitle>
                <GitHubUserInfoCardBody userData={userData} />
              </Card>
            </>
          );
        }
      }
      </DataFetcher>
    </>
  );
}

function OpenShiftUserInfoCardBody({ userData }: { userData: ApiResponses.User }): JSX.Element {
  return (
    <>
      <CardBody>
        <ObjectTable label="User Info"
          obj={{
            Username: userData.name,
            "Connector Administrator": userData.isAdmin ? "Yes" : "No",
          }}
        />
      </CardBody>
    </>
  );
}

function GitHubUserInfoCardBody({ userData }: { userData: ApiResponses.User }): JSX.Element {
  if (!userData.githubUserInfo) {
    return (
      <CardBody>
        <p>
          No GitHub info for this user.
        </p>
        <p>
          Sign in with GitHub though the <Link to={ClientPages.SetupCreateApp.path}>App Setup page</Link>.
        </p>
      </CardBody>
    );
  }

  return (
    <>
      <CardBody>
        GitHub {userData.githubUserInfo.type}: <span className="b">{userData.githubUserInfo.name}</span>
      </CardBody>
    </>
  );
}
