import { useContext, useState } from "react";
import {
  Card, CardTitle, CardBody, Button,
} from "@patternfly/react-core";

import { PlusIcon, SearchIcon } from "@patternfly/react-icons";
import classNames from "classnames";
import ApiResponses from "../../../../common/api-responses";
import CreateAppCard, { CREATE_NEW_TITLE, GHECard } from "./create-app-card";
import { InstallExistingAppCard, USE_EXISTING_TITLE } from "./install-existing-app";
import { ConnectorUserContext } from "../../../contexts";
import BtnBody from "../../../components/btn-body";
import { NewTabLink } from "../../../components/external-link";
import { CommonIcons } from "../../../util/icons";

type CreateOrInstallExisting = "create" | "install-existing";

export default function AdminSetupAppPage(
  { appState, reloadAppState }:
  { appState: ApiResponses.AllConnectorApps, reloadAppState: () => void }
): JSX.Element {
  const { user } = useContext(ConnectorUserContext);

  const [ createOrInstall, setCreateOrInstall ] = useState<CreateOrInstallExisting | undefined>();

  const appExists = appState.success && appState.doesAnyAppExist;
  if (createOrInstall == null) {
    if (appExists) {
      setCreateOrInstall("install-existing");
    }
    else {
      setCreateOrInstall("create");
    }
  }

  const canCreate = user.isAdmin;

  const { direction, isDirectionError } = getCreateOrInstallDirection({ appExists, canCreate });

  return (
    <>
      <Card>
        <CardTitle>
          Set up GitHub App
        </CardTitle>
        <CardBody>
          <p>
            An administrator must create a GitHub App,
            which cluster users can then install on their own GitHub accounts.
            <br/>
            Installing the app allows the Connector to take actions in GitHub on the user&apos;s behalf.
          </p>

          <NewTabLink icon={{ Icon: CommonIcons.Documentation, position: "left" }}
            href="https://docs.github.com/en/developers/apps/getting-started-with-apps/about-apps"
          >
            Read more about GitHub Apps.
          </NewTabLink>

          <p className={classNames({ error: isDirectionError })}>
            {direction}
          </p>

          {!isDirectionError && appExists ?
            <div className="btn-line justify-content-around mt-4 mb-3">
              <Button disabled={!canCreate}
                isActive={createOrInstall === "install-existing"}
                onClick={() => setCreateOrInstall("install-existing")}>
                <BtnBody icon={SearchIcon} text={USE_EXISTING_TITLE} />
              </Button>
              {
                canCreate ? <span className="text-lg">
                  or
                </span> : ""
              }
              <Button disabled={!canCreate}
                isActive={createOrInstall === "create"}
                onClick={() => setCreateOrInstall("create")}>
                <BtnBody icon={PlusIcon} text={CREATE_NEW_TITLE} />
              </Button>
            </div> : ""
          }
        </CardBody>
      </Card>
      {
        createOrInstall != null ? <CreateOrInstallCard appState={appState} createOrUse={createOrInstall} reloadAppState={reloadAppState} /> : ""
      }

    </>
  );
}

function getCreateOrInstallDirection(
  { appExists, canCreate }: { appExists: boolean, canCreate: boolean }
): { direction: string, isDirectionError: boolean } {

  let direction: string;
  let isDirectionError = false;

  if (appExists) {
    if (canCreate) {
      direction = `You can install an existing GitHub app, or create another one.`;
    }
    else {
      direction = `You can install an existing GitHub app, or have an administrator create another one.`;
    }
  }
  else if (canCreate) {
    direction = `No one has created a GitHub app for this cluster yet, so you must create one now.`;
  }
  else {
    direction = `No one has created a GitHub app for this cluster yet, and you do not have permissions to create one. `
      + `You must have a cluster administrator create an app to set up the GitHub Connector.`;
    isDirectionError = true;
  }

  return { direction, isDirectionError };
}

function CreateOrInstallCard(
  { appState, createOrUse, reloadAppState }:
  { appState: ApiResponses.AllConnectorApps, createOrUse: CreateOrInstallExisting, reloadAppState: () => void }
): JSX.Element {
  if (createOrUse === "create") {
    return (
      <>
        <GHECard />
        <CreateAppCard />
      </>
    );
  }

  return (
    <InstallExistingAppCard appState={appState} reloadAppState={reloadAppState} />
  );
}
