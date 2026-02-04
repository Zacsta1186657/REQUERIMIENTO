 ## PREGUNTAS
 
 1. Panel de Administración (crítico)

  Necesito crear un AdministracionPanel que aparezca cuando el estado sea EN_COMPRA.

  Pregunta: 
  - ¿Qué información debe ver Administración para validar una compra?
 
    RPTA: a lo mucho darle un check a los items que se tiene que comprar que considere que sean necesarios los que no se consideraran como rechazados, ahora para cada item deberia tener una caja de texto para que se pueda ingresar observaciones correspondientes a ese productos.

  - ¿Solo los ítems marcados como "requiere compra"?

    RPTA: Si solo los items que se mandan como requeire compran van a l rol de Administracion

  - ¿Los documentos adjuntos (cotizaciones, órdenes de compra, facturas)?

    RPTA: En este caso no es necesario.

  - ¿Debe poder aprobar/rechazar ítems individuales o todo el requerimiento?

    RPTA: De forma individual.

  2. Validación por ítem vs por requerimiento

  Actualmente se aprueba TODO el requerimiento de una vez. Según RULES.md:
  "Una vez que Administración valide los ítems, estos pasarán a mostrarse en Logística como En stock"

  Pregunta: ¿Administración valida ítem por ítem, o valida todos los ítems de compra juntos?
  
  RPTA: Validad item por item.

  3. Flujo mixto (algunos en stock, otros requieren compra)

  Si un requerimiento tiene 5 ítems: 3 en stock y 2 requieren compra:

  Opción A: Esperar a que Administración valide los 2, luego despachar todo junto
  Opción B: Despachar los 3 en stock inmediatamente, y los otros 2 cuando se validen

  RPTA: La opcion B es la mejor ya que si se tiene en stock se pueden enviar a despachar ahroa eso no quiere decir que al enviar se completo el requerimiento porque como se puede ver aun faltarin enviar otra lote , por ende no se compeltaria hasta que se envie todo.

  Pregunta: ¿Cuál prefieres?

  4. Campo adicional sugerido

  Para rastrear la validación de compras por ítem, sugiero agregar al modelo RequerimientoItem:
  validadoCompra     Boolean?   // null = no aplica, true = validado, false = rechazado
  validadoPorId      String?    // Usuario que validó
  fechaValidacion    DateTime?  // Cuándo se validó

  Pregunta: ¿Te parece bien este enfoque?

  RPTA: si mientras se acople a lo que es. 

  ---
  ¿Quieres que proceda con la implementación o tienes ajustes a las preguntas?

  RPTA: Si siempre y cuando se acople a lo que debe de ser