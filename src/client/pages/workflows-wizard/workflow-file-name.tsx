import { FormGroup, TextInput, Title } from "@patternfly/react-core";
import { useContext, useState } from "react";
import { validatePath } from "../../../common/common-util";
import { GITHUB_WORKFLOWS_DIR } from "../../../common/workflows/workflows";
import { WorkflowsWizardContext } from "./workflows-wizard-state";

export const FILENAME_INPUT_ID = "filename-input";
// const EXTENSION = ".yml";

export default function WorkflowFileNameCard() {

  const { state, dispatch } = useContext(WorkflowsWizardContext);

  // const [ basename, setBasename ] = useState<string>(state.file?.name ?? defaultBasename);
  // const [ overwrite, setOverwrite ] = useState<boolean>(state.file?.overwrite ?? false);
  const [ err, setErr ] = useState<string>();

  // const { dispatch } = useContext(WorkflowsWizardContext);

  return (
    <>
      <Title headingLevel="h2">
        Workflow File Name
      </Title>
      <p>
          Workflow files are kept in the {`repository's`} <code>{GITHUB_WORKFLOWS_DIR}</code> directory.
          The directory will be created if it does not exist.
      </p>
      <FormGroup
        className="pt-2"
        fieldId={FILENAME_INPUT_ID}
        validated={err == null ? "success" : "error"}
        helperTextInvalid={err}
        label={"File name"}
      >
        <TextInput
          style={{ width: "20ch" }}
          className="me-0"
          id={FILENAME_INPUT_ID}
          validated={err == null ? "success" : "error"}
          defaultValue={state.fileBasename ?? ""}
          onChange={(value) => {
            let validationErr = validatePath(value, { allowEmpty: false, filenameOnly: true });

            if (validationErr == null) {
              if (value.endsWith(".yml") || value.endsWith(".yaml")) {
                validationErr = "Don't include a YAML file extension; it is done for you.";
              }
            }

            setErr(validationErr);

            if (validationErr) {
              dispatch({ fileBasename: null });
            }
            else {
              dispatch({ fileBasename: value });
            }
          }}
        />
        <TextInput isReadOnly
          id="extension"
          style={{ width: "8ch" }}
          type="text"
          value={state.fileExtension}
        />
      </FormGroup>
      <p>
        <code>
          {(state.repo?.repo.full_name ?? "<repository>") + "/" + GITHUB_WORKFLOWS_DIR + (state.fileBasename ?? "(invalid)") + (state.fileExtension)}
        </code>
          will be created.
      </p>

      {/* <Checkbox
          className="my-3"
          id="overwrite-workflow-file"
          isChecked={state.file?.overwrite}
          onChange={(checked) => {
            dispatch({ file: { overwrite: checked } });
          }}
          label={
            <>
              <b>Overwrite</b> file if it exists
            </>
          }
        />
        */}
    </>
  );
}
