import { useContext } from "react";
import { useHistory, useParams } from "react-router-dom";
import {
  Button, Wizard, WizardStep,
} from "@patternfly/react-core";

import { ArrowLeftIcon, ArrowRightIcon } from "@patternfly/react-icons";
import { UserContext } from "../../contexts";
import ClientPages from "../client-pages";
import { ConnectorUserInfo } from "../../../common/types/user-types";
import BtnBody from "../../components/btn-body";
import WelcomePage from "./welcome-page";
import SetupAppPage from "./gh-app/setup-app";
import { InstallExistingAppPage } from "./gh-app/install-existing-app-card";
import GitHubAppPage from "../gh-app-page";
import ConnectReposPage from "./connect-repos-page";

type MyWizardStep = WizardStep & { index: number, path: string };

/*
export function getCurrentSetupStep(search: string, maxStep?: number): number {

  const searchParams = new URLSearchParams(search);
  let step = Number(searchParams.get(SETUP_STEP_SEARCHPARAM));
  if (Number.isNaN(step) || step < 1 || (maxStep != null && step > maxStep)) {
    step = 1;
  }

  return step;
}
*/

// export const SETUP_STEP_SEARCHPARAM = "step";

export default function SetupWizard(): JSX.Element {

  const history = useHistory();

  const { user } = useContext(UserContext);

  const wizardSteps = getWizardSteps(user);

  const { page } = useParams<{ page?: string }>();

  const currentStep = wizardSteps.find((s) => s.id === page) ?? wizardSteps[0];

  return (
    <Wizard
      key={currentStep.index}
      hideClose={true}
      // title={"Setup OpenShift GitHub Connector"}
      // description={"Description"}
      steps={wizardSteps}
      // step={currentStep}
      startAtStep={currentStep.index + 1}

      // onSave={() => history.push(ClientPages.SetupFinished.path)}

      onGoToStep={
        (
          newStep: { id?: string | number | undefined, name: React.ReactNode },
          _prevStep: { prevId?: string | number | undefined, prevName: React.ReactNode }
        ) => {
          const newCurrentStep = wizardSteps.find((s) => s.id === newStep.id);
          if (!newCurrentStep) {
            console.error(`Failed to find new step from ${JSON.stringify(newStep)}`);
            return;
          }
          history.push(newCurrentStep.path);
          // setCurrentStep(newCurrentStep);
        }
      }
      footer={<WizardFooter
        currentStep={currentStep}
        wizardSteps={wizardSteps}
      />}
    />
  );
}

function WizardFooter(
  {
    currentStep, wizardSteps,
  }:
  { currentStep: MyWizardStep, wizardSteps: MyWizardStep[] /* setCurrentStep: (newCurrentStep: MyWizardStep) => void */ }
): JSX.Element {
  const history = useHistory();

  return (
    <>
      <div className="p-4 d-flex justify-content-between">
        <Button isDisabled={currentStep.index === 0}
          onClick={() => {
            const prevStep = wizardSteps[currentStep.index - 1];
            history.push(prevStep.path);
          }}
        >

          <BtnBody icon={ArrowLeftIcon} text="Back" />
        </Button>
        {
          currentStep.enableNext !== false ?
            <Button onClick={() => {
              const nextStep = wizardSteps[currentStep.index + 1];
              history.push(nextStep.path);

              if (currentStep.index === wizardSteps.length - 1) {
                history.push(ClientPages.SetupFinished.path);
              }
            }}>
              <BtnBody
                icon={ArrowRightIcon} iconPosition="right"
                text={currentStep.index === wizardSteps.length ? "Finish" : "Next"}
              />
            </Button>
            : ""
        }

      </div>
    </>
  );
}

export const SetupPagePaths = {
  WELCOME: "welcome",
  SETUP_APP: "app",
  INSTALL_APP: "install",
  VIEW_APP: "view-app",
  CONNECT_REPOS: "connect-repos",
};

export function getSetupPagePath(page: keyof typeof SetupPagePaths): string {
  return "/setup/" + SetupPagePaths[page];
}

function getWizardSteps(user: ConnectorUserInfo): MyWizardStep[] {
  const wizardSteps: MyWizardStep[] = [];

  let i = 0;

  wizardSteps.push(toWizardStep(WelcomePage, "Welcome", "welcome", i++));

  if (user.isAdmin) {
    wizardSteps.push(toWizardStep(SetupAppPage, "Setup App", "app", i++, { enableNext: false }));
  }

  wizardSteps.push(toWizardStep(InstallExistingAppPage, "Install App", "install", i++, { enableNext: false }));
  wizardSteps.push(toWizardStep(GitHubAppPage, "GitHub App", "view-app", i++, { canJumpTo: user.hasInstallation }));
  wizardSteps.push(toWizardStep(ConnectReposPage, "Connect Repositories", "connect-repos", i++, { canJumpTo: user.hasInstallation }));

  return wizardSteps;
}

function toWizardStep(
  Component: React.ComponentType<any>,
  title: string,
  path: string,
  index: number,
  options: Partial<WizardStep> = {}
): MyWizardStep {
  return {
    ...options,
    index,
    name: title,
    id: path,
    component: <Component />,
    path,
  };
}
