import 'reflect-metadata';
import { AppDataSource } from '../ormconfig';
import { seedCategories } from './categories.seed';
import { seedAdmin } from './admin.seed';
import { seedTestData } from './testdata.seed';
import { seedGamification } from './gamification.seed';

async function runSeeds() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected for seeding');

    await seedCategories();
    await seedAdmin();
    await seedTestData();
    await seedGamification();

    console.log('All seeds completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

runSeeds();