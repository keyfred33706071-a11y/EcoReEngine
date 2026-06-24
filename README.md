# EcoReEngine ♻️🔧

**Plataforma educativa de reciclaje electrónico** — Aprende a reutilizar componentes de e-waste para crear nuevos proyectos, conecta con tu centro de reciclaje más cercano y sé parte de una comunidad de ecoingenieros.

## 🚀 Características

### 🧰 Centro de Herramientas (6 herramientas)
- **🤖 EcoBot (Asistente IA)** — Chat con IA (Groq/OpenRouter) para resolver dudas técnicas, diagnosticar circuitos y recomendar proyectos
- **🧮 Calculadora de Resistencias** — Código de colores interactivo (3/4/5/6 bandas) con visualizador SVG del resistor
- **📸 Scanner de Componentes** — Identifica componentes electrónicos vía cámara + IA (OpenRouter Vision)
- **📖 Diccionario de Componentes** — Catálogo interactivo con imágenes, funciones, unidades y fuentes comunes
- **📐 Fórmulas Rápidas** — Ley de Ohm, potencia, resistencias en serie y paralelo
- **🗺️ Mapa de Reciclaje** — Centros de acopio cercanos con Leaflet + OpenStreetMap, geolocalización, filtros, distancia

### 🔬 Laboratorio de Proyectos
- **74 proyectos paso a paso** con dificultad (Fácil/Medio/Avanzado), tarjetas visuales y thumbnails
- Proyectos de **instituciones** con rating de estrellas por usuario
- Paginación, filtros, proyectos favoritos
- Drag & drop de imágenes para thumbnails

### 📚 Biblioteca de Aprendizaje
- Tutoriales categorizados (básicos, circuitos, robótica, e-waste, proyectos)
- Progreso paso a paso con barra de progreso y checklists
- Foto de evidencia (+50 XP bonus)
- XP por completar tutoriales

### 👥 Comunidad
- Publicaciones con 8 tipos: Proyecto, Consejo, Pregunta, Logro, Idea, Tutorial, Galería, Debate
- Likes, comentarios, responder comentarios, etiquetas
- Reportar contenido inapropiado
- Compartir enlace, filtro por tipo, perfiles públicos
- Publicaciones oficiales de "EcoReEngine"

### 🎮 Juego: EcoCatch
- Atrapa reciclables ♻️ y evita basura 🚫
- 3 vidas, combos 🔥, partículas ✨ y milestones con animaciones del robot
- Dificultad progresiva, modo táctil (arrastre) o botones
- Tabla de clasificación (top 100), ganancia de XP

### 🏆 Gamificación y Logros
- XP, niveles, racha diaria de actividad
- Logros con rarezas (común, raro, épico, legendario)
- Medidor circular de CO₂ ahorrado
- Gráfico de progreso semanal
- Tabla de clasificación por XP y por juego

### 📦 Inventario de Componentes
- Registra componentes rescatados de e-waste
- Estado (Excelente/Bueno/Regular/Dañado)
- Categorías por tipo, fuente de origen y notas

### 🏢 Gestión para Instituciones
- Perfiles tipo "institución"
- CRUD completo de proyectos institucionales
- Publicación automática en el laboratorio general

### 🤝 Desafíos entre Usuarios
- Enviar/recibir desafíos personalizados
- Aceptar o rechazar, historial completo
- XP por completar desafíos

### 🛡️ Panel de Administración
- Dashboard con estadísticas en tiempo real (usuarios, XP, verificados, baneos, etc.)
- **Gestión de usuarios** — Búsqueda, filtros, verificar, cambiar rol (user/mod/admin/owner/institution), banear (con expiración), exportar, resetear contraseña
- **Gestión de publicaciones** — Ver, fijar, ocultar, eliminar posts y comentarios
- **Comunicado Global** — Banner visible para todos los usuarios
- **Chat Admin** — Comunicación interna entre administradores
- **Publicar como App** — Crear posts oficiales como "EcoReEngine"
- **Notificaciones Globales** — Enviar notificaciones a todos los usuarios
- **Gestión de Proyectos** — CRUD completo de proyectos administrables
- **Actualización OTA** — Subir APK, changelog, forzar actualización automática
- **Editor del Diccionario** — CRUD de entradas del diccionario de componentes
- **Configuración de Límites** — Posts/día, XP/hora, caracteres por comentario
- **Visor de Reportes** — Moderación de contenido reportado

### 🔄 Actualización OTA (Over-The-Air)
- Sistema de actualización remota forzosa u opcional
- Descarga directa de APK o share nativo desde Android

### 🌓 Tema Oscuro / Claro
- Alternar entre modo oscuro y claro con persistencia

### 📱 Multiplataforma
- Web (Vite + Vercel) + Android (Capacitor 8)
- Service Worker (PWA), notificaciones push locales
- Bloqueo de DevTools y menú contextual
- Perfil con avatar (cámara, archivo o pegar desde portapapeles)
## 🛠️ Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript |
| Build | Vite 5 |
| Estilos | Tailwind CSS 3 |
| Backend | Firebase (Auth, Firestore, Storage) |
| APIs externas | Groq (IA), OpenRouter, ImgBB |
| Mobile | Capacitor 8 (Android) |
| Hosting | Vercel |

## 📦 Instalación

```bash
git clone https://github.com/keyfred33706071-a11y/EcoReEngine.git
cd ecoreengine
npm install
npm run dev
```

## 🧪 Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run preview` | Previsualiza build |
| `npm run typecheck` | Verifica tipos TypeScript |
| `npm run lint` | Ejecuta ESLint |
| `npm test` | Ejecuta pruebas con Vitest |

## 🏗️ Arquitectura

```
Usuario (Web / Android)
       │
       ▼
Frontend (React + Vite) ─── Hosting: Vercel
       │
       ├── Firebase Auth → Login / Registro
       ├── Firebase Firestore → Perfiles, Posts, Proyectos, Logros
       ├── Firebase Storage → Imágenes
       └── APIs Externas → Groq, OpenRouter, ImgBB
```

## 📁 Estructura

```
src/
├── App.tsx              # Componente principal
├── main.tsx             # Punto de entrada
├── pages/               # 27 páginas
│   ├── Laboratorio.tsx  # Proyectos estáticos + admin
│   ├── CommunityPage.tsx # Red social
│   ├── RecyclingMapPage.tsx # Mapa de reciclaje
│   ├── admin/           # Panel administrador
│   └── ...
├── components/          # Componentes reutilizables
├── lib/                 # Lógica, Firebase, utilidades
│   ├── firebase.ts      # Configuración Firebase
│   ├── firestore.ts     # Operaciones CRUD
│   └── ai.ts            # Integración con IA
└── ...
```

## 🌱 Visión

Convertir EcoReEngine en el estándar latinoamericano de educación en reciclaje electrónico — una herramienta gratuita que empodere a estudiantes, aficionados y comunidades a reducir el e-waste mediante la reutilización creativa.

## 📄 Licencia

MIT
