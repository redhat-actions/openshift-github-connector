import React from "react";
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
    <React.Fragment>
      <h1 className="d-flex justify-content-between mb-4">
        Cluster
        <div className="ml-auto"></div>
        <Button title="Reload Cluster Status" className="btn-light" onClick={async () => {
          await fetchJSON("PUT", ApiEndpoints.Cluster.Root.path);
          window.location.reload();
        }}>
          <BtnBody icon={CommonIcons.Reload} text="Reload" />
        </Button>
      </h1>
      <DataFetcher type="api" endpoint={ApiEndpoints.Cluster.Root} loadingDisplay="spinner">{
        (data: ApiResponses.ClusterState) => {
          if (!data.connected) {
            return (
              <React.Fragment>
                <h5>Could not obtain cluster info:</h5>
                <p className="text-danger">{data.error}</p>
              </React.Fragment>
            );
          }
          return (
            <ObjectTable
              label="Cluster Info"
              obj={{
                "Cluster Name": data.clusterInfo.name,
                "Api Server": data.clusterInfo.server,
                "External Server": data.clusterInfo.externalServer,
                User: data.clusterInfo.user.name,
                Namespace: data.namespace,
              }} />
          );
        }
      }
      </DataFetcher>
    </React.Fragment>
  );
}
