import React from "react";
import { Jumbotron } from "react-bootstrap";
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

        <p>
          Backend health:&nbsp;
          <DataFetcher type="api" endpoint={Endpoints.Health}>
            {(data: { status: string }) => (
              <React.Fragment>{data.status}</React.Fragment>
            )}
          </DataFetcher>
        </p>
        <Link to={Endpoints.App.path}>Go to the app page</Link>
      </Jumbotron>
    </React.Fragment>
  );
}
