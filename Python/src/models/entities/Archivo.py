class Archivo():

    def __init__(self, id, nombre=None, url=None, tipo=None) -> None:
        self.id = id
        self.nombre = nombre
        self.url = url
        self.tipo = tipo

    def to_JSON(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'url': self.url,
            'tipo': self.tipo 
        }