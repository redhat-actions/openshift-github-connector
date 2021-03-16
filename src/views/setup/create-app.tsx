// eslint-disable-next-line no-use-before-define
import React from "react";
import { Jumbotron, Button } from "react-bootstrap";
import Layout from "../components/layout";

export default function appSetup(props: {
    manifest: Record<string, unknown>,
    state: string,
}): JSX.Element {
    const githubManifestUrl = `https://github.com/settings/apps/new?state=${props.state}`;
    return (
        <Layout>
            <Jumbotron className="text-black">
                <h2 className="text-center">OpenShift GitHub Actions Connector</h2>
                <h5 className="text-center">
                    OpenShift GitHub Actions Connector is designed to help you work seamlessly with
                    Red Hat Developer tools and Openshift clusters.
                </h5>
                <hr className="my-4" />
                <p>This application can access your your GitHub org or personal account
                    and authenticate against Openshift to enable default integrations.
                </p>
                <ul>
                    <li>Install and Configure OpenShift Clusters for use with Red Hat Actions</li>
                    <li>Manage, modify and configure Red Hat actions in your repositories</li>
                    <li>Manage OpenShift GitHub Runners</li>
                </ul>
                <form className="row justify-content-center mt-5" method="post" action={githubManifestUrl}>
                    <input className="d-none" name="manifest" type="manifest" readOnly={true} value={JSON.stringify(props.manifest)} />
                    <Button className="btn-primary btn-lg d-flex px-5" type="submit">
                        <i className="fab fa-github fa-2x mr-3 text-black"></i>
                        <div className="font-weight-bold align-self-center" title="Create your app">
                            Create your app
                        </div>
                    </Button>
                </form>
            </Jumbotron>
        </Layout>
    );
}
