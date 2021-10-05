import {
  Button,
} from "@patternfly/react-core";
import { useContext, useState } from "react";
import ApiEndpoints from "../../../common/api-endpoints";
import ApiRequests from "../../../common/api-requests";
import ApiResponses from "../../../common/api-responses";
import { DEFAULT_SECRET_NAMES } from "../../../common/default-secret-names";
import { toGitHubRepoId } from "../../../common/types/gh-types";
import MyBanner from "../../components/banner";
import BtnBody from "../../components/btn-body";
import { NAMESPACE_SELECT_ID } from "../../components/namespace-select";
import RepoSelectorCard, { RepoSelectionState, REPO_SELECTOR_CARD_ID } from "../../components/repo-selector";
import { PushAlertContext } from "../../contexts";
import { fetchJSON, tryFocusElement } from "../../util/client-util";
import { CommonIcons } from "../../util/icons";
import {
  ConnectReposIntroCard, SecretsWillBeCreatedCard, NamespaceSACards, SERVICEACCOUNT_SELECT_ID,
} from "./connect-repos-page-cards";

const BANNER_ID = "create-secrets-status-banner";

function buildSubmission(
  selectedRepos: RepoSelectionState,
  // reposSecretsData: ApiResponses.ReposSecretsStatus,
  reqBody: Partial<Omit<ApiRequests.CreateActionsSecrets, "repos">>,
): ApiRequests.CreateActionsSecrets | undefined {

  // const checkedRepos: GitHubRepoId[] = reposSecretsData.repos.filter((repoWithSecrets) => {
  //   return selectedRepos[repoWithSecrets.repo.id] === true;
  // }).map((repoWithSecrets): GitHubRepoId => {
  //   return {
  //     id: repoWithSecrets.repo.id,
  //     name: repoWithSecrets.repo.name,
  //     owner: repoWithSecrets.repo.owner.login,
  //     full_name: repoWithSecrets.repo.full_name,
  //   };
  // });

  const { namespace, serviceAccount, serviceAccountRole } = reqBody;
  if (!namespace) {
    tryFocusElement(NAMESPACE_SELECT_ID);
    throw new Error("No namespace selected");
  }
  if (!serviceAccount) {
    tryFocusElement(SERVICEACCOUNT_SELECT_ID);
    throw new Error("No service account name");
  }
  if (!serviceAccountRole) {
    tryFocusElement(SERVICEACCOUNT_SELECT_ID);
    throw new Error("No service account role selected");
  }

  if (selectedRepos.length === 0) {
    tryFocusElement(REPO_SELECTOR_CARD_ID);
    throw new Error("No repositories selected");
  }

  let { createNamespaceSecret } = reqBody;
  if (!createNamespaceSecret) {
    createNamespaceSecret = false;
  }

  return {
    repos: selectedRepos.map((rws) => toGitHubRepoId(rws.repoWithSecrets.repo)),
    namespace,
    createNamespaceSecret,
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

  const [ selectedRepos, setSelectedRepos ] = useState<RepoSelectionState>([]);
  const [ namespace, setNamespace ] = useState<string>();
  const [ createNamespaceSecret, setCreateNamespaceSecret ] = useState(false);
  const [ serviceAccount, setServiceAccount ] = useState<string>();
  const [ serviceAccountRole, setServiceAccountRole ] = useState<string>();

  const [ isSubmitting, setIsSubmitting ] = useState(false);
  const [ submissionResult, setSubmissionResult ] = useState<ApiResponses.RepoSecretsCreationSummary>();

  return (
    <>
      <ConnectReposIntroCard />
      <NamespaceSACards
        namespace={namespace}
        setNamespace={(newNs) => {
          setNamespace(newNs);
          setSubmissionResult(undefined);
        }}
        createNamespaceSecret={createNamespaceSecret}
        setCreateNamespaceSecret={(newCreateNsSecret) => {
          setCreateNamespaceSecret(newCreateNsSecret);
          setSubmissionResult(undefined);
        }}
        serviceAccount={serviceAccount}
        setServiceAccount={(name, role) => {
          setServiceAccount(name);
          setServiceAccountRole(role);
          setSubmissionResult(undefined);
        }}
      />
      <SecretsWillBeCreatedCard serviceAccount={serviceAccount} namespace={namespace} createNamespaceSecret={createNamespaceSecret} />

      <>
        <RepoSelectorCard
          selection={selectedRepos}
          setSelection={(repos) => setSelectedRepos(repos)}
          clusterSecrets={{
            requiredForSelection: false,
            overwriting: [
              DEFAULT_SECRET_NAMES.clusterServerUrl,
              DEFAULT_SECRET_NAMES.clusterToken,
              ...(createNamespaceSecret ? [ DEFAULT_SECRET_NAMES.namespace ] : []),
            ],
          }}
          selectType={"multi"}
        />

        <div className="center-y justify-content-end py-4">
          <Button
            disabled={isSubmitting || selectedRepos.length === 0}
            isLarge={true}
            onClick={async () => {
              let submission;
              try {
                submission = buildSubmission(
                  selectedRepos, {
                    namespace,
                    createNamespaceSecret,
                    serviceAccount,
                    serviceAccountRole,
                  }
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

              // await reload();

              if (submissionResult) {
                focusBanner();
              }
            }}>
            <BtnBody text="Create Secrets" icon={CommonIcons.Add} isLoading={isSubmitting} />
          </Button>
        </div>

        {
          submissionResult
            ? <SubmissionResultBanner
              result={submissionResult}
            />
            : <></>
        }
      </>
    </>
  );
}

function SubmissionResultBanner({ result }: {
  result: ApiResponses.RepoSecretsCreationSummary,
}): JSX.Element {

  return (
    <>
      <MyBanner
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
