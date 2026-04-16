import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../ormconfig';
import { ObservatoryAdmin } from '../entities/observatory/ObservatoryAdmin';
import { config } from '../config';

export async function seedObservatoryAdmin() {
  const { adminEmail, adminPassword, adminName } = config.observatory;

  if (!adminPassword) {
    console.warn(
      '⚠️  OBS_ADMIN_PASSWORD not set — skipping observatory admin seed. Set it in .env to create the admin.'
    );
    return;
  }

  const repo = AppDataSource.getRepository(ObservatoryAdmin);
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const existing = await repo.findOne({ where: { email: adminEmail } });

  if (existing) {
    // Update password and name but preserve role/permissions if already set
    existing.passwordHash = passwordHash;
    existing.name = adminName;
    existing.observatories = ['techos-verdes', 'humedales'];
    existing.isActive = true;
    if (!existing.role) existing.role = 'superadmin';
    if (!existing.permissions) existing.permissions = ['manage_users', 'manage_cms', 'manage_humedales', 'manage_hallazgos', 'manage_notihumedal', 'manage_prospectos'];
    await repo.save(existing);

  } else {
    const admin = repo.create({
      id: uuidv4(),
      email: adminEmail,
      passwordHash,
      name: adminName,
      observatories: ['techos-verdes', 'humedales'],
      role: 'superadmin',
      permissions: ['manage_users', 'manage_cms', 'manage_humedales', 'manage_hallazgos', 'manage_notihumedal', 'manage_prospectos'],
      isActive: true,
    });
    await repo.save(admin);
  }
}
