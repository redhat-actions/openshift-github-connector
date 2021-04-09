import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function ExternalLink(
  { href, children, showExternalLinkIcon }:
  { href: string, children: React.ReactNode, showExternalLinkIcon?: boolean }
) {

  return (
    <a href={href} title={href}
      target="_blank" rel="noopener noreferrer"
      className="font-weight-bold"
    >
      {children}

      {showExternalLinkIcon
        ? <FontAwesomeIcon
          fixedWidth
          icon="external-link-alt"
          className="mx-1"
        /> : ""
      }
    </a>
  );
}
