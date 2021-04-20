import React from "react";
import CopyToClipboardBtn from "./copy-btn";

export default function InlineCode({ code, showCopyBtn }: { code: string, showCopyBtn: boolean }): JSX.Element {

  return (
    <React.Fragment>
      <code>
        {code}
      </code>
      {
        showCopyBtn
          ? <CopyToClipboardBtn style={{ width: "1em" }} className="ml-2" textToCopy={code} copyLabel=""/>
          : ""
      }
    </React.Fragment>
  );
}
