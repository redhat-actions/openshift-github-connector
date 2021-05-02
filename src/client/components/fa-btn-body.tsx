import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function BtnBody(props: {
  icon?: IconProp,
  iconPosition?: "left" | "right",
  iconClasses?: string,
  text?: string,
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

  return (
    <div className="btn-body"
      title={props.text}
    >
      {iconPosition === "left" ? iconElement : ""}
      {
        props.text
          ? <span className="" title={props.text}>
            {props.text}
          </span>
          : ""
      }
      {iconPosition === "right" ? iconElement : ""}
    </div>
  );
}
