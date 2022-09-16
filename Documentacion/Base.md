# Funciones Utilizadas en la Base de Datos


## AddUsuario
Este procedimiento recibe como parametro el Username, Email, Contraseña, link de la imagen de perfil y un numero de retorno, Con estos parametros se crea un registro en la base de datos; en caso de ser exitosa retorna un 1, de lo contrario retorna un 0. 

```sql
CALL addUsuario('Usuario', 'usuario@email.com', 'encriptada', 'linkPefil', 0);
```


## GetUsuario
Esta función retorna una tabla con los principales datos del usuario que busca (id,  username, email, password, perfil), unicamente recibiendo como parametro el username del usuario.

```sql
SELECT * FROM getUsuario('Usuario');
```


## addArchivo
Este procedimiento recibe como parametro el nombre del archivo, url del archivo, tipo del archivo, acceso del archivo, id del usuario al que pertenece y un numero de retorno, Con estos parametros se crea un registro en la base de datos; en caso de ser exitosa retorna un 1, de lo contrario retorna un 0. 

```sql
CALL addArchivo('archivo', 'dirArchivo', 'jpg', 1, 12, 0);
```


## deleteArchivo
Este procedimiento recibe como parametro el nombre del archivo, id del usuario al que pertenece y un numero de retorno, Con estos parametros se elimina un registro logicamente en la base de datos; en caso de ser exitosa retorna un 1, de lo contrario retorna un 0. 

```sql
CALL deleteArchivo('archivo', 12, 0);
```


## updateArchivo
Este procedimiento recibe como parametro el nombre anterior del archivo, id del usuario al que pertenece, el nuevo nombre, el nuevo acceso y un numero de retorno, Con estos parametros se actualiza un registro en la base de datos; en caso de ser exitosa retorna un 1, de lo contrario retorna un 0. 

```sql
CALL updateArchivo('archivo', 12, 'nuevoArchivo', 1, 0);
```


## GetArchivo
Esta función retorna una tabla con los principales datos de los archivos del usuario que busca (id del archivo, nombre del archivo, url del archivo y acceso del archivo), unicamente recibiendo como parametro el username del usuario y el acceso requerido.

```sql
SELECT * FROM getArchivo('Usuario');
```


## getUsers
Esta función retorna una tabla con los principales datos de los usuarios disponibles para agregar como amigos (id, username, ulr de la imagen de perfil y cantidad de archivos que posee), unicamente recibiendo como parametro el id del usuario logeado actualmente.

```sql
SELECT * FROM getUsers(12);
```



## addFriend
Este procedimiento recibe como parametro el id del usuario actual, id del amigo que desea agregar y un numero de retorno, Con estos parametros se agrega un registro en la base de datos; en caso de ser exitosa retorna un 1, de lo contrario retorna un 0. 

```sql
CALL addFriend(12, 8, 0);
```


## getArchivos
Esta función retorna una tabla con los principales datos de los archivos publicos de los amigos (id, username, nombre del archivo, tipo del archivo y url del archivo), unicamente recibiendo como parametro el id del usuario logeado actualmente.

```sql
SELECT * FROM getArchivos(12);
```