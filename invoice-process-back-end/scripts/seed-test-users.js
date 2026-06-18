/**
 * Crea usuarios de prueba (uno por rol) para diferenciar permisos.
 * Idempotente: re-ejecutable sin duplicar (upsert por email/username).
 * Todos comparten el mismo tenant que el admin y la contraseña TEST_PASSWORD.
 *
 * Uso:  npm run seed:test-users
 */
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const TEST_PASSWORD = 'Test1234';

const TEST_USERS = [
  { role: 'manager', firstName: 'María', lastName: 'Gerente', email: 'manager@test.com', identification: '1000000001' },
  { role: 'user', firstName: 'Carlos', lastName: 'Usuario', email: 'user@test.com', identification: '1000000002' },
  { role: 'viewer', firstName: 'Lucía', lastName: 'Lector', email: 'viewer@test.com', identification: '1000000003' },
];

async function main() {
  await mongoose.connect(process.env.MONGO);
  const db = mongoose.connection.db;
  console.log(`✅ Conectado a: ${db.databaseName}`);

  const usersCol = db.collection('users');
  const personCol = db.collection('person');
  const roleCol = db.collection('role');
  const tenantsCol = db.collection('tenants');

  // Limpia índices obsoletos del modelo viejo (User tenía email/firstName, ya movidos a Person).
  // Si no, el índice único email_1 rechaza usuarios con email=null.
  const userIndexes = await usersCol.indexes();
  for (const idx of userIndexes) {
    if (
      idx.name !== '_id_' &&
      (idx.key.email !== undefined ||
        idx.key.firstName !== undefined ||
        idx.key.lastName !== undefined)
    ) {
      await usersCol.dropIndex(idx.name);
      console.log(`  🧹 Índice obsoleto eliminado en users: ${idx.name}`);
    }
  }

  // Índices únicos por si faltan
  await personCol.createIndex({ email: 1 }, { unique: true });
  await personCol.createIndex({ identification: 1 }, { unique: true });
  await usersCol.createIndex({ username: 1 }, { unique: true });
  await usersCol.createIndex({ personaId: 1 }, { unique: true });

  const tenant = await tenantsCol.findOne({});
  if (!tenant) {
    console.error('❌ No hay ningún tenant en la base.');
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`🏢 Tenant: ${tenant.name} (${tenant._id})`);

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(TEST_PASSWORD, salt);

  for (const t of TEST_USERS) {
    const role = await roleCol.findOne({ name: t.role });
    if (!role) {
      console.error(`  ✗ Rol '${t.role}' no existe; omitido`);
      continue;
    }
    const email = t.email.toLowerCase();

    await personCol.updateOne(
      { email },
      {
        $set: {
          identification: t.identification,
          firstName: t.firstName,
          lastName: t.lastName,
          email,
          phone: null,
          profilePicture: null,
          tenantId: tenant._id,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
    const person = await personCol.findOne({ email });

    await usersCol.updateOne(
      { username: email },
      {
        $set: {
          username: email,
          password: hash,
          status: 'active',
          personaId: person._id,
          rolId: role._id,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
          resetPasswordToken: null,
          resetPasswordExpire: null,
        },
      },
      { upsert: true },
    );

    console.log(`  ✓ ${t.role.padEnd(8)} → ${email} / ${TEST_PASSWORD}`);
  }

  console.log('\n✅ Usuarios de prueba listos.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('❌ Error:', err);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
