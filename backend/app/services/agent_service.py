# backend/app/services/agent_service.py
def get_prompt_instructions(agent: str, consultation_data: str) -> str:
    agent = agent.lower()
    if agent == "agent médico":
        prompt_instrucoes = (
            "Você é um agente médico especializado em avaliação de consultas. "
            "A partir dos dados do paciente, elabore uma resposta clara, estruturada e em **Markdown**. "
            "Utilize seções com cabeçalhos, listas e quebras de linha. "
            "Estruture a resposta em seções: **Avaliação Inicial**, **Hipóteses Diagnósticas**, "
            "**Exames Complementares**, **Conduta Inicial**, **Medicamentos a ministrar:** e **Plano de Seguimento**.\n\n"
        )
    elif agent == "agent beta":
        prompt_instrucoes = (
            "Você é o Agent Beta, especializado em fornecer respostas técnicas e objetivas. "
            "Forneça uma resposta concisa e direta com os principais pontos da consulta.\n\n"
        )
    elif agent == "agent gamma":
        prompt_instrucoes = (
            "Você é o Agent Gamma, especialista em análises detalhadas e insights aprofundados. "
            "Elabore uma resposta que destaque os detalhes relevantes e forneça recomendações práticas.\n\n"
        )
    else:
        prompt_instrucoes = "Responda de forma clara e organizada:\n\n"

    full_prompt = f"{prompt_instrucoes}Dados do Paciente:\n{consultation_data}"
    return full_prompt
