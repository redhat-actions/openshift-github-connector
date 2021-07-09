import {
  Card, CardTitle, CardBody, Select, SelectVariant, SelectOption, Divider,
} from "@patternfly/react-core";
import { useState } from "react";
import ApiEndpoints from "../../../common/api-endpoints";
import ApiResponses from "../../../common/api-responses";
import { toValidK8sName } from "../../../common/common-util";
import DataFetcher from "../../components/data-fetcher";
import { DataFetcherCard } from "../../components/data-fetcher-card";
import { ExternalLink } from "../../components/external-link";
import { CommonIcons } from "../../util/icons";

export function ConnectReposIntroCard(): JSX.Element {
  return (
    <>
      <Card>
        <CardTitle>
            Connect GitHub Repositories
        </CardTitle>
        <CardBody>
          <p>
          This step connects GitHub repositories to your OpenShift cluster by
          creating <ExternalLink href="https://docs.github.com/en/actions/reference/encrypted-secrets">
            encrypted secrets
            </ExternalLink> in
          your repositories which you can then reference in your workflows to log in to this cluster.
          </p>
          <p>
            A Service Account Token will be created for each repository that you connect.
            This way, you can revoke a single {`repository's`} access by deleting its token without affecting other repositories.
          </p>
          <p>
            Service account tokens do not expire
          </p>
          <p>
            <ExternalLink
              href={"https://github.com/redhat-actions/oc-login"}
            >
              <CommonIcons.Documentation className="me-2" />
            Read More about using oc-login to log in to OpenShift from GitHub Actions.
            </ExternalLink>
          </p>

          {/* <p>
              It is recommended to create a new Service Account Token for each repository that you will connect.
              See <ExternalLink
                href={"https://github.com/redhat-actions/oc-login/wiki/Using-a-Service-Account-for-GitHub-Actions"}
              >
                Using a Service Account for GitHub Actions
              </ExternalLink> for more information about authenticating with a Service Account.
            </p>
            <p>

            </p>
            <div className="center-y">
              <input type="checkbox"
                // className="form-check-input"
                id={this.createSATokensId}
                checked={createSATokens}
                onChange={(e) => this.setState({ createSATokens: e.currentTarget.checked })}
              />
              <label htmlFor={this.createSATokensId} className="b clickable">Create Service Account Tokens</label>
            </div> */}
        </CardBody>
      </Card>
    </>
  );
}

export function DefaultSecretsCard({ namespace, serviceAccount }: { namespace?: string, serviceAccount?: string }) {
  return (
    <Card>
      <CardTitle>
        Secrets
      </CardTitle>
      <CardBody>
        <DataFetcher key={"" + namespace + serviceAccount}
          type="api"
          endpoint={ApiEndpoints.App.Repos.RepoSecretDefaults}
          loadingDisplay="card-body"
        >
          {
            (res: ApiResponses.DefaultSecretsResponse) => (
              <div>
                <p>
                  To each repository, two secrets will be added:
                </p>
                <ol>
                  <li>
                    <code>{res.defaultSecrets.clusterServerUrl}</code> will
                    contain the URL to this OpenShift {"cluster's"} API server
                    <DataFetcher type="api" endpoint={ApiEndpoints.Cluster.Root} loadingDisplay="none">{
                      (clusterData: ApiResponses.ClusterState) => {
                        if (!clusterData.connected) {
                          return ".";
                        }

                        return (
                          <>
                            : <ExternalLink href={clusterData.clusterInfo.externalServer}>
                              {clusterData.clusterInfo.externalServer}
                            </ExternalLink>
                          </>
                        );
                      }
                    }
                    </DataFetcher>
                  </li>
                  <li>
                    <code>{res.defaultSecrets.clusterToken}</code> will
                    contain a Service Account Token for&nbsp;
                    {
                      namespace && serviceAccount ? <b>{namespace}/{serviceAccount} </b> : "the service account "
                    }
                    which can be used to log into the OpenShift API server.
                    The token will be different for each repository, but have the same permissions.
                  </li>
                </ol>
              </div>
            )
          }
        </DataFetcher>
      </CardBody>
    </Card>
  );
}

export function ServiceAccountCard(
  {
    namespace, setNamespace, serviceAccount, setServiceAccount,
  }: {
    namespace: string | undefined,
    setNamespace: (namespace: string | undefined) => void,
    serviceAccount: string | undefined,
    setServiceAccount: (serviceAccount: string | undefined, role: string | undefined) => void,
  }
): JSX.Element {

  const [ isOpen, setIsOpen ] = useState(false);

  return (
    <DataFetcherCard type="api" title="Service Account for Workflow Authentication" endpoint={ApiEndpoints.Cluster.Namespaces.Root}>{
      ({ namespaces }: ApiResponses.UserNamespaces) => {
        if (namespaces.length === 0) {
          return (
            <p className="error">
              You do not have access to any namespaces!
            </p>
          );
        }

        return (
          <>
            <p>
              Select the namespace you want these repositories&apos; workflows to use for authentication.
              <br/>
              Workflows will execute in this namespace, and will not be able to access other namespaces.
            </p>
            <Select
              variant={SelectVariant.typeahead}
              typeAheadAriaLabel={"Select a namespace"}
              isCreatable={false}
              onToggle={(isExpanded) => setIsOpen(isExpanded)}
              isOpen={isOpen}
              placeholderText={"Select a namespace"}
              selections={namespace}
              onSelect={(_event, selection, isPlaceholder) => {
                setIsOpen(false);
                if (isPlaceholder) {
                  setNamespace(undefined);
                  return;
                }
                setNamespace(selection.toString());
              }}
            >
              {
                namespaces.map((ns, i) => (
                  <SelectOption key={i} value={ns} />
                ))
              }
            </Select>

            <Divider className="my-4"/>

            <ServiceAccountSection namespace={namespace} serviceAccount={serviceAccount} setServiceAccount={setServiceAccount} />

            <Divider className="my-3"/>

            <ExternalLink
              href={"https://github.com/redhat-actions/oc-login/wiki/Using-a-Service-Account-for-GitHub-Actions"}
            >
              <CommonIcons.Documentation className="me-2" />
              Read More about authenticating using a service account for GitHub Actions.
            </ExternalLink>
          </>
        );
      }
    }
    </DataFetcherCard>
  );
}

const DEFAULT_SA_ROLE = "edit";

export function ServiceAccountSection(
  { namespace, serviceAccount, setServiceAccount }: {
    namespace: string | undefined, serviceAccount: string | undefined,
    setServiceAccount: (serviceAccount: string | undefined, role: string | undefined) => void,
  }
): JSX.Element {

  const [ isOpen, setIsOpen ] = useState(false);

  if (!namespace) {
    return (
      <></>
    );
  }

  return (
    <DataFetcher
      key={namespace} loadingDisplay="card-body" type="api"
      endpoint={ApiEndpoints.Cluster.Namespaces.ServiceAccounts.withParam(namespace)}
    >{
        ({ serviceAccounts }: ApiResponses.UserNamespacedServiceAccounts) => {
          if (serviceAccounts.length === 0) {
            return (
              <p className="error">
              There are no service account in {namespace}
              </p>
            );
          }

          return (
            <>
              <p>
                Select the Service Account in <b>{namespace}</b> you want these repositories to have access to.
                <br/>
                The service account must be granted the permissions it needs to execute workflows.
                <br/>
                You may enter the name of a new Service Account. It will be created with the <b>{DEFAULT_SA_ROLE}</b> ClusterRole.
              </p>
              <Select
                variant={SelectVariant.typeahead}
                typeAheadAriaLabel={"Select a Service Account"}
                isCreatable={true}
                onToggle={(isExpanded) => setIsOpen(isExpanded)}
                onClear={() => setServiceAccount(undefined, undefined)}
                isOpen={isOpen}
                placeholderText={"Select a Service Account"}
                selections={serviceAccount}
                onSelect={(_event, selection, isPlaceholder) => {
                  setIsOpen(false);
                  if (isPlaceholder || selection === "") {
                    setServiceAccount(undefined, undefined);
                    return;
                  }
                  setServiceAccount(toValidK8sName(selection.toString().trim()), DEFAULT_SA_ROLE);
                }}
              >
                {
                  serviceAccounts.map((ns, i) => (
                    <SelectOption key={i} value={ns} />
                  ))
                }
              </Select>

              {
                serviceAccount && !serviceAccounts.includes(serviceAccount) ?
                  <p>
                    <CommonIcons.Info className="me-2"/>
                    <b>{serviceAccount}</b> will be created in the <b>{namespace}</b> namespace.
                  </p>
                  : ""
              }
              {
                namespace && serviceAccount ?
                  <p>
                  The Service Account tokens created, and copied into the Actions secrets, will belong to this service account.
                  </p>
                  : ""
              }
            </>
          );
        }
      }
    </DataFetcher>
  );
}
