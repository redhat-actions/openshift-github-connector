import { Title } from "@patternfly/react-core";
import { Link } from "react-router-dom";
import { BasePage } from "../base-page";

export default function notFound(props: { path: string }): JSX.Element {
  return (
    <>
      <BasePage title="Not Found" options={{ fullWidth: false }}>
        <>
          <Title headingLevel="h2">404 Not Found</Title>
          <Title headingLevel="h4">There is no page at {props.path}</Title>
          <br className="my-3"/>
          <Title headingLevel="h2">
            <Link to="/">Go back home</Link>
          </Title>
        </>
      </BasePage>
    </>
  );
}
