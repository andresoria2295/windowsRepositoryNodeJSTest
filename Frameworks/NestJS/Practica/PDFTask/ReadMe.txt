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
-->NUEVA Inserción de datos: http://localhost:3000/user/create-user (en body -> form-data) (en header -> Content-Type application/json)
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

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Método DELETE file:
-->Eliminación de registro: http://localhost:3000/user/delete-user/126 (none)

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

------------------------------------------------------------------------------------------------------------------------------
Usuario: contiene los datos personales del usuario.
Ocupacion: contiene la relación de los usuarios con sus ocupaciones, vinculada con Empresa y Titulo mediante claves foráneas.
Empresa: contiene los datos específicos de cada empresa.
Titulo: contiene el tipo de título de cada usuario.
Empleo: es una tabla intermedia que conecta Usuario, Ocupacion y Empresa en un registro histórico.

------------------------------------------------------------------------------------------------------------------------------
Tabla Usuario
Id_Usuario (PK): ID único para cada usuario
Nombre: Nombre del usuario
Apellido: Apellido del usuario
Fecha_Nacimiento: Fecha de nacimiento del usuario
Email: Dirección de correo electrónico del usuario
Contraseña: Contraseña encriptada del usuario
Fecha_Creacion: Fecha de alta del usuario


Tabla Contacto
Id_Contacto (PK): ID único para cada contacto
Id_Usuario (FK): ID del usuario relacionado
Telefono: Número de teléfono del usuario
Domicilio: Dirección del usuario
Ciudad: Ciudad de residencia
Pais: País de residencia

Tabla Formacion
Id_Formacion (PK): ID único para cada formación o título
Nombre: Nombre del título o formación (ej. "Técnico Automotriz")
Descripcion:
Nivel: Tipo de estudios (ej. "Bachillerato", "Terciario")
Institucion: Institución donde se obtuvo el título
Duracion: Duración de formación
Fecha_Titulo: Fecha en que se obtuvo el título
Activo: Titulo adquirido y en mano
Identificador_archivo: UUID de archivo PDF

Tabla Empresa
Id_Empresa (PK): ID único para cada empresa
Nombre: Nombre de la empresa
Razon_Social: Nombre jurídico de la empresa
Direccion: Dirección de la empresa
Ciudad: Ciudad de residencia
Pais: País de residencia
Telefono: Teléfono de la empresa
Email: Correo electrónico de contacto de la empresa
Sitio_Web: Sitio web de la empresa
Industria: Sector/área en la que opera la empresa (ej. "Tecnología", "Educación", etc.)
Estado: Operando actualmente

Tabla Empleo
Id_Empleo (PK): ID único para cada registro de empleo
Id_Usuario (FK): ID del usuario relacionado
Id_Empresa (FK): ID de la empresa relacionada
Id_Formacion (FK): ID de la formación/título relacionado
Fecha_Inicio: Fecha en que el usuario comenzó a trabajar en la empresa
Fecha_Fin: Fecha en que el usuario terminó de trabajar en la empresa (opcional)
Posicion: Puesto o cargo del usuario en la empresa (ej. "Desarrollador")
Activo: Si el usuario está trabajando activamente

------------------------------------------------------------------------------------------------------------------------------
Datos Opcionales

Empleo:
fecha_fin: La fecha de fin del empleo puede ser opcional si el empleo aún está activo.
posicion: Puede ser opcional si no se desea especificarla al crear el usuario.
activo: Aunque se puede establecer un valor predeterminado (true), también podría omitirse.

Formación:
descripcion: Descripción de la formación, si es solo un breve texto explicativo.
identificador_archivo: Podría ser opcional si aún no se tiene un archivo relacionado con la formación.
fecha_titulo: Si aún no se ha obtenido un título o está en proceso, este campo puede ser opcional.

Empresa:
sitio_web: Puede ser opcional si no se desea especificar un sitio web.
telefono: Podría omitirse si no es relevante al momento.
industria: Si no se desea especificar la industria de la empresa inicialmente.

------------------------------------------------------------------------------------------------------------------------------

edificar una api diferente a la actual en la que se cree/guarde y recupere archivos. desde la actual hacer get y adquirir tal archivo 
respuesta de api 2: devolver un uuid esto es lo q guarda en la bd y se emplea para luego tener acceso y ver el pdf consultando a la api2. El pdf se guarda en disco 

arreglar las tablas de empresa y titulo. nombre de archivo = uuid (archivos por usuario) (mas de 1 archivo x usuario)(cada user una carpeta)

api de facturacion conectado con afip

carpeta report, carpeta user