# Botillería La Central - Sistema real con base de datos

Esta versión incluye backend con Node.js + Express + SQLite y ahora agrega el rol de **Vendedor**.

## Nuevas funciones
- Rol **Vendedor**
- El vendedor registra productos y genera un **baucher**
- El baucher queda descargable como archivo HTML
- El **Cajero** busca o "escanea" el código del baucher
- Al cobrar:
  - se carga la venta preparada por el vendedor
  - se descuenta el stock
  - se emite una **boleta simulada chilena**
  - la boleta queda descargable

## Roles demo
- Administrador: admin@lacentral.cl / 123456
- Cajero: cajero@lacentral.cl / 123456
- Supervisor: supervisor@lacentral.cl / 123456
- Vendedor: vendedor@lacentral.cl / 123456

## Instalación
1. Abre terminal en la carpeta del proyecto
2. Ejecuta:
   npm install
3. Luego:
   npm start
4. Abre:
   http://localhost:3000

## Nota
La boleta y el baucher son simulaciones descargables en HTML para esta etapa.
