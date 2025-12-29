# Deployment a Google Cloud

## Prerequisitos

- gcloud CLI instalado y autenticado
- Billing habilitado en el proyecto
- Docker instalado (para desarrollo local)

## Proyecto GCloud

```
Project ID: kairos-escuela-app
Region: us-central1
```

## 1. Habilitar APIs

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  --project=kairos-escuela-app
```

## 2. Crear Artifact Registry (para imágenes Docker)

```bash
gcloud artifacts repositories create kairos \
  --repository-format=docker \
  --location=us-central1 \
  --description="Kairos Docker images"
```

## 3. Crear Cloud SQL (PostgreSQL)

```bash
# Crear instancia
gcloud sql instances create kairos-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=10GB

# Crear base de datos
gcloud sql databases create kairos --instance=kairos-db

# Crear usuario
gcloud sql users create directus \
  --instance=kairos-db \
  --password=GENERAR_PASSWORD_SEGURO
```

## 4. Crear Secrets

```bash
# Secret para Directus
echo -n "GENERAR_SECRET_LARGO_RANDOM" | \
  gcloud secrets create directus-secret --data-file=-

# Password de base de datos
echo -n "MISMO_PASSWORD_DE_ARRIBA" | \
  gcloud secrets create db-password --data-file=-
```

## 5. Crear Cloud Storage (para uploads)

```bash
gcloud storage buckets create gs://kairos-escuela-app-uploads \
  --location=us-central1 \
  --uniform-bucket-level-access
```

## 6. Deploy inicial

```bash
# Build y deploy con Cloud Build
gcloud builds submit --config docker/cloudbuild.yaml
```

## 7. Configurar dominio custom (opcional)

```bash
gcloud run domain-mappings create \
  --service kairos-directus \
  --domain api.kairos.app \
  --region us-central1
```

---

## Desarrollo local

```bash
cd directus
docker compose up -d

# Acceder
open http://localhost:8055

# Credenciales default
# Email: admin@kairos.app
# Password: admin123
```

---

## Variables de entorno (producción)

| Variable | Descripción |
|----------|-------------|
| SECRET | Key para JWT y encriptación |
| DB_CLIENT | `pg` |
| DB_HOST | `/cloudsql/PROJECT:REGION:INSTANCE` |
| DB_PORT | `5432` |
| DB_DATABASE | `kairos` |
| DB_USER | `directus` |
| DB_PASSWORD | (desde Secret Manager) |
| PUBLIC_URL | URL de Cloud Run |
| STORAGE_LOCATIONS | `gcs` |
| STORAGE_GCS_DRIVER | `gcs` |
| STORAGE_GCS_BUCKET | `kairos-escuela-app-uploads` |

---

## Costos estimados (desarrollo/MVP)

| Servicio | Costo mensual |
|----------|---------------|
| Cloud Run | ~$0 (escala a 0) |
| Cloud SQL (db-f1-micro) | ~$10/mes |
| Cloud Storage | ~$1/mes |
| **Total** | **~$11/mes** |
