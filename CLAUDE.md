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
│   ├── entities/             # 53 TypeORM entities (34 core + 19 observatory)
│   │   └── observatory/     # 18 entities: ObservatoryAdmin, ProspectSubmission, Obs* (content/CMS/news +
│   │                         # arrecifes: Reef (con climateData NASA POWER cacheada),
│   │                         # Conflict (con geometry GeoJSON), Contributor, Observation,
│   │                         # BleachingAlert, Layer (CRUD + uploads), Tier (escalas)) +
│   │                         # InteractionEvent (tracking público anónimo de los 3 observatorios)
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
│   │       ├── arrecifes/    # CRUD reefs/conflicts/contributors/observations/layers/tiers +
│   │       │                 # NASA POWER climatology integration (nasaPower.service.ts)
│   │       ├── events/       # Tracking ingest + analytics summary (anónimo, multi-observatory)
│   │       ├── comunidad/    # Public POST /:observatory/comunidad/aportes — community contributions
│   │       │                 # from /comunidad page (techos-verdes, humedales, arrecifes). Wraps
│   │       │                 # ProspectSubmission with source='comunidad'. Honeypot anti-spam.
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

### Entities (22)
**Shared:**
- `ObservatoryAdmin` (`observatory_admins`) — id (uuid), email, passwordHash, name, observatories (simple-array), isActive
- `ProspectSubmission` (`obs_prospect_submissions`) — id, observatory, status (pendiente/aprobado/rechazado), data (JSON), source, confianzaDetector, notasAdmin, reviewedBy, reviewedAt, **contributorId** (INT NULL — referencia a `obs_humedales_contributors.id` cuando observatory='humedales')
- `ObsCmsSection` (`obs_cms_sections`) — CMS page sections, **multi-tenant**: observatory (default `'humedales'`), pageSlug, sectionKey, items (JSON array), updatedBy. Índice compuesto `(observatory, pageSlug, sectionKey)` para el lookup del servicio. Cada observatorio mantiene su propio set de secciones — sin colisiones por `pageSlug='home'`

**Techos verdes:**
- `ObsGreenRoof` (`obs_green_roofs`) — green roof CRUD data
- `ObsCandidateRoof` (`obs_candidate_roofs`) — candidate roof CRUD data
- `ObsValidationRecord` (`obs_validation_records`) — validation records

**Humedales:**
- `ObsHumedal` (`obs_humedales`) — wetland CRUD data
- `ObsHallazgo` (`obs_hallazgos`) — findings & recommendations
- `ObsNotihumedal` (`obs_notihumedal`) — wetland news articles: titulo, slug, resumen, contenido (longtext), css_content, editor_data (JSON), autor, fecha, tags (JSON), imagen
- `ObsProspectoNoticia` (`obs_prospecto_noticias`) — scraped news prospects: titulo, resumen, url, fuente, fecha, estado (pendiente/aprobado/rechazado), notasRechazo, urlHash (SHA-256 for dedup), reviewedBy
- `ObsHumedalTier` (`obs_humedales_tiers`) — escala reputacional / modos de participación humedales-only: slug (unique), label, description, minScore, maxScore, color, requirements, icon, sortOrder, visible, archived, modeTitle, audience, contributions (JSON), bridge. Tabla SEPARADA de `obs_tiers` (arrecifes) para evitar colisión de slugs.
- `ObsHumedalContributor` (`obs_humedales_contributors`) — colaboradores humedales: displayName, handle (unique), role (`ciudadano|investigador|estudiante|institucion|gobierno|ong|tecnico_campo`), affiliation, bio, avatarUrl, alcaldia, joinedAt, tier (slug → `obs_humedales_tiers.slug`), reputationScore, validatedContributions, rejectedContributions, acceptanceRate, averageQuality, consecutiveMonthsActive, badges (JSON), publicProfile, verified, visible, archived. Tabla SEPARADA de `obs_contributors` (arrecifes).

**Techos Verdes — Tiers + Contributors (mismo patrón que humedales):**
- `ObsTechosVerdesTier` (`obs_techos_verdes_tiers`) — escala reputacional / modos de participación con vocabulario propio (slugs `aprendiz`, `reportador`, `caracterizador`, `especialista`, `operador`). Misma estructura que `ObsHumedalTier`. Tabla SEPARADA de `obs_tiers` y `obs_humedales_tiers`.
- `ObsTechosVerdesContributor` (`obs_techos_verdes_contributors`) — colaboradores techos verdes: roles adaptados (`ciudadano|propietario|arquitecto|ingeniero|empresa|gobierno|ong|academia`), tier (slug → `obs_techos_verdes_tiers.slug`). Misma estructura que `ObsHumedalContributor`.

**Arrecifes** (módulo `modules/observatory/arrecifes/`):
- `ObsReef` (`obs_reefs`) — name, state, ocean, region, benthicClasses (JSON), geomorphicClasses (JSON), area, depthRange (JSON tuple), protection, status, liveCoralCover, bleachingAlert, speciesRichness, threats (JSON), observations counter, lat/lng, description, hero, **gallery (JSON max 3)**, imageCredit, visible, archived, **climateData (JSON ReefClimateData NASA POWER)**, **climateFetchedAt (datetime nullable)**
- `ObsConflict` (`obs_conflicts`) — title, summary, fullStory (longtext), reefIds (JSON), state, threats (JSON), intensity, status, affectedCommunities (JSON), affectedSpecies (JSON), drivers (JSON), resistance (JSON), legalActions (JSON), mediaUrls (JSON), startedAt, **geometry (JSON GeoJSON Point/LineString/Polygon/Multi*)**, contributorId, visible, archived
- `ObsContributor` (`obs_contributors`) — displayName, handle (unique), role, affiliation, bio, avatarUrl, state, joinedAt, tier (slug → `obs_tiers.slug`), reputationScore, validatedContributions, rejectedContributions, acceptanceRate, averageQuality, consecutiveMonthsActive, badges (JSON), publicProfile, verified, visible, archived
- `ObsObservation` (`obs_observations`) — reefId (nullable), type, title, description, contributorId, capturedAt, submittedAt, lat/lng, attachments (JSON), tags (JSON), status (pending/in_review/validated/rejected/needs_more_info), reviewerId, reviewerNotes, validatedAt, qualityScore, visible, archived
- `ObsBleachingAlert` (`obs_bleaching_alerts`) — reefId, level (no_stress/watch/warning/alert_1/alert_2), dhw, sst, sstAnomaly, observedAt, source (default `noaa_crw`), productUrl
- `ObsLayer` (`obs_layers`) — slug (unique), title, description, kind (`external_url`|`uploaded_file`), provider, providerLabel, category, format (wms/wmts/geotiff/shapefile/geojson/kml/csv/cog), resolution, cadence, coverage, license, attribution, sourceUrl, downloadUrl, previewUrl, wmsUrl, wmsLayerName, tileUrlPattern, overlayOpacity (decimal 3,2), fileName, filePath, fileSize (bigint), mimeType, lastUpdated, active, visible, archived, sortOrder
- `ObsTier` (`obs_tiers`) — slug (unique), label, description, minScore, maxScore (nullable), color (token), requirements, icon (lucide), sortOrder, visible, archived. Borrado físico bloqueado por el service si hay `Contributor` con ese slug (debe archivarse)

⚠️ **Bug TypeORM:** combinar `@Column({ unique: true })` + `@Index()` en la misma columna genera dos índices con el mismo nombre y revienta el `CREATE TABLE` con `Duplicate key name`. `unique: true` ya crea el índice — basta con uno (ver `Layer.ts:14`, `Tier.ts:18`).

**Routes arrecifes** (mounted under `/api/v1/observatory/arrecifes/`):
- Públicas: `GET /reefs[?ocean=&status=&state=]`, `/reefs/:id`, `/reefs/metrics?days=N`, `/reefs/:id/metrics?days=N` (snapshots históricos), `/conflicts`, `/contributors`, `/observations` (validated only), `/alerts/bleaching?latestPerReef=true`, `/layers[?provider=&category=&kind=]`, `/layers/:id` (acepta id numérico o slug), `/layers/:id/download` (sirve archivo o redirect 302), `/tiers` (acepta id o slug)
- Admin (Bearer JWT): full CRUD `/admin/{reefs|conflicts|contributors|layers|tiers}`. Observaciones: `POST /admin/observations` (admin crea directo, default `validated`), `POST /admin/observations/:id/review` (workflow validar/rechazar/needs_more_info → actualiza counters de contributor + reef), `PATCH /admin/observations/:id` (edita metadatos sin cambiar estado), `DELETE /admin/observations/:id`. Alertas: `GET/POST/PATCH/DELETE /admin/alerts/bleaching[/:id]` (cualquier mutación sincroniza `reef.bleachingAlert` y `reef.status`). Snapshots: `POST /admin/reefs/snapshot` (idempotente por día, captura los 12 reefs), `DELETE /admin/reefs/snapshots/:id` (limpieza puntual). Layers: `POST /admin/layers/:id/upload` (multer multipart "file", ≤50 MB, GeoJSON/KML/KMZ/Shapefile zip/GeoTIFF/CSV). Climatología: `POST /admin/reefs/refresh-climate` (batch NASA POWER de los 12 reefs, secuencial 350 ms entre requests), `POST /admin/reefs/:id/refresh-climate` (un solo reef). Coastal intrusions: además del detector y workflow ya documentado, `POST /admin/coastal-intrusions` (creación manual con Point→buffer 25m o Polygon/MultiPolygon, source=`manual`) y `DELETE /admin/coastal-intrusions/:id`.
- Submission ciudadana: `POST /observations` (sin auth → estado `pending`)

**NASA POWER integration** (`modules/observatory/arrecifes/nasaPower.service.ts`):
- Endpoint público sin auth: `https://power.larc.nasa.gov/api/temporal/climatology/point`
- Parámetros: `ALLSKY_SFC_SW_DWN, T2M, PRECTOTCORR, WS10M, RH2M`, community `RE`
- `fetchReefClimate(lat, lng)` con `AbortController` y timeout 20 s. Devuelve
  `ReefClimateData` (medias anuales + serie mensual de 12 valores). Se guarda en
  `ObsReef.climateData` (JSON) + `climateFetchedAt`. Idempotente — re-llamar
  sobreescribe. Auto-sync TypeORM en dev; en prod requerirá migración manual para
  añadir las dos columnas al servidor existente.

**File uploads** (`modules/observatory/arrecifes/arrecifes.upload.ts`): multer con disk storage en `uploads/layers/`, filename `{uuid}.{ext}`. Validación combinada por mime + extensión (multer reporta mimes inconsistentes para shapefile zip). El servicio borra el archivo previo al reemplazar y al hacer DELETE de la layer.

**Migraciones:**
- `1722000000000-CreateArrecifesTables.ts` — crea las 5 tablas iniciales (`obs_reefs`, `obs_conflicts`, `obs_contributors`, `obs_observations`, `obs_bleaching_alerts`) con índices (ocean, status, intensity, tier, etc.). Idempotente vía `SHOW TABLES LIKE`.
- `1723000000000-AddGalleryToObsReefs.ts` — añade columna `gallery JSON NULL` a `obs_reefs`. Idempotente vía `SHOW COLUMNS LIKE`.
- `1724000000000-AddLayersTiersAndConflictGeometry.ts` — crea `obs_layers` (catálogo + uploads) y `obs_tiers` (modos de participación / escalas reputacionales) + agrega `geometry JSON NULL` a `obs_conflicts`. Sólo `UNIQUE INDEX` sobre `slug` (sin INDEX adicional) para evitar el bug TypeORM "Duplicate key name". Idempotente.
- `1725...` → `1732000000000` ya documentadas en sus secciones respectivas (NASA POWER + InteractionEvent · isActive/lastLogin admin · scraper notihumedal · snapshots · noticias arrecifes · coastal intrusions Fase 1/2/3).
- `1733000000000-EnsureCmsSectionsTable.ts` — crea `obs_cms_sections` si no existe. Cierra brecha histórica: la entidad `ObsCmsSection` se creó hace tiempo con auto-sync y nunca tuvo migración explícita.
- `1734000000000-EnsureProspectSubmissionsTable.ts` — crea `obs_prospect_submissions` si no existe. Cola compartida de prospectos para techos-verdes y humedales (no arrecifes — éste tiene `obs_observations` y `obs_reef_news_prospects` propios). Misma situación que 1733: la entidad existía sin migración explícita.
- `1735000000000-AddModeFieldsToObsTiers.ts` — añade `modeTitle`, `audience`, `contributions` (JSON), `bridge` a `obs_tiers` para el reframe de "modos de participación" en `/contributors`.
- `1736000000000-AddObservatoryToCmsSections.ts` — añade columna `observatory` a `obs_cms_sections` con default `'humedales'` (backfill para preservar las secciones existentes) + índice compuesto `(observatory, pageSlug, sectionKey)`. Permite que arrecifes tenga su propio set de secciones sin colisionar con humedales en `pageSlug='home'`. Idempotente vía `SHOW COLUMNS / SHOW INDEX`.
- `1737000000000-AddCCHOrienteHumedal.ts` — inserta el humedal artificial del CCH Oriente UNAM (programa SECTEI–UNAM–GMI, fines de 2019) en `obs_humedales` con `visible=true`. Tipo HSSF inferido por el proceso descrito; vegetación documentada (papiro, carrizo, cola de caballo); sustrato gravas + biopelícula; capacidad y eficiencias específicas no publicadas (referencia del programa: ENCiT 600 L/d). Fuentes citadas en `fuente`: Gaceta UNAM 2023, DGCS-UNAM Boletín 1060/2022, UNAM Global, Fundación UNAM, PortalAmbiental.com.mx. Idempotente vía `SELECT … WHERE nombre LIKE '%CCH Oriente%'`.
- `1738000000000-CreateHumedalTiersAndContributors.ts` — crea `obs_humedales_tiers` y `obs_humedales_contributors` (tablas separadas de `obs_tiers`/`obs_contributors` para evitar colisión de slugs/handles con arrecifes) + agrega `contributorId INT NULL` a `obs_prospect_submissions` con índice. Idempotente vía `SHOW TABLES` y `SHOW COLUMNS`. Habilita el sistema de atribución a prospectos del Observatorio de Humedales.
- `1739000000000-CreateTechosVerdesTiersAndContributors.ts` — crea `obs_techos_verdes_tiers` y `obs_techos_verdes_contributors` con la misma estructura que las humedales-tablas, pero vocabulario propio (slugs `aprendiz/reportador/caracterizador/especialista/operador`, roles `arquitecto/ingeniero/empresa/...`). NO modifica `obs_prospect_submissions.contributorId` (ya existe desde 1738) — la columna se reusa: cuando `observatory='techos-verdes'`, el id apunta a `obs_techos_verdes_contributors.id`. Idempotente.
- `1740000000000-SeedExpandedCmsSections.ts` — siembra ~25 secciones del CMS expandido para humedales (incluye el `home.hero` que reportó el usuario como NO editable) más 2 secciones nuevas para techos-verdes (`contributors.hero`, `contributors.intro`). **Patrón idempotente con `upsertSection()`**: para cada `(observatory, pageSlug, sectionKey)` verifica si ya existe — si existe, NO sobrescribe (preserva contenido editado por humanos en producción); si no existe, inserta los defaults. Marca `updatedBy='migration:1740'` para que el `down()` pueda revertir solo lo que esta migración creó. Cubre el gap entre el seed (que solo corre con `count===0`) y BBDDs en producción que ya tienen algunas secciones humedales pero les falta el resto.
- `1741000000000-SeedTechosVerdesNewPagesCms.ts` — siembra el CMS de las 3 páginas nuevas de techos-verdes: `agenda-2030` (hero + intro), `referencias` (hero), `comunidad` (hero + intro). Mismo patrón idempotente que 1740 (`upsertSection`). Marca `updatedBy='migration:1741'`. Espejo de los defaults de `data/cms-defaults.ts` del frontend.
- `1742000000000-AddSourceIndexToProspects.ts` — añade índice compuesto `IDX_prospect_obs_source` sobre `obs_prospect_submissions(observatory, source)` para acelerar los listados filtrados por `source='comunidad'` desde `/admin/prospectos`. Idempotente vía `SHOW INDEX`. Si la tabla 1734 todavía no existe (orden raro de migraciones), skip + log.

**Seeds** (en `src/seeds/run.ts`, idempotentes — actualizan si existe `id`/`slug`):
- `arrecifes.seed.ts` — 12 reefs mexicanos + 8 contributors + 6 conflicts (Tren Maya, anclaje cruceros, sargazo, SCTLD, sobrepesca, aguas residuales) + galería Unsplash 3 fotos por reef + **5 tiers** (Bronce/Plata/Oro/Platino/Coral con `minScore`/`maxScore`/`color`/`requirements`) + **13 layers** iniciales (NOAA CRW, NASA MODIS/PACE, ESA Sentinel-2, GEBCO, CONABIO ANP+coral, CONANP, GFW, NOAA SaWS, INEGI). Las layers son `kind=external_url`; el admin puede subir `kind=uploaded_file` después.
- `arrecifes-observations.seed.ts` — 6 observations cubriendo todo el workflow (1 pending, 1 in_review, 2 validated, 1 rejected, 1 needs_more_info) — demo de la cola de revisión
- `arrecifes-alerts.seed.ts` — 12 alertas NOAA CRW (una por reef) con DHW/SST/anomalía realistas: SAM en warning/alert_1, Pacífico BCS no_stress, Huatulco warning
- `observatory-content.seed.ts` — secciones CMS multi-tenant. Solo corre cuando `count===0` por observatorio (BBDDs vírgenes); para BBDDs existentes usar la migración 1740. **Humedales (CMS expandido, ~25 secciones)**: home (hero, features, steps, tipologias, servicios), sobre (objetivos, criterios, normativas), analisis (sections), inventario (hero, helpText), mapa (hero, legend), notihumedal (hero, emptyState), registra (hero, steps, confirmation), analisis-indicadores (hero, tabs), analisis-brecha (hero, methodology), analisis-hallazgos (hero, callToAction), contributors (hero, intro), footer (brand, sources, quickLinks, legal) + 5 ObsHumedalTier (`aprendiz`, `observador`, `caracterizador`, `especialista`, `custodio`) + 3 ObsHumedalContributor seed (Equipo CIIEMAD-IPN, Diego Domínguez Solís, GAIA-FQ-UNAM). **Techos Verdes**: home/sobre/metodologia/etc. con 18 secciones + 5 ObsTechosVerdesTier (`aprendiz`, `reportador`, `caracterizador`, `especialista`, `operador`) + 2 ObsTechosVerdesContributor seed (CIIEMAD-IPN, Equipo SEDEMA). **Arrecifes**: 30 secciones cubriendo home (hero/features/sectionTitle/alerts/contributorsTeaser/cta), about (hero/mission/inspirations/sources/reputationIntro/validation/licenses/contact), contribute (hero/sidebar/notice), contributors (hero/modesIntro/networkCallout/cta), heros sueltos (inventory/atlas/data-sources/noticias/observations) y footer (brand/attribution/sources/quickLinks/institutional). Idempotente con count por observatory/tabla.
- `observatory-admin.seed.ts` — el `ObservatoryAdmin` master se crea con `observatories: ['techos-verdes', 'humedales', 'arrecifes']` y permisos extendidos (incluyendo `manage_reefs`, `review_submissions`, `manage_conflicts`, `manage_contributors`, `manage_layers`, `manage_cms`)
- `comunidad-aportes-demo.seed.ts` — 4 ProspectSubmissions demo con `source='comunidad'` y `status='pendiente'` para llenar la cola de `/admin/prospectos` en desarrollo. Cubre los 4 modos representativos de la red de contribuyentes (aprendiz/ciudadano, caracterizador/arquitecto, especialista/academia, operador/empresa). Idempotente: solo inserta cuando ya no hay aportes con `source='comunidad'` para techos-verdes (no toca aportes reales que llegaran vía `POST /:observatory/comunidad/aportes`).

### Observatory API Routes
Base: `/api/v1/observatory`

```
# Auth (public)
POST /auth/login                              # Email + password → JWT tokens

# Auth (protected)
GET  /auth/me                                 # Current admin info

# Admin (protected, scoped by observatory)
GET  /:observatory/admin/summary              # Dashboard stats. Para arrecifes el payload
                                              # cubre toda la plataforma (content/totals,
                                              # observationsByStatus, reefsByStatus,
                                              # contributorsByTier, contributorsVerified,
                                              # alertsByLevel, alertsCritical (DHW≥4),
                                              # latestAlertAt, coastalIntrusions,
                                              # layersByKind, newsProspects, snapshots,
                                              # climate.reefsWithData) — todo paralelizado
                                              # con Promise.all. Ver `ArrecifesService.getSummary`.

# Prospects (admin)
GET  /:observatory/admin/prospectos           # List prospects (filterable by status)
GET  /:observatory/admin/prospectos/:id       # Get prospect detail
POST /:observatory/admin/prospectos/:id/aprobar   # Approve prospect
POST /:observatory/admin/prospectos/:id/rechazar  # Reject prospect (requires notas)

# Prospect submission (public — for detector integration)
POST /:observatory/prospectos                 # Submit new prospect (source: ia_detector | manual | externo | comunidad)

# Comunidad — Public community contributions (no auth)
POST /:observatory/comunidad/aportes          # Receives /comunidad form submissions; creates ProspectSubmission with source='comunidad' and status='pendiente'.
                                              # Validated by `comunidadAporteSchema` (Joi). Honeypot field `website` filters bots silently.
                                              # Module: src/modules/observatory/comunidad/{routes,controller,service}.ts
                                              # Reviewed manually from /admin/prospectos like any other prospect.

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
POST /:observatory/admin/notihumedal/scraper/run              # Trigger scraper Mongabay México

# CMS Sections (admin) — scoped por observatory en el servicio
GET  /:observatory/admin/cms/:pageSlug                    # Get all sections for page (scope: observatory + pageSlug)
PUT  /:observatory/admin/cms/:pageSlug/:sectionKey        # Upsert section (scope: observatory + pageSlug + sectionKey)

# Admin Users (admin)
GET    /:observatory/admin/usuarios           # List admin users for observatory
POST   /:observatory/admin/usuarios           # Create admin user
PATCH  /:observatory/admin/usuarios/:id       # Update admin user
DELETE /:observatory/admin/usuarios/:id       # Delete admin user

# Humedales — Tiers + Contributors + Atribución (modules/observatory/humedales/)
# Solo el observatory='humedales' es válido; el controller rechaza con 404 cualquier otro.
# Tablas SEPARADAS de obs_tiers/obs_contributors (que pertenecen a arrecifes).

# Tiers públicos
GET  /humedales/tiers                         # Lista tiers visibles + no archivados
GET  /humedales/tiers/:id                     # Detalle de un tier

# Tiers admin
GET  /humedales/admin/tiers                   # Lista todos (incluye archivados)
GET  /humedales/admin/tiers/:id
POST /humedales/admin/tiers                   # Crear tier (slug único)
PATCH /humedales/admin/tiers/:id              # Editar tier
DELETE /humedales/admin/tiers/:id             # Soft delete (archived=true, visible=false)

# Contributors públicos
GET  /humedales/contributors                  # Lista contributors visibles + verificados + publicProfile=true
                                              # ?search&role&tier&verified&limit
GET  /humedales/contributors/:id              # Detalle público

# Contributors admin
GET  /humedales/admin/contributors            # Lista todos (incluye privados/archivados)
GET  /humedales/admin/contributors/:id
POST /humedales/admin/contributors            # Crear contributor (handle único, joinedAt auto si no se pasa)
PATCH /humedales/admin/contributors/:id       # Editar contributor
DELETE /humedales/admin/contributors/:id      # Soft delete

# Atribución a prospectos
PATCH /humedales/admin/prospectos/:id/contributor   # Body: { contributorId: number | null }
                                                    # Vincula/desvincula un contribuyente al prospecto

# Techos Verdes — Tiers + Contributors + Atribución (modules/observatory/techos-verdes/)
# Solo el observatory='techos-verdes' es válido; el controller rechaza con 404 cualquier otro.
# Tablas SEPARADAS de obs_tiers/obs_contributors (arrecifes) y obs_humedales_* (humedales).

# Tiers (públicos + admin) — misma forma que las rutas humedales
GET    /techos-verdes/tiers                 GET    /techos-verdes/admin/tiers
GET    /techos-verdes/tiers/:id             GET    /techos-verdes/admin/tiers/:id
                                            POST   /techos-verdes/admin/tiers
                                            PATCH  /techos-verdes/admin/tiers/:id
                                            DELETE /techos-verdes/admin/tiers/:id

# Contributors (públicos + admin)
GET    /techos-verdes/contributors          GET    /techos-verdes/admin/contributors
GET    /techos-verdes/contributors/:id      GET    /techos-verdes/admin/contributors/:id
                                            POST   /techos-verdes/admin/contributors
                                            PATCH  /techos-verdes/admin/contributors/:id
                                            DELETE /techos-verdes/admin/contributors/:id

# Atribución a prospectos
PATCH /techos-verdes/admin/prospectos/:id/contributor   # Body: { contributorId: number | null }

# Tracking + analytics
POST /:observatory/events                                  # Public ingest (rate-limit 60/min/IP, lote ≤50)
GET  /:observatory/admin/analytics/summary?days=N          # Admin: totals/byType/series/topPaths/topTargets

# Arrecifes — climatology refresh (admin)
POST /arrecifes/admin/reefs/refresh-climate                # Batch NASA POWER (12 reefs, 350ms entre requests)
POST /arrecifes/admin/reefs/:id/refresh-climate            # Un solo reef

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
GET /:observatory/cms/:pageSlug/:sectionKey   # Read CMS sections (controller ignora :sectionKey y devuelve TODAS las secciones de la página — el cliente filtra)

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

### Notihumedal Scraper (Mongabay México)
**Directory:** `src/modules/observatory/admin/notihumedal-scraper.service.ts`
**Source:** `https://es.mongabay.com/list/mexico/` — listado público del feed
mexicano de Mongabay Latam. Sin auth, sin rate-limit explícito, dominio público
con atribución obligatoria.

Pipeline:
1. `scrapeMongabayMexico()` — fetch con timeout 20 s + User-Agent identificable
   (`ObservatorioHumedalesBot/1.0`). Parseo por regex sobre los bloques
   `<div class="article--container">` (sin dependencia HTML — la estructura es
   estable). Extrae url, título, autor (`<span class="byline">`), fecha
   (`<span class="date">` con abreviaturas en español: "Abr", "May", "Ago", "Dic")
   e imagen (`<img src>`).
2. Filtro de relevancia por keywords (humedal, manglar, laguna, río, agua,
   tortuga, ramsar, sargazo, etc.) sobre título y URL — reduce ruido sin descartar
   silenciosamente: si nada matchea (raro), conserva el set completo para que
   el admin tenga algo que revisar.
3. **Deduplicación** vía `urlHash = sha256(URL normalizada)` con índice UNIQUE en
   la tabla. Re-correr el scraper no inserta duplicados.
4. Inserta en `obs_prospecto_noticias` con `estado='pendiente'` y
   `fuente='Mongabay Latam'`.
5. El admin aprueba en `/admin/notihumedal` (tab "prospectos") — la UI pre-rellena
   el form de Notihumedal con la atribución incrustada en el cuerpo
   (`<p><strong>Fuente:</strong> <a href="...">Mongabay Latam</a></p>`).

Trigger: manual desde el botón **"Ejecutar Scraper"** del admin
(`POST /admin/notihumedal/scraper/run`). No hay cron job automático todavía —
se dejó como manual para que el admin pueda revisar las novedades cuando tenga
capacidad de validar.

### Coastal Intrusion Detector (ZOFEMAT, arrecifes)
**Directory:** `src/modules/observatory/arrecifes/coastalIntrusion.service.ts`
**Entity:** `ObsCoastalIntrusion` (`obs_coastal_intrusions`) — id, reefId (FK
nullable), osmId (`way/12345` único por reefId), osmTags (JSON), geometry
(GeoJSON Polygon footprint), centroidLat/Lng, areaM2, zofematOverlapPct (%
del footprint dentro del buffer), status (`candidate`|`verified`|`dismissed`|
`escalated`), source, detectedAt, reviewedBy/At, reviewerNotes,
escalatedConflictId (FK→`obs_conflicts`).

Pipeline (deliberadamente simple, sin ML):
1. Para cada arrecife, bbox de ±0.05° (~5 km) alrededor del centroide.
2. Overpass `way[natural=coastline]` → líneas de costa OSM.
3. Turf `buffer` 20 m → polígono ZOFEMAT aproximado (unión de buffers por
   segmento). Aproximación honesta documentada como tal — no reemplaza el
   polígono oficial SEMARNAT cuando esté disponible.
4. Overpass `way[building]` → footprints de edificios.
5. Para cada building: `turf.booleanIntersects(building, zofemat)`. Si toca,
   calcula overlap % vía `intersect/area`.
6. Upsert por `(reefId, osmId)`. Si el admin ya cambió el status, el
   detector NO sobrescribe (sólo refresca geometry/área).

Throttle: 1.5 s entre arrecifes (Overpass tiene rate-limit blando).

Endpoints (admin-only — la entidad NO se expone en endpoints públicos):
```
GET    /admin/coastal-intrusions[?reefId=&status=&page=&limit=]
GET    /admin/coastal-intrusions/:id
POST   /admin/coastal-intrusions                 # creación manual
                                                 # body: {reefId, geometry (Point|Polygon|
                                                 # MultiPolygon), status?='verified',
                                                 # reviewerNotes?, osmId?, osmTags?}
                                                 # Point se convierte en buffer de 25 m;
                                                 # source='manual'
DELETE /admin/coastal-intrusions/:id             # limpieza puntual (manuales o descartados)
POST   /admin/coastal-intrusions/run[?reefId=]   # un reef o todos
POST   /admin/coastal-intrusions/:id/verify      # body: {notes?}
POST   /admin/coastal-intrusions/:id/dismiss     # body: {notes} (req)
POST   /admin/coastal-intrusions/:id/escalate    # body: {title, summary,
                                                 # fullStory?, intensity?,
                                                 # affectedCommunities?}
```

`escalate` crea un `ObsConflict` con `threats: ['coastal_development']`,
`status: 'emerging'`, `geometry: <intrusion.geometry>`, `visible: false`
(oculto hasta que el admin complete la narrativa) y deja la intrusión en
status `escalated` apuntando al conflictId. Trazabilidad bidireccional.

Limitaciones honestas (documentadas también en la página admin):
- OSM building coverage es desigual: cubre Cancún/Cozumel, no Banco
  Chinchorro / Alacranes (atolones offshore).
- Buffer de 20 m simplifica realidad legal (línea de pleamar es dinámica).
- Detección NO prueba invasión legal — la cola es admin-only por diseño.

**Fase 2: análisis de novedad temporal vía NDBI Sentinel-2.** Para cada
candidato detectado en Fase 1 podemos preguntar "¿es una construcción nueva
o legacy?". Algoritmo:
1. Pulla mediana de bandas B8 (NIR) y B11 (SWIR1) en dos epochs vía Earth
   Engine REST API: baseline ≈ 7 años atrás (±6 meses) y current = últimos
   6 meses. Reutiliza `utils/geeAuth.ts` (extraído del módulo
   `remote-sensing/` para compartir el JWT con service account).
2. NDBI = (B11 − B8) / (B11 + B8). > 0 = superficie construida.
3. `noveltyScore` 0–100 derivado de baseline + delta:
   - baseline weight = clamp((0.1 − baseline) / 0.2, 0, 1)
   - delta weight = clamp(delta / 0.4, 0, 1)
   - score = baselineWeight × deltaWeight × 100
   - Score alto requiere AMBOS: baseline bajo (no construido antes) Y
     delta positivo (algo apareció). Penaliza falsos positivos.
4. Persiste `ndbiBaseline`, `ndbiCurrent`, `ndbiDelta`, `noveltyScore`,
   `noveltyAnalyzedAt`, `noveltyEpochs` en la fila.

Endpoints Fase 2:
```
POST /admin/coastal-intrusions/:id/analyze-novelty[?baselineYearsBack=N]
POST /admin/coastal-intrusions/analyze-novelty-batch[?reefId=&status=&limit=]
```

Batch procesa 30 candidatos por defecto (los más grandes primero, sin
score previo). Throttle 600 ms entre llamadas GEE. Devuelve 503 si las
credenciales no están configuradas; degrada limpiamente.

Migración: `1731000000000-AddNoveltyToCoastalIntrusions.ts` añade 6
columnas idempotentes (`ndbiBaseline`, `ndbiCurrent`, `ndbiDelta`,
`noveltyScore`, `noveltyAnalyzedAt`, `noveltyEpochs`).

**Fase 3: muestreo polígono-completo + NDVI corroborativo + serie temporal anual.**
Mejoras al algoritmo de Fase 2:

1. `samplePolygonBands(polygon, fromDate, toDate)` reemplaza el muestreo
   por punto. Usa `Geometry.Polygon` en GEE con `bestEffort: true` para
   footprints muy chicos. Devuelve NDBI + NDVI en una sola llamada.
2. NDVI = (B8 − B4) / (B8 + B4). Se usa como corroboración del NDBI:
   - Si NDVI bajó (delta ≤ −0.15): construcción genuina removió vegetación
     → multiplicador ×1.0 sobre el score.
   - Si NDVI no se movió o subió: cambio sospechoso (artefacto imagery o
     sin clearing real) → multiplicador degrada hasta ×0.6.
3. `noveltyScore = baselineWeight × deltaWeight × ndviMultiplier × 100`.
4. Serie temporal anual opt-in: `POST /admin/coastal-intrusions/:id/timeseries
   [?fromYear=YYYY]` pulla 8–10 años (Sentinel-2 SR Harmonized cobertura
   global completa desde 2017). Cada año = mediana imagery sobre el polígono
   completo, con NDBI + NDVI. Throttle 1 s entre años. Persiste en
   `noveltyTimeSeries` (JSON). Útil para ver CUÁNDO empezó la construcción.

Migración: `1732000000000-AddPhase3FieldsToCoastalIntrusions.ts` añade
`ndviBaseline`, `ndviCurrent`, `ndviDelta`, `samplingMethod` (`point` |
`polygon`), `noveltyTimeSeries` (JSON).

Limitaciones Fase 2:
- Requiere `GEE_SERVICE_ACCOUNT_KEY` + `GEE_PROJECT_ID` en .env. Sin esto
  el endpoint devuelve 503 (no rompe el resto del flujo).
- Cada llamada GEE toma 1–2 s. Batch de 30 ≈ 60 s.
- NDBI sobre el centroide del polígono, no sobre el polígono completo —
  aproximación razonable para edificios pequeños, ruidosa para complejos
  hoteleros grandes.
- El umbral de 0.4 en delta es heurístico; está calibrado para construcción
  pétrea visible. Estructuras ligeras (palapa, lona) pueden quedar bajo el
  radar.

### Reef News Scraper (pipeline multi-fuente, arrecifes)
**Directory:** `src/modules/observatory/arrecifes/reefNews-scraper.service.ts`
**Trigger:** `POST /api/v1/observatory/arrecifes/admin/news/scraper/run`

Pipeline ordenado por prioridad — la primera fuente gana en colisiones de
`urlHash` durante una misma corrida:

1. **Mongabay México** — `https://es.mongabay.com/list/mexico/`. Feed grid,
   muchos artículos por corrida (~24 ítems). Se filtran con keywords estrictas
   a corales/marino mexicano (`arrecife`, `coral`, `blanqueamiento`, `sargazo`,
   `Cabo Pulmo`, `Revillagigedo`, `vaquita`, `NOAA CRW`, etc.). Si nada
   matchea no inserta nada — diferente a humedales que cae al set completo.
2. **The Nature Conservancy** — single-page articles editoriales como
   `/buenas-noticias-del-ambiente/`. Extracción vía Open Graph meta tags
   (`og:title`, `og:description`, `og:image`, `article:published_time`).
   `bypassRelevanceFilter: true` — al ser curada manualmente no aplica el
   filtro de keywords. Re-correr no genera duplicados (urlHash). Para añadir
   un nuevo artículo de TNC: agregar URL al array `TNC_URLS` en el service.
3. (futuras fuentes con menor prioridad se concatenan al final del array
   `SOURCES` del módulo)

Cada item se normaliza al tipo `ScrapedItem { title, summary, url,
publishedAt, author, image, source, bypassRelevanceFilter? }` antes de
insertarse como `ObsReefNewsProspect` con `status='pending'`. El admin
aprueba/rechaza desde `/admin/news` tab Prospectos; al aprobar la UI
pre-rellena el form del artículo con `<p><strong>Fuente:</strong> <a
href="..." target="_blank">{source}</a></p>` para preservar la atribución.

Respuesta del endpoint:
```json
{ "scraped": 25, "inserted": 14, "skippedDuplicates": 8,
  "skippedIrrelevant": 3,
  "bySource": {
    "Mongabay Latam": { "scraped": 24, "inserted": 13 },
    "The Nature Conservancy": { "scraped": 1, "inserted": 1 }
  } }
```

### Observatory Events Module (tracking + analytics)
**Directory:** `src/modules/observatory/events/`
**Mounted at:** `/api/v1` (paths internos arrancan en `/observatory/:observatory/...`)
**Entity:** `InteractionEvent` (`observatory_interaction_events`) — id, observatory
(`arrecifes` | `humedales` | `techos-verdes`), eventType (`pageview` | `click` |
`submit` | `search` | `filter` | `download` | `external_link` | `custom`), path,
target, sessionId (uuid v4 generado en frontend), userId (nullable), metadata (JSON),
referrer, userAgent (truncado 250), ipHash (SHA-256 con salt local, primeros 32 chars),
createdAt. Sin PII; sólo agregados.

**Routes:**
- `POST /observatory/:observatory/events` — pública, ingest. Body: `{ events: [{ type,
  path?, target?, sessionId, metadata?, referrer? }, …] }`. Lote ≤50 eventos. Rate-limit
  60/min/IP en prod (dev sin límite). Devuelve `{ saved: N }` con 202.
- `GET /observatory/:observatory/admin/analytics/summary?days=N` — auth admin
  (superadmin bypasea scope). N ∈ [1, 180]. Devuelve `{ totals: { events, sessions,
  pageviews, clicks, submits, downloads }, byType, series: [{ date, events, sessions
  }, …] (sin huecos), topPaths: [{ key, count }, …10], topTargets: […10] }`.

**Multi-tenant:** los 3 frontends usan el mismo plugin/composable; cada uno postea con
su propio observatorio. `EventsService.getSummary` filtra por `observatory` con raw
SQL (TypeORM tiene rarezas con `DATETIME(6)` en agregaciones por día).

**Frontend público** del tracking vive en cada repo: `composables/useTracking.ts` +
`plugins/tracking.client.ts`. Convención: marcar CTAs/elementos clave con
`data-track="<label>"` para que aparezcan en `topTargets`.

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
