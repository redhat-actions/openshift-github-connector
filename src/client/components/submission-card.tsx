/*
import classNames from "classnames";
import { useRef, useState } from "react";
import { Button, Card, Spinner } from "react-bootstrap";
import ApiResponses from "../../common/api-responses";
import Banner from "./banner";

interface SubmissionCardProps {
  title: string,
  description: React.ReactNode,
  btnLabel: string,
  onSubmit: () => Promise<ApiResponses.Result>,
  postSubmit: (result: ApiResponses.Result) => void,

  errorSeverity?: "error" | "warn",
}

export default function SubmissionCard(props: SubmissionCardProps) {

  const bannerId = useRef(Math.random().toString(36).substring(2));

  const [ successState, setSuccessState ] = useState<ApiResponses.Result | undefined>();
  const [ isLoading, setIsLoading ] = useState(false);

  let bannerSeverity: Banner.Severity;
  if (successState == null || successState.success) {
    bannerSeverity = "info";
  }
  else if (props.errorSeverity) {
    bannerSeverity = props.errorSeverity;
  }
  else {
    bannerSeverity = "warn";
  }

  return (

  );
}

*/

export {};
