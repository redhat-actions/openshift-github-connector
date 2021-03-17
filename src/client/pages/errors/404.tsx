import React from "react";

export default function error(props: { path: string }): JSX.Element {
    return (
        <React.Fragment>
            <h1 className="mb-3">404 Not Found</h1>
            <h3>There is no page at {props.path}</h3>
            <br className="my-3"/>
            <h2>
                <a href="/">Go back home</a>
            </h2>
        </React.Fragment>
    );
}
