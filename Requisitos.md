# Solicitud inicial del usuario:
Vamos a crear una web increíble, moderna y visualmente impactante para jugar al Bingo. Piensa detenidamente y paso a paso para crear el plan detallado antes de la implementación.

Las características principales que se desean son:
- Desarrollado con HTML5, css y javascript (si es necesario utilizar alguna librería informar de ello, pero la idea principal es que sea código estático, sin necesidad de usar node.js)
- Números del 1 al 90 (ambos incluidos)
- Pensado para mostrar en TV o pantalla horizontal, de manera que 2/3 de la pantalla (parte izquierda) muestren todos los números (en 9 filas, del 1 al 10, del 11 al 20, ...) con un estilo de huecos/bolas de bingo donde se vea claramente qué números han salido ya, y la parte derecha (1/3 del espacio) con el "bombo" lleno de bolas dibujado en 3D y animado, con un botón de jugar para comenzar el juego o realizar la siguiente tirada. Cuando sale una bola hay una animación de la bola pequeña saliendo del bombo, girando lentamente y se amplía hasta mostrar el número que ha salido. Evidentemente un número que ya ha salido no puede volver a salir, de modo que se escoje un número aleatorio del 1 al 90 de entre los que aún no han salido.
- Opcionalmente se deben poder registrar jugadores (simplemente con un nombre) e indicar el número de "cartones" que juega cada uno. Es decir, se puede jugar sin declarar los jugadores (porque utilizan cartones físicos y cada uno está pendiente de sus números), o se pueden declarar los jugadores (con un nombre) y se les generará una serie de cartones aleatoriamente (importante que sigan las reglas del bingo de España para generar los cartones) así como también se hará el seguimiento automático de los números acertados de cada jugador. En este caso se pueden mostrar los jugadores y sus cartones en una franja en la parte de abajo con el 100% del ancho, no sé, es una idea, pero estoy abierto a otras opciones.
- También debe haber un botón para reiniciar el juego.
- Estilo minimalista y bonito pero funcional y visualmente claro (es importante que se lean bien los números, tanto el que acaba de salir como los del tablero que ya han salido previamente).
- Un botón de configuración con acceso a los siguientes ajustes:
   - Poder seleccionar varios estilos (claro, oscuro, madera, metal, ciberpunk, cristal, etc.)
   - Modo automático/manual. En modo automático una vez iniciado el juego se van sacando bolas automáticamente cada X segundos y el botón de jugar cambia a un botón de pausa por si alguien canta línea o bingo. Cuando el ajuste está en modo automático aparece otro ajuste para especificar los segundos. El valor por defecto son 5 segundos. Cuando hay declarados jugadores y uno consigue una línea o bingo el juego se pausa automáticamente y muestra en grande el jugador y el cartón premiado, y qué tipo de premio (línea o bingo).
   - Número de líneas / bingos permitidos. Por defecto 1, pero se puede aumentar por ejemplo para que después de que se "cante" la primera línea se permita "cantar" una segunda línea o más. Lo mismo para los bingo. Si se pone el límite a cero el símbolo se cambia por un infinito y eso significa que no hay límite de líneas o bingos que se puedan cantar.
   - Los ajustes se guardan en una cookie, y también se guarda el estado del tablero (los números que han salido ya) y el estado de los cartones de los jugadores.

Piensa tambien en otras cosas que puedan ser necesarias o útiles, pero es mejor no añadir funcionalidades o cosas no necesarias o que compliquen innecesariamente el código. En todo caso pregúntame y yo decidiré al respecto.

Es importante que al final crees un plan completo y detallado, incluida una lista de fases y tareas específicas para cada fase, de modo que luego se pueda implementar todo fácilmente realizando cada una de las tareas.



# Further Considerations 1
## Preguntas adicionales para el usuario:
1. ¿Audio/Sonidos? Podría añadir efectos de sonido opcionales (bombo girando, bola saliendo, "¡Línea!", "¡Bingo!") — ¿lo incluimos o lo dejamos silencioso?

2. ¿Tipografías externas? Para evitar fuentes genéricas, sugiero usar Google Fonts con tipografías distintivas como "Dela Gothic One" para números grandes y "Space Mono" para el tablero — ¿te parece bien o prefieres que funcione 100% offline con fuentes embebidas?

3. ¿Modo presentador? Podría añadir un modo "locutor" con voz sintética (Web Speech API) que anuncie los números en voz alta — es nativo del navegador, sin librerías externas. ¿Interesa?

4. ¿Atajos de teclado? Tecla Espacio para sacar bola, P para pausar, R para reiniciar — ¿los añadimos para facilitar el control remoto/teclado?

## Respuestas del usuario:
1. Sí, añade efectos de audio y también locución TTS en Español de Espala del número que ha salido. Añade en configuración un ajuste para controlar el volumen o ponerlo en silencio.
2. Ok
3. Si
4. Usaremos la tecla espacio para todo, si está en modo manual al tocar la tecla espacio saca una bola. Si está en modo automático al tocar la tecla espacio comienza/reanuda el juego y al volver a tocar la tecla espacio pausa el juego.


# Further Considerations 2
## Preguntas adicionales para el usuario:
1. ¿Sonidos externos o generados? Puedo incluir URLs de sonidos libres de derechos (freesound.org) o crear sonidos simples con Web Audio API (sin archivos externos). ¿Preferencia?

2. ¿Límite de jugadores? ¿Establecemos un máximo (ej: 10 jugadores) o sin límite? Afecta al diseño de la franja inferior.

3. ¿Cartones impresos? ¿Añadimos un botón para generar PDF/imprimir los cartones de los jugadores para uso físico?

## Respuestas del usuario:
1. Probemos primero con Web Audio API
2. Mejor sin límite, pero en la franja inferior pondremos un máximo de 10 jugadores y se mostrarán máximo 2 cartones por jugador, si hay más cartones se puede hacer clic en un jugador para ampliar y ver todos sus cartones, y si hay más jugadores se puede hacer scroll. Para intentar que lo más relevante esté visible, y sólo en caso de haber más de 10 jugadores, si un jugador no visible acierta un nuevo número que acaba de salir, se reordenan los jugadores para que sí esté visible, sacando de la zona visible un jugador que no haya acertado y manteniendo la posición de los demás (para no moverlos contínuamente). En caso de que haya más de 2 cartones por jugador se hace algo similar, se muestran los cartones con acierto reciente.
3. Ok
