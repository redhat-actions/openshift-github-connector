import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import classNames from "classnames";
import { Spinner } from "react-bootstrap";
import { Severity } from "../../common/common-util";

namespace Banner {
  export type Props = {
    display: boolean,
    severity?: Severity,
    loading?: boolean,
    title?: React.ReactNode,
    children?: React.ReactNode,
  } & React.HTMLAttributes<HTMLDivElement>;
}

export function Banner(props: Banner.Props): JSX.Element {
  const divProps: Partial<Banner.Props> = { ...props };
  // delete divProps.message;
  delete divProps.display;
  delete divProps.severity;
  delete divProps.loading;
  delete divProps.title;

  let icon: IconProp | undefined;
  if (props.severity === "danger") {
    icon = "times-circle";
  }
  else if (props.severity === "warning") {
    icon = "exclamation-triangle";
  }
  else if (props.severity === "info") {
    icon = "info-circle";
  }
  else if (props.severity === "success") {
    icon = "check-circle";
  }

  return (
    <div {...divProps} className={classNames(
      "banner rounded p-3",
      "bg-" + props.severity,
      "text-" + (props.severity === "warning" ? "black" : "white"),
      { "d-none": !props.display }
    )}>
      <div className={classNames(
        "banner-title flex-grow-1 d-flex align-items-center",
      )}>
        <div>
          {icon != null
            ? <FontAwesomeIcon icon={icon} className="fa-lg mr-3" />
            : ("")
          }
        </div>
        <div className="flex-grow-1">
          {props.title}
        </div>
        <div className="ml-auto">
          {props.loading
            ? (<Spinner animation="border" style={{ height: "1.5em", width: "1.5em" }}/>)
            : ("")
          }
        </div>
      </div>
      {props.children}
    </div>
  );
}

export default Banner;
