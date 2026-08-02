import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', color: '#333', backgroundColor: '#fdd' }}>
          <h1 style={{ color: 'red', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>Oops! Algo salió mal.</h1>
          <p>La aplicación encontró un error y no pudo continuar.</p>
          <p>Por favor, intenta recargar la página. Si el problema persiste, revisa la consola del desarrollador (F12) para más detalles.</p>
          {this.state.error && (
            <details style={{ marginTop: '20px', whiteSpace: 'pre-wrap', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Detalles del Error (para desarrolladores)</summary>
              <p><strong>Error:</strong> {this.state.error.toString()}</p>
              {this.state.errorInfo && <p><strong>Stack Trace:</strong> {this.state.errorInfo.componentStack}</p>}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
