import React from "react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import FaBtnBody from "./fa-btn-body";

export interface LinkButtonProps {
    icon: IconProp,
    href: string,
    label?: string,
    tooltip?: string,
    mr?: boolean,
    style?: React.CSSProperties
}

export default function LinkButton(props: LinkButtonProps): JSX.Element {
  const tooltip = props.tooltip ?? props.label;

  return (
    <a role="button" target="_blank" rel="noreferrer"
      href={props.href}
      className={"btn btn-outline-light " + (props.mr ? "mr-2" : "")}
      data-toggle="tooltip" title={tooltip}
      style={props.style}
    >
      <FaBtnBody icon={props.icon} text={props.label} />
    </a>
  );
}
