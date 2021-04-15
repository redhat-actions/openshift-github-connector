import React from "react";
import { Button, Table } from "react-bootstrap";
import ApiEndpoints from "../../common/api-endpoints";
import ApiResponses from "../../common/api-responses";
import DataFetcher from "../components/data-fetcher";
import FaBtnBody from "../components/fa-btn-body";
import getEndpointUrl from "../util/get-endpoint-url";

export default function ClusterPage(): JSX.Element {
  return (
    <React.Fragment>
      <h1 className="d-flex justify-content-between mb-4">
        Cluster
        <div className="ml-auto"></div>
        <Button title="Reload Cluster Status" className="btn-light" onClick={async () => {
          await fetch(getEndpointUrl(ApiEndpoints.Cluster.Root.path), { method: "PUT" });
          window.location.reload();
        }}>
          <FaBtnBody icon="sync-alt" text="Refresh" />
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
            <Table className="table-dark">
              <tbody>
                {Object.entries({
                  "Cluster Name": data.clusterInfo.name,
                  "Api Server": <a href={data.clusterInfo.server}>{data.clusterInfo.server}</a>,
                  User: data.clusterInfo.user,
                  Namespace: data.namespace,
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
                {/* <DataFetcher type="api" endpoint={ApiEndpoints.User.ServiceAccount} loadingDisplay="none">{
                  (saData: ApiResponses.ServiceAccountState) => {
                    return (
                      <React.Fragment>
                        <tr>
                          <td className="font-weight-bold">
                              Service Account
                          </td>
                          <td>
                            {saData.success ? saData.serviceAccountName : <span className="text-danger">None</span> }
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  }
                }
                </DataFetcher> */}
              </tbody>
            </Table>
          );
        }
      }
      </DataFetcher>
    </React.Fragment>
  );
}
