# M-S WM CORP VOL3

App web estática (HTML/CSS/JS) para gestión de módulos (Dashboard, RRHH, Planillas, etc.).

## Despliegue (GitHub Pages)

1. Ve al repositorio en GitHub → **Settings** → **Pages**.
2. En **Build and deployment** selecciona:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/ (root)`
3. Guarda. GitHub mostrará la URL pública cuando termine el build.

La app carga desde `index.html` en la raíz.

## Uso rápido

- Dashboard:
  - Vista normal: `dashboard.html#dashboard`
  - Vista Analytics: `dashboard.html#analytics`
- RRHH:
  - En `rrhh.html` → pestaña **Planillas** → botón **Planillas Avanzadas** abre `rrhh-planillas.html`.

## Desarrollo local

Como es una app estática, puedes abrir `index.html` directamente. Si prefieres un servidor local:

- Con Python: `python -m http.server 8000`
- Luego abre: `http://localhost:8000/`

## Notas

- Los estilos base están en `css/`.
- Imágenes/íconos están en `asets/`.
