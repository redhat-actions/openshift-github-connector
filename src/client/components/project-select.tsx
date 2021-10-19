import {
  Select, SelectVariant, SelectOption, SelectProps, Spinner,
} from "@patternfly/react-core";
import { useContext, useEffect, useState } from "react";
import ApiEndpoints from "../../common/api-endpoints";

import ApiResponses from "../../common/api-responses";
import { ConnectorUserContext } from "../contexts";
import { fetchJSON } from "../util/client-util";
import MyBanner from "./banner";
import CopyToClipboardBtn from "./copy-btn";

export const PROJECT_SELECT_ID = "project-select";

interface ProjectSelectProps {
  projectsRes?: ApiResponses.UserProjects,
  project: string | undefined,
  setProject: (newProject: string | undefined) => void,
  selectProps?: Partial<SelectProps>,
  isOptional?: boolean,
}

export default function ProjectSelect(props: ProjectSelectProps): JSX.Element {

  const { user } = useContext(ConnectorUserContext);

  const [ isOpen, setIsOpen ] = useState(false);

  const [ projectList, setProjectList ] = useState<ApiResponses.UserProjects | undefined>(props.projectsRes);
  const [ error, setError ] = useState<string>();

  useEffect(() => {
    if (projectList == null) {
      (async () => {
        const projectsRes = await fetchJSON<never, ApiResponses.UserProjects>("GET", ApiEndpoints.Cluster.Projects.Root);
        setProjectList(projectsRes);
      })()
        .catch((err) => {
          setError(err.toString());
        });
    }
  }, [ props.projectsRes, projectList, setProjectList ]);

  if (error) {
    return (
      <p className="error">
        Failed to load projects: {error}
      </p>
    );
  }
  else if (!projectList) {
    return (
      <Spinner size="sm" />
    );
  }

  const createProjectCmd = `oc adm new-project --admin=${user.name} <project-name>`;

  if (projectList.projects.length === 0) {
    return (
      <MyBanner severity="warning" title={"You do not have access to any projects."}>
        <>
          <div className="my-1">
            Have a cluster administrator create a project for you. Then, click <b>Reload</b>.
          </div>
          <div className="d-flex align-items-center">
            <code>{createProjectCmd}</code>
            <div className="mx-4"><CopyToClipboardBtn textToCopy={createProjectCmd} /></div>
          </div>
        </>
      </MyBanner>
    );
  }

  let label = "Select a Project";
  if (props.isOptional) {
    label = "(Optional) " + label;
  }

  const selectPlaceholder = "Select a project, or start typing to filter";

  const items = projectList.projects.map((ns, i) => (
    <SelectOption key={i} value={ns} />
  ));

  items.unshift(<SelectOption value={undefined} key={-1} label={selectPlaceholder} />);

  return (
    <div id={PROJECT_SELECT_ID}>
      <Select
        className="my-1"
        label={label}
        variant={SelectVariant.typeahead}
        typeAheadAriaLabel={selectPlaceholder}
        isCreatable={false}
        onToggle={(isExpanded) => setIsOpen(isExpanded)}
        isOpen={isOpen}
        placeholderText={selectPlaceholder}
        selections={props.project}
        onSelect={(_event, selection, isPlaceholder) => {
          setIsOpen(false);
          if (isPlaceholder) {
            props.setProject(undefined);
            return;
          }
          props.setProject(selection.toString());
        }}
        {...props.selectProps}
      >
        {items}
      </Select>
    </div>
  );
}
