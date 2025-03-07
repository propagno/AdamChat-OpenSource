from bson import ObjectId
from datetime import datetime
from ..db import get_db
from ..models.patient_model import PatientModel


class PatientService:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db["pacientes"]

    def create_patient(self, patient_data):
        """
        Cria um novo paciente no banco de dados
        """
        patient = PatientModel.create_patient(
            nome=patient_data.get("nome"),
            idade=patient_data.get("idade"),
            genero=patient_data.get("genero"),
            cpf=patient_data.get("cpf")
        )

        # Verificar se o paciente já existe pelo CPF
        existing_patient = self.collection.find_one(
            {"cpf": patient_data.get("cpf")})
        if existing_patient:
            return {"error": "Paciente já cadastrado com este CPF", "patient_id": str(existing_patient["_id"])}

        result = self.collection.insert_one(patient)
        return {"patient_id": str(result.inserted_id)}

    def get_patient(self, patient_id):
        """
        Recupera um paciente pelo ID
        """
        try:
            patient = self.collection.find_one({"_id": ObjectId(patient_id)})
            if patient:
                patient["_id"] = str(patient["_id"])
                return patient
            return None
        except Exception as e:
            return {"error": str(e)}

    def get_patient_by_cpf(self, cpf):
        """
        Recupera um paciente pelo CPF
        """
        try:
            patient = self.collection.find_one({"cpf": cpf})
            if patient:
                patient["_id"] = str(patient["_id"])
                return patient
            return None
        except Exception as e:
            return {"error": str(e)}

    def add_prontuario(self, patient_id, prontuario_data, relatorio=None):
        """
        Adiciona um novo prontuário ao paciente
        """
        try:
            prontuario = PatientModel.create_prontuario(
                data_consulta=prontuario_data.get("dataConsulta"),
                sintomas=prontuario_data.get("sintomas"),
                historico_medico=prontuario_data.get("historicoMedico"),
                relatorio=relatorio
            )

            # Adiciona o prontuário ao array de prontuários do paciente
            result = self.collection.update_one(
                {"_id": ObjectId(patient_id)},
                {"$push": {"prontuarios": prontuario}}
            )

            if result.modified_count:
                return {"success": True, "prontuario": prontuario}
            return {"error": "Paciente não encontrado ou prontuário não adicionado"}
        except Exception as e:
            return {"error": str(e)}

    def get_patient_history(self, patient_id):
        """
        Recupera todo o histórico de prontuários de um paciente
        """
        try:
            patient = self.collection.find_one({"_id": ObjectId(patient_id)})
            if patient:
                return {
                    "patient_id": str(patient["_id"]),
                    "nome": patient.get("nome"),
                    "prontuarios": patient.get("prontuarios", [])
                }
            return {"error": "Paciente não encontrado"}
        except Exception as e:
            return {"error": str(e)}
