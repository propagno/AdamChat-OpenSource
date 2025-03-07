# AdamChat - Módulo de Criação de eBooks

Este módulo adiciona funcionalidades de criação, edição e exportação de eBooks ao AdamChat, permitindo a geração de conteúdo, integração com Canva para design e exportação em diversos formatos.

## Funcionalidades Principais

### 1. Gerenciamento de eBooks
- Criação de novos eBooks a partir de um tema
- Atualização de metadados (título, descrição, autor, etc.)
- Acompanhamento do status de criação
- Finalização e preparação para exportação

### 2. Geração de Conteúdo
- Geração de sugestões de títulos com base no tema
- Geração de estrutura de capítulos
- Geração de conteúdo detalhado para cada capítulo
- Geração de prompts para criação de imagens relacionadas

### 3. Geração de Imagens
- Criação de imagens para capítulos e capa
- Suporte a diferentes serviços de IA (OpenAI, Stability AI, etc.)
- Regeneração e ajustes de imagens

### 4. Integração com Canva
- Listagem de templates disponíveis
- Criação de designs no Canva com base no conteúdo do eBook
- Aplicação de templates aos designs
- Exportação de designs para uso no eBook

### 5. Exportação
- Suporte a múltiplos formatos (PDF, EPUB, DOCX, HTML)
- Acompanhamento do status de exportação
- Download dos arquivos exportados

## Arquitetura

O módulo de eBooks é composto por:

### Serviços
- `ebook_service.py`: Gerenciamento de eBooks
- `content_service.py`: Geração de conteúdo textual
- `image_service.py`: Geração e gerenciamento de imagens
- `canva_service.py`: Integração com a API do Canva
- `export_service.py`: Exportação de eBooks em diferentes formatos

### Rotas API
- `/ebook/*`: Gerenciamento de eBooks
- `/content/*`: Geração de conteúdo
- `/image/*`: Geração e gerenciamento de imagens
- `/canva/*`: Integração com Canva
- `/export/*`: Exportação de eBooks

## Fluxo de Criação de eBook

1. **Inicialização**:
   - Criar um novo eBook com um tema
   - Gerar sugestões de títulos
   - Selecionar um título

2. **Estruturação**:
   - Gerar sugestões de capítulos
   - Selecionar e organizar capítulos

3. **Geração de Conteúdo**:
   - Para cada capítulo, gerar conteúdo detalhado
   - Gerar prompts para imagens relacionadas

4. **Criação de Imagens**:
   - Gerar imagens para cada capítulo
   - Gerar imagem de capa

5. **Design com Canva**:
   - Criar um design no Canva
   - Aplicar template ao design
   - Personalizar o design

6. **Finalização e Exportação**:
   - Finalizar o eBook
   - Exportar para o formato desejado
   - Fazer download do arquivo final

## Exemplos de Uso da API

### Criar um novo eBook
```http
POST /ebook/create
Content-Type: application/json

{
  "tema": "Inteligência Artificial"
}
```

### Gerar títulos
```http
POST /content/titles
Content-Type: application/json

{
  "tema": "Inteligência Artificial",
  "qtd": 5
}
```

### Gerar capítulos
```http
POST /content/chapters
Content-Type: application/json

{
  "titulo": "Guia de IA Generativa",
  "tema": "Inteligência Artificial"
}
```

### Gerar conteúdo de capítulo
```http
POST /content/chapter
Content-Type: application/json

{
  "capitulo": "Introdução à IA Generativa",
  "subtemas": ["História da IA", "Conceitos básicos"],
  "titulo_ebook": "Guia de IA Generativa"
}
```

### Gerar imagem
```http
POST /image/generate
Content-Type: application/json

{
  "description": "Um robô humanóide ensinando um grupo de crianças, estilo render 3D"
}
```

### Criar design no Canva
```http
POST /canva/design/create
Content-Type: application/json

{
  "ebook_id": "123e4567-e89b-12d3-a456-426614174000",
  "template_id": "template_123456"
}
```

### Exportar eBook
```http
POST /export/ebook/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "format": "pdf",
  "options": {
    "include_cover": true,
    "include_toc": true
  }
}
```

## Configuração

Para utilizar todas as funcionalidades, é necessário configurar as seguintes variáveis de ambiente:

```
# Serviços de IA para geração de conteúdo e imagens
OPENAI_API_KEY=sua_chave_api
STABILITY_API_KEY=sua_chave_api

# Integração com Canva (API REST)
CANVA_API_KEY=sua_chave_api
CANVA_BRAND_ID=seu_brand_id

# Banco de dados
MONGODB_URI=sua_uri_mongodb
```

Para integrar com a API do Canva, você precisará:
1. Registrar seu aplicativo no [Canva Developer Portal](https://www.canva.com/developers/)
2. Obter as credenciais de API (API Key)
3. Configurar um Brand Kit ou obter um Brand ID existente
4. Adicionar as credenciais às variáveis de ambiente da aplicação

## Dependências

- Flask
- MongoDB
- OpenAI API
- Canva API (via integração REST)
- Stability AI API (opcional)
- PyMuPDF (para manipulação de PDFs)
- EPUB tools (para criação de EPUBs)
- python-docx (para criação de DOCXs)

## Próximos Passos

- Implementação de templates personalizados
- Suporte a mais formatos de exportação
- Melhorias na integração com Canva
- Adição de ferramentas de edição de conteúdo
- Suporte a mais provedores de IA 