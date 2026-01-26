# Sistema Web de Gestión de Requerimientos de Almacén

## 1. Objetivo del Documento
Este documento define **qué se debe hacer y cómo se debe hacer** en cada etapa del proceso de gestión de requerimientos, considerando que el flujo se implementa como una **aplicación web**. No incluye código ni decisiones técnicas; se enfoca en proceso, roles y pasos.

---

## 2. Objetivo del Sistema
- Reemplazar el uso de Excel como medio de gestión de requerimientos.
- Centralizar la información en una única plataforma web.
- Asegurar trazabilidad, control y validaciones en cada etapa.
- Definir claramente responsabilidades por rol.
- Permitir seguimiento del requerimiento desde su creación hasta la entrega final.

---

## 3. Roles del Sistema

| Rol | Responsabilidad principal |
|---|---|
| Técnico | Crear requerimientos y hacer seguimiento |
| Seguridad | Validar técnicamente los requerimientos |
| Gerencia General | Validación estratégica |
| Logística / Almacén | Verificar stock, comprar y despachar |
| Administración | Aprobar o rechazar compras |
| Receptor | Confirmar recepción física |
| Entregador | Confirmar entrega al usuario final |
| Administrador | Mantener catálogos y usuarios |

> Una misma persona puede tener más de un rol, pero el sistema debe registrar todas las acciones individualmente.

---

## 4. Flujo General del Requerimiento

```
CREADO
→ VALIDACIÓN SEGURIDAD
→ VALIDACIÓN GERENCIA
→ REVISIÓN LOGÍSTICA
→ APROBACIÓN ADMINISTRACIÓN (si hay compra)
→ COMPRA / STOCK
→ DESPACHO
→ ENTREGADO
```

Cada cambio de estado es controlado por el sistema y no puede omitirse.

---

## 5. Paso a Paso del Proceso

### 5.1 Creación del Requerimiento
**Rol:** Técnico

**Qué se hace:**
- El técnico ingresa al sistema.
- Selecciona la opción **Crear Requerimiento**.

**Información de cabecera:**
- Fecha (automática)
- Solicitante (automático)
- Operación
- Centro de costo
- Motivo del requerimiento
- Comentarios generales

**Ingreso de ítems:**
- Categoría (EPP, equipo, material, herramienta, accesorio)
- Número de parte (si aplica)
- Descripción
- Marca
- Modelo
- Cantidad
- Unidad de medida
- Serial (si aplica)

**Reglas:**
- No se puede enviar un requerimiento sin ítems.
- Cantidades deben ser mayores a cero.
- Al enviar, el requerimiento queda bloqueado para edición.

**Estado resultante:**
```
EN VALIDACIÓN SEGURIDAD
```

---

### 5.2 Validación de Seguridad
**Rol:** Seguridad

**Qué se hace:**
- Revisa el requerimiento recibido.
- Evalúa si los productos solicitados son correctos.

**Acciones permitidas:**
- Modificar cantidades.
- Eliminar ítems.
- Rechazar el requerimiento con comentario obligatorio.
- Aprobar el requerimiento.

**Reglas:**
- Toda modificación debe quedar registrada.
- Los comentarios son obligatorios si se realizan cambios.

**Estados posibles:**
```
APROBADO SEGURIDAD
RECHAZADO SEGURIDAD
```

---

### 5.3 Validación de Gerencia General
**Rol:** Gerencia General

**Qué se hace:**
- Revisión estratégica del requerimiento.
- Verifica coherencia, necesidad y cantidades.

**Acciones permitidas:**
- Modificar cantidades.
- Eliminar ítems.
- Rechazar con comentario.
- Aprobar el requerimiento.

**Estados posibles:**
```
APROBADO GERENCIA
RECHAZADO GERENCIA
```

---

### 5.4 Revisión de Logística / Almacén
**Rol:** Logística

**Qué se hace:**
- Verifica stock disponible por cada ítem.
- Define si el ítem se despacha de almacén o requiere compra.

**Clasificación por ítem:**
- Stock disponible.
- Requiere compra.

**Estado del requerimiento:**
```
EN REVISIÓN LOGÍSTICA
```

---

### 5.5 Validación de Administración (solo si hay compra)
**Rol:** Administración

**Qué se hace:**
- Revisa ítems que requieren compra.
- Evalúa costos y presupuesto.

**Acciones permitidas:**
- Aprobar compra.
- Rechazar compra con comentario.

**Estados posibles:**
```
APROBADO ADM
RECHAZADO ADM
```

---

### 5.6 Proceso de Compra
**Rol:** Logística

**Qué se hace:**
- Ejecuta la compra aprobada.
- Registra proveedor y fechas.
- Espera llegada del producto.

**Estados:**
```
EN COMPRA
RECIBIDO EN ALMACÉN
```

---

### 5.7 Preparación y Envío
**Rol:** Logística

**Qué se hace:**
- Consolida todos los ítems.
- Define forma de envío.
- Asigna persona que recoge o transporta.

**Estados:**
```
LISTO PARA DESPACHO
ENVIADO
```

---

### 5.8 Recepción y Entrega Final
**Roles:** Receptor / Entregador

**Qué se hace:**
- Se confirma recepción física.
- Se confirma entrega al usuario final.
- Se registra fecha, hora y responsables.

**Estado final:**
```
ENTREGADO
```

---

## 6. Reglas Generales del Sistema

- Ningún paso puede omitirse.
- Todo cambio queda auditado.
- Cada acción registra usuario y fecha.
- Un requerimiento puede entregarse de forma parcial.
- El historial nunca se elimina.

---

## 7. Inicio de Uso del Sistema

- A partir de la implementación, los técnicos **ya no usan Excel**.
- Todos los nuevos requerimientos se crean desde la web.
- El Excel queda solo como respaldo histórico.

---

## 8. Resultado Esperado

- Control total del proceso.
- Menos errores y reprocesos.
- Visibilidad en tiempo real.
- Base sólida para reportes y auditoría.

---

**Este documento sirve como guía funcional para diseño, desarrollo e implementación del sistema.**

