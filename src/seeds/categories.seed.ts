import { AppDataSource } from '../ormconfig';
import { Category, CategoryType } from '../entities/Category';
import { CategoryChip } from '../entities/CategoryChip';
import { CategoryPricing } from '../entities/CategoryPricing';
import { CategoryConditionalField, FieldType } from '../entities/CategoryConditionalField';
import { UrgencyTier } from '../entities/CategoryPricing';

interface CategorySeed {
  slug: string;
  name: string;
  icon: string;
  type: CategoryType;
  sortOrder: number;
  chips: { label: string; slug: string }[];
  pricing: { standard: number; today: number; immediate?: number; qualifiedSurcharge?: number };
  conditionalFields?: {
    fieldKey: string;
    label: string;
    fieldType: FieldType;
    options?: string[];
    required: boolean;
    showWhenChipSlugs?: string[];
  }[];
}

const categoriesData: CategorySeed[] = [
  // 1) Plomería
  {
    slug: 'plomeria',
    name: 'Plomería',
    icon: 'mdi:pipe-wrench',
    type: CategoryType.EMERGENCY,
    sortOrder: 1,
    chips: [
      { label: 'Fuga (tubo/llave)', slug: 'fuga-tubo-llave' },
      { label: 'WC tapado', slug: 'wc-tapado' },
      { label: 'WC no carga / fuga en tanque', slug: 'wc-no-carga' },
      { label: 'Lavabo tapado', slug: 'lavabo-tapado' },
      { label: 'Regadera / llave gotea', slug: 'regadera-llave-gotea' },
      { label: 'Coladera / drenaje', slug: 'coladera-drenaje' },
      { label: 'Tinaco / cisterna', slug: 'tinaco-cisterna' },
      { label: 'Bomba de agua', slug: 'bomba-de-agua' },
      { label: 'Boiler (agua)', slug: 'boiler-agua' },
    ],
    pricing: { standard: 39, today: 49, immediate: 59 },
    conditionalFields: [
      {
        fieldKey: 'extra_symptom',
        label: 'Síntoma adicional (opcional)',
        fieldType: FieldType.SELECT,
        options: ['Sin agua', 'Olor / drenaje lento'],
        required: false,
      },
    ],
  },
  // 2) Electricidad
  {
    slug: 'electricidad',
    name: 'Electricidad',
    icon: 'mdi:lightning-bolt',
    type: CategoryType.EMERGENCY,
    sortOrder: 2,
    chips: [
      { label: 'Apagón en casa', slug: 'apagon-en-casa' },
      { label: 'Se baja la pastilla / breaker', slug: 'pastilla-breaker' },
      { label: 'Contacto no funciona', slug: 'contacto-no-funciona' },
      { label: 'Chispa / corto', slug: 'chispa-corto' },
      { label: 'Instalación lámpara / ventilador', slug: 'instalacion-lampara' },
      { label: 'Cableado / extensión', slug: 'cableado-extension' },
      { label: 'Timbre / portón', slug: 'timbre-porton' },
      { label: 'Medidor / acometida', slug: 'medidor-acometida' },
    ],
    pricing: { standard: 39, today: 49, immediate: 59 },
    conditionalFields: [
      {
        fieldKey: 'apagon_zona',
        label: '¿Toda la casa o solo una zona?',
        fieldType: FieldType.SELECT,
        options: ['Toda la casa', 'Solo una zona'],
        required: true,
        showWhenChipSlugs: ['apagon-en-casa'],
      },
    ],
  },
  // 3) Cerrajería
  {
    slug: 'cerrajeria',
    name: 'Cerrajería',
    icon: 'mdi:key-variant',
    type: CategoryType.EMERGENCY,
    sortOrder: 3,
    chips: [
      { label: 'Me quedé afuera', slug: 'me-quede-afuera' },
      { label: 'Abrir puerta (sin llave)', slug: 'abrir-puerta' },
      { label: 'Cambio de chapa', slug: 'cambio-chapa' },
      { label: 'Llave rota', slug: 'llave-rota' },
      { label: 'Duplicado de llave', slug: 'duplicado-llave' },
      { label: 'Candado', slug: 'candado' },
      { label: 'Cerradura digital', slug: 'cerradura-digital' },
      { label: 'Portón / chapa de reja', slug: 'porton-chapa-reja' },
    ],
    pricing: { standard: 45, today: 55, immediate: 65 },
    conditionalFields: [
      {
        fieldKey: 'target_type',
        label: '¿Casa o Auto?',
        fieldType: FieldType.SELECT,
        options: ['Casa', 'Auto'],
        required: true,
      },
      {
        fieldKey: 'vehicle_info',
        label: 'Marca / modelo / año del auto',
        fieldType: FieldType.TEXT,
        required: true,
        showWhenChipSlugs: ['me-quede-afuera', 'abrir-puerta', 'llave-rota', 'duplicado-llave', 'candado'],
      },
    ],
  },
  // 4) Gas (técnico)
  {
    slug: 'gas',
    name: 'Gas (técnico)',
    icon: 'mdi:fire',
    type: CategoryType.EMERGENCY,
    sortOrder: 4,
    chips: [
      { label: 'Olor a gas (urgente)', slug: 'olor-a-gas' },
      { label: 'Posible fuga', slug: 'posible-fuga' },
      { label: 'Revisión preventiva', slug: 'revision-preventiva' },
      { label: 'Instalación de estufa', slug: 'instalacion-estufa' },
      { label: 'Instalación de tanque', slug: 'instalacion-tanque' },
      { label: 'Cambio regulador', slug: 'cambio-regulador' },
      { label: 'Manguera/conexión', slug: 'manguera-conexion' },
      { label: 'Boiler a gas', slug: 'boiler-a-gas' },
    ],
    pricing: { standard: 49, today: 59, immediate: 69 },
    conditionalFields: [
      {
        fieldKey: 'gas_type',
        label: 'Tipo de suministro',
        fieldType: FieldType.SELECT,
        options: ['Tanque estacionario', 'Cilindro'],
        required: true,
      },
    ],
  },
  // 5) Aire acondicionado
  {
    slug: 'aire-acondicionado',
    name: 'Aire acondicionado',
    icon: 'mdi:snowflake',
    type: CategoryType.PROJECT,
    sortOrder: 5,
    chips: [
      { label: 'No enfría', slug: 'no-enfria' },
      { label: 'Mantenimiento', slug: 'mantenimiento-ac' },
      { label: 'Instalación', slug: 'instalacion-ac' },
      { label: 'Gotea agua', slug: 'gotea-agua' },
      { label: 'Hace ruido', slug: 'hace-ruido' },
      { label: 'No enciende', slug: 'no-enciende-ac' },
      { label: 'Recarga de gas', slug: 'recarga-gas-ac' },
    ],
    pricing: { standard: 25, today: 35 },
    conditionalFields: [
      {
        fieldKey: 'ac_type',
        label: 'Tipo de equipo',
        fieldType: FieldType.SELECT,
        options: ['Minisplit', 'Ventana'],
        required: true,
      },
      {
        fieldKey: 'has_equipment',
        label: '¿Ya tienes equipo?',
        fieldType: FieldType.SELECT,
        options: ['Sí', 'No'],
        required: true,
        showWhenChipSlugs: ['instalacion-ac'],
      },
    ],
  },
  // 6) Boiler y calentadores
  {
    slug: 'boiler-calentadores',
    name: 'Boiler y calentadores',
    icon: 'mdi:water-boiler',
    type: CategoryType.EMERGENCY,
    sortOrder: 6,
    chips: [
      { label: 'No enciende', slug: 'no-enciende-boiler' },
      { label: 'No calienta', slug: 'no-calienta' },
      { label: 'Se apaga', slug: 'se-apaga' },
      { label: 'Fuga de agua', slug: 'fuga-agua-boiler' },
      { label: 'Mantenimiento', slug: 'mantenimiento-boiler' },
      { label: 'Instalación', slug: 'instalacion-boiler' },
      { label: 'Error/código', slug: 'error-codigo' },
    ],
    pricing: { standard: 29, today: 39, immediate: 49 },
    conditionalFields: [
      {
        fieldKey: 'boiler_type',
        label: 'Tipo de boiler',
        fieldType: FieldType.SELECT,
        options: ['De paso', 'Depósito'],
        required: true,
      },
      {
        fieldKey: 'error_code',
        label: 'Código de error (si lo sabes)',
        fieldType: FieldType.TEXT,
        required: false,
        showWhenChipSlugs: ['error-codigo'],
      },
    ],
  },
  // 7) Carpintería
  {
    slug: 'carpinteria',
    name: 'Carpintería',
    icon: 'mdi:hand-saw',
    type: CategoryType.PROJECT,
    sortOrder: 7,
    chips: [
      { label: 'Reparación de puerta', slug: 'reparacion-puerta' },
      { label: 'Ajuste (no cierra / roza)', slug: 'ajuste-puerta' },
      { label: 'Mueble a medida', slug: 'mueble-medida' },
      { label: 'Cocina integral', slug: 'cocina-integral' },
      { label: 'Closet / cajonera', slug: 'closet-cajonera' },
      { label: 'Repisa / instalación', slug: 'repisa-instalacion' },
      { label: 'Barniz / acabado', slug: 'barniz-acabado' },
      { label: 'Reparación de mueble', slug: 'reparacion-mueble' },
    ],
    pricing: { standard: 19, today: 29, qualifiedSurcharge: 10 },
  },
  // 8) Herrería / Aluminio
  {
    slug: 'herreria-aluminio',
    name: 'Herrería / Aluminio',
    icon: 'mdi:gate',
    type: CategoryType.PROJECT,
    sortOrder: 8,
    chips: [
      { label: 'Reja / protección', slug: 'reja-proteccion' },
      { label: 'Ventana / marco', slug: 'ventana-marco' },
      { label: 'Cancel de baño', slug: 'cancel-bano' },
      { label: 'Puerta / portón', slug: 'puerta-porton' },
      { label: 'Soldadura / reparación', slug: 'soldadura-reparacion' },
      { label: 'Barandal', slug: 'barandal' },
      { label: 'Mosquitero', slug: 'mosquitero' },
      { label: 'Aluminio (ajuste)', slug: 'aluminio-ajuste' },
    ],
    pricing: { standard: 19, today: 29, qualifiedSurcharge: 10 },
  },
  // 9) Pintura
  {
    slug: 'pintura',
    name: 'Pintura',
    icon: 'mdi:format-paint',
    type: CategoryType.PROJECT,
    sortOrder: 9,
    chips: [
      { label: 'Pintar cuarto', slug: 'pintar-cuarto' },
      { label: 'Pintar sala/comedor', slug: 'pintar-sala-comedor' },
      { label: 'Pintar fachada', slug: 'pintar-fachada' },
      { label: 'Resanar / grietas', slug: 'resanar-grietas' },
      { label: 'Humedad / manchas', slug: 'humedad-manchas' },
      { label: 'Barniz / madera', slug: 'barniz-madera' },
      { label: 'Pintura de herrería', slug: 'pintura-herreria' },
    ],
    pricing: { standard: 19, today: 29, qualifiedSurcharge: 10 },
    conditionalFields: [
      {
        fieldKey: 'has_paint',
        label: '¿Tienes pintura?',
        fieldType: FieldType.SELECT,
        options: ['Sí', 'No'],
        required: false,
      },
    ],
  },
  // 10) Impermeabilización
  {
    slug: 'impermeabilizacion',
    name: 'Impermeabilización',
    icon: 'mdi:water-off',
    type: CategoryType.PROJECT,
    sortOrder: 10,
    chips: [
      { label: 'Goteras', slug: 'goteras' },
      { label: 'Impermeabilizar techo', slug: 'impermeabilizar-techo' },
      { label: 'Resane/sellado', slug: 'resane-sellado' },
      { label: 'Mantenimiento (reaplicar)', slug: 'mantenimiento-impermeabilizacion' },
      { label: 'Canaletas / bajantes', slug: 'canaletas-bajantes' },
      { label: 'Domo / tragaluz', slug: 'domo-tragaluz' },
    ],
    pricing: { standard: 25, today: 35, qualifiedSurcharge: 10 },
    conditionalFields: [
      {
        fieldKey: 'roof_type',
        label: 'Tipo de techo',
        fieldType: FieldType.SELECT,
        options: ['Losa', 'Lámina'],
        required: true,
      },
    ],
  },
  // 11) Mecánica a domicilio
  {
    slug: 'mecanica-domicilio',
    name: 'Mecánica a domicilio',
    icon: 'mdi:car-wrench',
    type: CategoryType.EMERGENCY,
    sortOrder: 11,
    chips: [
      { label: 'Batería descargada', slug: 'bateria-descargada' },
      { label: 'Paso de corriente', slug: 'paso-corriente' },
      { label: 'No arranca', slug: 'no-arranca' },
      { label: 'Diagnóstico básico', slug: 'diagnostico-basico' },
      { label: 'Cambio de aceite', slug: 'cambio-aceite' },
      { label: 'Ponchadura', slug: 'ponchadura' },
      { label: 'Luces/tablero', slug: 'luces-tablero' },
      { label: 'Frenos (revisión simple)', slug: 'frenos-revision' },
    ],
    pricing: { standard: 29, today: 39, immediate: 49 },
    conditionalFields: [
      {
        fieldKey: 'vehicle_type',
        label: '¿Auto o Moto?',
        fieldType: FieldType.SELECT,
        options: ['Auto', 'Moto'],
        required: true,
      },
      {
        fieldKey: 'vehicle_info',
        label: 'Marca / modelo / año',
        fieldType: FieldType.TEXT,
        required: true,
        showWhenChipSlugs: ['no-arranca', 'diagnostico-basico'],
      },
    ],
  },
  // 12) Jardinería
  {
    slug: 'jardineria',
    name: 'Jardinería',
    icon: 'mdi:flower',
    type: CategoryType.PROJECT,
    sortOrder: 12,
    chips: [
      { label: 'Podar / deshierbar', slug: 'podar-deshierbar' },
      { label: 'Limpieza de jardín', slug: 'limpieza-jardin' },
      { label: 'Plantas / reacomodo', slug: 'plantas-reacomodo' },
      { label: 'Riego (revisión)', slug: 'riego-revision' },
      { label: 'Diseño simple', slug: 'diseno-simple' },
      { label: 'Árboles (poda ligera)', slug: 'arboles-poda-ligera' },
    ],
    pricing: { standard: 15, today: 25 },
  },
];

export async function seedCategories() {
  const categoryRepo = AppDataSource.getRepository(Category);
  const chipRepo = AppDataSource.getRepository(CategoryChip);
  const pricingRepo = AppDataSource.getRepository(CategoryPricing);
  const fieldRepo = AppDataSource.getRepository(CategoryConditionalField);

  for (const data of categoriesData) {
    let category = await categoryRepo.findOne({ where: { slug: data.slug } });

    if (!category) {
      category = categoryRepo.create({
        slug: data.slug,
        name: data.name,
        icon: data.icon,
        type: data.type,
        sortOrder: data.sortOrder,
      });
      category = await categoryRepo.save(category);
    }

    // Chips
    for (let i = 0; i < data.chips.length; i++) {
      const chipData = data.chips[i];
      const existing = await chipRepo.findOne({
        where: { categoryId: category.id, slug: chipData.slug },
      });
      if (!existing) {
        await chipRepo.save(
          chipRepo.create({
            categoryId: category.id,
            label: chipData.label,
            slug: chipData.slug,
            sortOrder: i,
          })
        );
      }
    }

    // Pricing (2 or 3 tiers per category)
    const tiers: { tier: UrgencyTier; price: number }[] = [
      { tier: UrgencyTier.STANDARD, price: data.pricing.standard },
      { tier: UrgencyTier.TODAY, price: data.pricing.today },
    ];
    if (data.pricing.immediate != null) {
      tiers.push({ tier: UrgencyTier.IMMEDIATE, price: data.pricing.immediate });
    }

    for (const t of tiers) {
      const existing = await pricingRepo.findOne({
        where: { categoryId: category.id, urgencyTier: t.tier },
      });
      if (!existing) {
        await pricingRepo.save(
          pricingRepo.create({
            categoryId: category.id,
            urgencyTier: t.tier,
            priceMXN: t.price,
            qualifiedSurchargeMXN: data.pricing.qualifiedSurcharge || 0,
          })
        );
      }
    }

    // Conditional fields
    if (data.conditionalFields) {
      for (const cf of data.conditionalFields) {
        const existing = await fieldRepo.findOne({
          where: { categoryId: category.id, fieldKey: cf.fieldKey },
        });
        if (!existing) {
          await fieldRepo.save(
            fieldRepo.create({
              categoryId: category.id,
              fieldKey: cf.fieldKey,
              label: cf.label,
              fieldType: cf.fieldType,
              options: cf.options || null,
              required: cf.required,
              showWhenChipSlugs: cf.showWhenChipSlugs || null,
            })
          );
        }
      }
    }
  }

  console.log('Categories seeded successfully');
}