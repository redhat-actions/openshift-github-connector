/*
import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button, Title } from "@patternfly/react-core";

import ApiEndpoints from "../../common/api-endpoints";

export default function LoginPage(): JSX.Element {

  const queryParams = useParams();
  console.log("parmams", queryParams);
  const err = useRef<string>();

  useEffect(() => {
    console.log("an effect");
    const errKey = "err";

    // const urlSearch = new URLSearchParams(window.location.search.substring(1));
    const urlSearch = new URLSearchParams(queryParams);
    err.current = urlSearch.get(errKey) ?? undefined;

    console.log(`err=${err.current}`);
  }, [ queryParams ]);

  return (
    <LoginPageRender err={err.current} />
  );
}

function LoginPageRender({ err }: { err?: string }): JSX.Element {
  return (
    <>
      <Title headingLevel="h3">It&apos;s the login page</Title>

      <Button isLarge>
        <a href={ApiEndpoints.Auth.Login.path}>
          Log In
        </a>
      </Button>

      {err ? <Title headingLevel="h4" className="error">Login failed: {err}</Title> : ""}
    </>
  );
}

*/
export {};
