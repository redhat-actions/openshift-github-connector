import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OverlayTrigger, Popover } from "react-bootstrap";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import classNames from "classnames";
import { v4 as uuid } from "uuid";
import { Placement } from "react-bootstrap/esm/Overlay";

interface TooltipProps {
  icon?: IconProp,
  iconClasses?: string,
  placement?: Placement,

  title?: string,
  body?: React.ReactNode,
}

export function TooltipIcon(props: TooltipProps) {

  const id = "help-popover" + uuid();

  const placement = props.placement ?? "top";
  const icon = props.icon ?? "question-circle";

  return (
    <OverlayTrigger trigger={[ "hover", "focus" ]} placement={placement} overlay={(
      <Popover id={id}>
        {
          props.title ? <Popover.Title as="h3" className="text-black">{props.title}</Popover.Title> : ""
        }
        <Popover.Content>
          {props.body}
        </Popover.Content>
      </Popover>
    )}>
      <FontAwesomeIcon icon={icon} className={classNames("mx-3", props.iconClasses)} size="lg" />
    </OverlayTrigger>
  );
}
