import {
  Button, Card, CardBody, CardTitle, Form, FormGroup, FormSelect, FormSelectOption,
} from "@patternfly/react-core";
import _ from "lodash";
import React from "react";
import ApiEndpoints from "../../../common/api-endpoints";
import ApiResponses from "../../../common/api-responses";
import { validatePath } from "../../../common/common-util";
import { GitHubRepo, resolveGitHubFileUrl } from "../../../common/types/gh-types";
import { StarterWorkflowConfig, WORKFLOW_INFOS } from "../../../common/workflows/workflows";
import MyBanner from "../../components/banner";
import BtnBody from "../../components/btn-body";
import DataFetcher from "../../components/data-fetcher";
import { NewTabLink } from "../../components/external-link";
import ManagedTextInput from "../../components/managed-textinput";
import { TooltipIcon } from "../../components/tooltip-icon";
import { CommonIcons } from "../../util/icons";
import ClientPages from "../client-pages";
import { ConfigureWorkflowProps } from "./configure-workflow";
import { NamespaceSelectWithSecretOption } from "./namespace-select-secret";
import { WorkflowsWizardContext } from "./workflows-wizard-state";

export default class ConfigureStarterWorkflow extends React.Component<ConfigureWorkflowProps, StarterWorkflowConfig> {

  static override contextType = WorkflowsWizardContext;
  override context!: React.ContextType<typeof WorkflowsWizardContext>;

  constructor(props: ConfigureWorkflowProps) {
    super(props);
    this.state = {
      id: "starter",
      isConfigured: true,
      containerfileLocation: "./Dockerfile",
    };
  }

  override render(): JSX.Element {
    return (
      <>
        <p>
          The Starter workflow builds a container image from your application, pushes it to an image registry,
          and then rolls out a deployment of that application to your OpenShift cluster.
        </p>
        <p>
          This is the same workflow created by GitHub&apos;s <b>New workflow</b> feature, if you select the OpenShift workflow.
        </p>
        <NewTabLink href={resolveGitHubFileUrl(WORKFLOW_INFOS[this.state.id].templateFileLocation)}>
          <CommonIcons.GitHub className="me-2" />
          View the workflow on GitHub
        </NewTabLink>
        {/* <Card>
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
        </Card> */}

        <>
          <Card>
            <CardTitle>
              Application Settings
            </CardTitle>
            <CardBody className="w-75">
              <Form>
                <ManagedTextInput
                  formGroupProps={{
                    label: (
                      <>
                        Containerfile path (Required)
                        <TooltipIcon
                          body="Click to read more"
                          href="https://github.com/redhat-actions/buildah-build#building-using-containerfiles"
                        />
                      </>
                    ),
                    helperText: "Enter the path to your Containerfile or Dockerfile, relative to the repository root.",
                  }}

                  value={this.state.containerfileLocation}
                  onValueChange={(newValue) => {
                    if (newValue == null) {
                      this.setState({ containerfileLocation: "", isConfigured: false });
                    }
                    else {
                      this.setState({ containerfileLocation: newValue, isConfigured: true });
                    }
                  }}
                  validate={(s) => validatePath(s, { allowEmpty: false, filenameOnly: false })}
                />
                <ManagedTextInput
                  formGroupProps={{
                    label: (
                      <>
                        Application Port (Optional)
                        <TooltipIcon
                          body="Click to read more"
                          href="https://github.com/redhat-actions/oc-new-app#action-inputs"
                        />
                      </>
                    ),
                    helperText: "Enter the port to which your containerized application should receive traffic.",
                  }}

                  placeholder={"Leave blank if your Containerfile exposes exactly one port."}

                  value={this.state.port == null ? null : this.state.port}
                  onValueChange={(port) => {
                    if (port === null) {
                      this.setState({ isConfigured: false });
                    }
                    else {
                      this.setState({ port, isConfigured: true });
                    }
                  }}

                  validate={validatePort}
                />

                <NamespaceSelectWithSecretOption
                  isOptional={true}
                  namespace={this.state.namespace}
                  setNamespace={(namespace) => this.setState({ namespace })}
                />
              </Form>
            </CardBody>
          </Card>
          <ImageRegistriesCard
            repo={this.props.repo}
            imageRegistryId={this.state.imageRegistryId}
            setImageRegistryId={(imageRegistryId) => this.setState({ imageRegistryId })}
          />
        </>
      </>
    );
  }

  override componentDidMount() {
    this.context.dispatch({
      workflowConfig: this.state,
    });
  }

  override componentDidUpdate() {
    const oldConfig = this.context.state.workflowConfig;

    if (!_.isEqual(oldConfig, this.state)) {
      this.context.dispatch({
        workflowConfig: this.state,
      });
    }
  }
}

function validatePort(portStr: string | number | undefined): string | undefined {
  if (portStr === "") {
    // empty string is allowed
    return undefined;
  }

  const port = Number(portStr);

  const valid = !Number.isNaN(port) && port > 1024 && port < 65536;

  if (!valid) {
    return "Port must be a number between 1024 and 65536.";
  }
  return undefined;
}

const IMAGE_REGISTRY_SELECT_ID = "image-registry-select";

function ImageRegistriesCard(
  { imageRegistryId, setImageRegistryId, repo }:
  { imageRegistryId: string | undefined, setImageRegistryId: (reg: string | undefined) => void, repo: GitHubRepo }
) {

  const editRegistriesBtnText = "Edit Image Registries";

  return (
    <DataFetcher type="api" endpoint={ApiEndpoints.User.ImageRegistries} loadingDisplay="card">{
      (registriesRes: ApiResponses.ImageRegistryListResult, reload) => (
        <Card>
          <CardTitle>
            <div>
              Image Registry (Optional)
            </div>
            <div className="ms-auto">
              <div className="btn-line">
                <Button variant="primary">
                  <NewTabLink href={ClientPages.ImageRegistries.path}>
                    <BtnBody icon={CommonIcons.Configure} text={editRegistriesBtnText} />
                  </NewTabLink>
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
                    <MyBanner
                      severity="danger"
                      title={"Failed to get image registries: " + registriesRes.message}
                    />
                  );
                }

                const ghcrLink = `https://ghcr.io/${repo.owner.login}/${repo.name}`;

                if (registriesRes.registries.length === 0) {
                  return (
                    <>
                      <p>
                        No image registries are configured. Click <b>{editRegistriesBtnText}</b> to set up an image registry.
                      </p>
                      <p>
                        If no image registry is selected,
                        the image will be pushed to the GitHub Container Registry under this repository: <NewTabLink href={ghcrLink}>
                          {ghcrLink}
                        </NewTabLink>
                      </p>
                    </>
                  );
                }

                return (
                  <>
                    <FormGroup
                      fieldId="registry"
                      // validated={this.state.imageRegistryId == null ? "warning" : "default"}
                      helperText={imageRegistryId == null
                        ? <p></p>
                        : <p>
                          An Actions secret called <b>{registriesRes.registryPasswordSecretName}</b> containing
                          the password or token for <b>
                            {registriesRes.registries.find((r) => r.id === imageRegistryId)?.fullPathAsUser}
                          </b> will be created.
                        </p>
                      }
                    >
                      <FormSelect
                        id={IMAGE_REGISTRY_SELECT_ID}
                        onChange={(value) => {
                          setImageRegistryId(value);
                        }}
                        value={imageRegistryId}
                        label="Image Registry"
                        // validated={imageRegistryId == null ? "warning" : "default"}
                      >
                        <FormSelectOption
                          isDisabled
                          // selected={this.state.imageRegistryId == null}
                          value={undefined}
                          label={"Select an Image Registry"}
                        />
                        {
                          registriesRes.registries.map((reg) => {
                            return (
                              <FormSelectOption
                                value={reg.id}
                                key={reg.id}
                                // selected={imageRegistryId === reg.id}
                                label={reg.fullPathAsUser}
                              />
                            );
                          })
                        }
                      </FormSelect>
                    </FormGroup>
                  </>
                );
              })()
            }

          </CardBody>
        </Card>
      )}
    </DataFetcher>
  );
}
