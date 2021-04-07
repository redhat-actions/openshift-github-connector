import classNames from "classnames";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Card, Spinner } from "react-bootstrap";

import "../../css/setup.scss";
import ClientPages from "../client-pages";
import { getAppPageUrlWithSetupQuery } from "./setup-gh-app-page";
import Banner from "../../components/banner";

export type SubmitResult = { ok: boolean, message: string };

type SetupPageProps = {
  pageIndex: number;
  onSubmit?: () => Promise<SubmitResult>;
  // children: React.ReactNode
};

type SetupPageState = {
};

type SetupStepState = "passed" | "current" | "todo";

export default function SetupPageHeader(props: SetupPageProps, _state: SetupPageState): JSX.Element {
  const SetupSteps = [
    { title: "Create GitHub App", path: ClientPages.SetupCreateApp.path },
    { title: "View GitHub App", path: getAppPageUrlWithSetupQuery() },
    { title: "Create Service Account", path: ClientPages.SetupServiceAccount.path },
    { title: "Select Repositories", path: "/setup/select-repos" },
  ];

  if (props.pageIndex > SetupSteps.length - 1 || props.pageIndex < 0) {
    return (
      <span className="errored">
        Invalid setup step index {`"${props.pageIndex}"`}
      </span>
    );
  }

  const history = useHistory();

  const [ loading, setLoading ] = useState(false);
  const [ submitResult, setSubmitResult ] = useState<SubmitResult | undefined>(undefined);

  const nextBtnText = props.pageIndex === SetupSteps.length - 1 ? "Finish" : "Next";
  const showBackBtn = props.pageIndex !== 0;

  return (
    <div className="setup-header">
      <div className="setup-header-wrapper">
        <div className="setup-header-background">
        </div>
        <Card className="setup-header-body">
          <div className="d-flex justify-content-around">
            {SetupSteps.map((step, i) => {
              const isCurrentStep = i === props.pageIndex;
              let state: SetupStepState;
              if (isCurrentStep) {
                state = "current";
              }
              else if (props.pageIndex > i) {
                state = "passed";
              }
              else {
                state = "todo";
              }

              return (
                <div key={i} className={classNames("setup-step-indicator", { active: isCurrentStep })}>
                  <a href={step.path}>
                    <div key={i} style={{ textAlign: "center" }} className="mb-2 d-flex justify-content-center">
                      <div className={`setup-step-circle ${state}`} {...props}>
                        {(i + 1).toString()}
                      </div>
                    </div>
                    <span className={classNames({ b: isCurrentStep })}>{step.title}</span>
                  </a>
                </div>
              );
            })}
          </div>
          <div className="setup-header-buttons d-flex align-items-center justify-content-between">
            <Button className={classNames("btn-lg d-flex justify-content-center", { "d-none": showBackBtn })} title="Back">
              <a href={SetupSteps[props.pageIndex - 1].path}>
                <div className="d-flex align-items-center">
                  <FontAwesomeIcon className="mr-3" icon="arrow-left"/>
                Back
                </div>
              </a>
            </Button>

            <div>
              <Spinner className={classNames({ "d-none": !loading })} animation="border"/>

              <Banner
                display={submitResult != null}
                // display={true}
                isError={submitResult && !submitResult.ok}
                message={submitResult?.message || "" }
              />
            </div>

            <Button className={classNames("btn-lg d-flex justify-content-center", { disabled: loading })} title={nextBtnText} onClick={async () => {
              const nextStep = SetupSteps[props.pageIndex + 1].path;
              if (!props.onSubmit) {
                history.push(nextStep);
                return;
              }

              try {
                setSubmitResult(undefined);
                setLoading(true);
                const result = await props.onSubmit();
                setSubmitResult(result);

                if (result.ok) {
                  setTimeout(() => history.push(nextStep), 500);
                }
              }
              catch (err) {
                setSubmitResult({ ok: false, message: err.message });
              }
              finally {
                setLoading(false);
              }
            }}>
              <a>
                <div className="d-flex align-items-center">
                  {nextBtnText}
                  <FontAwesomeIcon className="ml-3" icon="arrow-right"/>
                </div>
              </a>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
