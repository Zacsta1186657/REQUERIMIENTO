# Plan: Sistema Web de Gestión de Requerimientos de Almacén - UI

## Resumen
Crear la interfaz de usuario para un sistema de gestión de requerimientos de almacén que reemplace el uso de Excel. Stack: Next.js 14 (App Router), Shadcn UI, TailwindCSS. **Solo UI, sin lógica de backend.**

---

## 2. Páginas a Crear

### 2.1 Autenticación

#### `/login` - Página de Login
- Logo del sistema
- Formulario con email y contraseña
- Botón "Iniciar Sesión"
- Link a "Registrarse"
- Diseño centrado, fondo con gradiente sutil

#### `/register` - Página de Registro
- Logo del sistema
- Formulario: nombre, email, contraseña, confirmar contraseña
- Selector de rol (para demo)
- Botón "Crear Cuenta"
- Link a "Iniciar Sesión"

### 2.2 Dashboard Principal

#### `/` - Dashboard
Inspirado en la imagen de referencia (Task.Co):
- **Header**: Saludo con nombre de usuario, fecha actual, botones de configuración
- **Stats Cards**:
  - Total requerimientos
  - Pendientes de aprobación
  - En proceso
  - Completados este mes
- **Actividad Reciente**: Lista de últimos movimientos
- **Acceso Rápido**: Botón "Nuevo Requerimiento"

### 2.3 Requerimientos

#### `/requerimientos` - Lista de Requerimientos
Similar a la vista de Task.Co:
- **Toggle de vista**: Botones para alternar entre Tabla y Tarjetas
- **Filtros superiores**: Estado, fecha, búsqueda
- **Vista Tabla** con columnas:
  - N° de Requerimiento
  - Fecha
  - Solicitante
  - Operación
  - Estado (badge de color)
  - Items (cantidad)
  - Acciones
- **Vista Tarjetas (Cards)**:
  - Grid responsivo de cards
  - Cada card muestra: N°, Estado, Solicitante, Fecha, Resumen de items
  - Hover effect para mostrar acciones
- **Agrupación por estado**: Creado, En Proceso, Completado
- **Botón**: "+ Nuevo Requerimiento"

#### `/requerimientos/nuevo` - Crear Requerimiento
Basado en el formato Excel:
- **Sección Cabecera**:
  - Fecha (automática, solo lectura)
  - Solicitante (automático, solo lectura)
  - Operación (select)
  - Centro de Costo (select)
  - Motivo (textarea)
  - Comentarios (textarea)

- **Sección Items** (tabla editable):
  - N° Parte
  - Categoría (EPP, Equipo, Material, Herramienta, Accesorio)
  - Descripción
  - Marca
  - Modelo
  - Cantidad
  - Unidad de Medida
  - Serial (opcional)
  - Botón eliminar fila
  - Botón "+ Agregar Item"

- **Acciones**:
  - Guardar Borrador
  - Enviar Requerimiento

#### `/requerimientos/[id]` - Detalle de Requerimiento
- **Cabecera** con información general
- **Timeline/Historial** de estados
- **Tabla de items** (solo lectura o editable según rol/estado)
- **Sección de comentarios/observaciones**
- **Acciones según rol**:
  - Técnico: Ver estado
  - Seguridad: Aprobar/Rechazar, Modificar cantidades
  - Gerencia: Aprobar/Rechazar
  - Logística: Marcar stock/compra
  - Administración: Aprobar compra

### 2.4 Aprobaciones

#### `/aprobaciones` - Bandeja de Aprobaciones
- Lista de requerimientos pendientes de acción del usuario actual
- Filtros por tipo de aprobación
- Acciones rápidas desde la lista

---

## 3. Componentes Clave

### 3.1 Layout Components
- **Sidebar**: Navegación lateral con iconos (Dashboard, Requerimientos, Aprobaciones, Configuración)
- **Header**: Búsqueda, notificaciones, menú de usuario
- **UserNav**: Dropdown con perfil, configuración, cerrar sesión

### 3.2 Requerimiento Components
- **StatusBadge**: Badge de colores según estado
  - Creado: Gris
  - Validación Seguridad: Amarillo
  - Validación Gerencia: Naranja
  - En Logística: Azul
  - En Compra: Púrpura
  - Despachado: Cyan
  - Entregado: Verde
  - Rechazado: Rojo

- **ViewToggle**: Toggle para cambiar entre vista tabla y cards
- **RequerimientoTable**: Tabla con DataTable de Shadcn
- **RequerimientoCard**: Card individual para vista de tarjetas
- **RequerimientoGrid**: Grid de cards responsivo
- **ItemForm**: Formulario inline para agregar/editar items
- **Timeline**: Componente de historial visual

### 3.3 Theme Components
- **ThemeToggle**: Botón para alternar modo claro/oscuro
- **ThemeProvider**: Provider de next-themes

---

## 4. Componentes Shadcn a Instalar

```bash
npx shadcn@latest add button card input label select textarea
npx shadcn@latest add table tabs badge avatar dropdown-menu
npx shadcn@latest add dialog sheet separator scroll-area
npx shadcn@latest add form toast sonner calendar popover
npx shadcn@latest add sidebar breadcrumb toggle-group tooltip
```

### Dependencias adicionales
```bash
npm install next-themes lucide-react @hookform/resolvers zod react-hook-form
```

- **next-themes**: Para el toggle de modo oscuro/claro
- **lucide-react**: Iconos consistentes
- **zod + react-hook-form**: Validación de formularios (UI only)

---

## 5. Tipos TypeScript

```typescript
// types/index.ts
type UserRole =
  | 'TECNICO'
  | 'SEGURIDAD'
  | 'GERENCIA'
  | 'LOGISTICA'
  | 'ADMINISTRACION'
  | 'RECEPTOR'
  | 'ADMIN';

type RequerimientoStatus =
  | 'CREADO'
  | 'VALIDACION_SEGURIDAD'
  | 'APROBADO_SEGURIDAD'
  | 'RECHAZADO_SEGURIDAD'
  | 'VALIDACION_GERENCIA'
  | 'APROBADO_GERENCIA'
  | 'RECHAZADO_GERENCIA'
  | 'REVISION_LOGISTICA'
  | 'EN_COMPRA'
  | 'APROBADO_ADM'
  | 'RECHAZADO_ADM'
  | 'LISTO_DESPACHO'
  | 'ENVIADO'
  | 'ENTREGADO';

type ItemCategoria = 'EPP' | 'EQUIPO' | 'MATERIAL' | 'HERRAMIENTA' | 'ACCESORIO';

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
}

interface RequerimientoItem {
  id: string;
  numeroParte?: string;
  categoria: ItemCategoria;
  descripcion: string;
  marca?: string;
  modelo?: string;
  cantidad: number;
  unidadMedida: string;
  serial?: string;
}

interface Requerimiento {
  id: string;
  numero: string;
  fecha: Date;
  solicitante: User;
  operacion: string;
  centroCosto: string;
  motivo: string;
  comentarios?: string;
  estado: RequerimientoStatus;
  items: RequerimientoItem[];
}
```

---

## 6. Pasos de Implementación (Solo UI)

### Fase 1: Setup Inicial
1. Crear proyecto Next.js 14 con App Router
2. Instalar y configurar Shadcn UI (tema azul)
3. Configurar TailwindCSS con dark mode
4. Instalar next-themes y configurar ThemeProvider
5. Crear estructura de carpetas

### Fase 2: Layout y Navegación
6. Crear ThemeProvider y ThemeToggle
7. Crear componente Sidebar (responsive, con dark mode)
8. Crear componente Header (con ThemeToggle)
9. Crear componente UserNav
10. Crear layout del dashboard

### Fase 3: Autenticación (UI)
11. Crear página de Login con formulario
12. Crear página de Register con formulario
13. Estilizar formularios con soporte dark mode

### Fase 4: Dashboard
14. Crear página principal con stats cards
15. Crear componente de actividad reciente

### Fase 5: Requerimientos
16. Crear componente StatusBadge
17. Crear componente ViewToggle (tabla/cards)
18. Crear componente RequerimientoTable
19. Crear componente RequerimientoCard
20. Crear componente RequerimientoGrid
21. Crear página de lista con ambas vistas
22. Crear página de nuevo requerimiento
23. Crear formulario de cabecera
24. Crear formulario de items (tabla editable)
25. Crear componente Timeline
26. Crear página de detalle de requerimiento

### Fase 6: Aprobaciones
27. Crear página de bandeja de aprobaciones

---

## 7. Paleta de Colores

Estilo **azul corporativo** profesional:
- **Primary**: Azul (#2563EB / blue-600)
- **Primary Dark**: Azul oscuro (#1D4ED8 / blue-700)
- **Sidebar**: Slate oscuro (#0F172A / slate-900)
- **Background Light**: Gris claro (#F8FAFC / slate-50)
- **Background Dark**: Slate (#0F172A / slate-900)
- **Estados**:
  - Creado: #6B7280 (gris)
  - En validación: #F59E0B (amarillo/ámbar)
  - Aprobado: #10B981 (verde)
  - Rechazado: #EF4444 (rojo)
  - En proceso: #3B82F6 (azul)
  - Completado: #22C55E (verde brillante)

### Modo Oscuro
- Implementar con `next-themes`
- Toggle en el header
- Variables CSS con Tailwind dark mode

---

## 8. Datos Mock para UI

Crear datos de ejemplo para visualizar la UI funcionando:
- 3-5 usuarios de ejemplo
- 10-15 requerimientos en diferentes estados
- Items variados por requerimiento

---

## 9. Verificación

Para probar la UI:
1. Ejecutar `npm run dev`
2. Navegar a `/login` - verificar formulario
3. Navegar a `/register` - verificar formulario
4. Navegar a `/` (dashboard) - verificar layout y stats
5. Navegar a `/requerimientos` - verificar tabla con datos mock
6. Navegar a `/requerimientos/nuevo` - verificar formulario completo
7. Verificar responsividad en móvil
8. Verificar que los componentes Shadcn se rendericen correctamente

---

## Notas Importantes

- **No incluir lógica de backend** - Solo estructura UI
- Usar datos mock hardcodeados para visualización
- Los formularios deben tener validación visual (Zod + React Hook Form) pero sin enviar datos
- Preparar la estructura para fácil integración con Prisma/PostgreSQL después
