import { useContext } from "react";
import { useHistory, useParams } from "react-router-dom";
import {
  Button, Wizard, WizardStep,
} from "@patternfly/react-core";

import { ArrowLeftIcon, ArrowRightIcon } from "@patternfly/react-icons";
import { OpenShiftUserContext } from "../../contexts";
import ClientPages from "../client-pages";
import BtnBody from "../../components/btn-body";
import WelcomePage from "./welcome-page";
import SetupAppPage from "./gh-app/setup-app";
import { InstallExistingAppPage } from "./gh-app/install-existing-app";
import GitHubAppPage from "../gh-app-page";
import ConnectReposPage from "./connect-repos-page";
import DataFetcher from "../../components/data-fetcher";
import ApiEndpoints from "../../../common/api-endpoints";
import ApiResponses from "../../../common/api-responses";

type MyWizardStep = WizardStep & { index: number, path: string };

export default function SetupWizard(): JSX.Element {

  const history = useHistory();

  const { user } = useContext(OpenShiftUserContext);

  const { page } = useParams<{ page?: string }>();

  return (
    <DataFetcher type="api" endpoint={ApiEndpoints.User.UserGitHub} loadingDisplay="spinner">{
      (userWithGitHub: ApiResponses.UserResponse) => {
        const wizardSteps = getWizardSteps(
          user.isAdmin,
          userWithGitHub.success && userWithGitHub.githubInstallationInfo != null
        );
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
    }
    </DataFetcher>

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
              if (currentStep.index === wizardSteps.length - 1) {
                history.push(ClientPages.SetupFinished.path);
                return;
              }

              const nextStep = wizardSteps[currentStep.index + 1];
              history.push(nextStep.path);
            }}>
              <BtnBody
                icon={ArrowRightIcon} iconPosition="right"
                text={currentStep.index === wizardSteps.length - 1 ? "Finish" : "Next"}
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
  return ClientPages.SetupIndex.path + "/" + SetupPagePaths[page];
}

function getWizardSteps(isAdmin: boolean, hasGitHubAppInstallation: boolean): MyWizardStep[] {
  const wizardSteps: MyWizardStep[] = [];

  let i = 0;

  wizardSteps.push(toWizardStep(WelcomePage, "Welcome", SetupPagePaths.WELCOME, i++));

  if (isAdmin) {
    wizardSteps.push(toWizardStep(
      SetupAppPage, "Setup GitHub App", SetupPagePaths.SETUP_APP, i++,
      { enableNext: hasGitHubAppInstallation }
    ));
  }

  wizardSteps.push(toWizardStep(
    InstallExistingAppPage, "Install GitHub App", SetupPagePaths.INSTALL_APP, i++,
    { enableNext: hasGitHubAppInstallation }
  ));

  wizardSteps.push(toWizardStep(
    GitHubAppPage, "View GitHub App", SetupPagePaths.VIEW_APP, i++,
    { canJumpTo: hasGitHubAppInstallation }
  ));

  wizardSteps.push(toWizardStep(
    ConnectReposPage, "Connect Repositories", SetupPagePaths.CONNECT_REPOS, i++,
    { canJumpTo: hasGitHubAppInstallation }
  ));

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
