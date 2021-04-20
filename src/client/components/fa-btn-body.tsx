import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function BtnBody(props: {
  icon?: IconProp,
  iconPosition?: "left" | "right",
  text?: string,
}): JSX.Element {

  const iconPosition = props.iconPosition || "left";

  let marginClass = "";
  if (props.text) {
    marginClass = iconPosition === "left" ? "mr-2" : "ml-2";
  }

  let iconElement: JSX.Element = (<></>);
  if (props.icon != null) {
    iconElement = (
      <FontAwesomeIcon
        fixedWidth
        icon={props.icon}
        className={marginClass}
        title={props.text}
      />
    );
  }

  const size = "1.6rem";

  return (
    <div className="d-flex justify-content-around align-items-center b"
      style={{ minHeight: size, minWidth: size }}
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
