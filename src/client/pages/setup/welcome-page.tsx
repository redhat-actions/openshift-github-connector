import React from "react";
import { Card, Jumbotron } from "react-bootstrap";
import ApiEndpoints from "../../../common/api-endpoints";
import ApiResponses from "../../../common/api-responses";
import DataFetcher from "../../components/data-fetcher";
import SetupPageHeader from "./setup-header";

export default function WelcomePage(): JSX.Element {
  return (
    <React.Fragment>
      <SetupPageHeader pageIndex={0} canProceed={true} />
      <Jumbotron>
        <h2>Welcome to the OpenShift GitHub Actions Connector</h2>
        <hr />
        <h5 className="my-3">
          This wizard will walk you through connecting this OpenShift cluster to your GitHub Actions.
        </h5>
        <ul>
          <li>Install and Configure OpenShift Clusters for use with Red Hat Actions</li>
          <li>Manage, modify and configure Red Hat actions in your repositories</li>
          <li>Manage OpenShift GitHub Runners</li>
        </ul>

        <p>
          Click <b>Next</b> in the banner above to get started.
        </p>

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

      </Jumbotron>
      <Card>
        <Card.Body>
          <div className="d-flex">
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
          <h5 className="mt-4 b">Cluster info:</h5>
          <div className="">
            <div className="d-flex mt-2">
              <b>Namespace:&nbsp;</b>
              <DataFetcher type="api" endpoint={ApiEndpoints.Cluster.Root}>
                {(data: ApiResponses.ClusterState) => (
                  <React.Fragment>
                    <span className={data.connected ? "text-success" : "text-danger"}>
                      {data.connected ? data.namespace : "Error"}
                    </span>
                  </React.Fragment>
                )}
              </DataFetcher>
            </div>
            <div className="d-flex mt-2">
              <b>User:&nbsp;</b>
              <DataFetcher type="api" endpoint={ApiEndpoints.Cluster.Root}>
                {(data: ApiResponses.ClusterState) => (
                  <React.Fragment>
                    <span className={data.connected ? "text-success" : "text-danger"}>
                      {data.connected ? data.clusterInfo.user.name : "Error"}
                    </span>
                  </React.Fragment>
                )}
              </DataFetcher>
            </div>
            <div className="d-flex mt-2">
              <b>Service Account Name:&nbsp;</b>
              <DataFetcher type="api" endpoint={ApiEndpoints.Cluster.Root}>
                {(data: ApiResponses.ClusterState) => (
                  <React.Fragment>
                    <span className={data.connected ? "text-success" : "text-danger"}>
                      {data.connected ? data.serviceAccountName : "Error"}
                    </span>
                  </React.Fragment>
                )}
              </DataFetcher>
            </div>

          </div>
        </Card.Body>
      </Card>

    </React.Fragment>
  );
}
