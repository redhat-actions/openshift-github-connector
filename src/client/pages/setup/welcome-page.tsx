import React from "react";
import {
  Card, CardTitle, CardBody,
} from "@patternfly/react-core";
import { Table } from "@patternfly/react-table";

import ApiEndpoints from "../../../common/api-endpoints";
import ApiResponses from "../../../common/api-responses";
import DataFetcher from "../../components/data-fetcher";
import SetupPageHeader from "./setup-header";

export default function WelcomePage(): JSX.Element {
  return (
    <React.Fragment>
      <SetupPageHeader pageIndex={0} canProceed={true} />
      <Card isLarge>
        <CardTitle>
          Welcome to the OpenShift GitHub Actions Connector
        </CardTitle>
        <CardBody>
          <p className="b">
            This wizard will walk you through connecting this OpenShift cluster to your GitHub Actions.
          </p>
          <ul>
            <li>Install and Configure OpenShift Clusters for use with Red Hat Actions</li>
            <li>Add and configure Red Hat actions in your repositories</li>
            <li>Manage OpenShift self-hosted Runners</li>
          </ul>

          <p>
          Click <b>Next</b> in the banner above to get started.
          </p>

          <div className="d-flex">
            <div className="ml-auto">
              <b>Backend status:&nbsp;</b>
              <DataFetcher type="api" endpoint={ApiEndpoints.Health}>
                {(data: ApiResponses.Result) => (
                  <React.Fragment>
                    <span className={data.message === "OK" ? "text-success" : "text-danger"}>
                      {data.message}
                    </span>
                  </React.Fragment>
                )}
              </DataFetcher>
            </div>
          </div>
        </CardBody>

        {/* <div className="row justify-content-center">
          <Link to={getSetupSteps()[0].path}>
            <Button className="btn-primary btn-lg d-flex align-items-center mt-3 px-5">
              <div className="font-weight-bold align-self-center" title="Get Started">
                Get Started
              </div>
              <FontAwesomeIcon icon="long-arrow-alt-right" className="ml-3" style={{ fontSize: "1.5em" }}/>
            </Button>
          </Link>
        </div> */}

      </Card>
      <Card>
        <CardBody>
          <DataFetcher type="api" endpoint={ApiEndpoints.Cluster.Root} loadingDisplay="card-body">
            {(data: ApiResponses.ClusterState) => (
              <Table>
                <tr>
                  <td className="b">Cluster API Server:</td>
                  <td className={data.connected ? "text-success" : "text-danger"}>
                    {data.connected ? data.clusterInfo.externalServer : "Error"}
                  </td>
                </tr>
                <tr>
                  <td className="b">Namespace:</td>
                  <td className={data.connected ? "text-success" : "text-danger"}>
                    {data.connected ? data.namespace : "Error"}
                  </td>
                </tr>
                <tr>
                  <td className="b">User:</td>
                  <td className={data.connected ? "text-success" : "text-danger"}>
                    {data.connected ? data.clusterInfo.user.name : "Error"}
                  </td>
                </tr>
                <tr>
                  <td className="b">Service Account Name:</td>
                  <td className={data.connected ? "text-success" : "text-danger"}>
                    {data.connected ? data.serviceAccountName : "Error"}
                  </td>
                </tr>
              </Table>
            )}
          </DataFetcher>
        </CardBody>
      </Card>

    </React.Fragment>
  );
}
