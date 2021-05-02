import React from "react";
import classNames from "classnames";

interface FormButtonProps {
  checked: boolean,
  disabled?: boolean,
  type: "checkbox" | "radio",
  onChange: (checked: boolean) => void,
  children: React.ReactNode,
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>,
}

export default function FormInputCheck(props: FormButtonProps): JSX.Element {

  return (
    <label className={classNames("d-flex align-items-center clickable py-1 b", { disabled: props.disabled })}>
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
