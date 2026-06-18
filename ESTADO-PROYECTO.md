# Estado del Proyecto — Invoice Process (GR05)

**Sistema:** Gestión inteligente de facturas
**Repositorio:** https://github.com/marinjosue/invoice-process
**Actividad:** DevOps · CI/CD · DevSecOps (Segundo parcial)
**Fecha:** 2026-06-18
**Producción:** Frontend → https://liquidaciones.devsje.dev · Backend → https://api.devsje.dev

---

## 1. Componentes

| Componente | Stack | Estado |
|---|---|---|
| Frontend | Angular 20 (PrimeNG) | ✅ build OK |
| Backend | NestJS + MongoDB (Mongoose), JWT, bcrypt | ✅ build OK |
| Base de datos | MongoDB (Atlas) | ✅ en uso |
| Módulo de seguridad ML | Python (modelo en Release `model-v1`) | ✅ |
| Contenedores | Dockerfiles back/front + nginx | ✅ desplegados en Cloud Run |

---

## 2. Estado contra la rúbrica (/20)

| Criterio | Pts | Estado | Evidencia / Qué falta |
|---|:--:|:--:|---|
| 1. Módulo funcional integrado (front+back+persistencia) | 3 | ⚠️ | RBAC integrado y verificado (menú+API+Mongo). **Revisar**: UUID vs ObjectId, Usuario **N:M** Rol (hoy 1:N), y diseño OO (herencia/Factory/código dinámico) que pide la rúbrica. |
| 2. Git: ramas, commits, PR | 2 | ⚠️ | Ramas `main/dev/test` ✅, commits significativos ✅. **Falta abrir un PR real** `dev→test` para evidenciar el flujo. |
| 3. Pruebas automatizadas | 2 | ✅ | Backend 21/21 (Jest) + Frontend 34/34 (Karma), ejecución real. |
| 4. Pipeline GitHub Actions funcional | 3 | ✅ | `ci.yml`: install → test → analiza → build, **falla en etapa crítica**. |
| 5. DevSecOps SonarCloud | 2 | ✅ | Análisis corre desde el CI (Telegram: "SonarCloud: success"). Revisar el Quality Gate en el panel de SonarCloud. |
| 6. Build reproducible front/back | 2 | ✅ | `nest build` + `ng build` exit 0, desde el pipeline. |
| 7. Despliegue funcional en cloud | 2 | ✅ | **Desplegado en Google Cloud Run.** Frontend https://liquidaciones.devsje.dev (HTTP 200) y backend https://api.devsje.dev (login real → HTTP 201 con permisos). Conexión front↔back verificada en vivo. |
| 8. Notificaciones Telegram | 1 | ✅ | Bot `@invoice_gr05_bot` configurado y **probado**. |
| 9. Evidencias técnicas | 2 | ✅ | Informes + capturas (ver §5). |
| 10. Demo y defensa técnica | 1 | ⏳ | Informes sirven de guion por etapa. |

**Resumen:** sólido en 3, 4, 5, 6, 7, 8, 9 (despliegue en vivo verificado). Brechas restantes: abrir un PR real `dev→test` (2) y revisar el modelado del módulo — UUID/N:M/OO (1).

---

## 3. Flujo CI/CD

```
Commit → GitHub → CI (install/test/analiza/build) → [dev→test: análisis ML] → [test→main: tests] → Deploy (Cloud Run) → Telegram
```

- **`ci.yml`** (activo, push/PR a main/test/dev): instalar → lint → pruebas+cobertura → build → SonarCloud → Telegram. Falla si test o build fallan.
- **`security-pipeline.yml`** (PR dev→test): descarga modelo ML del Release `model-v1`, escanea cambios → auto-merge a test.
- **`test-pipeline.yml`** (push test): pruebas back+front → auto-merge test→main → dispara deploy.
- **`deploy-production.yml`** (dispatch): build+push Docker a GCR → deploy backend y frontend a **Cloud Run** → notifica.
- **`block-direct-push.yml` / `block-invalid-flow.yml`**: gobernanza del flujo `dev→test→main`.

Detalle: [`.github/FLUJO_PIPELINE.md`](.github/FLUJO_PIPELINE.md).

---

## 4. Despliegue (Cloud Run) — ✅ ACTIVO

Desplegado y **verificado en vivo** vía `deploy-production.yml` (Docker + Workload Identity Federation a Google Cloud Run):

| Servicio | URL | Verificación |
|---|---|---|
| Frontend | https://liquidaciones.devsje.dev | HTTP 200 |
| Backend | https://api.devsje.dev | `POST /api/auth/login` → HTTP 201 con token y `permissions` (conectado a Mongo + JWT) |
| API Docs | https://api.devsje.dev/api-docs | Scalar |

- Dockerfiles: backend (`node dist/main`, respeta `$PORT`), frontend (nginx:8080, build de producción → `api.devsje.dev/api`).
- Env vars del backend configuradas en el servicio Cloud Run; autenticación por WIF (SA `github-deploy@…`).
- **Conexión real front↔back confirmada:** el frontend de producción consume el backend de producción (mismo dominio de API).
- Notificaciones Telegram del despliegue: operativas (inicio / backend / frontend / completo).

> Nota menor: el workflow muestra warnings de "Node.js 20 deprecated" en las acciones de Google (`auth@v2`, `setup-gcloud@v2`) — cosmético, no afecta el deploy.

---

## 5. Evidencias

- [evidencia-roles/INFORME-RBAC.md](evidencia-roles/INFORME-RBAC.md) — control de acceso por rol (matriz + API + GUI).
- [evidencia-roles/INFORME-FLUJO-CICD.md](evidencia-roles/INFORME-FLUJO-CICD.md) — flujo DevOps completo.
- Capturas: `evidencia-roles/01-viewer-menu.png`, `02-user-menu.png`, `03-manager-menu.png`.

**Verificación end-to-end del RBAC (realizada):**
- API: login por rol entrega `permissions`; endpoints responden 200/403 según la matriz; sin token → 401.
- GUI: el menú se filtra por rol y el `RoleGuard` bloquea navegación por URL.

---

## 6. Pendientes priorizados

1. **Abrir un PR real `dev→test`** para evidenciar trazabilidad y ver correr el flujo de gobernanza → criterio 2.
2. **Revisar modelado del módulo** (UUID vs ObjectId, N:M Usuario-Rol, herencia/Factory/código dinámico) → criterio 1.
3. Confirmar en SonarCloud el **Quality Gate** (pasa o justificación) → criterio 5.
4. (Opcional/seguridad) Cerrar `/api/pdfs` sin autenticación.

> Despliegue (criterio 7) y notificaciones (8) ✅ resueltos y verificados en vivo.

---

## 7. Usuarios de prueba (rol → email, contraseña `Test1234`)

`manager@test.com` · `user@test.com` · `viewer@test.com` — creados con `npm run seed:test-users`. Admin: cuenta propia.
