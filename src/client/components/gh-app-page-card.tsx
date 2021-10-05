import React from "react";
import classNames from "classnames";
import {
  Button, Card, CardTitle, CardBody,
} from "@patternfly/react-core";
import { NewTabLink } from "./external-link";
import BtnBody from "./btn-body";
import { IconElement } from "../util/icons";

export default function appPageCard(props: {
  header: string,
  buttons: {
    href: string,
    icon: IconElement,
    text: string,
  }[],
  children: React.ReactNode,
}): JSX.Element {
  return (
    <Card>
      <CardTitle>
        <div>
          {props.header}
        </div>
        <div className="ms-auto"></div>
        <div className="btn-line">
          {
            props.buttons.map((btnProps, i) => {
              return (
                <Button variant="primary" key={i}
                  className={classNames("flex-grow-1")}
                  title={btnProps.text}
                >
                  <NewTabLink href={btnProps.href}>
                    <BtnBody icon={btnProps.icon} text={btnProps.text} />
                  </NewTabLink>
                </Button>
              );
            })
          }
        </div>
      </CardTitle>
      <CardBody>
        {props.children}
      </CardBody>
    </Card>
  );
}
