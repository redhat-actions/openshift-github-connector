import { useContext } from "react";
import { useHistory } from "react-router-dom";
import ApiEndpoints from "../../../common/api-endpoints";
import ApiResponses from "../../../common/api-responses";
import DataFetcher from "../../components/data-fetcher";
import MyWizard, { MyWizardStep, toWizardStep } from "../../components/my-wizard";
import { ConnectorUserContext } from "../../contexts";
import ClientPages from "../client-pages";
import GitHubAppPage from "../gh-app-page";
import ConnectReposPage from "./connect-repos-page";
import { InstallExistingAppCard } from "./gh-app/install-existing-app";
import AdminSetupAppPage from "./gh-app/setup-app";
import WelcomePage from "./welcome-page";

export default function SetupWizard() {

  const history = useHistory();

  const { user } = useContext(ConnectorUserContext);

  return (
    <DataFetcher type="api" endpoint={ApiEndpoints.App.Root} loadingDisplay="spinner">{
      (appState: ApiResponses.AllConnectorApps, reload) => {
        const wizardSteps = getWizardSteps({
          isAdmin: user.isAdmin,
          hasInstallation: user.githubInstallationInfo != null,
          ownsApp: user.ownsAppIds.length > 0,
          hasCompletedSetup: user.hasCompletedSetup,
        }, appState, reload);

        return (
          <MyWizard steps={wizardSteps} submit={async () => {
            if (user.githubInstallationInfo) {
              history.push(ClientPages.SetupFinished.path);
            }
            else {
              history.push(ClientPages.App.path);
            }
          }}
          />
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

function getWizardSteps(
  userInfo: { isAdmin: boolean, hasInstallation: boolean, hasCompletedSetup: boolean, ownsApp: boolean },
  appState: ApiResponses.AllConnectorApps, reloadAppState: () => void
): MyWizardStep[] {
  const wizardSteps: MyWizardStep[] = [];

  let i = 0;

  wizardSteps.push(toWizardStep(<WelcomePage />, "Welcome", SetupPagePaths.WELCOME, i++));

  if (userInfo.isAdmin) {
    wizardSteps.push(toWizardStep(
      <AdminSetupAppPage appState={appState} />, "Setup GitHub App", SetupPagePaths.SETUP_APP, i++,
      { enableNext: userInfo.hasCompletedSetup }
    ));
  }

  wizardSteps.push(toWizardStep(
    <InstallExistingAppCard appState={appState} reloadAppState={reloadAppState} />, "Install GitHub App", SetupPagePaths.INSTALL_APP, i++,
    { enableNext: userInfo.hasCompletedSetup, canJumpTo: appState.success && appState.doesAnyAppExist }
  ));

  wizardSteps.push(toWizardStep(
    <GitHubAppPage />, "View GitHub App", SetupPagePaths.VIEW_APP, i++, {
      enableNext: userInfo.hasCompletedSetup,
      canJumpTo: userInfo.hasCompletedSetup,
    }
  ));

  if (userInfo.hasInstallation) {
    wizardSteps.push(toWizardStep(
      <ConnectReposPage />, "Connect Repositories", SetupPagePaths.CONNECT_REPOS, i++,
      { canJumpTo: userInfo.hasInstallation }
    ));
  }

  return wizardSteps;
}
