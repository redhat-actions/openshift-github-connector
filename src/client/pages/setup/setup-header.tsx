import classNames from "classnames";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Card, Spinner } from "react-bootstrap";

import "../../css/setup.scss";
import ClientPages, { ClientPage } from "../client-pages";
import FaBtnBody from "../../components/fa-btn-body";

export const SETUP_QUERYPARAM = "setup";

type SetupPageProps = {
  pageIndex: number;
  hideBtnBanner?: boolean;
  /**
   * has no effect if hideBtnBanner is "true"
   */
  checkCanProceed?: () => Promise<boolean>;
  // children: React.ReactNode
};

type SetupPageState = {
};

type SetupStepType = "passed" | "current" | "todo";

export function getSetupPath(clientPage: ClientPage): string {
  return clientPage.path + `?${SETUP_QUERYPARAM}=true`;
}

export default function SetupPageHeader(props: SetupPageProps, _state: SetupPageState): JSX.Element {
  const SetupSteps = [
    { title: "Create GitHub App", path: getSetupPath(ClientPages.SetupCreateApp) },
    { title: "View GitHub App", path: getSetupPath(ClientPages.App) },
    { title: "Create Service Account", path: getSetupPath(ClientPages.SetupServiceAccount) },
    { title: "Connect Repositories", path: getSetupPath(ClientPages.SetupRepos) },
  ];

  const finishPage = ClientPages.Home.path;

  if (props.pageIndex > SetupSteps.length - 1 || props.pageIndex < 0) {
    return (
      <span className="error">
        Invalid setup step index {`"${props.pageIndex}"`}
      </span>
    );
  }

  const history = useHistory();

  const [ loading, setLoading ] = useState(false);

  const nextBtnText = props.pageIndex === SetupSteps.length - 1 ? "Finish" : "Next";
  // const showBackBtn = props.pageIndex !== 0;

  return (
    <div className="setup-header">
      <div className="setup-header-wrapper">
        <div className="setup-header-background">
        </div>
        <Card className="setup-header-body">
          <div className="d-flex justify-content-around">
            {SetupSteps.map((step, i) => {
              const isCurrentStep = i === props.pageIndex;
              let stepType: SetupStepType;
              if (isCurrentStep) {
                stepType = "current";
              }
              else if (props.pageIndex > i) {
                stepType = "passed";
              }
              else {
                stepType = "todo";
              }

              const clickable = stepType === "passed";

              return (
                <div key={i} className={classNames("setup-step", stepType, { clickable })} onClick={() => {
                  if (!clickable) {
                    return;
                  }
                  history.push(step.path);
                }}>
                  <div className="mb-2 d-flex justify-content-center">
                    <div className={`setup-step-circle ${stepType}`}>
                      {stepType === "passed" ? <FontAwesomeIcon icon="check-circle"/> : (i + 1).toString()}
                    </div>
                  </div>
                  <span className={classNames({ b: isCurrentStep })}>{step.title}</span>
                </div>
              );
            })}
          </div>
          <div className={
            classNames("setup-header-buttons align-items-center justify-content-between", {
              "d-flex": props.hideBtnBanner !== true,
              "d-none": props.hideBtnBanner === true,
            })}>

            {/* showBackBtn
              ? <Button className={classNames("btn-lg d-flex justify-content-center", { "d-none": showBackBtn })} title="Back">
                <a href={SetupSteps[props.pageIndex - 1].path}>
                  <div className="d-flex align-items-center">
                    <FontAwesomeIcon className="mr-3" icon="arrow-left"/>
                Back
                  </div>
                </a>
              </Button> : ""
            */}

            <div className="d-flex justify-content-center flex-grow-1">
              <Spinner className={classNames({ "d-none": !loading })} animation="border" variant="primary"/>
            </div>

            {!props.hideBtnBanner
              ? <Button className={classNames("btn-lg d-flex justify-content-center", { disabled: loading })}
                title={nextBtnText} onClick={async () => {
                  let nextPage: string;
                  if (props.pageIndex === SetupSteps.length - 1) {
                    nextPage = finishPage;
                  }
                  else {
                    nextPage = SetupSteps[props.pageIndex + 1].path;
                  }

                  if (!props.checkCanProceed) {
                    history.push(nextPage);
                    return;
                  }

                  try {
                    setLoading(true);
                    const canProceed = await props.checkCanProceed();

                    if (canProceed) {
                      history.push(nextPage);
                    }
                  }
                  catch (err) {
                    // setSubmitResult({ success: false, message: err.message });
                    console.error(err);
                  }
                  finally {
                    setLoading(false);
                  }
                }}
              >
                <a>
                  <div className="d-flex align-items-center">
                    <FaBtnBody icon="arrow-right" iconPosition="right" text={nextBtnText}/>
                  </div>
                </a>
              </Button>
              : ""}
          </div>
        </Card>
      </div>
    </div>
  );
}
