import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Card, 
  Button, 
  Alert, 
  Badge, 
  ListGroup, 
  Form,
  Row,
  Col,
  Spinner
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth-service';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Cores para status
const STATUS_COLORS = {
  online: 'success',
  offline: 'danger',
  error: 'warning',
  active: 'primary',
  unknown: 'secondary'
};

const SystemStatus = () => {
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState({
    keycloak: { status: 'unknown' },
    backend: { status: 'unknown' },
    emergency_mode: false
  });
  const [emergencyToken, setEmergencyToken] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', message: '' });
  const [showToken, setShowToken] = useState(false);
  
  const navigate = useNavigate();
  
  // Verificar se o usuário é admin
  const isAdmin = authService.isAdmin();
  
  // Carregar status inicial
  useEffect(() => {
    fetchSystemStatus();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchSystemStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Buscar status do sistema
  const fetchSystemStatus = async () => {
    setLoading(true);
    try {
      // Status da autenticação
      const authStatus = await authService.checkAuthStatus();
      
      // Status do backend
      let backendStatus = { status: 'unknown' };
      try {
        const healthResponse = await axios.get(`${API_URL}/health`);
        backendStatus = {
          status: 'online',
          message: healthResponse.data.message,
          version: healthResponse.data.version
        };
      } catch (error) {
        backendStatus = {
          status: 'offline',
          message: 'Não foi possível conectar ao backend'
        };
      }
      
      setSystemStatus({
        keycloak: authStatus.keycloak || { status: 'unknown' },
        backend: backendStatus,
        emergency_mode: authStatus.emergency_mode || false
      });
    } catch (error) {
      console.error('Erro ao buscar status do sistema:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Alternar modo de emergência
  const handleToggleEmergency = async () => {
    try {
      setActionMessage({ type: '', message: '' });
      const response = await authService.toggleEmergencyMode(emergencyToken || undefined);
      
      if (response.status === 'ok') {
        setActionMessage({ 
          type: 'success', 
          message: `Modo de emergência ${response.emergency_mode ? 'ativado' : 'desativado'} com sucesso!` 
        });
        
        // Atualizar status
        fetchSystemStatus();
      } else {
        setActionMessage({ 
          type: 'danger', 
          message: response.message || 'Erro ao alternar modo de emergência' 
        });
      }
    } catch (error) {
      setActionMessage({ 
        type: 'danger', 
        message: 'Erro ao alternar modo de emergência: ' + (error.message || 'Erro desconhecido') 
      });
    }
  };
  
  return (
    <Container className="my-4">
      <h1 className="mb-4">Status do Sistema</h1>
      
      {actionMessage.type && (
        <Alert variant={actionMessage.type} dismissible onClose={() => setActionMessage({ type: '', message: '' })}>
          {actionMessage.message}
        </Alert>
      )}
      
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="m-0">Visão Geral</h3>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={fetchSystemStatus}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span className="ms-2">Atualizando...</span>
                    </>
                  ) : (
                    'Atualizar Status'
                  )}
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <ListGroup>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Sistema de Autenticação</strong>
                    <p className="mb-0 text-muted small">{systemStatus.keycloak.url || 'URL não disponível'}</p>
                  </div>
                  <Badge bg={STATUS_COLORS[systemStatus.keycloak.status] || 'secondary'} pill>
                    {systemStatus.keycloak.status === 'online' ? 'Online' : 
                     systemStatus.keycloak.status === 'offline' ? 'Offline' : 
                     systemStatus.keycloak.status === 'error' ? 'Erro' : 'Desconhecido'}
                  </Badge>
                </ListGroup.Item>
                
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Backend API</strong>
                    <p className="mb-0 text-muted small">{systemStatus.backend.message || 'Informação não disponível'}</p>
                  </div>
                  <Badge bg={STATUS_COLORS[systemStatus.backend.status] || 'secondary'} pill>
                    {systemStatus.backend.status === 'online' ? 'Online' : 
                     systemStatus.backend.status === 'offline' ? 'Offline' : 
                     systemStatus.backend.status === 'error' ? 'Erro' : 'Desconhecido'}
                  </Badge>
                </ListGroup.Item>
                
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Modo de Emergência</strong>
                    <p className="mb-0 text-muted small">
                      {systemStatus.emergency_mode 
                        ? 'O sistema está operando com autenticação limitada' 
                        : 'Autenticação normal'}
                    </p>
                  </div>
                  <Badge bg={systemStatus.emergency_mode ? 'danger' : 'success'} pill>
                    {systemStatus.emergency_mode ? 'Ativo' : 'Inativo'}
                  </Badge>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
          
          {/* Somente administradores podem ver/modificar as configurações */}
          {isAdmin && (
            <Card className="mb-4">
              <Card.Header>
                <h3 className="m-0">Controles de Administração</h3>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Token de Emergência (Opcional)</Form.Label>
                    <div className="input-group">
                      <Form.Control 
                        type={showToken ? 'text' : 'password'} 
                        value={emergencyToken}
                        onChange={(e) => setEmergencyToken(e.target.value)}
                        placeholder="Token para ativar/desativar modo de emergência"
                      />
                      <Button 
                        variant="outline-secondary"
                        onClick={() => setShowToken(!showToken)}
                      >
                        {showToken ? 'Ocultar' : 'Mostrar'}
                      </Button>
                    </div>
                    <Form.Text className="text-muted">
                      Se configurado no servidor, é necessário fornecer o token para alternar o modo de emergência.
                    </Form.Text>
                  </Form.Group>
                  
                  <div className="d-grid gap-2">
                    <Button 
                      variant={systemStatus.emergency_mode ? 'outline-success' : 'outline-danger'}
                      onClick={handleToggleEmergency}
                    >
                      {systemStatus.emergency_mode ? 'Desativar Modo de Emergência' : 'Ativar Modo de Emergência'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}
        </Col>
        
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h3 className="m-0">Ações Rápidas</h3>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/profile')}
                >
                  Ver Perfil do Usuário
                </Button>
                
                <Button 
                  variant="outline-primary" 
                  onClick={() => navigate('/')}
                >
                  Voltar para o Dashboard
                </Button>
                
                <Button 
                  variant="outline-secondary" 
                  onClick={() => window.open('/emergency.html', '_blank')}
                >
                  Abrir Página de Emergência
                </Button>
              </div>
            </Card.Body>
          </Card>
          
          <Card className="mb-4">
            <Card.Header>
              <h3 className="m-0">Dicas</h3>
            </Card.Header>
            <Card.Body>
              <Alert variant="info">
                <Alert.Heading>Problemas com Autenticação?</Alert.Heading>
                <p>
                  Se o sistema de autenticação estiver offline ou inacessível, o sistema entrará automaticamente no modo de emergência.
                </p>
                <hr />
                <p className="mb-0">
                  Para resolver problemas com a autenticação, verifique:
                </p>
                <ul className="mt-2">
                  <li>Se o serviço backend está em execução</li>
                  <li>Conectividade de rede</li>
                  <li>Configurações de autenticação</li>
                </ul>
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SystemStatus; 