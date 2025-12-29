# Kairos

App de comunicación padres-colegio.

## Stack

- **Backend/CMS**: Directus v11
- **Database**: PostgreSQL 16
- **Hosting**: Google Cloud Run + Cloud SQL
- **Mobile**: (futuro) React Native / Flutter

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

## Desarrollo local

```bash
# Levantar Directus + PostgreSQL
cd directus
docker compose up -d

# Acceder a Directus
open http://localhost:8055
```

## Documentación

- [Modelo de datos](docs/DATA_MODEL.md)
- [Deployment](docs/DEPLOYMENT.md)

## GCloud Project

- Project ID: `kairos-escuela-app`
- Region: `us-central1`
