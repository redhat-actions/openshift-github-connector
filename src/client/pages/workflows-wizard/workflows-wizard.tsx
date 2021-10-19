import { Button, Modal, Title } from "@patternfly/react-core";
import {
  useContext, useMemo, useReducer,
} from "react";
import { useHistory } from "react-router-dom";
import ApiEndpoints from "../../../common/api-endpoints";
import ApiRequests from "../../../common/api-requests";
import ApiResponses from "../../../common/api-responses";
import { joinList } from "../../../common/common-util";
import { toGitHubRepoId } from "../../../common/types/gh-types";
import { WORKFLOW_INFOS } from "../../../common/workflows/workflows";
import BtnBody from "../../components/btn-body";
import { NewTabLink } from "../../components/external-link";
import MyWizard, { MyWizardStep, toWizardStep } from "../../components/my-wizard";
import RepoSelectorCard from "../../components/repo-selector";
import { fetchJSON } from "../../util/client-util";
import { CommonIcons } from "../../util/icons";
import ClientPages from "../client-pages";
import ConfigureWorkflow from "./configure-workflow";
import WorkflowsWizardSelectWorkflow from "./select-workflow";
import WorkflowFileNameCard from "./workflow-file-name";
import {
  clearWizardState, getWorkflowsWizardInitialState, WorkflowsWizardContext, workflowsWizardReducer,
} from "./workflows-wizard-state";

const SELECT_WORKFLOW_PATH = "select-workflow";
const SELECT_REPO_PATH = "select-repo";

export function getWorkflowsWizardFirstPagePath(): string {
  return ClientPages.AddWorkflowsIndex.path + "/" + SELECT_WORKFLOW_PATH;
}

export default function WorkflowsWizard() {
  const [ state, dispatch ] = useReducer(workflowsWizardReducer, getWorkflowsWizardInitialState());
  const store = useMemo(() => ({ state, dispatch }), [ state ]);

  const steps: MyWizardStep[] = [];
  let i = 0;

  steps.push(toWizardStep(
    <WorkflowsWizardSelectWorkflow />,
    "Select Workflow",
    SELECT_WORKFLOW_PATH,
    i++, {
      enableNext: state.workflow != null,
      // isFinishedStep: state.workflow != null,
    }
  ));

  steps.push(toWizardStep(
    <WorkflowsWizardSelectRepo />,
    "Select Repository",
    SELECT_REPO_PATH,
    i++, {
      canJumpTo: state.workflow != null,
      enableNext: state.workflow != null && state.repo != null,
      // isFinishedStep: state.repo != null,
    }
  ));

  // const configurePage = useRef(<p className="error">Please complete the earlier steps.</p>);

  steps.push(toWizardStep(
    <WorkflowFileNameCard />,
    "Enter File Name",
    "filename",
    i++, {
      canJumpTo: state.repo != null && state.workflow != null,
    }
  ));

  steps.push(toWizardStep(
    <ConfigureWorkflow />,
    "Configure Workflow",
    "configure-workflow",
    i++, {
      canJumpTo: state.repo != null && state.workflow != null,
      enableNext: state.canFinish,
    }
  ));

  return (
    <>
      <WorkflowsWizardContext.Provider value={store}>
        <MyWizard
          steps={steps}
          submittingMsg={`Creating workflow, this will take a few seconds...`}
          submit={async () => {
            const result = finishWizard(store);
            clearWizardState();
            return result;
          }}
          ResultModal={ResultModal}
        />
      </WorkflowsWizardContext.Provider>
    </>
  );
}

async function finishWizard(context: WorkflowsWizardContext): Promise<ApiResponses.WorkflowCreationResult> {

  const { state } = context;
  const { workflowConfig } = state;

  if (state.repo == null) {
    throw new Error(`No repository set`);
  }
  if (state.fileBasename == null) {
    throw new Error(`No filename set`);
  }
  if (workflowConfig == null) {
    throw new Error(`Workflow not configured`);
  }

  const reqBody: ApiRequests.CreateWorkflow = {
    repo: toGitHubRepoId(state.repo.repo),
    fileBasename: state.fileBasename,
    fileExtension: state.fileExtension,
    workflowConfig,
  };

  const res = await fetchJSON<typeof reqBody, ApiResponses.WorkflowCreationResult>("POST", ApiEndpoints.App.Workflows.path, reqBody);
  return res;
}

function WorkflowsWizardSelectRepo() {

  const wizardContext = useContext(WorkflowsWizardContext);
  const { repo, workflow } = wizardContext.state;

  return (
    <>
      <Title headingLevel="h2">
        Add {workflow ? workflow.name + " " : ""}Workflow
      </Title>

      <RepoSelectorCard
        selection={repo ? [{ repoWithSecrets: repo, isChecked: true }] : []}
        setSelection={(selectedRepo) => {
          const newRepo = selectedRepo.filter((rws) => rws.isChecked)[0].repoWithSecrets;
          wizardContext.dispatch({ repo: newRepo, canFinish: false });
        }}
        clusterSecrets={{
          requiredForSelection: wizardContext.state.workflow?.requiresClusterSecrets ?? false,
        }}
        selectType="single"
      />
    </>
  );
}

function ResultModal({
  result,
  onReset,
}: {
  result: ApiResponses.WorkflowCreationResult | undefined,
  onReset: () => void,
}) {

  const history = useHistory();

  if (!result) {
    return <></>;
  }

  const actionBtns = [];

  let secretsMsg = <></>;
  let title = "Failure";
  let msg = <>{result.message}</>;

  if (result.success) {
    if (result.createdSecrets.length > 0) {
      secretsMsg = (
        <>
          Created secret{result.createdSecrets.length !== 1 ? "s" : ""} <b>{joinList(result.createdSecrets)}</b> in <b>{result.repo.full_name}</b>.
        </>
      );
    }

    const workflowInfo = WORKFLOW_INFOS[result.id];

    // title = <><CommonIcons.Warning className="me-2 text-warning" /> Successfully added {workflowInfo.name} workflow</>;
    title = `Successfully added ${workflowInfo.name} workflow`;

    msg = (
      <>
        Successfully opened pull request <b>#{result.prNumber}</b> against <b>
          {result.repo.full_name}
        </b> to add the <b>{workflowInfo.name}</b> workflow.
      </>
    );

    actionBtns.push([
      // <Button key="1" variant="secondary">
      //   <NewTabLink href={result.urls.workflowFile}>
      //     <BtnBody icon={CommonIcons.GitHub} text="View Workflow" />
      //   </NewTabLink>
      // </Button>,

      <Button key={1} variant="primary">
        <NewTabLink href={result.urls.pullRequest}>
          <BtnBody icon={CommonIcons.GitHub} text="View Pull Request" />
        </NewTabLink>
      </Button>,

      <Button className="ms-auto" key="4" variant="primary"
        onClick={() => history.push(ClientPages.AddWorkflowsIndex.path)}
      >
        <BtnBody icon={CommonIcons.Add} text="Add Another Workflow" />
      </Button>,
    ]);
  }

  return (
    <Modal
      variant={"large"}
      onClose={() => {
        if (result.success) {
          history.push("/");
        }
        else {
          onReset();
        }
      }}
      titleIconVariant={result.success ? "success" : "warning"}
      title={title}
      actions={actionBtns}
      isOpen={/* result != null */ true}
    >
      <p>
        {msg}
      </p>
      <p>
        {secretsMsg}
      </p>
    </Modal>
  );
}
