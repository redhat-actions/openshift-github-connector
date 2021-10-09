import {
  Title,
} from "@patternfly/react-core";
import {
  useContext,
} from "react";
import { GitHubRepo } from "../../../common/types/gh-types";
import { LoginWorkflowConfig } from "../../../common/workflows/workflows";
import { NewTabLink } from "../../components/external-link";
import ProjectSelect from "../../components/project-select";
import { ConfigureCRDAWorkflow } from "./configure-crda";
import { NamespaceSelectWithSecretOption } from "./namespace-select-secret";
import ConfigureStarterWorkflow from "./starter-workflow";
import { WorkflowsWizardContext } from "./workflows-wizard-state";

export interface ConfigureWorkflowProps {
  repo: GitHubRepo,
}

export default function ConfigureWorkflow() {

  const { repo, workflow } = useContext(WorkflowsWizardContext).state;

  if (!repo) {
    return <p className="error">
      No repository selected. Click Select Repository.
    </p>;
  }

  if (!workflow) {
    return <p className="error">
      No workflow selected. Click Select Workflow.
    </p>;
  }

  // const submitEventTarget = new EventTarget();

  let ConfigureWorkflowPage: React.ComponentType<ConfigureWorkflowProps>;

  if (workflow.id === "starter") {
    ConfigureWorkflowPage = ConfigureStarterWorkflow;
  }
  else if (workflow.id === "login") {
    ConfigureWorkflowPage = ConfigureLoginWorkflow;
  }
  else if (workflow.id === "code_scan") {
    ConfigureWorkflowPage = ConfigureCRDAWorkflow;
  }
  else {
    throw new Error(`Unsupported workflow ID "${workflow.id}"`);
  }

  return (
    <>
      <Title headingLevel="h2">
        Adding {workflow.name} Workflow to <NewTabLink href={repo.repo.html_url}>{repo.repo.full_name}</NewTabLink>
      </Title>

      <ConfigureWorkflowPage repo={repo.repo} />
    </>
  );
}

function ConfigureLoginWorkflow(/* {}: WorkflowConfigPageProps */) {

  const id = "login";

  const { state, dispatch } = useContext(WorkflowsWizardContext);

  const workflowConfig = state.workflowConfig as LoginWorkflowConfig | null;

  if (!workflowConfig) {
    dispatch({ workflowConfig: { id, isConfigured: true } });
  }

  const description = (
    <>
      <p>
        This workflow logs into OpenShift, and can optionally set your Kubernetes context&apos;s namespace.
      </p>
      <p>
        If no namespace is selected, your user&apos;s default namespace will be used.
      </p>
    </>
  );

  if (state.repo?.hasNamespaceSecret) {
    return (
      <>
        {description}
        <p>
          <NamespaceSelectWithSecretOption
            namespace={workflowConfig?.namespace}
            setNamespace={(namespace) => {
              dispatch({ workflowConfig: { id, namespace, isConfigured: true } });
            }}
            isOptional={true}
          />
        </p>
      </>
    );
  }

  return (
    <>
      {description}
      <p>
        <ProjectSelect
          project={workflowConfig?.namespace}
          setProject={(namespace) => {
            if (namespace !== workflowConfig?.namespace) {
              dispatch({ workflowConfig: { id, namespace, isConfigured: true } });
            }
          }}
          isOptional={true}
        />
      </p>
    </>
  );
}
