import LinkButton, { LinkButtonProps } from "./link-btn";

export default function appPageCard(props: {
    header: string,
    buttons: LinkButtonProps[],
    children: React.ReactNode,
}): JSX.Element {
  return (
    <div className="text-black card mb-4 p-3">
      <div className="d-flex card-title row justify-content-between">
        <div className="col">
          <h4 className="font-weight-bold mb-1">
            {props.header}
          </h4>
        </div>
        <div className="col-3 d-flex">
          {
            props.buttons.map((btnProps) => <LinkButton style={{ flexGrow: 1 }} {...btnProps}></LinkButton>)
          }
        </div>
      </div>
      <div className="card-body">
        {props.children}
      </div>
    </div>
  );
}
