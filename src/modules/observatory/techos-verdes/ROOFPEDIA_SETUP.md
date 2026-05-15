# Roofpedia — Setup del servidor (Opción A)

Este módulo orquesta jobs de detección CNN de techos verdes ejecutando un
subprocess Python en el mismo VPS que corre `cercu-backend`. Una sola tarea
puede correr a la vez por observatorio (`techos-verdes`).

## Arquitectura

```
Admin frontend (Nuxt)  ──HTTP──▶  cercu-backend (Node)
                                       │
                                       │ child_process.spawn
                                       ▼
                              python3 tools/scan_alcaldia.py
                                       │ (al terminar)
                                       ▼
                              python3 tools/build_inspection_gallery.py
                                       │
                                       ▼
                              results/inspection/{Alcaldia}/
                                       │
                                       │  copyDirRecursive
                                       ▼
                              /var/www/.../public/roofpedia/{slug}/
                                       │
                                       ▼ servido por nginx
                              GET /roofpedia/{slug}/index.html
```

## Requisitos del VPS

| Componente | Versión mínima | Notas |
|------------|----------------|-------|
| Python | 3.10 | Solo para el subprocess CNN |
| PyTorch | 2.x (CPU) | `pip install torch --index-url https://download.pytorch.org/whl/cpu` |
| Espacio | 10 GB libres | Cache de tiles + masks pesa |
| RAM | 4 GB | El modelo carga en CPU |
| MAPBOX_TOKEN | — | Cuenta con tile-imagery API habilitada |

## Pasos de instalación

### 1. Clonar Roofpedia

```bash
sudo mkdir -p /opt/roofpedia
sudo chown $USER:$USER /opt/roofpedia
git clone <repo-roofpedia> /opt/roofpedia
cd /opt/roofpedia
```

### 2. Crear entorno virtual e instalar dependencias

```bash
python3.10 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt    # o conda env create -f environment_cpu.yml
pip install torch --index-url https://download.pytorch.org/whl/cpu
```

### 3. Colocar el checkpoint del modelo

El archivo `green_demo.pth` (~435 MB) **NO** está en git. Cópialo manualmente
o descárgalo desde la fuente original:

```bash
mkdir -p /opt/roofpedia/checkpoint
scp local-machine:checkpoint/green_demo.pth /opt/roofpedia/checkpoint/
```

### 4. Variables de entorno (en `/opt/roofpedia/.env`)

```bash
MAPBOX_TOKEN=pk.eyJ1...
```

### 5. Configurar paths en `cercu-backend/.env`

```bash
# Path absoluto al clon de Roofpedia
ROOFPEDIA_REPO_PATH=/opt/roofpedia

# Path al python del venv (¡importante!, no el sistema)
ROOFPEDIA_PYTHON_BIN=/opt/roofpedia/.venv/bin/python

# Donde escribir logs (creado automáticamente si no existe)
ROOFPEDIA_LOG_DIR=/var/log/roofpedia

# Path absoluto al directorio public del frontend desplegado
ROOFPEDIA_PUBLIC_DEST=/var/www/cercu-frontend/observatorio-techos-verdes/public/roofpedia
```

### 6. Permisos

El usuario que corre `cercu-backend` (típicamente `www-data` o `node`) necesita:

- **Lectura** sobre `/opt/roofpedia`
- **Escritura** sobre `/opt/roofpedia/results` y `/opt/roofpedia/tools/cache`
- **Escritura** sobre `ROOFPEDIA_LOG_DIR` (default `/var/log/roofpedia`)
- **Escritura** sobre `ROOFPEDIA_PUBLIC_DEST`

```bash
sudo mkdir -p /var/log/roofpedia
sudo chown node:node /var/log/roofpedia /opt/roofpedia/results /opt/roofpedia/tools/cache
```

### 7. Ejecutar migración

```bash
cd /var/www/cercu-backend
npm run migration:run
```

Crea la tabla `obs_roofpedia_jobs`.

## Endpoints

Todos protegidos con `observatoryAuthMiddleware`:

| Método | Path | Descripción |
|--------|------|-------------|
| POST | `/observatory/techos-verdes/admin/roofpedia/scan` | Encolar nuevo scan |
| GET | `/observatory/techos-verdes/admin/roofpedia/jobs` | Listar jobs |
| GET | `/observatory/techos-verdes/admin/roofpedia/jobs/running` | Job en curso (o null) |
| GET | `/observatory/techos-verdes/admin/roofpedia/jobs/:publicId` | Detalle |
| GET | `/observatory/techos-verdes/admin/roofpedia/jobs/:publicId/log` | Tail del log |
| POST | `/observatory/techos-verdes/admin/roofpedia/jobs/:publicId/cancel` | Cancelar (SIGTERM → SIGKILL en 5s) |

## Lock global

El servicio rechaza un `startScan` si ya hay otro job con `status='running'`
para el mismo observatorio. Esto previene saturar CPU/RAM y simplifica el
modelo mental para el admin.

## Costos

Mapbox cobra **$0.30 USD / 1,000 tiles** a partir del request 50,001 cada mes.
El costo estimado se calcula en el frontend antes de confirmar (Overpass +
geometry de tiles z19) y se almacena en `costEstimateUsd` para auditoría.

## Troubleshooting

**Job queda en `pending` indefinidamente** → el subprocess no arrancó. Revisa
que `ROOFPEDIA_PYTHON_BIN` y `ROOFPEDIA_REPO_PATH` apunten a paths válidos.
El `errorMessage` del job debe explicar la causa.

**Job termina con exit code != 0** → tail el log con
`tail -f /var/log/roofpedia/{publicId}.log`. Errores comunes:
- `ModuleNotFoundError` → falta `pip install` algo en el venv
- `MAPBOX_TOKEN` vacío → revisar `/opt/roofpedia/.env`
- `RuntimeError: CUDA` → el checkpoint debe cargarse con `map_location='cpu'`

**Galería no se copia al frontend** → revisa permisos sobre `ROOFPEDIA_PUBLIC_DEST`
y que el directorio fuente exista (`/opt/roofpedia/results/inspection/{Slug}`).
