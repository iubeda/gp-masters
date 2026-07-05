import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader, Plus, Settings2, Trash2 } from 'lucide-react';

const DictionaryManager = ({ type, showToast }) => {
  const { apiFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({});

  const typeConfig = {
    pilots: {
      title: 'Pilotos',
      fields: [
        { name: 'name', label: 'Nombre', type: 'text' },
        { name: 'talent', label: 'Talento', type: 'number', min: 0, max: 100 },
        { name: 'consistency', label: 'Consistencia', type: 'number', min: 0, max: 100 },
        { name: 'aggressiveness', label: 'Agresividad', type: 'number', min: 0, max: 100 },
        { name: 'experience', label: 'Experiencia', type: 'number', min: 0, max: 100 },
        { name: 'fitness', label: 'Forma Física', type: 'number', min: 0, max: 100 }
      ]
    },
    motorcycles: {
      title: 'Motocicletas',
      fields: [
        { name: 'model_name', label: 'Modelo', type: 'text' },
        { name: 'engine', label: 'Motor', type: 'number', min: 0, max: 100 },
        { name: 'gearbox', label: 'Caja de Cambios', type: 'number', min: 0, max: 100 },
        { name: 'suspension', label: 'Suspensión', type: 'number', min: 0, max: 100 },
        { name: 'chassis', label: 'Chasis', type: 'number', min: 0, max: 100 },
        { name: 'wings', label: 'Aerodinámica', type: 'number', min: 0, max: 100 }
      ]
    },
    circuits: {
      title: 'Circuitos',
      fields: [
        { name: 'name', label: 'Nombre', type: 'text' },
        { name: 'distance', label: 'Distancia (KM)', type: 'number', min: 1 }
      ]
    }
  };

  const config = typeConfig[type];

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/admin/dictionaries/${type}`);
      setItems(data);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type: inputType } = e.target;
    setFormData({
      ...formData,
      [name]: inputType === 'number' ? Number(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const addedItem = await apiFetch(`/api/admin/dictionaries/${type}`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setItems([...items, addedItem]);
      setShowAddForm(false);
      setFormData({});
      showToast('Registro añadido correctamente.', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader className="w-8 h-8 text-red-500 animate-spin" />
        <p className="text-gray-400">Cargando {config.title.toLowerCase()}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-red-500" />
          Diccionario de {config.title}
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors"
        >
          {showAddForm ? 'Cancelar' : <><Plus className="w-4 h-4" /> Añadir Nuevo</>}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-[#16161C] p-6 rounded-2xl border border-gray-800 space-y-4">
          <h4 className="font-bold text-white mb-4">Nuevo {config.title.slice(0, -1)}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {config.fields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleInputChange}
                  min={field.min}
                  max={field.max}
                  required
                  className="w-full px-4 py-2 bg-[#0F0F12] border border-gray-800 rounded-xl focus:border-red-500 focus:outline-none text-white transition-all"
                  placeholder={`Introduce ${field.label.toLowerCase()}`}
                />
              </div>
            ))}
          </div>
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      )}

      <div className="glass rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#161622]/60 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800">
              <tr>
                <th className="p-4 pl-6">ID</th>
                {config.fields.map(field => (
                  <th key={field.name} className="p-4">{field.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-855/60">
              {items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-[#16161C]/30">
                  <td className="p-4 pl-6 text-gray-500 font-mono text-xs">#{item.id}</td>
                  {config.fields.map(field => (
                    <td key={field.name} className="p-4">
                      {field.type === 'number' && type !== 'circuits' ? (
                        <div className="flex items-center gap-2">
                          <span className="w-6">{item[field.name]}</span>
                          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden max-w-[60px]">
                            <div 
                              className="h-full bg-red-500" 
                              style={{ width: `${item[field.name]}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        item[field.name]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={config.fields.length + 1} className="p-8 text-center text-gray-500">
                    No hay registros en este diccionario.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DictionaryManager;
