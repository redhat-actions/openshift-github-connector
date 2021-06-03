import React from "react";
import { Tooltip, TooltipPosition } from "@patternfly/react-core";
import classNames from "classnames";
import { QuestionCircleIcon } from "@patternfly/react-icons";
import { IconElement } from "../util/icons";

interface TooltipProps {
  icon?: IconElement,
  iconClasses?: string,
  position?: TooltipPosition,

  title?: string,
  body?: React.ReactNode,
}

export function TooltipIcon(props: TooltipProps) {

  // const id = "help-popover" + uuid();

  const position = props.position ?? "top";
  const Icon = props.icon ?? QuestionCircleIcon;

  return (
    <Tooltip
      content={
        <>
          <h3 className="text-black">{props.title}</h3>
          {props.body}
        </>
      }
      position={position}
    >
      <Icon className={classNames("mx-3", props.iconClasses)} size="lg" />
    </Tooltip>
  );
}
