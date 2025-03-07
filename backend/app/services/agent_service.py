def get_prompt_instructions(consultation_data: str, custom_template: str = None) -> str:
    """
    Monta o prompt para a consulta.

    Se um template customizado for fornecido, utiliza-o;
    caso contrário, utiliza uma formatação default simples.
    """
    if custom_template:
        prompt_instrucoes = custom_template + "\n\n"
    else:
        prompt_instrucoes = "Mensagem do Usuário:\n\n"

    full_prompt = f"{prompt_instrucoes}{consultation_data}"
    return full_prompt
