import classNames from "classnames";
import React, { useState } from "react";
import {
  Button, Card, CardTitle, CardBody,
  FormGroup, TextInput, FormSelect, Checkbox,
  Radio,
} from "@patternfly/react-core";
import {
  BookOpenIcon, CogIcon, ExclamationTriangleIcon, GithubIcon,
  PlusIcon, SyncAltIcon, YoutubeIcon,
} from "@patternfly/react-icons";
import { Link } from "react-router-dom";
import ApiEndpoints from "../../common/api-endpoints";
import ApiRequests from "../../common/api-requests";
import ApiResponses from "../../common/api-responses";
import { STARTER_WORKFLOW } from "../../common/common-util";
import { GitHubRepoId } from "../../common/types/gh-types";
import Banner from "../components/banner";
import DataFetcher from "../components/data-fetcher";
import { ExternalLink } from "../components/external-link";
import BtnBody from "../components/btn-body";
import { fetchJSON } from "../util/client-util";
import ClientPages from "./client-pages";
import { CommonIcons } from "../util/icons";
import NamespaceSelect from "../components/namespace-select";
import { PushAlertContext } from "../contexts";

const DEFAULT_WORKFLOW_FILE_BASENAME = "openshift";
const WORKFLOW_FILE_EXTENSION = ".yml";
const WORKFLOWS_DIR = ".github/workflows/";

const DEFAULT_PORT = 3000;

interface AddWorkflowsPageState {
  repo?: GitHubRepoId,
  workflowFile: {
    name: string,
    extension: string,
    validationErr: string | null | undefined,
  },
  overwriteExistingWorkflow: boolean,
  imageRegistryId?: string,
  port: string,
  namespace?: string,

  isSubmitting: boolean,
  submissionResult?: ApiResponses.WorkflowCreationResult,
}

export default class AddWorkflowsPage extends React.Component<{}, AddWorkflowsPageState> {

  static override contextType = PushAlertContext;
  override context!: React.ContextType<typeof PushAlertContext>;

  private readonly bannerId = "submission-banner";
  private readonly fileNameInputId = "filename-input";
  private readonly imageRegistrySelectId = "image-registry-select";

  constructor(props: {}) {
    super(props);
    this.state = {
      workflowFile: {
        name: DEFAULT_WORKFLOW_FILE_BASENAME,
        extension: WORKFLOW_FILE_EXTENSION,
        validationErr: undefined,
      },
      overwriteExistingWorkflow: false,
      isSubmitting: false,
      port: DEFAULT_PORT.toString(),
    };

    this.setWorkflowFileName(DEFAULT_WORKFLOW_FILE_BASENAME);
  }

  override render(): JSX.Element {
    return (
      <>
        <Card>
          <CardTitle>
            Add Starter Workflow to Repository
          </CardTitle>
          <CardBody>
            <p>
              Here you can add the starter workflow and maybe some other ones to your repositories.
            </p>
            <p>
              For more information about the starter workflow,
              you can:
            </p>
            <ul className="no-bullets">
              <li>
                <ExternalLink href={STARTER_WORKFLOW.htmlFile}>
                  <GithubIcon className="me-2" />
                  View it on GitHub
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href={STARTER_WORKFLOW.blog}>
                  <BookOpenIcon className="me-2" />
                  Read the blog
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href={STARTER_WORKFLOW.youtube}>
                  <YoutubeIcon className="me-2"/>
                  Watch the video
                </ExternalLink>
              </li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardTitle>
            Workflow File Name
          </CardTitle>
          <CardBody>
            <p>
              Workflow files are kept in the {`repository's`} <code>{WORKFLOWS_DIR}</code> directory.
              The directory will be created if it does not exist.
            </p>
            <FormGroup
              className="pt-2"
              fieldId={this.fileNameInputId}
              validated={this.state.workflowFile.validationErr == null ? "success" : "error"}
              helperTextInvalid={this.state.workflowFile.validationErr}
              label={"File name"}
            >
              <TextInput
                style={{ width: "20ch" }}
                className="me-0"
                id={this.fileNameInputId}
                validated={this.state.workflowFile.validationErr == null ? "success" : "error"}
                defaultValue={DEFAULT_WORKFLOW_FILE_BASENAME}
                onChange={(value) => this.setWorkflowFileName(value)}
              />
              <TextInput isReadOnly
                style={{ width: "8ch" }}
                type="text"
                value={this.state.workflowFile.extension}
              />
              <Checkbox
                className="my-3"
                id="overwrite-workflow-file"
                isChecked={this.state.overwriteExistingWorkflow}
                onChange={(checked) => this.setState({ overwriteExistingWorkflow: checked })}
                label={
                  <>
                    Overwrite <code>
                      {WORKFLOWS_DIR + (this.state.workflowFile.name || "(invalid)") + this.state.workflowFile.extension}
                    </code> if it exists
                  </>}
              />
            </FormGroup>
          </CardBody>
        </Card>

        <DataFetcher type="api" endpoint={ApiEndpoints.User.ImageRegistries} loadingDisplay="card">{
          (registriesRes: ApiResponses.ImageRegistryListResult, reload) => {

            return (
              <Card>
                <CardTitle>
                  <div>
                    Application Settings
                  </div>
                  <div className="ms-auto">
                    <div className="btn-line">
                      <Button variant="primary">
                        <Link to={ClientPages.ImageRegistries.path}>
                          <BtnBody icon={CommonIcons.Configure} text="Edit Image Registries" />
                        </Link>
                      </Button>
                      <Button variant="primary"
                        onClick={reload}
                      >
                        <BtnBody icon={CommonIcons.Reload} text="Reload"/>
                      </Button>
                    </div>
                  </div>
                </CardTitle>
                <CardBody>
                  {
                    (() => {
                      if (!registriesRes.success) {
                        return (
                          <Banner
                            severity="danger"
                            title={"Failed to get image registries: " + registriesRes.message}
                          />
                        );
                      }

                      if (registriesRes.registries.length === 0) {
                        return (
                          <Banner
                            severity="warning"
                            title="No image registries are configured. Click Edit Image Registries to set up an image registry."
                          />
                        );
                      }

                      return (
                        <>
                          <FormGroup
                            fieldId="registry"
                            helperText={<div>
                              An Actions secret called &quot;<b>{registriesRes.registryPasswordSecretName}</b>&quot; containing
                              the password for this registry will be created.
                            </div>
                            }
                          >
                            <FormSelect
                              id={this.imageRegistrySelectId}
                              onChange={(value) => {
                                this.setState({ imageRegistryId: value });
                              }}
                              className="col-6"
                              label="Image Registry"
                            >
                              <option disabled selected value={undefined}>
                                Select an Image Registry
                              </option>
                              {
                                registriesRes.registries.map((reg) => {
                                  return (
                                    <option
                                      value={reg.id}
                                      key={reg.id}
                                      selected={this.state.imageRegistryId === reg.id}
                                    >
                                      {reg.username}@{reg.fullPath}
                                    </option>
                                  );
                                })
                              }
                            </FormSelect>
                          </FormGroup>
                        </>
                      );
                    })()
                  }

                  <FormGroup
                    fieldId="port"
                    helperTextInvalid="Port must be a number between 1024 and 65536."
                    label="Application Port"
                  >
                    <TextInput
                      className="w-50"
                      validated={validatePort(this.state.port) ? "success" : "error"}
                      value={this.state.port}
                      onChange={(value) => this.setState({ port: value })}
                    />
                  </FormGroup>

                  <NamespacePickerWithSecretOption
                    namespace={this.state.namespace}
                    setNamespace={(newNamespace) => this.setState({ namespace: newNamespace })}
                  />
                </CardBody>
              </Card>
            );
          }}
        </DataFetcher>

        <DataFetcher type="api" endpoint={ApiEndpoints.App.Repos.Secrets} loadingDisplay="card">{
          (reposWithSecrets: ApiResponses.ReposSecretsStatus, reload) => {
            return (
              <div className="pb-4">
                <Card>
                  <CardTitle>
                    <div>
                      Select repository
                    </div>
                    <div className="ms-auto">
                      <div className="btn-line">
                        <Button variant="primary">
                          <ExternalLink
                            href={reposWithSecrets.urls.installationSettings}
                          >
                            <BtnBody icon={CogIcon} text="Edit Installation" />
                          </ExternalLink>
                        </Button>
                        <Button variant="primary"
                          onClick={reload}
                        >
                          <BtnBody icon={SyncAltIcon} text="Reload"/>
                        </Button>
                      </div>
                    </div>
                  </CardTitle>
                  <CardBody>
                    <div className="long-content">
                      {
                        reposWithSecrets.repos.map((repo, i) => {
                          const isEven = i % 2 === 0;

                          return (
                            <div key={repo.repo.id}
                              className={classNames(
                                "center-y m-0 p-3 rounded",
                                { "bg-darker": !isEven }
                              )}
                            >
                              <Radio
                                id={repo.repo.id + "-radio"}
                                name={repo.repo.id + "-radio"}
                                className="flex-grow-1"
                                isChecked={this.state.repo?.id === repo.repo.id}
                                onChange={(_checked: boolean) => {
                                  this.setState({
                                    repo: {
                                      id: repo.repo.id,
                                      full_name: repo.repo.full_name,
                                      owner: repo.repo.owner.login,
                                      name: repo.repo.name,
                                    },
                                  });
                                }}
                                isDisabled={!repo.hasClusterSecrets}
                                title={repo.hasClusterSecrets ? repo.repo.full_name : "Cannot select - Missing required secrets"}
                                label={repo.repo.full_name}
                              />

                              { repo.hasClusterSecrets ? "" :
                                <div className="col-4 centers">
                                  <ExclamationTriangleIcon className="text-warning me-2" />
                                  Missing cluster secrets
                                </div>
                              }

                              <div className="col-1 center-y justify-content-end">
                                <Button
                                  variant="tertiary"
                                  title={repo.repo.html_url}
                                >
                                  <ExternalLink
                                    href={repo.repo.html_url}
                                  >
                                    <BtnBody icon={CommonIcons.GitHub} />
                                  </ExternalLink>
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  </CardBody>
                </Card>

                <div className="my-3">
                  <div className="center-y justify-content-end">
                    <Button
                      disabled={this.state.repo == null}
                      onClick={async (_e) => {
                        this.setState({ isSubmitting: true, submissionResult: undefined });
                        try {
                          await this.submitCreateWorkflow();
                        }
                        catch (err) {
                          this.context({ severity: "warning", title: err.message });
                        }
                        finally {
                          this.setState({ isSubmitting: false });
                          const banner = document.getElementById(this.bannerId);
                          if (banner && banner.style.display !== "none") {
                            banner.scrollIntoView();
                          }
                        }
                      }}>
                      <BtnBody
                        icon={PlusIcon} text="Create Workflow"
                        title={this.state.repo == null ? "Select a repository to proceed" : "Create Workflow"}
                        isLoading={this.state.isSubmitting}
                      />
                    </Button>
                  </div>
                </div>

                <SubmissionStatusBanner
                  bannerId={this.bannerId}
                  isSubmitting={this.state.isSubmitting}
                  submissionResult={this.state.submissionResult}
                />
              </div>
            );
          }
        }
        </DataFetcher>
      </>
    );
  }

  private setWorkflowFileName(basename: string): void {
    const oldValue = this.state.workflowFile.name;
    const extension = WORKFLOW_FILE_EXTENSION;

    this.setState({ workflowFile: { name: oldValue, extension, validationErr: undefined } });

    try {
      if (basename.length === 0) {
        throw new Error("Cannot be empty.");
      }
      if (basename.endsWith(".yml") || basename.endsWith(".yaml")) {
        throw new Error("Don't include a YAML file extension; it is done for you.");
      }
      if ((/^.*[\\/\\<>:"*|].*$/.test(basename))) {
        throw new Error(`Illegal character in filename.`);
      }

      this.setState({ workflowFile: { name: basename, extension, validationErr: undefined } });
    }
    catch (err) {
      this.setState({ workflowFile: { name: "", extension, validationErr: err.message } });
    }
  }

  private async submitCreateWorkflow(): Promise<void> {
    if (!this.state.repo) {
      throw new Error("No repository selected.");
    }
    else if (this.state.workflowFile.validationErr || !this.state.workflowFile.name) {
      throw new Error("Invalid workflow filename. Fix the workflow filename above.");
    }
    else if (!this.state.imageRegistryId) {
      throw new Error(`Select an image registry to use.`);
    }
    else if (!validatePort(this.state.port)) {
      throw new Error(`Invalid port.`);
    }

    const reqBody: ApiRequests.CreateWorkflow = {
      repo: this.state.repo,
      workflowFile: this.state.workflowFile,
      overwriteExisting: this.state.overwriteExistingWorkflow,
      imageRegistryId: this.state.imageRegistryId,
      port: Number(this.state.port),
      namespace: this.state.namespace,
    };

    const res = await fetchJSON<typeof reqBody, ApiResponses.WorkflowCreationResult>("POST", ApiEndpoints.App.Workflows, reqBody);

    this.setState({ submissionResult: res });
  }
}

function validatePort(portStr: string | number): boolean {
  const port = Number(portStr);
  return !Number.isNaN(port) && port > 1024 && port < 65536;
}

function NamespacePickerWithSecretOption({
  namespace, setNamespace,
}: {
  namespace: string | undefined,
  setNamespace: (newNamespace: string | undefined) => void,
}): JSX.Element {

  const [ isUsingSecret, setIsUsingSecret ] = useState(false);

  return (
    <FormGroup fieldId="namespace" label="Namespace">
      <DataFetcher loadingDisplay="text" type="api" endpoint={ApiEndpoints.Cluster.Namespaces.Root}>{
        (namespacesRes: ApiResponses.UserNamespaces) => {
          const nsSecretName = "OPENSHIFT_NAMESPACE";

          return (
            <>
              <Checkbox
                className="py-2"
                id="use-namespace-secret"
                label={<>Use value of <code>{nsSecretName}</code> secret as namespace</>}
                isChecked={isUsingSecret}
                onChange={(checked) => {
                  if (checked) {
                    setIsUsingSecret(true);
                    setNamespace(`\${{ secrets.${nsSecretName} }}`);
                  }
                  else {
                    setIsUsingSecret(false);
                    setNamespace(undefined);
                  }
                }}
              />
              <NamespaceSelect
                isDisabled={isUsingSecret}
                namespacesRes={namespacesRes}
                namespace={isUsingSecret ? `${nsSecretName} secret ` : namespace}
                setNamespace={setNamespace}
              />
            </>
          );
        }
      }
      </DataFetcher>
    </FormGroup>
  );
}

function SubmissionStatusBanner(props: {
  bannerId: string,
  isSubmitting: boolean,
  submissionResult?: ApiResponses.WorkflowCreationResult,
}): JSX.Element {

  if (props.isSubmitting) {
    return (
      <Banner id={props.bannerId}
        display={props.isSubmitting}
        severity={"info"}
        loading={props.isSubmitting}
        title={"Creating workflow..."}
      />
    );
  }
  else if (!props.submissionResult) {
    return <Banner id={props.bannerId} display={false} />;
  }

  return (
    <>
      <Banner
        id={props.bannerId}
        display={true}
        severity={props.submissionResult.severity}
        title={props.submissionResult.message}
      />

      {
        props.submissionResult.success ? (
          <div className="centers">
            <div className="w-75 btn-line even">
              <Button variant="secondary">
                <ExternalLink href={props.submissionResult.secretsUrl}>
                  <BtnBody icon={CommonIcons.GitHub} text="View Secrets"/>
                </ExternalLink>
              </Button>

              <Button variant="secondary">
                <ExternalLink href={props.submissionResult.workflowFileUrl}>
                  <BtnBody icon={CommonIcons.GitHub} text="View Workflow" />
                </ExternalLink>
              </Button>
            </div>
          </div>
        ) : ("")
      }
    </>
  );
}
