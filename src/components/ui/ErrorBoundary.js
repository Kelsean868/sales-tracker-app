import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
              <h2 className="text-xl font-bold text-white">Something went wrong</h2>
            </div>
            
            <p className="text-gray-300 mb-4">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-amber-500 text-white p-3 rounded-md hover:bg-amber-600 transition-colors"
            >
              Refresh Page
            </button>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-sm">
                <summary className="text-red-400 cursor-pointer">Error Details</summary>
                <pre className="text-gray-400 mt-2 overflow-auto text-xs">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
