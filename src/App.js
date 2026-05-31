import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { getAuth, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithRedirect, signInWithPopup, getRedirectResult } from 'firebase/auth';
import './App.css';


const getNdviDates = () => {
  const dates = [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  // Always include today first so the latest available image is accessible
  dates.push(todayStr);
  for (let m = 0; m < 8; m++) {
    const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    ['21', '11', '01'].forEach(day => {
      const dateStr = `${year}-${month}-${day}`;
      if (dateStr < todayStr) dates.push(dateStr);
    });
  }
  return dates;
};

const getHistoricalDates = (months = 12) => {
  const dates = [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  for (let m = 0; m < months; m++) {
    const d = new Date(today.getFullYear(), today.getMonth() - m, 21);
    const s = d.toISOString().slice(0, 10);
    if (s <= todayStr) dates.push(s);
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

const CATEGORIAS_ORDEN = ['Toritos', 'Toros', 'Vacas c/Cría', 'Vacas Cut', 'Vaquillonas 1-2 Años', 'Vaquillonas +2 Años', 'Novillitos', 'Caballos'];

const PESO_PROMEDIO_DEFAULT = { 'Toritos': 150, 'Toros': 550, 'Vacas c/Cría': 480, 'Vacas Cut': 460, 'Vaquillonas 1-2 Años': 350, 'Vaquillonas +2 Años': 420, 'Novillitos': 280, 'Caballos': 500 };

// Farm coordinates (center of Ea. La Delia, Solanet, Ayacucho)
const FARM_LAT = -36.905;
const FARM_LON = -58.583;

function wmoDesc(code) {
  if (code == null) return '—';
  if (code === 0) return 'Despejado';
  if (code === 1) return 'Mayormente despejado';
  if (code === 2) return 'Parcialmente nublado';
  if (code === 3) return 'Nublado';
  if (code <= 49) return 'Niebla';
  if (code <= 59) return 'Llovizna';
  if (code <= 69) return 'Lluvia';
  if (code <= 79) return 'Nieve';
  if (code <= 84) return 'Chubascos';
  if (code <= 90) return 'Nieve convectiva';
  return 'Tormenta';
}
function wmoIcon(code) {
  if (code == null) return '?';
  if (code === 0) return '☀';
  if (code === 1) return '🌤';
  if (code === 2) return '⛅';
  if (code === 3) return '☁';
  if (code <= 49) return '🌫';
  if (code <= 59) return '🌦';
  if (code <= 69) return '🌧';
  if (code <= 79) return '❄';
  if (code <= 84) return '🌦';
  if (code <= 90) return '❄';
  return '⛈';
}
function windDir(deg) {
  if (deg == null) return '—';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];
  return dirs[Math.round(deg / 22.5) % 16];
}

const EV_POR_CATEGORIA = { 'Toritos': 0.8, 'Toros': 1.2, 'Vacas c/Cría': 1.0, 'Vacas Cut': 1.0, 'Vaquillonas 1-2 Años': 0.8, 'Vaquillonas +2 Años': 0.9, 'Novillitos': 0.8, 'Caballos': 1.0 };

const HACIENDA_INICIAL = [
  { id: 1, nombre: 'Toritos',            rodeo: null, cantidad: 5,   peso_promedio: 150, potrero: null },
  { id: 2, nombre: 'Toros',              rodeo: null, cantidad: 26,  peso_promedio: 550, potrero: null },
  { id: 3, nombre: 'Vacas c/Cría',       rodeo: null, cantidad: 748, peso_promedio: 480, potrero: null },
  { id: 4, nombre: 'Vacas Cut',          rodeo: null, cantidad: 0,   peso_promedio: 460, potrero: null },
  { id: 5, nombre: 'Vaquillonas 1-2 Años', rodeo: null, cantidad: 196, peso_promedio: 350, potrero: null },
  { id: 6, nombre: 'Vaquillonas +2 Años',  rodeo: null, cantidad: 219, peso_promedio: 420, potrero: null },
  { id: 7, nombre: 'Novillitos',         rodeo: null, cantidad: 0,   peso_promedio: 280, potrero: null },
  { id: 8, nombre: 'Caballos',           rodeo: null, cantidad: 0,   peso_promedio: 500, potrero: null },
];

const STYLE_NORMAL  = { color: '#fff', weight: 2, opacity: 0.9, fillColor: '#2d5016', fillOpacity: 0.4 };
const STYLE_NDVI    = { color: '#fff',    weight: 1.5, opacity: 0.85, fillColor: '#000', fillOpacity: 0 };
const STYLE_ORIGEN  = { color: '#ff9800', weight: 3, opacity: 1,   fillColor: '#ff9800', fillOpacity: 0.5 };
const STYLE_DESTINO = { color: '#4caf50', weight: 2, opacity: 0.9, fillColor: '#4caf50', fillOpacity: 0.45 };

function pastoColorFn(ratio) {
  const t = Math.max(0, Math.min(1, ratio));
  if (t < 0.5) { return `rgb(200,${Math.round(t * 2 * 200)},0)`; }
  return `rgb(${Math.round((1 - (t - 0.5) * 2) * 200)},180,0)`;
}

// Monteith (1972) model — Druille et al. (FAUBA) meta-análisis, C3 pasturas Pampa Húmeda
// EUR estacional (g MS/MJ APAR) calibrado para pasturas C3 templadas:
//   ene-feb: verano, posible estrés hídrico → 0.65
//   mar-abr: otoño templado, buenas condiciones → 0.70
//   may:     temperaturas en descenso → 0.60
//   jun-jul: invierno, frío limita fotosíntesis → 0.50 / 0.48
//   ago:     inicio recuperación primaveral → 0.55
//   sep-oct: pico de crecimiento primaveral → 0.72 / 0.78
//   nov:     primavera avanzada → 0.75
//   dic:     verano temprano → 0.68
// (Rango literatura: 0.7–3.1 g/MJ; media = 1.9 usando sólo APAR; aquí se calibra
//  contra datos GEE reales del campo que incluyen el factor (1-ALBEDO) en PAR)
const EUR_MENSUAL = [0.65, 0.65, 0.70, 0.70, 0.60, 0.50, 0.48, 0.55, 0.72, 0.78, 0.75, 0.68];
const PAR_FRAC = 0.45;
const ALBEDO = 0.22;
const FPAR_MAX = 0.95;
// Mott curve: monthly consumption Vacas c/Cría (kg MS/animal/día) ene-dic
const MOTT_MENSUAL = [9.0, 9.5, 10.5, 11.5, 12.0, 12.5, 13.0, 13.5, 13.0, 12.0, 11.0, 10.0];
const CONSUMO_DIARIO = { 'Toritos': 6, 'Toros': 12, 'Vacas c/Cría': null, 'Vaquillonas 1-2 Años': 7.5, 'Vaquillonas +2 Años': 9 };

function calcFPAR(ndvi) {
  const r = (ndvi + 1) / Math.max(0.001, 1 - ndvi);
  return Math.min(FPAR_MAX, Math.max(0, (r - 1.55) / 10.07));
}

// mesIndex: 0=enero ... 11=diciembre
function calcMS(ndvi, radiationMJm2Month, mesIndex) {
  const eur = EUR_MENSUAL[mesIndex] ?? EUR_MENSUAL[new Date().getMonth()];
  const par = radiationMJm2Month * (1 - ALBEDO) * PAR_FRAC;
  return calcFPAR(ndvi) * par * eur * 10; // kg/ha/month
}

function getCatConsumoDiario(catNombre, mesIndex) {
  if (catNombre === 'Vacas c/Cría') return MOTT_MENSUAL[mesIndex];
  return CONSUMO_DIARIO[catNombre] ?? 10;
}

// Full polygon geometry per potrero — for pixel-accurate NDVI mean over whole paddock
function potreroPolygons() {
  return POSTREROS_GEOJSON.features.map(f => ({
    nombre: f.properties.nombre,
    coordinates: f.geometry.coordinates[0][0] // outer ring [[lon,lat],...]
  }));
}

// Canvas layer: clips NDVI image to exact polygon outline
function makeNdviCanvasLayer(url, farmBoundsLL) {
  const layer = {
    _url: url,
    _canvas: null,
    _img: null,
    _imgLoaded: false,
    _map: null,
    _onZoom: null,

    addTo(map) {
      this._map = map;
      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.pointerEvents = 'none';
      canvas.style.opacity = '0.92';
      map.getPanes().overlayPane.appendChild(canvas);
      this._canvas = canvas;

      const img = new Image();
      img.onload = () => { this._imgLoaded = true; this._render(); };
      img.src = url;
      this._img = img;

      this._onZoom = () => this._render();
      map.on('zoomend', this._onZoom);
      return this;
    },

    remove() {
      if (this._canvas?.parentNode) this._canvas.parentNode.removeChild(this._canvas);
      if (this._map && this._onZoom) this._map.off('zoomend', this._onZoom);
      this._map = null;
    },

    _render() {
      if (!this._imgLoaded || !this._map) return;
      const map = this._map;
      const nw = map.latLngToLayerPoint(farmBoundsLL.getNorthWest());
      const se = map.latLngToLayerPoint(farmBoundsLL.getSouthEast());
      const w = Math.max(1, se.x - nw.x);
      const h = Math.max(1, se.y - nw.y);

      this._canvas.width = w;
      this._canvas.height = h;
      L.DomUtil.setPosition(this._canvas, nw);

      const ctx = this._canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);

      ctx.beginPath();
      POSTREROS_GEOJSON.features.forEach(f => {
        f.geometry.coordinates.forEach(poly => {
          poly[0].forEach((pt, i) => {
            const p = map.latLngToLayerPoint(L.latLng(pt[1], pt[0]));
            if (i === 0) ctx.moveTo(p.x - nw.x, p.y - nw.y);
            else ctx.lineTo(p.x - nw.x, p.y - nw.y);
          });
          ctx.closePath();
        });
      });
      ctx.clip('evenodd');
      ctx.drawImage(this._img, 0, 0, w, h);
    }
  };
  return layer;
}

// ─── Forraje Panel ────────────────────────────────────────────────────────────

function parseGeeCSV(text) {
  // Returns { byMonth: {'YYYY-MM': {oferta_kg, ha_sum, ...}}, byPotrero: {'nombre': {'YYYY-MM': ms_kg_ha}} }
  const lines = text.trim().split('\n');
  const header = lines[0].split(',').map(h => h.trim());
  const iDate = header.indexOf('fecha');
  const iNombre = header.indexOf('nombre');
  const iMsKgTotal = header.indexOf('ms_kg_total');
  const iMsKgHa = header.indexOf('ms_kg_ha');
  const iHa = header.indexOf('ha');
  if (iDate < 0 || iMsKgTotal < 0) return { byMonth: {}, byPotrero: {} };
  const byMonth = {};
  const byPotrero = {};
  lines.slice(1).forEach(line => {
    const cols = line.split(',');
    const ym = (cols[iDate] || '').slice(0, 7);
    const nombre = iNombre >= 0 ? (cols[iNombre] || '').trim() : '';
    if (!ym) return;
    const msTotal = parseFloat(cols[iMsKgTotal]);
    const msHa = iMsKgHa >= 0 ? parseFloat(cols[iMsKgHa]) : null;
    const ha = iHa >= 0 ? parseFloat(cols[iHa]) : null;
    if (!isNaN(msTotal)) {
      if (!byMonth[ym]) byMonth[ym] = { oferta_kg: 0, ha_sum: 0, ha_weighted_ms: 0 };
      byMonth[ym].oferta_kg += msTotal;
      if (ha && !isNaN(ha)) byMonth[ym].ha_sum += ha;
      if (msHa && !isNaN(msHa) && ha && !isNaN(ha)) byMonth[ym].ha_weighted_ms += msHa * ha;
    }
    if (nombre && msHa != null && !isNaN(msHa)) {
      if (!byPotrero[nombre]) byPotrero[nombre] = {};
      byPotrero[nombre][ym] = Math.round(msHa);
    }
  });
  Object.values(byMonth).forEach(m => {
    m.oferta_ha_avg = m.ha_sum > 0 ? m.ha_weighted_ms / m.ha_sum : 0;
  });
  return { byMonth, byPotrero };
}

function daysInMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

function ComboChart({ months, ofertaKg, ofertaDispKg, demandaKg, efficiency = 50 }) {
  const PAD_L = 70, PAD_R = 20, PAD_T = 18, PAD_B = 44;
  const BAR_W = 18, GAP = 4;
  const n = months.length;
  const svgW = PAD_L + n * (BAR_W + GAP) + PAD_R;
  const chartH = 160;
  const svgH = PAD_T + chartH + PAD_B;

  const allVals = [...ofertaKg, ...ofertaDispKg, ...demandaKg].filter(v => v != null && !isNaN(v));
  if (allVals.length === 0) return <div style={{ color: '#555', padding: '2rem', textAlign: 'center' }}>Sin datos</div>;
  const maxVal = Math.max(...allVals, 1);

  const toY = v => PAD_T + chartH - (v / maxVal) * chartH;
  const toX = i => PAD_L + i * (BAR_W + GAP);

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map(p => Math.round(p * maxVal));

  const linePoints = (arr) => arr.map((v, i) => {
    if (v == null || isNaN(v)) return null;
    return `${toX(i) + BAR_W / 2},${toY(v)}`;
  }).filter(Boolean).join(' ');

  return (
    <div style={{ overflowX: 'auto', marginBottom: '0.5rem' }}>
      <svg width={svgW} height={svgH} style={{ display: 'block' }}>
        {/* Grid */}
        {gridVals.map(v => {
          const y = toY(v);
          return (
            <g key={v}>
              <line x1={PAD_L} y1={y} x2={svgW - PAD_R} y2={y} stroke="#222" strokeWidth="1" />
              <text x={PAD_L - 5} y={y + 4} textAnchor="end" fontSize="9" fill="#555">
                {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              </text>
            </g>
          );
        })}
        {/* Y axis label */}
        <text x={12} y={PAD_T + chartH / 2} textAnchor="middle" fontSize="9" fill="#555"
          transform={`rotate(-90,12,${PAD_T + chartH / 2})`}>kg MS</text>
        {/* Bars (oferta total) */}
        {ofertaKg.map((v, i) => {
          if (v == null || isNaN(v)) return null;
          const barH = (v / maxVal) * chartH;
          return <rect key={i} x={toX(i)} y={toY(v)} width={BAR_W} height={barH} fill="#1e4d2b" rx="1" />;
        })}
        {/* Line: oferta disponible */}
        {ofertaDispKg.some(v => v != null) && (
          <polyline points={linePoints(ofertaDispKg)} fill="none" stroke="#4caf50" strokeWidth="2" strokeLinejoin="round" />
        )}
        {/* Line: demanda */}
        {demandaKg.some(v => v != null) && (
          <polyline points={linePoints(demandaKg)} fill="none" stroke="#f44336" strokeWidth="2"
            strokeDasharray="6,3" strokeLinejoin="round" />
        )}
        {/* X labels */}
        {months.map((ym, i) => (
          <text key={ym} x={toX(i) + BAR_W / 2} y={PAD_T + chartH + 14}
            textAnchor="middle" fontSize="8" fill="#555"
            transform={`rotate(-45,${toX(i) + BAR_W / 2},${PAD_T + chartH + 14})`}>
            {ym.slice(5) + '/' + ym.slice(2, 4)}
          </text>
        ))}
        {/* Legend */}
        <rect x={PAD_L} y={4} width={10} height={8} fill="#1e4d2b" rx="1" />
        <text x={PAD_L + 13} y={11} fontSize="8" fill="#888">Oferta total</text>
        <line x1={PAD_L + 70} y1={8} x2={PAD_L + 82} y2={8} stroke="#4caf50" strokeWidth="2" />
        <text x={PAD_L + 85} y={11} fontSize="8" fill="#4caf50">Disponible ({efficiency}%)</text>
        <line x1={PAD_L + 160} y1={8} x2={PAD_L + 172} y2={8} stroke="#f44336" strokeWidth="2" strokeDasharray="4,2" />
        <text x={PAD_L + 175} y={11} fontSize="8" fill="#f44336">Demanda</text>
      </svg>
    </div>
  );
}

function BalanceChart({ months, balanceKg }) {
  const PAD_L = 70, PAD_R = 20, PAD_T = 14, PAD_B = 44;
  const BAR_W = 18, GAP = 4;
  const n = months.length;
  const svgW = PAD_L + n * (BAR_W + GAP) + PAD_R;
  const chartH = 100;
  const svgH = PAD_T + chartH + PAD_B;

  const vals = balanceKg.filter(v => v != null && !isNaN(v));
  if (vals.length === 0) return null;
  const maxAbs = Math.max(...vals.map(Math.abs), 1);

  const zeroY = PAD_T + chartH / 2;
  const toY = v => zeroY - (v / maxAbs) * (chartH / 2);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={svgW} height={svgH} style={{ display: 'block' }}>
        {/* Zero line */}
        <line x1={PAD_L} y1={zeroY} x2={svgW - PAD_R} y2={zeroY} stroke="#444" strokeWidth="1" />
        {/* Y labels */}
        {[1, 0, -1].map(s => {
          const v = s * maxAbs;
          const y = toY(v);
          return (
            <g key={s}>
              <line x1={PAD_L} y1={y} x2={svgW - PAD_R} y2={y} stroke="#1a1a1a" strokeWidth="1" />
              <text x={PAD_L - 5} y={y + 4} textAnchor="end" fontSize="9" fill="#555">
                {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v >= 0 ? `+${v}` : `${v}`}
              </text>
            </g>
          );
        })}
        {/* Y label */}
        <text x={12} y={PAD_T + chartH / 2} textAnchor="middle" fontSize="9" fill="#555"
          transform={`rotate(-90,12,${PAD_T + chartH / 2})`}>Balance</text>
        {/* Bars */}
        {balanceKg.map((v, i) => {
          if (v == null || isNaN(v)) return null;
          const y1 = Math.min(zeroY, toY(v));
          const y2 = Math.max(zeroY, toY(v));
          const h = Math.max(1, y2 - y1);
          return <rect key={i} x={PAD_L + i * (BAR_W + GAP)} y={y1} width={BAR_W} height={h}
            fill={v >= 0 ? '#2e7d32' : '#c62828'} rx="1" />;
        })}
        {/* X labels */}
        {months.map((ym, i) => (
          <text key={ym} x={PAD_L + i * (BAR_W + GAP) + BAR_W / 2} y={PAD_T + chartH + 14}
            textAnchor="middle" fontSize="8" fill="#555"
            transform={`rotate(-45,${PAD_L + i * (BAR_W + GAP) + BAR_W / 2},${PAD_T + chartH + 14})`}>
            {ym.slice(5) + '/' + ym.slice(2, 4)}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ─── Mercados ─────────────────────────────────────────────────────────────────

const MERCADO_CATS = [
  { key: 'novillito',  label: 'Novillito',  color: '#42a5f5' },
  { key: 'novillo',    label: 'Novillo',    color: '#1e88e5' },
  { key: 'vaquillona', label: 'Vaquillona', color: '#ab47bc' },
  { key: 'vaca',       label: 'Vaca',       color: '#ef5350' },
  { key: 'toro',       label: 'Toro',       color: '#ff9800' },
  { key: 'mej',        label: 'MEJ',        color: '#26c6da' },
  { key: 'inmag',      label: 'INMAG',      color: '#ffd54f' },
];

const ROSGAN_INV_CATS = [
  { key: 'ternero',       label: 'Ternero',       color: '#42a5f5' },
  { key: 'ternera',       label: 'Ternera',        color: '#ce93d8' },
  { key: 'novillo_1_2',   label: 'Novillo 1-2a',  color: '#1e88e5' },
  { key: 'novillo_2_3',   label: 'Novillo 2-3a',  color: '#0d47a1' },
  { key: 'vaquillona_inv',label: 'Vaquillona',     color: '#e91e63' },
];
const ROSGAN_CRIA_CATS = [
  { key: 'vaca_cria',     label: 'Vaca c/Cría',   color: '#ef5350' },
  { key: 'vientre_pren',  label: 'V. Preñez',     color: '#ff9800' },
];

function PrecioEvolucionChart({ data, activeCats, cats = MERCADO_CATS, unit = 'ARS/kg' }) {
  if (!data || data.length < 2) return null;
  const sorted = [...data].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const n = sorted.length;
  const activeCatsList = cats.filter(c => activeCats.has(c.key));
  if (activeCatsList.length === 0) return null;

  const PAD_L = 68, PAD_R = 20, PAD_T = 20, PAD_B = 50;
  const chartH = 200;
  const ptSpacing = Math.max(38, Math.min(80, 700 / Math.max(n - 1, 1)));
  const svgW = PAD_L + (n - 1) * ptSpacing + PAD_R;
  const svgH = PAD_T + chartH + PAD_B;

  const allVals = sorted.flatMap(d => activeCatsList.map(c => d[c.key]).filter(v => v != null && v > 0));
  if (allVals.length === 0) return null;
  const maxVal = Math.max(...allVals);
  const minVal = Math.min(...allVals) * 0.97;
  const range = maxVal - minVal || 1;

  const toX = i => PAD_L + i * ptSpacing;
  const toY = v => PAD_T + chartH - ((v - minVal) / range) * chartH;
  const gridVals = [0, 0.25, 0.5, 0.75, 1].map(p => Math.round(minVal + p * range));
  const fmtY = v => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={svgW} height={svgH} style={{ display: 'block' }}>
        {gridVals.map(v => (
          <g key={v}>
            <line x1={PAD_L} y1={toY(v)} x2={svgW - PAD_R} y2={toY(v)} stroke="#1a1a1a" strokeWidth="1" />
            <text x={PAD_L - 5} y={toY(v) + 4} textAnchor="end" fontSize="9" fill="#555">{fmtY(v)}</text>
          </g>
        ))}
        <text x={10} y={PAD_T + chartH / 2} textAnchor="middle" fontSize="9" fill="#555" transform={`rotate(-90,10,${PAD_T + chartH / 2})`}>{unit}</text>

        {activeCatsList.map(cat => {
          const pts = sorted.map((d, i) => d[cat.key] != null ? { x: toX(i), y: toY(d[cat.key]) } : null);
          const segs = []; let cur = [];
          pts.forEach(p => {
            if (p) { cur.push(`${p.x},${p.y}`); }
            else { if (cur.length) { segs.push(cur.join(' ')); cur = []; } }
          });
          if (cur.length) segs.push(cur.join(' '));
          return (
            <g key={cat.key}>
              {segs.map((seg, si) => <polyline key={si} points={seg} fill="none" stroke={cat.color} strokeWidth="2" strokeLinejoin="round" />)}
              {pts.map((p, i) => p ? <circle key={i} cx={p.x} cy={p.y} r="3" fill={cat.color} /> : null)}
            </g>
          );
        })}

        {sorted.map((d, i) => (
          <text key={i} x={toX(i)} y={PAD_T + chartH + 14} textAnchor="middle" fontSize="8" fill="#444"
            transform={`rotate(-45,${toX(i)},${PAD_T + chartH + 14})`}>
            {d.fecha?.slice(5).replace('-', '/')}
          </text>
        ))}

        {activeCatsList.map((c, i) => (
          <g key={c.key}>
            <line x1={PAD_L + i * 75} y1={8} x2={PAD_L + i * 75 + 14} y2={8} stroke={c.color} strokeWidth="2" />
            <text x={PAD_L + i * 75 + 17} y={12} fontSize="8" fill={c.color}>{c.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function MercadosPanel() {
  // Market switcher
  const [market, setMarket] = useState('liniers');

  // === LINIERS state ===
  const [precios, setPrecios] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [activeCats, setActiveCats] = useState(new Set(['novillito', 'novillo', 'vaca', 'inmag']));
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({ fecha: new Date().toISOString().slice(0, 10), ...Object.fromEntries(MERCADO_CATS.map(c => [c.key, ''])) });
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(null);
  const [autoFetch, setAutoFetch] = useState({ loading: false, msg: null });

  // === ROSGAN state ===
  const [rosganTab, setRosganTab] = useState('invernada');
  const [rosganPrecios, setRosganPrecios] = useState(null);
  const [rosganCargando, setRosganCargando] = useState(false);
  const [rosganInvActiveCats, setRosganInvActiveCats] = useState(new Set(['ternero', 'novillo_1_2']));
  const [rosganCriaActiveCats, setRosganCriaActiveCats] = useState(new Set(['vaca_cria', 'vientre_pren']));
  const [rosganFormVisible, setRosganFormVisible] = useState(false);
  const [rosganFormData, setRosganFormData] = useState({
    fecha: new Date().toISOString().slice(0, 7),
    ...Object.fromEntries([...ROSGAN_INV_CATS, ...ROSGAN_CRIA_CATS].map(c => [c.key, ''])),
  });
  const [rosganGuardando, setRosganGuardando] = useState(false);
  const [rosganEliminando, setRosganEliminando] = useState(null);
  const [rosganAutoFetch, setRosganAutoFetch] = useState({ loading: false, msg: null });

  useEffect(() => {
    setCargando(true);
    getDocs(query(collection(db, 'precios_mercado'), orderBy('fecha', 'desc'), limit(60)))
      .then(snap => setPrecios(snap.docs.map(d => ({ ...d.data(), docId: d.id }))))
      .catch(() => setPrecios([]))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (market !== 'rosgan' || rosganPrecios !== null) return;
    setRosganCargando(true);
    getDocs(query(collection(db, 'precios_rosgan'), orderBy('fecha', 'desc'), limit(60)))
      .then(snap => setRosganPrecios(snap.docs.map(d => ({ ...d.data(), docId: d.id }))))
      .catch(() => setRosganPrecios([]))
      .finally(() => setRosganCargando(false));
  }, [market]); // eslint-disable-line react-hooks/exhaustive-deps

  const latest = precios?.[0];
  const prev = precios?.[1];
  const rosganLatest = rosganPrecios?.[0];
  const rosganPrev = rosganPrecios?.[1];

  const curRosganCats = rosganTab === 'invernada' ? ROSGAN_INV_CATS : ROSGAN_CRIA_CATS;
  const curRosganUnit = rosganTab === 'invernada' ? 'ARS/kg' : 'ARS/cab';
  const curRosganActiveCats = rosganTab === 'invernada' ? rosganInvActiveCats : rosganCriaActiveCats;

  const toggleCat = key => setActiveCats(prev => {
    const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next;
  });
  const toggleRosganCat = key => {
    const setter = rosganTab === 'invernada' ? setRosganInvActiveCats : setRosganCriaActiveCats;
    setter(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  };

  const tryAutoFetch = async () => {
    setAutoFetch({ loading: true, msg: null });
    try {
      const r = await fetch('/api/mercados');
      const json = await r.json();
      if (json.ok && json.precios) {
        setFormData(f => ({
          ...f,
          fecha: json.fecha || f.fecha,
          ...Object.fromEntries(
            MERCADO_CATS.map(c => [c.key, json.precios[c.key] != null ? String(Math.round(json.precios[c.key])) : f[c.key]])
          ),
        }));
        const mes = json.fecha ? ` (${json.fecha})` : '';
        setAutoFetch({ loading: false, msg: `Datos de ${json.source}${mes}. Revisá y guardá.` });
      } else {
        setAutoFetch({ loading: false, msg: `No disponible: ${json.error || 'fuente sin datos'}. Ingresá los precios manualmente.` });
      }
    } catch (e) {
      setAutoFetch({ loading: false, msg: 'Error de red. Ingresá los precios manualmente.' });
    }
    setFormVisible(true);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const entry = {
        fecha: formData.fecha,
        fuente: 'manual',
        ...Object.fromEntries(MERCADO_CATS.map(c => [c.key, parseFloat(formData[c.key]) || null])),
      };
      const ref = await addDoc(collection(db, 'precios_mercado'), entry);
      setPrecios(prev => [{ ...entry, docId: ref.id }, ...(prev || [])].sort((a, b) => b.fecha.localeCompare(a.fecha)));
      setFormVisible(false);
      setAutoFetch({ loading: false, msg: null });
      setFormData({ fecha: new Date().toISOString().slice(0, 10), ...Object.fromEntries(MERCADO_CATS.map(c => [c.key, ''])) });
    } catch (e) { console.error(e); }
    setGuardando(false);
  };

  const eliminar = async (docId) => {
    setEliminando(docId);
    try {
      await deleteDoc(doc(db, 'precios_mercado', docId));
      setPrecios(prev => prev.filter(p => p.docId !== docId));
    } catch (e) { console.error(e); }
    setEliminando(null);
  };

  const guardarRosgan = async () => {
    setRosganGuardando(true);
    try {
      const entry = {
        fecha: rosganFormData.fecha,
        fuente: 'manual',
        ...Object.fromEntries([...ROSGAN_INV_CATS, ...ROSGAN_CRIA_CATS].map(c => [c.key, parseFloat(rosganFormData[c.key]) || null])),
      };
      const ref = await addDoc(collection(db, 'precios_rosgan'), entry);
      setRosganPrecios(prev => [{ ...entry, docId: ref.id }, ...(prev || [])].sort((a, b) => b.fecha.localeCompare(a.fecha)));
      setRosganFormVisible(false);
      setRosganFormData({ fecha: new Date().toISOString().slice(0, 7), ...Object.fromEntries([...ROSGAN_INV_CATS, ...ROSGAN_CRIA_CATS].map(c => [c.key, ''])) });
    } catch (e) { console.error(e); }
    setRosganGuardando(false);
  };

  const eliminarRosgan = async (docId) => {
    setRosganEliminando(docId);
    try {
      await deleteDoc(doc(db, 'precios_rosgan', docId));
      setRosganPrecios(prev => prev.filter(p => p.docId !== docId));
    } catch (e) { console.error(e); }
    setRosganEliminando(null);
  };

  const tryAutoFetchRosgan = async () => {
    setRosganAutoFetch({ loading: true, msg: null });
    try {
      const r = await fetch('/api/mercados-rosgan');
      const json = await r.json();
      if (json.ok && json.precios) {
        setRosganFormData(f => ({
          ...f,
          fecha: json.fecha || f.fecha,
          ...Object.fromEntries(
            ROSGAN_CRIA_CATS.map(c => [c.key, json.precios[c.key] != null ? String(json.precios[c.key]) : f[c.key]])
          ),
        }));
        const mes = json.fecha ? ` (${json.fecha})` : '';
        setRosganAutoFetch({ loading: false, msg: `Datos de ${json.source}${mes}. Revisá y guardá.` });
      } else {
        setRosganAutoFetch({ loading: false, msg: `No disponible: ${json.error || 'sin datos'}. Ingresá manualmente.` });
      }
    } catch (e) {
      setRosganAutoFetch({ loading: false, msg: 'Error de red. Ingresá manualmente.' });
    }
    setRosganFormVisible(true);
  };

  const exportarExcel = () => {
    if (!precios?.length) return;
    const sorted = [...precios].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const wb = XLSX.utils.book_new();
    const rows = [
      ['Fecha', ...MERCADO_CATS.map(c => c.label)],
      ...sorted.map(p => [p.fecha, ...MERCADO_CATS.map(c => p[c.key] ?? '')]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Precios Mercado');
    XLSX.writeFile(wb, `precios_mercado_${new Date().getFullYear()}.xlsx`);
  };

  const exportarRosganExcel = () => {
    if (!rosganPrecios?.length) return;
    const sorted = [...rosganPrecios].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const wb = XLSX.utils.book_new();
    const allCats = [...ROSGAN_INV_CATS, ...ROSGAN_CRIA_CATS];
    const rows = [
      ['Mes', ...allCats.map(c => c.label)],
      ...sorted.map(p => [p.fecha, ...allCats.map(c => p[c.key] ?? '')]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'ROSGAN');
    XLSX.writeFile(wb, `precios_rosgan_${new Date().getFullYear()}.xlsx`);
  };

  const fmtARS = v => v != null ? `$${Math.round(v).toLocaleString('es-AR')}` : '—';
  const inpStyle = { padding: '0.35rem 0.55rem', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '4px', color: '#ddd', fontSize: '0.8rem' };
  const fmtMes = fecha => fecha ? new Date(fecha + '-01T12:00:00').toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }) : '—';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0d0d0d', overflow: 'hidden' }}>
      {/* Sub-header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem', backgroundColor: '#111', borderBottom: '1px solid #222', flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ffd54f', letterSpacing: '0.5px', textTransform: 'uppercase' }}>💰 Mercados</span>

        {/* Market tab switcher */}
        <div style={{ display: 'flex', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '4px', overflow: 'hidden' }}>
          {[['liniers', 'LINIERS'], ['rosgan', 'ROSGAN']].map(([id, label]) => (
            <button key={id} onClick={() => setMarket(id)} style={{
              padding: '0.28rem 0.85rem', fontSize: '0.72rem', fontWeight: '700',
              backgroundColor: market === id ? '#2a2a1a' : 'transparent',
              color: market === id ? '#ffd54f' : '#555',
              border: 'none', borderRight: id === 'liniers' ? '1px solid #2a2a2a' : 'none',
              cursor: 'pointer', letterSpacing: '0.4px',
            }}>{label}</button>
          ))}
        </div>

        <span style={{ fontSize: '0.72rem', color: '#444' }}>
          {market === 'liniers' ? 'Liniers · ARS/kg vivo' : 'Promedios mensuales · ROSGAN'}
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {market === 'liniers' && (
            <>
              <button onClick={exportarExcel} disabled={!precios?.length} style={{ padding: '0.32rem 0.75rem', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'transparent', color: precios?.length ? '#ffd54f' : '#333', border: `1px solid ${precios?.length ? '#8d6e00' : '#222'}`, borderRadius: '4px', cursor: precios?.length ? 'pointer' : 'default' }}>
                Exportar Excel
              </button>
              <button onClick={tryAutoFetch} disabled={autoFetch.loading} style={{ padding: '0.32rem 0.75rem', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'transparent', color: '#888', border: '1px solid #2a2a2a', borderRadius: '4px', cursor: 'pointer' }}>
                {autoFetch.loading ? 'Buscando...' : '↻ Auto'}
              </button>
              <button onClick={() => { setFormVisible(v => !v); setAutoFetch({ loading: false, msg: null }); }} style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem', fontWeight: '700', backgroundColor: formVisible ? '#2a2a1a' : '#1a1a0a', color: '#ffd54f', border: '1px solid #8d6e00', borderRadius: '4px', cursor: 'pointer' }}>
                {formVisible ? 'Cancelar' : '+ Cargar precios'}
              </button>
            </>
          )}
          {market === 'rosgan' && (
            <>
              <button onClick={exportarRosganExcel} disabled={!rosganPrecios?.length} style={{ padding: '0.32rem 0.75rem', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'transparent', color: rosganPrecios?.length ? '#ffd54f' : '#333', border: `1px solid ${rosganPrecios?.length ? '#8d6e00' : '#222'}`, borderRadius: '4px', cursor: rosganPrecios?.length ? 'pointer' : 'default' }}>
                Exportar Excel
              </button>
              {rosganTab === 'cria' && (
                <button onClick={tryAutoFetchRosgan} disabled={rosganAutoFetch.loading} style={{ padding: '0.32rem 0.75rem', fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'transparent', color: '#888', border: '1px solid #2a2a2a', borderRadius: '4px', cursor: 'pointer' }}>
                  {rosganAutoFetch.loading ? 'Buscando...' : '↻ Auto'}
                </button>
              )}
              <button onClick={() => setRosganFormVisible(v => !v)} style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem', fontWeight: '700', backgroundColor: rosganFormVisible ? '#2a2a1a' : '#1a1a0a', color: '#ffd54f', border: '1px solid #8d6e00', borderRadius: '4px', cursor: 'pointer' }}>
                {rosganFormVisible ? 'Cancelar' : '+ Cargar precios'}
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem 1.5rem' }}>

        {/* ── LINIERS ── */}
        {market === 'liniers' && (
          <>
            {formVisible && (
              <div style={{ backgroundColor: '#131313', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.75rem' }}>
                  Precios de mercado — ARS/kg vivo
                  {autoFetch.msg && <span style={{ marginLeft: '1rem', color: autoFetch.msg.startsWith('Datos') ? '#4caf50' : '#ef5350', textTransform: 'none', letterSpacing: 0 }}>{autoFetch.msg}</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '0.62rem', color: '#555', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Fecha</div>
                    <input type="date" value={formData.fecha} onChange={e => setFormData(f => ({ ...f, fecha: e.target.value }))} style={inpStyle} />
                  </div>
                  {MERCADO_CATS.map(cat => (
                    <div key={cat.key}>
                      <div style={{ fontSize: '0.62rem', color: cat.color, textTransform: 'uppercase', marginBottom: '0.2rem', fontWeight: '700' }}>{cat.label}</div>
                      <input type="number" min="0" step="1" value={formData[cat.key]} onChange={e => setFormData(f => ({ ...f, [cat.key]: e.target.value }))} placeholder="ARS/kg" style={{ ...inpStyle, width: '92px' }} />
                    </div>
                  ))}
                  <button onClick={guardar} disabled={guardando} style={{ padding: '0.38rem 1.1rem', backgroundColor: '#1a1a0a', color: '#ffd54f', border: '1px solid #8d6e00', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '700' }}>
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            )}

            {cargando && <div style={{ color: '#555', padding: '3rem', textAlign: 'center' }}>Cargando...</div>}

            {!cargando && precios != null && (
              precios.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#444', padding: '4rem 2rem', fontSize: '0.85rem', lineHeight: 1.8 }}>
                  No hay precios cargados todavía.<br />
                  Usá <strong style={{ color: '#ffd54f' }}>+ Cargar precios</strong> para agregar el primer registro semanal,<br />
                  o <strong style={{ color: '#888' }}>↻ Auto</strong> para intentar obtenerlos automáticamente.
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '0.65rem', marginBottom: '1.5rem' }}>
                    {MERCADO_CATS.map(cat => {
                      const val = latest?.[cat.key];
                      const prevVal = prev?.[cat.key];
                      const delta = val != null && prevVal != null ? ((val - prevVal) / prevVal * 100) : null;
                      return (
                        <div key={cat.key} style={{ backgroundColor: '#131313', borderTop: `3px solid ${cat.color}`, border: `1px solid ${cat.color}22`, borderRadius: '6px', padding: '0.8rem 1rem' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: cat.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>{cat.label}</div>
                          <div style={{ fontSize: '1.55rem', fontWeight: '700', color: '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{fmtARS(val)}</div>
                          <div style={{ fontSize: '0.62rem', color: '#444', marginTop: '0.2rem' }}>ARS/kg · {latest?.fecha?.slice(5).replace('-', '/')}</div>
                          {delta != null && (
                            <div style={{ fontSize: '0.72rem', fontWeight: '700', marginTop: '0.25rem', color: delta > 0 ? '#4caf50' : delta < 0 ? '#ef5350' : '#888' }}>
                              {delta > 0 ? '▲' : delta < 0 ? '▼' : '●'} {Math.abs(delta).toFixed(1)}% vs sem. ant.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {precios.length > 1 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                        {MERCADO_CATS.map(cat => (
                          <button key={cat.key} onClick={() => toggleCat(cat.key)} style={{
                            padding: '0.22rem 0.6rem', fontSize: '0.73rem', fontWeight: '600',
                            backgroundColor: activeCats.has(cat.key) ? `${cat.color}1a` : 'transparent',
                            color: activeCats.has(cat.key) ? cat.color : '#333',
                            border: `1px solid ${activeCats.has(cat.key) ? cat.color : '#1e1e1e'}`,
                            borderRadius: '4px', cursor: 'pointer',
                          }}>{cat.label}</button>
                        ))}
                      </div>
                      <div style={{ backgroundColor: '#111', borderRadius: '6px', padding: '0.75rem 0.75rem 0.25rem' }}>
                        <PrecioEvolucionChart data={precios} activeCats={activeCats} cats={MERCADO_CATS} unit="ARS/kg" />
                      </div>
                    </div>
                  )}

                  <h3 style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.5rem 0' }}>Historial</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '650px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#1a1a1a' }}>
                          <th style={{ padding: '0.45rem 0.65rem', textAlign: 'left', color: '#555', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.4px', borderBottom: '1px solid #2a2a2a' }}>Fecha</th>
                          {MERCADO_CATS.map(c => (
                            <th key={c.key} style={{ padding: '0.45rem 0.65rem', textAlign: 'right', color: c.color, fontWeight: '700', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.3px', borderBottom: '1px solid #2a2a2a' }}>{c.label}</th>
                          ))}
                          <th style={{ width: '30px', borderBottom: '1px solid #2a2a2a' }} />
                        </tr>
                      </thead>
                      <tbody>
                        {precios.map((p, i) => (
                          <tr key={p.docId} style={{ backgroundColor: i % 2 === 0 ? '#111' : '#131313', borderBottom: '1px solid #1e1e1e' }}>
                            <td style={{ padding: '0.4rem 0.65rem', color: '#ccc', fontWeight: '600', whiteSpace: 'nowrap' }}>
                              {new Date(p.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            {MERCADO_CATS.map(c => (
                              <td key={c.key} style={{ padding: '0.4rem 0.65rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: p[c.key] != null ? '#ddd' : '#222' }}>
                                {fmtARS(p[c.key])}
                              </td>
                            ))}
                            <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>
                              <button onClick={() => eliminar(p.docId)} disabled={eliminando === p.docId} title="Eliminar" style={{ background: 'none', border: 'none', color: '#2a2a2a', cursor: 'pointer', fontSize: '0.85rem', padding: '0.1rem 0.3rem' }}>✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )
            )}
          </>
        )}

        {/* ── ROSGAN ── */}
        {market === 'rosgan' && (
          <>
            {/* Invernada / Cría sub-tabs */}
            <div style={{ display: 'flex', marginBottom: '1.25rem', backgroundColor: '#131313', border: '1px solid #222', borderRadius: '6px', overflow: 'hidden', width: 'fit-content' }}>
              {[['invernada', 'Invernada', '$/kg vivo'], ['cria', 'Cría', '$/cabeza']].map(([id, label, unit]) => (
                <button key={id} onClick={() => setRosganTab(id)} style={{
                  padding: '0.45rem 1.25rem', fontSize: '0.78rem', fontWeight: '700',
                  backgroundColor: rosganTab === id ? '#1a2a1a' : 'transparent',
                  color: rosganTab === id ? '#4caf50' : '#555',
                  border: 'none', borderRight: id === 'invernada' ? '1px solid #222' : 'none',
                  cursor: 'pointer',
                }}>
                  {label} <span style={{ fontSize: '0.65rem', fontWeight: '400', color: rosganTab === id ? '#4caf5077' : '#2a2a2a' }}>{unit}</span>
                </button>
              ))}
            </div>

            {/* ROSGAN form */}
            {rosganFormVisible && (
              <div style={{ backgroundColor: '#131313', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.85rem' }}>Cargar promedios mensuales ROSGAN</div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.62rem', color: '#555', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Mes</div>
                  <input type="month" value={rosganFormData.fecha} onChange={e => setRosganFormData(f => ({ ...f, fecha: e.target.value }))} style={inpStyle} />
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.62rem', color: '#4caf50', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: '700', marginBottom: '0.5rem' }}>Invernada — ARS/kg vivo</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                    {ROSGAN_INV_CATS.map(cat => (
                      <div key={cat.key}>
                        <div style={{ fontSize: '0.62rem', color: cat.color, textTransform: 'uppercase', marginBottom: '0.2rem', fontWeight: '700' }}>{cat.label}</div>
                        <input type="number" min="0" step="0.01" value={rosganFormData[cat.key]} onChange={e => setRosganFormData(f => ({ ...f, [cat.key]: e.target.value }))} placeholder="ARS/kg" style={{ ...inpStyle, width: '105px' }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.62rem', color: '#ef5350', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: '700', marginBottom: '0.5rem' }}>
                    Cría — ARS/cabeza
                    {rosganAutoFetch.msg && <span style={{ marginLeft: '1rem', color: rosganAutoFetch.msg.startsWith('Datos') ? '#4caf50' : '#ef5350', textTransform: 'none', letterSpacing: 0, fontWeight: '400' }}>{rosganAutoFetch.msg}</span>}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                    {ROSGAN_CRIA_CATS.map(cat => (
                      <div key={cat.key}>
                        <div style={{ fontSize: '0.62rem', color: cat.color, textTransform: 'uppercase', marginBottom: '0.2rem', fontWeight: '700' }}>{cat.label}</div>
                        <input type="number" min="0" step="1" value={rosganFormData[cat.key]} onChange={e => setRosganFormData(f => ({ ...f, [cat.key]: e.target.value }))} placeholder="ARS/cab" style={{ ...inpStyle, width: '130px' }} />
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={guardarRosgan} disabled={rosganGuardando} style={{ padding: '0.38rem 1.1rem', backgroundColor: '#1a1a0a', color: '#ffd54f', border: '1px solid #8d6e00', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '700' }}>
                  {rosganGuardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            )}

            {rosganCargando && <div style={{ color: '#555', padding: '3rem', textAlign: 'center' }}>Cargando...</div>}

            {!rosganCargando && rosganPrecios != null && (
              rosganPrecios.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#444', padding: '4rem 2rem', fontSize: '0.85rem', lineHeight: 1.8 }}>
                  No hay precios cargados todavía.<br />
                  Usá <strong style={{ color: '#ffd54f' }}>+ Cargar precios</strong> para agregar el primer registro mensual.
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '0.65rem', marginBottom: '1.5rem' }}>
                    {curRosganCats.map(cat => {
                      const val = rosganLatest?.[cat.key];
                      const prevVal = rosganPrev?.[cat.key];
                      const delta = val != null && prevVal != null ? ((val - prevVal) / prevVal * 100) : null;
                      return (
                        <div key={cat.key} style={{ backgroundColor: '#131313', borderTop: `3px solid ${cat.color}`, border: `1px solid ${cat.color}22`, borderRadius: '6px', padding: '0.8rem 1rem' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: cat.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>{cat.label}</div>
                          <div style={{ fontSize: '1.35rem', fontWeight: '700', color: '#fff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{fmtARS(val)}</div>
                          <div style={{ fontSize: '0.62rem', color: '#444', marginTop: '0.2rem' }}>{curRosganUnit} · {fmtMes(rosganLatest?.fecha)}</div>
                          {delta != null && (
                            <div style={{ fontSize: '0.72rem', fontWeight: '700', marginTop: '0.25rem', color: delta > 0 ? '#4caf50' : delta < 0 ? '#ef5350' : '#888' }}>
                              {delta > 0 ? '▲' : delta < 0 ? '▼' : '●'} {Math.abs(delta).toFixed(1)}% vs mes ant.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {rosganPrecios.length > 1 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                        {curRosganCats.map(cat => (
                          <button key={cat.key} onClick={() => toggleRosganCat(cat.key)} style={{
                            padding: '0.22rem 0.6rem', fontSize: '0.73rem', fontWeight: '600',
                            backgroundColor: curRosganActiveCats.has(cat.key) ? `${cat.color}1a` : 'transparent',
                            color: curRosganActiveCats.has(cat.key) ? cat.color : '#333',
                            border: `1px solid ${curRosganActiveCats.has(cat.key) ? cat.color : '#1e1e1e'}`,
                            borderRadius: '4px', cursor: 'pointer',
                          }}>{cat.label}</button>
                        ))}
                      </div>
                      <div style={{ backgroundColor: '#111', borderRadius: '6px', padding: '0.75rem 0.75rem 0.25rem' }}>
                        <PrecioEvolucionChart data={rosganPrecios} activeCats={curRosganActiveCats} cats={curRosganCats} unit={curRosganUnit} />
                      </div>
                    </div>
                  )}

                  <h3 style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.5rem 0' }}>Historial</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '420px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#1a1a1a' }}>
                          <th style={{ padding: '0.45rem 0.65rem', textAlign: 'left', color: '#555', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.4px', borderBottom: '1px solid #2a2a2a' }}>Mes</th>
                          {curRosganCats.map(c => (
                            <th key={c.key} style={{ padding: '0.45rem 0.65rem', textAlign: 'right', color: c.color, fontWeight: '700', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.3px', borderBottom: '1px solid #2a2a2a' }}>{c.label}</th>
                          ))}
                          <th style={{ width: '30px', borderBottom: '1px solid #2a2a2a' }} />
                        </tr>
                      </thead>
                      <tbody>
                        {rosganPrecios.map((p, i) => (
                          <tr key={p.docId} style={{ backgroundColor: i % 2 === 0 ? '#111' : '#131313', borderBottom: '1px solid #1e1e1e' }}>
                            <td style={{ padding: '0.4rem 0.65rem', color: '#ccc', fontWeight: '600', whiteSpace: 'nowrap' }}>
                              {fmtMes(p.fecha)}
                            </td>
                            {curRosganCats.map(c => (
                              <td key={c.key} style={{ padding: '0.4rem 0.65rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: p[c.key] != null ? '#ddd' : '#222' }}>
                                {fmtARS(p[c.key])}
                              </td>
                            ))}
                            <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>
                              <button onClick={() => eliminarRosgan(p.docId)} disabled={rosganEliminando === p.docId} title="Eliminar" style={{ background: 'none', border: 'none', color: '#2a2a2a', cursor: 'pointer', fontSize: '0.85rem', padding: '0.1rem 0.3rem' }}>✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Clima ────────────────────────────────────────────────────────────────────

function LluviaChart({ apiData, manualData, year }) {
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const PAD_L = 52, PAD_R = 20, PAD_T = 22, PAD_B = 38;
  const BAR_W = 30, GAP = 8;
  const chartH = 160;
  const svgW = PAD_L + 12 * (BAR_W + GAP) + PAD_R;
  const svgH = PAD_T + chartH + PAD_B;

  const months = MESES.map((label, m) => {
    const ym = `${year}-${String(m + 1).padStart(2, '0')}`;
    const api = apiData?.[ym] ?? null;
    const manual = manualData.filter(r => r.fecha?.slice(0,7) === ym).reduce((s,r) => s + (r.mm || 0), 0);
    return { label, ym, api, manual: manualData.some(r => r.fecha?.slice(0,7) === ym) ? manual : null };
  });

  const maxVal = Math.max(...months.map(m => Math.max(m.api ?? 0, m.manual ?? 0)), 50);
  const totalApi = months.reduce((s,m) => s + (m.api ?? 0), 0);
  const totalManual = months.reduce((s,m) => s + (m.manual ?? 0), 0);
  const toY = v => PAD_T + chartH - (v / maxVal) * chartH;
  const toX = i => PAD_L + i * (BAR_W + GAP);
  const gridVals = [0, 0.25, 0.5, 0.75, 1].map(p => Math.round(p * maxVal));

  return (
    <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.72rem', color: '#555' }}>
        <span>
          API: <strong style={{ color: '#1e88e5' }}>{Math.round(totalApi)} mm</strong>
          {totalManual > 0 && <> · Registros propios: <strong style={{ color: '#43a047' }}>{Math.round(totalManual)} mm</strong></>}
        </span>
        <span>Open-Meteo ERA5 · Ayacucho</span>
      </div>
      <svg width={svgW} height={svgH} style={{ display: 'block' }}>
        {gridVals.map(v => (
          <g key={v}>
            <line x1={PAD_L} y1={toY(v)} x2={svgW - PAD_R} y2={toY(v)} stroke="#1a1a1a" strokeWidth="1" />
            <text x={PAD_L - 5} y={toY(v) + 4} textAnchor="end" fontSize="9" fill="#555">{v}</text>
          </g>
        ))}
        <text x={12} y={PAD_T + chartH / 2} textAnchor="middle" fontSize="9" fill="#555" transform={`rotate(-90,12,${PAD_T + chartH / 2})`}>mm</text>
        {months.map((m, i) => {
          const bApi = m.api != null ? Math.max(2, (m.api / maxVal) * chartH) : 0;
          const bMan = m.manual != null ? Math.max(2, (m.manual / maxVal) * chartH) : 0;
          return (
            <g key={m.ym}>
              {m.api != null && (
                <>
                  <rect x={toX(i)} y={toY(m.api)} width={BAR_W} height={bApi} fill="#1565c0" rx="2" />
                  {m.api >= 5 && <text x={toX(i) + BAR_W / 2} y={toY(m.api) - 3} textAnchor="middle" fontSize="8" fill="#64b5f6">{Math.round(m.api)}</text>}
                </>
              )}
              {m.manual != null && (
                <>
                  <rect x={toX(i) + 2} y={toY(m.manual)} width={BAR_W - 4} height={bMan} fill="none" stroke="#43a047" strokeWidth="2" rx="2" />
                </>
              )}
              {m.api == null && <rect x={toX(i)} y={PAD_T} width={BAR_W} height={chartH} fill="#0d0d0d" rx="2" />}
              <text x={toX(i) + BAR_W / 2} y={PAD_T + chartH + 14} textAnchor="middle" fontSize="9" fill="#444">{m.label}</text>
            </g>
          );
        })}
        <rect x={PAD_L} y={4} width={10} height={8} fill="#1565c0" rx="1" />
        <text x={PAD_L + 13} y={11} fontSize="8" fill="#888">ERA5</text>
        <rect x={PAD_L + 46} y={4} width={10} height={8} fill="none" stroke="#43a047" strokeWidth="1.5" rx="1" />
        <text x={PAD_L + 59} y={11} fontSize="8" fill="#43a047">Propio</text>
      </svg>
    </div>
  );
}

function ClimaPanel() {
  const [activeTab, setActiveTab] = useState('ahora');
  const [climaData, setClimaData] = useState(null);
  const [loadingClima, setLoadingClima] = useState(false);
  const [lluviasApiRaw, setLluviasApiRaw] = useState(null);
  const [loadingApi, setLoadingApi] = useState(false);
  const [lluviasManual, setLluviasManual] = useState([]);
  const [lluviasLoaded, setLluviasLoaded] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState(new Date().toISOString().slice(0, 10));
  const [nuevaMm, setNuevaMm] = useState('');
  const [nuevaObs, setNuevaObs] = useState('');
  const [lluviasAnio, setLluviasAnio] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoadingClima(true);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${FARM_LAT}&longitude=${FARM_LON}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,weather_code,surface_pressure,cloud_cover` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code` +
      `&timezone=America%2FArgentina%2FBuenos_Aires&wind_speed_unit=kmh&forecast_days=3`;
    fetch(url).then(r => r.json()).then(setClimaData).catch(() => {}).finally(() => setLoadingClima(false));
  }, []);

  useEffect(() => {
    if (activeTab !== 'lluvia' || lluviasApiRaw !== null || loadingApi) return;
    setLoadingApi(true);
    const start = '2020-01-01';
    const end = new Date().toISOString().slice(0, 10);
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${FARM_LAT}&longitude=${FARM_LON}` +
      `&start_date=${start}&end_date=${end}&daily=precipitation_sum&timezone=America%2FArgentina%2FBuenos_Aires`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        const raw = {};
        (data.daily?.time || []).forEach((d, i) => { raw[d] = data.daily.precipitation_sum[i] ?? 0; });
        setLluviasApiRaw(raw);
      })
      .catch(() => setLluviasApiRaw({}))
      .finally(() => setLoadingApi(false));
  }, [activeTab, lluviasApiRaw, loadingApi]);

  useEffect(() => {
    if (activeTab !== 'lluvia' || lluviasLoaded) return;
    getDocs(query(collection(db, 'lluvias'), orderBy('fecha', 'desc')))
      .then(snap => { setLluviasManual(snap.docs.map(d => ({ ...d.data(), docId: d.id }))); setLluviasLoaded(true); })
      .catch(() => setLluviasLoaded(true));
  }, [activeTab, lluviasLoaded]);

  const apiMensual = {};
  if (lluviasApiRaw) {
    Object.entries(lluviasApiRaw).forEach(([d, mm]) => {
      const ym = d.slice(0, 7);
      apiMensual[ym] = (apiMensual[ym] || 0) + mm;
    });
  }
  const aniosDisponibles = [...new Set([
    ...Object.keys(apiMensual).map(ym => parseInt(ym.slice(0, 4))),
    ...lluviasManual.map(r => parseInt((r.fecha || '').slice(0, 4))).filter(Boolean),
  ])].filter(Boolean).sort((a, b) => b - a);

  const agregarLluvia = async () => {
    const mm = parseFloat(nuevaMm);
    if (!nuevaFecha || isNaN(mm) || mm < 0) return;
    setGuardando(true);
    try {
      const entry = { fecha: nuevaFecha, mm, obs: nuevaObs.trim() || null };
      const ref = await addDoc(collection(db, 'lluvias'), entry);
      setLluviasManual(prev => [{ ...entry, docId: ref.id }, ...prev].sort((a, b) => b.fecha.localeCompare(a.fecha)));
      setNuevaMm('');
      setNuevaObs('');
    } catch (e) { console.error(e); }
    setGuardando(false);
  };

  const eliminarLluvia = async (docId) => {
    setEliminando(docId);
    try {
      await deleteDoc(doc(db, 'lluvias', docId));
      setLluviasManual(prev => prev.filter(r => r.docId !== docId));
    } catch (e) { console.error(e); }
    setEliminando(null);
  };

  const exportarLluviasExcel = () => {
    const wb = XLSX.utils.book_new();
    const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    aniosDisponibles.forEach(y => {
      const rows = [['Mes', 'ERA5 (mm)', 'Registrado (mm)']];
      MESES.forEach((label, m) => {
        const ym = `${y}-${String(m + 1).padStart(2, '0')}`;
        const api = parseFloat((apiMensual[ym] || 0).toFixed(1));
        const manual = parseFloat(lluviasManual.filter(r => r.fecha?.slice(0,7) === ym).reduce((s,r) => s+(r.mm||0), 0).toFixed(1));
        rows.push([`${label} ${y}`, api, manual || '']);
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), `Lluvia ${y}`);
    });
    const detalleRows = [['Fecha', 'mm', 'Observaciones'], ...lluviasManual.map(r => [r.fecha, r.mm, r.obs || ''])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detalleRows), 'Registros propios');
    XLSX.writeFile(wb, `lluvias_${lluviasAnio}.xlsx`);
  };

  const inputStyle = { padding: '0.35rem 0.6rem', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '4px', color: '#ddd', fontSize: '0.82rem' };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0d0d0d', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#111', borderBottom: '1px solid #222', flexShrink: 0 }}>
        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64b5f6', marginRight: '1rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>🌤 Clima</span>
        {[{ id: 'ahora', label: 'Ahora' }, { id: 'lluvia', label: 'Lluvia' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '0.35rem 0.9rem', fontSize: '0.82rem', fontWeight: '600',
            backgroundColor: activeTab === t.id ? '#0d1f3c' : 'transparent',
            color: activeTab === t.id ? '#64b5f6' : '#666',
            border: `1px solid ${activeTab === t.id ? '#1565c0' : '#2a2a2a'}`,
            borderRadius: '4px', cursor: 'pointer'
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>

        {/* ── AHORA ── */}
        {activeTab === 'ahora' && (
          <div style={{ maxWidth: '720px' }}>
            {loadingClima && <div style={{ color: '#555', padding: '3rem', textAlign: 'center' }}>Obteniendo datos meteorológicos...</div>}
            {!loadingClima && !climaData?.current && (
              <div style={{ color: '#444', padding: '2rem', textAlign: 'center' }}>No se pudo obtener el clima. Verificá la conexión.</div>
            )}
            {!loadingClima && climaData?.current && (() => {
              const c = climaData.current;
              const d = climaData.daily;
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', marginBottom: '1.75rem' }}>
                    <div>
                      <div style={{ fontSize: '5rem', fontWeight: '200', lineHeight: 1, color: '#fff', letterSpacing: '-3px' }}>
                        {Math.round(c.temperature_2m)}<span style={{ fontSize: '2.5rem', color: '#aaa' }}>°C</span>
                      </div>
                      <div style={{ fontSize: '0.88rem', color: '#888', marginTop: '0.3rem' }}>
                        Sensación {Math.round(c.apparent_temperature)}°C · {wmoDesc(c.weather_code)}
                      </div>
                      {d?.time?.[0] && (
                        <div style={{ fontSize: '0.78rem', color: '#555', marginTop: '0.2rem' }}>
                          Hoy: {Math.round(d.temperature_2m_min[0])}° mín · {Math.round(d.temperature_2m_max[0])}° máx
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '4rem', opacity: 0.55, lineHeight: 1, paddingTop: '0.5rem' }}>{wmoIcon(c.weather_code)}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem', marginBottom: '1.75rem' }}>
                    {[
                      { label: 'Humedad', val: `${c.relative_humidity_2m}%`, color: '#64b5f6' },
                      { label: 'Viento', val: `${Math.round(c.wind_speed_10m)} km/h ${windDir(c.wind_direction_10m)}`, color: '#ccc' },
                      { label: 'Presión', val: `${Math.round(c.surface_pressure)} hPa`, color: '#ccc' },
                      { label: 'Nubosidad', val: `${c.cloud_cover}%`, color: '#ccc' },
                      { label: 'Precip. hoy', val: `${(d?.precipitation_sum?.[0] ?? 0).toFixed(1)} mm`, color: '#64b5f6' },
                    ].map(s => (
                      <div key={s.label} style={{ backgroundColor: '#131313', border: '1px solid #1e1e1e', borderRadius: '6px', padding: '0.75rem 0.9rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.3rem' }}>{s.label}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '600', color: s.color }}>{s.val}</div>
                      </div>
                    ))}
                  </div>

                  {d?.time && (
                    <>
                      <h3 style={{ fontSize: '0.75rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.65rem 0' }}>Próximos días</h3>
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        {[1, 2].map(i => (
                          <div key={i} style={{ flex: 1, backgroundColor: '#131313', border: '1px solid #1e1e1e', borderRadius: '6px', padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.72rem', color: '#555', marginBottom: '0.4rem', textTransform: 'capitalize' }}>
                              {new Date(d.time[i] + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </div>
                            <div style={{ fontSize: '2rem', opacity: 0.6, marginBottom: '0.3rem' }}>{wmoIcon(d.weather_code[i])}</div>
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#ddd' }}>
                              {Math.round(d.temperature_2m_min[i])}° / {Math.round(d.temperature_2m_max[i])}°
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64b5f6', marginTop: '0.2rem', fontWeight: '600' }}>
                              {(d.precipitation_sum[i] || 0).toFixed(1)} mm
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#444', marginTop: '0.15rem' }}>{wmoDesc(d.weather_code[i])}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div style={{ fontSize: '0.68rem', color: '#252525' }}>
                    Open-Meteo ERA5 · Solanet, Ayacucho ({FARM_LAT}, {FARM_LON})
                    {c.time && ` · Actualizado ${new Date(c.time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ── LLUVIA ── */}
        {activeTab === 'lluvia' && (
          <div style={{ maxWidth: '860px' }}>
            {/* Year filter + export */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.4px', marginRight: '0.25rem' }}>Año</span>
                {(loadingApi || !lluviasApiRaw) && <span style={{ fontSize: '0.75rem', color: '#444' }}>Cargando datos...</span>}
                {aniosDisponibles.map(y => (
                  <button key={y} onClick={() => setLluviasAnio(y)} style={{
                    padding: '0.28rem 0.75rem', fontSize: '0.8rem', fontWeight: '600',
                    backgroundColor: lluviasAnio === y ? '#0d1f3c' : 'transparent',
                    color: lluviasAnio === y ? '#64b5f6' : '#555',
                    border: `1px solid ${lluviasAnio === y ? '#1565c0' : '#2a2a2a'}`,
                    borderRadius: '4px', cursor: 'pointer'
                  }}>{y}</button>
                ))}
              </div>
              {lluviasApiRaw && (
                <button onClick={exportarLluviasExcel} style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem', fontWeight: '600', backgroundColor: '#0d1f3c', color: '#64b5f6', border: '1px solid #1565c0', borderRadius: '4px', cursor: 'pointer' }}>
                  Exportar Excel
                </button>
              )}
            </div>

            {/* Monthly chart */}
            {lluviasApiRaw && (
              <LluviaChart apiData={apiMensual} manualData={lluviasManual} year={lluviasAnio} />
            )}

            {/* Manual records */}
            <div style={{ borderTop: '1px solid #1e1e1e', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <h3 style={{ fontSize: '0.78rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.75rem 0' }}>Registrar lluvia</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.65rem', color: '#555', textTransform: 'uppercase' }}>Fecha</span>
                  <input type="date" value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.65rem', color: '#555', textTransform: 'uppercase' }}>mm</span>
                  <input type="number" min="0" step="0.5" value={nuevaMm} onChange={e => setNuevaMm(e.target.value)} placeholder="ej: 24.5" style={{ ...inputStyle, width: '90px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1, minWidth: '160px' }}>
                  <span style={{ fontSize: '0.65rem', color: '#555', textTransform: 'uppercase' }}>Observación (opcional)</span>
                  <input type="text" value={nuevaObs} onChange={e => setNuevaObs(e.target.value)} placeholder="ej: tormenta por la tarde" style={{ ...inputStyle, width: '100%' }} />
                </div>
                <button onClick={agregarLluvia} disabled={guardando || !nuevaMm} style={{ padding: '0.38rem 1rem', backgroundColor: nuevaMm ? '#0d1f3c' : '#111', color: nuevaMm ? '#64b5f6' : '#333', border: `1px solid ${nuevaMm ? '#1565c0' : '#222'}`, borderRadius: '4px', cursor: nuevaMm ? 'pointer' : 'default', fontSize: '0.82rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  {guardando ? 'Guardando...' : '+ Agregar'}
                </button>
              </div>

              {/* Records table */}
              {lluviasManual.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1a1a1a' }}>
                      {['Fecha', 'mm', 'Observación', ''].map(h => (
                        <th key={h} style={{ padding: '0.45rem 0.65rem', textAlign: h === 'mm' ? 'right' : 'left', color: '#666', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.67rem', letterSpacing: '0.4px', borderBottom: '1px solid #2a2a2a' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lluviasManual.filter(r => r.fecha?.startsWith(lluviasAnio)).map((r, i) => (
                      <tr key={r.docId} style={{ backgroundColor: i % 2 === 0 ? '#111' : '#131313', borderBottom: '1px solid #1e1e1e' }}>
                        <td style={{ padding: '0.4rem 0.65rem', color: '#ccc' }}>{new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td style={{ padding: '0.4rem 0.65rem', color: '#64b5f6', fontWeight: '700', textAlign: 'right' }}>{r.mm.toFixed(1)} mm</td>
                        <td style={{ padding: '0.4rem 0.65rem', color: '#555', fontSize: '0.78rem' }}>{r.obs || '—'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>
                          <button onClick={() => eliminarLluvia(r.docId)} disabled={eliminando === r.docId} style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '0.85rem', padding: '0.1rem 0.3rem' }} title="Eliminar">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {lluviasLoaded && lluviasManual.filter(r => r.fecha?.startsWith(lluviasAnio)).length === 0 && (
                <div style={{ fontSize: '0.78rem', color: '#333', padding: '0.75rem 0' }}>Sin registros propios para {lluviasAnio}.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EvDiasHaChart({ data }) {
  if (!data || data.length === 0) return null;
  const PAD_L = 55, PAD_R = 50, PAD_T = 18, PAD_B = 18;
  const BAR_H = 17, GAP = 5;
  const svgW = 680;
  const innerW = svgW - PAD_L - PAD_R;
  const svgH = PAD_T + data.length * (BAR_H + GAP) + PAD_B;
  const maxVal = Math.max(...data.map(d => d.evDiasHa), 1);
  const gridVals = [0.25, 0.5, 0.75, 1].map(p => parseFloat((p * maxVal).toFixed(1)));

  function barColor(val) {
    const t = Math.min(1, val / maxVal);
    if (t < 0.5) { return `rgb(${180},${Math.round(t * 2 * 160)},0)`; }
    return `rgb(${Math.round((1 - (t - 0.5) * 2) * 180)},160,0)`;
  }

  return (
    <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
      <svg width={svgW} height={svgH} style={{ display: 'block' }}>
        {/* Grid verticals */}
        {gridVals.map(v => {
          const x = PAD_L + (v / maxVal) * innerW;
          return (
            <g key={v}>
              <line x1={x} y1={PAD_T} x2={x} y2={svgH - PAD_B} stroke="#1e1e1e" strokeWidth="1" />
              <text x={x} y={PAD_T - 4} textAnchor="middle" fontSize="8" fill="#444">{v}</text>
            </g>
          );
        })}
        {/* Baseline */}
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={svgH - PAD_B} stroke="#333" strokeWidth="1" />
        {/* Bars */}
        {data.map((d, i) => {
          const y = PAD_T + i * (BAR_H + GAP);
          const barW = Math.max(2, (d.evDiasHa / maxVal) * innerW);
          return (
            <g key={d.nombre}>
              <text x={PAD_L - 6} y={y + BAR_H * 0.72} textAnchor="end" fontSize="10" fill="#ffeb3b" fontWeight="600">{d.nombre}</text>
              <rect x={PAD_L} y={y} width={barW} height={BAR_H} fill={barColor(d.evDiasHa)} rx="2" />
              <text x={PAD_L + barW + 5} y={y + BAR_H * 0.72} fontSize="9" fill="#aaa">{d.evDiasHa.toFixed(1)}</text>
            </g>
          );
        })}
        {/* Axis label */}
        <text x={PAD_L + innerW / 2} y={svgH - 2} textAnchor="middle" fontSize="9" fill="#555">EV·días / ha</text>
      </svg>
    </div>
  );
}

function ForrajePanel({ hacienda, historial }) {
  const [activeTab, setActiveTab] = useState('actual');
  const [radiation, setRadiation] = useState({});
  const [ndviCurrent, setNdviCurrent] = useState({});   // current-date per-potrero NDVI
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [ndviHistory, setNdviHistory] = useState(null); // null = not yet loaded
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [efficiency, setEfficiency] = useState(50);
  const [msData, setMsData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [validacion, setValidacion] = useState({ results: {}, running: false, progress: 0, total: 0 });
  const [valSelMonths, setValSelMonths] = useState(null); // null = not yet initialized
  const [simPotrero, setSimPotrero] = useState('');
  const [simAnimales, setSimAnimales] = useState([{ cat: 'Vacas c/Cría', cantidad: 100 }]);
  const [simMode, setSimMode] = useState('dias');
  const [simTargetDias, setSimTargetDias] = useState(30);
  const [simTargetCat, setSimTargetCat] = useState('Vacas c/Cría');
  const [pastoreosAll, setPastoreosAll] = useState(null); // null = not loaded
  const [loadingPastoreos, setLoadingPastoreos] = useState(false);
  const [pastoreosYear, setPastoreosYear] = useState(null); // null = todos los años

  // Fetch radiation on mount
  useEffect(() => {
    fetch('/api/forraje-radiation?months=24')
      .then(r => r.json())
      .then(data => {
        // Si la API devuelve un error en vez de datos de radiación, ignorarlo
        // (evita que strings de error lleguen a calcMS y produzcan NaN)
        if (data && typeof data.error === 'string') {
          console.warn('Radiation API error:', data.error, data.detail ?? '');
          setRadiation({});
        } else {
          setRadiation(data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch GEE CSV on mount
  useEffect(() => {
    fetch('/ms_mensual.csv')
      .then(r => r.text())
      .then(text => setMsData(parseGeeCSV(text)))
      .catch(() => setMsData({}));
  }, []);

  // Fetch current NDVI for all potreros on mount (independent of map)
  useEffect(() => {
    setLoadingCurrent(true);
    const currentDate = getNdviDates()[0];
    fetch('/api/ndvi-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ polygons: potreroPolygons(), index: 'NDVIc', date: currentDate })
    })
      .then(r => r.json())
      .then(setNdviCurrent)
      .catch(() => {})
      .finally(() => setLoadingCurrent(false));
  }, []);

  useEffect(() => {
    if ((activeTab === 'curva' || activeTab === 'descanso') && ndviHistory === null && !loadingHistory) {
      setLoadingHistory(true);
      const dates = getHistoricalDates(12);
      fetch('/api/forraje-ndvi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ polygons: potreroPolygons(), index: 'NDVIc', dates })
      })
        .then(r => r.json())
        .then(setNdviHistory)
        .catch(() => setNdviHistory({}))
        .finally(() => setLoadingHistory(false));
    }
  }, [activeTab, ndviHistory, loadingHistory]);

  // Cargar toda la colección de pastoreos al entrar a la pestaña
  useEffect(() => {
    if (activeTab === 'pastoreos' && pastoreosAll === null && !loadingPastoreos) {
      setLoadingPastoreos(true);
      const q = query(collection(db, 'pastoreos'), orderBy('fecha_salida', 'desc'));
      getDocs(q)
        .then(snap => setPastoreosAll(snap.docs.map(d => ({ ...d.data(), docId: d.id }))))
        .catch(err => { console.error('Error cargando pastoreos:', err); setPastoreosAll([]); })
        .finally(() => setLoadingPastoreos(false));
    }
  }, [activeTab, pastoreosAll, loadingPastoreos]);

  const currentYM = new Date().toISOString().slice(0, 7);
  const currentMonth = new Date().getMonth();
  const radMonths = Object.keys(radiation).sort();
  // Use current month if available, otherwise fall back to most recent complete month
  const currentRad = radiation[currentYM] ?? (radMonths.length > 0 ? radiation[radMonths[radMonths.length - 1]] : null);
  const radLabel = radiation[currentYM] ? currentYM : radMonths[radMonths.length - 1];

  // Estado Actual: use own fetched ndviCurrent + current month radiation
  const estadoActual = POSTREROS_GEOJSON.features.map(f => {
    const nombre = f.properties.nombre;
    const ha = f.properties.ha;
    const ndvi = ndviCurrent[nombre] ?? null;
    const msHa = ndvi != null && currentRad != null ? calcMS(ndvi, currentRad, currentMonth) : null;
    const msTotal = msHa != null ? msHa * ha : null;
    const msDisponible = msTotal != null ? msTotal * (efficiency / 100) : null;
    const catsEnPotrero = hacienda.filter(h => h.potrero === nombre);
    const consumoDiario = catsEnPotrero.reduce(
      (sum, cat) => sum + (cat.cantidad || 0) * getCatConsumoDiario(cat.nombre, currentMonth), 0
    );
    const diasRestantes = msDisponible != null && consumoDiario > 0
      ? Math.round(msDisponible / consumoDiario)
      : null;
    return { nombre, ha, ndvi, msHa, msDisponible, consumoDiario, diasRestantes, ocupado: catsEnPotrero.length > 0 };
  }).sort((a, b) => {
    if (a.diasRestantes != null && b.diasRestantes != null) return a.diasRestantes - b.diasRestantes;
    if (a.diasRestantes != null) return -1;
    return 1;
  });

  // Curva forrajera: GEE CSV data (oferta) + hacienda demand
  const curvaMonths = msData ? Object.keys(msData.byMonth).sort() : [];
  const curvaOfertaKg = curvaMonths.map(ym => msData.byMonth[ym]?.oferta_kg ?? null);
  const curvaOfertaDispKg = curvaMonths.map(ym => {
    const v = msData?.byMonth[ym]?.oferta_kg;
    return v != null ? v * (efficiency / 100) : null;
  });
  const curvaDemandaKg = curvaMonths.map(ym => {
    const mesIndex = parseInt(ym.slice(5), 10) - 1;
    const dias = daysInMonth(ym);
    return hacienda.reduce((sum, cat) => {
      return sum + (cat.cantidad || 0) * getCatConsumoDiario(cat.nombre, mesIndex) * dias;
    }, 0);
  });
  const curvaBalanceKg = curvaMonths.map((ym, i) => {
    const disp = curvaOfertaDispKg[i];
    const dem = curvaDemandaKg[i];
    return disp != null && dem != null ? disp - dem : null;
  });

  // Período de descanso: per resting potrero, accumulated MS since last exit
  const descansoData = POSTREROS_GEOJSON.features
    .filter(f => {
      const nombre = f.properties.nombre;
      const ocupado = hacienda.some(h => h.potrero === nombre);
      return !ocupado && historial[nombre]?.fecha_ultima_salida;
    })
    .map(f => {
      const nombre = f.properties.nombre;
      const ha = f.properties.ha;
      const fechaSalida = new Date(historial[nombre].fecha_ultima_salida);
      const diasDescanso = Math.floor((Date.now() - fechaSalida.getTime()) / 86400000);

      // Sum MS for each month since salida
      let msAcum = 0;
      let msAcumHa = 0;
      const sortedYMs = Object.keys(radiation).sort();
      sortedYMs.forEach(ym => {
        const [y, m] = ym.split('-').map(Number);
        const monthStart = new Date(y, m - 1, 1);
        if (monthStart < fechaSalida) return;
        const rad = radiation[ym];
        let ndvi = null;
        if (ndviHistory && ndviHistory[ym] && ndviHistory[ym][nombre] != null) {
          ndvi = ndviHistory[ym][nombre];
        } else if (ym === currentYM && ndviCurrent[nombre] != null) {
          ndvi = ndviCurrent[nombre];
        }
        if (ndvi != null && rad != null) {
          const msHa = calcMS(ndvi, rad, m - 1); // m es 1-based desde ym
          msAcumHa += msHa;
          msAcum += msHa * ha;
        }
      });

      return { nombre, ha, diasDescanso, msAcumHa: Math.round(msAcumHa), msAcum: Math.round(msAcum * efficiency / 100) };
    })
    .sort((a, b) => b.diasDescanso - a.diasDescanso);

  const tabs = [
    { id: 'actual', label: 'Estado Actual' },
    { id: 'ranking', label: 'Ranking Pasto' },
    { id: 'simulador', label: 'Simulador' },
    { id: 'curva', label: 'Curva Forrajera' },
    { id: 'potrero', label: 'Por Potrero' },
    { id: 'descanso', label: 'Período Descanso' },
    { id: 'pastoreos', label: 'Pastoreos' },
  ];

  // Pastoreos: filtro por año + agregación por potrero (productividad)
  const pastoreosAnios = pastoreosAll
    ? [...new Set(pastoreosAll.map(p => p.año).filter(Boolean))].sort((a, b) => b - a)
    : [];
  const pastoreosFiltrados = (pastoreosAll || []).filter(p => pastoreosYear == null || p.año === pastoreosYear);
  // Resumen por potrero: integra carga × tiempo en EV·días y EV·días/ha
  const resumenPotreros = (() => {
    const acc = {};
    pastoreosFiltrados.forEach(ev => {
      const n = ev.potrero;
      if (!acc[n]) acc[n] = { nombre: n, ha: ev.ha || 0, num: 0, diasTotal: 0, evDias: 0, kgDiasHa: 0, cabezasMax: 0 };
      const dias = ev.dias_ocupacion || 0;
      acc[n].num += 1;
      acc[n].diasTotal += dias;
      acc[n].evDias += (ev.total_ev || 0) * dias;
      acc[n].kgDiasHa += (ev.carga_kg_ha || 0) * dias;
      acc[n].cabezasMax = Math.max(acc[n].cabezasMax, ev.total_cabezas || 0);
      if (ev.ha) acc[n].ha = ev.ha;
    });
    return Object.values(acc).map(r => ({
      ...r,
      evDiasHa: r.ha > 0 ? r.evDias / r.ha : 0,
      cargaEvHaProm: r.diasTotal > 0 && r.ha > 0 ? r.evDias / r.ha / r.diasTotal : 0,
    })).sort((a, b) => b.evDiasHa - a.evDiasHa);
  })();
  const totalEvDias = resumenPotreros.reduce((s, r) => s + r.evDias, 0);
  const totalDiasPastoreo = resumenPotreros.reduce((s, r) => s + r.diasTotal, 0);
  const totalPastoreos = pastoreosFiltrados.length;

  // Por Potrero: heatmap with year filter
  const byPotrero = msData?.byPotrero ?? {};
  const availableYears = [...new Set(curvaMonths.map(ym => ym.slice(0, 4)))].sort();
  const activeYear = selectedYear ?? availableYears[availableYears.length - 1] ?? null;
  const heatmapMonths = activeYear
    ? curvaMonths.filter(ym => ym.startsWith(activeYear))
    : curvaMonths.slice(-18);
  const potreroNames = POSTREROS_GEOJSON.features
    .map(f => f.properties.nombre)
    .filter(n => byPotrero[n]);
  const allHeatVals = potreroNames.flatMap(n => heatmapMonths.map(ym => byPotrero[n]?.[ym]).filter(v => v != null));
  const heatMax = allHeatVals.length ? Math.max(...allHeatVals) : 1;
  const heatMin = allHeatVals.length ? Math.min(...allHeatVals) : 0;
  function heatColor(val) {
    if (val == null) return '#1a1a1a';
    const t = Math.max(0, Math.min(1, (val - heatMin) / Math.max(1, heatMax - heatMin)));
    // red → yellow → green
    if (t < 0.5) {
      const r = 180, g = Math.round(t * 2 * 180), b = 0;
      return `rgb(${r},${g},${b})`;
    } else {
      const r = Math.round((1 - (t - 0.5) * 2) * 180), g = 160, b = 0;
      return `rgb(${r},${g},${b})`;
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0d0d0d', overflow: 'hidden' }}>
      {/* Sub-header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#111', borderBottom: '1px solid #222', flexShrink: 0 }}>
        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4caf50', marginRight: '1rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>🌿 Materia Seca</span>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '0.35rem 0.9rem', fontSize: '0.82rem', fontWeight: '600',
            backgroundColor: activeTab === t.id ? '#1a3a1a' : 'transparent',
            color: activeTab === t.id ? '#4caf50' : '#666',
            border: `1px solid ${activeTab === t.id ? '#4caf50' : '#2a2a2a'}`,
            borderRadius: '4px', cursor: 'pointer'
          }}>{t.label}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#666' }}>Eficiencia pastoreo</span>
          <input type="range" min={35} max={65} step={1} value={efficiency}
            onChange={e => setEfficiency(Number(e.target.value))}
            style={{ width: '90px', accentColor: '#4caf50' }} />
          <span style={{ fontSize: '0.8rem', color: '#4caf50', fontWeight: '700', minWidth: '32px' }}>{efficiency}%</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem 1.5rem' }}>

        {/* ── ESTADO ACTUAL ── */}
        {activeTab === 'actual' && (
          <div>
            {loadingCurrent && (
              <div style={{ padding: '0.75rem', backgroundColor: '#0f1a0f', border: '1px solid #2a3a2a', borderRadius: '4px', fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
                ⏳ Calculando NDVI por potrero...
              </div>
            )}
            {!loadingCurrent && currentRad == null && (
              <div style={{ padding: '0.75rem', backgroundColor: '#1a1000', border: '1px solid #3a3000', borderRadius: '4px', fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
                ⏳ Cargando radiación solar...
              </div>
            )}
            {!loadingCurrent && currentRad != null && radLabel !== currentYM && (
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#111', border: '1px solid #2a2a2a', borderRadius: '4px', fontSize: '0.75rem', color: '#666', marginBottom: '1rem' }}>
                Radiación solar NASA POWER{radiation[currentYM] ? '' : ` · ${radLabel} (promedio histórico)`}
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#1a1a1a' }}>
                  {['Potrero', 'Ha', 'NDVIc', 'MS producida (kg/ha)', 'MS disponible (kg)', 'Consumo (kg/día)', 'Días restantes'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: h === 'Potrero' ? 'left' : 'right', color: '#777', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.4px', borderBottom: '1px solid #2a2a2a', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {estadoActual.map((row, i) => {
                  const diasColor = row.diasRestantes == null ? '#444'
                    : row.diasRestantes < 7 ? '#ff4444'
                    : row.diasRestantes < 15 ? '#ff9800'
                    : '#4caf50';
                  return (
                    <tr key={row.nombre} style={{ backgroundColor: i % 2 === 0 ? '#111' : '#131313', borderBottom: '1px solid #1e1e1e' }}>
                      <td style={{ padding: '0.45rem 0.75rem', fontWeight: '700', color: '#ffeb3b' }}>{row.nombre}</td>
                      <td style={{ padding: '0.45rem 0.75rem', color: '#888', textAlign: 'right' }}>{row.ha.toFixed(1)}</td>
                      <td style={{ padding: '0.45rem 0.75rem', color: row.ndvi != null ? '#4caf50' : '#444', textAlign: 'right' }}>
                        {row.ndvi != null ? row.ndvi.toFixed(3) : '—'}
                      </td>
                      <td style={{ padding: '0.45rem 0.75rem', color: row.msHa != null ? '#fff' : '#444', textAlign: 'right' }}>
                        {row.msHa != null ? Math.round(row.msHa).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '0.45rem 0.75rem', color: row.msDisponible != null ? '#fff' : '#444', textAlign: 'right' }}>
                        {row.msDisponible != null ? Math.round(row.msDisponible).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '0.45rem 0.75rem', color: row.consumoDiario > 0 ? '#aaa' : '#333', textAlign: 'right' }}>
                        {row.consumoDiario > 0 ? Math.round(row.consumoDiario).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '0.45rem 0.75rem', color: diasColor, textAlign: 'right', fontWeight: row.diasRestantes != null ? '700' : '400' }}>
                        {row.diasRestantes != null ? `${row.diasRestantes}d` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#444' }}>
              Modelo Monteith (1972) · EUR estacional Druille (FAUBA) · fPAR Grigera · Radiación NASA POWER · Sentinel-2 L2A
            </div>
          </div>
        )}

        {/* ── RANKING PASTO ── */}
        {activeTab === 'ranking' && (() => {
          const ranked = estadoActual
            .filter(r => r.msDisponible != null)
            .sort((a, b) => (b.msDisponible ?? 0) - (a.msDisponible ?? 0));
          const maxMs = ranked.length ? Math.max(...ranked.map(r => r.msDisponible)) : 1;
          const diasColor = d => d == null ? '#666' : d < 7 ? '#ff4444' : d < 15 ? '#ff9800' : '#4caf50';
          return (
            <div>
              {loadingCurrent && (
                <div style={{ padding: '0.75rem', backgroundColor: '#0f1a0f', border: '1px solid #2a3a2a', borderRadius: '4px', fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
                  ⏳ Calculando NDVI por potrero...
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: '0.75rem' }}>
                Todos los potreros ordenados por pasto disponible · eficiencia {efficiency}% · mes actual
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1a1a1a' }}>
                    {['#', 'Potrero', 'Ha', 'Estado', 'NDVIc', 'MS/ha', 'MS disponible (kg)', 'Consumo/día', 'Días'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.6rem', textAlign: ['#','Potrero','Estado'].includes(h) ? 'left' : 'right', color: '#777', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.4px', borderBottom: '1px solid #2a2a2a', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((row, i) => {
                    const ratio = row.msDisponible / maxMs;
                    return (
                      <tr key={row.nombre} style={{ backgroundColor: i % 2 === 0 ? '#111' : '#131313', borderBottom: '1px solid #1e1e1e' }}>
                        <td style={{ padding: '0.4rem 0.6rem', color: '#555', fontWeight: '700' }}>{i + 1}</td>
                        <td style={{ padding: '0.4rem 0.6rem', fontWeight: '700', color: '#ffeb3b' }}>{row.nombre}</td>
                        <td style={{ padding: '0.4rem 0.6rem', color: '#888', textAlign: 'right' }}>{row.ha.toFixed(1)}</td>
                        <td style={{ padding: '0.4rem 0.6rem', color: row.ocupado ? '#ff9800' : '#4caf50', fontSize: '0.75rem' }}>
                          {row.ocupado ? '● Ocupado' : '○ Libre'}
                        </td>
                        <td style={{ padding: '0.4rem 0.6rem', color: '#4caf50', textAlign: 'right' }}>{row.ndvi != null ? row.ndvi.toFixed(3) : '—'}</td>
                        <td style={{ padding: '0.4rem 0.6rem', color: '#fff', textAlign: 'right' }}>{row.msHa != null ? Math.round(row.msHa).toLocaleString() : '—'}</td>
                        <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <div style={{ width: '60px', height: '7px', backgroundColor: '#1a1a1a', borderRadius: '2px', flexShrink: 0 }}>
                              <div style={{ width: `${ratio * 100}%`, height: '100%', backgroundColor: pastoColorFn(ratio), borderRadius: '2px' }} />
                            </div>
                            <span style={{ color: '#fff', minWidth: '60px', textAlign: 'right' }}>{Math.round(row.msDisponible).toLocaleString()}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.4rem 0.6rem', color: '#aaa', textAlign: 'right' }}>{row.consumoDiario > 0 ? Math.round(row.consumoDiario).toLocaleString() : '—'}</td>
                        <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontWeight: '700', color: diasColor(row.diasRestantes) }}>
                          {row.diasRestantes != null ? `${row.diasRestantes}d` : row.ocupado ? '—' : '∞'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#444' }}>
                ∞ = sin hacienda asignada · Modelo Monteith · Radiación NASA POWER · Sentinel-2 L2A
              </div>
            </div>
          );
        })()}

        {/* ── SIMULADOR ── */}
        {activeTab === 'simulador' && (() => {
          const simPotreroFeat = POSTREROS_GEOJSON.features.find(f => f.properties.nombre === simPotrero);
          const simHa = simPotreroFeat?.properties.ha ?? 0;
          const simNdvi = ndviCurrent[simPotrero] ?? null;
          const simMsHa = simNdvi != null && currentRad != null ? calcMS(simNdvi, currentRad, currentMonth) : null;
          const simMsDisp = simMsHa != null ? simMsHa * simHa * (efficiency / 100) : null;
          const simConsumoDiario = simAnimales.reduce((sum, a) => sum + (parseInt(a.cantidad) || 0) * getCatConsumoDiario(a.cat, currentMonth), 0);
          const simDiasResult = simMsDisp != null && simConsumoDiario > 0 ? Math.floor(simMsDisp / simConsumoDiario) : null;
          const simConsumoUnitario = getCatConsumoDiario(simTargetCat, currentMonth);
          const simMaxAnimales = simMsDisp != null && simConsumoUnitario > 0 && simTargetDias > 0 ? Math.floor(simMsDisp / (simConsumoUnitario * simTargetDias)) : null;
          const inputStyle = { backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', color: '#fff', padding: '0.35rem 0.6rem', fontSize: '0.82rem' };
          const labelStyle = { fontSize: '0.75rem', color: '#666', marginBottom: '0.3rem' };
          return (
            <div style={{ maxWidth: '600px' }}>
              <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: '1.25rem' }}>
                Simulá cuántos días puede aguantar un potrero con una carga dada, o cuántos animales podés meter para X días.
              </div>

              {/* Potrero selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={labelStyle}>Potrero</div>
                <select value={simPotrero} onChange={e => setSimPotrero(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                  <option value="">— Seleccioná un potrero —</option>
                  {POSTREROS_GEOJSON.features.map(f => (
                    <option key={f.properties.nombre} value={f.properties.nombre}>
                      {f.properties.nombre} · {f.properties.ha.toFixed(1)} ha
                    </option>
                  ))}
                </select>
                {simPotrero && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#555', display: 'flex', gap: '1.5rem' }}>
                    <span>NDVIc: <span style={{ color: simNdvi != null ? '#4caf50' : '#555' }}>{simNdvi != null ? simNdvi.toFixed(3) : '—'}</span></span>
                    <span>MS producida: <span style={{ color: '#fff' }}>{simMsHa != null ? `${Math.round(simMsHa).toLocaleString()} kg/ha` : '—'}</span></span>
                    <span>MS disponible: <span style={{ color: '#4caf50', fontWeight: '700' }}>{simMsDisp != null ? `${Math.round(simMsDisp).toLocaleString()} kg` : '—'}</span></span>
                  </div>
                )}
              </div>

              {/* Mode toggle */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {[{ id: 'dias', label: '¿Cuántos días aguanta?' }, { id: 'animales', label: '¿Cuántos animales por X días?' }].map(m => (
                  <button key={m.id} onClick={() => setSimMode(m.id)} style={{
                    padding: '0.35rem 0.9rem', fontSize: '0.8rem', fontWeight: '600',
                    backgroundColor: simMode === m.id ? '#1a3a1a' : 'transparent',
                    color: simMode === m.id ? '#4caf50' : '#555',
                    border: `1px solid ${simMode === m.id ? '#4caf50' : '#2a2a2a'}`,
                    borderRadius: '4px', cursor: 'pointer'
                  }}>{m.label}</button>
                ))}
              </div>

              {simMode === 'dias' && (
                <div>
                  <div style={labelStyle}>Hacienda a simular</div>
                  {simAnimales.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                      <select value={a.cat} onChange={e => setSimAnimales(prev => prev.map((x, j) => j === i ? { ...x, cat: e.target.value } : x))} style={inputStyle}>
                        {Object.keys(CONSUMO_DIARIO).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input type="number" min={0} value={a.cantidad} onChange={e => setSimAnimales(prev => prev.map((x, j) => j === i ? { ...x, cantidad: e.target.value } : x))} style={{ ...inputStyle, width: '80px' }} placeholder="Cant." />
                      <span style={{ fontSize: '0.72rem', color: '#555' }}>{getCatConsumoDiario(a.cat, currentMonth)} kg/día c/u</span>
                      {simAnimales.length > 1 && (
                        <button onClick={() => setSimAnimales(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setSimAnimales(prev => [...prev, { cat: 'Vacas c/Cría', cantidad: 50 }])} style={{ fontSize: '0.75rem', color: '#4caf50', background: 'none', border: '1px solid #2a4a2a', borderRadius: '4px', padding: '0.25rem 0.6rem', cursor: 'pointer', marginTop: '0.25rem' }}>+ Agregar categoría</button>

                  {simPotrero && simMsDisp != null && (
                    <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: '#0f1a0f', border: '1px solid #2a4a2a', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#555', marginBottom: '0.2rem' }}>Consumo total/día</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>{Math.round(simConsumoDiario).toLocaleString()} kg</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#555', marginBottom: '0.2rem' }}>Días que aguanta</div>
                          <div style={{ fontSize: '2rem', fontWeight: '700', color: simDiasResult == null ? '#555' : simDiasResult < 7 ? '#ff4444' : simDiasResult < 15 ? '#ff9800' : '#4caf50' }}>
                            {simDiasResult != null ? `${simDiasResult}d` : simConsumoDiario === 0 ? '∞' : '—'}
                          </div>
                        </div>
                        {simDiasResult != null && (
                          <div>
                            <div style={{ fontSize: '0.72rem', color: '#555', marginBottom: '0.2rem' }}>Fecha estimada salida</div>
                            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#aaa' }}>
                              {new Date(Date.now() + simDiasResult * 86400000).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {simMode === 'animales' && (
                <div>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={labelStyle}>Categoría</div>
                      <select value={simTargetCat} onChange={e => setSimTargetCat(e.target.value)} style={inputStyle}>
                        {Object.keys(CONSUMO_DIARIO).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={labelStyle}>Días objetivo</div>
                      <input type="number" min={1} value={simTargetDias} onChange={e => setSimTargetDias(Number(e.target.value))} style={{ ...inputStyle, width: '80px' }} />
                    </div>
                  </div>
                  {simPotrero && simMsDisp != null && (
                    <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#0f1a0f', border: '1px solid #2a4a2a', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#555', marginBottom: '0.2rem' }}>Consumo unitario/día</div>
                          <div style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>{simConsumoUnitario} kg</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#555', marginBottom: '0.2rem' }}>Máx. animales por {simTargetDias} días</div>
                          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#4caf50' }}>
                            {simMaxAnimales != null ? simMaxAnimales.toLocaleString() : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!simPotrero && (
                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#444' }}>Seleccioná un potrero para empezar.</div>
              )}
            </div>
          );
        })()}

        {/* ── CURVA FORRAJERA ── */}
        {activeTab === 'curva' && (
          <div>
            {msData === null && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#555', fontSize: '0.85rem' }}>
                Cargando datos GEE...
              </div>
            )}
            {msData !== null && curvaMonths.length === 0 && (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#444', fontSize: '0.85rem' }}>
                No se encontraron datos en /ms_mensual.csv
              </div>
            )}
            {msData !== null && curvaMonths.length > 0 && (
              <>
                <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: '0.75rem' }}>
                  Oferta total campo (kg MS) · eficiencia {efficiency}% · vs demanda hacienda actual
                </div>
                <div style={{ fontSize: '0.75rem', color: '#444', marginBottom: '1rem' }}>
                  Barras: oferta bruta &nbsp;|&nbsp; <span style={{ color: '#4caf50' }}>— oferta disponible</span> &nbsp;|&nbsp; <span style={{ color: '#f44336' }}>- - demanda</span>
                </div>
                <ComboChart
                  months={curvaMonths}
                  ofertaKg={curvaOfertaKg}
                  ofertaDispKg={curvaOfertaDispKg}
                  demandaKg={curvaDemandaKg}
                  efficiency={efficiency}
                />
                <div style={{ fontSize: '0.8rem', color: '#777', margin: '1.25rem 0 0.5rem' }}>
                  Balance oferta disponible – demanda (kg MS)
                </div>
                <BalanceChart months={curvaMonths} balanceKg={curvaBalanceKg} />
                <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#444' }}>
                  Fuente: Google Earth Engine · Monteith (1972) · ERA5 + Sentinel-2 L2A 2020–2025
                </div>
              </>
            )}
          </div>
        )}

        {/* ── POR POTRERO ── */}
        {activeTab === 'potrero' && (
          <div>
            {msData === null && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#555', fontSize: '0.85rem' }}>Cargando...</div>
            )}
            {msData !== null && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {availableYears.map(y => (
                    <button key={y} onClick={() => setSelectedYear(y)} style={{
                      padding: '0.25rem 0.7rem', fontSize: '0.8rem', fontWeight: '600',
                      backgroundColor: activeYear === y ? '#1a3a1a' : 'transparent',
                      color: activeYear === y ? '#4caf50' : '#555',
                      border: `1px solid ${activeYear === y ? '#4caf50' : '#2a2a2a'}`,
                      borderRadius: '4px', cursor: 'pointer'
                    }}>{y}</button>
                  ))}
                  <span style={{ fontSize: '0.72rem', color: '#444', marginLeft: '0.5rem' }}>
                    escala: <span style={{ color: '#b44' }}>bajo</span> → <span style={{ color: '#8a8' }}>alto</span> (relativa al año)
                  </span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: '0.75rem', minWidth: '100%' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#111' }}>
                        <th style={{ padding: '0.4rem 0.75rem', textAlign: 'left', color: '#666', fontWeight: '600', whiteSpace: 'nowrap', position: 'sticky', left: 0, backgroundColor: '#111', borderBottom: '1px solid #2a2a2a', zIndex: 1 }}>Potrero</th>
                        <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right', color: '#666', fontWeight: '600', whiteSpace: 'nowrap', borderBottom: '1px solid #2a2a2a' }}>Ha</th>
                        {heatmapMonths.map(ym => (
                          <th key={ym} style={{ padding: '0.4rem 0.4rem', textAlign: 'center', color: '#555', fontWeight: '500', whiteSpace: 'nowrap', borderBottom: '1px solid #2a2a2a', minWidth: '46px' }}>
                            {activeYear ? ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][parseInt(ym.slice(5),10)-1] : ym.slice(5)+'/'+ym.slice(2,4)}
                          </th>
                        ))}
                        <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right', color: '#666', fontWeight: '600', whiteSpace: 'nowrap', borderBottom: '1px solid #2a2a2a' }}>Prom.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {potreroNames.map((nombre, ri) => {
                        const ha = POSTREROS_GEOJSON.features.find(f => f.properties.nombre === nombre)?.properties.ha;
                        const vals = heatmapMonths.map(ym => byPotrero[nombre]?.[ym] ?? null);
                        const validVals = vals.filter(v => v != null);
                        const avg = validVals.length ? Math.round(validVals.reduce((s, v) => s + v, 0) / validVals.length) : null;
                        return (
                          <tr key={nombre} style={{ backgroundColor: ri % 2 === 0 ? '#111' : '#131313' }}>
                            <td style={{ padding: '0.35rem 0.75rem', fontWeight: '700', color: '#ffeb3b', whiteSpace: 'nowrap', position: 'sticky', left: 0, backgroundColor: ri % 2 === 0 ? '#111' : '#131313', zIndex: 1 }}>{nombre}</td>
                            <td style={{ padding: '0.35rem 0.5rem', color: '#666', textAlign: 'right' }}>{ha?.toFixed(0)}</td>
                            {vals.map((v, ci) => (
                              <td key={ci} style={{ padding: '0.35rem 0.4rem', textAlign: 'center', backgroundColor: heatColor(v), color: v != null ? (v > (heatMax * 0.5) ? '#000' : '#fff') : '#333', fontWeight: '600' }}>
                                {v != null ? v : '—'}
                              </td>
                            ))}
                            <td style={{ padding: '0.35rem 0.5rem', textAlign: 'right', color: '#aaa', fontWeight: '700' }}>
                              {avg != null ? avg : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#444' }}>
                  Fuente: Google Earth Engine · Monteith (1972) · ERA5 + Sentinel-2 L2A
                </div>

                {/* ── VALIDACIÓN MULTI-MES ── */}
                {(() => {
                  const sharedMonths = curvaMonths.filter(ym => radiation[ym] != null);
                  // Default selection: one month per season from most recent year available
                  const defaultSel = (() => {
                    if (!sharedMonths.length) return [];
                    const lastYear = sharedMonths[sharedMonths.length - 1].slice(0, 4);
                    const targets = [`${lastYear}-01`, `${lastYear}-04`, `${lastYear}-07`, `${lastYear}-10`,
                                     `${String(+lastYear-1)}-01`, `${String(+lastYear-1)}-04`,
                                     `${String(+lastYear-1)}-07`, `${String(+lastYear-1)}-10`];
                    return targets.filter(ym => sharedMonths.includes(ym)).slice(0, 4);
                  })();
                  const selMonths = valSelMonths ?? defaultSel;

                  async function runMultiVal() {
                    if (!selMonths.length || validacion.running) return;
                    setValidacion({ results: {}, running: true, progress: 0, total: selMonths.length });
                    const points = potreroPolygons();
                    for (let i = 0; i < selMonths.length; i++) {
                      const ym = selMonths[i];
                      try {
                        const res = await fetch('/api/forraje-ndvi', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ points, index: 'NDVIc', dates: [ym + '-21'] })
                        });
                        const data = await res.json();
                        const ndviByPotrero = data[ym] || {};
                        const rad = radiation[ym];
                        const rows = potreroNames.map(nombre => {
                          const gee = byPotrero[nombre]?.[ym] ?? null;
                          const ndvi = ndviByPotrero[nombre] ?? null;
                          const app = ndvi != null && rad != null ? Math.round(calcMS(ndvi, rad, parseInt(ym.slice(5), 10) - 1)) : null;
                          const diff = gee != null && app != null ? Math.round((app - gee) / gee * 100) : null;
                          return { nombre, ndvi, app, gee, diff };
                        });
                        setValidacion(v => ({ ...v, results: { ...v.results, [ym]: rows }, progress: i + 1 }));
                      } catch (_) {
                        setValidacion(v => ({ ...v, progress: i + 1 }));
                      }
                    }
                    setValidacion(v => ({ ...v, running: false }));
                  }

                  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
                  const season = ym => { const m = parseInt(ym.slice(5),10); return m<=2||m===12?'Verano':m<=5?'Otoño':m<=8?'Invierno':'Primavera'; };

                  const doneMonths = Object.keys(validacion.results).sort();

                  return (
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid #222', paddingTop: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: '600', marginBottom: '0.75rem' }}>
                        Validación multi-mes: App (Copernicus + Open-Meteo) vs GEE (ERA5 + Sentinel-2)
                      </div>

                      {/* Month checkboxes */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                        {sharedMonths.map(ym => {
                          const checked = selMonths.includes(ym);
                          const done = validacion.results[ym];
                          return (
                            <label key={ym} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer',
                              padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem',
                              border: `1px solid ${checked ? '#4caf50' : '#2a2a2a'}`,
                              backgroundColor: done ? '#0a1a0a' : checked ? '#0f1f0f' : 'transparent',
                              color: checked ? '#4caf50' : '#555' }}>
                              <input type="checkbox" checked={checked}
                                onChange={() => setValSelMonths(prev => {
                                  const cur = prev ?? defaultSel;
                                  return cur.includes(ym) ? cur.filter(m => m !== ym) : [...cur, ym];
                                })}
                                style={{ accentColor: '#4caf50', width: '12px', height: '12px' }} />
                              {MESES[parseInt(ym.slice(5),10)-1]} {ym.slice(2,4)}
                              {done && <span style={{ color: '#4caf50' }}>✓</span>}
                            </label>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <button onClick={runMultiVal} disabled={validacion.running || !selMonths.length} style={{
                          padding: '0.35rem 1rem', fontSize: '0.8rem', fontWeight: '600',
                          backgroundColor: validacion.running ? '#1a1a1a' : '#0f2a1a',
                          color: validacion.running ? '#444' : '#4caf50',
                          border: '1px solid #2a4a2a', borderRadius: '4px', cursor: validacion.running ? 'default' : 'pointer'
                        }}>
                          {validacion.running
                            ? `⏳ ${validacion.progress}/${validacion.total} meses...`
                            : `▶ Validar ${selMonths.length} mes${selMonths.length !== 1 ? 'es' : ''}`}
                        </button>
                        {doneMonths.length > 0 && !validacion.running && (
                          <button onClick={() => setValidacion({ results: {}, running: false, progress: 0, total: 0 })}
                            style={{ fontSize: '0.72rem', color: '#555', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                            Limpiar
                          </button>
                        )}
                      </div>

                      {/* Per-month results */}
                      {doneMonths.map(ym => {
                        const rows = validacion.results[ym];
                        const diffs = rows.map(r => r.diff).filter(d => d != null);
                        const avgDiff = diffs.length ? Math.round(diffs.reduce((s,d) => s+d, 0) / diffs.length) : null;
                        const avgAbs = diffs.length ? Math.round(diffs.map(Math.abs).reduce((s,d) => s+d, 0) / diffs.length) : null;
                        const diffColor = avgAbs == null ? '#444' : avgAbs < 10 ? '#4caf50' : avgAbs < 25 ? '#ff9800' : '#f44336';
                        return (
                          <div key={ym} style={{ marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
                              <span style={{ fontSize: '0.78rem', color: '#aaa', fontWeight: '700' }}>
                                {ym} · {season(ym)}
                              </span>
                              {avgDiff != null && (
                                <span style={{ fontSize: '0.75rem', color: diffColor, fontWeight: '700' }}>
                                  bias {avgDiff > 0 ? '+' : ''}{avgDiff}% · error abs. medio {avgAbs}%
                                </span>
                              )}
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ borderCollapse: 'collapse', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                <thead>
                                  <tr style={{ backgroundColor: '#1a1a1a' }}>
                                    {['Potrero','NDVIc','App kg/ha','GEE kg/ha','Dif%'].map(h => (
                                      <th key={h} style={{ padding: '0.3rem 0.6rem', textAlign: h==='Potrero'?'left':'right', color: '#555', fontWeight: '600', fontSize: '0.68rem', textTransform: 'uppercase', borderBottom: '1px solid #222' }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((r, i) => {
                                    const dc = r.diff==null?'#444':Math.abs(r.diff)<10?'#4caf50':Math.abs(r.diff)<25?'#ff9800':'#f44336';
                                    return (
                                      <tr key={r.nombre} style={{ backgroundColor: i%2===0?'#111':'#131313' }}>
                                        <td style={{ padding: '0.3rem 0.6rem', color: '#ffeb3b', fontWeight: '700' }}>{r.nombre}</td>
                                        <td style={{ padding: '0.3rem 0.6rem', textAlign: 'right', color: '#4caf50' }}>{r.ndvi!=null?r.ndvi.toFixed(3):'—'}</td>
                                        <td style={{ padding: '0.3rem 0.6rem', textAlign: 'right', color: '#fff' }}>{r.app!=null?r.app.toLocaleString():'—'}</td>
                                        <td style={{ padding: '0.3rem 0.6rem', textAlign: 'right', color: '#888' }}>{r.gee!=null?r.gee.toLocaleString():'—'}</td>
                                        <td style={{ padding: '0.3rem 0.6rem', textAlign: 'right', color: dc, fontWeight: '700' }}>{r.diff!=null?`${r.diff>0?'+':''}${r.diff}%`:'—'}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}

                      {/* Overall summary */}
                      {doneMonths.length >= 2 && (
                        <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#111', border: '1px solid #2a2a2a', borderRadius: '4px', fontSize: '0.78rem' }}>
                          <span style={{ color: '#666', fontWeight: '700' }}>Resumen general · {doneMonths.length} meses</span>
                          {(() => {
                            const allDiffs = doneMonths.flatMap(ym => (validacion.results[ym] || []).map(r => r.diff).filter(d => d != null));
                            const avg = allDiffs.length ? Math.round(allDiffs.reduce((s,d)=>s+d,0)/allDiffs.length) : null;
                            const abs = allDiffs.length ? Math.round(allDiffs.map(Math.abs).reduce((s,d)=>s+d,0)/allDiffs.length) : null;
                            const bySeason = {};
                            doneMonths.forEach(ym => {
                              const s = season(ym);
                              const diffs = (validacion.results[ym]||[]).map(r=>r.diff).filter(d=>d!=null);
                              if (!bySeason[s]) bySeason[s] = [];
                              bySeason[s].push(...diffs);
                            });
                            return avg != null ? (
                              <div style={{ marginTop: '0.4rem' }}>
                                <span style={{ color: Math.abs(avg)<10?'#4caf50':'#ff9800', fontWeight:'700' }}>
                                  Bias medio: {avg>0?'+':''}{avg}%
                                </span>
                                <span style={{ color: '#555' }}> · Error abs. medio: </span>
                                <span style={{ color: '#aaa', fontWeight: '700' }}>{abs}%</span>
                                <div style={{ marginTop: '0.4rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                  {Object.entries(bySeason).map(([s, ds]) => {
                                    const a = Math.round(ds.reduce((x,d)=>x+d,0)/ds.length);
                                    return <span key={s} style={{ color: '#666' }}>{s}: <span style={{ color: Math.abs(a)<10?'#4caf50':'#ff9800', fontWeight:'700' }}>{a>0?'+':''}{a}%</span></span>;
                                  })}
                                </div>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* ── PERÍODO DESCANSO ── */}
        {activeTab === 'descanso' && (
          <div>
            {loadingHistory && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#555', fontSize: '0.85rem' }}>
                Descargando NDVI histórico...
              </div>
            )}
            {!loadingHistory && descansoData.length === 0 && (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#444', fontSize: '0.85rem' }}>
                No hay potreros en descanso actualmente, o no se registró fecha de última salida.
              </div>
            )}
            {!loadingHistory && descansoData.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1a1a1a' }}>
                    {['Potrero', 'Ha', 'Días descanso', 'MS producida (kg/ha)', 'MS disponible (kg)'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: h === 'Potrero' ? 'left' : 'right', color: '#777', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.4px', borderBottom: '1px solid #2a2a2a', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {descansoData.map((row, i) => (
                    <tr key={row.nombre} style={{ backgroundColor: i % 2 === 0 ? '#111' : '#131313', borderBottom: '1px solid #1e1e1e' }}>
                      <td style={{ padding: '0.45rem 0.75rem', fontWeight: '700', color: '#ffeb3b' }}>{row.nombre}</td>
                      <td style={{ padding: '0.45rem 0.75rem', color: '#888', textAlign: 'right' }}>{row.ha.toFixed(1)}</td>
                      <td style={{ padding: '0.45rem 0.75rem', color: '#4caf50', fontWeight: '700', textAlign: 'right' }}>{row.diasDescanso}d</td>
                      <td style={{ padding: '0.45rem 0.75rem', color: '#fff', textAlign: 'right' }}>{row.msAcumHa.toLocaleString()}</td>
                      <td style={{ padding: '0.45rem 0.75rem', color: '#4caf50', fontWeight: '700', textAlign: 'right' }}>{row.msAcum.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#444' }}>
              MS acumulada desde última salida de hacienda · eficiencia {efficiency}%
            </div>
          </div>
        )}

        {/* ── PASTOREOS ── */}
        {activeTab === 'pastoreos' && (
          <div>
            {/* Filtro de año */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px', marginRight: '0.25rem' }}>Año</span>
              <button onClick={() => setPastoreosYear(null)} style={{
                padding: '0.3rem 0.8rem', fontSize: '0.8rem', fontWeight: '600',
                backgroundColor: pastoreosYear == null ? '#1a3a1a' : 'transparent',
                color: pastoreosYear == null ? '#4caf50' : '#666',
                border: `1px solid ${pastoreosYear == null ? '#4caf50' : '#2a2a2a'}`,
                borderRadius: '4px', cursor: 'pointer'
              }}>Todos</button>
              {pastoreosAnios.map(y => (
                <button key={y} onClick={() => setPastoreosYear(y)} style={{
                  padding: '0.3rem 0.8rem', fontSize: '0.8rem', fontWeight: '600',
                  backgroundColor: pastoreosYear === y ? '#1a3a1a' : 'transparent',
                  color: pastoreosYear === y ? '#4caf50' : '#666',
                  border: `1px solid ${pastoreosYear === y ? '#4caf50' : '#2a2a2a'}`,
                  borderRadius: '4px', cursor: 'pointer'
                }}>{y}</button>
              ))}
            </div>

            {loadingPastoreos && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#555', fontSize: '0.85rem' }}>
                Cargando registros de pastoreo...
              </div>
            )}

            {!loadingPastoreos && totalPastoreos === 0 && (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#444', fontSize: '0.85rem' }}>
                Todavía no hay registros de pastoreo{pastoreosYear ? ` para ${pastoreosYear}` : ''}. Se generan automáticamente cada vez que sale la hacienda de un potrero.
              </div>
            )}

            {!loadingPastoreos && totalPastoreos > 0 && (
              <>
                {/* Tarjetas resumen */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {[
                    { label: 'Pastoreos registrados', val: totalPastoreos.toLocaleString(), color: '#ffeb3b' },
                    { label: 'Días de pastoreo (suma)', val: totalDiasPastoreo.toLocaleString(), color: '#64b5f6' },
                    { label: 'EV·días soportados', val: Math.round(totalEvDias).toLocaleString(), color: '#4caf50' },
                  ].map(c => (
                    <div key={c.label} style={{ backgroundColor: '#131313', border: '1px solid #222', borderRadius: '6px', padding: '0.8rem 1rem' }}>
                      <div style={{ fontSize: '0.68rem', color: '#777', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.3rem' }}>{c.label}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: c.color }}>{c.val}</div>
                    </div>
                  ))}
                </div>

                {/* Gráfico EV·días/ha por potrero */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.8rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Productividad por potrero</h3>
                  <button
                    onClick={() => {
                      const año = pastoreosYear ?? 'todos';
                      const wb = XLSX.utils.book_new();
                      const ws1 = XLSX.utils.aoa_to_sheet([
                        ['Potrero', 'Ha', 'Pastoreos', 'Días total', 'EV·días', 'EV·días/ha', 'Carga prom (EV/ha)'],
                        ...resumenPotreros.map(r => [r.nombre, r.ha, r.num, r.diasTotal, Math.round(r.evDias), parseFloat(r.evDiasHa.toFixed(1)), parseFloat(r.cargaEvHaProm.toFixed(2))]),
                        [],
                        ['Total pastoreos', totalPastoreos],
                        ['Total días', totalDiasPastoreo],
                        ['Total EV·días', Math.round(totalEvDias)],
                      ]);
                      const ws2 = XLSX.utils.aoa_to_sheet([
                        ['Potrero', 'Fecha ingreso', 'Fecha salida', 'Días ocup.', 'Cabezas', 'EV total', 'Carga EV/ha', 'kg PV/ha', 'Categorías'],
                        ...pastoreosFiltrados.map(ev => [
                          ev.potrero,
                          ev.fecha_ingreso ? new Date(ev.fecha_ingreso).toLocaleDateString('es-AR') : '',
                          ev.fecha_salida ? new Date(ev.fecha_salida).toLocaleDateString('es-AR') : '',
                          ev.dias_ocupacion ?? '',
                          ev.total_cabezas ?? '',
                          ev.total_ev != null ? parseFloat(ev.total_ev.toFixed(1)) : '',
                          ev.carga_ev_ha != null ? parseFloat(ev.carga_ev_ha.toFixed(2)) : '',
                          ev.carga_kg_ha != null ? parseFloat(ev.carga_kg_ha.toFixed(0)) : '',
                          (ev.animales || []).map(a => a.rodeo ? `${a.nombre}·${a.rodeo} (${a.cantidad})` : `${a.nombre} (${a.cantidad})`).join(', '),
                        ]),
                      ]);
                      XLSX.utils.book_append_sheet(wb, ws1, 'Resumen por potrero');
                      XLSX.utils.book_append_sheet(wb, ws2, 'Detalle de pastoreos');
                      XLSX.writeFile(wb, `pastoreos_${año}.xlsx`);
                    }}
                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem', fontWeight: '600', backgroundColor: '#0d2a0d', color: '#4caf50', border: '1px solid #2e7d32', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Exportar Excel
                  </button>
                </div>
                <EvDiasHaChart data={resumenPotreros} />

                {/* Tabla resumen por potrero (productividad) */}
                <h3 style={{ fontSize: '0.8rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '1rem 0 0.5rem 0' }}>Detalle por potrero</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1a1a1a' }}>
                      {['Potrero', 'Ha', 'Pastoreos', 'Días total', 'EV·días', 'EV·días/ha', 'Carga prom (EV/ha)'].map(h => (
                        <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: h === 'Potrero' ? 'left' : 'right', color: '#777', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.4px', borderBottom: '1px solid #2a2a2a', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resumenPotreros.map((r, i) => (
                      <tr key={r.nombre} style={{ backgroundColor: i % 2 === 0 ? '#111' : '#131313', borderBottom: '1px solid #1e1e1e' }}>
                        <td style={{ padding: '0.45rem 0.75rem', fontWeight: '700', color: '#ffeb3b' }}>{r.nombre}</td>
                        <td style={{ padding: '0.45rem 0.75rem', color: '#888', textAlign: 'right' }}>{r.ha.toFixed(1)}</td>
                        <td style={{ padding: '0.45rem 0.75rem', color: '#ccc', textAlign: 'right' }}>{r.num}</td>
                        <td style={{ padding: '0.45rem 0.75rem', color: '#64b5f6', textAlign: 'right' }}>{r.diasTotal}d</td>
                        <td style={{ padding: '0.45rem 0.75rem', color: '#ccc', textAlign: 'right' }}>{Math.round(r.evDias).toLocaleString()}</td>
                        <td style={{ padding: '0.45rem 0.75rem', color: '#4caf50', fontWeight: '700', textAlign: 'right' }}>{r.evDiasHa.toFixed(1)}</td>
                        <td style={{ padding: '0.45rem 0.75rem', color: '#888', textAlign: 'right' }}>{r.cargaEvHaProm.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Detalle de eventos */}
                <h3 style={{ fontSize: '0.8rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.5rem 0' }}>Detalle de pastoreos</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1a1a1a' }}>
                      {['Potrero', 'Ingreso', 'Salida', 'Días', 'Cabezas', 'EV total', 'EV/ha', 'kg PV/ha', 'Categorías'].map(h => (
                        <th key={h} style={{ padding: '0.5rem 0.6rem', textAlign: h === 'Potrero' || h === 'Categorías' ? 'left' : 'right', color: '#777', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.66rem', letterSpacing: '0.4px', borderBottom: '1px solid #2a2a2a', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pastoreosFiltrados.map((ev, i) => {
                      const fmt = d => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';
                      return (
                        <tr key={ev.docId || i} style={{ backgroundColor: i % 2 === 0 ? '#111' : '#131313', borderBottom: '1px solid #1e1e1e' }}>
                          <td style={{ padding: '0.4rem 0.6rem', fontWeight: '700', color: '#ffeb3b' }}>{ev.potrero}</td>
                          <td style={{ padding: '0.4rem 0.6rem', color: '#888', textAlign: 'right' }}>{fmt(ev.fecha_ingreso)}</td>
                          <td style={{ padding: '0.4rem 0.6rem', color: '#ccc', textAlign: 'right' }}>{fmt(ev.fecha_salida)}</td>
                          <td style={{ padding: '0.4rem 0.6rem', color: '#64b5f6', fontWeight: '700', textAlign: 'right' }}>{ev.dias_ocupacion != null ? `${ev.dias_ocupacion}d` : '—'}</td>
                          <td style={{ padding: '0.4rem 0.6rem', color: '#ccc', textAlign: 'right' }}>{ev.total_cabezas?.toLocaleString() ?? '—'}</td>
                          <td style={{ padding: '0.4rem 0.6rem', color: '#ccc', textAlign: 'right' }}>{ev.total_ev != null ? ev.total_ev.toFixed(0) : '—'}</td>
                          <td style={{ padding: '0.4rem 0.6rem', color: '#4caf50', fontWeight: '700', textAlign: 'right' }}>{ev.carga_ev_ha != null ? ev.carga_ev_ha.toFixed(2) : '—'}</td>
                          <td style={{ padding: '0.4rem 0.6rem', color: '#888', textAlign: 'right' }}>{ev.carga_kg_ha != null ? ev.carga_kg_ha.toFixed(0) : '—'}</td>
                          <td style={{ padding: '0.4rem 0.6rem', color: '#666', fontSize: '0.72rem' }}>
                            {(ev.animales || []).map(a => a.rodeo ? `${a.nombre}·${a.rodeo} (${a.cantidad})` : `${a.nombre} (${a.cantidad})`).join(', ')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#444' }}>
                  EV·días/ha = carga (EV/ha) integrada en el tiempo de ocupación · indicador de productividad anual del potrero
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Planilla Panel ───────────────────────────────────────────────────────────

const PLANILLA_CATS = [
  { key: 'toritos',      label: 'Toritos',         grupo: 'Toros',        ev: 0.8  },
  { key: 'toros',        label: 'Toros',            grupo: 'Toros',        ev: 1.2  },
  { key: 'toros_desecho',label: 'Toros desecho',    grupo: 'Toros',        ev: 1.0  },
  { key: 'vacas_ss',     label: 'Vacas S/S',        grupo: 'Vacas',        ev: 1.0  },
  { key: 'vacas_prenadas',label: 'Vacas preñadas',  grupo: 'Vacas',        ev: 0.9  },
  { key: 'vacas_cut',    label: 'Vacas CUT',        grupo: 'Vacas',        ev: 1.0  },
  { key: 'vacas_cria',   label: 'Vacas c/Cría',     grupo: 'Vacas',        ev: 1.0  },
  { key: 'vacas_engorde',label: 'Vacas engorde',    grupo: 'Vacas',        ev: 0.7  },
  { key: 'vaqs_repo1518',label: 'Vaq 15/18M',       grupo: 'Vaquillonas',  ev: 0.8  },
  { key: 'vaqs_repo2224',label: 'Vaq 22/24M',       grupo: 'Vaquillonas',  ev: 0.7  },
  { key: 'vaqs_1serv',   label: 'Vaq 1er serv',     grupo: 'Vaquillonas',  ev: 0.8  },
  { key: 'vaqs_2serv',   label: 'Vaq 2do serv',     grupo: 'Vaquillonas',  ev: 1.2  },
  { key: 'vaqs_inv',     label: 'Vaq invernada',    grupo: 'Vaquillonas',  ev: 0.7  },
  { key: 'nov_menor1',   label: 'Nov <1 año',        grupo: 'Novillos',     ev: 0.8  },
  { key: 'nov_1_2',      label: 'Nov 1-2',           grupo: 'Novillos',     ev: 0.0  },
  { key: 'nov_mayor2',   label: 'Nov >2',            grupo: 'Novillos',     ev: 0.0  },
  { key: 'tern_inv_m',   label: 'T inv M',           grupo: 'Terneros',     ev: 0.0  },
  { key: 'tern_inv_h',   label: 'T inv H',           grupo: 'Terneros',     ev: 0.0  },
  { key: 'tern_ot_m',    label: 'T otoño M',         grupo: 'Terneros',     ev: 0.3  },
  { key: 'tern_ot_h',    label: 'T otoño H',         grupo: 'Terneros',     ev: 0.3  },
];

const PLANILLA_KEYS = PLANILLA_CATS.map(c => c.key);
const HA_ESTABLECIMIENTO = 1685;

function calcCierre(apertura, entradas, salidas) {
  const cierre = {};
  for (const k of PLANILLA_KEYS) {
    let e = 0, s = 0;
    for (const v of Object.values(entradas || {})) e += (v[k] || 0);
    for (const v of Object.values(salidas || {})) s += (v[k] || 0);
    cierre[k] = (apertura[k] || 0) + e - s;
  }
  return cierre;
}

function totalStock(stock) {
  return PLANILLA_KEYS.reduce((sum, k) => sum + (stock[k] || 0), 0);
}

function calcEV(stock) {
  return PLANILLA_CATS.reduce((sum, c) => sum + (stock[c.key] || 0) * c.ev, 0);
}

function PlanillaPanel({ db }) {
  const [planillaData, setPlanillaData] = useState(null);
  const [selectedYM, setSelectedYM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  const [editCell, setEditCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  const months = planillaData ? Object.keys(planillaData).sort() : [];
  const currentYM = selectedYM || months[months.length - 1] || null;
  const entry = currentYM && planillaData ? planillaData[currentYM] : null;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'planilla_mensual'));
        if (snap.size > 0) {
          const data = {};
          snap.docs.forEach(d => { data[d.id] = d.data(); });
          setPlanillaData(data);
          const yms = Object.keys(data).sort();
          setSelectedYM(yms[yms.length - 1]);
        } else {
          setPlanillaData({});
        }
      } catch (e) {
        console.error(e);
        setPlanillaData({});
      }
      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const importHistorico = async () => {
    setImporting(true);
    setImportProgress('Cargando archivo...');
    try {
      const res = await fetch('/planilla_historica.json');
      const json = await res.json();
      const yms = Object.keys(json.months).sort();
      let done = 0;
      for (const ym of yms) {
        const m = json.months[ym];
        await setDoc(doc(db, 'planilla_mensual', ym), { ym, apertura: m.apertura, entradas: m.entradas, salidas: m.salidas });
        done++;
        setImportProgress(`${done}/${yms.length} meses importados...`);
      }
      const snap = await getDocs(collection(db, 'planilla_mensual'));
      const data = {};
      snap.docs.forEach(d => { data[d.id] = d.data(); });
      setPlanillaData(data);
      const sortedYms = Object.keys(data).sort();
      setSelectedYM(sortedYms[sortedYms.length - 1]);
      setImportProgress(null);
    } catch (e) {
      console.error(e);
      setImportProgress('Error: ' + e.message);
    }
    setImporting(false);
  };

  const saveCell = async (section, type, key, value) => {
    if (!currentYM || !entry) return;
    const num = parseInt(value) || 0;
    const updated = JSON.parse(JSON.stringify(entry));
    updated[section][type][key] = num;
    await setDoc(doc(db, 'planilla_mensual', currentYM), updated, { merge: true });

    // Cascade: recalculate apertura for all subsequent months
    let newData = { ...planillaData, [currentYM]: updated };
    const sortedMonths = Object.keys(newData).sort();
    const idx = sortedMonths.indexOf(currentYM);
    let prevEntry = updated;
    for (let i = idx + 1; i < sortedMonths.length; i++) {
      const nextYM = sortedMonths[i];
      const prevCierre = calcCierre(prevEntry.apertura || {}, prevEntry.entradas || {}, prevEntry.salidas || {});
      const nextEntry = { ...JSON.parse(JSON.stringify(newData[nextYM])), apertura: { ...prevCierre } };
      await setDoc(doc(db, 'planilla_mensual', nextYM), nextEntry, { merge: true });
      newData = { ...newData, [nextYM]: nextEntry };
      prevEntry = nextEntry;
    }

    setPlanillaData(newData);
  };

  const startEdit = (section, type, key, currentVal) => {
    setEditCell({ section, type, key });
    setEditValue(String(currentVal || 0));
  };

  const commitEdit = async () => {
    if (!editCell) return;
    await saveCell(editCell.section, editCell.type, editCell.key, editValue);
    setEditCell(null);
  };

  const agregarMes = async () => {
    const lastYM = months[months.length - 1];
    if (!lastYM) return;
    const [y, m] = lastYM.split('-').map(Number);
    const nextM = m === 12 ? 1 : m + 1;
    const nextY = m === 12 ? y + 1 : y;
    const nextYM = `${nextY}-${String(nextM).padStart(2, '0')}`;
    if (planillaData[nextYM]) { setSelectedYM(nextYM); return; }

    // Apertura del mes nuevo = cierre del último mes
    const lastEntry = planillaData[lastYM];
    const lastCierre = calcCierre(lastEntry.apertura || {}, lastEntry.entradas || {}, lastEntry.salidas || {});

    const emptyMoves = () => Object.fromEntries(PLANILLA_KEYS.map(k => [k, 0]));
    const newEntry = {
      ym: nextYM,
      apertura: { ...lastCierre },
      entradas: { nacimientos: emptyMoves(), traslados: emptyMoves(), compras: emptyMoves(), recuento: emptyMoves(), clasificacion: emptyMoves() },
      salidas:  { mortandad: emptyMoves(), traslados: emptyMoves(), ventas: emptyMoves(), consumo: emptyMoves(), recuento: emptyMoves(), clasificacion: emptyMoves() },
    };
    await setDoc(doc(db, 'planilla_mensual', nextYM), newEntry);
    setPlanillaData(prev => ({ ...prev, [nextYM]: newEntry }));
    setSelectedYM(nextYM);
  };

  const groupLastKeys = new Set(
    [...new Set(PLANILLA_CATS.map(c => c.grupo))].map(g => {
      const cats = PLANILLA_CATS.filter(c => c.grupo === g);
      return cats[cats.length - 1].key;
    })
  );
  const colBorder = (key) => groupLastKeys.has(key) ? '2px solid #999' : '1px solid #ddd';
  const TD = { style: { padding: '3px 6px', textAlign: 'right', fontSize: '0.72rem', borderRight: '1px solid #ddd', borderBottom: '1px solid #e8e8e8', minWidth: '38px', cursor: 'pointer', userSelect: 'none' } };
  const TH_CAT = { style: { padding: '4px 5px', fontSize: '0.62rem', fontWeight: '600', color: '#444', textAlign: 'right', borderRight: '1px solid #ddd', borderBottom: '2px solid #ccc', whiteSpace: 'nowrap', maxWidth: '62px', overflow: 'hidden', letterSpacing: '0.2px' } };

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>Cargando planilla...</div>;

  const isEmpty = !planillaData || Object.keys(planillaData).length === 0;

  if (isEmpty) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: '#666' }}>
        <div style={{ fontSize: '3rem' }}>📋</div>
        <div style={{ fontSize: '1.1rem', color: '#aaa' }}>Planilla mensual sin datos</div>
        <div style={{ fontSize: '0.85rem', color: '#555', textAlign: 'center', maxWidth: '340px' }}>
          Importá los datos históricos (Sep 2019 – Nov 2025) desde el Excel
        </div>
        <button
          onClick={importHistorico}
          disabled={importing}
          style={{ padding: '0.65rem 1.4rem', backgroundColor: '#4caf50', color: '#000', border: 'none', borderRadius: '4px', cursor: importing ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: '700', opacity: importing ? 0.6 : 1 }}
        >
          {importing ? importProgress || 'Importando...' : '⬆ Importar datos históricos'}
        </button>
      </div>
    );
  }

  if (!entry) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>Sin datos para este mes.</div>;

  const cierre = calcCierre(entry.apertura || {}, entry.entradas || {}, entry.salidas || {});
  const evCierre = calcEV(cierre);
  const evHa = (evCierre / HA_ESTABLECIMIENTO).toFixed(3);

  const grupos = [...new Set(PLANILLA_CATS.map(c => c.grupo))];

  const SECTION_ROWS = [
    { section: 'entradas', type: 'nacimientos',  label: 'Nacimientos',    color: '#f1f8f1' },
    { section: 'entradas', type: 'traslados',    label: 'Traslados +',    color: '#f1f8f1' },
    { section: 'entradas', type: 'compras',      label: 'Compras',        color: '#f1f8f1' },
    { section: 'entradas', type: 'recuento',     label: 'Recuento +',     color: '#f1f8f1' },
    { section: 'entradas', type: 'clasificacion',label: 'Clasif +',       color: '#f1f8f1' },
    { section: 'salidas',  type: 'mortandad',    label: 'Mortandad',      color: '#fff5f5' },
    { section: 'salidas',  type: 'traslados',    label: 'Traslados −',    color: '#fff5f5' },
    { section: 'salidas',  type: 'ventas',       label: 'Ventas',         color: '#fff5f5' },
    { section: 'salidas',  type: 'consumo',      label: 'Consumo',        color: '#fff5f5' },
    { section: 'salidas',  type: 'recuento',     label: 'Recuento −',     color: '#fff5f5' },
    { section: 'salidas',  type: 'clasificacion',label: 'Clasif −',       color: '#fff5f5' },
  ];

  const fmtMonth = (ym) => {
    const [y, m] = ym.split('-');
    const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${names[parseInt(m)-1]} ${y.slice(2)}`;
  };

  const renderCell = (section, type, key, bgColor) => {
    const val = (entry[section]?.[type]?.[key]) || 0;
    const isEditing = editCell?.section === section && editCell?.type === type && editCell?.key === key;
    const bdr = colBorder(key);
    const textColor = section === 'salidas' ? '#c62828' : '#111';
    if (isEditing) {
      return (
        <td key={key} style={{ ...TD.style, borderRight: bdr, backgroundColor: bgColor, padding: '1px 3px' }}>
          <input
            autoFocus
            type="number"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditCell(null); }}
            style={{ width: '36px', backgroundColor: '#fff', color: '#111', border: `1px solid ${section === 'salidas' ? '#c62828' : '#2e7d32'}`, borderRadius: '2px', fontSize: '0.72rem', textAlign: 'right', padding: '1px 3px' }}
          />
        </td>
      );
    }
    return (
      <td key={key} style={{ ...TD.style, borderRight: bdr, color: val > 0 ? textColor : '#ccc', backgroundColor: val > 0 ? bgColor : 'transparent' }} onClick={() => startEdit(section, type, key, val)}>
        {val > 0 ? val : '·'}
      </td>
    );
  };

  const totalRow = (rowObj) => PLANILLA_KEYS.reduce((s, k) => s + ((entry[rowObj.section]?.[rowObj.type]?.[k]) || 0), 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', borderBottom: '1px solid #ddd', flexShrink: 0, flexWrap: 'wrap', backgroundColor: '#fff' }}>
        <span style={{ fontSize: '0.8rem', color: '#333', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mes:</span>
        <select
          value={currentYM || ''}
          onChange={e => setSelectedYM(e.target.value)}
          style={{ backgroundColor: '#fff', color: '#111', border: '1px solid #ccc', borderRadius: '3px', padding: '0.3rem 0.5rem', fontSize: '0.82rem', cursor: 'pointer' }}
        >
          {months.map(ym => <option key={ym} value={ym}>{fmtMonth(ym)}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '1.5rem', marginLeft: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#555' }}>Apertura: <strong style={{ color: '#111' }}>{totalStock(entry.apertura || {})}</strong></span>
          <span style={{ fontSize: '0.8rem', color: '#555' }}>Cierre: <strong style={{ color: '#2e7d32' }}>{totalStock(cierre)}</strong></span>
          <span style={{ fontSize: '0.8rem', color: '#555' }}>EV/ha: <strong style={{ color: '#0277bd' }}>{evHa}</strong></span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={agregarMes}
            style={{ padding: '0.3rem 0.7rem', backgroundColor: '#e3f2fd', color: '#0277bd', border: '1px solid #90caf9', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
          >
            + Mes nuevo
          </button>
          {importing ? (
            <span style={{ fontSize: '0.78rem', color: '#555' }}>{importProgress}</span>
          ) : (
            <button
              onClick={importHistorico}
              style={{ padding: '0.3rem 0.7rem', backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
            >
              ⬆ Re-importar
            </button>
          )}
        </div>
      </div>

      {/* Scrollable table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: '0.72rem', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '110px' }} />
            <col style={{ width: '45px' }} />
            {PLANILLA_CATS.map(c => <col key={c.key} style={{ width: '42px' }} />)}
          </colgroup>
          <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ backgroundColor: '#f5f5f5', border: 'none' }} />
              <th style={{ backgroundColor: '#f5f5f5', border: 'none' }} />
              {grupos.map(g => {
                const cols = PLANILLA_CATS.filter(c => c.grupo === g);
                return <th key={g} colSpan={cols.length} style={{ padding: '4px', fontSize: '0.62rem', fontWeight: '700', color: '#555', textAlign: 'center', borderBottom: '1px solid #ddd', borderRight: '2px solid #999', textTransform: 'uppercase', letterSpacing: '0.5px', backgroundColor: '#f5f5f5' }}>{g}</th>;
              })}
            </tr>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '4px 8px', textAlign: 'left', fontSize: '0.65rem', color: '#333', fontWeight: '600', textTransform: 'uppercase', position: 'sticky', left: 0, backgroundColor: '#f5f5f5', zIndex: 3, borderRight: '2px solid #ccc' }}>Concepto</th>
              <th style={{ ...TH_CAT.style, textAlign: 'center' }}>Total</th>
              {PLANILLA_CATS.map(c => <th key={c.key} style={{ ...TH_CAT.style, borderRight: colBorder(c.key) }}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {/* Apertura */}
            <tr style={{ backgroundColor: '#fff', borderBottom: '2px solid #ddd' }}>
              <td style={{ padding: '4px 8px', fontWeight: '700', color: '#111', fontSize: '0.75rem', position: 'sticky', left: 0, backgroundColor: '#fff', zIndex: 1, borderRight: '2px solid #ccc' }}>Apertura</td>
              <td style={{ ...TD.style, color: '#111', fontWeight: '700' }}>{totalStock(entry.apertura || {})}</td>
              {PLANILLA_CATS.map(c => {
                const val = (entry.apertura?.[c.key]) || 0;
                return <td key={c.key} style={{ ...TD.style, borderRight: colBorder(c.key), color: val > 0 ? '#111' : '#ccc' }}>{val > 0 ? val : '·'}</td>;
              })}
            </tr>

            {/* Entradas header */}
            <tr style={{ backgroundColor: '#e8f5e9' }}>
              <td colSpan={2 + PLANILLA_CATS.length} style={{ padding: '3px 8px', color: '#2e7d32', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>+ Entradas</td>
            </tr>
            {SECTION_ROWS.filter(r => r.section === 'entradas').map(row => (
              <tr key={`e-${row.type}`} style={{ backgroundColor: row.color }}>
                <td style={{ padding: '2px 8px 2px 16px', color: '#111', fontSize: '0.7rem', position: 'sticky', left: 0, backgroundColor: row.color, zIndex: 1, borderRight: '2px solid #ccc' }}>{row.label}</td>
                <td style={{ ...TD.style, color: '#111' }}>{totalRow(row) || '·'}</td>
                {PLANILLA_CATS.map(c => renderCell(row.section, row.type, c.key, row.color))}
              </tr>
            ))}
            <tr style={{ backgroundColor: '#c8e6c9', borderBottom: '2px solid #a5d6a7' }}>
              <td style={{ padding: '3px 8px', fontWeight: '700', color: '#1b5e20', fontSize: '0.72rem', position: 'sticky', left: 0, backgroundColor: '#c8e6c9', zIndex: 1, borderRight: '2px solid #ccc' }}>Total entradas</td>
              <td style={{ ...TD.style, color: '#1b5e20', fontWeight: '700' }}>
                {PLANILLA_KEYS.reduce((s, k) => s + SECTION_ROWS.filter(r=>r.section==='entradas').reduce((ss,r)=>ss+((entry.entradas?.[r.type]?.[k])||0),0), 0)}
              </td>
              {PLANILLA_CATS.map(c => {
                const tot = SECTION_ROWS.filter(r=>r.section==='entradas').reduce((s,r)=>s+((entry.entradas?.[r.type]?.[c.key])||0),0);
                return <td key={c.key} style={{ ...TD.style, borderRight: colBorder(c.key), color: tot > 0 ? '#1b5e20' : '#ccc', fontWeight: tot > 0 ? '700' : '400' }}>{tot > 0 ? tot : '·'}</td>;
              })}
            </tr>

            {/* Salidas header */}
            <tr style={{ backgroundColor: '#ffebee' }}>
              <td colSpan={2 + PLANILLA_CATS.length} style={{ padding: '3px 8px', color: '#c62828', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>− Salidas</td>
            </tr>
            {SECTION_ROWS.filter(r => r.section === 'salidas').map(row => (
              <tr key={`s-${row.type}`} style={{ backgroundColor: row.color }}>
                <td style={{ padding: '2px 8px 2px 16px', color: '#c62828', fontSize: '0.7rem', position: 'sticky', left: 0, backgroundColor: row.color, zIndex: 1, borderRight: '2px solid #ccc' }}>{row.label}</td>
                <td style={{ ...TD.style, color: '#c62828' }}>{totalRow(row) || '·'}</td>
                {PLANILLA_CATS.map(c => renderCell(row.section, row.type, c.key, row.color))}
              </tr>
            ))}
            <tr style={{ backgroundColor: '#ffcdd2', borderBottom: '2px solid #ef9a9a' }}>
              <td style={{ padding: '3px 8px', fontWeight: '700', color: '#b71c1c', fontSize: '0.72rem', position: 'sticky', left: 0, backgroundColor: '#ffcdd2', zIndex: 1, borderRight: '2px solid #ccc' }}>Total salidas</td>
              <td style={{ ...TD.style, color: '#b71c1c', fontWeight: '700' }}>
                {PLANILLA_KEYS.reduce((s, k) => s + SECTION_ROWS.filter(r=>r.section==='salidas').reduce((ss,r)=>ss+((entry.salidas?.[r.type]?.[k])||0),0), 0)}
              </td>
              {PLANILLA_CATS.map(c => {
                const tot = SECTION_ROWS.filter(r=>r.section==='salidas').reduce((s,r)=>s+((entry.salidas?.[r.type]?.[c.key])||0),0);
                return <td key={c.key} style={{ ...TD.style, borderRight: colBorder(c.key), color: tot > 0 ? '#b71c1c' : '#ccc', fontWeight: tot > 0 ? '700' : '400' }}>{tot > 0 ? tot : '·'}</td>;
              })}
            </tr>

            {/* Cierre */}
            <tr style={{ backgroundColor: '#e8f5e9', borderTop: '2px solid #ccc' }}>
              <td style={{ padding: '5px 8px', fontWeight: '700', color: '#1b5e20', fontSize: '0.78rem', position: 'sticky', left: 0, backgroundColor: '#e8f5e9', zIndex: 1, borderRight: '2px solid #ccc' }}>Cierre</td>
              <td style={{ ...TD.style, color: '#1b5e20', fontWeight: '700', fontSize: '0.78rem' }}>{totalStock(cierre)}</td>
              {PLANILLA_CATS.map(c => {
                const val = cierre[c.key] || 0;
                return <td key={c.key} style={{ ...TD.style, borderRight: colBorder(c.key), color: val > 0 ? '#1b5e20' : val < 0 ? '#c62828' : '#ccc', fontWeight: val > 0 ? '700' : '400' }}>{val !== 0 ? val : '·'}</td>;
              })}
            </tr>

            {/* EV row */}
            <tr style={{ backgroundColor: '#e3f2fd', borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '3px 8px', color: '#0277bd', fontSize: '0.68rem', fontWeight: '600', position: 'sticky', left: 0, backgroundColor: '#e3f2fd', zIndex: 1, borderRight: '2px solid #ccc' }}>EV total / EV/ha</td>
              <td style={{ ...TD.style, color: '#0277bd', fontWeight: '700' }}>{evCierre.toFixed(0)}</td>
              <td colSpan={PLANILLA_CATS.length} style={{ ...TD.style, color: '#01579b', fontWeight: '700', textAlign: 'left' }}>
                {evHa} EV/ha  ·  {HA_ESTABLECIMIENTO} ha efectivas
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── NDVI Date Picker ─────────────────────────────────────────────────────────

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function cloudDot(pct) {
  if (pct <= 10) return '#4caf50';
  if (pct <= 30) return '#ffeb3b';
  if (pct <= 60) return '#ff9800';
  return '#666';
}

function NdviDatePicker({ value, onChange }) {
  const today = new Date().toISOString().slice(0, 10);
  const initDate = value ? new Date(value + 'T12:00:00Z') : new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initDate.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getUTCMonth()); // 0-indexed
  const [avail, setAvail] = useState({});   // { 'YYYY-MM-DD': cloudPct }
  const [fetching, setFetching] = useState(false);
  const popupRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (popupRef.current && !popupRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Fetch available dates when month/year changes and picker is open
  useEffect(() => {
    if (!open) return;
    setFetching(true);
    fetch(`/api/ndvi-dates?year=${viewYear}&month=${viewMonth + 1}`)
      .then(r => r.json())
      .then(data => { setAvail(prev => ({ ...prev, ...data })); setFetching(false); })
      .catch(() => setFetching(false));
  }, [open, viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    const nextStr = `${viewYear}-${String(viewMonth + 2).padStart(2, '0')}-01`;
    if (nextStr > today) return; // no future months
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();

  const fmtLabel = (d) => {
    if (!d) return 'Fecha';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y.slice(2)}`;
  };

  const isNextDisabled = `${viewYear}-${String(viewMonth + 2).padStart(2, '0')}-01` > today;

  return (
    <div ref={popupRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.28rem 0.65rem', backgroundColor: open ? '#1e3a1e' : '#1a1a1a', color: '#fff', border: `1px solid ${open ? '#4caf50' : '#333'}`, borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}
      >
        📅 {fmtLabel(value)}
      </button>

      {open && (
        <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 2000, backgroundColor: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '0.75rem', width: '252px', boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '1.2rem', cursor: 'pointer', padding: '2px 8px', lineHeight: 1 }}>‹</button>
            <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.82rem' }}>
              {MESES[viewMonth]} {viewYear}
              {fetching && <span style={{ color: '#555', fontSize: '0.65rem', marginLeft: '0.4rem' }}>...</span>}
            </span>
            <button onClick={nextMonth} disabled={isNextDisabled} style={{ background: 'none', border: 'none', color: isNextDisabled ? '#2a2a2a' : '#aaa', fontSize: '1.2rem', cursor: isNextDisabled ? 'default' : 'pointer', padding: '2px 8px', lineHeight: 1 }}>›</button>
          </div>

          {/* Day-of-week labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: '3px' }}>
            {DIAS_SEMANA.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.58rem', color: '#444', fontWeight: '700', padding: '2px 0' }}>{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
            {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isFuture = dateStr > today;
              const isSelected = dateStr === value;
              const isToday = dateStr === today;
              const cloud = avail[dateStr];
              const hasImg = cloud !== undefined;

              return (
                <div
                  key={day}
                  onClick={() => { if (hasImg && !isFuture) { onChange(dateStr); setOpen(false); } }}
                  title={hasImg ? `☁ ${cloud}% nubosidad` : isFuture ? 'Fecha futura' : 'Sin imagen disponible'}
                  style={{
                    textAlign: 'center', padding: '3px 1px', borderRadius: '4px',
                    cursor: hasImg && !isFuture ? 'pointer' : 'default',
                    backgroundColor: isSelected ? '#4caf50' : isToday ? '#1e3a1e' : 'transparent',
                    border: isToday && !isSelected ? '1px solid #2d5016' : '1px solid transparent',
                    color: isFuture ? '#222' : isSelected ? '#000' : hasImg ? '#fff' : '#333',
                    fontWeight: isSelected ? '700' : '400',
                    fontSize: '0.72rem',
                  }}
                >
                  {day}
                  {hasImg && !isSelected && (
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: cloudDot(cloud), margin: '1px auto 0' }} />
                  )}
                  {isSelected && (
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#000', margin: '1px auto 0' }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.55rem', paddingTop: '0.45rem', borderTop: '1px solid #1e1e1e', flexWrap: 'wrap' }}>
            {[['#4caf50', '≤10%'], ['#ffeb3b', '≤30%'], ['#ff9800', '≤60%'], ['#666', '>60%']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.58rem', color: '#555' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: c, flexShrink: 0 }} />
                {l} ☁
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Map View ─────────────────────────────────────────────────────────────────

function MapView({ onPotreroClick, modoMover, ndviActive, ndviDate, ndviIndex, showBasemap, onHoverValue, ndviStats, hacienda, pastoData }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const layersRef = useRef({});
  const pastoLabelsRef = useRef([]);
  const labelsRef = useRef([]);
  const ndviLabelsRef = useRef([]);
  const ndviLayerRef = useRef(null);
  const potrerosCentersRef = useRef({}); // { nombre: LatLng }
  const cowMarkersRef = useRef([]);
  const baseTileRef = useRef(null);
  const onClickRef = useRef(onPotreroClick);
  const ndviActiveRef = useRef(ndviActive);
  const hoverTimerRef = useRef(null);

  useEffect(() => { onClickRef.current = onPotreroClick; }, [onPotreroClick]);
  useEffect(() => { ndviActiveRef.current = ndviActive; }, [ndviActive]);

  const FARM_BOUNDS = [[-36.9290, -58.6160], [-36.8775, -58.5480]];

  useEffect(() => {
    if (!map.current) return;
    if (ndviLayerRef.current) { ndviLayerRef.current.remove(); ndviLayerRef.current = null; }
    if (ndviActive && ndviDate) {
      const url = `/api/ndvi-farm?index=${encodeURIComponent(ndviIndex)}&date=${ndviDate}`;
      const bounds = L.latLngBounds(FARM_BOUNDS);
      ndviLayerRef.current = makeNdviCanvasLayer(url, bounds).addTo(map.current);
    }
  }, [ndviActive, ndviDate, ndviIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!baseTileRef.current || !map.current) return;
    baseTileRef.current.setOpacity(showBasemap ? 1 : 0);
    map.current.getContainer().style.backgroundColor = showBasemap ? '#000' : '#fff';
  }, [showBasemap]);

  useEffect(() => {
    if (!map.current) return;
    // Compute max MS for pasto color scale
    const pastoVals = pastoData ? Object.values(pastoData).map(d => d.msDisponible).filter(v => v != null && v > 0) : [];
    const maxMs = pastoVals.length ? Math.max(...pastoVals) : 1;

    // Apply polygon styles: modoMover > pasto > ndvi > normal
    Object.entries(layersRef.current).forEach(([nombre, polys]) => {
      let style;
      if (modoMover) {
        style = nombre === modoMover ? STYLE_ORIGEN : STYLE_DESTINO;
      } else if (pastoData) {
        const d = pastoData[nombre];
        const fillColor = d?.msDisponible != null ? pastoColorFn(d.msDisponible / maxMs) : '#333';
        style = { color: '#fff', weight: 2, opacity: 0.9, fillColor, fillOpacity: 0.75 };
      } else if (ndviActive) {
        style = STYLE_NDVI;
      } else {
        style = STYLE_NORMAL;
      }
      polys.forEach(p => p.setStyle(style));
    });

    // Normal name/ha labels: show only when neither ndvi nor pasto active
    labelsRef.current.forEach(m => {
      const el = m.getElement();
      if (el) el.style.display = (ndviActive || pastoData) ? 'none' : '';
    });

    // NDVI value labels
    ndviLabelsRef.current.forEach(m => map.current.removeLayer(m));
    ndviLabelsRef.current = [];
    if (ndviActive && ndviIndex !== 'NATURAL' && !pastoData) {
      POSTREROS_GEOJSON.features.forEach(f => {
        const nombre = f.properties.nombre;
        const ring = f.geometry.coordinates[0][0];
        const lat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
        const lon = ring.reduce((s, p) => s + p[0], 0) / ring.length;
        const marker = L.marker([lat, lon], {
          icon: L.divIcon({
            html: `<div style="background:rgba(0,0,0,0.65);color:#ffeb3b;font-size:11px;font-weight:700;padding:2px 5px;border-radius:3px;text-align:center;white-space:nowrap;font-family:'Courier New',monospace">—</div>`,
            className: '',
            iconSize: [44, 18],
            iconAnchor: [22, 9]
          }),
          interactive: false,
          zIndexOffset: 600
        }).addTo(map.current);
        marker._ndviNombre = nombre;
        ndviLabelsRef.current.push(marker);
      });
    }

    // Pasto labels: show MS disponible + días restantes per potrero
    pastoLabelsRef.current.forEach(m => map.current.removeLayer(m));
    pastoLabelsRef.current = [];
    if (pastoData && !modoMover) {
      POSTREROS_GEOJSON.features.forEach(f => {
        const nombre = f.properties.nombre;
        const d = pastoData[nombre];
        const center = potrerosCentersRef.current[nombre];
        if (!center) return;
        const ms = d?.msDisponible;
        const dias = d?.diasRestantes;
        const msText = ms != null ? `${(ms / 1000).toFixed(0)}t` : '—';
        const diasText = dias != null ? `${dias}d` : '∞';
        const diasColor = dias == null ? '#4caf50' : dias < 7 ? '#ff4444' : dias < 15 ? '#ff9800' : '#4caf50';
        const marker = L.marker(center, {
          icon: L.divIcon({
            html: `<div style="text-align:center;font-family:'Courier New',monospace;pointer-events:none">
              <div style="font-size:13px;font-weight:700;color:#fff;text-shadow:1px 1px 3px #000">${nombre}</div>
              <div style="font-size:12px;font-weight:700;color:${diasColor};text-shadow:1px 1px 3px #000">${diasText}</div>
              <div style="font-size:11px;color:#eee;text-shadow:1px 1px 2px #000">${msText} disp.</div>
            </div>`,
            className: '',
            iconSize: [80, 54],
            iconAnchor: [40, 27]
          }),
          interactive: false
        }).addTo(map.current);
        pastoLabelsRef.current.push(marker);
      });
    }
  }, [ndviActive, ndviIndex, modoMover, pastoData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    ndviLabelsRef.current.forEach(marker => {
      const nombre = marker._ndviNombre;
      const value = ndviStats?.[nombre];
      const text = value != null ? value.toFixed(2) : '—';
      marker.setIcon(L.divIcon({
        html: `<div style="background:rgba(0,0,0,0.65);color:#ffeb3b;font-size:11px;font-weight:700;padding:2px 5px;border-radius:3px;text-align:center;white-space:nowrap;font-family:'Courier New',monospace">${text}</div>`,
        className: '',
        iconSize: [44, 18],
        iconAnchor: [22, 9]
      }));
    });
  }, [ndviStats]);


  useEffect(() => {
    if (!map.current) return;
    cowMarkersRef.current.forEach(m => m.remove());
    cowMarkersRef.current = [];
    const ocupados = {};
    (hacienda || []).forEach(h => {
      if (!h.potrero) return;
      if (!ocupados[h.potrero]) ocupados[h.potrero] = 0;
      ocupados[h.potrero] += h.cantidad || 0;
    });
    Object.entries(ocupados).forEach(([potrero, total]) => {
      const center = potrerosCentersRef.current[potrero];
      if (!center) return;
      const marker = L.marker([center.lat + 0.0015, center.lng], {
        icon: L.divIcon({
          html: `<div style="pointer-events:none;text-align:center">
            <img src="/cow.png" width="36" height="36" style="display:block;margin:0 auto;filter:drop-shadow(1px 1px 2px rgba(0,0,0,0.7))"/>
            <div style="font-size:11px;font-weight:700;color:#ffeb3b;text-shadow:1px 1px 2px rgba(0,0,0,0.9);margin-top:2px">${total}</div>
          </div>`,
          className: '',
          iconSize: [36, 52],
          iconAnchor: [18, 26]
        }),
        interactive: false
      }).addTo(map.current);
      cowMarkersRef.current.push(marker);
    });
  }, [hacienda]);

  useEffect(() => {
    map.current = L.map(mapContainer.current, {
  zoomSnap: 0.25,
  zoomDelta: 0.25
}).setView([-36.905, -58.582], 13.75);
    baseTileRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Esri', maxZoom: 20
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
          this.setStyle({ weight: 3 });
        });
        polygon.on('mouseout', function () {
          if (ndviActiveRef.current) return;
          this.setStyle({ weight: 2 });
        });
        polygon.addTo(map.current);
        layersRef.current[props.nombre].push(polygon);
        if (!firstPolygon) firstPolygon = polygon;
      });

      const center = firstPolygon.getBounds().getCenter();
      potrerosCentersRef.current[props.nombre] = center;
      const label = L.marker(center, {
        icon: L.divIcon({
          html: `<div style="text-align:center;font-family:'Courier New',monospace;color:#ffeb3b;text-shadow:1px 1px 3px rgba(0,0,0,0.7);font-weight:bold;pointer-events:none"><div style="font-size:13px">${props.nombre}</div><div style="font-size:12px">${props.ha.toFixed(1)} ha</div></div>`,
          className: 'potrero-label',
          iconSize: [70, 45]
        })
      }).addTo(map.current);
      labelsRef.current.push(label);
    });

    map.current.on('mousemove', (e) => {
      if (!ndviActiveRef.current) return;
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = setTimeout(async () => {
        if (!ndviActiveRef.current) return;
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

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const ALLOWED_EMAILS = ['santibaca@gmail.com', 'rauchsa@hotmail.com'];

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [hacienda, setHacienda] = useState(HACIENDA_INICIAL);
  const [historial, setHistorial] = useState({});
  const [selectedPotrero, setSelectedPotrero] = useState(null);
  const [pastoreosCache, setPastoreosCache] = useState({});
  const [pastoreosLoading, setPastoreosLoading] = useState(false);
  const [historialPastoreosExpanded, setHistorialPastoreosExpanded] = useState(false);
  const [draggedCategory, setDraggedCategory] = useState(null);
  const [addingRodeo, setAddingRodeo] = useState(null); // { catNombre, nombre, cantidad }
  const [dropOver, setDropOver] = useState(false);
  const [editingCantidad, setEditingCantidad] = useState(null); // { docId, value }
  const [activeSection, setActiveSection] = useState('mapa'); // 'mapa' | 'forraje' | 'planilla'
  const [modoMover, setModoMover] = useState(null);
  const [showNDVI, setShowNDVI] = useState(false);
  const [ndviDate, setNdviDate] = useState(getNdviDates()[0] || '');
  const [ndviIndex, setNdviIndex] = useState('NDVIc');
  const [showBasemap, setShowBasemap] = useState(true);
  const [hoverValue, setHoverValue] = useState(null);
  const [ndviStats, setNdviStats] = useState({});
  const [showPasto, setShowPasto] = useState(false);
  const [pastoRad, setPastoRad] = useState({});
  const [pastoNdvi, setPastoNdvi] = useState(null);


  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      if (err.code !== 'auth/no-auth-event') setAuthError(err.message || err.code);
    });
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (currentUser) cargarHaciendaDeFirestore();
    });
    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showNDVI || !ndviDate || ndviIndex === 'NATURAL' || ndviIndex === 'SWIR') { setNdviStats({}); return; }
    fetch('/api/ndvi-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ polygons: potreroPolygons(), index: ndviIndex, date: ndviDate })
    }).then(r => r.json()).then(setNdviStats).catch(() => {});
  }, [showNDVI, ndviDate, ndviIndex]);

  // Pasto map mode: fetch radiation once on mount
  useEffect(() => {
    fetch('/api/forraje-radiation?months=24')
      .then(r => r.json())
      .then(data => { if (!data?.error) setPastoRad(data); })
      .catch(() => {});
  }, []);

  // Pasto map mode: fetch current NDVI once when first activated
  useEffect(() => {
    if (!showPasto || pastoNdvi !== null) return;
    const currentDate = getNdviDates()[0];
    fetch('/api/ndvi-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ polygons: potreroPolygons(), index: 'NDVIc', date: currentDate })
    }).then(r => r.json()).then(setPastoNdvi).catch(() => setPastoNdvi({}));
  }, [showPasto, pastoNdvi]);

  useEffect(() => {
    if (selectedPotrero?.nombre && historialPastoreosExpanded) {
      cargarPastoreosDelPotrero(selectedPotrero.nombre);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPotrero?.nombre, historialPastoreosExpanded]);

  const registrarEventoPastoreo = async (categorias, potreroNombre, fechaSalida) => {
    const feat = POSTREROS_GEOJSON.features.find(f => f.properties.nombre === potreroNombre);
    const ha = feat?.properties.ha ?? 0;
    const fechasIngreso = categorias.map(c => c.fecha_ingreso).filter(Boolean);
    const fechaIngreso = fechasIngreso.length > 0 ? fechasIngreso.reduce((a, b) => (a < b ? a : b)) : null;
    const diasOcupacion = fechaIngreso
      ? Math.round((new Date(fechaSalida) - new Date(fechaIngreso)) / 86400000)
      : null;
    const animales = categorias.map(cat => ({
      nombre: cat.nombre,
      rodeo: cat.rodeo || null,
      cantidad: cat.cantidad || 0,
      peso_promedio: cat.peso_promedio || 0,
      ev_unitario: EV_POR_CATEGORIA[cat.nombre] ?? 1.0,
      ev_total: (cat.cantidad || 0) * (EV_POR_CATEGORIA[cat.nombre] ?? 1.0),
      fecha_ingreso: cat.fecha_ingreso || null,
    }));
    const totalCabezas = animales.reduce((s, a) => s + a.cantidad, 0);
    const totalEV = animales.reduce((s, a) => s + a.ev_total, 0);
    const pesoVivoTotal = animales.reduce((s, a) => s + a.cantidad * a.peso_promedio, 0);
    const evento = {
      potrero: potreroNombre,
      ha,
      fecha_ingreso: fechaIngreso,
      fecha_salida: fechaSalida,
      dias_ocupacion: diasOcupacion,
      animales,
      total_cabezas: totalCabezas,
      total_ev: parseFloat(totalEV.toFixed(1)),
      carga_ev_ha: ha > 0 ? parseFloat((totalEV / ha).toFixed(3)) : null,
      peso_vivo_total_kg: pesoVivoTotal,
      carga_kg_ha: ha > 0 ? parseFloat((pesoVivoTotal / ha).toFixed(1)) : null,
      año: new Date(fechaSalida).getFullYear(),
      mes_salida: fechaSalida.slice(0, 7),
    };
    const docRef = await addDoc(collection(db, 'pastoreos'), evento);
    setPastoreosCache(prev => ({
      ...prev,
      [potreroNombre]: [{ ...evento, docId: docRef.id }, ...(prev[potreroNombre] || [])],
    }));
  };

  const cargarPastoreosDelPotrero = async (nombre) => {
    if (pastoreosCache[nombre]) return;
    setPastoreosLoading(true);
    try {
      const q = query(collection(db, 'pastoreos'), where('potrero', '==', nombre), orderBy('fecha_salida', 'desc'));
      const snap = await getDocs(q);
      const eventos = snap.docs.map(d => ({ ...d.data(), docId: d.id }));
      setPastoreosCache(prev => ({ ...prev, [nombre]: eventos }));
    } catch (e) {
      console.error('Error cargando pastoreos:', e);
      setPastoreosCache(prev => ({ ...prev, [nombre]: [] }));
    } finally {
      setPastoreosLoading(false);
    }
  };

  const cargarHaciendaDeFirestore = async () => {
    try {
      const [snapHacienda, snapHistorial] = await Promise.all([
        getDocs(collection(db, 'hacienda')),
        getDocs(collection(db, 'historial_potreros'))
      ]);
      if (snapHacienda.size === 0) {
        for (const h of HACIENDA_INICIAL) await addDoc(collection(db, 'hacienda'), h);
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
      if (cat.potrero && cat.potrero !== potreroNombre) {
        const histRef = doc(db, 'historial_potreros', cat.potrero);
        await setDoc(histRef, { fecha_ultima_salida: ahora, nombre: cat.potrero }, { merge: true });
        setHistorial(prev => ({ ...prev, [cat.potrero]: { ...prev[cat.potrero], fecha_ultima_salida: ahora } }));
        const otrasEnPotrero = hacienda.filter(h => h.potrero === cat.potrero && h.id !== categoriaId);
        if (otrasEnPotrero.length === 0) {
          await registrarEventoPastoreo([cat], cat.potrero, ahora);
        }
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
      if (categoriasOrigen.length > 0) {
        await registrarEventoPastoreo(categoriasOrigen, origen, ahora);
      }
      setHacienda(prev => prev.map(h =>
        h.potrero === origen ? { ...h, potrero: destino, fecha_ingreso: ahora, fecha_salida: null } : h
      ));
      setSelectedPotrero(POSTREROS_GEOJSON.features.find(f => f.properties.nombre === destino)?.properties);
    } catch (error) {
      console.error('Error:', error);
    }
    setModoMover(null);
  };

  const agregarSubrodeo = async (catNombre, rodeoNombre, cantidad) => {
    const pesoRef = hacienda.find(h => h.nombre === catNombre)?.peso_promedio || PESO_PROMEDIO_DEFAULT[catNombre] || 450;
    const newEntry = { nombre: catNombre, rodeo: rodeoNombre, cantidad: parseInt(cantidad) || 0, peso_promedio: pesoRef, potrero: null, fecha_ingreso: null, fecha_salida: null };
    try {
      const docRef = await addDoc(collection(db, 'hacienda'), newEntry);
      setHacienda(prev => [...prev, { ...newEntry, id: docRef.id, docId: docRef.id }]);
    } catch (e) { console.error(e); }
  };

  const guardarCantidad = async (docId, value) => {
    const cant = parseInt(value);
    if (isNaN(cant) || cant < 0) return setEditingCantidad(null);
    setHacienda(prev => prev.map(h => h.docId === docId ? { ...h, cantidad: cant } : h));
    setEditingCantidad(null);
    try { await updateDoc(doc(db, 'hacienda', docId), { cantidad: cant }); } catch (e) { console.error(e); }
  };

  const eliminarSubrodeo = async (entryId) => {
    const entry = hacienda.find(h => h.id === entryId);
    if (!entry) return;
    try {
      if (entry.docId) await deleteDoc(doc(db, 'hacienda', entry.docId));
      setHacienda(prev => prev.filter(h => h.id !== entryId));
    } catch (e) { console.error(e); }
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
      if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request' || popupErr.code === 'auth/popup-closed-by-user') {
        try { await signInWithRedirect(auth, provider); }
        catch (redirectErr) { setAuthError(redirectErr.message || redirectErr.code); }
      } else {
        setAuthError(popupErr.message || popupErr.code);
      }
    }
  };

  const handleSignOut = async () => {
    try { await signOut(auth); setHacienda(HACIENDA_INICIAL); }
    catch (error) { console.error('Error:', error); }
  };

  const totalAnimales = hacienda.reduce((sum, h) => sum + (h.cantidad || 0), 0);

  const pastoData = (() => {
    if (!showPasto || !pastoNdvi) return null;
    const now = new Date();
    const curMonth = now.getMonth();
    const curYM = now.toISOString().slice(0, 7);
    const radKeys = Object.keys(pastoRad).sort();
    const rad = pastoRad[curYM] ?? (radKeys.length > 0 ? pastoRad[radKeys[radKeys.length - 1]] : null);
    if (rad == null) return null;
    const result = {};
    POSTREROS_GEOJSON.features.forEach(f => {
      const nombre = f.properties.nombre;
      const ha = f.properties.ha;
      const ndvi = pastoNdvi[nombre] ?? null;
      const msHa = ndvi != null ? calcMS(ndvi, rad, curMonth) : null;
      const msDisponible = msHa != null ? msHa * ha * 0.5 : null;
      const catsEnPotrero = hacienda.filter(h => h.potrero === nombre);
      const consumoDiario = catsEnPotrero.reduce(
        (sum, cat) => sum + (cat.cantidad || 0) * getCatConsumoDiario(cat.nombre, curMonth), 0
      );
      const diasRestantes = msDisponible != null && consumoDiario > 0 ? Math.round(msDisponible / consumoDiario) : null;
      result[nombre] = { msHa, msDisponible, consumoDiario, diasRestantes };
    });
    return result;
  })();



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

  if (!ALLOWED_EMAILS.includes(user.email?.toLowerCase())) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0a0a0a', fontFamily: 'sans-serif', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', backgroundColor: '#1a1a1a', padding: '3rem', borderRadius: '8px', border: '1px solid #333', maxWidth: '400px', color: '#fff' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '400', margin: '0 0 0.75rem 0' }}>Acceso no autorizado</h2>
          <p style={{ color: '#888', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
            La cuenta <strong style={{ color: '#ccc' }}>{user.email}</strong> no tiene permiso para acceder.
          </p>
          <p style={{ color: '#666', fontSize: '0.82rem', margin: '0 0 2rem 0' }}>
            Contactá al administrador para solicitar acceso.
          </p>
          <button onClick={handleSignOut} style={{ padding: '0.75rem 2rem', backgroundColor: '#333', color: '#aaa', border: '1px solid #444', borderRadius: '4px', fontSize: '0.9rem', cursor: 'pointer' }}>
            Salir
          </button>
        </div>
      </div>
    );
  }

  const sidebarItems = [
    { id: 'mapa',      icon: '🗺',  label: 'Mapa'     },
    { id: 'forraje',   icon: '🌿',  label: 'Forraje'  },
    { id: 'planilla',  icon: '📋',  label: 'Planilla' },
    { id: 'clima',     icon: '🌤',  label: 'Clima'    },
    { id: 'mercados',  icon: '💰',  label: 'Mercados' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0a0a0a', color: '#fff', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.5rem', backgroundColor: '#111', borderBottom: '1px solid #222', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '300', margin: 0, letterSpacing: '1px' }}>Ea La Delia</h1>
          <p style={{ fontSize: '0.8rem', color: '#555', margin: 0 }}>Solanet, Ayacucho · 1,381 ha</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>{user.displayName || user.email}</span>
          {activeSection === 'mapa' && (
            <>
              <button onClick={() => setShowNDVI(v => !v)} style={{ padding: '0.4rem 0.85rem', backgroundColor: showNDVI ? '#4caf50' : '#1e1e1e', color: showNDVI ? '#000' : '#aaa', border: `1px solid ${showNDVI ? '#4caf50' : '#333'}`, borderRadius: '3px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                🌿 {showNDVI ? 'NDVI ON' : 'NDVI'}
              </button>
              <button onClick={() => setShowPasto(v => !v)} style={{ padding: '0.4rem 0.85rem', backgroundColor: showPasto ? '#ff9800' : '#1e1e1e', color: showPasto ? '#000' : '#aaa', border: `1px solid ${showPasto ? '#ff9800' : '#333'}`, borderRadius: '3px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                🌾 {showPasto ? 'Pasto ON' : 'Pasto'}
              </button>
            </>
          )}
          <button onClick={handleSignOut} style={{ padding: '0.4rem 0.85rem', backgroundColor: '#c41e3a', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
            Salir
          </button>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left sidebar */}
        <nav style={{ width: '56px', backgroundColor: '#111', borderRight: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '0.75rem', gap: '0.25rem', flexShrink: 0 }}>
          {sidebarItems.map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              title={label}
              style={{
                width: '40px', height: '44px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                backgroundColor: activeSection === id ? '#1a3a1a' : 'transparent',
                border: 'none', borderRadius: '6px', cursor: 'pointer',
                color: activeSection === id ? '#4caf50' : '#555',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '1.15rem', lineHeight: 1 }}>{icon}</span>
              <span style={{ fontSize: '0.55rem', fontWeight: '600', letterSpacing: '0.3px', textTransform: 'uppercase' }}>{label}</span>
            </button>
          ))}
        </nav>

        {/* Main content area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── MAPA section ── */}
          {activeSection === 'mapa' && (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Map */}
              <div style={{ flex: 2, position: 'relative' }}>
                <MapView onPotreroClick={handlePotreroClick} modoMover={modoMover} ndviActive={showNDVI} ndviDate={ndviDate} ndviIndex={ndviIndex} showBasemap={showBasemap} onHoverValue={setHoverValue} ndviStats={ndviStats} hacienda={hacienda} pastoData={pastoData} />

                {/* NDVI control panel */}
                {showNDVI && (
                  <div style={{ position: 'absolute', bottom: '1.5rem', left: '1rem', zIndex: 1000, backgroundColor: 'rgba(15,15,15,0.92)', borderRadius: '8px', padding: '0.85rem 1rem', color: '#fff', fontSize: '0.82rem', minWidth: '230px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                    <div style={{ marginBottom: '0.7rem' }}>
                      <NdviDatePicker value={ndviDate} onChange={setNdviDate} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                      {[{id:'NDVIc',label:'NDVI+'},{id:'NDVI',label:'NDVI'},{id:'EVI',label:'EVI'},{id:'NDRE',label:'NDRE'}].map(({id,label}) => (
                        <button key={id} onClick={() => setNdviIndex(id)} style={{ flex:1, padding:'0.22rem 0', fontSize:'0.7rem', fontWeight:'700', border:'1px solid', borderRadius:'3px', cursor:'pointer', backgroundColor: ndviIndex===id?'#4caf50':'#222', color: ndviIndex===id?'#000':'#999', borderColor: ndviIndex===id?'#4caf50':'#3a3a3a' }}>{label}</button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                      {[{id:'MSAVI',label:'MSAVI'},{id:'MNDWI',label:'MNDWI'},{id:'NDMI',label:'NDMI'},{id:'NDWI',label:'NDWI'}].map(({id,label}) => (
                        <button key={id} onClick={() => setNdviIndex(id)} style={{ flex:1, padding:'0.22rem 0', fontSize:'0.7rem', fontWeight:'700', border:'1px solid', borderRadius:'3px', cursor:'pointer', backgroundColor: ndviIndex===id?'#4caf50':'#222', color: ndviIndex===id?'#000':'#999', borderColor: ndviIndex===id?'#4caf50':'#3a3a3a' }}>{label}</button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.7rem' }}>
                      <button onClick={() => setNdviIndex('NATURAL')} style={{ flex:1, padding:'0.22rem 0.4rem', fontSize:'0.7rem', fontWeight:'700', border:'1px solid', borderRadius:'3px', cursor:'pointer', backgroundColor: ndviIndex==='NATURAL'?'#4caf50':'#222', color: ndviIndex==='NATURAL'?'#000':'#999', borderColor: ndviIndex==='NATURAL'?'#4caf50':'#3a3a3a' }}>🛰 Color real</button>
                      <button onClick={() => setNdviIndex('SWIR')} style={{ flex:1, padding:'0.22rem 0.4rem', fontSize:'0.7rem', fontWeight:'700', border:'1px solid', borderRadius:'3px', cursor:'pointer', backgroundColor: ndviIndex==='SWIR'?'#4caf50':'#222', color: ndviIndex==='SWIR'?'#000':'#999', borderColor: ndviIndex==='SWIR'?'#4caf50':'#3a3a3a' }}>💧 SWIR·NIR·R</button>
                    </div>
                    {hoverValue && ndviIndex !== 'NATURAL' && ndviIndex !== 'SWIR' && (
                      <div style={{ marginBottom: '0.6rem', padding: '0.4rem 0.6rem', backgroundColor: '#1a1a1a', borderRadius: '4px', border: '1px solid #333' }}>
                        <span style={{ color: '#4caf50', fontWeight: '700', fontSize: '0.85rem' }}>{ndviIndex}: {typeof hoverValue.value === 'number' ? hoverValue.value.toFixed(3) : '—'}</span>
                        <span style={{ color: '#888', fontSize: '0.72rem', marginLeft: '0.5rem' }}>{hoverValue.label || ''}</span>
                      </div>
                    )}
                    <button onClick={() => setShowBasemap(v => !v)} style={{ width:'100%', padding:'0.25rem', fontSize:'0.72rem', marginBottom:'0.6rem', backgroundColor: showBasemap?'#222':'#1a3a1a', color: showBasemap?'#888':'#4caf50', border:'1px solid', borderColor: showBasemap?'#3a3a3a':'#4caf50', borderRadius:'3px', cursor:'pointer' }}>
                      {showBasemap ? '🛰 Ocultar satélite' : '🛰 Mostrar satélite'}
                    </button>
                    <div style={{ display:'flex', height:'7px', borderRadius:'3px', overflow:'hidden', marginBottom:'0.25rem' }}>
                      {['#82005a','#d2001e','#f03c00','#ff8c00','#f0d700','#afe600','#50c800','#009b14','#006432'].map((c,i) => (
                        <div key={i} style={{ flex:1, backgroundColor:c }} />
                      ))}
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.65rem', color:'#666' }}>
                      <span>bajo</span><span>medio</span><span>alto</span>
                    </div>
                  </div>
                )}

                {modoMover && (
                  <div style={{ position:'absolute', top:'1rem', left:'50%', transform:'translateX(-50%)', backgroundColor:'#4caf50', color:'#000', padding:'0.6rem 1.5rem', borderRadius:'4px', fontWeight:'700', fontSize:'0.9rem', zIndex:1000, boxShadow:'0 2px 12px rgba(0,0,0,0.5)', display:'flex', alignItems:'center', gap:'1rem' }}>
                    Seleccioná el potrero destino en el mapa
                    <button onClick={() => setModoMover(null)} style={{ background:'rgba(0,0,0,0.2)', border:'none', color:'#000', cursor:'pointer', borderRadius:'3px', padding:'0.2rem 0.5rem', fontWeight:'700' }}>✕ Cancelar</button>
                  </div>
                )}

                {showPasto && pastoData && (() => {
                  const vals = Object.values(pastoData).map(d => d.msDisponible).filter(v => v != null && v > 0);
                  const minMs = vals.length ? Math.min(...vals) : 0;
                  const maxMs = vals.length ? Math.max(...vals) : 0;
                  return (
                    <div style={{ position: 'absolute', bottom: '1.5rem', right: '1rem', zIndex: 1000, backgroundColor: 'rgba(13,13,13,0.92)', borderRadius: '8px', padding: '0.8rem 1rem', color: '#fff', minWidth: '190px', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>
                      <div style={{ fontWeight: '700', color: '#ff9800', marginBottom: '0.6rem', fontSize: '0.8rem', letterSpacing: '0.3px' }}>🌾 Pasto disponible</div>

                      {/* Gradient bar */}
                      <div style={{ height: '12px', borderRadius: '4px', background: 'linear-gradient(to right, rgb(200,0,0), rgb(200,200,0), rgb(0,180,0))', marginBottom: '0.25rem' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#888', marginBottom: '0.1rem' }}>
                        <span>Poco</span><span>Medio</span><span>Mucho</span>
                      </div>
                      {vals.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#555' }}>
                          <span>{(minMs / 1000).toFixed(0)}t</span>
                          <span>{(maxMs / 1000).toFixed(0)}t</span>
                        </div>
                      )}

                      {/* Days legend */}
                      <div style={{ marginTop: '0.65rem', borderTop: '1px solid #222', paddingTop: '0.55rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#666', marginBottom: '0.35rem', fontWeight: '600' }}>Días restantes</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.7rem' }}>
                          <span style={{ color: '#ff4444' }}>● &lt; 7 días — crítico</span>
                          <span style={{ color: '#ff9800' }}>● &lt; 15 días — alerta</span>
                          <span style={{ color: '#4caf50' }}>● &gt; 15 días — ok</span>
                          <span style={{ color: '#4caf50' }}>∞ — sin hacienda</span>
                        </div>
                      </div>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.62rem', color: '#444' }}>Eficiencia 50% · mes actual</div>
                    </div>
                  );
                })()}
              </div>

              {/* Right panel */}
              <div style={{ flex: 1, backgroundColor: '#1a1a1a', borderLeft: '1px solid #222', overflow: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Selected potrero */}
                {selectedPotrero ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDropOver(true); }}
                    onDragLeave={() => setDropOver(false)}
                    onDrop={() => { if (draggedCategory) moverAPotrero(draggedCategory, selectedPotrero.nombre); setDropOver(false); }}
                    style={{ backgroundColor: dropOver ? '#1a3a1a' : '#2a2a2a', padding: '1rem', borderRadius: '4px', border: `2px solid ${dropOver ? '#4caf50' : '#c41e3a'}`, position: 'relative', transition: 'all 0.15s' }}
                  >
                    <h2 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0', fontWeight: '600' }}>Potrero {selectedPotrero.nombre}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.6rem' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.15rem' }}>Hectáreas</span>
                        <span style={{ display: 'block', fontSize: '1.3rem', fontWeight: 'bold', color: '#ffeb3b' }}>{selectedPotrero.ha.toFixed(1)}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.15rem' }}>Categorías</span>
                        <span style={{ display: 'block', fontSize: '1.3rem', fontWeight: 'bold', color: '#ffeb3b' }}>{hacienda.filter(h => h.potrero === selectedPotrero.nombre).reduce((s,h)=>s+(h.cantidad||0),0).toLocaleString()}</span>
                      </div>
                    </div>
                    {showNDVI && ndviIndex !== 'NATURAL' && ndviIndex !== 'SWIR' && (
                      <div style={{ marginBottom: '0.6rem', padding: '0.4rem 0.6rem', backgroundColor: '#1a1a1a', borderRadius: '4px', border: '1px solid #333' }}>
                        <span style={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{ndviIndex} promedio</span>
                        <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 'bold', color: '#4caf50', marginTop: '0.1rem' }}>
                          {ndviStats[selectedPotrero.nombre] != null ? ndviStats[selectedPotrero.nombre].toFixed(3) : '—'}
                        </span>
                      </div>
                    )}
                    {hacienda.filter(h => h.potrero === selectedPotrero.nombre).length > 0 && (
                      <button onClick={() => setModoMover(selectedPotrero.nombre)} style={{ width: '100%', padding: '0.45rem', marginBottom: '0.6rem', backgroundColor: '#ff9800', color: '#000', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: '700', fontSize: '0.82rem' }}>
                        Mover todo a otro potrero →
                      </button>
                    )}
                    {hacienda.filter(h => h.potrero === selectedPotrero.nombre).length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.4rem' }}>
                        {hacienda.filter(h => h.potrero === selectedPotrero.nombre).map(cat => (
                          <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.5rem', backgroundColor: '#1a1a1a', borderRadius: '3px', fontSize: '0.83rem' }}>
                            <span>{cat.rodeo ? `${cat.nombre} · ${cat.rodeo}` : cat.nombre} — <strong>{cat.cantidad}</strong> cab.</span>
                            <button onClick={() => moverAPotrero(cat.id, null)} title="Desasignar" style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1rem', padding: '0 0.25rem' }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {dropOver && <div style={{ marginTop: '0.6rem', textAlign: 'center', fontSize: '0.83rem', color: '#4caf50' }}>Soltá para asignar al Potrero {selectedPotrero.nombre}</div>}
                    {!dropOver && hacienda.filter(h => h.potrero === selectedPotrero.nombre).length === 0 && (
                      <div style={{ marginTop: '0.4rem', textAlign: 'center', fontSize: '0.78rem', color: '#444', borderTop: '1px dashed #2a2a2a', paddingTop: '0.4rem' }}>Arrastrá hacienda acá para asignar</div>
                    )}
                    <button onClick={() => setSelectedPotrero(null)} style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', background: 'none', border: 'none', color: '#aaa', fontSize: '1.1rem', cursor: 'pointer', padding: '0.2rem 0.4rem' }}>✕</button>

                    {/* Historial de pastoreos */}
                    <div style={{ marginTop: '0.85rem', borderTop: '1px solid #2a2a2a', paddingTop: '0.6rem' }}>
                      <button
                        onClick={() => setHistorialPastoreosExpanded(v => !v)}
                        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: '0.1rem 0', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}
                      >
                        <span>Historial de pastoreos</span>
                        <span>{historialPastoreosExpanded ? '▲' : '▼'}</span>
                      </button>
                      {historialPastoreosExpanded && (
                        <div style={{ marginTop: '0.5rem' }}>
                          {pastoreosLoading && <div style={{ fontSize: '0.75rem', color: '#555', textAlign: 'center', padding: '0.5rem' }}>Cargando...</div>}
                          {!pastoreosLoading && (pastoreosCache[selectedPotrero.nombre] || []).length === 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#444', textAlign: 'center', padding: '0.4rem' }}>Sin registros aún</div>
                          )}
                          {!pastoreosLoading && (pastoreosCache[selectedPotrero.nombre] || []).map((ev, i) => (
                            <div key={ev.docId || i} style={{ backgroundColor: '#1a1a1a', borderRadius: '4px', padding: '0.55rem 0.65rem', marginBottom: '0.4rem', fontSize: '0.78rem', borderLeft: '3px solid #c41e3a' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ color: '#ddd', fontWeight: '600' }}>
                                  {ev.fecha_salida ? new Date(ev.fecha_salida).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                </span>
                                <span style={{ color: '#ffeb3b', fontWeight: '700' }}>
                                  {ev.dias_ocupacion != null ? `${ev.dias_ocupacion} días` : '—'}
                                </span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.3rem', marginBottom: '0.3rem' }}>
                                <div style={{ textAlign: 'center', backgroundColor: '#222', borderRadius: '3px', padding: '0.2rem 0.3rem' }}>
                                  <div style={{ fontSize: '0.63rem', color: '#777', textTransform: 'uppercase' }}>Cabezas</div>
                                  <div style={{ fontWeight: '700', color: '#ddd' }}>{ev.total_cabezas?.toLocaleString() ?? '—'}</div>
                                </div>
                                <div style={{ textAlign: 'center', backgroundColor: '#222', borderRadius: '3px', padding: '0.2rem 0.3rem' }}>
                                  <div style={{ fontSize: '0.63rem', color: '#777', textTransform: 'uppercase' }}>EV/ha</div>
                                  <div style={{ fontWeight: '700', color: '#4caf50' }}>{ev.carga_ev_ha != null ? ev.carga_ev_ha.toFixed(2) : '—'}</div>
                                </div>
                                <div style={{ textAlign: 'center', backgroundColor: '#222', borderRadius: '3px', padding: '0.2rem 0.3rem' }}>
                                  <div style={{ fontSize: '0.63rem', color: '#777', textTransform: 'uppercase' }}>kg PV/ha</div>
                                  <div style={{ fontWeight: '700', color: '#64b5f6' }}>{ev.carga_kg_ha != null ? ev.carga_kg_ha.toFixed(0) : '—'}</div>
                                </div>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#555' }}>
                                {(ev.animales || []).map((a, j) => (
                                  <span key={j} style={{ marginRight: '0.5rem' }}>
                                    {a.rodeo ? `${a.nombre}·${a.rodeo}` : a.nombre}: {a.cantidad}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '0.85rem', backgroundColor: '#2a2a2a', borderRadius: '4px', border: '1px dashed #333', textAlign: 'center', fontSize: '0.82rem', color: '#444' }}>
                    Hacé clic en un potrero del mapa para seleccionarlo
                  </div>
                )}

                {/* Hacienda list — grouped by category */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '600', margin: '0 0 0.6rem 0', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #2a2a2a', paddingBottom: '0.5rem', color: '#aaa' }}>
                    Hacienda {draggedCategory ? '— arrastrando...' : ''}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {CATEGORIAS_ORDEN.map(catNombre => {
                      const entries = hacienda.filter(h => h.nombre === catNombre);
                      const total = entries.reduce((s, h) => s + (h.cantidad || 0), 0);
                      const multipleRodeos = entries.length > 1 || entries.some(e => e.rodeo);
                      return (
                        <div key={catNombre} style={{ backgroundColor: '#1e1e1e', borderRadius: '4px', border: '1px solid #2a2a2a', overflow: 'hidden' }}>
                          {/* Category header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.65rem', backgroundColor: '#252525', borderBottom: entries.length ? '1px solid #2a2a2a' : 'none' }}>
                            <div>
                              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{catNombre}</span>
                              {(() => {
                                const potreros = [...new Set(entries.map(e => e.potrero).filter(Boolean))];
                                return potreros.length > 0 ? (
                                  <span style={{ display: 'block', fontSize: '0.68rem', color: '#4caf50', marginTop: '0.1rem' }}>
                                    {potreros.map(p => `P${p}`).join(' · ')}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#ffeb3b' }}>{total.toLocaleString()}</span>
                          </div>
                          {/* Rodeos */}
                          {entries.map(entry => (
                            <div
                              key={entry.id}
                              draggable
                              onDragStart={() => setDraggedCategory(entry.id)}
                              onDragEnd={() => { setDraggedCategory(null); setDropOver(false); }}
                              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.65rem', backgroundColor: draggedCategory === entry.id ? '#3a3a3a' : 'transparent', borderBottom: '1px solid #222', borderLeft: `3px solid ${entry.potrero ? '#4caf50' : '#c41e3a'}`, cursor: 'grab', opacity: draggedCategory === entry.id ? 0.6 : 1 }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {entry.rodeo || (multipleRodeos ? 'Principal' : catNombre.split(' ')[0])}
                                </span>
                                <span style={{ display: 'block', fontSize: '0.72rem', color: entry.potrero ? '#4caf50' : '#555' }}>
                                  {entry.potrero ? `Potrero ${entry.potrero}` : 'Sin asignar'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                  {editingCantidad != null && editingCantidad.docId === entry.docId ? (
                                    <input
                                      type="number"
                                      autoFocus
                                      value={editingCantidad.value}
                                      onChange={e => setEditingCantidad(ec => ec ? { ...ec, value: e.target.value } : ec)}
                                      onBlur={e => guardarCantidad(entry.docId, e.target.value)}
                                      onKeyDown={e => { if (e.key === 'Enter') { e.target.blur(); } if (e.key === 'Escape') setEditingCantidad(null); }}
                                      style={{ width: '70px', background: '#333', border: '1px solid #4caf50', borderRadius: '3px', color: '#fff', fontSize: '1rem', fontWeight: 'bold', textAlign: 'right', padding: '0.1rem 0.3rem' }}
                                    />
                                  ) : (
                                    <span
                                      onClick={() => setEditingCantidad({ docId: entry.docId, value: entry.cantidad || 0 })}
                                      title="Click para editar"
                                      style={{ display: 'block', fontSize: '1rem', fontWeight: 'bold', color: '#fff', cursor: 'pointer', borderBottom: '1px dashed #444' }}
                                    >{(entry.cantidad || 0).toLocaleString()}</span>
                                  )}
                                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#555' }}>{entry.peso_promedio} kg</span>
                                </div>
                                {(entry.rodeo || entries.length > 1) && (
                                  <button onClick={() => eliminarSubrodeo(entry.id)} title="Eliminar rodeo"
                                    style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.9rem', padding: '0 0.2rem', lineHeight: 1 }}>✕</button>
                                )}
                              </div>
                            </div>
                          ))}
                          {/* Add sub-rodeo */}
                          {addingRodeo?.catNombre === catNombre ? (
                            <div style={{ padding: '0.5rem 0.65rem', display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#161616' }}>
                              <input
                                placeholder="Nombre rodeo"
                                value={addingRodeo.nombre}
                                onChange={e => setAddingRodeo(a => ({ ...a, nombre: e.target.value }))}
                                style={{ flex: 1, minWidth: '80px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '3px', padding: '0.25rem 0.4rem', fontSize: '0.78rem' }}
                              />
                              <input
                                type="number" placeholder="Cant." min={0}
                                value={addingRodeo.cantidad}
                                onChange={e => setAddingRodeo(a => ({ ...a, cantidad: e.target.value }))}
                                style={{ width: '60px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '3px', padding: '0.25rem 0.4rem', fontSize: '0.78rem' }}
                              />
                              <button onClick={() => { agregarSubrodeo(catNombre, addingRodeo.nombre, addingRodeo.cantidad); setAddingRodeo(null); }}
                                style={{ padding: '0.25rem 0.5rem', backgroundColor: '#1a3a1a', color: '#4caf50', border: '1px solid #4caf50', borderRadius: '3px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                Guardar
                              </button>
                              <button onClick={() => setAddingRodeo(null)}
                                style={{ padding: '0.25rem 0.5rem', background: 'none', color: '#555', border: '1px solid #333', borderRadius: '3px', fontSize: '0.75rem', cursor: 'pointer' }}>
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAddingRodeo({ catNombre, nombre: `Rodeo ${entries.length + 1}`, cantidad: '' })}
                              style={{ width: '100%', padding: '0.3rem', background: 'none', border: 'none', color: '#444', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'left', paddingLeft: '0.65rem' }}>
                              + agregar rodeo
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', padding: '0.75rem', backgroundColor: '#2a2a2a', borderRadius: '3px', border: '1px solid #222' }}>
                    <span style={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>Total animales</span>
                    <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#ffeb3b' }}>{totalAnimales}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', padding: '0.75rem', backgroundColor: '#2a2a2a', borderRadius: '3px', border: '1px solid #222' }}>
                    <span style={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>Asignados</span>
                    <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#ffeb3b' }}>{hacienda.filter(h => h.potrero).reduce((s,h)=>s+(h.cantidad||0),0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── FORRAJE section ── */}
          {activeSection === 'forraje' && (
            <ForrajePanel
              hacienda={hacienda}
              historial={historial}
            />
          )}

          {/* ── PLANILLA section ── */}
          {activeSection === 'planilla' && (
            <PlanillaPanel db={db} />
          )}

          {/* ── CLIMA section ── */}
          {activeSection === 'clima' && (
            <ClimaPanel />
          )}

          {/* ── MERCADOS section ── */}
          {activeSection === 'mercados' && (
            <MercadosPanel />
          )}

        </div>
      </div>
    </div>
  );
}

export default App;
