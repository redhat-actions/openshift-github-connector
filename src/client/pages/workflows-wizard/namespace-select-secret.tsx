import { Checkbox, FormGroup } from "@patternfly/react-core";
import { useState } from "react";
import NamespaceSelect from "../../components/namespace-select";

export function NamespaceSelectWithSecretOption({
  isOptional,
  namespace, setNamespace,
}: {
  isOptional?: boolean,
  namespace: string | undefined,
  setNamespace: (newNamespace: string | undefined) => void,
}): JSX.Element {

  const nsSecretName = "OPENSHIFT_NAMESPACE";

  const [ isUsingSecret, setIsUsingSecret ] = useState(false);

  return (
    <FormGroup fieldId="namespace" label={"OpenShift Namespace" + (isOptional ? " (Optional)" : "")}>
      <Checkbox
        className="py-2"
        id="use-namespace-secret"
        label={<>Use value of <code>{nsSecretName}</code> secret as namespace</>}
        isChecked={isUsingSecret}
        onChange={(checked) => {
          if (checked) {
            setIsUsingSecret(true);
            setNamespace(`\${{ secrets.${nsSecretName} }}`);
          }
          else {
            setIsUsingSecret(false);
            setNamespace(undefined);
          }
        }}
      />
      <NamespaceSelect
        selectProps={{
          isDisabled: isUsingSecret,
        }}
        namespace={isUsingSecret ? `${nsSecretName} secret ` : namespace}
        setNamespace={setNamespace}
      />
    </FormGroup>
  );
}
