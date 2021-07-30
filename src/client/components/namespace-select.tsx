import {
  Select, SelectVariant, SelectOption, SelectProps,
} from "@patternfly/react-core";
import { useState } from "react";

import ApiResponses from "../../common/api-responses";

const selectPlaceholder = "Select a namespace, or start typing to filter";

interface NamespaceSelectProps extends Partial<SelectProps> {
  namespacesRes: ApiResponses.UserNamespaces,
  namespace: string | undefined,
  setNamespace: (newNamespace: string | undefined) => void,
}

export default function NamespaceSelect(props: NamespaceSelectProps): JSX.Element {

  const [ isOpen, setIsOpen ] = useState(false);

  if (props.namespacesRes.namespaces.length === 0) {
    return (
      <p className="error">
        You do not have access to any namespaces!
      </p>
    );
  }

  return (
    <Select
      variant={SelectVariant.typeahead}
      typeAheadAriaLabel={selectPlaceholder}
      isCreatable={false}
      onToggle={(isExpanded) => setIsOpen(isExpanded)}
      isOpen={isOpen}
      placeholderText={selectPlaceholder}
      selections={props.namespace}
      onSelect={(_event, selection, isPlaceholder) => {
        setIsOpen(false);
        if (isPlaceholder) {
          props.setNamespace(undefined);
          return;
        }
        props.setNamespace(selection.toString());
      }}
      {...props}
    >
      {
        props.namespacesRes.namespaces.map((ns, i) => (
          <SelectOption key={i} value={ns} />
        ))
      }
    </Select>
  );
}
