from flask import Flask
from flask import request
from flask_cors import CORS
import os
import psycopg2
import boto3
import base64
import bcrypt
from boto3.s3.transfer import S3Transfer
from pathlib import Path
from io import BytesIO
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage
from botocore.exceptions import ClientError
from flask import jsonify


app = Flask(__name__)

# Conectando a la db de postgres
try:
    # Vamos a traer las variables de entorno al .env
    load_dotenv()
    connection = psycopg2.connect(
        host=os.getenv('PG_HOST'),
        user=os.getenv('PG_USER'),
        password=os.getenv('PG_PASSWORD'),
        database=os.getenv('PG_DATABASE'),
        port='5432'
    )

    print("Conexion exitosa")

except Exception as ex:
    print(ex)


def page_not_found(error):
    return "<h1>Not found page</h1>", 404


def encrypt(word):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(word, salt)


def compareEncrypted(string1, string2):
    return bcrypt.checkpw(string1, string2)


#LOGIN
@app.route('/api/auth/', methods=['POST'])
def login():
    try:
        # Obtenemos los datos que manda postman desde json
        user = request.json['username']
        password = request.json['password']
        print(password)

        # Procedemos a invocar el query de la db para validar el login
        query = 'SELECT * from proyecto1.getUsuario(%s)'
        params = [user]
        cur = connection.cursor()
        cur.execute(query, params)
        connection.commit()
        response = {}
        for id, username, email, passw, perfil in cur.fetchall():
            if compareEncrypted(password.encode(), passw.encode()):
                response['id'] = id
                response['username'] = username
                response['email'] = email
                response['perfil'] = perfil
                print("Usuario encontrado")
            else:
                response = {'message:' 'No se encontró al usuario asociado al username ' + user}
                print("Usuario no encontrado")

        cur.close()
        connection.close()
        return jsonify(response)
    except Exception as e:
        print(e)
        response = {
            'message': 'No se encontró al usuario ingresado, intente nuevamente'}
        return jsonify(response)

#OBTENER USUARIOS POR NOMBRE
@app.route('/api/users/<user>', methods=['GET'])
def getUsersByName(user):
    try:
        #Obtenemos al usuario que vamos a buscar
        print(user)

        #Invocamos la query para realizar la busqueda
        query = 'SELECT * FROM proyecto1.getUsuario(%s)'
        params = [user]
        cur = connection.cursor()
        cur.execute(query, params)
        connection.commit()
        response = {}
        for id, username, email, passw, perfil in cur.fetchall():
            if user == username:
                response['id'] = id
                response['username'] = username
                response['email'] = email
                response['password'] = passw
                response['perfil'] = perfil
                print("Usuario encontrado")
            else:
                response = {'message:' 'No se encontró al usuario asociado al username ' + user}
                print("Usuario no encontrado")

        cur.close()
        connection.close()
        return jsonify(response)
    except Exception as e:
        print(e)
        response = {
            'message': 'No se encontró al usuario ingresado, intente nuevamente'}
        return jsonify(response)

#CREAR USUARIOS
@app.route('/api/users/', methods=['POST'])
def createUser():
    load_dotenv()

    s3Client = boto3.client('s3', aws_access_key_id=os.getenv('AWS_ID_PASSWORD'),
                            aws_secret_access_key=os.getenv('AWS_PASSWORD'))
    bucket = os.getenv('AWS_S3_NAME')

    try:
        # Obtenemos el body para poder agregar al usuario, menos la foto porque eso es aparte
        user = request.form['username']
        email = request.form['email']
        password = request.form['password']
        perfil = request.files['perfil']
        encryptedPass = encrypt(password.encode())

        # Mandamos a crear un folder llamado file donde meteremos las imagenes
        try:
            os.stat(os.path.dirname(__file__) + os.getenv('UPLOAD_PATH'))
        except:
            os.mkdir(os.path.dirname(__file__) + os.getenv('UPLOAD_PATH'))

        print("bandera")

        # Vamos a obtener la ruta del archivo que vamos a subir
        basepath = os.path.dirname(__file__)
        uploadPath = os.path.join(basepath, os.getenv('UPLOAD_PATH').replace(
            "/", ""), secure_filename(perfil.filename))
        extension = "." + uploadPath.split('.')[-1]
        perfil.save(uploadPath)
        fotoUsuario = user + "-profile" + extension

        # Ahora se envia al s3
        transfer = S3Transfer(s3Client)
        transfer.upload_file(uploadPath, bucket, fotoUsuario)
        fileURL = '%s/%s/%s' % (s3Client.meta.endpoint_url,
                                bucket, fotoUsuario)
        os.remove(uploadPath)
        print(fileURL)

        # Despues de subir al s3 agregamos a la db
        query = 'CALL proyecto1.addUsuario(%s, %s, %s, %s, 0)'
        params = [user, email, encryptedPass.decode("utf-8"), fileURL]
        cur = connection.cursor()
        cur.execute(query, params)
        connection.commit()
        cur.close()
        connection.close()
        response = {'message': 'Usuario creado con exito'}
        return jsonify(response)
    except Exception as e:
        print(e)
        response = {'message': 'No se pudo agregar el usuario'}
        return jsonify(response)


if __name__ == '__main__':
    # Error Handlers
    app.register_error_handler(404, page_not_found)
    # Levantar el server
    app.run()
