import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar, 
  BarChart3, 
  CheckSquare, 
  FileSpreadsheet, 
  Save, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  Target,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Sparkles,
  X,
  Loader2,
  BrainCircuit
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  collection 
} from 'firebase/firestore';

// --- Gemini API Configuration ---
const apiKey = "AIzaSyDVyq4A9CSP6lHeX6FeDYK9jhgUMAo9j8k"; // Injected by environment

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "upsc-tracker-2026.firebaseapp.com",
  projectId: "upsc-tracker-2026",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'upsc-study-tracker';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Constants & Data ---
const PRELIMS_DATE = new Date('2026-05-24T09:30:00');
const START_DATE = new Date('2026-01-26');
const TOTAL_DAYS = 119;

// EXACT Test Schedule from your prompt
const TEST_SCHEDULE = [
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

const INITIAL_SYLLABUS = [
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

// --- Specific Schedule Entries from Prompt ---
const FIXED_SCHEDULE_ENTRIES: Record<string, any> = {
  '2026-01-26': {
    gs1: 'Polity Set A - Preamble, Constitutional framework (2.5h)',
    gs2: 'History - Timeline skeleton: Ancient to Modern (1h)',
    ca: 'The Hindu/IE newspaper tagging (1h)',
    revision: 'Preamble keywords recall (30m)',
    maths: 'Linear Algebra - Vector spaces, subspaces, basis (2h)',
  },
  '2026-01-27': {
    gs1: 'Polity - Union & Territory (2h)',
    gs2: 'History - 1857 Revolt (1.5h)',
    ca: 'Newspaper (1h)',
    revision: 'Articles recall (15m)',
    maths: 'Maths OFF (30m)',
  },
  '2026-02-05': {
    gs1: 'Polity - LS vs RS (1h)',
    gs2: 'History - Independence post-1935 (1.5h)',
    ca: 'Newspaper (1h)',
    revision: 'LS-RS chart (15m)',
    maths: 'Calculus - Derivatives (1.5h)',
  },
  '2026-02-06': {
    gs1: 'Polity - Judiciary SC (2h)',
    gs2: 'History - Constitutional developments (1.5h)',
    ca: 'Newspaper (45m)',
    revision: 'SC jurisdiction (20m)',
    maths: 'LA - Orthogonal matrices (2h)',
  },
  '2026-02-12': {
    gs1: 'Polity - Cabinet committees (2h)',
    gs2: 'Geography - Landforms (1.5h)',
    ca: 'Newspaper (1h)',
    revision: 'Municipal recall (15m)',
    maths: 'Maths OFF (30m)',
  },
  '2026-02-13': {
    gs1: 'Polity - Federal vs Unitary (2h)',
    gs2: 'History - Ancient India Mauryan (1.5h)',
    ca: 'Newspaper (45m)',
    revision: 'Concurrent list (15m)',
    maths: 'LA - Complex numbers (2h)',
  },
  '2026-02-19': {
    gs1: 'Polity - Constitutional safeguards (2h)',
    gs2: 'Geography - Plate tectonics (1.5h)',
    ca: 'Newspaper (45m)',
    revision: 'Minority rights (20m)',
    maths: 'Calculus - Integrals (1.5h)',
  },
  '2026-02-26': {
    gs1: 'Polity - Emergency provisions (2h)',
    gs2: 'Geography - Rivers (1.5h)',
    ca: 'Newspaper (45m)',
    revision: 'Emergency distinctions (20m)',
    maths: 'ODE (2h)',
  },
};

// --- Helper Functions ---
const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

const getDayName = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
};

const generateInitialSchedule = () => {
  const schedule = [];
  let currentDate = new Date(START_DATE);

  // Topics to cycle through for filling gaps realistically
  const polityTopics = ['Fund. Rights', 'DPSP', 'President', 'Governor', 'Parliament Bills', 'Budget', 'Supreme Court', 'High Court', 'Panchayats'];
  const historyTopics = ['Indus Valley', 'Vedic Age', 'Buddhism/Jainism', 'Guptas', 'Delhi Sultanate', 'Mughals', 'Marathas', 'Freedom Struggle 1905-1917'];
  const mathsTopics = ['Linear Algebra: Eigenvalues', 'Calculus: Limits', 'Analytic Geometry: Conics', 'ODE: First Order', 'Statics: Forces', 'Dynamics: Motion', 'Algebra: Groups'];
  
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const dateStr = formatDate(currentDate);
    const dayName = getDayName(dateStr);
    const test = TEST_SCHEDULE.find(t => t.date === dateStr);
    
    // Check if we have exact fixed data from prompt
    const fixedData = FIXED_SCHEDULE_ENTRIES[dateStr];

    // If not fixed, generate realistic filler content
    const gs1 = fixedData?.gs1 || `Polity: ${polityTopics[i % polityTopics.length]} (2h)`;
    const gs2 = fixedData?.gs2 || `History: ${historyTopics[i % historyTopics.length]} (1.5h)`;
    const maths = fixedData?.maths || `Maths: ${mathsTopics[i % mathsTopics.length]} (2h)`;
    const ca = fixedData?.ca || "Daily News Analysis (1h)";
    const revision = fixedData?.revision || "Previous Day Recall (30m)";

    schedule.push({
      id: dateStr,
      date: dateStr,
      day: dayName,
      gs1: gs1,
      gs2: gs2,
      ca: ca,
      revision: revision,
      maths: maths,
      csat: 'CSAT Practice (30m)',
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
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
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
              <p className="font-medium">Consulting Gemini...</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
              {content}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-center">
          Powered by Gemini 2.5 Flash
        </div>
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
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
          {Math.round(value)}%
        </div>
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
             <div 
               className={`w-4/5 rounded-t-sm transition-all duration-500 ${item.color}`}
               style={{ height: `${(item.value / maxValue) * 150}px`, minHeight: '4px' }}
             ></div>
             <div className="absolute -top-6 opacity-0 group-hover:opacity-100 text-xs bg-black text-white px-1 rounded transition-opacity">
               {item.value}
             </div>
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
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [syllabusData, setSyllabusData] = useState(INITIAL_SYLLABUS);
  const [testData, setTestData] = useState(TEST_SCHEDULE);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  // AI State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalContent, setAiModalContent] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState('');

  // --- Auth & Data Fetching ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
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
        const defaultData = {
          schedule: generateInitialSchedule(),
          syllabus: INITIAL_SYLLABUS,
          tests: TEST_SCHEDULE
        };
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

  // --- Timer ---
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

  // --- Data Persistence ---
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

  // --- Handlers ---
  const updateSchedule = (id: string, field: string, value: string) => {
    const newData = scheduleData.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    );
    setScheduleData(newData);
    const timeoutId = setTimeout(() => saveDataToFirebase(newData, syllabusData), 1000);
    return () => clearTimeout(timeoutId);
  };

  const updateSyllabus = (index: number, status: string) => {
    const newData = [...syllabusData];
    newData[index].status = status;
    setSyllabusData(newData);
    saveDataToFirebase(scheduleData, newData);
  };

  // --- AI Handlers ---
  const handleExplainTopic = async (topic: string) => {
    setAiTitle(`Topic Tutor: ${topic.slice(0, 30)}...`);
    setAiModalOpen(true);
    setAiLoading(true);
    setAiModalContent('');

    const prompt = `I am preparing for UPSC CSE Prelims 2026. Explain the topic "${topic}" concisely. 
    1. Give a 2-sentence summary.
    2. Provide 3 high-yield bullet points for Prelims.
    3. Suggest a mnemonic to remember key facts if possible.
    Keep it strictly relevant to UPSC syllabus.`;

    const result = await callGemini(prompt);
    setAiModalContent(result);
    setAiLoading(false);
  };

  const handleAnalyzeProgress = async (stats: any) => {
    setAiTitle("AI Study Strategist");
    setAiModalOpen(true);
    setAiLoading(true);
    setAiModalContent('');

    const prompt = `I am a UPSC CSE 2026 aspirant. Here is my current progress:
    - Completion: ${stats.progress.toFixed(1)}% (${stats.completed}/${TOTAL_DAYS} days)
    - Tasks In Progress: ${stats.inProgress}
    - Subject Breakdown: ${JSON.stringify(stats.subjectData.map((s:any) => `${s.label}: ${s.value}`))}
    
    Act as an elite UPSC coach. Provide:
    1. A brief, hard-hitting analysis of my current pace.
    2. One specific strategic adjustment I should make this week.
    3. A short motivational quote tailored to my situation.`;

    const result = await callGemini(prompt);
    setAiModalContent(result);
    setAiLoading(false);
  };

  // --- Calculations ---
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
        <div className="animate-spin mr-3">
          <Clock size={24} />
        </div>
        Loading Study Dashboard...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans text-gray-800">
      <AIModal 
        isOpen={aiModalOpen} 
        onClose={() => setAiModalOpen(false)} 
        content={aiModalContent} 
        loading={aiLoading}
        title={aiTitle}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Calendar size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">UPSC CSE 2026</h1>
            <p className="text-xs text-gray-500 font-medium">Interactive Tracker • Vajiram Integrated</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-end">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Time Remaining</span>
             <span className="text-xl font-mono font-bold text-blue-600">{timeLeft}</span>
          </div>
          
          <div className="h-8 w-px bg-gray-200 mx-2"></div>

          <div className="flex items-center space-x-2">
            {saving ? (
               <span className="text-xs text-blue-500 flex items-center animate-pulse">
                 <Save size={12} className="mr-1" /> Saving...
               </span>
            ) : (
               <span className="text-xs text-green-500 flex items-center">
                 <CheckSquare size={12} className="mr-1" /> Saved
               </span>
            )}
          </div>
        </div>
      </header>

      {/* Toolbar / Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 flex items-center space-x-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'schedule', label: 'Daily Schedule', icon: FileSpreadsheet },
          { id: 'tests', label: 'Test Series', icon: Target },
          { id: 'progress', label: 'Dashboard', icon: BarChart3 },
          { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-600 bg-blue-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        
        {/* VIEW: SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="h-full overflow-auto bg-white">
            <div className="min-w-[1400px]"> {/* Increased width for Maths column */}
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <tr>
                    <th className="border-b border-r px-4 py-3 w-24">Date</th>
                    <th className="border-b border-r px-4 py-3 w-16">Day</th>
                    <th className="border-b border-r px-4 py-3 w-56">GS Subject 1</th>
                    <th className="border-b border-r px-4 py-3 w-48">GS Subject 2</th>
                    <th className="border-b border-r px-4 py-3 w-48 bg-red-50 text-red-800 border-red-100">Maths / Optional</th>
                    <th className="border-b border-r px-4 py-3 w-56 bg-yellow-50 text-yellow-800 border-yellow-100">Vajiram Test</th>
                    <th className="border-b border-r px-4 py-3 w-32">Status</th>
                    <th className="border-b px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scheduleData.map((row) => (
                    <tr 
                      key={row.id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        row.test ? 'bg-yellow-50/30' : ''
                      }`}
                    >
                      <td className={`px-4 py-2 border-r font-medium ${row.test ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>
                        {new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-4 py-2 border-r text-gray-500">{row.day}</td>
                      
                      {/* GS 1 with AI Button */}
                      <td className="px-4 py-2 border-r relative group">
                        <div className="flex items-center justify-between">
                          <span className="truncate max-w-[180px]" title={row.gs1}>{row.gs1}</span>
                          <button 
                            onClick={() => handleExplainTopic(row.gs1)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                            title="Explain with AI"
                          >
                            <Sparkles size={14} />
                          </button>
                        </div>
                      </td>

                      {/* GS 2 with AI Button */}
                      <td className="px-4 py-2 border-r relative group">
                        <div className="flex items-center justify-between">
                          <span className="truncate max-w-[150px]" title={row.gs2}>{row.gs2}</span>
                          <button 
                            onClick={() => handleExplainTopic(row.gs2)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                            title="Explain with AI"
                          >
                            <Sparkles size={14} />
                          </button>
                        </div>
                      </td>
                      
                      {/* Maths with AI Button */}
                      <td className="px-4 py-2 border-r font-medium text-gray-700 bg-red-50/20 relative group">
                        <div className="flex items-center justify-between">
                          <span className="truncate max-w-[150px]" title={row.maths}>{row.maths}</span>
                          <button 
                            onClick={() => handleExplainTopic(row.maths)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            title="Explain with AI"
                          >
                            <Sparkles size={14} />
                          </button>
                        </div>
                      </td>
                      
                      {/* Test Column */}
                      <td className="px-4 py-2 border-r bg-yellow-50/50">
                        {row.test ? (
                          <div className={`text-xs px-2 py-1 rounded border font-medium inline-block whitespace-normal leading-tight
                            ${row.testType === 'Sectional' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                              row.testType === 'Comprehensive' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              row.testType === 'Full Length' ? 'bg-green-100 text-green-800 border-green-200' :
                              'bg-red-100 text-red-800 border-red-200'}
                          `}>
                            {row.test}
                          </div>
                        ) : <span className="text-gray-300">-</span>}
                      </td>

                      {/* Editable Status */}
                      <td className="px-2 py-1 border-r">
                        <select
                          value={row.status}
                          onChange={(e) => updateSchedule(row.id, 'status', e.target.value)}
                          className={`w-full text-xs font-medium rounded px-2 py-1.5 border-0 ring-1 ring-inset cursor-pointer outline-none focus:ring-2 focus:ring-blue-500
                            ${row.status === 'Completed' ? 'bg-green-50 text-green-700 ring-green-200' : 
                              row.status === 'In Progress' ? 'bg-yellow-50 text-yellow-700 ring-yellow-200' : 
                              'bg-white text-gray-500 ring-gray-200'}
                          `}
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>

                      {/* Editable Notes */}
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={row.notes}
                          onChange={(e) => updateSchedule(row.id, 'notes', e.target.value)}
                          placeholder="Add notes..."
                          className="w-full text-xs bg-transparent border-0 focus:ring-0 placeholder-gray-300 text-gray-700"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW: TESTS */}
        {activeTab === 'tests' && (
          <div className="p-8 max-w-5xl mx-auto h-full overflow-auto">
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <h2 className="font-bold text-gray-800 flex items-center">
                    <Target className="mr-2 text-blue-600" size={20}/> Vajiram & Mock Schedule
                  </h2>
                  <div className="flex space-x-2 text-xs font-medium">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Sectional</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Comprehensive</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Full Length</span>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded">Mock</span>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-semibold border-b">
                    <tr>
                      <th className="px-6 py-3 text-left w-32">Date</th>
                      <th className="px-6 py-3 text-left">Test Name</th>
                      <th className="px-6 py-3 text-left w-32">Type</th>
                      <th className="px-6 py-3 text-left w-32">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {testData.map((test, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 group">
                        <td className="px-6 py-4 font-mono text-gray-600">
                          {new Date(test.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">{test.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium border
                             ${test.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                               test.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                               test.color === 'green' ? 'bg-green-50 text-green-700 border-green-200' :
                               'bg-red-50 text-red-700 border-red-200'}
                          `}>
                            {test.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="number" 
                            placeholder="-" 
                            className="w-16 px-2 py-1 border rounded text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {/* VIEW: DASHBOARD */}
        {activeTab === 'progress' && (
          <div className="p-8 h-full overflow-auto bg-gray-50">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
                <button 
                  onClick={() => handleAnalyzeProgress(stats)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
                >
                  <BrainCircuit size={18} />
                  <span>AI Study Strategist</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Stat Cards */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-gray-500 text-sm font-medium mb-1">Schedule Progress</div>
                <div className="text-3xl font-bold text-gray-900">{stats.progress.toFixed(1)}%</div>
                <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${stats.progress}%` }}></div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-gray-500 text-sm font-medium mb-1">Tasks Completed</div>
                <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-xs text-gray-400 mt-2">out of {TOTAL_DAYS} days</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-gray-500 text-sm font-medium mb-1">Tests Remaining</div>
                <div className="text-3xl font-bold text-amber-600">{testData.length}</div>
                <div className="text-xs text-gray-400 mt-2">Vajiram & Mocks</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-gray-500 text-sm font-medium mb-1">Study Streak</div>
                <div className="text-3xl font-bold text-purple-600">3</div>
                <div className="text-xs text-gray-400 mt-2">Days active</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-2">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center">
                  <TrendingUp size={18} className="mr-2 text-gray-400"/> Subject Wise Completion
                </h3>
                <SimpleBarChart data={stats.subjectData} />
              </div>

              {/* Donut Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <h3 className="font-bold text-gray-800 mb-6 w-full text-left">Overall Status</h3>
                <div className="grid grid-cols-2 gap-8">
                  <DonutChart value={stats.progress} color="#2563eb" label="GS Covered" />
                  <DonutChart value={15} color="#d97706" label="Maths Covered" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: SYLLABUS */}
        {activeTab === 'syllabus' && (
          <div className="p-8 max-w-4xl mx-auto h-full overflow-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                 <h2 className="font-bold text-gray-800">Detailed Syllabus Checklist</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {syllabusData.map((item, idx) => (
                  <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <span className="font-medium text-gray-700">{item.topic}</span>
                    <select
                      value={item.status}
                      onChange={(e) => updateSyllabus(idx, e.target.value)}
                      className={`text-xs font-semibold rounded-full px-3 py-1 border-0 ring-1 ring-inset cursor-pointer outline-none
                        ${item.status === 'Mastered' ? 'bg-green-100 text-green-700 ring-green-200' : 
                          item.status === 'Revision' ? 'bg-purple-100 text-purple-700 ring-purple-200' :
                          item.status === 'Learning' ? 'bg-blue-100 text-blue-700 ring-blue-200' :
                          'bg-gray-100 text-gray-500 ring-gray-200'}
                      `}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Learning">Learning</option>
                      <option value="Revision">Revision</option>
                      <option value="Mastered">Mastered</option>
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