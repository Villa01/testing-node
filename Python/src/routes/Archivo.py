from flask import Blueprint, jsonify

#Models
from models.ArchivoModel import ArchivoModel

main = Blueprint('archivo_blueprint', __name__)

@main.route('/getArchivos')
def getArchivos():
    try:
        archivos = ArchivoModel.getArchivos()
        return jsonify(archivos)
    except Exception as ex:
        return jsonify({'message': str(ex)}),500