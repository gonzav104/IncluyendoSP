# Incluyendo SP

Mini-aplicación web para familias de **San Pedro, Buenos Aires** que centraliza recursos para niños y niñas (0-12 años) que requieren apoyo educativo o terapéutico especializado (TEA, discapacidad motriz y neurodiversidad en general).

## ¿Qué problema resuelve?

Cuando una familia recibe un diagnóstico o una indicación educativa, arranca una odisea: ¿a qué institución llamo? ¿qué trámite hago primero? ¿dónde tramitan el CUD? ¿qué escuelas reciben a mi hijo? Esa información existe pero está dispersa, desactualizada y no siempre es accesible.

Incluyendo SP concentra todo en un solo lugar, con tres herramientas:

1. **Directorio verificado de instituciones** — escuelas especiales, consultorios terapéuticos, hospitales, con datos de contacto, cobertura, accesibilidad, rango etario y ubicación en mapa. Con buscador y filtros por especialidad y cobertura de CUD.
2. **Guía de trámites en lenguaje claro** — pasos concretos para los trámites más comunes (CUD, integración escolar, etc.), paso a paso, sin tecnicismos.
3. **Asistente IA** — un chat de orientación que responde con el contexto real de las instituciones de la base (vía el backend), para que las respuestas se basen en datos verificados y no alucine.

## Stack

| Capa | Tecnología |
|---|---|
| UI | [React](https://react.dev/) 19 |
| Build | [Vite](https://vitejs.dev/) 6 |
| Estilos | [Tailwind CSS](https://tailwindcss.com/) v4 |
| Markdown | [react-markdown](https://github.com/remarkjs/react-markdown) 10 |
| Iconos | [lucide-react](https://lucide.dev/) |
| Mapas | [Leaflet](https://leafletjs.com/) + [react-leaflet](https://react-leaflet.js.org/) (tiles de OpenStreetMap, sin API key) |
| Backend | [incluyendo-sp-api](../incluyendo-sp-api) (BFF Express + MySQL) |

## Instalación y ejecución local

Requisitos: **Node.js 18+**.

```bash
# 1) Instalar dependencias
npm install

# 2) Crear el archivo de entorno
cp .env.example .env
#    → VITE_API_URL apunta al BFF (default: http://localhost:3000)

# 3) Levantar el servidor de desarrollo
npm run dev
```

Abrí `http://localhost:5173` en el navegador.

> **Nota:** el directorio funciona en dos modos. Si el backend `incluyendo-sp-api` está corriendo, la app consume los datos reales desde MySQL. Si no está disponible, hace **fallback automático** al JSON local (`src/data/institutions.json`) y muestra un aviso — la demo nunca se rompe.

### Variables de entorno (`.env`)

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base del BFF (default: `http://localhost:3000`) |

## Estructura de carpetas

```
IncluyendoSP/
├── public/
│   └── logo_incluyendosp.png     # Logo servido estáticamente
├── src/
│   ├── components/               # UI atómica: tarjetas, modales, filtros, chat
│   │   ├── InstitutionCard.jsx   # Tarjeta de institución en la grilla
│   │   ├── InstitutionModal.jsx  # Ficha completa con datos + mapa
│   │   ├── InstitutionMap.jsx    # Mapa Leaflet/OSM con marcador
│   │   ├── SuggestionModal.jsx   # Formulario "Sugerir institución" → POST /api/suggestions
│   │   ├── FilterDropdown.jsx    # Filtros por especialidad / CUD
│   │   ├── ProcedureFolder.jsx   # Carpeta de trámites de la guía
│   │   └── Assistant.jsx         # Chat del asistente IA
│   ├── data/
│   │   ├── institutions.json     # Directorio local (fallback del BFF)
│   │   └── procedures.json       # Guía de trámites
│   ├── hooks/
│   │   ├── useInstitutions.js    # GET /api/institutions con fallback local
│   │   └── useAssistant.js       # POST /api/assistant (chat IA)
│   ├── lib/
│   │   ├── labels.js             # Traducciones y helpers de datos
│   │   └── markdown.jsx          # Estilos para el renderizado markdown
│   ├── App.jsx                   # Layout, pestañas y estado global
│   ├── main.jsx                  # Punto de entrada de React
│   └── index.css                 # Tema (paleta, tipografías, tokens)
├── .env.example
├── index.html
└── package.json
```

## Backend

La app consume el BFF **incluyendo-sp-api** (repositorio hermano en `../incluyendo-sp-api`):

- `src/hooks/useInstitutions.js` → `GET /api/institutions` (directorio desde MySQL)
- `src/hooks/useAssistant.js` → `POST /api/assistant` (chat IA con contexto RAG)
- `src/components/SuggestionModal.jsx` → `POST /api/suggestions` (sugerencias de la comunidad)

La URL base se configura con `VITE_API_URL` (default en desarrollo: `http://localhost:3000`). Documentación completa de la API en [`incluyendo-sp-api/README.md`](../incluyendo-sp-api/README.md).