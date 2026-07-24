import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900/20 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-900/90 backdrop-blur-xl border-2 border-red-500/40 rounded-2xl p-8 text-center shadow-2xl">
            <div className="mb-6">
              <div className="relative inline-block mb-4">
                <AlertTriangle className="w-20 h-20 text-red-400 mx-auto animate-pulse" />
                <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">
                Ops! Algo deu errado
              </h1>
              <p className="text-gray-300 text-sm mb-2">
                Encontramos um erro inesperado. Não se preocupe, seus dados estão seguros.
              </p>
              <p className="text-gray-400 text-xs">
                Tente recarregar a página ou voltar ao início.
              </p>
            </div>

            <div className="mb-6 p-4 bg-black/40 border border-red-500/20 rounded-lg">
              <p className="text-xs text-gray-400 font-mono">
                Código: {this.state.error?.name || 'ERR_UNKNOWN'}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={this.handleReset}
                className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 h-12 shadow-lg"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Recarregar Página
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full border-gray-600 hover:bg-gray-800 h-12"
              >
                <Home className="w-5 h-5 mr-2" />
                Voltar ao Início
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-6">
              Se o problema persistir, entre em contato com o suporte.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;