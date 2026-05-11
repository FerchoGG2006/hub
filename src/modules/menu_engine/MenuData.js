export const MENU_DATA = {
  "Entradas": [
    { id: 1, name: "Ceviche Valle",   price: "$32k", desc: "Pesca del día con cítricos y suero costeño.", emoji: "🐟", baseIngredients: ["Cebolla", "Cilantro", "Picante", "Limón", "Maíz"] },
    { id: 2, name: "Patacón Power",   price: "$18k", desc: "Base crocante con ahogao y queso fundido.",   emoji: "🍌", baseIngredients: ["Queso", "Ahogao", "Suero", "Tocino"] },
    { id: 3, name: "Carpaccio Res",   price: "$35k", desc: "Láminas finas con aceite de trufa y parmesano.", emoji: "🥩", baseIngredients: ["Trufa", "Parmesano", "Rúcula", "Alcaparras"] },
    { id: 4, name: "Tabla de Quesos", price: "$42k", desc: "Selección artesanal con miel y nueces.",      emoji: "🧀", baseIngredients: ["Miel", "Nueces", "Frutas", "Pan"] },
  ],
  "Fuertes": [
    { id: 5, name: "Punta de Anca",   price: "$55k", desc: "Corte premium 350g a la parrilla con papas.", emoji: "🔥", baseIngredients: ["Chimichurri", "Papas", "Ensalada", "Término Medio"] },
    { id: 6, name: "Pizza Artisanal", price: "$32k", desc: "Masa madre, pepperoni y miel picante.",       emoji: "🍕", baseIngredients: ["Pepperoni", "Miel Picante", "Albahaca", "Queso"] },
    { id: 7, name: "Salmón Grill",    price: "$48k", desc: "A la plancha con puré de coliflor.",          emoji: "🫒", baseIngredients: ["Puré", "Verduras", "Limón"] },
    { id: 8, name: "Risotto Trufa",   price: "$52k", desc: "Arroz arborio cremoso con trufa negra.",      emoji: "🍚", baseIngredients: ["Champiñones", "Queso", "Vino Blanco"] },
  ],
  "Licores": [
    { id: 9,  name: "Old Parr 12",   price: "$180k", desc: "Botella 750ml con hielo cristalino.",         emoji: "🥃", baseIngredients: ["Hielo", "Soda", "Limón"] },
    { id: 10, name: "Ron Dictador",  price: "$95k",  desc: "Ron colombiano premium, añejado en roble.",   emoji: "🍾", baseIngredients: ["Puro", "Con Hielo"] },
    { id: 11, name: "Corona Extra",  price: "$12k",  desc: "Cerveza premium bien fría con limón.",        emoji: "🍺", baseIngredients: ["Limón", "Sal"] },
    { id: 12, name: "Cóctel de Casa",price: "$28k",  desc: "Creación del bartender con fruta y jengibre.",emoji: "🍹", baseIngredients: ["Jengibre", "Frutas", "Jarabe"] },
  ],
};

export const CATEGORY_META = {
  "Entradas": { accent: "#10b981", icon: "🌿", label: "Starters"   },
  "Fuertes":  { accent: "#f97316", icon: "🔥", label: "Main Course" },
  "Licores":  { accent: "#f59e0b", icon: "🥃", label: "Drinks"     },
};
