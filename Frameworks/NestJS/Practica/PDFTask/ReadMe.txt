Método GET: 
-->Lectura de datos: http://localhost:3000/report/user (por web o Postman)

Método POST:
-->Inserción de datos: localhost:3000/report/user (en body -> raw)
Postman: {
  "nombre": "Juan",
  "apellido": "Pérez",
  "fecha_nacimiento": "1990-05-20",
  "email": "juan.perez@example.com",
  "contraseña": "password123",
  "telefono": "123456789",
  "domicilio": "Calle Falsa 123",
  "ciudad": "Ciudad X",
  "pais": "Argentina"
}

{
  "nombre": "Juan",
  "apellido": "Pérez",
  "fecha_nacimiento": "1990-05-20",
  "email": "juan.perez@example.com",
  "contraseña": "password123",
  "telefono": "123456789",
  "domicilio": "Calle Falsa 123",
  "ciudad": "Ciudad X",
  "pais": "Argentina",
  "ocupacion": {
    "titulo": "Desarrollador",
    "empresa": "Tech Solutions",
    "fecha_inicio": "2022-01-15"
  }
}
