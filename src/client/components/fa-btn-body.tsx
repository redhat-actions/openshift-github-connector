import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function FaBtnBody(props: {
  icon: IconProp,
  iconPosition?: "left" | "right",
  text?: string,
}): JSX.Element {

  const iconPosition = props.iconPosition || "left";

  let marginClass = "";
  if (props.text) {
    marginClass = iconPosition === "left" ? "mr-2" : "ml-2";
  }

  const iconElement = (
    <FontAwesomeIcon
      fixedWidth
      icon={props.icon}
      className={marginClass}
      title={props.text}
    />
  );

  return (
    <div className="d-flex justify-content-around align-items-center">
      {iconPosition === "left" ? iconElement : ""}
      {
        props.text
          ? <span className="">
            {props.text}
          </span>
          : ""
      }
      {iconPosition === "right" ? iconElement : ""}
    </div>
  );
}
