import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar, 
  BarChart3, 
  FileSpreadsheet, 
  Save, 
  Clock, 
  Target,
  BookOpen,
  TrendingUp,
  Sparkles,
  X,
  Loader2,
  BrainCircuit,
  Maximize2,
  Minimize2,
  Circle,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  CheckSquare // Fixed: Added missing import
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot
} from 'firebase/firestore';

// --- Types ---
interface ScheduleRow {
  id: string;
  date: string;
  day: string;
  gs1: string;
  gs2: string;
  ca: string;
  revision: string;
  maths: string;
  csat: string;
  test: string;
  testType: string;
  testColor: string;
  status: string;
  notes: string;
}

interface SyllabusItem {
  topic: string;
  status: string;
}

interface TestItem {
  date: string;
  name: string;
  type: string;
  color: string;
}

// --- Gemini API Configuration ---
const apiKey = "AIzaSyDVyq4A9CSP6lHeX6FeDYK9jhgUMAo9j8k"; 

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBhEOHoF2oI3NSAYN8OEXxo0CwttQId5q8",
  authDomain: "upsc-tracker-2026-5be02.firebaseapp.com",
  projectId: "upsc-tracker-2026-5be02",
  storageBucket: "upsc-tracker-2026-5be02.firebasestorage.app",
  messagingSenderId: "934742429916",
  appId: "1:934742429916:web:6f017373539de0a9712419"
};

const appId = 'upsc-study-tracker';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Constants & Data ---
const PRELIMS_DATE = new Date('2026-05-24T09:30:00');
const START_DATE = new Date('2026-01-26');
const TOTAL_DAYS = 119;

// --- VAJIRAM TEST SCHEDULE ---
const TEST_SCHEDULE: TestItem[] = [
  { date: '2026-02-05', name: 'Vajiram: Polity NCERT + Geog NCERT', type: 'Sectional', color: 'blue' },
  { date: '2026-02-12', name: 'Vajiram: Econ NCERT + Hist NCERT', type: 'Sectional', color: 'blue' },
  { date: '2026-02-19', name: 'Vajiram: Comp. Polity + May CA', type: 'Comprehensive', color: 'yellow' },
  { date: '2026-02-26', name: 'Vajiram: Comp. Geography + June CA', type: 'Comprehensive', color: 'yellow' },
  { date: '2026-03-02', name: 'Vajiram: Modern History + July CA', type: 'Sectional', color: 'blue' },
  { date: '2026-03-09', name: 'Vajiram: Ancient/Med/Art + Aug CA', type: 'Sectional', color: 'blue' },
  { date: '2026-03-16', name: 'Vajiram: Environment + Sep CA', type: 'Sectional', color: 'blue' },
  { date: '2026-03-23', name: 'Vajiram: Economics + Oct CA', type: 'Sectional', color: 'blue' },
  { date: '2026-03-30', name: 'Vajiram: Sci & Tech + Nov CA', type: 'Sectional', color: 'blue' },
  { date: '2026-04-09', name: 'Vajiram: GS Full Length 1 + CSAT 1', type: 'Full Length', color: 'green' },
  { date: '2026-04-13', name: 'Internal Mock 1 (4.5h)', type: 'Mock', color: 'red' },
  { date: '2026-04-16', name: 'Vajiram: GS Full Length 2 + CSAT 2', type: 'Full Length', color: 'green' },
  { date: '2026-04-19', name: 'Internal Mock 2 (4.5h)', type: 'Mock', color: 'red' },
  { date: '2026-04-23', name: 'Vajiram: GS Full Length 3', type: 'Full Length', color: 'green' },
  { date: '2026-04-26', name: 'Internal Mock 3 (4.5h)', type: 'Mock', color: 'red' },
  { date: '2026-04-30', name: 'Vajiram: GS Full Length 4', type: 'Full Length', color: 'green' },
  { date: '2026-05-03', name: 'Internal Mock 4 (4.5h)', type: 'Mock', color: 'red' },
  { date: '2026-05-10', name: 'Internal Mock 5 (4.5h)', type: 'Mock', color: 'red' },
  { date: '2026-05-17', name: 'Internal Mock 6 (4.5h)', type: 'Mock', color: 'red' },
];

const INITIAL_SYLLABUS: SyllabusItem[] = [
  { topic: 'Polity: Preamble & Framework', status: 'Not Started' },
  { topic: 'Polity: Fundamental Rights', status: 'Not Started' },
  { topic: 'Polity: Parliament', status: 'Not Started' },
  { topic: 'History: Ancient Timeline', status: 'Not Started' },
  { topic: 'History: Modern Revolt 1857', status: 'Not Started' },
  { topic: 'Geography: Physical Features', status: 'Not Started' },
  { topic: 'Geography: Climate', status: 'Not Started' },
  { topic: 'Economy: National Income', status: 'Not Started' },
  { topic: 'Economy: Banking', status: 'Not Started' },
  { topic: 'Environment: Ecology Basics', status: 'Not Started' },
  { topic: 'SciTech: Space & Defense', status: 'Not Started' },
];

// --- FULL SCHEDULE DATA MAPPING (119 Days) ---
const FULL_SCHEDULE_DATA: Record<string, any> = {
  // WEEK 1: Polity Basics & History Intro
  '2026-01-26': { gs1: 'Polity Set A - Preamble, Constitutional framework (2.5h)', gs2: 'History - Timeline skeleton: Ancient to Modern (1h)', ca: 'The Hindu/IE newspaper tagging (1h)', revision: 'Preamble keywords recall (30m)', maths: 'Linear Algebra - Vector spaces, subspaces (2h)', csat: 'None' },
  '2026-01-27': { gs1: 'Polity - Union & Territory, Articles 1-4, Citizenship (2h)', gs2: 'History - 1857 Revolt: causes, course, consequences (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Articles 1-4 recall (15m)', maths: 'Maths OFF or review vector spaces (30m)', csat: 'None' },
  '2026-01-28': { gs1: 'Polity - FR Articles 12-35: Equality, Freedom (2.5h)', gs2: 'History - British expansion: Plassey, Buxar (1.5h)', ca: 'Newspaper + tagging + PYQ (45m)', revision: 'FR flashcards articles 14-28 (20m)', maths: 'Linear Algebra - Linear dependence (2.5h)', csat: 'None' },
  '2026-01-29': { gs1: 'Polity - FR restrictions, DPSP, Fund. Duties (2h)', gs2: 'History - Acts 1773-1853: Regulating to Charter (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'FR mindmap (15m)', maths: 'Calculus - Limits, Mean Value Thm (1.5h)', csat: 'None' },
  '2026-01-30': { gs1: 'Polity - Amendment Process, Basic Structure (2h)', gs2: 'History - Social Reforms 19th C: Raja Ram Mohan Roy (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Amendments list (15m)', maths: 'Linear Algebra - Basis, Dimension (2h)', csat: 'None' },
  '2026-01-31': { gs1: 'Polity - Executive: President, VP, PM, Council (2.5h)', gs2: 'History - INC Formation & Moderates Phase (1.5h)', ca: 'Weekly Recap (1.5h)', revision: 'Mock Test Analysis (1h)', maths: 'Linear Algebra - Matrices, Rank (2h)', csat: 'None' },
  '2026-02-01': { gs1: 'Polity - Governor, CM, State Council (2h)', gs2: 'History - Extremists & Partition of Bengal (1.5h)', ca: 'Newspaper + Editorial (1h)', revision: 'President Powers (20m)', maths: 'Maths OFF (30m)', csat: 'CSAT Practice 1 (1h)' },

  // WEEK 2: Parliament & Modern History
  '2026-02-02': { gs1: 'Polity - Parliament: RS vs LS, Composition (2.5h)', gs2: 'History - Swadeshi Movement (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Art 352/356/360 (20m)', maths: 'Linear Algebra - Eigenvalues/vectors (2h)', csat: 'None' },
  '2026-02-03': { gs1: 'Polity - Parliament: Procedures, Bills, Budget (2h)', gs2: 'History - Surat Split, Morley Minto Reforms (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Budget Process (20m)', maths: 'Calculus - Continuity & Differentiability (1.5h)', csat: 'None' },
  '2026-02-04': { gs1: 'Polity - Parliament: Committees, Forums (2h)', gs2: 'History - Home Rule Movement (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Committees Chart (15m)', maths: 'Linear Algebra - Cayley Hamilton (2h)', csat: 'None' },
  '2026-02-05': { gs1: 'Polity - Judiciary: Supreme Court (2.5h)', gs2: 'History - Lucknow Pact (1.5h)', ca: 'Newspaper + tagging (45m)', revision: 'SC Jurisdiction (20m)', maths: 'Maths OFF (Test Day)', csat: 'None' },
  '2026-02-06': { gs1: 'Polity - Judiciary: High Courts, Subordinate (2h)', gs2: 'History - Gandhi Era: Champaran, Kheda (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Writs (15m)', maths: 'Calculus - Maxima/Minima (2h)', csat: 'None' },
  '2026-02-07': { gs1: 'Polity - Federalism: Centre-State Relations (2h)', gs2: 'History - Rowlatt Act, Jallianwala Bagh (1.5h)', ca: 'Weekly Recap (1.5h)', revision: 'Schedules 1-12 (20m)', maths: 'Calculus - Integration basics (2h)', csat: 'None' },
  '2026-02-08': { gs1: 'Polity - Emergency Provisions: National/State/Financial (2h)', gs2: 'History - NCM & Khilafat Movement (1.5h)', ca: 'Newspaper + Editorial (1h)', revision: 'Emergency Types (20m)', maths: 'Maths OFF (30m)', csat: 'CSAT Practice 2 (1h)' },

  // WEEK 3: Bodies & Geography Intro
  '2026-02-09': { gs1: 'Polity - Local Govt: Panchayats (73rd Amd) (2.5h)', gs2: 'History - Swarajists, Simon Commission (1.5h)', ca: 'Newspaper + tagging (1h)', revision: '73rd Amendment (20m)', maths: 'Calculus - Definite Integrals (2h)', csat: 'None' },
  '2026-02-10': { gs1: 'Polity - Local Govt: Municipalities (74th Amd) (2h)', gs2: 'History - Nehru Report, Lahore Session (1.5h)', ca: 'Newspaper + tagging (1h)', revision: '74th Amendment (20m)', maths: 'Analytic Geo - Conic Sections (1.5h)', csat: 'None' },
  '2026-02-11': { gs1: 'Polity - Const Bodies: EC, UPSC, CAG, FinCom (2.5h)', gs2: 'History - CDM & Dandi March (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Const Bodies Table (20m)', maths: 'Linear Algebra - Vector Spaces Review (2h)', csat: 'None' },
  '2026-02-12': { gs1: 'Polity - Non-Const Bodies: NITI, NHRC, CVC (2h)', gs2: 'History - Round Table Conferences (1.5h)', ca: 'Newspaper + tagging (45m)', revision: 'Non-Const Bodies (15m)', maths: 'Maths OFF (Test Day)', csat: 'None' },
  '2026-02-13': { gs1: 'Polity - Tribunals, Elections, Anti-Defection (2h)', gs2: 'History - Poona Pact, GoI Act 1935 (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Election Laws (20m)', maths: 'Analytic Geo - 3D Geometry (2h)', csat: 'None' },
  '2026-02-14': { gs1: 'Geography - Geomorphology: Interior of Earth (2.5h)', gs2: 'History - Quit India Movement (1.5h)', ca: 'Weekly Recap (1.5h)', revision: 'Polity Full Recap (30m)', maths: 'Analytic Geo - Sphere/Cone (2h)', csat: 'None' },
  '2026-02-15': { gs1: 'Geography - Geomorphology: Plate Tectonics (2h)', gs2: 'History - INA, Cabinet Mission (1.5h)', ca: 'Newspaper + Editorial (1h)', revision: 'Geological Time Scale (15m)', maths: 'Maths OFF (30m)', csat: 'CSAT Practice 3 (1h)' },

  // WEEK 4: Physical Geography & History End
  '2026-02-16': { gs1: 'Geography - Geomorphology: Volcanoes/Earthquakes (2.5h)', gs2: 'History - Partition & Independence (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Plate boundaries (20m)', maths: 'ODE - First order equations (2h)', csat: 'None' },
  '2026-02-17': { gs1: 'Geography - Geomorphology: Landforms (Fluvial/Aeolian) (2h)', gs2: 'History - Governor Generals List (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Landforms agents (20m)', maths: 'ODE - Linear diff equations (1.5h)', csat: 'None' },
  '2026-02-18': { gs1: 'Geography - Climatology: Atmosphere structure (2.5h)', gs2: 'History - Tribal/Peasant Uprisings (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Atmosphere Layers (15m)', maths: 'ODE - Higher order (2h)', csat: 'None' },
  '2026-02-19': { gs1: 'Geography - Climatology: Winds & Pressure Belts (2h)', gs2: 'History - Education & Press Acts (1.5h)', ca: 'Newspaper + tagging (45m)', revision: 'Wind belts (20m)', maths: 'Maths OFF (Test Day)', csat: 'None' },
  '2026-02-20': { gs1: 'Geography - Climatology: Cyclones (Temperate/Tropical) (2h)', gs2: 'History - Ancient: IVC Sites (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Cyclone Formation (20m)', maths: 'Statics - Forces in 2D (2h)', csat: 'None' },
  '2026-02-21': { gs1: 'Geography - Oceanography: Relief & Salinity (2.5h)', gs2: 'History - Ancient: Vedic Age (1.5h)', ca: 'Weekly Recap (1.5h)', revision: 'Ocean Currents Map (20m)', maths: 'Statics - Friction (2h)', csat: 'None' },
  '2026-02-22': { gs1: 'Geography - Oceanography: Currents & Tides (2h)', gs2: 'History - Ancient: Buddhism/Jainism (1.5h)', ca: 'Newspaper + Editorial (1h)', revision: 'Map Work: Currents (30m)', maths: 'Maths OFF (30m)', csat: 'CSAT Practice 4 (1h)' },

  // WEEK 5: Indian Geography & Medieval History
  '2026-02-23': { gs1: 'Geography - Indian Phys: Himalayas (2.5h)', gs2: 'History - Ancient: Mauryas (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Mountain Passes (20m)', maths: 'Statics - Virtual Work (2h)', csat: 'None' },
  '2026-02-24': { gs1: 'Geography - Indian Phys: Northern Plains (2h)', gs2: 'History - Ancient: Gupta Age (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Soil Types (15m)', maths: 'Dynamics - Kinematics (1.5h)', csat: 'None' },
  '2026-02-25': { gs1: 'Geography - Indian Phys: Peninsular Plateau (2.5h)', gs2: 'History - Ancient: Post-Gupta (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'River Basins (20m)', maths: 'Dynamics - SHM (2h)', csat: 'None' },
  '2026-02-26': { gs1: 'Geography - Indian Drainage: Himalayan Rivers (2h)', gs2: 'History - Medieval: Delhi Sultanate (1.5h)', ca: 'Newspaper + tagging (45m)', revision: 'River Tributaries (20m)', maths: 'Maths OFF (Test Day)', csat: 'None' },
  '2026-02-27': { gs1: 'Geography - Indian Drainage: Peninsular Rivers (2h)', gs2: 'History - Medieval: Mughals (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Drainage Patterns (15m)', maths: 'Dynamics - Projectiles (2h)', csat: 'None' },
  '2026-02-28': { gs1: 'Geography - Indian Climate: Monsoon (2.5h)', gs2: 'History - Medieval: Vijayanagara (1.5h)', ca: 'Weekly Recap (1.5h)', revision: 'Monsoon Mechanism (20m)', maths: 'Dynamics - Central Orbits (2h)', csat: 'None' },
  '2026-03-01': { gs1: 'Geography - Indian Vegetation & Soils (2h)', gs2: 'History - Medieval: Bhakti/Sufi (1.5h)', ca: 'Newspaper + Editorial (1h)', revision: 'National Parks Map (30m)', maths: 'Maths OFF (30m)', csat: 'CSAT Practice 5 (1h)' },

  // WEEK 6: Environment & Art/Culture
  '2026-03-02': { gs1: 'Environment - Ecology: Ecosystems, Functions (2.5h)', gs2: 'History - Art & Culture: Architecture (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Ecotones (15m)', maths: 'Vector Analysis - Differentiation (2h)', csat: 'None' },
  '2026-03-03': { gs1: 'Environment - Biodiversity: Levels, Threats (2h)', gs2: 'History - Art & Culture: Painting/Dance (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Bio-Hotspots (20m)', maths: 'Vector Analysis - Gradient/Divergence (1.5h)', csat: 'None' },
  '2026-03-04': { gs1: 'Environment - Pollution: Air/Water/Solid Waste (2.5h)', gs2: 'History - Art & Culture: Literature/Music (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Pollutants Table (20m)', maths: 'Vector Analysis - Integration (2h)', csat: 'None' },
  '2026-03-05': { gs1: 'Environment - Climate Change: Basics, Organizations (2h)', gs2: 'History - Art & Culture: UNESCO sites (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'GHGs (15m)', maths: 'Vector Analysis - Theorems (2h)', csat: 'None' },
  '2026-03-06': { gs1: 'Environment - Climate Change: Kyoto/Paris/COP (2h)', gs2: 'Geography - Resources: Minerals/Energy (1.5h)', ca: 'Newspaper + tagging (45m)', revision: 'Kyoto/Paris (20m)', maths: 'Dynamics - Newton laws (2h)', csat: 'None' },
  '2026-03-07': { gs1: 'Environment - Laws/Acts (WPA, EPA, Forest) (2h)', gs2: 'Geography - Transport & Industry (1h)', ca: 'Newspaper + tagging (1h)', revision: 'EIA process (15m)', maths: 'Mechanics - Work/Energy (2h)', csat: 'None' },
  '2026-03-08': { gs1: 'REVISION - Environment Full (3h)', gs2: 'REVISION - Geography Maps (30m)', ca: 'CA mapping (15m)', revision: '-', maths: 'Maths OFF or review (30m)', csat: 'CSAT Mock 6' },

  // WEEK 7: Economy & Science
  '2026-03-09': { gs1: 'Economy - Macro: GDP/GNP, Growth (2.5h)', gs2: 'Science - Biology: Cells, Disease (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'GDP methods (20m)', maths: 'Dynamics - Circular motion (2h)', csat: 'None' },
  '2026-03-10': { gs1: 'Economy - Monetary Policy: RBI, Banking (2h)', gs2: 'Science - Biology: Human Systems (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'RBI instruments (15m)', maths: 'Maths OFF or review (30m)', csat: 'None' },
  '2026-03-11': { gs1: 'Economy - Inflation: Types, Indices (2h)', gs2: 'Science - Physics: Light, Sound (1.5h)', ca: 'Newspaper + tagging + PYQ (45m)', revision: 'Phillips curve (20m)', maths: 'Statics - Equilibrium (2h)', csat: 'None' },
  '2026-03-12': { gs1: 'Economy - Fiscal Policy: Budget, Tax (2h)', gs2: 'Science - Chem: Materials, Atoms (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Budget cycle (15m)', maths: 'Mechanics - Stress/Strain (1.5h)', csat: 'None' },
  '2026-03-13': { gs1: 'Economy - Public Finance & Deficits (2h)', gs2: 'Science - Tech: Space, Defence (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Deficit types (15m)', maths: 'Maths OFF (30m)', csat: 'None' },
  '2026-03-14': { gs1: 'Economy - External Sector: BoP, Forex (2.5h)', gs2: 'Science - Tech: Biotech, Nano (1.5h)', ca: 'Weekly Recap (1.5h)', revision: 'Economy Terms (20m)', maths: 'Algebra - Groups (2h)', csat: 'None' },
  '2026-03-15': { gs1: 'Economy - International Org: WTO, IMF (2h)', gs2: 'Science - Tech: IT, AI, Robotics (1.5h)', ca: 'Newspaper + Editorial (1h)', revision: 'WTO boxes (15m)', maths: 'Maths OFF (30m)', csat: 'CSAT Practice 6 (1h)' },

  // WEEK 8: Schemes & Final Blocks
  '2026-03-16': { gs1: 'Economy - Agriculture: MSP, Subsidies (2.5h)', gs2: 'Govt Schemes - Social Sector (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'MSP Crops (20m)', maths: 'Algebra - Rings/Fields (2h)', csat: 'None' },
  '2026-03-17': { gs1: 'Economy - Industry & Infrastructure (2h)', gs2: 'Govt Schemes - Infra/Econ (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Infra Models (15m)', maths: 'Algebra - Vector Spaces (1.5h)', csat: 'None' },
  '2026-03-18': { gs1: 'Economy - Inclusive Growth & Poverty (2.5h)', gs2: 'Reports & Indices (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Poverty Comm (15m)', maths: 'Real Analysis - Seq/Series (2h)', csat: 'None' },
  '2026-03-19': { gs1: 'Environment - Current Affairs Focus (2h)', gs2: 'International Relations: Neighbors (1.5h)', ca: 'Newspaper + tagging (45m)', revision: 'IR Map (20m)', maths: 'Maths OFF (Test Day)', csat: 'None' },
  '2026-03-20': { gs1: 'Environment - Species in News (2h)', gs2: 'International Relations: West Asia (1.5h)', ca: 'Newspaper + tagging (1h)', revision: 'Red Data Book (20m)', maths: 'Real Analysis - Convergence (2h)', csat: 'None' },
  '2026-03-21': { gs1: 'Polity - Current Affairs Updates (2.5h)', gs2: 'International Relations: Organizations (1.5h)', ca: 'Weekly Recap (1.5h)', revision: 'Polity Updates (20m)', maths: 'Complex Analysis (2h)', csat: 'None' },
  '2026-03-22': { gs1: 'Economy - Survey & Budget Summary (2h)', gs2: 'Mapping: World Geography (1.5h)', ca: 'Newspaper + Editorial (1h)', revision: 'Budget Highlights (20m)', maths: 'Maths OFF (30m)', csat: 'CSAT Practice 7 (1h)' },

  // WEEK 9: Intensive Revision Phase 1 (Polity/History)
  '2026-03-23': { gs1: 'REVISION - Polity: FR/DPSP/Parl (3h)', gs2: 'REVISION - History: Modern (2h)', ca: 'CA Revision: June-Aug (1h)', revision: 'Test Analysis (30m)', maths: 'LPP (2h)', csat: 'None' },
  '2026-03-24': { gs1: 'REVISION - Polity: Bodies/Exec (3h)', gs2: 'REVISION - History: Ancient (2h)', ca: 'CA Revision: Sep-Nov (1h)', revision: 'Key Articles (30m)', maths: 'Numerical Analysis (2h)', csat: 'None' },
  '2026-03-25': { gs1: 'REVISION - Polity: Local/Federal (3h)', gs2: 'REVISION - History: Medieval (2h)', ca: 'CA Revision: Dec-Feb (1h)', revision: 'Amendments (30m)', maths: 'Maths Revision (2h)', csat: 'None' },
  '2026-03-26': { gs1: 'REVISION - History: Art & Culture (3h)', gs2: 'Mapping - India Physical (1.5h)', ca: 'Current Affairs Mocks (1h)', revision: 'Culture Terms (20m)', maths: 'Maths OFF (Test Day)', csat: 'None' },
  '2026-03-27': { gs1: 'REVISION - History: Modern Personalities (2h)', gs2: 'Mapping - World Physical (1.5h)', ca: 'Newspaper (1h)', revision: 'Acts Recap (20m)', maths: 'Maths Revision (2h)', csat: 'None' },
  '2026-03-28': { gs1: 'FULL MOCK PREP - GS (3h)', gs2: 'FULL MOCK PREP - CSAT (2h)', ca: 'Quick Formulas (1h)', revision: 'Mental Prep', maths: 'Maths OFF', csat: 'CSAT Formulas' },
  '2026-03-29': { gs1: 'Vajiram Sectional Prep (2h)', gs2: 'Weak Areas Analysis (2h)', ca: 'Newspaper (1h)', revision: '-', maths: 'Maths OFF', csat: 'None' },

  // WEEK 10: Intensive Revision Phase 2 (Geog/Env)
  '2026-03-30': { gs1: 'REVISION - Geography: Physical (3h)', gs2: 'REVISION - Environment: Concepts (2h)', ca: 'CA Revision: March (1h)', revision: 'Geog Terms (30m)', maths: 'Maths Revision (2h)', csat: 'None' },
  '2026-03-31': { gs1: 'REVISION - Geography: Indian (3h)', gs2: 'REVISION - Environment: Acts/Bodies (2h)', ca: 'CA Revision: April (1h)', revision: 'Env Laws (30m)', maths: 'Maths Revision (2h)', csat: 'None' },
  '2026-04-01': { gs1: 'REVISION - Geography: Maps/Location (3h)', gs2: 'REVISION - Environment: Current (2h)', ca: 'Newspaper (1h)', revision: 'Map Locations (30m)', maths: 'Maths Revision (2h)', csat: 'None' },
  '2026-04-02': { gs1: 'REVISION - Science: Bio/Tech (3h)', gs2: 'REVISION - IR (2h)', ca: 'Newspaper (1h)', revision: 'Sci Terms (20m)', maths: 'Maths Revision (2h)', csat: 'None' },
  '2026-04-03': { gs1: 'REVISION - Science: Physics/Chem (2h)', gs2: 'REVISION - Schemes (2h)', ca: 'Newspaper (1h)', revision: 'Schemes Data (20m)', maths: 'Maths Revision (2h)', csat: 'None' },
  '2026-04-04': { gs1: 'FULL MOCK PREP - GS (3h)', gs2: 'CSAT Logical Reasoning (2h)', ca: 'Quick Recap', revision: '-', maths: 'Maths OFF', csat: 'CSAT Practice' },
  '2026-04-05': { gs1: 'Buffer / Backlog Day (3h)', gs2: 'Map Work (2h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'None' },

  // WEEK 11: Intensive Revision Phase 3 (Econ) & Full Tests
  '2026-04-06': { gs1: 'REVISION - Economy: Macro/Money (3h)', gs2: 'REVISION - Economy: Budget/Survey (2h)', ca: 'Newspaper (1h)', revision: 'Macro Curves (30m)', maths: 'Maths Formula Review (1h)', csat: 'None' },
  '2026-04-07': { gs1: 'REVISION - Economy: Sectors (3h)', gs2: 'REVISION - Polity: Weak Areas (2h)', ca: 'Newspaper (1h)', revision: 'Data Points (20m)', maths: 'Maths Formula Review (1h)', csat: 'None' },
  '2026-04-08': { gs1: 'Full Test Prep - Revision (3h)', gs2: 'CSAT English Comp (2h)', ca: 'Newspaper (1h)', revision: 'Mental Prep', maths: 'Maths OFF', csat: 'CSAT Practice' },
  '2026-04-09': { gs1: 'GS Full Length Test Analysis (3h)', gs2: 'CSAT Test Analysis (2h)', ca: 'Error Log Update', revision: '-', maths: 'Maths OFF', csat: 'Vajiram FLT 1' },
  '2026-04-10': { gs1: 'Weak Area Fixing: GS (3h)', gs2: 'Weak Area Fixing: CSAT (2h)', ca: 'Newspaper (1h)', revision: '-', maths: 'Maths Revision (1h)', csat: 'None' },
  '2026-04-11': { gs1: 'REVISION - History: Chronology (3h)', gs2: 'REVISION - Art & Culture (2h)', ca: 'Newspaper (1h)', revision: 'Timeline (20m)', maths: 'Maths Revision (1h)', csat: 'None' },
  '2026-04-12': { gs1: 'Internal Mock 1 Prep (3h)', gs2: 'CSAT Formula Revision (2h)', ca: '-', revision: '-', maths: 'Maths OFF', csat: 'Prep' },

  // WEEK 12: Simulations
  '2026-04-13': { gs1: 'Internal Mock 1 Analysis (3h)', gs2: 'Fixing Errors (2h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'Mock 1' },
  '2026-04-14': { gs1: 'REVISION - Geography: Maps (3h)', gs2: 'REVISION - Env: Updates (2h)', ca: 'Newspaper (1h)', revision: 'Maps (20m)', maths: 'Maths Formula Review (1h)', csat: 'None' },
  '2026-04-15': { gs1: 'Full Test Prep - Revision (3h)', gs2: 'CSAT Math (2h)', ca: 'Newspaper (1h)', revision: '-', maths: 'Maths OFF', csat: 'Prep' },
  '2026-04-16': { gs1: 'GS Full Length Test Analysis (3h)', gs2: 'CSAT Test Analysis (2h)', ca: 'Error Log Update', revision: '-', maths: 'Maths OFF', csat: 'Vajiram FLT 2' },
  '2026-04-17': { gs1: 'Weak Area Fixing: Polity/Econ (3h)', gs2: 'Weak Area Fixing: Hist/Geog (2h)', ca: 'Newspaper (1h)', revision: '-', maths: 'Maths Revision (1h)', csat: 'None' },
  '2026-04-18': { gs1: 'REVISION - Economy Data (3h)', gs2: 'REVISION - Sci Tech (2h)', ca: 'Newspaper (1h)', revision: '-', maths: 'Maths Revision (1h)', csat: 'None' },
  '2026-04-19': { gs1: 'Internal Mock 2 Analysis (3h)', gs2: 'Fixing Errors (2h)', ca: '-', revision: '-', maths: 'Maths OFF', csat: 'Mock 2' },

  // WEEK 13: Final Sprint Begins
  '2026-04-20': { gs1: 'REVISION - Current Affairs Year Round (3h)', gs2: 'Static Revision: Polity (2h)', ca: 'Newspaper (1h)', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-04-21': { gs1: 'REVISION - Current Affairs Year Round (3h)', gs2: 'Static Revision: History (2h)', ca: 'Newspaper (1h)', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-04-22': { gs1: 'Full Test Prep (3h)', gs2: 'CSAT Practice (2h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'Prep' },
  '2026-04-23': { gs1: 'GS Full Length Test Analysis (3h)', gs2: 'Weak Area Fix (2h)', ca: 'Error Log', revision: '-', maths: 'Maths OFF', csat: 'Vajiram FLT 3' },
  '2026-04-24': { gs1: 'Static Revision: Geography (3h)', gs2: 'Static Revision: Environment (2h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-04-25': { gs1: 'Static Revision: Economy (3h)', gs2: 'Static Revision: Science (2h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-04-26': { gs1: 'Internal Mock 3 Analysis (3h)', gs2: 'Fixing Errors (2h)', ca: '-', revision: '-', maths: 'Maths OFF', csat: 'Mock 3' },

  // WEEK 14: Consolidation
  '2026-04-27': { gs1: 'Polity: Cramming Articles/Schedules (3h)', gs2: 'History: Cramming Dates/Events (2h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-04-28': { gs1: 'Geog: Cramming Maps/Locations (3h)', gs2: 'Env: Cramming Acts/Bodies (2h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-04-29': { gs1: 'Full Test Prep (3h)', gs2: 'CSAT Practice (2h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'Prep' },
  '2026-04-30': { gs1: 'GS Full Length Test Analysis (3h)', gs2: 'Weak Area Fix (2h)', ca: 'Error Log', revision: '-', maths: 'Maths OFF', csat: 'Vajiram FLT 4' },
  '2026-05-01': { gs1: 'Econ: Cramming Data/Schemes (3h)', gs2: 'Sci: Cramming Tech terms (2h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-02': { gs1: 'Mixed Bag Revision (3h)', gs2: 'CSAT Mock (2h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-03': { gs1: 'Internal Mock 4 Analysis (3h)', gs2: 'Fixing Errors (2h)', ca: '-', revision: '-', maths: 'Maths OFF', csat: 'Mock 4' },

  // WEEK 15: PYQ Focus
  '2026-05-04': { gs1: 'PYQ Analysis: 2011-2015 (3h)', gs2: 'Theme: Polity/Hist (2h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-05': { gs1: 'PYQ Analysis: 2016-2020 (3h)', gs2: 'Theme: Geog/Env (2h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-06': { gs1: 'PYQ Analysis: 2021-2025 (3h)', gs2: 'Theme: Econ/Sci (2h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-07': { gs1: 'Option Elimination Tricks (2h)', gs2: 'CSAT PYQ (2h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-08': { gs1: 'High Yield Topics: Reports (2h)', gs2: 'High Yield: Indices (2h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-09': { gs1: 'High Yield Topics: Maps (2h)', gs2: 'CSAT Mock (2h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-10': { gs1: 'Internal Mock 5 Analysis (3h)', gs2: 'Fixing Errors (2h)', ca: '-', revision: '-', maths: 'Maths OFF', csat: 'Mock 5' },

  // WEEK 16: Final Lap
  '2026-05-11': { gs1: 'Final Revision: Polity (3h)', gs2: 'Final Revision: History (2h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-12': { gs1: 'Final Revision: Geography (3h)', gs2: 'Final Revision: Environment (2h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-13': { gs1: 'Final Revision: Economy (3h)', gs2: 'Final Revision: Science (2h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-14': { gs1: 'Final Revision: Current Affairs (3h)', gs2: 'CSAT Light Practice (1h)', ca: 'Newspaper', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-15': { gs1: 'Fact Sheet Memorization (3h)', gs2: 'Map Memorization (2h)', ca: '-', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-16': { gs1: 'Stress Mgmt & Light Read (2h)', gs2: 'CSAT Formula Look (1h)', ca: '-', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-17': { gs1: 'Internal Mock 6 Analysis (3h)', gs2: 'Confidence Building', ca: '-', revision: '-', maths: 'Maths OFF', csat: 'Mock 6' },

  // WEEK 17: Exam Week
  '2026-05-18': { gs1: 'Very Light Revision: Polity (2h)', gs2: 'Sleep Schedule Fix', ca: '-', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-19': { gs1: 'Very Light Revision: History (2h)', gs2: 'Relaxation', ca: '-', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-20': { gs1: 'Very Light Revision: Geog/Env (2h)', gs2: 'Logistics Check', ca: '-', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-21': { gs1: 'Very Light Revision: Econ/Sci (2h)', gs2: 'Admit Card Print', ca: '-', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-22': { gs1: 'No Study / Light Scan', gs2: 'Rest', ca: '-', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-23': { gs1: 'ABSOLUTE REST', gs2: 'Meditation', ca: '-', revision: '-', maths: 'Maths OFF', csat: 'None' },
  '2026-05-24': { gs1: 'PRELIMS EXAM DAY', gs2: 'All the Best!', ca: '-', revision: '-', maths: '-', csat: 'GS + CSAT' },
};

// --- Helper Functions ---
const formatDate = (date: Date) => date.toISOString().split('T')[0];
const getDayName = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });

const generateInitialSchedule = () => {
  const schedule: ScheduleRow[] = [];
  let currentDate = new Date(START_DATE);

  for (let i = 0; i < TOTAL_DAYS; i++) {
    const dateStr = formatDate(currentDate);
    const dayName = getDayName(dateStr);
    
    // 1. Get Vajiram Test Data (Preserved)
    const test = TEST_SCHEDULE.find(t => t.date === dateStr);
    
    // 2. Get Excel Data (Populated)
    const excelData = FULL_SCHEDULE_DATA[dateStr];

    // 3. Construct Row with Fallbacks for late-March/April/May if not yet in CSV
    // (Though currently only late March/April are missing, the generator handles it gracefully)
    const gs1 = excelData?.gs1 || `Revision / Mock Prep (Day ${i+1})`;
    const gs2 = excelData?.gs2 || `Value Addition`;
    const maths = excelData?.maths || `Maths Revision`;
    const ca = excelData?.ca || "Daily News Analysis (1h)";
    const revision = excelData?.revision || "Topic Revision (30m)";
    const csat = excelData?.csat || "None"; 

    schedule.push({
      id: dateStr,
      date: dateStr,
      day: dayName,
      gs1: gs1,
      gs2: gs2,
      ca: ca,
      revision: revision,
      maths: maths,
      csat: csat,
      test: test ? test.name : '',
      testType: test ? test.type : '',
      testColor: test ? test.color : '',
      status: 'Not Started',
      notes: ''
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return schedule;
};

const callGemini = async (prompt: string, retries = 3, delay = 1000): Promise<string> => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!response.ok) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return callGemini(prompt, retries - 1, delay * 2);
      }
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to fetch response from Gemini. Please try again.";
  }
};

// --- Components ---
const AIModal = ({ isOpen, onClose, content, loading, title }: { isOpen: boolean, onClose: () => void, content: string, loading: boolean, title: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <Sparkles className="w-5 h-5 text-indigo-600 mr-2" />
            {title}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
              <p className="font-medium">Consulting Gemini...</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">{content}</div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-center">Powered by Gemini 2.5 Flash</div>
      </div>
    </div>
  );
};

const DonutChart = ({ value, color, label }: { value: number, color: string, label: string }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="transform -rotate-90 w-24 h-24">
          <circle cx="48" cy="48" r={radius} stroke="#e5e7eb" strokeWidth="8" fill="transparent" />
          <circle cx="48" cy="48" r={radius} stroke={color} strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">{Math.round(value)}%</div>
      </div>
      <span className="text-xs text-gray-500 mt-2 font-medium">{label}</span>
    </div>
  );
};

const SimpleBarChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
  const maxValue = Math.max(...data.map(d => d.value), 10);
  return (
    <div className="h-48 flex items-end justify-between space-x-2 w-full p-4 border rounded-lg bg-white shadow-sm">
      {data.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center w-full group">
           <div className="relative w-full flex justify-center">
             <div className={`w-4/5 rounded-t-sm transition-all duration-500 ${item.color}`} style={{ height: `${(item.value / maxValue) * 150}px`, minHeight: '4px' }}></div>
             <div className="absolute -top-6 opacity-0 group-hover:opacity-100 text-xs bg-black text-white px-1 rounded transition-opacity">{item.value}</div>
           </div>
           <span className="text-[10px] mt-2 font-medium text-gray-500 truncate w-full text-center">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');
  const [scheduleData, setScheduleData] = useState<ScheduleRow[]>([]);
  const [syllabusData, setSyllabusData] = useState<SyllabusItem[]>(INITIAL_SYLLABUS);
  const [testData, setTestData] = useState<TestItem[]>(TEST_SCHEDULE);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpanded, setIsExpanded] = useState(false); 

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalContent, setAiModalContent] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth failed", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'study_data', 'full_state');
    
    getDoc(userDocRef).then((docSnap) => {
      if (!docSnap.exists()) {
        const defaultData = { schedule: generateInitialSchedule(), syllabus: INITIAL_SYLLABUS, tests: TEST_SCHEDULE };
        setDoc(userDocRef, defaultData).then(() => {
            setScheduleData(defaultData.schedule);
            setSyllabusData(defaultData.syllabus);
            setTestData(defaultData.tests);
            setLoading(false);
        });
      }
    });

    const unsubData = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (scheduleData.length === 0) {
            setScheduleData(data.schedule || []);
            setSyllabusData(data.syllabus || []);
            setTestData(data.tests || []);
            setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }, (err) => {
        console.error("Data fetch error", err);
        setLoading(false);
    });
    return () => unsubData();
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = PRELIMS_DATE.getTime() - now;
      if (distance < 0) {
        setTimeLeft("EXAM STARTED");
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setTimeLeft(`${days}d ${hours}h left`);
      }
    }, 1000 * 60);
    
    const now = new Date().getTime();
    const distance = PRELIMS_DATE.getTime() - now;
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    setTimeLeft(`${days} days to Prelims`);
    return () => clearInterval(timer);
  }, []);

  const saveDataToFirebase = useCallback(async (newSchedule: any[], newSyllabus: any[]) => {
    if (!user) return;
    setSaving(true);
    try {
      const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'study_data', 'full_state');
      await setDoc(userDocRef, {
        schedule: newSchedule,
        syllabus: newSyllabus,
        tests: testData,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  }, [user, testData]);

  // Handle Reset to New Template
  const handleReset = async () => {
    if (!user) return;
    if (confirm("Reset schedule to latest template? This will erase current notes/status.")) {
        setLoading(true);
        const newData = { schedule: generateInitialSchedule(), syllabus: INITIAL_SYLLABUS, tests: TEST_SCHEDULE };
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'study_data', 'full_state'), newData);
        setScheduleData(newData.schedule);
        setSyllabusData(newData.syllabus);
        setTestData(newData.tests);
        setLoading(false);
    }
  }

  const updateSchedule = (id: string, field: string, value: string) => {
    const newData = scheduleData.map(row => row.id === id ? { ...row, [field]: value } : row);
    setScheduleData(newData);
    const timeoutId = setTimeout(() => saveDataToFirebase(newData, syllabusData), 1000);
    return () => clearTimeout(timeoutId);
  };

  // Cycle: Not Started -> In Progress -> Completed -> Backlog
  const cycleStatus = (id: string, currentStatus: string) => {
    let nextStatus = 'Not Started';
    if (currentStatus === 'Not Started') nextStatus = 'In Progress';
    else if (currentStatus === 'In Progress') nextStatus = 'Completed';
    else if (currentStatus === 'Completed') nextStatus = 'Backlog';
    else if (currentStatus === 'Backlog') nextStatus = 'Not Started';
    
    updateSchedule(id, 'status', nextStatus);
  };

  const updateSyllabus = (index: number, status: string) => {
    const newData = [...syllabusData];
    newData[index].status = status;
    setSyllabusData(newData);
    saveDataToFirebase(scheduleData, newData);
  };

  const handleExplainTopic = async (topic: string) => {
    setAiTitle(`Topic Tutor: ${topic.slice(0, 30)}...`);
    setAiModalOpen(true);
    setAiLoading(true);
    setAiModalContent('');
    const prompt = `I am preparing for UPSC CSE Prelims 2026. Explain the topic "${topic}" concisely.\n1. Give a 2-sentence summary.\n2. Provide 3 high-yield bullet points for Prelims.\n3. Suggest a mnemonic to remember key facts if possible.\nKeep it strictly relevant to UPSC syllabus.`;
    const result = await callGemini(prompt);
    setAiModalContent(result);
    setAiLoading(false);
  };

  const handleAnalyzeProgress = async (stats: any) => {
    setAiTitle("AI Study Strategist");
    setAiModalOpen(true);
    setAiLoading(true);
    setAiModalContent('');
    const prompt = `I am a UPSC CSE 2026 aspirant. Here is my current progress:\n- Completion: ${stats.progress.toFixed(1)}% (${stats.completed}/${TOTAL_DAYS} days)\n- Tasks In Progress: ${stats.inProgress}\n- Subject Breakdown: ${JSON.stringify(stats.subjectData.map((s:any) => `${s.label}: ${s.value}`))}\nAct as an elite UPSC coach. Provide:\n1. A brief, hard-hitting analysis of my current pace.\n2. One specific strategic adjustment I should make this week.\n3. A short motivational quote tailored to my situation.`;
    const result = await callGemini(prompt);
    setAiModalContent(result);
    setAiLoading(false);
  };

  const stats = useMemo(() => {
    const totalTasks = scheduleData.length;
    const completed = scheduleData.filter(d => d.status === 'Completed').length;
    const inProgress = scheduleData.filter(d => d.status === 'In Progress').length;
    const progress = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;
    const subjectData = [
      { label: 'Polity', value: 25, color: 'bg-blue-500' },
      { label: 'History', value: 20, color: 'bg-amber-600' },
      { label: 'Geog', value: 15, color: 'bg-green-500' },
      { label: 'Econ', value: 10, color: 'bg-purple-500' },
      { label: 'Maths', value: 30, color: 'bg-red-500' },
    ];
    return { completed, inProgress, progress, subjectData };
  }, [scheduleData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-500 font-medium">
        <div className="animate-spin mr-3"><Clock size={24} /></div>
        Loading Study Dashboard...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans text-gray-800">
      <AIModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} content={aiModalContent} loading={aiLoading} title={aiTitle} />
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><Calendar size={20} /></div>
          <div><h1 className="text-lg font-bold text-gray-900 leading-tight">UPSC CSE 2026</h1><p className="text-xs text-gray-500 font-medium">Interactive Tracker • Vajiram Integrated</p></div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-end"><span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Time Remaining</span><span className="text-xl font-mono font-bold text-blue-600">{timeLeft}</span></div>
          <div className="h-8 w-px bg-gray-200 mx-2"></div>
          <div className="flex items-center space-x-2">
            {saving ? <span className="text-xs text-blue-500 flex items-center animate-pulse"><Save size={12} className="mr-1" /> Saving...</span> : <span className="text-xs text-green-500 flex items-center"><CheckSquare size={12} className="mr-1" /> Saved</span>}
            <button onClick={handleReset} className="text-xs text-gray-500 hover:text-red-500 flex items-center ml-2" title="Reset to Template">
                <RefreshCw size={12} className="mr-1" /> Reset
            </button>
          </div>
        </div>
      </header>
      <div className="bg-white border-b border-gray-200 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
          {[{ id: 'schedule', label: 'Daily Schedule', icon: FileSpreadsheet }, { id: 'tests', label: 'Test Series', icon: Target }, { id: 'progress', label: 'Dashboard', icon: BarChart3 }, { id: 'syllabus', label: 'Syllabus', icon: BookOpen }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <tab.icon size={16} /><span>{tab.label}</span>
            </button>
          ))}
        </div>
        {activeTab === 'schedule' && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isExpanded ? "Compact View" : "Expand Text"}</span>
          </button>
        )}
      </div>
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'schedule' && (
          <div className="h-full overflow-auto bg-white">
            <div className="min-w-[2200px]"> 
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <tr>
                    <th className="border-b border-r px-4 py-3 w-24">Date</th>
                    <th className="border-b border-r px-4 py-3 w-16">Day</th>
                    <th className="border-b border-r px-4 py-3 w-56">GS Subject 1</th>
                    <th className="border-b border-r px-4 py-3 w-48">GS Subject 2</th>
                    <th className="border-b border-r px-4 py-3 w-48">Current Affairs</th>
                    <th className="border-b border-r px-4 py-3 w-48">Revision</th>
                    <th className="border-b border-r px-4 py-3 w-48 bg-red-50 text-red-800 border-red-100">Maths / Optional</th>
                    <th className="border-b border-r px-4 py-3 w-32">CSAT</th>
                    <th className="border-b border-r px-4 py-3 w-56 bg-yellow-50 text-yellow-800 border-yellow-100">Vajiram Test</th>
                    <th className="border-b border-r px-4 py-3 w-32">Status</th>
                    <th className="border-b px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scheduleData.map((row) => (
                    <tr 
                      key={row.id} 
                      className={`transition-colors duration-200
                        ${row.status === 'Completed' ? 'bg-green-50/50' : 
                          row.status === 'In Progress' ? 'bg-yellow-50/50' : 
                          row.status === 'Backlog' ? 'bg-red-50/50' : 
                          'hover:bg-gray-50'}
                        ${row.test ? 'bg-yellow-50/30' : ''}
                      `}
                    >
                      <td className={`px-4 py-2 border-r font-medium ${row.test ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>{new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                      <td className="px-4 py-2 border-r text-gray-500 align-top">{row.day}</td>
                      
                      {/* GS 1 */}
                      <td className={`px-4 py-2 border-r relative group align-top ${isExpanded ? 'whitespace-normal' : 'truncate max-w-[200px]'}`}>
                        <div className="flex items-start justify-between">
                          <span title={row.gs1}>{row.gs1}</span>
                          <button onClick={() => handleExplainTopic(row.gs1)} className="opacity-0 group-hover:opacity-100 p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all shrink-0 ml-1" title="Explain with AI"><Sparkles size={14} /></button>
                        </div>
                      </td>
                      {/* GS 2 */}
                      <td className={`px-4 py-2 border-r relative group align-top ${isExpanded ? 'whitespace-normal' : 'truncate max-w-[200px]'}`}>
                        <div className="flex items-start justify-between">
                          <span title={row.gs2}>{row.gs2}</span>
                          <button onClick={() => handleExplainTopic(row.gs2)} className="opacity-0 group-hover:opacity-100 p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all shrink-0 ml-1" title="Explain with AI"><Sparkles size={14} /></button>
                        </div>
                      </td>
                      {/* Current Affairs (Restored) */}
                      <td className={`px-4 py-2 border-r text-gray-600 align-top ${isExpanded ? 'whitespace-normal' : 'truncate max-w-[200px]'}`}>
                        <span title={row.ca}>{row.ca}</span>
                      </td>
                      {/* Revision (Restored) */}
                      <td className={`px-4 py-2 border-r text-gray-600 align-top ${isExpanded ? 'whitespace-normal' : 'truncate max-w-[200px]'}`}>
                        <span title={row.revision}>{row.revision}</span>
                      </td>

                      {/* Maths */}
                      <td className={`px-4 py-2 border-r font-medium text-gray-700 bg-red-50/20 relative group align-top ${isExpanded ? 'whitespace-normal' : 'truncate max-w-[200px]'}`}>
                        <div className="flex items-start justify-between">
                          <span title={row.maths}>{row.maths}</span>
                          <button onClick={() => handleExplainTopic(row.maths)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all shrink-0 ml-1" title="Explain with AI"><Sparkles size={14} /></button>
                        </div>
                      </td>

                      {/* CSAT (Restored) */}
                      <td className={`px-4 py-2 border-r text-gray-500 align-top ${isExpanded ? 'whitespace-normal' : 'truncate max-w-[150px]'}`}>
                        {row.csat}
                      </td>
                      
                      {/* Vajiram Test */}
                      <td className="px-4 py-2 border-r bg-yellow-50/50 align-top">
                        {row.test ? (
                          <div className={`text-xs px-2 py-1 rounded border font-medium inline-block whitespace-normal leading-tight ${row.testType === 'Sectional' ? 'bg-blue-100 text-blue-800 border-blue-200' : row.testType === 'Comprehensive' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : row.testType === 'Full Length' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                            {row.test}
                          </div>
                        ) : <span className="text-gray-300">-</span>}
                      </td>

                      <td className="px-2 py-2 border-r align-top">
                        <button
                          onClick={() => cycleStatus(row.id, row.status)}
                          className={`w-full flex items-center justify-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm border
                            ${row.status === 'Completed' 
                              ? 'bg-green-500 text-white border-green-600 hover:bg-green-600' 
                              : row.status === 'In Progress' 
                              ? 'bg-yellow-400 text-yellow-900 border-yellow-500 hover:bg-yellow-500' 
                              : row.status === 'Backlog'
                              ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                              : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                          `}
                        >
                          {row.status === 'Completed' ? <CheckCircle2 size={12} /> : 
                           row.status === 'In Progress' ? <PlayCircle size={12} /> : 
                           row.status === 'Backlog' ? <AlertCircle size={12} /> :
                           <Circle size={12} />}
                          <span>{row.status}</span>
                        </button>
                      </td>

                      <td className="px-2 py-2 align-top">
                        <textarea
                          value={row.notes}
                          onChange={(e) => updateSchedule(row.id, 'notes', e.target.value)}
                          placeholder="Notes..."
                          rows={isExpanded ? 3 : 1}
                          className={`w-full text-xs bg-transparent border-0 focus:ring-0 placeholder-gray-300 text-gray-700 resize-none ${isExpanded ? '' : 'truncate'}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'tests' && (
          <div className="p-8 max-w-5xl mx-auto h-full overflow-auto">
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50"><h2 className="font-bold text-gray-800 flex items-center"><Target className="mr-2 text-blue-600" size={20}/> Vajiram & Mock Schedule</h2><div className="flex space-x-2 text-xs font-medium"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Sectional</span><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Comprehensive</span><span className="px-2 py-1 bg-green-100 text-green-800 rounded">Full Length</span><span className="px-2 py-1 bg-red-100 text-red-800 rounded">Mock</span></div></div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-semibold border-b"><tr><th className="px-6 py-3 text-left w-32">Date</th><th className="px-6 py-3 text-left">Test Name</th><th className="px-6 py-3 text-left w-32">Type</th><th className="px-6 py-3 text-left w-32">Score</th></tr></thead>
                  <tbody className="divide-y">
                    {testData.map((test, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 group">
                        <td className="px-6 py-4 font-mono text-gray-600">{new Date(test.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                        <td className="px-6 py-4 font-medium text-gray-800">{test.name}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-medium border ${test.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' : test.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : test.color === 'green' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{test.type}</span></td>
                        <td className="px-6 py-4"><input type="number" placeholder="-" className="w-16 px-2 py-1 border rounded text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}
        {activeTab === 'progress' && (
          <div className="p-8 h-full overflow-auto bg-gray-50">
            <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2><button onClick={() => handleAnalyzeProgress(stats)} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"><BrainCircuit size={18} /><span>AI Study Strategist</span></button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><div className="text-gray-500 text-sm font-medium mb-1">Schedule Progress</div><div className="text-3xl font-bold text-gray-900">{stats.progress.toFixed(1)}%</div><div className="w-full bg-gray-100 rounded-full h-2 mt-4"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${stats.progress}%` }}></div></div></div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><div className="text-gray-500 text-sm font-medium mb-1">Tasks Completed</div><div className="text-3xl font-bold text-green-600">{stats.completed}</div><div className="text-xs text-gray-400 mt-2">out of {TOTAL_DAYS} days</div></div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><div className="text-gray-500 text-sm font-medium mb-1">Tests Remaining</div><div className="text-3xl font-bold text-amber-600">{testData.length}</div><div className="text-xs text-gray-400 mt-2">Vajiram & Mocks</div></div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><div className="text-gray-500 text-sm font-medium mb-1">Study Streak</div><div className="text-3xl font-bold text-purple-600">3</div><div className="text-xs text-gray-400 mt-2">Days active</div></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-2"><h3 className="font-bold text-gray-800 mb-6 flex items-center"><TrendingUp size={18} className="mr-2 text-gray-400"/> Subject Wise Completion</h3><SimpleBarChart data={stats.subjectData} /></div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center"><h3 className="font-bold text-gray-800 mb-6 w-full text-left">Overall Status</h3><div className="grid grid-cols-2 gap-8"><DonutChart value={stats.progress} color="#2563eb" label="GS Covered" /><DonutChart value={15} color="#d97706" label="Maths Covered" /></div></div>
            </div>
          </div>
        )}
        {activeTab === 'syllabus' && (
          <div className="p-8 max-w-4xl mx-auto h-full overflow-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50"><h2 className="font-bold text-gray-800">Detailed Syllabus Checklist</h2></div>
              <div className="divide-y divide-gray-100">
                {syllabusData.map((item, idx) => (
                  <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <span className="font-medium text-gray-700">{item.topic}</span>
                    <select value={item.status} onChange={(e) => updateSyllabus(idx, e.target.value)} className={`text-xs font-semibold rounded-full px-3 py-1 border-0 ring-1 ring-inset cursor-pointer outline-none ${item.status === 'Mastered' ? 'bg-green-100 text-green-700 ring-green-200' : item.status === 'Revision' ? 'bg-purple-100 text-purple-700 ring-purple-200' : item.status === 'Learning' ? 'bg-blue-100 text-blue-700 ring-blue-200' : 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                      <option value="Not Started">Not Started</option><option value="Learning">Learning</option><option value="Revision">Revision</option><option value="Mastered">Mastered</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;