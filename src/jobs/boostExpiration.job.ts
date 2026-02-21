import { AppDataSource } from '../ormconfig';
import { ActiveBoost, BoostStatus } from '../entities/ActiveBoost';

export async function expireBoosts() {
  const boostRepo = AppDataSource.getRepository(ActiveBoost);
  const result = await boostRepo
    .createQueryBuilder()
    .update(ActiveBoost)
    .set({ status: BoostStatus.EXPIRED })
    .where('status = :status AND expiresAt <= :now', {
      status: BoostStatus.ACTIVE,
      now: new Date(),
    })
    .execute();

  if (result.affected && result.affected > 0) {
    console.log(`Expired ${result.affected} boosts`);
  }
}
