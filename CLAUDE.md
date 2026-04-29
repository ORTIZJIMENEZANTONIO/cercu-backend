# CERCU Backend

## Product
**Cercu** ("SER-ku") — Hyperlocal home services marketplace API for CDMX/Edomex.
Users request services, get matched with nearby professionals. Professionals pay to take leads, operate on subscription plans, and are gamified with XP/levels/missions/boosts.

## Stack
- **Runtime:** Node.js + TypeScript 5.3
- **Framework:** Express 4.18
- **ORM:** TypeORM 0.3 + MySQL 8
- **Auth:** JWT (jsonwebtoken) + bcryptjs + Google OAuth
- **Validation:** Joi
- **Jobs:** node-cron
- **Upload:** Multer (local disk)
- **Security:** Helmet, CORS, express-rate-limit
- **AI/Vision:** Google Generative AI (Gemini 2.0 Flash) — roof analysis
- **Remote Sensing:** Google Earth Engine REST API, Sentinel Hub Statistical API
- **Geospatial:** @turf/turf (spatial analysis)

## Commands
```bash
npm run dev           # Nodemon dev server (port 3000)
npm run build         # Compile TS to dist/
npm start             # Run compiled dist/index.js
npm run seed          # Seed database (ts-node src/seeds/run.ts)
npm run migration:generate  # Generate TypeORM migration
npm run migration:run       # Run pending migrations
npx tsc --noEmit      # Type check without emitting
```

## Environment
```bash
# .env (see .env.example)
PORT=3000
DB_HOST=localhost
DB_PORT=3307
DB_USERNAME=cercu
DB_PASSWORD=cercu_dev_2024
DB_DATABASE=cercu_db
JWT_SECRET=<change-in-production>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
OTP_MOCK=true          # Dev mode: all OTPs are 1234
OTP_MOCK_CODE=1234
CORS_ORIGIN=http://localhost:3001,http://localhost:3000,http://localhost:3005

# Observatory Admin (shared backend for both observatories)
OBS_ADMIN_EMAIL=admin@observatorio.cdmx
OBS_ADMIN_PASSWORD=<set-your-password>   # Required for seed, bcrypt-hashed (12 rounds)
OBS_ADMIN_NAME=Admin Observatorios

# Observatory AI — Roof analysis via Gemini
GEMINI_API_KEY=<your-gemini-api-key>

# Observatory Remote Sensing — Vegetation/water indices
GEE_SERVICE_ACCOUNT_KEY=<json-string>    # Google Earth Engine service account key
GEE_PROJECT_ID=<gee-project-id>
SENTINEL_HUB_CLIENT_ID=<sentinel-hub-client-id>
SENTINEL_HUB_CLIENT_SECRET=<sentinel-hub-secret>
```

Docker: `docker-compose.yml` provides MySQL 8 on port 3307.

## Frontend
- **Repo:** cercu-frontend (sibling directory)
- **Dev URL:** `http://localhost:3001`

## Project Structure
```
cercu-backend/
├── src/
│   ├── index.ts              # Bootstrap: DB init → cron jobs → server listen
│   ├── app.ts                # Express setup: middleware → routes → error handler
│   ├── config/index.ts       # Centralized env config
│   ├── ormconfig.ts          # TypeORM DataSource (auto-sync in dev, UTF8mb4)
│   ├── entities/             # 49 TypeORM entities (34 core + 15 observatory)
│   │   └── observatory/     # 15 entities: ObservatoryAdmin, ProspectSubmission, Obs* (content/CMS/news +
│   │                         # arrecifes: Reef, Conflict, Contributor, Observation, BleachingAlert)
│   ├── modules/
│   │   ├── auth/             # Phone OTP + Google OAuth, token rotation
│   │   ├── users/            # Profile management, change requests
│   │   ├── categories/       # Service categories + chips + conditional fields + pricing
│   │   ├── professionals/    # Onboarding, profile, schedule, portfolio, lead access
│   │   ├── leads/            # Lead CRUD, matching algorithm, anti-spam, pricing
│   │   ├── wallet/           # Balance, transactions, topup
│   │   ├── subscriptions/    # Plan subscriptions, renewal, switching
│   │   ├── plans/            # Plan listing
│   │   ├── boosts/           # Boost purchase, rotation, category-specific
│   │   ├── gamification/     # XP, levels, achievements, missions, trust score
│   │   ├── guardianes/       # Analytics para juego Guardianes del Barrio Verde (público, sin auth)
│   │   ├── admin/            # Full CRUD for all entities, audit logs, moderation
│   │   └── observatory/      # Observatory system (auth + CRUD + detector + AI + remote sensing)
│   │       ├── auth/         # Email+password login (ObservatoryAdmin entity, bcrypt, JWT)
│   │       ├── admin/        # Prospect approval queue, content CRUD, CMS, notihumedal, admin users
│   │       ├── detector/     # Geospatial detection (Overpass API + Turf.js)
│   │       ├── ai/           # Roof analysis via Gemini 2.0 Flash (image → green roof aptitude)
│   │       └── remote-sensing/  # Vegetation/water indices (GEE + Sentinel Hub + fallback)
│   ├── jobs/                 # 4 cron jobs
│   ├── seeds/                # Database seeding: categories, admin, test data, gamification, observatory-admin,
│   │                         # observatory-content, arrecifes, arrecifes-observations, arrecifes-alerts
│   ├── middleware/           # auth, role, observatory-auth, errorHandler, rateLimiter, validate, upload
│   ├── utils/                # jwt, asyncHandler, haversine, pagination, phone
│   └── types/                # TypeScript definitions
└── uploads/                  # Multer file storage
```

## API Routes
Base: `http://localhost:3000/api/v1`

```
GET    /health                              # Health check

# Auth
POST   /auth/request-otp                    # Send OTP (rate limited)
POST   /auth/verify-otp                     # Login/register via OTP
POST   /auth/google                         # Google OAuth
POST   /auth/refresh                        # Token rotation
POST   /auth/logout                         [AUTH]
GET    /auth/me                             [AUTH]

# Users
GET    /users/profile                       [AUTH]
PUT    /users/profile                       [AUTH]
POST   /users/deactivate                    [AUTH]

# Categories
GET    /categories/                         # All categories + chips + fields + pricing

# Professionals
POST   /professionals/onboard              [AUTH]
GET    /professionals/:id
PUT    /professionals/profile              [AUTH, PRO]
POST   /professionals/schedule             [AUTH, PRO]
POST   /professionals/categories           [AUTH, PRO]
POST   /professionals/photos               [AUTH, PRO]
GET    /professionals/leads                [AUTH, PRO]

# Leads
POST   /leads/                             [AUTH]
GET    /leads/                             [AUTH]
GET    /leads/:id                          [AUTH]
POST   /leads/:id/take                     [AUTH, PRO]
PUT    /leads/:id/status                   [AUTH]

# Wallet
GET    /wallet/                            [AUTH]
GET    /wallet/transactions                [AUTH]
POST   /wallet/topup                       [AUTH]

# Plans & Subscriptions
GET    /plans/
GET    /subscriptions/                     [AUTH]
POST   /subscriptions/switch               [AUTH, PRO]

# Boosts
GET    /boosts/types                        # Public: list boost types
GET    /boosts/promoted/:categoryId         # Public: boosted pros for category
GET    /boosts/active                      [AUTH, PRO]
POST   /boosts/purchase                    [AUTH, PRO]  body: { boostTypeId, categoryId? }

# Gamification
GET    /gamification/dashboard             [AUTH]
GET    /gamification/achievements          [AUTH]
GET    /gamification/missions              [AUTH]
GET    /gamification/xp-history            [AUTH]
GET    /gamification/trust-score           [AUTH]

# Guardianes del Barrio Verde (público, sin auth)
POST   /api/guardianes/events                  # Recibe evento de analytics del juego
GET    /api/guardianes/stats                   # Estadísticas agregadas para admin dashboard
GET    /api/guardianes/events?limit=500        # Lista eventos crudos (debug)

# Admin (40+ endpoints, all [AUTH, ADMIN])
GET    /admin/summary
GET    /admin/users
POST   /admin/users/:id/block|unblock|flag
GET    /admin/professionals
POST   /admin/professionals/:id/approve|reject|suspend
GET    /admin/leads
POST   /admin/leads/:id/cancel|refund
POST   /admin/wallet/:id/adjust
# CRUD: categories, chips, fields, pricing, plans, boost-types, levels, achievements, missions, config-kv
GET    /admin/audit-logs
POST   /admin/xp/grant
GET    /admin/pending-changes
POST   /admin/pending-changes/:id/approve|reject
```

## Entities (44)

### Core
- **User** (uuid) — phone, email, name, role (user/professional/admin), authProvider (phone/google)
- **RefreshToken** — Token rotation with bcrypt hash
- **OtpCode** — OTP with expiry, attempt tracking, rate limiting
- **UserTrustScore** — Score 0-100, breakdown JSON, daily recalculation

### Professional
- **ProfessionalProfile** — businessName, location (baseLat/baseLng), serviceRadiusKm, rating, XP, level, completedJobs, responseTime, acceptanceRate, cancellationRate, onboardingStatus
- **ProfessionalCategory** — Junction: Profile M:M Category
- **ProfessionalScheduleSlot** — dayOfWeek (0-6), startTime, endTime
- **ProfessionalWorkPhoto** — Portfolio images
- **PendingProfileChange** — Admin-approved profile edits

### Leads
- **Lead** — userId, categoryId, urgencyTier, lat/lng, priceMXN, description, status, photos, takenByProfessionalId
- **LeadChip** — Junction: Lead M:M CategoryChip
- **LeadConditionalFieldValue** — Dynamic field values
- **LeadMatch** — leadId, professionalProfileId, score, distanceKm, status, isBoosted

### Categories
- **Category** — slug, name, icon, type (emergency/project)
- **CategoryChip** — Options per category
- **CategoryConditionalField** — Dynamic form fields per category
- **CategoryPricing** — Pricing by urgency tier

### Financial
- **Wallet** — balance, totalLoaded, totalSpent, isFrozen
- **WalletTransaction** — type (credit/debit), reason (topup, lead_purchase, refund, boost_purchase, mission_reward, achievement_reward, etc.)
- **CreditLedger** — Monthly credit tracking with monthKey (YYYY-MM) for cap enforcement

### Plans & Subscriptions
- **Plan** — slug, priceMXN, maxLeadsPerDay, maxLeadsPerMonth, matchPriorityBoost, boostSlotsIncluded, maxMissionsPerWeek, boostDiscountPercent, priorityLeadAccess
- **Subscription** — userId, planId, status, currentPeriodStart/End, autoRenew, boostSlotsUsedThisPeriod

### Gamification
- **ProLevel** — level, name, xpRequired, matchScoreBonus, perks, icon
- **ProXPLog** — XP audit trail (reason, amount, referenceType/Id)
- **Achievement** — slug, triggerType (16 types), triggerCondition, reward (xp/walletCredit/boostHours/badge), target (USER/PRO/BOTH)
- **ProAchievement** — User progress/completion tracking
- **MissionTemplate** — missionType (8 types), targetCondition, reward, minPlan (starter/normal/premium)
- **ActiveMission** — userId, status (in_progress/completed/failed/expired), currentProgress, weekStart/weekEnd

### Boosts
- **BoostType** — slug, scoreBonus, durationHours, priceMXN
- **ActiveBoost** — userId, boostTypeId, categoryId (nullable), status, startsAt/expiresAt, scoreBonus, pricePaid, usedFreeSlot

### Guardianes del Barrio Verde
- **GuardianesEvent** — eventId, type (registration/session_start/chapter_start/chapter_complete/mission_start/mission_complete/mission_retry), timestamp (BIGINT, parseado como Number en service porque MySQL driver devuelve string), playerId (hash anónimo), data (JSON: age, chapterId, missionId, device info). Sin auth — juego para niños. Índices en type y playerId. Tabla: `guardianes_events` (creada manualmente en prod, synchronize off).

### Admin
- **AdminAction** — Full audit log (40+ action types), with metadata JSON (before/after)
- **Report** — User reports (targetType, reason, status)
- **ConfigKV** — Dynamic key-value configuration (no redeploy needed)

## Cron Jobs
| Job | Schedule | Purpose |
|-----|----------|---------|
| Boost expiration | Every 15 min | Expire boosts past expiresAt |
| Subscription renewal | Daily 00:05 | Charge wallet or mark PAST_DUE |
| Mission rotation | Monday 00:01 | Expire old missions, assign new ones per plan |
| Trust score recalc | Daily 03:00 | Recalculate all user trust scores |

## Key Business Logic

### Matching Algorithm (`modules/leads/matching.service.ts`)
1. **Bounding box pre-filter** — 25km max radius
2. **Hard filters:** category match, distance <= serviceRadius, wallet balance >= lead price, wallet not frozen, daily/monthly lead limits (from plan), schedule availability
3. **Scoring (0-100):**
   - Distance (30pts) — closer = better
   - Response time (20pts) — <5min=20, <15min=15, <30min=10, <60min=5
   - Rating (10pts) — (rating/5) * 10
   - Experience (10pts) — 100+ jobs=10, 50+=7, 20+=5, 5+=3
   - Acceptance rate (15pts)
   - Cancellation penalty (-15pts)
4. **Bonuses:** plan matchPriorityBoost + boost scoreBonus (capped, configurable via `boost_score_cap`) + level matchScoreBonus
5. **Output:** Top N matches saved as LeadMatch with isBoosted flag

### Anti-Abuse
- **Lead spam:** Max 3 leads per 24h, duplicate detection (same category, <150m, <6h)
- **Client protection ("Cliente protegido 30 dias"):** If user+pro had completed lead within configurable days, charge fee
- **Boost score cap:** Configurable via ConfigKV (`boost_score_cap`, default 15)
- **Credit cap:** Monthly max for achievement/mission rewards (configurable)

### Plans (3 tiers)
| Feature | Starter (free) | Normal ($299) | Premium ($799) |
|---------|----------------|---------------|----------------|
| Leads/month | 20 | 80 | 250 |
| Missions/week | 1 | 1 | 2 |
| Boost discount | 0% | 0% | 20% |
| Priority leads | No | No | Yes |

### Boost Rotation
- Round-robin based on time (rotates every 5 minutes)
- Category-specific or global (null categoryId)
- Max per block configurable via `boost_max_per_block`

### Mission Rotation (Weekly)
- Filters templates by `minPlan` tier eligibility
- Assigns up to `plan.maxMissionsPerWeek` per professional
- Shuffles eligible templates for variety

## Architecture Patterns

### Module Pattern
```
modules/[feature]/
├── [feature].controller.ts    # req/res handling, calls service
├── [feature].service.ts       # Business logic, DB queries
├── [feature].routes.ts        # Express router + middleware chain
└── [feature].validation.ts    # Joi schemas (optional)
```

### Service Pattern
```typescript
export class SomeService {
  private repo = AppDataSource.getRepository(Entity);
  // Direct repository access, no DI framework

  async doSomething() {
    // Business logic here
  }
}
```

### Error Handling
```typescript
throw new AppError('Human-readable message', 400);  // Custom error class
// Caught by errorHandler middleware → { success: false, error: { message } }
```

### Route Pattern
```typescript
router.post('/endpoint',
  authMiddleware,                    // JWT validation
  requireRole('professional'),       // Role check
  validate(joiSchema),              // Input validation
  asyncHandler(controller.method)   // Async error wrapper
);
```

### Response Format
```json
// Success
{ "success": true, "data": { ... } }
// or with pagination
{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 20, "total": 100 } }

// Error
{ "success": false, "error": { "message": "..." } }
```

## Database Conventions
- Users: UUID primary keys
- Other entities: Auto-increment integer IDs
- Financial amounts: `decimal(10,2)`
- Coordinates: `decimal(10,7)`
- Timestamps: `@CreateDateColumn()` + `@UpdateDateColumn()`
- Table names: snake_case (`lead_matches`, `active_boosts`)
- Column names: camelCase in code, auto-mapped to snake_case by TypeORM
- Enums: TypeScript string enums stored as MySQL ENUMs

## ConfigKV Keys
Dynamic configuration (editable by admin without redeploy):
- `boost_score_cap` (default 15) — Max boost bonus in matching
- `boost_max_per_block` (default 1) — Promoted boosts per category block
- `client_protection_days` (default 30) — Anti-bypass protection window
- `client_protection_fee` (default 5) — Anti-bypass fee MXN
- `credit_monthly_cap_user` (default 50) — Max credits/month for users
- `credit_monthly_cap_pro` (default 100) — Max credits/month for pros
- `trust_score_base` (default 50) — Base trust score
- `xp_job_completed`, `xp_high_rating`, `xp_fast_response`, `xp_consecutive` — XP award amounts

## Deployment (Production)

**Server:** `srv1420267` — `/var/www/cercu-backend`
**Process manager:** PM2 (`cercu-api`)

### Deploy steps
```bash
# On server (ssh into srv1420267)
cd /var/www/cercu-backend
git pull origin main
npm install            # Need devDeps (@types/*) for tsc compilation
npm run build          # or: yarn build
pm2 restart cercu-api
```

### First-time setup
```bash
npm install
npm run build
pm2 start dist/index.js --name cercu-api
pm2 save
pm2 startup
```

### Notes
- Do NOT use `npm ci --omit=dev` before build — `tsc` needs `@types/*` from devDependencies
- After build, optionally run `npm prune --omit=dev` to slim down node_modules
- `Dockerfile.prod` available for containerized deployment (multi-stage build, node:20-alpine)

## Conventions
- All service methods are async
- Wrap route handlers with `asyncHandler()` for error propagation
- Admin actions logged to AdminAction entity with metadata (before/after JSON)
- Wallet changes always create WalletTransaction record
- XP changes always create ProXPLog record
- Credit rewards tracked in CreditLedger with monthKey for cap enforcement
- Use `In()` from typeorm for batch loading (avoid N+1 queries)
- Use `createQueryBuilder` for complex joins and aggregations

## Observatory Admin System

Shared backend for **three** observatory frontends: **observatorio-techos-verdes** (green roofs), **observatorio-humedales** (artificial wetlands), and **observatorio-arrecifes** (Mexican coral reefs — `arrecifes.cercu.com.mx`, port 3007).

### Architecture
- **Separate entity**: `ObservatoryAdmin` (not the CERCU `User` table) — email+password auth, bcrypt-hashed
- **Separate middleware**: `observatory-auth.middleware.ts` — verifies JWT, looks up `observatory_admins` table
- **Multi-tenant**: Routes use `/:observatory` param (`techos-verdes` | `humedales` | `arrecifes`), middleware validates admin has access
- **Approval queue**: `ProspectSubmission` entity — external detectors POST prospects, admin approves/rejects

### Entities (15)
**Shared:**
- `ObservatoryAdmin` (`observatory_admins`) — id (uuid), email, passwordHash, name, observatories (simple-array), isActive
- `ProspectSubmission` (`obs_prospect_submissions`) — id, observatory, status (pendiente/aprobado/rechazado), data (JSON), source, confianzaDetector, notasAdmin, reviewedBy, reviewedAt
- `ObsCmsSection` (`obs_cms_sections`) — CMS page sections: pageSlug, sectionKey, items (JSON array), updatedBy

**Techos verdes:**
- `ObsGreenRoof` (`obs_green_roofs`) — green roof CRUD data
- `ObsCandidateRoof` (`obs_candidate_roofs`) — candidate roof CRUD data
- `ObsValidationRecord` (`obs_validation_records`) — validation records

**Humedales:**
- `ObsHumedal` (`obs_humedales`) — wetland CRUD data
- `ObsHallazgo` (`obs_hallazgos`) — findings & recommendations
- `ObsNotihumedal` (`obs_notihumedal`) — wetland news articles: titulo, slug, resumen, contenido (longtext), css_content, editor_data (JSON), autor, fecha, tags (JSON), imagen
- `ObsProspectoNoticia` (`obs_prospecto_noticias`) — scraped news prospects: titulo, resumen, url, fuente, fecha, estado (pendiente/aprobado/rechazado), notasRechazo, urlHash (SHA-256 for dedup), reviewedBy

**Arrecifes** (módulo `modules/observatory/arrecifes/`):
- `ObsReef` (`obs_reefs`) — name, state, ocean, region, benthicClasses (JSON), geomorphicClasses (JSON), area, depthRange (JSON tuple), protection, status, liveCoralCover, bleachingAlert, speciesRichness, threats (JSON), observations counter, lat/lng, description, hero, **gallery (JSON max 3)**, imageCredit, visible, archived
- `ObsConflict` (`obs_conflicts`) — title, summary, fullStory (longtext), reefIds (JSON), state, threats (JSON), intensity, status, affectedCommunities (JSON), affectedSpecies (JSON), drivers (JSON), resistance (JSON), legalActions (JSON), mediaUrls (JSON), startedAt, contributorId, visible, archived
- `ObsContributor` (`obs_contributors`) — displayName, handle (unique), role, affiliation, bio, avatarUrl, state, joinedAt, tier (bronze→coral), reputationScore, validatedContributions, rejectedContributions, acceptanceRate, averageQuality, consecutiveMonthsActive, badges (JSON), publicProfile, verified, visible, archived
- `ObsObservation` (`obs_observations`) — reefId (nullable), type, title, description, contributorId, capturedAt, submittedAt, lat/lng, attachments (JSON), tags (JSON), status (pending/in_review/validated/rejected/needs_more_info), reviewerId, reviewerNotes, validatedAt, qualityScore, visible, archived
- `ObsBleachingAlert` (`obs_bleaching_alerts`) — reefId, level (no_stress/watch/warning/alert_1/alert_2), dhw, sst, sstAnomaly, observedAt, source (default `noaa_crw`), productUrl

**Routes arrecifes** (mounted under `/api/v1/observatory/arrecifes/`):
- Públicas: `GET /reefs[?ocean=&status=&state=]`, `/reefs/:id`, `/conflicts`, `/contributors`, `/observations` (validated only), `/alerts/bleaching?latestPerReef=true`
- Admin (Bearer JWT): full CRUD `/admin/{reefs|conflicts|contributors}`, `POST /admin/observations/:id/review` (workflow validar/rechazar/needs_more_info → actualiza counters de contributor + reef), `POST /admin/alerts/bleaching` (ingest NOAA CRW)
- Submission ciudadana: `POST /observations` (sin auth → estado `pending`)

**Migraciones:**
- `1722000000000-CreateArrecifesTables.ts` — crea las 5 tablas (`obs_reefs`, `obs_conflicts`, `obs_contributors`, `obs_observations`, `obs_bleaching_alerts`) con índices (ocean, status, intensity, tier, etc.). Idempotente vía `SHOW TABLES LIKE`.
- `1723000000000-AddGalleryToObsReefs.ts` — añade columna `gallery JSON NULL` a `obs_reefs`. Idempotente vía `SHOW COLUMNS LIKE`.

**Seeds** (en `src/seeds/run.ts`, idempotentes — actualizan si existe `id`):
- `arrecifes.seed.ts` — 12 reefs mexicanos + 8 contributors (con tiers bronze→coral) + 6 conflicts (Tren Maya, anclaje cruceros, sargazo, SCTLD, sobrepesca, aguas residuales) + galería Unsplash 3 fotos por reef
- `arrecifes-observations.seed.ts` — 6 observations cubriendo todo el workflow (1 pending, 1 in_review, 2 validated, 1 rejected, 1 needs_more_info) — demo de la cola de revisión
- `arrecifes-alerts.seed.ts` — 12 alertas NOAA CRW (una por reef) con DHW/SST/anomalía realistas: SAM en warning/alert_1, Pacífico BCS no_stress, Huatulco warning
- `observatory-admin.seed.ts` — el `ObservatoryAdmin` master se crea con `observatories: ['techos-verdes', 'humedales', 'arrecifes']` y permisos extendidos (incluyendo `manage_reefs`, `review_submissions`, `manage_conflicts`, `manage_contributors`)

### Observatory API Routes
Base: `/api/v1/observatory`

```
# Auth (public)
POST /auth/login                              # Email + password → JWT tokens

# Auth (protected)
GET  /auth/me                                 # Current admin info

# Admin (protected, scoped by observatory)
GET  /:observatory/admin/summary              # Dashboard stats (content counts + prospect counts)

# Prospects (admin)
GET  /:observatory/admin/prospectos           # List prospects (filterable by status)
GET  /:observatory/admin/prospectos/:id       # Get prospect detail
POST /:observatory/admin/prospectos/:id/aprobar   # Approve prospect
POST /:observatory/admin/prospectos/:id/rechazar  # Reject prospect (requires notas)

# Prospect submission (public — for detector integration)
POST /:observatory/prospectos                 # Submit new prospect

# Content CRUD (admin, all follow GET/POST + GET/PATCH/DELETE pattern)
# Techos Verdes:
/:observatory/admin/green-roofs[/:id]         # Green roof CRUD
/:observatory/admin/candidates[/:id]          # Candidate roof CRUD
/:observatory/admin/validations[/:id]         # Validation record CRUD
# Humedales:
/:observatory/admin/humedales[/:id]           # Wetland CRUD  ?search&alcaldia&tipoHumedal&estado
/:observatory/admin/hallazgos[/:id]           # Hallazgo CRUD

# Notihumedal — Articles (admin CRUD)
GET  /:observatory/admin/notihumedal          # List articles  ?search&autor&tag&fechaDesde&fechaHasta
GET  /:observatory/admin/notihumedal/:id      # Get article
POST /:observatory/admin/notihumedal          # Create article (auto-generates slug)
PATCH /:observatory/admin/notihumedal/:id     # Update article
DELETE /:observatory/admin/notihumedal/:id    # Delete article

# Notihumedal — Scraped news prospects (admin)
GET  /:observatory/admin/notihumedal/prospectos           # List scraped news (filterable by status)
POST /:observatory/admin/notihumedal/prospectos/:id/aprobar   # Approve scraped news
POST /:observatory/admin/notihumedal/prospectos/:id/rechazar  # Reject scraped news
POST /:observatory/admin/notihumedal/scraper/run              # Trigger scraper (placeholder)

# CMS Sections (admin)
GET  /:observatory/admin/cms/:pageSlug                    # Get all sections for page
PUT  /:observatory/admin/cms/:pageSlug/:sectionKey        # Save section content

# Admin Users (admin)
GET    /:observatory/admin/usuarios           # List admin users for observatory
POST   /:observatory/admin/usuarios           # Create admin user
PATCH  /:observatory/admin/usuarios/:id       # Update admin user
DELETE /:observatory/admin/usuarios/:id       # Delete admin user

# Public read endpoints (no auth)
GET /:observatory/green-roofs                 # List green roofs
GET /:observatory/green-roofs/:id             # Get green roof
GET /:observatory/candidates                  # List candidates
GET /:observatory/candidates/:id              # Get candidate
GET /:observatory/validations                 # List validations
GET /:observatory/humedales                   # List wetlands  ?search&alcaldia&tipoHumedal&estado
GET /:observatory/humedales/:id               # Get wetland
GET /:observatory/hallazgos                   # List hallazgos
GET /:observatory/hallazgos/:id               # Get hallazgo
GET /:observatory/notihumedal                 # List articles  ?search&autor&tag&fechaDesde&fechaHasta
GET /:observatory/cms/:pageSlug/:sectionKey   # Read CMS section

# Geospatial Detector (admin)
POST /:observatory/detector/run               # Run detection (OSM + Turf.js)
POST /:observatory/detector/submit            # Submit detected candidates as prospects

# AI Analysis
POST /:observatory/ai/analyze-roof            # Analyze roof image via Gemini (base64 image → aptitude score)

# Remote Sensing — Vegetation/water indices
POST /:observatory/remote-sensing/indices     # Get NDVI/EVI/SAVI/NDWI/LST for coordinates (GEE → Sentinel Hub → fallback)
```

### Geospatial Detector Module
**Directory:** `src/modules/observatory/detector/`
**Dependencies:** `@turf/turf` (spatial analysis — area, centroid, bboxPolygon, booleanPointInPolygon, rectangularity)

Detects candidates using OpenStreetMap data via the **Overpass API** (free, no key required) + **Turf.js** geometric analysis. Two observatory-specific strategies:
- **techos-verdes**: Queries OSM buildings in bounding box → scores by area, rectangularity, building type, levels, roof material → flat-roof candidate identification
- **humedales**: Queries OSM water bodies, wetlands, waterways, wastewater plants, parks in bounding box → scores by feature type and area → wetland site identification

The Overpass API queries use `[out:json]` format with configurable bounding box coordinates passed from the frontend. Results can be bulk-submitted as `ProspectSubmission` records with `source: 'ia_detector'`.

### AI Roof Analysis Module
**Directory:** `src/modules/observatory/ai/`
**Dependencies:** `@google/generative-ai` (Gemini 2.0 Flash)

Analyzes roof images (base64-encoded) to evaluate green roof installation aptitude. Returns structured JSON with:
- `techoPlano`, `materialEstimado`, `obstrucciones` — physical assessment
- `aptitudTechoVerde` (0-100) — overall suitability score
- `tipoRecomendado` — extensivo/semi-intensivo/intensivo/no_apto
- `confianza` / `porcentajeConfianza` — model confidence

Requires `GEMINI_API_KEY` env var.

### Remote Sensing Module
**Directory:** `src/modules/observatory/remote-sensing/`
**Cascade strategy:** Google Earth Engine → Sentinel Hub → local fallback (empty data)

Retrieves vegetation/water spectral indices for a given coordinate:
- **NDVI** — Normalized Difference Vegetation Index
- **EVI** — Enhanced Vegetation Index
- **SAVI** — Soil Adjusted Vegetation Index
- **NDWI** — Normalized Difference Water Index
- **LST** — Land Surface Temperature (Landsat only, not yet implemented)

GEE uses Sentinel-2 SR Harmonized imagery via REST API with JWT auth from a service account. Sentinel Hub uses OAuth2 client credentials + Statistical API. Both return time-series data when available.

### Password Setup
```bash
# In .env:
OBS_ADMIN_EMAIL=admin@observatorio.cdmx
OBS_ADMIN_PASSWORD=YourSecretPassword
OBS_ADMIN_NAME=Admin Observatorios

# Then:
npm run seed   # Creates/updates admin with bcrypt hash (12 rounds)
```

### Frontend Integration
Three observatory frontends connect to this backend:
- **techos-verdes** — port 3002 prod, `https://techos-verdes.cercu.com.mx`
- **humedales** — port 3005 prod, `https://humedales.cercu.com.mx`
- **arrecifes** — port 3007 prod, `https://arrecifes.cercu.com.mx`
- Admin pages at `/admin/login` → `/admin/*` with JWT stored in localStorage (per-observatory key)
- Frontend `useApi` composable detecta 401/403 → auto-logout + redirect a `/admin/login?redirect=<ruta>` con `replace: true` (sin entrada en back-stack)
- Asegurar CORS_ORIGIN incluye los 3 dominios públicos antes de pegar PRs
