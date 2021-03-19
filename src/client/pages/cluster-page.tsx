import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Button, Table } from "react-bootstrap";
import Endpoints from "../../common/endpoints";
import ApiResponses from "../../common/interfaces/api-responses";
import DataFetcher from "../components/data-fetcher";

export default function ClusterPage(): JSX.Element {
  return (
    <React.Fragment>
      <h1 className="d-flex justify-content-between mb-4">
        It&apos;s the cluster page
        <div className="ml-auto"></div>
        <Button title="Reload Cluster Status" className="btn-light" onClick={async () => {
          await fetch(Endpoints.Cluster.path, { method: "PUT" });
          window.location.reload();
        }}>
          <FontAwesomeIcon fixedWidth icon="sync-alt"/>
          Refresh
        </Button>
      </h1>
      <DataFetcher type="api" endpoint={Endpoints.Cluster} loadingDisplay="spinner">{
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
              <Table className="table-dark">
                <tbody>
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
                  ))
                  }
                </tbody>
              </Table>
            </React.Fragment>
          );
        }
      }</DataFetcher>
    </React.Fragment>
  );
}
