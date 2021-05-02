import React, { useState } from "react";
import { RouteComponentProps } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Collapse,
  Spinner,
  Table,
} from "react-bootstrap";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

import ApiEndpoints from "../../../common/api-endpoints";
import ApiResponses from "../../../common/api-responses";
import ApiRequests from "../../../common/api-requests";
import { ExternalLink } from "../../components/external-link";
import SetupPageHeader, { SETUP_QUERYPARAM } from "./setup-header";
import BtnBody from "../../components/fa-btn-body";
import { getFriendlyDateTime } from "../../../common/common-util";
import { fetchJSON, getSearchParam } from "../../util/client-util";
import Banner from "../../components/banner";
import { GitHubRepoId } from "../../../common/types/github-types";
import DataFetcher from "../../components/data-fetcher";

type ConnectReposPageProps = {};

interface RepoCheckedMap {
  [repoId: number]: boolean,
  // repoId: number,
}

interface ConnectReposPageState {
  loadingErr?: string,

  repoCheckedMap?: RepoCheckedMap,
  createSATokens: boolean,
  reposSecretsData?: ApiResponses.ReposSecretsStatus,

  isSubmitting: boolean,
  submissionResult?: ApiResponses.RepoSecretsCreationSummary,
}

export default class ConnectReposPage extends React.Component<RouteComponentProps<ConnectReposPageProps>, ConnectReposPageState> {

  private readonly createSATokensId = "create-tokens-checkbox";
  private readonly bannerId = "create-secrets-status-banner";

  constructor(props: RouteComponentProps<ConnectReposPageProps>) {
    super(props);

    this.state = {
      createSATokens: true,
      isSubmitting: false,
      repoCheckedMap: [],
    };
  }

  public async componentDidMount() {
    await this.loadReposSecrets();
  }

  private async loadReposSecrets(): Promise<void> {
    try {
      this.setState({ reposSecretsData: undefined });

      const reposSecretsData = await fetchJSON<never, ApiResponses.ReposSecretsStatus>("GET", ApiEndpoints.App.Repos.Secrets);

      const repoCheckedMap: RepoCheckedMap = {};
      reposSecretsData.repos.forEach((repoWithSecrets) => {
        const repoId = repoWithSecrets.repo.id;
        repoCheckedMap[repoId] = (this.state.repoCheckedMap?.[repoId]) ?? true;
      });

      this.setState({
        repoCheckedMap,
        reposSecretsData,
      });
    }
    catch (err) {
      this.setState({ loadingErr: err.message });
    }
  }

  private setAllChecked(newIsChecked: boolean) {

    if (!this.state.repoCheckedMap) {
      return;
    }

    const newRepoCheckedStates: RepoCheckedMap = {};
    Object.keys(this.state.repoCheckedMap)
      .map((repoId) => Number(repoId))
      .forEach((repoId: number) => {
        newRepoCheckedStates[repoId] = newIsChecked;
      });

    this.setState({
      repoCheckedMap: newRepoCheckedStates,
    });
  }

  private setOneChecked(repoId: number, newIsChecked: boolean) {
    if (!this.state.repoCheckedMap) {
      return;
    }

    const repoCheckedMapCopy = {
      ...this.state.repoCheckedMap,
    };

    repoCheckedMapCopy[repoId] = newIsChecked;

    this.setState({ repoCheckedMap: repoCheckedMapCopy });
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public render(): JSX.Element {
    return (
      <React.Fragment>
        {
          getSearchParam(SETUP_QUERYPARAM) != null
            ? <SetupPageHeader pageIndex={3} canProceed={true} />
            : ""
        }
        <Card>
          <Card.Body>
            <p>
              This step connects GitHub repositories to your OpenShift cluster by
              creating <ExternalLink href="https://docs.github.com/en/actions/reference/encrypted-secrets">
                encrypted secrets
              </ExternalLink> in
              your repositories which you can then reference in your workflows.
            </p>
            <p>
              It is recommended to create a new Service Account Token for each repository that you will connect.
              See <ExternalLink
                href={"https://github.com/redhat-actions/oc-login/wiki/Using-a-Service-Account-for-GitHub-Actions"}
              >
                Using a Service Account for GitHub Actions
              </ExternalLink> for more information about authenticating with a Service Account.
            </p>
            <p>
            This way, you can revoke a single {`repository's`} access by deleting its token without affecting other repositories.
            </p>
            <div className="d-flex align-items-center">
              <input type="checkbox"
                // className="form-check-input"
                id={this.createSATokensId}
                checked={this.state.createSATokens}
                onChange={(e) => this.setState({ createSATokens: e.currentTarget.checked })}
              />
              <label htmlFor={this.createSATokensId} className="b clickable">Create Service Account Tokens</label>
            </div>
          </Card.Body>
        </Card>
        <Card>
          <Card.Title>
            <div>
              Secrets
            </div>
          </Card.Title>
          <Card.Body>
            <DataFetcher type="api" endpoint={ApiEndpoints.App.Repos.RepoSecretDefaults} loadingDisplay="spinner">
              {
                (res: ApiResponses.DefaultSecretsResponse) => (
                  <div>
                    <p>
                      To each repository, two secrets will be added:
                    </p>
                    <ol>
                      <li>
                        <code>{res.defaultSecrets.clusterServerUrl}</code> will
                        contain the URL to this OpenShift {"cluster's"} API server.
                      </li>
                      <li>
                        <code>{res.defaultSecrets.clusterToken}</code> will
                        contain the Service Account Token which can be used to log into the OpenShift API server.
                      </li>
                    </ol>
                    <p>
                      You can then use <ExternalLink href="https://github.com/redhat-actions/oc-login">
                      oc-login
                      </ExternalLink> to log into this cluster from Actions and run your OpenShift workflows.
                    </p>
                  </div>
                )
              }
            </DataFetcher>
          </Card.Body>
        </Card>

        <Card>
          {/* eslint-disable-next-line no-nested-ternary */}
          {this.state.loadingErr != null
            // Failed to load
            ? (
              <React.Fragment>
                <Card.Title>
                  Repositories
                </Card.Title>
                <Card.Body>
                  <Banner severity="danger" display={true}
                    title={this.state.loadingErr}
                  />
                </Card.Body>
              </React.Fragment>
            ) : (
              <React.Fragment>

                {this.state.repoCheckedMap == null || this.state.reposSecretsData == null
                // still loading
                  ? (
                    <React.Fragment>
                      <Card.Title>
                        Repositories
                      </Card.Title>
                      <Card.Body >
                        <div className="d-flex justify-content-center">
                          <Spinner animation="border" variant="primary" />
                        </div>
                      </Card.Body>
                    </React.Fragment>
                  )
                // Loaded
                  : (
                    <React.Fragment>
                      <Card.Title>
                        <div>
                          Repositories
                        </div>
                        <div className="ml-auto">
                          <div className="btn-line">
                            <Button variant="primary">
                              <ExternalLink
                                href={this.state.reposSecretsData.urls.installationSettings}
                                title="Edit Installation"
                              >
                                <BtnBody icon="cog" text="Edit Installation" />
                              </ExternalLink>
                            </Button>
                            <Button variant="primary"
                              // onClick={props.onReload}
                              onClick={async () => {
                                await this.loadReposSecrets();
                              }}
                            >
                              <BtnBody icon="sync-alt" text="Reload"/>
                            </Button>
                          </div>
                        </div>
                      </Card.Title>
                      <Card.Body>
                        <p>
                          Select the repositories to create secrets in, so workflows can log into this OpenShift cluster.
                        </p>
                        <p>
                          Then, click <b>Create Secrets</b>.
                        </p>
                        <div className="text-md my-4 btn-line">
                          <Button variant="light"
                            onClick={(_e) => {
                              this.setAllChecked(true);
                            }}
                          >
                            <BtnBody icon="check-square" text="Select All" />
                          </Button>

                          <Button variant="light"
                            onClick={(_e) => {
                              this.setAllChecked(false);
                            }}
                            title="Deselect All"
                          >
                            <BtnBody icon="minus-square" text="Deselect All"/>
                          </Button>
                        </div>
                        <div className="">
                          {
                            this.state.reposSecretsData.repos.length === 0
                              ? (
                                <p>
                                  The app does not have permissions to access any repositories. Click Edit Installation to add repositories.
                                </p>
                              )
                              : this.state.reposSecretsData.repos.map((repoWithSecrets, i) => {
                                const repoId = repoWithSecrets.repo.id;
                                return (
                                  <RepoWithSecretsItem key={i}
                                    repoWithSecrets={repoWithSecrets}
                                    submissionResult={this.state.submissionResult}
                                    i={i}
                                    checked={this.state.repoCheckedMap?.[repoId] === true}
                                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                    defaultSecrets={this.state.reposSecretsData!.defaultSecretNames}
                                    onCheckChanged={(checked: boolean) => { this.setOneChecked(repoId, checked); }}
                                  />
                                );
                              })
                          }
                        </div>

                        <div className="d-flex justify-content-end align-items-center py-3">
                          <Button className="btn-lg b"
                            title={Object.values(this.state.repoCheckedMap).some((checked) => checked)
                              ? "Create Secrets"
                              : "Select at least one repository."
                            }
                            disabled={this.state.isSubmitting || !Object.values(this.state.repoCheckedMap).some((checked) => checked)}
                            onClick={async () => {
                              this.setState({ isSubmitting: true, submissionResult: undefined });
                              this.focusBanner();

                              try {
                                await this.submitCreateSecrets();
                                this.setState({ isSubmitting: false });
                              }
                              catch (err) {
                                this.setState({ submissionResult: { success: false, severity: "danger", message: err.message } });
                              }
                              finally {
                                this.setState({ isSubmitting: false });
                              }

                              await this.loadReposSecrets();

                              if (this.state.submissionResult) {
                                this.focusBanner();
                              }
                            }}>
                              Create Secrets
                          </Button>
                        </div>
                        <SubmissionResultBanner
                          bannerId={this.bannerId}
                          isSubmitting={this.state.isSubmitting}
                          submissionResult={this.state.submissionResult}
                        />
                      </Card.Body>
                    </React.Fragment>
                  )
                }
              </React.Fragment>
            )
          }
        </Card>
      </React.Fragment>
    );
  }

  private focusBanner(): void {
    const banner = document.getElementById(this.bannerId);
    banner?.scrollIntoView();
  }

  private async submitCreateSecrets(): Promise<void> {
    if (!this.state.reposSecretsData || !this.state.repoCheckedMap) {
      console.error(`Submitting but required data is null!`);
      return;
    }

    const checkedRepos: GitHubRepoId[] = this.state.reposSecretsData.repos.filter((repoWithSecrets) => {
      if (!this.state.repoCheckedMap) {
        return false;
      }
      return this.state.repoCheckedMap[repoWithSecrets.repo.id] === true;
    }).map((repoWithSecrets): GitHubRepoId => {
      return {
        id: repoWithSecrets.repo.id,
        name: repoWithSecrets.repo.name,
        owner: repoWithSecrets.repo.owner.login,
        full_name: repoWithSecrets.repo.full_name,
      };
    });

    if (checkedRepos.length === 0) {
      this.setState({
        submissionResult: {
          success: true,
          severity: "warning",
          message: "No repositories selected",
        },
      });
    }

    const submitBody: ApiRequests.CreateActionsSecrets = {
      createSATokens: this.state.createSATokens,
      repos: checkedRepos,
    };

    const res = await fetchJSON<ApiRequests.CreateActionsSecrets, ApiResponses.RepoSecretsCreationSummary>(
      "POST",
      ApiEndpoints.App.Repos.Secrets.path,
      submitBody
    );

    this.setState({ submissionResult: res });
  }
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

  const checkboxId = `check-${repoWithSecrets.repo.full_name}`;
  const [ isShowingSecrets, setIsShowingSecrets ] = useState(false);

  const isEven = i % 2 === 0;

  return (
    <div
      className={classNames("p-3 rounded", { "bg-darker": isEven, "bg-lighter": !isEven })}
    >
      <div className={
        classNames(
          "text-lg b rounded",
          "d-flex align-items-center justify-content-between",
        )
      }>

        <div
          className={
            classNames("flex-grow-1 d-flex justify-content-between align-items-center")
          }
        >
          <div className="w-50">
            <input
              id={checkboxId}
              // className="form-check-input"
              type="checkbox" checked={checked}
              onChange={(e) => {
                const newChecked = e.currentTarget.checked;
                onCheckChanged(newChecked);
              }}
            />
            <label
              htmlFor={checkboxId}
              className="flex-grow-1 m-0 clickable"
              title="Click to toggle"
            >
              {repoWithSecrets.repo.full_name}
            </label>
          </div>

          <div className="mr-4">
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
              <React.Fragment>
                <FontAwesomeIcon icon="check-circle"
                  className="text-success" fixedWidth
                />
              </React.Fragment>
            )
            : ("")
          }
        </div> */}
        <div className="btn-line">
          <Button variant="light"
            title="GitHub Repository"
          >
            <ExternalLink
              href={repoWithSecrets.repo.html_url}
              title="GitHub Repository"
            >
              <BtnBody icon={[ "fab", "github" ]} />
            </ExternalLink>
          </Button>

          <Button variant="light"
            title="Edit Secrets in GitHub"
          >
            <ExternalLink
              href={repoWithSecrets.repo.html_url + "/settings/secrets/actions"}
              title="Edit Secrets in GitHub"
            >
              <BtnBody icon="edit"/>
            </ExternalLink>
          </Button>
        </div>
      </div>
      {/* https://react-bootstrap.github.io/utilities/transitions/ */}
      <Collapse in={isShowingSecrets}>
        {/* Do not put padding or margin on this div as it will mess up the collapse transition */}
        <div>
          {
            repoWithSecrets.secrets.length === 0
              ? <p>This repository has no Actions secrets.</p>
              : (
                <Table className="text-reset m-0">
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
                              {Object.values(defaultSecrets.defaultSecrets).includes(secret.name)
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
      </Collapse>
    </div>
  );
}

function ShowSecretsButton(props: { noSecrets: number, isShowingSecrets: boolean, onClick: () => void }): JSX.Element {
  let icon: IconProp;
  let text: string;
  if (props.noSecrets > 0) {
    if (props.isShowingSecrets) {
      icon = "eye-slash";
      text = "Hide Secrets";
    }
    else {
      icon = "eye";
      text = "Show Secrets";
    }
  }
  else {
    icon = "minus-circle";
    text = "No Secrets";
  }

  return (
    <React.Fragment>
      <Button variant="light b"
        title={text}
        onClick={(_e) => {
          props.onClick();
        }}
      >
        <FontAwesomeIcon fixedWidth icon={icon} />
        <span className="mx-2">
          {text}
        </span>
        {props.noSecrets > 0 ?
          <Badge variant="info">{props.noSecrets}</Badge>
          : ("")
        }
      </Button>
    </React.Fragment>
  );
}

function getSecretNameWarning(_secretNames: string[]): JSX.Element {
  // const msg = `Secret${secretNames.length === 1 ? "" : "s"} ${joinList(secretNames)} will be overwritten.`;
  const msg = `Existing secret will be updated.`;

  return (
    <div>
      <FontAwesomeIcon className="mr-2" icon="info-circle" title={msg} fixedWidth />
      {msg}
    </div>
  );
}

function SubmissionResultBanner(props: {
  bannerId: string,
  isSubmitting: boolean,
  submissionResult?: ApiResponses.RepoSecretsCreationSummary,
}): JSX.Element {

  if (props.isSubmitting) {
    return (
      <Banner id={props.bannerId}
        display={props.isSubmitting}
        severity={"info"}
        loading={props.isSubmitting}
        title={"Creating secrets..."}
      />
    );
  }
  else if (!props.submissionResult) {
    return <Banner id={props.bannerId} display={false} />;
  }

  return (
    <React.Fragment>
      <Banner
        id={props.bannerId}
        display={true}
        severity={props.submissionResult.severity}
        title={props.submissionResult.message}
      />
      <div className="px-4 py-2">
        {
          props.submissionResult.successes != null && props.submissionResult.successes.length > 0
            ?
            <React.Fragment>
              <ul className="no-bullets">
                {props.submissionResult.successes.map((success) => {
                  return (
                    <li key={success.actionsSecretName + success.repo.full_name}>
                      <FontAwesomeIcon icon="check-circle" fixedWidth className="mr-2 text-success" />
                      <b>{success.actionsSecretName}</b> in {success.repo.full_name}
                    </li>
                  );
                })}
              </ul>
            </React.Fragment>
            : ("")
        }
        {
          props.submissionResult.failures != null && props.submissionResult.failures.length > 0
            ?
            <React.Fragment>
              <ul className="no-bullets">
                {props.submissionResult.failures.map((failure) => {
                  return (
                    <li key={failure.actionsSecretName + failure.repo.full_name}>
                      <FontAwesomeIcon icon="times-circle" fixedWidth className="mr-2 text-danger" />
                      {failure.actionsSecretName != null ?
                        (
                          <React.Fragment>
                            <b>{failure.actionsSecretName}</b> in&nbsp;
                          </React.Fragment>
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
            </React.Fragment>
            : ("")
        }
      </div>
    </React.Fragment>
  );
}
