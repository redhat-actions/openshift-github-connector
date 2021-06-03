import {
  CheckCircleIcon, CogIcon, EditIcon, ExclamationTriangleIcon,
  GithubIcon, InfoCircleIcon, SyncAltIcon, TimesCircleIcon,
  TimesIcon,
} from "@patternfly/react-icons";
import { SVGIconProps } from "@patternfly/react-icons/dist/js/createIcon";

export const CommonIcons = {
  Reload: SyncAltIcon,
  Delete: TimesIcon,

  Success: CheckCircleIcon,
  Info: InfoCircleIcon,
  Warning: ExclamationTriangleIcon,
  Error: TimesCircleIcon,

  Configure: CogIcon,
  Edit: EditIcon,

  GitHub: GithubIcon,
};

export type IconElement = React.ElementType<SVGIconProps>;
