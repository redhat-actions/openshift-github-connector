import React from "react";
import { Jumbotron, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DataFetcher from "../../components/data-fetcher";
import Endpoints from "../../../common/endpoints";
import { CreateAppResponse } from "../../../common/interfaces/api-types";

export default function setupAppPage(): JSX.Element {
  return (
    <DataFetcher loadingType="spinner" type="api" endpoint={Endpoints.Setup.CreateApp}>{
      (data: CreateAppResponse) => {
        const githubManifestUrl = `https://github.com/settings/apps/new?state=${data.state}`;

        return (
          <React.Fragment>
            <Jumbotron className="text-black">
              <h2 className="text-center">You have to create an app now</h2>
              <form className="row justify-content-center mt-5" method="post" action={githubManifestUrl}>
                <input className="d-none" name="manifest" type="manifest" readOnly={true} value={JSON.stringify(data.manifest)} />
                <Button className="btn-primary btn-lg d-flex px-5" type="submit">
                  <FontAwesomeIcon icon={[ "fab", "github" ]} className="fa-2x mr-3 text-black"/>
                  <div className="font-weight-bold align-self-center" title="Create your app">
                    Create your app
                  </div>
                </Button>
              </form>
            </Jumbotron>
          </React.Fragment>
        );
      }}
    </DataFetcher>
  );
}
