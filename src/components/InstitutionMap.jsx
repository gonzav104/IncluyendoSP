import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Mapa de ubicación con Leaflet + OpenStreetMap (sin API key).
// Usamos un divIcon propio en vez de los iconos default de Leaflet:
// con bundlers (Vite) las rutas de los PNG se rompen, y de paso el pin
// sigue la paleta teal del diseño.

const PIN_SVG = `
<svg width="34" height="44" viewBox="0 0 24 24" fill="#0d9488" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round">
  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z" />
  <circle cx="12" cy="10" r="3" fill="#ffffff" stroke="none" />
</svg>`

const pinIcon = L.divIcon({
  className: 'incluyendo-sp-pin',
  html: PIN_SVG,
  iconSize: [34, 44],
  iconAnchor: [17, 44],
  popupAnchor: [0, -40],
})

// Al montar dentro de un modal, Leaflet puede calcular mal el tamaño del
// contenedor; invalidateSize fuerza el re-layout correcto.
function MapResizer() {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 100)
    return () => clearTimeout(timer)
  }, [map])
  return null
}

export default function InstitutionMap({ institution }) {
  const coords = institution?.address?.coordinates

  // Sin coordenadas no hay mapa: rendimos null en silencio.
  if (!coords?.lat || !coords?.lng) return null

  const position = [coords.lat, coords.lng]

  return (
    <div className="relative z-0 overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        center={position}
        zoom={16}
        scrollWheelZoom={false}
        className="z-0 h-56 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={pinIcon}>
          <Popup>
            <span className="text-sm font-bold text-slate-900">{institution.name}</span>
            <br />
            <span className="text-xs text-slate-500">{institution.address.street}</span>
          </Popup>
        </Marker>
        <MapResizer />
      </MapContainer>
    </div>
  )
}
