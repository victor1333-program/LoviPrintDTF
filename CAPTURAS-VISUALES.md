# 📸 Capturas Visuales del Proyecto

Este documento muestra cómo se ve cada página de la aplicación.

---

## 🏠 PÁGINA PRINCIPAL (/)

```
┌─────────────────────────────────────────────────────────────┐
│  DTF Print Services          [Iniciar Sesión]  [🛒 Carrito] │
└─────────────────────────────────────────────────────────────┘

                    Film DTF Profesional
           Venta por metros. Entrega en 24-48 horas.

    Sube tu diseño, elige la cantidad de metros y recibe
             tu film DTF listo para aplicar.

┌──────────────────────────────────────────────────────────┐
│                  Calcula tu Pedido                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Cantidad de Metros                                      │
│  ┌───┐  ┌──────────┐  ┌───┐                           │
│  │ - │  │    5.0   │  │ + │                           │
│  └───┘  └──────────┘  └───┘                           │
│         Mínimo: 0.5m | Máximo: 100m                    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Precio por metro:           15.00 €            │    │
│  │ Subtotal (5.0m):            75.00 €            │    │
│  │ IVA (21%):                  15.75 €            │    │
│  │ Envío:                       5.00 €            │    │
│  │ ─────────────────────────────────────────      │    │
│  │ Total:                      95.75 €            │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │ 📤 Continuar y Subir Diseño                 │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ✓ Entrega en 24-48 horas                             │
│  ✓ Film DTF de alta calidad                           │
│  ✓ Listo para aplicar                                 │
└──────────────────────────────────────────────────────────┘

   ⚡️              ✓              💰
Entrega Rápida  Calidad Premium  Mejor Precio
```

---

## 🛒 CHECKOUT (/checkout)

```
┌─────────────────────────────────────────────────────────────┐
│ ← Volver                                                     │
│                                                              │
│ Finalizar Pedido                                            │
│ Completa tus datos y sube tu diseño                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────┐  ┌──────────────────────────┐
│  Datos de Contacto          │  │ Resumen del Pedido       │
│                             │  │                          │
│ Nombre Completo             │  │ Metros: 5.0m             │
│ [Juan Pérez            ]    │  │ Precio/metro: 15.00 €    │
│                             │  │ Subtotal: 75.00 €        │
│ Email            Teléfono   │  │ IVA (21%): 15.75 €       │
│ [juan@ej...]  [+34 600...] │  │ Envío: 5.00 €            │
└─────────────────────────────┘  │ ───────────────────      │
                                │ Total: 95.75 €           │
┌─────────────────────────────┐  │                          │
│  Dirección de Envío         │  │ ┌──────────────────────┐ │
│                             │  │ │ 💳 Realizar Pedido  │ │
│ Dirección                   │  │ └──────────────────────┘ │
│ [Calle Principal 123   ]    │  └──────────────────────────┘
│                             │
│ Ciudad          CP          │
│ [Madrid    ] [28001    ]    │
└─────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Archivo de Diseño                                   │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │          📤                                   │ │
│  │   Arrastra tu diseño o haz clic              │ │
│  │         para seleccionar                      │ │
│  │                                               │ │
│  │  Formatos: PNG, JPG, PDF, PSD, AI            │ │
│  │  Tamaño máximo: 50MB                         │ │
│  │                                               │ │
│  │  [ Seleccionar Archivo ]                     │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  📋 Recomendaciones:                               │
│  • Resolución mínima: 300 DPI                      │
│  • Formato vectorial preferible                    │
│  • Fondo transparente                              │
└─────────────────────────────────────────────────────┘
```

---

## ✅ CONFIRMACIÓN (/pedido/DTF-XXX)

```
                        ✓
                   ¡Pedido Realizado con Éxito!
           Hemos recibido tu pedido y comenzaremos
                 a procesarlo pronto

┌─────────────────────────────────────────────────────────────┐
│  Pedido DTF-1K2M3N4                    9 Oct 2025, 16:30   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Resumen del Pedido                                        │
│  ┌───────────────────────────────────────────────────┐    │
│  │ Metros solicitados:        5.0m                   │    │
│  │ Precio por metro:          15.00 €                │    │
│  │ Subtotal:                  75.00 €                │    │
│  │ IVA (21%):                 15.75 €                │    │
│  │ Envío:                      5.00 €                │    │
│  │ ──────────────────────────────────                │    │
│  │ Total:                     95.75 €                │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  Información de Contacto                                   │
│  ┌───────────────────────────────────────────────────┐    │
│  │ Nombre: Juan Pérez                                │    │
│  │ Email: juan@ejemplo.com                           │    │
│  │ Teléfono: +34 600 000 000                         │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  Archivo de Diseño                                         │
│  ┌───────────────────────────────────────────────────┐    │
│  │ diseño-logo.png         [ ⬇ Descargar ]          │    │
│  │ Archivo subido correctamente                      │    │
│  └───────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ¿Qué sigue?                                               │
│                                                             │
│  ① Confirmación por Email                                  │
│     Recibirás un email en juan@ejemplo.com                │
│                                                             │
│  ② Producción                                              │
│     Comenzaremos a producir tu film DTF                    │
│                                                             │
│  ③ Envío                                                   │
│     Recibirás tu pedido en 24-48 horas                    │
└─────────────────────────────────────────────────────────────┘

     [ 🏠 Volver al Inicio ]  [ ✉️ Contactar Soporte ]
```

---

## 🔐 LOGIN ADMIN (/auth/signin)

```
← Volver al Inicio

┌─────────────────────────────────────────┐
│         Iniciar Sesión                  │
│   Accede al panel de administración     │
├─────────────────────────────────────────┤
│                                         │
│ Email                                   │
│ [admin@dtf.com              ]           │
│                                         │
│ Contraseña                              │
│ [••••••••                   ]           │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │      Iniciar Sesión                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🔐 Credenciales de prueba:          │ │
│ │ Email: admin@dtf.com                │ │
│ │ Contraseña: admin123                │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

¿No tienes una cuenta? Contacta al administrador
```

---

## 📊 DASHBOARD ADMIN (/admin)

```
┌────────────────┬──────────────────────────────────────────────┐
│  DTF Print     │  Dashboard                                   │
│  Admin         │  Resumen general de tu negocio DTF           │
│  Panel de      │                                              │
│  Control       │  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│                │  │ 🛒   42  │ │ 💰 630€  │ │ 📦   5   │    │
│ ● Dashboard    │  │ Pedidos  │ │ Ingresos │ │ Pedidos  │    │
│                │  │ del Mes  │ │ del Mes  │ │ Pendien. │    │
│ ○ Pedidos      │  └──────────┘ └──────────┘ └──────────┘    │
│                │                                              │
│ ○ Usuarios     │  ┌──────────────────────────────────────┐  │
│                │  │ Pedidos Recientes                     │  │
│                │  ├──────────────────────────────────────┤  │
│ ─────────────  │  │ Número    Cliente   Metros   Total   │  │
│                │  │ DTF-1K2M  Juan P.   5.0m    95.75€   │  │
│ 🚪 Cerrar      │  │ DTF-3X4Y  María G.  3.5m    68.50€   │  │
│    Sesión      │  │ DTF-5Z6W  Pedro L.  10.0m   195.00€  │  │
│                │  └──────────────────────────────────────┘  │
└────────────────┴──────────────────────────────────────────────┘
```

---

## 📋 PEDIDOS ADMIN (/admin/pedidos)

```
┌────────────────┬──────────────────────────────────────────────┐
│  DTF Print     │  Pedidos                                     │
│  Admin         │  Gestiona todos los pedidos de film DTF      │
│                │                                              │
│                │  ┌────────────────────────────────────────┐  │
│ ● Dashboard    │  │ 🔍 [Buscar pedido...] [Todos]   │  │  │
│                │  └────────────────────────────────────────┘  │
│ ● Pedidos      │                                              │
│                │  ┌──────────────────────────────────────┐   │
│ ○ Usuarios     │  │ Lista de Pedidos (42)                 │   │
│                │  ├──────────────────────────────────────┤   │
│                │  │ Número   Cliente  Email  Metros Total│   │
│ ─────────────  │  │ DTF-1K2M Juan P.  juan@  5.0m  95€  │   │
│                │  │          [PENDING]  [PENDING]  👁 ⬇  │   │
│ 🚪 Cerrar      │  │                                       │   │
│    Sesión      │  │ DTF-3X4Y María G. maria@ 3.5m  68€  │   │
│                │  │          [SHIPPED]  [PAID]     👁 ⬇  │   │
└────────────────┴──────────────────────────────────────────────┘
```

---

## 🔍 DETALLE PEDIDO (/admin/pedidos/[id])

```
┌────────────────┬──────────────────────────────────────────────┐
│  DTF Print     │  ← Volver a Pedidos                          │
│  Admin         │                                              │
│                │  Pedido DTF-1K2M3N4                         │
│                │  Realizado el 9 Oct 2025, 16:30             │
│ ● Dashboard    │                                              │
│                │  ┌─────────────────────┬─────────────────┐  │
│ ● Pedidos      │  │ Detalles del Pedido │ Gestión         │  │
│                │  │                     │                 │  │
│ ○ Usuarios     │  │ Metros: 5.0m        │ Estado Pedido:  │  │
│                │  │ Precio/m: 15.00€    │ [IN_PRODUCTION▼]│  │
│ ─────────────  │  │                     │                 │  │
│                │  │ Subtotal: 75.00€    │ Estado Pago:    │  │
│ 🚪 Cerrar      │  │ IVA: 15.75€         │ [PAID       ▼] │  │
│    Sesión      │  │ Envío: 5.00€        │                 │  │
│                │  │ Total: 95.75€       │ Nº Tracking:    │  │
└────────────────┴──┤                     │ [123456789   ]  │  │
                   │ Archivo de Diseño   │                 │  │
                   │ ┌─────────────────┐ │ Notas Admin:    │  │
                   │ │ diseño-logo.png │ │ [            ]  │  │
                   │ │ [ ⬇ Descargar ] │ │ [            ]  │  │
                   │ └─────────────────┘ │                 │  │
                   │                     │ ┌─────────────┐ │  │
                   │ Cliente:            │ │💾 Guardar   │ │  │
                   │ Juan Pérez          │ └─────────────┘ │  │
                   │ juan@ejemplo.com    │                 │  │
                   │ +34 600 000 000     │                 │  │
                   └─────────────────────┴─────────────────┘
```

---

## 👥 USUARIOS ADMIN (/admin/usuarios)

```
┌────────────────┬──────────────────────────────────────────────┐
│  DTF Print     │  Usuarios                                    │
│  Admin         │  Lista de usuarios registrados               │
│                │                                              │
│                │  ┌────────────────────────────────────────┐  │
│ ● Dashboard    │  │ 🔍 [Buscar usuario...] [Todos]  │  │  │
│                │  └────────────────────────────────────────┘  │
│ ○ Pedidos      │                                              │
│                │  ┌──────────────────────────────────────┐   │
│ ● Usuarios     │  │ Lista de Usuarios (125)              │   │
│                │  ├──────────────────────────────────────┤   │
│ ─────────────  │  │ Nombre    Email     Pedidos   Fecha │   │
│                │  │                                       │   │
│ 🚪 Cerrar      │  │ 👤 Juan P. juan@e..    3    5 Oct   │   │
│    Sesión      │  │    [Cliente]                         │   │
│                │  │                                       │   │
└────────────────┴──│ 👤 María G maria@..   7    1 Oct    │   │
                   │    [Cliente]                         │   │
                   │                                       │   │
                   │ 👤 Admin   admin@..  --   15 Sep     │   │
                   │    [Admin]                           │   │
                   └──────────────────────────────────────┘
```

---

## 📱 RESPONSIVE (Mobile)

```
┌─────────────────────────┐
│ ☰  DTF Print    🛒      │
├─────────────────────────┤
│                         │
│   Film DTF Profesional  │
│                         │
│ Venta por metros        │
│ Entrega 24-48h          │
│                         │
│ ┌─────────────────────┐ │
│ │ Calcula tu Pedido   │ │
│ │                     │ │
│ │ Cantidad Metros     │ │
│ │  ▼   5.0   ▲       │ │
│ │                     │ │
│ │ Total: 95.75€       │ │
│ │                     │ │
│ │ [ Subir Diseño ]    │ │
│ └─────────────────────┘ │
│                         │
│   ⚡  ✓  💰            │
│ Rápido Calidad Precio  │
└─────────────────────────┘
```

---

## 🎨 Paleta de Colores

```
Primary (Naranja/Rojo):
  50:  #fef3f2
 100:  #fee5e2
 500:  #f15843  ← Principal
 600:  #de3b25
 900:  #80281c

Estados:
  Pending:    🟡 Amarillo
  Confirmed:  🔵 Azul
  Production: 🟣 Púrpura
  Shipped:    🟠 Naranja
  Delivered:  🟢 Verde
  Cancelled:  🔴 Rojo

Grises:
  50:  #f9fafb
 100:  #f3f4f6
 500:  #6b7280
 900:  #111827
```

---

## ✨ Animaciones y Efectos

- Hover en botones: Cambio de color suave
- Cards: Sombra al hover
- Inputs: Border azul al focus
- Drag & drop: Border punteado al arrastrar
- Badges: Colores según estado
- Transiciones: 200ms ease-in-out

---

## 📐 Tipografía

- **Fuente**: Inter (Google Fonts)
- **Títulos**:
  - H1: 3xl (1.875rem) bold
  - H2: 2xl (1.5rem) semibold
  - H3: xl (1.25rem) semibold
- **Cuerpo**: Base (1rem) regular
- **Small**: sm (0.875rem)

---

**Nota**: Estos son wireframes en texto ASCII. El diseño real usa Tailwind CSS con componentes React modernos y profesionales.
