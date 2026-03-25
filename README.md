# Botillería La Central - Sistema con roles

## Estructura

- `index.html` -> login principal
- `css/styles.css` -> estilos globales
- `js/login.js` -> login y redirección por rol
- `js/auth.js` -> protección de páginas
- `js/admin.js` -> acceso solo administrador
- `js/cajero.js` -> acceso solo cajero
- `js/supervisor.js` -> acceso solo supervisor
- `pages/admin.html` -> panel administrador
- `pages/cajero.html` -> panel cajero
- `pages/supervisor.html` -> panel supervisor

## Usuarios demo

- Administrador: `admin@lacentral.cl` / `123456`
- Cajero: `cajero@lacentral.cl` / `123456`
- Supervisor: `supervisor@lacentral.cl` / `123456`

## Cómo funciona

1. El usuario inicia sesión desde `index.html`.
2. Si las credenciales coinciden, se guarda el usuario en `localStorage`.
3. El sistema redirige al panel correspondiente según el rol.
4. Cada página valida el rol antes de mostrar contenido.

## Nota

Este proyecto es una base frontend de demostración. Para producción debes conectarlo a backend y base de datos real.
