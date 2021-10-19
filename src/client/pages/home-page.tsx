import { useContext } from "react";
import { Link, useHistory } from "react-router-dom";
import { ConnectorUserContext } from "../contexts";
import ClientPages from "./client-pages";

export default function HomePage() {
  const { user } = useContext(ConnectorUserContext);

  const history = useHistory();

  if (user.hasCompletedSetup) {
    history.push(ClientPages.SetupFinished.path);
  }
  else {
    history.push(ClientPages.SetupIndex.path);
  }

  return (
    <>
      <h2>Welcome</h2>
      <h5>
        <Link to={ClientPages.SetupIndex.path}>Go to the Setup Page</Link>
      </h5>
    </>
  );
}
