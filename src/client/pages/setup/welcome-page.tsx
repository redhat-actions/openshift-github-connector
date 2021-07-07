import {
  Card, CardTitle, CardBody,
} from "@patternfly/react-core";

export default function WelcomePage(): JSX.Element {
  return (
    <>
      <Card isLarge>
        <CardTitle>
          Welcome to the OpenShift GitHub Connector
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
        </CardBody>
      </Card>
    </>
  );
}
