import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import React from "react";
import {
  Button, Card, Col, Form,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import ApiEndpoints from "../../common/api-endpoints";
import ApiRequests from "../../common/api-requests";
import ApiResponses from "../../common/api-responses";
import { STARTER_WORKFLOW } from "../../common/common-util";
import { GitHubRepoId } from "../../common/types/gh-types";
import Banner from "../components/banner";
import DataFetcher from "../components/data-fetcher";
import { ExternalLink } from "../components/external-link";
import BtnBody from "../components/fa-btn-body";
import FormInputCheck from "../components/form-input-check";
import { fetchJSON } from "../util/client-util";
import ClientPages from "./client-pages";

const DEFAULT_WORKFLOW_FILE_BASENAME = "openshift";
const WORKFLOW_FILE_EXTENSION = ".yml";
const WORKFLOWS_DIR = ".github/workflows/";

interface AddWorkflowsPageState {
  imageRegistryId?: string,
  repo?: GitHubRepoId,
  workflowFile: {
    name: string,
    extension: string,
    validationErr?: string,
  },
  overwriteExistingWorkflow: boolean,

  isSubmitting: boolean,
  submissionResult?: ApiResponses.WorkflowCreationResult,
}

export default class AddWorkflowsPage extends React.Component<{}, AddWorkflowsPageState> {

  private readonly bannerId = "submission-banner";
  private readonly fileNameInputId = "filename-input";
  private readonly imageRegistrySelectId = "image-registry-select";

  constructor(props: {}) {
    super(props);
    this.state = {
      workflowFile: {
        name: DEFAULT_WORKFLOW_FILE_BASENAME,
        extension: WORKFLOW_FILE_EXTENSION,
      },
      overwriteExistingWorkflow: false,
      isSubmitting: false,
    };

    this.setWorkflowFileName(DEFAULT_WORKFLOW_FILE_BASENAME);
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

        <Card>
          <Card.Title>
            Workflow File Name
          </Card.Title>
          <Card.Body>
            <p>
              Workflow files will be placed under the {`repository's`} <code>{WORKFLOWS_DIR}</code> directory.
              The directory will be created if it does not exist.
            </p>
            <Form inline className="pt-4">
              <Form.Control type="text"
                id={this.fileNameInputId}
                style={{ width: "25ch" }}
                isValid={this.state.workflowFile.validationErr == null}
                isInvalid={this.state.workflowFile.validationErr != null}
                defaultValue={DEFAULT_WORKFLOW_FILE_BASENAME}
                onChange={(e) => this.setWorkflowFileName(e.currentTarget.value)}
              />
              <Form.Control
                style={{ width: "8ch" }}
                className="border-none"
                type="text"
                readOnly
                value={this.state.workflowFile.extension}
              />

              <Form.Control.Feedback style={{ minHeight: "2em" }} type={this.state.workflowFile.validationErr ? "invalid" : "valid"}>
                {this.state.workflowFile.validationErr ?? ""}
              </Form.Control.Feedback>
            </Form>
          </Card.Body>
        </Card>

        <DataFetcher type="api" endpoint={ApiEndpoints.User.ImageRegistries} loadingDisplay="card">{
          (registriesRes: ApiResponses.ImageRegistryListResult, reload) => {

            return (
              <Card>
                <Card.Title>
                  <div>
                    Image Registry
                  </div>
                  <div className="ml-auto">
                    <div className="btn-line">
                      <Button variant="primary">
                        <Link to={ClientPages.ImageRegistries.path}>
                          <BtnBody icon="cog" text="Edit Image Registries" />
                        </Link>
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
                        <React.Fragment>
                          <Form.Row className="w-50">
                            <Form.Group as={Col}>
                              {/* <Form.Label>
                                Select an Image Registry
                              </Form.Label> */}
                              <Form.Control id={this.imageRegistrySelectId} as="select"
                                // isValid={this.state.imageRegistryId != null}
                                onChange={(e) => {
                                  this.setState({ imageRegistryId: e.currentTarget.value });
                                }}
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
                              </Form.Control>
                            </Form.Group>
                          </Form.Row>
                          <p className={classNames({ "d-none": this.state.imageRegistryId == null })}>
                            An Actions secret called <code>{registriesRes.registryPasswordSecretName}</code> containing
                            the password for this registry will be created.
                          </p>
                        </React.Fragment>
                      );
                    })()
                  }
                </Card.Body>
              </Card>
            );
          }}
        </DataFetcher>

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
                    <div className="long-content">
                      {
                        reposWithSecrets.repos.map((repo, i) => {
                          const isEven = i % 2 === 0;

                          return (
                            <div key={repo.repo.id}
                              className={classNames(
                                "row m-0 p-3 rounded",
                                { "bg-darker": isEven, "bg-lighter": !isEven }
                              )}
                            >
                              <FormInputCheck
                                className="flex-grow-1"
                                checked={this.state.repo?.id === repo.repo.id}
                                type="radio"
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
                                disabled={!repo.hasClusterSecrets}
                                title={repo.hasClusterSecrets ? repo.repo.full_name : "Cannot select - Missing required secrets"}
                              >
                                {repo.repo.full_name}
                              </FormInputCheck>

                              { repo.hasClusterSecrets ? "" :
                                <div className="col-4 centers">
                                  <FontAwesomeIcon className="text-warning mr-2" fixedWidth icon="exclamation-triangle" />
                                  Missing cluster secrets
                                </div>
                              }

                              <div className="col-1 d-flex align-items-center justify-content-end">
                                <Button
                                  variant="light"
                                  title={repo.repo.html_url}
                                >
                                  <ExternalLink
                                    href={repo.repo.html_url}
                                  >
                                    <BtnBody icon={[ "fab", "github" ]} />
                                  </ExternalLink>
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>

                    <div className="mt-4 mb-2 d-flex justify-content-between align-items-center">
                      <div>
                        <FormInputCheck
                          bold={false}
                          checked={this.state.overwriteExistingWorkflow}
                          type="checkbox"
                          onChange={(checked) => this.setState({ overwriteExistingWorkflow: checked })}
                        >
                          Overwrite <code>
                            {WORKFLOWS_DIR + (this.state.workflowFile.name || "(invalid)") + this.state.workflowFile.extension}
                          </code> if it exists
                        </FormInputCheck>
                      </div>
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
                        <BtnBody
                          icon="plus" text="Create Workflow"
                          title={this.state.repo == null ? "Select a repository to proceed" : "Create Workflow"}
                        />
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

    const reqBody: ApiRequests.CreateWorkflow = {
      repo: this.state.repo,
      workflowFile: this.state.workflowFile,
      overwriteExisting: this.state.overwriteExistingWorkflow,
      imageRegistryId: this.state.imageRegistryId,
    };

    const res = await fetchJSON<typeof reqBody, ApiResponses.WorkflowCreationResult>("POST", ApiEndpoints.App.Workflows, reqBody);

    this.setState({ submissionResult: res });
  }
}

function SubmissionStatusBanner(props: {
  bannerId: string,
  isSubmitting: boolean,
  submissionResult?: ApiResponses.WorkflowCreationResult,
}): JSX.Element {

  if (props.isSubmitting) {
    return (
      <Banner id={props.bannerId}
        className="my-3"
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
        className="my-3"
        id={props.bannerId}
        display={true}
        severity={props.submissionResult.severity}
        title={props.submissionResult.message}
      />

      {
        props.submissionResult.success ? (
          <div className="centers">
            <div className="w-75 btn-line even">
              <Button variant="info" size="lg">
                <ExternalLink href={props.submissionResult.secretsUrl}>
                  <BtnBody icon={[ "fab", "github" ]} iconClasses="text-black" text="View Secrets"/>
                </ExternalLink>
              </Button>

              <Button variant="info" size="lg">
                <ExternalLink href={props.submissionResult.workflowFileUrl}>
                  <BtnBody icon={[ "fab", "github" ]} iconClasses="text-black" text="View Workflow"/>
                </ExternalLink>
              </Button>
            </div>
          </div>
        ) : ("")
      }
    </React.Fragment>
  );
}
