SISTEMA M&S CONSTRUCTOR - v2.0
==============================

DESCRIPCIÓN:
------------
Sistema web integral para gestión de proyectos de construcción. 
Desarrollado para funcionar offline con sincronización en la nube.

ESTRUCTURA DE ARCHIVOS:
-----------------------
M&S-Sistema-Constructor/
│
├── index.html              # Pantalla de bloqueo/login
├── inicio.html             # Aplicación principal (Ingresos/Gastos)
├── proyectos.html          # Gestión de proyectos
├── presupuestos.html       # Cuantificación y costos
├── seguimiento.html        # Control físico y financiero
├── compras.html           # Gestión de compras
├── rrhh.html              # Recursos humanos
├── dashboard.html         # Tablero principal
├── cotizacion.html        # Cotización rápida
├── asistencia.html        # App para trabajadores
│
├── css/
│   ├── styles.css         # Estilos principales
│   └── components.css     # Componentes específicos
│
├── js/
│   ├── app.js             # Funciones generales
│   ├── database.js        # Gestión de datos local
│   ├── sync.js            # Sincronización con nube
│   └── modules/           # Módulos específicos
│
├── assets/                # Imágenes, logos, recursos
└── README.txt            # Este archivo

INSTALACIÓN:
------------
1. Copiar todos los archivos a una carpeta en su servidor web
2. Acceder al archivo index.html desde cualquier navegador
3. La aplicación se puede instalar como PWA en dispositivos móviles

CONFIGURACIÓN INICIAL:
----------------------
1. Contraseña predeterminada: admin123
2. Puede cambiar la contraseña desde la pantalla de login
3. Los datos se guardan localmente en el navegador

FUNCIONALIDADES PRINCIPALES:
----------------------------
1. INICIO: Registro de ingresos y gastos por proyecto
2. PROYECTOS: Captura de información inicial de clientes
3. PRESUPUESTOS: Cálculo automático de costos y materiales
4. SEGUIMIENTO: Control físico y financiero con gráficas Gantt
5. COMPRAS: Gestión de pedidos a proveedores y stock
6. RRHH: Control de personal, contratos y planillas
7. DASHBOARD: Tablero con métricas y gráficas
8. COTIZACIÓN: Generación rápida de cotizaciones

BASE DE DATOS LOCAL:
--------------------
- Los datos se almacenan en localStorage del navegador
- Se pueden exportar/importar en formato CSV
- Sincronización opcional con la nube

CARACTERÍSTICAS TÉCNICAS:
-------------------------
- HTML5, CSS3, JavaScript puro
- Diseño responsive (se adapta a cualquier pantalla)
- Funciona offline (PWA)
- Almacenamiento local con opción a sincronización en nube
- Exportación a PDF y CSV
- Cálculos automáticos de costos de construcción

ACTUALIZACIONES:
----------------
v2.0 - Versión inicial con todas las funcionalidades básicas
Próximas actualizaciones incluirán:
- Integración con APIs de nube
- Más tipos de gráficas
- Facturación electrónica
- App móvil nativa

CONTACTO:
---------
CONSTRUCTORA WM/M&S
"EDIFICANDO EL FUTURO"
Barrio el Centro Casco Urbano Quesada Jutiapa
Tel: 55606172
Email: multiserviciosdeguatemal@gmail.com

NOTAS:
------
- Este sistema está diseñado para pequeñas y medianas constructoras
- Todos los cálculos están basados en estándares de construcción en Guatemala
- Se recomienda realizar respaldos periódicos de los datos