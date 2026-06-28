
# Lógica de Componentes para Desarrollo (React/Next.js)

## Componente `MenuCard`
- **Props**: `name`, `price`, `description`, `category`
- **Interacción**: Al hacer clic, disparar `openBottomSheet(productData)`

## Componente `BottomSheet`
- **Estado**: `isOpen`, `selectedProduct`
- **Contenido**: 
  - Imagen del producto
  - Selector de cantidad (+ / -)
  - Botón: "Añadir al carrito - [Precio Total]"
  - Botón secundario: "Cerrar"

## Componente `CartFooter`
- **Estado**: `cartItems`
- **Visual**: Sticky bar fija en la parte inferior.
- **Acción**: Al tocar, redirigir a WhatsApp con el pedido formateado:
  `"Hola, quiero pedir: [lista de productos] por un total de [total]"`
