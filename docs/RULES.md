### REGLAS A SEGUIR

# LOGISTICA , ADMINISTRACION Y RECEPTOR

## Problemas Identificados y Corregidos (2026-02-04)

### Bug 1: Vista de Despacho mostraba todos los ítems ✅ CORREGIDO
- **Problema original:** Cuando Logística seleccionaba ítems que están en stock, la vista de Despacho/Envío mostraba todos los ítems como si estuvieran disponibles, incluso los marcados como "requiere compra".
- **Solución:** El DespachoPanel ahora filtra correctamente los ítems y solo muestra aquellos que son despachables:
  - Items marcados como `enStock = true`
  - Items de compra que fueron validados por Administración Y ya fueron recibidos en almacén (`validadoCompra = true` Y `compraRecibida = true`)

### Bug 2: No se podía gestionar ítems pendientes después de envío parcial ✅ CORREGIDO
- **Problema original:** Al hacer un envío parcial (stock + compra), el sistema asumía incorrectamente que los ítems de compra estaban listos para despacho después de la validación de Administración.
- **Solución:** Se agregó un nuevo paso en el flujo donde Logística debe confirmar que los ítems comprados ya llegaron al almacén antes de poder despacharlos:
  - Nuevo campo `compraRecibida` en el modelo de datos
  - Nuevo panel "Recepción de Compras en Almacén" para que Logística confirme la llegada de productos
  - Los ítems comprados solo aparecen disponibles para despacho cuando `compraRecibida = true`

## Flujo de Trabajo Actualizado

```
REVISION_LOGISTICA (Logística clasifica items)
    ├─→ Todo stock → LISTO_DESPACHO
    ├─→ Todo compra → EN_COMPRA
    └─→ Mixto → EN_COMPRA + Lote automático para stock

EN_COMPRA (Administración valida compras)
    ├─→ Todo aprobado → LISTO_DESPACHO
    ├─→ Todo rechazado → RECHAZADO_ADM
    └─→ Mixto → LISTO_DESPACHO (solo aprobados)

LISTO_DESPACHO
    ├─→ Items en stock → Listos para despacho inmediato
    └─→ Items de compra validados → Logística debe confirmar recepción en almacén
        └─→ Después de confirmar → Disponibles para despacho

ENVIADO → ENTREGADO_PARCIAL → ENTREGADO
```

---

## Observaciones Originales (Referencia)

~~- Existe un inconveniente en el flujo cuando el rol de Logística selecciona los ítems que se encuentran en stock (como se muestra de forma referencial en la imagen 5). El problema es que, posteriormente, en la vista de Despacho / Envío, vuelven a mostrarse ambos ítems, incluso cuando previamente solo se seleccionó uno como disponible en stock.~~

~~- Adicionalmente, se observa que al marcar el checkbox de `En stock` y luego utilizar el botón `Todo en Stock`, es posible indicar una cantidad parcial para realizar un primer envío. El flujo continúa correctamente hasta el despacho; sin embargo, al intentar volver posteriormente para gestionar el ítem restante el sistema no permite regresar a ese estado.~~