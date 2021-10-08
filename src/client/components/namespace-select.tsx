import {
  Select, SelectVariant, SelectOption, SelectProps, Spinner,
} from "@patternfly/react-core";
import { useEffect, useState } from "react";
import ApiEndpoints from "../../common/api-endpoints";

import ApiResponses from "../../common/api-responses";
import { fetchJSON } from "../util/client-util";
import MyBanner from "./banner";

export const NAMESPACE_SELECT_ID = "namespace-select";

interface NamespaceSelectProps {
  namespacesRes?: ApiResponses.UserNamespaces,
  namespace: string | undefined,
  setNamespace: (newNamespace: string | undefined) => void,
  selectProps?: Partial<SelectProps>,
  isOptional?: boolean,
}

export default function NamespaceSelect(props: NamespaceSelectProps): JSX.Element {

  const [ isOpen, setIsOpen ] = useState(false);

  const [ namespaceList, setNamespaceList ] = useState<ApiResponses.UserNamespaces | undefined>(props.namespacesRes);
  const [ error, setError ] = useState<string>();

  useEffect(() => {
    if (namespaceList == null) {
      (async () => {
        const namespacesRes = await fetchJSON<never, ApiResponses.UserNamespaces>("GET", ApiEndpoints.Cluster.Namespaces.Root);
        setNamespaceList(namespacesRes);
      })()
        .catch((err) => {
          setError(err.toString());
        });
    }
  }, [ props.namespacesRes, namespaceList, setNamespaceList ]);

  if (error) {
    return (
      <p className="error">
        Failed to load namespaces: {error}
      </p>
    );
  }
  else if (!namespaceList) {
    return (
      <Spinner size="sm" />
    );
  }

  if (namespaceList.namespaces.length === 0) {
    return (
      <MyBanner severity="warning" title={"You do not have access to any namespaces!"} />
    );
  }

  let label = "Select a Namespace";
  if (props.isOptional) {
    label = "(Optional) " + label;
  }

  const selectPlaceholder = "Select a namespace, or start typing to filter";

  const items = namespaceList.namespaces.map((ns, i) => (
    <SelectOption key={i} value={ns} />
  ));

  items.unshift(<SelectOption value={undefined} key={-1} label={selectPlaceholder} />);

  return (
    <div id={NAMESPACE_SELECT_ID}>
      <Select
        className="my-1"
        label={label}
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
        {...props.selectProps}
      >
        {items}
      </Select>
    </div>
  );
}
