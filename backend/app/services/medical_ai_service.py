from .genai_service import GenAIService


class MedicalAIService:
    """
    Serviço para processar dados médicos com IA
    """

    def __init__(self, provider_config=None):
        self.genai_service = GenAIService(provider_config)

    def generate_medical_report(self, patient_data, medical_data, provider="chatgpt", prompt_template=None):
        """
        Gera um relatório médico baseado nos dados do paciente e dados médicos fornecidos

        Args:
            patient_data: Dicionário com dados do paciente (nome, idade, etc)
            medical_data: Dicionário com dados médicos (sintomas, histórico, etc)
            provider: Provedor de IA a ser usado (chatgpt, gemini, etc)
            prompt_template: Template de prompt personalizado (opcional)

        Returns:
            O relatório gerado pela IA
        """
        # Constrói o prompt para a IA
        prompt = self._build_medical_prompt(
            patient_data, medical_data, prompt_template)

        # Chama o provedor de IA apropriado
        if provider.lower() == "chatgpt":
            return self.genai_service.chat_with_chatgpt(prompt)
        elif provider.lower() == "gemini":
            return self.genai_service.chat_with_gemini(prompt)
        elif provider.lower() == "claude":
            return self.genai_service.chat_with_claude(prompt)
        elif provider.lower() == "deepseek":
            return self.genai_service.chat_with_deepseek(prompt)
        elif provider.lower() == "llama":
            return self.genai_service.chat_with_llama(prompt)
        elif provider.lower() == "copilot":
            return self.genai_service.chat_with_copilot(prompt)
        else:
            # Por padrão, usa ChatGPT
            return self.genai_service.chat_with_chatgpt(prompt)

    def _build_medical_prompt(self, patient_data, medical_data, prompt_template=None):
        """
        Constrói um prompt médico formatado para a IA
        """
        if prompt_template:
            # Se um template foi fornecido, use-o
            prompt = prompt_template
        else:
            # Template padrão
            prompt = """
            Você é um assistente médico especializado em análise de dados clínicos e geração de relatórios médicos. 
            Por favor, analise os dados do paciente e informações médicas abaixo e gere um relatório médico 
            detalhado e estruturado.
            
            DADOS DO PACIENTE:
            Nome: {nome}
            Idade: {idade}
            Gênero: {genero}
            
            DADOS MÉDICOS:
            Sintomas: {sintomas}
            Histórico Médico: {historico_medico}
            
            O relatório deve incluir:
            1. Resumo do caso
            2. Análise dos sintomas
            3. Possíveis diagnósticos (sempre com ressalvas de que uma avaliação presencial é necessária)
            4. Recomendações gerais
            5. Conclusão
            
            O relatório deve ser escrito em linguagem formal médica, mas compreensível para profissionais de saúde.
            """

        # Substitui placeholders com os dados reais
        nome = patient_data.get("nome", "Não informado")
        idade = patient_data.get("idade", "Não informada")
        genero = patient_data.get("genero", "Não informado")

        sintomas = medical_data.get("sintomas", "Não informados")
        historico_medico = medical_data.get("historicoMedico", "Não informado")

        # Substitui os placeholders
        prompt = prompt.format(
            nome=nome,
            idade=idade,
            genero=genero,
            sintomas=sintomas,
            historico_medico=historico_medico
        )

        return prompt

    def extract_medical_info(self, text_content, provider="chatgpt"):
        """
        Extrai informações médicas estruturadas de um texto não estruturado

        Args:
            text_content: Texto não estruturado da ficha médica
            provider: Provedor de IA a ser usado

        Returns:
            Dicionário com informações médicas estruturadas
        """
        prompt = f"""
        Extraia as seguintes informações médicas do texto abaixo e retorne em formato estruturado JSON:
        
        1. Dados do paciente (nome, idade, gênero, CPF se disponível)
        2. Sintomas principais
        3. Histórico médico
        4. Medicamentos em uso
        5. Alergias
        6. Antecedentes familiares relevantes
        
        Para dados não encontrados, use "Não informado".
        
        TEXTO:
        {text_content}
        
        RETORNO JSON: (apenas o JSON, sem comentários adicionais)
        """

        # Chama o provedor de IA apropriado
        if provider.lower() == "chatgpt":
            response = self.genai_service.chat_with_chatgpt(prompt)
        elif provider.lower() == "gemini":
            response = self.genai_service.chat_with_gemini(prompt)
        elif provider.lower() == "claude":
            response = self.genai_service.chat_with_claude(prompt)
        else:
            # Por padrão, usa ChatGPT
            response = self.genai_service.chat_with_chatgpt(prompt)

        # A resposta deve ser um JSON. Aqui poderia ter uma lógica para validar e extrair o JSON
        # da resposta, mas para simplicidade, apenas retornamos a resposta completa
        return response
