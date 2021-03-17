import React, { useState } from "react";
import { Link } from "react-router-dom";
import fetch from "node-fetch";
import Paths from "../../common/paths";

async function updateHealth(): Promise<string> {
    const health = await fetch(Paths.Health);
    return (await health.json()).status;
}

export default function homepage(): JSX.Element {
    const [ health, setHealth ] = useState("Loading...");

    updateHealth().then((newHealth) => setHealth(newHealth));

    return (
        <React.Fragment>
            <h1>It's the home page</h1>
            <h3>Backend health: {health}</h3>
            <Link to={Paths.App.Root}>Go to the app page</Link>
        </React.Fragment>
    );
}
