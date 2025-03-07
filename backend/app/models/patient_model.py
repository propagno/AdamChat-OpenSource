from datetime import datetime


class PatientModel:
    """
    Modelo para representar a estrutura de um paciente no MongoDB.
    """
    @staticmethod
    def create_patient(nome, idade, genero, cpf, **kwargs):
        """
        Cria um novo documento de paciente
        """
        patient = {
            "nome": nome,
            "idade": idade,
            "genero": genero,
            "cpf": cpf,
            "data_cadastro": datetime.now(),
            "prontuarios": [],
            **kwargs
        }
        return patient

    @staticmethod
    def create_prontuario(data_consulta, sintomas, historico_medico, relatorio=None, **kwargs):
        """
        Cria um novo prontuário para adicionar ao paciente
        """
        prontuario = {
            "dataConsulta": data_consulta,
            "sintomas": sintomas,
            "historicoMedico": historico_medico,
            "relatorio": relatorio,
            "data_criacao": datetime.now(),
            **kwargs
        }
        return prontuario
