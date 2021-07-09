import { useContext, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardTitle,
  CardBody,
  ExpandableSection,
  ExpandableSectionToggle,
  Checkbox,
} from "@patternfly/react-core";
import { Table } from "@patternfly/react-table";
import classNames from "classnames";
import {
  CheckSquareIcon, EditIcon, EyeIcon, EyeSlashIcon,
  InfoCircleIcon, MinusCircleIcon, MinusSquareIcon,
} from "@patternfly/react-icons";

import ApiEndpoints from "../../../common/api-endpoints";
import ApiResponses from "../../../common/api-responses";
import ApiRequests from "../../../common/api-requests";
import { ExternalLink } from "../../components/external-link";
import BtnBody from "../../components/btn-body";
import { getFriendlyDateTime } from "../../../common/common-util";
import { fetchJSON } from "../../util/client-util";
import Banner from "../../components/banner";
import { getSecretsUrlForRepo, GitHubRepoId } from "../../../common/types/gh-types";
import DataFetcher from "../../components/data-fetcher";
import { CommonIcons, IconElement } from "../../util/icons";
import { ConnectReposIntroCard, DefaultSecretsCard, ServiceAccountCard } from "./connect-repos-page-cards";
import { PushAlertContext } from "../../contexts";

interface RepoCheckedMap {
  [repoId: number]: boolean,
  // repoId: number,
}

const BANNER_ID = "create-secrets-status-banner";

function setAllChecked(newIsChecked: boolean, checkedStates: RepoCheckedMap): RepoCheckedMap {
  const newRepoCheckedStates: RepoCheckedMap = {};
  Object.keys(checkedStates)
    .map((repoId) => Number(repoId))
    .forEach((repoId: number) => {
      newRepoCheckedStates[repoId] = newIsChecked;
    });

  return newRepoCheckedStates;
}

function setOneChecked(
  repoId: number,
  newIsChecked: boolean,
  checkedStates: RepoCheckedMap,
): RepoCheckedMap {
  const newCheckedStates = {
    ...checkedStates,
  };

  newCheckedStates[repoId] = newIsChecked;

  return newCheckedStates;
}

function buildSubmission(
  checkedStates: RepoCheckedMap,
  reposSecretsData: ApiResponses.ReposSecretsStatus,
  serviceAccountData: Partial<Omit<ApiRequests.CreateActionsSecrets, "repos">>,
): ApiRequests.CreateActionsSecrets | undefined {

  const checkedRepos: GitHubRepoId[] = reposSecretsData.repos.filter((repoWithSecrets) => {
    return checkedStates[repoWithSecrets.repo.id] === true;
  }).map((repoWithSecrets): GitHubRepoId => {
    return {
      id: repoWithSecrets.repo.id,
      name: repoWithSecrets.repo.name,
      owner: repoWithSecrets.repo.owner.login,
      full_name: repoWithSecrets.repo.full_name,
    };
  });

  if (checkedRepos.length === 0) {
    throw new Error("No repositories selected");
  }

  const { namespace, serviceAccount, serviceAccountRole } = serviceAccountData;
  if (!namespace) {
    throw new Error("No namespace selected");
  }
  if (!serviceAccount) {
    throw new Error("No service account name");
  }
  if (!serviceAccountRole) {
    throw new Error("No service account role selected");
  }

  return {
    repos: checkedRepos,
    namespace,
    serviceAccount,
    serviceAccountRole,
  };
}

function focusBanner(): void {
  const banner = document.getElementById(BANNER_ID);
  banner?.scrollIntoView();
}

export default function ConnectReposPage(): JSX.Element {

  const pushAlert = useContext(PushAlertContext);

  const [ reposCheckedMap, setReposCheckedMap ] = useState<RepoCheckedMap>({});
  const [ namespace, setNamespace ] = useState<string>();
  const [ serviceAccount, setServiceAccount ] = useState<string>();
  const [ serviceAccountRole, setServiceAccountRole ] = useState<string>();

  const [ isSubmitting, setIsSubmitting ] = useState(false);
  const [ submissionResult, setSubmissionResult ] = useState<ApiResponses.RepoSecretsCreationSummary>();

  return (
    <>
      <ConnectReposIntroCard />
      <ServiceAccountCard
        namespace={namespace}
        setNamespace={(newNs) => {
          setNamespace(newNs);
          setSubmissionResult(undefined);
        }}
        serviceAccount={serviceAccount}
        setServiceAccount={(name, role) => {
          setServiceAccount(name);
          setServiceAccountRole(role);
          setSubmissionResult(undefined);
        }}
      />
      <DefaultSecretsCard serviceAccount={serviceAccount} namespace={namespace} />

      <DataFetcher loadingDisplay="card" type="generic" fetchData={async () => {
        const reposSecretsData = await fetchJSON<never, ApiResponses.ReposSecretsStatus>("GET", ApiEndpoints.App.Repos.Secrets);

        const newReposCheckedMap: RepoCheckedMap = {};
        reposSecretsData.repos.forEach((repoWithSecrets) => {
          const repoId = repoWithSecrets.repo.id;
          newReposCheckedMap[repoId] = (reposCheckedMap[repoId]);
        });

        setReposCheckedMap(newReposCheckedMap);

        return reposSecretsData;
      }}>{
          (reposSecretsData: ApiResponses.ReposSecretsStatus, reload) => {
            return (
              <Card>
                <CardTitle>
                  <div>
                    Repositories
                  </div>
                  <div className="ms-auto">
                    <div className="btn-line">
                      <Button variant="primary">
                        <ExternalLink
                          href={reposSecretsData.urls.installationSettings}
                          title="Edit Installation"
                        >
                          <BtnBody icon={CommonIcons.Configure} text="Edit Installation" />
                        </ExternalLink>
                      </Button>
                      <Button variant="primary"
                        // onClick={props.onReload}
                        onClick={async () => {
                          await reload();
                        }}
                      >
                        <BtnBody icon={CommonIcons.Reload} text="Reload"/>
                      </Button>
                    </div>
                  </div>
                </CardTitle>
                <CardBody>
                  <p>
                    Select the repositories to create secrets in.
                  </p>
                  <p>
                    Then, click <b>Create Secrets</b>.
                  </p>
                  <div className="text-md my-4 btn-line">
                    <Button variant="tertiary"
                      onClick={(_e) => {
                        setReposCheckedMap(setAllChecked(true, reposCheckedMap));
                      }}
                    >
                      <BtnBody icon={CheckSquareIcon} text="Select All" />
                    </Button>

                    <Button variant="tertiary"
                      onClick={(_e) => {
                        setReposCheckedMap(setAllChecked(false, reposCheckedMap));
                      }}
                      title="Deselect All"
                    >
                      <BtnBody icon={MinusSquareIcon} text="Deselect All"/>
                    </Button>
                  </div>
                  <div className="long-content">
                    {
                      reposSecretsData.repos.length === 0
                        ? (
                          <p>
                            The app does not have permissions to access any repositories. Click Edit Installation to add repositories.
                          </p>
                        )
                        : reposSecretsData.repos.map((repoWithSecrets, i) => {
                          const repoId = repoWithSecrets.repo.id;
                          return (
                            <RepoWithSecretsItem key={i}
                              repoWithSecrets={repoWithSecrets}
                              submissionResult={submissionResult}
                              i={i}
                              checked={reposCheckedMap[repoId] === true}
                              defaultSecrets={reposSecretsData.defaultSecretNames}
                              onCheckChanged={(checked: boolean) => { setReposCheckedMap(setOneChecked(repoId, checked, reposCheckedMap)); }}
                            />
                          );
                        })
                    }
                  </div>

                  <div className="d-flex justify-content-center align-items-center py-3">
                    <Button className="btn-lg b"
                      title={Object.values(reposCheckedMap).some((checked) => checked)
                        ? "Create Secrets"
                        : "Select at least one repository."
                      }
                      disabled={isSubmitting || !Object.values(reposCheckedMap).some((checked) => checked)}
                      isLoading={isSubmitting}
                      onClick={async () => {
                        let submission;
                        try {
                          submission = buildSubmission(
                            reposCheckedMap,
                            reposSecretsData,
                            { namespace, serviceAccount, serviceAccountRole },
                          );
                        }
                        catch (err) {
                          pushAlert({ severity: "warning", title: err.message });
                          return;
                        }

                        try {
                          setIsSubmitting(true);
                          setSubmissionResult(undefined);

                          const res = await fetchJSON<ApiRequests.CreateActionsSecrets, ApiResponses.RepoSecretsCreationSummary>(
                            "POST",
                            ApiEndpoints.App.Repos.Secrets.path,
                            submission,
                          );

                          setSubmissionResult(res);
                        }
                        catch (err) {
                          pushAlert({ severity: err.severity ?? "danger", title: `Creating secrets failed`, body: err.message });
                        }
                        finally {
                          setIsSubmitting(false);
                        }

                        await reload();

                        if (submissionResult) {
                          focusBanner();
                        }
                      }}>
                      <BtnBody text="Create Secrets" icon={CommonIcons.Add} />
                    </Button>
                  </div>

                  {
                    submissionResult
                      ? <SubmissionResultBanner
                        result={submissionResult}
                      />
                      : <></>
                  }
                </CardBody>
              </Card>
            );
          }
        }
      </DataFetcher>
    </>
  );
}

interface RepoItemProps {
  checked: boolean,
  defaultSecrets: ApiResponses.DefaultSecretsResponse,
  i: number,
  onCheckChanged: (checked: boolean) => void,
  submissionResult?: ApiResponses.RepoSecretsCreationSummary,
  repoWithSecrets: ApiResponses.RepoWithSecrets,
}

function RepoWithSecretsItem({
  checked,
  defaultSecrets,
  i,
  onCheckChanged,
  repoWithSecrets,
}: RepoItemProps): JSX.Element {

  const [ isShowingSecrets, setIsShowingSecrets ] = useState(false);
  const expandableSectionId = "expandable-secrets-" + i;

  const isEven = i % 2 === 0;

  return (
    <div
      className={classNames("p-3 rounded", { "bg-darker": isEven, "bg-lighter": !isEven })}
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
          <Checkbox isChecked={checked}
            id={"toggle-" + i}
            className={"flex-grow-1 m-0"}
            onChange={(newChecked) => {
              onCheckChanged(newChecked);
            }}
            label={repoWithSecrets.repo.full_name}
          />

          <div className="me-4">
            <ShowSecretsButton
              noSecrets={repoWithSecrets.secrets.length}
              isShowingSecrets={isShowingSecrets}
              onClick={() => setIsShowingSecrets(!isShowingSecrets)}
            />
          </div>
        </div>
        {/* <div className="mx-3">
          {isConnectedToACluster
            ? (
              <>
                <FontAwesomeIcon icon="check-circle"
                  className="text-success" fixedWidth
                />
              </>
            )
            : ("")
          }
        </div> */}
        <div className="btn-line">
          <Button variant="secondary"
            title="GitHub Repository"
          >
            <ExternalLink
              href={repoWithSecrets.repo.html_url}
              title="GitHub Repository"
            >
              <BtnBody icon={CommonIcons.GitHub} />
            </ExternalLink>
          </Button>

          <Button variant="secondary"
            title="Edit Secrets in GitHub"
          >
            <ExternalLink
              href={getSecretsUrlForRepo(repoWithSecrets.repo)}
              title="Edit Secrets in GitHub"
            >
              <BtnBody icon={EditIcon} />
            </ExternalLink>
          </Button>
        </div>
      </div>
      <ExpandableSectionToggle isExpanded={isShowingSecrets} contentId={expandableSectionId} className="d-none" />
      <ExpandableSection isExpanded={isShowingSecrets} isDetached contentId={expandableSectionId}>
        <div>
          {
            repoWithSecrets.secrets.length === 0
              ? <p>This repository has no Actions secrets.</p>
              : (
                <Table aria-label={`Secrets for ${repoWithSecrets.repo.full_name}`} className="text-reset mt-3">
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
                      repoWithSecrets.secrets.map((secret) => {
                        return (
                          <tr
                            key={repoWithSecrets.repo.full_name + secret.name}
                          >
                            <td>
                              <code>{secret.name}</code>
                            </td>
                            <td>
                              {getFriendlyDateTime(new Date(secret.updated_at))}
                            </td>
                            <td>
                              {[
                                defaultSecrets.defaultSecrets.clusterServerUrl,
                                defaultSecrets.defaultSecrets.clusterToken,
                              ].includes(secret.name)
                                ? getSecretNameWarning([ secret.name ])
                                : ("")
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
    </div>
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
      <Button variant="secondary"
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

function getSecretNameWarning(_secretNames: string[]): JSX.Element {
  // const msg = `Secret${secretNames.length === 1 ? "" : "s"} ${joinList(secretNames)} will be overwritten.`;
  const msg = `Existing secret will be updated.`;

  return (
    <div>
      <InfoCircleIcon className="me-2 text-success" title={msg} />
      {msg}
    </div>
  );
}

function SubmissionResultBanner({ result }: {
    result: ApiResponses.RepoSecretsCreationSummary,
}): JSX.Element {

  return (
    <>
      <Banner
        id={BANNER_ID}
        display={true}
        severity={result.severity}
        title={result.message}
      />
      <div className="px-4 py-2">
        {
          <>
            <CommonIcons.Info className="me-2 text-success" />
            Workflows will authenticate as {result.serviceAccount.created ? "new " : ""}service account&nbsp;
            <b>{result.serviceAccount.namespace}/{result.serviceAccount.name}</b>
          </>
        }
        {
          (result.successes?.length ?? -1) > 0
            ?
            <>
              <ul className="no-bullets">
                {result.successes?.map((success) => {
                  return (
                    <li key={success.actionsSecretName + success.repo.full_name}>
                      <CommonIcons.Success className="me-2 text-success" />
                      Created <b>{success.actionsSecretName}</b> in {success.repo.full_name}
                    </li>
                  );
                })}
              </ul>
            </>
            : ("")
        }
        {
          (result.failures?.length ?? -1) > 0
            ?
            <>
              <ul className="no-bullets">
                {result.failures?.map((failure) => {
                  return (
                    <li key={failure.actionsSecretName + failure.repo.full_name}>
                      <CommonIcons.Error className="me-2 text-danger" />
                      {failure.actionsSecretName != null ?
                        (
                          <>
                            <b>{failure.actionsSecretName}</b> in&nbsp;
                          </>
                        )
                        : ("")
                      }
                      {failure.repo.full_name}
                      <ul className="no-bullets">
                        <li>{failure.err}</li>
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </>
            : ("")
        }
      </div>
    </>
  );
}
