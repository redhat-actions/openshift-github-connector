import { Component } from "react";
import { Severity } from "../../common/common-util";
import { PushAlertContext } from "../contexts";

// interface ErrBoundaryState {
//  err: string | undefined,
// }

export default class NotificationErrorBoundary extends Component<{ children: React.ReactNode, severity: Severity }, never> {

  static override contextType = PushAlertContext;
  override context!: React.ContextType<typeof PushAlertContext>;

  // static getDerivedStateFromError(error) {
  // }

  override componentDidCatch(error: Error /* errorInfo */) {
    console.log(`error boundary did catch ${error.message}`);
    this.context({ severity: this.props.severity, title: error.message });
  }

  override render() {
    return this.props.children;
  }
}
