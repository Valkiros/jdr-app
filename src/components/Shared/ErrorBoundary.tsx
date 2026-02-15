import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <h2 className="text-xl font-bold mb-2">Une erreur est survenue</h2>
                    <p className="mb-4">L'application a rencontré un problème inattendu.</p>
                    <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40">
                        {this.state.error?.toString()}
                    </pre>
                    <button
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        Réessayer
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
