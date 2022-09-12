import os
import psycopg2
import boto3
import bcrypt
import uuid
import magic
from flask import Flask, request, jsonify
from boto3.s3.transfer import S3Transfer
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from healthcheck import HealthCheck
from flask_cors import CORS


# Traemos CORS para poderlo usar con el fpip install python-dotenvrontend
app = Flask(__name__)
CORS(app)

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


def loginForDeleteFiles(user, password):
    # Procedemos a invocar el query de la db para validar el login
    try:
        query = 'SELECT * from proyecto1.getUsuario(%s)'
        params = [user]
        cur = connection.cursor()
        cur.execute(query, params)
        for id, username, email, passw, perfil in cur.fetchall():
            if compareEncrypted(password.encode(), passw.encode()):
                print("Usuario encontrado")
                bandera = True
                return bandera, id
            else:
                print("Usuario no encontrado")
                bandera = False
                id = -1
                return bandera, id
    except Exception as e:
        print(e)
        bandera = False
        id = -1
        return bandera, id


def getFilesByID(idUsuario, acceso, nombreArchivo):
    try:

        # Acceso en 0 es publico, en 1 es privado y en 2 es todos, que busca todos los tipos de acceso
        if acceso == "publico":
            accesoFinal = 0
        elif acceso == "privado":
            accesoFinal = 1
        elif acceso == "todos":
            accesoFinal = 2
        else:
            urlArchivo = ""
            bandera = False
            return bandera, urlArchivo

        # Procedemos a hacer la query para buscar los archivos
        query = 'SELECT * FROM proyecto1.getArchivo(%s, %s)'
        params = [idUsuario, accesoFinal]
        cur = connection.cursor()
        cur.execute(query, params)
        response = {}
        for id, nombre, url, tipo in cur.fetchall():
            if nombre == nombreArchivo:
                bandera = True
                urlArchivo = url
                return bandera, urlArchivo
            else:
                bandera = False
                urlArchivo = ""
                return bandera, urlArchivo

    except Exception as e:
        print(e)
        response = {'message': 'No se encontro ningun archivo'}
        return jsonify(response)


# LOGIN
@app.route('/api/auth/', methods=['POST'])
def login():
    try:
        # Obtenemos los datos que manda postman desde json
        user = request.json['username']
        password = request.json['password']

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
        # Vamos a generar un unique id para el nombre del archivo para que no se repitan
        uniqueID = uuid.uuid4()
        
        # Obtenemos el body para poder agregar al usuario, menos la foto porque eso es aparte
        user = request.form['username']
        email = request.form['email']
        password = request.form['password']
        confirmationPass = request.form['password2']
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
        fotoUsuario = str(uniqueID) + "_" + user + "-profile" + extension

        # Validamos que ambas contraseñas son iguales
        if password == confirmationPass:
            # Ahora se envia al s3
            transfer = S3Transfer(s3Client)
            transfer.upload_file(uploadPath, bucket, fotoUsuario)
            urlWithHTTP = (s3Client.meta.endpoint_url)
            urlWithoutHTTP = urlWithHTTP.replace("https://", "") 
            fileURL = "https://%s.%s/%s" % (bucket, urlWithoutHTTP, fotoUsuario)
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

        else:
            response = {'message': 'Las contraseñas no son iguales. Vuelva a intentarlo'}
            return jsonify(response)

    except Exception as e:
        print(e)
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
        # Además le vamos a agregar un guión bajo entre el uuid4 y el nombre
        nombreFinal = str(uniqueID) + "_" + nombre + extension

        # Ahora se envia al s3
        transfer = S3Transfer(s3Client)
        if acceso == "publico":
            transfer.upload_file(uploadPath, bucket, nombreFinal, extra_args={
                                 'ACL': 'public-read'})
            numAcceso = 0
        elif acceso == "privado":
            transfer.upload_file(uploadPath, bucket, nombreFinal)
            numAcceso = 1
        else:
            response = {
                'message:': 'Defina el acceso por favor como publico o privado'}
            return jsonify(response)

        urlWithHTTP = (s3Client.meta.endpoint_url)
        urlWithoutHTTP = urlWithHTTP.replace("https://", "") 
        fileURL = "https://%s.%s/%s" % (bucket, urlWithoutHTTP, nombreFinal)
        os.remove(uploadPath)

        # Despues de subir al s3 agregamos a la db
        query = 'CALL proyecto1.addArchivo(%s, %s, %s, %s, %s, 0)'
        params = [nombreFinal, fileURL, mimeType, numAcceso, id_usuario]
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


# ELIMINAR ARCHIVOS
@app.route('/api/file/', methods=['DELETE'])
def deleteFile():

    # Obtenemos las variables de entorno para conectarnos al s3
    s3Client = boto3.client('s3', aws_access_key_id=os.getenv('AWS_ID_PASSWORD'),
                            aws_secret_access_key=os.getenv('AWS_PASSWORD'))
    bucket_name = os.getenv('AWS_S3_NAME')

    try:
        # Obtenemos los valores json del endpoint
        password = request.json['password']
        username = request.json['username']
        nombreArchivo = request.json['nombreArchivo']

        # Si el login pasa, entonces hace el query para borrar el archivo
        function = loginForDeleteFiles(username, password)
        bandera = function[0]
        idUsuario = function[1]

        if bandera:
            query2 = 'CALL proyecto1.deleteArchivo(%s, %s, 1)'
            params2 = [nombreArchivo, idUsuario]
            cur2 = connection.cursor()
            cur2.execute(query2, params2)
            connection.commit()
            cur2.close()

            # Si se elimino de la db lo unico que queda por hacer es borrarlo del s3
            res = s3Client.delete_object(Bucket=bucket_name, Key=nombreArchivo)
            response = {'message': 'Archivo eliminado con exito'}
            return jsonify(response)

    except Exception as e:
        print(e)
        response = {'message': 'No se pudo borrar el archivo'}
        return jsonify(response)


# OBTENER ARCHIVOS DE AMIGOS POR ID
@app.route('/api/file/publico', methods=['GET'])
def getFiles():
    try:
        # Obtenemos los datos del json
        idUsuario = request.json['idUsuario']
        acceso = request.json['acceso']

        # Acceso en 0 es publico, en 1 es privado y en 2 es todos, que busca todos los tipos de acceso
        if acceso == "publico":
            accesoFinal = 0
        elif acceso == "privado":
            accesoFinal = 1
        elif acceso == "todos":
            accesoFinal = 2
        else:
            response = {
                'message': 'El acceso es publico, privado o todos. Intentelo nuevamente'}
            return jsonify(response)

        # Procedemos a hacer la query para buscar los archivos
        query = 'SELECT * FROM proyecto1.getArchivo(%s, %s)'
        params = [idUsuario, accesoFinal]
        cur = connection.cursor()
        cur.execute(query, params)
        connection.commit()
        rows = []
        for id, nombre, url, tipo in cur.fetchall():
            response = {}
            response['id'] = id
            response['nombre'] = nombre
            response['url'] = url
            response['tipo'] = tipo
            rows.append(response)
        cur.close()
        response2 = {'archivos': rows}
        return jsonify(response2)

    except Exception as e:
        print(e)
        response = {'message': 'No se encontro ningun archivo'}
        return jsonify(response)


# EDITAR ARCHIVOS
@app.route('/api/file/', methods=['PUT'])
def editFiles():
    # Obtenemos las variables de entorno para conectarnos al s3
    s3Client = boto3.client('s3', aws_access_key_id=os.getenv('AWS_ID_PASSWORD'),
                            aws_secret_access_key=os.getenv('AWS_PASSWORD'))
    bucket_name = os.getenv('AWS_S3_NAME')

    try:
        # Obtenemos los valores del json
        password = request.json['password']
        username = request.json['username']
        nombreArchivo = request.json['nombreArchivo']
        acceso = request.json['acceso']
        nombreNuevo = request.json['nombreNuevo']

        # Obtenemos el int del acceso
        if acceso == "publico":
            accesoFinal = 0
        elif acceso == "privado":
            accesoFinal = 1
        else:
            response = {
                'message': 'El acceso es publico o privado. Vuelva a intentar'}
            return jsonify(response)

        # Verificamos mediante la funcion login si el usuario existe
        function = loginForDeleteFiles(username, password)
        bandera = function[0]
        idUsuario = function[1]

        # Vamos a darle un nuevo uuid4 al archivo que vamos a agregar
        uniqueID = uuid.uuid4()
        newNameForFile = str(uniqueID) + "_" + nombreNuevo

        # Si el login devuelve verdadero, entonces invocamos el query para updatear archivos
        if bandera:
            query = 'CALL proyecto1.updateArchivo(%s, %s, %s, %s, 0)'
            params = [nombreArchivo, idUsuario, newNameForFile, accesoFinal]
            cur = connection.cursor()
            cur.execute(query, params)
            connection.commit()
            cur.close()
            connection.close()

            # Vamos a copiar el archivo viejo y renombrarlo en el s3
            copy_source = bucket_name + "/" + nombreArchivo
            s3Client.copy_object(Bucket=bucket_name,
                                 CopySource=copy_source, Key=newNameForFile)

            # Ahora borramos del s3 el archivo viejo definitivamente
            s3Client.delete_object(Bucket=bucket_name, Key=nombreArchivo)
            response = {'message': 'Archivo modificado con exito'}
            return jsonify(response)

        else:
            response = {'message': 'No se pudo modificar el archivo'}
            return jsonify(response)

    except Exception as e:
        print(e)
        response = {'message': 'No se pudo modificar el archivo'}
        return jsonify(response)


# AGREGAR AMIGOS
@app.route('/api/users/add/', methods=['POST'])
def addFriend():
    try:
        # Obtenemos los valores del json
        idUsuarioActual = request.json['idUsuarioActual']
        idAmigo = request.json['idAmigo']

        # Invocamos el query
        query = 'CALL proyecto1.addFriend(%s, %s, 0)'
        params = [idUsuarioActual, idAmigo]
        cur = connection.cursor()
        cur.execute(query, params)
        connection.commit()
        cur.close()
        response = {'message': 'Amigo agregado con exito'}
        return jsonify(response)

    except Exception as e:
        print(e)
        response = {'message': 'No se pudo agregar al amigo'}
        return jsonify(response)


# OBTENER TODOS LOS USUARIOS
@app.route('/api/users/all/<idUsuario>', methods=['GET'])
def getAllUser(idUsuario):
    try:
        # Invocamos al query
        query = 'SELECT * FROM proyecto1.getUsers(%s)'
        params = [idUsuario]
        cur = connection.cursor()
        cur.execute(query, params)
        connection.commit()
        rows = []
        for id, username, perfil, archivos in cur.fetchall():
            response = {}
            response['id'] = id
            response['username'] = username
            response['perfil'] = perfil
            response['archivos'] = archivos
            rows.append(response)
        cur.close()
        response2 = {'usuarios': rows}
        return jsonify(response2)
    except Exception as e:
        print(e)
        response = {
            'message': 'No se encontro nada relacionado al id ' + idUsuario}
        return jsonify(response)


# OBTENER ARCHIVOS PUBLICOS
@app.route('/api/file/public/<idUsuario>', methods=['GET'])
def getPublicFiles(idUsuario):
    try:
        # Invocamos el query para buscar los archivos publicos de los amigos agregados al usuario
        query = 'SELECT * FROM proyecto1.getArchivos(%s)'
        params = [idUsuario]
        cur = connection.cursor()
        cur.execute(query, params)
        connection.commit()
        rows = []
        for id, username, nombre, tipo, url in cur.fetchall():
            response = {}
            response['id'] = id
            response['nombre'] = nombre
            response['tipo'] = tipo
            response['url'] = url
            rows.append(response)
        cur.close()
        response2 = {'archivos': rows}
        return jsonify(response2)
    except Exception as e:
        print(e)
        response = {
            'message': 'No se pudo obtener los archivos publicos de los amigos del usuario ' + idUsuario}
        return jsonify(response)


# HEALTH CHECK
@app.route('/healthcheck', methods=['GET'])
def healthcheck():
    health = HealthCheck()
    response = {'message': health.run()}
    return jsonify(response)


if __name__ == '__main__':
    # Error Handlers
    app.register_error_handler(404, page_not_found)
    # Levantar el server
    app.run()