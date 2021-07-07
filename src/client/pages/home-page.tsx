import { Link, useHistory } from "react-router-dom";
import ClientPages from "./client-pages";

export default function HomePage(): JSX.Element {

  const history = useHistory();

  const setupRoot = ClientPages.SetupIndex.path;

  history.push(setupRoot);

  return (
    <>
      <h2>Welcome</h2>
      <h5>
        <Link to={setupRoot}>Go to the Setup Page</Link>
      </h5>
    </>
  );
}
