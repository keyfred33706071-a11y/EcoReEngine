import React from 'react';
import { ArrowLeft, Sparkles, Calculator, BookOpen, BookMarked, Scan, MapPin } from 'lucide-react';

interface ToolsHubProps {
  onSelectTool: (toolPage: string) => void;
  onBack?: () => void;
}

const ToolsHub: React.FC<ToolsHubProps> = ({ onSelectTool, onBack }) => {
  const tools = [
    {
      id: 'assistant',
      name: 'Asistente IA (EcoBot)',
      desc: 'Orientación en tiempo real y solución de problemas con IA.',
      icon: Sparkles,
      color: 'from-violet-500/20 to-purple-600/20 border-violet-500/30 text-violet-400',
    },
    {
      id: 'calculator',
      name: 'Calculadora de Resistencias',
      desc: 'Calcula el valor en Ohmios del código de colores.',
      icon: Calculator,
      color: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/30 text-emerald-400',
    },
    {
      id: 'scanner',
      name: 'Scanner de Componentes',
      desc: 'Identifica componentes electrónicos con IA usando la cámara.',
      icon: Scan,
      color: 'from-rose-500/20 to-pink-600/20 border-rose-500/30 text-rose-400',
    },
    {
      id: 'formulas',
      name: 'Fórmulas Rápidas',
      desc: 'Ley de Ohm, potencia, resistencias en serie y paralelo.',
      icon: BookMarked,
      color: 'from-amber-500/20 to-yellow-600/20 border-amber-500/30 text-amber-400',
    },
    {
      id: 'dictionary',
      name: 'Diccionario de Componentes',
      desc: 'Catálogo interactivo de piezas electrónicas de e-waste.',
      icon: BookOpen,
      color: 'from-blue-500/20 to-cyan-600/20 border-blue-500/30 text-blue-400',
    },
    {
      id: 'recycling-map',
      name: 'Mapa de Reciclaje',
      desc: 'Encuentra centros de reciclaje cercanos con dirección y contacto.',
      icon: MapPin,
      color: 'from-green-500/20 to-lime-600/20 border-green-500/30 text-green-400',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center gap-2">
        <button onClick={() => onBack?.()} className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="section-title flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            Herramientas
          </h2>
          <p className="section-subtitle mt-1 max-w-2xl">
            Un espacio unificado para consultar, calcular, escanear y aprender más rápido sin salir del flujo de trabajo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="card-hover cursor-pointer p-6 flex items-start gap-4 border border-slate-800/80"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0 border`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-slate-100 text-base leading-tight">{tool.name}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{tool.desc}</p>
                <span className="inline-flex items-center text-xs font-semibold text-emerald-400 gap-1">
                  Abrir herramienta
                  <ArrowLeft className="w-3 h-3 rotate-180" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ToolsHub;