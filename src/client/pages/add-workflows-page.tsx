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

const defaultWorkflowFileBasename = "openshift";

interface AddWorkflowsPageState {
  imageRegistryId?: string,
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

  private readonly bannerId = "submission-banner";
  private readonly fileNameInputId = "filename-input";
  private readonly imageRegistrySelectId = "image-registry-select";

  constructor(props: {}) {
    super(props);
    this.state = {
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
                        <Form.Row className="w-50">
                          <Form.Group as={Col}>
                            <Form.Label>
                              Select an Image Registry
                            </Form.Label>
                            <Form.Control id={this.imageRegistrySelectId} as="select" onChange={(e) => {
                              this.setState({ imageRegistryId: e.currentTarget.value });
                            }}>
                              {
                                registriesRes.registries.map((reg) => {
                                  return (
                                    <option
                                      value={reg.id}
                                      key={reg.id}
                                    >
                                      {reg.username}@{reg.fullPath}
                                    </option>
                                  );
                                })
                              }
                            </Form.Control>
                          </Form.Group>
                        </Form.Row>
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
                                className="col-6"
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

                              <div className="col-4 centers">
                                { repo.hasClusterSecrets ? "" :
                                  <div>
                                    <FontAwesomeIcon className="text-warning mr-2" fixedWidth icon="exclamation-triangle" />
                                  Missing cluster secrets
                                  </div>
                                }
                              </div>

                              <div className="col-2 d-flex align-items-center justify-content-end">
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

                    <div className="mt-4 mb-2 d-flex justify-content-end align-items-center">
                      <Button size="lg"
                        disabled={this.state.repo == null}
                        title={this.state.repo == null ? "Select a repository to proceed" : "Create Workflow"}
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
                        <BtnBody icon="plus" text="Create Workflow" />
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
    else if (!this.state.imageRegistryId) {
      throw new Error(`Select an image registry to use.`);
    }

    const reqBody: ApiRequests.CreateWorkflow = {
      repo: this.state.repo,
      workflowFileName: this.state.workflowFileName.name,
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
