import {
  Card, CardBody, CardTitle, Checkbox, Divider, Select, SelectOption, SelectVariant,
} from "@patternfly/react-core";
import { useState } from "react";
import ApiEndpoints from "../../../common/api-endpoints";
import ApiResponses from "../../../common/api-responses";
import { toValidK8sName } from "../../../common/common-util";
import { DEFAULT_SECRET_NAMES } from "../../../common/default-secret-names";
import DataFetcher from "../../components/data-fetcher";
import { DataFetcherCard } from "../../components/data-fetcher-card";
import { NewTabLink } from "../../components/external-link";
import ProjectSelect from "../../components/project-select";
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
          creating <NewTabLink href="https://docs.github.com/en/actions/reference/encrypted-secrets">
            encrypted secrets
            </NewTabLink> in
          your repositories which you can then reference in your workflows to log in to this cluster.
          </p>
          <p>
            A Service Account Token will be created for each repository that you connect.
            This way, you can revoke a single {`repository's`} access by deleting its token without affecting other repositories.
            In addition, service account tokens do not expire and so are perfect for script use.
          </p>
          <p>
          </p>
          <p>
            <NewTabLink
              href={"https://github.com/redhat-actions/oc-login#readme"}
            >
              <CommonIcons.Documentation className="me-2" />
            Read More about using oc-login to log in to OpenShift from GitHub Actions.
            </NewTabLink>
            <br/>
            <NewTabLink
              href={"https://github.com/redhat-actions/oc-login/wiki/Using-a-Service-Account-for-GitHub-Actions"}
            >
              <CommonIcons.Documentation className="me-2" />
                Read More about authenticating using a service account for GitHub Actions.
            </NewTabLink>
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

export function SecretsWillBeCreatedCard(
  { project, createProjectSecret, serviceAccount }:
  { project?: string, createProjectSecret: boolean, serviceAccount?: string }
) {

  const count = createProjectSecret ? "three" : "two";

  return (
    <Card>
      <CardTitle>
        Secrets
      </CardTitle>
      <CardBody>
        <div>
          <p>
          To each repository, {count} secrets will be added:
          </p>
          <ol>
            <li>
              <code>{DEFAULT_SECRET_NAMES.clusterServerUrl}</code> will
                contain the URL to this OpenShift {"cluster's"} API server
              <DataFetcher type="api" endpoint={ApiEndpoints.Cluster.Root} loadingDisplay="none">{
                (clusterData: ApiResponses.ClusterState) => {
                  if (!clusterData.connected) {
                    return ".";
                  }

                  return (
                    <>
                    : <NewTabLink href={clusterData.clusterInfo.externalServer}>
                        {clusterData.clusterInfo.externalServer}
                      </NewTabLink>
                    </>
                  );
                }
              }
              </DataFetcher>
            </li>
            <li>
              <code>{DEFAULT_SECRET_NAMES.clusterToken}</code> will
              contain a Service Account Token for the service account,&nbsp;
              {
                project && serviceAccount ? <b>{project}/{serviceAccount} </b> : ""
              }
              which can be used to log into the OpenShift API server.
              A different service account token is generated for each repository, but they all log in as the same service account.
            </li>
            {
              createProjectSecret ?
                <li>
                  <code>{DEFAULT_SECRET_NAMES.namespace}</code> will contain the configured project{
                    project ? <>, <b>{project}</b></> : ""
                  }.
                </li>
                : ""
            }
          </ol>
        </div>
      </CardBody>
    </Card>
  );
}

export function ProjectSACards(
  {
    project, setProject, serviceAccount, setServiceAccount,
    createProjectSecret, setCreateProjectSecret,
  }: {
    project: string | undefined,
    setProject: (project: string | undefined) => void,
    serviceAccount: string | undefined,
    setServiceAccount: (serviceAccount: string | undefined, role: string | undefined) => void,
    createProjectSecret: boolean,
    setCreateProjectSecret: (createProjectSecret: boolean) => void,
  }
): JSX.Element {

  return (
    <DataFetcherCard type="api" title="Service Account for Workflow Authentication" endpoint={ApiEndpoints.Cluster.Projects.Root}>{
      (projectsRes: ApiResponses.UserProjects) => {

        return (
          <>
            <p>
              Select the project you want these repositories&apos; workflows to use for authentication.
              <br/>
              Workflows will execute in this project, and will not be able to access other projects.
            </p>

            <ProjectSelect projectsRes={projectsRes} project={project} setProject={setProject} />

            {
              projectsRes.projects.length > 0 ? (
                <Checkbox
                  id="create-ns-secret-cb"
                  className="my-3"
                  label={"Create an Actions secret containing this project"}
                  isChecked={createProjectSecret}
                  onChange={(checked) => { setCreateProjectSecret(checked); }}
                />
              ) : <></>
            }

            <ServiceAccountSection project={project} serviceAccount={serviceAccount} setServiceAccount={setServiceAccount} />
          </>
        );
      }
    }
    </DataFetcherCard>
  );
}

export const SERVICEACCOUNT_SELECT_ID = "service-account-select";

const DEFAULT_SA_ROLE = "edit";

export function ServiceAccountSection({
  project, serviceAccount, setServiceAccount,
}: {
  project: string | undefined, serviceAccount: string | undefined,
  setServiceAccount: (serviceAccount: string | undefined, role: string | undefined) => void,
}): JSX.Element {

  const [ isOpen, setIsOpen ] = useState(false);

  if (!project) {
    return (
      <></>
    );
  }

  return (
    <>
      <Divider className="my-4"/>
      <DataFetcher
        key={project} loadingDisplay="card-body" type="api"
        endpoint={ApiEndpoints.Cluster.Projects.ServiceAccounts.withParam(project)}
      >{
          ({ serviceAccounts }: ApiResponses.UserNamespacedServiceAccounts) => {
            if (serviceAccounts.length === 0) {
              return (
                <p className="error">
              There are no service account in {project}
                </p>
              );
            }

            const selectPlaceholder = "Select a Service Account, or start typing";

            return (
              <>
                <p>
                Select the Service Account in <b>{project}</b> you want these repositories to have access to.
                  <br/>
                The service account must be granted the permissions it needs to execute workflows.
                  <br/>
                You may enter the name of a new Service Account.
                </p>
                <div id={SERVICEACCOUNT_SELECT_ID}>
                  <Select
                    variant={SelectVariant.typeahead}
                    typeAheadAriaLabel={selectPlaceholder}
                    isCreatable={true}
                    onToggle={(isExpanded) => setIsOpen(isExpanded)}
                    onClear={() => setServiceAccount(undefined, undefined)}
                    isOpen={isOpen}
                    placeholderText={selectPlaceholder}
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
                      serviceAccounts.map((sa, i) => (
                        <SelectOption key={i} value={sa} />
                      ))
                    }
                  </Select>
                </div>

                {
                  serviceAccount && !serviceAccounts.includes(serviceAccount) ?
                    <p>
                      <CommonIcons.Info className="me-2"/>
                      A new Service Account <b>{serviceAccount}</b> will be created in the <b>{project}</b>{" "}
                      project and given the <b>{DEFAULT_SA_ROLE}</b> role.
                    </p>
                    : ""
                }
                {
                  project && serviceAccount ?
                    <p>
                  The Service Account tokens created, and copied into the Actions secrets, will belong to this service account.
                    </p>
                    : ""
                }

                <Divider className="my-3"/>
              </>
            );
          }
        }
      </DataFetcher>
    </>
  );
}
