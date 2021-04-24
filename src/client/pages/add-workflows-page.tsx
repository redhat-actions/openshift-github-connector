import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import React from "react";
import { Button, Card, Form } from "react-bootstrap";
import ApiEndpoints from "../../common/api-endpoints";
import ApiRequests from "../../common/api-requests";
import ApiResponses from "../../common/api-responses";
import { STARTER_WORKFLOW } from "../../common/common-util";
import { GitHubRepoId } from "../../common/types/github-types";
import ImageRegistry from "../../common/types/image-registries";
import Banner from "../components/banner";
import DataFetcher from "../components/data-fetcher";
import { ExternalLink } from "../components/external-link";
import BtnBody from "../components/fa-btn-body";
import { fetchJSON } from "../util/client-util";

const defaultWorkflowFileBasename = "openshift";

interface AddWorkflowsPageState {
  imageRegistry: ImageRegistry.Info,
  repo?: GitHubRepoId,
  workflowFileName: {
    name?: string,
    validationErr?: string,
  },
  overwriteExistingWorkflow: boolean,

  isSubmitting: boolean,
  submissionResult?: ApiResponses.WorkflowCreationResult,
}

export default class AddWorkflowsPage extends React.Component<{}, AddWorkflowsPageState> {

  private readonly repoGroupName="repo-radiogroup";
  private readonly bannerId = "submission-banner";
  private readonly fileNameInputId = "filename-input";

  constructor(props: {}) {
    super(props);
    this.state = {
      imageRegistry: {
        type: "GHCR",
        hostname: ImageRegistry.GHCR_HOSTNAME,
      },
      workflowFileName: {
        name: defaultWorkflowFileBasename,
      },
      overwriteExistingWorkflow: false,
      // overwriteExistingWorkflow: true,
      isSubmitting: false,
    };

    this.setWorkflowFileName(defaultWorkflowFileBasename);
  }

  public render(): JSX.Element {

    return (
      <React.Fragment>
        <Card>
          <Card.Title>
            Add Starter Workflow to Repository
          </Card.Title>
          <Card.Body>
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
                  <FontAwesomeIcon fixedWidth icon={[ "fab", "github" ]} className="mr-2 text-light" />
                  View it on GitHub
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href={STARTER_WORKFLOW.blog}>
                  <FontAwesomeIcon fixedWidth icon="book-open" className="mr-2 text-light" />
                  Read the blog
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href={STARTER_WORKFLOW.youtube}>
                  <FontAwesomeIcon fixedWidth icon={[ "fab", "youtube" ]} className="mr-2 text-light" />
                  Watch the video
                </ExternalLink>
              </li>
            </ul>
          </Card.Body>
        </Card>

        <ContainerImageRegistryCard
          currentImageRegistry={this.state.imageRegistry}
          setImageRegistry={(imageRegistry: ImageRegistry.Info) => this.setState({ imageRegistry })}
        />

        <Card>
          <Card.Title>
            Workflow File Name
          </Card.Title>
          <Card.Body>
            <p>
              Workflow files will be placed under the {`repository's`} <code>.github/workflows/</code> directory.
              The directory will be created if it does not exist.
            </p>
            <Form inline className="pt-4">
              <Form.Control type="text"
                id={this.fileNameInputId}
                style={{ width: "25ch" }}
                isValid={this.state.workflowFileName.validationErr == null}
                isInvalid={this.state.workflowFileName.validationErr != null}
                defaultValue={defaultWorkflowFileBasename}
                onChange={(e) => this.setWorkflowFileName(e.currentTarget.value)}
              />
              <Form.Control style={{ width: "8ch" }} type="text" readOnly disabled value=".yml" />

              <Form.Control.Feedback style={{ minHeight: "2em" }} type={this.state.workflowFileName.validationErr ? "invalid" : "valid"}>
                {this.state.workflowFileName.validationErr ?? ""}
              </Form.Control.Feedback>
            </Form>
          </Card.Body>
        </Card>

        <DataFetcher type="api" endpoint={ApiEndpoints.App.Repos.Secrets} loadingDisplay="card">{
          (reposWithSecrets: ApiResponses.ReposSecretsStatus, reload) => {
            return (
              <React.Fragment>
                <Card>
                  <Card.Title>
                    <div>
                      Select repository
                    </div>
                    <div className="ml-auto">
                      <div className="btn-line">
                        <Button variant="primary">
                          <ExternalLink
                            href={reposWithSecrets.urls.installationSettings}
                          >
                            <BtnBody icon="cog" text="Edit Installation" />
                          </ExternalLink>
                        </Button>
                        <Button variant="primary"
                          onClick={reload}
                        >
                          <BtnBody icon="sync-alt" text="Reload"/>
                        </Button>
                      </div>
                    </div>
                  </Card.Title>
                  <Card.Body>
                    {
                      reposWithSecrets.repos.map((repo, i) => {
                        const isEven = i % 2 === 0;

                        return (
                          <div key={repo.repo.id}
                            className={classNames("d-flex align-items-center b p-3 rounded", { "bg-darker": isEven, "bg-lighter": !isEven })}
                          >
                            <label className="flex-grow-1 d-flex align-items-center clickable">
                              <input type="radio"
                                name={this.repoGroupName}
                                onChange={(_e) => {
                                  this.setState({
                                    repo: {
                                      id: repo.repo.id,
                                      full_name: repo.repo.full_name,
                                      owner: repo.repo.owner.login,
                                      name: repo.repo.name,
                                    },
                                  });
                                }}
                                disabled={!repo.hasClusterSecrets}
                              />
                              {repo.repo.full_name}
                            </label>

                            <Button variant="light"
                              title="GitHub Repository"
                            >
                              <ExternalLink
                                href={repo.repo.html_url}
                              >
                                <BtnBody icon={[ "fab", "github" ]} />
                              </ExternalLink>
                            </Button>
                          </div>
                        );
                      })
                    }

                    <div className="mt-4 mb-2 d-flex justify-content-end align-items-center">
                      <Button size="lg"
                        disabled={this.state.repo == null}
                        onClick={async (_e) => {
                          this.setState({ isSubmitting: true, submissionResult: undefined });
                          try {
                            await this.submitCreateWorkflow();
                          }
                          catch (err) {
                            this.setState({ submissionResult: { message: err.message, success: false, severity: err.severity ?? "danger" } });
                          }
                          finally {
                            this.setState({ isSubmitting: false });
                            const banner = document.getElementById(this.bannerId);
                            // banner?.focus();
                            banner?.scrollIntoView();
                          }
                        }}>
                        <BtnBody text="Create Workflow" />
                      </Button>
                    </div>

                    <SubmissionStatusBanner
                      bannerId={this.bannerId}
                      isSubmitting={this.state.isSubmitting}
                      submissionResult={this.state.submissionResult}
                    />
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

  private setWorkflowFileName(basename: string): void {
    const oldValue = this.state.workflowFileName.name;
    this.setState({ workflowFileName: { name: oldValue, validationErr: undefined } });

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

      this.setState({ workflowFileName: { name: basename, validationErr: undefined } });
    }
    catch (err) {
      this.setState({ workflowFileName: { name: undefined, validationErr: err.message } });
    }
  }

  private async submitCreateWorkflow(): Promise<void> {
    if (!this.state.repo) {
      throw new Error("No repository selected.");
    }
    else if (this.state.workflowFileName.validationErr || !this.state.workflowFileName.name) {
      throw new Error("Invalid workflow filename. Fix the workflow filename above.");
    }

    const reqBody: ApiRequests.CreateWorkflow = {
      repo: this.state.repo,
      workflowFileName: this.state.workflowFileName.name,
      overwriteExisting: this.state.overwriteExistingWorkflow,
      imageRegistry: this.state.imageRegistry,
    };

    const res = await fetchJSON<typeof reqBody, ApiResponses.WorkflowCreationResult>("POST", ApiEndpoints.App.Workflows, reqBody);

    this.setState({ submissionResult: res });
  }
}

function ContainerImageRegistryCard(props: {
  currentImageRegistry: ImageRegistry.Info,
  setImageRegistry: (registry: ImageRegistry.Info) => void,
}): JSX.Element {

  const registryRadioGroup = "image-registry-radiogroup";

  return (
    <Card>
      <Card.Title>
        Container Image Registry
      </Card.Title>
      <Card.Body>
        <p>
          The starter workflow requires a Container Image Registry to push built images to, and pull images from.
        </p>
        <p>
          You can use the <ExternalLink href="https://docs.github.com/en/packages/guides/about-github-container-registry">
            GitHub container registry
          </ExternalLink>, the <ExternalLink
            href="https://docs.openshift.com/container-platform/4.7/registry/architecture-component-imageregistry.html">
            OpenShift Integrated Registry
          </ExternalLink>,
          or another image registry such
          as <ExternalLink href="https://quay.io">quay.io</ExternalLink> or <ExternalLink href="https://www.docker.com/products/docker-hub">
            DockerHub
          </ExternalLink>.
        </p>

        <p>
          The GitHub registry is the default because it requires the least configuration.
        </p>

        <div className="b w-50">
          {
            Object.keys(ImageRegistry.Registries).map((registry_) => {
              const registryType = registry_ as ImageRegistry.Type;
              const disabled = !ImageRegistry.Registries[registryType].enabled;
              const text = `Use ${ImageRegistry.Registries[registryType].description}`;

              return (
                <label key={registryType}
                  className={classNames("d-flex align-items-center clickable py-1", { disabled })}
                  title={disabled ? "Not implemented" : text}
                >
                  <input type="radio"
                    name={registryRadioGroup}
                    defaultChecked={props.currentImageRegistry.type === registryType}
                    onChange={(_e) => {
                      props.setImageRegistry({
                        type: registryType,
                        hostname: ImageRegistry.GHCR_HOSTNAME,
                      });
                    }}
                    disabled={disabled}
                  />
                  {text}
                </label>
              );
            })
          }
        </div>
        <div>
          <Form inline className="my-4">
            <Form.Group>
              <Form.Label>
                Image registry hostname:
                <Form.Control type="text" className="ml-3"
                  isValid={true}
                  isInvalid={false}
                  value={props.currentImageRegistry.hostname}
                  readOnly
                />
              </Form.Label>
              <Form.Control.Feedback>
              </Form.Control.Feedback>
            </Form.Group>
          </Form>
        </div>

        <p>
          (this setting has no effect)
        </p>
      </Card.Body>
    </Card>
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
    <React.Fragment>
      <Banner
        id={props.bannerId}
        display={true}
        severity={props.submissionResult.severity}
        title={props.submissionResult.message}
      />

      {
        props.submissionResult.success ? (
          <div className="d-flex align-items-center justify-content-end">
            <Button variant="info" size="lg">
              <ExternalLink href={props.submissionResult.url}>
                <BtnBody icon={[ "fab", "github" ]} iconClasses="text-black" text="View in GitHub"/>
              </ExternalLink>
            </Button>
          </div>
        ) : ("")
      }
    </React.Fragment>
  );
}
