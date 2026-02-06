# Considera estas reglas : 

# MÓDULO: DASHBOARD

Buscador de requerimientos:

Actualmente existe un buscador de requerimientos, pero no está claro qué funcionalidad debe cumplir.

Se requiere evaluar:

- Proponer posibles usos útiles para este buscador, por ejemplo:
  - Buscar por número de requerimiento.
  - Buscar por estado (Creado, Aprobación, Compra, Stock, Despacho, Cerrado, etc.).
  - Buscar por solicitante / técnico / área.
  - Buscar por rango de fechas.
  - Buscar por prioridad.
  - Búsqueda rápida por texto (descripción o ítems).

- Si el buscador no aporta valor real al flujo del sistema, considerar ocultarlo para el usuario para evitar ruido innecesario en la interfaz.

El objetivo es mantener solo funcionalidades que realmente aporten utilidad.

------------------------------------------------------------

# NUEVA FUNCIONALIDAD: LÍNEA DE TIEMPO DEL REQUERIMIENTO

Se requiere implementar una visualización tipo "línea de tiempo" (timeline) del flujo completo del requerimiento.

Comportamiento esperado:

- Cuando cualquier rol del sistema ingrese al detalle de un requerimiento, debe poder visualizar el flujo completo desde su creación hasta el estado actual.
- Por ejemplo, si un TÉCNICO abre un requerimiento que está en estado DESPACHO:
  - Debe visualizar todos los estados recorridos(considera todos lo que estan en el proyecto)
  - También debe poder visualizar los estados restantes necesarios para completar el requerimiento , osea lo que aun no se estan dando en ese momento

Objetivo:
- Permitir entender rápidamente en qué punto del proceso se encuentra el requerimiento.
- Visualizar progreso, historial y próximos pasos.
- Mejorar trazabilidad y transparencia del flujo.

Requisitos:
- Mostrar estados completados, estado actual y estados pendientes.
- Diseño claro e intuitivo (tipo timeline o stepper).
- Información solo visual (no editable).
- Compatible con todos los roles.
- Mantener consistencia visual con el sistema actual.
