import React from "react";

function appPageCard(props: {
    header: string,
    buttons?: React.ReactNode,
    children: React.ReactNode,
}): JSX.Element {
    return (
        <div className="text-black card mb-4 p-3">
            <h4 className="d-flex card-title font-weight-bold">{props.header}
                <div className="ml-auto"></div>
                {
                    props.buttons ? props.buttons : ""
                }
            </h4>
            <div className="card-body">
                {props.children}
            </div>
        </div>
    );
}

export default appPageCard;
