# Modelo de Datos - Sistema de Gestión de Requerimientos

## Resumen de Decisiones

| Aspecto | Decisión |
|---------|----------|
| Autenticación | Propia (email/password) |
| Stock | Marcado manual con motivo |
| Entregas Parciales | Sí, por lotes con estado individual |
| Orden de Compra | Solo estado "en compra" + fecha estimada |
| Catálogos | Operaciones, CC, Categorías, Unidades, Productos |
| Notificaciones | Solo en app (campanita) |
| Reportes | Completos con exportación |
| Firma Digital | Solo checkbox |

---

## Diagrama de Entidades

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │  Operacion  │       │ CentroCosto │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ email       │       │ nombre      │       │ nombre      │
│ password    │       │ codigo      │       │ codigo      │
│ nombre      │       │ activo      │       │ activo      │
│ rol         │       └─────────────┘       └─────────────┘
│ activo      │
│ avatar      │       ┌─────────────┐       ┌─────────────┐
└─────────────┘       │  Categoria  │       │UnidadMedida │
       │              ├─────────────┤       ├─────────────┤
       │              │ id          │       │ id          │
       ▼              │ nombre      │       │ nombre      │
┌─────────────────┐   │ activo      │       │ abreviatura │
│  Requerimiento  │   └─────────────┘       │ activo      │
├─────────────────┤                         └─────────────┘
│ id              │   ┌─────────────┐
│ numero          │   │  Producto   │◄── Catálogo para autocompletar
│ fecha           │   ├─────────────┤
│ solicitanteId   │──►│ id          │
│ operacionId     │   │ numeroParte │
│ centroCostoId   │   │ categoriaId │
│ motivo          │   │ descripcion │
│ comentarios     │   │ marca       │
│ estado          │   │ modelo      │
│ createdAt       │   │ unidadId    │
│ updatedAt       │   │ activo      │
└─────────────────┘   └─────────────┘
       │
       │ 1:N
       ▼
┌──────────────────────┐
│  RequerimientoItem   │
├──────────────────────┤
│ id                   │
│ requerimientoId      │
│ productoId (opcional)│
│ numeroParte          │
│ categoriaId          │
│ descripcion          │
│ marca                │
│ modelo               │
│ cantidadSolicitada   │
│ cantidadAprobada     │
│ unidadMedidaId       │
│ serial               │
│ enStock              │
│ requiereCompra       │
│ motivoStock          │◄── Motivo de stock/compra
│ fechaEstimadaCompra  │◄── Si requiere compra
│ createdAt            │
│ updatedAt            │
└──────────────────────┘
       │
       │ 1:N
       ▼
┌──────────────────────┐
│       Lote           │◄── Para entregas parciales
├──────────────────────┤
│ id                   │
│ requerimientoId      │
│ numero               │ (Lote 1, Lote 2...)
│ estado               │ (PENDIENTE, DESPACHADO, ENTREGADO)
│ fechaDespacho        │
│ fechaEntrega         │
│ transportista        │
│ destino              │
│ receptorId           │
│ confirmadoRecepcion  │◄── Checkbox
│ observaciones        │
│ createdAt            │
│ updatedAt            │
└──────────────────────┘
       │
       │ 1:N
       ▼
┌──────────────────────┐
│      LoteItem        │◄── Items por lote
├──────────────────────┤
│ id                   │
│ loteId               │
│ requerimientoItemId  │
│ cantidadEnviada      │
└──────────────────────┘

┌──────────────────────┐
│   HistorialEstado    │◄── Auditoría de cambios de estado
├──────────────────────┤
│ id                   │
│ requerimientoId      │
│ estadoAnterior       │
│ estadoNuevo          │
│ usuarioId            │
│ comentario           │◄── Obligatorio en rechazos
│ createdAt            │
└──────────────────────┘

┌──────────────────────┐
│  ModificacionItem    │◄── Auditoría de cambios en items
├──────────────────────┤
│ id                   │
│ requerimientoItemId  │
│ campo                │ (cantidad, eliminado, etc.)
│ valorAnterior        │
│ valorNuevo           │
│ usuarioId            │
│ motivo               │
│ createdAt            │
└──────────────────────┘

┌──────────────────────┐
│    Notificacion      │
├──────────────────────┤
│ id                   │
│ usuarioId            │
│ tipo                 │
│ titulo               │
│ mensaje              │
│ requerimientoId      │
│ leida                │
│ createdAt            │
└──────────────────────┘
```

---

## Enums

```typescript
enum UserRole {
  TECNICO
  SEGURIDAD
  GERENCIA
  LOGISTICA
  ADMINISTRACION
  RECEPTOR
  ADMIN
}

enum RequerimientoStatus {
  BORRADOR
  CREADO
  VALIDACION_SEGURIDAD
  APROBADO_SEGURIDAD
  RECHAZADO_SEGURIDAD
  VALIDACION_GERENCIA
  APROBADO_GERENCIA
  RECHAZADO_GERENCIA
  REVISION_LOGISTICA
  EN_COMPRA
  APROBADO_ADM
  RECHAZADO_ADM
  LISTO_DESPACHO
  ENVIADO
  ENTREGADO_PARCIAL
  ENTREGADO
}

enum LoteStatus {
  PENDIENTE
  PREPARANDO
  DESPACHADO
  EN_TRANSITO
  ENTREGADO
}

enum NotificationType {
  REQUERIMIENTO_CREADO
  APROBACION_PENDIENTE
  ESTADO_CAMBIO
  RECHAZADO
  LISTO_DESPACHO
  ENTREGADO
}
```

---

## Tablas Detalladas

### User
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (UUID) | Identificador único |
| email | String | Email único para login |
| password | String | Hash de contraseña |
| nombre | String | Nombre completo |
| rol | UserRole | Rol del usuario |
| activo | Boolean | Estado del usuario |
| avatar | String? | URL de imagen |
| createdAt | DateTime | Fecha creación |
| updatedAt | DateTime | Fecha actualización |

### Operacion
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (UUID) | Identificador único |
| nombre | String | Nombre de la operación |
| codigo | String | Código único |
| activo | Boolean | Activo/Inactivo |

### CentroCosto
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (UUID) | Identificador único |
| nombre | String | Nombre del CC |
| codigo | String | Código único (CC-001) |
| activo | Boolean | Activo/Inactivo |

### Categoria
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (UUID) | Identificador único |
| nombre | String | EPP, EQUIPO, MATERIAL, etc. |
| activo | Boolean | Activo/Inactivo |

### UnidadMedida
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (UUID) | Identificador único |
| nombre | String | Unidad, Par, Caja, etc. |
| abreviatura | String | UND, PAR, CJ, KG, M, etc. |
| activo | Boolean | Activo/Inactivo |

### Producto (Catálogo)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (UUID) | Identificador único |
| numeroParte | String? | Número de parte |
| categoriaId | String | FK a Categoria |
| descripcion | String | Descripción del producto |
| marca | String? | Marca |
| modelo | String? | Modelo |
| unidadMedidaId | String | FK a UnidadMedida |
| activo | Boolean | Activo/Inactivo |

### Requerimiento
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (UUID) | Identificador único |
| numero | String | REQ-2024-0001 (autogenerado) |
| fecha | DateTime | Fecha de creación |
| solicitanteId | String | FK a User |
| operacionId | String | FK a Operacion |
| centroCostoId | String | FK a CentroCosto |
| motivo | String | Motivo del requerimiento |
| comentarios | String? | Comentarios adicionales |
| estado | RequerimientoStatus | Estado actual |
| createdAt | DateTime | Fecha creación |
| updatedAt | DateTime | Fecha actualización |

### RequerimientoItem
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (UUID) | Identificador único |
| requerimientoId | String | FK a Requerimiento |
| productoId | String? | FK a Producto (opcional) |
| numeroParte | String? | Número de parte |
| categoriaId | String | FK a Categoria |
| descripcion | String | Descripción |
| marca | String? | Marca |
| modelo | String? | Modelo |
| cantidadSolicitada | Int | Cantidad original |
| cantidadAprobada | Int? | Cantidad tras aprobaciones |
| unidadMedidaId | String | FK a UnidadMedida |
| serial | String? | Serial si aplica |
| enStock | Boolean? | Marcado por Logística |
| requiereCompra | Boolean? | Marcado por Logística |
| motivoStock | String? | Motivo del marcado |
| fechaEstimadaCompra | DateTime? | Si requiere compra |
| eliminado | Boolean | Soft delete |
| createdAt | DateTime | Fecha creación |
| updatedAt | DateTime | Fecha actualización |

### Lote (Entregas Parciales)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (UUID) | Identificador único |
| requerimientoId | String | FK a Requerimiento |
| numero | Int | Número de lote (1, 2, 3...) |
| estado | LoteStatus | Estado del lote |
| fechaDespacho | DateTime? | Fecha de envío |
| fechaEntrega | DateTime? | Fecha de entrega |
| transportista | String? | Quien transporta |
| destino | String? | Lugar de entrega |
| receptorId | String? | FK a User que recibe |
| confirmadoRecepcion | Boolean | Checkbox confirmación |
| observaciones | String? | Notas |
| createdAt | DateTime | Fecha creación |
| updatedAt | DateTime | Fecha actualización |

### LoteItem
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (UUID) | Identificador único |
| loteId | String | FK a Lote |
| requerimientoItemId | String | FK a RequerimientoItem |
| cantidadEnviada | Int | Cantidad en este lote |

### HistorialEstado
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (UUID) | Identificador único |
| requerimientoId | String | FK a Requerimiento |
| estadoAnterior | RequerimientoStatus? | Estado previo |
| estadoNuevo | RequerimientoStatus | Nuevo estado |
| usuarioId | String | FK a User que hizo el cambio |
| comentario | String? | Obligatorio en rechazos |
| createdAt | DateTime | Fecha del cambio |

### ModificacionItem
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (UUID) | Identificador único |
| requerimientoItemId | String | FK a RequerimientoItem |
| campo | String | Campo modificado |
| valorAnterior | String | Valor anterior |
| valorNuevo | String | Valor nuevo |
| usuarioId | String | FK a User |
| motivo | String? | Razón del cambio |
| createdAt | DateTime | Fecha del cambio |

### Notificacion
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (UUID) | Identificador único |
| usuarioId | String | FK a User destinatario |
| tipo | NotificationType | Tipo de notificación |
| titulo | String | Título corto |
| mensaje | String | Mensaje completo |
| requerimientoId | String? | FK a Requerimiento |
| leida | Boolean | Si fue leída |
| createdAt | DateTime | Fecha creación |

---

## Índices Recomendados

```sql
-- Búsquedas frecuentes
CREATE INDEX idx_requerimiento_estado ON Requerimiento(estado);
CREATE INDEX idx_requerimiento_solicitante ON Requerimiento(solicitanteId);
CREATE INDEX idx_requerimiento_fecha ON Requerimiento(fecha);
CREATE INDEX idx_requerimiento_numero ON Requerimiento(numero);

-- Notificaciones no leídas
CREATE INDEX idx_notificacion_usuario_leida ON Notificacion(usuarioId, leida);

-- Historial
CREATE INDEX idx_historial_requerimiento ON HistorialEstado(requerimientoId);

-- Items por requerimiento
CREATE INDEX idx_item_requerimiento ON RequerimientoItem(requerimientoId);
```

---

## Flujo de Estados

```
BORRADOR ──────► CREADO ──────► VALIDACION_SEGURIDAD
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
           RECHAZADO_SEGURIDAD              APROBADO_SEGURIDAD
                                                    │
                                                    ▼
                                          VALIDACION_GERENCIA
                                                    │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
           RECHAZADO_GERENCIA               APROBADO_GERENCIA
                                                    │
                                                    ▼
                                          REVISION_LOGISTICA
                                                    │
                              ┌────────────────────┴────────────────────┐
                              ▼                                         ▼
                    (items en stock)                          (items requieren compra)
                              │                                         │
                              │                                         ▼
                              │                                     EN_COMPRA
                              │                                         │
                              │                    ┌────────────────────┴────────────────────┐
                              │                    ▼                                         ▼
                              │           RECHAZADO_ADM                            APROBADO_ADM
                              │                                                             │
                              └─────────────────────────────┬───────────────────────────────┘
                                                            ▼
                                                    LISTO_DESPACHO
                                                            │
                                                            ▼
                                                        ENVIADO
                                                            │
                              ┌─────────────────────────────┴─────────────────────────────┐
                              ▼                                                           ▼
                      ENTREGADO_PARCIAL ──────────────────────────────────────────► ENTREGADO
```

---

## Próximos Pasos

1. Crear schema de Prisma
2. Configurar base de datos PostgreSQL
3. Generar migraciones
4. Crear seeders con datos iniciales
