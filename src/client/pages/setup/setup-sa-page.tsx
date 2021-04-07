import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classnames from "classnames";
import { Card } from "react-bootstrap";

import ApiEndpoints from "../../../common/api-endpoints";
import ApiRequests from "../../../common/api-requests";
import ApiResponses from "../../../common/api-responses";
import CopyToClipboardBtn from "../../components/copy-btn";
import DataFetcher from "../../components/data-fetcher";
import { DocLink } from "../../components/doclink";
import { fetchJSON } from "../../util/client-util";
import getEndpointUrl from "../../util/get-endpoint-url";
import ClientPages from "../client-pages";
import SetupPageHeader, { SubmitResult } from "./setup-header";

async function onSubmitServiceAccount(saName: string): Promise<SubmitResult> {
  const reqBody: ApiRequests.SetServiceAccount = {
    serviceAccountName: saName,
  };

  let saStatus: SubmitResult;
  try {
    const res = await fetchJSON<ApiResponses.ServiceAccountFoundResponse>("POST", getEndpointUrl(ApiEndpoints.Cluster.ServiceAccount.path), {
      body: JSON.stringify(reqBody),
    });

    if (res.found) {
      saStatus = { ok: true, message: `Successfully selected ${res.namespace}/${res.serviceAccountName}` };
    }
    else {
      saStatus = {
        ok: false,
        message: `Service Account ${res.serviceAccountName} does not exist in namespace ${res.namespace}. Create the Service Account and try again.`,
      };
    }
  }
  catch (err) {
    saStatus = { ok: false, message: err.message };
  }

  return saStatus;
}

function getCreateSACodeBlock(saName: string, saRole: string, namespace: string): string {
  return `oc create -n ${namespace} serviceaccount ${saName}
oc policy -n ${namespace} add-role-to-user ${saRole} -z ${saName}`;
}

export default function SetupSAPage(): JSX.Element {

  // const history = useHistory();

  const [ saName, setSaName ] = useState("github-actions-sa");
  // const [ saStatus, setSaStatus ] = useState<SAStatus | undefined>();
  const [ saRole /* , setSaRole */ ] = useState("edit");
  // const [ saLoading, setSaLoading ] = useState(false);

  const saNameInputID = "sa-name-input";

  return (
    <React.Fragment>
      <SetupPageHeader pageIndex={2} onSubmit={async () => {
        const saStatus = await onSubmitServiceAccount(saName);
        if (!saStatus.ok) {
          document.getElementById(saNameInputID)?.focus();
        }
        return saStatus;
      }
      }/>
      <Card>
        <Card.Body>
          You have to create a Service Account which can act as your agent on the OpenShift cluster.
          The Service Account will create a token which can be used to authenticate into the cluster from GitHub Actions.
          <div className="mt-3">
            <ul className="no-bullets">
              <li>
                <FontAwesomeIcon icon="book-open" className="mr-2"/>
                <DocLink
                  text="Service Accounts for GitHub Actions"
                  href="https://github.com/redhat-actions/oc-login/wiki/Using-a-Service-Account-for-GitHub-Actions"
                />
              </li>
              <li>
                <FontAwesomeIcon icon="book-open" className="mr-2"/>
                <DocLink
                  text="OpenShift Service Accounts"
                  href="https://docs.openshift.com/container-platform/4.7/authentication/understanding-and-creating-service-accounts.html"
                />
              </li>
            </ul>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Title>
          Service Account Name
        </Card.Title>
        <Card.Body>
          <p className="">
            Enter the name of the service account you would like to use. It is recommended to use a new service account.<br/>
          </p>
          <label className="b">Service Account Name</label>
          <input
            className={classnames("form-control w-50 b")}/* , {
              errored: saStatus?.ok === false,
            }
            )} */
            id={saNameInputID} type="text"
            defaultValue={saName}
            onChange={(e) => setSaName(e.currentTarget.value)}
          />
        </Card.Body>
      </Card>

      <DataFetcher type="api" endpoint={ApiEndpoints.Cluster.Root}>
        {
          (clusterData: ApiResponses.ClusterState) => {
            if (!clusterData.connected) {
              return (
                <React.Fragment>
                  <p className="text-danger">
                    Could not connect to the Kubernetes cluster:<br/>
                    {clusterData.error}
                  </p>
                  <p>
                    <Link className="b" to={ClientPages.Cluster.path}>
                      Go to the Cluster Page
                    </Link>
                  </p>
                </React.Fragment>
              );
            }

            const ns = clusterData.namespace;
            const createSACodeBlock = getCreateSACodeBlock(saName, saRole, ns);

            return (
              <React.Fragment>
                {/* <Card>
                  <Card.Title>
                    Service Account Role
                  </Card.Title>
                  <Card.Body>
                    <div>
                      <p>
                        The <code>edit</code> role is recommended, so the service account can
                        create and modify resources in its namespace.<br/>
                        The role selected should provide minimal permissions.<br/>
                      </p>
                      <p>
                        To list roles, run <InlineCode code={`oc get clusterrole -n ${clusterData.namespace}`}/>
                      </p>
                      <label className="b">Service Account Role</label>
                      <input
                        className={classnames("form-control w-50 b")}
                        type="text"
                        defaultValue={saRole}
                        onChange={(e) => setSaRole(e.currentTarget.value)}
                      />
                      <div className="mt-3">
                        <FontAwesomeIcon icon="book-open" className="mr-2"/>
                        <DocLink
                          text="OpenShift Roles"
                          href="https://docs.openshift.com/container-platform/4.7/authentication/using-rbac.html#default-roles_using-rbac"
                        />
                      </div>
                    </div>
                  </Card.Body>
                </Card> */}

                <Card>
                  <Card.Title>
                    Service Account Role
                  </Card.Title>
                  <Card.Body>
                    <div>
                      The commands below use the <code>edit</code> role for your service account,
                      which will allow it to edit resources in its namespace.<br/>
                      You may substitute another cluster role if you prefer.
                      <div className="mt-3">
                        <FontAwesomeIcon icon="book-open" className="mr-2"/>
                        <DocLink
                          text="OpenShift Roles"
                          href="https://docs.openshift.com/container-platform/4.7/authentication/using-rbac.html#default-roles_using-rbac"
                        />
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                <Card>
                  <Card.Title>
                    Create the Service Account
                  </Card.Title>
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <div>
                        Paste these commands into a shell that is logged into your OpenShift cluster.
                      </div>
                      <CopyToClipboardBtn
                        style={{ minWidth: "16ch" }}
                        className="ml-auto"
                        copyLabel="Copy Code"
                        textToCopy={createSACodeBlock}
                      />
                    </div>
                    <pre>
                      {createSACodeBlock}
                    </pre>

                    <p>
                      Once <code>{saName}</code> has been created and assigned permissions, click Next.
                    </p>
                  </Card.Body>
                </Card>
              </React.Fragment>
            );
          }
        }
      </DataFetcher>
    </React.Fragment>
  );
}
