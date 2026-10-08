-- Создаём базу данных
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'CosmetologyCenterDB')
    CREATE DATABASE CosmetologyCenterDB;
GO

USE CosmetologyCenterDB;
GO

-- Создаём логин и пользователя
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'skincode_user')
    CREATE LOGIN skincode_user WITH PASSWORD = 'SkinCode2025!';
GO

IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'skincode_user')
BEGIN
    CREATE USER skincode_user FOR LOGIN skincode_user;
    ALTER ROLE db_datareader ADD MEMBER skincode_user;
    ALTER ROLE db_datawriter ADD MEMBER skincode_user;
    ALTER ROLE db_ddladmin ADD MEMBER skincode_user;
    GRANT EXECUTE TO skincode_user;
END
GO
