/**
 * Migración: separa la colección `users` (monolítica) en
 *   persons + users + roles  (modelo relacional).
 *
 * - Idempotente: re-ejecutable sin duplicar (upsert de Persona por email).
 * - Conserva el _id de cada User (las facturas referencian userId).
 * - Crea los índices únicos y los roles semilla.
 * - Maneja errores por registro sin abortar toda la migración.
 *
 * Uso:  npm run migrate:personas
 */
const dns = require('dns');
// Mismo fix de DNS que main.ts (evita querySrv ECONNREFUSED con fe80::1)
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const mongoose = require('mongoose');

// Identificaciones conocidas por email (cédula real). El resto usa un placeholder.
const IDENTIFICATION_BY_EMAIL = {
  'josuisaac2002@gmail.com': '0504345927',
};

const DEFAULT_ROLES = [
  { name: 'admin', description: 'Administrador del sistema' },
  { name: 'manager', description: 'Gestor / supervisor' },
  { name: 'user', description: 'Usuario estándar' },
  { name: 'viewer', description: 'Solo lectura' },
];

async function main() {
  const uri = process.env.MONGO;
  if (!uri) {
    console.error('❌ Falta la variable MONGO en .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  console.log(`✅ Conectado a la base: ${db.databaseName}`);

  const usersCol = db.collection('users');
  const personasCol = db.collection('person');
  const rolesCol = db.collection('role');

  // 0a) Limpia índices obsoletos del modelo viejo (User tenía email/firstName).
  //     Si no, el índice único email_1 rechaza usuarios con email=null.
  const userIndexes = await usersCol.indexes();
  for (const idx of userIndexes) {
    if (
      idx.name !== '_id_' &&
      (idx.key.email !== undefined ||
        idx.key.firstName !== undefined ||
        idx.key.lastName !== undefined)
    ) {
      await usersCol.dropIndex(idx.name);
      console.log(`🧹 Índice obsoleto eliminado en users: ${idx.name}`);
    }
  }

  // 0) Índices únicos (no dependemos de que la app Nest haya arrancado)
  await personasCol.createIndex({ email: 1 }, { unique: true });
  await personasCol.createIndex({ identification: 1 }, { unique: true });
  await rolesCol.createIndex({ name: 1 }, { unique: true });
  console.log('✅ Índices únicos asegurados (person.email, person.identification, role.name)');

  // 1) Seed de roles (idempotente). updateOne+findOne evita depender de res.value.
  const roleIdByName = {};
  for (const r of DEFAULT_ROLES) {
    await rolesCol.updateOne(
      { name: r.name },
      { $setOnInsert: { ...r, createdAt: new Date(), updatedAt: new Date() } },
      { upsert: true },
    );
    const doc = await rolesCol.findOne({ name: r.name });
    roleIdByName[r.name] = doc._id;
  }
  console.log('✅ Roles asegurados:', Object.keys(roleIdByName).join(', '));

  // 2) Pre-scan: abortar si hay emails duplicados entre usuarios SIN migrar
  const dups = await usersCol
    .aggregate([
      { $match: { personaId: { $exists: false }, email: { $exists: true, $ne: '' } } },
      { $group: { _id: { $toLower: '$email' }, ids: { $push: '$_id' }, n: { $sum: 1 } } },
      { $match: { n: { $gt: 1 } } },
    ])
    .toArray();
  if (dups.length) {
    console.error('❌ Emails duplicados detectados; corrige antes de migrar:');
    console.error(JSON.stringify(dups, null, 2));
    await mongoose.disconnect();
    process.exit(1);
  }

  // 3) Migrar cada usuario "viejo"
  const users = await usersCol.find({}).toArray();
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const u of users) {
    if (u.personaId) {
      skipped++;
      continue; // ya migrado
    }

    const email = (u.email || '').toLowerCase();

    if (!email || !u.firstName || !u.lastName) {
      console.warn(
        `  ⚠ Omitido (datos incompletos): _id=${u._id} email='${email}' firstName='${u.firstName ?? ''}' lastName='${u.lastName ?? ''}'`,
      );
      skipped++;
      continue;
    }

    const identification =
      IDENTIFICATION_BY_EMAIL[email] || u.identification || `PENDIENTE-${u._id}`;

    try {
      // 3a) Upsert de Persona por email -> idempotente (re-run no duplica ni deja huérfanas)
      await personasCol.updateOne(
        { email },
        {
          $setOnInsert: {
            identification,
            firstName: u.firstName,
            lastName: u.lastName,
            email,
            phone: u.phone ?? null,
            profilePicture: u.profilePicture ?? null,
            tenantId: u.tenantId,
            createdAt: u.createdAt ?? new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
      const persona = await personasCol.findOne({ email });

      // 3b) Resolver rol (por el nombre string que tenía el user)
      const roleName = u.role || 'user';
      const rolId = roleIdByName[roleName] || roleIdByName['user'];

      // 3c) Transformar el User (mismo _id), moviendo datos a Persona
      await usersCol.updateOne(
        { _id: u._id },
        {
          $set: {
            username: (u.username || email).toLowerCase(),
            status: u.isActive === false ? 'inactive' : 'active',
            personaId: persona._id,
            rolId,
            updatedAt: new Date(),
          },
          $unset: {
            email: '',
            firstName: '',
            lastName: '',
            phone: '',
            profilePicture: '',
            role: '',
            isActive: '',
          },
        },
      );

      migrated++;
      console.log(
        `  → Migrado: ${email}  (persona ${persona._id}, rol ${roleName}, ident ${identification})`,
      );
    } catch (e) {
      errors++;
      console.error(`  ✗ Falló user ${u._id} (${email}): ${e.message}`);
    }
  }

  // 4) Índices únicos de users (ahora que ya tienen username/personaId)
  await usersCol.createIndex({ username: 1 }, { unique: true });
  await usersCol.createIndex({ personaId: 1 }, { unique: true });
  console.log('✅ Índices únicos de users asegurados (username, personaId)');

  console.log(
    `\n✅ Migración terminada. Migrados: ${migrated}, omitidos: ${skipped}, errores: ${errors}.`,
  );
  await mongoose.disconnect();
  process.exit(errors > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error('❌ Error en la migración:', err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
