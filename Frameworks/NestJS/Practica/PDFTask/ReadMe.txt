Método GET: 
-->Lectura de datos: http://localhost:3000/user/get-user (por web o Postman) (en header -> Content-Type application/json)

Query: 	SELECT * FROM "Usuario" ORDER BY "Fecha_Creacion" DESC

QUERY DIRECTA: 	
SELECT 
    "u"."Id_Usuario",
    "u"."Nombre" AS "Usuario_Nombre",
    "u"."Apellido" AS "Usuario_Apellido",
    "u"."Fecha_Nacimiento",
    "u"."Email" AS "Usuario_Email",
    "u"."Fecha_Creacion" AS "Usuario_Fecha_Creacion",
    
    "c"."Telefono" AS "Contacto_Telefono",
    "c"."Domicilio" AS "Contacto_Domicilio",
    "c"."Ciudad" AS "Contacto_Ciudad",
    "c"."Pais" AS "Contacto_Pais",

    "f"."Nombre" AS "Formacion_Nombre",
    "f"."Descripcion" AS "Formacion_Descripcion",
    "f"."Nivel" AS "Formacion_Nivel",
    "f"."Institucion" AS "Formacion_Institucion",
    "f"."Duracion" AS "Formacion_Duracion",
    "f"."Fecha_Titulo" AS "Formacion_Fecha_Titulo",
    "f"."Activo" AS "Formacion_Activo",
    "f"."Identificador_Archivo" AS "Formacion_UUID",

    "e"."Nombre" AS "Empresa_Nombre",
    "e"."Razon_Social" AS "Empresa_Razon_Social",
    "e"."Direccion" AS "Empresa_Direccion",
    "e"."Ciudad" AS "Empresa_Ciudad",
    "e"."Pais" AS "Empresa_Pais",
    "e"."Telefono" AS "Empresa_Telefono",
    "e"."Email" AS "Empresa_Email",
    "e"."Sitio_Web" AS "Empresa_Sitio_Web",
    "e"."Industria" AS "Empresa_Industria",
    "e"."Estado" AS "Empresa_Estado",

    "em"."Fecha_Inicio" AS "Empleo_Fecha_Inicio",
    "em"."Fecha_Fin" AS "Empleo_Fecha_Fin",
    "em"."Posicion" AS "Empleo_Posicion",
    "em"."Activo" AS "Empleo_Activo"
FROM 
    "Usuario" AS "u"
LEFT JOIN 
    "Contacto" AS "c" ON "u"."Id_Usuario" = "c"."Id_Usuario"
LEFT JOIN 
    "Empleo" AS "em" ON "u"."Id_Usuario" = "em"."Id_Usuario"
LEFT JOIN 
    "Formacion" AS "f" ON "em"."Id_Formacion" = "f"."Id_Formacion"
LEFT JOIN 
    "Empresa" AS "e" ON "em"."Id_Empresa" = "e"."Id_Empresa"
WHERE 
    "u"."Id_Usuario" = 208;

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Método GET:
-->Lectura de PDF: Para visualizar: Solicitud GET a http://localhost:3000/report/user/54/pdf?mode=view  (en header -> Content-Type application/pdf)
	                 Para descargar: Solicitud GET a http://localhost:3000/report/user/54/download-pdf?mode=download (sin header)

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Método POST:
--> Inserción de datos con pdf file: http://localhost:3000/report/user/ (en body -> form-data) (en header -> Content-Type multipart/form-data)
-->NUEVA Inserción de datos: http://localhost:3000/user/create-user (en body -> form-data) (en header -> Content-Type application/json)
Postman: {
  "nombre": "Viviana",
  "apellido": "Arena",
  "fecha_nacimiento": "1965-09-29",
  "email": "viviana.arena@gmail.com",
  "contraseña": "viviana.77",
  "telefono": "2615402819",
  "domicilio": "Maipú 293",
  "ciudad": "Godoy Cruz - Mendoza",
  "pais": "Argentina",
  "formacion": {
    "nombre": "Técnica de Laboratorio",
    "descripcion": "",
    "nivel": "Terciario",
    "institucion": "Instituto Balseiro",
    "duracion": "4 años",
    "fecha_titulo": "1988-05-30",
    "activo": true,
    "identificador_archivo": "identificador819"
  },
  "empresa": {
    "nombre": "FUESMEN",
    "razon_social": "FUESMEN",
    "direccion": "Garibaldi 826",
    "ciudad": "Ciudad - Mendoza",
    "pais": "Argentina",
    "telefono": "2614201673",
    "email": "fuesmen@gmail.com",
    "sitio_web": "www.fuesmen.com",
    "industria": "",
    "estado": true
  },
  "empleo": {
    "fecha_inicio": "2003-02-25",
    "fecha_fin": "2022-11-30",
    "posicion": "Jefe de área",
    "activo": false
  }
}

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Método PUT:
--> Inserción de datos: http://localhost:3000/update-user/:id (en body -> raw) (en header -> Content-Type application/json)
{
  "nombre": "Estela",
  "apellido": "Cardenas",
  "fecha_nacimiento": "1968-12-01",
  "email": "estela.cardenas@gmail.com",
  "contraseña": "estela.68",
  "telefono": "26224753068",
  "domicilio": "Paramillos 536",
  "ciudad": "Tupungato - Mendoza",
  "pais": "Argentina",
  "formacion": {
    "nombre": "Técnica de Diagnóstico por Imágenes",
    "descripcion": "",
    "nivel": "Terciario",
    "institucion": "Instituto Valle de Uco",
    "duracion": "4 años",
    "fecha_titulo": "1993-07-27",
    "activo": true,
    "identificador_archivo": "identificador068"
  },
  "empresa": {
    "nombre": "Terrazas España",
    "razon_social": "Terrazas España SRL",
    "direccion": "España 826",
    "ciudad": "Godoy Cruz - Mendoza",
    "pais": "Argentina",
    "telefono": "2614201673",
    "email": "terrazas.españa@gmail.com",
    "sitio_web": "www.terrazasespaña.com",
    "industria": "",
    "estado": true
  },
  "empleo": {
    "fecha_inicio": "2003-02-25",
    "fecha_fin": "",
    "posicion": "Jefe de área",
    "activo": true
  }
}

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Método PATCH:
-->Actualización de datos: localhost:3000/user/update-user/fields/:id (en body -> raw) (en header -> Content-Type application/json)
Postman: {
  "usuario":{
    "nombre": "Micaela",
    "apellido": "Hernández",
    "fecha_nacimiento": "1996-09-19",
    "email": "micaela.hernandez@gmail.com",
    "contraseña": "micaela.96"
  },
  "contacto":{
    "telefono": "2615403171",
    "domicilio": "Perú 90",
    "ciudad": "Godoy Cruz - Mendoza",
    "pais": "Argentina"
  },
  "formacion": {
    "nombre": "Técnica en Diagnóstico por Imágenes",
    "descripcion": "",
    "nivel": "Terciario",
    "institucion": "UNC",
    "duracion": "4 años",
    "fecha_titulo": "2018-08-30",
    "activo": true,
    "identificador_archivo": "identificador171"
  },
  "empresa": {
    "nombre": "Radiología Mendoza",
    "razon_social": "Radiología MZA",
    "direccion": "España 1857",
    "ciudad": "Ciudad - Mendoza",
    "pais": "Argentina",
    "telefono": "2614208261",
    "email": "radiologia.mza@gmail.com",
    "sitio_web": "www.radiogmza.com",
    "industria": "Salud",
    "estado": true
  },
  "empleo": {
    "fecha_inicio": "2020-04-15",
    "fecha_fin": "",
    "posicion": "",
    "activo": true
  }
}

{
  "usuario":{
    "Fecha_Nacimiento": "1996-09-20",
    "contraseña": "micaela.96"
  }
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

nombre de archivo = uuid (archivos por usuario) (mas de 1 archivo x usuario)(cada user una carpeta)

solucion: en api1 cuando el cliente manda el archivo a guardar, se genera el uuid que se guarda en la bd y manda el archivo a la api2 que se guarde en disco. 

api de facturacion conectado con afip