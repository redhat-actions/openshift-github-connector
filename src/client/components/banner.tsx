import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import classNames from "classnames";

type BannerProps = {
  display: boolean,
  severity: "info" | "warn" | "error",
  children: string | React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>;

export default function Banner(props: BannerProps): JSX.Element {
  const divProps: Partial<BannerProps> = { ...props };
  // delete divProps.message;
  delete divProps.display;
  delete divProps.severity;

  let icon: IconProp;
  if (props.severity === "error") {
    icon = "times-circle";
  }
  else if (props.severity === "warn") {
    icon = "exclamation-triangle";
  }
  else {
    icon = "info-circle";
  }

  return (
    <div {...divProps} className={classNames(
      "banner py-2 px-3 my-3 rounded align-items-center", props.severity,
      { "d-flex": props.display, "d-none": !props.display }
    )}>
      <div>
        <FontAwesomeIcon icon={icon} className="fa-lg mr-3" />
      </div>
      {props.children}
    </div>
  );
}
