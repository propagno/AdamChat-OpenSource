// puppeteer-auth-test.js
// Script para testar o fluxo de autenticação completo na aplicação AdamChat usando Puppeteer

const puppeteer = require('puppeteer');

(async () => {
  // Inicializa o navegador
  const browser = await puppeteer.launch({
    headless: false, // Define como false para visualizar o navegador durante o teste
    slowMo: 100, // Desacelera o teste para visualização
    defaultViewport: null,
    args: ['--start-maximized'] // Inicia com navegador maximizado
  });

  // Cria uma nova página
  const page = await browser.newPage();
  
  // Dados do usuário de teste
  const testUser = {
    name: 'Usuário Teste',
    email: `teste${Date.now()}@example.com`, // Garante email único
    password: 'Senha@123',
  };

  try {
    console.log('1. Iniciando teste: Acesso à aplicação em localhost:3000');
    
    // Acessa a página inicial
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2',
    });
    
    // Verifica se foi redirecionado para a página de login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('✓ Redirecionado para página de login com sucesso');
    } else {
      throw new Error(`Não foi redirecionado para login. URL atual: ${currentUrl}`);
    }

    console.log('2. Iniciando teste: Criação de usuário');
    
    // Clica no link para criar conta
    await page.waitForSelector('a:contains("Criar conta")');
    await page.click('a:contains("Criar conta")');
    
    // Espera a página de registro carregar
    await page.waitForNavigation();
    
    // Verifica se está na página de registro
    const registerUrl = page.url();
    if (registerUrl.includes('/register')) {
      console.log('✓ Navegou para a página de registro com sucesso');
    } else {
      throw new Error(`Não foi para a página de registro. URL atual: ${registerUrl}`);
    }
    
    // Preenche o formulário de registro
    await page.waitForSelector('input[name="name"]');
    await page.type('input[name="name"]', testUser.name);
    await page.type('input[name="email"]', testUser.email);
    await page.type('input[name="password"]', testUser.password);
    await page.type('input[name="confirmPassword"]', testUser.password);
    
    // Envia o formulário
    await page.click('button[type="submit"]');
    
    // Aguarda a mensagem de sucesso
    await page.waitForSelector('div:contains("Conta criada com sucesso")');
    console.log('✓ Usuário criado com sucesso');
    
    // Clica no botão para ir para o login
    await page.click('button:contains("Ir para o Login")');
    
    // Espera o redirecionamento para a página de login
    await page.waitForNavigation({ timeout: 10000 });
    
    // Verifica se foi redirecionado para login
    const postRegisterUrl = page.url();
    if (postRegisterUrl.includes('/login')) {
      console.log('✓ Redirecionado para login após registro');
    } else {
      throw new Error(`Erro no redirecionamento após registro. URL atual: ${postRegisterUrl}`);
    }

    console.log('3. Iniciando teste: Login com usuário criado');
    
    // Preenche o formulário de login
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', testUser.email);
    await page.type('input[name="password"]', testUser.password);
    
    // Clica no botão de login
    await page.click('button[type="submit"]');
    
    // Espera o redirecionamento para o dashboard
    await page.waitForNavigation({ timeout: 10000 });
    
    // Verifica se está na página do dashboard
    const dashboardUrl = page.url();
    if (dashboardUrl.includes('/dashboard')) {
      console.log('✓ Login realizado com sucesso e redirecionado para o dashboard');
    } else {
      throw new Error(`Erro no login. URL atual: ${dashboardUrl}`);
    }

    console.log('4. Verificando existência de token e sessão');
    
    // Verifica se os tokens estão no localStorage
    const authToken = await page.evaluate(() => localStorage.getItem('access_token'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refresh_token'));
    const userInfo = await page.evaluate(() => localStorage.getItem('user_info'));
    
    if (authToken && refreshToken && userInfo) {
      console.log('✓ Tokens e informações do usuário armazenados corretamente');
    } else {
      throw new Error('Tokens ou informações do usuário não encontrados');
    }

    console.log('5. Testando acesso ao dashboard autenticado');
    
    // Verifica se elementos do dashboard estão presentes
    await page.waitForSelector('h1:contains("Dashboard")');
    console.log('✓ Dashboard carregado corretamente quando autenticado');
    
    // Fazer logout
    await page.click('button:contains("Sair")');
    
    // Espera o redirecionamento para a página de login
    await page.waitForNavigation();
    
    // Verifica se foi redirecionado para login após logout
    const logoutUrl = page.url();
    if (logoutUrl.includes('/login')) {
      console.log('✓ Logout realizado com sucesso e redirecionado para login');
    } else {
      throw new Error(`Erro no logout. URL atual: ${logoutUrl}`);
    }

    console.log('6. Verificando redirecionamento quando não autenticado');
    
    // Tenta acessar o dashboard diretamente
    await page.goto('http://localhost:3000/dashboard', {
      waitUntil: 'networkidle2',
    });
    
    // Verifica se foi redirecionado para a página de login
    const redirectUrl = page.url();
    if (redirectUrl.includes('/login')) {
      console.log('✓ Redirecionado corretamente para login quando não autenticado');
    } else {
      throw new Error(`Não foi redirecionado para login. URL atual: ${redirectUrl}`);
    }

    console.log('✅ Todos os testes foram concluídos com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    // Fecha o navegador
    await browser.close();
  }
})(); 