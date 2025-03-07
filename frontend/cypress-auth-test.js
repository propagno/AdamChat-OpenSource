// cypress-auth-test.js
// Script para testar o fluxo de autenticação completo na aplicação AdamChat

describe('Teste de Autenticação', () => {
  // Dados do usuário de teste
  const testUser = {
    name: 'Usuário Teste',
    email: `teste${Date.now()}@example.com`, // Garante email único
    password: 'Senha@123',
  };

  beforeEach(() => {
    // Limpar localStorage antes de cada teste para garantir um estado limpo
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('Deve seguir o fluxo completo de autenticação', () => {
    // 1. Acessar localhost:3000
    cy.visit('http://localhost:3000');
    cy.url().should('include', '/login'); // Verifica se foi redirecionado para login

    // 2. Criar usuário
    cy.contains('Criar conta').click();
    cy.url().should('include', '/register');
    
    // Preencher formulário de registro
    cy.get('input[name="name"]').type(testUser.name);
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('input[name="confirmPassword"]').type(testUser.password);
    
    // Enviar formulário
    cy.get('button[type="submit"]').click();
    
    // Verificar se o cadastro foi bem-sucedido e permanece na página de registro
    cy.contains('Conta criada com sucesso').should('exist');
    
    // Clicar para ir para o login após cadastro bem-sucedido
    cy.contains('Ir para o Login').click();
    cy.url().should('include', '/login');

    // 3. Fazer login com o usuário criado
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();
    
    // Verificar redirecionamento para o dashboard após login
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    // 4. Verificar se existe token e sessão no login
    cy.window().then((window) => {
      // Verificar se os tokens estão no localStorage
      expect(window.localStorage.getItem('access_token')).to.not.be.null;
      expect(window.localStorage.getItem('refresh_token')).to.not.be.null;
      expect(window.localStorage.getItem('user_info')).to.not.be.null;
    });

    // Verificar se está autenticado verificando elementos do dashboard
    cy.contains('Dashboard').should('exist');
    
    // 5. Verificar que só pode acessar o dashboard autenticado
    // Logout para testar acesso não autenticado
    cy.contains('Sair').click();
    
    // Verificar redirecionamento para login após logout
    cy.url().should('include', '/login');
    
    // Tentar acessar dashboard diretamente sem estar autenticado
    cy.visit('http://localhost:3000/dashboard');
    
    // 6. Verificar redirecionamento para login quando não autenticado
    cy.url().should('include', '/login');
    cy.contains('Login').should('exist');
  });
}); 