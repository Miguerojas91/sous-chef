/**
 * milprepRecipes.ts
 *
 * Catálogo de recetas del módulo Mealprep (meal prep semanal).
 * Cada receta incluye ingredientes con cantidades base para 1 persona,
 * que el módulo escala automáticamente según el número de comensales.
 *
 * Las recetas están organizadas en dos grupos:
 * - Recetas personalizadas (primero, para fácil acceso al seleccionar).
 * - Recetas clásicas del catálogo estándar.
 *
 * La IA del módulo usa estas recetas para generar la lista de mercado
 * consolidada y el plan de batch cooking semanal.
 */

export type Ingredient = {
    name: string;
    category: 'Verduras y Frutas' | 'Proteínas' | 'Lácteos y Refrigerados' | 'Despensa';
    baseAmount: number;
    unit: string;
};

export type Recipe = {
    id: string;
    title: string;
    time: string;
    img: string;
    ingredients: Ingredient[];
};

export const MILPREP_RECIPES: Recipe[] = [
    // --- RECETAS PERSONALIZADAS (primero para fácil acceso) ---
    {
        id: 'custom1', title: 'Gyozas de Cerdo con Ensalada de Mango', time: '50 min', img: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Carne de cerdo molida', category: 'Proteínas', baseAmount: 150, unit: 'g' },
            { name: 'Masa wonton/gyoza', category: 'Despensa', baseAmount: 12, unit: ' ud' },
            { name: 'Lechuga', category: 'Verduras y Frutas', baseAmount: 60, unit: 'g' },
            { name: 'Mango', category: 'Verduras y Frutas', baseAmount: 0.5, unit: ' ud' },
            { name: 'Pimentón rojo/verde', category: 'Verduras y Frutas', baseAmount: 0.5, unit: ' ud' },
            { name: 'Salsa de soya', category: 'Despensa', baseAmount: 20, unit: 'ml' },
        ]
    },
    {
        id: 'custom2', title: 'Costillas de Cerdo Picantes con Arroz', time: '90 min', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Costillas de cerdo', category: 'Proteínas', baseAmount: 250, unit: 'g' },
            { name: 'Arroz blanco', category: 'Despensa', baseAmount: 80, unit: 'g' },
            { name: 'Zanahoria', category: 'Verduras y Frutas', baseAmount: 1, unit: ' ud' },
            { name: 'Pimentón rojo', category: 'Verduras y Frutas', baseAmount: 0.5, unit: ' ud' },
            { name: 'Ají picante o chile', category: 'Despensa', baseAmount: 5, unit: 'g' },
            { name: 'Salsa BBQ picante', category: 'Despensa', baseAmount: 40, unit: 'ml' },
        ]
    },
    {
        id: 'custom3', title: 'Sobrebarriga en Bistec con Papa Chorreada', time: '60 min', img: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Sobrebarriga de res (bistec)', category: 'Proteínas', baseAmount: 180, unit: 'g' },
            { name: 'Papa pastusa', category: 'Verduras y Frutas', baseAmount: 2, unit: ' ud' },
            { name: 'Espárragos', category: 'Verduras y Frutas', baseAmount: 80, unit: 'g' },
            { name: 'Crema de leche', category: 'Lácteos y Refrigerados', baseAmount: 40, unit: 'ml' },
            { name: 'Ajo', category: 'Verduras y Frutas', baseAmount: 2, unit: ' diente(s)' },
        ]
    },
    {
        id: 'custom4', title: 'Trucha con Sofrito y Ensalada de Remolacha', time: '35 min', img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Trucha entera o filete', category: 'Proteínas', baseAmount: 200, unit: 'g' },
            { name: 'Tomate chonto', category: 'Verduras y Frutas', baseAmount: 2, unit: ' ud' },
            { name: 'Remolacha', category: 'Verduras y Frutas', baseAmount: 1, unit: ' ud' },
            { name: 'Zanahoria', category: 'Verduras y Frutas', baseAmount: 1, unit: ' ud' },
            { name: 'Cebolla cabezona', category: 'Verduras y Frutas', baseAmount: 0.5, unit: ' ud' },
            { name: 'Ajo', category: 'Verduras y Frutas', baseAmount: 2, unit: ' diente(s)' },
        ]
    },
    {
        id: 'custom5', title: 'Pernil a la Naranja con Ensalada Tabule', time: '180 min', img: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Pernil de cerdo', category: 'Proteínas', baseAmount: 250, unit: 'g' },
            { name: 'Naranja', category: 'Verduras y Frutas', baseAmount: 2, unit: ' ud' },
            { name: 'Bulgur o cuscús (tabule)', category: 'Despensa', baseAmount: 80, unit: 'g' },
            { name: 'Tomate chonto', category: 'Verduras y Frutas', baseAmount: 1, unit: ' ud' },
            { name: 'Pepino', category: 'Verduras y Frutas', baseAmount: 0.5, unit: ' ud' },
            { name: 'Perejil fresco', category: 'Verduras y Frutas', baseAmount: 20, unit: 'g' },
        ]
    },

    // --- 6 RECETAS DE POLLO (CHICKEN) ---
    {
        id: 'p1', title: 'Pollo Teriyaki con Brócoli', time: '30 min', img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Pechuga de pollo', category: 'Proteínas', baseAmount: 150, unit: 'g' },
            { name: 'Brócoli', category: 'Verduras y Frutas', baseAmount: 100, unit: 'g' },
            { name: 'Salsa Teriyaki', category: 'Despensa', baseAmount: 30, unit: 'ml' },
            { name: 'Arroz blanco', category: 'Despensa', baseAmount: 80, unit: 'g' },
        ]
    },
    {
        id: 'p2', title: 'Curry de Pollo al Estilo Indio', time: '40 min', img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Pechuga de pollo', category: 'Proteínas', baseAmount: 150, unit: 'g' },
            { name: 'Leche de coco', category: 'Despensa', baseAmount: 80, unit: 'ml' },
            { name: 'Pasta de Curry', category: 'Despensa', baseAmount: 15, unit: 'g' },
            { name: 'Cebolla blanca', category: 'Verduras y Frutas', baseAmount: 0.5, unit: ' ud' },
        ]
    },
    {
        id: 'p3', title: 'Pollo Desmechado en Salsa', time: '60 min', img: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Pechuga de pollo', category: 'Proteínas', baseAmount: 150, unit: 'g' },
            { name: 'Tomate triturado', category: 'Despensa', baseAmount: 100, unit: 'g' },
            { name: 'Ajo', category: 'Verduras y Frutas', baseAmount: 1, unit: ' diente(s)' },
            { name: 'Cebolla cabezona', category: 'Verduras y Frutas', baseAmount: 0.5, unit: ' ud' },
        ]
    },
    {
        id: 'p4', title: 'Albóndigas de Pollo al Horno', time: '45 min', img: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Pollo molido', category: 'Proteínas', baseAmount: 150, unit: 'g' },
            { name: 'Pan rallado', category: 'Despensa', baseAmount: 30, unit: 'g' },
            { name: 'Huevo', category: 'Lácteos y Refrigerados', baseAmount: 0.5, unit: ' ud' },
            { name: 'Salsa Napolitana', category: 'Despensa', baseAmount: 80, unit: 'g' },
        ]
    },
    {
        id: 'p5', title: 'Curry de Pollo y Garbanzos', time: '40 min', img: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Pechuga de pollo', category: 'Proteínas', baseAmount: 100, unit: 'g' },
            { name: 'Garbanzos', category: 'Despensa', baseAmount: 80, unit: 'g' },
            { name: 'Leche de coco', category: 'Despensa', baseAmount: 50, unit: 'ml' },
            { name: 'Cilantro', category: 'Verduras y Frutas', baseAmount: 10, unit: 'g' },
        ]
    },
    {
        id: 'p6', title: 'Fajitas de Pollo para Congelar', time: '25 min', img: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Pollo en tiras', category: 'Proteínas', baseAmount: 150, unit: 'g' },
            { name: 'Pimentón rojo/verde', category: 'Verduras y Frutas', baseAmount: 100, unit: 'g' },
            { name: 'Cebolla morada', category: 'Verduras y Frutas', baseAmount: 0.5, unit: ' ud' },
            { name: 'Tortillas de trigo', category: 'Despensa', baseAmount: 3, unit: ' ud' },
        ]
    },

    // --- 6 RECETAS DE CARNE DE RES (BEEF) ---
    {
        id: 'r1', title: 'Boloñesa Clásica', time: '120 min', img: 'https://images.unsplash.com/photo-1622973536968-3ead9e780960?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Carne de res molida', category: 'Proteínas', baseAmount: 150, unit: 'g' },
            { name: 'Pasta (Spaghetti/Penne)', category: 'Despensa', baseAmount: 100, unit: 'g' },
            { name: 'Tomate triturado', category: 'Despensa', baseAmount: 100, unit: 'g' },
            { name: 'Zanahoria', category: 'Verduras y Frutas', baseAmount: 0.5, unit: ' ud' },
        ]
    },
    {
        id: 'r2', title: 'Chili con Carne Casero', time: '60 min', img: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Carne de res molida', category: 'Proteínas', baseAmount: 100, unit: 'g' },
            { name: 'Frijoles rojos', category: 'Despensa', baseAmount: 80, unit: 'g' },
            { name: 'Tomate en lata', category: 'Despensa', baseAmount: 80, unit: 'g' },
            { name: 'Maíz tierno', category: 'Verduras y Frutas', baseAmount: 40, unit: 'g' },
        ]
    },
    {
        id: 'r3', title: 'Goulash de Res (Estofado)', time: '150 min', img: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Carne de res para guisar', category: 'Proteínas', baseAmount: 150, unit: 'g' },
            { name: 'Papa pastusa', category: 'Verduras y Frutas', baseAmount: 1, unit: ' ud' },
            { name: 'Paprika', category: 'Despensa', baseAmount: 5, unit: 'g' },
            { name: 'Cebolla blanca', category: 'Verduras y Frutas', baseAmount: 0.5, unit: ' ud' },
        ]
    },
    {
        id: 'r4', title: 'Ropa Vieja (Carne Desmechada)', time: '180 min', img: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Carne de res (sobrebarriga/falda)', category: 'Proteínas', baseAmount: 150, unit: 'g' },
            { name: 'Pimentón rojo', category: 'Verduras y Frutas', baseAmount: 0.5, unit: ' ud' },
            { name: 'Ajo', category: 'Verduras y Frutas', baseAmount: 1, unit: ' diente(s)' },
            { name: 'Tomate chonto', category: 'Verduras y Frutas', baseAmount: 2, unit: ' ud' },
        ]
    },
    {
        id: 'r5', title: 'Albóndigas de Res en Salsa', time: '40 min', img: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Carne de res molida', category: 'Proteínas', baseAmount: 150, unit: 'g' },
            { name: 'Pan rallado', category: 'Despensa', baseAmount: 25, unit: 'g' },
            { name: 'Salsa de tomate', category: 'Despensa', baseAmount: 100, unit: 'g' },
            { name: 'Huevo', category: 'Lácteos y Refrigerados', baseAmount: 0.5, unit: ' ud' },
        ]
    },
    {
        id: 'r6', title: 'Carne Molida con Papa y Zanahoria', time: '35 min', img: 'https://images.unsplash.com/photo-1622973536968-3ead9e780960?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Carne de res molida', category: 'Proteínas', baseAmount: 150, unit: 'g' },
            { name: 'Papa criolla o pastusa', category: 'Verduras y Frutas', baseAmount: 100, unit: 'g' },
            { name: 'Zanahoria', category: 'Verduras y Frutas', baseAmount: 0.5, unit: ' ud' },
            { name: 'Cebolla Larga', category: 'Verduras y Frutas', baseAmount: 1, unit: ' ud' },
        ]
    },

    // --- 6 RECETAS DE CARNE DE CERDO (PORK) ---
    {
        id: 'c1', title: 'Pulled Pork (Cerdo Desmechado BBQ)', time: '240 min', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Lomo o pierna de cerdo', category: 'Proteínas', baseAmount: 150, unit: 'g' },
            { name: 'Salsa BBQ', category: 'Despensa', baseAmount: 50, unit: 'ml' },
            { name: 'Azúcar morena', category: 'Despensa', baseAmount: 15, unit: 'g' },
            { name: 'Pan para hamburguesa (opcional)', category: 'Despensa', baseAmount: 1, unit: ' ud' },
        ]
    },
    {
        id: 'c2', title: 'Cerdo Agridulce Oriental', time: '40 min', img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Cerdo magro en cubos', category: 'Proteínas', baseAmount: 150, unit: 'g' },
            { name: 'Salsa de soya', category: 'Despensa', baseAmount: 20, unit: 'ml' },
            { name: 'Vinagre de manzana', category: 'Despensa', baseAmount: 15, unit: 'ml' },
            { name: 'Pimentón rojo/verde', category: 'Verduras y Frutas', baseAmount: 80, unit: 'g' },
        ]
    },
    {
        id: 'c3', title: 'Frijoles con Pezuña/Cerdo', time: '120 min', img: 'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Cerdo para guisar (trozos)', category: 'Proteínas', baseAmount: 100, unit: 'g' },
            { name: 'Frijoles cargamanto/rojos', category: 'Despensa', baseAmount: 100, unit: 'g' },
            { name: 'Plátano verde', category: 'Verduras y Frutas', baseAmount: 0.5, unit: ' ud' },
            { name: 'Cebolla Larga', category: 'Verduras y Frutas', baseAmount: 1, unit: ' ud' },
        ]
    },
    {
        id: 'c4', title: 'Costillas de Cerdo al Horno', time: '120 min', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Costillas de cerdo', category: 'Proteínas', baseAmount: 250, unit: 'g' },
            { name: 'Salsa BBQ', category: 'Despensa', baseAmount: 40, unit: 'ml' },
            { name: 'Ajo en polvo', category: 'Despensa', baseAmount: 5, unit: 'g' },
            { name: 'Papas para asar', category: 'Verduras y Frutas', baseAmount: 150, unit: 'g' },
        ]
    },
    {
        id: 'c5', title: 'Lomo de Cerdo en Salsa de Manzana', time: '50 min', img: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Lomo de cerdo magro', category: 'Proteínas', baseAmount: 150, unit: 'g' },
            { name: 'Manzana verde o roja', category: 'Verduras y Frutas', baseAmount: 1, unit: ' ud' },
            { name: 'Vino blanco (opcional)', category: 'Despensa', baseAmount: 30, unit: 'ml' },
            { name: 'Crema de leche', category: 'Lácteos y Refrigerados', baseAmount: 30, unit: 'ml' },
        ]
    },
    {
        id: 'c6', title: 'Guiso de Cerdo con Papa y Arveja', time: '60 min', img: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Cerdo en cubos (brazo/pierna)', category: 'Proteínas', baseAmount: 150, unit: 'g' },
            { name: 'Papa pastusa', category: 'Verduras y Frutas', baseAmount: 1, unit: ' ud' },
            { name: 'Arvejas', category: 'Verduras y Frutas', baseAmount: 50, unit: 'g' },
            { name: 'Tomate chonto', category: 'Verduras y Frutas', baseAmount: 1, unit: ' ud' },
        ]
    },

    // --- 6 RECETAS DE PESCADOS Y MARISCOS (SEAFOOD) ---
    {
        id: 'm1', title: 'Curry de Pescado Blanco en Coco', time: '30 min', img: 'https://images.unsplash.com/photo-1559058789-672da06263d8?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Pescado blanco firme (Corvina/Róbalo)', category: 'Proteínas', baseAmount: 150, unit: 'g' },
            { name: 'Leche de coco', category: 'Despensa', baseAmount: 80, unit: 'ml' },
            { name: 'Pasta de Curry', category: 'Despensa', baseAmount: 15, unit: 'g' },
            { name: 'Arroz jazmín', category: 'Despensa', baseAmount: 80, unit: 'g' },
        ]
    },
    {
        id: 'm2', title: 'Pastel de Atún al Horno', time: '45 min', img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Atún en lata', category: 'Proteínas', baseAmount: 1, unit: ' lata(s)' },
            { name: 'Papa (para puré)', category: 'Verduras y Frutas', baseAmount: 200, unit: 'g' },
            { name: 'Huevo', category: 'Lácteos y Refrigerados', baseAmount: 1, unit: ' ud' },
            { name: 'Queso rallado', category: 'Lácteos y Refrigerados', baseAmount: 30, unit: 'g' },
        ]
    },
    {
        id: 'm3', title: 'Camarones al Ajillo (Base para Pasta)', time: '15 min', img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Camarones pelados', category: 'Proteínas', baseAmount: 150, unit: 'g' },
            { name: 'Ajo', category: 'Verduras y Frutas', baseAmount: 3, unit: ' diente(s)' },
            { name: 'Mantequilla', category: 'Lácteos y Refrigerados', baseAmount: 20, unit: 'g' },
            { name: 'Perejil fresco', category: 'Verduras y Frutas', baseAmount: 10, unit: 'g' },
        ]
    },
    {
        id: 'm4', title: 'Sopa Espesa de Pescado (Chowder)', time: '40 min', img: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Pescado blanco (cubos)', category: 'Proteínas', baseAmount: 100, unit: 'g' },
            { name: 'Papas crudas', category: 'Verduras y Frutas', baseAmount: 100, unit: 'g' },
            { name: 'Caldo de pescado', category: 'Despensa', baseAmount: 200, unit: 'ml' },
            { name: 'Crema de leche', category: 'Lácteos y Refrigerados', baseAmount: 50, unit: 'ml' },
        ]
    },
    {
        id: 'm5', title: 'Medallones de Salmón Teriyaki', time: '25 min', img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Salmón fresco/congelado', category: 'Proteínas', baseAmount: 150, unit: 'g' },
            { name: 'Salsa Teriyaki o Soya', category: 'Despensa', baseAmount: 30, unit: 'ml' },
            { name: 'Semillas de ajonjolí', category: 'Despensa', baseAmount: 5, unit: 'g' },
            { name: 'Espinaca', category: 'Verduras y Frutas', baseAmount: 50, unit: 'g' },
        ]
    },
    {
        id: 'm6', title: 'Croquetas de Pescado Blanco', time: '45 min', img: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Pescado blanco cocido/migas', category: 'Proteínas', baseAmount: 150, unit: 'g' },
            { name: 'Pan rallado/Harina', category: 'Despensa', baseAmount: 50, unit: 'g' },
            { name: 'Huevo', category: 'Lácteos y Refrigerados', baseAmount: 1, unit: ' ud' },
            { name: 'Ajo y Perejil picado', category: 'Verduras y Frutas', baseAmount: 10, unit: 'g' },
        ]
    },
    // --- 6 RECETAS VEGETARIANAS (VEGETARIAN) ---
    {
        id: 'v1', title: 'Lasaña de Berenjena y Queso', time: '60 min', img: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Berenjena', category: 'Verduras y Frutas', baseAmount: 1, unit: ' ud' },
            { name: 'Queso mozzarella', category: 'Lácteos y Refrigerados', baseAmount: 100, unit: 'g' },
            { name: 'Salsa de tomate casera', category: 'Despensa', baseAmount: 150, unit: 'g' },
            { name: 'Espinaca fresca', category: 'Verduras y Frutas', baseAmount: 50, unit: 'g' },
        ]
    },
    {
        id: 'v2', title: 'Curry de Garbanzos y Coliflor', time: '35 min', img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Garbanzos crudos o en lata', category: 'Despensa', baseAmount: 150, unit: 'g' },
            { name: 'Coliflor', category: 'Verduras y Frutas', baseAmount: 150, unit: 'g' },
            { name: 'Leche de coco', category: 'Despensa', baseAmount: 100, unit: 'ml' },
            { name: 'Curry en polvo', category: 'Despensa', baseAmount: 10, unit: 'g' },
        ]
    },
    {
        id: 'v3', title: 'Chili Vegetariano de Frijoles', time: '50 min', img: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Frijoles negros/rojos', category: 'Despensa', baseAmount: 150, unit: 'g' },
            { name: 'Maíz desgranado', category: 'Verduras y Frutas', baseAmount: 80, unit: 'g' },
            { name: 'Pimentón rojo', category: 'Verduras y Frutas', baseAmount: 0.5, unit: ' ud' },
            { name: 'Tomate triturado', category: 'Despensa', baseAmount: 100, unit: 'g' },
        ]
    },
    {
        id: 'v4', title: 'Hamburguesas de Lenteja y Quinoa', time: '40 min', img: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Lentejas crudas', category: 'Despensa', baseAmount: 100, unit: 'g' },
            { name: 'Quinoa', category: 'Despensa', baseAmount: 50, unit: 'g' },
            { name: 'Cebolla blanca', category: 'Verduras y Frutas', baseAmount: 0.5, unit: ' ud' },
            { name: 'Ajo', category: 'Verduras y Frutas', baseAmount: 1, unit: ' diente(s)' },
        ]
    },
    {
        id: 'v5', title: 'Sopa Crema de Tomate Rostizado', time: '45 min', img: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Tomate chonto/maduro', category: 'Verduras y Frutas', baseAmount: 3, unit: ' ud' },
            { name: 'Caldo de vegetales', category: 'Despensa', baseAmount: 200, unit: 'ml' },
            { name: 'Albahaca fresca', category: 'Verduras y Frutas', baseAmount: 10, unit: 'g' },
            { name: 'Crema de leche (opcional)', category: 'Lácteos y Refrigerados', baseAmount: 30, unit: 'ml' },
        ]
    },
    {
        id: 'v6', title: 'Falafel al Horno (Croquetas de Garbanzo)', time: '50 min', img: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&q=80&w=400&h=250',
        ingredients: [
            { name: 'Garbanzos', category: 'Despensa', baseAmount: 150, unit: 'g' },
            { name: 'Cilantro y Perejil', category: 'Verduras y Frutas', baseAmount: 20, unit: 'g' },
            { name: 'Cebolla morada', category: 'Verduras y Frutas', baseAmount: 0.5, unit: ' ud' },
            { name: 'Comino molido', category: 'Despensa', baseAmount: 5, unit: 'g' },
        ]
    }
];
