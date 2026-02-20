import { AppDataSource } from '../../ormconfig';
import { Category } from '../../entities/Category';
import { AppError } from '../../middleware/errorHandler.middleware';

export class CategoriesService {
  private categoryRepo = AppDataSource.getRepository(Category);

  async getAll() {
    return this.categoryRepo.find({
      where: { isActive: true },
      relations: ['chips', 'pricing'],
      order: { sortOrder: 'ASC', chips: { sortOrder: 'ASC' } },
    });
  }

  async getById(id: number) {
    const category = await this.categoryRepo.findOne({
      where: { id, isActive: true },
      relations: ['chips', 'conditionalFields', 'pricing'],
      order: { chips: { sortOrder: 'ASC' } },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    return category;
  }

  async getBySlug(slug: string) {
    const category = await this.categoryRepo.findOne({
      where: { slug, isActive: true },
      relations: ['chips', 'conditionalFields', 'pricing'],
      order: { chips: { sortOrder: 'ASC' } },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    return category;
  }
}