interface Props {
  onNavigate?: (page: string) => void;
}

const topics = [
  {
    title: '¿Qué es la electrónica?',
    icon: '⚡',
    content: 'La electrónica es la rama de la física que estudia el control y movimiento de electrones en dispositivos como diodos, transistores y circuitos integrados. A diferencia de la electricidad convencional (que solo transporta energía), la electrónica permite procesar señales, almacenar información y tomar decisiones lógicas.',
    details: [
      'Corriente eléctrica: flujo de electrones a través de un conductor.',
      'Tensión (voltaje): la fuerza que empuja los electrones, medida en voltios (V).',
      'Resistencia: la oposición al paso de la corriente, medida en ohmios (Ω).',
      'Potencia: la energía consumida por un componente, medida en vatios (W).',
    ],
  },
  {
    title: 'Ley de Ohm',
    icon: '📐',
    content: 'La Ley de Ohm es la regla fundamental de la electrónica. Relaciona la tensión (V), la corriente (I) y la resistencia (R) en un circuito.',
    formula: 'V = I × R',
    details: [
      'V = Voltaje en voltios (V)',
      'I = Corriente en amperios (A)',
      'R = Resistencia en ohmios (Ω)',
      'Ejemplo: un LED de 2V con 20mA necesita una resistencia de R = (5V - 2V) / 0.02A = 150Ω',
    ],
  },
  {
    title: 'Leyes de Kirchhoff',
    icon: '🔀',
    content: 'Las leyes de Kirchhoff permiten analizar circuitos complejos donde hay múltiples caminos para la corriente.',
    sections: [
      {
        subtitle: '1ra Ley — Ley de Corrientes (KCL)',
        text: 'La suma de las corrientes que entran a un nodo es igual a la suma de las corrientes que salen. En un nodo, la carga no se acumula.',
      },
      {
        subtitle: '2da Ley — Ley de Voltajes (KVL)',
        text: 'La suma de todas las caídas de voltaje en un circuito cerrado es igual a la tensión total aplicada. Es decir, la energía se conserva.',
      },
    ],
  },
  {
    title: 'Componentes Electrónicos Básicos',
    icon: '🔧',
    sections: [
      {
        subtitle: 'Resistencias',
        text: 'Limitan el flujo de corriente. Su valor se lee con un código de colores. Se usan para proteger LEDs, dividir voltajes y establecer corrientes de base en transistores.',
      },
      {
        subtitle: 'Capacitores',
        text: 'Almacenan energía eléctrica temporalmente. Se usan para filtrar ruido, suavizar fuentes de poder y temporizadores. Se miden en faradios (F).',
      },
      {
        subtitle: 'Diodos',
        text: 'Permiten la corriente en un solo sentido. El LED (diodo emisor de luz) es el más común. Los diodos rectificadores convierten CA en CC.',
      },
      {
        subtitle: 'Transistores',
        text: 'Actúan como interruptores o amplificadores. Con una pequeña corriente de base controlan una corriente mucho mayor entre colector y emisor.',
      },
      {
        subtitle: 'Circuitos Integrados (CI)',
        text: 'Contienen miles o millones de componentes miniaturizados en un chip. Ejemplos: temporizador 555, amplificador operacional LM358, microcontroladores.',
      },
    ],
  },
  {
    title: 'Corriente Alterna vs Continua',
    icon: '🔄',
    content: 'Dos tipos fundamentales de corriente eléctrica que debes conocer:',
    sections: [
      {
        subtitle: 'Corriente Continua (DC)',
        text: 'Los electrones fluyen siempre en la misma dirección. Es la que usan las baterías, pilas, paneles solares y la mayoría de circuitos electrónicos.',
      },
      {
        subtitle: 'Corriente Alterna (AC)',
        text: 'Los electrones cambian de dirección periódicamente (50-60 Hz). Es la que llega a los tomacorrientes de casa porque es más eficiente para transportar energía a larga distancia.',
      },
    ],
  },
  {
    title: 'Circuitos en Serie y Paralelo',
    icon: '🔗',
    sections: [
      {
        subtitle: 'Circuito en Serie',
        text: 'Los componentes están uno tras otro. La corriente es la misma en todos, pero el voltaje se divide. Si un componente falla, todo el circuito se abre.',
      },
      {
        subtitle: 'Circuito en Paralelo',
        text: 'Los componentes están conectados en ramas separadas. El voltaje es el mismo en todas, pero la corriente se divide. Si una rama falla, las demás siguen funcionando.',
      },
    ],
  },
  {
    title: 'Mediciones con el Multímetro',
    icon: '📏',
    content: 'El multímetro es la herramienta esencial para diagnosticar circuitos y componentes.',
    details: [
      'Modo Voltaje (V): Mide tensión. Conecta en paralelo al componente.',
      'Modo Corriente (A): Mide amperaje. Conecta el multímetro en serie.',
      'Modo Resistencia (Ω): Mide ohmios. Nunca midas resistencia con el circuito encendido.',
      'Modo Continuidad: Emite un pitido si hay conexión. Ideal para verificar pistas, cables y fusibles.',
      'Modo Diodo: Prueba diodos y LEDs. Muestra la caída de tensión directa.',
    ],
  },
  {
    title: 'Seguridad en Electrónica',
    icon: '🛡️',
    content: 'Reglas básicas que todo aficionado debe seguir:',
    details: [
      'Desconecta siempre los equipos antes de abrirlos o modificarlos.',
      'Los capacitores grandes pueden almacenar carga letal incluso apagados. Descárgalos con una resistencia.',
      'Usa gafas de seguridad al cortar patillas o desmontar componentes.',
      'Trabaja en superficies no conductoras (madera, vidrio, tapete antiestático).',
      'El estaño para soldar contiene plomo. Lávate las manos después de soldar y trabaja en área ventilada.',
      'Nunca conectes LEDs o transistores directamente a una fuente sin resistencia limitadora.',
      'Respeta la polaridad de los componentes electrolíticos (capacitores, diodos, LEDs).',
    ],
  },
  {
    title: 'Reciclaje de Componentes',
    icon: '♻️',
    content: 'Cómo recuperar componentes útiles de aparatos electrónicos desechados:',
    details: [
      'Fuentes de poder: contienen transformadores, capacitores, diodos rectificadores y transistores.',
      'Tarjetas madre: tienen resistencias, capacitores, osciladores de cuarzo y conectores.',
      'Electrodomésticos rotos: motores DC, cables, interruptores, LEDs y sensores.',
      'Cargadores viejos: reguladores de voltaje (7805, LM317), puentes de diodos y capacitores.',
      'Equipos de audio: potenciómetros, capacitores de audio, conectores RCA y amplificadores operacionales.',
      'Monitores LCD: tiras LED, láminas difusoras, espejos y cables flexibles.',
    ],
  },
];

export default function ElectronicaIntro({ onNavigate }: Props) {
  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => onNavigate?.('home')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="text-xl font-bold text-slate-100">Introducción a la Electrónica</h1>
      </div>

      <p className="text-sm text-slate-400 mb-8">
        Aprende los fundamentos de la electrónica, desde las leyes básicas hasta
        componentes y seguridad. Ideal para empezar con el reciclaje de e-waste.
      </p>

      <div className="space-y-6">
        {topics.map((topic) => (
          <details key={topic.title} className="group bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden open:border-emerald-700/30">
            <summary className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-700/40 transition-colors list-none">
              <span className="text-3xl">{topic.icon}</span>
              <div className="flex-1">
                <h2 className="text-base font-bold text-slate-100">{topic.title}</h2>
                {topic.content && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{topic.content}</p>}
              </div>
              <svg className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </summary>

            <div className="px-5 pb-6 pt-0 border-t border-slate-700/50">
              {topic.content && (
                <p className="text-sm text-slate-300 mt-4 leading-relaxed">{topic.content}</p>
              )}

              {topic.formula && (
                <div className="mt-4 p-4 bg-slate-900/80 rounded-xl border border-emerald-700/30 text-center">
                  <span className="text-2xl font-bold text-emerald-400 font-mono">{topic.formula}</span>
                </div>
              )}

              {topic.details && (
                <ul className="mt-4 space-y-2">
                  {topic.details.map((d, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                      <span className="text-emerald-500 mt-0.5 flex-shrink-0">▸</span>
                      {d}
                    </li>
                  ))}
                </ul>
              )}

              {topic.sections && (
                <div className="mt-4 space-y-4">
                  {topic.sections.map((s, i) => (
                    <div key={i} className="p-4 bg-slate-900/40 rounded-xl border border-slate-700/30">
                      <h4 className="text-sm font-semibold text-emerald-400 mb-1">{s.subtitle}</h4>
                      <p className="text-sm text-slate-300 leading-relaxed">{s.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>
        ))}
      </div>

      {/* Quick reference card */}
      <div className="mt-8 bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-800/30 rounded-2xl p-6">
        <h3 className="text-base font-bold text-slate-100 mb-3">📋 Resumen rápido de fórmulas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/30">
            <p className="text-emerald-400 font-semibold mb-1">Ley de Ohm</p>
            <p className="text-slate-300 font-mono">V = I × R &nbsp;|&nbsp; I = V / R &nbsp;|&nbsp; R = V / I</p>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/30">
            <p className="text-emerald-400 font-semibold mb-1">Potencia</p>
            <p className="text-slate-300 font-mono">P = V × I &nbsp;|&nbsp; P = I² × R</p>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/30">
            <p className="text-emerald-400 font-semibold mb-1">Resistencias en Serie</p>
            <p className="text-slate-300 font-mono">R_total = R₁ + R₂ + R₃ + ...</p>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/30">
            <p className="text-emerald-400 font-semibold mb-1">Resistencias en Paralelo</p>
            <p className="text-slate-300 font-mono">1/R_total = 1/R₁ + 1/R₂ + ...</p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 mt-8 mb-4">
        La práctica constante con componentes reciclados es la mejor forma de aprender electrónica.
      </p>
    </div>
  );
}
