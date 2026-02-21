import { AppDataSource } from '../ormconfig';
import { Plan } from '../entities/Plan';
import { BoostType } from '../entities/BoostType';
import { ProLevel } from '../entities/ProLevel';
import { Achievement, AchievementTriggerType, AchievementTarget } from '../entities/Achievement';
import { MissionTemplate, MissionType, MinPlan } from '../entities/MissionTemplate';
import { ConfigKV } from '../entities/ConfigKV';

export async function seedGamification() {
  console.log('Seeding gamification data...');

  // ─── Plans ───
  const planRepo = AppDataSource.getRepository(Plan);
  const existingPlans = await planRepo.count();
  if (existingPlans === 0) {
    await planRepo.save([
      planRepo.create({
        slug: 'starter', name: 'Starter', description: 'Plan gratuito para comenzar',
        priceMXN: 0, maxLeadsPerDay: 3, maxLeadsPerMonth: 20,
        matchPriorityBoost: 0, boostSlotsIncluded: 1, maxMissionsPerWeek: 1,
        boostDiscountPercent: 0, priorityLeadAccess: false,
        profileBadge: 'Verificado', analyticsLevel: 'basic', supportLevel: 'community', sortOrder: 0,
      }),
      planRepo.create({
        slug: 'normal', name: 'Normal', description: 'Para profesionales en crecimiento',
        priceMXN: 299, maxLeadsPerDay: 10, maxLeadsPerMonth: 80,
        matchPriorityBoost: 5, boostSlotsIncluded: 0, maxMissionsPerWeek: 1,
        boostDiscountPercent: 0, priorityLeadAccess: false,
        profileBadge: 'Normal', analyticsLevel: 'advanced', supportLevel: 'priority', sortOrder: 1,
      }),
      planRepo.create({
        slug: 'premium', name: 'Premium', description: 'Maxima visibilidad y leads ilimitados',
        priceMXN: 799, maxLeadsPerDay: -1, maxLeadsPerMonth: 250,
        matchPriorityBoost: 15, boostSlotsIncluded: 1, maxMissionsPerWeek: 2,
        boostDiscountPercent: 20, priorityLeadAccess: true,
        profileBadge: 'Premium', analyticsLevel: 'full', supportLevel: 'dedicated', sortOrder: 2,
      }),
    ]);
    console.log('  Plans seeded');
  }

  // ─── Boost Types (6h / 24h / 7d) ───
  const boostRepo = AppDataSource.getRepository(BoostType);
  const existingBoosts = await boostRepo.count();
  if (existingBoosts === 0) {
    await boostRepo.save([
      boostRepo.create({
        slug: 'boost-6h', name: 'Boost 6 horas', description: 'Mejora tu visibilidad por 6 horas',
        scoreBonus: 10, durationHours: 6, priceMXN: 49, icon: 'mdi:lightning-bolt', sortOrder: 0,
      }),
      boostRepo.create({
        slug: 'boost-24h', name: 'Boost 24 horas', description: 'Visibilidad mejorada por un dia completo',
        scoreBonus: 15, durationHours: 24, priceMXN: 129, icon: 'mdi:lightning-bolt-circle', sortOrder: 1,
      }),
      boostRepo.create({
        slug: 'boost-7d', name: 'Boost 7 dias', description: 'Maxima visibilidad por una semana',
        scoreBonus: 20, durationHours: 168, priceMXN: 399, icon: 'mdi:rocket-launch', sortOrder: 2,
      }),
    ]);
    console.log('  Boost types seeded');
  }

  // ─── Levels (10) ───
  const levelRepo = AppDataSource.getRepository(ProLevel);
  const existingLevels = await levelRepo.count();
  if (existingLevels === 0) {
    await levelRepo.save([
      levelRepo.create({ level: 1, name: 'Novato', xpRequired: 0, matchScoreBonus: 0, icon: 'mdi:sprout', perks: { description: 'Bienvenido a Cercu' } }),
      levelRepo.create({ level: 2, name: 'Aprendiz', xpRequired: 100, matchScoreBonus: 0, icon: 'mdi:school', perks: { description: 'Empezando a crecer' } }),
      levelRepo.create({ level: 3, name: 'Competente', xpRequired: 300, matchScoreBonus: 0, icon: 'mdi:wrench', perks: { description: 'Demostrando habilidad' } }),
      levelRepo.create({ level: 4, name: 'Habil', xpRequired: 600, matchScoreBonus: 0, icon: 'mdi:star-half-full', perks: { description: 'Profesional confiable' } }),
      levelRepo.create({ level: 5, name: 'Experimentado', xpRequired: 1000, matchScoreBonus: 2, icon: 'mdi:star', perks: { description: '+2 boost en matching', extraLeadsPerDay: 1 } }),
      levelRepo.create({ level: 6, name: 'Avanzado', xpRequired: 1500, matchScoreBonus: 2, icon: 'mdi:star-circle', perks: { description: '+2 boost en matching' } }),
      levelRepo.create({ level: 7, name: 'Experto', xpRequired: 2200, matchScoreBonus: 3, icon: 'mdi:trophy', perks: { description: '+3 boost, destacado en categoria', featuredInCategory: true, badge: 'Experto' } }),
      levelRepo.create({ level: 8, name: 'Maestro', xpRequired: 3000, matchScoreBonus: 3, icon: 'mdi:trophy-variant', perks: { description: '+3 boost en matching' } }),
      levelRepo.create({ level: 9, name: 'Elite', xpRequired: 4000, matchScoreBonus: 4, icon: 'mdi:diamond', perks: { description: '+4 boost, badge Elite', badge: 'Elite' } }),
      levelRepo.create({ level: 10, name: 'Leyenda', xpRequired: 5500, matchScoreBonus: 5, icon: 'mdi:crown', perks: { description: '+5 boost, destacado en categoria', featuredInCategory: true, badge: 'Leyenda' } }),
    ]);
    console.log('  Levels seeded');
  }

  // ─── Achievements (Pro + User) ───
  const achievementRepo = AppDataSource.getRepository(Achievement);
  const existingAchievements = await achievementRepo.count();
  if (existingAchievements === 0) {
    await achievementRepo.save([
      // Pro achievements
      achievementRepo.create({
        slug: 'primera-chamba', name: 'Primera Chamba', description: 'Completa tu primer trabajo',
        icon: 'mdi:briefcase-check', triggerType: AchievementTriggerType.COMPLETED_JOBS_COUNT,
        triggerCondition: { value: 1 }, reward: { xp: 25 }, target: AchievementTarget.PRO, sortOrder: 0,
      }),
      achievementRepo.create({
        slug: '10-trabajos', name: '10 Trabajos', description: 'Completa 10 trabajos',
        icon: 'mdi:numeric-10-box', triggerType: AchievementTriggerType.COMPLETED_JOBS_COUNT,
        triggerCondition: { value: 10 }, reward: { xp: 50 }, target: AchievementTarget.PRO, sortOrder: 1,
      }),
      achievementRepo.create({
        slug: '50-trabajos', name: '50 Trabajos', description: 'Completa 50 trabajos',
        icon: 'mdi:medal', triggerType: AchievementTriggerType.COMPLETED_JOBS_COUNT,
        triggerCondition: { value: 50 }, reward: { xp: 200, walletCreditMXN: 100 }, target: AchievementTarget.PRO, sortOrder: 2,
      }),
      achievementRepo.create({
        slug: 'top-5-estrellas', name: 'Top 5 Estrellas', description: 'Alcanza un rating perfecto de 5.0',
        icon: 'mdi:star-shooting', triggerType: AchievementTriggerType.RATING_THRESHOLD,
        triggerCondition: { value: 5 }, reward: { xp: 100 }, target: AchievementTarget.PRO, sortOrder: 3,
      }),
      achievementRepo.create({
        slug: 'velocista', name: 'Velocista', description: 'Tiempo de respuesta promedio menor a 5 minutos',
        icon: 'mdi:speedometer', triggerType: AchievementTriggerType.FAST_RESPONSE,
        triggerCondition: { value: 5 }, reward: { xp: 75 }, target: AchievementTarget.PRO, sortOrder: 4,
      }),
      achievementRepo.create({
        slug: 'racha-10', name: 'Racha de 10', description: 'Completa 10 trabajos consecutivos sin cancelar',
        icon: 'mdi:fire', triggerType: AchievementTriggerType.CONSECUTIVE_COMPLETIONS,
        triggerCondition: { value: 10 }, reward: { xp: 150, walletCreditMXN: 50 }, target: AchievementTarget.PRO, sortOrder: 5,
      }),
      achievementRepo.create({
        slug: 'veterano', name: 'Veterano', description: 'Lleva 90 dias en la plataforma',
        icon: 'mdi:calendar-check', triggerType: AchievementTriggerType.DAYS_ON_PLATFORM,
        triggerCondition: { value: 90 }, reward: { xp: 50 }, target: AchievementTarget.BOTH, sortOrder: 6,
      }),
      achievementRepo.create({
        slug: 'toma-leads-20', name: '20 Leads', description: 'Toma 20 leads en total',
        icon: 'mdi:hand-pointing-right', triggerType: AchievementTriggerType.LEADS_TAKEN,
        triggerCondition: { value: 20 }, reward: { xp: 75, walletCreditMXN: 30 }, target: AchievementTarget.PRO, sortOrder: 7,
      }),
      // User achievements
      achievementRepo.create({
        slug: 'telefono-verificado', name: 'Telefono verificado', description: 'Verifica tu numero de telefono',
        icon: 'mdi:phone-check', triggerType: AchievementTriggerType.PHONE_VERIFIED,
        triggerCondition: { value: 1 }, reward: { xp: 20 }, target: AchievementTarget.USER, sortOrder: 10,
      }),
      achievementRepo.create({
        slug: 'guardar-casa', name: 'Mi Casa', description: 'Guarda tu direccion de casa',
        icon: 'mdi:home-heart', triggerType: AchievementTriggerType.ADDRESS_SAVED,
        triggerCondition: { value: 1 }, reward: { xp: 10 }, target: AchievementTarget.USER, sortOrder: 11,
      }),
      achievementRepo.create({
        slug: 'primer-servicio', name: 'Primer servicio', description: 'Completa tu primer servicio',
        icon: 'mdi:check-decagram', triggerType: AchievementTriggerType.FIRST_SERVICE,
        triggerCondition: { value: 1 }, reward: { xp: 20 }, target: AchievementTarget.USER, sortOrder: 12,
      }),
      achievementRepo.create({
        slug: 'tres-servicios', name: '3 Servicios', description: 'Completa 3 servicios',
        icon: 'mdi:check-all', triggerType: AchievementTriggerType.SERVICES_COMPLETED,
        triggerCondition: { value: 3 }, reward: { xp: 10 }, target: AchievementTarget.USER, sortOrder: 13,
      }),
      achievementRepo.create({
        slug: 'primera-resena', name: 'Primera resena', description: 'Deja tu primera resena verificada',
        icon: 'mdi:message-star', triggerType: AchievementTriggerType.REVIEW_GIVEN,
        triggerCondition: { value: 1 }, reward: { xp: 10 }, target: AchievementTarget.USER, sortOrder: 14,
      }),
      achievementRepo.create({
        slug: 'foto-servicio', name: 'Foto de servicio', description: 'Sube una foto con tu solicitud',
        icon: 'mdi:camera-plus', triggerType: AchievementTriggerType.PHOTO_UPLOADED,
        triggerCondition: { value: 1 }, reward: { xp: 5 }, target: AchievementTarget.USER, sortOrder: 15,
      }),
      achievementRepo.create({
        slug: 'descripcion-detallada', name: 'Descripcion detallada', description: 'Escribe una descripcion de 80+ caracteres',
        icon: 'mdi:text-box-check', triggerType: AchievementTriggerType.DESCRIPTION_QUALITY,
        triggerCondition: { value: 80 }, reward: { xp: 5 }, target: AchievementTarget.USER, sortOrder: 16,
      }),
      achievementRepo.create({
        slug: 'sin-cancelaciones', name: 'Sin cancelaciones', description: '30 dias sin cancelaciones tardias',
        icon: 'mdi:shield-check', triggerType: AchievementTriggerType.NO_LATE_CANCELLATIONS,
        triggerCondition: { value: 30 }, reward: { xp: 10 }, target: AchievementTarget.BOTH, sortOrder: 17,
      }),
    ]);
    console.log('  Achievements seeded');
  }

  // ─── Mission Templates ───
  const missionRepo = AppDataSource.getRepository(MissionTemplate);
  const existingMissions = await missionRepo.count();
  if (existingMissions === 0) {
    await missionRepo.save([
      missionRepo.create({
        slug: 'completa-5', name: 'Completa 5 trabajos', description: 'Completa 5 trabajos esta semana',
        icon: 'mdi:check-all', missionType: MissionType.COMPLETE_JOBS,
        targetCondition: { targetValue: 5 }, reward: { xp: 100 },
        minPlan: MinPlan.STARTER, sortOrder: 0,
      }),
      missionRepo.create({
        slug: 'mantener-rating', name: 'Manten tu rating', description: 'Manten un rating mayor a 4.5 esta semana',
        icon: 'mdi:star-check', missionType: MissionType.MAINTAIN_RATING,
        targetCondition: { targetValue: 4.5 }, reward: { xp: 75 },
        minPlan: MinPlan.NORMAL, sortOrder: 1,
      }),
      missionRepo.create({
        slug: 'toma-3-leads', name: 'Toma 3 leads', description: 'Toma 3 leads esta semana',
        icon: 'mdi:hand-pointing-right', missionType: MissionType.TAKE_LEADS,
        targetCondition: { targetValue: 3 }, reward: { xp: 50, walletCreditMXN: 25 },
        minPlan: MinPlan.STARTER, sortOrder: 2,
      }),
      missionRepo.create({
        slug: 'respuestas-rapidas', name: '5 Respuestas rapidas', description: 'Responde 5 leads en menos de 10 minutos',
        icon: 'mdi:timer-sand', missionType: MissionType.FAST_RESPONSES,
        targetCondition: { targetValue: 5 }, reward: { xp: 75, boostHours: 12 },
        minPlan: MinPlan.NORMAL, sortOrder: 3,
      }),
      missionRepo.create({
        slug: 'racha-3', name: 'Racha de 3', description: 'Completa 3 trabajos consecutivos esta semana',
        icon: 'mdi:fire', missionType: MissionType.CONSECUTIVE_COMPLETIONS,
        targetCondition: { targetValue: 3 }, reward: { xp: 60 },
        minPlan: MinPlan.STARTER, sortOrder: 4,
      }),
      missionRepo.create({
        slug: 'sin-cancelaciones-semana', name: 'Cero cancelaciones', description: 'No canceles ningun trabajo esta semana',
        icon: 'mdi:shield-check', missionType: MissionType.NO_CANCELLATIONS,
        targetCondition: { targetValue: 1 }, reward: { xp: 40 },
        minPlan: MinPlan.NORMAL, sortOrder: 5,
      }),
      missionRepo.create({
        slug: 'obtener-resenas', name: 'Obtén 2 reseñas', description: 'Obtén al menos 2 reseñas esta semana',
        icon: 'mdi:message-star', missionType: MissionType.GET_REVIEWS,
        targetCondition: { targetValue: 2 }, reward: { xp: 50, walletCreditMXN: 15 },
        minPlan: MinPlan.PREMIUM, sortOrder: 6,
      }),
    ]);
    console.log('  Mission templates seeded');
  }

  // ─── Config KV defaults ───
  const configRepo = AppDataSource.getRepository(ConfigKV);
  const existingConfig = await configRepo.count();
  if (existingConfig === 0) {
    await configRepo.save([
      // XP settings
      configRepo.create({ key: 'xp_per_job_completion', value: '50', description: 'XP otorgado por trabajo completado' }),
      configRepo.create({ key: 'xp_per_high_rating', value: '20', description: 'XP otorgado por calificacion 5 estrellas' }),
      configRepo.create({ key: 'xp_per_fast_response', value: '10', description: 'XP por responder en menos de 5 min' }),
      configRepo.create({ key: 'missions_per_week', value: '3', description: 'Misiones asignadas por semana (pool)' }),
      configRepo.create({ key: 'lead_expiry_hours', value: '48', description: 'Horas antes de que expire un lead' }),
      // Credit caps
      configRepo.create({ key: 'credit_cap_user_monthly', value: '50', description: 'Cap mensual de creditos para usuarios (MXN)' }),
      configRepo.create({ key: 'credit_cap_pro_weekly', value: '10', description: 'Cap semanal de creditos para pros (unidades)' }),
      // Boost settings
      configRepo.create({ key: 'boost_score_cap', value: '15', description: 'Maximo que un boost puede superar al score base de otro pro' }),
      configRepo.create({ key: 'boost_max_per_block', value: '1', description: 'Max promovidos por bloque de resultados' }),
      // Anti-bypass
      configRepo.create({ key: 'client_protection_days', value: '30', description: 'Dias de proteccion cliente (re-agendar sin costo)' }),
      configRepo.create({ key: 'client_protection_fee', value: '5', description: 'Costo simbolico de re-agendar dentro de proteccion (MXN)' }),
      // Trust score
      configRepo.create({ key: 'trust_score_base', value: '50', description: 'Base del trust score para usuarios nuevos' }),
    ]);
    console.log('  Config KV seeded');
  }

  console.log('Gamification seeding complete!');
}
