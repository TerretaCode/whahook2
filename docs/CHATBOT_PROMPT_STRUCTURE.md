# Configuración del Chatbot - Diseño de UI

## Filosofía de Diseño

- **Mínimos clicks** - Todo accesible sin navegar
- **Visual y limpio** - Cards con iconos claros
- **Progresivo** - Solo muestra lo relevante
- **Sin fricción** - Valores por defecto inteligentes

---

## ESTRUCTURA FINAL

La configuración se divide en **una sola página con secciones colapsables**.
El usuario ve todo de un vistazo y expande solo lo que necesita.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ⚙️ CONFIGURACIÓN DEL CHATBOT                              [Guardar 💾] │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🤖 TU BOT                                                       │   │
│  │                                                                 │   │
│  │  Nombre                    Tono                                 │   │
│  │  [Asistente          ]     [Profesional         ▼]             │   │
│  │                                                                 │   │
│  │  💡 El bot responde automáticamente en el idioma del cliente   │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🏢 TU NEGOCIO                                          [▼ Abrir]│   │
│  │                                                                 │   │
│  │  Nombre del negocio *        Descripción breve *                │   │
│  │  [Beliór Cosmetics      ]    [Marca española de cosmética     ]│   │
│  │                              [natural con +20 años...         ]│   │
│  │                                                                 │   │
│  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │   │
│  │                                                                 │   │
│  │  📞 Contacto                 📋 Políticas                       │   │
│  │  Email: [info@belior.com ]   Envío: [Gratis +50€, 24-48h    ]  │   │
│  │  Tel:   [+34 900 123 456]    Devoluciones: [30 días         ]  │   │
│  │  Web:   [belior.com      ]   Pagos: [Tarjeta, PayPal, Bizum ]  │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🛒 PRODUCTOS                                                    │   │
│  │                                                                 │   │
│  │  ┌───────────────────────────────────────────────────────────┐ │   │
│  │  │  ¿Quieres que el bot recomiende productos?                │ │   │
│  │  │                                                           │ │   │
│  │  │  (●) Sí, tengo productos      ( ) No, solo informativo    │ │   │
│  │  └───────────────────────────────────────────────────────────┘ │   │
│  │                                                                 │   │
│  │  ═══════════════════════════════════════════════════════════   │   │
│  │                                                                 │   │
│  │  📊 47 productos · 3 categorías                    [Ver todos]│   │
│  │                                                                 │   │
│  │  ┌─────────────────┐ ┌─────────────┐ ┌─────────────┐          │   │
│  │  │ 🔗 API          │ │ 📄 CSV      │ │ ✏️ Manual   │          │   │
│  │  │ 32 prod.        │ │ 10 prod.    │ │ 5 prod.     │          │   │
│  │  │ WooCommerce     │ │             │ │             │          │   │
│  │  │ [🔄 Sincronizar]│ │ [Importar]  │ │ [+ Añadir]  │          │   │
│  │  │ Última: hace 2h │ │             │ │             │          │   │
│  │  └─────────────────┘ └─────────────┘ └─────────────┘          │   │
│  │                                                                 │   │
│  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │   │
│  │                                                                 │   │
│  │  📂 CATEGORÍAS Y PREGUNTAS DE FILTRADO                          │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │                                                          │  │   │
│  │  │  ▼ FACIAL · 12 prod                                      │  │   │
│  │  │                                                          │  │   │
│  │  │    Subcategorías (para filtrar):                         │  │   │
│  │  │    ┌────────┐┌────────┐┌──────────┐┌───┐                │  │   │
│  │  │    │Hidratante││Antiedad││Limpiadores││ + │                │  │   │
│  │  │    └────────┘└────────┘└──────────┘└───┘                │  │   │
│  │  │                                                          │  │   │
│  │  │    ❓ Preguntas para recomendar:        Máx: [2  ]        │  │   │
│  │  │    1. [¿Qué tipo de piel tienes?                    ] 🗑️│  │   │
│  │  │    2. [¿Cuál es tu objetivo? (hidratar, antiarrugas)]🗑️│  │   │
│  │  │    3. [¿Tienes alguna alergia o sensibilidad?       ]🗑️│  │   │
│  │  │    4. [¿Prefieres textura ligera o rica?            ]🗑️│  │   │
│  │  │    [+ Añadir pregunta]                                   │  │   │
│  │  │                                                          │  │   │
│  │  │    💡 Tienes 4 preguntas. La IA elegirá las 2 mejores    │  │   │
│  │  │       según el contexto de la conversación.              │  │   │
│  │  │                                                          │  │   │
│  │  │    📝 Reglas especiales (opcional):                      │  │   │
│  │  │    [Retinol solo nocturno. Vit C solo mañana.       ]   │  │   │
│  │  │                                                          │  │   │
│  │  │  ▶ CORPORAL · 8 prod                                     │  │   │
│  │  │  ▶ CAPILAR · 5 prod                                      │  │   │
│  │  │                                                          │  │   │
│  │  │  [+ Nueva categoría]                                     │  │   │
│  │  │                                                          │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │                                                                 │   │
│  │  💡 El bot preguntará la categoría primero, luego las          │   │
│  │     preguntas de esa categoría para filtrar productos.         │   │
│  │                                                                 │   │
│  │  📋 Al recomendar incluir:                                     │   │
│  │  [✓] Nombre  [✓] Precio  [✓] Beneficios  [ ] Ingredientes     │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 💬 CONVERSACIÓN                                        [▼ Abrir]│   │
│  │                                                                 │   │
│  │  Mensaje de bienvenida                                          │   │
│  │  [¡Hola! Soy el asistente de Beliór. ¿En qué puedo ayudarte?]  │   │
│  │                                                                 │   │
│  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │   │
│  │                                                                 │   │
│  │  ❓ FAQs (el bot responderá automáticamente)                    │   │
│  │  ┌────────────────────────────────────────────────────────┐    │   │
│  │  │ P: ¿Hacéis envíos internacionales?                     │    │   │
│  │  │ R: Sí, enviamos a toda Europa. Consulta gastos en web. │    │   │
│  │  ├────────────────────────────────────────────────────────┤    │   │
│  │  │ P: ¿Los productos son veganos?                         │    │   │
│  │  │ R: Sí, todos nuestros productos son 100% veganos.      │    │   │
│  │  └────────────────────────────────────────────────────────┘    │   │
│  │  [+ Añadir FAQ]                                                │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🚨 ESCALACIÓN                                          [▼ Abrir]│   │
│  │                                                                 │   │
│  │  Pasar a humano cuando:                                         │   │
│  │  [✓] Cliente pide hablar con persona                           │   │
│  │  [✓] Queja o reclamación                                       │   │
│  │  [✓] Problema con pedido                                       │   │
│  │  [ ] Después de X mensajes sin resolver: [3  ]                 │   │
│  │  [+ Añadir motivo personalizado]                               │   │
│  │                                                                 │   │
│  │  Mensaje al escalar:                                            │   │
│  │  [Te paso con un compañero que te ayudará mejor. Un momento.]  │   │
│  │                                                                 │   │
│  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │   │
│  │                                                                 │   │
│  │  📋 Información a recopilar del cliente:                        │   │
│  │  [✓] Nombre completo                                           │   │
│  │  [✓] Email                                                     │   │
│  │  [✓] Teléfono                                                  │   │
│  │  [ ] Número de pedido                                          │   │
│  │  [ ] Empresa                                                   │   │
│  │  [+ Añadir campo personalizado]                                │   │
│  │                                                                 │   │
│  │  📞 ¿Cómo prefiere ser contactado?                              │   │
│  │  [✓] Preguntar al cliente su preferencia                       │   │
│  │                                                                 │   │
│  │  Opciones disponibles:                                          │   │
│  │  [✓] WhatsApp (este chat)                                      │   │
│  │  [✓] Llamada telefónica                                        │   │
│  │  [✓] Email                                                     │   │
│  │  [ ] Otro número de WhatsApp                                   │   │
│  │  [+ Añadir método]                                             │   │
│  │                                                                 │   │
│  │  💡 Esta info se guarda en la ficha del cliente (CRM)          │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ➕ INFORMACIÓN ADICIONAL                               [▼ Abrir]│   │
│  │                                                                 │   │
│  │  Cualquier otra cosa que el bot deba saber:                     │   │
│  │  ┌───────────────────────────────────────────────────────────┐ │   │
│  │  │ Tenemos promoción 2x1 en solares hasta fin de mes.        │ │   │
│  │  │ Los martes hay 10% descuento para nuevos clientes.        │ │   │
│  │  │ No vendemos a menores de 18 años productos con retinol.   │ │   │
│  │  └───────────────────────────────────────────────────────────┘ │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Modal: Ver Todos los Productos

Al hacer click en [Ver todos] se abre un modal/drawer con la lista completa de productos.
**TODOS los productos son editables**, sin importar su origen (API, CSV o Manual).

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📦 TODOS LOS PRODUCTOS                                           [✕]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🔍 Buscar...                    Filtrar: [Todos ▼] [Todas categorías ▼]│
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Nombre              │ Categoría │ Precio  │ Origen │ Acciones     │ │
│  ├─────────────────────┼───────────┼─────────┼────────┼──────────────┤ │
│  │ Crema Hidratante    │ Facial    │ 29.99€  │ 🔗 API │ [✏️] [🗑️]   │ │
│  │ Sérum Vitamina C    │ Facial    │ 45.00€  │ 🔗 API │ [✏️] [🗑️]   │ │
│  │ Contorno de Ojos    │ Facial    │ 38.50€  │ 📄 CSV │ [✏️] [🗑️]   │ │
│  │ Mascarilla Especial │ Facial    │ 25.00€  │ ✏️ Man │ [✏️] [🗑️]   │ │
│  │ Body Lotion         │ Corporal  │ 19.99€  │ 🔗 API │ [✏️] [🗑️]   │ │
│  │ Aceite Corporal     │ Corporal  │ 32.00€  │ 📄 CSV │ [✏️] [🗑️]   │ │
│  │ ...                 │           │         │        │              │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Mostrando 47 productos                              [+ Añadir producto]│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Editar Producto (Modal)

Al hacer click en [✏️] se abre el formulario de edición:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ✏️ EDITAR PRODUCTO                                               [✕]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ⚠️ Origen: API (WooCommerce)                                          │
│  Los cambios aquí NO se reflejan en tu tienda. Solo afectan al bot.    │
│                                                                         │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                                         │
│  Nombre *                          Precio *                             │
│  [Crema Hidratante Premium    ]    [29.99] €                           │
│                                                                         │
│  Categoría              Subcategoría                                    │
│  [Facial          ▼]    [Hidratante      ▼]                            │
│                                                                         │
│  Descripción                                                            │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Crema hidratante con ácido hialurónico para pieles secas.        │ │
│  │ Uso diario, mañana y noche.                                       │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Beneficios (separados por coma)                                        │
│  [Hidratación 24h, Sin parabenos, Vegano, Apto pieles sensibles    ]   │
│                                                                         │
│  URL del producto                                                       │
│  [https://belior.com/crema-hidratante                              ]   │
│                                                                         │
│  ▼ Campos adicionales                                                   │
│    Ingredientes: [Aqua, Hyaluronic Acid, Glycerin...               ]   │
│    Modo de uso:  [Aplicar mañana y noche sobre rostro limpio       ]   │
│                                                                         │
│                                        [Cancelar]  [💾 Guardar cambios] │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Notas sobre edición:

- **Productos API**: Se pueden editar localmente. Los cambios solo afectan al bot, no a la tienda original. Al sincronizar, se mantienen las ediciones locales a menos que el usuario elija "Restaurar original".
- **Productos CSV**: Editables sin restricción.
- **Productos Manual**: Editables sin restricción.

---

## Secciones de la UI

### 🤖 TU BOT
Siempre visible. Campos: Nombre y Tono.
El bot detecta automáticamente el idioma del cliente y responde en ese idioma.

### 🏢 TU NEGOCIO  
Colapsable. Contiene:
- Nombre y descripción del negocio
- Contacto (email, tel, web)
- Políticas (envío, devoluciones, pagos)

### 🛒 PRODUCTOS
Solo visible si elige "Sí, tengo productos". Contiene:
- **Botón [Ver todos]**: Abre modal con lista completa de productos (todos editables)
- **3 cards de fuentes**:
  - **API**: Muestra conexión activa + botón [🔄 Sincronizar] + última sincronización
  - **CSV**: Botón [Importar] para cargar archivo
  - **Manual**: Botón [+ Añadir] para crear producto
- **Categorías expandibles**: Cada categoría contiene:
  - Subcategorías (tags para filtrar)
  - Preguntas de filtrado (ilimitadas, el usuario añade las que quiera)
  - Máximo de preguntas (input libre - la IA elige las mejores según contexto)
  - Reglas especiales (opcional)
- **Formato de recomendación**: Checkboxes de qué incluir al recomendar

**Sincronización API**:
- Al pulsar [🔄 Sincronizar] se vuelven a extraer todos los productos de la tienda
- Productos nuevos se añaden, eliminados se quitan, modificados se actualizan
- Las ediciones locales del usuario se mantienen (marcadas como "editado localmente")

**Flujo de preguntas de filtrado**:
```
Cliente: "Quiero una crema"
    ↓
Bot detecta que no sabe la categoría
    ↓
Bot: "¿Para qué zona la necesitas? (facial, corporal, capilar)"
    ↓
Cliente: "Para la cara"
    ↓
Bot usa las preguntas configuradas para FACIAL:
    ↓
Bot: "¿Qué tipo de piel tienes?"
Cliente: "Mixta"
    ↓
Bot: "¿Cuál es tu objetivo principal?"
Cliente: "Hidratación"
    ↓
Bot filtra productos: FACIAL + Hidratante + piel mixta
    ↓
Bot recomienda productos relevantes
```

Las preguntas son 100% personalizables. Ejemplos por tipo de negocio:
- **Cosmética**: Tipo de piel, objetivo, edad
- **Motos**: Cilindrada, uso (ciudad/carretera), presupuesto
- **Ropa**: Talla, ocasión, estilo preferido
- **Tecnología**: Uso principal, presupuesto, marca preferida

### � CONVERSACIÓN
Colapsable. Contiene:
- Mensaje de bienvenida
- FAQs (pregunta/respuesta)

### 🚨 ESCALACIÓN
Colapsable. Contiene:
- **Motivos de escalación**: Checkboxes predefinidos + personalizables
- **Mensaje al escalar**: Texto que verá el cliente
- **Información a recopilar**: Campos que el bot pedirá (nombre, email, teléfono, etc.)
- **Método de contacto preferido**: El bot pregunta cómo prefiere ser contactado

Toda la información recopilada se guarda automáticamente en la ficha del cliente (CRM).

### ➕ INFORMACIÓN ADICIONAL
Colapsable. Textarea libre para promociones, reglas especiales, etc.

---

## Modelo de Datos

```typescript
interface ChatbotConfig {
  // Bot
  bot_name: string
  tone: string  // 'profesional' | 'amigable' | 'formal' | 'casual'
  // Nota: No hay campo de idioma - el bot detecta automáticamente el idioma del cliente
  
  // Negocio
  business_name: string
  business_description: string
  contact: { email?: string, phone?: string, website?: string }
  policies: { shipping?: string, returns?: string, payments?: string }
  
  // Productos
  recommend_products: boolean
  ecommerce_connection_ids: string[]
  categories: Category[]
  recommendation_format: string[]  // ['name', 'price', 'benefits', ...]
  
  // Conversación
  welcome_message: string
  faqs: { question: string, answer: string }[]
  
  // Escalación
  escalation_triggers: string[]
  custom_escalation_triggers: string[]
  escalation_after_messages?: number      // Escalar después de X mensajes sin resolver
  escalation_message: string
  
  // Información a recopilar
  info_fields_to_collect: string[]        // ['name', 'email', 'phone', 'order_number', ...]
  custom_info_fields: string[]            // Campos personalizados
  ask_contact_preference: boolean         // Preguntar cómo prefiere ser contactado
  contact_methods_available: string[]     // ['whatsapp', 'call', 'email', 'other_whatsapp', ...]
  
  // Adicional
  additional_info: string
}

interface Category {
  name: string
  subcategories: string[]           // Tags para filtrar (Hidratante, Antiedad...)
  questions: string[]               // Preguntas ilimitadas - el usuario añade las que quiera
  max_questions: number             // Máximo a preguntar - la IA elige las mejores
  rules?: string                    // Reglas especiales (opcional)
  product_count: number             // Calculado automáticamente
}

// Ejemplo: Usuario configura 30 preguntas pero pone máximo 2
// → La IA analiza la conversación y elige las 2 más relevantes
// → Si el cliente ya dijo "tengo piel seca", la IA no preguntará tipo de piel
// → La IA es inteligente y adapta las preguntas al contexto

interface Product {
  id: string
  source: 'api' | 'csv' | 'manual'
  name: string
  category: string
  subcategory?: string
  price: number
  description?: string
  benefits?: string[]
  url?: string
}
```

---

## Próximos Pasos

1. [ ] Implementar nueva UI en `Prompt2ConfigTab`
2. [ ] Crear componentes: `ProductSourceCard`, `CategoryAccordion`, `FAQList`
3. [ ] Crear `CSVImporter` con drag & drop
4. [ ] Crear `ManualProductForm` modal
5. [ ] Crear tabla `chatbot_products` en Supabase
6. [ ] Endpoint para importar CSV
