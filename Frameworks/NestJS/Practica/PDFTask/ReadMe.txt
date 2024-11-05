Método GET: 
-->Lectura de datos: http://localhost:3000/report/user (por web o Postman) (en header -> Content-Type application/json)

Query:	SELECT u."Nombre", u."Apellido", u."Fecha_Nacimiento", u."Email", 
      	c."Telefono", c."Domicilio", c."Ciudad", 
       	o."Titulo", o."Empresa", o."Fecha_Inicio", o."Documentacion", o."Nombre_Archivo"
	FROM "Usuario" u
	INNER JOIN "Contacto" c ON u."Id_Usuario" = c."Id_Usuario"
	LEFT JOIN "Ocupacion" o ON u."Id_Usuario" = o."Id_Usuario";

	SELECT *FROM "Usuario";

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Método GET:
-->Lectura de PDF: Para visualizar: Solicitud GET a http://localhost:3000/report/user/54/pdf?mode=view  (en header -> Content-Type application/pdf)
	                 Para descargar: Solicitud GET a http://localhost:3000/report/user/54/download-pdf?mode=download (sin header)

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Método POST:
--> Inserción de datos con pdf file: http://localhost:3000/report/user/ (en body -> form-data) (en header -> Content-Type multipart/form-data)
Postman: {
{
    "nombre": "Ivana",
    "apellido": "Baena",
    "fecha_nacimiento": "1981-11-16",
    "email": "ivana.baena@gmail.com",
    "contraseña": "ivana.81",
    "telefono": "2617649135",
    "domicilio": "Bermejo 76",
    "ciudad": "Las Heras - Mendoza",
    "pais": "Argentina",
    "ocupacion": {
        "titulo": "Maestra mayor de Obras",
        "empresa": "Particular",
        "fecha_inicio": null,
        "archivo.pdf "
    }
}

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Método PUT:
--> Inserción de datos sin pdf file: http://localhost:3000/report/user/:id (en body -> raw) (en header -> Content-Type application/json)
{
    "Nombre": "Sergio",
    "Apellido": "Carbonero",
    "Fecha_Nacimiento": "1975-12-25T03:00:00.000Z",
    "Email": "s.carbonero@gmail.com",
    "Telefono": "2634697615",
    "Domicilio": "Yapeyu 41",
    "Ciudad": "Junin - Mendoza",
    "Ocupacion":{
        "Titulo": "Técnico Electricista",
        "Empresa": "Edeste",
        "Fecha_Inicio": "2016-03-01"
    }
  }

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Método PATCH:
-->Actualización de datos: localhost:3000/report/user/21 (en body -> raw) (en header -> Content-Type application/json)
Postman: {
    "domicilio": "Gutierrez 1480",
    "ciudad": "Luján - Mendoza"
}

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Método PATCH file:
-->Actualización de file: localhost:3000/report/user/21 (en body -> form-data) (en header -> Content-Type multipart/form-data)
Postman:
    key--> ocupacion[file]  value-->pdf file


-----------------------------------------------------------------------------------
Reportes de ocupaciones agrupadas por puestos (GET -> http://localhost:3000/report/occupations/grouped)(en header -> Content-Type application/json)

SELECT 
    o."Titulo",
    COUNT(u."Id_Usuario") AS cantidad_usuarios
FROM 
    "Ocupacion" o
JOIN 
    "Usuario" u ON o."Id_Usuario" = u."Id_Usuario"
GROUP BY 
    o."Titulo";

-----------------------------------------------------------------------------------
Reportes de ocupaciones agrupadas por puestos y empresas (GET --> http://localhost:3000/report/occupations/grouped-by-title-and-company)(en header -> Content-Type application/json)

SELECT 
    o."Titulo",
    o."Empresa",
    COUNT(u."Id_Usuario") AS cantidad_usuarios
FROM 
    "Ocupacion" o
JOIN 
    "Usuario" u ON o."Id_Usuario" = u."Id_Usuario"
GROUP BY 
    o."Titulo", o."Empresa";

-----------------------------------------------------------------------------------
Reporte de Usuarios por Ocupación (GET-->http://localhost:3000/report/users/occupation)(en header -> Content-Type application/json)

SELECT 
    u."Nombre",
    u."Apellido",
    o."Titulo",
    o."Empresa"
FROM 
    "Usuario" u
JOIN 
    "Ocupacion" o ON u."Id_Usuario" = o."Id_Usuario"
ORDER BY 
    o."Titulo";

-----------------------------------------------------------------------------------
Reportes de usuarios nuevos por mes

SELECT 
    DATE_TRUNC('month', u."Fecha_Creacion") AS mes,
    COUNT(*) AS cantidad_usuarios
FROM 
    "Usuario" u
GROUP BY 
    mes
ORDER BY 
    mes DESC;

-----------------------------------------------------------------------------------
Reporte de Ocupaciones Sin Documentación

SELECT 
    u."Nombre",
    u."Apellido",
    o."Titulo"
FROM 
    "Ocupacion" o
JOIN 
    "Usuario" u ON o."Id_Usuario" = u."Id_Usuario"
WHERE 
    o."Documentacion" IS NULL;


-----------------------------------------------------------------------------------
Reporte de Usuarios informales en la actualidad

SELECT 
    u."Nombre", 
    u."Apellido", 
    o."Titulo", 
    o."Empresa"
FROM 
    "Usuario" u
JOIN 
    "Ocupacion" o ON u."Id_Usuario" = o."Id_Usuario"
WHERE 
    o."Empresa" = 'Particular'
GROUP BY 
    u."Nombre", 
    u."Apellido", 
    o."Titulo", 
    o."Empresa";

-----------------------------------------------------------------------------------
Reporte de Usuarios informales desde que fueron matriculados (sin otras empresas registradas)

SELECT 
    u."Nombre", 
    u."Apellido"
FROM 
    "Usuario" u
JOIN 
    "Ocupacion" o ON u."Id_Usuario" = o."Id_Usuario"
GROUP BY 
    u."Id_Usuario"
HAVING 
    COUNT(CASE WHEN o."Empresa" <> 'Particular' THEN 1 END) = 0;  -- Solo cuenta los que no tienen otra empresa

-----------------------------------------------------------------------------------
Reporte de Usuarios mayores de 50 años

SELECT 
    u."Nombre", 
    u."Apellido", 
    u."Fecha_Nacimiento"
FROM 
    "Usuario" u
WHERE 
    DATE_PART('year', AGE(u."Fecha_Nacimiento")) > 45;

-----------------------------------------------------------------------------------
Reporte de Usuarios menores de 45 años
SELECT 
    u."Nombre", 
    u."Apellido", 
    u."Fecha_Nacimiento"
FROM 
    "Usuario" u
WHERE 
    DATE_PART('year', AGE(u."Fecha_Nacimiento")) <24;


-----------------------------------------------------------------------------------
Reporte de Usuarios que comenzaron a trabajar desde el año 2015

SELECT 
    u."Nombre", 
    u."Apellido", 
    o."Titulo", 
    o."Empresa", 
    o."Fecha_Inicio"
FROM 
    "Usuario" u
JOIN 
    "Ocupacion" o ON u."Id_Usuario" = o."Id_Usuario"
WHERE 
    o."Fecha_Inicio" > '2014-12-31'; 

-----------------------------------------------------------------------------------
Reporte de Usuarios que comenzaron a trabajar en la formalidad ordenados en forma creciente.

SELECT 
    u."Nombre", 
    u."Apellido", 
    o."Titulo", 
    o."Empresa", 
    o."Fecha_Inicio"
FROM 
    "Usuario" u
JOIN 
    "Ocupacion" o ON u."Id_Usuario" = o."Id_Usuario"
WHERE 
    o."Titulo" IS NOT NULL AND o."Empresa" IS NOT NULL  -- Filtra solo ocupaciones formales
ORDER BY 
    o."Fecha_Inicio" ASC; 







edificar una api diferente a la actual en la que se cree/guarde y recupere archivos. desde la actual hacer get y adquirir tal archivo 
respuesta de api 2: devolver un uuid esto es lo q guarda en la bd y se emplea para luego tener acceso y ver el pdf consultando a la api2. El pdf se guarda en disco 

arreglar las tablas de empresa y titulo. nombre de archivo = uuid (archivos por usuario) (mas de 1 archivo x usuario)(cada user una carpeta)

api de facturacion conectado con afip

carpeta report, carpeta user