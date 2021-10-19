import {
  FormGroup, FormGroupProps, TextInput, TextInputProps,
} from "@patternfly/react-core";
import { ExclamationCircleIcon } from "@patternfly/react-icons";
import classNames from "classnames";
import { useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { CommonIcons } from "../util/icons";

type ManagedTextInputProps = {
  placeholder?: string,
  value: string | null,
  onValueChange: (newValue: string | null) => void,
  validate?: (input: string) => string | undefined,
  invalidSeverity?: "warning" | "error",

  formGroupProps?: Omit<FormGroupProps, "fieldId">,
  textProps?: Omit<TextInputProps, "id" | "aria-describedby" | "placeholder" | "validated" | "value" | "onChange">,
};

export default function ManagedTextInput(props: ManagedTextInputProps) {

  const id = (useRef(uuid())).current;

  // the value shown in the text field - valid or invalid
  const [ value, setValue ] = useState<string>(props.value ?? "");
  const [ invalidMsg, setInvalidMsg ] = useState<string | undefined>();

  const validated = invalidMsg ? (props.invalidSeverity ?? "warning") : "default";
  const invalidIcon = props.invalidSeverity === "error" ? <ExclamationCircleIcon /> : <CommonIcons.Warning />;

  return (
    <FormGroup
      {...props.formGroupProps}
      className={classNames(props.formGroupProps?.className)}
      helperText={invalidMsg ?? props.formGroupProps?.helperText}
      // helperTextInvalid={invalidMsg}
      helperTextInvalidIcon={invalidIcon}
      fieldId={id}
      validated={validated}
    >
      <TextInput
        {...props.textProps}
        placeholder={props.placeholder}
        className={classNames("mb-2", props.textProps?.className)}
        id={id}
        aria-describedby={id + "-helper"}
        validated={validated}
        value={value}
        onChange={(newValue, _e) => {
          setValue(newValue);

          const newInvalidMsg = props.validate ? props.validate(newValue) : undefined;
          setInvalidMsg(newInvalidMsg);
          if (newInvalidMsg) {
            props.onValueChange(null);
          }
          else {
            props.onValueChange(newValue);
          }
        }}
      />
    </FormGroup>
  );
}
