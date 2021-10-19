import React from "react";
import { Title, Tooltip, TooltipPosition } from "@patternfly/react-core";
import classNames from "classnames";
import { IconSize, QuestionCircleIcon } from "@patternfly/react-icons";
import { IconElement } from "../util/icons";
import { NewTabLink } from "./external-link";

interface TooltipProps {
  icon?: IconElement,
  iconClasses?: string,
  iconSize?: IconSize,
  position?: TooltipPosition,

  title?: string,
  body?: React.ReactNode,

  href?: string,
}

export function TooltipIcon(props: TooltipProps) {

  // const id = "help-popover" + uuid();

  const position = props.position ?? "top";
  const Icon = props.icon ?? QuestionCircleIcon;
  const IconElem = (
    <Icon size={props.iconSize} className={classNames("tooltip-icon", props.iconClasses)} />
  );

  return (
    <Tooltip
      content={
        <div>
          <Title headingLevel="h5">{props.title}</Title>
          <div>
            {props.body}
          </div>
        </div>
      }
      position={position}
    >
      {
        props.href ? (<NewTabLink href={props.href}>{IconElem}</NewTabLink>) : IconElem
      }

    </Tooltip>
  );
}
