# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sistema de Gestión de Requerimientos de Almacén - A warehouse requirements management system built with Next.js 14 (App Router), Shadcn UI, TailwindCSS, Prisma and PostgreSQL.

## Commands

```bash
# Development
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations (dev)
npm run db:push      # Push schema to DB (no migration)
npm run db:seed      # Seed initial data
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database
```

## Architecture

### Route Groups
- `(auth)` - Public authentication pages (`/login`, `/register`)
- `(dashboard)` - Protected pages with sidebar layout

### Key Routes
| Route | Description |
|-------|-------------|
| `/` | Dashboard with stats and recent activity |
| `/requerimientos` | List view (table/cards toggle) |
| `/requerimientos/nuevo` | Create new requirement form |
| `/requerimientos/[id]` | Requirement detail with timeline |
| `/aprobaciones` | Approval inbox by category |
| `/usuarios` | User management (admin only) |
| `/configuracion` | User settings |

### Component Organization
- `components/ui/` - Shadcn UI primitives (do not modify directly)
- `components/layout/` - App shell (sidebar, header, user-nav)
- `components/theme/` - Dark/light mode (next-themes)
- `components/requerimientos/` - Domain components (forms, tables, cards, timeline)
- `components/dashboard/` - Stats and activity widgets

### Data Layer
- `prisma/schema.prisma` - Database schema
- `src/lib/prisma.ts` - Prisma client singleton
- `src/types/index.ts` - Re-exports Prisma types + display config (`STATUS_CONFIG`, `ROLE_LABELS`)
- `src/lib/mock-data.ts` - Mock data (for UI development only)

## Domain Model

### User Roles (with access control)
- `ADMIN`, `ADMINISTRACION` - Can manage users via `/usuarios`
- `SEGURIDAD`, `GERENCIA` - Approval workflow
- `LOGISTICA` - Stock/purchase decisions
- `TECNICO`, `RECEPTOR` - Create and receive requirements

### Requirement Status Flow
```
BORRADOR → CREADO → VALIDACION_SEGURIDAD → APROBADO_SEGURIDAD → VALIDACION_GERENCIA
→ APROBADO_GERENCIA → REVISION_LOGISTICA → EN_COMPRA → APROBADO_ADM
→ LISTO_DESPACHO → ENVIADO → ENTREGADO_PARCIAL → ENTREGADO
```
Rejection states: `RECHAZADO_SEGURIDAD`, `RECHAZADO_GERENCIA`, `RECHAZADO_ADM`

### Item Categories
`EPP` | `EQUIPO` | `MATERIAL` | `HERRAMIENTA` | `ACCESORIO`

### Partial Deliveries
- Requirements can be delivered in multiple `Lote` (batches)
- Each `Lote` has its own status and items (`LoteItem`)
- Stock marking: `enStock`, `requiereCompra`, `motivoStock` per item

## Styling

- Blue corporate theme with dark mode support
- Status colors defined in `STATUS_CONFIG` (types/index.ts)
- Use existing Tailwind classes; theme variables in `globals.css`
- Icons: lucide-react

## Database Setup

1. Configure PostgreSQL connection in `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/requerimientos_db"
   ```

2. Run migrations and seed:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

3. Test users (password: `password123`):
   - admin@empresa.com (Admin)
   - tecnico@empresa.com (Técnico)
   - seguridad@empresa.com (Seguridad)
   - gerencia@empresa.com (Gerencia)
   - logistica@empresa.com (Logística)

## Project Plan

See `/docs/PLAN-UI.md` for UI implementation phases.
See `/docs/MODELO-DATOS.md` for complete data model documentation.

## Rules

- Al momento de crear datos nuevos no uses modales, usa paginas dedicadas para los formularios
- No uses server actions, usar Route handlers
- Para manejo de estado global usar Zustand
- Para formularios usar react-hook-form y zod
