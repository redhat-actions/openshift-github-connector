import React from "react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import classNames from "classnames";
import { Button } from "react-bootstrap";

import { ExternalLink } from "./external-link";
import BtnBody from "./fa-btn-body";

export default function appPageCard(props: {
    header: string,
    buttons: {
      href: string,
      icon: IconProp,
      mr?: boolean,
      text: string,
      title: string,
    }[],
    children: React.ReactNode,
}): JSX.Element {
  return (
    <div className="card">
      <div className="card-title d-flex justify-content-between align-items-center">
        <h4>
          {props.header}
        </h4>
        <div className="btn-line" style={{ width: "25ch" }}>
          {
            props.buttons.map((btnProps, i) => {
              return (
                <Button variant="primary" key={i}
                  className={classNames("flex-grow-1")}
                  title={btnProps.title}
                >
                  <ExternalLink href={btnProps.href}>
                    <BtnBody icon={btnProps.icon} text={btnProps.text}></BtnBody>
                  </ExternalLink>
                </Button>
              );
            })
          }
        </div>
      </div>
      <div className="card-body pb-3">
        {props.children}
      </div>
    </div>
  );
}
