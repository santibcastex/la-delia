import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import { getAuth, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import './App.css';

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
    { "type": "Feature", "properties": { "id": 6, "nombre": "6", "ha": 83.32 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 5627023.286061947233975, 5917657.355984663590789 ], [ 5627672.414120084606111, 5917000.333369345404208 ], [ 5627237.428910169750452, 5916316.912925100885332 ], [ 5627230.696004865691066, 5916323.42140020057559 ], [ 5627223.345916602760553, 5916315.678559104911983 ], [ 5627220.46379061602056, 5916316.715451510623097 ], [ 5627100.174153301864862, 5916437.258813048712909 ], [ 5627031.078929278999567, 5916494.403852722607553 ], [ 5626444.62890128325671, 5917032.991416934877634 ], [ 5626454.589048911817372, 5917058.128932527266443 ], [ 5626454.114756127819419, 5917077.574935139156878 ], [ 5627023.286061947233975, 5917657.355984663590789 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 5, "nombre": "5", "ha": 67.87 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 5627672.450448274612427, 5917000.323684374801815 ], [ 5628332.753668672405183, 5916333.83019879553467 ], [ 5627816.690865104086697, 5915769.392480358481407 ], [ 5627240.41663692612201, 5916301.315027848817408 ], [ 5627247.598402556031942, 5916308.160148243419826 ], [ 5627237.386829512193799, 5916316.912925099954009 ], [ 5627672.450448274612427, 5917000.323684374801815 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 3, "nombre": "3", "ha": 98.81 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 5628852.114763979800045, 5915808.804652033373713 ], [ 5629006.369550405070186, 5915648.550803435966372 ], [ 5629281.274148683995008, 5915358.039448745548725 ], [ 5629018.702286136336625, 5915134.878063700161874 ], [ 5628138.421782008372247, 5914242.931582346558571 ], [ 5628060.638801228255033, 5914318.390260090120137 ], [ 5628067.03506123740226, 5914326.91860680654645 ], [ 5628053.569250629283488, 5914338.617029719986022 ], [ 5628046.724130268208683, 5914330.930296173319221 ], [ 5627683.497344933450222, 5914675.570668235421181 ], [ 5628852.114763979800045, 5915808.804652033373713 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 4, "nombre": "4", "ha": 112.37 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 5628332.753668679855764, 5916333.66289425548166 ], [ 5628851.110936729237437, 5915808.900254595093429 ], [ 5627683.51994957216084, 5914675.570668236352503 ], [ 5627222.903152434155345, 5915113.63038345426321 ], [ 5628332.753668679855764, 5916333.66289425548166 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 8, "nombre": "8", "ha": 62.86 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 5627240.009857229888439, 5916300.361199598759413 ], [ 5627816.499659914523363, 5915768.747162842191756 ], [ 5627228.383500498719513, 5915119.322206729091704 ], [ 5627213.820905920118093, 5915134.901960690505803 ], [ 5627213.820905914530158, 5915134.901960661634803 ], [ 5627206.184621430002153, 5915127.386643212288618 ], [ 5626763.437082683667541, 5915574.004675912670791 ], [ 5627225.197465590201318, 5916299.239048688672483 ], [ 5627232.379231247119606, 5916293.628294294700027 ], [ 5627240.009857229888439, 5916300.361199598759413 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 7, "nombre": "7", "ha": 96.12 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 5625878.446682502515614, 5916467.210391915403306 ], [ 5626237.205714757554233, 5916833.405182772316039 ], [ 5626312.820646458305418, 5916892.370955433696508 ], [ 5626361.195420766249299, 5916945.148299396969378 ], [ 5626399.351904618553817, 5916988.461065018549562 ], [ 5626444.973348121158779, 5917032.154522294178605 ], [ 5627223.126439495012164, 5916314.723172598518431 ], [ 5627216.015861056745052, 5916307.959451614879072 ], [ 5627225.38101318012923, 5916299.721586355008185 ], [ 5626763.453558400273323, 5915573.965654456987977 ], [ 5625878.446682502515614, 5916467.210391915403306 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 10, "nombre": "10", "ha": 136.94 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 5625878.901933056302369, 5916467.643963762558997 ], [ 5626659.071133705787361, 5915678.890043627470732 ], [ 5625906.757554828189313, 5914727.44479064643383 ], [ 5625576.26688136626035, 5915098.369279278442264 ], [ 5625586.029594022780657, 5915106.729303369298577 ], [ 5625577.108494491316378, 5915116.716446197591722 ], [ 5625566.953029019758105, 5915112.003412474878132 ], [ 5625084.445169426500797, 5915653.207417434081435 ], [ 5625878.901933056302369, 5916467.643963762558997 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 9, "nombre": "9", "ha": 81.42 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 5625906.455428009852767, 5914732.532750525511801 ], [ 5626658.962740945629776, 5915678.369757202453911 ], [ 5626971.654764486476779, 5915364.637162529863417 ], [ 5626794.930876226164401, 5915084.159528080374002 ], [ 5626777.241144529543817, 5915054.329784304834902 ], [ 5626858.329921157099307, 5915032.317883512936532 ], [ 5626836.380345881916583, 5915008.761382253840566 ], [ 5626836.380345885641873, 5915008.761382282711565 ], [ 5626988.997639774344862, 5914857.965090827085078 ], [ 5626384.078186524100602, 5914190.74135934188962 ], [ 5625906.455428009852767, 5914732.532750525511801 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 1, "nombre": "1", "ha": 75.79 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 5627683.493039869703352, 5914675.574961685575545 ], [ 5626784.958726243115962, 5913784.844938038848341 ], [ 5626384.208258458413184, 5914190.863302189856768 ], [ 5626390.982818697579205, 5914200.583441259339452 ], [ 5626390.982818691059947, 5914200.583441229537129 ], [ 5627223.007209482602775, 5915113.945915665477514 ], [ 5627683.493039869703352, 5914675.574961685575545 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 2, "nombre": "2", "ha": 78.84 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 5628131.145143272355199, 5914249.186849863268435 ], [ 5627219.332691574469209, 5913343.80209743604064 ], [ 5626785.067119209095836, 5913784.722995961084962 ], [ 5627683.488303072750568, 5914675.575189136900008 ], [ 5628046.892452899366617, 5914330.677812218666077 ], [ 5628042.40384937915951, 5914326.778337902389467 ], [ 5628055.869659991934896, 5914313.08809717092663 ], [ 5628060.358263509348035, 5914318.362206323072314 ], [ 5628131.145143272355199, 5914249.186849863268435 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 11, "nombre": "11", "ha": 117.19 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 5626384.027907446026802, 5914189.845827204175293 ], [ 5625701.142990029416978, 5913437.696143915876746 ], [ 5624904.471970153041184, 5914238.967979095876217 ], [ 5624903.574249425902963, 5914250.413918084464967 ], [ 5625569.683011342771351, 5914909.677562126889825 ], [ 5625540.282657922245562, 5915072.529708676971495 ], [ 5625540.282657926902175, 5915072.529708704911172 ], [ 5625566.092128149233758, 5915099.012469553388655 ], [ 5625576.191486081108451, 5915098.114748867228627 ], [ 5626384.027907446026802, 5914189.845827204175293 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 15, "nombre": "15A", "ha": 79.31 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 5624418.741948598064482, 5913770.294649166055024 ], [ 5624892.738479996100068, 5914238.7084816750139 ], [ 5624904.184418986551464, 5914239.045126964338124 ], [ 5625700.518793605268002, 5913437.675103581510484 ], [ 5625231.123080912046134, 5912920.265358187258244 ], [ 5624418.741948598064482, 5913770.294649166055024 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 16, "nombre": "15B", "ha": 70.0 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 5624420.144637200981379, 5913765.13275508210063 ], [ 5625231.151134677231312, 5912920.28639851231128 ], [ 5624832.871733936481178, 5912480.003485987894237 ], [ 5624832.871733941137791, 5912480.003486016765237 ], [ 5624049.329879396595061, 5913268.651123827323318 ], [ 5624163.957591708749533, 5913387.8235476417467 ], [ 5624125.131171083077788, 5913451.337287444621325 ], [ 5624143.534445508383214, 5913467.496260170824826 ], [ 5624129.619774546474218, 5913482.981942309997976 ], [ 5624420.144637200981379, 5913765.13275508210063 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 14, "nombre": "14B", "ha": 53.8 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 5623786.851772490888834, 5914371.573774417862296 ], [ 5624214.50347426533699, 5914042.895781974308193 ], [ 5624220.899734307080507, 5914035.433478624559939 ], [ 5624133.428073232062161, 5913946.054160716943443 ], [ 5624377.585311937145889, 5913724.576059879735112 ], [ 5624129.388330969959497, 5913482.858330476097763 ], [ 5624114.800369531847537, 5913468.49479915946722 ], [ 5624125.29248031321913, 5913451.213675596751273 ], [ 5624163.950578324496746, 5913387.812150852754712 ], [ 5624049.322865961119533, 5913268.639726977795362 ], [ 5624049.322865955531597, 5913268.639726949855685 ], [ 5623368.345601877197623, 5913950.290278798900545 ], [ 5623748.305889768525958, 5914335.230112656019628 ], [ 5623786.851772490888834, 5914371.573774417862296 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 19, "nombre": "14A", "ha": 55.95 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 5624219.945906065404415, 5914035.503613049164414 ], [ 5623786.795664950273931, 5914372.064715423621237 ], [ 5624276.277878704480827, 5914869.149503239430487 ], [ 5624891.77763869613409, 5914251.293228938244283 ], [ 5624892.338714160956442, 5914238.725139065645635 ], [ 5624477.142888630740345, 5913828.017915510572493 ], [ 5624241.491202965378761, 5914053.00916684884578 ], [ 5624219.945906065404415, 5914035.503613049164414 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 20, "nombre": "13", "ha": 52.75 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 5624276.277878700755537, 5914868.953126839362085 ], [ 5624504.411152550019324, 5915101.434736217372119 ], [ 5624542.115422154776752, 5915116.808203374966979 ], [ 5624615.055229352787137, 5915184.473901689052582 ], [ 5624674.136473168618977, 5915244.396758887916803 ], [ 5624711.504097460769117, 5915281.582033808343112 ], [ 5625327.377907735295594, 5914669.804076777771115 ], [ 5624903.448007835075259, 5914250.31602253112942 ], [ 5624892.002068835310638, 5914250.989313039928675 ], [ 5624276.277878700755537, 5914868.953126839362085 ] ] ] ] } },
    { "type": "Feature", "properties": { "id": 21, "nombre": "12", "ha": 42.33 }, "geometry": { "type": "MultiPolygon", "coordinates": [ [ [ [ 5624711.644366276450455, 5915281.516575029119849 ], [ 5625081.42113495990634, 5915657.437121193856001 ], [ 5625565.741456751711667, 5915112.043739790096879 ], [ 5625566.526962396688759, 5915098.914574477821589 ], [ 5625540.605277071706951, 5915072.544028698466718 ], [ 5625569.668985241092741, 5914909.719935793429613 ], [ 5625327.352776252664626, 5914669.83388389647007 ], [ 5624711.644366276450455, 5915281.516575029119849 ] ] ] ] } }
  ]
};

const HACIENDA_INICIAL = [
  { id: 1, nombre: 'Toritos', cantidad: 5, peso_promedio: 150, potrero: null },
  { id: 2, nombre: 'Toros', cantidad: 26, peso_promedio: 550, potrero: null },
  { id: 3, nombre: 'Vacas c/Cría', cantidad: 748, peso_promedio: 480, potrero: null },
  { id: 4, nombre: 'Vaquillonas 1-2 Años', cantidad: 196, peso_promedio: 350, potrero: null },
  { id: 5, nombre: 'Vaquillonas +2 Años', cantidad: 219, peso_promedio: 420, potrero: null }
];

function MapView({ onPotreroClick }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    map.current = L.map(mapContainer.current).setView([-36.905, -58.607], 13);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Esri', maxZoom: 18
    }).addTo(map.current);

    const convertCoords = (coords) =>
      coords.map(ring => ring.map(pt => [pt[1] / 111000 - 36.9, pt[0] / 111000 - 58.6]));

    POSTREROS_GEOJSON.features.forEach(feature => {
      const { geometry, properties: props } = feature;
      const coords = geometry.type === 'MultiPolygon'
        ? geometry.coordinates.map(poly => poly.map(ring => convertCoords([ring])[0]))
        : convertCoords(geometry.coordinates);

      const style = { color: '#c41e3a', weight: 2, opacity: 0.9, fillColor: '#2d5016', fillOpacity: 0.4 };
      const polygon = geometry.type === 'MultiPolygon'
        ? L.multiPolygon(coords, style)
        : L.polygon(coords, style);

      polygon.bindPopup(`<strong>Potrero ${props.nombre}</strong><br/>${props.ha.toFixed(1)} ha`);
      polygon.on('click', () => onPotreroClick(props));
      polygon.on('mouseover', function () { this.setStyle({ weight: 3, fillOpacity: 0.6 }); });
      polygon.on('mouseout', function () { this.setStyle({ weight: 2, fillOpacity: 0.4 }); });
      polygon.addTo(map.current);

      const center = polygon.getBounds().getCenter();
      L.marker(center, {
        icon: L.divIcon({
          html: `<div style="text-align:center;font-family:'Courier New',monospace;color:#ffeb3b;text-shadow:1px 1px 3px rgba(0,0,0,0.7);font-weight:bold;pointer-events:none"><div style="font-size:13px">${props.nombre}</div><div style="font-size:12px">${props.ha.toFixed(1)} ha</div></div>`,
          className: 'potrero-label',
          iconSize: [70, 45]
        })
      }).addTo(map.current);
    });

    return () => { map.current.remove(); map.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
}

function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [hacienda, setHacienda] = useState(HACIENDA_INICIAL);
  const [selectedPotrero, setSelectedPotrero] = useState(null);
  const [draggedCategory, setDraggedCategory] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (currentUser) cargarHaciendaDeFirestore();
    });
    return unsubscribe;
  }, []);

  const cargarHaciendaDeFirestore = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'hacienda'));
      if (snapshot.size === 0) {
        for (const h of HACIENDA_INICIAL) {
          await addDoc(collection(db, 'hacienda'), h);
        }
        setHacienda(HACIENDA_INICIAL);
      } else {
        const data = snapshot.docs.map(d => ({ ...d.data(), docId: d.id }));
        setHacienda(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error('Error:', error);
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
  const postrerosOcupados = hacienda.filter(h => h.potrero).length;

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
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0a0a0a', color: '#fff', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', backgroundColor: '#1a1a1a', borderBottom: '1px solid #333' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '300', margin: '0 0 0.25rem 0', letterSpacing: '1px' }}>Ea La Delia</h1>
          <p style={{ fontSize: '0.95rem', color: '#aaa', margin: 0 }}>Solanet, Ayacucho • 1,381 ha</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#aaa' }}>{user.displayName || user.email}</span>
          <button onClick={handleSignOut} style={{ padding: '0.5rem 1rem', backgroundColor: '#c41e3a', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, gap: '1px', overflow: 'hidden' }}>
        <div style={{ flex: 2, position: 'relative' }}>
          <MapView onPotreroClick={setSelectedPotrero} />
        </div>

        <div style={{ flex: 1, backgroundColor: '#1a1a1a', borderLeft: '1px solid #333', overflow: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {selectedPotrero && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '1rem', borderRadius: '4px', border: '1px solid #c41e3a', position: 'relative' }}>
              <h2 style={{ fontSize: '1.3rem', margin: '0 0 1rem 0', fontWeight: '600' }}>Potrero {selectedPotrero.nombre}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Hectáreas</span>
                  <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: '#ffeb3b' }}>{selectedPotrero.ha.toFixed(1)}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Ocupación</span>
                  <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: '#ffeb3b' }}>{hacienda.filter(h => h.potrero === selectedPotrero.nombre).length}</span>
                </div>
              </div>
              <button onClick={() => setSelectedPotrero(null)} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none', color: '#aaa', fontSize: '1.2rem', cursor: 'pointer', padding: '0.25rem 0.5rem' }}>✕</button>
            </div>
          )}

          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #333', paddingBottom: '0.75rem' }}>
              Hacienda (arrastrá para mover)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
              {hacienda.filter(h => h.cantidad > 0).map((cat) => (
                <div
                  key={cat.id}
                  draggable
                  onDragStart={() => setDraggedCategory(cat.id)}
                  onDragEnd={() => setDraggedCategory(null)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: draggedCategory === cat.id ? '#3a3a3a' : '#2a2a2a', borderRadius: '3px', borderLeft: '3px solid #c41e3a', fontSize: '0.9rem', cursor: 'move' }}
                >
                  <div>
                    <span style={{ display: 'block', fontWeight: '600', marginBottom: '0.25rem' }}>{cat.nombre}</span>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: '#aaa' }}>{cat.potrero ? `Potrero ${cat.potrero}` : 'Sin asignar'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{cat.cantidad}</span>
                    <span style={{ fontSize: '0.8rem', color: '#aaa' }}>{cat.peso_promedio} kg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '3px', border: '1px solid #333' }}>
              <span style={{ fontSize: '0.8rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Total animales</span>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffeb3b' }}>{totalAnimales}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '3px', border: '1px solid #333' }}>
              <span style={{ fontSize: '0.8rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Ocupación</span>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffeb3b' }}>{postrerosOcupados}/16</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
