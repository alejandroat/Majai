# Documentación API Majai - Sistema de Alquiler de Vestidos

**Versión:** 1.0.0  
**Autor:** Alejandro Agudelo Toro  
**Descripción:** API RESTful para la gestión de alquiler de vestidos y control de inventario

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Tecnologías Utilizadas](#tecnologías-utilizadas)
3. [Configuración del Proyecto](#configuración-del-proyecto)
4. [Modelos de Datos](#modelos-de-datos)
5. [Autenticación](#autenticación)
6. [Endpoints de la API](#endpoints-de-la-api)
7. [Ejemplos de Uso](#ejemplos-de-uso)
8. [Códigos de Estado HTTP](#códigos-de-estado-http)
9. [Manejo de Errores](#manejo-de-errores)

---

## Introducción

La API de Majai es un sistema backend desarrollado para gestionar el alquiler de vestidos. Permite administrar el inventario de prendas, controlar arrendamientos con validación de disponibilidad por fechas, gestionar usuarios y generar códigos QR para cada prenda.

### Características Principales

- ✅ Autenticación mediante JWT (JSON Web Tokens)
- ✅ CRUD completo para Usuarios, Inventario y Arrendamientos
- ✅ Validación de disponibilidad de prendas por fechas
- ✅ Arrendamientos con duración fija de 1 semana
- ✅ Generación de códigos QR para inventario
- ✅ Relaciones entre modelos (Inventario ↔ Arrendamiento)
- ✅ Integración con Cloudinary para imágenes

---

## Tecnologías Utilizadas

### Backend Framework
- **Node.js** - Entorno de ejecución
- **Express.js v5.2.1** - Framework web

### Base de Datos
- **PostgreSQL** - Base de datos relacional
- **Sequelize v6.37.7** - ORM (Object-Relational Mapping)

### Autenticación y Seguridad
- **bcrypt v6.0.0** - Encriptación de contraseñas
- **jsonwebtoken v9.0.3** - Generación y validación de tokens JWT

### Utilidades
- **qrcode v1.5.4** - Generación de códigos QR
- **cloudinary v1.41.3** - Almacenamiento de imágenes
- **multer v2.0.2** - Manejo de archivos
- **cors v2.8.5** - Control de acceso entre dominios
- **dotenv v17.2.3** - Variables de entorno

### Desarrollo
- **nodemon v3.1.11** - Recarga automática en desarrollo

---

## Configuración del Proyecto

### Variables de Entorno (.env)

```env
# Puerto del servidor
PORT=4000

# Configuración de Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=majai_db
DB_USER=majai_user
DB_PASSWORD=majai123

# JWT
JWT_SECRET=mi_super_secreto
JWT_EXPIRES_IN=1d

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar en desarrollo
npm run dev

# Ejecutar en producción
npm start
```

### Estructura del Proyecto

```
Backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Configuración de Sequelize
│   │   └── cloudinary.js        # Configuración de Cloudinary
│   ├── controllers/
│   │   ├── auth.controller.js   # Autenticación
│   │   ├── user.controller.js   # Gestión de usuarios
│   │   ├── inventario.controller.js
│   │   └── arrendamiento.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js   # Verificación de JWT
│   ├── models/
│   │   ├── index.js            # Punto de entrada de modelos
│   │   ├── User.js             # Modelo de Usuario
│   │   ├── inventario.js       # Modelo de Inventario
│   │   └── arrendamiento.js    # Modelo de Arrendamiento
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── inventario.routes.js
│   │   └── arrendamiento.routes.js
│   ├── utils/
│   │   ├── generateToken.js    # Generación de JWT
│   │   └── generateqr.js       # Generación de QR
│   ├── seeders/
│   │   └── user.seeder.js
│   ├── app.js
│   └── server.js               # Punto de entrada
├── package.json
└── .env
```

---

## Modelos de Datos

### 1. Usuario (User)

Modelo para la gestión de usuarios del sistema.

**Campos:**
- `id` (INTEGER, PK, AUTO_INCREMENT) - Identificador único
- `name` (STRING, REQUIRED) - Nombre completo
- `user` (STRING, REQUIRED, UNIQUE) - Nombre de usuario
- `password` (STRING, REQUIRED) - Contraseña encriptada
- `createdAt` (TIMESTAMP) - Fecha de creación
- `updatedAt` (TIMESTAMP) - Fecha de actualización

### 2. Inventario

Modelo para la gestión de prendas disponibles para alquiler.

**Campos:**
- `id` (INTEGER, PK, AUTO_INCREMENT) - Identificador único
- `codigo` (STRING, REQUIRED) - Código de la prenda (ej: VQ 105)
- `descripcion` (STRING, REQUIRED) - Descripción de la prenda
- `ocasion` (STRING, OPTIONAL) - Tipo de ocasión (Quince años, Boda, etc.)
- `genero` (STRING, OPTIONAL) - Género (Femenino, Masculino, Unisex)
- `color` (STRING, OPTIONAL) - Color de la prenda
- `talla` (STRING, OPTIONAL) - Talla
- `estado` (BOOLEAN, REQUIRED) - Disponibilidad (true = disponible, false = alquilado)
- `imagenURL` (STRING, OPTIONAL) - URL de la imagen en Cloudinary
- `createdAt` (TIMESTAMP) - Fecha de creación
- `updatedAt` (TIMESTAMP) - Fecha de actualización

### 3. Arrendamiento

Modelo para la gestión de alquileres de prendas.

**Campos:**
- `id` (INTEGER, PK, AUTO_INCREMENT) - Identificador único
- `fechaInicio` (DATE, REQUIRED) - Fecha de inicio del arrendamiento
- `fechaFin` (DATE, REQUIRED) - Fecha de fin (automática: inicio + 7 días)
- `idInventario` (INTEGER, FK, REQUIRED) - Referencia al inventario
- `NombreCliente` (STRING, REQUIRED) - Nombre del cliente
- `telefonoCliente` (STRING, REQUIRED) - Teléfono del cliente
- `identificacionCliente` (STRING, REQUIRED) - Documento de identidad

**Nota:** No utiliza timestamps (createdAt/updatedAt)

### Relaciones entre Modelos

```
Inventario (1) ←→ (N) Arrendamiento
```

- Un **Inventario** puede tener múltiples **Arrendamientos**
- Un **Arrendamiento** pertenece a un único **Inventario**

**Relación definida en `/src/models/index.js`:**

```javascript
// Arrendamiento pertenece a Inventario
Arrendamiento.belongsTo(Inventario, {
    foreignKey: 'idInventario',
    as: 'inventario'
});

// Inventario tiene muchos Arrendamientos
Inventario.hasMany(Arrendamiento, {
    foreignKey: 'idInventario',
    as: 'arrendamientos'
});
```

---

## Autenticación

La API utiliza **JWT (JSON Web Tokens)** para la autenticación.

### Flujo de Autenticación

1. El cliente envía credenciales (`user` y `password`) al endpoint `/api/auth/login`
2. El servidor valida las credenciales
3. Si son correctas, genera un token JWT
4. El cliente incluye el token en el header `Authorization` de las peticiones protegidas

### Formato del Token

```
Authorization: Bearer <token>
```

### Endpoints Protegidos

Los siguientes endpoints requieren autenticación:
- `GET /api/users/listar`
- `GET /api/users/ver/:id`
- `PUT /api/users/actualizar/:id`
- `DELETE /api/users/eliminar/:id`

---

## Endpoints de la API

### Base URL

```
http://localhost:4000/api
```

---

## 🔐 Autenticación

### POST /api/auth/login

Inicia sesión y obtiene un token JWT.

**Request Body:**
```json
{
    "user": "admin",
    "password": "mipassword"
}
```

**Response (200 OK):**
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "name": "Administrador",
        "user": "admin"
    }
}
```

**Errores:**
- `400` - Faltan credenciales
- `401` - Credenciales inválidas

### POST /api/auth/logout

Cierra sesión (el cliente debe eliminar el token).

**Response (200 OK):**
```json
{
    "message": "Sesión cerrada correctamente"
}
```

---

## 👤 Gestión de Usuarios

### POST /api/users/crear

Crea un nuevo usuario.

**Request Body:**
```json
{
    "name": "Juan Pérez",
    "user": "juanp",
    "password": "password123"
}
```

**Response (201 Created):**
```json
{
    "id": 2,
    "name": "Juan Pérez",
    "user": "juanp",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### GET /api/users/listar

🔒 **Requiere autenticación**

Lista todos los usuarios.

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "name": "Administrador",
        "user": "admin",
        "createdAt": "2025-12-01T00:00:00.000Z",
        "updatedAt": "2025-12-01T00:00:00.000Z"
    }
]
```

### GET /api/users/ver/:id

🔒 **Requiere autenticación**

Obtiene un usuario por ID.

**Response (200 OK):**
```json
{
    "id": 1,
    "name": "Administrador",
    "user": "admin",
    "createdAt": "2025-12-01T00:00:00.000Z",
    "updatedAt": "2025-12-01T00:00:00.000Z"
}
```

**Errores:**
- `404` - Usuario no encontrado

### PUT /api/users/actualizar/:id

🔒 **Requiere autenticación**

Actualiza un usuario.

**Request Body:**
```json
{
    "name": "Nuevo Nombre",
    "password": "nuevapassword"
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "name": "Nuevo Nombre",
    "user": "admin",
    "updatedAt": "2026-01-01T12:00:00.000Z"
}
```

### DELETE /api/users/eliminar/:id

🔒 **Requiere autenticación**

Elimina un usuario.

**Response (200 OK):**
```json
{
    "message": "Usuario eliminado correctamente"
}
```

---

## 👗 Gestión de Inventario

### POST /api/inventario/crear

Crea un nuevo item de inventario.

**Request Body:**
```json
{
    "codigo": "VQ 105",
    "descripcion": "Vestido para quince años",
    "ocasion": "Quince años",
    "genero": "Femenino",
    "color": "Verde",
    "talla": "35",
    "estado": true,
    "imagenURL": "https://cloudinary.com/..."
}
```

**Response (201 Created):**
```json
{
    "id": 1,
    "codigo": "VQ 105",
    "descripcion": "Vestido para quince años",
    "ocasion": "Quince años",
    "genero": "Femenino",
    "color": "Verde",
    "talla": "35",
    "estado": true,
    "imagenURL": "https://cloudinary.com/...",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### GET /api/inventario/listar

Lista todo el inventario.

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "codigo": "VQ 105",
        "descripcion": "Vestido para quince años",
        "ocasion": "Quince años",
        "genero": "Femenino",
        "color": "Verde",
        "talla": "35",
        "estado": true,
        "imagenURL": "https://cloudinary.com/...",
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
    }
]
```

### GET /api/inventario/ver/:id

Obtiene un item de inventario por ID.

**Response (200 OK):**
```json
{
    "id": 1,
    "codigo": "VQ 105",
    "descripcion": "Vestido para quince años",
    "ocasion": "Quince años",
    "genero": "Femenino",
    "color": "Verde",
    "talla": "35",
    "estado": true,
    "imagenURL": "https://cloudinary.com/..."
}
```

**Errores:**
- `404` - No encontrado

### PUT /api/inventario/editar/:id

Actualiza un item de inventario.

**Request Body:**
```json
{
    "descripcion": "Nueva descripción",
    "color": "Azul",
    "estado": false
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "codigo": "VQ 105",
    "descripcion": "Nueva descripción",
    "color": "Azul",
    "estado": false,
    "updatedAt": "2026-01-01T12:00:00.000Z"
}
```

### DELETE /api/inventario/eliminar/:id

Elimina un item de inventario.

**Response (200 OK):**
```json
{
    "message": "Eliminado correctamente"
}
```

---

## 📅 Gestión de Arrendamientos

### POST /api/arrendamiento/crear

Crea un nuevo arrendamiento.

**Características:**
- ✅ Duración automática de **1 semana** (7 días)
- ✅ Valida disponibilidad del inventario
- ✅ Verifica que no existan arrendamientos en conflicto
- ✅ Marca el inventario como no disponible

**Request Body:**
```json
{
    "fechaInicio": "2026-01-15",
    "idInventario": 1,
    "NombreCliente": "Juliana Gómez",
    "telefonoCliente": "3521562255",
    "identificacionCliente": "1052147896"
}
```

**Response (201 Created):**
```json
{
    "id": 1,
    "fechaInicio": "2026-01-15T00:00:00.000Z",
    "fechaFin": "2026-01-22T00:00:00.000Z",
    "idInventario": 1,
    "NombreCliente": "Juliana Gómez",
    "telefonoCliente": "3521562255",
    "identificacionCliente": "1052147896"
}
```

**Errores:**
- `404` - Inventario no encontrado
- `400` - Inventario no disponible
- `400` - Ya existe un arrendamiento para estas fechas

### GET /api/arrendamiento/listar

Lista todos los arrendamientos con información del inventario.

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "fechaInicio": "2026-01-15T00:00:00.000Z",
        "fechaFin": "2026-01-22T00:00:00.000Z",
        "idInventario": 1,
        "NombreCliente": "Juliana Gómez",
        "telefonoCliente": "3521562255",
        "identificacionCliente": "1052147896",
        "inventario": {
            "id": 1,
            "codigo": "VQ 105",
            "descripcion": "Vestido para quince años",
            "estado": false
        }
    }
]
```

### GET /api/arrendamiento/ver/:id

Obtiene un arrendamiento específico por ID.

**Response (200 OK):**
```json
{
    "id": 1,
    "fechaInicio": "2026-01-15T00:00:00.000Z",
    "fechaFin": "2026-01-22T00:00:00.000Z",
    "NombreCliente": "Juliana Gómez",
    "inventario": {
        "id": 1,
        "codigo": "VQ 105",
        "descripcion": "Vestido para quince años"
    }
}
```

### GET /api/arrendamiento/vestido/:id

Obtiene todos los arrendamientos **vigentes** (no finalizados) de un vestido específico.

**Características:**
- Solo muestra arrendamientos con `fechaFin >= fecha actual`
- Ordenados cronológicamente
- No duplica información del inventario en cada arrendamiento

**Response (200 OK):**
```json
{
    "inventario": {
        "id": 1,
        "codigo": "VQ 105",
        "descripcion": "Vestido para quince años",
        "ocasion": "Quince años",
        "genero": "Femenino",
        "color": "Verde",
        "talla": "35",
        "estado": false,
        "imagenURL": "https://cloudinary.com/..."
    },
    "arrendamientos": [
        {
            "id": 1,
            "fechaInicio": "2026-01-15T00:00:00.000Z",
            "fechaFin": "2026-01-22T00:00:00.000Z",
            "NombreCliente": "Juliana Gómez",
            "telefonoCliente": "3521562255",
            "identificacionCliente": "1052147896"
        },
        {
            "id": 2,
            "fechaInicio": "2026-01-25T00:00:00.000Z",
            "fechaFin": "2026-02-01T00:00:00.000Z",
            "NombreCliente": "María López",
            "telefonoCliente": "3001234567",
            "identificacionCliente": "1098765432"
        }
    ],
    "total": 2
}
```

### PUT /api/arrendamiento/editar/:id

Actualiza un arrendamiento.

**Características:**
- Si se marca como `finalizado`, libera automáticamente el inventario

**Request Body:**
```json
{
    "NombreCliente": "Juliana Gómez Pérez",
    "telefonoCliente": "3521562256"
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "fechaInicio": "2026-01-15T00:00:00.000Z",
    "fechaFin": "2026-01-22T00:00:00.000Z",
    "NombreCliente": "Juliana Gómez Pérez",
    "telefonoCliente": "3521562256"
}
```

### DELETE /api/arrendamiento/eliminar/:id

Elimina un arrendamiento.

**Características:**
- Libera automáticamente el inventario asociado

**Response (200 OK):**
```json
{
    "message": "Arrendamiento eliminado correctamente"
}
```

### POST /api/arrendamiento/finalizar/:id

Finaliza un arrendamiento y devuelve el inventario.

**Response (200 OK):**
```json
{
    "message": "Arrendamiento finalizado correctamente",
    "arrendamiento": {
        "id": 1,
        "estado": "finalizado"
    }
}
```

**Errores:**
- `404` - Arrendamiento no encontrado
- `400` - El arrendamiento ya está finalizado

---

## 🔧 Utilidades

### Generación de Códigos QR

La API incluye utilidades para generar códigos QR que apuntan a rutas de inventario.

**Ubicación:** `/src/utils/generateqr.js`

**Funciones disponibles:**

#### 1. `generateInventoryQR(id, baseURL)`

Genera un QR para un item de inventario específico.

```javascript
const { generateInventoryQR } = require('./utils/generateqr');

// Genera QR que apunta a: http://localhost:4000/inventario/ver/1
const qrCode = await generateInventoryQR(1, 'http://localhost:4000');
```

**Retorna:** Data URL en base64 (imagen PNG)

#### 2. `generateQRFromURL(url)`

Genera un QR para cualquier URL.

```javascript
const { generateQRFromURL } = require('./utils/generateqr');

const qrCode = await generateQRFromURL('https://majai.com/vestido/123');
```

#### 3. `generateQRBuffer(url)`

Genera un QR como buffer (útil para guardar archivos).

```javascript
const { generateQRBuffer } = require('./utils/generateqr');

const buffer = await generateQRBuffer('https://majai.com');
// Guardar en archivo
fs.writeFileSync('qr.png', buffer);
```

**Configuración del QR:**
- Nivel de corrección de errores: `M` (Medium)
- Formato: PNG
- Tamaño: 300x300px
- Margen: 1

---

## Ejemplos de Uso

### Ejemplo 1: Flujo completo de autenticación

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        user: 'admin',
        password: 'mipassword'
    })
});

const { token } = await loginResponse.json();

// 2. Usar el token en peticiones protegidas
const usersResponse = await fetch('http://localhost:4000/api/users/listar', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});

const users = await usersResponse.json();
```

### Ejemplo 2: Crear un arrendamiento

```javascript
const response = await fetch('http://localhost:4000/api/arrendamiento/crear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        fechaInicio: '2026-02-15',
        idInventario: 5,
        NombreCliente: 'Ana María Rodríguez',
        telefonoCliente: '3102456789',
        identificacionCliente: '1087654321'
    })
});

const arrendamiento = await response.json();
// fechaFin será automáticamente: 2026-02-22
```

### Ejemplo 3: Verificar disponibilidad de un vestido

```javascript
// Obtener todos los arrendamientos vigentes de un vestido
const response = await fetch('http://localhost:4000/api/arrendamiento/vestido/5');
const { inventario, arrendamientos } = await response.json();

if (arrendamientos.length > 0) {
    console.log('Próximas fechas ocupadas:');
    arrendamientos.forEach(a => {
        console.log(`${a.fechaInicio} - ${a.fechaFin}: ${a.NombreCliente}`);
    });
}
```

### Ejemplo 4: Generar QR para un vestido

```javascript
const { generateInventoryQR } = require('./src/utils/generateqr');

// Generar QR
const qrDataURL = await generateInventoryQR(5, 'http://localhost:4000');

// En un endpoint de Express:
app.get('/inventario/:id/qr', async (req, res) => {
    const qr = await generateInventoryQR(req.params.id, 'http://localhost:4000');
    // qr es una imagen en base64, puedes enviarla directamente
    res.json({ qr });
});
```

---

## Códigos de Estado HTTP

La API utiliza los siguientes códigos de estado:

| Código | Significado | Cuándo se usa |
|--------|-------------|---------------|
| 200 | OK | Petición exitosa (GET, PUT, DELETE) |
| 201 | Created | Recurso creado exitosamente (POST) |
| 400 | Bad Request | Datos inválidos o faltantes |
| 401 | Unauthorized | Credenciales inválidas o token faltante |
| 404 | Not Found | Recurso no encontrado |
| 500 | Internal Server Error | Error del servidor |

---

## Manejo de Errores

Todos los errores siguen el siguiente formato:

```json
{
    "message": "Descripción del error"
}
```

### Ejemplos de Errores Comunes

**Autenticación fallida:**
```json
{
    "message": "Invalid credentials"
}
```

**Recurso no encontrado:**
```json
{
    "message": "No encontrado"
}
```

**Inventario no disponible:**
```json
{
    "message": "El inventario no está disponible para arrendamiento"
}
```

**Conflicto de fechas:**
```json
{
    "message": "Ya existe un arrendamiento para este inventario en las fechas seleccionadas",
    "arrendamientoExistente": { ... }
}
```

---

## Reglas de Negocio

### Arrendamientos

1. **Duración fija:** Todos los arrendamientos tienen una duración de exactamente 7 días (1 semana)
2. **Validación de conflictos:** No se permite crear arrendamientos que se solapen en fechas para el mismo inventario
3. **Control de disponibilidad:** 
   - Cuando se crea un arrendamiento, el inventario se marca como no disponible (`estado = false`)
   - Cuando se finaliza o elimina, el inventario vuelve a estar disponible (`estado = true`)
4. **Arrendamientos vigentes:** Solo se muestran arrendamientos cuya `fechaFin >= fecha actual`

### Inventario

1. **Estado booleano:**
   - `true` = Disponible para alquiler
   - `false` = Actualmente alquilado
2. **Código único:** Cada prenda tiene un código identificador único (ej: VQ 105)

### Usuarios

1. **Nombre de usuario único:** No pueden existir dos usuarios con el mismo `user`
2. **Contraseñas encriptadas:** Todas las contraseñas se almacenan con bcrypt
3. **Token JWT:** Expira según la configuración `JWT_EXPIRES_IN` (por defecto: 1 día)

---

## Notas Adicionales

### Sincronización de Base de Datos

Al iniciar el servidor, Sequelize sincroniza automáticamente los modelos con la base de datos:

```javascript
await db.sequelize.sync({ alter: true });
```

**Opciones disponibles:**
- `{ force: true }` - Elimina y recrea todas las tablas (⚠️ PIERDE DATOS)
- `{ alter: true }` - Modifica las tablas para que coincidan con los modelos
- Sin opciones - Solo crea tablas que no existan

### Desarrollo vs Producción

**En desarrollo:**
```bash
npm run dev  # Usa nodemon para recarga automática
```

**En producción:**
```bash
npm start    # Ejecuta con Node.js estándar
```

### CORS

La API tiene CORS habilitado para todas las peticiones. Modifica `/src/server.js` para restringir dominios:

```javascript
app.use(cors({
    origin: 'https://tu-frontend.com'
}));
```

---

## Contacto y Soporte

**Autor:** Alejandro Agudelo Toro  
**Proyecto:** Majai - Sistema de Alquiler de Vestidos  
**Versión:** 1.0.0  
**Licencia:** ISC

---

**Última actualización:** 1 de enero de 2026
