import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import classNames from "classnames";

type BannerProps = { message: string, display: boolean, isError?: boolean } & React.HTMLAttributes<HTMLDivElement>;

export default function Banner(props: BannerProps): JSX.Element {
  const divProps: Partial<BannerProps> = { ...props };
  delete divProps.message;
  delete divProps.display;
  delete divProps.isError;

  const icon: IconProp = props.isError ? "times-circle" : "info-circle";

  return (
    <div {...divProps} className={classNames(
      "p-2 my-2 mx-3 rounded align-items-center",
      { "d-flex": props.display, "d-none": !props.display, errored: props.isError }
    )}>
      <div>
        <FontAwesomeIcon icon={icon} className="fa-lg mr-3" />
      </div>
      {props.message}
    </div>
  );
}
