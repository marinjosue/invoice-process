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
    │            │                  └─ deploy-production (Render + Vercel)   [PENDIENTE]
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
| dispatch (desde test-pipeline) | `deploy-production.yml` | Despliega **backend→Render** y **frontend→Vercel** + notifica  **[PENDIENTE]** |

> ⚠️ **Estado de las ramas:** hoy solo existe `main`. Las ramas `dev` y `test` **aún no se han creado**,
> por lo que el flujo de auto-merge y el despliegue automático todavía **no están activos** — los
> workflows ya están escritos y listos para cuando se creen.

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

## 7. Despliegue (PENDIENTE)

Diseñado en `deploy-production.yml`, **aún no ejecutado**. Para activarlo falta:

| Requisito | Detalle |
|---|---|
| Crear ramas `dev` y `test` | Para que el flujo auto-merge llegue a disparar el deploy |
| Secrets de Render | `RENDER_API_KEY`, `RENDER_SERVICE_ID` (backend) |
| Secrets de Vercel | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (frontend) |
| URL pública | Backend en Render + Frontend en Vercel, con conexión real entre ambos |

> El frontend en dev ya apunta a `http://localhost:3000/api`; en producción a una URL de Cloud Run
> (`environment.ts`). Definir la URL definitiva al desplegar.

## 8. Estado actual

| Componente | Estado |
|---|---|
| Módulo personas/usuarios/roles + RBAC | ✅ Hecho y verificado (ver `INFORME-RBAC.md`) |
| Pruebas automatizadas (back 21 / front 34) | ✅ |
| Pipeline CI (`ci.yml`: install/test/build/sonar/telegram) | ✅ Activo en `main` |
| DevSecOps SonarCloud | ✅ Configurado |
| Notificaciones Telegram | ✅ Configurado y probado |
| Modelo ML por Release | ✅ Publicado (`model-v1`) |
| Ramas `dev`/`test` + flujo auto-merge | ⏳ Pendiente (solo existe `main`) |
| Despliegue Render + Vercel | ⏳ Pendiente (secrets + ejecución) |
| Seguridad de `/api/pdfs` (sin auth) | ⏳ Pendiente (hueco pre-existente a cerrar) |

## 9. Mapeo a la rúbrica (/20)

| Criterio | Dónde |
|---|---|
| Módulo funcional integrado (front+back+persistencia) | RBAC sobre dominio de facturas |
| Git: ramas, commits, PR | Flujo `dev→test→main` (ramas por crear) + commits trazables |
| Pruebas automatizadas | Jest + Karma en `ci.yml`/`test-pipeline.yml` |
| Pipeline GitHub Actions funcional | `ci.yml` (falla en etapa crítica) |
| DevSecOps SonarCloud | Job `sonarcloud` + `sonar-project.properties` |
| Build reproducible | Etapas Build de `ci.yml` |
| Despliegue cloud | `deploy-production.yml` (Render+Vercel) — **pendiente** |
| Notificaciones Telegram | Job `notify` + workflows |
| Evidencias técnicas | Esta carpeta (`evidencia-roles/`) + capturas |

> Documentación viva del pipeline: [`.github/FLUJO_PIPELINE.md`](../.github/FLUJO_PIPELINE.md).
