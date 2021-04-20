import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import {
  Button, Spinner, Table,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import ApiEndpoints from "../../../common/api-endpoints";
import ApiResponses from "../../../common/api-responses";
import DataFetcher from "../../components/data-fetcher";
import ClientPages, { ClientPage } from "../client-pages";

function getStatusCells(success: boolean, btnLabels: {
  failure: string,
  success: string,
}, btnLinks: {
  failure: ClientPage,
  success: ClientPage,
}) {

  const statusIcon = success
    ? <FontAwesomeIcon icon="check" className="text-success" />
    : <FontAwesomeIcon icon="times" className="text-danger" />;

  const btnLabel = success ? btnLabels.success : btnLabels.failure;
  const btnLink = success ? btnLinks.success : btnLinks.failure;

  return (
    <React.Fragment>
      <td>
        {statusIcon}
      </td>
      <td className="push-right">
        <Link to={btnLink.path}>
          <Button style={{ minWidth: "25ch" }}>
            {btnLabel}
          </Button>
        </Link>
      </td>
    </React.Fragment>
  );
}

export default function SetupHomePage() {
  // const unknown = <FontAwesomeIcon icon="question" className="text-warning" />;

  const tdLoadingDisplay = (
    <React.Fragment>
      <td>
        <FontAwesomeIcon icon="question" className="text-warning" />
      </td>
      <td className="push-right align-middle">
        <Spinner animation="border" variant="primary" style={{ height: "1em", width: "1em" }}/>
      </td>
    </React.Fragment>
  );

  return (
    <React.Fragment>
      <h1 className="text-center mb-5">Setup Status</h1>

      <div className="d-flex justify-content-center">
        <Table className="w-75 table-dark">
          <tbody>
            <tr>
              <td>App Bound</td>
              <DataFetcher type="api" endpoint={ApiEndpoints.App.Root} loadingDisplay={tdLoadingDisplay} >
                {
                  (data: ApiResponses.GitHubAppState) => {
                    return getStatusCells(data.app, {
                      failure: "Set up App",
                      success: "View App",
                    }, {
                      failure: ClientPages.SetupCreateApp,
                      success: ClientPages.App,
                    });
                  }
                }
              </DataFetcher>
            </tr>
            <tr>
              <td>Cluster connected</td>
              <DataFetcher type="api" endpoint={ApiEndpoints.Cluster.Root} loadingDisplay={tdLoadingDisplay}>
                {
                  (data: ApiResponses.ClusterState) => {
                    return getStatusCells(data.connected, {
                      failure: "View Error",
                      success: "View Cluster",
                    }, {
                      failure: ClientPages.Cluster,
                      success: ClientPages.Cluster,
                    });
                  }
                }
              </DataFetcher>
            </tr>
            {/* <tr>
              <td>Service Account Bound</td>
              <DataFetcher type="api" endpoint={ApiEndpoints.User.ServiceAccount} loadingDisplay={tdLoadingDisplay}>
                {
                  (data: ApiResponses.ServiceAccountState) => {
                    return getStatusCells(data.success, {
                      failure: "Create Service Account",
                      success: "View Service Account",
                    }, {
                      failure: ClientPages.SetupServiceAccount,
                      success: ClientPages.Cluster,
                    });
                  }
                }
              </DataFetcher>
            </tr> */}
          </tbody>
        </Table>
      </div>
    </React.Fragment>
  );
}
