import { sql } from 'drizzle-orm'
import {
  boolean,
  char,
  check,
  index,
  inet,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const deviceModel = pgEnum('device_model', ['Snapmaker:U1'])
export const filamentSubtype = pgEnum('filament_subtype', [
  'SnapSpeed',
  'Matte',
  'Polylite',
  'Support',
])
export const filamentType = pgEnum('filament_type', [
  'ABS',
  'ABS-GF',
  'ASA',
  'ASA-AERO',
  'BVOH',
  'EVA',
  'HIPS',
  'PA',
  'PA-CF',
  'PA-GF',
  'PA6-CF',
  'PA11-CF',
  'PC',
  'PC-CF',
  'PCTG',
  'PE',
  'PE-CF',
  'PET-CF',
  'PETG',
  'PETG-CF',
  'PETG-CF10',
  'PHA',
  'PLA',
  'PLA-AERO',
  'PLA-CF',
  'PP',
  'PP-CF',
  'PP-GF',
  'PPA-CF',
  'PPA-GF',
  'PPS',
  'PPS-CF',
  'PVA',
  'PVB',
  'SBS',
  'TPU',
])
export const filamentVendor = pgEnum('filament_vendor', [
  'Bambu',
  'Generic',
  'Polymaker',
  'Snapmaker',
])

export const devices = pgTable(
  'devices',
  {
    // Common fields
    id: uuid()
      .default(sql`uuidv7()`)
      .primaryKey()
      .notNull(),
    description: text(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
    // Identity fields
    model: deviceModel().notNull(),
    serialNumber: text('serial_number').notNull(),
    // Network fields
    ethIp: inet('eth_ip'),
    ethMac: char('eth_mac', { length: 17 }),
    wlanIp: inet('wlan_ip'),
    wlanMac: char('wlan_mac', { length: 17 }),
    // Relation fields
    projectId: uuid('project_id'),
    plateId: uuid('plate_id'),
  },
  (table) => [
    index('idx_devices_id').using('btree', table.id.asc().nullsLast().op('uuid_ops')),
    index('idx_devices_plate_id').using('btree', table.plateId.asc().nullsLast().op('uuid_ops')),
    uniqueIndex('uq_devices_model_serial').on(table.model, table.serialNumber),
  ],
)
export const filaments = pgTable(
  'filaments',
  {
    // Common
    id: uuid()
      .default(sql`uuidv7()`)
      .primaryKey()
      .notNull(),
    description: text(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),

    name: text(),
    count: integer().default(1),
    vendor: filamentVendor().default('Generic'),
    type: filamentType().notNull(),
    subtype: filamentSubtype(),
    color: char({ length: 8 }).default('FFFFFFFF'),
    density: real().notNull(),
    diameter: real().notNull(),
    isSoluble: boolean('is_soluble').default(false),
    isSupport: boolean('is_support').default(false),
    shrinkFactorHorizontal: real('shrink_factor_horizontal').default(1),
    shrinkFactorVertical: real('shrink_factor_vertical').default(1),
    temperatureIdle: real('temperature_idle').default(0),
    temperatureSoftening: real('temperature_softening'),
    defaultConfig: jsonb('default_config').default({}),
    overrideConfig: jsonb('override_config').default({}),
  },
  (table) => [
    index('idx_filaments_id').using('btree', table.id.asc().nullsLast().op('uuid_ops')),
    check('count_positive_check', sql`count > 0`),
    check('color_rgba_hex_check', sql`color ~ '^#[0-9a-fA-F]{8}$'::text`),
    check('density_positive_check', sql`density > (0.0)::double precision`),
    check('diameter_positive_check', sql`diameter > (0.0)::double precision`),
  ],
)

export const plates = pgTable(
  'plates',
  {
    id: uuid()
      .default(sql`uuidv7()`)
      .primaryKey()
      .notNull(),
    name: text(),
    description: text(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
    projectId: uuid('project_id').notNull(),
    completedCount: integer('completed_count').default(0),
    failedCount: integer('failed_count').default(0),
    totalCount: integer('total_count').default(0),
    deviceModel: deviceModel('device_model').notNull(),
    fileId: uuid('file_id').notNull(),
    weight: real().default(0),
  },
  (table) => [
    index('idx_plates_id').using('btree', table.id.asc().nullsLast().op('uuid_ops')),
    index('idx_plates_project_id').using('btree', table.projectId.asc().nullsLast().op('uuid_ops')),
  ],
)

export const plateRelatedFilaments = pgTable(
  'plate_related_filaments',
  {
    plateId: uuid('plate_id').notNull(),
    filamentId: uuid('filament_id').notNull(),
  },
  (table) => [
    index('idx_plate_related_filaments_filament_id').using(
      'btree',
      table.filamentId.asc().nullsLast().op('uuid_ops'),
    ),
    index('idx_plate_related_filaments_plate_id').using(
      'btree',
      table.plateId.asc().nullsLast().op('uuid_ops'),
    ),
    primaryKey({
      columns: [table.plateId, table.filamentId],
      name: 'plate_related_filaments_pkey',
    }),
  ],
)

export const projects = pgTable(
  'projects',
  {
    id: uuid()
      .default(sql`uuidv7()`)
      .primaryKey()
      .notNull(),
    name: text().notNull(),
    description: text(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
    startTime: timestamp('start_time', { mode: 'string' }).defaultNow(),
    deliveryTime: timestamp('delivery_time', { mode: 'string' }),
  },
  (table) => [index('idx_projects_id').using('btree', table.id.asc().nullsLast().op('uuid_ops'))],
)
