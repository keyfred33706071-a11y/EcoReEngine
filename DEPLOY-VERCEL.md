# Publicar EcoReEngine en Vercel (versión web para el jurado)

La app ya es una web (Vite + React + Firebase). Vercel solo necesita compilarla y
servirla con una URL pública. El plan gratuito (Hobby) alcanza para la feria y no
pide tarjeta.

Con esto el jurado podrá abrir la app desde cualquier celular o computadora, sin
instalar el APK.

---

## Opción A — Desde GitHub (recomendada)

1. Sube los cambios al repositorio:

   ```bash
   git add .
   git commit -m "Versión web para el jurado"
   git push origin main
   ```

2. Entra a <https://vercel.com/new> e inicia sesión con GitHub.

3. Importa el repositorio **`keyfred33706071-a11y/EcoReEngine`**.

4. Vercel detecta la configuración de `vercel.json` automáticamente:
   - Framework: **Vite**
   - Build Command: **`npm run build`**
   - Output Directory: **`dist`**

5. Pulsa **Deploy** y espera 1–2 minutos.

6. Copia la URL de producción, por ejemplo:
   `https://ecoreengine.vercel.app`

7. **Importante — Firebase Auth:** entra a
   [Firebase Console](https://console.firebase.google.com/) → proyecto
   `ecoreengine-7fcaa` → **Authentication** → **Settings** → **Authorized domains**
   → **Add domain** y agrega tu dominio de Vercel
   (`ecoreengine.vercel.app` o el que te haya tocado).
   Sin esto, el login puede fallar con `auth/unauthorized-domain`.

8. Abre la URL en el celular y prueba:
   - Registro / inicio de sesión.
   - Inicio (banner, EcoBot, tarjetas 2x2).
   - Herramientas, Laboratorio y Comunidad.
   - EcoBot (IA) y Scanner.

Cada `git push` a `main` vuelve a desplegar automáticamente.

---

## Opción B — Desde la terminal

```bash
npm i -g vercel
vercel login
vercel        # despliegue de prueba (preview)
vercel --prod # despliegue público definitivo
```

La primera vez te pregunta el nombre del proyecto y confirma la configuración; acepta
los valores detectados (`Vite`, `dist`).

---

## Variables de entorno (opcional)

La app funciona sin configurar nada porque tiene claves de respaldo. Si quieres usar
tus propias claves, agrégalas en **Vercel → Project → Settings → Environment
Variables** y vuelve a desplegar:

| Variable | Uso |
| --- | --- |
| `VITE_OPENROUTER_API_KEY` | Chat e imágenes con OpenRouter |
| `VITE_GROQ_API_KEY` | Chat/visión con Groq |
| `VITE_IMGBB_API_KEY` | Subida de imágenes |
| `VITE_FUNCTIONS_URL` | Proxy de Cloud Functions (recomendado para no exponer claves) |

> Las variables que empiezan con `VITE_` quedan visibles en el navegador. Para un uso
> público serio, configura `VITE_FUNCTIONS_URL` y mueve las claves al servidor
> (`firebase functions:config:set ...`).

---

## Problemas comunes

| Síntoma | Solución |
| --- | --- |
| El login da `auth/unauthorized-domain` | Agrega el dominio en Firebase → Authentication → Authorized domains. |
| Error `auth/api-key-not-valid` o `referer` bloqueado | Revisa restricciones de la API key en Google Cloud Console. |
| Se ve una versión vieja de la app | Recarga forzada o borra datos del sitio (el service worker ya usa red primero para el HTML). |
| `/admin` da 404 | Ya está resuelto por los `rewrites` de `vercel.json`; verifica que ese archivo esté subido. |
| La IA no responde | Revisa las claves en Vercel o los límites del proveedor. Si falla, EcoBot usa respuestas offline. |
| La cámara no abre en escritorio | Usa el celular; el Scanner necesita cámara. |

---

## Notas

- La misma app sigue funcionando como APK de Android; no se rompe nada.
- El menú inferior aparece en móvil y la barra lateral en escritorio.
- Para que el jurado la tenga a mano, pueden abrir la URL y usar **“Agregar a la
  pantalla de inicio”**; se verá como una app.
