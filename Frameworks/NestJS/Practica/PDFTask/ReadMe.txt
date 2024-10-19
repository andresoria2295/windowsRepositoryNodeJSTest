Método GET: 
-->Lectura de datos: http://localhost:3000/report/user (por web o Postman)

Query:	SELECT u."Nombre", u."Apellido", u."Fecha_Nacimiento", u."Email", 
      	c."Telefono", c."Domicilio", c."Ciudad", 
       	o."Titulo", o."Empresa", o."Fecha_Inicio"
	FROM "Usuario" u
	INNER JOIN "Contacto" c ON u."Id_Usuario" = c."Id_Usuario"
	LEFT JOIN "Ocupacion" o ON u."Id_Usuario" = o."Id_Usuario";


Método POST:
-->Inserción de datos: localhost:3000/report/user (en body -> raw)
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
        "fecha_inicio": null
    }
}

Método PUT:
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

Método PATCH:
-->Actualización de datos: localhost:3000/report/user/21 (en body -> raw)
Postman: {
    "domicilio": "Gutierrez 1480",
    "ciudad": "Luján - Mendoza"
}
