import React from "react";
import { Link, useHistory } from "react-router-dom";
import { getSetupSteps } from "./setup/setup-header";

export default function HomePage(): JSX.Element {

  const history = useHistory();

  const setupRoot = getSetupSteps()[0].path;

  history.push(setupRoot);

  return (
    <React.Fragment>
      <h2>Welcome</h2>
      <h5>
        <Link to={setupRoot}>Go to the Setup Page</Link>
      </h5>
    </React.Fragment>
  );
}
