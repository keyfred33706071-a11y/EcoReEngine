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
| Backend | Firebase (Auth, Firestore, Storage, Functions) |
| APIs externas | Groq (chat IA), OpenRouter (visión IA) |
| Mobile | Capacitor 8 (Android) |
| Mapas | Leaflet + OpenStreetMap |
| Testing | Vitest |
| Hosting | Vercel |

## 📦 Instalación

```bash
git clone https://github.com/keyfred33706071-a11y/EcoReEngine.git
cd ecoreengine
npm install
npm run dev
```

### Variables de entorno (`.env`)

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GROQ_API_KEY=           # Para EcoBot (chat IA)
VITE_OPENROUTER_API_KEY=      # Para Scanner (visión IA)
VITE_FUNCTIONS_URL=           # (opcional) Proxy Cloud Functions
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
       ├── Firebase Firestore → Perfiles, Posts, Proyectos, Logros, Centros
       ├── Firebase Storage → Imágenes y avatares
       ├── Firebase Functions → Proxy IA (opcional)
       ├── Groq API → EcoBot (chat)
       └── OpenRouter → Scanner de componentes (visión)
```

## 📁 Estructura

```
src/
├── App.tsx               # Componente principal (ruteo, layout, onboarding, actualizaciones)
├── main.tsx              # Punto de entrada (service worker, bloqueo DevTools)
├── pages/                # 27+ páginas
│   ├── Home.tsx          # Inicio con dato diario y accesos rápidos
│   ├── Dashboard.tsx     # Perfil, XP, logros, CO₂, progreso semanal
│   ├── Laboratorio.tsx   # Proyectos (estáticos + instituciones)
│   ├── LearnPage.tsx     # Biblioteca de tutoriales
│   ├── CommunityPage.tsx # Red social
│   ├── ToolsHub.tsx      # Centro de herramientas
│   ├── PuzzlePage.tsx    # Juego EcoCatch
│   ├── ScannerPage.tsx   # Scanner de componentes con IA
│   ├── RecyclingMapPage.tsx # Mapa de reciclaje
│   ├── Calculadora.tsx   # Calculadora de resistencias
│   ├── Diccionario.tsx   # Diccionario de componentes
│   ├── Asistente.tsx     # EcoBot IA
│   ├── AdminPage.tsx     # Panel administrador completo
│   ├── InstitutionPage.tsx # Gestión de proyectos institucionales
│   ├── ChallengesPage.tsx # Desafíos entre usuarios
│   ├── InventoryPage.tsx # Inventario de componentes
│   ├── AchievementsPage.tsx # Logros
│   ├── LeaderboardPage.tsx # Tablas de clasificación
│   ├── SettingsPage.tsx  # Configuración
│   ├── PublicProfilePage.tsx # Perfiles públicos
│   ├── EwastePage.tsx    # Guía de reciclaje de e-waste
│   ├── FormulasPage.tsx  # Fórmulas rápidas
│   ├── ProyectoDetalle.tsx # Detalle de proyecto
│   └── admin/
│       └── AdminTools.tsx # Herramientas avanzadas de admin
├── components/           # Componentes reutilizables
│   ├── layout/
│   │   ├── Sidebar.tsx   # Sidebar de navegación
│   │   └── Header.tsx    # Encabezado
│   ├── AchievementCard.tsx
│   ├── AchievementPopup.tsx
│   ├── RobotDialog.tsx   # Diálogo del robot ReBot (onboarding)
│   ├── Skeleton.tsx
│   ├── Toast.tsx
│   ├── VerifiedBadge.tsx
│   └── RoleBadge.tsx
├── lib/                  # Lógica y utilidades
│   ├── firebase.ts       # Configuración Firebase
│   ├── firestore.ts      # ~1179 líneas de CRUD (perfiles, posts, proyectos, etc.)
│   ├── ai.ts             # Integración con Groq y OpenRouter
│   ├── challenges.ts     # Desafíos entre usuarios (Firestore snapshots)
│   ├── projects.ts       # Proyectos disponibles
│   ├── projectsData.ts   # Datos de los 74 proyectos
│   ├── achievementsData.ts # Datos de logros
│   ├── achievementChecker.ts # Verificador automático de logros
│   ├── exportPdf.ts      # Exportación a PDF
│   ├── compressImage.ts  # Compresión de imágenes
│   ├── sanitize.ts       # Sanitización de texto
│   ├── version.ts        # Comparación de versiones
│   └── errorLogger.ts    # Manejo global de errores
└── index.css             # Estilos globales + Tailwind
```

## 🌱 Visión

Convertir EcoReEngine en el estándar latinoamericano de educación en reciclaje electrónico — una herramienta gratuita que empodere a estudiantes, aficionados y comunidades a reducir el e-waste mediante la reutilización creativa.

## 📄 Licencia

MIT
