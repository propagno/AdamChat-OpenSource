import React, { Component } from 'react';
import './styles.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  componentDidCatch(error, errorInfo) {
    // Captura erros nos componentes filhos
    this.setState({
      hasError: true,
      error: error,
      errorInfo: errorInfo
    });
    
    // Registra o erro em um serviço de log
    console.error('Error Boundary capturou um erro:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Algo deu errado</h1>
          <p>Ocorreu um erro na aplicação que impediu sua execução normal.</p>
          <div className="error-details">
            <p>{this.state.error && this.state.error.toString()}</p>
            <details>
              <summary>Detalhes do erro</summary>
              <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
            </details>
          </div>
          <button
            className="error-retry-button"
            onClick={() => window.location.reload()}
          >
            Recarregar Aplicação
          </button>
        </div>
      );
    }

    // Se não houver erro, renderiza os componentes filhos normalmente
    return this.props.children;
  }
}

export default ErrorBoundary; 