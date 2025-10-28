Registro de usuario


Description

Estado: Implementado en la aplicación React (registro local + Google, pendiente verificación, reenvío de correo).

### Estado de correcciones (abril 2025)

- Flujo de operaciones actualizado: se eliminó el campo "subtipo", se corrigió la dirección Compra/Venta (egreso ARS en compras, ingreso ARS en ventas) y el resumen refleja el nuevo cálculo del margen.
- Tasa de mercado editable sólo para roles Tesorería/Admin con auditoría en `/api/rates/market`; UI con toggle “usar tasa del día”.
- Cálculo de margen unificado `(t_mercado - t_operación) / t_mercado`, colores verde/rojo y tooltip con la fórmula.
- Liquidaciones compuestas mantienen montos derivados: se deshabilita la edición directa de “Monto” y el acceso del navbar pasa a “Transferencias en pesos”.
- Anulación de operaciones expone botón en el resumen final (sólo si la operación está registrada y sin liquidar), crea asiento inverso y registra auditoría.
- Panel de saldos ahora se refresca en tiempo real: dashboard y widgets escuchan el SSE `/api/dashboard/balances/events`.

Como visitante
Quiero crear una cuenta usando email y contraseña o con mi cuenta de Google
Para acceder a la plataforma y guardar mi progreso/configuración

Descripción
Implementar registro con dos flujos:

Local (email + contraseña) con verificación de email.

Social (Google OAuth 2.0).
Guardar perfil mínimo (id, nombre, email verificado, provedor de login, fecha de alta). Cumplir buenas prácticas de seguridad (hash Argon2/bcrypt, rate limiting, validación de inputs).

Criterios de aceptación

CA1 – Formulario local válido

Dado que estoy en la pantalla de registro

Cuando ingreso nombre, email válido y contraseña que cumpla reglas (≥8 chars, mayúscula, minúscula, número)

Entonces se crea un usuario en estado “pendiente” y se envía un email de verificación.

CA2 – Verificación de email

Dado que recibo un correo con enlace de verificación único y con expiración

Cuando hago clic

Entonces mi cuenta pasa a estado “verificado” y puedo iniciar sesión.

CA3 – Email ya registrado (local)

Dado un email existente verificado

Cuando intento registrarlo nuevamente

Entonces veo un mensaje “El email ya está registrado. Iniciá sesión o recuperá tu contraseña”.

CA4 – Registro con Google (nuevo)

Dado que presiono “Continuar con Google” y autorizo el consentimiento

Cuando el email de Google no existe

Entonces se crea la cuenta verificada con proveedor=Google y quedo autenticado.

CA5 – Registro con Google (email existente local no verificado)

Dado un email pendiente de verificación local

Cuando registro con Google usando el mismo email

Entonces se fusiona el registro y la cuenta queda verificada con proveedor=Google.

CA6 – Validaciones y errores

Si el email es inválido o la contraseña no cumple políticas

Entonces se muestran mensajes de error de campo específicos sin perder datos ya ingresados.

CA7 – Auditoría

Al registrarse, se registra IP, user-agent y timestamp en un log de seguridad.

--

Login de usuario


Description

Estado: Implementado (login local, Google, recordarme, reenvío de verificación y rate limiting).

Como usuario registrado
Quiero iniciar sesión con email/contraseña o con Google
Para acceder de forma segura a mi cuenta

Descripción
Implementar login con sesión segura (JWT httpOnly + refresh o sesión de servidor), opción “Recordarme”, bloqueo por intentos fallidos y cierre de sesión. Unificar perfiles si el email coincide entre proveedores.

Criterios de aceptación

CA1 – Login local exitoso

Dado un usuario verificado

Cuando ingreso email/contraseña correctos

Entonces accedo a la app, se crea la sesión y veo mi nombre en el header.

CA2 – Cuenta no verificada

Dado un usuario local sin verificar

Cuando intento iniciar sesión

Entonces se me informa y se ofrece “Reenviar verificación”.

CA3 – Credenciales inválidas

Dado email o contraseña incorrectos

Cuando intento iniciar

Entonces recibo un mensaje genérico “Credenciales inválidas” sin revelar cuál campo falló.

CA4 – Login con Google

Dado que presiono “Continuar con Google”

Cuando autorizo y el email existe

Entonces se inicia sesión y se actualiza proveedor si aplica (sin duplicar cuentas).

CA5 – Rate limiting / bloqueo

Tras 5 intentos fallidos en 15 minutos

Entonces la cuenta queda temporalmente bloqueada por 15 minutos y se notifica por email.

CA6 – Recordarme

Dado que tildo “Recordarme”

Cuando inicio sesión

Entonces la sesión persiste por 30 días (sin exponer tokens accesibles a JS).

CA7 – Logout

Dado que estoy autenticado

Cuando hago “Cerrar sesión”

Entonces se invalidan tokens/sesión y soy redirigido al login.

--

Recuperar y restablecer contraseña


Description

Estado: Implementado (solicitud genérica, validación de token, reinicio de contraseña).

Como usuario que olvidó su contraseña
Quiero restablecerla mediante un enlace enviado a mi email
Para poder volver a acceder a mi cuenta

Descripción
Flujo “Olvidé mi contraseña” con email de un solo uso (TTL 15–30 min), formulario de nueva contraseña y cierre de sesiones activas tras el cambio.

Criterios de aceptación

CA1 – Solicitud de reseteo

Dado que ingreso un email (exista o no)

Cuando envío la solicitud

Entonces muestro mensaje genérico “Si el email existe, te enviamos instrucciones”.

CA2 – Enlace válido

Dado un token vigente y no usado

Cuando defino nueva contraseña válida

Entonces se actualiza el hash, se invalidan sesiones y se confirma el cambio.

CA3 – Token inválido/expirado

Dado un token incorrecto o vencido

Cuando intento usarlo

Entonces se muestra error y opción para generar uno nuevo.

Estructura principal de FinaTech


Description

Como usuario de FinaTech
Quiero una interfaz con un navbar principal (Operaciones, Tesorería, Logística, Transferencias en pesos), una campana de notificaciones y un menú de cuenta
Para navegar entre secciones, ver rápidamente mis saldos clave y trabajar dentro del contenedor de contenido de cada módulo

Descripción
Implementar el layout base de la app:

Navbar fijo arriba con: logo, menús: Operaciones, Tesorería, Logística, Transferencias en pesos; campana de notificaciones; y menú de usuario (avatar/nombre) con acciones mínimas: Perfil, Configuración, Cerrar sesión.

Footer persistente: mantener el pie de página operativo (component Footer) visible en todas las vistas del dashboard, incluyendo Logística, para conservar accesos rápidos y consistencia de navegación.

Resumen de saldos (debajo del navbar) con tres tarjetas:

Saldo de transferencia (ARS)

Saldo de efectivo (ARS)

Caja (USD)
Cada tarjeta muestra monto formateado por moneda, etiqueta clara y timestamp de última actualización.

Contenedor de contenido bajo los saldos, donde se renderiza la vista de cada sección al cambiar de menú/ruta.

Criterios de Aceptación
CA1 – Navbar visible y fijo


Dado que ingreso a la aplicación

Cuando la página carga

Entonces el navbar se ve en la parte superior, permanece fijo al hacer scroll y contiene: logo, menús (Operaciones, Tesorería, Logística, Transferencias en pesos), campana y menú de cuenta.

CA2 – Estado activo de menú y ruteo

Dado que hago clic en un ítem del menú

Cuando navego a esa sección

Entonces la opción queda en estado activo (resaltada) y el contenedor de contenido renderiza la vista correspondiente (ruta única por sección).

CA3 – Responsividad

Dado que uso la app en distintas resoluciones (≥320px)

Cuando reduzco el ancho de la ventana

Entonces el menú colapsa en un “hamburger” manteniendo acceso a todas las opciones; iconos y textos se reacomodan sin desbordes.

CA4 – Campana de notificaciones

Dado que hay notificaciones no leídas

Cuando la pantalla carga

Entonces la campana muestra un badge con el conteo; al hacer clic se abre un panel/dropdown con la lista (máximo 10 recientes) y una acción “Ver todas”.

Y cuando marco una notificación como leída, el badge disminuye acorde.

CA5 – Menú de cuenta

Dado que estoy autenticado

Cuando hago clic en el avatar/nombre

Entonces veo un menú con Perfil, Configuración y Cerrar sesión; al seleccionar Cerrar sesión se cierra la sesión y se redirige al login.

CA6 – Resumen de saldos (datos y formato)

Dado que la sección de saldos carga

Cuando se muestran los montos

Entonces cada tarjeta presenta: etiqueta, monto formateado (ARS con separador de miles y decimales; USD idem), y “Actualizado: hh:mm” (hora local).

Si la data está cargando, se ven skeletons; si falla, se muestra mensaje “No se pudieron obtener los saldos” con botón Reintentar.

CA7 – Actualización de saldos

Dado que permanezco en la vista

Cuando pasan 60 segundos

Entonces los saldos se refrescan en background sin recargar la página (polling o suscripción).

CA8 – Contenedor de contenido

Dado que selecciono una sección del menú

Cuando se actualiza la ruta

Entonces el contenedor ocupa el ancho disponible debajo de los saldos, con padding consistente, y soporta scroll independiente del navbar/saldos.

CA9 – Accesibilidad

Dado que navego con teclado

Cuando uso Tab/Shift+Tab

Entonces puedo acceder a todos los elementos interactivos con focus visible; los iconos tienen aria-label y el orden de tabulación es lógico.

CA10 – Persistencia de estado de navegación

Dado que recargo la página en una sección

Cuando la app vuelve a cargar

Entonces permanezco en la misma sección (deep link por URL).

--

Carga de nueva operación de compra / venta


Description

Como operador de FinaTech
Quiero cargar operaciones de compra o venta siguiendo un wizard de 3 pasos (datos, liquidación y resumen)
Para registrar las transacciones con clientes de forma clara, validada y con posibilidad de revisión antes de confirmarlas

Descripción
Se implementará un wizard de 3 pasos consecutivos para la carga de operaciones de compra/venta dentro de la plataforma FinaTech. El objetivo es dar al usuario un flujo guiado, claro y validado en cada etapa, que permita cargar con precisión las operaciones financieras y comerciales que realiza con clientes.

El flujo constará de los siguientes pasos visuales y funcionales:

Paso 1 – Datos de la operación
Selección de cliente con buscador y botón “+ Nuevo cliente” (flujo desarrollado en otra historia).

Al seleccionar cliente, se muestra el último margen obtenido en operaciones previas.

Tipo de operación: compra o venta.

Bien que entra y bien que sale (pueden ser divisas, activos físicos o instrumentos financieros).

Subtipo (ej: USD billete, cheque diferido).

TC contra USD.

TC de mercado contra USD.

Montos: se ingresa monto de entrada o salida y el sistema calcula el otro aplicando el TC efectivo derivado.

Se calcula y muestra margen estimado de la operación.

Acciones: Guardar borrador, Continuar, Cancelar.

Paso 2 – Liquidación
Selección de liquidación simple (un único método) o liquidación compuesta (varios métodos).

Métodos disponibles: efectivo, transferencia, depósito en banco.

En simple, se selecciona método y se aplica al 100% del monto.

En compuesta, se cargan filas con método + monto o %; el sistema calcula el complementario y muestra un indicador visual de lo que resta hasta 100%.

Validación bloquea continuar si la sumatoria no llega a 100% o se excede.

Acciones: Atrás, Guardar borrador, Continuar, Cancelar.

Paso 3 – Resumen
Pantalla de solo lectura con toda la información cargada:

Cliente.

Tipo de operación.

Bienes que entran y salen (subtipo, TCs y montos).

Margen (valor y %)

Último margen al operar con ese cliente

Liquidación simple o tabla de compuesta.

Cada bloque tiene botón Editar, que devuelve al paso correspondiente con datos precargados.

Antes de confirmar, el sistema hace validación final de reglas de negocio.

Acciones: Atrás, Guardar borrador, Confirmar/Finalizar operación, Cancelar.

Opcional: exportar/imprimir resumen como PDF.

Implementado: botón de exportación en la vista de resumen con impresión nativa.

Criterios de aceptación
Paso 1 – Datos de la operación
CA1 – Selección de cliente: al elegir cliente, queda seleccionado y se muestra último margen si existe.

CA2 – Alta de nuevo cliente: al presionar “+ Nuevo cliente” se abre el flujo de alta; al guardar, el cliente queda preseleccionado.

CA3 – Tipo de operación: al elegir compra o venta, queda fijado para cálculos e informes.

CA4 – Bienes y tipos de cambio: se registran bien de entrada y salida con TC contra USD y TC de mercado.

CA5 – Montos coherentes: si se ingresa monto de entrada o salida, el otro se calcula automáticamente según TC efectivo.

CA6 – Margen estimado: al cargar bienes, TCs y montos, se muestra margen estimado comparado con mercado.

CA7 – Guardar borrador / Cancelar: Guardar borrador guarda operación en estado draft; Cancelar descarta si no hay guardado.

Paso 2 – Liquidación
CA8 – Liquidación simple: al elegir simple, se selecciona un método y se asigna al 100% del monto.

CA9 – Liquidación compuesta (sumatoria 100%): en compuesta, se pueden agregar filas con método + monto/%; el sistema calcula lo restante y bloquea si no llega exactamente a 100%.

CA10 – Validaciones en línea: montos negativos, vacíos o no numéricos muestran error y bloquean avanzar.

CA11 – Navegación paso a paso: botón Atrás vuelve a Paso 1 con datos intactos.

CA12 – Continuar: con liquidación válida, botón Continuar pasa a Paso 3.

Paso 3 – Resumen
CA13 – Vista consolidada: se muestra un resumen en solo lectura con cliente, operación, bienes, cálculos y liquidación.

CA14 – Editar secciones: botón Editar en cada bloque redirige a Paso 1 o 2 con datos precargados; al continuar, regresa al resumen.

CA15 – Validación final: al confirmar, el sistema revalida reglas (TCs, montos > 0, liquidación = 100%, cliente válido). Si falla, redirige al paso con error.

CA16 – Confirmación: si todo es válido, la operación se guarda en estado registrada, se genera ID único y se muestra pantalla de éxito con opción de ver detalle.

CA17 – Export/Imprimir (opcional): el usuario puede exportar o imprimir el resumen antes de confirmar.

--

Carga de nuevo cliente


Description

Como operador de FinaTech
Quiero poder dar de alta un nuevo cliente o proveedor mediante un modal con datos obligatorios y opcionales
Para mantener actualizada la base de contactos y utilizarlos luego en la carga de operaciones

Descripción
Al seleccionar la opción “+ Nuevo cliente” desde el flujo de operaciones o desde la sección de contactos, se abrirá un modal emergente para la creación de un nuevo registro.

El modal contendrá:

Campos obligatorios:

Nombre

Apellido

Responsable interno (persona del equipo que gestiona esa cuenta)

Tipo de contacto (Cliente o Proveedor)

Campos opcionales:

Domicilio principal (input con autocompletado de Google Maps API u otro servicio de mapas)

Domicilio secundario (mismo comportamiento que el principal)

El usuario podrá:

Guardar: valida campos obligatorios y crea el nuevo cliente/proveedor en base de datos.

Cancelar: cierra el modal y no persiste cambios.

En caso de que el modal haya sido abierto desde un wizard de operación, al guardar correctamente, el cliente recién creado quedará seleccionado automáticamente en dicho wizard.

Criterios de Aceptación
CA1 – Apertura de modal

Dado que presiono “+ Nuevo cliente”

Cuando la acción se ejecuta

Entonces se abre un modal centrado con los campos de alta.

CA2 – Validación de campos obligatorios

Dado que quiero guardar un nuevo cliente

Cuando alguno de los campos obligatorios (nombre, apellido, responsable, tipo de contacto) está vacío

Entonces se muestra un mensaje de error debajo del campo y se bloquea el guardado.

CA3 – Selección de tipo de contacto

Dado que cargo el formulario

Cuando selecciono Cliente o Proveedor

Entonces el valor queda registrado y será usado en la clasificación del contacto.

CA4 – Autocompletado de domicilio

Dado que comienzo a escribir en el campo domicilio principal o secundario

Cuando se utilizan servicios de Maps

Entonces se sugieren direcciones en un menú desplegable, y al elegir una se completa el campo con dirección formateada.

CA5 – Guardado exitoso

Dado que completé los campos obligatorios y opcionales (si corresponde)

Cuando presiono Guardar

Entonces el sistema crea un nuevo registro en la base de datos, cierra el modal y muestra un mensaje de confirmación.

CA6 – Cancelar

Dado que estoy en el modal de nuevo cliente

Cuando presiono Cancelar

Entonces se cierra el modal y no se guarda ningún dato.

CA7 – Integración con wizard de operaciones

Dado que abrí el modal desde el wizard de operaciones

Cuando creo un cliente con éxito

Entonces el wizard selecciona automáticamente ese cliente como contraparte de la operación en curso.

--

Carga de operación de transferencia pesos


Description

Como operador de FinaTech
Quiero poder registrar operaciones de tipo Transferencia en Pesos, especificando si son de efectivo o transferencia, y si son entrantes o salientes
Para reflejar correctamente los movimientos de fondos y su impacto en los saldos de la tesorería

Descripción
Se desarrollará una nueva operación denominada “Transferencia en Pesos”, incorporada al módulo de Operaciones dentro de la plataforma FinaTech.

Esta funcionalidad permitirá al usuario cargar y registrar operaciones de transferencia de dinero en moneda local (ARS), pudiendo clasificarlas según su tipo y naturaleza, y distribuyendo el monto total entre uno o varios contactos (clientes o proveedores).

Flujo del proceso
Selección del tipo de operación

El usuario deberá elegir entre:

Tipo de movimiento:

Transferencia

Efectivo

Dirección de la operación:

Entrante (ingreso de fondos a la cuenta o caja)

Saliente (egreso de fondos desde la cuenta o caja)

Esta elección definirá el tipo de impacto contable posterior sobre las cuentas de efectivo o transferencia.

Carga del monto principal

El usuario ingresará el monto total de la operación en pesos argentinos.

El sistema validará que sea un valor positivo, numérico y con hasta dos decimales.

Distribución del monto entre contactos

Luego de definir el monto principal, el usuario accederá a una sección de desglose que le permitirá dividir la operación entre múltiples contactos (clientes o proveedores).

Para cada línea de contacto agregada, el usuario deberá completar:

Contacto (seleccionado de la lista o agregado previamente desde “+ Nuevo cliente”)

Método de liquidación (puede ser en USD o en ARS)

Monto asignado (en la moneda seleccionada)

El sistema recalculará automáticamente los totales asignados y mostrará el porcentaje o monto restante hasta completar el total de la operación.

Validaciones de consistencia

El usuario podrá agregar o eliminar líneas libremente.

El botón Continuar / Confirmar permanecerá deshabilitado hasta que la suma total de los montos asignados sea igual al monto total de la operación

Si se excede el monto total, el sistema mostrará una alerta visual y no permitirá avanzar.

Confirmación y afectación de saldos

Una vez completado el 100% de la asignación, el usuario podrá confirmar la operación.

Al hacerlo:

Se registrará la operación en la base de datos.

Se impactará el saldo de efectivo o transferencia, según el tipo seleccionado.

Se dejarán preparados los eventos para actualización de cuentas corrientes y promedios diarios ponderados (a desarrollar en historias futuras).

Se mostrará un mensaje de éxito con el ID de la operación y la opción de ver el detalle o registrar otra operación.

Criterios de Aceptación
CA1 – Creación de nueva operación

Dado que estoy en el módulo Operaciones

Cuando selecciono “Transferencia en Pesos”

Entonces se abre la vista del flujo correspondiente para cargar la operación.

CA2 – Selección de tipo y dirección

Dado que inicio la carga

Cuando selecciono el tipo de movimiento (transferencia o efectivo) y la dirección (entrante o saliente)

Entonces el sistema guarda esa configuración y la usará al impactar los saldos.

CA3 – Carga del monto principal

Dado que estoy en la pantalla de carga

Cuando ingreso un monto en pesos válido

Entonces el campo se valida y el sistema habilita la sección de desglose.

CA4 – Distribución entre contactos

Dado que definí un monto total

Cuando agrego una o más líneas de contacto

Entonces puedo seleccionar contactos existentes, definir el método de liquidación (USD o ARS) y el monto correspondiente.

CA5 – Validación de sumatoria total

Dado que tengo líneas de contactos agregadas

Cuando los montos asignados suman exactamente el monto total de la operación

Entonces el sistema habilita el botón Continuar/Confirmar.

Si la suma es menor o mayor, muestra el monto faltante o excedido y bloquea la acción.

CA6 – Eliminación y edición de líneas

Dado que estoy en la sección de desglose

Cuando elimino o edito una línea

Entonces el sistema recalcula automáticamente los montos restantes.

CA7 – Confirmación de operación

Dado que completé correctamente todos los datos

Cuando presiono Confirmar operación

Entonces se guarda la operación, se actualiza el saldo de efectivo o transferencia y se muestra un mensaje de confirmación con ID único.

CA8 – Cancelación

Dado que estoy en cualquier etapa del flujo

Cuando presiono Cancelar

Entonces se descarta el progreso y se vuelve a la vista de listado de operaciones sin guardar datos.

Reglas de negocio
Los montos de las líneas deben sumar exactamente el monto total de la operación.

El método de liquidación puede estar en USD o ARS, sin restricción de mezcla entre líneas.

La naturaleza de la operación (entrante/saliente) define el signo del movimiento sobre los saldos.

No se permite guardar una operación incompleta ni sin contactos asignados.

--

Actualización de cuentas corrientes


Description

Como operador de FinaTech
Quiero que los saldos de cuentas corrientes, caja y transferencias se actualicen automáticamente cuando se cursan operaciones de compra, venta o transferencia en pesos
Para mantener un registro contable consistente y actualizado del estado financiero de la empresa y de cada cliente o proveedor involucrado

Descripción
Cada vez que se cursa una operación dentro de la plataforma (ya sea una compra, una venta o una transferencia en pesos), debe producirse una actualización inmediata de los saldos correspondientes en las cuentas corrientes generales y en los contactos asociados.

El objetivo es reflejar en tiempo real los movimientos derivados de las operaciones, manteniendo siempre la compensación entre cuentas contables y saldos de caja o transferencias.

El sistema deberá contemplar las siguientes reglas específicas por tipo de operación:

🟢 Operaciones de Compra
Al cursar la operación

Se genera un saldo positivo en “Cuentas a Cobrar (USD)”, reflejando que la empresa tiene un crédito a su favor.

Se actualiza también el saldo del cliente en cuestión, incrementando su deuda en USD.

Al recibir el pago del cliente (registro en módulo de Tesorería)

Se refleja un saldo negativo en “Cuentas a Cobrar (USD)” (reducción del crédito).

Se actualiza el saldo del cliente compensando su cuenta.

Se actualiza la Caja en Dólares positivamente, representando el ingreso real del dinero.

🔴 Operaciones de Venta
Al cursar la operación

Se genera un saldo negativo en “Cuentas a Cobrar (USD)”, ya que la empresa adquiere una obligación o deuda.

Se actualiza el saldo del cliente, reduciendo su deuda o generando un crédito a su favor.

Al efectuarse la salida de caja (registro en módulo de Tesorería)

Se refleja un saldo positivo en “Cuentas a Cobrar (USD)”, compensando la cuenta.

Se actualiza el saldo del cliente de forma correspondiente.

Se reduce el saldo de Caja en Dólares, representando la salida real del dinero.

💰 Transferencias en Pesos
Estado: Flujo completo implementado en React (ruta /dashboard/operaciones/transfer-pesos) con confirmación, éxito y panel contable integrado.
Para este tipo de operaciones, el comportamiento es similar, pero actuando sobre las cuentas a cobrar en pesos (ARS) y las cuentas de caja / transferencias en pesos, según el caso.

Ingreso de efectivo (ARS)

Al cursar la operación, se refleja un saldo positivo en “Cuentas a Cobrar (ARS)” y se actualizan los saldos de los contactos involucrados.

Al ingresar el efectivo en caja (Tesorería), se genera un saldo negativo en “Cuentas a Cobrar (ARS)”, compensando las cuentas, y se incrementa el saldo de Caja en Pesos.

Ingreso por transferencia (ARS)

Idéntico flujo al anterior, pero el movimiento final incrementa el saldo de Transferencias en Pesos en lugar de la caja física.

Egreso de efectivo (ARS)

Al cursar la operación, se refleja un saldo negativo en “Cuentas a Cobrar (ARS)” y se actualizan los saldos de los contactos.

Cuando se efectúa el egreso de caja (Tesorería), se genera un saldo positivo en “Cuentas a Cobrar (ARS)” compensando las cuentas y se reduce el saldo de Caja en Pesos.

Egreso por transferencia (ARS)

Igual comportamiento que el anterior, pero la compensación final reduce el saldo de Transferencias en Pesos.

Criterios de Aceptación
Generales
CA1 – Actualización automática

Dado que se cursa una operación válida (compra, venta o transferencia en pesos)

Cuando se guarda como registrada

Entonces el sistema actualiza automáticamente los saldos correspondientes en cuentas corrientes y contactos.

CA2 – Registro dual contable

Dado un movimiento de ingreso o egreso

Cuando se actualiza una cuenta corriente

Entonces se genera el asiento compensatorio en la cuenta de caja o transferencia según corresponda.

CA3 – Sincronización por tipo de moneda

Las cuentas a cobrar y las cajas se actualizan en la moneda correspondiente (USD o ARS), sin mezclar registros entre monedas.

CA4 – Integración con módulo Tesorería

Dado que se registra un pago o cobro en Tesorería

Cuando este corresponde a una operación abierta

Entonces el sistema compensa automáticamente las cuentas afectadas y actualiza saldos en caja o transferencias.

CA5 – Actualización de contactos

Dado que una operación involucra uno o varios contactos

Cuando se cursa o compensa una operación

Entonces se actualiza el saldo individual de cada contacto, reflejando su posición neta.

CA6 – Auditoría

Cada movimiento debe registrar: operación de origen, fecha/hora, usuario que la cursa, moneda, monto, y contrapartida afectada.

CA7 – Visualización posterior

Dado que se cursa o compensa una operación

Cuando se consulta el módulo de “Cuentas Corrientes”

Entonces los movimientos y saldos actualizados deben ser visibles en tiempo real.

Reglas de Negocio
Toda operación genera dos movimientos compensatorios (principio de partida doble).

Las operaciones en USD y ARS se manejan en cuentas separadas.

No se permiten registros duplicados ni operaciones sin cliente/proveedor asociado.

El saldo de cada contacto se calcula como la suma algebraica de sus operaciones (ingresos – egresos).

La actualización de saldos se ejecuta de forma atómica: si una actualización falla, se revierte todo el conjunto.

Requisitos No Funcionales
Atomicidad y consistencia garantizadas (transacciones ACID a nivel de BD).

Performance: actualización instantánea (<500ms) al cursar operaciones.

Resiliencia: mecanismo de rollback ante error de escritura.

Auditoría: trazabilidad completa de cada cambio en saldos y contactos.

Escalabilidad: preparada para múltiples monedas y futuros tipos de operación.

--

Visualización de saldos y cuentas


Description

Como usuario habilitado en FinaTech
Quiero poder visualizar en todo momento los saldos principales de la empresa (caja en dólares, efectivo y transferencias en pesos) y acceder al desglose de las cuentas y contactos que los componen
Para tener una visión clara y actualizada de la situación financiera, con posibilidad de analizar cada cuenta y operación asociada

Descripción
Se desarrollará una funcionalidad de visualización de saldos destinada a los usuarios que cuenten con el permiso “Ver saldos”.

La interfaz estará compuesta por un widget permanente en la esquina superior derecha del sistema y un módulo de detalle, accesible al hacer clic sobre dicho widget.

1. Widget de saldos (vista permanente en la UI)
Ubicado en la esquina superior derecha del header principal.

Visible únicamente para los usuarios con el permiso “Ver saldos”.

Muestra en todo momento los siguientes tres valores actualizados:

Caja en USD

Efectivo en ARS

Transferencias en ARS

Los valores se mostrarán con formato monetario y actualización periódica (por ejemplo, cada 60 segundos o cuando se curse una nueva operación).

Al posicionar el cursor o tocar el widget, se muestra un tooltip o mini panel con la fecha/hora de última actualización.

Al hacer clic, se accede al módulo de visualización de saldos.

2. Módulo de visualización de saldos (detalle general y por contacto)
Estado: Implementado (React vista general consumiendo /api/treasury/balances/overview).
Al ingresar, el usuario visualizará una vista general con las cuentas principales del sistema:

A cobrar en USD

A cobrar en pesos (ARS)

Cada cuenta mostrará:

Nombre de la cuenta

Saldo total actual (positivo o negativo)

Indicador de variación (por ejemplo, flecha verde/roja con el % de cambio respecto al día anterior, opcional)

2.1. Desglose de cuentas
Al seleccionar una cuenta principal (por ejemplo, A cobrar en USD), se desplegará el detalle de todas las cuentas de clientes que componen ese saldo.

Por cada cliente, se mostrará:

Nombre o razón social

Tipo de contacto (cliente/proveedor)

Saldo individual (positivo o negativo)

Última operación registrada

Estado (activo/inactivo)

El usuario podrá ordenar la tabla por:

Monto

Nombre

Fecha de última operación

Tipo de contacto

También podrá filtrar por:

Cliente o proveedor

Rango de fechas de operación

Saldos positivos, negativos o en cero

2.2. Detalle por contacto
Estado: Implementado (detalle React conectado a `/api/treasury/balances/contacts/:contactId`).
Al seleccionar un contacto desde la tabla, el sistema mostrará una vista de detalle con:

Saldo total del contacto

Listado completo de operaciones asociadas (compras, ventas, transferencias en pesos, compensaciones, etc.)

Cada fila mostrará:

Fecha y hora

Tipo de operación

Moneda

Monto (positivo o negativo)

Estado (registrada, pendiente, compensada)

En la parte superior se incluirá un resumen de totales (operaciones entrantes, salientes y saldo neto).

El usuario podrá aplicar filtros adicionales dentro del detalle:

Tipo de operación

Estado

Moneda

Rango de fechas

También podrá ordenar las operaciones por fecha, monto o tipo.

Criterios de Aceptación
Permisos y acceso
CA1 – Control de permisos

Dado que un usuario inicia sesión

Cuando tiene el permiso “Ver saldos”

Entonces visualiza el widget de saldos en la esquina superior derecha.

Cuando no tiene el permiso, dicho widget no se muestra.

Widget de saldos
CA2 – Visualización inicial

Dado que el usuario tiene permiso

Cuando accede a cualquier sección del sistema

Entonces visualiza permanentemente el widget con los tres saldos principales (Caja USD, Efectivo ARS, Transferencias ARS).

CA3 – Actualización en tiempo real

Dado que se cursa una nueva operación (compra, venta o transferencia en pesos)

Cuando se impactan los saldos correspondientes

Entonces el widget refleja los nuevos valores actualizados automáticamente.

CA4 – Acceso al módulo de saldos

Dado que el usuario hace clic sobre el widget

Entonces se abre el módulo completo de visualización de saldos.

Módulo de saldos
CA5 – Visualización de cuentas principales

Dado que el módulo carga correctamente

Entonces se muestran las cuentas “A cobrar en USD” y “A cobrar en pesos” con sus saldos consolidados.

CA6 – Desglose por cliente

Dado que selecciono una cuenta principal

Cuando se despliega su contenido

Entonces veo todas las cuentas de clientes que la componen con nombre, tipo y saldo.

CA7 – Filtrado y orden

Dado que visualizo una tabla de clientes o de operaciones

Cuando aplico filtros o criterios de orden

Entonces el listado se actualiza instantáneamente mostrando los resultados correctos.

CA8 – Visualización de detalle por contacto

Dado que selecciono un contacto

Cuando accedo a su detalle

Entonces se muestra el historial de operaciones, totales acumulados y saldo neto.

CA9 – Navegación fluida

Dado que estoy dentro del módulo

Cuando selecciono distintas cuentas o contactos

Entonces puedo navegar entre vistas sin pérdida de estado ni necesidad de recargar.

CA10 – Actualización consistente

Dado que se registran nuevas operaciones en el sistema

Cuando vuelvo al módulo de saldos

Entonces los valores reflejan el estado actualizado en tiempo real (sin requerir recarga manual).

Reglas de negocio
Solo los usuarios con permiso explícito pueden acceder o visualizar saldos.

Los saldos deben actualizarse de forma automática e inmediata tras el registro de una operación.

Los montos se agrupan y muestran por moneda.

Las cuentas de clientes reflejan tanto montos positivos (a cobrar) como negativos (a pagar).

Los datos deben poder filtrarse y ordenarse sin alterar la consistencia de los saldos globales.

--

Módulo de tesorería


Description

Estado: Listado, detalle lateral, registro manual y conciliación implementados en React (ruta /dashboard/tesoreria), con filtros, sumatorias, stripe de balances, alta y compensación de movimientos integrados a la API.

Como operador financiero de FinaTech
Quiero acceder a un módulo de Tesorería que me permita registrar, visualizar y gestionar los movimientos de ingreso y egreso de fondos, tanto en pesos como en dólares
Para reflejar en el sistema los flujos reales de caja y transferencias, compensar operaciones pendientes y mantener actualizado el estado financiero global de la empresa

Descripción
El módulo de Tesorería será el espacio central donde se registran todas las entradas y salidas de fondos, sirviendo como puente contable entre las operaciones comerciales (compras, ventas, transferencias en pesos) y los saldos de caja / cuentas corrientes.

El módulo debe permitir visualizar, filtrar, cargar y conciliar movimientos, integrando automáticamente las actualizaciones en los saldos generales del sistema y en los registros de cada contacto.

1. Estructura del módulo
Acceso desde el menú principal (navbar): Tesorería

Vista principal con pestañas o secciones diferenciadas:

Movimientos (listado general de ingresos/egresos)

Registrar movimiento

Conciliación / Compensación de operaciones

Saldos y cuentas vinculadas

2. Movimientos
El usuario visualizará un listado cronológico de todos los movimientos realizados.

Cada fila mostrará:

Fecha y hora

Tipo de operación: Ingreso o Egreso

Medio: Efectivo, Transferencia bancaria, Depósito

Moneda: ARS o USD

Monto

Contacto asociado (si aplica)

Origen (compra, venta, transferencia, carga manual)

Estado: Registrado, Compensado, Anulado

Desde esta vista se podrá:

Filtrar por fecha, moneda, tipo, medio, contacto o estado.

Ordenar por fecha o monto.

Ver el detalle de un movimiento específico.

3. Registro de nuevos movimientos
El usuario podrá cargar un nuevo movimiento de Tesorería desde la pestaña “Registrar movimiento”.

Campos del formulario:

Tipo de movimiento: Ingreso / Egreso

Medio: Efectivo, Transferencia, Depósito

Moneda: ARS / USD

Monto

Fecha del movimiento

Contacto asociado (opcional)

Referencia / Descripción

Operación asociada (opcional, si proviene de una operación comercial previamente registrada)

Comportamiento:

Al guardar el movimiento, se actualizan automáticamente:

Los saldos de Caja o Transferencias según medio y moneda.

Las Cuentas a Cobrar o a Pagar, si el movimiento corresponde a una operación existente.

Los saldos del contacto asociado, compensando sus cuentas corrientes.

Ejemplo:

Si se recibe un pago de un cliente por una operación de compra → se genera un ingreso en USD → se reduce “Cuentas a Cobrar (USD)” y aumenta “Caja USD”.

Si se paga una venta a un proveedor → se genera un egreso en USD → se aumenta “Cuentas a Cobrar (USD)” (compensación) y se reduce “Caja USD”.

4. Conciliación / Compensación
El módulo permitirá vincular movimientos de Tesorería con operaciones abiertas.

El sistema sugerirá automáticamente posibles coincidencias por:

Monto

Moneda

Contacto

Fecha cercana

El usuario podrá confirmar o ajustar manualmente la vinculación.

Al compensar una operación:

Se marcan ambas partes como Compensadas.

Se actualizan saldos en caja, cuentas corrientes y contacto.

5. Saldos y cuentas vinculadas
Estado: Implementado en React (ruta /dashboard/tesoreria/saldos) con resumen 1:1, pestañas de movimientos, integración contable y panel lateral enlazado al stripe de saldos.
Vista con los saldos actuales de:

Caja en USD

Caja en ARS

Transferencias en ARS

Cada una con la posibilidad de ver movimientos recientes asociados.

Debe integrarse con el widget de saldos (ya definido) para mantener sincronización.

Criterios de Aceptación
CA1 – Acceso al módulo

Dado que tengo el permiso “Acceder a Tesorería”

Cuando selecciono Tesorería en el menú principal

Entonces ingreso al módulo con sus secciones visibles.

CA2 – Visualización de movimientos

Dado que el módulo carga correctamente

Cuando accedo a la pestaña “Movimientos”

Entonces veo la lista completa con fecha, tipo, medio, moneda, monto y estado.

CA3 – Filtros y ordenamiento

Dado que tengo muchos movimientos

Cuando aplico un filtro (por fecha, tipo, contacto o moneda)

Entonces la lista se actualiza mostrando solo los resultados válidos.

CA4 – Registro de nuevo movimiento

Dado que presiono “Registrar movimiento”

Cuando completo el formulario y presiono “Guardar”

Entonces se genera el movimiento, se actualizan los saldos correspondientes y aparece en la lista.

CA5 – Integración con operaciones

Dado que existe una operación pendiente (compra, venta o transferencia)

Cuando registro un movimiento que coincide con ella

Entonces el sistema ofrece vincularlo automáticamente y marca ambas como compensadas.

CA6 – Actualización de saldos

Dado que registro un ingreso o egreso

Cuando el movimiento se guarda correctamente

Entonces los saldos de caja o transferencia se actualizan automáticamente, tanto en el módulo como en el widget global.

CA7 – Compensación manual

Dado que hay movimientos no conciliados

Cuando selecciono una operación y un movimiento manualmente

Entonces puedo vincularlos y compensar ambos.

CA8 – Auditoría de movimientos

Dado que se registra o modifica un movimiento

Cuando se guarda la acción

Entonces se registra usuario, fecha, hora y operación vinculada.

CA9 – Permisos de escritura

Solo los usuarios con permiso “Gestionar Tesorería” podrán registrar, editar o compensar movimientos.

Reglas de negocio
Cada movimiento genera impacto directo sobre las cuentas de caja o transferencias y, en caso de estar vinculado a una operación, sobre las cuentas corrientes.

Las monedas se manejan de forma independiente (ARS / USD) y no se compensan entre sí.

Los movimientos no pueden modificarse si ya están compensados.

Todos los movimientos deben tener referencia única y timestamp.

Los saldos deben mantenerse consistentes y balanceados entre entradas y salidas.

--

Consistencia de Footer en Dashboards


Description

Estado: Implementado y auditado (enero 2025).

Como desarrollador del sistema
Quiero que todos los dashboards mantengan un footer consistente
Para asegurar una experiencia de usuario uniforme y evitar regresiones futuras

Descripción
Todos los dashboards principales (Operaciones, Tesorería, Logística) deben utilizar el componente `DashboardFooter` compartido ubicado en `client/src/components/dashboard/operaciones/Footer.tsx`. Este componente está exportado tanto como `DashboardFooter` como `Footer` para compatibilidad.

Criterios de aceptación

CA1 – Componente footer compartido

Dado que se desarrolla una nueva página de dashboard

Cuando se implementa la interfaz

Entonces debe importar y renderizar el componente `<Footer />` desde `../operaciones/Footer`.

CA2 – Consistencia visual

Dado que navego entre diferentes dashboards

Cuando accedo a páginas de Operaciones, Tesorería o Logística

Entonces el footer debe mantener el mismo diseño, contenido y comportamiento en todas las páginas.

CA3 – Responsive design

Dado que accedo desde diferentes dispositivos

Cuando visualizo cualquier dashboard

Entonces el footer debe adaptarse correctamente a pantallas desktop y móviles.

CA4 – Excepciones documentadas

Dado que una página requiere un footer especializado

Cuando se implementa una excepción al footer estándar

Entonces debe estar documentada en el código con comentarios explicativos del motivo.

CA5 – Auditoría periódica

Dado que se realizan cambios en el sistema

Cuando se agregan nuevas páginas o se modifican existentes

Entonces se debe verificar que el footer compartido esté correctamente implementado.

Reglas de negocio
- **Footer stays rule**: El footer debe permanecer consistente en todos los dashboards principales.
- Páginas de flujos especializados (como wizards de transferencia) pueden usar footers alternativos si es necesario para la UX.
- Cualquier modificación al componente `DashboardFooter` se aplica automáticamente a todos los dashboards.
- El footer debe incluir información corporativa, enlaces de ayuda y versión del sistema.

Implementación actual verificada:
- ✅ Operaciones: `DashboardOperacionesPage.tsx` usa `<DashboardFooter />`
- ✅ Tesorería: `TreasuryMovementsPage.tsx`, `GlobalBalancesPage.tsx`, `LinkedBalancesPage.tsx` usan `<Footer />`
- ✅ Logística: `LogisticaPanel.tsx`, `LogisticsGeneralSummaryPage.tsx`, `MovementDetailPage.tsx` usan `<Footer />`

