/*
interface FormButtonProps {
  bold?: boolean,
  checked: boolean,
  className?: string,
  disabled?: boolean,
  type: "checkbox" | "radio",
  title?: string,
  onChange: (checked: boolean) => void,
  children: React.ReactNode,
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>,
}

export default function FormInputCheck(props: FormButtonProps): JSX.Element {

  const bold = props.bold !== false;

  return (
    <label
      className={classNames("d-flex align-items-center clickable py-1", props.className, { b: bold, disabled: props.disabled })}
      title={props.title}
    >
      <input
        type={props.type}
        checked={props.checked}
        onChange={(e) => props.onChange(e.currentTarget.checked)}
        disabled={props.disabled}
        className={classNames("clickable")}
        {...(props.inputProps ?? {})}
      />
      <div>
        {props.children}
      </div>
    </label>
  );
}
*/
export {};
