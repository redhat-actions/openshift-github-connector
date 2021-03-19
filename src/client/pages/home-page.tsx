import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Button, Jumbotron } from "react-bootstrap";
import { Link } from "react-router-dom";
import Endpoints from "../../common/endpoints";
import DataFetcher from "../components/data-fetcher";

export default function homepage(): JSX.Element {
  return (
    <React.Fragment>
      <Jumbotron className="text-black">
        <h2 className="text-center">OpenShift GitHub Actions Connector</h2>
        <h5 className="text-center">
                  OpenShift GitHub Actions Connector is designed to help you work seamlessly with
                  Red Hat Developer tools and Openshift clusters.
        </h5>
        <hr className="my-4" />
        <p>This application can access your your GitHub org or personal account
                  and authenticate against Openshift to enable default integrations.
        </p>
        <ul>
          <li>Install and Configure OpenShift Clusters for use with Red Hat Actions</li>
          <li>Manage, modify and configure Red Hat actions in your repositories</li>
          <li>Manage OpenShift GitHub Runners</li>
        </ul>

        <div className="row justify-content-center">
          <Link to={Endpoints.Setup.Root.path}>
            <Button className="btn-primary btn-lg d-flex align-items-center mt-3 px-5">
              <div className="font-weight-bold align-self-center" title="Get Started">
                Get Started
              </div>
              <FontAwesomeIcon icon="long-arrow-alt-right" className="ml-3" style={{ fontSize: "1.5em" }}/>
            </Button>
          </Link>
        </div>

        <div className="d-flex">
          <div className="ml-auto"></div>
          <div>
            Backend status:&nbsp;
            <DataFetcher type="api" endpoint={Endpoints.Health}>
              {(data: { status: string }) => (
                <React.Fragment>
                  <span className={data.status === "OK" ? "text-success" : "text-danger"}>
                    {data.status}
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
