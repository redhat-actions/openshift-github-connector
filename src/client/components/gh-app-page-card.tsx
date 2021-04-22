import React from "react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import classNames from "classnames";
import { Button, Card } from "react-bootstrap";

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
    <Card>
      <Card.Title>
        <div>
          {props.header}
        </div>
        <div className="ml-auto"></div>
        <div className="btn-line" style={{ width: "20ch" }}>
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
      </Card.Title>
      <Card.Body>
        {props.children}
      </Card.Body>
    </Card>
  );
}
