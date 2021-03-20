import React from "react";
import { Button } from "react-bootstrap";
import { useHistory } from "react-router-dom";

import ApiEndpoints from "../../../common/api-endpoints";
import ApiRequests from "../../../common/api-requests";
import CopyToClipboardBtn from "../../components/copy-btn";
import FaBtnBody from "../../components/fa-btn-body";
import ClientPages from "../client-pages";

const saInputID = "serviceAccountName";

async function onSubmitServiceAccount() {
  try {
    const saName = (document.getElementById(saInputID) as HTMLInputElement).value;
    const reqBody: ApiRequests.SetServiceAccount = {
      serviceAccountName: saName,
    };

    await fetch(ApiEndpoints.Cluster.ServiceAccount.path, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(reqBody),
    });
  }
  catch (err) {
    console.error(`Error submitting service account`, err);
  }
}

export default function SetupSAPage(): JSX.Element {

  const history = useHistory();

  const createSACodeBlock = `oc create sa github-actions-sa
oc policy add-role-to-user edit -z github-actions-sa`;

  return (
    <React.Fragment>
      <h2>Create a Service Account</h2>
      <p>You have to create a Service Account which can act as your agent on the OpenShift cluster.
        The Service Account will create a token which can be used to authenticate into the cluster from GitHub Actions.
      </p>
      <p>
        <span className="font-weight-bold">Read more</span> about <a
          href="https://github.com/redhat-actions/oc-login/wiki/Using-a-Service-Account-for-GitHub-Actions">
          Using a Service Account for GitHub Actions
        </a>, or about <a
          href="https://docs.openshift.com/container-platform/4.7/authentication/understanding-and-creating-service-accounts.html">
          Service Accounts in general
        </a>.
      </p>
      <hr className="text-white bg-white"></hr>
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
      <div className="d-flex align-items-center">
        The service account can be created as follows:
        <CopyToClipboardBtn className="ml-auto" textToCopy={createSACodeBlock}/>
      </div>
      <pre className="bg-dark text-white mt-3 rounded p-3">
        {createSACodeBlock}
      </pre>
      <hr className="text-white bg-white"></hr>
      <p>Paste the name of the Service Account below when finished.</p>
      <label className="mr-3 font-weight-bold" htmlFor={saInputID} >Service Account Name:</label><br/>
      <div className="d-flex w-75">
        <input className="w-50 mr-3 form-control" id={saInputID} name={saInputID} defaultValue="github-actions-sa" type="text"/>
        <Button onClick={
          () => {
            onSubmitServiceAccount()
              .then(() => {
                history.push(ClientPages.Cluster.path);
              });
          }
        }>
          <FaBtnBody text="Submit" icon="arrow-right" iconPosition="right"/>
        </Button>
      </div>
    </React.Fragment>
  );
}
