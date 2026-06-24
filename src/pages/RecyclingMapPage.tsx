import { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, Search, Navigation, ExternalLink, Filter, Menu, X, Locate } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchRecyclingCenters, RecyclingCenter } from '../lib/firestore';

const ACCEPT_FILTERS = ['todos', 'electrónicos', 'baterías', 'pilas', 'celulares', 'computadoras'];

const TYPE_ICONS: Record<string, string> = { centro: '🏭', punto: '📍', tienda: '🏪' };
const TYPE_LABELS: Record<string, string> = { centro: 'Centro de Acopio', punto: 'Punto Verde', tienda: 'EcoTienda' };

const STATIC_CENTERS: RecyclingCenter[] = [
  { id: 's1', name: 'EcoCentro Caracas', address: 'Av. Libertador, Edif. Eco, Pb', city: 'Caracas', phone: '0212-555-0101', schedule: 'Lun-Sáb 8:00-17:00', accepts: ['electrónicos', 'baterías', 'pilas', 'celulares', 'computadoras'], lat: 10.4806, lng: -66.9036, type: 'centro' },
  { id: 's2', name: 'Punto Verde Miranda', address: 'CC Sambil, Nivel PB, Local 15', city: 'Caracas', phone: '0212-555-0202', schedule: 'Lun-Dom 10:00-20:00', accepts: ['pilas', 'baterías', 'celulares'], lat: 10.4964, lng: -66.8512, type: 'punto' },
  { id: 's3', name: 'ReciclaTech Valencia', address: 'Av. Bolívar Norte, Edif. Techno', city: 'Valencia', phone: '0241-555-0303', schedule: 'Lun-Vie 8:00-16:00', accepts: ['electrónicos', 'computadoras', 'impresoras', 'cables'], lat: 10.1621, lng: -68.0084, type: 'centro' },
  { id: 's4', name: 'EcoPunto Barquisimeto', address: 'Carrera 19 con Calle 28', city: 'Barquisimeto', phone: '0251-555-0404', schedule: 'Lun-Sáb 9:00-17:00', accepts: ['pilas', 'baterías', 'celulares', 'cargadores'], lat: 10.0679, lng: -69.3461, type: 'punto' },
  { id: 's5', name: 'Centro de Acopio Maracaibo', address: 'Av. 5 de Julio, Edif. Verde', city: 'Maracaibo', phone: '0261-555-0505', schedule: 'Lun-Vie 8:00-15:00', accepts: ['electrónicos', 'baterías', 'pilas', 'neveras', 'aires'], lat: 10.6548, lng: -71.6516, type: 'centro' },
  { id: 's6', name: 'Residuos Electrónicos Maturín', address: 'Av. Principal, CC Monagas', city: 'Maturín', phone: '0291-555-0606', schedule: 'Lun-Vie 9:00-16:00', accepts: ['electrónicos', 'computadoras', 'pilas'], lat: 9.7469, lng: -63.1769, type: 'centro' },
  { id: 's7', name: 'EcoTienda Barcelona', address: 'Av. Pedro María Freites, Local 7', city: 'Barcelona', phone: '0281-555-0707', schedule: 'Lun-Sáb 9:00-18:00', accepts: ['celulares', 'baterías', 'cargadores', 'accesorios'], lat: 10.1347, lng: -64.6856, type: 'tienda' },
  { id: 's8', name: 'Punto Ecológico Mérida', address: 'Av. 4, Edif. Solar', city: 'Mérida', phone: '0274-555-0808', schedule: 'Lun-Vie 8:00-17:00', accepts: ['pilas', 'baterías', 'electrónicos pequeños'], lat: 8.5925, lng: -71.1433, type: 'punto' },
  { id: 's9', name: 'Recicla Centro San Cristóbal', address: 'Av. España, Centro Comercial', city: 'San Cristóbal', phone: '0276-555-0909', schedule: 'Lun-Sáb 9:00-17:00', accepts: ['electrónicos', 'computadoras', 'impresoras'], lat: 7.7703, lng: -72.2266, type: 'centro' },
  { id: 's10', name: 'EcoPunto Puerto La Cruz', address: 'Av. Municipal, Local 3', city: 'Puerto La Cruz', phone: '0281-555-1010', schedule: 'Lun-Sáb 8:00-16:00', accepts: ['pilas', 'baterías', 'celulares'], lat: 10.2056, lng: -64.6285, type: 'punto' },
  { id: 's11', name: 'Centro de Reciclaje Ciudad Guayana', address: 'Av. Guayana, Zona Industrial', city: 'Ciudad Guayana', phone: '0286-555-1111', schedule: 'Lun-Vie 8:00-15:00', accepts: ['electrónicos', 'baterías', 'pilas', 'metales'], lat: 8.3454, lng: -62.6785, type: 'centro' },
  { id: 's12', name: 'EcoTienda Cumaná', address: 'Av. Universidad, Local 22', city: 'Cumaná', phone: '0293-555-1212', schedule: 'Lun-Sáb 9:00-18:00', accepts: ['celulares', 'baterías', 'cargadores'], lat: 10.4534, lng: -64.1726, type: 'tienda' },
  { id: 's13', name: 'Punto Verde Los Teques', address: 'Av. Bermúdez, Edif. Municipal', city: 'Los Teques', phone: '0212-555-1313', schedule: 'Lun-Vie 8:00-16:00', accepts: ['pilas', 'baterías', 'electrónicos pequeños'], lat: 10.3422, lng: -67.0398, type: 'punto' },
  { id: 's14', name: 'Recicla Falcón Coro', address: 'Calle Zamora, Edif. Ambiental', city: 'Coro', phone: '0268-555-1414', schedule: 'Lun-Vie 9:00-17:00', accepts: ['electrónicos', 'baterías', 'pilas'], lat: 11.4043, lng: -69.6806, type: 'centro' },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function RecyclingMapPage({ onBack }: { onBack?: () => void }) {
  const [centers, setCenters] = useState<RecyclingCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAccept, setFilterAccept] = useState('todos');
  const [showMenu, setShowMenu] = useState(false);
  const [selected, setSelected] = useState<RecyclingCenter | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchRecyclingCenters();
        if (data.length > 0) { setCenters(data); setLoading(false); return; }
      } catch { /* fallback a datos estáticos */ }

      setCenters(STATIC_CENTERS);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const filtered = useMemo(() => {
    let list = centers;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.address.toLowerCase().includes(q));
    }
    if (filterAccept !== 'todos') {
      list = list.filter(c => c.accepts.includes(filterAccept));
    }
    if (userLocation) {
      list = [...list].sort((a, b) => haversineKm(userLocation.lat, userLocation.lng, a.lat, a.lng) - haversineKm(userLocation.lat, userLocation.lng, b.lat, b.lng));
    }
    return list;
  }, [centers, search, filterAccept, userLocation]);

  // Leaflet map
  useEffect(() => {
    if (!mapRef.current || loading || centers.length === 0) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([8.5, -67], 6.5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(mapInstance.current);
    }

    const map = mapInstance.current;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const markerIcon = (type: string) => {
      const colors: Record<string, string> = { centro: '#10b981', punto: '#f59e0b', tienda: '#3b82f6' };
      const color = colors[type] || '#10b981';
      return L.divIcon({
        className: 'leaflet-marker-custom',
        html: `<div style="
          width:32px;height:32px;border-radius:50%;
          background:${color};color:white;
          display:flex;align-items:center;justify-content:center;
          font-size:16px;box-shadow:0 2px 6px rgba(0,0,0,.3);
          border:2px solid white;
        ">${TYPE_ICONS[type] || '📍'}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    };

    filtered.forEach(c => {
      const marker = L.marker([c.lat, c.lng], { icon: markerIcon(c.type) })
        .addTo(map!)
        .bindPopup(`
          <strong style="font-size:13px">${c.name}</strong><br>
          <span style="font-size:11px;color:#666">${TYPE_LABELS[c.type]}</span><br>
          <span style="font-size:11px">${c.address}, ${c.city}</span>
          ${c.phone ? `<br><span style="font-size:11px">📞 ${c.phone}</span>` : ''}
          ${c.schedule ? `<br><span style="font-size:11px">🕐 ${c.schedule}</span>` : ''}
          <br><span style="font-size:10px;color:#999">${c.accepts.join(', ')}</span>
          <br><a href="https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}"
            target="_blank" rel="noopener noreferrer" style="font-size:11px;color:#10b981">
            🧭 Cómo llegar
          </a>
        `);
      marker.on('click', () => setSelected(c));
      markersRef.current.push(marker);
    });

    if (userLocation) {
      const locIcon = L.divIcon({
        className: 'leaflet-marker-custom',
        html: `<div style="
          width:20px;height:20px;border-radius:50%;
          background:#6366f1;border:3px solid white;
          box-shadow:0 0 0 3px #6366f180,0 2px 6px rgba(0,0,0,.3);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: locIcon }).addTo(map!);
    }

    if (filtered.length > 0) {
      const bounds = L.latLngBounds(filtered.map(c => [c.lat, c.lng] as [number, number]));
      if (userLocation) bounds.extend([userLocation.lat, userLocation.lng]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [filtered, userLocation, loading]);

  useEffect(() => {
    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in pb-10">
        <div className="flex items-center gap-3">
          {onBack && <button onClick={onBack} className="btn-ghost p-1.5 -ml-1.5"><ArrowLeft className="w-5 h-5" /></button>}
          <h2 className="text-base font-bold text-slate-100">Mapa de Reciclaje</h2>
        </div>
        <div className="card text-center py-16">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Cargando centros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <div className="flex items-center gap-3 sticky top-0 bg-slate-950/90 backdrop-blur-md z-30 -mx-4 px-4 py-3 border-b border-slate-800/50">
        {onBack && <button onClick={onBack} className="btn-ghost p-1.5 -ml-1.5"><ArrowLeft className="w-5 h-5" /></button>}
        <div>
          <h2 className="text-base font-bold text-slate-100">Mapa de Reciclaje</h2>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            {locating ? <><Locate className="w-3 h-3 animate-spin" /> Obteniendo ubicación...</>
            : userLocation ? <><Locate className="w-3 h-3 text-emerald-400" /> {filtered.length} centros cerca de ti</>
            : `${filtered.length} centros`}
          </p>
        </div>
        <div className="ml-auto flex gap-1 bg-slate-800/60 rounded-lg p-0.5">
          <button onClick={() => setViewMode('map')}
            className={`text-xs px-2.5 py-1.5 rounded-md transition-all ${viewMode === 'map' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            Mapa
          </button>
          <button onClick={() => setViewMode('list')}
            className={`text-xs px-2.5 py-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            Lista
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar ciudad, nombre o dirección..."
          className="input w-full pl-10 text-sm" />
      </div>

      <div className="relative">
        <button onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-800/60 text-slate-300 border border-slate-700/50 hover:border-slate-600/50 transition-all w-full sm:w-auto">
          {showMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>{filterAccept === 'todos' ? 'Todos' : filterAccept.charAt(0).toUpperCase() + filterAccept.slice(1)}</span>
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-auto sm:ml-0" />
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute top-full left-0 right-auto mt-1 z-50 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl shadow-slate-950/50 overflow-hidden min-w-[180px] animate-slide-up">
              {ACCEPT_FILTERS.map(f => (
                <button key={f} onClick={() => { setFilterAccept(f); setShowMenu(false); }}
                  className={`w-full text-left text-sm px-4 py-2.5 transition-all flex items-center gap-2 ${
                    filterAccept === f
                      ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}>
                  {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
                  {filterAccept === f && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No se encontraron centros</p>
        </div>
      ) : viewMode === 'map' ? (
        <div className="relative">
          <div ref={mapRef} className="w-full h-[400px] rounded-xl overflow-hidden border border-slate-700/50 z-10" />
          <div className="flex justify-center gap-4 mt-2 text-[10px] text-slate-500">
            <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1" /> Centro de Acopio</span>
            <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1" /> Punto Verde</span>
            <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mr-1" /> EcoTienda</span>
          </div>
          {selected && (
            <div className="card-hover border-emerald-500/20 mt-3">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-100">{selected.name}</h3>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    {TYPE_ICONS[selected.type]} {TYPE_LABELS[selected.type]}
                  </span>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-200 p-1">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="space-y-2 text-sm">
                {userLocation && (
                  <p className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                    <Locate className="w-3.5 h-3.5" /> {haversineKm(userLocation.lat, userLocation.lng, selected.lat, selected.lng).toFixed(1)} km de ti
                  </p>
                )}
                <p className="text-slate-300 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  {selected.address}
                </p>
                {selected.phone && (
                  <p className="text-slate-300 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                    {selected.phone}
                  </p>
                )}
                {selected.schedule && (
                  <p className="text-slate-300 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {selected.schedule}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selected.accepts.map(a => (
                    <span key={a} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">{a}</span>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                    <Navigation className="w-3.5 h-3.5" /> Cómo llegar
                  </a>
                  {selected.phone && (
                    <a href={`tel:${selected.phone}`}
                      className="text-xs font-semibold text-slate-200 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                      Llamar
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(center => (
            <div key={center.id} onClick={() => setSelected(selected?.id === center.id ? null : center)}
              className={`card-hover flex items-start gap-3 cursor-pointer ${selected?.id === center.id ? 'ring-1 ring-emerald-500/30' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-lg shrink-0">
                {TYPE_ICONS[center.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-100">{center.name}</p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                  {userLocation && (
                    <span className="text-emerald-400 font-medium">{haversineKm(userLocation.lat, userLocation.lng, center.lat, center.lng).toFixed(1)} km</span>
                  )}
                  {center.city}
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {center.accepts.slice(0, 3).map(a => (
                    <span key={a} className="text-[9px] text-emerald-500/80 bg-emerald-500/8 px-1.5 py-0.5 rounded">{a}</span>
                  ))}
                  {center.accepts.length > 3 && (
                    <span className="text-[9px] text-slate-500">+{center.accepts.length - 3}</span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                <span className="text-[10px] text-slate-500">{center.schedule?.split(' ')[0] || ''}</span>
                <ExternalLink className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
