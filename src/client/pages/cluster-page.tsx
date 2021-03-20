import React from "react";
import { Button, Table } from "react-bootstrap";
import ApiEndpoints from "../../common/api-endpoints";
import ApiResponses from "../../common/api-responses";
import DataFetcher from "../components/data-fetcher";
import FaBtnBody from "../components/fa-btn-body";

export default function ClusterPage(): JSX.Element {
  return (
    <React.Fragment>
      <h1 className="d-flex justify-content-between mb-4">
        It&apos;s the cluster page
        <div className="ml-auto"></div>
        <Button title="Reload Cluster Status" className="btn-light" onClick={async () => {
          await fetch(ApiEndpoints.Cluster.Root.path, { method: "PUT" });
          window.location.reload();
        }}>
          <FaBtnBody icon="sync-alt" text="Refresh" />
        </Button>
      </h1>
      <Table className="table-dark">
        <tbody>
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
                <React.Fragment>
                  {Object.entries({
                    Cluster: data.clusterInfo.name,
                    "Api Server": <a href={data.clusterInfo.server}>{data.clusterInfo.server}</a>,
                    User: data.clusterInfo.user,
                    Namespace: (data.namespace ?? "None selected"),
                  }).map(([ label, value ], i) => (
                    <tr key={i}>
                      <td className="font-weight-bold">
                        {label}
                      </td>
                      <td>
                        {value}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            }
          }
          </DataFetcher>
          <DataFetcher type="api" endpoint={ApiEndpoints.Cluster.ServiceAccount} loadingDisplay="none">{
            (data: ApiResponses.ServiceAccountState) => {
              return (
                <React.Fragment>
                  <tr>
                    <td className="font-weight-bold">
                      Service Account
                    </td>
                    <td>
                      {data.serviceAccountSetup ? data.serviceAccount.name : <span className="text-danger">None</span> }
                    </td>
                  </tr>
                </React.Fragment>
              );
            }
          }
          </DataFetcher>
        </tbody>
      </Table>
    </React.Fragment>
  );
}
