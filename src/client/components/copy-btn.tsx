import React from "react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { Button } from "react-bootstrap";
import FaBtnBody from "./fa-btn-body";

interface CopyBtnProps extends React.HTMLAttributes<HTMLButtonElement> {
  textToCopy: string;
}

interface CopyBtnState {
  copyState: "success" | "failed" | undefined;
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
      text = "Copy";
    }

    return (
      <Button
        style={{ minWidth: "12ch" }}
        {...this.props}
        onClick={() => this.onCopy()}>
        <FaBtnBody icon={icon} text={text} />
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
