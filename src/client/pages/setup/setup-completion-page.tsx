import React from "react";
import { Jumbotron } from "react-bootstrap";
import { Link } from "react-router-dom";
import ClientPages from "../client-pages";
import SetupPageHeader from "./setup-header";

export default function SetupFinishedPage(): JSX.Element {
  return (
    <React.Fragment>
      <SetupPageHeader pageIndex={5} canProceed={false} hideBtnBanner={true} />
      <Jumbotron>
        <h2 className="d-flex justify-content-between">
          Setup Complete!
          {/* <FontAwesomeIcon icon="check" className="text-success" /> */}
        </h2>
        <hr />
        <h3>{"What's Next"}</h3>
        <ul className="pl-4 b">
          <li>
            <Link to={ClientPages.AddWorkflows.path}>Add the OpenShift starter workflow</Link>
          </li>
          <li>
            <Link to={ClientPages.NotImplemented.path}>Connect your OpenShift Image Registry</Link>
          </li>
          <li>
            <Link to={ClientPages.NotImplemented.path}>Create Self-Hosted Runners</Link>
          </li>
        </ul>
        <ul className="pl-4 b">
          <li>
            <Link to={ClientPages.App.path}>Return to the View GitHub App page</Link>
          </li>
          <li>
            <Link to={ClientPages.ConnectRepos.path}>Return to the Connect Repositories page</Link>
          </li>
          <li>
            <Link to={ClientPages.ImageRegistries.path}>Return to the Image Registries page</Link>
          </li>
        </ul>
      </Jumbotron>
    </React.Fragment>
  );
}

/*

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
          </tbody>
        </Table>
      </div>
    </React.Fragment>
  );
}
*/
