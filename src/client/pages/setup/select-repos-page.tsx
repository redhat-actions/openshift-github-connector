import React from "react";
import { Card } from "react-bootstrap";
import ApiEndpoints from "../../../common/api-endpoints";
import ApiResponses from "../../../common/api-responses";
import DataFetcher from "../../components/data-fetcher";
import { ExternalLink } from "../../components/external-link";
import ClientPages from "../client-pages";
import SetupPageHeader from "./setup-header";

export default function SelectReposPage(): JSX.Element {

  return (
    <React.Fragment>
      <SetupPageHeader pageIndex={2} />

      <DataFetcher type="api" endpoint={ApiEndpoints.App.Root} loadingDisplay="spinner">
        {
          (appData: ApiResponses.GitHubAppState): JSX.Element => {

            if (!appData.app) {
              return (
                <span className="error">
                  Failed to load app.
                  <a href={ClientPages.SetupCreateApp.path}>
                    <h4 className="my-2">Create an App</h4>
                  </a>
                </span>);
            }

            return (
              <React.Fragment>
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
                      Select the repositories from which {"you'd"} like to be able to log in to this OpenShift cluster.
                    </p>
                  </Card.Body>
                </Card>
                <Card>
                  <Card.Title>
                    Available Repositories
                  </Card.Title>
                  <Card.Body>
                    {/* <ul className="no-bullets pl-3">
                      {appData.repositories.map((repo) => {
                        const checkboxID = `check-${repo.full_name}`;

                        return (
                          <li key={repo.full_name}>
                            <input className="form-check-input" type="checkbox" checked id={checkboxID}/>
                            <label className="form-check-label b" htmlFor={checkboxID}>
                              <a href={repo.url}>
                                {repo.full_name}
                              </a>
                            </label>
                          </li>
                        );
                      })}
                    </ul> */}
                    <ul>
                      {appData.repositories.map((repo) => {
                        return (
                          <li className="b" key={repo.full_name}>
                            <a href={repo.url}>
                              {repo.full_name}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </Card.Body>
                </Card>
              </React.Fragment>
            );
          }
        }
      </DataFetcher>
    </React.Fragment>
  );
}
