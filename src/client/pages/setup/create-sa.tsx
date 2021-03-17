import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function setupSAPage(): JSX.Element {
    return (
        <React.Fragment>
            <div className="jumbotron text-black py-5">
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

                The service account can be created as follows:
            </div>
            <hr className="text-white bg-white"></hr>
            <div className="d-flex my-2">
                <div className="align-self-center">The instructions below are for a <code>sh</code> shell, or similar.</div>
                <div className="ml-auto"></div>
                <button className="btn btn-light active mr-3" aria-pressed="true">
                    <FontAwesomeIcon icon="terminal"/>
                    Switch to sh/bash
                </button>
                <button className="btn btn-light">
                    <FontAwesomeIcon icon="windows"/>
                    Switch to Powershell
                </button>
            </div>
            <pre className="text-white mt-3" style={{ background: "black" }}>{
                `# First, name your Service Account (the Kubernetes shortname is "sa") and create it.
oc create sa github-actions-sa
# Give the service account permission to edit cluster resources.
oc policy add-role-to-user edit -z github-actions-sa`}
            </pre>
            <pre className="bg-dark text-white"></pre>

            <p>Paste the name of the Service Account below when finished.</p>
            <form>
                <label className="mr-3 font-weight-bold" htmlFor="sa_name" >Service Account Name:</label><br/>
                <input className="mr-3" name="sa_name" value="github-actions-sa" type="text"/>
                <input className="btn btn-primary" type="submit" value="Submit"></input>
            </form>
        </React.Fragment>
    );
}
