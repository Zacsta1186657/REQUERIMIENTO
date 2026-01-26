 Preguntas sobre Funcionalidades

  Antes de finalizar el modelo, necesito aclarar los siguientes puntos:

  1. Autenticación

  - ¿Usarás autenticación propia (email/password) o integración con algún proveedor externo (Google, Azure AD)?
  - ¿Necesitas recuperación de contraseña por email?

  ## RPTA : Si usare autenticacion propia de email y password.

  2. Gestión de Stock/Inventario

  - ¿Quieres un módulo de inventario donde Logística registre stock disponible? (para que al revisar un requerimiento pueda ver automáticamente si hay
   stock)
  - ¿O solo se marca manualmente "en stock" / "requiere compra" por ítem?

  ## RPTA : si seria bueno un modulo de inventario, pero por ahora que sea solo que marque si "en stock" o "requiere compra" y un motivo sobre ello

  3. Entregas Parciales

  - El documento menciona que "un requerimiento puede entregarse de forma parcial". ¿Cómo debe funcionar esto?
    - ¿Cada ítem tiene su propio estado de entrega?
    - ¿Se pueden hacer múltiples despachos para un mismo requerimiento?

  ## RPTA : si maryormente o algunas veces los requerimientos no se entregaran completos hay casos que se puede entregar de forma pacial asi que tenlo en consideracion. Si es parcil se entrega primero un lote y luego el otro y cada uno tiene su estado. Si es un todo osea dentro del requerimiento hay varios items y es un grupo entonces todos esos item solo contemplan un estado general.

  4. Orden de Compra

  - ¿Necesitas gestionar órdenes de compra completas (con proveedor, montos, fechas) o solo marcar los ítems como "en compra"?
  - ¿Un requerimiento puede generar múltiples órdenes de compra (a diferentes proveedores)?

  ## RPTA : necesito solo que se considere como "en compra"  a lo mucho ingresar la fecha estimada

  5. Catálogos Administrables

  - ¿Qué catálogos necesita gestionar el Administrador?
    - Operaciones
    - Centros de Costo
    - Categorías de ítems
    - Unidades de medida
    - ¿Productos predefinidos? (para autocompletar al crear items)

  ## RPTA : Si todos los mencionados

  6. Notificaciones

  - ¿Qué tipo de notificaciones necesitas?
    - Solo en la aplicación (campanita)
    - También por email
    - ¿Notificaciones en tiempo real? (WebSockets)

  ## RPTA : por el momento por la web, en la campanita

  7. Reportes

  - ¿Necesitas un módulo de reportes? Por ejemplo:
    - Requerimientos por período/estado/operación
    - Tiempos promedio de aprobación
    - Gastos por centro de costo
    - Exportar a Excel/PDF
  
  ## RPTA : Si voy a necesitar todos esos

  8. Firma Digital

  - ¿La confirmación de recepción requiere firma digital (dibujar firma en pantalla) o solo un checkbox de confirmación?

  ## RPTA : por el momento solo un checkbox de la confirmacion

 