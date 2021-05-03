import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function ExternalLink({
  href, children, className, title, icon,
}: {
    href: string,
    children: React.ReactNode,
    className?: string,
    title?: string,

    icon?: {
      position: "left" | "right",
      icon: IconProp,
    },
  }) {

  const marginSize = "0.6em";

  return (
    <a href={href}
      target="_blank" rel="noopener noreferrer"
      className={"external-link font-weight-bold " + (className ?? "")}
      title={title != null ? title : href}
    >
      {icon?.position === "left" ? <FontAwesomeIcon icon={icon.icon} style={{ marginRight: marginSize }} /> : ("")}
      {children}
      {icon?.position === "right" ? <FontAwesomeIcon icon={icon.icon} style={{ marginLeft: marginSize }} /> : ("")}
    </a>
  );
}
