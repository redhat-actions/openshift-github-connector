// eslint-disable-next-line no-use-before-define
import React from "react";
import Paths from "../server/routes/paths";
import Layout from "./components/layout";

export default function index(): JSX.Element {
    return (
        <Layout>
            <h1>It's the home page</h1>
            <a href={Paths.Setup.CreateApp}>Create an app</a>
        </Layout>
    );
}
