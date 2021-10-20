import { useContext, useState } from "react";
import {
  Card, CardTitle, CardBody, Button,
} from "@patternfly/react-core";

import { useHistory } from "react-router-dom";
import { PlusIcon, SearchIcon } from "@patternfly/react-icons";
import classNames from "classnames";
import ApiResponses from "../../../../common/api-responses";
import CreateAppCard, { CREATE_NEW_TITLE, GHECard } from "./create-app-card";
import { USE_EXISTING_TITLE } from "./install-existing-app";
import { ConnectorUserContext } from "../../../contexts";
import BtnBody from "../../../components/btn-body";
import { NewTabLink } from "../../../components/external-link";
import { CommonIcons } from "../../../util/icons";
import { getSetupPagePath } from "../setup";

export default function AdminSetupAppPage(
  { appState }:
  { appState: ApiResponses.AllConnectorApps }
): JSX.Element {
  const { user } = useContext(ConnectorUserContext);
  const history = useHistory();

  const canCreate = user.isAdmin;
  const appExists = appState.success && appState.doesAnyAppExist;

  const [ showCreateCard, setShowCreateCard ] = useState(!appExists);

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
            <div className="d-flex justify-content-center">
              <div className="d-flex justify-content-around w-75">
                <Button
                  onClick={() => history.push(getSetupPagePath("INSTALL_APP"))}>
                  <BtnBody icon={SearchIcon} text={USE_EXISTING_TITLE} />
                </Button>
                {
                  canCreate ? <span className="text-lg">
                    or
                  </span> : ""
                }
                <Button disabled={!canCreate}
                  isActive={showCreateCard}
                  onClick={() => setShowCreateCard(!showCreateCard)}>
                  <BtnBody icon={PlusIcon} text={CREATE_NEW_TITLE} />
                </Button>
              </div>
            </div> : ""
          }
        </CardBody>
      </Card>
      {
        showCreateCard ? <CreateCard /> : ""
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

function CreateCard(): JSX.Element {
  return (
    <>
      <GHECard />
      <CreateAppCard />
    </>
  );
}
