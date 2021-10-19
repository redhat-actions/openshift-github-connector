import { useState } from "react";
import classNames from "classnames";
import {
  Button, Card, CardTitle, CardBody, Checkbox,
} from "@patternfly/react-core";
import { v4 as uuid } from "uuid";

import ApiEndpoints from "../../../../common/api-endpoints";
import ApiRequests from "../../../../common/api-requests";
import MyBanner from "../../../components/banner";
import { NewTabLink } from "../../../components/external-link";
import BtnBody from "../../../components/btn-body";
import { getWindowLocationNoPath, fetchJSON } from "../../../util/client-util";
import { getGitHubAppManifest, GitHubAppManifestSettings } from "../../../util/github-app-manifest";
import { CommonIcons } from "../../../util/icons";
import ApiResponses from "../../../../common/api-responses";

export const CREATE_NEW_TITLE = "Create a New App";

export default function CreateAppCard(): JSX.Element {
  const [ publicChecked, setPublicChecked ] = useState(true);
  const [ isLoading, setIsLoading ] = useState(false);
  const [ error, setError ] = useState<string | undefined>(undefined);

  const state = uuid();

  const manifestFormId = "manifest-form";
  const manifestInputId = "manifest-input";
  // const enterpriseCheckboxId = "enterprise-checkbox";

  const githubManifestUrl = `https://github.com/settings/apps/new?state=${state}`;

  return (
    <>
      <Card>
        <CardTitle>
          {CREATE_NEW_TITLE}

          <div className="btn-line">
            <Button variant="tertiary">
              <NewTabLink href="https://github.com/settings/apps/" icon={{ Icon: CommonIcons.GitHub, position: "left" }} >
                View your apps
              </NewTabLink>
            </Button>
          </div>
        </CardTitle>
        <CardBody>
          <div>
            <Checkbox
              id="public-app"
              isChecked={publicChecked}
              onChange={(checked) => setPublicChecked(checked)}
              label="Public app"
            />
            <p className={classNames({ "d-none": publicChecked })}>
              <CommonIcons.Warning className="text-warning me-2"/>
              If you make your app private, no one else will be able to install it.
            </p>
            <p>
              A public app is recommended so your team members can share it.
            </p>

            <p>
              You can change this later in the GitHub app settings.
            </p>
            <p>
              <NewTabLink href="https://docs.github.com/en/developers/apps/making-a-github-app-public-or-private"
                icon={{ Icon: CommonIcons.Documentation, position: "left" }}
              >
                Read more about public and private apps.
              </NewTabLink>
            </p>
          </div>

          <div className="d-flex flex-column align-items-center my-3">
            <form className="" id={manifestFormId} method="post" action={githubManifestUrl} onSubmit={
              async (e) => {
                e.preventDefault();
                setIsLoading(true);

                let appName = "OpenShift Connector";
                try {
                  const user = await fetchJSON<never, ApiResponses.UserResponse>("GET", ApiEndpoints.User.Root);
                  if (user.success) {
                    appName = user.name.replace(/[:]/g, "") + "s " + appName;
                  }
                }
                catch (err) {
                  // nothing
                  console.error(err);
                }

                const manifestSettings: GitHubAppManifestSettings = {
                  name: appName,
                  public: publicChecked,
                };

                try {
                  const appManifest = getGitHubAppManifest(getWindowLocationNoPath(), manifestSettings);
                  const manifestInput = document.getElementById(manifestInputId) as HTMLInputElement;
                  manifestInput.value = JSON.stringify(appManifest);

                  await fetchJSON<ApiRequests.CreateCallbackState>("POST", ApiEndpoints.Setup.SetCreateAppState.path, {
                    state,
                  });

                  const manifestForm = document.getElementById(manifestFormId) as HTMLFormElement;
                  manifestForm.submit();
                }
                catch (err: any) {
                  setError(`Failed to start creation flow: ${err.message}`);
                }
                finally {
                  setTimeout(() => setIsLoading(false), 500);
                }
              }
            }>
              <input id={manifestInputId} className="d-none" name="manifest" type="manifest" readOnly={true} />
            </form>

            <Button type="submit" isLarge className="mt-2" form={manifestFormId}>
              <BtnBody icon={CommonIcons.GitHub} iconClasses="text-black" text={CREATE_NEW_TITLE} isLoading={isLoading} />
            </Button>

          </div>

          <MyBanner title={error ?? ""} display={error != null} severity="danger" />

        </CardBody>
      </Card>
    </>
  );
}

export function GHECard(): JSX.Element {

  const [ enterpriseChecked, setEnterpriseChecked ] = useState(false);

  return (
    <Card>
      <CardTitle>
        GitHub Enterprise
      </CardTitle>
      <CardBody>
        <Checkbox
          id="use-ghe"
          isDisabled={true}
          isChecked={enterpriseChecked}
          onChange={(checked) => setEnterpriseChecked(checked)}
          label="Use GitHub Enterprise"
        />
        <p>
          Use a GitHub Enterprise (GHE) instance instead of <b>github.com</b>. The GHE instance must be reachable from this cluster.
        </p>
        <p>
          This cannot be changed later without creating another app.
        </p>
      </CardBody>
    </Card>
  );
}
