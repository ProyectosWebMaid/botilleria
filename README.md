# Botillería La Central - GitHub Pages

Esta versión está preparada para subir directamente a GitHub Pages.

## Importante
- Usa localStorage del navegador.
- No necesita backend.
- Sube **estos archivos en la raíz del repositorio**.

## Carpetas
- index.html
- css/
- js/
- pages/

## Usuarios demo
- admin@lacentral.cl / 123456
- cajero@lacentral.cl / 123456
- supervisor@lacentral.cl / 123456
- vendedor@lacentral.cl / 123456


## Mejoras agregadas
- El baucher descargado ahora incluye un código de barras visual (Code39 simulado).
- En Vendedor puedes buscar productos escaneando/escribiendo el código de barras o ingresando el nombre manualmente.
- El Cajero puede seguir cobrando voucher escribiendo o escaneando el código del baucher.


## v3
- En cajero se agregó escáner visual simulado del voucher.
- Se agregó selección visual de pago en efectivo o tarjeta.
- Al cobrar y emitir boleta ahora puedes descargarla o imprimirla para entregarla al cliente.


## v4
- Corregido el flujo de cajero para que al cobrar se dispare la descarga de la boleta.
- Corregida la impresión usando una ventana nueva con el HTML de la boleta.
- Después del cobro, el formulario queda listo para cobrar una venta nueva.


## v5
- Al cobrar en cajero se abre una página nueva con la boleta completa.
- Esa página trae botón para imprimir y botón para cerrar.
- Al cerrar la página de boleta, la pestaña de cobro se reinicia automáticamente para cobrar un nuevo voucher.


## v6
- En cajero ahora puedes buscar el voucher ingresando solo los últimos 4 dígitos.
- El campo se autolimita a 4 números y busca automáticamente al completar el cuarto dígito.
- Los vouchers nuevos del vendedor ahora usan numeración corta tipo VCH-0001, VCH-0002, etc.
- Después de VCH-9999 la numeración vuelve a VCH-0001.


## v7
- Corregida la numeración de vouchers.
- Ahora sigue así: VCH-9998, VCH-9999, VCH-10000, VCH-10001...
- No vuelve a VCH-0001.


## v8
- Validación pro en cajero para vouchers ya cobrados.
- Si el voucher ya fue emitido/cobrado, muestra alerta visual dentro de la página.
- Bloquea el botón de cobro.
- Muestra fecha, cajero, forma de pago y total del cobro previo.
- No permite volver a cobrar el mismo voucher.


## v9
- Corregido el bug real del cajero: el voucher ahora se actualiza sobre los datos guardados antes de cobrar.
- Ya no puede cobrarse varias veces el mismo voucher.
- Si se intenta reutilizar, muestra alerta y bloquea el botón.


## v10
- Se corrigió el control de doble cobro con bloqueo en memoria y en datos guardados.
- Al cobrar, el voucher guarda metadatos: charged_at, charged_by, payment_method y receipt_id.
- Si intentas cobrar el mismo voucher otra vez, queda bloqueado y muestra el detalle del cobro anterior.


## v11
- Corregida la búsqueda del cajero: si pegas el código completo, ahora se busca exacto.
- Los últimos 4 dígitos solo se usan si apuntan a un voucher único.
- Si hay coincidencias múltiples por el mismo final, el sistema obliga a pegar el código completo.
- Se mantiene el bloqueo total de vouchers ya cobrados.


## Versión MAILD
- Marca MAILD integrada en login, paneles y boleta.
- Logo #5 incorporado como imagen del sistema.
- Archivos listos para subir a GitHub Pages.
