import classNames from "classnames";
import { useHistory } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Card } from "react-bootstrap";

import ClientPages from "../client-pages";
import BtnBody from "../../components/fa-btn-body";

type SetupPageProps = {
  pageIndex: number,
  hideBtnBanner?: boolean,
  /**
   * has no effect if hideBtnBanner is "true"
   */
  canProceed?: boolean,
  // children: React.ReactNode
};

type SetupStepType = "passed" | "current" | "todo";

export const SETUP_QUERYPARAM = "setup";
const query = { [SETUP_QUERYPARAM]: "true" };

export function getSetupSteps() {
  return [
    { title: "Create GitHub App", path: ClientPages.SetupCreateApp.withQuery(query) },
    { title: "View GitHub App", path: ClientPages.App.withQuery(query) },
    // { title: "Create Service Account", path: getSetupPath(ClientPages.SetupServiceAccount) },
    { title: "Connect Repositories", path: ClientPages.SetupRepos.withQuery(query) },
  ];
}

export default function SetupPageHeader(props: SetupPageProps): JSX.Element {

  const finishPage = ClientPages.Home.path;

  const setupSteps = getSetupSteps();

  if (props.pageIndex > setupSteps.length - 1 || props.pageIndex < 0) {
    return (
      <span className="error">
        Invalid setup step index {`"${props.pageIndex}"`}
      </span>
    );
  }

  const history = useHistory();

  // const [ loading, setLoading ] = useState(false);

  const nextBtnText = props.pageIndex === setupSteps.length - 1 ? "Finish" : "Next";
  // const showBackBtn = props.pageIndex !== 0;

  return (
    <div id="setup-header">
      <div id="setup-header-wrapper">
        <div id="setup-header-background">
        </div>
        <Card id="setup-header-body">
          <div className="d-flex justify-content-around">
            {setupSteps.map((step, i) => {
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
          <div id="setup-header-buttons" className={
            classNames("align-items-center justify-content-between", {
              "d-flex": props.hideBtnBanner !== true,
              "d-none": props.hideBtnBanner === true,
            })}>

            {!props.hideBtnBanner
              ? <Button disabled={props.canProceed === false}
                className={classNames("b btn-lg ml-auto d-flex justify-content-center")}
                title={props.canProceed ? nextBtnText : "Complete this page to proceed"}
                onClick={async () => {
                  if (props.canProceed === false) {
                    return;
                  }

                  let nextPage: string;
                  if (props.pageIndex === setupSteps.length - 1) {
                    nextPage = finishPage;
                  }
                  else {
                    nextPage = setupSteps[props.pageIndex + 1].path;
                  }

                  history.push(nextPage);
                }}
              >
                <a>
                  <div className="d-flex align-items-center">
                    <BtnBody icon="arrow-right" iconPosition="right" text={nextBtnText}/>
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
