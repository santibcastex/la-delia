import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, setDoc } from 'firebase/firestore';
import { getAuth, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithRedirect, signInWithPopup, getRedirectResult } from 'firebase/auth';
import './App.css';


const getNdviDates = () => {
  const dates = [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  for (let m = 0; m < 8; m++) {
    const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    ['21', '11', '01'].forEach(day => {
      const dateStr = `${year}-${month}-${day}`;
      if (dateStr <= todayStr) dates.push(dateStr);
    });
  }
  return dates;
};

const firebaseConfig = {
  apiKey: "AIzaSyAmS8djT1pwnEOjcWTljmh5KDgAOnTi8so",
  authDomain: "la-delia.firebaseapp.com",
  projectId: "la-delia",
  storageBucket: "la-delia.firebasestorage.app",
  messagingSenderId: "587773821917",
  appId: "1:587773821917:web:542ef9f1c9f28e342d2c34"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const POSTREROS_GEOJSON = {
  "type": "FeatureCollection",
  "features": [
    { "type": "Feature", "properties": { "id": 6, "nombre": "6", "ha": 83.32 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.575209936815071, -36.881506987072065 ], [ -58.567820318057883, -36.887338052435666 ], [ -58.57258379809327, -36.893553135361039 ], [ -58.572660402017867, -36.893495413099409 ], [ -58.57274153703608, -36.893566152409129 ], [ -58.572774035097609, -36.89355720022715 ], [ -58.574143330408518, -36.89248752267644 ], [ -58.574927820191682, -36.891982047126312 ], [ -58.581594740171418, -36.887209042743464 ], [ -58.581487232347229, -36.886981264728412 ], [ -58.581495792653463, -36.886806154221588 ], [ -58.575209936815071, -36.881506987072065 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 5, "nombre": "5", "ha": 67.87 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.567819909027676, -36.887338134768505 ], [ -58.560302231428999, -36.893252506701742 ], [ -58.565994884362851, -36.898407047093279 ], [ -58.572547672649179, -36.893693241442492 ], [ -58.57246827486015, -36.893630611518262 ], [ -58.572584270043492, -36.893553141031646 ], [ -58.567819909027676, -36.887338134768505 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 3, "nombre": "3", "ha": 98.81 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.554388256595836, -36.897911262345083 ], [ -58.552630881407552, -36.899333778078564 ], [ -58.5494979815848, -36.901913120102328 ], [ -58.552405134422187, -36.903959303097679 ], [ -58.562128277446455, -36.912113981206083 ], [ -58.563013603327164, -36.911444800369544 ], [ -58.562943291869189, -36.91136710793527 ], [ -58.563096327418691, -36.911263554659797 ], [ -58.563171816449639, -36.911333726565353 ], [ -58.567304543976206, -36.908278378775655 ], [ -58.554388256595836, -36.897911262345083 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 4, "nombre": "4", "ha": 112.37 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.56030220311856, -36.893254013803507 ], [ -58.554399531688119, -36.897910538155578 ], [ -58.567304290408657, -36.908278375717245 ], [ -58.572544800415905, -36.904394471556209 ], [ -58.56030220311856, -36.893254013803507 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 8, "nombre": "8", "ha": 62.86 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.57255207481176, -36.893701888518159 ], [ -58.56599692014413, -36.89841288609734 ], [ -58.572484282959991, -36.904342459943308 ], [ -58.572650245626264, -36.904204077829498 ], [ -58.572650245626328, -36.904204077829753 ], [ -58.572734640078075, -36.904272806266086 ], [ -58.577775604189569, -36.900309153818768 ], [ -58.572718013366327, -36.893713993042176 ], [ -58.572636525718842, -36.893763568019182 ], [ -58.57255207481176, -36.893701888518159 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 7, "nombre": "7", "ha": 96.12 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.587850303398497, -36.892381372273036 ], [ -58.583887673328128, -36.889034710548529 ], [ -58.583049488478764, -36.888493422465515 ], [ -58.582515772191414, -36.888011520597765 ], [ -58.582095079007274, -36.887616243181661 ], [ -58.581590737886124, -36.887216535564157 ], [ -58.572743838283671, -36.893574788277952 ], [ -58.572822451510341, -36.893636675170072 ], [ -58.57271603575731, -36.89370962152298 ], [ -58.577775412867041, -36.900309503119082 ], [ -58.587850303398497, -36.892381372273036 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 10, "nombre": "10", "ha": 136.94 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.587845269599676, -36.892377405862234 ], [ -58.578963735741382, -36.899378334834438 ], [ -58.587243860149812, -36.908049806466913 ], [ -58.591012622596189, -36.904752466671894 ], [ -58.590904498424933, -36.904675858612627 ], [ -58.591006221809558, -36.904587079060931 ], [ -58.591119355672539, -36.904630886323666 ], [ -58.596620996686582, -36.899819648091281 ], [ -58.587845269599676, -36.892377405862234 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 9, "nombre": "9", "ha": 81.42 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.587248094576331, -36.908004013325616 ], [ -58.578964864583902, -36.899383036220996 ], [ -58.575405089841937, -36.902167190730587 ], [ -58.577340424366184, -36.904717541055057 ], [ -58.577533861290426, -36.904988629182469 ], [ -58.576620599007491, -36.905176020748364 ], [ -58.576862867461422, -36.905391171977065 ], [ -58.576862867461372, -36.905391171976817 ], [ -58.575125675313252, -36.906729048826257 ], [ -58.581799978468283, -36.912820731610999 ], [ -58.587248094576331, -36.908004013325616 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 18, "nombre": "Puesto", "ha": 2.24 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.576858991227752, -36.905390344222404 ], [ -58.576247458240189, -36.904844105723626 ], [ -58.576264225936548, -36.904727109801286 ], [ -58.576096083445471, -36.904718062582262 ], [ -58.57505413918949, -36.905475161012966 ], [ -58.574287437980523, -36.906026943538741 ], [ -58.575109310098618, -36.90671967209537 ], [ -58.576858991227752, -36.905390344222404 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 19, "nombre": "9B", "ha": 8.86 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.574297811168222, -36.906018473606125 ], [ -58.576092091569215, -36.904716916010713 ], [ -58.576251436411397, -36.904728201727664 ], [ -58.5762463408402, -36.904845337547442 ], [ -58.576619154496193, -36.905175222126672 ], [ -58.577533012459398, -36.904988496935559 ], [ -58.577390673071889, -36.904788338913768 ], [ -58.575405449590988, -36.902167463621218 ], [ -58.572733799906096, -36.904272210187308 ], [ -58.572795946619323, -36.904330773994793 ], [ -58.572617315698331, -36.904460474110024 ], [ -58.574297811168222, -36.906018473606125 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 1, "nombre": "1", "ha": 75.79 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.567304592991647, -36.908278340682116 ], [ -58.577234884694477, -36.916423334031258 ], [ -58.581798539631421, -36.912819615704279 ], [ -58.581724162482573, -36.912731147411947 ], [ -58.581724162482637, -36.91273114741221 ], [ -58.572543686172523, -36.904391615163632 ], [ -58.567304592991647, -36.908278340682116 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 2, "nombre": "2", "ha": 78.84 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.562210964853648, -36.912058621189729 ], [ -58.572287686966995, -36.920337837058504 ], [ -58.577233648252829, -36.916424417939091 ], [ -58.567304646164985, -36.908278339274098 ], [ -58.563169885551631, -36.911335978129387 ], [ -58.56321957944116, -36.911371714146256 ], [ -58.563066207211769, -36.911493210106691 ], [ -58.563016745642138, -36.911445091154206 ], [ -58.562210964853648, -36.912058621189729 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 11, "nombre": "11", "ha": 117.19 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.581800393130131, -36.912828805468479 ], [ -58.589336368614404, -36.919695552422489 ], [ -58.598406582621919, -36.912583320714354 ], [ -58.598418540379214, -36.912480331624558 ], [ -58.591055213382006, -36.906453122183322 ], [ -58.591411981515449, -36.904990022714728 ], [ -58.5914119815154, -36.904990022714479 ], [ -58.591126860377514, -36.904748026360011 ], [ -58.591013426143391, -36.904754769573572 ], [ -58.581800393130131, -36.912828805468479 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 15, "nombre": "15A", "ha": 79.31 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.603778677937669, -36.916869431428623 ], [ -58.598538169457235, -36.91258721149417 ], [ -58.598409821170058, -36.912582663811612 ], [ -58.589343368157209, -36.919695825134951 ], [ -58.594524098997148, -36.924419200430933 ], [ -58.603778677937669, -36.916869431428623 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 16, "nombre": "15B", "ha": 70.0 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.60376209343201, -36.916915746163632 ], [ -58.594523787713619, -36.924419007170108 ], [ -58.598919897592907, -36.928437978214767 ], [ -58.598919897592843, -36.928437978214511 ], [ -58.607840935348413, -36.921437023422769 ], [ -58.606574393378835, -36.920348403842375 ], [ -58.60702041378569, -36.919781364428538 ], [ -58.606816589060685, -36.919633378185083 ], [ -58.606975240597947, -36.919495709997477 ], [ -58.60376209343201, -36.916915746163632 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 14, "nombre": "14B", "ha": 53.8 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.610966071495803, -36.911536052446884 ], [ -58.606114715382006, -36.914440677688731 ], [ -58.606041734794275, -36.914507058095673 ], [ -58.607008399549365, -36.915323724882228 ], [ -58.604232904962053, -36.917286703721047 ], [ -58.606977816982962, -36.919496853982203 ], [ -58.60713913052394, -36.919628164133613 ], [ -58.607018583738657, -36.919782456732385 ], [ -58.606574470196826, -36.920348507430937 ], [ -58.607841012169771, -36.921437127011103 ], [ -58.607841012169835, -36.92143712701133 ], [ -58.615592360399688, -36.915385918209275 ], [ -58.611392550907759, -36.911868503172769 ], [ -58.610966071495803, -36.911536052446884 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 19, "nombre": "14A", "ha": 55.95 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.606052446911981, -36.91450655188661 ], [ -58.610966781125462, -36.911531637261767 ], [ -58.605557206275328, -36.906989414635156 ], [ -58.598551022857592, -36.912473972067353 ], [ -58.598542656889464, -36.912587114354551 ], [ -58.60313296681916, -36.916341741059284 ], [ -58.605813609628569, -36.914346020064137 ], [ -58.606052446911981, -36.91450655188661 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 20, "nombre": "13", "ha": 52.75 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.605557174073901, -36.906991183650696 ], [ -58.603036281357646, -36.90486685476484 ], [ -58.602615872062771, -36.904723391709247 ], [ -58.601808819904093, -36.904104212623459 ], [ -58.601155958299977, -36.903556608592467 ], [ -58.600742924523125, -36.903216696748771 ], [ -58.593733568764797, -36.908646168938688 ], [ -58.598419940453013, -36.91248123020376 ], [ -58.598548455044352, -36.91247668011308 ], [ -58.605557174073901, -36.906991183650696 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 21, "nombre": "12", "ha": 42.33 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.600741340369318, -36.903217267886291 ], [ -58.596655613306993, -36.899781946489249 ], [ -58.591132952659741, -36.90463068423221 ], [ -58.591121966580772, -36.904748850371881 ], [ -58.591408365024144, -36.904989850803865 ], [ -58.591055377738151, -36.906452742337578 ], [ -58.593733855611262, -36.908645903766541 ], [ -58.600741340369318, -36.903217267886291 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 22, "nombre": "Casco", "ha": 4.83 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ -58.607005193741038, -36.915323660954805 ], [ -58.606160718687306, -36.914607987970022 ], [ -58.605812105512989, -36.91434758748958 ], [ -58.605812105512925, -36.914347587489317 ], [ -58.603132988122283, -36.916341651787398 ], [ -58.604228016600224, -36.917278557633296 ], [ -58.607005193741038, -36.915323660954805 ] ] ] ] } }
  ]
};

const HACIENDA_INICIAL = [
  { id: 1, nombre: 'Toritos', cantidad: 5, peso_promedio: 150, potrero: null },
  { id: 2, nombre: 'Toros', cantidad: 26, peso_promedio: 550, potrero: null },
  { id: 3, nombre: 'Vacas c/Cría', cantidad: 748, peso_promedio: 480, potrero: null },
  { id: 4, nombre: 'Vaquillonas 1-2 Años', cantidad: 196, peso_promedio: 350, potrero: null },
  { id: 5, nombre: 'Vaquillonas +2 Años', cantidad: 219, peso_promedio: 420, potrero: null }
];

const STYLE_NORMAL  = { color: '#c41e3a', weight: 2, opacity: 0.9, fillColor: '#2d5016', fillOpacity: 0.4 };
const STYLE_NDVI    = { color: '#fff',    weight: 1.5, opacity: 0.85, fillColor: '#000', fillOpacity: 0 };
const STYLE_ORIGEN  = { color: '#ff9800', weight: 3, opacity: 1,   fillColor: '#ff9800', fillOpacity: 0.5 };
const STYLE_DESTINO = { color: '#4caf50', weight: 2, opacity: 0.9, fillColor: '#4caf50', fillOpacity: 0.45 };

// Coordenadas de los potreros aplanadas para la máscara NDVI (rings de cada MultiPolygon)

function MapView({ onPotreroClick, modoMover, ndviActive, ndviDate, ndviIndex, showBasemap, onHoverValue }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const layersRef = useRef({});
  const labelsRef = useRef([]);
  const ndviLayerRef = useRef(null);
  const baseTileRef = useRef(null);
  const onClickRef = useRef(onPotreroClick);
  const ndviActiveRef = useRef(ndviActive);
  const hoverTimerRef = useRef(null);

  useEffect(() => { onClickRef.current = onPotreroClick; }, [onPotreroClick]);
  useEffect(() => { ndviActiveRef.current = ndviActive; }, [ndviActive]);

  // Farm bounds para imageOverlay (calculados del GeoJSON)
  const FARM_BOUNDS = [[-36.9290, -58.6160], [-36.8775, -58.5480]];

  // Imagen del campo completo clipeada al perímetro exacto (una imagen = sin máscara)
  useEffect(() => {
    if (!map.current) return;
    if (ndviLayerRef.current) { map.current.removeLayer(ndviLayerRef.current); ndviLayerRef.current = null; }

    if (ndviActive && ndviDate) {
      const url = `/api/ndvi-farm?index=${encodeURIComponent(ndviIndex)}&date=${ndviDate}`;
      ndviLayerRef.current = L.imageOverlay(url, FARM_BOUNDS, {
        opacity: 0.9, attribution: 'Sentinel-2 © Copernicus', interactive: false
      }).addTo(map.current);
    }
  }, [ndviActive, ndviDate, ndviIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mostrar/ocultar mapa base satelital
  useEffect(() => {
    if (!baseTileRef.current || !map.current) return;
    baseTileRef.current.setOpacity(showBasemap ? 1 : 0);
    map.current.getContainer().style.backgroundColor = showBasemap ? '#000' : '#fff';
  }, [showBasemap]);

  // Modo NDVI: contorno blanco sin fill, labels ocultos
  useEffect(() => {
    if (!map.current) return;
    Object.values(layersRef.current).forEach(polys =>
      polys.forEach(p => p.setStyle(ndviActive ? STYLE_NDVI : STYLE_NORMAL))
    );
    labelsRef.current.forEach(m => {
      const el = m.getElement();
      if (el) el.style.display = ndviActive ? 'none' : '';
    });
  }, [ndviActive]);

  // Actualizar estilos cuando cambia modoMover
  useEffect(() => {
    Object.entries(layersRef.current).forEach(([nombre, polys]) => {
      const style = modoMover
        ? (nombre === modoMover ? STYLE_ORIGEN : STYLE_DESTINO)
        : (ndviActiveRef.current ? STYLE_NDVI : STYLE_NORMAL);
      polys.forEach(p => p.setStyle(style));
    });
  }, [modoMover]);

  useEffect(() => {
    map.current = L.map(mapContainer.current).setView([-36.905, -58.607], 13);
    baseTileRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Esri', maxZoom: 18
    }).addTo(map.current);

    const convertRing = (ring) => ring.map(pt => [pt[1], pt[0]]);

    POSTREROS_GEOJSON.features.forEach(feature => {
      const { geometry, properties: props } = feature;

      const polygonRings = geometry.type === 'MultiPolygon'
        ? geometry.coordinates.map(poly => poly.map(ring => convertRing(ring)))
        : [geometry.coordinates.map(ring => convertRing(ring))];

      layersRef.current[props.nombre] = [];
      let firstPolygon = null;
      polygonRings.forEach(rings => {
        const polygon = L.polygon(rings, STYLE_NORMAL);
        polygon.bindPopup(`<strong>Potrero ${props.nombre}</strong><br/>${props.ha.toFixed(1)} ha`);
        polygon.on('click', () => onClickRef.current(props));
        polygon.on('mouseover', function () {
          if (ndviActiveRef.current) return;
          this.setStyle({ weight: 3, fillOpacity: 0.65 });
        });
        polygon.on('mouseout', function () {
          if (ndviActiveRef.current) return;
          const s = layersRef.current[props.nombre]?.[0]?.options || STYLE_NORMAL;
          this.setStyle({ weight: s.weight || 2, fillOpacity: s.fillOpacity || 0.4 });
        });
        polygon.addTo(map.current);
        layersRef.current[props.nombre].push(polygon);
        if (!firstPolygon) firstPolygon = polygon;
      });

      const center = firstPolygon.getBounds().getCenter();
      const label = L.marker(center, {
        icon: L.divIcon({
          html: `<div style="text-align:center;font-family:'Courier New',monospace;color:#ffeb3b;text-shadow:1px 1px 3px rgba(0,0,0,0.7);font-weight:bold;pointer-events:none"><div style="font-size:13px">${props.nombre}</div><div style="font-size:12px">${props.ha.toFixed(1)} ha</div></div>`,
          className: 'potrero-label',
          iconSize: [70, 45]
        })
      }).addTo(map.current);
      labelsRef.current.push(label);
    });

    // Hover value: mousemove debounced 600ms
    map.current.on('mousemove', (e) => {
      if (!ndviActiveRef.current) return;
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = setTimeout(async () => {
        if (!ndviActiveRef.current) return;
        // get current index/date from the overlay URL
        const overlay = ndviLayerRef.current;
        if (!overlay) return;
        const src = overlay._url || '';
        const idxMatch = src.match(/index=([^&]+)/);
        const dateMatch = src.match(/date=([^&]+)/);
        const idx = idxMatch ? decodeURIComponent(idxMatch[1]) : 'NDVIc';
        const date = dateMatch ? dateMatch[1] : '';
        try {
          const r = await fetch(`/api/ndvi-value?lat=${e.latlng.lat}&lon=${e.latlng.lng}&index=${idx}&date=${date}`);
          const d = await r.json();
          if (onHoverValue) onHoverValue(d);
        } catch (_) {}
      }, 600);
    });
    map.current.on('mouseout', () => {
      clearTimeout(hoverTimerRef.current);
      if (onHoverValue) onHoverValue(null);
    });

    return () => { map.current.remove(); map.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={mapContainer} style={{ width: '100%', height: '100%', cursor: modoMover ? 'crosshair' : 'grab' }} />;
}

function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [hacienda, setHacienda] = useState(HACIENDA_INICIAL);
  const [historial, setHistorial] = useState({});
  const [selectedPotrero, setSelectedPotrero] = useState(null);
  const [draggedCategory, setDraggedCategory] = useState(null);
  const [dropOver, setDropOver] = useState(false);
  const [showPlanilla, setShowPlanilla] = useState(false);
  const [modoMover, setModoMover] = useState(null);
  const [showNDVI, setShowNDVI] = useState(false);
  const [ndviDate, setNdviDate] = useState(getNdviDates()[0] || '');
  const [ndviIndex, setNdviIndex] = useState('NDVIc');
  const [showBasemap, setShowBasemap] = useState(true);
  const [hoverValue, setHoverValue] = useState(null);
  const NDVI_DATES = getNdviDates();

  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      if (err.code !== 'auth/no-auth-event') {
        setAuthError(err.message || err.code);
      }
    });
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (currentUser) cargarHaciendaDeFirestore();
    });
    return unsubscribe;
  }, []);

  const cargarHaciendaDeFirestore = async () => {
    try {
      const [snapHacienda, snapHistorial] = await Promise.all([
        getDocs(collection(db, 'hacienda')),
        getDocs(collection(db, 'historial_potreros'))
      ]);
      if (snapHacienda.size === 0) {
        for (const h of HACIENDA_INICIAL) {
          await addDoc(collection(db, 'hacienda'), h);
        }
        setHacienda(HACIENDA_INICIAL);
      } else {
        setHacienda(snapHacienda.docs.map(d => ({ ...d.data(), docId: d.id })));
      }
      const hist = {};
      snapHistorial.docs.forEach(d => { hist[d.id] = d.data(); });
      setHistorial(hist);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const moverAPotrero = async (categoriaId, potreroNombre) => {
    const cat = hacienda.find(h => h.id === categoriaId);
    if (!cat || !cat.docId) return;
    const ahora = new Date().toISOString();
    try {
      const update = potreroNombre
        ? { potrero: potreroNombre, fecha_ingreso: ahora, fecha_salida: null }
        : { potrero: null, fecha_ingreso: null, fecha_salida: ahora };
      await updateDoc(doc(db, 'hacienda', cat.docId), update);

      // Si desasignamos, registrar fecha_salida en historial del potrero
      if (!potreroNombre && cat.potrero) {
        const histRef = doc(db, 'historial_potreros', cat.potrero);
        await setDoc(histRef, { fecha_ultima_salida: ahora, nombre: cat.potrero }, { merge: true });
        setHistorial(prev => ({ ...prev, [cat.potrero]: { ...prev[cat.potrero], fecha_ultima_salida: ahora } }));
      }

      setHacienda(prev => prev.map(h => h.id === categoriaId ? { ...h, ...update } : h));
    } catch (error) {
      console.error('Error:', error);
    }
  };


  const moverTodoAPotrero = async (origen, destino) => {
    if (origen === destino) { setModoMover(null); return; }
    const ahora = new Date().toISOString();
    const categoriasOrigen = hacienda.filter(h => h.potrero === origen);
    try {
      await Promise.all(categoriasOrigen.map(cat =>
        updateDoc(doc(db, 'hacienda', cat.docId), { potrero: destino, fecha_ingreso: ahora, fecha_salida: null })
      ));
      const histRef = doc(db, 'historial_potreros', origen);
      await setDoc(histRef, { fecha_ultima_salida: ahora, nombre: origen }, { merge: true });
      setHistorial(prev => ({ ...prev, [origen]: { ...prev[origen], fecha_ultima_salida: ahora } }));
      setHacienda(prev => prev.map(h =>
        h.potrero === origen ? { ...h, potrero: destino, fecha_ingreso: ahora, fecha_salida: null } : h
      ));
      setSelectedPotrero(POSTREROS_GEOJSON.features.find(f => f.properties.nombre === destino)?.properties);
    } catch (error) {
      console.error('Error:', error);
    }
    setModoMover(null);
  };

  const handlePotreroClick = (props) => {
    if (modoMover) {
      moverTodoAPotrero(modoMover, props.nombre);
    } else {
      setSelectedPotrero(props);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (popupErr) {
      // Popup bloqueado por COOP o por el browser — fallback a redirect
      if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request' || popupErr.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectErr) {
          setAuthError(redirectErr.message || redirectErr.code);
        }
      } else {
        setAuthError(popupErr.message || popupErr.code);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setHacienda(HACIENDA_INICIAL);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const totalAnimales = hacienda.reduce((sum, h) => sum + (h.cantidad || 0), 0);

  const diasDesde = (isoDate) => {
    if (!isoDate) return null;
    return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
  };

  const filasPlanilla = POSTREROS_GEOJSON.features.map(f => {
    const nombre = f.properties.nombre;
    const ha = f.properties.ha;
    const asignadas = hacienda.filter(h => h.potrero === nombre);
    const cabezas = asignadas.reduce((s, h) => s + (h.cantidad || 0), 0);
    const kgTotales = asignadas.reduce((s, h) => s + (h.cantidad || 0) * (h.peso_promedio || 0), 0);
    const cargaKgHa = ha > 0 ? Math.round(kgTotales / ha) : 0;
    const ev = ha > 0 ? (kgTotales / 450 / ha).toFixed(2) : '—';
    const fechaIngreso = asignadas.length > 0
      ? asignadas.reduce((min, h) => (!min || h.fecha_ingreso < min ? h.fecha_ingreso : min), null)
      : null;
    const diasOcupacion = fechaIngreso ? diasDesde(fechaIngreso) : null;
    const fechaSalida = historial[nombre]?.fecha_ultima_salida || null;
    const diasDescanso = !fechaIngreso && fechaSalida ? diasDesde(fechaSalida) : null;
    return { nombre, ha, asignadas, cabezas, cargaKgHa, ev, diasOcupacion, diasDescanso };
  });

  if (!authReady) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0a0a0a', color: '#fff', fontFamily: 'sans-serif' }}>
        Cargando...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0a0a0a', fontFamily: 'sans-serif', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', backgroundColor: '#1a1a1a', padding: '3rem', borderRadius: '8px', border: '1px solid #333', maxWidth: '400px', color: '#fff' }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 0.5rem 0', letterSpacing: '1px', fontWeight: '300' }}>Ea La Delia</h1>
          <p style={{ fontSize: '1.1rem', color: '#aaa', margin: '0 0 2rem 0' }}>Gestión ganadera en tiempo real</p>
          <button onClick={handleGoogleSignIn} style={{ width: '100%', padding: '1rem', backgroundColor: '#4285f4', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>
            Iniciar sesión con Google
          </button>
          {authError && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#3a1a1a', border: '1px solid #ff6b6b', borderRadius: '4px', color: '#ff6b6b', fontSize: '0.8rem', textAlign: 'left', wordBreak: 'break-word' }}>
              {authError}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0a0a0a', color: '#fff', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', backgroundColor: '#1a1a1a', borderBottom: '1px solid #333' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '300', margin: '0 0 0.25rem 0', letterSpacing: '1px' }}>Ea La Delia</h1>
          <p style={{ fontSize: '0.95rem', color: '#aaa', margin: 0 }}>Solanet, Ayacucho • 1,381 ha</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#aaa' }}>{user.displayName || user.email}</span>
          <button onClick={() => setShowNDVI(v => !v)} style={{ padding: '0.5rem 1rem', backgroundColor: showNDVI ? '#4caf50' : '#2a2a2a', color: showNDVI ? '#000' : '#fff', border: '1px solid #444', borderRadius: '3px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
            🌿 {showNDVI ? 'NDVI ON' : 'NDVI'}
          </button>
          <button onClick={() => setShowPlanilla(v => !v)} style={{ padding: '0.5rem 1rem', backgroundColor: showPlanilla ? '#ffeb3b' : '#2a2a2a', color: showPlanilla ? '#000' : '#fff', border: '1px solid #444', borderRadius: '3px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
            {showPlanilla ? '▲ Ocultar planilla' : '▼ Ver planilla'}
          </button>
          <button onClick={handleSignOut} style={{ padding: '0.5rem 1rem', backgroundColor: '#c41e3a', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flex: showPlanilla ? '0 0 60%' : '1', gap: '1px', overflow: 'hidden' }}>
        <div style={{ flex: 2, position: 'relative' }}>
          <MapView onPotreroClick={handlePotreroClick} modoMover={modoMover} ndviActive={showNDVI} ndviDate={ndviDate} ndviIndex={ndviIndex} showBasemap={showBasemap} onHoverValue={setHoverValue} />
          {/* Panel control NDVI */}
          {showNDVI && (
            <div style={{ position: 'absolute', bottom: '1.5rem', left: '1rem', zIndex: 1000, backgroundColor: 'rgba(15,15,15,0.92)', borderRadius: '8px', padding: '0.85rem 1rem', color: '#fff', fontSize: '0.82rem', minWidth: '230px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              {/* Navegación de fecha */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.7rem' }}>
                <button onClick={() => { const i = NDVI_DATES.indexOf(ndviDate); if (i < NDVI_DATES.length-1) setNdviDate(NDVI_DATES[i+1]); }}
                  style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '1.1rem', cursor: 'pointer', padding: '0 0.3rem' }}>‹</button>
                <span style={{ fontWeight: '600', fontSize: '0.83rem' }}>{ndviDate}</span>
                <button onClick={() => { const i = NDVI_DATES.indexOf(ndviDate); if (i > 0) setNdviDate(NDVI_DATES[i-1]); }}
                  style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '1.1rem', cursor: 'pointer', padding: '0 0.3rem' }}>›</button>
              </div>
              {/* Selector de índice — fila 1 */}
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                {[
                  { id: 'NDVIc', label: 'NDVI+', tip: 'NDVI contrastado' },
                  { id: 'NDVI',  label: 'NDVI',  tip: 'NDVI estándar' },
                  { id: 'EVI',   label: 'EVI',   tip: 'Vegetación densa' },
                  { id: 'NDRE',  label: 'NDRE',  tip: 'Clorofila / estrés' },
                ].map(({ id, label, tip }) => (
                  <button key={id} onClick={() => setNdviIndex(id)} title={tip} style={{
                    flex: 1, padding: '0.22rem 0', fontSize: '0.7rem', fontWeight: '700',
                    border: '1px solid', borderRadius: '3px', cursor: 'pointer',
                    backgroundColor: ndviIndex === id ? '#4caf50' : '#222',
                    color: ndviIndex === id ? '#000' : '#999',
                    borderColor: ndviIndex === id ? '#4caf50' : '#3a3a3a',
                  }}>{label}</button>
                ))}
              </div>
              {/* Selector de índice — fila 2 */}
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                {[
                  { id: 'MSAVI',   label: 'MSAVI',   tip: 'Vegetación escasa / suelo' },
                  { id: 'RECI',    label: 'RECI',    tip: 'Clorofila red-edge' },
                  { id: 'NDMI',    label: 'NDMI',    tip: 'Humedad vegetación' },
                  { id: 'NDWI',    label: 'NDWI',    tip: 'Agua libre' },
                ].map(({ id, label, tip }) => (
                  <button key={id} onClick={() => setNdviIndex(id)} title={tip} style={{
                    flex: 1, padding: '0.22rem 0', fontSize: '0.7rem', fontWeight: '700',
                    border: '1px solid', borderRadius: '3px', cursor: 'pointer',
                    backgroundColor: ndviIndex === id ? '#4caf50' : '#222',
                    color: ndviIndex === id ? '#000' : '#999',
                    borderColor: ndviIndex === id ? '#4caf50' : '#3a3a3a',
                  }}>{label}</button>
                ))}
              </div>
              {/* Fila 3: imagen natural */}
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.7rem' }}>
                {[{ id: 'NATURAL', label: '🛰 Imagen natural (color real)', tip: 'True color Sentinel-2' }].map(({ id, label, tip }) => (
                  <button key={id} onClick={() => setNdviIndex(id)} title={tip} style={{
                    flex: 1, padding: '0.22rem 0.4rem', fontSize: '0.7rem', fontWeight: '700',
                    border: '1px solid', borderRadius: '3px', cursor: 'pointer',
                    backgroundColor: ndviIndex === id ? '#4caf50' : '#222',
                    color: ndviIndex === id ? '#000' : '#999',
                    borderColor: ndviIndex === id ? '#4caf50' : '#3a3a3a',
                  }}>{label}</button>
                ))}
              </div>
              {/* Valor hover */}
              {hoverValue && ndviIndex !== 'NATURAL' && (
                <div style={{ marginBottom: '0.6rem', padding: '0.4rem 0.6rem', backgroundColor: '#1a1a1a', borderRadius: '4px', border: '1px solid #333' }}>
                  <span style={{ color: '#4caf50', fontWeight: '700', fontSize: '0.85rem' }}>{ndviIndex}: {typeof hoverValue.value === 'number' ? hoverValue.value.toFixed(3) : '—'}</span>
                  <span style={{ color: '#888', fontSize: '0.72rem', marginLeft: '0.5rem' }}>{hoverValue.label || ''}</span>
                </div>
              )}
              {/* Toggle mapa base */}
              <button onClick={() => setShowBasemap(v => !v)} style={{
                width: '100%', padding: '0.25rem', fontSize: '0.72rem', marginBottom: '0.6rem',
                backgroundColor: showBasemap ? '#222' : '#1a3a1a', color: showBasemap ? '#888' : '#4caf50',
                border: '1px solid', borderColor: showBasemap ? '#3a3a3a' : '#4caf50',
                borderRadius: '3px', cursor: 'pointer'
              }}>
                {showBasemap ? '🛰 Ocultar satélite' : '🛰 Mostrar satélite'}
              </button>
              {/* Leyenda arcoíris */}
              <div style={{ display: 'flex', height: '7px', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.25rem' }}>
                {['#82005a','#d2001e','#f03c00','#ff8c00','#f0d700','#afe600','#50c800','#009b14','#006432'].map((c,i) => (
                  <div key={i} style={{ flex: 1, backgroundColor: c }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#666' }}>
                <span>bajo</span><span>medio</span><span>alto</span>
              </div>
            </div>
          )}

          {modoMover && (
            <div style={{ position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#4caf50', color: '#000', padding: '0.6rem 1.5rem', borderRadius: '4px', fontWeight: '700', fontSize: '0.9rem', zIndex: 1000, boxShadow: '0 2px 12px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              Seleccioná el potrero destino en el mapa
              <button onClick={() => setModoMover(null)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: '#000', cursor: 'pointer', borderRadius: '3px', padding: '0.2rem 0.5rem', fontWeight: '700' }}>✕ Cancelar</button>
            </div>
          )}
        </div>

        <div style={{ flex: 1, backgroundColor: '#1a1a1a', borderLeft: '1px solid #333', overflow: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Panel potrero seleccionado — drop target */}
          {selectedPotrero ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDropOver(true); }}
              onDragLeave={() => setDropOver(false)}
              onDrop={() => {
                if (draggedCategory) moverAPotrero(draggedCategory, selectedPotrero.nombre);
                setDropOver(false);
              }}
              style={{ backgroundColor: dropOver ? '#1a3a1a' : '#2a2a2a', padding: '1rem', borderRadius: '4px', border: `2px solid ${dropOver ? '#4caf50' : '#c41e3a'}`, position: 'relative', transition: 'all 0.15s' }}
            >
              <h2 style={{ fontSize: '1.3rem', margin: '0 0 0.5rem 0', fontWeight: '600' }}>Potrero {selectedPotrero.nombre}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>Hectáreas</span>
                  <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: 'bold', color: '#ffeb3b' }}>{selectedPotrero.ha.toFixed(1)}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>Categorías</span>
                  <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: 'bold', color: '#ffeb3b' }}>{hacienda.filter(h => h.potrero === selectedPotrero.nombre).length}</span>
                </div>
              </div>

              {/* Botón mover todo */}
              {hacienda.filter(h => h.potrero === selectedPotrero.nombre).length > 0 && (
                <button
                  onClick={() => setModoMover(selectedPotrero.nombre)}
                  style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', backgroundColor: '#ff9800', color: '#000', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}
                >
                  Mover todo a otro potrero →
                </button>
              )}

              {/* Categorías asignadas a este potrero */}
              {hacienda.filter(h => h.potrero === selectedPotrero.nombre).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {hacienda.filter(h => h.potrero === selectedPotrero.nombre).map(cat => (
                    <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', backgroundColor: '#1a1a1a', borderRadius: '3px', fontSize: '0.85rem' }}>
                      <span>{cat.nombre} — <strong>{cat.cantidad}</strong> cab.</span>
                      <button
                        onClick={() => moverAPotrero(cat.id, null)}
                        title="Desasignar"
                        style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1rem', padding: '0 0.25rem' }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              {dropOver && (
                <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.85rem', color: '#4caf50' }}>
                  Soltá para asignar al Potrero {selectedPotrero.nombre}
                </div>
              )}
              {!dropOver && hacienda.filter(h => h.potrero === selectedPotrero.nombre).length === 0 && (
                <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#555', borderTop: '1px dashed #333', paddingTop: '0.5rem' }}>
                  Arrastrá hacienda acá para asignar
                </div>
              )}

              <button onClick={() => setSelectedPotrero(null)} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none', color: '#aaa', fontSize: '1.2rem', cursor: 'pointer', padding: '0.25rem 0.5rem' }}>✕</button>
            </div>
          ) : (
            <div style={{ padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '4px', border: '1px dashed #444', textAlign: 'center', fontSize: '0.85rem', color: '#555' }}>
              Hacé clic en un potrero del mapa para seleccionarlo
            </div>
          )}

          {/* Lista de hacienda */}
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #333', paddingBottom: '0.6rem' }}>
              Hacienda {draggedCategory ? '— arrastrando...' : '— arrastrá al potrero'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {hacienda.filter(h => h.cantidad > 0).map((cat) => (
                <div
                  key={cat.id}
                  draggable
                  onDragStart={() => setDraggedCategory(cat.id)}
                  onDragEnd={() => { setDraggedCategory(null); setDropOver(false); }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem', backgroundColor: draggedCategory === cat.id ? '#3a3a3a' : '#2a2a2a', borderRadius: '3px', borderLeft: `3px solid ${cat.potrero ? '#4caf50' : '#c41e3a'}`, fontSize: '0.9rem', cursor: 'grab', opacity: draggedCategory === cat.id ? 0.6 : 1 }}
                >
                  <div>
                    <span style={{ display: 'block', fontWeight: '600', marginBottom: '0.15rem' }}>{cat.nombre}</span>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: cat.potrero ? '#4caf50' : '#777' }}>
                      {cat.potrero ? `Potrero ${cat.potrero}` : 'Sin asignar'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{cat.cantidad}</span>
                    <span style={{ fontSize: '0.78rem', color: '#777' }}>{cat.peso_promedio} kg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Métricas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', padding: '0.85rem', backgroundColor: '#2a2a2a', borderRadius: '3px', border: '1px solid #333' }}>
              <span style={{ fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>Total animales</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ffeb3b' }}>{totalAnimales}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', padding: '0.85rem', backgroundColor: '#2a2a2a', borderRadius: '3px', border: '1px solid #333' }}>
              <span style={{ fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>Asignados</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ffeb3b' }}>{hacienda.filter(h => h.potrero).length}/{hacienda.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Planilla de potreros */}
      {showPlanilla && <div style={{ flex: '0 0 40%', borderTop: '1px solid #333', overflow: 'auto', backgroundColor: '#111' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#1a1a1a', position: 'sticky', top: 0, zIndex: 1 }}>
              {['Potrero', 'Ha', 'Hacienda asignada', 'Cabezas', 'Carga (kg/ha)', 'EV/ha', 'Días ocupación', 'Días descanso'].map(h => (
                <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: '#aaa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: '0.72rem', borderBottom: '1px solid #333', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filasPlanilla.map((fila, i) => (
              <tr
                key={fila.nombre}
                onClick={() => setSelectedPotrero(POSTREROS_GEOJSON.features.find(f => f.properties.nombre === fila.nombre)?.properties)}
                style={{ backgroundColor: selectedPotrero?.nombre === fila.nombre ? '#1e2e1e' : i % 2 === 0 ? '#111' : '#151515', cursor: 'pointer', borderBottom: '1px solid #1e1e1e' }}
              >
                <td style={{ padding: '0.55rem 0.75rem', fontWeight: '700', color: '#ffeb3b' }}>{fila.nombre}</td>
                <td style={{ padding: '0.55rem 0.75rem', color: '#aaa' }}>{fila.ha.toFixed(1)}</td>
                <td style={{ padding: '0.55rem 0.75rem', color: fila.asignadas.length ? '#fff' : '#444' }}>
                  {fila.asignadas.length ? fila.asignadas.map(a => a.nombre).join(', ') : '—'}
                </td>
                <td style={{ padding: '0.55rem 0.75rem', color: fila.cabezas ? '#fff' : '#444', textAlign: 'right' }}>
                  {fila.cabezas || '—'}
                </td>
                <td style={{ padding: '0.55rem 0.75rem', color: fila.cargaKgHa ? (fila.cargaKgHa > 600 ? '#ff6b6b' : '#4caf50') : '#444', textAlign: 'right', fontWeight: fila.cargaKgHa ? '600' : '400' }}>
                  {fila.cargaKgHa ? fila.cargaKgHa.toLocaleString() : '—'}
                </td>
                <td style={{ padding: '0.55rem 0.75rem', color: fila.ev !== '—' ? '#fff' : '#444', textAlign: 'right' }}>{fila.ev}</td>
                <td style={{ padding: '0.55rem 0.75rem', color: fila.diasOcupacion !== null ? '#ffeb3b' : '#444', textAlign: 'right' }}>
                  {fila.diasOcupacion !== null ? `${fila.diasOcupacion}d` : '—'}
                </td>
                <td style={{ padding: '0.55rem 0.75rem', color: fila.diasDescanso !== null ? '#4caf50' : '#444', textAlign: 'right' }}>
                  {fila.diasDescanso !== null ? `${fila.diasDescanso}d` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}

      </div>
    </div>
  );
}

export default App;
