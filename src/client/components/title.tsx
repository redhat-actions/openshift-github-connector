import { Helmet } from "react-helmet";

const baseTitle = "OpenShift GitHub Connector";

export function getTitle(subtitle: string | undefined): JSX.Element {

  let title = baseTitle;
  if (subtitle) {
    title = `${subtitle} | ${baseTitle}`;
  }

  return (
    <Helmet>
      <title>{title}</title>
    </Helmet>
  );
}
