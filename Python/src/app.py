from distutils.command.upload import upload
import mimetypes
from flask import Flask
from flask import request
from flask_cors import CORS
import os
import psycopg2
import boto3
import bcrypt
import uuid
import magic
from boto3.s3.transfer import S3Transfer
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
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


# LOGIN
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
                response = {
                    'message:' 'No se encontró al usuario asociado al username ' + user}
                print("Usuario no encontrado")

        cur.close()
        return jsonify(response)
    except Exception as e:
        response = {
            'message': 'No se encontró al usuario ingresado, intente nuevamente'}
        return jsonify(response)

# OBTENER USUARIOS POR NOMBRE


@app.route('/api/users/<user>', methods=['GET'])
def getUsersByName(user):
    try:
        # El parametro "user" hace referencia al usuario que vamos a buscar, que se obtiene
        # desde el URL que nos mandan a nosotros

        # Invocamos la query para realizar la busqueda
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
                response = {
                    'message:' 'No se encontró al usuario asociado al username ' + user}
                print("Usuario no encontrado")

        cur.close()
        return jsonify(response)
    except Exception as e:
        response = {
            'message': 'No se encontró al usuario ingresado, intente nuevamente'}
        return jsonify(response)

# CREAR USUARIOS


@app.route('/api/users/', methods=['POST'])
def createUser():
    load_dotenv()

    # Obtenemos las variables de entorno para conectarnos al s3

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

        # Vamos a obtener la ruta del archivo que vamos a subir
        basepath = os.path.dirname(__file__)
        uploadPath = os.path.join(basepath, os.getenv('UPLOAD_PATH').replace(
            "/", ""), secure_filename(perfil.filename))
        extension = "." + uploadPath.split('.')[-1]
        perfil.save(uploadPath)
        fotoUsuario = user + "-profile" + extension

        # Ahora se envia al s3
        transfer = S3Transfer(s3Client)
        transfer.upload_file(uploadPath, bucket, fotoUsuario,
                             ExtraArgs={'ACL': 'public-read'})
        fileURL = '%s/%s/%s' % (s3Client.meta.endpoint_url,
                                bucket, fotoUsuario)
        os.remove(uploadPath)

        # Despues de subir al s3 agregamos a la db
        query = 'CALL proyecto1.addUsuario(%s, %s, %s, %s, 0)'
        params = [user, email, encryptedPass.decode("utf-8"), fileURL]
        cur = connection.cursor()
        cur.execute(query, params)
        connection.commit()
        cur.close()
        response = {'message': 'Usuario creado con exito'}
        return jsonify(response)
    except Exception as e:
        response = {'message': 'No se pudo agregar el usuario'}
        return jsonify(response)

# CREAR ARCHIVOS


@app.route('/api/file/', methods=['POST'])
def createFile():
    load_dotenv()

    # Vamos a generar un unique id para el nombre del archivo para que no se repitan
    uniqueID = uuid.uuid4()

    # Obtenemos las variables de entorno para conectarnos al s3
    s3Client = boto3.client('s3', aws_access_key_id=os.getenv('AWS_ID_PASSWORD'),
                            aws_secret_access_key=os.getenv('AWS_PASSWORD'))
    bucket = os.getenv('AWS_S3_NAME')

    try:
        # Obtenemos el body para agregar el archivo al s3 y a la db
        nombre = request.form['nombre']
        url = request.files['url']
        acceso = request.form['acceso']
        id_usuario = request.form['id_usuario']

        try:
            os.stat(os.path.dirname(__file__) + os.getenv('UPLOAD_PATH'))
        except:
            os.mkdir(os.path.dirname(__file__) + os.getenv('UPLOAD_PATH'))

        # Vamos a obtener la ruta del archivo que vamos a subir
        basepath = os.path.dirname(__file__)
        uploadPath = os.path.join(basepath, os.getenv('UPLOAD_PATH').replace(
            "/", ""), secure_filename(url.filename))
        extension = "." + uploadPath.split('.')[-1]
        url.save(uploadPath)

        # Obtenemos el mimetype del archivo que subimos
        mimeType = magic.from_file(uploadPath, mime=True)

        # Vamos a ponerle un nombre a nuestro archivo, que tiene el uuid4, nombre que obtenemos de la peticion post y su extension
        nombreFinal = str(uniqueID) + nombre + extension

        # Ahora se envia al s3
        transfer = S3Transfer(s3Client)
        if acceso == "publico":
            transfer.upload_file(uploadPath, bucket, nombreFinal, ExtraArgs={
                                 'ACL': 'public-read'})
            numAcceso = 0
        elif acceso == "privado":
            transfer.upload_file(uploadPath, bucket, nombreFinal)
            numAcceso = 1
        else:
            response = {
                'message:': 'Defina el acceso por favor como publico o privado'}
            return jsonify(response)

        fileURL = '%s/%s/%s' % (s3Client.meta.endpoint_url,
                                bucket, nombreFinal)
        os.remove(uploadPath)

        # Despues de subir al s3 agregamos a la db
        query = 'CALL proyecto1.addArchivo(%s, %s, %s, %s, %s, 0)'
        params = [nombre, fileURL, mimeType, numAcceso, id_usuario]
        cur = connection.cursor()
        cur.execute(query, params)
        connection.commit()
        cur.close()
        response = {'message': 'Archivo creado con exito'}
        return jsonify(response)
    except Exception as e:
        print(e)
        response = {'message:' 'No se pudo agregar el archivo'}
        return jsonify(response)


if __name__ == '__main__':
    # Error Handlers
    app.register_error_handler(404, page_not_found)
    # Levantar el server
    app.run()
