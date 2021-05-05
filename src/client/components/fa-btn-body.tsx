import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { Spinner } from "react-bootstrap";

export default function BtnBody(props: {
  icon?: IconProp,
  iconPosition?: "left" | "right",
  iconClasses?: string,
  isLoading?: boolean,
  text?: string,
  title?: string,
}): JSX.Element {

  const iconPosition = props.iconPosition || "left";

  const iconClasses = props.iconClasses ?? "";

  let iconElement: JSX.Element = (<></>);
  if (props.icon != null) {
    iconElement = (
      <FontAwesomeIcon
        fixedWidth
        icon={props.icon}
        className={iconClasses}
      />
    );
  }

  const loadingElement = props.isLoading ? (
    <Spinner className={classNames({ "d-none": !props.isLoading })} variant="light" animation="border" />
  ) : ("");

  return (
    <div className={classNames("btn-body", { "btn-body-icon": props.icon != null, "btn-body-text": props.text != null })}
      title={props.title ?? props.text}
    >
      {iconPosition === "left" ? iconElement : ""}
      {iconPosition === "left" ? "" : loadingElement}
      {
        props.text
          ? <span className="">
            {props.text}
          </span>
          : ""
      }
      {iconPosition === "right" ? iconElement : ""}
      {iconPosition === "right" ? "" : loadingElement}
    </div>
  );
}
