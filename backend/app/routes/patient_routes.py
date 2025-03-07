from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from ..auth_middleware import token_required
from ..services.patient_service import PatientService
from ..services.medical_file_service import MedicalFileService
from ..services.medical_ai_service import MedicalAIService
import json

patient_bp = Blueprint('patient', __name__)
patient_service = PatientService()
medical_file_service = MedicalFileService()
medical_ai_service = MedicalAIService()


@patient_bp.route('/patients', methods=['POST'])
@cross_origin()
@token_required
def create_patient():
    """
    Cria um novo paciente
    """
    data = request.json

    if not data:
        return jsonify({"error": "Dados do paciente não fornecidos"}), 400

    # Verificações básicas
    required_fields = ["nome", "idade", "genero", "cpf"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Campo obrigatório '{field}' não fornecido"}), 400

    result = patient_service.create_patient(data)

    if "error" in result:
        return jsonify(result), 400

    return jsonify(result), 201


@patient_bp.route('/patients/<patient_id>', methods=['GET'])
@cross_origin()
@token_required
def get_patient(patient_id):
    """
    Recupera um paciente pelo ID
    """
    patient = patient_service.get_patient(patient_id)

    if patient is None:
        return jsonify({"error": "Paciente não encontrado"}), 404

    if "error" in patient:
        return jsonify(patient), 400

    return jsonify(patient), 200


@patient_bp.route('/patients/cpf/<cpf>', methods=['GET'])
@cross_origin()
@token_required
def get_patient_by_cpf(cpf):
    """
    Recupera um paciente pelo CPF
    """
    patient = patient_service.get_patient_by_cpf(cpf)

    if patient is None:
        return jsonify({"error": "Paciente não encontrado"}), 404

    if "error" in patient:
        return jsonify(patient), 400

    return jsonify(patient), 200


@patient_bp.route('/patients/<patient_id>/prontuarios', methods=['POST'])
@cross_origin()
@token_required
def add_prontuario(patient_id):
    """
    Adiciona um novo prontuário a um paciente
    """
    data = request.json

    if not data:
        return jsonify({"error": "Dados do prontuário não fornecidos"}), 400

    # Verificações básicas
    required_fields = ["dataConsulta", "sintomas", "historicoMedico"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Campo obrigatório '{field}' não fornecido"}), 400

    # Gera um relatório baseado nos dados médicos usando IA se fornecido um provedor
    if "ai_provider" in data:
        provider = data.get("ai_provider", "chatgpt")
        try:
            # Recupera os dados do paciente
            patient = patient_service.get_patient(patient_id)
            if patient and not "error" in patient:
                # Gera o relatório
                medical_data = {
                    "sintomas": data.get("sintomas", ""),
                    "historicoMedico": data.get("historicoMedico", "")
                }

                relatorio = medical_ai_service.generate_medical_report(
                    patient_data=patient,
                    medical_data=medical_data,
                    provider=provider
                )

                # Adiciona o relatório ao prontuário
                data["relatorio"] = relatorio
        except Exception as e:
            print(f"Erro ao gerar relatório com IA: {str(e)}")

    result = patient_service.add_prontuario(
        patient_id, data, data.get("relatorio"))

    if "error" in result:
        return jsonify(result), 400

    return jsonify(result), 201


@patient_bp.route('/patients/<patient_id>/history', methods=['GET'])
@cross_origin()
@token_required
def get_patient_history(patient_id):
    """
    Recupera todo o histórico de prontuários de um paciente
    """
    history = patient_service.get_patient_history(patient_id)

    if "error" in history:
        return jsonify(history), 400

    return jsonify(history), 200


@patient_bp.route('/upload-ficha', methods=['POST'])
@cross_origin()
@token_required
def upload_medical_file():
    """
    Recebe um arquivo de ficha médica (.docx, .xlsx, .xls),
    processa seus dados e opcionalmente cria um paciente e/ou prontuário
    """
    # Verifica se um arquivo foi enviado
    if 'file' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "Nenhum arquivo selecionado"}), 400

    # Processa o arquivo
    file_data = medical_file_service.process_file(file)

    if "error" in file_data:
        return jsonify(file_data), 400

    # Verifica se deve usar IA para extrair mais informações
    ai_provider = request.form.get('ai_provider', None)

    if ai_provider and "full_text" in file_data:
        try:
            # Extrai informações usando IA
            extracted_info = medical_ai_service.extract_medical_info(
                file_data["full_text"],
                provider=ai_provider
            )

            # Tenta converter a resposta para JSON
            try:
                extracted_json = json.loads(extracted_info)
                file_data["ai_extracted"] = extracted_json
            except:
                # Se não conseguir converter, mantém como texto
                file_data["ai_extracted"] = extracted_info
        except Exception as e:
            file_data["ai_error"] = str(e)

    # Verifica se deve criar/atualizar um paciente e prontuário
    create_patient_record = request.form.get(
        'create_patient_record', 'false').lower() == 'true'
    patient_id = request.form.get('patient_id', None)

    if create_patient_record:
        # Tenta obter dados do paciente
        patient_data = file_data.get("patient_data", {})

        # Se houver AI extraction, pode complementar os dados
        if "ai_extracted" in file_data and isinstance(file_data["ai_extracted"], dict):
            ai_patient = file_data["ai_extracted"].get("dados_do_paciente", {})
            # Complementa dados faltantes
            for key in ["nome", "idade", "genero", "cpf"]:
                if not patient_data.get(key) and key in ai_patient:
                    patient_data[key] = ai_patient[key]

        # Verifica se tem dados suficientes para criar um paciente
        if all(key in patient_data for key in ["nome", "cpf"]):
            # Se um patient_id foi fornecido, adicionamos apenas um prontuário
            if patient_id:
                # Cria dados para o prontuário
                prontuario_data = {
                    "dataConsulta": request.form.get('data_consulta', ""),
                    "sintomas": file_data.get("extracted_data", {}).get("Sintomas", ""),
                    "historicoMedico": file_data.get("extracted_data", {}).get("Histórico Médico", "")
                }

                # Se houver AI extraction, pode complementar os dados do prontuário
                if "ai_extracted" in file_data and isinstance(file_data["ai_extracted"], dict):
                    if "sintomas" in file_data["ai_extracted"]:
                        prontuario_data["sintomas"] = file_data["ai_extracted"]["sintomas"]
                    if "histórico_médico" in file_data["ai_extracted"]:
                        prontuario_data["historicoMedico"] = file_data["ai_extracted"]["histórico_médico"]

                # Adiciona o prontuário ao paciente
                result = patient_service.add_prontuario(
                    patient_id, prontuario_data)
                file_data["patient_record_result"] = result
            else:
                # Cria um novo paciente
                result = patient_service.create_patient(patient_data)

                if "error" not in result:
                    # Adiciona o prontuário ao paciente recém-criado
                    new_patient_id = result.get("patient_id")

                    # Cria dados para o prontuário
                    prontuario_data = {
                        "dataConsulta": request.form.get('data_consulta', ""),
                        "sintomas": file_data.get("extracted_data", {}).get("Sintomas", ""),
                        "historicoMedico": file_data.get("extracted_data", {}).get("Histórico Médico", "")
                    }

                    # Se houver AI extraction, pode complementar os dados do prontuário
                    if "ai_extracted" in file_data and isinstance(file_data["ai_extracted"], dict):
                        if "sintomas" in file_data["ai_extracted"]:
                            prontuario_data["sintomas"] = file_data["ai_extracted"]["sintomas"]
                        if "histórico_médico" in file_data["ai_extracted"]:
                            prontuario_data["historicoMedico"] = file_data["ai_extracted"]["histórico_médico"]

                    # Adiciona o prontuário ao paciente
                    prontuario_result = patient_service.add_prontuario(
                        new_patient_id, prontuario_data)

                    file_data["patient_result"] = result
                    file_data["prontuario_result"] = prontuario_result
                else:
                    file_data["patient_result"] = result

    return jsonify(file_data), 200
