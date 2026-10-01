# CodeTracker Frontend - AGENTS.md

## Project Structure
- **Root**: Monorepo with single package at `codetracker/` (React + Vite)
- **Entry**: `codetracker/src/main.jsx` → `App.jsx` → `routes.jsx` (React Router v7)
- **API**: `src/provider/api.jsx` - Axios instance with `baseURL: http://localhost:8080`

## Key Commands (run from `codetracker/`)
```bash
npm run dev      # Start dev server
npm run build    # Production build (outputs to dist/)
npm run lint     # ESLint check
npm run preview  # Preview production build
```

## Architecture
- **Routing**: `src/routes.jsx` - 18 routes including Login, Dashboard, Pecas, Pedidos, Contatos, CRUD pages
- **Pages**: `src/pages/` - Page components with co-located CSS modules
- **Components**: `src/components/` - Reusable UI (Button, Table, Modal, CardGraficoPecas, etc.)
- **State**: No global state library; uses React Context/props

## Stack
- React 19, React Router DOM 7, Axios, Chart.js + react-chartjs-2
- Vite 8, ESLint 10 (flat config with react-hooks, react-refresh)
- CSS Modules for styling

## Conventions
- Pages: PascalCase `.jsx` + `.module.css`
- Components: PascalCase `.jsx` + `.module.css`
- API calls via `api` export from `provider/api.jsx`
- Duplicate `/dashboard` route in routes.jsx (lines 29 and 61)

## Gotchas
- Backend must run on `localhost:8080` for API calls to work
- No test framework configured
- Root `package.json` only has react-router deps; all app deps in `codetracker/`
- `VerMaisPedidos` page now uses shared components: `Header`, `Button`, `Table`, `SearchBar`, `Filtro`, `DeleteModal`
- All pages use background `#f4f7fb` and `font-family: sans-serif` (except Login which keeps gradient)