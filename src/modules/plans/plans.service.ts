import { AppDataSource } from '../../ormconfig';
import { Plan } from '../../entities/Plan';
import { AppError } from '../../middleware/errorHandler.middleware';

export class PlansService {
  private planRepo = AppDataSource.getRepository(Plan);

  async listPlans() {
    return this.planRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getPlan(id: number) {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new AppError('Plan not found', 404);
    return plan;
  }
}
