import os
import docx
import pandas as pd
import tempfile
from werkzeug.utils import secure_filename


class MedicalFileService:
    """
    Serviço para processar arquivos de fichas médicas nos formatos .docx e .xlsx/.xls
    """

    @staticmethod
    def process_file(file, file_type=None):
        """
        Processa um arquivo de ficha médica e extrai suas informações
        """
        if not file_type:
            file_type = MedicalFileService._get_file_type(file.filename)

        if file_type == 'docx':
            return MedicalFileService._process_docx(file)
        elif file_type in ['xlsx', 'xls']:
            return MedicalFileService._process_excel(file)
        else:
            return {"error": "Formato de arquivo não suportado. Use .docx, .xlsx ou .xls"}

    @staticmethod
    def _get_file_type(filename):
        """
        Identifica o tipo de arquivo pela extensão
        """
        extension = filename.rsplit(
            '.', 1)[1].lower() if '.' in filename else ''
        return extension

    @staticmethod
    def _process_docx(file):
        """
        Processa um arquivo .docx e extrai as informações
        """
        # Salvar o arquivo temporariamente
        with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp:
            file.save(temp.name)
            temp_path = temp.name

        try:
            # Extrair textos do arquivo
            doc = docx.Document(temp_path)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]

            # Tenta extrair informações estruturadas
            extracted_data = {}

            # Tenta identificar campos comuns em fichas médicas
            for para in paragraphs:
                if ":" in para:
                    key, value = para.split(":", 1)
                    extracted_data[key.strip()] = value.strip()

            # Extrai texto completo para uso com IA
            full_text = "\n".join(paragraphs)

            result = {
                "extracted_data": extracted_data,
                "full_text": full_text
            }

            # Tenta identificar dados padrão do paciente
            if "Nome" in extracted_data or "nome" in extracted_data:
                result["patient_data"] = {
                    "nome": extracted_data.get("Nome", extracted_data.get("nome", "")),
                    "idade": extracted_data.get("Idade", extracted_data.get("idade", "")),
                    "genero": extracted_data.get("Gênero", extracted_data.get("genero", extracted_data.get("Sexo", extracted_data.get("sexo", "")))),
                    "cpf": extracted_data.get("CPF", extracted_data.get("cpf", "")),
                }

            # Limpa o arquivo temporário
            os.unlink(temp_path)
            return result

        except Exception as e:
            # Limpa o arquivo temporário
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            return {"error": str(e)}

    @staticmethod
    def _process_excel(file):
        """
        Processa um arquivo .xlsx ou .xls e extrai as informações
        """
        # Salvar o arquivo temporariamente
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{MedicalFileService._get_file_type(file.filename)}') as temp:
            file.save(temp.name)
            temp_path = temp.name

        try:
            # Carrega o arquivo Excel
            df = pd.read_excel(temp_path)

            # Converte para dicionário
            data_dict = df.to_dict(orient='records')

            # Tenta extrair cabeçalhos e valores da primeira linha
            headers = df.columns.tolist()

            # Procura identificar dados do paciente
            patient_data = {}

            # Procura por colunas que possam conter informações do paciente
            patient_fields = {
                "nome": ["nome", "name", "paciente", "patient"],
                "idade": ["idade", "age"],
                "genero": ["genero", "sexo", "gender", "sex"],
                "cpf": ["cpf", "documento", "document"]
            }

            # Para cada campo do paciente, procura em todas as colunas
            for field, possible_names in patient_fields.items():
                for col in headers:
                    if any(name in col.lower() for name in possible_names) and len(data_dict) > 0:
                        patient_data[field] = data_dict[0].get(col, "")
                        break

            result = {
                "data": data_dict,
                "headers": headers
            }

            if patient_data:
                result["patient_data"] = patient_data

            # Limpa o arquivo temporário
            os.unlink(temp_path)
            return result

        except Exception as e:
            # Limpa o arquivo temporário
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            return {"error": str(e)}
