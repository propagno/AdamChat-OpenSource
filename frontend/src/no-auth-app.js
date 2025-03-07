import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Chat from './pages/Chat';

// Versão de emergência da aplicação sem autenticação
function NoAuthApp() {
  return (
    <Router>
      <div className="App">
        <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
            <Navbar.Brand>
              <img
                src="/favicon.ico"
                width="30"
                height="30"
                className="d-inline-block align-top"
                alt="logo"
              />
              {' AdamChat '}
              <Badge bg="danger">Modo de Emergência</Badge>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/">Chat</Nav.Link>
              </Nav>
              <Nav>
                <div className="d-flex align-items-center">
                  <Button 
                    variant="outline-warning" 
                    size="sm" 
                    className="me-2"
                    onClick={() => window.location.href = "/bypass.html"}
                  >
                    Página de Emergência
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => window.location.href = "/"}
                  >
                    Tentar Modo Normal
                  </Button>
                </div>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Routes>
          <Route path="/" element={<EmergencyChat />} />
        </Routes>

        <footer className="app-footer">
          <div className="container">
            <div className="text-center">
              <p className="text-danger">
                <strong>MODO DE EMERGÊNCIA</strong> - Versão sem autenticação para recuperação
              </p>
              <p className="text-muted">
                AdamChat © {new Date().getFullYear()} - Versão de Emergência
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

// Componente de chat de emergência simplificado
function EmergencyChat() {
  const [messages, setMessages] = React.useState([
    { role: 'system', content: 'Modo de emergência ativado. Funcionalidade limitada disponível.' }
  ]);
  const [inputValue, setInputValue] = React.useState('');
  const [backendStatus, setBackendStatus] = React.useState("verificando");
  
  // Verificar estado do backend quando o componente carrega
  React.useEffect(() => {
    fetch('http://127.0.0.1:5000/api/health')
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Backend indisponível');
      })
      .then(data => {
        setBackendStatus("disponível");
        setMessages(prev => [...prev, { 
          role: 'system', 
          content: `Backend conectado com sucesso. ${data.message}` 
        }]);
      })
      .catch(error => {
        setBackendStatus("indisponível");
        setMessages(prev => [...prev, { 
          role: 'system', 
          content: 'Não foi possível conectar ao backend. Operando em modo offline.' 
        }]);
      });
  }, []);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // Adicionar mensagem do usuário
    const userMessage = { role: 'user', content: inputValue };
    setMessages([...messages, userMessage]);
    setInputValue('');
    
    if (backendStatus === "disponível") {
      // Tentar enviar para o backend em modo simplificado
      fetch('http://127.0.0.1:5000/api/health')
        .then(response => response.json())
        .then(data => {
          const botResponse = { 
            role: 'assistant', 
            content: `Resposta do backend (modo emergência): ${data.message}. Este é um modo simplificado com funcionalidade limitada.` 
          };
          setMessages(prev => [...prev, botResponse]);
        })
        .catch(error => {
          // Fallback para resposta simulada
          const botResponse = { 
            role: 'assistant', 
            content: 'Não foi possível obter resposta do backend. Operando em modo offline.' 
          };
          setMessages(prev => [...prev, botResponse]);
        });
    } else {
      // Resposta simulada quando o backend está indisponível
      setTimeout(() => {
        const botResponse = { 
          role: 'assistant', 
          content: 'Estou operando em modo de emergência com funcionalidade limitada. ' +
                  'O backend está indisponível no momento.' 
        };
        setMessages(prev => [...prev, botResponse]);
      }, 1000);
    }
  };
  
  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="alert alert-warning mb-4">
            <h4 className="alert-heading">Modo de Emergência!</h4>
            <p>Esta é uma versão sem autenticação do AdamChat com funcionalidade limitada.</p>
            <hr />
            <p className="mb-0">
              Acesse a <a href="/bypass.html">página de emergência</a> para resolver problemas de autenticação.
            </p>
          </div>
        </div>
      </div>
      
      <div className="chat-container">
        <div className="message-list">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-content">{msg.content}</div>
            </div>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="input-area">
          <div className="input-container">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite sua mensagem (funcionalidade limitada)"
              className="message-input"
            />
            <button type="submit" className="send-button">
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NoAuthApp; 