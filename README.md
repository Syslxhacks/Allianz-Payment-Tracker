# Allianz Payment Tracker 📱💳

Una aplicación web estática optimizada para dispositivos móviles (smartphones) desarrollada con **HTML5**, **CSS3 moderno** y **Vanilla JavaScript (ES6+)**, integrada directamente con una base de datos **Supabase**.

---

## ✨ Características Principales

1. **Autenticación por PIN de Acceso**:
   - Pantalla de bloqueo con teclado numérico táctil estilo móvil.
   - PIN por defecto: `1234` (configurable en Ajustes o en `config.js`).
   - Persistencia de sesión segura en `sessionStorage`.

2. **Base de Datos y Seguridad (Supabase + RLS)**:
   - Tabla `students` (`id`, `name`, `curso`, `paid_status`, `created_at`, `updated_at`).
   - Políticas RLS (Row Level Security) para acceso seguro.
   - Triggers automáticos para actualización de `updated_at`.

3. **Interfaz Móvil de Alta Legibilidad**:
   - Diseño Mobile-First con tarjetas amplias (touch targets de al menos 48px).
   - Filtro persistente por **Curso** con selector nativo `<select>`.
   - Búsqueda en tiempo real por nombre de alumno (tolerante a mayúsculas/minúsculas y acentos).
   - Filtro rápido por estado (*Todos*, *Pendientes*, *Pagados*).

4. **Interacción y Cambio de Estado Dinámico**:
   - Al tocar un alumno, se abre un diálogo modal de confirmación (*Bottom Sheet*).
   - Actualización asíncrona inmediata en Supabase (`paid_status = true`).
   - Actualización instantánea en el DOM cambiando la tarjeta a color verde esmeralda vibrante con animación de celebración sin recargar la página.

5. **Vista de Estadísticas en Vivo**:
   - Total absoluto de alumnos con pago pendiente (`paid_status = false`).
   - Porcentaje de recaudación general.
   - Desglose detallado agrupado por cada curso individual con barras de progreso visuales.

6. **Herramienta de Importación CSV**:
   - **En el navegador**: Carga y arrastra tu archivo CSV directamente desde la aplicación.
   - **Script CLI (Node.js)**: Utilidad `import_csv.js` para importar masivamente desde la terminal.

---

## 🚀 Guía de Instalación y Configuración

### 1. Configuración de la Base de Datos en Supabase
1. Ingresa a tu panel en [Supabase](https://supabase.com/).
2. Ve al **SQL Editor** y ejecuta el contenido del archivo [`schema.sql`](file:///c:/Users/tolen/Desktop/AAlianzas/schema.sql).
3. Obtén tu **Project URL** y **Anon Key** desde *Project Settings > API*.

### 2. Configurar Credenciales en la Aplicación
Puedes configurarlas de dos formas:
- **Opción A (Desde la propia App)**: Abre la aplicación en tu navegador, ingresa con el PIN `1234`, toca el ícono de engranaje ⚙️ (Ajustes), pega tu URL y Anon Key, y toca *Guardar Cambios*.
- **Opción B (En código)**: Edita el archivo [`config.js`](file:///c:/Users/tolen/Desktop/AAlianzas/config.js) y coloca tu `SUPABASE_URL` y `SUPABASE_ANON_KEY`.

### 3. Importar Alumnos desde CSV
El archivo CSV debe contener las columnas `Curso` y `Nombre`. Ejemplo en [`sample_students.csv`](file:///c:/Users/tolen/Desktop/AAlianzas/sample_students.csv):
```csv
Curso,Nombre
1° Básico A,Alonso Valenzuela
1° Básico A,Antonia Muñoz
1° Básico B,Esteban Navarrete
2° Básico A,Ignacio Soto
```

#### Para importar desde la App:
1. Toca el botón de importación 📥 en el encabezado.
2. Selecciona o arrastra el archivo CSV.
3. Revisa la vista previa y presiona **"Importar a Supabase"**.

#### Para importar desde Node.js:
```bash
node import_csv.js sample_students.csv
```

---

## 📱 Probar la Aplicación Localmente

Puedes abrir directamente el archivo `index.html` en tu navegador o servirlo con cualquier servidor estático:

```bash
# Con Python
python -m http.server 8080

# O con npx serve
npx -y serve .
```
Luego abre `http://localhost:8080` en tu teléfono o en el navegador de tu computadora.
