// Seed de administradores adicionales (no superadmin) para los observatorios.
// Idempotente: si el email ya existe, NO sobreescribe contraseña ni permisos
// — sólo se asegura de que la cuenta esté activa y tenga acceso a los
// observatorios configurados.
//
// Para crear nuevos admins desde el panel se usa `/admin/usuarios`. Esto es
// para semilla post-migración: el primer administrador externo de humedales
// ya queda listo sin tener que hacerlo a mano.
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../ormconfig';
import { ObservatoryAdmin } from '../entities/observatory/ObservatoryAdmin';

interface SeedAdmin {
  email: string;
  initialPassword: string; // Sólo se usa si el usuario no existe.
  name: string;
  role: 'admin' | 'editor';
  observatories: string[];
  permissions: string[];
}

const ADDITIONAL_ADMINS: SeedAdmin[] = [
  {
    email: 'slmar.caballero@gmail.com',
    initialPassword: 'Samantha11.',
    name: 'Salma Caballero',
    role: 'admin',
    observatories: ['humedales'],
    permissions: [
      'manage_humedales',
      'manage_hallazgos',
      'manage_notihumedal',
      'manage_prospectos',
      'manage_cms',
    ],
  },
];

export async function seedObservatoryAdditionalAdmins() {
  const repo = AppDataSource.getRepository(ObservatoryAdmin);
  let created = 0;
  let touched = 0;

  for (const a of ADDITIONAL_ADMINS) {
    const existing = await repo.findOne({ where: { email: a.email } });

    if (existing) {
      // No tocamos password ni nombre ni permisos del usuario existente — esos
      // los administra el dueño desde el panel. Sólo aseguramos activación y
      // que tenga el observatorio en su scope.
      let changed = false;
      if (!existing.isActive) {
        existing.isActive = true;
        changed = true;
      }
      const obsSet = new Set(existing.observatories || []);
      for (const obs of a.observatories) {
        if (!obsSet.has(obs)) {
          obsSet.add(obs);
          changed = true;
        }
      }
      if (changed) {
        existing.observatories = Array.from(obsSet);
        await repo.save(existing);
        touched++;
      }
    } else {
      const passwordHash = await bcrypt.hash(a.initialPassword, 12);
      await repo.save(
        repo.create({
          id: uuidv4(),
          email: a.email,
          passwordHash,
          name: a.name,
          role: a.role,
          observatories: a.observatories,
          permissions: a.permissions,
          isActive: true,
        }),
      );
      created++;
    }
  }

  console.log(
    `  Additional observatory admins: ${created} creado(s), ${touched} actualizado(s).`,
  );
}
