# Colecciones dentro de Inventario

**Resumen** reúne las armaduras, los niveles de mejora, recuerdos, telas, equipamiento de caballo, recompensas y medallas. Las medallas distinguen las conseguidas de las listas para reclamar. Cada acceso abre la colección correspondiente. Los datos sin verificar siguen separados de los pendientes. Estos contadores no son el porcentaje oficial del mapa.

La selección del plan de armaduras y su nivel objetivo se guardan en `.state/settings.json`, junto al ejecutable, y se recuperan aunque cambies de navegador o reinicies la app. El plan es compartido entre las partidas consultadas y recalcula los costes con el inventario de la instantánea activa. Si no se puede guardar, se informa y puedes reintentar; los cambios siguen disponibles en la ventana actual.

Abre **Inventario** y elige una subpestaña:

- **Bolsas** muestra lo que llevas en la partida.
- **Armaduras** muestra las 135 piezas obtenibles, con imagen, estado y nivel actual. Usa el buscador o el filtro de estado para ver lo que te falta. Abre **Dónde conseguirlo** para consultar sus fuentes y la guía externa.
- **Otras colecciones** permite elegir Recuerdos, Telas de la paravela, Equipamiento de caballo o Recompensas de completado mediante tarjetas con imágenes. Se muestra una colección a la vez.
- **Medallas de jefes** agrupa los enemigos por las seis medallas. Abre los pendientes y pulsa **Ver en mapa** para localizar uno.

## Calcular una mejora

1. En **Armaduras**, marca **Incluir en el plan** en las piezas que quieres mejorar.
2. Abre **Tu plan de mejoras** y elige el nivel de estrellas que quieres alcanzar.
3. Consulta las rupias y la tabla de materiales: **Necesitas**, **Tienes** y **Faltan**. Las listas largas se despliegan al pulsar su título.

El cálculo suma todas las mejoras que faltan desde el nivel actual hasta el objetivo y luego descuenta materiales y rupias una sola vez del total. Si tienes varias copias de una pieza, utiliza la más mejorada. Las dos posiciones de la capucha hyliana cuentan como una misma pieza. El Espíritu del héroe ancestral tiene el coste especial de una armadura de cuerpo entero. Comprar piezas y desbloquear las fuentes de las hadas quedan fuera del cálculo.

La selección empieza vacía la primera vez. **Seleccionar las que tengo** prepara un plan para tus armaduras; **Quitar selección** permite empezar de nuevo. Una pieza que aún no tienes puede incluirse como previsión desde su nivel base. La partida se mantiene siempre en modo de lectura.

## Interpretar los estados

**Pendiente** significa que el guardado confirma que falta. **Sin verificar** significa que no hay datos suficientes. No se reemplaza un estado desconocido por un pendiente ni por un completado.

Las armaduras muestran posesión actual: si vendiste una, vuelve a aparecer como pendiente. Las otras colecciones se basan en sus campos de adquisición. El catálogo de telas incluye la tela inicial y las cinco telas de sabios de las versiones 1.4; sus campos pueden estar ausentes en guardados anteriores. El equipamiento de caballo cubre los 11 objetos coleccionables, sin contar las piezas predeterminadas de un caballo.

Derrotar a todos los jefes y recibir la medalla son cosas distintas. **Lista para reclamar** requiere confirmar todos los jefes y que la medalla siga pendiente. Si faltan campos, se conserva **Sin verificar**.

Todo sigue el guardado activo, incluidos Autosync y las consultas temporales. Los nombres, fuentes y costes están incluidos para funcionar sin conexión. Las imágenes de referencia y las guías externas necesitan conexión; una imagen que no carga se sustituye por un icono.

Las imágenes de piezas y colecciones pendientes o sin verificar aparecen difuminadas, también cuando no hay partida cargada. Pulsa **Clic para revelar** para ver una imagen y **Volver a difuminar** para ocultarla de nuevo. También funciona con teclado. Revelar una imagen solo cambia su presentación; no marca el objeto como conseguido. Las miniaturas de selección prefieren objetos ya conseguidos y mantienen ocultos los demás. Si un objeto deja de constar como conseguido al cambiar de guardado, su imagen vuelve a quedar protegida.
