import React, { useState } from 'react';
import { PlusIcon, TrashIcon } from '../../icons/HeroiconsOutline';

interface Item {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  weight?: number;
  dimensions?: string;
  notes?: string;
}

const ItemsBulkForm: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);

  const addItem = () => {
    const newItem: Item = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit: 'unidad',
      weight: undefined,
      dimensions: '',
      notes: ''
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof Item, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Ítems o bultos</h3>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center text-sm font-medium text-primary hover:text-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Agregar ítem
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-8 text-center">
          <p className="text-gray-500">No hay ítems agregados</p>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Agregar primer ítem
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-text-primary">Ítem #{index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-danger hover:text-red-700 transition-colors"
                  aria-label="Eliminar ítem"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Descripción <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
                    placeholder="Descripción del ítem o bulto…"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Cantidad <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, 'quantity', Number.parseInt(e.target.value, 10) || 1)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Unidad</label>
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
                  >
                    <option value="unidad">Unidad</option>
                    <option value="caja">Caja</option>
                    <option value="pallet">Pallet</option>
                    <option value="bulto">Bulto</option>
                    <option value="kg">Kilogramo</option>
                    <option value="litro">Litro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Peso (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={item.weight ?? ''}
                    onChange={(e) =>
                      updateItem(item.id, 'weight', Number.parseFloat(e.target.value) || undefined)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
                    placeholder="Peso opcional…"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Dimensiones</label>
                  <input
                    type="text"
                    value={item.dimensions ?? ''}
                    onChange={(e) => updateItem(item.id, 'dimensions', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
                    placeholder="Ej: 50x30x20 cm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Notas adicionales
                  </label>
                  <textarea
                    value={item.notes ?? ''}
                    onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
                    placeholder="Información adicional sobre este ítem…"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ItemsBulkForm;
