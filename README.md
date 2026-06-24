# EcoReEngine ♻️🔧

**Plataforma educativa de reciclaje electrónico** — Aprende a reutilizar componentes de e-waste para crear nuevos proyectos, conecta con tu centro de reciclaje más cercano y sé parte de una comunidad de ecoingenieros.

## 🚀 Características

1. 📱 Autenticación y Perfil
Registro/login con Firebase Auth
Perfil de usuario con avatar (subida por cámara, archivo o portapapeles)
Niveles por XP, racha de días activos
Roles: user, mod, admin, owner, institution
Verificación de cuenta, baneo (permanente o temporal)
Compartir perfil por nativo share
2. 🏠 Inicio (Home)
Dato ambiental diario generado por IA (con notificación push)
Acceso rápido a: EcoBot, Electrónica, Componentes, E-waste, Juego
3. 🔧 Centro de Herramientas (6 herramientas)
🤖 EcoBot — Asistente IA (Groq/OpenRouter) para preguntas técnicas, recomendación de proyectos
🧮 Calculadora de Resistencias — Código de colores (3/4/5/6 bandas), visual interactivo
📸 Scanner de Componentes — Identifica componentes vía cámara + IA (OpenRouter)
📖 Diccionario de Componentes — Catálogo interactivo con +8 componentes electrónicos
📐 Fórmulas Rápidas — Ley de Ohm, potencia, serie/paralelo
🗺️ Mapa de Reciclaje — Encuentra centros de acopio cerca de tu ubicación (Leaflet + OpenStreetMap)
4. 🔬 Laboratorio de Proyectos
74 proyectos paso a paso con dificultad (Fácil/Medio/Avanzado)
Proyectos estáticos + proyectos de instituciones
Sistema de rating (estrellas) por usuario
Paginación, filtros por dificultad
Drag & drop / pegar imágenes para proyectos
Fijar proyectos favoritos
5. 📚 Biblioteca de Aprendizaje (Tutoriales)
Tutoriales categorizados: basics, circuits, robotics, ewaste, projects
Progreso por pasos, barra de progreso
Foto de evidencia (+50 XP bonus)
XP por completar tutorial
6. 👥 Comunidad
Publicaciones con 8 tipos: Proyecto, Consejo, Pregunta, Logro, Idea, Tutorial, Galería, Debate
Likes, comentarios, responder comentarios
Reportar contenido inapropiado
Compartir enlace, filtro por tipo
Perfiles públicos visibles
7. 🎮 Juego: EcoCatch
Juego tipo "catch" donde atrapas reciclables y evitas basura
3 vidas, combos, partículas, milestones con robot animado
Dificultad progresiva (+ objetos exclusivos)
Modo táctil (arrastre) o botones
Tabla de clasificación (top 100)
Ganancia de XP por puntaje
8. 🏆 Logros y Gamificación
Sistema completo de logros (comunes, raros, épicos, legendarios)
XP, niveles, racha diaria
Tabla de clasificación (XP y juego)
Gráfico de progreso semanal
Medidor de CO₂ ahorrado
9. 📦 Inventario de Componentes
Registrar componentes rescatados de e-waste
Estado (Excelente/Bueno/Regular/Dañado)
Categorías (Pasivo, Semiconductor, Control, Mecánico, etc.)
Fuente de origen, notas
10. 🏢 Instituciones
Perfiles de tipo "institución"
Gestión de proyectos institucionales (CRUD completo)
Publicación en el laboratorio general
11. 🤝 Desafíos entre Usuarios
Enviar/recibir desafíos
Aceptar/rechazar desafíos (+30 XP)
Historial de desafíos
Tiempo real con Firestore snapshot
12. 🛡️ Panel de Administración
Solo para roles admin/owner:

Dashboard con estadísticas (usuarios, XP, verificados, baneos, etc.)
Gestión de usuarios: búsqueda, verificar, cambiar rol, banear (con expiración), exportar
Gestión de publicaciones: ocultar, fijar, eliminar, ver comentarios
Comunicado global en la app
Chat entre administradores
Publicar como "EcoReEngine"
Notificaciones globales a todos los usuarios
Gestión de proyectos (CRUD de proyectos administrables)
Actualización OTA (subir APK, changelog, forzar actualización)
Editor del Diccionario (CRUD de entradas)
Configuración de límites (posts/día, XP/hora, caracteres)
Visor de reportes de contenido
13. 🔄 Actualización OTA
Sistema de actualización forzosa/opcional
Descarga directa de APK o share nativo
14. 🌓 Tema Oscuro / Claro
Alternar entre modo oscuro y claro
15. 📱 Multiplataforma
Web (Vercel) + Android (Capacitor 8)
Service Worker (PWA)
Bloqueo de DevTools (F12, Ctrl+Shift+I, etc.)
16. 🛠️ Backend
Firebase Auth + Firestore + Storage
API de Groq (chat) y OpenRouter (visión)
Funciones Cloud Functions (proxy de IA opcional)
1179 líneas de lógica Firestore (CRUD completo)
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
