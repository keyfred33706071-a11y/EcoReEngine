import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Zap, Info, BookOpen } from 'lucide-react';
import { DictionaryEntry, fetchDictionaryEntries, fetchProfile, updateProfile } from '../lib/firestore';
import { checkAndAwardAchievements } from '../lib/achievementChecker';
import { showAchievementPopup } from '../components/AchievementPopup';

const DEFAULT_COMPONENTS: DictionaryEntry[] = [
  { id: '1', name: 'Resistencia', category: 'Pasivo', description: 'Componente que limita el flujo de corriente eléctrica en un circuito.', function_desc: 'Controla la intensidad de corriente, disipa energía como calor y protege componentes sensibles.', unit: 'Ohm (Ω)', common_source: 'Se encuentra en casi cualquier placa de circuito impreso de cargadores, radios o electrodomésticos.', image_url: '/diccionario/resistencia.png', color_class: 'text-red-400' },
  { id: '2', name: 'Condensador', category: 'Pasivo', description: 'Componente que almacena temporalmente energía en un campo eléctrico.', function_desc: 'Filtra señales de ruido eléctrico, estabiliza el voltaje y bloquea la corriente continua.', unit: 'Farad (F)', common_source: 'Se encuentra en fuentes de poder, placas base de PCs y sistemas de audio.', image_url: '/diccionario/condensador.png', color_class: 'text-orange-400' },
  { id: '3', name: 'LED', category: 'Semiconductor', description: 'Diodo Emisor de Luz que brilla al ser atravesado por la corriente.', function_desc: 'Emite luz visible o infrarroja eficientemente cuando recibe corriente en la dirección correcta.', unit: 'Voltios (V)', common_source: 'Indicadores luminosos de routers, pantallas de TV vieja, bombillas LED y juguetes.', image_url: '/diccionario/diodo-led.png', color_class: 'text-yellow-400' },
  { id: '4', name: 'Diodo', category: 'Semiconductor', description: 'Dispositivo semiconductor que permite el paso de la corriente en un solo sentido.', function_desc: 'Se usa para rectificación de corriente alterna (CA a CC) y protección contra polaridad inversa.', unit: 'Amperaje (A)', common_source: 'Adaptadores de corriente, cargadores y fuentes de alimentación.', image_url: '/diccionario/diodo.png', color_class: 'text-blue-400' },
  { id: '5', name: 'Transistor', category: 'Semiconductor', description: 'Componente clave que amplifica señales eléctricas o actúa como interruptor electrónico.', function_desc: 'Permite controlar una corriente grande mediante una señal de control muy pequeña.', unit: 'Ganancia (hFE)', common_source: 'Procesadores, amplificadores de audio, interruptores lógicos en juguetes y electrodomésticos.', image_url: '/diccionario/transistor.png', color_class: 'text-purple-400' },
  { id: '6', name: 'Bobina (Inductor)', category: 'Pasivo', description: 'Almacena energía temporalmente en forma de campo magnético.', function_desc: 'Se opone a los cambios bruscos de corriente y se usa para sintonizar frecuencias y filtrar señales.', unit: 'Henry (H)', common_source: 'Sistemas de radio, fuentes conmutadas, motores eléctricos viejos y transformadores.', image_url: '/diccionario/bobina.png', color_class: 'text-pink-400' },
  { id: '7', name: 'Fusible', category: 'Protección', description: 'Dispositivo de seguridad que interrumpe el circuito si la corriente supera un límite.', function_desc: 'Protege el circuito completo contra sobrecorrientes o cortocircuitos quemando su filamento interno.', unit: 'Amperaje (A)', common_source: 'Entrada de alimentación de electrodomésticos grandes, cargadores e inversores de coche.', image_url: '/diccionario/fusible.png', color_class: 'text-red-500' },
  { id: '8', name: 'Interruptor', category: 'Control', description: 'Dispositivo electromecánico que desvía o interrumpe la corriente eléctrica.', function_desc: 'Abre o cierra el paso de corriente manualmente de forma física.', unit: 'Contactos (SPST/SPDT)', common_source: 'Paneles frontales, juguetes, lámparas, teclados viejos y ratones.', image_url: '/diccionario/interruptor.png', color_class: 'text-emerald-400' },
];

interface DiccionarioProps {
  onBack?: () => void;
  userId?: string;
}

const Diccionario: React.FC<DiccionarioProps> = ({ onBack, userId }) => {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  useEffect(() => {
    fetchDictionaryEntries().then(data => {
      setEntries(data.length > 0 ? data : DEFAULT_COMPONENTS);
      setLoading(false);
    }).catch(() => {
      setEntries(DEFAULT_COMPONENTS);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedComponent || !userId) return;
    (async () => {
      const prof = await fetchProfile(userId).catch(() => null);
      if (prof) {
        const views = (prof as any).dictionary_views ?? 0;
        await updateProfile(userId, { dictionary_views: views + 1 } as any).catch(() => {});
        checkAndAwardAchievements(userId, prof).then(e => e.forEach(showAchievementPopup)).catch(() => {});
      }
    })();
  }, [selectedComponent, userId]);

  const filteredComponents = entries.filter(
    (comp) =>
      comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <button onClick={() => onBack?.()} className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="section-title flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            Diccionario de Componentes
          </h2>
          <p className="section-subtitle mt-1">
            Catálogo visual interactivo de piezas electrónicas que puedes recuperar de basura electrónica (e-waste).
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 flex-1">
        <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Busca un componente por nombre o categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-sm text-slate-300 placeholder-slate-500 focus:outline-none w-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredComponents.length === 0 ? (
          <div className="col-span-full card text-center py-12 flex flex-col items-center justify-center">
            <Zap className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-slate-400">No se encontraron componentes para tu búsqueda.</p>
          </div>
        ) : filteredComponents.map((component) => (
          <div
            key={component.id}
            onClick={() => setSelectedComponent(selectedComponent === component.id ? null : component.id)}
            className="card-hover overflow-hidden flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className={`bg-slate-900 h-48 rounded-xl border ${component.color_class?.replace('text-', 'border-').split(' ')[0] || 'border-slate-700/30'} overflow-hidden flex items-center justify-center`}>
                {component.image_url ? (
                  <img src={component.image_url} alt={component.name} className="w-full h-full object-contain p-2" loading="lazy" />
                ) : (
                  <div className="text-slate-600 text-4xl font-bold">{component.name[0]}</div>
                )}
              </div>
              <div className="p-2 pt-4">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`text-lg font-bold ${component.color_class || 'text-slate-100'}`}>{component.name}</h3>
                  <span className="badge bg-slate-800 text-slate-400 border border-slate-700">{component.category}</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed mt-2">{component.description}</p>
              </div>
            </div>

            <div className="p-2 pt-4">
              <button className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5 hover:text-emerald-300 transition-colors">
                <Info size={14} />
                {selectedComponent === component.id ? 'Ocultar detalles' : 'Ver Detalles'}
              </button>
            </div>

            {selectedComponent === component.id && (
              <div className="border-t border-slate-700/50 mt-4 pt-4 space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-slate-300 mb-1">Función Principal:</h4>
                  <p className="text-slate-400 leading-relaxed">{component.function_desc}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-300 mb-1">Unidad de Medida:</h4>
                  <p className="text-emerald-400 font-mono bg-slate-900/60 border border-slate-800 p-1.5 rounded text-center">
                    {component.unit}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-300 mb-1">¿Dónde encontrarlo en e-waste?:</h4>
                  <p className="text-slate-400 leading-relaxed">{component.common_source}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Diccionario;
