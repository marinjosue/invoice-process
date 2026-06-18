# Diseño — Separación del modelo User en Persona / Usuario / Rol

Fecha: 2026-06-17
Proyecto: invoice-process-back-end (NestJS + Mongoose, MongoDB Atlas usado como BD relacional)

## Objetivo

Normalizar la colección monolítica `users` en tres entidades relacionadas, siguiendo
el modelo lógico oficial (`1_2_Modelo_Logico.puml`):

- **Persona** — datos personales (incluye `email`).
- **Usuario** — credenciales de acceso (ligado 1:1 a Persona, lleva `rolId`).
- **Rol** — catálogo de roles (`name` + `description`).

## Decisiones (acordadas con el usuario)

- `rolId` vive en **USER** (no en Persona), fiel al diagrama.
- `Role` = solo `name` + `description` (sin permisos). El guard compara por `name`.
- Login sigue siendo por **email** (el email vive en Persona).
- Se mantienen dos campos "extra" fuera del diagrama por necesidad del código:
  `Persona.profilePicture` y `User.resetPasswordToken/Expire`.

## Esquemas

### Persona (`personas`)
`identification` (único), `firstName`, `lastName`, `email` (único, lowercase),
`phone`, `profilePicture`, `tenantId` (→ Tenant), timestamps.

### User (`users`)
`username` (único, lowercase), `password` (select:false), `status` (`active`/`inactive`),
`personaId` (→ Persona, único = 1:1), `rolId` (→ Role),
`resetPasswordToken`, `resetPasswordExpire`, timestamps.
Métodos: `matchPassword`, `getResetPasswordToken`; hook `pre('save')` hashea password.

### Role (`roles`)
`name` (único), `description`. Semilla: admin, manager, user, viewer.

## Compatibilidad (clave)

Muchos controllers leen `req.user.tenantId._id` y `req.user.role`. Para no tocarlos,
`UsersService.findById()` devuelve un objeto **aplanado** (`FlatUser`) que expone
`tenantId` (poblado), `role` (nombre), `email`, `firstName`, etc. tomados de Persona/Role.
`jwt.strategy.validate()` devuelve ese objeto como `req.user`.

`findByEmail()` devuelve el documento Mongoose real (con persona+tenant+rol poblados y
password) para autenticación (`matchPassword`, `save`).

## Flujo de login

1. `findByEmail(email)` → Persona por email → User por personaId (poblado).
2. `matchPassword`. 3. `status === 'active'`. 4. Tenant (de la persona) activo.
5. JWT con `{ id: userId }`. Respuesta arma datos desde Persona + Role + Tenant.

## Archivos

Nuevos: `personas/` (schema, module), `roles/` (schema, service con seed, module),
`scripts/migrate-personas.js`.
Modificados: `users/schemas/user.schema.ts`, `users/users.service.ts`,
`users/users.module.ts`, `auth/auth.service.ts`, `auth/strategies/jwt.strategy.ts`,
`auth/dto/auth.dto.ts` (agrega `identification`, `phone`),
`settlements/settlements.service.ts` (populate anidado a Persona), `package.json`.
Sin cambios: profile.controller, roles.guard, get-user.decorator (compatibles vía FlatUser).

## Migración

Script idempotente (`npm run migrate:personas`): siembra roles, y por cada user "viejo"
crea su Persona, conserva el mismo `_id` del User (las facturas referencian `userId`),
mueve datos personales a Persona y setea `username`/`status`/`personaId`/`rolId`.
La cédula de Josue Marín (`josuisaac2002@gmail.com`) = `0504345927`.

## Verificación

Typecheck (`tsc --noEmit`) limpio. Pruebas manuales: login, register-user (admin),
perfil (GET/PUT/foto), subida de factura (tenant scoping), generación de reporte de liquidación.
