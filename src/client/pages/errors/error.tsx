export interface ErrorPageProps {
    statusCode: number,
    statusMessage: string,
    message: string,
}

export default function error(props: ErrorPageProps): JSX.Element {
  return (
    <>
      <h1 className="text-danger">{props.statusCode} {props.statusMessage}</h1>
      <br></br>
      <h3>{props.message}</h3>
    </>
  );
}
