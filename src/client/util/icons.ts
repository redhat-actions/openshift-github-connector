import {
  BookOpenIcon,
  CheckCircleIcon, CogIcon, EditIcon, ExclamationTriangleIcon,
  GithubIcon, InfoCircleIcon, PlusIcon, QuestionCircleIcon, SyncAltIcon, TimesCircleIcon,
  TrashAltIcon,
} from "@patternfly/react-icons";
import { SVGIconProps } from "@patternfly/react-icons/dist/js/createIcon";

export const CommonIcons = {
  Add: PlusIcon,
  Reload: SyncAltIcon,
  Delete: TrashAltIcon,
  Documentation: BookOpenIcon,

  Success: CheckCircleIcon,
  Info: InfoCircleIcon,
  Warning: ExclamationTriangleIcon,
  Error: TimesCircleIcon,

  Configure: CogIcon,
  Edit: EditIcon,
  Help: QuestionCircleIcon,

  GitHub: GithubIcon,
};

export type IconElement = React.ElementType<SVGIconProps>;
