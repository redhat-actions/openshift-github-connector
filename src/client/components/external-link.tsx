import classNames from "classnames";
import { IconElement } from "../util/icons";

export function NewTabLink({
  href, children, className, title, icon,
}: {
  href: string,
  children?: React.ReactNode,
  className?: string,
  title?: string,

  icon?: {
    position: "left" | "right",
    Icon: IconElement,
    className?: string,
  },
}) {

  // const displayClass = icon != null ? "center-y" : "d-inline";

  return (
    <a href={href}
      target="_blank" rel="noopener noreferrer"
      className={classNames("b", className)}
      title={title != null ? title : href}
    >
      {icon?.position === "left" ? <icon.Icon className={classNames("me-2", icon.className)} /> : ("")}
      {children}
      {icon?.position === "right" ? <icon.Icon className={classNames("ms-2", icon.className)} /> : ("")}
    </a>
  );
}
