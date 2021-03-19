import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function FaBtnBody({ icon, text: label }: { icon: IconProp, text?: string }): JSX.Element {
  return (
    <div className="d-flex justify-content-around align-items-center">
      <FontAwesomeIcon fixedWidth icon={icon} className="mr-2"/>
      {
        label
          ? <span className="font-weight-bold">
            {label}
          </span>
          : ""
      }
    </div>
  );
}
