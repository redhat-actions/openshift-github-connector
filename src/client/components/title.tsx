import { Helmet } from "react-helmet";

const baseTitle = "OpenShift GitHub Connector";

export function getTitle(subtitle: string | undefined): JSX.Element {

  let title = baseTitle;
  if (subtitle) {
    title = `${baseTitle} | ${subtitle}`;
  }

  return (
    <Helmet>
      <title>{title}</title>
    </Helmet>
  );
}
