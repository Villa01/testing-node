create or replace function proyecto1.getUsuario(user_in varchar)
    returns table (id int,  username varchar, email varchar, password varchar, perfil varchar)
as
$$
begin
    return query
        select u.id, u.username, u.email, u.password, u.perfil
        from proyecto1.usuario u
        where u.username = user_in
        order by u.id asc
        limit 1
        ;
end;
$$
LANGUAGE plpgsql
;




create or replace procedure proyecto1.addUsuario(username_p varchar, email_p varchar, password_p varchar, perfil_p varchar, inout ret integer)
as
$$
begin
    select count(*) into ret from proyecto1.usuario where username = username_p;

    IF ret > 0 THEN
        ret = 0;
        return;
    end if;

    insert into proyecto1.usuario (username, email, password, perfil)
    values (username_p, email_p, password_p, perfil_p);

    ret = 1;
    return;
end;
$$
LANGUAGE plpgsql
;




create or replace procedure proyecto1.addArchivo(name_p varchar, url_p varchar, tipo_p varchar, acceso_p int, user_p int, inout ret integer)
as
$$
begin
    select count(*) into ret from proyecto1.archivo where nombre = name_p and eliminado = 0;

    IF ret > 0 THEN
        ret = 0;
        return;
    end if;

    insert into proyecto1.archivo(nombre, url, tipo, acceso, eliminado, id_usuario)
    values (name_p, url_p, tipo_p, acceso_p, 0, user_p);

    ret = 1;
    return;
end;
$$
LANGUAGE plpgsql
;




create or replace procedure proyecto1.deleteArchivo(name_p varchar, user_p int, inout ret integer)
as
$$
begin
    select count(*) into ret from proyecto1.archivo where nombre = name_p and id_usuario = user_p and eliminado = 0;

    IF ret = 0 THEN
        ret = 0;
        return;
    end if;

    update proyecto1.archivo set eliminado = 1 where nombre = name_p and id_usuario = user_p;

    ret = 1;
    return;
end;
$$
LANGUAGE plpgsql
;




create or replace procedure proyecto1.updateArchivo(name1_p varchar, user_p int, name2_p varchar, acceso_p integer, inout ret integer)
as
$$
begin
    select count(*) into ret from proyecto1.archivo where nombre = name1_p and id_usuario = user_p and eliminado = 0;

    IF ret = 0 THEN
        return;
    end if;

    update proyecto1.archivo set nombre = name2_p, acceso = acceso_p where nombre = name1_p and id_usuario = user_p and eliminado = 0;

    ret = 1;
    return;
end;
$$
LANGUAGE plpgsql
;




create or replace function proyecto1.getArchivo(user_in int, tipo_in int)
    returns table (id int,  nombre varchar, url varchar, tipo varchar)
as
$$
begin
    IF tipo_in = 0 THEN
        return query
        select a.id, a.nombre, a.url, a.tipo
        from proyecto1.archivo a
        where a.id_usuario = user_in and acceso = 0 and eliminado = 0
        ;
    ELSEIF tipo_in = 1 THEN
        return query
        select a.id, a.nombre, a.url, a.tipo
        from proyecto1.archivo a
        where a.id_usuario = user_in and acceso = 1 and eliminado = 0
        ;
    ELSE
        return query
        select a.id, a.nombre, a.url, a.tipo
        from proyecto1.archivo a
        where a.id_usuario = user_in and eliminado = 0
        ;
    END IF;
end;
$$
LANGUAGE plpgsql
;




create or replace function proyecto1.getUsers(user_in int)
    returns table (id int,  username varchar, perfil varchar, archivos bigint)
as
$$
begin
    return query
        select u.id, u.username, u.perfil, count(a.id_usuario) archivos
        from proyecto1.usuario u
        full outer join proyecto1.archivo a on a.id_usuario = u.id
        where u.id <> user_in and u.id
        not in (select amigo from proyecto1.amigos
                where actual = user_in
               )
        group by u.id
    ;
end;
$$
LANGUAGE plpgsql
;




create or replace procedure proyecto1.addFriend(id1 int, id2 int, inout ret integer)
as
$$
begin

    select count(*) into ret from proyecto1.amigos where actual = id1 and amigo = id2;

    IF ret > 0 THEN
        ret = 0;
        return;
    end if;

    insert into proyecto1.amigos (actual, amigo) values (id1, id2);
    insert into proyecto1.amigos (actual, amigo) values (id2, id1);

    ret = 1;
    return;
end;
$$
LANGUAGE plpgsql
;




create or replace function proyecto1.getArchivos(user_in int)
    returns table (id int,  username varchar, nombreA varchar, tipoA varchar, urlA varchar)
as
$$
begin
    return query
        select u.id, u.username, a.nombre, a.tipo, a.url
        from proyecto1.amigos s
        inner join proyecto1.usuario u on u.id = s.amigo
        inner join proyecto1.archivo a on a.id_usuario = s.amigo
        where s.actual = user_in and a.eliminado = 0 and a.acceso = 0
    ;
end;
$$
LANGUAGE plpgsql
;