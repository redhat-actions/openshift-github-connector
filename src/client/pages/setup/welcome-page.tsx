import {
  Card, CardTitle, CardBody,
} from "@patternfly/react-core";

export default function WelcomePage(): JSX.Element {
  return (
    <>
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
          Click <b>Next</b> to get started.
          </p>

          {/* <div className="d-flex">
            <div className="ms-auto">
              <b>Backend status:&nbsp;</b>
              <DataFetcher type="api" endpoint={ApiEndpoints.Health}>
                {(data: ApiResponses.Result) => (
                  <>
                    <span className={data.message === "OK" ? "text-success" : "text-danger"}>
                      {data.message}
                    </span>
                  </>
                )}
              </DataFetcher>
            </div>
          </div> */}
        </CardBody>

        {/* <div className="row justify-content-center">
          <Link to={getSetupSteps()[0].path}>
            <Button className="btn-primary btn-lg center-y mt-3 px-5">
              <div className="font-weight-bold align-self-center" title="Get Started">
                Get Started
              </div>
              <FontAwesomeIcon icon="long-arrow-alt-right" className="ms-3" style={{ fontSize: "1.5em" }}/>
            </Button>
          </Link>
        </div> */}

      </Card>
    </>
  );
}
