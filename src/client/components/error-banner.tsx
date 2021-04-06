import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

type ErrorBannerProps = { message: string, display: boolean } & React.HTMLAttributes<HTMLDivElement>;

export default function ErrorBanner(props: ErrorBannerProps): JSX.Element {

  if (!props.display) {
    return (<div/>);
  }

  let classNames: string = props.className || "";
  classNames += "w-100 p-3 rounded errored";

  const divProps: Partial<ErrorBannerProps> = { ...props };
  delete divProps.message;

  return (
    <div {...divProps} className={classNames}>
      <FontAwesomeIcon icon="times-circle" className="fa-lg mr-3" />
      {props.message}
    </div>
  );
}
