# Estructura de Configuración del Chatbot - Documento de Diseño

## Resumen Ejecutivo

Este documento define la estructura óptima para la configuración del chatbot, considerando 2 modos principales:

1. **Modo E-commerce** - El bot recomienda productos (con fuentes combinables)
2. **Modo Informacional** - Solo información del negocio, sin productos

### Fuentes de Productos (Combinables)

Cuando el usuario elige Modo E-commerce, puede **combinar** cualquiera de estas fuentes:

| Fuente | Descripción | Uso típico |
|--------|-------------|------------|
| **API** | Sincronización automática con tienda | Catálogo principal |
| **CSV** | Importación masiva desde archivo | Carga inicial o actualizaciones bulk |
| **Manual** | Entrada producto por producto | Productos especiales, ediciones, nuevos productos |

**Ejemplos de combinaciones:**
- API + Manual → Catálogo sincronizado + productos exclusivos no en web
- CSV + Manual → Importación inicial + editar/añadir productos sin re-subir CSV
- API + CSV + Manual → Máxima flexibilidad

---

## Principio de Diseño: Progressive Disclosure

Usaremos **Progressive Disclosure** (revelación progresiva) para:
- Mostrar solo lo relevante según el caso de uso seleccionado
- Reducir la carga cognitiva del usuario
- Guiar al usuario paso a paso

---

## Flujo de Decisión del Usuario

```
┌─────────────────────────────────────────────────────────────┐
│                  CONFIGURACIÓN DEL BOT                       │
│  [Nombre] [Idioma] [Tono]                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         ¿QUIERES QUE EL BOT RECOMIENDE PRODUCTOS?           │
│                                                              │
│    ┌──────────┐                    ┌──────────┐             │
│    │    SÍ    │                    │    NO    │             │
│    └────┬─────┘                    └────┬─────┘             │
└─────────┼───────────────────────────────┼───────────────────┘
          │                               │
          ▼                               ▼
┌────────────────────────────────────────┐  ┌────────────────────────┐
│  MODO E-COMMERCE                       │  │  MODO INFORMACIONAL    │
│  (Todas las opciones disponibles)      │  │  (Solo info básica)    │
│                                        │  │  - Info del Negocio    │
│  Se muestran directamente:             │  │  - Políticas           │
│  • Conexión API (siempre visible)      │  │  - Contacto            │
│  • Importar CSV                        │  │  - FAQs                │
│  • Productos manuales                  │  │  - Escalación          │
│  • Categorías y subcategorías          │  └────────────────────────┘
│  • Preguntas clave                     │
│  • Reglas de recomendación             │
│                                        │
│  💡 Usa las que necesites              │
└────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│  SECCIONES VISIBLES (el usuario usa las que quiera):        │
│                                                              │
│  📦 Conexión API E-commerce (siempre visible)               │
│     └─ Si hay APIs: selector de tiendas conectadas          │
│     └─ Si NO hay APIs: botón "Conectar API" → Settings      │
│                                                              │
│  📄 Importar desde CSV                                      │
│     └─ Zona drag & drop + preview                           │
│                                                              │
│  ✏️ Productos Manuales                                      │
│     └─ Lista de productos + "Añadir producto"               │
│                                                              │
│  📂 Categorías y Subcategorías                              │
│  ❓ Preguntas Clave por categoría                           │
│  📋 Reglas de Recomendación                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Estructura de la UI Propuesta

### Sección 0: Configuración del Bot (Siempre visible)
```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Configuración del Bot                                    │
├─────────────────────────────────────────────────────────────┤
│ Nombre del Bot    │ Idioma          │ Tono                  │
│ [Asistente     ]  │ [Español    ▼]  │ [Profesional    ▼]   │
└─────────────────────────────────────────────────────────────┘
```

### Sección 1: Tipo de Chatbot (Nueva - Decisión Principal)
```
┌─────────────────────────────────────────────────────────────┐
│ 🎯 Tipo de Chatbot                                          │
├─────────────────────────────────────────────────────────────┤
│ ¿Quieres que el bot recomiende productos de tu catálogo?    │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ○ Sí, quiero recomendar productos                       │ │
│ │   El bot ayudará a los clientes a encontrar productos   │ │
│ │   y hará recomendaciones personalizadas                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ○ No, solo informacional                                │ │
│ │   El bot responderá preguntas sobre tu negocio,         │ │
│ │   políticas y servicios sin recomendar productos        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Sección 2: Conexión API E-commerce (Siempre visible en modo E-commerce)

**Si hay conexiones disponibles:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🔗 Conexiones E-commerce                                    │
├─────────────────────────────────────────────────────────────┤
│ Selecciona las tiendas a conectar:                          │
│                                                              │
│ ☑️ WooCommerce - Mi Tienda Principal                        │
│ ☐ Shopify - Tienda Secundaria                               │
│                                                              │
│ [+ Conectar otra tienda]  → Settings > Connections          │
└─────────────────────────────────────────────────────────────┘
```

**Si NO hay conexiones disponibles:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🔗 Conexiones E-commerce                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  🛒  No tienes ninguna tienda conectada             │    │
│  │                                                     │    │
│  │  Conecta tu WooCommerce, Shopify u otra plataforma  │    │
│  │  para sincronizar automáticamente tu catálogo.      │    │
│  │                                                     │    │
│  │  [Conectar tienda]  → Settings > Connections        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  💡 También puedes añadir productos manualmente o           │
│     importarlos desde un archivo CSV más abajo.             │
└─────────────────────────────────────────────────────────────┘
```

### Sección 3: Importar desde CSV (Solo si eligió "Sí")

### Sección 4: Productos Manuales (Solo si eligió "Sí")
```
┌─────────────────────────────────────────────────────────────┐
│ ✏️ Productos Manuales                                       │
├─────────────────────────────────────────────────────────────┤
│ Añade productos que el bot puede recomendar                 │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Producto 1                                        [🗑️]  │ │
│ │ ┌─────────────────┐ ┌─────────────────┐                 │ │
│ │ │ Nombre *        │ │ Categoría       │                 │ │
│ │ │ [Crema Facial]  │ │ [Facial     ▼]  │                 │ │
│ │ └─────────────────┘ └─────────────────┘                 │ │
│ │ ┌─────────────────┐ ┌─────────────────┐                 │ │
│ │ │ Subcategoría    │ │ Precio          │                 │ │
│ │ │ [Hidratante ▼]  │ │ [29.99€      ]  │                 │ │
│ │ └─────────────────┘ └─────────────────┘                 │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Descripción                                         │ │ │
│ │ │ [Crema hidratante con ácido hialurónico para      ]│ │ │
│ │ │ [pieles secas y sensibles. Uso diario.            ]│ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Beneficios (separados por coma)                     │ │ │
│ │ │ [Hidratación 24h, Sin parabenos, Vegano           ]│ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ URL del producto (opcional)                         │ │ │
│ │ │ [https://mitienda.com/crema-facial               ] │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │ ▼ Campos adicionales (ingredientes, modo de uso...)     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ [+ Añadir otro producto]                                    │
│                                                              │
│ 📊 Total: 3 productos añadidos                              │
└─────────────────────────────────────────────────────────────┘
```

### Sección 2C: Importar CSV (Si eligió CSV)
```
┌─────────────────────────────────────────────────────────────┐
│ 📄 Importar Productos desde CSV                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                    📁                                   │ │
│ │         Arrastra tu archivo CSV aquí                    │ │
│ │              o haz clic para buscar                     │ │
│ │                                                         │ │
│ │         Formatos soportados: CSV, XLSX                  │ │
│ │         Tamaño máximo: 10MB                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ 📥 Descargar plantilla:                                     │
│    [Plantilla básica]  [Plantilla WooCommerce]  [Shopify]   │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ ℹ️ Columnas requeridas:                                     │
│    • name (nombre del producto)                             │
│    • category (categoría)                                   │
│    • price (precio)                                         │
│                                                              │
│ ℹ️ Columnas opcionales:                                     │
│    • subcategory, description, benefits, url, ingredients,  │
│    • usage_instructions, sku, stock                         │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ 📊 Vista previa (últimos 5 productos importados):           │
│ ┌──────────────┬────────────┬─────────┬──────────────────┐  │
│ │ Nombre       │ Categoría  │ Precio  │ Estado           │  │
│ ├──────────────┼────────────┼─────────┼──────────────────┤  │
│ │ Crema Facial │ Facial     │ 29.99€  │ ✅ Importado     │  │
│ │ Sérum Vit C  │ Facial     │ 45.00€  │ ✅ Importado     │  │
│ │ Body Lotion  │ Corporal   │ 19.99€  │ ⚠️ Sin categoría │  │
│ └──────────────┴────────────┴─────────┴──────────────────┘  │
│                                                              │
│ [Importar 47 productos]  [Cancelar]                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Secciones Comunes (Después de elegir fuente de productos)

### Si eligió productos (API, Manual o CSV):

```
┌─────────────────────────────────────────────────────────────┐
│ 📂 Categorías y Subcategorías                               │
│ (Auto-detectadas de tus productos o personalizables)        │
├─────────────────────────────────────────────────────────────┤
│ Categorías detectadas: FACIAL, CORPORAL, CAPILAR            │
│                                                              │
│ ▼ FACIAL (12 productos)                                     │
│   Subcategorías: Hidratante, Antiedad, Limpiadores          │
│   [+ Añadir subcategoría]                                   │
│                                                              │
│ ▼ CORPORAL (8 productos)                                    │
│   Subcategorías: Hidratante, Reafirmante                    │
│   [+ Añadir subcategoría]                                   │
│                                                              │
│ [+ Añadir categoría manualmente]                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ❓ Preguntas Clave por Categoría                            │
│ (El bot hará estas preguntas para recomendar mejor)         │
├─────────────────────────────────────────────────────────────┤
│ ▼ FACIAL                                                    │
│   Máx. preguntas antes de recomendar: [2 ▼]                 │
│                                                              │
│   1. [¿Qué tipo de piel tienes? (seca, mixta, grasa)    ]  │
│   2. [¿Tienes alguna preocupación específica?           ]  │
│   [+ Añadir pregunta]                                       │
│                                                              │
│ ▼ CORPORAL                                                  │
│   1. [¿Buscas hidratación o tratamiento específico?     ]  │
│   [+ Añadir pregunta]                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📋 Reglas de Recomendación                                  │
├─────────────────────────────────────────────────────────────┤
│ Estructura de respuesta (qué incluir al recomendar):        │
│                                                              │
│ ☑️ Nombre del producto                                      │
│ ☑️ Precio                                                   │
│ ☑️ Beneficios principales                                   │
│ ☑️ Modo de uso                                              │
│ ☑️ Enlace al producto                                       │
│ ☐ Ingredientes destacados                                   │
│ [+ Añadir campo personalizado]                              │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ Reglas especiales (opcional):                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Retinol: solo uso nocturno, no combinar con ácidos     │ │
│ │ Vitamina C: aplicar por la mañana                      │ │
│ │ No recomendar productos con fragancia a pieles sensibles│ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Secciones siempre visibles (independiente del tipo):

```
1. Información del Negocio (Obligatorio)
2. Políticas (Envío, Devoluciones, Pagos)
3. Contacto
4. Escalación a Humano
5. FAQs
6. Información Adicional
```

---

## Modelo de Datos Unificado

Para que el backend trate igual los productos de API, manuales o CSV:

```typescript
interface Product {
  id: string                    // UUID generado
  source: 'api' | 'manual' | 'csv'  // Origen del producto
  external_id?: string          // ID en la plataforma original (si API)
  
  // Campos principales
  name: string
  category: string
  subcategory?: string
  price: number
  currency: string
  description?: string
  
  // Campos adicionales
  benefits?: string[]
  ingredients?: string[]
  usage_instructions?: string
  url?: string
  image_url?: string
  sku?: string
  stock?: number
  
  // Metadata
  created_at: Date
  updated_at: Date
  is_active: boolean
}

interface ChatbotConfig {
  // Tipo de chatbot
  chatbot_type: 'ecommerce' | 'informational'
  
  // Fuentes de productos (puede ser múltiple)
  product_sources: {
    api_enabled: boolean
    api_connection_ids: string[]
    manual_products_enabled: boolean
    csv_import_enabled: boolean
  }
  
  // Productos (unificados de todas las fuentes)
  products: Product[]
  
  // Categorías (auto-detectadas o manuales)
  categories: {
    name: string
    subcategories: string[]
    key_questions: string[]
    max_questions: number
  }[]
  
  // Reglas de recomendación
  recommendation_rules: {
    response_structure: string[]
    special_rules: string
  }
  
  // ... resto de configuración
}
```

---

## Resumen de Cambios en la UI

### Orden de secciones propuesto:

**Siempre visible:**
1. **Configuración del Bot** - Nombre, Idioma, Tono
2. **Tipo de Chatbot** - ¿Recomendar productos? Sí/No

**Si elige "Sí, recomendar productos" (todas visibles, usa las que quiera):**
3. **Conexiones E-commerce** - Si hay conexiones disponibles
4. **Importar CSV** - Drag & drop para carga masiva
5. **Productos Manuales** - Lista editable, añadir/editar/eliminar
6. **Categorías y Subcategorías** - Auto-detectadas + manuales
7. **Preguntas Clave** - Por categoría
8. **Reglas de Recomendación** - Estructura de respuesta + reglas especiales

**Siempre visible (ambos modos):**
9. **Información del Negocio** - Obligatorio
10. **Políticas** - Envío, devoluciones, pagos
11. **Contacto** - Email, teléfono, redes
12. **Escalación** - Cuándo pasar a humano
13. **FAQs** - Preguntas frecuentes
14. **Información Adicional** - Opcional

### Ejemplos de uso:

| El usuario quiere... | Usa estas secciones |
|---------------------|---------------------|
| Solo chatbot informativo | Info Negocio + Políticas + FAQs |
| E-commerce con API | Conexión API + Categorías + Reglas |
| E-commerce sin API | CSV o Manual + Categorías + Reglas |
| E-commerce mixto | API + algunos productos manuales especiales |

### Beneficios de esta estructura:

1. **Sin fricción**: No hay que "activar" opciones, todo está disponible
2. **Flexibilidad Total**: El usuario usa solo lo que necesita
3. **Consistencia**: Los productos se tratan igual sin importar el origen
4. **UX Simple**: Solo 1 decisión inicial (¿productos sí/no?)

---

## Próximos Pasos de Implementación

1. [ ] Añadir toggle "¿Recomendar productos?" al inicio de Prompt2ConfigTab
2. [ ] Crear componente `ManualProductForm` (formulario de producto con CRUD)
3. [ ] Crear componente `ProductList` (lista de productos de todas las fuentes)
4. [ ] Crear componente `CSVImporter` (drag & drop + preview + mapeo columnas)
5. [ ] Modificar `Prompt2ConfigTab` para mostrar/ocultar secciones según el toggle
6. [ ] Crear endpoint backend para importar CSV
7. [ ] Crear tabla `chatbot_products` en Supabase para productos manuales/CSV
8. [ ] Unificar modelo de datos de productos
9. [ ] Actualizar lógica de generación de prompt para usar estructura unificada
