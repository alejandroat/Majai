# Instrucciones para configurar la base de datos PostgreSQL

## Opción 1: Usando pgAdmin o cualquier cliente PostgreSQL GUI
1. Conectarse a la base de datos `majai_db` como superusuario (postgres)
2. Ejecutar las siguientes consultas SQL:

```sql
GRANT ALL ON SCHEMA public TO majai_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO majai_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO majai_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO majai_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO majai_user;
```

## Opción 2: Usando línea de comandos
Busca la carpeta de instalación de PostgreSQL (comúnmente en `C:\Program Files\PostgreSQL\XX\bin\`) y ejecuta:

```bash
psql -U postgres -d majai_db -f setup_permissions.sql
```

## Opción 3: Usar el usuario postgres temporalmente
Si prefieres usar el usuario postgres temporalmente mientras configuras los permisos:

1. Modifica el archivo `.env` temporalmente:
```
DB_USER=postgres
DB_PASSWORD=tu_password_de_postgres
```

2. Ejecuta el servidor una vez para crear las tablas
3. Luego ejecuta los comandos SQL de la Opción 1
4. Vuelve a cambiar el `.env` a usar `majai_user`

## Verificar permisos
Para verificar que el usuario tiene los permisos correctos:
```sql
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_schema = 'public';
```
