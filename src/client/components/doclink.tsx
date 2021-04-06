export function DocLink({ text, href }: { text: string, href: string }) {

  return (
    <a href={href} title={href}
      target="_blank" rel="noopener noreferrer"
      className="font-weight-bold"
    >
      {text}
      {/* <FontAwesomeIcon
        fixedWidth
        icon="external-link-alt"
        className="mx-1"
      />*/}
    </a>
  );
}
