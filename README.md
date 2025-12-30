# Kairos

App de comunicación padres-colegio. Multi-tenant con schema extensible (estilo Salesforce).

## Stack

- **Backend/CMS**: Directus v11
- **Database**: PostgreSQL 16
- **Hosting**: Google Cloud Run + Cloud SQL + Cloud Storage
- **Mobile**: React Native con Expo

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCHEMA BASE (Managed)                        │
│  16 tablas base + custom_fields JSONB para extensiones         │
└─────────────────────────────────────────────────────────────────┘
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
        Colegio A        Colegio B        Colegio C
        (customs)        (customs)        (vanilla)
```

### Principios

- **Schema base inmutable** por tenants
- **Extensiones via JSONB** para campos custom por colegio
- **Tablas custom aisladas** con prefijo `tenant_{org_id}_`
- **Releases sin breaking changes**

## Funcionalidades

### Para padres (Mobile App)
- Ver novedades del colegio
- Ver eventos y confirmar asistencia
- Recibir y responder mensajes
- Solicitar cambios de salida
- Ver boletines e informes

### Para profesores/staff (Web + Mobile)
- Crear novedades
- Crear eventos
- Enviar mensajes
- Aprobar cambios de salida
- Subir boletines e informes

### Para administradores (Web)
- Gestionar usuarios (profesores, padres, staff)
- Gestionar alumnos
- Gestionar grados y secciones
- Configurar el colegio
- **Crear campos custom** (sin código)
- **Crear tablas custom** (sin código)

## Desarrollo local

### Backend (Directus)

```bash
# Levantar Directus + PostgreSQL
cd directus
docker compose up -d

# Acceder a Directus
open http://localhost:8055

# Credenciales
# Email: admin@kairos.app
# Password: admin123
```

### Mobile App (Expo)

```bash
cd mobile
npm install

# Desarrollo con Expo Go
npx expo start

# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android
```

### Scripts de configuración Directus

Los scripts son **idempotentes** (seguros de re-ejecutar):

```bash
# 1. Obtener token de autenticación
./scripts/get-token.sh

# 2. Configurar schema (collections + fields)
./scripts/setup-schema.sh
./scripts/setup-schema-v2.sh  # Colecciones adicionales
./scripts/setup-relations.sh

# 3. Configurar UI y permisos
./scripts/configure-directus-ui.sh
./scripts/configure-directus-policies.sh

# 4. Datos de prueba (opcional)
./scripts/seed-data.sh
```

## Documentación

- [Modelo de datos](docs/DATA_MODEL.md) - 16 tablas + extensibilidad
- [Deployment](docs/DEPLOYMENT.md) - Guía de deploy a GCP
- [TODO](docs/TODO.md) - Roadmap y tareas pendientes

## GCloud

- **Project ID**: `kairos-escuela-app`
- **Region**: `us-central1`
- **URL**: https://kairos-directus-684614817316.us-central1.run.app
