import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Button, Jumbotron } from "react-bootstrap";
import { Link } from "react-router-dom";
import ApiEndpoints from "../../common/api-endpoints";
import ApiResponses from "../../common/api-responses";
import DataFetcher from "../components/data-fetcher";
import { getSetupSteps } from "./setup/setup-header";

export default function Homepage(): JSX.Element {
  return (
    <React.Fragment>
      <Jumbotron className="text-black">
        <h2 className="text-center">OpenShift GitHub Actions Connector</h2>
        <h5 className="text-center">
          OpenShift GitHub Actions Connector is designed to help you work seamlessly with
          Red Hat Developer tools and Openshift clusters.
        </h5>
        <hr className="my-4" />
        <p>
          This application can access your your GitHub org or personal account
          and authenticate against Openshift to enable default integrations.
        </p>
        <ul>
          <li>Install and Configure OpenShift Clusters for use with Red Hat Actions</li>
          <li>Manage, modify and configure Red Hat actions in your repositories</li>
          <li>Manage OpenShift GitHub Runners</li>
        </ul>

        <div className="row justify-content-center">
          <Link to={getSetupSteps()[0].path}>
            <Button className="btn-primary btn-lg d-flex align-items-center mt-3 px-5">
              <div className="font-weight-bold align-self-center" title="Get Started">
                Get Started
              </div>
              <FontAwesomeIcon icon="long-arrow-alt-right" className="ml-3" style={{ fontSize: "1.5em" }}/>
            </Button>
          </Link>
        </div>

        <div className="d-flex justify-content-end mt-3">
          <div>
            Backend status:&nbsp;
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
      </Jumbotron>
    </React.Fragment>
  );
}
