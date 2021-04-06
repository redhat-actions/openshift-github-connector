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

const saInputID = "serviceAccountName";

type SAStatus = { ok: boolean, status: string };

async function onSubmitServiceAccount(): Promise<SAStatus> {
  const saName = (document.getElementById(saInputID) as HTMLInputElement).value;
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
      saStatus = { ok: false, status: `${res.namespace}/serviceaccount/${res.serviceAccountName} does not exist.` };
    }
  }
  catch (err) {
    saStatus = { ok: false, status: err.message };
  }

  return saStatus;
}

function getCreateSACodeBlock(saName: string, namespace: string): string {
  return `oc create -n ${namespace} serviceaccount ${saName}
oc policy -n ${namespace} add-role-to-user edit -z ${saName}`;
}

export default function SetupSAPage(): JSX.Element {

  const history = useHistory();

  const [ saName, setSaName ] = useState("github-actions-sa");
  const [ saStatus, setSaStatus ] = useState<SAStatus | undefined>();
  const [ saLoading, setSaLoading ] = useState(false);

  return (
    <React.Fragment>
      <h2></h2>
      <Card>
        <Card.Title>
          <h4>Create a Service Account</h4>
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

      {/* <div className="d-flex my-2">
        <div className="align-self-center">The instructions below are for a <code>sh</code> shell, or similar.</div>
        <div className="ml-auto"></div>
        <button className="btn btn-light active mr-3" aria-pressed="true">
          <FaBtnBody icon="terminal" text="Switch to sh/bash"/>
        </button>
        <button className="btn btn-light">
          <FaBtnBody icon={[ "fab", "windows" ]} text="Switch to Powershell"/>
        </button>
      </div> */}

      <Card>
        <Card.Body>
          <p className="">
            Enter the name of the service account you would like to use.<br/>
          </p>
          <input className="w-50 form-control font-weight-bold" id={saInputID} type="text"
            defaultValue={saName}
            onChange={(e) => setSaName(e.currentTarget.value)}
          />

          <div className="mt-3">
            <p>
              It is recommended to create a new service account so permissions can be assigned minimally and individually.
            </p>
            <p>
            The Service Account will usually need the <code>Edit</code> role, so it can
            create and modify resources in its namespace.
            </p>
            <div>
              <FontAwesomeIcon icon="book-open" className="mr-2"/>
              <DocLink
                text="OpenShift Roles"
                href="https://docs.openshift.com/container-platform/4.7/authentication/using-rbac.html#default-roles_using-rbac"
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      <DataFetcher type="api" endpoint={ApiEndpoints.Cluster.Root}>
        {
          (data: ApiResponses.ClusterState) => {
            if (!data.connected) {
              return (
                <React.Fragment>
                  <p className="text-danger">
                    Could not connect to the Kubernetes cluster:<br/>
                    {data.error}
                  </p>
                  <p>
                    <Link className="font-weight-bold" to={ClientPages.Cluster.path}>
                      Go to the Cluster Page
                    </Link>
                  </p>
                </React.Fragment>
              );
            }

            const ns = data.namespace;
            const createSACodeBlock = getCreateSACodeBlock(saName, ns);

            return (
              <Card>
                <Card.Body>
                  <div className="d-flex align-items-center">
                    The service account can be created as follows:
                    <CopyToClipboardBtn
                      className="ml-auto"
                      copyLabel="Copy Code"
                      textToCopy={createSACodeBlock}
                    />
                  </div>
                  <pre className="bg-dark text-white mt-3 rounded p-3">
                    {createSACodeBlock}
                  </pre>

                  <p>
                    Once <span className="font-weight-bold">{saName}</span> has been created and assigned permissions, click the button below.
                  </p>

                  <Button className="btn-lg font-weight-bold" onClick={
                    async () => {
                      setSaLoading(true);
                      try {
                        const newSaStatus = await onSubmitServiceAccount();
                        setSaStatus(newSaStatus);
                        if (newSaStatus.ok) {
                          history.push(ClientPages.Cluster.path);
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
                      <Spinner className={classnames({ "d-none": !saLoading })} animation="border"/>
                    </div>
                  </Button>
                  <br/>
                  <p className={classnames("mt-3", { "d-none": saStatus == null, "text-danger": saStatus && !saStatus.ok })}>
                    {saStatus?.status || "Unknown error"}
                  </p>
                </Card.Body>
              </Card>
            );
          }
        }
      </DataFetcher>
    </React.Fragment>
  );
}
