import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../ormconfig';
import { User, UserRole } from '../entities/User';
import { Wallet } from '../entities/Wallet';

export async function seedAdmin() {
  const userRepo = AppDataSource.getRepository(User);
  const walletRepo = AppDataSource.getRepository(Wallet);

  const existing = await userRepo.findOne({
    where: { phone: '+525512345678' },
  });

  if (!existing) {
    const admin = userRepo.create({
      id: uuidv4(),
      phone: '+525512345678',
      name: 'Admin CERCU',
      role: UserRole.ADMIN,
      phoneVerified: true,
      isActive: true,
    });
    await userRepo.save(admin);

    const wallet = walletRepo.create({
      userId: admin.id,
      balance: 0,
      totalLoaded: 0,
      totalSpent: 0,
    });
    await walletRepo.save(wallet);

    console.log('Admin user seeded:', admin.phone);
  } else {
    console.log('Admin user already exists');
  }
}