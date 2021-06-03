import { IconElement } from "../util/icons";

export function ExternalLink({
  href, children, className, title, icon,
}: {
    href: string,
    children?: React.ReactNode,
    className?: string,
    title?: string,

    icon?: {
      position: "left" | "right",
      icon: IconElement,
    },
  }) {

  const marginSize = "0.6em";

  return (
    <a href={href}
      target="_blank" rel="noopener noreferrer"
      className={"external-link font-weight-bold " + (className ?? "")}
      title={title != null ? title : href}
    >
      {icon?.position === "left" ? <icon.icon style={{ marginRight: marginSize }} /> : ("")}
      {children}
      {icon?.position === "right" ? <icon.icon style={{ marginLeft: marginSize }} /> : ("")}
    </a>
  );
}
