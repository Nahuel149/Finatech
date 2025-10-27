import React, { useState } from 'react';
import { IncidentFormData } from './incidentFormTypes';

interface IncidentItemsTableProps {
  items: IncidentFormData['involvedItems'];
  onItemsChange: (items: IncidentFormData['involvedItems']) => void;
}

export const IncidentItemsTable: React.FC<IncidentItemsTableProps> = ({
  items,
  onItemsChange
}) => {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    observation: ''
  });

  const addItem = () => {
    if (newItem.description.trim()) {
      const item = {
        id: Date.now().toString(),
        description: newItem.description,
        quantity: newItem.quantity,
        observation: newItem.observation
      };
      
      onItemsChange([...items, item]);
      setNewItem({ description: '', quantity: 1, observation: '' });
      setIsAddingItem(false);
    }
  };

  const removeItem = (itemId: string) => {
    onItemsChange(items.filter(item => item.id !== itemId));
  };

  const updateItem = (itemId: string, field: keyof typeof newItem, value: string | number) => {
    onItemsChange(items.map(item => 
      item.id === itemId 
        ? { ...item, [field]: value }
        : item
    ));
  };

  return (
    <div className="space-y-3">
      {/* Add Item Button */}
      {!isAddingItem && (
        <button 
          onClick={() => setIsAddingItem(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          Agregar ítem
        </button>
      )}

      {/* Add Item Form */}
      {isAddingItem && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-5">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <input 
                type="text"
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del ítem"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cantidad
              </label>
              <input 
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Observación
              </label>
              <input 
                type="text"
                value={newItem.observation}
                onChange={(e) => setNewItem(prev => ({ ...prev, observation: e.target.value }))}
                placeholder="Observación (opcional)"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div className="col-span-2 flex space-x-1">
              <button 
                onClick={addItem}
                disabled={!newItem.description.trim()}
                className="flex-1 px-3 py-2 bg-primary text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-check"></i>
              </button>
              <button 
                onClick={() => {
                  setIsAddingItem(false);
                  setNewItem({ description: '', quantity: 1, observation: '' });
                }}
                className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items Table */}
      {items.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Observación
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input 
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="text"
                      value={item.observation}
                      onChange={(e) => updateItem(item.id, 'observation', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-800 p-1 transition-colors"
                      title="Eliminar ítem"
                    >
                      <i className="fa-solid fa-trash text-sm"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {items.length === 0 && !isAddingItem && (
        <div className="text-center py-8 text-gray-500">
          <i className="fa-solid fa-box-open text-2xl mb-2"></i>
          <p className="text-sm">No hay ítems involucrados</p>
        </div>
      )}
    </div>
  );
};
