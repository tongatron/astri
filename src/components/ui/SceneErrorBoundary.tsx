import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  label: string;
  onReset?: () => void;
  children: ReactNode;
};

type State = { error: Error | null };

export default class SceneErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[SceneErrorBoundary:${this.props.label}]`, error, info);
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <div className="max-w-md space-y-3">
          <h2 className="text-lg font-medium text-slate-100">
            Impossibile caricare {this.props.label}
          </h2>
          <p className="text-sm text-night-300">
            La vista 3D non è disponibile. Possibili cause: WebGL disattivato,
            GPU non supportata, o un errore di rendering.
          </p>
          <p className="font-mono text-xs text-night-400">
            {this.state.error.message}
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="rounded-lg border border-night-700 bg-night-900/60 px-3 py-1.5 text-sm text-slate-100 hover:border-night-600"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }
}
