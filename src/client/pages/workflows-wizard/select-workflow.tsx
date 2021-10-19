import { FormGroup, Radio, Title } from "@patternfly/react-core";
import { useContext } from "react";
import { WORKFLOW_INFOS } from "../../../common/workflows/workflows";
import { WorkflowsWizardContext } from "./workflows-wizard-state";

export default function WorkflowsWizardSelectWorkflow() {

  const wizardContext = useContext(WorkflowsWizardContext);
  const { workflow } = wizardContext.state;

  return (
    <>
      <Title headingLevel="h2" className="mb-3">
        What would you like this workflow to do?
      </Title>
      <FormGroup fieldId="workflow-radios">
        {
          Object.values(WORKFLOW_INFOS).map((wf) => {
            return (
              <Radio
                name={"workflow-radios-" + wf.name}
                id={"workflow-radios-" + wf.name}
                key={wf.name}
                isChecked={workflow?.name === wf.name}
                label={wf.name}
                description={wf.description}
                isDisabled={wf.disabled}
                onChange={(checked) => {
                  if (checked) {
                    wizardContext.dispatch({ workflow: wf, fileBasename: wf.defaultFilename, canFinish: false });
                  }
                }}
              />
            );
          })
        }
      </FormGroup>

      {/* <p>
        The workflow will be added to <NewTabLink href={repo.repo.html_url}>{repo.repo.full_name}</NewTabLink>.
      </p> */}
    </>
  );
}
