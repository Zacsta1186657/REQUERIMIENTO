# Plan de Implementación: Módulos de Gestión de Catálogos para LOGÍSTICA

## Objetivo
Implementar módulos de gestión de Categorías, Marcas, Modelos y Productos para el rol LOGÍSTICA, permitiendo que al crear requerimientos, los campos se autocompleten al seleccionar un producto del catálogo.

## Estado Actual
- **Producto** tiene marca/modelo como strings simples (NO relaciones)
- **NO existen** modelos Marca y Modelo en Prisma
- **APIs** solo tienen endpoints GET (sin CRUD)
- **NO hay** páginas de gestión de catálogos
- **item-form.tsx** usa inputs de texto libre para marca/modelo

## Decisión Arquitectónica

**Crear modelos `Marca` y `Modelo` separados con relaciones**

Justificación:
- Integridad referencial y consistencia de datos
- Autocompletado robusto con búsquedas eficientes
- Escalabilidad para atributos futuros
- Alineación con requisitos de selects en lugar de inputs libres

---

## Fases de Implementación

### FASE 1: BASE DE DATOS (Prisma)

#### 1.1 Modificar schema.prisma
**Archivo:** `prisma/schema.prisma`

Agregar después de `UnidadMedida` (línea ~148):

```prisma
model Marca {
  id          String     @id @default(cuid())
  nombre      String     @unique
  activo      Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  modelos     Modelo[]
  productos   Producto[]

  @@map("marcas")
}

model Modelo {
  id          String     @id @default(cuid())
  nombre      String
  marcaId     String
  marca       Marca      @relation(fields: [marcaId], references: [id])
  activo      Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  productos   Producto[]

  @@unique([marcaId, nombre])
  @@map("modelos")
}
```

Modificar modelo `Producto` (líneas 150-167):

```prisma
model Producto {
  id          String  @id @default(cuid())
  numeroParte String? @unique
  descripcion String
  activo      Boolean @default(true)

  // Relaciones
  categoriaId    String
  categoria      Categoria    @relation(fields: [categoriaId], references: [id])
  marcaId        String
  marca          Marca        @relation(fields: [marcaId], references: [id])
  modeloId       String
  modelo         Modelo       @relation(fields: [modeloId], references: [id])
  unidadMedidaId String
  unidadMedida   UnidadMedida @relation(fields: [unidadMedidaId], references: [id])

  requerimientoItems RequerimientoItem[]

  @@map("productos")
}
```

**NOTA:** Eliminar campos `marca String?` y `modelo String?` del modelo Producto original.

#### 1.2 Generar migración
```bash
npm run db:generate
npx prisma migrate dev --name add_marca_modelo_catalogs
```

#### 1.3 Actualizar seed (prisma/seed.ts)
Agregar datos iniciales de marcas y modelos:

```typescript
// Marcas
const marcas = await prisma.marca.createMany({
  data: [
    { nombre: '3M' },
    { nombre: 'Bosch' },
    { nombre: 'Stanley' },
    { nombre: 'Milwaukee' },
    { nombre: 'Truper' },
    { nombre: 'Ansell' },
  ]
});

// Modelos por marca
const marca3M = await prisma.marca.findUnique({ where: { nombre: '3M' } });
const marcaBosch = await prisma.marca.findUnique({ where: { nombre: 'Bosch' } });

await prisma.modelo.createMany({
  data: [
    { nombre: 'H-700', marcaId: marca3M!.id },
    { nombre: 'GBH 2-28 F', marcaId: marcaBosch!.id },
    { nombre: 'GSB 13 RE', marcaId: marcaBosch!.id },
  ]
});
```

Actualizar productos existentes en el seed para usar relaciones.

---

### FASE 2: VALIDACIONES ZOD

Crear nuevos archivos de validación:

#### 2.1 src/lib/validations/marca.ts (NUEVO)
```typescript
import { z } from 'zod';

export const createMarcaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100).trim(),
  activo: z.boolean().optional().default(true),
});

export const updateMarcaSchema = createMarcaSchema.partial();
```

#### 2.2 src/lib/validations/modelo.ts (NUEVO)
```typescript
import { z } from 'zod';

export const createModeloSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100).trim(),
  marcaId: z.string().min(1, 'La marca es requerida'),
  activo: z.boolean().optional().default(true),
});

export const updateModeloSchema = createModeloSchema.partial();
```

#### 2.3 src/lib/validations/producto.ts (NUEVO)
```typescript
import { z } from 'zod';

export const createProductoSchema = z.object({
  numeroParte: z.string().optional().nullable(),
  descripcion: z.string().min(1, 'La descripción es requerida').max(500).trim(),
  categoriaId: z.string().min(1, 'La categoría es requerida'),
  marcaId: z.string().min(1, 'La marca es requerida'),
  modeloId: z.string().min(1, 'El modelo es requerido'),
  unidadMedidaId: z.string().min(1, 'La unidad de medida es requerida'),
  activo: z.boolean().optional().default(true),
});

export const updateProductoSchema = createProductoSchema.partial();
```

#### 2.4 src/lib/validations/categoria.ts (NUEVO)
Similar estructura a marca.ts

---

### FASE 3: APIs - ROUTE HANDLERS

#### 3.1 Agregar middleware withLogisticaAuth
**Archivo:** `src/lib/api-utils.ts`

Agregar después de `withAdminAuth` (~línea 60):

```typescript
export async function withLogisticaAuth(
  handler: (user: AuthUser) => Promise<NextResponse<any>>
): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();

  if (user.rol !== 'LOGISTICA' && user.rol !== 'ADMIN' && user.rol !== 'ADMINISTRACION') {
    return forbiddenResponse('Solo LOGISTICA y ADMIN pueden gestionar catálogos');
  }

  return handler(user);
}
```

#### 3.2 API Marcas
Crear archivos:
- `src/app/api/catalogos/marcas/route.ts` - GET (lista), POST (crear)
- `src/app/api/catalogos/marcas/[id]/route.ts` - GET, PUT, DELETE

**Lógica de eliminación:**
- Si tiene productos/modelos asociados → solo desactivar (`activo: false`)
- Si no tiene dependencias → eliminar físicamente

#### 3.3 API Modelos
Crear archivos:
- `src/app/api/catalogos/modelos/route.ts` - GET con filtro `?marcaId=`, POST
- `src/app/api/catalogos/modelos/[id]/route.ts` - GET, PUT, DELETE

**Validaciones:**
- Verificar que `marcaId` exista al crear/actualizar
- Constraint único: `marcaId + nombre`

#### 3.4 API Productos
**Modificar:** `src/app/api/catalogos/productos/route.ts`
- Actualizar GET para incluir relaciones (`marca`, `modelo`)
- Agregar POST para crear productos

**Crear:** `src/app/api/catalogos/productos/[id]/route.ts`
- GET, PUT, DELETE con validaciones

#### 3.5 API Categorías
**Modificar:** `src/app/api/catalogos/categorias/route.ts` - agregar POST
**Crear:** `src/app/api/catalogos/categorias/[id]/route.ts` - PUT, DELETE

---

### FASE 4: ZUSTAND STORE

#### 4.1 Extender catalogos-store.ts
**Archivo:** `src/stores/catalogos-store.ts`

Agregar interfaces:
```typescript
export interface Marca {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface Modelo {
  id: string;
  nombre: string;
  marcaId: string;
  marca: Marca;
  activo: boolean;
}
```

Modificar interface `Producto` para incluir relaciones:
```typescript
marcaId: string;
marca: Marca;
modeloId: string;
modelo: Modelo;
```

Agregar estado y métodos:
```typescript
marcas: Marca[];
modelos: Modelo[];
productos: Producto[];

fetchMarcas: () => Promise<void>;
fetchModelos: (marcaId?: string) => Promise<void>;
fetchProductos: () => Promise<void>;
```

Exportar hooks selectores:
```typescript
export const useMarcas = () => useCatalogosStore((state) => state.marcas);
export const useModelos = () => useCatalogosStore((state) => state.modelos);
export const useProductos = () => useCatalogosStore((state) => state.productos);
```

---

### FASE 5: COMPONENTES UI

Crear en `src/components/catalogos/` (NUEVOS):

#### 5.1 Tablas
- `marcas-table.tsx` - Lista con búsqueda, botón "Nueva Marca", acciones editar/eliminar
- `modelos-table.tsx` - Lista con filtro por marca, acciones CRUD
- `categorias-table.tsx` - Lista de categorías, acciones CRUD
- `productos-table.tsx` - Lista con filtros (categoría, marca), acciones CRUD

**Patrón común:**
- Input de búsqueda
- Botón "Nuevo X" (link a página de creación)
- Table con columnas: nombre, estado (badge), contador relaciones, acciones
- AlertDialog para confirmar eliminación

#### 5.2 Formularios
- `marca-form.tsx` - React Hook Form + Zod, campos: nombre, activo (switch)
- `modelo-form.tsx` - Campos: nombre, select marca, activo
- `categoria-form.tsx` - Campos: nombre, activo
- `producto-form.tsx` - Campos completos:
  - Select Categoría
  - Select Marca (al cambiar, cargar modelos filtrados)
  - Select Modelo (filtrado por marca seleccionada)
  - Input Nº Parte (opcional)
  - Input Descripción
  - Select Unidad Medida
  - Switch Activo

**Características:**
- Validación con Zod schemas
- Manejo de errores (Alert)
- Estado de carga (disabled + spinner)
- Botones: Cancelar (volver a /catalogos), Guardar

---

### FASE 6: PÁGINAS

Crear en `src/app/(dashboard)/catalogos/`:

#### 6.1 Layout con permisos
**Archivo:** `catalogos/layout.tsx` (NUEVO)
```typescript
// Verificar rol LOGISTICA o ADMIN, sino redirigir a "/"
```

#### 6.2 Página principal con tabs
**Archivo:** `catalogos/page.tsx` (NUEVO)

Usar componente `<Tabs>` con 4 tabs:
1. **Productos** (default) - `<ProductosTable />`
2. **Marcas** - `<MarcasTable />`
3. **Modelos** - `<ModelosTable />`
4. **Categorías** - `<CategoriasTable />`

#### 6.3 Páginas de creación/edición
Crear estructura:
```
catalogos/
  ├── marcas/
  │   ├── nueva/page.tsx
  │   └── [id]/editar/page.tsx
  ├── modelos/
  │   ├── nuevo/page.tsx
  │   └── [id]/editar/page.tsx
  ├── categorias/
  │   ├── nueva/page.tsx
  │   └── [id]/editar/page.tsx
  └── productos/
      ├── nuevo/page.tsx
      └── [id]/editar/page.tsx
```

Cada página:
- Header con botón volver (ChevronLeft)
- Card con formulario correspondiente
- Pasar `id` al componente form para modo edición

---

### FASE 7: INTEGRACIÓN - AUTOCOMPLETADO EN REQUERIMIENTOS

#### 7.1 Modificar item-form.tsx
**Archivo:** `src/components/requerimientos/item-form.tsx`

**Cambios clave:**

1. **Cargar productos del catálogo:**
```typescript
const [productos, setProductos] = useState<Producto[]>([]);
const [selectedProductoId, setSelectedProductoId] = useState<string>('');

useEffect(() => {
  fetch('/api/catalogos/productos?limit=1000')
    .then(res => res.json())
    .then(data => setProductos(data.data || []));
}, []);
```

2. **Reemplazar inputs libres con Select de Producto:**
```typescript
<Select
  value={selectedProductoId}
  onValueChange={handleProductoChange}
>
  <SelectTrigger>
    <SelectValue placeholder="Seleccionar producto..." />
  </SelectTrigger>
  <SelectContent>
    {productos.map((prod) => (
      <SelectItem key={prod.id} value={prod.id}>
        {prod.descripcion} - {prod.marca.nombre} {prod.modelo.nombre}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

3. **Handler de autocompletado:**
```typescript
const handleProductoChange = (productoId: string) => {
  const producto = productos.find((p) => p.id === productoId);

  if (producto) {
    setNewItem({
      ...newItem,
      numeroParte: producto.numeroParte || '',
      categoriaId: producto.categoriaId,
      descripcion: producto.descripcion,
      unidadMedidaId: producto.unidadMedidaId,
      productoId: producto.id, // Guardar referencia
    });

    // Opcional: También guardar marca/modelo como strings
    // (si aún existen esos campos en RequerimientoItem)
  }
};
```

4. **Bloquear campos autocompletados:**
```typescript
<Input
  value={newItem.numeroParte || ""}
  disabled  // Campo bloqueado
  className="h-8 bg-muted"
/>
```

**Flujo UX:**
1. Usuario selecciona "Descripción" de producto del select
2. Campos se completan automáticamente: Nº Parte, Categoría, Marca, Modelo, Unidad
3. Usuario solo ingresa: Cantidad Solicitada, Serial (si aplica)

---

### FASE 8: NAVEGACIÓN

#### 8.1 Agregar enlace al sidebar
**Archivo:** `src/components/layout/app-sidebar.tsx`

Agregar en array `menuItems` (después de Aprobaciones, línea ~54):

```typescript
{
  title: "Catálogos",
  url: "/catalogos",
  icon: Package,
  adminOnly: false,
  excludeRoles: ["TECNICO", "RECEPTOR", "SEGURIDAD", "GERENCIA"] as UserRole[],
},
```

**Lógica:** Solo LOGISTICA, ADMINISTRACION y ADMIN ven este menú.

---

## Archivos Críticos

### Base de Datos
- `prisma/schema.prisma` - Agregar modelos Marca, Modelo; modificar Producto
- `prisma/seed.ts` - Datos iniciales de marcas/modelos

### Validaciones
- `src/lib/validations/marca.ts` (NUEVO)
- `src/lib/validations/modelo.ts` (NUEVO)
- `src/lib/validations/producto.ts` (NUEVO)
- `src/lib/validations/categoria.ts` (NUEVO)

### APIs
- `src/lib/api-utils.ts` - Agregar `withLogisticaAuth`
- `src/app/api/catalogos/marcas/route.ts` (NUEVO)
- `src/app/api/catalogos/marcas/[id]/route.ts` (NUEVO)
- `src/app/api/catalogos/modelos/route.ts` (NUEVO)
- `src/app/api/catalogos/modelos/[id]/route.ts` (NUEVO)
- `src/app/api/catalogos/productos/route.ts` (MODIFICAR)
- `src/app/api/catalogos/productos/[id]/route.ts` (NUEVO)
- `src/app/api/catalogos/categorias/route.ts` (MODIFICAR)
- `src/app/api/catalogos/categorias/[id]/route.ts` (NUEVO)

### Store
- `src/stores/catalogos-store.ts` - Extender con marcas, modelos, productos

### Componentes
- `src/components/catalogos/marcas-table.tsx` (NUEVO)
- `src/components/catalogos/marca-form.tsx` (NUEVO)
- `src/components/catalogos/modelos-table.tsx` (NUEVO)
- `src/components/catalogos/modelo-form.tsx` (NUEVO)
- `src/components/catalogos/categorias-table.tsx` (NUEVO)
- `src/components/catalogos/categoria-form.tsx` (NUEVO)
- `src/components/catalogos/productos-table.tsx` (NUEVO)
- `src/components/catalogos/producto-form.tsx` (NUEVO)

### Páginas
- `src/app/(dashboard)/catalogos/layout.tsx` (NUEVO)
- `src/app/(dashboard)/catalogos/page.tsx` (NUEVO)
- `src/app/(dashboard)/catalogos/marcas/nueva/page.tsx` (NUEVO)
- `src/app/(dashboard)/catalogos/marcas/[id]/editar/page.tsx` (NUEVO)
- (Similar para modelos, categorias, productos)

### Integración
- `src/components/requerimientos/item-form.tsx` (MODIFICAR)
- `src/components/layout/app-sidebar.tsx` (MODIFICAR)

---

## Orden de Implementación

**Secuencia recomendada:**

1. **FASE 1 (Base de datos)** → Ejecutar migraciones y seed
2. **FASE 2 (Validaciones)** → Crear todos los schemas Zod
3. **FASE 3 (APIs)** → Implementar CRUD completo
4. **FASE 4 (Store)** → Extender Zustand
5. **FASE 5 (Componentes)** → Crear tablas y formularios
6. **FASE 6 (Páginas)** → Crear rutas de gestión
7. **FASE 7 (Integración)** → Modificar item-form para autocompletado
8. **FASE 8 (Navegación)** → Agregar al sidebar

**Dependencias:**
- Fases 5 y 6 dependen de Fase 4 (store)
- Fase 7 depende de Fases 4, 5, 6 (necesita store y componentes)
- Todas las fases dependen de Fase 1 (base de datos)

---

## Verificación End-to-End

### 1. Testing de Catálogos
```bash
# Iniciar servidor
npm run dev
```

1. **Login** como usuario LOGISTICA
2. **Verificar sidebar** - debe aparecer "Catálogos"
3. **Acceder a /catalogos**
   - Ver tabs: Productos, Marcas, Modelos, Categorías

4. **Crear Marca:**
   - Click "Nueva Marca"
   - Ingresar nombre: "DeWalt"
   - Guardar → debe aparecer en tabla

5. **Crear Modelo:**
   - Click "Nuevo Modelo"
   - Seleccionar marca: "DeWalt"
   - Ingresar nombre: "DCD771C2"
   - Guardar → debe aparecer en tabla

6. **Crear Producto:**
   - Click "Nuevo Producto"
   - Categoría: "HERRAMIENTA"
   - Marca: "DeWalt"
   - Modelo: "DCD771C2"
   - Descripción: "Taladro Atornillador Inalámbrico"
   - Nº Parte: "DW-001" (opcional)
   - Unidad: "UND"
   - Guardar → debe aparecer en tabla

7. **Intentar eliminar marca con productos:**
   - Click eliminar en "DeWalt"
   - Debe desactivar, no eliminar
   - Verificar badge "Inactivo"

8. **Editar marca:**
   - Click editar en cualquier marca
   - Cambiar nombre
   - Guardar → debe actualizarse

### 2. Testing de Autocompletado en Requerimientos

1. **Login** como usuario TECNICO
2. **Ir a /requerimientos/nuevo**
3. **En sección de items:**
   - Click "Agregar Item"
   - En campo "Descripción", abrir select
   - Seleccionar: "Taladro Atornillador Inalámbrico - DeWalt DCD771C2"

4. **Verificar autocompletado:**
   - Nº Parte: "DW-001" (bloqueado, en gris)
   - Categoría: "HERRAMIENTA" (bloqueado)
   - Marca: "DeWalt" (bloqueado, si aún existe campo)
   - Modelo: "DCD771C2" (bloqueado, si aún existe campo)
   - Unidad: "UND" (bloqueado)

5. **Completar campos restantes:**
   - Cantidad: 5
   - Serial: "ABC123" (opcional)
   - Click "Agregar"

6. **Verificar item agregado** en tabla de items

### 3. Testing de Permisos

1. **Login como TECNICO**
   - NO debe ver "Catálogos" en sidebar
   - Si accede a `/catalogos` directamente → debe redirigir a `/`

2. **Login como ADMIN**
   - Debe ver "Catálogos" en sidebar
   - Debe poder crear/editar/eliminar todos los catálogos

### 4. Verificación de Base de Datos

```bash
npm run db:studio
```

1. **Verificar tablas:**
   - `marcas` - debe tener registros
   - `modelos` - debe tener registros con `marcaId`
   - `productos` - debe tener `marcaId` y `modeloId` (NO strings)

2. **Verificar relaciones:**
   - Un modelo debe estar asociado a una marca
   - Un producto debe tener marca y modelo relacionados

### 5. Testing de APIs (opcional con Postman/curl)

```bash
# GET Marcas
curl http://localhost:3000/api/catalogos/marcas

# POST Marca (requiere auth)
curl -X POST http://localhost:3000/api/catalogos/marcas \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Nueva Marca"}'

# GET Modelos filtrados por marca
curl http://localhost:3000/api/catalogos/modelos?marcaId=MARCA_ID

# GET Productos con búsqueda
curl http://localhost:3000/api/catalogos/productos?search=taladro
```

---

## Consideraciones Finales

### Permisos
- **LOGISTICA, ADMINISTRACION, ADMIN:** Full CRUD en catálogos
- **Otros roles:** Solo lectura (para selects en formularios)

### UX/UI
- **Consistencia:** Seguir patrones de `/usuarios` (tabla + páginas dedicadas)
- **No modales:** Páginas dedicadas para crear/editar (según CLAUDE.md)
- **Validaciones:** Frontend (React Hook Form + Zod) y Backend (APIs)
- **Feedback:** Toasts para confirmaciones/errores

### Datos Existentes
- Si ya existen productos con marca/modelo como strings, crear migración manual para convertir a relaciones
- Crear marca/modelo "Sin especificar" para productos sin datos

### Escalabilidad
- Paginación en APIs (ya implementada con `paginationParams`)
- Índices en BD (Prisma los crea automáticamente para `@unique`)
- Búsqueda case-insensitive en APIs

---

## Estimación de Complejidad

| Fase | Complejidad | Archivos Nuevos | Archivos Modificados |
|------|-------------|-----------------|----------------------|
| FASE 1 | Media | 0 | 2 (schema, seed) |
| FASE 2 | Baja | 4 | 0 |
| FASE 3 | Alta | 8 | 3 |
| FASE 4 | Media | 0 | 1 |
| FASE 5 | Alta | 8 | 0 |
| FASE 6 | Media | 13 | 0 |
| FASE 7 | Media | 0 | 1 |
| FASE 8 | Baja | 0 | 1 |
| **TOTAL** | **Alta** | **33** | **8** |

**Total de archivos a crear/modificar: 41**

---

## Resumen Ejecutivo

Esta implementación transforma el sistema de gestión de ítems de texto libre a un catálogo estructurado con:

✅ **4 módulos de gestión** (Categorías, Marcas, Modelos, Productos)
✅ **Autocompletado inteligente** al crear requerimientos
✅ **Control de permisos** por rol (LOGISTICA)
✅ **Integridad de datos** con relaciones en BD
✅ **UX mejorada** con validaciones y feedback

El resultado permite a LOGÍSTICA centralizar la administración de productos y a TÉCNICOS crear requerimientos más rápido y sin errores.
