/*
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classnames from "classnames";
import { Button, Card } from "react-bootstrap";
import jwt from "jsonwebtoken";

import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import batch from "react-syntax-highlighter/dist/esm/languages/prism/batch";
import darkStyle from "react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus";

import ApiEndpoints from "../../../common/api-endpoints";
import ApiRequests from "../../../common/api-requests";
import ApiResponses from "../../../common/api-responses";
import CopyToClipboardBtn from "../../components/copy-btn";
import DataFetcher from "../../components/data-fetcher";
import { fetchJSON } from "../../util/client-util";
import getEndpointUrl from "../../util/get-endpoint-url";
import ClientPages from "../client-pages";
import SetupPageHeader from "./setup-header";
import Banner from "../../components/banner";
import { ExternalLink } from "../../components/external-link";
import InlineCode from "../../components/inline-code";
import FaBtnBody from "../../components/fa-btn-body";
import { checkInvalidK8sName, getCreateSACodeBlock, ScriptTypes } from "../../util/service-account-util";

let syntaxHighlighterSetup = false;
function setupSyntaxHighlighter(): void {
  try {
    // sh != bash but prism doesn't distinguish
    SyntaxHighlighter.registerLanguage("bash", bash);
    SyntaxHighlighter.registerLanguage(ScriptTypes.Batch, batch);
    syntaxHighlighterSetup = true;
  }
  catch (err) {
    console.error(`Failed to set up react-syntax-highlighter`, err);
  }
}

setupSyntaxHighlighter();

async function onSubmitServiceAccountToken(saToken: string): Promise<ApiResponses.Result> {
  let createSaResult: ApiResponses.Result;
  try {
    const res = await fetchJSON<
      ApiRequests.SetServiceAccount,
      ApiResponses.ServiceAccountState
    >("POST", getEndpointUrl(ApiEndpoints.User.ServiceAccount.path), {
      serviceAccountToken: saToken,
    });

    return res;
  }
  catch (err) {
    createSaResult = { success: false, message: err.message };
  }

  return createSaResult;
}

export default function SetupSAPage(): JSX.Element {

  // const history = useHistory();

  const [ saName, setSaName ] = useState<string>("github-actions-sa");
  const [ saNameError, setSaNameError ] = useState<string | undefined>();
  const [ saRole, setSaRole ] = useState<string>("edit");
  const [ saToken, setSaToken ] = useState<string | undefined>();
  const [ saTokenError, setSaTokenError ] = useState<React.ReactNode | undefined>();

  const defaultScriptType = window.navigator.userAgent.toLowerCase().includes("windows")
    ? ScriptTypes.Batch
    : ScriptTypes.Shell;

  const [ scriptType, setScriptType ] = useState<ScriptTypes>(defaultScriptType);

  const saNameCardID = "sa-name-card";
  const saNameInputID = "sa-name-input";
  const saTokenInputID = "sa-token-input";

  return (
    <React.Fragment>
      <SetupPageHeader pageIndex={2} checkCanProceed={async () => {
        function onError(): void {
          const saTokenInput = document.getElementById(saTokenInputID);
          saTokenInput?.focus();
          saTokenInput?.scrollIntoView();
        }

        if (!saToken) {
          setSaTokenError(`You must paste the Service Account Token into this field.`);
          onError();
          return false;
        }

        const decodeResult = jwt.decode(saToken);
        if (decodeResult == null) {
          setSaTokenError(
            <div>
              This is not a valid Service Account token.
              Make sure the commands ran successfully, and that you pasted correctly.
              Refer to the documentation at the top of this section for more information.
            </div>
          );
          return false;
        }

        const saStatus = await onSubmitServiceAccountToken(saToken);
        if (!saStatus.success) {
          setSaTokenError(saStatus.message);
          onError();
        }
        return saStatus.success;
      }}/>

      <Card>
        <Card.Body>
          <p>
            You have to create a Service Account which can act as your agent on the OpenShift cluster.
            The Service Account will create a token which can be used to authenticate into the cluster from GitHub Actions.
          </p>
          <p>
            The service account has to be created by a user,
            since a service account is not allowed to create another service account.
          </p>
          <div className="mt-3">
            <ul className="no-bullets">
              <li>
                <FontAwesomeIcon icon="book-open" className="mr-2"/>
                <ExternalLink href="https://github.com/redhat-actions/oc-login/wiki/Using-a-Service-Account-for-GitHub-Actions">
                  Service Accounts for GitHub Actions
                </ExternalLink>
              </li>
              <li>
                <FontAwesomeIcon icon="book-open" className="mr-2"/>
                <ExternalLink
                  href="https://docs.openshift.com/container-platform/4.7/authentication/understanding-and-creating-service-accounts.html"
                >
                  OpenShift Service Accounts
                </ExternalLink>
              </li>
            </ul>
          </div>
        </Card.Body>
      </Card>

      <Card id={saNameCardID}>
        <Card.Title>
          Service Account Name
        </Card.Title>
        <Card.Body>
          <p className="">
            Enter the name of the service account you would like to use. It is recommended to use a new service account.<br/>
          </p>
          <label className="b">Service Account Name</label>
          <input
            className={classnames("form-control w-50 b", { warning: saNameError != null })}
            id={saNameInputID} type="text"
            defaultValue={saName}
            onChange={(e) => {
              const newSaName = e.currentTarget.value.trim();
              const newSaNameError = checkInvalidK8sName(newSaName);
              setSaNameError(newSaNameError);
              if (newSaNameError) {
                const saNameInput = document.getElementById(saNameInputID);
                saNameInput?.focus();
                saNameInput?.scrollIntoView();
              }
              setSaName(newSaName);
            }}
          />
          <Banner display={!!saNameError} severity="warn">
            {saNameError ?? ""}
          </Banner>
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
            const createSACodeBlock = getCreateSACodeBlock(scriptType, saName, saRole, ns);

            return (
              <React.Fragment>
                {<Card>
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

                      <div className="mt-2 mb-3">
                        <FontAwesomeIcon icon="book-open" className="mr-2"/>
                        <ExternalLink
                          href="https://docs.openshift.com/container-platform/4.7/authentication/using-rbac.html#default-roles_using-rbac"
                        >
                          OpenShift Roles
                        </ExternalLink>
                      </div>

                      <label className="b">Service Account Role</label>
                      <input
                        className={classnames("form-control w-50 b")}
                        type="text"
                        defaultValue={saRole}
                        onChange={(e) => {
                          const newSaRole = e.currentTarget.value.trim();
                          setSaRole(newSaRole);
                        }}
                      />
                    </div>
                  </Card.Body>
                </Card>}

                <Card>
                  <Card.Title>
                    Create the Service Account
                  </Card.Title>
                  <Card.Body>
                    {saNameError
                      ? <Banner display={true} severity="error">
                        <span>
                          Invalid Service Account name {`"${saName}"`}. Fix the Service Account name above.
                        </span>
                      </Banner>
                      : <React.Fragment>
                        <div style={{ minHeight: "4em" }} className="d-flex align-items-center">
                          {scriptType === ScriptTypes.Shell
                            ? <div>
                              Paste these commands into a shell that is logged into your OpenShift cluster.
                            </div>
                            : <div>
                              Save this script into a <code>.bat</code> file,
                              and then run it from a shell that is logged into your OpenShift cluster.
                            </div>
                          }
                          <div className="ml-auto"></div>
                          <Button style={{ minWidth: "19ch" }} onClick={(): void => {
                            // eslint-disable-next-line no-unused-expressions
                            scriptType === ScriptTypes.Shell ? setScriptType(ScriptTypes.Batch) : setScriptType(ScriptTypes.Shell);
                          }}>
                            {scriptType === ScriptTypes.Shell
                              ? <FaBtnBody icon={[ "fab", "windows" ]} text="Switch to batch"/>
                              : <FaBtnBody icon="terminal" text="Switch to sh"/>
                            }
                          </Button>
                          <CopyToClipboardBtn
                            style={{ minWidth: "16ch" }}
                            className="ml-3"
                            copyLabel="Copy Code"
                            textToCopy={createSACodeBlock}
                          />
                        </div>
                        <ul className="mt-2 no-bullets">
                          <li>
                            <FontAwesomeIcon icon="book-open" className="mr-2"/>
                            <ExternalLink
                              // eslint-disable-next-line max-len
                      href="https://github.com/redhat-actions/oc-login/wiki/Using-a-Service-Account-for-GitHub-Actions#creating-the-service-account">
                              About this script
                            </ExternalLink>
                          </li>
                          <li>
                            <FontAwesomeIcon icon="book-open" className="mr-2"/>
                            <ExternalLink
                              href="https://kubernetes.io/docs/reference/access-authn-authz/authentication/#service-account-tokens">
                              Service Account Tokens
                            </ExternalLink>
                          </li>
                          <li>
                            <FontAwesomeIcon icon="book-open" className="mr-2"/>
                            <ExternalLink
                              href="https://jwt.io">
                              JSON Web Tokens
                            </ExternalLink>
                          </li>
                        </ul>

                        <div className="my-3">
                          {syntaxHighlighterSetup
                            ? <SyntaxHighlighter
                              codeTagProps={{ className: "syntax-highlighted" }}
                              language={scriptType === ScriptTypes.Shell ? "bash" : "batch"}
                              style={darkStyle}
                            >
                              {createSACodeBlock}
                            </SyntaxHighlighter>
                            : <pre>{createSACodeBlock}</pre>
                          }
                        </div>

                        <label htmlFor={saTokenInputID}>
                          After successfully running the commands above, paste the token here:
                        </label>
                        <textarea
                          id={saTokenInputID}
                          className={classnames("form-control w-100 mb-3", {
                            warning: saTokenError,
                          })}
                          style={{ maxHeight: "10em", fontFamily: "monospace" }}
                          onChange={(e) => {
                            setSaTokenError(undefined);
                            setSaToken(e.currentTarget.value.trim());
                            e.currentTarget.style.height = "";
                            e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
                          }}
                        />

                        <Banner display={saTokenError != null} severity="warn">
                          {saTokenError ?? ""}
                        </Banner>

                        <p>
                          Then, click Next.
                        </p>
                      </React.Fragment>
                    }
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

*/

export {};
