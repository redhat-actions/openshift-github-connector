import React from "react";
import { Button } from "@patternfly/react-core";
import { CheckIcon, CopyIcon, CrossIcon } from "@patternfly/react-icons";
import BtnBody from "./btn-body";
import { IconElement } from "../util/icons";

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

  override render() {
    let text: string;
    let icon: IconElement;
    if (this.state.copyState === "success") {
      text = "Copied";
      icon = CheckIcon;
    }
    else if (this.state.copyState === "failed") {
      icon = CrossIcon;
      text = "Copy Failed";
    }
    else {
      icon = CopyIcon;
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
