from db.db import get_connection
from .entities.Archivo import Archivo

class ArchivoModel():

    @classmethod
    def getArchivos(self):
        try:
            connection = get_connection
            archivos=[]

            with connection.cursor() as cursor:
                cursor.execute("SELECT id, nombre, url, tipo FROM Archivo")
                resultset = cursor.fetchall()

                for row in resultset:
                    archivo = Archivo(row[0], row[1], row[2], row[3])
                    archivos.append(archivo)

            connection.close()
            return archivos
        except Exception as ex:
            raise Exception(ex)