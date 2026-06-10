# Auditoría de Seguridad — Mayo 2026

Resultado de la auditoría completa (proxy + backend + frontend) y las
correcciones aplicadas. Lee también `backend/SECURITY.md` (RLS/JWT) y
`MONETIZATION.md` (política de acceso).

## ✅ Corregido en código

### Proxy (Node/Express) — DESPLEGADO en Railway

| Hallazgo | Severidad | Fix |
|---|---|---|
| Webhook Hotmart abierto si no hay HMAC/TOKEN | CRÍTICA | Fail-closed: 503 si no hay ningún mecanismo configurado |
| Comparación de hottok no timing-safe | ALTA | `safeEqual()` byte-safe + a prueba de excepciones |
| `/api/chat` y `/api/evaluate` sin protección de origen | CRÍTICA | `originGuard`: rechaza Origin no permitido antes de gastar Gemini |
| WebSocket `/api/live` sin auth ni límites | CRÍTICA | `verifyClient`: valida Origin + cap 3 conn/IP; max 25 min/sesión server-side; maxPayload 2 MB |
| `/api/membership/grant` sin rate-limit | ALTA | `adminLimiter` 5/min + log de intentos |
| Payload global de 20 MB (DoS) | MEDIA | Global 256 KB; solo `/api/evaluate` admite 15 MB |
| Sin helmet / headers | MEDIA | `helmet()` añadido |
| Errores del SDK Gemini filtrados al cliente | BAJA | Mensajes genéricos al cliente; detalle solo en logs |

### Backend (FastAPI) — NO desplegado aún

| Hallazgo | Severidad | Fix |
|---|---|---|
| CMS `PUT /pages` y `GET /pages` sin auth → defacement | CRÍTICA | `require_admin` en update y list; GET ya no auto-crea |
| WebSocket backend sin auth + `json.loads` sin try/except | CRÍTICA | JWT en handshake (`?token=`), cap 3/usuario, try/except |
| `python-jose` 3.3.0 (CVE-2024-33663/33664) | ALTA | Migrado a `PyJWT==2.9.0` (security.py, websockets.py, logging.py) |
| Passwords reales hardcodeadas en `seed_users.py` | ALTA | Leídas de env `SEED_USERS`; nada versionado |

### Frontend (React/Vite) — DESPLEGADO en Vercel

| Hallazgo | Severidad | Fix |
|---|---|---|
| `react-router` con 6 CVEs | ALTA | `npm audit fix` → 0 vulnerabilidades |
| `dangerouslySetInnerHTML` en LevelPage (XSS latente) | MEDIA | Nuevo `SafeText` parsea `**bold**`/`<strong>` sin innerHTML |
| Sin headers de seguridad en Vercel | MEDIA | `vercel.json`: CSP, HSTS, X-Frame-Options, nosniff, Permissions-Policy |

## 🔴 ACCIONES MANUALES PENDIENTES (no automatizables — requieren tu login)

### 1. Rotar la contraseña de admin (CRÍTICO)
La contraseña `SousChef@Admin1` y las de la familia (Tatis, Papa, Olga, Alexa,
Gaby, miguerojas91) estuvieron en el repo (`seed_users.py`, ya purgado del
archivo pero **siguen en el historial git**). Acciones:
- Cambia la contraseña de admin a una nueva fuerte.
- Configura el seed por env: `SEED_USERS="admin:NuevaPassFuerte123:admin@souschef.app::1"`
- (Opcional) purgar el historial git con `git filter-repo` si el repo es público.

### 2. Configurar secretos del proxy en Railway
- `HOTMART_HMAC_SECRET` (preferido) **o** `HOTMART_TOKEN` — SIN al menos uno,
  el webhook ahora responde 503 (fail-closed). Configura el que use tu producto
  Hotmart.
- `ADMIN_SECRET` — secreto fuerte para `/api/membership/grant`.
- `ALLOWED_ORIGIN` — dominio Vercel exacto (ya configurado, verificar).

### 3. Backend (cuando lo despliegues)
- `JWT_SECRET` fuerte (48+ chars).
- Rol Postgres `app_user` SIN `BYPASSRLS` (ver `backend/SECURITY.md`).
- `SEED_USERS` con contraseñas nuevas.

### 4. Gemini API key
- Si la `GEMINI_API_KEY` actual estuvo alguna vez en un `.env` commiteado
  (verificar `git log --all -- proxy/.env`), rótala en Google AI Studio.

## ⚠️ Riesgos residuales conocidos (aceptables para beta)

| Riesgo | Por qué es aceptable en beta | Mitigación futura |
|---|---|---|
| Voice cap es client-side (localStorage) | El WS ahora tiene cap de duración + conexiones server-side que acota el abuso | Validar minutos por-usuario en el proxy con auth real |
| `originGuard` se puede spoofear (Origin header) | Eleva la barra vs abuso casual; combinado con rate-limit es razonable | Token de sesión firmado por request |
| Premium/admin gate en cliente bypasseable | Solo da acceso a UI/contenido estático; las features de costo (IA) pasan por el proxy | Imponer premium en el proxy por email autenticado |
| `VITE_SEED_ADMIN` hornea password en bundle si se usa | Solo si lo configuras; preferir registro normal o backend | Backend JWT (ya existe `seed_users.py`) |

## 🟢 Verificado correcto (sin cambios)

- JWT: secret sin fallback inseguro en prod, HS256 fijo, exp 15 min, firma validada.
- Refresh tokens: rotación + detección de reuso + revocación de cadena. Solo SHA-256 en DB.
- bcrypt: truncado a 72 bytes, `checkpw` timing-safe.
- CORS backend: `allow_credentials` sin wildcard, raise si falta config en prod.
- Rate limiting backend: login 10/min, register 5/min.
- SQL: 100% SQLAlchemy parametrizado, sin f-strings con input de usuario.
- Audit log: append-only vía RLS.
- Sin secretos reales commiteados (solo `.env.example` con placeholders).
- `.gitignore` cubre `.env`, `.vercel/`, `*.pem`.
- `LOCAL_USERS` vacío en el bundle.
