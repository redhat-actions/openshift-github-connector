import React from "react";
import LinkButton, { LinkButtonProps } from "./link-btn";

export default function appPageCard(props: {
    header: string,
    buttons: LinkButtonProps[],
    children: React.ReactNode,
}): JSX.Element {
  return (
    <div className="text-black card mb-4 p-3">
      <div className="card-title d-flex justify-content-between">
        <div className="d-flex align-items-center">
          <h4 className="font-weight-bold m-0">
            {props.header}
          </h4>
        </div>
        <div className="d-flex">
          {
            props.buttons.map((btnProps, i) => <LinkButton key={i} style={{ flexGrow: 1 }} {...btnProps}></LinkButton>)
          }
        </div>
      </div>
      <div className="card-body">
        {props.children}
      </div>
    </div>
  );
}
