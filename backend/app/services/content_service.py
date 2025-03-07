# backend/app/services/content_service.py
import logging
from app.services.genai_service import GenAIService
from app.db import get_db

logger = logging.getLogger(__name__)


def get_ai_service(provider='chatgpt', version='v4'):
    """
    Obtém uma instância configurada do serviço GenAI.

    Args:
        provider (str): Nome do provedor (chatgpt, gemini, claude, etc.)
        version (str): Versão do provider (v4, v35_turbo, etc.)

    Returns:
        GenAIService: Instância configurada do serviço GenAI
    """
    try:
        db = get_db()
        providers_configs = {}

        # Busca todos os providers disponíveis
        providers = db.providers.find({}, {"_id": 0})

        for provider_doc in providers:
            provider_name = provider_doc.get("name", "").lower()
            config = provider_doc.get("config", {})

            # Estrutura hierárquica de configuração
            if provider_name not in providers_configs:
                providers_configs[provider_name] = {}

            # Versões do provider
            for version_name, version_config in config.items():
                providers_configs[provider_name][version_name] = version_config

        return GenAIService(providers_configs)
    except Exception as e:
        logger.error(f"Erro ao obter serviço GenAI: {str(e)}")
        # Retorna um serviço vazio se não for possível obter as configurações
        return GenAIService({})


def generate_titles(tema, provider='chatgpt', version='v4', qtd=5):
    """
    Gera sugestões de títulos para o eBook com base no tema.

    Args:
        tema (str): Tema do eBook
        provider (str): Provedor de IA a ser usado
        version (str): Versão do provedor
        qtd (int): Quantidade de títulos a serem gerados

    Returns:
        list: Lista de títulos sugeridos
    """
    try:
        ai_service = get_ai_service(provider, version)

        prompt = f"""
        Você é um especialista em títulos de eBooks profissionais e comerciais.
        Com base no tema: '{tema}', sugira {qtd} títulos atrativos para um eBook.
        Os títulos devem ser concisos, chamativos e refletir o tema.
        Retorne apenas os títulos, um por linha, sem numeração.
        """

        # Seleciona o método correspondente ao provider
        if provider.lower() == 'chatgpt':
            response = ai_service.chat_with_chatgpt(prompt, version)
        elif provider.lower() == 'gemini':
            response = ai_service.chat_with_gemini(prompt)
        elif provider.lower() == 'claude':
            response = ai_service.chat_with_claude(prompt)
        else:
            # Fallback para ChatGPT
            response = ai_service.chat_with_chatgpt(prompt, 'v35_turbo')

        # Processa a resposta para obter uma lista de títulos
        titulos = [titulo.strip()
                   for titulo in response.strip().split('\n') if titulo.strip()]
        return titulos[:qtd]  # Limita ao número solicitado

    except Exception as e:
        logger.error(f"Erro ao gerar títulos: {str(e)}")
        return [f"Guia sobre {tema}", f"{tema}: Um Guia Completo", f"Entendendo {tema}", f"Dominando {tema}", f"O Essencial sobre {tema}"]


def generate_chapters(titulo, tema=None, provider='chatgpt', version='v4', qtd=5):
    """
    Gera sugestões de capítulos para o eBook com base no título.

    Args:
        titulo (str): Título do eBook
        tema (str, optional): Tema do eBook, para contexto adicional
        provider (str): Provedor de IA a ser usado
        version (str): Versão do provedor
        qtd (int): Quantidade de capítulos a serem gerados

    Returns:
        list: Lista de dicionários com título do capítulo e subtemas
    """
    try:
        ai_service = get_ai_service(provider, version)

        context = f" sobre o tema '{tema}'" if tema else ""

        prompt = f"""
        Você é um especialista em estruturação de eBooks profissionais.
        Para um eBook com o título: '{titulo}'{context}, sugira {qtd} capítulos lógicos e interessantes.
        Para cada capítulo, forneça 2-3 subtemas que podem ser abordados.
        
        Formato esperado da sua resposta:
        
        Capítulo 1: [Título do Capítulo]
        - [Subtema 1]
        - [Subtema 2]
        - [Subtema 3]
        
        Capítulo 2: [Título do Capítulo]
        - [Subtema 1]
        - [Subtema 2]
        ...
        """

        # Seleciona o método correspondente ao provider
        if provider.lower() == 'chatgpt':
            response = ai_service.chat_with_chatgpt(prompt, version)
        elif provider.lower() == 'gemini':
            response = ai_service.chat_with_gemini(prompt)
        elif provider.lower() == 'claude':
            response = ai_service.chat_with_claude(prompt)
        else:
            # Fallback para ChatGPT
            response = ai_service.chat_with_chatgpt(prompt, 'v35_turbo')

        # Processa a resposta para obter capítulos e subtemas
        capitulos = []
        current_chapter = None
        current_subtemas = []

        for linha in response.strip().split('\n'):
            linha = linha.strip()
            if not linha:
                continue

            # Identifica linha de capítulo
            if linha.lower().startswith('capítulo') and ':' in linha:
                # Se já temos um capítulo, salvamos ele antes de começar um novo
                if current_chapter:
                    capitulos.append({
                        "titulo": current_chapter,
                        "subtemas": current_subtemas
                    })

                # Começa um novo capítulo
                chapter_title = linha.split(':', 1)[1].strip()
                current_chapter = chapter_title
                current_subtemas = []

            # Identifica linha de subtema
            elif linha.startswith('-') or linha.startswith('•'):
                subtema = linha[1:].strip()
                if current_chapter and subtema:  # Só adiciona se pertencer a um capítulo
                    current_subtemas.append(subtema)

        # Adiciona o último capítulo
        if current_chapter:
            capitulos.append({
                "titulo": current_chapter,
                "subtemas": current_subtemas
            })

        return capitulos[:qtd]  # Limita ao número solicitado

    except Exception as e:
        logger.error(f"Erro ao gerar capítulos: {str(e)}")
        # Retorna alguns capítulos padrão em caso de erro
        return [
            {"titulo": "Introdução", "subtemas": [
                "Visão geral", "Objetivos do eBook"]},
            {"titulo": "Conceitos Básicos", "subtemas": [
                "Terminologia", "Princípios fundamentais"]},
            {"titulo": "Aplicações Práticas",
                "subtemas": ["Casos de uso", "Exemplos"]}
        ]


def generate_chapter_content(capitulo, subtemas=None, titulo_ebook=None, provider='chatgpt', version='v4'):
    """
    Gera o conteúdo detalhado para um capítulo específico.

    Args:
        capitulo (str): Título do capítulo
        subtemas (list, optional): Lista de subtemas do capítulo
        titulo_ebook (str, optional): Título do eBook para contexto
        provider (str): Provedor de IA a ser usado
        version (str): Versão do provedor

    Returns:
        str: Conteúdo formatado do capítulo
    """
    try:
        ai_service = get_ai_service(provider, version)

        contexto_ebook = f" do eBook '{titulo_ebook}'" if titulo_ebook else ""
        contexto_subtemas = ""

        if subtemas:
            subtemas_texto = "\n".join(
                [f"- {subtema}" for subtema in subtemas])
            contexto_subtemas = f"\n\nOs subtemas a serem abordados são:\n{subtemas_texto}"

        prompt = f"""
        Você é um redator especializado em eBooks educativos e informativos.
        Gere o conteúdo completo para o capítulo '{capitulo}'{contexto_ebook}.{contexto_subtemas}
        
        O conteúdo deve:
        - Ter um texto introdutório envolvente
        - Abordar cada subtema com profundidade adequada
        - Incluir exemplos, analogias ou casos práticos quando apropriado
        - Ter um texto de encerramento que conecte ao próximo capítulo
        - Ser educativo mas acessível para um público leigo
        - Ter aproximadamente 800-1200 palavras no total
        
        Use formatação com subtítulos (##) para cada seção e listas quando apropriado.
        """

        # Seleciona o método correspondente ao provider
        if provider.lower() == 'chatgpt':
            response = ai_service.chat_with_chatgpt(prompt, version)
        elif provider.lower() == 'gemini':
            response = ai_service.chat_with_gemini(prompt)
        elif provider.lower() == 'claude':
            response = ai_service.chat_with_claude(prompt)
        else:
            # Fallback para ChatGPT
            response = ai_service.chat_with_chatgpt(prompt, 'v35_turbo')

        return response.strip()

    except Exception as e:
        logger.error(
            f"Erro ao gerar conteúdo para o capítulo '{capitulo}': {str(e)}")
        return f"# {capitulo}\n\nConteúdo temporariamente indisponível. Por favor, tente gerar novamente."


def generate_image_prompt(capitulo, conteudo=None, provider='chatgpt', version='v4'):
    """
    Gera um prompt de descrição para criação de imagem relacionada ao capítulo.

    Args:
        capitulo (str): Título do capítulo
        conteudo (str, optional): Conteúdo do capítulo para contexto
        provider (str): Provedor de IA a ser usado
        version (str): Versão do provedor

    Returns:
        str: Descrição detalhada para geração de imagem
    """
    try:
        ai_service = get_ai_service(provider, version)

        context = ""
        if conteudo:
            # Limita o contexto para não exceder limites de tokens
            context = f"\n\nAqui está um trecho do conteúdo do capítulo para contexto:\n{conteudo[:500]}..."

        prompt = f"""
        Você é um especialista em criar prompts para geração de imagens.
        Com base no título do capítulo '{capitulo}'{context}, crie uma descrição detalhada para uma imagem
        que represente visualmente o tema do capítulo.
        
        A descrição deve:
        - Ser detalhada e visual (150-200 palavras)
        - Incluir elementos, cores, estilo e composição
        - Ser adequada para um eBook profissional
        - Evitar elementos que não possam ser gerados por IA (rostos muito detalhados, texto extenso, etc.)
        
        Retorne apenas a descrição, sem explicações adicionais.
        """

        # Seleciona o método correspondente ao provider
        if provider.lower() == 'chatgpt':
            response = ai_service.chat_with_chatgpt(prompt, version)
        elif provider.lower() == 'gemini':
            response = ai_service.chat_with_gemini(prompt)
        elif provider.lower() == 'claude':
            response = ai_service.chat_with_claude(prompt)
        else:
            # Fallback para ChatGPT
            response = ai_service.chat_with_chatgpt(prompt, 'v35_turbo')

        return response.strip()

    except Exception as e:
        logger.error(
            f"Erro ao gerar prompt de imagem para o capítulo '{capitulo}': {str(e)}")
        return f"Uma imagem representando o conceito de {capitulo}, com estilo moderno e profissional."
