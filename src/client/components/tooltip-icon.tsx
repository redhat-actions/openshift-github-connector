import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip, TooltipPosition } from "@patternfly/react-core";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import classNames from "classnames";

interface TooltipProps {
  icon?: IconProp,
  iconClasses?: string,
  position?: TooltipPosition,

  title?: string,
  body?: React.ReactNode,
}

export function TooltipIcon(props: TooltipProps) {

  // const id = "help-popover" + uuid();

  const position = props.position ?? "top";
  const icon = props.icon ?? "question-circle";

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
      <FontAwesomeIcon icon={icon} className={classNames("mx-3", props.iconClasses)} size="lg" />
    </Tooltip>
  );
}
