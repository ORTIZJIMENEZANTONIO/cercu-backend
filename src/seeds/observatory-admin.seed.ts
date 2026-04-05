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
    existing.passwordHash = passwordHash;
    existing.name = adminName;
    existing.observatories = ['techos-verdes', 'humedales'];
    existing.isActive = true;
    await repo.save(existing);

  } else {
    const admin = repo.create({
      id: uuidv4(),
      email: adminEmail,
      passwordHash,
      name: adminName,
      observatories: ['techos-verdes', 'humedales'],
      isActive: true,
    });
    await repo.save(admin);
  }
}
