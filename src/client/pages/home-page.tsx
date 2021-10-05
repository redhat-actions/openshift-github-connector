import { Link, Redirect } from "react-router-dom";
import ClientPages from "./client-pages";

export default function HomePage(): JSX.Element {
  const setupRoot = ClientPages.SetupIndex.path;

  // const history = useHistory();
  // history.push(setupRoot);

  return (
    <>
      <h2>Welcome</h2>
      <h5>
        <Redirect to={setupRoot} />
        <Link to={setupRoot}>Go to the Setup Page</Link>
      </h5>
    </>
  );
}
