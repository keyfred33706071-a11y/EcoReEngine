# Guion de Presentación — EcoReEngine

---

## 1. Introducción (30 seg)

> "Hola, soy **[tu nombre]**. Les presento **EcoReEngine**, una aplicación educativa que enseña electrónica y reciclaje de residuos electrónicos (e-waste) a través de proyectos prácticos con materiales reciclados."

---

## 2. ¿Qué problema resuelve? (30 seg)

> "Cada año se generan **50 millones de toneladas** de e-waste en el mundo. La mayoría termina en vertederos porque la gente no sabe qué hacer con sus aparatos rotos. EcoReEngine enseña a **reutilizar componentes** y a reciclar responsablemente."

---

## 3. Pantalla principal — Dashboard (30 seg)

> "Al abrir la app vemos el **Dashboard**. Aquí el usuario tiene acceso rápido a:
> - **Scanner de Componentes**: identifica componentes con IA
> - **Calculadora de Resistencias**: calcula valores por colores
> - **Laboratorio**: proyectos paso a paso
> - **Asistente EcoBot**: chatbot de consultas técnicas
> - **Mapa de Reciclaje**: centros de acopio cercanos"

---

## 4. Autenticación y Perfiles (20 seg)

> "El usuario se registra con **correo y contraseña** mediante **Firebase Auth**. Cada perfil tiene un rol: `user`, `institution`, `mod`, `admin` u `owner`. Los roles controlan qué secciones del panel de administración están disponibles."

---

## 5. Scanner de Componentes — el corazón de la IA (40 seg)

> "El **Scanner** permite tomar una foto o subir una imagen de un componente electrónico. La imagen se envía a **Groq IA**, específicamente al modelo `llama-3.2-11b-vision-preview`, que identifica el componente y devuelve:
> - Nombre y tipo
> - De qué aparato se suele extraer
> - Si se puede reciclar
> - Un consejo breve
>
> Si Groq falla, el sistema cae en **OpenRouter** como respaldo. También hay un **diccionario manual** con 12 componentes comunes."

---

## 6. Asistente EcoBot — Chat con IA (30 seg)

> "**EcoBot** es un asistente conversacional entrenado con información de electrónica y reciclaje. Usa **Groq IA** con el modelo `llama-3.1-8b-instant` para responder preguntas sobre:
> - Cómo soldar componentes
> - Cómo leer resistencias
> - Proyectos recomendados
> - Reciclaje de e-waste
>
> Si no hay conexión, el bot responde con respuestas offline precargadas para las consultas más comunes."

---

## 7. Laboratorio — Proyectos prácticos (30 seg)

> "El **Laboratorio** contiene proyectos paso a paso como:
> - **PowerBulb**: lámpara LED con botella reciclada
> - **Eco-Rover**: carro con motor DC y materiales reutilizados
> - **Eco-Dinamo**: generador manual sin baterías
> - **Sensor de Luz**: circuito que enciende un LED al oscurecer
>
> Cada proyecto incluye lista de materiales, herramientas, pasos ilustrados y consejos. Los usuarios pueden **calificar y comentar** los proyectos."

---

## 8. Comunidad (20 seg)

> "La **Comunidad** es un muro donde los usuarios comparten sus propios proyectos, fotos y consejos. Pueden dar **me gusta** y **comentar**. Los administradores pueden fijar publicaciones oficiales y moderar contenido."

---

## 9. Mapa de Reciclaje (20 seg)

> "El **Mapa de Reciclaje** muestra **14 centros de acopio** en Venezuela, con dirección, teléfono, horario y tipos de residuos que aceptan. Usa **Leaflet** con OpenStreetMap. Puedes verlos en mapa o en lista, y obtener indicaciones para llegar."

---

## 10. Panel de Administración (30 seg)

> "El panel de administración permite:
> - **Gestionar usuarios**: roles, verificación, baneo
> - **Moderar publicaciones**: ocultar, fijar, eliminar
> - **Enviar comunicados globales**: banner informativo para todos los usuarios
> - **Notificar a todos**: notificaciones push
> - **Publicar como App**: posts oficiales
> - **Chat Admin**: comunicación interna del staff
> - **Proyectos**: crear y editar proyectos educativos"

---

## 11. Arquitectura Técnica (30 seg)

> "La app está construida con:
> - **Frontend**: React 18 + TypeScript, Vite 5, Tailwind CSS, Lucide Icons
> - **Backend**: Firebase (Auth, Firestore, Storage) — todo serverless
> - **APIs de IA**: Groq (principal) y OpenRouter (fallback)
> - **Hosting**: La web se despliega en **Vercel** (~$5-9/mes)
> - **App Móvil**: Se compila a Android nativo con **Capacitor**
>
> No hay servidor propio. La lógica de IA se ejecuta desde el frontend directamente contra las APIs."

---

## 12. Demo en vivo (1-2 min)

> "Vamos a ver un recorrido rápido:
> 1. **Registro** de un usuario nuevo
> 2. **Dashboard** y navegación principal
> 3. **EcoBot** — preguntarle algo sobre reciclaje
> 4. **Laboratorio** — mostrar un proyecto
> 5. **Mapa** — ver centros de reciclaje
> 6. **Scanner** — subir una foto de un componente"

---

## 13. Cierre (15 seg)

> "EcoReEngine democratiza el conocimiento de electrónica y promueve el reciclaje responsable. Está lista para ser usada en instituciones educativas y talleres comunitarios. Gracias por su atención. ¿Preguntas?"
