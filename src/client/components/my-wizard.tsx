import {
  Button, Spinner, Wizard, WizardStep,
} from "@patternfly/react-core";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "@patternfly/react-icons";
import { useContext, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { PushAlertContext } from "../contexts";
import BtnBody from "./btn-body";

export type MyWizardStep = WizardStep & {
  index: number,
  // onNext?: () => void,
  path: string,
};

export interface MyWizardProps<ResultType> {
  steps: MyWizardStep[],
  submit: () => Promise<ResultType>,
  submittingMsg?: string,
  // statusComponent?: React.ReactNode,
  ResultModal?: React.ComponentType<{ result: ResultType | undefined, onReset: () => void }>,
  // postPagePath: string,
}

export function toWizardStep(
  // Component: React.ComponentType<any>,
  Component: JSX.Element,
  name: string,
  path: string,
  index: number,
  options: Partial<WizardStep> = {}
): MyWizardStep {
  return {
    ...options,
    index,
    name,
    id: path,
    component: <>{Component}</>,
    path,
  };
}

export default function MyWizard<ResultType>({
  steps, submit, submittingMsg, ResultModal,
}: MyWizardProps<ResultType>) {

  const history = useHistory();

  const [ isLoading, setIsLoading ] = useState<boolean>(false);
  const [ result, setResult ] = useState<ResultType>();

  const { page } = useParams<{ page?: string }>();

  const pushAlert = useContext(PushAlertContext);

  const currentStep = steps.find((s) => s.path === page);

  if (!currentStep) {
    return (
      <p className="error">
        Could not find wizard step with path {`"${page}"`}.
      </p>
    );
  }

  return (
    <>
      {
        ResultModal != null && result != null ?
          <ResultModal result={result} onReset={() => setResult(undefined) } />
          : <></>
      }
      <Wizard
        key={currentStep.index}
        hideClose={true}
        // title={"Setup OpenShift GitHub Connector"}
        // description={"Description"}
        steps={steps}
        // step={currentStep}
        startAtStep={currentStep.index + 1}

        // onSave={() => history.push(ClientPages.SetupFinished.path)}

        onGoToStep={(
          newStep: { id?: string | number | undefined, name: React.ReactNode },
          _prevStep: { prevId?: string | number | undefined, prevName: React.ReactNode }
        ) => {
          const newCurrentStep = steps.find((s) => s.id === newStep.id);
          if (!newCurrentStep) {
            console.error(`Failed to find new step from ${JSON.stringify(newStep)}`);
            return;
          }
          history.push(newCurrentStep.path);
          // setCurrentStep(newCurrentStep);
        }}
        footer={
          <WizardFooter
            currentStep={currentStep}
            wizardSteps={steps}
            isLoading={isLoading}
            submittingMsg={submittingMsg}
            // statusComponent={statusComponent}
            nextStepCallback={async (isFinalStep) => {
              // no throw
              setIsLoading(true);
              try {
                if (isFinalStep) {
                  const newResult = await submit();
                  setResult(newResult);
                  return;
                }
                const nextStep = steps[currentStep.index + 1];
                history.push(nextStep.path);
              }
              catch (err) {
                pushAlert({ severity: "warning", title: err.message });
              }
              finally {
                setIsLoading(false);
              }
            }}
          />
        }
      />
    </>
  );
}

function WizardFooter({
  currentStep,
  wizardSteps,
  // statusComponent,
  isLoading,
  submittingMsg,
  nextStepCallback,
}: {
  currentStep: MyWizardStep,
  wizardSteps: MyWizardStep[],
  // statusComponent: React.ReactNode,
  submittingMsg?: string,
  isLoading: boolean,
  nextStepCallback: (isFinalStep: boolean) => Promise<void>,
}): JSX.Element {
  const history = useHistory();

  const isFinalStep = currentStep.index === wizardSteps.length - 1;

  const enableNext = currentStep.enableNext ?? true;
  const nextBtnText = isFinalStep ? "Finish" : "Next";

  return (
    <>
      <div className="p-4 d-flex justify-content-between">
        <Button isDisabled={currentStep.index === 0 || isLoading}
          onClick={() => {
            const prevStep = wizardSteps[currentStep.index - 1];
            history.push(prevStep.path);
          }}
        >
          <BtnBody icon={ArrowLeftIcon} text="Back" />
        </Button>
        {/* {statusComponent} */}
        {isLoading ?
          <>
            <div className="centers">
              <Spinner size="lg" className="mx-3" />
              {submittingMsg || "Submitting..."}
            </div>
          </>
          : ""
        }
        <Button
          onClick={() => nextStepCallback(isFinalStep)}
          isDisabled={!enableNext || isLoading}
          title={enableNext ? nextBtnText : "Complete this page to proceed."}
        >
          <BtnBody
            icon={isFinalStep ? CheckIcon : ArrowRightIcon} iconPosition="right"
            text={nextBtnText}
            // isLoading={isLoading}
          />
        </Button>
      </div>
    </>
  );
}
