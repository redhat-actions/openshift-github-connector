import { useContext } from "react";
import { useHistory } from "react-router-dom";
import ApiEndpoints from "../../../common/api-endpoints";
import ApiResponses from "../../../common/api-responses";
import DataFetcher from "../../components/data-fetcher";
import MyWizard, { MyWizardStep, toWizardStep } from "../../components/my-wizard";
import { OpenShiftUserContext } from "../../contexts";
import ClientPages from "../client-pages";
import GitHubAppPage from "../gh-app-page";
import ConnectReposPage from "./connect-repos-page";
import { InstallExistingAppPage } from "./gh-app/install-existing-app";
import SetupAppPage from "./gh-app/setup-app";
import WelcomePage from "./welcome-page";

export default function SetupWizard(): JSX.Element {

  const history = useHistory();

  const { user } = useContext(OpenShiftUserContext);

  return (
    <DataFetcher type="api" endpoint={ApiEndpoints.User.Root} loadingDisplay="spinner">{
      (userWithGitHub: ApiResponses.UserResponse) => {
        const wizardSteps = getWizardSteps(
          user.isAdmin,
          userWithGitHub.success && userWithGitHub.githubInstallationInfo != null
        );

        return (
          <MyWizard steps={wizardSteps} submit={async () => { history.push(ClientPages.SetupFinished.path); } } />
        );
      }
    }
    </DataFetcher>

  );
}

const SetupPagePaths = {
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

  wizardSteps.push(toWizardStep(<WelcomePage />, "Welcome", SetupPagePaths.WELCOME, i++));

  if (isAdmin) {
    wizardSteps.push(toWizardStep(
      <SetupAppPage />, "Setup GitHub App", SetupPagePaths.SETUP_APP, i++,
      { enableNext: hasGitHubAppInstallation }
    ));
  }

  wizardSteps.push(toWizardStep(
    <InstallExistingAppPage />, "Install GitHub App", SetupPagePaths.INSTALL_APP, i++,
    { enableNext: hasGitHubAppInstallation }
  ));

  wizardSteps.push(toWizardStep(
    <GitHubAppPage />, "View GitHub App", SetupPagePaths.VIEW_APP, i++,
    { canJumpTo: hasGitHubAppInstallation }
  ));

  wizardSteps.push(toWizardStep(
    <ConnectReposPage />, "Connect Repositories", SetupPagePaths.CONNECT_REPOS, i++,
    { canJumpTo: hasGitHubAppInstallation }
  ));

  return wizardSteps;
}
