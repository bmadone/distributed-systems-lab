import { Component, type ErrorInfo, type ReactNode } from 'react';

// React only supports error boundaries as classes: the one deliberate exception to the functional style.
interface Props { readonly label: string; readonly children: ReactNode }
interface State { readonly failed: boolean; readonly attempt: number }

/** A crashing lab shows a message and a retry button instead of blanking the whole course. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false, attempt: 0 };
  static getDerivedStateFromError(): Partial<State> { return { failed: true }; }
  override componentDidCatch(error: Error, info: ErrorInfo): void { console.error(`Lab failed in "${this.props.label}"`, error, info.componentStack); }
  override render(): ReactNode {
    if (this.state.failed) {
      return (
        <div className="verdict bad" role="alert">
          <b>Something went wrong in this part of the lesson.</b>
          <span>Your progress is safe. <button type="button" className="linkbtn" onClick={() => this.setState(s => ({ failed: false, attempt: s.attempt + 1 }))}>Try again</button></span>
        </div>
      );
    }
    return <div key={this.state.attempt} style={{ display: 'contents' }}>{this.props.children}</div>;
  }
}
