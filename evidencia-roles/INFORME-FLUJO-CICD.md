# Flujo DevOps / CI-CD — Invoice Process (GR05)

**Repositorio:** https://github.com/marinjosue/invoice-process
**Fecha:** 2026-06-18

## 1. Flujo global objetivo

```
Commit local → GitHub → Pipeline CI/CD → Pruebas → Análisis de seguridad → Build → Despliegue → Notificación → Evidencia
```

## 2. Flujo de ramas  `dev → test → main`

```
   dev ──PR──▶ test ──PR(auto)──▶ main ──▶ Despliegue
    │            │                  │
    │            │                  └─ deploy-production (Google Cloud Run)   ✅ EN VIVO
    │            └─ test-pipeline: pruebas back+front → auto-merge a main
    └─ security-pipeline: análisis ML de vulnerabilidades → auto-merge a test
```

| Transición | Workflow | Qué hace |
|---|---|---|
| PR `dev → test` | `security-pipeline.yml` | Descarga el modelo ML (Release `model-v1`) y analiza los archivos modificados; si es seguro, **auto-merge** a `test` y dispara las pruebas |
| push a `test` | `test-pipeline.yml` | Corre pruebas de **backend (Jest)** y **frontend (Karma)**; si pasan, **auto-merge** `test → main` y dispara el despliegue |
| push directo a `main` | `block-direct-push.yml` | Detecta y **alerta** (Telegram) que se saltó el flujo |
| PR hacia `main` | `block-invalid-flow.yml` | Bloquea PRs que no vengan de `test` |
| push/PR a `main`,`test`,`dev` | `ci.yml` | **Instalar → Lint → Pruebas (+cobertura) → Build → SonarCloud → Telegram** |
| dispatch (desde test-pipeline) | `deploy-production.yml` | Build+push de imágenes Docker y despliega **backend y frontend a Google Cloud Run** + notifica ✅ |

> **Estado de las ramas:** existen `main`, `dev` y `test`. Falta abrir un **PR de demostración** `dev→test`
> para ver correr el flujo de auto-merge completo (el despliegue ya se ejecutó vía dispatch y está en vivo).

## 3. Pipeline principal `ci.yml` (activo)

Corre en cada push/PR a `main` (y a `test`/`dev` cuando existan). Etapas, **falla si una crítica falla**:

1. **Instalar** dependencias (`npm ci`) — backend y frontend en paralelo.
2. **Lint** (no bloqueante).
3. **Pruebas + cobertura** *(crítico)* — Jest (backend) y Karma headless (frontend).
4. **Build** *(crítico)* — `nest build` / `ng build`.
5. **SonarCloud** — análisis estático (bugs, vulnerabilidades, code smells, cobertura lcov).
6. **Notificación Telegram** — resultado de cada etapa.

## 4. DevSecOps — SonarCloud

- Organización: `marinjosue` · Project Key: `marinjosue_invoice-process`.
- Configuración en `sonar-project.properties` (fuentes acotadas a `back/src` y `front/src/app`,
  exclusiones y `cpd.exclusions` para evitar duplicados falsos).
- *Automatic Analysis* **desactivado**; el análisis lo hace el pipeline (`SONAR_TOKEN`).

## 5. Observabilidad — Telegram

- Bot `@invoice_gr05_bot`; secrets `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` (probados: envío OK).
- Notifica inicio/fin de pruebas, resultado del CI, merges y (a futuro) despliegues.

## 6. Modelo ML de seguridad

- `model_vulnerabilities.pkl` (~477 MB) **no** se versiona en git: se publica como **asset del Release `model-v1`**
  y `security-pipeline.yml` lo descarga con `gh release download` (autenticado, repo privado).
- Si el modelo no está, el análisis ML se **omite con gracia** y SonarCloud cubre la seguridad.

## 7. Despliegue (✅ EN VIVO)

`deploy-production.yml` construye imágenes Docker y despliega a **Google Cloud Run** (autenticación por
Workload Identity Federation). **Ejecutado y verificado:**

| Servicio | URL | Verificación |
|---|---|---|
| Frontend | https://liquidaciones.devsje.dev | HTTP 200 |
| Backend | https://api.devsje.dev | `POST /api/auth/login` → HTTP 201 con token + `permissions` |
| API Docs | https://api.devsje.dev/api-docs | Scalar |

- Backend: Docker (`node dist/main`, respeta `$PORT`), env vars configuradas en el servicio Cloud Run.
- Frontend: build de producción → nginx:8080; `environment.ts` apunta a `https://api.devsje.dev/api`.
- **Conexión real front↔back confirmada** (el front de producción consume el backend de producción).
- Notificaciones Telegram del despliegue: operativas.

## 8. Estado actual

| Componente | Estado |
|---|---|
| Módulo personas/usuarios/roles + RBAC | ✅ Hecho y verificado (ver `INFORME-RBAC.md`) |
| Pruebas automatizadas (back 21 / front 34) | ✅ |
| Pipeline CI (`ci.yml`: install/test/build/sonar/telegram) | ✅ Activo en `main` |
| DevSecOps SonarCloud | ✅ Configurado |
| Notificaciones Telegram | ✅ Configurado y probado |
| Modelo ML por Release | ✅ Publicado (`model-v1`) |
| Ramas `dev`/`test` creadas | ✅ (falta abrir un PR de demostración `dev→test`) |
| Despliegue Google Cloud Run | ✅ En vivo y verificado (api.devsje.dev / liquidaciones.devsje.dev) |
| Seguridad de `/api/pdfs` (sin auth) | ⏳ Pendiente (hueco pre-existente a cerrar) |

## 9. Mapeo a la rúbrica (/20)

| Criterio | Dónde |
|---|---|
| Módulo funcional integrado (front+back+persistencia) | RBAC sobre dominio de facturas |
| Git: ramas, commits, PR | Ramas `main/dev/test` + commits trazables (PR de demostración por abrir) |
| Pruebas automatizadas | Jest + Karma en `ci.yml`/`test-pipeline.yml` |
| Pipeline GitHub Actions funcional | `ci.yml` (falla en etapa crítica) |
| DevSecOps SonarCloud | Job `sonarcloud` + `sonar-project.properties` |
| Build reproducible | Etapas Build de `ci.yml` |
| Despliegue cloud | `deploy-production.yml` → **Google Cloud Run** ✅ (api.devsje.dev / liquidaciones.devsje.dev) |
| Notificaciones Telegram | Job `notify` + workflows |
| Evidencias técnicas | Esta carpeta (`evidencia-roles/`) + capturas |

> Documentación viva del pipeline: [`.github/FLUJO_PIPELINE.md`](../.github/FLUJO_PIPELINE.md).
