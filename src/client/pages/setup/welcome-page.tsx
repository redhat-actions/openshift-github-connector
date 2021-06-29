import React from "react";
import {
  Card, CardTitle, CardBody,
} from "@patternfly/react-core";

import ApiEndpoints from "../../../common/api-endpoints";
import ApiResponses from "../../../common/api-responses";
import DataFetcher from "../../components/data-fetcher";
import SetupPageHeader from "./setup-header";
import { ObjectTable } from "../../components/object-table";

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
        <CardTitle>
          Cluster Info
        </CardTitle>
        <CardBody>
          <DataFetcher type="api" endpoint={ApiEndpoints.Cluster.Root} loadingDisplay="card-body">
            {(data: ApiResponses.ClusterState) => {
              if (!data.connected) {
                return (
                  <>
                    <p className="error">
                      Disconnected!
                    </p>
                    <p className="error">
                      {data.error}
                    </p>
                  </>
                );
              }

              return (
                <>
                  <ObjectTable
                    label="Cluster Info"
                    obj={{
                      // "Cluster Name": data.clusterInfo.name,
                      // "API Server": data.clusterInfo.externalServer,
                      "External API Server": data.clusterInfo.externalServer,
                      Namespace: data.namespace,
                      User: data.clusterInfo.user.name,
                      "Service Account Name": data.serviceAccountName,
                    }} />
                </>
              );
            }}
          </DataFetcher>
        </CardBody>
      </Card>

    </React.Fragment>
  );
}
