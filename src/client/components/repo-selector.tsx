import {
  Badge, Button, Card, CardBody, CardTitle, Checkbox, ExpandableSection, ExpandableSectionToggle, FormGroup, Radio, SearchInput,
} from "@patternfly/react-core";
import {
  CheckSquareIcon, EyeIcon, EyeSlashIcon, IconSize, MinusCircleIcon, MinusSquareIcon,
} from "@patternfly/react-icons";
import { Table } from "@patternfly/react-table";
import classNames from "classnames";
import { useState } from "react";
import ApiEndpoints from "../../common/api-endpoints";
import ApiResponses from "../../common/api-responses";
import { getFriendlyDateTime } from "../../common/common-util";
import { getSecretsUrlForRepo, RepoWithSecrets } from "../../common/types/gh-types";
import ClientPages from "../pages/client-pages";
import { CommonIcons, IconElement } from "../util/icons";
import BtnBody from "./btn-body";
import DataFetcher from "./data-fetcher";
import { NewTabLink } from "./external-link";
import { TooltipIcon } from "./tooltip-icon";

export const REPO_SELECTOR_CARD_ID = "repo-selector-card";

type RepoSelectorTypes = "single" | "multi";

export type RepoSelectionState = ({ repoWithSecrets: RepoWithSecrets, isChecked: boolean })[];

/*
// object/map version
function setAllChecked(newIsChecked: boolean, checkedStates: RepoSelectionState): RepoSelectionState {
  const newRepoCheckedStates: RepoSelectionState = {};
  Object.keys(checkedStates)
    .map((repoId) => Number(repoId))
    .forEach((repoId: number) => {
      newRepoCheckedStates[repoId] = newIsChecked;
    });

  return newRepoCheckedStates;
}
*/

type CardSecretsStatus = {
  overwriting?: string[],
  requiredForSelection: boolean,
};

export default function RepoSelectorCard({
  selectType,
  clusterSecrets,
  selection,
  setSelection,
}: {
  /**
   * Whether the user can select one or many repos
   */
  selectType: RepoSelectorTypes,
  clusterSecrets: {
    requiredForSelection: boolean,
    overwriting?: string[],
  },
  selection: RepoSelectionState,
  /**
   * Used to lift the selection state up to the container component
   */
  setSelection: (repos: RepoSelectionState) => void,
}) {

  const [ search, setSearch ] = useState<string>();

  return (
    <DataFetcher type="api" endpoint={ApiEndpoints.App.Repos.Secrets} loadingDisplay="card">{
      (reposWithSecrets: ApiResponses.ReposSecretsStatus, reload): JSX.Element => {

        /*
        if (initiallySelectedRepos) {
          initiallySelectedRepos.forEach((repoId) => {
            const match = reposWithSecrets.repos.find((repo) => repo.repo.id === repoId.id);
            if (match) {
              initialSelection.current?.push({ ...match, isChecked: true });
            }
          });
        }

        // preserve selection state
        const newReposSelection: RepoSelectionState = reposWithSecrets.repos.map((repoWithSecrets) => {
          const match = reposSelectionState.find((oldRepo) => oldRepo.repo.id === repoWithSecrets.repo.id);
          const isChecked = match?.isChecked ?? false;

          return {
            ...repoWithSecrets,
            isChecked,
          };
        });

        setReposSelectionState(newReposSelection);
        */
        return (
          <Card id={REPO_SELECTOR_CARD_ID}>
            <CardTitle>
              <div>
                Select repositor{selectType === "multi" ? "ies" : "y"}
              </div>
              <div className="ms-auto">
                <div className="btn-line">
                  <Button variant="primary">
                    <NewTabLink
                      href={reposWithSecrets.urls.installationSettings}
                    >
                      <BtnBody icon={CommonIcons.Configure} text="Add/Remove Repositories" />
                    </NewTabLink>
                  </Button>
                  <Button variant="primary"
                    onClick={reload}
                  >
                    <BtnBody icon={CommonIcons.Reload} text="Reload"/>
                  </Button>
                </div>
              </div>
            </CardTitle>
            <CardBody>
              <SearchInput className="mb-3"
                placeholder="Filter Repositories"
                value={search}
                onChange={setSearch}
                onClear={() => setSearch(undefined)}
              />

              {
                selectType === "multi"
                  ? <div className="my-3 btn-line">
                    <Button variant="tertiary"
                      onClick={(_e) => {
                        const copy = reposWithSecrets.repos.map((rws) => {
                          return {
                            repoWithSecrets: rws,
                            isChecked: true,
                          };
                        });
                        setSelection(copy);
                      }}
                    >
                      <BtnBody icon={CheckSquareIcon} text="Select All" />
                    </Button>

                    <Button variant="tertiary"
                      onClick={(_e) => {
                        const copy = reposWithSecrets.repos.map((rws) => {
                          return {
                            repoWithSecrets: rws,
                            isChecked: false,
                          };
                        });
                        setSelection(copy);
                      }}
                      title="Deselect All"
                    >
                      <BtnBody icon={MinusSquareIcon} text="Deselect All"/>
                    </Button>
                  </div>
                  // no (de)select all for single-picker
                  : <></>
              }
              <div className="long-content">
                {
                  reposWithSecrets.repos.length === 0
                    ? <p>
                      The app does not have permissions to access any repositories. Click Edit Installation to add repositories.
                    </p>
                    : (
                      reposWithSecrets.repos.filter((repoWithSecrets) => {
                        if (!search) {
                          return true;
                        }
                        return repoWithSecrets.repo.full_name.toLowerCase().includes(search.trim().toLowerCase());
                      }).map((repoWithSecrets, i) => {
                        return (
                          <RepoWithSecretsItem
                            clusterSecrets={clusterSecrets}
                            altColor={i % 2 === 0}
                            key={repoWithSecrets.repo.id}
                            checked={selection.find((item) => item.repoWithSecrets.repo.id === repoWithSecrets.repo.id)?.isChecked ?? false}
                            onCheckChanged={(checked) => {
                              const changedIndex = selection.findIndex((item) => item.repoWithSecrets.repo.id === repoWithSecrets.repo.id);

                              let newSelection = [ ...selection ];
                              if (changedIndex !== -1) {
                                newSelection[changedIndex].isChecked = checked;
                                // console.log(copy[changedIndex].repo.full_name + ` is now checked ${checked}`);
                              }
                              else if (selectType === "multi") {
                                newSelection.push({ repoWithSecrets, isChecked: checked });
                                // console.log(`Push ${repoWithSecrets.repo.full_name} into changed, checked ${checked}`);
                              }
                              else {
                                newSelection = [{ repoWithSecrets, isChecked: checked }];
                              }
                              setSelection(newSelection);
                            }}
                            repo={repoWithSecrets}
                            selectType={selectType}
                          />
                        );
                      })
                    )
                }
              </div>
            </CardBody>
          </Card>
        );
      }
    }
    </DataFetcher>
  );
}

interface RepoItemProps {
  altColor: boolean,
  checked: boolean,
  clusterSecrets: CardSecretsStatus,
  onCheckChanged: (checked: boolean) => void,
  selectType: RepoSelectorTypes,
  repo: RepoWithSecrets,
}

function RepoWithSecretsItem({
  altColor,
  checked,
  clusterSecrets,
  onCheckChanged,
  selectType,
  repo,
}: RepoItemProps): JSX.Element {

  const [ isShowingSecrets, setIsShowingSecrets ] = useState(false);

  const hasSecretsMissing = clusterSecrets.requiredForSelection && !repo.hasClusterSecrets;

  return (
    <>
      <div
        className={classNames("m-0 p-3 rounded", { "bg-darker": altColor, "bg-lighter": !altColor })}
      >
        <div className={
          classNames(
            "b rounded",
            "center-y justify-content-between",
          )
        }>

          <div
            className={
              classNames("flex-grow-1 d-flex justify-content-between align-items-center")
            }
          >
            <FormGroup fieldId="repo-select-form">
              {
                selectType === "single" ?
                  <Radio
                    id={"repo-select-radio-" + repo.repo.id}
                    name="repo-select-radio"
                    className="flex-grow-1"
                    isChecked={checked}
                    onChange={(newChecked: boolean) => {
                      onCheckChanged(newChecked);
                    }}
                    isDisabled={hasSecretsMissing}
                    title={hasSecretsMissing ?
                      "Cannot select - Missing required secrets. Use the Connect Repositories page to add the required secrets."
                      : repo.repo.full_name
                    }
                    label={repo.repo.full_name}
                  /> :
                  <Checkbox isChecked={checked}
                    id={"toggle-" + repo.repo.id}
                    className={"flex-grow-1 m-0"}
                    onChange={(newChecked) => {
                      onCheckChanged(newChecked);
                    }}
                    label={repo.repo.full_name}
                  />
              }
            </FormGroup>

            {
              hasSecretsMissing ?
                <div className="mx-2 center-y">
                  <TooltipIcon
                    icon={CommonIcons.Warning}
                    iconClasses={"text-warning me-2"}
                    iconSize={IconSize.lg}
                    title="Missing required OpenShift Secrets"
                    body={"Use the Connect Repositories page to add the required secrets."}
                    href={ClientPages.ConnectRepos.path}
                  />
                </div>
                : <></>
            }
          </div>

          <div className="btn-line">
            <ShowSecretsButton
              noSecrets={repo.secrets.length}
              isShowingSecrets={isShowingSecrets}
              onClick={() => {
                setIsShowingSecrets(!isShowingSecrets);
              }}
            />

            <Button variant="tertiary"
              title="GitHub Repository"
            >
              <NewTabLink
                href={repo.repo.html_url}
                title="GitHub Repository"
              >
                <BtnBody icon={CommonIcons.GitHub} />
              </NewTabLink>
            </Button>

            <Button variant="tertiary"
              title="Edit Secrets in GitHub"
            >
              <NewTabLink
                href={getSecretsUrlForRepo(repo.repo)}
                title="Edit Secrets in GitHub"
              >
                <BtnBody icon={CommonIcons.Edit} />
              </NewTabLink>
            </Button>
          </div>
        </div>
        <ExpandableViewSecrets
          clusterSecrets={clusterSecrets}
          isShowingSecrets={isShowingSecrets}
          repo={repo}
        />
      </div>
    </>
  );
}

function ShowSecretsButton(props: { noSecrets: number, isShowingSecrets: boolean, onClick: () => void }): JSX.Element {
  let BtnIcon: IconElement;
  let text: string;
  if (props.noSecrets > 0) {
    if (props.isShowingSecrets) {
      BtnIcon = EyeSlashIcon;
      text = "Hide Secrets";
    }
    else {
      BtnIcon = EyeIcon;
      text = "Show Secrets";
    }
  }
  else {
    BtnIcon = MinusCircleIcon;
    text = "No Secrets";
  }

  return (
    <>
      <Button variant="tertiary"
        title={text}
        onClick={(_e) => {
          props.onClick();
        }}
      >
        <BtnIcon />
        <span className="mx-2">
          {text}
        </span>
        {props.noSecrets > 0 ?
          <Badge>{props.noSecrets}</Badge>
          : ("")
        }
      </Button>
    </>
  );
}

function ExpandableViewSecrets({
  clusterSecrets,
  isShowingSecrets,
  repo,
}: {
  clusterSecrets: CardSecretsStatus,
  isShowingSecrets: boolean,
  repo: RepoWithSecrets,
}) {

  const expandableSectionId = "expandable-secrets-" + repo.repo.id;

  return (
    <>
      <ExpandableSectionToggle isExpanded={isShowingSecrets} contentId={expandableSectionId} className="d-none" />
      <ExpandableSection isExpanded={isShowingSecrets} isDetached contentId={expandableSectionId}>
        <div>
          {
            repo.secrets.length === 0
              ? <p>This repository has no Actions secrets.</p>
              : (
                <Table aria-label={`Secrets for ${repo.repo.full_name}`} className="text-reset mt-3">
                  <colgroup className="row">
                    {/* secret name */ }
                    <col className="col-5"/>
                    {/* last updated */ }
                    <col className="col-3"/>
                    {/* status */ }
                    <col className="col-4"/>
                  </colgroup>
                  <thead>
                    <tr className="b">
                      <td>Secret Name</td>
                      <td>Last Updated</td>
                      <td></td>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      repo.secrets.map((secret) => {
                        return (
                          <tr
                            key={repo.repo.full_name + secret.name}
                          >
                            <td>
                              <code>{secret.name}</code>
                            </td>
                            <td>
                              {getFriendlyDateTime(new Date(secret.updated_at))}
                            </td>
                            <td>
                              {
                                (clusterSecrets.overwriting ?? []).includes(secret.name)
                                  ? getSecretNameWarning([ secret.name ])
                                  : <></>
                              }
                            </td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </Table>
              )
          }
        </div>
      </ExpandableSection>
    </>
  );
}

function getSecretNameWarning(_secretNames: string[]): JSX.Element {
  // const msg = `Secret${secretNames.length === 1 ? "" : "s"} ${joinList(secretNames)} will be overwritten.`;
  const msg = `Existing secret will be updated.`;

  return (
    <div>
      <CommonIcons.Info className="me-2 text-primary" title={msg} />
      {msg}
    </div>
  );
}
