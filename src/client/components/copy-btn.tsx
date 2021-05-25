import React from "react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { Button } from "@patternfly/react-core";;
import BtnBody from "./fa-btn-body";

interface CopyBtnProps extends React.HTMLAttributes<HTMLButtonElement> {
  copyLabel?: string,
  textToCopy: string,
}

interface CopyBtnState {
  copyState: "success" | "failed" | undefined,
}

export default class CopyToClipboardBtn extends React.Component<CopyBtnProps, CopyBtnState> {

  constructor(props: CopyBtnProps) {
    super(props);

    this.state = {
      copyState: undefined,
    };
  }

  render() {
    let text: string;
    let icon: IconProp;
    if (this.state.copyState === "success") {
      text = "Copied";
      icon = "check";
    }
    else if (this.state.copyState === "failed") {
      icon = "cross";
      text = "Copy Failed";
    }
    else {
      icon = "copy";
      text = this.props.copyLabel ?? "Copy";
    }

    // note scss default width
    const childBtnProps: Partial<CopyBtnProps> = { ...this.props };
    delete childBtnProps.textToCopy;
    delete childBtnProps.copyLabel;

    const renderText = this.props.copyLabel !== "";

    return (
      <Button
        title="Copy"
        className="copy-btn"
        {...childBtnProps}
        onClick={() => this.onCopy()}>
        <BtnBody icon={icon} text={renderText ? text : undefined} />
      </Button>
    );
  }

  private async onCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.props.textToCopy);
      this.setState({ copyState: "success" });
    }
    catch (err) {
      this.setState({ copyState: "failed" });
    }

    setTimeout(() => {
      this.setState({ copyState: undefined });
    }, 750);
  }

}
