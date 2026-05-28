# Auditoría del flujo Hotmart — pre-beta

**Fecha**: 2026-05-27
**Estado**: Para validar manualmente antes de invitar testers

## 🔄 El flujo end-to-end (cómo debería funcionar)

```
┌──────────────┐
│ Usuario en   │  click "Suscribirme ahora" → abre Hotmart en nueva pestaña
│ /membresia   │
└──────┬───────┘
       │  $9.99 USD/mes (configurado en Hotmart)
       ▼
┌──────────────┐
│ Hotmart      │  procesa el pago
└──────┬───────┘
       │  webhook POST con PURCHASE_APPROVED + email
       ▼
┌──────────────┐
│ Proxy        │  /api/hotmart/webhook
│ Railway      │  - valida HOTMART_TOKEN o HMAC
│              │  - añade email a membershipStore
└──────┬───────┘  - persiste en /app/premium.json
       │
       │  usuario vuelve a la app y click "Ya pagué"
       ▼
┌──────────────┐
│ /membresia   │  llama GET /api/membership/check?email=...
│ frontend     │  → proxy responde {isPremium: true}
│              │  → updatePremiumStatus(true) en localStorage
└──────────────┘
```

## 🔴 Pre-requisitos críticos en Vercel + Railway

### Vercel — variables de entorno

| Variable | Estado a verificar | Si falla |
|---|---|---|
| `VITE_HOTMART_URL` | Debe ser la URL real del producto en Hotmart (no `PRODUCT_ID_AQUI`) | El botón "Suscribirme" lleva a 404 |
| `VITE_API_URL` | Debe ser `https://proxy-production-1113.up.railway.app` sin `\n` final | El frontend no puede verificar membresía |

### Railway — variables de entorno del proxy

| Variable | Estado a verificar | Si falla |
|---|---|---|
| `HOTMART_TOKEN` ó `HOTMART_HMAC_SECRET` | **Al menos UNO debe estar configurado** | Cualquiera puede mandar webhooks falsos → premium gratis para todos |
| `ALLOWED_ORIGIN` | Debe incluir el dominio Vercel | `/api/membership/check` da CORS error |
| `PREMIUM_DB_PATH` | Debe apuntar a un Volume montado | El storage se borra en cada redeploy → todos pierden premium |

### Hotmart — configuración del producto

| Item | Estado a verificar |
|---|---|
| Producto creado con precio $9.99/mes (recurrente) | Sí |
| Webhook configurado a `https://proxy-production-1113.up.railway.app/api/hotmart/webhook` | Sí |
| Si usa HMAC: secret coincide con `HOTMART_HMAC_SECRET` del proxy | Sí |
| Si usa hottok (legacy): query `?hottok=XXX` coincide con `HOTMART_TOKEN` del proxy | Sí |

## ✅ Checklist de validación manual (1 hora)

Ejecuta estos pasos EN ORDEN con una cuenta de tester. Idealmente con tu propio email y tu propia tarjeta (los $9.99 se los reembolsas tú mismo o cancelas inmediato).

### Paso 1 — Verificar config de envvars

- [ ] En Vercel project → Settings → Environment Variables:
  - `VITE_HOTMART_URL` apunta a un producto real de Hotmart (URL termina en un ID, no en `PRODUCT_ID_AQUI`)
  - `VITE_API_URL` no tiene `\n` final
- [ ] En Railway proxy service → Variables:
  - `HOTMART_TOKEN` ó `HOTMART_HMAC_SECRET` están configuradas (mínimo uno)
  - `ALLOWED_ORIGIN` incluye `https://frontend-tau-jet-31.vercel.app`
  - `PREMIUM_DB_PATH=/data/premium.json` y hay un Volume montado en `/data`

### Paso 2 — Test del botón "Suscribirme"

- [ ] Abrir la app en incógnito
- [ ] Login como tester
- [ ] Ir a `/membresia`
- [ ] Click "Suscribirme ahora" → debe abrir el checkout real de Hotmart (no 404 ni placeholder)
- [ ] Completar compra con tarjeta de prueba

### Paso 3 — Verificar webhook llegó al proxy

```bash
# Inmediatamente tras la compra, mirar logs Railway:
# El proxy debe haber logueado:
# "✅ Premium activado: tu_email@ejemplo.com (event: PURCHASE_APPROVED)"
```

- [ ] Logs Railway muestran "Premium activado: tu_email" en los siguientes 30 segundos tras la compra
- [ ] Si NO aparece → revisar:
  - ¿Hotmart está mandando webhook a la URL correcta?
  - ¿El HMAC/hottok matchea?
  - ¿El proxy está vivo?

### Paso 4 — Test del flujo "Ya pagué"

- [ ] Volver a la app
- [ ] En `/membresia` introducir el mismo email que usaste en Hotmart
- [ ] Click "Ya pagué"
- [ ] Debe mostrar mensaje de éxito + redirigir a `/mapa` en 1.5s
- [ ] El header del avatar debe mostrar badge "Pro"
- [ ] Los mundos 3-5 del Modo Aventura deben dejar de tener el candado

### Paso 5 — Test del cap de voz Pro (60 min)

- [ ] En `/cocinar` iniciar voz y dejar que cuente segundos
- [ ] Verificar en consola del browser: `localStorage.getItem('sous_voice_usage')` muestra segundos acumulándose
- [ ] (Opcional avanzado) Forzar `localStorage.setItem('sous_voice_usage', JSON.stringify({"2026-05":3600}))` y refrescar → al intentar iniciar voz debe mostrar "Cap mensual alcanzado"

### Paso 6 — Test de cancelación

- [ ] En Hotmart cancelar tu suscripción de prueba
- [ ] Webhook `SUBSCRIPTION_CANCELLATION` debe llegar al proxy
- [ ] Logs Railway: "❌ Premium cancelado: tu_email"
- [ ] Volver a la app → tras logout/login → badge "Pro" desaparece
- [ ] Mundos 3-5 vuelven a tener candado

## ⚠️ Gaps conocidos (aceptables para beta, no para producción)

| # | Gap | Impacto | Mitigación |
|---|---|---|---|
| 1 | Email de compra ≠ email de cuenta posible | Beta: ok. Prod: una cuenta podría compartir con otra | Para beta es ok; en prod añadir validación |
| 2 | Sin retry si webhook falla | Si Hotmart no logra entregar webhook, premium no se otorga | Hotmart reintenta automáticamente; documentar soporte manual |
| 3 | Sin manera de cancelar desde la app | Usuario debe ir a Hotmart | Botón "Gestionar suscripción" → link Hotmart |
| 4 | Voice cap es client-side (localStorage) | Usuario técnico puede resetear borrando localStorage | Para beta tolerable; prod requiere validación server-side en el WS |
| 5 | premium.json en volumen Railway requiere persistencia | Sin volumen, todos pierden premium en cada deploy | Asegurarse de tener `/data` volume mount |

## 📋 Si algo falla durante la beta

### Tester pagó pero no aparece como Pro
1. Verificar Railway logs por "Premium activado: email_del_tester"
2. Si NO aparece: el webhook falló. Forzar manualmente:
   ```bash
   curl -X POST https://proxy-production-1113.up.railway.app/api/membership/grant \
     -H "Content-Type: application/json" \
     -d '{"email":"tester@email.com","secret":"<ADMIN_SECRET>"}'
   ```
3. Mandar mensaje al tester confirmando + pedir captura del recibo Hotmart

### Tester quiere cancelar
1. Indicarle ir a Hotmart → Mi cuenta → Suscripciones → Cancelar
2. Si necesita reembolso: tú lo gestionas desde tu cuenta Hotmart

### Botón "Suscribirme" lleva a 404
- `VITE_HOTMART_URL` no configurada → arreglar en Vercel y redeploy

## 🎯 Listo para invitar testers cuando

- [ ] Los 6 pasos del checklist se ejecutaron con éxito por TI MISMO
- [ ] Tu propio email está en el `premium.json` del proxy y se reflejó en la app
- [ ] El cap de 60 min funciona (test del Paso 5)
- [ ] Si cancelas, el premium se quita
- [ ] Tienes en mano: `ADMIN_SECRET` (para grants manuales) + lista de testers + canal de soporte (WhatsApp)
