# NAISA Stylist IA

Estilista de protocolo con inteligencia artificial, por **NAISA BALLESTEROS**. SaaS freemium: el usuario escanea su clóset, analiza su silueta y recibe **3 outfits por ocasión** con **% de compatibilidad**, consejos de estilismo y sugerencias de compra.

- **Web/PWA**: Next.js 15 (App Router) desplegado en Vercel
- **Base de datos, auth y archivos**: Supabase (Postgres + RLS + Storage privado), proyecto `naisa-stylist` (`octhvacvqcdkhhmbnpsl`)
- **IA**: Claude (visión para reconocer prendas y silueta; razonamiento para proponer outfits)
- **Pagos**: Mercado Pago Suscripciones (COP)
- **Android**: Capacitor 8 (APK/AAB firmados), carpeta `mobile/`

## Cómo funciona la recomendación

```
Clóset + silueta + estilo + ocasión
        │
        ├─► Motor de reglas (instantáneo): genera combinaciones válidas por protocolo
        ├─► Claude (≤ 4,2 s): propone 4–6 looks con IDs reales del clóset
        │
        ▼
Verificador determinista (lib/scoring.ts)
  Protocolo 40% · Color 25% · Silueta 20% · Estilo 15% − penalización por piezas faltantes
        │
        ▼
3 mejores outfits (variedad de pieza protagonista) + compras sugeridas + consejos
```

- **Tiempo de respuesta < 5 s**: la llamada a Claude tiene presupuesto de 4,2 s; si no responde, se entregan los resultados del motor de reglas. Las imágenes se reducen en el teléfono antes de enviarse.
- **Precisión > 85%**: solo se marca como *Recomendado* lo que supera 85 en el verificador. La precisión real se mide con el botón 👍/👎 de cada recomendación (`recommendations.feedback`) y el uso real (`worn_on`).
- **Sin clave de IA** la app funciona en "modo reglas" (registro manual de prendas con color detectado automáticamente).

## Planes

| | Esencial (gratis) | Premium |
| --- | --- | --- |
| Precio | $0 | COP 24.900/mes o COP 199.000/año |
| Prendas | 30 | Ilimitadas |
| Escaneos IA de prendas | 25/mes | Ilimitados |
| Recomendaciones | 5/mes | Ilimitadas |
| Silueta | Básica, 1/mes | Avanzada (proporciones) |
| Sugerencias de compra | Conteo bloqueado | Completas |
| Historial | Último look | Completo + métricas |
| Protocolos madrina/novia/ponente | — | Sí |

Los límites se aplican en la base de datos (`consume_quota`, trigger `garments_limit`), no en el cliente.

## Puesta en producción

### 1. Supabase (ya aprovisionado)
Esquema, RLS, funciones y buckets privados ya están aplicados en `naisa-stylist`. Falta en el panel de Supabase:

1. **Authentication → URL Configuration**: *Site URL* = `https://naisa-stylist.vercel.app` y en *Redirect URLs* agrega `https://naisa-stylist.vercel.app/auth/callback`.
2. **Authentication → SMTP**: configura un SMTP propio (Resend, SendGrid, Amazon SES). El SMTP por defecto de Supabase solo envía correos a miembros de tu organización, así que los usuarios reales no recibirían la confirmación.
3. **Project Settings → API**: copia la *service_role key* para `SUPABASE_SERVICE_ROLE_KEY` (necesaria para borrar cuentas).

### 2. Vercel
1. vercel.com/new → importa `rafaelramosb/naisa-stylist` con nombre de proyecto **naisa-stylist** (la app Android apunta a `naisa-stylist.vercel.app`).
2. Variables de entorno (ver `.env.example`):

| Variable | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://octhvacvqcdkhhmbnpsl.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clave publicable de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service role (sensible) |
| `SUBSCRIPTION_APPLY_SECRET` | el secreto guardado en `private.config.webhook_secret` (te lo entregamos aparte) |
| `ANTHROPIC_API_KEY` | clave de console.anthropic.com |
| `MP_ACCESS_TOKEN` | Access Token de producción de Mercado Pago Colombia |
| `MP_WEBHOOK_SIGNING_SECRET` | clave secreta de webhooks de Mercado Pago |
| `NEXT_PUBLIC_SITE_URL` | `https://naisa-stylist.vercel.app` |

### 3. Mercado Pago
1. Crea una aplicación en mercadopago.com.co/developers (producto: *Suscripciones*).
2. **Webhooks**: URL `https://naisa-stylist.vercel.app/api/mp/webhook`, eventos *Planes y suscripciones* (`subscription_preapproval`, `subscription_authorized_payment`). Copia la clave secreta a `MP_WEBHOOK_SIGNING_SECRET`.
3. El webhook nunca confía en el cuerpo de la notificación: consulta la suscripción en la API de Mercado Pago y la aplica con `mp_apply_subscription` (protegida por secreto).

### 4. Android
- APK firmado listo en `public/descargas/naisa-stylist.apk` (se sirve en `/descargar`).
- Para recompilar: GitHub → Actions → **Android** → *Run workflow* (puedes cambiar la URL de producción). Con una etiqueta `v1.0.1` se publica un *Release* con APK y AAB.
- Secretos del repo para firmar: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`naisa`), `ANDROID_KEY_PASSWORD`. **Guarda el keystore**: sin él no podrás publicar actualizaciones.
- Google Play: sube el `.aab`. Si vendes Premium dentro de la app publicada en Play, Google exige su sistema de facturación para bienes digitales; la ruta habitual es vender la suscripción en la web.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completa las claves
npm run dev                  # http://localhost:3000
npm test                     # pruebas del motor de compatibilidad
```

## Seguridad y privacidad

- RLS en todas las tablas; el usuario no puede modificar `plan` (privilegios por columna).
- Storage privado por carpeta de usuario; las fotos se ven con URLs firmadas de 1 hora.
- La foto de cuerpo completo se procesa y se descarta salvo consentimiento explícito.
- CSP, HSTS, `frame-ancestors 'none'`, `Permissions-Policy`.
- Exportación y eliminación de datos (Ley 1581 de 2012) desde *Cuenta y privacidad*.

## Estructura

```
app/                 páginas (landing, /app/*) y API (/api/*)
components/          UI compartida (OutfitCard, GarmentArt, íconos)
lib/                 motor de reglas, scoring, color, Claude, Mercado Pago, Supabase
supabase/migrations  esquema SQL
mobile/              proyecto Capacitor Android
tests/               pruebas del motor
```
