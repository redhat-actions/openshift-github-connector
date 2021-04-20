export function ExternalLink({
  href, children, className, title,
}: {
    href: string,
    children: React.ReactNode,
    className?: string,
    title?: string,
  }) {

  return (
    <a href={href}
      target="_blank" rel="noopener noreferrer"
      className={"external-link font-weight-bold " + (className ?? "")}
      title={title != null ? title : href}
    >
      {children}
    </a>
  );
}
