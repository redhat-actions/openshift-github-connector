import { Button } from "@patternfly/react-core";
import ApiEndpoints from "../../common/api-endpoints";
import ApiResponses from "../../common/api-responses";
import DataFetcher from "../components/data-fetcher";
import BtnBody from "../components/btn-body";
import { fetchJSON } from "../util/client-util";
import { CommonIcons } from "../util/icons";
import { ObjectTable } from "../components/object-table";

export default function ClusterPage(): JSX.Element {
  return (
    <>
      <h1 className="d-flex justify-content-between mb-4">
        Cluster
        <div className="ms-auto"></div>
        <Button title="Reload Cluster Status" className="btn-light" onClick={async () => {
          await fetchJSON("PUT", ApiEndpoints.Cluster.Root.path);
          window.location.reload();
        }}>
          <BtnBody icon={CommonIcons.Reload} text="Reload" />
        </Button>
      </h1>
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
                  "Cluster Name": data.clusterInfo.name,
                  "API Server": data.clusterInfo.server,
                  "External API Server": data.clusterInfo.externalServer,
                  Namespace: data.namespace,
                  User: data.clusterInfo.user.name,
                  "Service Account Name": data.serviceAccountName,
                }} />
            </>
          );
        }}
      </DataFetcher>
    </>
  );
}
