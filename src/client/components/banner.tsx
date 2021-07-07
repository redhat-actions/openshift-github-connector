import React from "react";
import classNames from "classnames";
import { Spinner } from "@patternfly/react-core";
import { CommonIcons, IconElement } from "../util/icons";
import { Severity } from "../../common/common-util";

namespace Banner {
  export type Props = {
    display?: boolean,
    severity?: Severity,
    loading?: boolean,
    title?: React.ReactNode,
    className?: string,
    children?: React.ReactNode,
  } & React.HTMLAttributes<HTMLDivElement>;
}

function Banner(props: Banner.Props): JSX.Element {
  const divProps: Partial<Banner.Props> = { ...props };
  // delete divProps.message;
  delete divProps.display;
  delete divProps.severity;
  delete divProps.loading;
  delete divProps.title;

  const display: boolean = props.display == null ? true : props.display;

  let BannerIcon: IconElement | undefined;
  if (props.severity === "danger") {
    BannerIcon = CommonIcons.Error;
  }
  else if (props.severity === "warning") {
    BannerIcon = CommonIcons.Warning;
  }
  else if (props.severity === "info") {
    BannerIcon = CommonIcons.Info;
  }
  else if (props.severity === "success") {
    BannerIcon = CommonIcons.Success;
  }

  return (
    <div {...divProps} className={classNames(
      props.className,
      "banner rounded p-3",
      "bg-" + props.severity,
      "text-" + ([ "warning", "info" ].includes(props.severity ?? "") ? "black" : "light"),
      { "d-none": !display }
    )}>
      <div className={classNames(
        "banner-title flex-grow-1 center-y",
      )}>
        <div>
          {BannerIcon != null
            ? <BannerIcon className="fa-lg me-3" />
            : ("")
          }
        </div>
        <div className="flex-grow-1">
          {props.title}
        </div>
        <div className="ms-auto">
          {props.loading
            ? (<Spinner size="md"/>)
            : ("")
          }
        </div>
      </div>
      {props.children}
    </div>
  );
}

export default Banner;
