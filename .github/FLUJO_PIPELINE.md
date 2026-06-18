# 🔄 Flujo CI/CD y DevSecOps — Invoice Process (GR05)

Documentación del pipeline DevOps/DevSecOps del Sistema de Información **Gestión inteligente de facturas**.

## 🧱 Componentes del repositorio

| Carpeta | Stack | Pruebas | Build |
|---|---|---|---|
| `invoice-process-back-end` | NestJS + MongoDB (Mongoose), JWT, bcrypt | Jest (`*.spec.ts`) | `nest build` |
| `invoice-process-front-end` | Angular 20 (PrimeNG) | Karma + Jasmine (`*.spec.ts`) | `ng build` |
| `ml-security` | Modelo ML (Python) — análisis de vulnerabilidades | — | — |

## 🚦 Pipeline principal — `ci.yml`

Se ejecuta en cada `push` y `pull_request` a `main`, `test` y `dev`. Implementa la cadena exigida por la rúbrica:

```
Instalar → Lint → Pruebas (+cobertura) → Build → Análisis SonarCloud → Notificar Telegram
```

- **`backend`** y **`frontend`** corren en paralelo. Las etapas **Pruebas** y **Build** son *críticas*: si fallan, el job (y el workflow) falla.
- **`sonarcloud`** descarga la cobertura `lcov` de ambos y ejecuta el análisis estático (bugs, vulnerabilidades, code smells, cobertura).
- **`notify`** envía a Telegram el resultado de cada etapa (`success`/`failure`/`skipped`).

> El frontend se prueba headless con el launcher `ChromeHeadlessCI` (definido en `karma.conf.js`, con `--no-sandbox`).

## 🔀 Flujo de ramas (trazabilidad) — `dev → test → main`

| Workflow | Disparador | Qué hace |
|---|---|---|
| `security-pipeline.yml` | PR `dev → test` | Análisis ML de vulnerabilidades sobre archivos modificados → auto-merge a `test` si es seguro |
| `test-pipeline.yml` | push a `test` / dispatch | Corre pruebas de backend y frontend → auto-merge `test → main` → dispara deploy |
| `deploy-production.yml` | dispatch (desde test-pipeline) | Despliega backend (Render) y frontend (Vercel) → notifica |
| `block-direct-push.yml` | push directo a `main` | Alerta: el flujo `dev → test → main` fue saltado |
| `block-invalid-flow.yml` | PR hacia `main` | Bloquea PRs que no vengan de `test` |

> **Nota ML:** `ml-security/models/model_vulnerabilities.pkl` (~477 MB) **no** se versiona en git.
> Se publica como **asset de un GitHub Release** (tag `model-v1`) y el `security-pipeline` lo descarga
> con `gh release download` (autenticado con `GITHUB_TOKEN`, funciona en repo privado). Si el release
> aún no existe, el análisis ML se **omite con gracia** y la seguridad queda a cargo de **SonarCloud**.
>
> **Publicar/actualizar el modelo:** Releases → *Draft a new release* → tag `model-v1` → adjunta el
> `.pkl` → *Publish*. Para subir una versión nueva, cambia `MODEL_RELEASE_TAG` en `security-pipeline.yml`.

## 🔐 Secrets requeridos (Settings → Secrets and variables → Actions)

| Secret | Usado por | Para qué |
|---|---|---|
| `SONAR_TOKEN` | `ci.yml` | Token de SonarCloud (DevSecOps) |
| `TELEGRAM_BOT_TOKEN` | todos | Bot de notificaciones |
| `TELEGRAM_CHAT_ID` | todos | Chat/grupo destino |
| `RENDER_API_KEY`, `RENDER_SERVICE_ID` | `deploy-production.yml` | Deploy backend en Render |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | `deploy-production.yml` | Deploy frontend en Vercel |

Si falta `SONAR_TOKEN` o los de Telegram, esos pasos se **omiten** sin romper el pipeline.

## 🛠️ Configurar SonarCloud (una sola vez)

1. Entra a <https://sonarcloud.io> con tu cuenta de GitHub e importa el repo `invoice-process`.
2. Copia el **Organization Key** y el **Project Key** y ajústalos en [`sonar-project.properties`](../sonar-project.properties)
   (actualmente `marinjosue` / `marinjosue_invoice-process`).
3. En SonarCloud usa **Analysis Method → GitHub Actions**, genera el token y guárdalo como secret `SONAR_TOKEN`.
4. Desactiva *Automatic Analysis* en SonarCloud (usamos el análisis basado en CI).

## ✅ Mapeo con la rúbrica (/20)

| Criterio | Dónde se cumple |
|---|---|
| Pruebas automatizadas | Jest (backend) + Karma/Jasmine (frontend) en `ci.yml` y `test-pipeline.yml` |
| Pipeline GitHub Actions funcional | `ci.yml` (install → test → analyze → build, falla en etapa crítica) |
| DevSecOps con SonarCloud | Job `sonarcloud` + `sonar-project.properties` |
| Build frontend/backend | Etapas `Build` reproducibles en `ci.yml` |
| Despliegue cloud | `deploy-production.yml` (Render + Vercel) |
| Notificaciones Telegram | Job `notify` y notificaciones en cada workflow |
| Git / ramas / PR | Flujo `dev → test → main` con workflows de validación |

## ▶️ Comandos locales

```bash
# Backend
cd invoice-process-back-end && npm ci && npm test -- --coverage && npm run build

# Frontend (headless)
cd invoice-process-front-end && npm ci \
  && npm test -- --no-watch --browsers=ChromeHeadlessCI --code-coverage \
  && npm run build
```
