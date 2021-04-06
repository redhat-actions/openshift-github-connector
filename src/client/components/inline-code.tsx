import React from "react";
import CopyToClipboardBtn from "./copy-btn";

export default function InlineCode({ code }: { code: string }): JSX.Element {

  return (
    <React.Fragment>
      <code>
        {code}
      </code>
      <CopyToClipboardBtn style={{ width: "1em" }} className="ml-2" textToCopy={code} copyLabel=""/>
    </React.Fragment>
  );
}
