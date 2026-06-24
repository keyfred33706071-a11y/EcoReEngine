import { useEffect, useState } from 'react';
import { Package, Plus, Search, Trash2, Recycle, Zap, X } from 'lucide-react';
import { Component, UserComponent, categoryLabel, fetchComponents, fetchUserComponents, addUserComponent, removeUserComponent, fetchProfile, createProfile, updateProfile } from '../lib/firestore';

interface InventoryPageProps {
  userId: string;
  onXpGained: () => void;
}

const CONDITIONS = ['excellent', 'good', 'fair', 'damaged'];
const CONDITION_LABELS: Record<string, string> = {
  excellent: 'Excelente', good: 'Bueno', fair: 'Regular', damaged: 'Dañado',
};
const CONDITION_COLORS: Record<string, string> = {
  excellent: 'text-emerald-400', good: 'text-teal-400', fair: 'text-amber-400', damaged: 'text-red-400',
};

export default function InventoryPage({ userId, onXpGained }: InventoryPageProps) {
  const [components, setComponents] = useState<Component[]>([]);
  const [inventory, setInventory] = useState<(UserComponent & { component: Component })[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState('good');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [componentSearch, setComponentSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
    const [comps, inv] = await Promise.all([
      fetchComponents(),
      fetchUserComponents(userId),
    ]);
    setComponents(comps as Component[]);
    setInventory((inv as (UserComponent & { component: Component })[]));
    setLoading(false);
  }

  async function addToInventory() {
    if (!selectedComponent) return;
    setAdding(true);
    try {
      await addUserComponent({
        user_id: userId,
        component_id: selectedComponent.id,
        quantity,
        condition,
        source,
        notes,
      });
      const profile = await fetchProfile(userId);
      if (profile) {
        const newCo2 = (Number(profile.co2_saved_kg) || 0) + (selectedComponent.co2_saved_g * quantity / 1000);
        await updateProfile(userId, {
          total_xp: (profile.total_xp ?? 0) + selectedComponent.salvage_xp * quantity,
          components_salvaged: (profile.components_salvaged ?? 0) + quantity,
          co2_saved_kg: newCo2,
        });
      } else {
        await createProfile(userId, {
          total_xp: selectedComponent.salvage_xp * quantity,
          components_salvaged: quantity,
          co2_saved_kg: selectedComponent.co2_saved_g * quantity / 1000,
        });
      }
      onXpGained();
      setShowAddModal(false);
      setSelectedComponent(null);
      setQuantity(1);
      setCondition('good');
      setSource('');
      setNotes('');
      loadData();
    } catch {}
    setAdding(false);
  }

  async function removeFromInventory(id: string) {
    await removeUserComponent(id);
    setInventory(prev => prev.filter(i => i.id !== id));
  }

  const categories = ['all', ...new Set(components.map(c => c.category))];

  const filteredInventory = inventory.filter(item => {
    if (filterCategory !== 'all' && item.component?.category !== filterCategory) return false;
    if (search && !item.component?.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredCatalog = components.filter(c =>
    !componentSearch || c.name.toLowerCase().includes(componentSearch.toLowerCase()) ||
    c.category.toLowerCase().includes(componentSearch.toLowerCase())
  );

  const totalComponents = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const totalCo2Saved = inventory.reduce((sum, i) => sum + (i.component?.co2_saved_g ?? 0) * i.quantity, 0);
  const totalXpFromInventory = inventory.reduce((sum, i) => sum + (i.component?.salvage_xp ?? 0) * i.quantity, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Componentes', value: totalComponents, icon: Package, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'CO2 salvado', value: totalCo2Saved >= 1000 ? `${(totalCo2Saved/1000).toFixed(1)}kg` : `${totalCo2Saved}g`, icon: Recycle, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
          { label: 'XP ganado', value: totalXpFromInventory, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`card ${bg} border flex items-center gap-3`}>
            <Icon className={`w-6 h-6 ${color} flex-shrink-0`} />
            <div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 flex-1">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar en mi inventario..."
            className="bg-transparent text-sm text-slate-300 placeholder-slate-500 focus:outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'Todas las categorías' : categoryLabel(cat)}</option>
            ))}
          </select>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>
      </div>

      {/* Inventory grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="card h-28 animate-pulse bg-slate-800/40" />)}
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="card text-center py-16">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium mb-1">
            {inventory.length === 0 ? 'Tu inventario está vacío' : 'No hay resultados'}
          </p>
          <p className="text-slate-500 text-sm mb-4">
            {inventory.length === 0 ? 'Empieza recuperando componentes de aparatos en desuso' : 'Prueba con otro filtro'}
          </p>
          {inventory.length === 0 && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              Agregar primer componente
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInventory.map(item => (
            <div key={item.id} className="card-hover group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-100 text-sm leading-snug">{item.component?.name}</p>
                  <span className="badge-emerald mt-1">{categoryLabel(item.component?.category ?? '')}</span>
                </div>
                <button
                  onClick={() => removeFromInventory(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all p-1 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/60 rounded-lg p-2">
                  <p className="text-slate-500">Cantidad</p>
                  <p className="font-semibold text-slate-200">{item.quantity}</p>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2">
                  <p className="text-slate-500">Estado</p>
                  <p className={`font-semibold ${CONDITION_COLORS[item.condition]}`}>
                    {CONDITION_LABELS[item.condition]}
                  </p>
                </div>
              </div>

              {item.source && (
                <p className="text-xs text-slate-500 mt-2">
                  <span className="text-slate-600">Fuente: </span>{item.source}
                </p>
              )}

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/50">
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <Recycle className="w-3 h-3" />
                  {item.component?.co2_saved_g ? `${item.component.co2_saved_g * item.quantity}g CO2` : ''}
                </span>
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {(item.component?.salvage_xp ?? 0) * item.quantity} XP
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative glass rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h3 className="text-lg font-bold text-slate-100">Agregar componente</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Component selector */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Componente</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={componentSearch}
                    onChange={e => setComponentSearch(e.target.value)}
                    placeholder="Buscar en catálogo..."
                    className="input pl-10 py-2.5"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-xl bg-slate-800/50 p-2 border border-slate-700">
                  {filteredCatalog.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedComponent(c)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm ${
                        selectedComponent?.id === c.id
                          ? 'bg-emerald-600 text-white'
                          : 'hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{c.name}</span>
                        <span className={`text-xs ${selectedComponent?.id === c.id ? 'text-emerald-200' : 'text-slate-500'}`}>
                          {categoryLabel(c.category)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedComponent && (
                <div className="p-3 bg-emerald-900/30 rounded-xl border border-emerald-700/40 text-sm">
                  <p className="text-emerald-400 font-medium mb-1">{selectedComponent.name}</p>
                  <p className="text-slate-400">{selectedComponent.description}</p>
                  <div className="flex gap-3 mt-2">
                    <span className="text-xs text-amber-400">+{selectedComponent.salvage_xp} XP</span>
                    <span className="text-xs text-teal-400">{selectedComponent.co2_saved_g}g CO2 salvado</span>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="input"
                />
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Estado del componente</label>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITIONS.map(c => (
                    <button
                      key={c}
                      onClick={() => setCondition(c)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                        condition === c
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {CONDITION_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Fuente (opcional)</label>
                <input
                  type="text"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  placeholder="Ej: Televisor viejo, computadora descartada..."
                  className="input"
                />
              </div>
            </div>

            <div className="p-6 pt-4 border-t border-slate-700">
              <button
                onClick={addToInventory}
                disabled={!selectedComponent || adding}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Agregar al inventario
                    {selectedComponent && ` · +${selectedComponent.salvage_xp * quantity} XP`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
