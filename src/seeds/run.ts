import 'reflect-metadata';
import { AppDataSource } from '../ormconfig';
import { seedCategories } from './categories.seed';
import { seedAdmin } from './admin.seed';
import { seedTestData } from './testdata.seed';
import { seedGamification } from './gamification.seed';
import { seedObservatoryAdmin } from './observatory-admin.seed';
import { seedObservatoryAdditionalAdmins } from './observatory-additional-admins.seed';
import { seedObservatoryContent } from './observatory-content.seed';
import { seedArrecifes } from './arrecifes.seed';
import { seedArrecifesObservations } from './arrecifes-observations.seed';
import { seedArrecifesAlerts } from './arrecifes-alerts.seed';
import { seedArrecifesSnapshots } from './arrecifes-snapshots.seed';
import { seedArrecifesNews } from './arrecifes-news.seed';
import { seedConfigKV } from './config-kv.seed';

async function runSeeds() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected for seeding');

    await seedCategories();
    await seedAdmin();
    await seedTestData();
    await seedGamification();
    await seedConfigKV();
    await seedObservatoryAdmin();
    await seedObservatoryAdditionalAdmins();
    await seedObservatoryContent();
    await seedArrecifes();
    await seedArrecifesObservations();
    await seedArrecifesAlerts();
    await seedArrecifesSnapshots();
    await seedArrecifesNews();

    console.log('All seeds completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

runSeeds();