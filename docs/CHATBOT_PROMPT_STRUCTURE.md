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
┌─────────────────────────────────┐  ┌────────────────────────┐
│  FUENTES DE PRODUCTOS           │  │  MODO INFORMACIONAL    │
│  (Selecciona una o varias)      │  │  (Solo info básica)    │
│                                 │  │  - Info del Negocio    │
│  ☐ Conectar API E-commerce      │  │  - Políticas           │
│  ☐ Importar desde CSV           │  │  - Contacto            │
│  ☐ Añadir productos manualmente │  │  - FAQs                │
│                                 │  │  - Escalación          │
│  💡 Puedes combinar métodos     │  └────────────────────────┘
└─────────────────────────────────┘
          │
          ▼ (según selección, se muestran las secciones)
┌─────────────────────────────────────────────────────────────┐
│  SI API ACTIVA:                                             │
│  └─ Selector de conexiones disponibles                      │
├─────────────────────────────────────────────────────────────┤
│  SI CSV ACTIVO:                                             │
│  └─ Zona de drag & drop + preview de productos              │
├─────────────────────────────────────────────────────────────┤
│  SI MANUAL ACTIVO (o siempre visible como complemento):     │
│  └─ Lista de productos + botón "Añadir producto"            │
│  └─ Cada producto es editable/eliminable                    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│  CONFIGURACIÓN DE PRODUCTOS (común a todas las fuentes)     │
│  - Categorías y Subcategorías (auto-detectadas + manuales)  │
│  - Preguntas Clave por categoría                            │
│  - Reglas de Recomendación                                  │
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

### Sección 2: Fuentes de Productos (Solo si eligió "Sí" en Sección 1)
```
┌─────────────────────────────────────────────────────────────┐
│ 📦 Fuentes de Productos                                     │
├─────────────────────────────────────────────────────────────┤
│ Selecciona cómo quieres cargar tus productos.               │
│ Puedes activar varias opciones a la vez.                    │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☐ 🔗 Conectar API E-commerce                            │ │
│ │   Sincroniza automáticamente con tu tienda online       │ │
│ │   (WooCommerce, Shopify, etc.)                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☐ 📄 Importar desde CSV                                 │ │
│ │   Carga masiva de productos desde archivo Excel o CSV   │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ☐ ✏️ Añadir productos manualmente                       │ │
│ │   Escribe productos uno a uno, edita o añade nuevos     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ 💡 Ejemplo: Conecta tu API para el catálogo principal y    │
│    añade manualmente productos exclusivos o promociones     │
└─────────────────────────────────────────────────────────────┘
```

### Sección 2A: Conexión API (Si eligió API)
```
┌─────────────────────────────────────────────────────────────┐
│ 🔗 Conexiones E-commerce                                    │
├─────────────────────────────────────────────────────────────┤
│ Selecciona las tiendas a conectar:                          │
│                                                              │
│ ☑️ WooCommerce - Mi Tienda Principal                        │
│ ☐ Shopify - Tienda Secundaria                               │
│                                                              │
│ ⚠️ ¿No ves tu tienda? Conéctala en Settings > Connections   │
└─────────────────────────────────────────────────────────────┘
```

### Sección 2B: Productos Manuales (Si eligió Manual o como complemento)
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

1. **Configuración del Bot** - Nombre, Idioma, Tono
2. **Tipo de Chatbot** - ¿Recomendar productos? Sí/No
3. **Fuentes de Productos** (si Sí) - Checkboxes combinables: API / CSV / Manual
4. **Conexiones E-commerce** (si API marcado)
5. **Importar CSV** (si CSV marcado)
6. **Productos Manuales** (si Manual marcado) - Lista editable de productos
7. **Categorías y Subcategorías** (si cualquier fuente de productos activa)
8. **Preguntas Clave** (si productos)
9. **Reglas de Recomendación** (si productos)
10. **Información del Negocio** - Siempre
11. **Políticas** - Siempre
12. **Contacto** - Siempre
13. **Escalación** - Siempre
14. **FAQs** - Siempre
15. **Información Adicional** - Siempre

### Combinaciones de Fuentes Soportadas:

| Combinación | Caso de Uso |
|-------------|-------------|
| Solo API | Tienda online con catálogo sincronizado |
| Solo CSV | Importación inicial sin API disponible |
| Solo Manual | Pocos productos, control total |
| API + Manual | Catálogo + productos exclusivos/promociones |
| CSV + Manual | Importación bulk + ediciones/añadidos sin re-subir |
| API + CSV | Múltiples fuentes de catálogo |
| API + CSV + Manual | Máxima flexibilidad |

### Beneficios de esta estructura:

1. **Claridad**: El usuario sabe desde el principio qué tipo de bot está configurando
2. **Flexibilidad Total**: Puede combinar cualquier método de carga de productos
3. **Consistencia**: Los productos se tratan igual internamente sin importar el origen
4. **Escalabilidad**: Fácil añadir nuevas fuentes de productos en el futuro
5. **UX Progresiva**: Solo muestra lo relevante según las elecciones del usuario
6. **Edición sin fricción**: Con Manual activo, siempre puede editar/añadir productos

---

## Próximos Pasos de Implementación

1. [ ] Crear componente `ChatbotTypeSelector` (Sí/No productos)
2. [ ] Crear componente `ProductSourceSelector` (checkboxes combinables)
3. [ ] Crear componente `ManualProductForm` (formulario de producto con CRUD)
4. [ ] Crear componente `ProductList` (lista de productos de todas las fuentes)
5. [ ] Crear componente `CSVImporter` (drag & drop + preview + mapeo columnas)
6. [ ] Modificar `Prompt2ConfigTab` para usar progressive disclosure
7. [ ] Crear endpoint backend para importar CSV
8. [ ] Crear tabla `chatbot_products` en Supabase para productos manuales/CSV
9. [ ] Unificar modelo de datos de productos
10. [ ] Actualizar lógica de generación de prompt para usar estructura unificada
