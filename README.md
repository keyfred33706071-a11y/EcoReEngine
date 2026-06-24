# EcoReEngine ♻️🔧

**Plataforma educativa de reciclaje electrónico** — Aprende a reutilizar componentes de e-waste para crear nuevos proyectos, conecta con tu centro de reciclaje más cercano y sé parte de una comunidad de ecoingenieros.

## 🚀 Características

- **74 proyectos paso a paso** — Guías detalladas con materiales reciclados, herramientas y tips
- **Calculadora de resistencias** — Código de colores con visualizador interactivo
- **Diccionario de componentes** — Referencia rápida de componentes electrónicos
- **Asistente IA (EcoBot)** — Resuelve dudas técnicas con inteligencia artificial
- **Mapa de reciclaje** — Encuentra centros de acopio cercanos con geolocalización
- **Comunidad** — Publicaciones, likes, comentarios y perfiles públicos
- **Gamificación** — XP, niveles, logros, rachas diarias e insignias
- **Laboratorio de proyectos** — Proyectos estáticos + de instituciones con rating y comentarios
- **Panel administrador** — Gestión de usuarios, roles, contenido y notificaciones
- **Modo offline parcial** — Caché de perfil en localStorage

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
