import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classnames from "classnames";
import { Button, Card, Spinner } from "react-bootstrap";

import ApiEndpoints from "../../../common/api-endpoints";
import ApiRequests from "../../../common/api-requests";
import ApiResponses from "../../../common/api-responses";
import CopyToClipboardBtn from "../../components/copy-btn";
import DataFetcher from "../../components/data-fetcher";
import { DocLink } from "../../components/doclink";
import { fetchJSON } from "../../util/client-util";
import getEndpointUrl from "../../util/get-endpoint-url";
import ClientPages from "../client-pages";
import ErrorBanner from "../../components/error-banner";
import InlineCode from "../../components/inline-code";

type SAStatus = { ok: boolean, status: string };

async function onSubmitServiceAccount(saName: string): Promise<SAStatus> {
  const reqBody: ApiRequests.SetServiceAccount = {
    serviceAccountName: saName,
  };

  let saStatus: SAStatus;
  try {
    const res = await fetchJSON<ApiResponses.ServiceAccountFoundResponse>("POST", getEndpointUrl(ApiEndpoints.Cluster.ServiceAccount.path), {
      body: JSON.stringify(reqBody),
    });

    if (res.found) {
      saStatus = { ok: true, status: `Successfully set up ${res.serviceAccountName} in ${res.namespace}` };
    }
    else {
      saStatus = {
        ok: false,
        status: `${res.namespace}/serviceaccount/${res.serviceAccountName} does not exist. Create the Service Account and try again.`,
      };
    }
  }
  catch (err) {
    saStatus = { ok: false, status: err.message };
  }

  return saStatus;
}

function getCreateSACodeBlock(saName: string, saRole: string, namespace: string): string {
  return `oc create -n ${namespace} serviceaccount ${saName}
oc policy -n ${namespace} add-role-to-user ${saRole} -z ${saName}`;
}

export default function SetupSAPage(): JSX.Element {

  const history = useHistory();

  const [ saName, setSaName ] = useState("github-actions-sa");
  const [ saStatus, setSaStatus ] = useState<SAStatus | undefined>();
  const [ saRole, setSaRole ] = useState("edit");
  const [ saLoading, setSaLoading ] = useState(false);

  const saNameInputID = "sa-name-input";

  return (
    <React.Fragment>
      <Card>
        <Card.Title>
          Set up Service Account
        </Card.Title>
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
            className={classnames("form-control w-50 b", {
              errored: saStatus?.ok === false,
            })}
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
                <Card>
                  <Card.Title>
                    Service Account Role
                  </Card.Title>
                  <Card.Body>
                    <div>
                      <p>
                        The <code>edit</code> role is recommended, so the service account can
                        create and modify resources in its namespace.<br/>
                        The permissions given should be minimal. Do not give a service account administrative permissions. <br/>
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
                        className="ml-auto"
                        copyLabel="Copy Code"
                        textToCopy={createSACodeBlock}
                      />
                    </div>
                    <pre>
                      {createSACodeBlock}
                    </pre>

                    <p>
                      Once <code>{saName}</code> has been created and assigned permissions, click Proceed.
                    </p>

                    <div className="d-flex justify-content-center">
                      <Button className="btn-lg" title="Proceed" onClick={
                        async () => {
                          setSaLoading(true);
                          setSaStatus(undefined);
                          try {
                            const newSaStatus = await onSubmitServiceAccount(saName);
                            setSaStatus(newSaStatus);
                            if (newSaStatus.ok) {
                              history.push(ClientPages.Cluster.path);
                            }
                            else {
                              document.getElementById(saNameInputID)?.focus();
                            }
                          }
                          finally {
                            setSaLoading(false);
                          }
                        }
                      }>
                        <div className="d-flex align-items-center">
                          Proceed
                          <FontAwesomeIcon className="mx-3" icon="arrow-right"/>
                        </div>
                      </Button>
                    </div>

                    <div className="d-flex justify-content-center mt-3">
                      <Spinner className={classnames({ "d-none": !saLoading })} animation="border"/>

                      <ErrorBanner
                        display={saStatus != null && !saStatus.ok}
                        message={saStatus?.status || "Unknown error"}
                      />
                    </div>
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
