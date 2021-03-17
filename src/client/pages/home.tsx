import React from "react";
import { Link } from "react-router-dom";
import Endpoints from "../../common/endpoints";
import DataFetcher from "../components/data-fetcher";

export default function homepage(): JSX.Element {
    return (
        <React.Fragment>
            <h1>It's the home page</h1>
            <h3>Backend health:&nbsp;
                <DataFetcher type="api" endpoint={Endpoints.Health}>
                    {(data: { status: string }) => (
                        <React.Fragment>{data.status}</React.Fragment>
                    )}
                </DataFetcher>
            </h3>
            <Link to={Endpoints.App.path}>Go to the app page</Link>
        </React.Fragment>
    );
}
