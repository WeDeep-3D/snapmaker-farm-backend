-- projects tables
create table if not exists projects
(
    id            uuid primary key default uuidv7(),
    name          text,
    description   text,
    created_at    timestamp        default now(),
    updated_at    timestamp        default now(),

    start_time    timestamp        default now(),
    delivery_time timestamp
);
create index idx_projects_id on projects (id);

-- plates table
create type device_model as enum ('Snapmaker:U1');
create table if not exists plates
(
    id              uuid primary key default uuidv7(),
    name            text,
    description     text,
    created_at      timestamp        default now(),
    updated_at      timestamp        default now(),

    project_id      uuid         not null,

    completed_count integer          default 0,
    failed_count    integer          default 0,
    total_count     integer          default 0,

    device_model    device_model not null,
    file_id         uuid         not null,
    weight          real             default 0.0
);
create index idx_plates_id on plates (id);
create index idx_plates_project_id on plates (project_id);

-- devices tables
create table if not exists devices
(
    id          uuid primary key default uuidv7(),
    name        text,
    description text,
    created_at  timestamp        default now(),
    updated_at  timestamp        default now(),

    model       device_model not null,

    project_id  uuid,
    plate_id    uuid
);
create index idx_devices_id on devices (id);
create index idx_devices_plate_id on devices (plate_id);

-- filaments table
create type filament_vendor as enum ('Bambu', 'Generic', 'Polymaker', 'Snapmaker');
create type filament_type as enum (
    'ABS', 'ABS-GF',
    'ASA', 'ASA-AERO',
    'BVOH',
    'EVA',
    'HIPS',
    'PA', 'PA-CF', 'PA-GF', 'PA6-CF', 'PA11-CF',
    'PC', 'PC-CF',
    'PCTG',
    'PE', 'PE-CF',
    'PET-CF',
    'PETG', 'PETG-CF', 'PETG-CF10',
    'PHA',
    'PLA', 'PLA-AERO', 'PLA-CF',
    'PP', 'PP-CF', 'PP-GF',
    'PPA-CF', 'PPA-GF',
    'PPS', 'PPS-CF',
    'PVA',
    'PVB',
    'SBS',
    'TPU'
    );
create type filament_subtype as enum ('SnapSpeed', 'Matte', 'Polylite', 'Support');
create table if not exists filaments
(
    id                       uuid primary key default uuidv7(),
    name                     text,
    description              text,
    created_at               timestamp        default now(),
    updated_at               timestamp        default now(),

    count                    integer          default 1,

    vendor                   filament_vendor  default 'Generic',
    type                     filament_type not null,
    subtype                  filament_subtype,

    color                    char(8)          default 'FFFFFFFF',
    density                  real          not null,
    diameter                 real          not null,

    is_soluble               boolean          default false,
    is_support               boolean          default false,
    shrink_factor_horizontal real             default 1.0,
    shrink_factor_vertical   real             default 1.0,
    temperature_idle         real             default 0.0,
    temperature_softening    real,

    default_config           jsonb            default '{}'::jsonb,
    override_config          jsonb            default '{}'::jsonb,

    constraint count_positive_check check (count > 0),
    constraint color_rgba_hex_check check (color ~ '^#[0-9a-fA-F]{8}$'),
    constraint density_positive_check check (density > 0.0),
    constraint diameter_positive_check check (diameter > 0.0)
);
create index idx_filaments_id on filaments (id);

-- plate_related_filaments table
create table if not exists plate_related_filaments
(
    plate_id    uuid not null,
    filament_id uuid not null,
    primary key (plate_id, filament_id)
);
create index idx_plate_related_filaments_plate_id on plate_related_filaments (plate_id);
create index idx_plate_related_filaments_filament_id on plate_related_filaments (filament_id);