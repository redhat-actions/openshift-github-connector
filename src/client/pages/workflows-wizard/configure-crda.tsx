import {
  Checkbox, FormGroup, Select, SelectOption,
} from "@patternfly/react-core";
import semver from "semver";
import classNames from "classnames";
import _ from "lodash";
import { useContext, useReducer, useState } from "react";
import { uppercaseFirstChar, validatePath } from "../../../common/common-util";
import { CRDAWorkflowConfig } from "../../../common/workflows/workflows";
import { NewTabLink } from "../../components/external-link";
import ManagedTextInput from "../../components/managed-textinput";
import { TooltipIcon } from "../../components/tooltip-icon";
import { CommonIcons } from "../../util/icons";
import { WorkflowsWizardContext } from "./workflows-wizard-state";

const CRDA_REPO = "https://github.com/redhat-actions/crda";

function getCRDAFragmentLink(fragment: string): string {
  return `${CRDA_REPO}#${fragment}`;
}

export function ConfigureCRDAWorkflow(): JSX.Element {

  const { dispatch: wizardDispatch } = useContext(WorkflowsWizardContext);

  const [ authSelectOpen, setAuthSelectOpen ] = useState(false);
  const [ projectTypeSelectOpen, setProjectTypeSelectOpen ] = useState(false);
  // const [ failSelectOpen, setFailSelectOpen ] = useState(false);

  // setup version is required only if the project type is java
  const [ isSetupVersionReqd, setIsSetupVersionReqd ] = useState(false);

  const initialState: CRDAWorkflowConfig = {
    id: "code_scan",
    isConfigured: false,
    auth: {
      type: "snyk",
      token: "",
    },
    manifestDirectory: "",
    projectType: null,
    scanPRs: false,
  };

  const [ configState, configDispatch ] = useReducer((state: CRDAWorkflowConfig, action: Partial<CRDAWorkflowConfig>): CRDAWorkflowConfig => {
    const newState = _(state).assign(_.omitBy(action, _.isUndefined)).cloneDeep();

    const isConfigured = state.auth.token !== ""
      && state.projectType?.type != null
      && (isSetupVersionReqd ? state.projectType.setupVersion !== "" : true);

    newState.isConfigured = isConfigured;

    wizardDispatch({ workflowConfig: newState });

    return newState;
  }, initialState);

  const description = (
    <>
      <p>
        This workflow uses CodeReady Dependency Analytics (CRDA) to analyze your {"repository's"} dependencies for vulnerabilities.
      </p>
      <p>
        Scanning is supported for Go, Java, Node.js, and Python projects.
      </p>
      <p>
        <NewTabLink icon={{ position: "left", Icon: CommonIcons.Documentation }} href={getCRDAFragmentLink("README")}>
          Refer to the CRDA action README for more information.
        </NewTabLink>
      </p>
    </>
  );

  return (
    <>
      {description}
      {/* <Title headingLevel="h3">Configuration</Title> */}

      {/* <Divider className="my-2" /> */}

      <FormGroup fieldId="auth-method" label={
        <>
          Authentication Method (Required)
          <TooltipIcon
            body={<>Enter a Snyk token or CRDA key.</>}
            href={getCRDAFragmentLink("authentication")}
          />
        </>
      }>
        <p className="mt-0">
          You can authenticate using either a Snyk Token or a CRDA Key.
        </p>
        <div className="d-flex">
          <div className="me-2">
            <Select
              onToggle={(isExpanded) => {
                setAuthSelectOpen(isExpanded);
              }}
              isOpen={authSelectOpen}
              onSelect={(e, value, _isPlaceholder) => {

                let authType: CRDAWorkflowConfig["auth"]["type"];
                if (value.toString().toLowerCase().includes("snyk")) {
                  authType = "snyk";
                }
                else {
                  authType = "crda";
                }

                if (configState.auth.type !== authType) {
                  configDispatch({
                    auth: { token: "", type: authType },
                  });
                }

                setAuthSelectOpen(false);
              }}
              selections={[ configState.auth.type === "snyk" ? "Synk token" : "CRDA key" ]}
            >
              <SelectOption value="Snyk token" />
              <SelectOption value="CRDA key" />
            </Select>
          </div>

          <ManagedTextInput
            // isRequired={true}
            formGroupProps={{ className: "w-100 mb-0" }}
            placeholder={`* Paste your ${(configState.auth.type === "snyk" ? "Snyk token" : "CRDA key")} here`}
            value={configState.auth.token || null}
            onValueChange={(newValue) => {
              if (newValue != null) {
                configDispatch({ auth: { type: configState.auth.type, token: newValue } });
              }
            }}
          />
        </div>
      </FormGroup>

      <FormGroup fieldId="projectType" label={
        <>
          Project Type (Required)
          <TooltipIcon icon={CommonIcons.Help}
            body={
              <>
                Select the supported CRDA project type that fits your project.
              </>
            }
            href={getCRDAFragmentLink("installing-dependencies")}
          />
        </>
      }>
        <div style={{ width: "32ch" }}>
          <Select
            onToggle={(isExpanded) => {
              setProjectTypeSelectOpen(isExpanded);
            }}
            isOpen={projectTypeSelectOpen}
            onSelect={(e, v, isPlaceholder) => {
              if (isPlaceholder) {
                configDispatch({
                  projectType: null,
                });
              }
              else {
                const type = v.toString().toLowerCase() as NonNullable<CRDAWorkflowConfig["projectType"]>["type"];

                configDispatch({
                  projectType: {
                    type,
                    setupVersion: "",
                  },
                });
              }

              setIsSetupVersionReqd(configState.projectType?.type === "java");
              setProjectTypeSelectOpen(false);
            }}
            selections={
              configState.projectType ?
                [ uppercaseFirstChar(configState.projectType.type) ]
                : []
            }
          >
            <SelectOption isPlaceholder={true} value="* Select a project type" />
            <SelectOption value="Go" description="Go project with a go.mod" />
            <SelectOption value="Java" description="Java project with a pom.xml" />
            <SelectOption value="Node.js" description="Node.js project with a package.json"/>
            <SelectOption value="Python" description="Python project with a requirements.txt"/>
          </Select>

          {
            configState.projectType?.type ?
              <ManagedTextInput
                value={configState.projectType.setupVersion}
                formGroupProps={{
                  label: `Version of ${uppercaseFirstChar(configState.projectType.type)} `
                    + `to set up (${isSetupVersionReqd ? "Required" : "Optional"})`,
                  className: "mt-2",
                  helperText: `Eg. "${getDefaultVersionToInstall(configState.projectType.type)}"`,
                }}
                validate={(v) => {
                  if (!semver.validRange(v)) {
                    return `Unable to parse input as a semantic version. `
                      + `Try "3.0.0", "3.x", "^3", etc.`;
                  }
                  return undefined;
                }}
                onValueChange={(v) => {
                  const type = configState.projectType?.type;
                  if (!type) {
                    return;
                  }

                  configDispatch({
                    projectType: {
                      type,
                      setupVersion: v ?? "",
                    },
                  });
                }}
              />
              : <></>
          }
        </div>
      </FormGroup>

      <FormGroup fieldId="manifest-directory" label={
        <>
          Scan Pull Requests (Optional)
          <TooltipIcon icon={CommonIcons.Help}
            body={
              <>
                Path to the project directory to scan, relative to the repository root.
                This directory should contain one of the supported dependency manifests.
              </>
            }
            href={getCRDAFragmentLink("installing-dependencies")}
          />
        </>
      }>
        <Checkbox
          id="scan-prs"
          label="Scan Pull Requests"
          onChange={(checked) => configDispatch({ scanPRs: checked })}
          isChecked={configState.scanPRs}
        />
        <p className={classNames("tight", { "d-none": !configState.scanPRs })}>
          <CommonIcons.Warning className="me-2 text-warning" />
            Make sure you have read about the <NewTabLink href={getCRDAFragmentLink("scanning-pull-requests")}>
            security implications of scanning pull requests.
          </NewTabLink>
        </p>
      </FormGroup>

      <FormGroup fieldId="manifest-directory" label={
        <>
          Path to project within repository (Optional)
          <TooltipIcon icon={CommonIcons.Help}
            body={
              <>
                Path to the project directory to scan, relative to the repository root.
                This directory should contain one of the supported dependency manifests.
              </>
            }
            href={getCRDAFragmentLink("installing-dependencies")}
          />
        </>
      }>
        <ManagedTextInput
          value={configState.manifestDirectory}
          onValueChange={(v) => {
            configDispatch({ manifestDirectory: v ?? "" });
          }}
          placeholder="Leave blank to use repository root"
          validate={(v) => validatePath(v, { allowEmpty: true, filenameOnly: false })}
        />
      </FormGroup>

      {/* <FormGroup fieldId="failure-behaviour" label={
        <>
          Fail the workflow if a vulnerability is found
          <TooltipIcon icon={CommonIcons.Help}
            body={
              <>
                Configure if the workflow step should fail if an error or warning is found.
              </>
            }
            href={getCRDAFragmentLink("action-inputs")}
          />
        </>
      }>
        <div
          style={{ width: "32ch" }}
        >
          <Select
            onToggle={(isExpanded) => {
              setFailSelectOpen(isExpanded);
            }}
            isOpen={failSelectOpen}
            onSelect={(e, v, _isPlaceholder) => {
              configDispatch({ failOn: v.toString().toLowerCase() as CRDAWorkflowConfig["failOn"] });
              setFailSelectOpen(false);
            }}
            selections={[ uppercaseFirstChar(configState.failOn) ]}
          >
            <SelectOption description={"Fail if a 'warning' level vulnerability is found"} value="Warning" />
            <SelectOption description={"Fail if an 'error' level vulnerability is found"} value="Error" />
            <SelectOption description={"Never fail the workflow step"} value="Never" />
          </Select>
        </div>
      </FormGroup> */}
    </>
  );
}

function getDefaultVersionToInstall(projectType: NonNullable<CRDAWorkflowConfig["projectType"]>["type"] | undefined): string {
  if (projectType === "go") {
    return "1.17";
  }
  else if (projectType === "java") {
    return "11";
  }
  else if (projectType === "node.js") {
    return "14";
  }
  else if (projectType === "python") {
    return "3.9";
  }
  return "";
}
