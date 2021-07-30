import classNames from "classnames";
import { Spinner } from "@patternfly/react-core";
import { IconElement } from "../util/icons";

export default function BtnBody(props: {
  icon?: IconElement,
  iconPosition?: "left" | "right",
  iconClasses?: string,
  // Better than Patternfly's because the loading icon goes on the opposite side from the icon.
  isLoading?: boolean,
  text?: string,
  title?: string,
}): JSX.Element {

  const iconPosition = props.iconPosition || "left";

  const loadingElement = props.isLoading ? (
    <Spinner size="md" />
  ) : ("");

  let BtnIcon: JSX.Element = <></>;
  if (props.icon) {
    BtnIcon = <props.icon className={classNames(props.iconClasses)} />;
  }

  return (
    <div className={classNames("btn-body", { "btn-body-icon": props.icon != null, "btn-body-text": props.text != null })}
      title={props.title ?? props.text}
    >
      {iconPosition === "left" ? BtnIcon : ""}
      {iconPosition === "left" ? "" : loadingElement}
      <span>
        {
          props.text ?? ""
        }
      </span>
      {iconPosition === "right" ? BtnIcon : ""}
      {iconPosition === "right" ? "" : loadingElement}
    </div>
  );
}
