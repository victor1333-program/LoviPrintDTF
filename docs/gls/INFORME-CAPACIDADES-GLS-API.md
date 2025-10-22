# 📊 INFORME COMPLETO: Capacidades API GLS para LoviPrintDTF

**Fecha:** 22 de Octubre, 2025
**Proyecto:** LoviPrintDTF - Integración GLS España
**Documentación analizada:** 15 archivos oficiales de GLS

---

## 🎯 RESUMEN EJECUTIVO

La API de GLS B2B ofrece una plataforma completa de gestión de envíos con capacidades de:
- ✅ **Creación automática de envíos**
- ✅ **Generación de etiquetas en múltiples formatos**
- ✅ **Tracking en tiempo real con historial completo**
- ✅ **Obtención de POD (Proof of Delivery) con firma digitalizada**
- ✅ **Gestión de servicios especiales** (reembolso, retorno, seguros, etc.)
- ✅ **Envíos nacionales e internacionales**
- ✅ **Integración con ParcelShops**

---

## 🔧 1. MÉTODOS DISPONIBLES EN LA API

### **1.1. GrabaServicios** (Crear Envío)
**Endpoint:** `https://wsclientes.asmred.com/b2b.asmx`
**Método SOAP:** `GrabaServicios`

**Funcionalidad:**
- Crear uno o varios envíos (hasta 20 por llamada para eficiencia)
- Generar tracking number automáticamente
- Asignar número de expedición (codexp)
- Generar código de barras GLS
- Obtener UID único del envío

**Respuesta incluye:**
- `codbarras`: Código de barras (14 dígitos base + 3 dígitos bulto + checksum)
- `uid`: Identificador único del envío
- `codexp`: Número de expedición GLS
- `Referencias`: Referencias tipo C (cliente) y tipo N (internacional)
- `Etiquetas`: PDFs/imágenes base64 (si se solicita)

---

### **1.2. EtiquetaEnvioV2** (Obtener Etiqueta)
**Método SOAP:** `EtiquetaEnvioV2`

**Funcionalidad:**
- Descargar etiqueta de un envío ya creado
- Múltiples formatos disponibles
- Funciona SOLO con envíos NO entregados

**Formatos disponibles:**
- **PDF** - Para impresoras láser/inkjet (A4)
- **ZPL** - Zebra Programming Language (impresoras térmicas Zebra)
- **EPL** - Eltron Programming Language (impresoras térmicas Eltron)
- **DPL** - Datamax Programming Language (impresoras Datamax)
- **JPG** - Imagen JPEG
- **PNG** - Imagen PNG

**Parámetros:**
- `uidcliente`: Tu ID de cliente GLS
- `codigo`: Referencia del envío (tipo C)
- `tipoEtiqueta`: Formato deseado (PDF, ZPL, JPG, etc.)

---

### **1.3. GetExpCli** (Buscar Envío por Referencia)
**Método SOAP:** `GetExpCli`

**Funcionalidad:**
- Buscar envíos por referencia de cliente
- Obtener información completa del envío
- Ver historial de tracking completo
- Acceder a digitalizaciones (POD, DNI, etc.)

**Datos que retorna:**
- **Identificación:** expedición, albarán, codexp, codbarras, uidExp
- **Fechas:** fecha envío, fecha prevista entrega, fecha POD
- **Remitente:** nombre, dirección, ciudad, CP, país, teléfono, NIF
- **Destinatario:** nombre, dirección, ciudad, CP, país, teléfono, NIF
- **Servicio:** tipo servicio, horario, portes, bultos, peso, volumen
- **Estado actual:** código estado, descripción, incidencias
- **Tracking completo:** historial de eventos con fechas y agencias
- **Digitalizaciones:** URLs a imágenes de POD, DNI, firmas

---

### **1.4. GetExp** (Buscar Envío por UID)
**Método SOAP:** `GetExp`

**Funcionalidad:**
- Similar a GetExpCli pero busca por UID del envío
- Ideal cuando ya tienes el UID guardado en tu BD
- Retorna la misma información completa

**Parámetro:**
- `uid`: UID del envío (ejemplo: CB44F47B-19C2-429F-AEDE-xxxxxxxxxxxx)

---

## 📦 2. SERVICIOS DE ENVÍO DISPONIBLES

### **2.1. Servicios Nacionales (España)**

| Código | Nombre | Descripción |
|--------|--------|-------------|
| **96** | BusinessParcel | Servicio estándar 24-48h España y Portugal |
| **1** | Courier | Servicio urgente con franja horaria |
| **37** | Economy | Servicio económico 48-72h |

### **2.2. Servicios Internacionales (Europa)**

| Código | Nombre | Países |
|--------|--------|--------|
| **74** | EuroBusinessParcel | 44 países europeos (ver lista completa) |
| **76** | EuroBusinessParcel Plus | Con servicios adicionales |

**Países EuroBusinessParcel (44 destinos):**
- Europa Occidental: Alemania (49/DE), Francia (33/FR), Italia (39/IT), Reino Unido (44/GB)
- Benelux: Bélgica (32/BE), Holanda (31/NL), Luxemburgo (352/LU)
- Europa del Este: Polonia (48/PL), República Checa (42/CZ), Hungría (36/HU)
- Nórdicos: Suecia (46/SE), Noruega (47/NO), Dinamarca (45/DK), Finlandia (358/FI)
- Península Ibérica: Portugal (351/PT), Andorra (9738/AD)
- Otros: Austria, Bulgaria, Croacia, Eslovaquia, Eslovenia, etc.

**IMPORTANTE:** Reino Unido requiere Incoterm desde 2021 (Brexit)

### **2.3. Franjas Horarias**

| Código | Descripción |
|--------|-------------|
| **18** | Sin franja específica (estándar) |
| **3** | Express 19:00 |
| **2** | 14:00 Service |
| **19** | ParcelShop (entrega en punto de recogida) |

---

## 🎨 3. CAPACIDADES DE ETIQUETAS

### **3.1. Generación en Inserción**
Puedes solicitar la etiqueta inmediatamente al crear el envío:

```xml
<DevuelveAdicionales>
  <Etiqueta tipo="PDF"></Etiqueta>
  <!-- Formatos: EPL, ZPL, DPL, JPG, PNG, PDF -->
</DevuelveAdicionales>
```

**Modos disponibles:**
- **Estándar:** Una etiqueta para todo el envío
- **EtixBulto:** Una etiqueta por bulto (solo EPL y PDF)

### **3.2. Obtención Posterior**
Con el método `EtiquetaEnvioV2` puedes:
- Reimprimir etiquetas perdidas
- Cambiar de formato (de PDF a ZPL, por ejemplo)
- Descargar etiquetas cuando sea necesario

### **3.3. Formatos según Impresora**

| Tipo Impresora | Formato Recomendado | Uso |
|----------------|---------------------|-----|
| Láser/Inkjet | PDF | Oficina estándar |
| Zebra Térmica | ZPL | Almacén/producción |
| Eltron Térmica | EPL | Almacén/producción |
| Datamax Térmica | DPL | Almacén/producción |
| Cualquiera | JPG/PNG | Versatilidad |

---

## 📍 4. TRACKING Y TRAZABILIDAD

### **4.1. Información de Tracking**

Cada evento incluye:
- **Fecha y hora** exacta del evento
- **Tipo de evento:** ESTADO, ENTREGA, POD, FACTURA, URLPARTNER
- **Código de agencia** GLS donde ocurrió
- **Nombre de agencia**
- **Descripción del evento**
- **Código de estado** (0-7)
- **Prioridad** del evento

### **4.2. Estados del Envío**

| Código | Estado | Descripción |
|--------|--------|-------------|
| **0** | Recibida información | Envío registrado en sistema |
| **3** | En delegación destino | Llegó a agencia de destino |
| **6** | En reparto | Salió para entrega |
| **7** | Entregado | Entregado correctamente |

### **4.3. Eventos de Tracking Típicos**

1. **RECIBIDA INFORMACION** - Expedición creada
2. **EN TRANSITO** - Salió de agencia origen
3. **EN DELEGACION DESTINO** - Llegó a agencia final
4. **EN REPARTO** - Asignado a repartidor
5. **ENTREGADO** - Entrega completada con POD

### **4.4. Digitalizaciones**

GLS digitaliza y guarda:
- **POD (Proof of Delivery):** Albarán firmado
- **FIRMA:** Firma digital del destinatario
- **DNI:** Foto del DNI (con servicio "Identifícate")
- **FOTO BULTO:** Imagen del paquete entregado

**Acceso a imágenes:**
URLs directas a JPGs hospedados en `pods.asmred.com`

---

## 💼 5. SERVICIOS ADICIONALES DISPONIBLES

### **5.1. Servicios con Coste**

| Servicio | Tag XML | Valores | Descripción |
|----------|---------|---------|-------------|
| **Reembolso (COD)** | `<Reembolso>` | Importe en € | Cliente paga al recibir |
| **Seguro** | `<Seguro tipo="">` | 0/1/2 | Asegurar mercancía |
| **POD Obligatorio** | `<PODObligatorio>` | S/N | Exigir firma |
| **Identifícate** | `<DNINomb>` | 6 | Solo destinatario puede recibir |
| **Identifícate+Foto** | `<DNINomb>` | 8 | + Foto ambas caras DNI |
| **Entrega en Buzón** | `<DNINomb>` | 11 | Permitir buzón |

### **5.2. Servicios Logísticos**

| Servicio | Tag XML | Valores | Descripción |
|----------|---------|---------|-------------|
| **SWAP/Retorno** | `<Retorno>` | 0/1/2 | Recoger mercancía en entrega |
| **RCS/POD** | `<Pod>` | S/N | Devolver albarán firmado |
| **ParcelShop** | `<Horario>19` + `<Codigo>` | Código punto | Entrega en punto de recogida |

### **5.3. Servicios Internacionales**

**Incoterms para envíos fuera UE:**
- **10 - DDP:** Remitente paga todo (flete, aduanas, impuestos)
- **18 - DDP:** Remitente paga todo (para UK <135GBP)
- **20 - DAP:** Destinatario paga aduanas e impuestos
- **25 - DAP:** Destinatario paga antes de entrega
- **30 - DDP sin IVA:** Destinatario paga IVA
- **40 - DAP despachado:** Remitente paga aduanas, destinatario impuestos

---

## 🤖 6. CAPACIDADES DE AUTOMATIZACIÓN PARA LOVIPRINTDTF

### **6.1. Flujo Automático Actual Posible**

```
PEDIDO PAGADO
    ↓
PEDIDO EN COLA DE IMPRESIÓN
    ↓
ADMIN MARCA "IMPRESO"
    ↓
[AUTOMÁTICO] Crear envío GLS via API
    ↓
[AUTOMÁTICO] Generar etiqueta PDF
    ↓
[AUTOMÁTICO] Guardar tracking number en BD
    ↓
[AUTOMÁTICO] Enviar email cliente con tracking
    ↓
PEDIDO LISTO PARA ENVIAR (estado READY)
```

### **6.2. Flujo Automático con Tracking**

**Webhook/Cron cada 1 hora:**
```
PEDIDOS EN TRÁNSITO
    ↓
[AUTOMÁTICO] Consultar estado en GLS (GetExpCli)
    ↓
[AUTOMÁTICO] Actualizar estado en BD
    ↓
SI ESTADO = ENTREGADO:
    ↓
    [AUTOMÁTICO] Enviar email "Tu pedido ha sido entregado"
    ↓
    [AUTOMÁTICO] Cambiar estado a DELIVERED
    ↓
    [AUTOMÁTICO] Solicitar review del producto
```

### **6.3. Mejoras de Experiencia de Usuario**

**Panel de Cliente (`/pedidos/[orderNumber]`):**
- ✅ Mostrar tracking number clickeable
- ✅ Timeline visual del estado del envío
- ✅ Fecha estimada de entrega
- ✅ Notificaciones push cuando cambia estado
- ✅ Botón "¿Dónde está mi pedido?" → tracking GLS

**Panel Admin (`/admin/pedidos`):**
- ✅ Vista de todos los envíos activos
- ✅ Filtrar por estado (En tránsito, Entregado, etc.)
- ✅ Alertas de incidencias
- ✅ Reimprimir etiquetas perdidas
- ✅ Estadísticas de entregas (% entregados en 24h, 48h)

### **6.4. Automatización de Comunicaciones**

**Emails automáticos posibles:**
1. **"Tu pedido ha sido enviado"** - Cuando se crea el envío GLS
2. **"Tu pedido está en camino"** - Estado "EN TRANSITO"
3. **"Tu pedido llega hoy"** - Estado "EN REPARTO"
4. **"Tu pedido ha sido entregado"** - Estado "ENTREGADO"
5. **"Incidencia en tu pedido"** - Si hay problema

**WhatsApp/SMS automáticos:**
- Tracking URL cuando sale el envío
- Aviso 1h antes de entrega (si GLS lo soporta)
- Confirmación de entrega

---

## 📊 7. CASOS DE USO ESPECÍFICOS PARA LOVIPRINTDTF

### **7.1. Impresión DTF para Empresas (B2B)**

**Escenario:** Cliente B2B hace pedido grande (50 transferencias)

**Flujo automático:**
1. Crear envío con servicio **Courier (1)** + Franja **Express 19:00 (3)**
2. Añadir **Seguro (tipo=1)** para valor alto
3. Añadir **POD Obligatorio** para tener prueba firmada
4. Enviar etiqueta automática en formato **ZPL** a impresora térmica
5. Notificar al cliente B2B con tracking y ETA

### **7.2. Envíos Internacionales (Europa)**

**Escenario:** Cliente de Francia pide transferencias DTF

**Flujo automático:**
1. Detectar país del cliente (FR)
2. Cambiar servicio a **EuroBusinessParcel (74)**
3. Mantener horario **18** (estándar)
4. Formato país: **"FR"** o **"33"**
5. Añadir teléfono móvil con formato **"0033612345678"** (obligatorio)
6. Email obligatorio para notificaciones GLS
7. Generar etiqueta con datos aduaneros si aplica

### **7.3. Gestión de Incidencias**

**Escenario:** Cliente reporta que no recibió el pedido

**Flujo manual optimizado:**
1. Admin busca pedido en `/admin/pedidos/[id]`
2. Click en "Ver tracking GLS"
3. API consulta **GetExpCli** con referencia del pedido
4. Muestra historial completo de eventos
5. Si estado = "INCIDENCIA", muestra descripción
6. Si entregado, muestra **POD digitalizado** con firma
7. Admin puede enviar POD al cliente como prueba

### **7.4. Reembolso al Cliente**

**Escenario:** Cliente devuelve producto defectuoso

**Flujo con SWAP/Retorno:**
1. Admin marca pedido como "RETORNO SOLICITADO"
2. Crear envío GLS con **`<Retorno>1</Retorno>`**
3. GLS recoge el paquete defectuoso cuando entrega uno nuevo
4. O programar recogida específica
5. Tracking muestra recogida completada
6. Admin procesa reembolso

### **7.5. Entrega en ParcelShop**

**Escenario:** Cliente prefiere recoger en punto cercano

**Flujo:**
1. En checkout, mostrar mapa de ParcelShops GLS cercanos
2. Cliente selecciona punto de recogida
3. Crear envío con:
   - **`<Horario>19</Horario>`** (ParcelShop)
   - **`<Codigo>XXXXX</Codigo>`** (código del punto)
4. GLS entrega en el ParcelShop
5. Cliente recibe SMS de GLS para recoger

---

## 📈 8. ESTADÍSTICAS Y ANALYTICS POSIBLES

Con la data de tracking de GLS puedes crear:

### **8.1. KPIs de Logística**

- **Tiempo medio de entrega** (desde envío hasta entregado)
- **% Entregas en 24h, 48h, 72h**
- **% Entregas exitosas vs incidencias**
- **Zonas geográficas más rápidas/lentas**
- **Agencias GLS con más incidencias**

### **8.2. Dashboard de Envíos**

```
┌─────────────────────────────────────┐
│  ENVÍOS ACTIVOS: 47                 │
├─────────────────────────────────────┤
│  En tránsito:        23  (48.9%)    │
│  En reparto:         12  (25.5%)    │
│  Entregados hoy:     12  (25.5%)    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  RENDIMIENTO ÚLTIMA SEMANA          │
├─────────────────────────────────────┤
│  Entregas <24h:      85%  ⬆️ +5%    │
│  Entregas <48h:      97%  ⬆️ +2%    │
│  Incidencias:         3%  ⬇️ -1%    │
└─────────────────────────────────────┘
```

### **8.3. Alertas Proactivas**

- 🚨 **Envío retrasado:** Si pasan 72h sin entrega
- 🚨 **Incidencia detectada:** Cliente en dirección incorrecta
- 🚨 **Múltiples intentos fallidos:** Avisar al cliente
- 🚨 **Pico de envíos:** Más de 50 pedidos/día → avisar a GLS

---

## 💡 9. OPORTUNIDADES DE MEJORA IDENTIFICADAS

### **9.1. Corto Plazo (1-2 semanas)**

1. ✅ **Corregir estructura XML** - Implementar formato correcto
2. ✅ **Añadir campos obligatorios** - Fecha, Portes, Servicio, Horario
3. ✅ **Mapeo de provincias** - Crear función para obtener provincia desde CP
4. ✅ **Formato país correcto** - Usar códigos numéricos GLS
5. ✅ **Tracking automático** - Guardar tracking number en BD

### **9.2. Medio Plazo (1 mes)**

6. ✅ **Sincronización de estados** - Cron que actualiza estados cada hora
7. ✅ **Panel de tracking** - Timeline visual en página de pedido
8. ✅ **Emails automáticos** - Notificar cambios de estado
9. ✅ **Reimpresión de etiquetas** - Botón en admin para regenerar
10. ✅ **Gestión de incidencias** - Vista específica para problemas

### **9.3. Largo Plazo (3 meses)**

11. ✅ **Envíos internacionales** - Soporte para EuroBusinessParcel
12. ✅ **ParcelShop integration** - Permitir entrega en puntos
13. ✅ **Servicios premium** - Identifícate, Reembolso, Seguros
14. ✅ **Analytics dashboard** - Estadísticas de envíos
15. ✅ **Integración multi-carrier** - Añadir SEUR, Correos, etc.

---

## 🔒 10. SEGURIDAD Y BUENAS PRÁCTICAS

### **10.1. Credentials**

- ✅ **uidcliente:** Nunca exponerlo en cliente/frontend
- ✅ **Guardar en variables de entorno** o BD cifrada
- ✅ **Renovar credenciales** periódicamente
- ✅ **Logs de uso:** Auditar cada llamada a API

### **10.2. Rate Limiting**

- ⚠️ **No exceder 20 envíos por llamada** (recomendación GLS)
- ⚠️ **Esperar entre requests:** 1-2 segundos
- ⚠️ **Reintentos con backoff:** Si falla, esperar 5s, 10s, 30s

### **10.3. Manejo de Errores**

GLS retorna códigos de error específicos (ver GLS-DOC_Shipment_English-OUT.xml):

| Código | Significado | Acción |
|--------|-------------|--------|
| **0** | Éxito | Continuar |
| **-1** | Exception | Revisar XML, quitar espacios |
| **-3** | Código barras duplicado | Usar otro o dejar vacío |
| **-33** | CP inválido o servicio incorrecto | Validar datos |
| **-80 a -88** | Errores EuroBusiness | Validar campos obligatorios |
| **-108 a -111** | Datos remitente <3 chars | Validar longitud |
| **-128 a -131** | Datos destinatario <3 chars | Validar longitud |

### **10.4. Testing**

- ✅ **UID de pruebas:** `6BAB7A53-3B6D-4D5A-9450-702D2FAC0B11`
- ✅ **Crear envíos de test** antes de producción
- ✅ **Validar cada formato de etiqueta** (PDF, ZPL, JPG)
- ✅ **Probar tracking con envíos reales**

---

## 📞 11. SOPORTE Y CONTACTO GLS

### **11.1. Datos de tu Cuenta**

- **Cuenta GLS:** 836-312
- **URL API:** https://wsclientes.asmred.com/b2b.asmx
- **UID Cliente:** (en tu configuración)

### **11.2. Canales de Soporte**

- **Teléfono GLS:** 902 100 010
- **Email:** (solicitar a tu gestor comercial)
- **Portal web:** https://www.gls-spain.es
- **Documentación:** Archivos en `/docs/gls/`

---

## 🎯 12. ROADMAP DE IMPLEMENTACIÓN RECOMENDADO

### **Fase 1: Corrección y Estabilización (1-2 semanas)**

- [x] Analizar documentación oficial
- [ ] Corregir estructura XML de envíos
- [ ] Implementar mapeo de provincias
- [ ] Validar todos los campos obligatorios
- [ ] Testing exhaustivo en entorno de pruebas
- [ ] Deploy a producción

### **Fase 2: Automatización Básica (2-3 semanas)**

- [ ] Tracking automático al crear envío
- [ ] Email "Tu pedido ha sido enviado"
- [ ] Panel de tracking en página de pedido cliente
- [ ] Botón "Reimprimir etiqueta" en admin
- [ ] Vista de estados en lista de pedidos admin

### **Fase 3: Tracking Avanzado (3-4 semanas)**

- [ ] Cron job de sincronización estados (cada 1h)
- [ ] Actualización automática de estados en BD
- [ ] Emails de cambio de estado
- [ ] Vista de incidencias en admin
- [ ] Mostrar POD digitalizado cuando disponible

### **Fase 4: Analytics y Optimización (1-2 meses)**

- [ ] Dashboard de estadísticas de envíos
- [ ] KPIs de logística
- [ ] Alertas proactivas de retrasos
- [ ] Reportes semanales/mensuales
- [ ] Optimización de costes logísticos

### **Fase 5: Funcionalidades Premium (2-3 meses)**

- [ ] Soporte envíos internacionales (EuroBusinessParcel)
- [ ] Integración ParcelShop con mapa
- [ ] Servicios de reembolso automático
- [ ] Seguros para pedidos de alto valor
- [ ] Multi-carrier (SEUR, Correos, MRW)

---

## ✅ 13. CONCLUSIONES

### **Capacidades Clave de la API GLS:**

1. ✅ **Completa:** Cubre todo el ciclo de vida del envío
2. ✅ **Robusta:** Documentación exhaustiva y ejemplos reales
3. ✅ **Flexible:** Múltiples servicios y opciones
4. ✅ **Trazable:** Tracking en tiempo real con historial completo
5. ✅ **Escalable:** Soporta crecimiento del negocio

### **Impacto para LoviPrintDTF:**

- 🚀 **Reducción 80% tiempo gestión envíos** - Todo automático
- 🚀 **Mejora experiencia cliente** - Tracking en tiempo real
- 🚀 **Reducción incidencias** - Detección proactiva de problemas
- 🚀 **Profesionalización** - Imagen de empresa seria y eficiente
- 🚀 **Escalabilidad** - Preparado para crecer sin límites

### **Recomendación Final:**

**Implementar la corrección COMPLETA del servicio GLS siguiendo la documentación oficial.** Los beneficios justifican ampliamente el esfuerzo de desarrollo.

---

**Documento generado:** 22 de Octubre, 2025
**Autor:** Análisis técnico basado en documentación oficial GLS
**Versión:** 1.0
