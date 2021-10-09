import { createContext } from "react";
import _ from "lodash";

import { RepoWithSecrets } from "../../../common/types/gh-types";
import { WorkflowConfig, WorkflowInfo } from "../../../common/workflows/workflows";

export interface WorkflowsWizardState {
  // [key: string]: unknown,
  repo: RepoWithSecrets | null,
  workflow: WorkflowInfo | null,
  workflowConfig: WorkflowConfig | null,
  fileBasename: string | null,
  fileExtension: string,

  canFinish: boolean,

  // result: ApiResponses.WorkflowCreationResult | null,

  // onFinish: (config: WorkflowConfig) => Promise<ApiResponses.WorkflowCreationResult | undefined>,
}

export type WorkflowsWizardContext = {
  state: WorkflowsWizardState,
  dispatch: React.Dispatch<Partial<WorkflowsWizardState>>,
};

export const WorkflowsWizardContext = createContext<WorkflowsWizardContext>({} as WorkflowsWizardContext);

const WIZARD_LOCAL_STATE = "workflows-wizard-state";

export function getWorkflowsWizardInitialState(): WorkflowsWizardState {
  const savedStateStr = localStorage.getItem(WIZARD_LOCAL_STATE);
  if (savedStateStr) {
    const savedState = JSON.parse(savedStateStr);

    if (savedState != null) {
      return savedState;
    }
    // if the saved config is null, the saved state is invalid and we have to clear it
    clearWizardState();
  }

  const defaultInitialState: WorkflowsWizardState = {
    repo: null,
    workflow: null,
    workflowConfig: null,
    fileBasename: "openshift",
    fileExtension: ".yml",
    canFinish: false,
  };

  return defaultInitialState;
}

export function workflowsWizardReducer(state: WorkflowsWizardState, action: Partial<WorkflowsWizardState>): WorkflowsWizardState {

  // console.log(`wizard context old state ${JSON.stringify(state)}`);
  // console.log(`wizard context action ${JSON.stringify(action)}`);

  // copy null objects into the state, but ignore undefined ones.
  // clone is required to trigger useMemo to re-save the state otherwise it doesn't update. This doesn't seem optimal but works for now.
  const newState = _(state).assign(_.omitBy(action, _.isUndefined)).cloneDeep();

  const canFinish = newState.repo && newState.workflow && (newState.workflowConfig?.isConfigured);
  newState.canFinish = canFinish != null && canFinish;

  localStorage.setItem(WIZARD_LOCAL_STATE, JSON.stringify(newState));

  return newState;
}

export function clearWizardState(): void {
  localStorage.removeItem(WIZARD_LOCAL_STATE);
}
