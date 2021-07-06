import CopyToClipboardBtn from "./copy-btn";

export default function InlineCode({ code, showCopyBtn }: { code: string, showCopyBtn: boolean }): JSX.Element {

  return (
    <>
      <code>
        {code}
      </code>
      {
        showCopyBtn
          ? <CopyToClipboardBtn style={{ width: "1em" }} className="ms-2" textToCopy={code} copyLabel=""/>
          : ""
      }
    </>
  );
}
