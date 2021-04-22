import { Redirect } from "react-router-dom";
import ClientPages from "./client-pages";

export default function HomePage(): JSX.Element {
  return (
    <Redirect to={ClientPages.Setup.path} />
  );
}
