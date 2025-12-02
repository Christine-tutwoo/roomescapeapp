'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { 
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc,
  getDocs, query, orderBy, where, limit, startAfter, arrayUnion, arrayRemove, deleteField
} from 'firebase/firestore';
import { 
  Plus, Users, MapPin, Calendar, Clock, DollarSign, Ghost, Search, 
  UserPlus, CheckCircle, CalendarPlus, Navigation, ExternalLink, 
  LogOut, AlertTriangle, Ban, X, Edit, Trash2, Filter, Tag, Info, 
  MessageCircle, Hourglass,   ChevronLeft, ChevronRight, Grid,
  Ticket, Gift, Timer, Globe, AlertCircle, Coffee, CalendarDays,
  Download, Settings, User, Sparkles, Heart, Share2, BellRing, ArrowLeft,
  ChevronDown
} from 'lucide-react';

    // 移除 INITIAL_EVENTS，因為現在使用 Firestore
    const INITIAL_EVENTS = [];
    // 這些常數可以保留
const today = new Date();
    // ...

// ===== 角色人格測驗資料 =====
const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "朋友們揪了一場密室逃脫，在挑選主題時，你的態度通常是？",
    options: [
      { text: "「走啊！哪次不走！時間我來喬。」", scores: { tank: 1 } },
      { text: "「呃...很恐嗎？如果要玩我只能負責尖叫喔。」", scores: { hamster: 1 } },
      { text: "先去網路上查查看心得，確認謎題邏輯順不順，不要只是在那邊嚇人。", scores: { sherlock: 1 } },
      { text: "「好耶！我來揪那個誰誰誰，看他被嚇一定很好笑。」", scores: { mascot: 1 } }
    ]
  },
  {
    id: 2,
    question: "剛進入密室，工作人員幫大家戴上眼罩並銬上手銬。當廣播說「遊戲開始」，眼罩拿下來的一瞬間，你會做什麼？",
    options: [
      { text: "大聲指揮：「大家先報一下自己手邊有什麼鎖！」", scores: { tank: 1 } },
      { text: "默默觀察周圍牆上的符號和數字，開始思考關聯。", scores: { brain: 1 } },
      { text: "馬上開始翻箱倒櫃，摸任何可以移動的物體。", scores: { sherlock: 1 } },
      { text: "「我要黏在他後面！」指定抓著某個朋友，反正跟著他走就對了，大腦交給他。", scores: { mascot: 1 } }
    ]
  },
  {
    id: 3,
    question: "隊伍卡關了，面對一個超複雜的圖像密碼鎖，大家沈默了五分鐘，這時你會？",
    options: [
      { text: "「我們換一題解！這題先跳過，不要浪費時間。」", scores: { tank: 1 } },
      { text: "「等一下，把剛剛那個道具拿過來，我覺得跟這個顏色有關...」", scores: { brain: 1 } },
      { text: "繼續在房間角落摸索，看有沒有遺漏的線索紙條。", scores: { sherlock: 1 } },
      { text: "在旁邊幫大家加油，或是拿著手電筒幫忙照亮。", scores: { mascot: 1 } }
    ]
  },
  {
    id: 4,
    question: "突然！房間燈光全滅，遠處傳來淒厲的鬼叫聲與腳步聲（NPC 出現），你的反應是？",
    options: [
      { text: "立刻站在隊伍最前面，擋住隊友：「你們躲我後面！」", scores: { tank: 1 }, meta: { block: true } },
      { text: "冷靜地貼著牆壁蹲下，確認NPC的動線，避免被抓。", scores: { brain: 1 } },
      { text: "雖然害怕，但還是在縫隙中偷看NPC。", scores: { sherlock: 1 } },
      { text: "放聲尖叫（海豚音），然後整個人縮成一團抱住大腿。", scores: { hamster: 1 } }
    ]
  },
  {
    id: 5,
    question: "經過一番努力，獲得了一個「奇怪的透明板子」道具，但不知道怎麼用，你會？",
    options: [
      { text: "拿著板子到處去對牆上的洞，或是直接問對講機求救。", scores: { tank: 1 } },
      { text: "思考剛才哪個謎題缺了這塊拼圖，檢查形狀吻合度。", scores: { brain: 1 } },
      { text: "把板子拿起來對著燈光照，看有沒有隱藏字跡。", scores: { sherlock: 1 } },
      { text: "拿著板子當作防身武器（或是拿來搧風），問：「我們是不是快過關了？」", scores: { mascot: 1 } }
    ]
  },
  {
    id: 6,
    question: "需要一名隊員單獨爬進一個狹窄、陰暗的通風管去拿鑰匙，你會？",
    options: [
      { text: "「我來吧！如果你們都不敢的話。」", scores: { tank: 1 } },
      { text: "分析誰的身形最適合，並告訴他進去要注意什麼。", scores: { brain: 1 } },
      { text: "幫忙在通風口拿著手電筒照路，確認裡面沒有異物。", scores: { sherlock: 1 } },
      { text: "「拜託不要選我！我在這裡幫你們把風！」", scores: { hamster: 1 } }
    ]
  },
  {
    id: 7,
    question: "來到最後一關，需要解開一個超難的邏輯題，但時間只剩 3 分鐘了！",
    options: [
      { text: "快速分配工作：「你算這個、你記那個，我來輸入！」", scores: { tank: 1 } },
      { text: "大腦全速運轉，拿出紙筆瘋狂計算，進入心流狀態。", scores: { brain: 1 }, meta: { flow: true } },
      { text: "幫忙檢查大家輸入的密碼有沒有按錯，並隨時回報剩餘時間。", scores: { sherlock: 1 } },
      { text: "開始在那邊亂猜密碼，或是已經準備好要失敗了。", scores: { mascot: 1 } }
    ]
  },
  {
    id: 8,
    question: "劇情大反轉，發現原來一直引導你們的聲音才是大壞蛋，你會？",
    options: [
      { text: "「我就知道！難怪剛才那個提示怪怪的。」", scores: { tank: 1 } },
      { text: "迅速回想劇情細節，將整個故事線串連起來。", scores: { brain: 1 } },
      { text: "不管劇情了，專注在逃脫環節。", scores: { sherlock: 1 } },
      { text: "「蛤？真的假的？我剛剛都沒在聽劇情耶！」", scores: { mascot: 1 } }
    ]
  },
  {
    id: 9,
    question: "遊戲結束，雖然超時了幾分鐘，但工作人員正在講解劇情，你通常在做什麼？",
    options: [
      { text: "積極跟工作人員討論剛剛哪裡設計得不合理，或是稱讚機關。", scores: { brain: 1 } },
      { text: "安靜地聽完解說，腦中在此刻才終於把所有謎題想通。", scores: { brain: 1 } },
      { text: "已經在看手機，找待會晚餐要吃哪一家餐廳。", scores: { mascot: 1 } },
      { text: "跑去跟剛剛嚇你的 NPC 合照，或是玩弄剛剛沒解開的道具。", scores: { sherlock: 1 } }
    ]
  },
  {
    id: 10,
    question: "最後的大合照環節，你會選擇拿什麼樣的手舉牌？",
    options: [
      { text: "「全場最罩」、「帶飛全場」、「智商在線」", scores: { tank: 1 } },
      { text: "「邏輯鬼才」、「CARRY」、「通靈王」", scores: { brain: 1 } },
      { text: "「好雷隊友」、「我是路人」、「我就廢」", scores: { mascot: 1 } },
      { text: "「人體尖叫雞」、「我是倉鼠」、「嚇到漏尿」", scores: { hamster: 1 } }
    ]
  }
];

// 六邊形屬性定義 (GUTS/LEAD/LOGIC/OBS/TEAM/FUN)
const QUIZ_ATTRIBUTES = [
  { key: 'courage', name: '膽量', color: '#ef4444' },        // 紅色 GUTS
  { key: 'leadership', name: '領導', color: '#f59e0b' },     // 黃色 LEAD
  { key: 'logic', name: '邏輯', color: '#3b82f6' },          // 藍色 LOGIC
  { key: 'observation', name: '觀察', color: '#22c55e' },    // 綠色 OBS
  { key: 'teamwork', name: '團隊', color: '#a855f7' },       // 紫色 TEAM
  { key: 'humor', name: '歡樂', color: '#ec4899' }           // 粉色 FUN
];

// 角色類型定義 - Final_v1.0
const QUIZ_CHARACTERS = [
  {
    id: 'tank',
    name: '破陣坦克',
    title: 'The Tank',
    emoji: '🛡️',
    slogan: '別怕，躲我後面！',
    description: '你是團隊的安全感來源！當燈光熄滅、鬼怪衝出來時，你總是擋在最前面。你未必最會解數學題，但你的決策力與勇氣是團隊能繼續前進的關鍵。',
    bestMatch: 'hamster',
    bestMatchName: '極致倉鼠',
    enemy: 'brain',
    enemyName: '解謎大腦',
    gradient: 'from-slate-700 to-zinc-800'
  },
  {
    id: 'brain',
    name: '解謎大腦',
    title: 'The Mastermind',
    emoji: '🧠',
    slogan: '安靜！給我三秒鐘。',
    description: '你是密室裡的 CPU！面對滿牆的數字與符號，別人看到的是亂碼，你看到的是通關密碼。卡關時大家都會用崇拜的眼神看向你，你是通關的希望。',
    bestMatch: 'sherlock',
    bestMatchName: '鷹眼搜查官',
    enemy: 'tank',
    enemyName: '破陣坦克',
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'sherlock',
    name: '鷹眼搜查官',
    title: 'The Sherlock',
    emoji: '🔍',
    slogan: '這裡怎麼有一把鑰匙？',
    description: '如果沒有你，大腦再強也沒用！因為線索都是你找到的。你擁有「翻箱倒櫃」的執照，總能發現地毯下、夾層裡的關鍵道具。你是最被低估的關鍵人物。',
    bestMatch: 'brain',
    bestMatchName: '解謎大腦',
    enemy: 'hamster',
    enemyName: '極致倉鼠',
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'hamster',
    name: '極致倉鼠',
    title: 'The Hamster',
    emoji: '🐹',
    slogan: '啊啊啊啊啊啊啊！！！',
    description: '你的尖叫聲比鬼還恐怖！你把密室玩成了極限體能王，整場都在深蹲與折返跑。雖然你解謎貢獻度可能不高，但你提供了無可取代的「情緒價值」，讓 NPC 很有成就感。',
    bestMatch: 'tank',
    bestMatchName: '破陣坦克',
    enemy: 'sherlock',
    enemyName: '鷹眼搜查官',
    gradient: 'from-pink-400 to-orange-400'
  },
  {
    id: 'mascot',
    name: '佛系吉祥物',
    title: 'The Mascot',
    emoji: '🧸',
    slogan: '我是誰？我在哪？隊友真棒。',
    description: '你是密室裡的和平大使與氣氛組。當大家為了謎題焦頭爛額時，你總是用一種超然的態度面對。你負責黏在強者後面，負責可愛，也負責在最後合照時站 C 位。',
    bestMatch: 'ace',
    bestMatchName: '六邊形戰士',
    enemy: 'brain',
    enemyName: '解謎大腦',
    gradient: 'from-purple-400 to-fuchsia-500'
  },
  {
    id: 'ace',
    name: '六邊形戰士',
    title: 'The Ace',
    emoji: '🌟',
    slogan: '你們退後，我來處理。',
    description: '你是密室裡的傳說生物！既能當坦克擋鬼，又能解開最難的邏輯題，還能找到藏在天花板的鑰匙。你一個人就抵過一支軍隊，請珍惜這種稀有的天賦！',
    bestMatch: 'mascot',
    bestMatchName: '佛系吉祥物',
    enemy: 'ace',
    enemyName: '六邊形戰士',
    gradient: 'from-yellow-400 to-amber-500'
  }
];

const INITIAL_PROMOTIONS = [
  {
    id: 1,
    studio: "闇間工作室",
    title: "50元折價券 (下次使用)",
    content: "出示公告予工作人員，遊玩後即可獲得 50 元抵用卷(下次使用)，一次只能使用一張。伴、怨憶、康樂保胃戰皆適用。",
    period: "長期優惠",
    color: "from-gray-800 to-gray-600",
    icon: <Ticket className="text-white" />
  },
  {
    id: 2,
    studio: "揪揪玩工作室",
    title: "現場折 50 元",
    content: "出示公告即可現場折 50 元 (主題：寶寶睡)。",
    period: "即日起 - 2026/6/30",
    color: "from-pink-500 to-rose-500",
    icon: <DollarSign className="text-white" />
  },
  {
    id: 3,
    studio: "塊陶阿",
    title: "百元折價券 (下次使用)",
    content: "私訊小迷糊IG並出示預約截圖，遊玩後依人頭數給予百元折價卷(連刷可適用)。見鬼十法、醫怨、荒村小學適用。",
    period: "長期優惠",
    color: "from-orange-500 to-red-600",
    icon: <Ghost className="text-white" />
  },
  {
    id: 4,
    studio: "EnterSpace",
    title: "百元折價券 (下次使用)",
    content: "體驗後至「逃脫吧」留言並出示群組證明，每人獲一張百元折價券(下次使用)。需4人以上，每場最多用6張。",
    period: "2026/01/01 - 2026/06/30",
    color: "from-blue-600 to-indigo-700",
    icon: <ExternalLink className="text-white" />
  },
  {
    id: 5,
    studio: "Miss GAME",
    title: "《幻隱光靈：三界》95折",
    content: "私訊社群IG出示「確認遊玩」截圖，索取優惠碼。於FunNow預訂時輸入即可享95折。",
    period: "長期優惠",
    color: "from-purple-600 to-fuchsia-600",
    icon: <Tag className="text-white" />
  },
  {
    id: 6,
    studio: "癮密工作室",
    title: "【平日】百元折價券 (限量)",
    content: "私訊小迷糊IG出示預約截圖，平日場次現場直接折抵100元。每團限用一張，需3人以上。",
    period: "長期優惠",
    color: "from-emerald-600 to-teal-600",
    icon: <Clock className="text-white" />
  },
  {
    id: 7,
    studio: "純密室 (中原店)",
    title: "【平日】連刷四場優惠",
    content: "平日至中原店連刷四場，4人(含)以上，即可獲得「一人」折「兩百元」的優惠。需私訊登記。",
    period: "長期優惠",
    color: "from-yellow-600 to-amber-600",
    icon: <Users className="text-white" />
  },
  {
    id: 8,
    studio: "月蝕謎願-室在哈邏密室逃脫工作室",
    title: "百元折價券 (下次使用)",
    content: "看人頭數給予一百元折價卷（下次使用）。",
    period: "長期優惠",
    color: "from-indigo-600 to-purple-600",
    icon: <Ticket className="text-white" />
  }
];
const VISITOR_USER = {
  uid: "visitor",
  displayName: "訪客",
  email: "",
  photoURL: "",
  flakeCount: 0,
  isBanned: false,
  nameChangedCount: 0,
  isVisitor: true
};
const ALLOW_CHAIN_CREATION = false;
const COMMUNITY_LINK = 'https://line.me/ti/g2/04aicsfxOcNA2fRhxM1vn07e6JieIO7EqKbQZg?utm_source=invitation&utm_medium=link_copy&utm_campaign=default';
const getDefaultFormData = () => ({
  title: "", studio: "", region: "北部", category: "密室逃脫", date: "", time: "", 
  price: "", priceFull: "", 
  totalSlots: 6, builtInPlayers: 0, location: "", type: "恐怖驚悚",
  website: "", description: "", meetingTime: "15", duration: "120", minPlayers: 4,
  teammateNote: "", contactLineId: "", isChainEvent: false, chainSessions: []
});

const generateRandomId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// ===== 測驗相關函數 =====
const ROLE_KEYS = ['tank', 'brain', 'sherlock', 'hamster', 'mascot'];

const calculateQuizResult = (answers) => {
  const roleScores = ROLE_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
  let pickedBlock = false;
  let pickedFlow = false;

  Object.entries(answers).forEach(([_, answer]) => {
    if (!answer) return;
    Object.entries(answer.scores || {}).forEach(([role, score]) => {
      if (roleScores.hasOwnProperty(role)) {
        roleScores[role] += Number(score) || 0;
      }
    });
    if (answer.meta?.block) pickedBlock = true;
    if (answer.meta?.flow) pickedFlow = true;
  });

  const isAce =
    (roleScores.tank >= 3 && roleScores.brain >= 3) ||
    (pickedBlock && pickedFlow);

  let characterId;
  if (isAce) {
    characterId = 'ace';
  } else {
    characterId = ROLE_KEYS.reduce((best, role) => {
      if (roleScores[role] > roleScores[best]) return role;
      return best;
    }, ROLE_KEYS[0]);
  }

  const character =
    QUIZ_CHARACTERS.find((c) => c.id === characterId) ??
    QUIZ_CHARACTERS.find((c) => c.id === 'mascot');

  const clampScore = (value, max = 10) =>
    Math.max(0, Math.min(max, Number(value) || 0));

  const radarScores = {
    courage: clampScore(roleScores.tank * 2 + (characterId === 'tank' ? 2 : 0)),
    leadership: clampScore(roleScores.tank * 1.2 + roleScores.mascot * 0.5),
    logic: clampScore(roleScores.brain * 2 + (characterId === 'brain' ? 2 : 0)),
    observation: clampScore(roleScores.sherlock * 2 + roleScores.brain * 0.5),
    teamwork: clampScore(roleScores.mascot * 2 + roleScores.tank * 0.5),
    humor: clampScore(roleScores.hamster * 2 + roleScores.mascot * 0.5)
  };

  if (characterId === 'ace') {
    Object.keys(radarScores).forEach((key) => {
      radarScores[key] = clampScore(Math.max(7, radarScores[key] + 2));
    });
  }

  return { scores: radarScores, character, roleScores };
};

const isGoogleMapsLink = (url) => {
  if (!url) return false;
  const value = url.trim().toLowerCase();
  if (!value.startsWith('http')) return false;
  return value.includes('google.com/maps') || value.includes('goo.gl/maps') || value.includes('maps.app.goo.gl');
};

const getMapsUrl = (value) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isGoogleMapsLink(trimmed)) return trimmed;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
};

const sanitizePriceValue = (value, fallback = 0) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const rounded = Math.round(num);
  if (rounded < 0) return fallback;
  return rounded;
};

const getBuiltInCount = (event) => {
  if (!event) return 0;
  const value = Number(event.builtInPlayers);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
};

const getEffectiveCurrentSlots = (event) => {
  if (!event) return 0;
  const current = Number(event.currentSlots || 0);
  return current + getBuiltInCount(event);
};

const getRemainingSlots = (event) => {
  if (!event) return 0;
  const total = Number(event.totalSlots || 0);
  return Math.max(total - getEffectiveCurrentSlots(event), 0);
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getEventDateTime = (event) => {
  if (!event?.date) return null;
  const rawTime = (event.time || '00:00').trim();
  const match = rawTime.match(/^(\d{1,2}):(\d{2})/);
  const hh = match ? match[1].padStart(2, '0') : '00';
  const mm = match ? match[2] : '00';
  const dateTime = new Date(`${event.date}T${hh}:${mm}`);
  if (!Number.isNaN(dateTime.getTime())) return dateTime;
  const dateOnly = new Date(event.date);
  return Number.isNaN(dateOnly.getTime()) ? null : dateOnly;
};

const isEventPast = (event) => {
  const dateTime = getEventDateTime(event);
  if (!dateTime) return false;
  return dateTime.getTime() < Date.now();
};

const isWebView = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const ua = userAgent.toLowerCase();
  const isAndroidWebView = /android/.test(ua) && /wv/.test(ua);
  const isSocialApp = /line|fban|fbav|instagram|micromessenger/.test(ua);
  const isIosWebView = /iphone|ipod|ipad/.test(ua) && !/safari/.test(ua);
  return isAndroidWebView || isSocialApp || isIosWebView;
};

export default function EscapeRoomApp() {
  // --- 全域狀態 ---
  const [inWebView, setInWebView] = useState(false);
const [user, setUser] = useState(VISITOR_USER);
  const [activeTab, setActiveTab] = useState('lobby'); 
  const [events, setEvents] = useState([]);
  const [wishes, setWishes] = useState([]); // 新增許願池狀態
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const EVENTS_PER_PAGE = 10;
  
  // 這些狀態現在改為從 events 和 user.uid 推導，但為了相容現有程式碼，
  // 我們稍後會用 useEffect 來更新它們，或者直接在 render 時計算。
  // 為了最小化改動，我們先保留狀態，但透過 useEffect 同步。
  const [myEvents, setMyEvents] = useState([]); 
  const [myWaitlists, setMyWaitlists] = useState([]); 
  
  // --- 篩選狀態 ---
  const [filterCategory, setFilterCategory] = useState('All'); // 新增類別篩選
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterStudio, setFilterStudio] = useState('All');
  const [filterMonth, setFilterMonth] = useState('All'); 
  const [filterPrice, setFilterPrice] = useState('All'); // 新增費用篩選
  const [filterSlots, setFilterSlots] = useState('All'); // 新增缺額篩選
  const [filterEventId, setFilterEventId] = useState(null);
  const [sharedEvent, setSharedEvent] = useState(null); // 用於儲存分享連結的活動
  const [filterWishId, setFilterWishId] = useState(null); // New state for wish filtering
  const [wishMembersModal, setWishMembersModal] = useState({ show: false, wishId: null, members: [] });
  const [sharePrompt, setSharePrompt] = useState({ show: false, eventId: null, eventData: null });
  const [filterHostUid, setFilterHostUid] = useState(null);
  const [filterHostName, setFilterHostName] = useState("");
  const [viewingHostUid, setViewingHostUid] = useState(null); // 查看主揪檔案的 UID
  const [viewingHostName, setViewingHostName] = useState(""); // 查看主揪檔案的名稱
  const [viewingHostPhotoURL, setViewingHostPhotoURL] = useState(null); // 查看主揪的頭貼
  const [hostHistoryEvents, setHostHistoryEvents] = useState([]); // 主揪的歷史活動
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // 新增搜尋狀態

  const [filterDateType, setFilterDateType] = useState('All'); 
  const [selectedDateFilter, setSelectedDateFilter] = useState(null); // 從日曆選中的特定日期
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [notification, setNotification] = useState({ show: false, msg: "", type: "success" });
  const [confirmModal, setConfirmModal] = useState({ show: false, eventId: null, action: null }); 
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState("");
  const [showManageModal, setShowManageModal] = useState(false);
  const [managingEvent, setManagingEvent] = useState(null);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");

const [formData, setFormData] = useState(getDefaultFormData());
  const [createMode, setCreateMode] = useState('event'); // 'event' or 'wish'
const [guestNames, setGuestNames] = useState([""]); // 攜伴姓名列表
const [showGuestModal, setShowGuestModal] = useState(false); // 攜伴輸入框
const [guestEventId, setGuestEventId] = useState(null); // 暫存要攜伴參加的活動 ID
const [guestSessionId, setGuestSessionId] = useState('main');
const [guestSessionOptions, setGuestSessionOptions] = useState([]);
  const maxEventDate = useMemo(() => {
    const limit = new Date();
    limit.setFullYear(limit.getFullYear() + 10);
    return formatDate(limit);
  }, []);
  const [expandedChainInfo, setExpandedChainInfo] = useState({});
  const [showChainModal, setShowChainModal] = useState(false);
  const [chainEventTarget, setChainEventTarget] = useState(null);
  const [chainSelection, setChainSelection] = useState({});

  // 角色人格測驗狀態
  const [quizNickname, setQuizNickname] = useState("");
  const [quizStep, setQuizStep] = useState('intro'); // 'intro', 'nickname', 'questions', 'result'
  const [quizCurrentQ, setQuizCurrentQ] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // 用 Canvas 繪製測驗結果圖片 (9:16 比例，適合 IG 限動)
  const generateQuizResultImage = async (nickname, result) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 9:16 比例 (1080 x 1920)
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;
    
    // 背景漸層
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // 裝飾圓形
    ctx.fillStyle = 'rgba(168, 85, 247, 0.1)';
    ctx.beginPath();
    ctx.arc(width * 0.8, height * 0.1, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width * 0.2, height * 0.9, 150, 0, Math.PI * 2);
    ctx.fill();
    
    // 判斷資料有效
    if (!result || !result.character) {
      console.error('generateQuizResultImage: invalid result payload', result);
      return null;
    }
    
    // 標題
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎮 2025 密室玩家年度回顧', width / 2, 120);
    
    // 角色漸層背景
    const characterColors = {
      tank: ['#475569', '#1f2937'],
      brain: ['#3b82f6', '#4338ca'],
      sherlock: ['#10b981', '#0d9488'],
      hamster: ['#f472b6', '#fb923c'],
      mascot: ['#c084fc', '#d946ef'],
      ace: ['#facc15', '#d97706']
    };
    
    const currentCharacterId = result.character?.id || 'mascot';
    const colors = characterColors[currentCharacterId] || ['#a855f7', '#ec4899'];

    const CARD_Y = 150;
    const CARD_HEIGHT = 520;
    const CARD_BOTTOM = CARD_Y + CARD_HEIGHT;
    const PANEL_TITLE_Y = CARD_BOTTOM + 120;
    const RADAR_CENTER_Y = PANEL_TITLE_Y + 360;
    const RADAR_RADIUS = 230;
    const MATCH_TITLE_Y = RADAR_CENTER_Y + RADAR_RADIUS + 150;
    const MATCH_BOX_Y = MATCH_TITLE_Y + 50;
    const MATCH_BOX_HEIGHT = 130;
    const LINK_Y = MATCH_BOX_Y + MATCH_BOX_HEIGHT + 80;
    const WATERMARK_Y = LINK_Y + 80;

    const CARD_TEXT_WIDTH = width - 240;
    const LINE_HEIGHT = 42;

    const wrapLines = (text, maxWidth) => {
      if (!text) return [];
      const normalized = text.replace(/\r/g, '');
      const lines = [];
      let current = '';
      for (const char of normalized) {
        if (char === '\n') {
          if (current) lines.push(current);
          current = '';
          continue;
        }
        const testLine = current + char;
        if (ctx.measureText(testLine).width > maxWidth && current) {
          lines.push(current);
          current = char;
        } else {
          current = testLine;
        }
      }
      if (current) lines.push(current);
      return lines;
    };

    const cardGradient = ctx.createLinearGradient(80, CARD_Y, width - 80, CARD_BOTTOM);
    cardGradient.addColorStop(0, colors[0]);
    cardGradient.addColorStop(1, colors[1]);
    
    // 圓角矩形函數
    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };
    
    // 角色卡片
    roundRect(60, CARD_Y, width - 120, CARD_HEIGHT, 40);
    ctx.fillStyle = cardGradient;
    ctx.fill();
    
    // 半透明覆蓋
    roundRect(60, CARD_Y, width - 120, CARD_HEIGHT, 40);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fill();
    
    // Emoji
    ctx.font = '120px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(result.character?.emoji || '🎮', width / 2, CARD_Y + 140);
    
    // 標題與暱稱
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '24px sans-serif';
    ctx.fillText(result.character?.title || 'ESCAPER', width / 2, CARD_Y + 200);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '32px sans-serif';
    ctx.fillText(`${nickname} 的密室人格是`, width / 2, CARD_Y + 250);
    
    // 角色名稱
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(result.character?.name || '未知角色', width / 2, CARD_Y + 315);
    
    // 角色標語
    if (result.character?.slogan) {
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(result.character.slogan, width / 2, CARD_Y + 360);
    }
    
    // 角色描述（分段顯示）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'italic 28px sans-serif';
    ctx.textAlign = 'center';
    const descriptionText = result.character?.description
      ? `「${result.character.description}」`
      : '';
    const descLines = wrapLines(descriptionText, CARD_TEXT_WIDTH);
    let descStart = result.character?.slogan ? CARD_Y + 410 : CARD_Y + 380;
    descLines.forEach((line, idx) => {
      ctx.fillText(line, width / 2, descStart + idx * LINE_HEIGHT);
    });

    let afterDescY = descStart + (descLines.length ? (descLines.length - 1) * LINE_HEIGHT : 0);

    // 標籤已移除，預留空間以保持版面
    
    // 屬性面板標題
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('🎯 屬性面板', width / 2, PANEL_TITLE_Y);
    
    // 六邊形雷達圖
    const centerX = width / 2;
    const centerY = RADAR_CENTER_Y;
    const maxRadius = RADAR_RADIUS; // 增大六邊形
    
    // 背景六邊形
    for (let scale of [1, 0.75, 0.5, 0.25]) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 90) * (Math.PI / 180);
        const x = centerX + maxRadius * scale * Math.cos(angle);
        const y = centerY + maxRadius * scale * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // 軸線
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 - 90) * (Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + maxRadius * Math.cos(angle), centerY + maxRadius * Math.sin(angle));
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // 數據多邊形
    ctx.beginPath();
    const maxScore = 10; // 調整為更合理的最大值
    QUIZ_ATTRIBUTES.forEach((attr, i) => {
      const angle = (i * 60 - 90) * (Math.PI / 180);
      const score = result.scores[attr.key] || 0;
      const r = Math.min((score / maxScore) * maxRadius, maxRadius); // 確保不超過外框
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
    ctx.fill();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 數據點和標籤
    QUIZ_ATTRIBUTES.forEach((attr, i) => {
      const angle = (i * 60 - 90) * (Math.PI / 180);
      const score = result.scores[attr.key] || 0;
      const r = Math.min((score / maxScore) * maxRadius, maxRadius); // 確保不超過外框
      
      // 數據點
      ctx.beginPath();
      ctx.arc(centerX + r * Math.cos(angle), centerY + r * Math.sin(angle), 8, 0, Math.PI * 2);
      ctx.fillStyle = attr.color;
      ctx.fill();
      
      // 標籤
      const labelR = maxRadius + 40;
      ctx.fillStyle = attr.color;
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(attr.name, centerX + labelR * Math.cos(angle), centerY + labelR * Math.sin(angle) + 10);
    });
    
    // 相生相剋標題（移除分數列表後，位置提前）
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚔️ 相生相剋', width / 2, MATCH_TITLE_Y);
    
    // 最佳隊友（位置提前）
    const boxY = MATCH_BOX_Y;
    const boxWidth = (width - 200) / 2;
    const boxHeight = MATCH_BOX_HEIGHT;
    roundRect(80, boxY, boxWidth, boxHeight, 20);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#34d399';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('最佳隊友', 80 + boxWidth / 2, boxY + 35);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(result.character?.bestMatchName || '未知', 80 + boxWidth / 2, boxY + 85);
    
    // 天敵（位置提前）
    roundRect(width / 2 + 20, boxY, boxWidth, boxHeight, 20);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#f87171';
    ctx.font = '24px sans-serif';
    ctx.fillText('天敵', width / 2 + 20 + boxWidth / 2, boxY + 35);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(result.character?.enemyName || '未知', width / 2 + 20 + boxWidth / 2, boxY + 85);
    
    // 測驗連結（位置提前）
    ctx.fillStyle = '#94a3b8';
    ctx.font = '24px sans-serif';
    ctx.fillText(window.location.origin + '?tab=quiz', width / 2, LINK_Y);
    
    // 水印
    ctx.fillStyle = '#64748b';
    ctx.font = '28px sans-serif';
    ctx.fillText('made by IG:hu._escaperoom', width / 2, WATERMARK_Y);
    
    return canvas;
  };

const [showIdentityModal, setShowIdentityModal] = useState(false);
const [identityIntent, setIdentityIntent] = useState(null);
const [pendingIdentityAction, setPendingIdentityAction] = useState(null);
const [identityFormGroup, setIdentityFormGroup] = useState("");
const [identityStep, setIdentityStep] = useState('question');
const hasCommunityIdentity = !!user?.communityNickname;

const resetCreateForm = () => {
  setIsEditing(false);
  setCreateMode('event');
  setFormData(getDefaultFormData());
};

const requireAuth = () => {
  if (!user || user.isVisitor) {
    showToast("請先登入再使用此功能", "info");
    handleLogin();
    return false;
  }
  return true;
};

const runWithIdentity = (intent, action) => {
  if (!requireAuth()) return;
  if (hasCommunityIdentity) {
    action();
    return;
  }
  setPendingIdentityAction(() => action);
  setIdentityIntent(intent);
  setIdentityStep('question');
  setIdentityFormGroup(user?.communityNickname || user?.displayName || "");
  setShowIdentityModal(true);
};

const openCreateTab = () => {
  const proceed = () => {
    resetCreateForm();
    setActiveTab('create');
  };
  if (!requireAuth()) return;
  if (hasCommunityIdentity) {
    proceed();
  } else {
    runWithIdentity('create', proceed);
  }
};

const openProfileTab = () => {
  if (!requireAuth()) return;
  setActiveTab('profile');
};

const handleIdentityModalClose = () => {
  setShowIdentityModal(false);
  setIdentityIntent(null);
  setPendingIdentityAction(null);
  setIdentityStep('question');
};

const handleIdentityConfirm = async () => {
  if (!user) {
    handleIdentityModalClose();
    return;
  }
  const nickname = identityFormGroup.trim();
  if (!nickname) {
    showToast("請填寫社群暱稱", "error");
    return;
  }
  try {
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      communityNickname: nickname,
      displayName: nickname
    });
    setUser(prev => ({ ...prev, communityNickname: nickname, displayName: nickname }));
    showToast("已更新社群身份", "success");
    const action = pendingIdentityAction;
    handleIdentityModalClose();
    if (action) action();
  } catch (error) {
    console.error("Identity save failed", error);
    showToast("儲存失敗，請稍後再試", "error");
  }
};

const handleIdentityAnswerYes = () => setIdentityStep('group');
const handleIdentityAnswerNo = () => {
  if (typeof window !== 'undefined') {
    window.open(COMMUNITY_LINK, '_blank', 'noopener,noreferrer');
  }
};
const handleIdentityGroupConfirm = () => {
  if (!identityFormGroup.trim()) {
    showToast("請輸入社群暱稱", "error");
    return;
  }
  handleIdentityConfirm();
};

  // --- WebView Check & URL Params Check ---
  useEffect(() => {
    if (isWebView()) {
      setInWebView(true);
    }
    
    // Check for shared event/wish IDs in URL
    if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedEventId = urlParams.get('eventId');
        const sharedHostUid = urlParams.get('host');
        const sharedWishId = urlParams.get('wishId');
        const sharedTab = urlParams.get('tab');
        
        // 處理 tab 參數（優先檢查 quiz）
        if (sharedTab === 'quiz') {
            setActiveTab('quiz');
            setQuizStep('intro');
        } else if (sharedEventId) {
            setFilterEventId(sharedEventId);
            setActiveTab('lobby');
            // 直接從 Firestore 載入該活動，確保分享連結可用
            getDoc(doc(db, "events", sharedEventId)).then(eventDoc => {
                if (eventDoc.exists()) {
                    setSharedEvent({ id: eventDoc.id, ...eventDoc.data() });
                }
            }).catch(err => {
                console.error("Error loading shared event:", err);
            });
        } else if (sharedWishId) {
            setFilterWishId(sharedWishId);
            setActiveTab('wishes');
        } else if (sharedHostUid) {
            // 如果有 host 參數，打開主揪檔案頁面
            setViewingHostUid(sharedHostUid);
            fetchHostHistory(sharedHostUid);
            // 獲取主揪的用戶資料（包括頭貼）
            getDoc(doc(db, "users", sharedHostUid)).then(userDoc => {
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setViewingHostPhotoURL(userData.photoURL || null);
                } else {
                    setViewingHostPhotoURL(null);
                }
            }).catch(error => {
                console.error("Error fetching host user data:", error);
                setViewingHostPhotoURL(null);
            });
            setActiveTab('hostProfile');
        }
        if (sharedWishId) {
            setFilterWishId(sharedWishId);
            setActiveTab('wishes');
        }
    }
  }, []);

  // --- Auth 監聽 & User Data Sync ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (currentUser.isAnonymous) {
          setUser(VISITOR_USER);
          setMyEvents([]);
          setMyWaitlists([]);
          return;
        }
        try {
          // 嘗試從 Firestore 獲取使用者詳細資料
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          let userData = userSnap.data();

          if (!userData) {
            // 如果是新使用者，寫入預設資料
            userData = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || "匿名玩家",
              email: currentUser.email,
              photoURL: currentUser.photoURL || "https://api.dicebear.com/7.x/ghost/svg?seed=" + currentUser.uid,
      flakeCount: 0, 
              isBanned: false,
              nameChangedCount: 0, // Initialize name change count
              communityNickname: "",
              isVisitor: false
            };
            await setDoc(userRef, userData, { merge: true });
          } else {
              // 更新登入時間或同步 Google 資料
              await setDoc(userRef, {
                  displayName: userData.displayName || currentUser.displayName || "匿名玩家", // 優先使用 DB 中的暱稱，若無則用 Google 的
                  photoURL: userData.photoURL || currentUser.photoURL || "https://api.dicebear.com/7.x/ghost/svg?seed=" + currentUser.uid,
                  email: currentUser.email,
                  lastSeen: new Date(),
                  nameChangedCount: userData.nameChangedCount || 0, // Ensure field exists
                  isVisitor: false
              }, { merge: true });
          }

          const normalizedDisplayName = userData.communityNickname || userData.displayName || currentUser.displayName || "匿名玩家";
          userData = { ...userData, displayName: normalizedDisplayName };
          setUser({ ...userData, isVisitor: false });
        } catch (error) {
          console.error("Error fetching user data:", error);
          // 如果資料庫讀取失敗，至少先讓使用者登入，但顯示錯誤
          setUser({
            uid: currentUser.uid,
            displayName: currentUser.displayName || "使用者",
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            flakeCount: 0, 
            isBanned: false,
            nameChangedCount: 0,
            communityNickname: "",
            isVisitor: false
          });
          showToast("資料同步錯誤，部分功能可能受限", "error");
        }
      } else {
        setUser(VISITOR_USER);
        setMyEvents([]);
        setMyWaitlists([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- 獲取活動資料 (分頁) ---
  const fetchEvents = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      }
      
      const todayStr = formatDate(new Date());
      let q;

      if (isLoadMore && lastVisible) {
        q = query(
          collection(db, "events"),
          where("date", ">=", todayStr),
          orderBy("date", "asc"),
          orderBy("time", "asc"),
          startAfter(lastVisible),
          limit(EVENTS_PER_PAGE)
        );
      } else {
        q = query(
          collection(db, "events"),
          where("date", ">=", todayStr),
          orderBy("date", "asc"),
          orderBy("time", "asc"),
          limit(EVENTS_PER_PAGE)
        );
      }

      const querySnapshot = await getDocs(q);
      const newEvents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // 更新 Pagination Cursor
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(lastDoc);
      setHasMore(querySnapshot.docs.length === EVENTS_PER_PAGE);

      if (isLoadMore) {
        setEvents(prev => [...prev, ...newEvents]);
      } else {
        setEvents(newEvents);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      showToast("載入活動失敗", "error");
    } finally {
      setLoadingMore(false);
    }
  };

  // --- 獲取許願池資料 ---
  const fetchWishes = async () => {
    try {
      const q = query(collection(db, "wishes"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const newWishes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWishes(newWishes);
    } catch (error) {
      console.error("Error fetching wishes:", error);
    }
  };

  // 初始載入
  useEffect(() => {
    fetchEvents(false);
    fetchWishes(); // 載入許願池
  }, []);

  useEffect(() => {
    if (!filterHostUid) {
        setFilterHostName("");
        return;
    }
    const hostEvent = events.find(ev => ev.hostUid === filterHostUid);
    if (hostEvent) {
        setFilterHostName(hostEvent.host || "");
    }
  }, [filterHostUid, events]);

  useEffect(() => {
    if (guestSessionOptions.length > 0) {
        const matched = guestSessionOptions.find(opt => opt.id === guestSessionId);
        if (!matched) {
            setGuestSessionId(guestSessionOptions[0].id);
        }
    }
  }, [guestSessionOptions, guestSessionId]);

useEffect(() => {
  setIdentityFormGroup(user?.communityNickname || "");
}, [user?.communityNickname]);

/* removed guest session syncing */

  // --- Sync My Events / Waitlists ---
  useEffect(() => {
    if (user && events.length > 0) {
      const joined = [];
      const waiting = [];
      events.forEach(ev => {
        const isParticipant = ev.participants && ev.participants.includes(user.uid);
        const hasGuestRecord = ev.guests?.some(g => g.addedByUid === user.uid);
        if (isParticipant || hasGuestRecord) {
          joined.push(ev.id);
        }
        if (ev.waitlist && ev.waitlist.includes(user.uid)) {
            waiting.push(ev.id);
        }
      });
      setMyEvents(joined);
      setMyWaitlists(waiting);
    }
  }, [user, events]);

  const handleLogin = async () => {
    try {
        await signInWithPopup(auth, googleProvider);
        showToast("登入成功！", "success");
    } catch (error) {
        console.error("Login failed", error);
        showToast("登入失敗: " + error.message, "error");
    }
  };

  const handleLogout = async () => {
    try {
        await signOut(auth);
    setActiveTab('lobby');
    setMyEvents([]);
    setMyWaitlists([]);
        showToast("已登出", "success");
    } catch (error) {
        console.error("Logout failed", error);
    }
  };

  const availableStudios = useMemo(() => {
    const studios = new Set(events.map(e => e.studio));
    return ['All', ...Array.from(studios)];
  }, [events]);

  const availableMonths = useMemo(() => {
    const months = new Set(events.map(e => e.date.substring(0, 7))); // YYYY-MM
    return ['All', ...Array.from(months).sort()];
  }, [events]);

  const hostStats = useMemo(() => {
    const stats = {};
    events.forEach(ev => {
        if (!ev.hostUid) return;
        if (!stats[ev.hostUid]) {
            stats[ev.hostUid] = {
                name: ev.host || "主揪",
                count: 0,
                active: 0,
                missing: 0
            };
        }
        stats[ev.hostUid].count += 1;
        if (getRemainingSlots(ev) > 0) stats[ev.hostUid].active += 1;
        if (getRemainingSlots(ev) > 0) stats[ev.hostUid].missing += 1;
    });
    return stats;
  }, [events]);

  const myWishes = useMemo(() => {
    if (!user) return [];
    return wishes.filter(w => w.wishedBy?.includes(user.uid));
  }, [wishes, user]);

  const getFilteredEvents = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStr = formatDate(now);
    
     let filtered = events;
 
     // 0. 如果有指定 Event ID (分享連結)，優先顯示 sharedEvent，否則從列表中找
     if (filterEventId) {
         if (sharedEvent && sharedEvent.id === filterEventId) {
             return [sharedEvent];
         }
         const found = filtered.find(ev => ev.id === filterEventId);
         return found ? [found] : [];
     }

    if (filterHostUid) {
        filtered = filtered.filter(ev => ev.hostUid === filterHostUid);
    }

    // 1. 基礎日期過濾：只顯示尚未開始的團（含當日但未到時間）
    filtered = filtered.filter(ev => !isEventPast(ev));

    // 2. 篩選器
    if (filterCategory !== 'All') {
      filtered = filtered.filter(ev => ev.category === filterCategory);
    }

    if (filterRegion !== 'All') {
      filtered = filtered.filter(ev => ev.region === filterRegion);
    }

    if (filterStudio !== 'All') {
      filtered = filtered.filter(ev => ev.studio === filterStudio);
    }

    if (filterMonth !== 'All') {
      filtered = filtered.filter(ev => ev.date.startsWith(filterMonth));
    }

    // 新增費用篩選
    if (filterPrice !== 'All') {
        filtered = filtered.filter(ev => {
            const price = parseInt(ev.price);
            if (isNaN(price)) return false;
            if (filterPrice === 'under500') return price < 500;
            if (filterPrice === '500-1000') return price >= 500 && price <= 1000;
            if (filterPrice === 'above1000') return price > 1000;
            return true;
        });
    }

    // 新增缺額篩選
    if (filterSlots !== 'All') {
      filtered = filtered.filter(ev => {
        const slotsLeft = getRemainingSlots(ev);
        if (filterSlots === 'available') return slotsLeft > 0;
        if (filterSlots === 'full') return slotsLeft <= 0;
        if (filterSlots === '1') return slotsLeft === 1;
        if (filterSlots === '2') return slotsLeft === 2;
        if (filterSlots === '3+') return slotsLeft >= 3;
        return true;
      });
    }

    // 3. 搜尋過濾
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(ev => 
        ev.title.toLowerCase().includes(lowerQuery) || 
        (ev.description && ev.description.toLowerCase().includes(lowerQuery)) ||
        ev.studio.toLowerCase().includes(lowerQuery)
      );
    }

    // 4. 特定日期篩選（從日曆選中）
    if (selectedDateFilter) {
      filtered = filtered.filter(ev => ev.date === selectedDateFilter);
    }
    // 5. 快速標籤（只有在沒有特定日期篩選時才生效）
    else if (filterDateType === 'Today') {
      filtered = filtered.filter(ev => ev.date === todayStr);
    } else if (filterDateType === 'Tomorrow') {
      const tmr = new Date();
      tmr.setDate(tmr.getDate() + 1);
      filtered = filtered.filter(ev => ev.date === formatDate(tmr));
    } else if (filterDateType === 'Weekend') {
      filtered = filtered.filter(ev => {
        const d = new Date(ev.date);
        const day = d.getDay();
        return (day === 0 || day === 6);
      });
    }

    return filtered;
  };

  const handleShare = (eventId) => {
    const event = events.find(e => e.id === eventId);
    const url = `${window.location.origin}?eventId=${eventId}`;
    
    let text = url;
    if (event) {
        // 使用 getEffectiveCurrentSlots 來正確計算包含攜伴的總人數
        const currentCount = getEffectiveCurrentSlots(event);
        
        text = `
主題：${event.title}

工作室：${event.studio}

目前人數：${currentCount}人 滿人${event.totalSlots}人

時間、日期：${event.time} ${event.date}

費用：$${event.price}/人

如果有興趣加入的話，可以點擊網址報名

${url}
`.trim();
    }

    navigator.clipboard.writeText(text).then(() => {
        showToast("活動資訊已複製！", "success");
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showToast("複製失敗", "error");
    });
  };

  const handleUpdateProfile = async () => {
    if (!user || !profileName.trim()) return;
    
    // Check if user has already changed name (limit 1)
    if (user.nameChangedCount >= 1) {
        showToast("您已經修改過一次暱稱，無法再次修改", "error");
        setIsEditingProfile(false);
        return;
    }

    try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            displayName: profileName,
            nameChangedCount: (user.nameChangedCount || 0) + 1
        });
        // 更新本地 user state，確保畫面即時反應
        setUser(prev => ({ 
            ...prev, 
            displayName: profileName,
            nameChangedCount: (prev.nameChangedCount || 0) + 1
        }));
        setIsEditingProfile(false);
        showToast("暱稱已更新", "success");
    } catch (error) {
        console.error("Update profile failed", error);
        showToast("更新失敗", "error");
    }
  };

  const handleKick = async (event, userId, type) => {
    if (!event || !userId) return;
    if (!confirm(`確定要移除這位${type === 'waitlist' ? '候補' : '成員'}嗎？(不會計入跳車)`)) return;

    try {
        const eventRef = doc(db, "events", event.id);
        
        let slotsFreed = 0;
        if (type === 'waitlist') {
            await updateDoc(eventRef, {
                waitlist: arrayRemove(userId)
            });
        } else {
            const userGuests = (event.guests || []).filter(g => g.addedByUid === userId);
            const remainingGuests = (event.guests || []).filter(g => g.addedByUid !== userId);
            slotsFreed = 1 + userGuests.length;
            const newSlots = event.currentSlots - slotsFreed;
            await updateDoc(eventRef, {
                participants: arrayRemove(userId),
                guests: remainingGuests,
                currentSlots: newSlots < 0 ? 0 : newSlots,
                isFull: false
            });
        }
        
        if (managingEvent && managingEvent.id === event.id) {
            setManagingEvent(prev => ({
                ...prev,
                [type === 'waitlist' ? 'waitlist' : 'participants']: prev[type === 'waitlist' ? 'waitlist' : 'participants'].filter(uid => uid !== userId),
                guests: type === 'participant' ? (prev.guests || []).filter(g => g.addedByUid !== userId) : prev.guests,
                currentSlots: type === 'participant' ? Math.max(prev.currentSlots - (slotsFreed || 1), 0) : prev.currentSlots
            }));
        }

        showToast("已移除成員", "success");
    } catch (error) {
        console.error("Kick failed:", error);
        showToast("移除失敗", "error");
    }
  };

  // 主揪發起跳車檢舉
  const handleReportFlake = async (event, targetUserId, targetName) => {
    if (!confirm(`確定要回報 ${targetName} 跳車（未出席）嗎？\n\n這需要現場另一位團員附議才會生效。`)) return;

    try {
      const eventRef = doc(db, "events", event.id);
      await updateDoc(eventRef, {
        pendingFlake: {
          targetUid: targetUserId,
          targetName: targetName,
          reporterUid: user.uid
        }
      });
      showToast("已發起檢舉，請請其他團員按「附議」", "success");
      // 這裡不需要特別更新 managingEvent，因為 onSnapshot 會自動更新
    } catch (error) {
      console.error("Report flake failed:", error);
      showToast("發起失敗", "error");
    }
  };

  // 團員附議跳車檢舉
  const handleConfirmFlake = async (event) => {
    if (!event.pendingFlake) return;
    const { targetUid, targetName } = event.pendingFlake;

    // 使用 confirmModal 來顯示詳細訊息
    setConfirmModal({ 
        show: true, 
        eventId: event.id, 
        action: 'confirmFlake', 
        title: '跳車附議確認',
        message: `主揪回報「${targetName}」未出席本次活動（跳車）。\n\n請問您是否同意此檢舉？\n(若屬實，該成員將被記一點違規)`
    });
  };

  const ManageParticipantsModal = () => {
    const [participants, setParticipants] = useState([]);
    const [waitlist, setWaitlist] = useState([]);
    const [guestList, setGuestList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!managingEvent) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const eventSnap = await getDoc(doc(db, "events", managingEvent.id));
                const latestEvent = eventSnap.exists() ? eventSnap.data() : managingEvent;
                const participantUids = latestEvent.participants || managingEvent.participants || [];
                const waitlistUids = latestEvent.waitlist || managingEvent.waitlist || [];

                const pPromises = participantUids.map(uid => getDoc(doc(db, "users", uid)));
                const wPromises = waitlistUids.map(uid => getDoc(doc(db, "users", uid)));
                
                const [pSnaps, wSnaps] = await Promise.all([Promise.all(pPromises), Promise.all(wPromises)]);
                
                setParticipants(pSnaps.map(s => s.exists() ? s.data() : { uid: s.id, displayName: '未知使用者' }));
                setWaitlist(wSnaps.map(s => s.exists() ? s.data() : { uid: s.id, displayName: '未知使用者' }));
                setGuestList(latestEvent.guests || managingEvent.guests || []);
            } catch (err) {
                console.error("Error fetching users:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [managingEvent]);

    const isHost = user && managingEvent && user.uid === managingEvent.hostUid && !isViewOnlyMode;

    const getGuestSessionLabel = () => '主場';

    const matchGuestRecord = (source, target) => {
        if (!source || !target) return false;
        if (source.id && target.id) return source.id === target.id;
        const normalizeTime = (value) => {
            if (!value) return null;
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
                const parsed = Date.parse(value);
                return isNaN(parsed) ? null : parsed;
            }
            if (value.seconds) return value.seconds * 1000 + (value.nanoseconds || 0) / 1e6;
            if (value.toDate) return value.toDate().getTime();
            return null;
        };
        return (
            source.name === target.name &&
            source.addedByUid === target.addedByUid &&
            normalizeTime(source.addedAt) === normalizeTime(target.addedAt)
        );
    };

    const handleRemoveGuestEntry = async (guest) => {
        if (!managingEvent || !guest) return;
        if (!confirm(`確定要移除攜伴「${guest.name || '朋友'}」嗎？`)) return;
        try {
            const eventRef = doc(db, "events", managingEvent.id);
            const eventSnap = await getDoc(eventRef);
            const liveEvent = eventSnap.exists() ? eventSnap.data() : managingEvent;
            const currentGuests = liveEvent.guests || [];
            const filteredGuests = currentGuests.filter(g => !matchGuestRecord(g, guest));
            if (filteredGuests.length === currentGuests.length) {
                showToast("找不到此攜伴紀錄，請重新整理後再試", "error");
                return;
            }
            const freedSlots = currentGuests.length - filteredGuests.length;
            const baseSlots = liveEvent.currentSlots || managingEvent.currentSlots || 0;
            const newSlots = baseSlots - freedSlots;
            const notice = guest.addedByUid ? {
                id: generateRandomId(),
                ownerUid: guest.addedByUid,
                ownerName: guest.addedByName || '團員',
                guestName: guest.name || '攜伴',
                removedByUid: user.uid,
                removedByName: user.displayName || '主揪',
                createdAt: Date.now(),
                eventTitle: liveEvent.title || managingEvent.title || ''
            } : null;

            const updatePayload = {
                guests: filteredGuests,
                isFull: false
            };
            updatePayload.currentSlots = newSlots < 0 ? 0 : newSlots;

            if (notice) {
                updatePayload.guestRemovalNotices = arrayUnion(notice);
            }

            await updateDoc(eventRef, updatePayload);
            setGuestList(filteredGuests);
            setManagingEvent(prev => {
                if (!prev || prev.id !== managingEvent.id) return prev;
                return { ...prev, guests: filteredGuests, currentSlots: newSlots < 0 ? 0 : newSlots };
            });
            fetchEvents(false);
            showToast("攜伴已移除", "success");
        } catch (error) {
            console.error("Error removing guest:", error);
            showToast("移除攜伴失敗", "error");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-slate-800 shadow-2xl relative flex flex-col max-h-[80vh]">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500" />
                
                <button onClick={() => { setShowManageModal(false); setManagingEvent(null); }} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full transition-colors">
                    <X size={18} />
                </button>

                <h3 className="text-xl font-bold text-white mb-1">{isHost ? '管理團員' : '已參加成員'}</h3>
                <p className="text-slate-400 text-xs mb-4">{isHost ? '可以移除成員或回報跳車。' : '查看目前參與的夥伴。'}</p>

                {/* 顯示正在進行的檢舉狀態 - 只有在非 ViewOnly 模式下或 ViewOnly 模式下隱藏（題目說：不要其他的，包含跳車檢舉進行中等等，意即檢視模式下要隱藏） */}
                {/* 使用者需求：View Participants 無論是否主揪，都只顯示成員，不要其他的(含跳車檢舉)。 */}
                {/* 因此 isViewOnlyMode 為 true 時，這些都應該隱藏。上面已經把 isHost 綁定 !isViewOnlyMode，所以依賴 isHost 判斷即可，或額外判斷。 */}
                {/* 但 pendingFlake 顯示原本是針對所有人可見的提示，現在需求是 "查看已參加成員...不要其他的...包含跳車檢舉" */}
                {/* 所以當 isViewOnlyMode 為 true 時，這個區塊應該隱藏。 */}
                
                {managingEvent.pendingFlake && !isViewOnlyMode && (
                    <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                        <div className="flex items-start gap-2">
                            <AlertTriangle size={16} className="text-yellow-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-yellow-500">跳車檢舉進行中</p>
                                <p className="text-xs text-slate-300 mt-1">
                                    已回報 <strong>{managingEvent.pendingFlake.targetName}</strong> 未出席。
                                    <br/>等待其他團員附議...
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="overflow-y-auto custom-scrollbar space-y-6 pr-1">
                    {/* 正式成員 */}
                    <div>
                        <h4 className="text-emerald-400 text-sm font-bold mb-3 flex items-center">
                            <Users size={14} className="mr-1.5"/> 正式成員 ({participants.length})
                        </h4>
                        <div className="space-y-2">
                            {loading ? <p className="text-slate-500 text-xs">載入中...</p> : 
                             participants.length === 0 ? <p className="text-slate-500 text-xs">無</p> :
                             participants.map(p => (
                                <div key={p.uid} className="flex flex-col bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 gap-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                                                {p.photoURL ? <img src={p.photoURL} alt="" className="w-full h-full object-cover"/> : <User size={16} className="text-slate-400"/>}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-200">{p.displayName} {p.uid === managingEvent.hostUid && '(主揪)'}</div>
                                                {p.flakeCount > 0 && (
                                                    <div className="flex items-center text-[10px] text-red-400 gap-1">
                                                        <LogOut size={10} /> 跳車 {p.flakeCount} 次
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {isHost && p.uid !== managingEvent.hostUid && (
                                            <button 
                                                onClick={() => handleKick(managingEvent, p.uid, 'participant')}
                                                className="text-xs bg-slate-700 text-slate-400 px-3 py-1.5 rounded-lg hover:bg-slate-600 transition-colors"
                                            >
                                                移除
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* 只有主揪可以看到檢舉按鈕，且不能檢舉自己，也不能重複檢舉 */}
                                    {isHost && p.uid !== managingEvent.hostUid && !managingEvent.pendingFlake && (
                                        <button 
                                            onClick={() => handleReportFlake(managingEvent, p.uid, p.displayName)}
                                            className="w-full py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 hover:bg-red-500/20 flex items-center justify-center gap-1"
                                        >
                                            <AlertTriangle size={12} />
                                            回報未出席 (跳車)
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 攜伴名單 */}
                    <div>
                        <h4 className="text-indigo-400 text-sm font-bold mb-3 flex items-center">
                            <UserPlus size={14} className="mr-1.5"/> 攜伴名單 ({guestList.length})
                        </h4>
                        {guestList.length === 0 ? (
                            <p className="text-slate-500 text-xs">目前沒有攜伴紀錄</p>
                        ) : (
                            <div className="space-y-2">
                                {guestList.map((guest, idx) => (
                                    <div key={`${guest.id || guest.name || 'guest'}-${idx}`} className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-bold text-slate-200">{guest.name || `朋友 ${idx + 1}`}</div>
                                            <div className="text-xs text-slate-500">由 {guest.addedByName || '團員'} 代報</div>
                                            <div className="text-[10px] text-slate-500 mt-1">場次：{getGuestSessionLabel(guest)}</div>
                                        </div>
                                        {isHost && (
                                            <button 
                                                onClick={() => handleRemoveGuestEntry(guest)} 
                                                className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1"
                                            >
                                                <Trash2 size={12} />
                                                移除
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 候補名單 (候補不能檢舉跳車，只能移除) */}
                    <div>
                        <h4 className="text-yellow-400 text-sm font-bold mb-3 flex items-center">
                            <Hourglass size={14} className="mr-1.5"/> 候補名單 ({waitlist.length})
                        </h4>
                        <div className="space-y-2">
                            {loading ? <p className="text-slate-500 text-xs">載入中...</p> :
                             waitlist.length === 0 ? <p className="text-slate-500 text-xs">無候補</p> :
                             waitlist.map(p => (
                                <div key={p.uid} className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                                            {p.photoURL ? <img src={p.photoURL} alt="" className="w-full h-full object-cover"/> : <User size={16} className="text-slate-400"/>}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-200">{p.displayName}</div>
                                            {p.flakeCount > 0 && (
                                                <div className="flex items-center text-[10px] text-red-400 gap-1">
                                                    <LogOut size={10} /> 跳車 {p.flakeCount} 次
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {isHost && (
                                        <button 
                                            onClick={() => handleKick(managingEvent, p.uid, 'waitlist')}
                                            className="text-xs bg-slate-700 text-slate-400 px-2 py-1.5 rounded-lg hover:bg-slate-600 transition-colors"
                                        >
                                            移除
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const SponsorModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500" />
         
         <button onClick={() => setShowSponsorModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full transition-colors">
            <X size={18} />
         </button>

         <div className="text-center mt-2">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
               <Coffee size={32} className="text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">贊助小迷糊</h3>
            <p className="text-slate-400 text-sm mb-6">您的支持是我們持續開發的動力！</p>
            
            <div className="bg-white p-3 rounded-2xl inline-block shadow-lg mb-6">
               <img 
                 src="https://img.nextedge-ai-studio.com/S__10273239.jpg" 
                 alt="Sponsor QR Code" 
                 className="w-48 h-48 object-contain rounded-lg"
               />
            </div>

            <div className="flex gap-3">
               <button 
                 onClick={() => {
                    const link = document.createElement('a');
                    link.href = 'https://img.nextedge-ai-studio.com/S__10273239.jpg';
                    link.download = 'sponsor-qr.jpg';
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                 }}
                 className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold text-sm border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
               >
                 <Download size={16} />
                 下載 QR Code
               </button>
               <button 
                 onClick={() => setShowSponsorModal(false)}
                 className="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-900 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition-all"
               >
                 我已贊助
               </button>
            </div>
         </div>
      </div>
    </div>
  );

  const ImageModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowImageModal(false)}>
      <div className="bg-slate-900 w-full max-w-2xl rounded-3xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
         <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500" />
         
         <button onClick={() => setShowImageModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full transition-colors z-10">
            <X size={20} />
         </button>

         <div className="text-center mt-2">
            <div className="bg-white p-4 rounded-2xl inline-block shadow-lg max-w-full">
               <img 
                 src={imageModalUrl} 
                 alt="優惠詳情" 
                 className="max-w-full h-auto max-h-[70vh] object-contain rounded-lg"
               />
            </div>
         </div>
      </div>
    </div>
  );

  const ParticipantList = ({ uids, hostUid }) => {
    return null; // Deprecated component, replaced by ManageParticipantsModal
  };

  const CalendarModal = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth(); 
    const daysCount = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysCount; i++) {
      days.push(new Date(year, month, i));
    }

    const getEventCount = (d) => {
        if (!d) return 0;
        const dateStr = formatDate(d);
        // 這裡的 events 現在是即時從 Firestore 取得的，所以這裡計算的數量也是即時的
        return events.filter(e => e.date === dateStr).length;
    };

    const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    const selectedDateEvents = selectedDate 
      ? events.filter(e => e.date === formatDate(selectedDate))
      : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar size={20} className="text-emerald-400"/>
                        揪團日曆
                    </h3>
                    <button onClick={() => setShowCalendar(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto p-4 custom-scrollbar">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><ChevronLeft/></button>
                        <span className="text-lg font-bold text-white">
                            {year} 年 {month + 1} 月
                        </span>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><ChevronRight/></button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-6">
                        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                            <div key={d} className="text-center text-slate-500 text-sm py-2 font-medium">{d}</div>
                        ))}
                        {days.map((d, idx) => {
                            if (!d) return <div key={`empty-${idx}`} className="aspect-square"></div>;
                            
                            const count = getEventCount(d);
                            const dateStr = formatDate(d);
                            const isSelected = selectedDate && formatDate(selectedDate) === dateStr;
                            const isToday = formatDate(new Date()) === dateStr;

                            // 判斷是否為過去的日期
                            const checkDate = new Date(d);
                            checkDate.setHours(0, 0, 0, 0);
                            const todayDate = new Date();
                            todayDate.setHours(0, 0, 0, 0);
                            const isPast = checkDate < todayDate;

                            return (
                                <button 
                                    key={dateStr}
                                    disabled={isPast}
                                    onClick={() => {
                                        // 設定日期篩選並關閉日曆，回到主頁面
                                        setSelectedDateFilter(dateStr);
                                        setFilterDateType('All'); // 清除快速標籤
                                        setShowCalendar(false);
                                        setActiveTab('lobby');
                                    }}
                                    className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all
                                        ${isPast 
                                            ? 'bg-slate-800/20 text-slate-700 cursor-not-allowed' 
                                            : isSelected 
                                                ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' 
                                                : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300'}
                                        ${isToday ? 'ring-2 ring-emerald-500/50' : ''}
                                    `}
                                >
                                    <span className={`text-sm ${isSelected ? 'font-bold' : ''}`}>{d.getDate()}</span>
                                    {count > 0 && !isPast && (
                                        <span className={`mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isSelected ? 'bg-slate-900/20 text-slate-900' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {selectedDate && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h4 className="text-slate-400 text-sm font-medium mb-2 border-b border-slate-800 pb-2">
                                {formatDate(selectedDate)} 的揪團 ({selectedDateEvents.length})
                            </h4>
                            {selectedDateEvents.length === 0 ? (
                                <p className="text-center text-slate-500 py-4">這天還沒有人開團</p>
                            ) : (
                                selectedDateEvents.map(ev => (
                                    <div key={ev.id} onClick={() => { setShowCalendar(false); /* 這裡可以做捲動定位 */ }} className="bg-slate-800 rounded-xl p-3 flex justify-between items-center cursor-pointer hover:bg-slate-700 transition-colors border border-slate-700/50">
                                        <div>
                                            <div className="font-bold text-white text-sm">{ev.title}</div>
                                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                                                <span>{ev.time}</span>
                                                <span>•</span>
                                                <span>{ev.studio}</span>
                                            </div>
                                        </div>
                                        <div className={`text-xs px-2 py-1 rounded font-bold ${getRemainingSlots(ev) === 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                            {getRemainingSlots(ev) === 0 ? '滿' : `缺${getRemainingSlots(ev)}`}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  };

  const handleAddToCalendar = (ev) => {
    // 解析開始時間
    const startDate = new Date(ev.date + 'T' + ev.time);
    
    // 計算結束時間：開始時間 + 總時長（分鐘）
    const durationMinutes = parseInt(ev.duration) || 120; // 預設 120 分鐘
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
    
    // 格式化為 Google Calendar 需要的格式 (YYYYMMDDTHHMMSS)
    const formatDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${minutes}00`;
    };
    
    const startTime = formatDateTime(startDate);
    const endTime = formatDateTime(endDate);
    
    const details = `主揪: ${ev.host}\n地點: ${ev.location}\n備註: ${ev.description || '無'}\n遊玩時長: ${durationMinutes} 分鐘`;
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(ev.location)}`;
    
    window.open(url, '_blank');
  };

  const handleNavigation = (location) => {
    const url = getMapsUrl(location) || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location || '')}`;
    window.open(url, '_blank');
  };

  const handleShowParticipants = async (ev) => {
    if (!ev.participants || ev.participants.length === 0) {
      showToast("目前還沒有參加者", "error");
      return;
    }

    try {
      // 獲取所有參加者的資料
      const participantPromises = ev.participants.map(uid => getDoc(doc(db, "users", uid)));
      const participantSnaps = await Promise.all(participantPromises);
      const participantNames = participantSnaps
        .filter(snap => snap.exists())
        .map(snap => {
          const data = snap.data();
          return data.displayName || '未知使用者';
        });

      // 顯示參加者名單（使用較長的顯示時間，因為名單可能較長）
      const namesList = participantNames.join('、');
      showToast(`參加者：${namesList}`, "success", 5000);
    } catch (error) {
      console.error("Error fetching participants:", error);
      showToast("無法載入參加者名單", "error");
    }
  };

  const handleEdit = (ev) => {
    if (ev.hostUid !== user.uid) {
        showToast("您沒有權限編輯此活動", "error");
        return;
    }
    if (ev.isChainEvent) {
        showToast("連刷舊團目前僅供檢視，無法在此編輯", "info");
        return;
    }
    setFormData({
      title: ev.title, studio: ev.studio, region: ev.region || "北部", category: ev.category || "密室逃脫", date: ev.date, time: ev.time,
      price: ev.price, priceFull: ev.priceFull || ev.price,
      totalSlots: ev.totalSlots, location: ev.location, type: ev.type || "恐怖驚悚",
      website: ev.website || "", description: ev.description || "", 
      meetingTime: ev.meetingTime || "15", duration: ev.duration || "120", minPlayers: ev.minPlayers || 4,
      teammateNote: ev.teammateNote || "", contactLineId: ev.contactLineId || "", isChainEvent: false, chainSessions: []
    });
    setEditingId(ev.id);
    setIsEditing(true);
    setActiveTab('create');
  };

  const handleDelete = async (id, options = {}) => {
    const { skipConfirm = false, toastMessage = "揪團已關閉並封存" } = options;
    const eventToDelete = events.find(e => e.id === id);
    if (!eventToDelete) return;

    if (eventToDelete.hostUid !== user.uid) {
        showToast("您沒有權限刪除此活動", "error");
        return;
    }

    if (!skipConfirm && !confirm("確定要刪除這個揪團嗎？此操作無法復原。")) return;
    try {
      const hostUid = eventToDelete.hostUid || user?.uid || "";
      // 1. 備份/紀錄關團資訊到 archived_events 集合
      await setDoc(doc(db, "archived_events", id), {
        ...eventToDelete,
        hostUid,
        archivedAt: new Date(),
        finalParticipants: eventToDelete.participants || [],
        finalWaitlist: eventToDelete.waitlist || []
      });

      // 2. 從 events 集合中移除
      await deleteDoc(doc(db, "events", id));
      showToast(toastMessage, "success");
      fetchEvents(false); // Refresh events
    } catch (error) {
      console.error("Error removing document: ", error);
      showToast("刪除失敗", "error");
    }
  };

  const toggleChainDetails = (eventId) => {
    setExpandedChainInfo(prev => ({
        ...prev,
        [eventId]: !prev[eventId]
    }));
  };

  const getChainSessionKey = (session, index) => session?.id || `chain-${index}`;

  const getChainSessionList = (event) => {
    if (!event) return [];
    const base = {
        id: 'main',
        title: event.title,
        type: event.type,
        date: event.date,
        time: event.time,
        price: event.price,
        participants: event.participants || [],
        totalSlots: event.totalSlots || 0,
        currentSlots: event.currentSlots ?? (event.participants?.length || 0),
        isFull: event.isFull
    };
    const extras = (event.chainSessions || []).map((session, idx) => ({
        id: getChainSessionKey(session, idx),
        title: session.title || `第 ${idx + 2} 場`,
        type: session.type || event.type,
        date: session.date,
        time: session.time,
        price: session.price,
        participants: session.participants || [],
        totalSlots: session.totalSlots || event.totalSlots || 0,
        currentSlots: session.currentSlots ?? (session.participants?.length || 0),
        isFull: session.isFull
    }));
    return [base, ...extras];
  };

  const getJoinedSessionsForUser = (event, uid) => {
    const options = [];
    if (!event || !uid) return options;
    if (event.participants?.includes(uid)) {
        options.push({
            id: 'main',
            label: `主場：${event.title}`,
            remaining: Math.max((event.totalSlots || 0) - (event.currentSlots || event.participants.length || 0), 0)
        });
    }
    (event.chainSessions || []).forEach((session, index) => {
        const sessionId = getChainSessionKey(session, index);
        if (session.participants?.includes(uid)) {
            const total = session.totalSlots || event.totalSlots || 0;
            const current = session.currentSlots ?? (session.participants?.length || 0);
            options.push({
                id: sessionId,
                label: `第 ${index + 2} 場：${session.title || '未命名主題'}`,
                remaining: Math.max(total - current, 0)
            });
        }
    });
    return options;
  };

  const openChainSelectionModal = (event) => {
    if (!user) {
        showToast("請先登入！", "error");
        return;
    }
    const selection = { main: event.participants?.includes(user.uid) || false };
    (event.chainSessions || []).forEach((session, index) => {
        const key = getChainSessionKey(session, index);
        selection[key] = session.participants?.includes(user.uid) || false;
    });
    setChainSelection(selection);
    setChainEventTarget(event);
    setShowChainModal(true);
  };

  const handleChainSessionToggle = (sessionId) => {
    setChainSelection(prev => ({
        ...prev,
        [sessionId]: !prev[sessionId]
    }));
  };

  const handleChainSelectionConfirm = async () => {
    if (!chainEventTarget || !user) return;
    try {
        const eventRef = doc(db, "events", chainEventTarget.id);
        const eventSnap = await getDoc(eventRef);
        if (!eventSnap.exists()) {
            showToast("活動已不存在", "error");
            setShowChainModal(false);
            return;
        }
        const eventData = eventSnap.data();
        const totalSlots = eventData.totalSlots || chainEventTarget.totalSlots || 0;
        let participants = Array.isArray(eventData.participants) ? [...eventData.participants] : [];
        let currentSlots = eventData.currentSlots ?? participants.length;
        const baseSelected = !!chainSelection.main;
        const baseJoined = participants.includes(user.uid);
        const errors = [];
        if (baseSelected && !baseJoined) {
            if (totalSlots && currentSlots >= totalSlots) {
                errors.push("主場已額滿");
            } else {
                participants.push(user.uid);
                currentSlots += 1;
            }
        } else if (!baseSelected && baseJoined) {
            participants = participants.filter(uid => uid !== user.uid);
            currentSlots = Math.max(currentSlots - 1, 0);
        }
        let updatedChainSessions = (eventData.chainSessions || []).map((session, index) => {
            const key = getChainSessionKey(session, index);
            const selected = !!chainSelection[key];
            const total = session.totalSlots || totalSlots || eventData.totalSlots || 0;
            let sessionParticipants = Array.isArray(session.participants) ? [...session.participants] : [];
            let sessionCurrent = session.currentSlots ?? sessionParticipants.length;
            const joined = sessionParticipants.includes(user.uid);
            if (selected && !joined) {
                if (total && sessionCurrent >= total) {
                    errors.push(`${session.title || '連刷場'} 已額滿`);
                } else {
                    sessionParticipants.push(user.uid);
                    sessionCurrent += 1;
                }
            } else if (!selected && joined) {
                sessionParticipants = sessionParticipants.filter(uid => uid !== user.uid);
                sessionCurrent = Math.max(sessionCurrent - 1, 0);
            }
            const uniqueParticipants = Array.from(new Set(sessionParticipants));
            const adjustedCurrent = Math.min(uniqueParticipants.length, total || uniqueParticipants.length);
            return {
                ...session,
                id: session.id || generateRandomId(),
                participants: uniqueParticipants,
                currentSlots: adjustedCurrent,
                isFull: total ? adjustedCurrent >= total : false
            };
        });
        if (errors.length > 0) {
            showToast(errors[0], "error");
            return;
        }
        participants = Array.from(new Set(participants));
        currentSlots = Math.min(participants.length, totalSlots || participants.length);
        const isFull = totalSlots ? currentSlots >= totalSlots : false;
        await updateDoc(eventRef, {
            participants,
            currentSlots,
            isFull,
            chainSessions: updatedChainSessions
        });
        showToast("連刷場次已更新", "success");
        setShowChainModal(false);
        setChainEventTarget(null);
        fetchEvents(false);
    } catch (error) {
        console.error("Error updating chain selections:", error);
        showToast("更新失敗，請稍後再試", "error");
    }
  };

  const promptJoin = (id) => {
    if (user?.flakeCount >= 3) { showToast("帳號受限。", "error"); return; }
    const targetEvent = events.find(e => e.id === id);
    if (!targetEvent) return;
    runWithIdentity('join', () => {
      setConfirmModal({ show: true, eventId: id, action: 'join', title: targetEvent.title });
    });
  };

  const fetchHostHistory = async (hostUid) => {
    try {
      // 獲取該主揪的所有活動（包括已結束的）
      // 直接使用不需要索引的查詢，然後在客戶端排序
      const q = query(
        collection(db, "events"),
        where("hostUid", "==", hostUid)
      );
      const querySnapshot = await getDocs(q);
      const historyEvents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          // 按日期和時間降序排序（最新的在前）
          const dateA = a.date || '';
          const dateB = b.date || '';
          if (dateA !== dateB) {
            return dateB.localeCompare(dateA); // 日期降序
          }
          // 如果日期相同，按時間降序
          const timeA = a.time || '00:00';
          const timeB = b.time || '00:00';
          return timeB.localeCompare(timeA);
        });
      setHostHistoryEvents(historyEvents);
    } catch (error) {
      console.error("Error fetching host history:", error);
      showToast("無法載入歷史記錄", "error");
      setHostHistoryEvents([]);
    }
  };

  const handleViewHostProfile = async (uid, name) => {
    if (!uid) return;
    setViewingHostUid(uid);
    setViewingHostName(name || hostStats[uid]?.name || "");
    setFilterEventId(null);
    setFilterWishId(null);
    
    // 獲取主揪的用戶資料（包括頭貼）
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setViewingHostPhotoURL(userData.photoURL || null);
    } else {
        setViewingHostPhotoURL(null);
      }
    } catch (error) {
      console.error("Error fetching host user data:", error);
      setViewingHostPhotoURL(null);
    }
    
    fetchHostHistory(uid);
    setActiveTab('hostProfile');
  };

  const clearHostFilter = () => {
    setFilterHostUid(null);
    setFilterHostName("");
    if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('host');
        window.history.replaceState({}, '', url);
    }
  };

  const openGuestModalForEvent = (event) => {
    if (!user) {
        showToast("請先登入！", "error");
        return;
    }
    if (!event) return;
    const options = getJoinedSessionsForUser(event, user.uid);
    if (options.length === 0) {
        showToast("請先選擇要參加的場次，再使用攜伴功能", "error");
        return;
    }
    setGuestSessionOptions(options);
    setGuestSessionId(options[0].id);
    setGuestEventId(event.id);
    setGuestNames([""]);
    setShowGuestModal(true);
  };

  const closeGuestModal = () => {
    setShowGuestModal(false);
    setGuestEventId(null);
    setGuestSessionOptions([]);
    setGuestSessionId('main');
    setGuestNames([""]);
  };

  const handleJoin = async (id) => {
    // 這個函式現在改為由 executeAction 呼叫，或者保留給內部邏輯
    // 為了避免混淆，我們把邏輯移到 executeAction 或獨立出來
    // 這裡保留空殼或移除，下面會重寫 executeAction
  };

  const promptCancel = (id) => setConfirmModal({ show: true, eventId: id, action: 'cancel' });

  const handleGuestJoin = async () => {
    if (!user) {
        showToast("請先登入！", "error");
        return;
    }
    // 過濾出有效名字
    const validGuests = guestNames.filter(name => name.trim() !== "");
    
    if (validGuests.length === 0) {
        showToast("請至少輸入一位朋友的名字", "error");
        return;
    }
    
    try {
        const targetEvent = events.find(e => e.id === guestEventId);
        if (!targetEvent) return;

        const eventRef = doc(db, "events", guestEventId);
        
        // 準備要加入的 guests 陣列
        const newGuests = validGuests.map(name => ({
            id: generateRandomId(),
            addedByUid: user.uid,
            addedByName: user.displayName || "團員",
            name: name.trim(),
            addedAt: Date.now()
        }));

        const alreadyJoined = targetEvent.participants?.includes(user.uid);
        const totalNeeded = validGuests.length + (alreadyJoined ? 0 : 1);
        if (targetEvent.currentSlots + totalNeeded > targetEvent.totalSlots) {
            const remaining = Math.max(targetEvent.totalSlots - targetEvent.currentSlots - (alreadyJoined ? 0 : 1), 0);
            showToast(remaining > 0 
                ? `名額不足，只能再帶 ${remaining} 位朋友` 
                : "名額不足，請先確認剩餘空位", "error");
            return;
        }
        const newSlots = targetEvent.currentSlots + totalNeeded;
        const updatePayload = {
            currentSlots: newSlots,
            isFull: newSlots >= targetEvent.totalSlots,
            guests: arrayUnion(...newGuests)
        };
        if (!alreadyJoined) {
            updatePayload.participants = arrayUnion(user.uid);
        }
        await updateDoc(eventRef, updatePayload);
        
        showToast(`已幫 ${validGuests.join('、')} 報名成功！`, "success");
        closeGuestModal();
        fetchEvents(false); // Refresh
    } catch (error) {
        console.error("Error adding guests:", error);
        showToast("攜伴失敗: " + error.message, "error");
    }
  };

  const handleDismissGuestNotice = async (eventId, notice) => {
    if (!eventId || !notice) return;
    try {
        const eventRef = doc(db, "events", eventId);
        await updateDoc(eventRef, {
            guestRemovalNotices: arrayRemove(notice)
        });
        fetchEvents(false);
    } catch (error) {
        console.error("Error dismissing guest notice:", error);
        showToast("無法隱藏通知", "error");
    }
  };

  const handleJoinWish = async (wish) => {
    if (!user) { showToast("請先登入！", "error"); return; }
    
    // Toggle: If already wished, cancel it
    if (wish.wishedBy?.includes(user.uid)) {
        handleCancelWish(wish.id);
        return;
    }

    try {
        const wishRef = doc(db, "wishes", wish.id);
        await updateDoc(wishRef, {
            wishedBy: arrayUnion(user.uid),
            wishCount: (wish.wishCount || 0) + 1
        });
        showToast("集氣 +1 成功！", "success");
        fetchWishes();
    } catch (error) {
        console.error("Error joining wish:", error);
        showToast("操作失敗", "error");
    }
  };

  const handleCancelWish = async (wishId) => {
    if (!user) return;
    const wish = wishes.find(w => w.id === wishId);
    if (!wish) return;

    if (!confirm(wish.hostUid === user.uid ? "確定要刪除這個許願嗎？" : "確定要取消許願嗎？")) return;

    try {
      if (wish.hostUid === user.uid) {
        await deleteDoc(doc(db, "wishes", wishId));
        showToast("許願已刪除", "success");
      } else {
        await updateDoc(doc(db, "wishes", wishId), {
          wishedBy: arrayRemove(user.uid),
          wishCount: (wish.wishCount || 1) - 1
        });
        showToast("已取消許願", "success");
      }
      fetchWishes(); 
    } catch (error) {
      console.error("Error cancelling wish:", error);
      showToast("操作失敗", "error");
    }
  };

  const handleShareWish = (wish) => {
    const url = new URL(window.location.href);
    url.searchParams.set('wishId', wish.id);
    url.searchParams.delete('eventId'); 
    
    const text = `我正在許願 ${wish.title} 團 如果有興趣的人歡迎點選下面連結集氣!\n\n${url.toString()}`;

    navigator.clipboard.writeText(text).then(() => {
        showToast("連結已複製，快去邀請朋友集氣！");
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showToast("複製失敗", "error");
    });
  };

  const handleViewWishMembers = async (wish) => {
    if (!wish.wishedBy || wish.wishedBy.length === 0) {
        setWishMembersModal({ show: true, wishId: wish.id, members: [] });
        return;
    }

    try {
        // Fetch user details for all wishers
        // Firestore 'in' query supports up to 10 items. If more, need to batch or fetch individually.
        // Assuming wishedBy won't be huge for now, or just fetching individually.
        // Fetching individually is safer for larger lists.
        const memberPromises = wish.wishedBy.map(uid => getDoc(doc(db, "users", uid)));
        const memberSnaps = await Promise.all(memberPromises);
        const members = memberSnaps.map(snap => {
            if (snap.exists()) {
                const data = snap.data();
                return { 
                    uid: snap.id, 
                    displayName: data.communityNickname || data.displayName || "未命名玩家", 
                    photoURL: data.photoURL 
                };
            }
            return { uid: "unknown", displayName: "未知玩家" };
        });
        
        setWishMembersModal({ show: true, wishId: wish.id, members });
    } catch (error) {
        console.error("Error fetching wish members:", error);
        showToast("無法載入成員名單", "error");
    }
  };

  const executeAction = async () => {
    const { eventId, action } = confirmModal;
    
    if (action === 'confirmFlake') {
        const event = events.find(e => e.id === eventId);
        if (!event || !event.pendingFlake) return;
        const { targetUid } = event.pendingFlake;

        try {
            // 1. 更新使用者的跳車次數
            const userRef = doc(db, "users", targetUid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const currentFlake = userSnap.data().flakeCount || 0;
                const newFlake = currentFlake + 1;
                await updateDoc(userRef, {
                    flakeCount: newFlake,
                    isBanned: newFlake >= 3
                });
            }

            // 2. 清除 pendingFlake 狀態，並將該使用者移除
            const eventRef = doc(db, "events", eventId);
            const newSlots = event.currentSlots - 1;
            
            await updateDoc(eventRef, {
                pendingFlake: null,
                participants: arrayRemove(targetUid),
                currentSlots: newSlots < 0 ? 0 : newSlots,
                isFull: false
            });

            showToast("檢舉成立！已記錄跳車並移除該成員", "success");
        } catch (error) {
            console.error("Confirm flake failed:", error);
            showToast("附議失敗", "error");
        }
        setConfirmModal({ show: false, eventId: null, action: null });
        return;
    }
    
    if (action === 'join') {
        const targetEvent = events.find(e => e.id === eventId);
        if (!targetEvent) return;

        try {
            const eventRef = doc(db, "events", eventId);
            if (targetEvent.currentSlots >= targetEvent.totalSlots) {
                if (!myWaitlists.includes(eventId)) {
                    await updateDoc(eventRef, {
                        waitlist: arrayUnion(user.uid)
                    });
                    showToast("已加入候補名單！", "success");
                    fetchEvents(false);
                }
            } else {
                const newSlots = targetEvent.currentSlots + 1;
                await updateDoc(eventRef, {
                    participants: arrayUnion(user.uid),
                    currentSlots: newSlots,
                    isFull: newSlots >= targetEvent.totalSlots
                });
                showToast(`報名成功！`, "success");
                fetchEvents(false);
            }
        } catch (error) {
            console.error("Error joining event: ", error);
            showToast("加入失敗: " + error.message, "error");
        }
    } else if (action === 'cancel') {
      const isWaitlisted = myWaitlists.includes(eventId);
      const targetEvent = events.find(e => e.id === eventId);
      
      try {
        const eventRef = doc(db, "events", eventId);

      if (isWaitlisted) {
            await updateDoc(eventRef, {
                waitlist: arrayRemove(user.uid)
            });
        showToast("已取消候補申請", "success");
        fetchEvents(false);
      } else {
            if (!targetEvent) return; // Should not happen
            if (targetEvent.hostUid === user.uid) {
                await handleDelete(eventId, { skipConfirm: true, toastMessage: "主揪與攜伴已移除，揪團已刪除" });
                setConfirmModal({ show: false, eventId: null, action: null });
                return;
            }

            const isStillParticipant = targetEvent.participants?.includes(user.uid);
            if (!isStillParticipant) {
                showToast("您已不在此揪團，無需重複退出", "info");
                fetchEvents(false);
                setConfirmModal({ show: false, eventId: null, action: null });
                return;
            }

            // Update user flake count
        const newFlakeCount = user.flakeCount + 1;
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                flakeCount: newFlakeCount,
                isBanned: newFlakeCount >= 3
            });
            // Update local user state immediately to reflect change
        setUser({ ...user, flakeCount: newFlakeCount, isBanned: newFlakeCount >= 3 });
        
            // Remove from event (包含攜伴名單)
            const userGuests = (targetEvent.guests || []).filter(g => g.addedByUid === user.uid);
            const remainingGuests = (targetEvent.guests || []).filter(g => g.addedByUid !== user.uid);
            const remainingNotices = (targetEvent.guestRemovalNotices || []).filter(n => n.ownerUid !== user.uid);
            const slotsToRelease = 1 + userGuests.length;
            const newSlots = targetEvent.currentSlots - slotsToRelease;
            await updateDoc(eventRef, {
                participants: arrayRemove(user.uid),
                guests: remainingGuests,
                guestRemovalNotices: remainingNotices,
                currentSlots: newSlots < 0 ? 0 : newSlots,
                isFull: false
            });
        
        showToast(newFlakeCount >= 3 ? "跳車次數過多，帳號已凍結" : "已取消報名 (跳車+1)", "error");
        fetchEvents(false);
        }
      } catch (error) {
          console.error("Error executing action: ", error);
          showToast("操作失敗", "error");
      }
    }
    setConfirmModal({ show: false, eventId: null, action: null });
  };


  const processSubmit = async () => {
    if (!user) return;
    const hasChainSessions = (formData.chainSessions || []).length > 0;
    const normalizedLocation = (formData.location || "").trim();
    const totalSlotsNumber = Number(formData.totalSlots || 0);
    const builtInCount = createMode === 'event'
      ? Math.min(
          Math.max(0, Number(formData.builtInPlayers) || 0),
          Math.max(0, totalSlotsNumber - 1)
        )
      : 0;
    if (!normalizedLocation) {
        showToast("請輸入完整地址或貼上 Google Maps 連結", "error");
        return;
    }
    const normalizedPrice = sanitizePriceValue(formData.price);
    if (normalizedPrice < 0) {
        showToast("費用需為 0 或正整數，請重新輸入", "error");
        return;
    }
    const normalizedPriceFull = formData.priceFull !== "" && formData.priceFull !== null && formData.priceFull !== undefined
        ? sanitizePriceValue(formData.priceFull, normalizedPrice)
        : normalizedPrice;
    if (createMode === 'event') {
        const limitDate = new Date();
        limitDate.setFullYear(limitDate.getFullYear() + 10, limitDate.getMonth(), limitDate.getDate());
        limitDate.setHours(0, 0, 0, 0);
        const eventDate = new Date(formData.date);
        if (isNaN(eventDate.getTime()) || eventDate > limitDate) {
            showToast(`活動日期需在 ${maxEventDate} 之前`, "error");
            return;
        }
        if (hasChainSessions) {
            if ((formData.chainSessions || []).length === 0) {
                showToast("請至少新增一場連刷場次", "error");
                return;
            }
            const invalidSession = formData.chainSessions.some(session => 
                !session.title?.trim() || !session.date || !session.time || !session.price || sanitizePriceValue(session.price) < 0 || !session.studio?.trim() || !session.location?.trim()
            );
            if (invalidSession) {
                showToast("連刷場次資訊不完整（主題、日期、時間、價格需為 0 或正整數、工作室、地址為必填）", "error");
                return;
            }
        }
    }

    const sanitizedChainSessions = hasChainSessions
        ? (formData.chainSessions || []).map(session => {
            const sessionPrice = sanitizePriceValue(session.price, normalizedPrice);
            const sessionPriceFull = session.priceFull !== "" && session.priceFull !== null && session.priceFull !== undefined
                ? sanitizePriceValue(session.priceFull, sessionPrice)
                : sessionPrice;
        const totalSlots = Number(session.totalSlots || formData.totalSlots || 6);
            const existingParticipants = Array.isArray(session.participants) ? session.participants : [];
            const participants = existingParticipants.length > 0 ? existingParticipants : [user.uid];
            const uniqueParticipants = Array.from(new Set(participants));
            const waitlist = Array.isArray(session.waitlist) ? session.waitlist : [];
            const currentSlots = Math.min(uniqueParticipants.length, totalSlots);
          return {
                ...session,
                id: session.id || generateRandomId(),
                title: session.title?.trim() || "",
                type: session.type || formData.type,
                studio: session.studio?.trim() || formData.studio,
                location: session.location?.trim() || normalizedLocation,
                category: session.category || formData.category,
                region: session.region || formData.region,
                date: session.date,
                time: session.time,
                price: sessionPrice,
                priceFull: sessionPriceFull,
                totalSlots,
                participants: uniqueParticipants,
                waitlist,
                currentSlots,
                isFull: currentSlots >= totalSlots
            };
        })
        : [];

    const eventPayload = {
            ...formData,
        price: normalizedPrice,
        priceFull: normalizedPriceFull,
        location: normalizedLocation,
        builtInPlayers: builtInCount,
        isChainEvent: hasChainSessions,
        chainSessions: sanitizedChainSessions
    };

    try {
      if (createMode === 'wish') {
        // 許願模式
        await addDoc(collection(db, "wishes"), {
          title: formData.title,
          studio: formData.studio,
          region: formData.region,
          category: formData.category,
          type: formData.type,
          website: formData.website || "",
          location: normalizedLocation, // 工作室地址
          description: formData.description || "",
          hostNote: formData.teammateNote || "",
          contactLineId: formData.contactLineId || "",
          host: user.displayName,
          hostUid: user.uid,
          createdAt: new Date(),
          wishCount: 1, // 初始許願人數
          targetCount: parseInt(formData.minPlayers) || 4,
          wishedBy: [user.uid]
        });
        showToast("許願成功！等待有緣人成團", "success");
        fetchWishes(); // Refresh wishes
        setActiveTab('wishes');
      } else {
        // 原有開團邏輯
    if (isEditing) {
            const eventRef = doc(db, "events", editingId);
            // 取得目前的 event 以計算 isFull
            const currentEvent = events.find(ev => ev.id === editingId);
            const newTotalSlots = Number(formData.totalSlots);
            const isFull = currentEvent ? currentEvent.currentSlots >= newTotalSlots : false;
    
            await updateDoc(eventRef, {
            ...eventPayload,
              totalSlots: newTotalSlots,
              priceFull: normalizedPriceFull,
              isFull: isFull,
              chainSessions: sanitizedChainSessions,
              isChainEvent: hasChainSessions
            });
            
      showToast("活動更新成功！", "success");
      setIsEditing(false);
      setEditingId(null);
    } else {
            const newEventData = {
                ...eventPayload,
                totalSlots: Number(formData.totalSlots),
                priceFull: normalizedPriceFull,
        currentSlots: 1,
        isFull: false,
                endTime: "23:59", // 簡化處理
        tags: [formData.type],
                host: user.displayName,
                hostUid: user.uid,
                participants: [user.uid],
                waitlist: [],
                guests: [],
                guestRemovalNotices: [],
                isChainEvent: hasChainSessions,
                chainSessions: sanitizedChainSessions,
                createdAt: new Date()
            };
            const docRef = await addDoc(collection(db, "events"), newEventData);
      showToast("開團成功！", "success");
      
      setSharePrompt({
            show: true,
            eventId: docRef.id,
            eventData: {
                title: newEventData.title,
                studio: newEventData.studio,
                maxPlayers: newEventData.totalSlots,
                date: newEventData.date,
                time: newEventData.time,
                price: newEventData.price
            }
        });
    }
    setActiveTab('lobby');
        // Reset Filters to ensure the new event is visible if it matches default logic
        setFilterCategory('All');
        setFilterRegion('All');
        setFilterStudio('All');
        setFilterMonth('All');
        setFilterDateType('All');
        setSelectedDateFilter(null);
        // 重置分頁狀態，確保新開的團能顯示在第一頁
        setLastVisible(null);
        setHasMore(true);
        // Refresh events to show the changes
        fetchEvents(false);
      }
    
      setFormData(getDefaultFormData());
    } catch (error) {
      console.error("Error adding/updating document: ", error);
      showToast("操作失敗: " + error.message, "error");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!requireAuth()) return;
    if (!hasCommunityIdentity) {
      runWithIdentity('create', () => processSubmit());
      return;
    }
    processSubmit();
  };

  const showToast = (msg, type = "success", duration = 3000) => {
    setNotification({ show: true, msg, type });
    setTimeout(() => setNotification({ ...notification, show: false }), duration);
  };

  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe z-40">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        <button onClick={() => setActiveTab('lobby')} className={`flex flex-col items-center space-y-1 ${activeTab === 'lobby' || activeTab === 'wishes' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <Search size={24} />
          <span className="text-xs">找團</span>
        </button>
        <button onClick={() => setActiveTab('promotions')} className={`flex flex-col items-center space-y-1 ${activeTab === 'promotions' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <Ticket size={24} />
          <span className="text-xs">優惠</span>
        </button>
        <button 
          onClick={openCreateTab}
          className="flex flex-col items-center justify-center -mt-8 bg-emerald-500 text-white w-14 h-14 rounded-full shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
        >
          <Plus size={28} />
        </button>
        <button onClick={openProfileTab} className={`flex flex-col items-center space-y-1 ${activeTab === 'profile' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <UserPlus size={24} />
          <span className="text-xs">我的</span>
        </button>
        <button onClick={() => setActiveTab('about')} className={`flex flex-col items-center space-y-1 ${activeTab === 'about' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <Info size={24} />
          <span className="text-xs">資訊</span>
        </button>
      </div>
    </div>
  );

  if (inWebView) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl max-w-md w-full">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} className="text-yellow-500" />
        </div>
          <h1 className="text-2xl font-bold text-white mb-4">請使用瀏覽器開啟</h1>
          <p className="text-slate-400 mb-6 leading-relaxed">
            Google 安全政策限制在 App 內嵌瀏覽器（如 LINE, Facebook）中進行登入。
          </p>
          <div className="bg-slate-800/50 rounded-xl p-4 text-sm text-slate-300 text-left mb-6">
            <p className="font-medium text-white mb-2">操作步驟：</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>點擊右上角的選單圖示 <span className="inline-block bg-slate-700 px-1.5 rounded">...</span></li>
              <li>選擇「在瀏覽器開啟」或「Open in Chrome/Safari」</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 selection:bg-emerald-500/30">
      
      {showCalendar && <CalendarModal />}
      
      {showSponsorModal && <SponsorModal />}
      
      {showImageModal && <ImageModal />}
      
      {showManageModal && <ManageParticipantsModal />}

      {showIdentityModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-500" />
            <button
              onClick={handleIdentityModalClose}
              className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs text-emerald-300 font-semibold mb-1">最後一步</p>
                <h3 className="text-xl font-bold text-white">確認社群身份</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {identityIntent === 'join'
                    ? '為了讓主揪聯繫到你，我們需要確認你在社群中的資訊。'
                    : '發起揪團前，請先確認你在社群中的可聯絡資訊。'}
                </p>
            </div>

              {identityStep === 'question' && (
                <div className="space-y-4">
                  <p className="text-white font-semibold text-lg">你是否已經加入小迷糊的社群？</p>
                  <div className="space-y-3">
                    <button
                      onClick={handleIdentityAnswerYes}
                      className="w-full py-3 rounded-xl bg-emerald-500 text-slate-900 font-bold hover:bg-emerald-400 transition-colors"
                    >
                      我已在社群內
                    </button>
                    <button
                      onClick={handleIdentityAnswerNo}
                      className="w-full py-3 rounded-xl border border-slate-700 text-slate-300 hover:border-emerald-400 hover:text-white transition-colors"
                    >
                      尚未加入，前往加入社群
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    將在新分頁開啟社群邀請連結，加入後請返回此視窗繼續操作。
                  </p>
          </div>
        )}

              {identityStep === 'group' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300 font-medium">你在社群內的暱稱</label>
                    <input
                      type="text"
                      value={identityFormGroup}
                      onChange={(e) => setIdentityFormGroup(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 outline-none"
                      placeholder="請輸入社群暱稱"
                    />
                    <p className="text-xs text-amber-300 flex items-center gap-1">
                      ⚠️ 此暱稱是主揪辨識你的依據，填錯可能會被移除。
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIdentityStep('question')}
                      className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white"
                    >
                      上一步
                    </button>
                    <button
                      onClick={handleIdentityGroupConfirm}
                      className="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-900 font-bold hover:bg-emerald-400"
                    >
                      確認參加
                    </button>
                  </div>
                </div>
              )}

              {/* 已合併暱稱輸入，移除原第三步 */}
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 max-w-[70%]">
            <img 
              src="/logo.png" 
              alt="小迷糊 Logo" 
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent truncate">
              小迷糊密室逃脫揪團平台
          </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveTab('quiz');
                setQuizStep('intro');
                setQuizCurrentQ(0);
                setQuizAnswers({});
                setQuizResult(null);
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400 flex items-center gap-1 animate-pulse"
            >
              🎮 人格測驗
            </button>
            {!user?.isVisitor ? (
              <>
                <span className="text-sm text-slate-400 hidden sm:inline">{user.displayName}</span>
                <button onClick={handleLogout} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm">
                  <LogOut size={18} /> 登出
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="text-sm font-bold px-4 py-2 rounded-lg bg-emerald-500/80 text-slate-900 hover:bg-emerald-400"
              >
                使用 Google 登入
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        
        {/* Toggle View Mode (Lobby / Wishes) */}
        {(activeTab === 'lobby' || activeTab === 'wishes') && (
            <div className="flex bg-slate-900 p-1 rounded-xl mb-4 border border-slate-800">
                <button 
                    onClick={() => setActiveTab('lobby')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'lobby' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                    <Search size={16} />
                    尋找揪團
                </button>
                <button 
                    onClick={() => setActiveTab('wishes')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'wishes' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                    <Sparkles size={16} />
                    許願池
                </button>
            </div>
        )}

        {activeTab === 'lobby' && (
            <div className="space-y-4 animate-in fade-in duration-300 pb-24">
              {/* Filter Section */}
              <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
                
                {/* 如果是分享連結模式，顯示返回所有活動的按鈕 */}
                {filterEventId && (
                    <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                        <div className="flex items-center text-emerald-400 font-bold">
                            <Sparkles size={20} className="mr-2 animate-pulse" />
                            正在檢視分享的特定活動
                        </div>
                        <button 
                            onClick={() => {
                                setFilterEventId(null);
                                setSharedEvent(null);
                                // 清除 URL 中的 query param
                                const url = new URL(window.location);
                                url.searchParams.delete('eventId');
                                window.history.pushState({}, '', url);
                            }}
                            className="bg-emerald-500 text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-400 transition-colors"
                        >
                            查看所有活動
                        </button>
                    </div>
                )}

                {!filterEventId && (
                  <>
            <a 
              href="https://linktr.ee/hu._escaperoom" 
              target="_blank" 
              rel="noopener noreferrer"
                    className="block bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 text-white shadow-lg flex items-center justify-between group hover:brightness-110 transition-all relative overflow-hidden mb-4"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-white/20 p-1 rounded-full backdrop-blur-sm border border-white/20">
                  <img 
                    src="/logo.png" 
                    alt="小迷糊 Logo" 
                    className="w-14 h-14 rounded-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold text-sm md:text-base">加入小迷糊密室社群</div>
                  <div className="text-xs text-purple-100 mt-0.5">找隊友、聊密室、看評論 👉</div>
                </div>
              </div>
              <ExternalLink size={18} className="text-purple-200 group-hover:text-white transition-colors relative z-10" />
            </a>

                  {/* 進階篩選器區塊 */}
                  <div className="space-y-4 bg-slate-900/50 p-4 rounded-3xl border border-slate-800">
              
              {/* 第一排：篩選選單 (改為 Grid，容納更多篩選器) */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                 <select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none focus:border-emerald-500 appearance-none"
                 >
                   <option value="All">全部類型</option>
                   <option value="密室逃脫">密室逃脫</option>
                   <option value="劇本殺">劇本殺</option>
                   <option value="TRPG">TRPG</option>
                   <option value="桌遊">桌遊</option>
                 </select>

                 <select 
                    value={filterRegion} 
                    onChange={(e) => setFilterRegion(e.target.value)}
                    className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none focus:border-emerald-500 appearance-none"
                 >
                   <option value="All">全部地區</option>
                   <option value="北部">北部</option>
                   <option value="中部">中部</option>
                   <option value="南部">南部</option>
                   <option value="東部">東部</option>
                   <option value="離島">離島</option>
                 </select>
                 
                 <select 
                    value={filterStudio} 
                    onChange={(e) => setFilterStudio(e.target.value)}
                    className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none focus:border-emerald-500 appearance-none"
                 >
                   <option value="All">全部工作室</option>
                   {availableStudios.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                 </select>

                 <select 
                    value={filterMonth} 
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none focus:border-emerald-500 appearance-none"
                 >
                   <option value="All">全部月份</option>
                   {availableMonths.filter(m => m !== 'All').map(m => <option key={m} value={m}>{m}月</option>)}
                 </select>

                 <select 
                    value={filterPrice} 
                    onChange={(e) => setFilterPrice(e.target.value)}
                    className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none focus:border-emerald-500 appearance-none"
                 >
                   <option value="All">全部費用</option>
                   <option value="under500">$500以下</option>
                   <option value="500-1000">$500 - $1000</option>
                   <option value="above1000">$1000以上</option>
                 </select>

                 <select 
                    value={filterSlots} 
                    onChange={(e) => setFilterSlots(e.target.value)}
                    className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none focus:border-emerald-500 appearance-none"
                 >
                   <option value="All">所有狀態</option>
                   <option value="available">尚有名額</option>
                   <option value="full">已額滿</option>
                   <option value="1">缺 1 人</option>
                   <option value="2">缺 2 人</option>
                   <option value="3+">缺 3 人以上</option>
                 </select>
              </div>

              {/* 第二排：日期標籤與搜尋 (改為 Flex Wrap) */}
              <div className="flex flex-wrap items-center gap-2">
              {['All', 'Today', 'Tomorrow', 'Weekend'].map((type) => (
                <button 
                  key={type} 
                  onClick={() => {
                    setFilterDateType(type);
                    setSelectedDateFilter(null); // 清除特定日期篩選
                  }}
                      className={`flex-1 min-w-[70px] px-3 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors text-center
                    ${filterDateType === type 
                          ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' 
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}`}
                >
                      {type === 'All' ? '不限' : type === 'Today' ? '今天' : type === 'Tomorrow' ? '明天' : '週末'}
                </button>
              ))}
                  
                  <button 
                    onClick={() => setShowCalendar(true)}
                    className="shrink-0 px-4 py-2.5 bg-slate-800 text-emerald-400 rounded-xl border border-slate-700 hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 min-w-[80px]"
                    aria-label="打開日曆"
                  >
                     <CalendarDays size={16} />
                     <span className="text-xs font-medium">日曆</span>
                  </button>

                  <div className="relative w-full mt-1">
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜尋活動、工作室、介紹..." 
                      className="w-full bg-slate-800 text-white text-sm px-4 py-3 pl-10 rounded-xl border border-slate-700 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-500"
                    />
                   <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            </div>
              </div>
            </div>
            </>
            )}
            {/* End of conditional rendering for filter section */}
              </div>
              {/* End of Filter Section div */}

              {/* 活動列表 */}
              <div className="space-y-6">
            {filterHostUid && (
              <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-5 mb-4 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">正在檢視的主揪</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">{filterHostName || hostStats[filterHostUid]?.name || '主揪'}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Lv.{Math.max(1, hostStats[filterHostUid]?.count || 1)}
                      </span>
                    </div>
                  </div>
                  <button onClick={clearHostFilter} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                    <ArrowLeft size={14} />
                    返回所有活動
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                    <p className="text-xs text-slate-500">歷史開團</p>
                    <p className="text-lg font-bold text-white">{hostStats[filterHostUid]?.count || 0}</p>
                  </div>
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                    <p className="text-xs text-slate-500">進行中</p>
                    <p className="text-lg font-bold text-emerald-400">{hostStats[filterHostUid]?.active || 0}</p>
                  </div>
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                    <p className="text-xs text-slate-500">缺人場次</p>
                    <p className="text-lg font-bold text-yellow-300">{hostStats[filterHostUid]?.missing || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {getFilteredEvents().length === 0 ? (
              <div className="text-center py-10 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                <Ghost size={40} className="mx-auto mb-2 opacity-20" />
                <p>目前沒有符合的揪團<br/>快來當主揪開一團吧！</p>
              </div>
            ) : (
              getFilteredEvents().map((ev) => {
                const isJoined = myEvents.includes(ev.id);
                const isWaitlisted = myWaitlists.includes(ev.id);
                const freeSlots = getRemainingSlots(ev);
                const companionAvailable = freeSlots - (isJoined ? 0 : 1) > 0;
                const locationLink = getMapsUrl(ev.location);
                const joinedSessionOptions = ev.isChainEvent ? getJoinedSessionsForUser(ev, user?.uid) : [];
                const eventIsFull = getRemainingSlots(ev) === 0;
                const chainGuestAvailable = joinedSessionOptions.some(opt => opt.remaining > 0);
                const chainJoinedCount = (() => {
                  if (!ev.isChainEvent || !user) return 0;
                  let count = ev.participants?.includes(user.uid) ? 1 : 0;
                  (ev.chainSessions || []).forEach(session => {
                    if (session.participants?.includes(user.uid)) count += 1;
                  });
                  return count;
                })();
                const joinButtonDisabled = ev.isChainEvent ? false : (isJoined || isWaitlisted);
                const joinButtonClass = ev.isChainEvent
                  ? 'bg-purple-500 text-slate-900 hover:bg-purple-400 shadow-lg shadow-purple-500/20 border border-purple-500/30'
                  : isJoined 
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/20 cursor-not-allowed' 
                    : isWaitlisted
                      ? 'bg-slate-800 text-yellow-400 border border-yellow-500/20 cursor-not-allowed'
                      : eventIsFull 
                        ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20' 
                        : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 border border-transparent';
                
                return (
                  <div key={ev.id} className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">

                    <div className="flex justify-between items-start mb-3 relative">
                      <div className="w-full">
                        {/* 標籤列 (移到最上方) */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded border border-emerald-500/20">
                            {ev.type}
                          </span>
                          <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20">
                            {ev.category}
                          </span>
                          <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
                            {ev.region}
                          </span>
                          {ev.isChainEvent && (
                            <span className="text-[10px] font-bold bg-amber-500/15 text-amber-300 px-2 py-1 rounded border border-amber-500/30 flex items-center gap-1 animate-pulse">
                              <Sparkles size={10} />
                              連刷 x{1 + (ev.chainSessions?.length || 0)}
                            </span>
                          )}
                        </div>

                        {/* 標題 (獨立一行) */}
                        <h3 className="text-xl font-bold text-white mb-2 leading-tight block">{ev.title}</h3>
                        
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                          <button 
                            onClick={() => handleViewHostProfile(ev.hostUid, ev.host)}
                            className="text-emerald-300 hover:text-emerald-200 font-semibold flex items-center gap-1"
                          >
                            {ev.host || '神秘主揪'}
                            <Sparkles size={12} />
                          </button>
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300">
                            Lv.{Math.max(1, hostStats[ev.hostUid]?.count || 1)}
                          </span>
                        </div>

                        <div className="text-sm font-bold text-slate-300 flex items-center mb-3">
                          <MapPin size={14} className="mr-1.5 shrink-0 text-slate-500" />
                          {locationLink ? (
                            <a 
                              href={locationLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="truncate text-emerald-300 hover:text-emerald-200 underline-offset-2 hover:underline transition-colors"
                            >
                              {ev.studio || '查看地圖'}
                            </a>
                          ) : (
                          <span className="truncate">{ev.studio}</span>
                          )}
                        </div>
                        
                        {/* 簡介與網站 */}
                        {ev.description && (
                          <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                            {ev.description.length > 50 ? ev.description.substring(0, 50) + '...' : ev.description}
                          </p>
                        )}
                        {ev.teammateNote && (
                          <div className="bg-slate-800/50 p-2 rounded-lg mb-3 border border-slate-700/50">
                              <div className="text-[10px] text-emerald-400 font-bold mb-1 flex items-center">
                                  <MessageCircle size={10} className="mr-1"/> 主揪備註
                      </div>
                              <div className="text-xs text-slate-300">{ev.teammateNote}</div>
                    </div>
                        )}
                        {ev.website && (
                          <a href={ev.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mb-2">
                            <Globe size={12} /> 官網介紹
                          </a>
                        )}
                        
                        {/* 分享按鈕 */}
                        <div className="absolute top-0 right-0">
                             <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleShare(ev.id);
                                }}
                                className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white border border-slate-700 transition-colors"
                            >
                                <Share2 size={16} />
                            </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-300 mb-4 bg-slate-950/30 p-3 rounded-xl border border-slate-800/50">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-2 text-slate-500" />
                        {ev.date}
                      </div>
                      <div className="flex items-center">
                        <Clock size={14} className="mr-2 text-slate-500" />
                        {ev.time}
                      </div>
                      
                      {/* 新增時間與人數詳情 */}
                      <div className="flex items-center col-span-2 gap-3 text-xs border-t border-slate-800/50 pt-2 mt-1">
                        <div className="flex items-center text-slate-400" title="集合時間">
                           <AlertCircle size={12} className="mr-1.5 text-orange-400"/>
                           提早{ev.meetingTime || 15}分
                        </div>
                        <div className="flex items-center text-slate-400" title="遊戲時長">
                           <Timer size={12} className="mr-1.5 text-blue-400"/>
                           {ev.duration || 100}分鐘
                        </div>
                        <div className="flex items-center text-slate-400" title="成團人數">
                           <Users size={12} className="mr-1.5 text-purple-400"/>
                           {ev.minPlayers || 4}人成團
                        </div>
                      </div>

                      {ev.isChainEvent && ev.chainSessions?.length > 0 && (
                        <div className="col-span-2 mt-3">
                          <button 
                            type="button"
                            onClick={() => toggleChainDetails(ev.id)}
                            className="w-full flex items-center justify-between text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 hover:bg-amber-500/20 transition-all"
                          >
                            <span>連刷場次詳情（共 {1 + ev.chainSessions.length} 團）</span>
                            <ChevronDown size={14} className={`transition-transform ${expandedChainInfo[ev.id] ? 'rotate-180' : ''}`} />
                          </button>
                          {expandedChainInfo[ev.id] && (
                            <div className="mt-3 space-y-3">
                              {ev.chainSessions.map((session, idx) => (
                                <div key={session.id || idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm font-bold text-white">
                                      第 {idx + 2} 團：{session.title || '未命名主題'}
                                    </div>
                                    {session.type && (
                                      <span className="text-[10px] text-slate-300 px-2 py-0.5 bg-slate-800 rounded border border-slate-700">
                                        {session.type}
                                      </span>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                                    <div className="flex items-center gap-1">
                                      <Calendar size={12} className="text-slate-500" /> {session.date || '-'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock size={12} className="text-slate-500" /> {session.time || '-'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <DollarSign size={12} className="text-slate-500" /> ${session.price || '—'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {isJoined && ev.contactLineId && (
                        <div className="mt-3 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                          <div className="text-xs text-slate-400 mb-1">主揪社群名稱 (僅參加者可見)：</div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 select-all">
                              {ev.contactLineId}
                            </span>
                            <span className="text-[10px] text-slate-500">(社群名稱)</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center col-span-2 pt-2 border-t border-slate-800/50 mt-1">
                        <DollarSign size={14} className="mr-2 text-slate-500" />
                        <div className="flex flex-col">
                          <span className="text-white font-medium">
                            ${ev.price} /人
                            {parseInt(ev.priceFull) < parseInt(ev.price) && (
                              <span className="text-xs text-emerald-400 ml-2">
                                (滿團 ${ev.priceFull})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-start text-xs mb-1.5">
                        <span className={eventIsFull ? "text-red-400" : "text-emerald-400"}>
                          {eventIsFull ? "額滿" : `缺 ${getRemainingSlots(ev)} 人`}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${eventIsFull ? 'bg-slate-600' : 'bg-emerald-500'}`} style={{ width: `${ev.totalSlots ? Math.min((getEffectiveCurrentSlots(ev) / ev.totalSlots) * 100, 100) : 0}%` }} />
                      </div>
                    </div>

                    <button 
                        onClick={() => {
                            setManagingEvent(ev);
                            setIsViewOnlyMode(true);
                            setShowManageModal(true);
                        }}
                        className="w-full py-2.5 mb-3 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700 hover:text-white transition-all border border-slate-700 flex items-center justify-center gap-2"
                      >
                          <Users size={16} className="text-emerald-400" />
                          查看已參加成員 
                    </button>

                    <div className="flex gap-2">
                    <button 
                      disabled={joinButtonDisabled}
                      onClick={() => {
                        if (ev.isChainEvent) {
                          openChainSelectionModal(ev);
                        } else {
                          promptJoin(ev.id);
                        }
                      }}
                      className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 flex items-center justify-center ${joinButtonClass}`}
                    >
                      {ev.isChainEvent ? (
                        chainJoinedCount > 0 ? (
                          <><CheckCircle size={16} className="mr-2"/> 已選 {chainJoinedCount} 場</>
                        ) : (
                          <>選擇連刷場次</>
                        )
                      ) : isJoined ? (
                        <><CheckCircle size={16} className="mr-2"/> 已參加 (正取)</>
                      ) : isWaitlisted ? (
                        <><Hourglass size={16} className="mr-2"/> 已在候補名單</>
                    ) : eventIsFull ? (
                        '額滿，排候補'
                      ) : (
                        <><UserPlus size={16} className="mr-2"/> 我要 +1</>
                      )}
                    </button>

                        {((!ev.isChainEvent && !isWaitlisted && !eventIsFull && companionAvailable) || (ev.isChainEvent && chainGuestAvailable)) && (
                            <button 
                                onClick={() => {
                                    if (ev.isChainEvent) {
                                        const eventData = events.find(evt => evt.id === ev.id);
                                        openGuestModalForEvent(eventData || ev);
                                    } else {
                                        if (!user) {
                                            showToast("請先登入！", "error");
                                            return;
                                        }
                                        const availableForGuests = freeSlots - (isJoined ? 0 : 1);
                                        if (availableForGuests <= 0) {
                                            showToast(isJoined ? "目前沒有多餘名額可以幫朋友報名" : "需保留一個名額給自己，暫時無法攜伴", "error");
                                            return;
                                        }
                                        setGuestNames([""]);
                                        setGuestEventId(ev.id);
                                        setGuestSessionId('main');
                                        setGuestSessionOptions([{ id: 'main', label: ev.title, remaining: availableForGuests }]);
                                        setShowGuestModal(true);
                                    }
                                }}
                                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center"
                            >
                                <UserPlus size={18} className="mr-2" />
                                攜伴
                            </button>
                        )}
                    </div>
                  </div>
                );
              })
            )}
              
              {/* Load More Button */}
              {hasMore && !filterEventId && (
                <button 
                  onClick={() => fetchEvents(true)}
                  disabled={loadingMore}
                  className="w-full py-3 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? '載入中...' : '載入更多活動'}
                </button>
              )}
              </div>
          </div>
        )}

        {activeTab === 'promotions' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center mb-6">
               <h2 className="text-2xl font-bold text-white mb-1">工作室優惠情報</h2>
               <p className="text-slate-400 text-sm">蒐集全台密室優惠，玩得省錢又開心</p>
            </div>

            <div className="grid gap-4">
              {INITIAL_PROMOTIONS.map((promo) => (
                <div key={promo.id} className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-lg group hover:border-slate-700 transition-all relative">
                   {/* Background Gradient */}
                   <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${promo.color}`}></div>
                   
                   <div className="p-5 pl-7">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-sm font-bold text-slate-300 mb-1 block flex items-center gap-1">
                            <MapPin size={12} /> {promo.studio}
                          </span>
                          <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{promo.title}</h3>
                        </div>
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${promo.color} flex items-center justify-center shadow-lg`}>
                          {promo.icon}
                        </div>
                      </div>
                      
                      <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                        {promo.content}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                        <div className="text-xs text-slate-500 flex items-center">
                          <Clock size={12} className="mr-1" />
                          {promo.period}
                        </div>
                        <button 
                          onClick={() => {
                            if (promo.id === 2) { // 揪揪玩工作室
                              setImageModalUrl("https://img.nextedge-ai-studio.com/S__10323406.jpg");
                              setShowImageModal(true);
                            }
                          }}
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                        >
                          查看詳情
                        </button>
                      </div>
                   </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-slate-900/50 rounded-xl p-6 text-center border border-slate-800 border-dashed">
              <p className="text-slate-400 text-sm">
                你是工作室老闆嗎？<br/>
                想要在這裡曝光優惠資訊？
              </p>
              <a 
                href="https://www.instagram.com/hu._escaperoom/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 text-emerald-400 text-sm font-bold hover:underline inline-block"
              >
                聯繫我們刊登 (Instagram)
              </a>
              <div className="mt-2 text-xs text-slate-500">
                或寄信至 xiaomihuu0921@gmail.com
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wishes' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Shared Wish Indicator */}
            {filterWishId && (
                <div className="mb-4 p-4 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center justify-between">
                    <div className="flex items-center text-pink-400 font-bold">
                        <Sparkles size={20} className="mr-2 animate-pulse" />
                        正在檢視分享的許願
                    </div>
                    <button 
                        onClick={() => {
                            setFilterWishId(null);
                            const url = new URL(window.location);
                            url.searchParams.delete('wishId');
                            window.history.pushState({}, '', url);
                        }}
                        className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-400 transition-colors"
                    >
                        查看所有許願
                    </button>
                </div>
            )}

            <div className="grid gap-4">
              {(filterWishId ? wishes.filter(w => w.id === filterWishId) : wishes).length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-500 mb-4">{filterWishId ? "找不到該許願，可能已被刪除" : "目前還沒有人許願"}</p>
                  {!filterWishId && (
                    <button onClick={() => { setActiveTab('create'); setCreateMode('wish'); }} className="px-4 py-2 bg-pink-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-pink-500/20 hover:bg-pink-400 transition-all">
                        我來許第一個願！
                    </button>
                  )}
                  {filterWishId && (
                    <button onClick={() => setFilterWishId(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700 transition-all">
                        查看所有許願
                    </button>
                  )}
                </div>
              ) : (
                (filterWishId ? wishes.filter(w => w.id === filterWishId) : wishes).map(wish => {
                  const currentCount = wish.wishCount || 1;
                  const targetCount = wish.targetCount || 4;
                  const isFull = currentCount >= targetCount;
                  const isWished = wish.wishedBy?.includes(user?.uid);
                  const wishLocationLink = getMapsUrl(wish.location);

                  return (
                  <div key={wish.id} className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-pink-500/30 transition-all">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-pink-500 to-purple-500" />
                    
                    <div className="flex flex-wrap gap-2 mb-2 pl-3 items-center">
                        <span className="text-[10px] font-medium text-white px-2 py-1 bg-pink-500/20 rounded border border-pink-500/30">
                            {wish.category}
                        </span>
                        <span className="text-[10px] font-medium text-slate-300 px-2 py-1 bg-slate-800 rounded border border-slate-700">
                            {wish.region}
                        </span>
                        <span className="text-[10px] font-medium text-slate-300 px-2 py-1 bg-slate-800 rounded border border-slate-700">
                            {wish.type}
                        </span>
                        {isFull && (
                            <span className="ml-auto text-xs font-bold bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-lg border border-yellow-500/20 flex items-center animate-pulse">
                                <BellRing size={12} className="mr-1"/> 人數已滿
                            </span>
                        )}
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 pl-3">{wish.title}</h3>
                    
                    <div className="pl-3 space-y-1 mb-4">
                        <div className="text-sm font-medium text-slate-400 flex items-center">
                            <MapPin size={14} className="mr-1.5 text-slate-500" />
                            {wishLocationLink ? (
                              <a
                                href={wishLocationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-300 hover:text-emerald-200 underline-offset-2 hover:underline transition-colors"
                              >
                                {wish.studio || '查看地圖'}
                              </a>
                            ) : (
                              wish.studio
                            )}
                        </div>
                        {wish.location && (
                            <a
                              href={wishLocationLink || '#'}
                              target={wishLocationLink ? '_blank' : undefined}
                              rel={wishLocationLink ? 'noopener noreferrer' : undefined}
                              className="text-xs text-slate-500 flex items-center gap-1 hover:text-emerald-200 transition-colors"
                            >
                                <Navigation size={12} className="text-slate-400" />
                                {wish.location}
                            </a>
                        )}
                    </div>

                    {wish.description && (
                        <p className="pl-3 text-xs text-slate-400 mb-4 line-clamp-2">
                            {wish.description}
                        </p>
                    )}

                    {/* Progress Bar */}
                    <div className="pl-3 pr-1 mb-4">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>集氣進度</span>
                            <span className={isFull ? "text-yellow-400 font-bold" : "text-slate-400"}>
                                {currentCount} / {targetCount} 人
                            </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-yellow-400' : 'bg-pink-500'}`}
                                style={{ width: `${Math.min((currentCount / targetCount) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="pl-3 flex items-center justify-between mt-2 pt-3 border-t border-slate-800/50">
                        <div className="text-xs text-slate-500 mr-auto">
                            發起人：{wish.host}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleViewWishMembers(wish)}
                                className="p-1.5 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-emerald-400 transition-colors"
                                title="查看成員"
                            >
                                <Users size={16} />
                            </button>
                             <button
                                onClick={() => handleShareWish(wish)}
                                className="p-1.5 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-emerald-400 transition-colors"
                                title="分享"
                            >
                                <Share2 size={16} />
                            </button>
                            <button 
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                                    ${isWished 
                                        ? 'bg-pink-500 text-white border-pink-500 hover:bg-pink-600' 
                                        : 'bg-pink-500/10 text-pink-400 border-pink-500/20 hover:bg-pink-500/20'}`}
                                onClick={() => handleJoinWish(wish)}
                            >
                                <Heart size={14} className={isWished ? "fill-current" : ""} />
                                {isWished ? `已集氣` : `集氣 +1`}
                            </button>
                        </div>
                    </div>
                  </div>
                )})
              )}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              {createMode === 'wish' ? <Sparkles className="mr-2 text-pink-400" /> : (isEditing ? <Edit className="mr-2 text-emerald-400" /> : <Plus className="mr-2 text-emerald-400" />)}
              {createMode === 'wish' ? '許願新活動' : (isEditing ? '編輯揪團內容' : '建立新揪團')}
            </h2>
            
            {/* 許願切換按鈕 */}
            {!isEditing && (
                <div className="flex bg-slate-900 p-1 rounded-xl mb-6">
                    <button 
                        onClick={() => setCreateMode('event')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${createMode === 'event' ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        發起揪團
                    </button>
                    <button 
                        onClick={() => setCreateMode('wish')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${createMode === 'wish' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        許願池
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-400 font-medium">活動分類 <span className="text-red-500">*</span></label>
                  <select required className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {['密室逃脫', '劇本殺', 'TRPG', '桌遊'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-400 font-medium">所在地區 <span className="text-red-500">*</span></label>
                  <select required className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                    value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})}>
                    {['北部', '中部', '南部', '東部', '離島'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-400 font-medium">主題名稱 <span className="text-red-500">*</span></label>
                  <input required type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" 
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="例如: 籠中鳥" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-400 font-medium">密室類型 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Tag size={18} className="absolute left-4 top-3.5 text-slate-500" />
                    <select required className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-emerald-500 outline-none appearance-none"
                      value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                      {['恐怖驚悚', '機關冒險', '劇情沉浸', '推理懸疑', '歡樂新手'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* 網站與簡介 */}
              <div className="space-y-1.5">
                <label className="text-sm text-slate-400 font-medium">官網連結 (選填)</label>
                <div className="relative">
                  <Globe size={18} className="absolute left-4 top-3.5 text-slate-500" />
                  <input type="url" className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-emerald-500 outline-none" 
                    value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} placeholder="https://..." />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-slate-400 font-medium">活動簡介 (選填，最多50字)</label>
                <textarea 
                  maxLength={50}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none h-20 resize-none" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="簡單介紹劇情..." 
                />
                <div className="text-xs text-slate-500 text-right">
                  {formData.description.length}/50
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-slate-400 font-medium">主揪備註 (選填)</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" 
                  value={formData.teammateNote} onChange={e => setFormData({...formData, teammateNote: e.target.value})} placeholder="想提醒隊友的事項..." />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-slate-400 font-medium">{createMode === 'wish' ? '主辦社群名稱' : '主揪社群名稱'} (參加後才可見)</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" 
                  value={formData.contactLineId} onChange={e => setFormData({...formData, contactLineId: e.target.value})} placeholder="方便大家聯繫你" />
              </div>

              {/* 許願模式隱藏以下欄位 */}
              {createMode === 'event' && (
                <>
                  {/* 時間與人數細節 */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-medium">提前抵達(分)</label>
                      <input type="number" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-3 text-white focus:border-emerald-500 outline-none text-center" 
                        value={formData.meetingTime} onChange={e => setFormData({...formData, meetingTime: e.target.value})} placeholder="15" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-medium">遊戲總時長(分)</label>
                      <input type="number" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-3 text-white focus:border-emerald-500 outline-none text-center" 
                        value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="120" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-medium">成團最低人數</label>
                      <input type="number" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-3 text-white focus:border-emerald-500 outline-none text-center" 
                        value={formData.minPlayers} onChange={e => setFormData({...formData, minPlayers: e.target.value})} placeholder="4" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-slate-400 font-medium">工作室 <span className="text-red-500">*</span></label>
                <input required type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" 
                  value={formData.studio} onChange={e => setFormData({...formData, studio: e.target.value})} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-slate-400 font-medium">完整地址 / Google Maps 連結 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-3.5 text-slate-500" />
                  <input required type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-emerald-500 outline-none" 
                    value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="可貼上 Google Maps 或輸入完整地址" />
                </div>
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-400 font-medium">日期 <span className="text-red-500">*</span></label>
                  <input required type="date" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none [color-scheme:dark]" 
                        min={formatDate(new Date())}
                        max={maxEventDate}
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-400 font-medium">時間 <span className="text-red-500">*</span></label>
                  <input required type="time" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none [color-scheme:dark]" 
                    value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 border-dashed space-y-4">
                <div className="text-sm font-bold text-emerald-400 flex items-center">
                  <DollarSign size={14} className="mr-1" />
                  每人費用設定 (請備現金)
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-slate-400 font-medium">未滿團/基本價 <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-slate-500">$</span>
                      <input required type="number" min="0" step="1" className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white focus:border-emerald-500 outline-none" 
                        value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="600" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-slate-400 font-medium">滿團優惠價 (選填)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-slate-500">$</span>
                      <input type="number" min="0" step="1" className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white focus:border-emerald-500 outline-none" 
                        value={formData.priceFull} onChange={e => setFormData({...formData, priceFull: e.target.value})} placeholder="550" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500">若有設定滿團價，大廳會顯示「(滿團 $550)」供玩家參考。</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm text-slate-400 font-medium">總人數 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Users size={18} className="absolute left-4 top-3.5 text-slate-500" />
                    <input 
                      type="number" 
                      required 
                      min="2" 
                      max="40"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-emerald-500 outline-none"
                      value={formData.totalSlots} 
                      onChange={e => setFormData({...formData, totalSlots: e.target.value})}
                      placeholder="請輸入人數"
                    />
                </div>
              </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-400 font-medium">內建人數 (選填)</label>
                  <div className="relative">
                    <Users size={18} className="absolute left-4 top-3.5 text-slate-500" />
                    <input
                      type="number"
                      min="0"
                      max="40"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-emerald-500 outline-none"
                      value={formData.builtInPlayers || ''}
                      onChange={e => setFormData({...formData, builtInPlayers: e.target.value})}
                      placeholder="已有隊友人數"
                    />
                  </div>
                </div>
              </div>
                </>
              )}

              {/* 許願模式：工作室與地址 */}
              {createMode === 'wish' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm text-slate-400 font-medium">工作室 <span className="text-red-500">*</span></label>
                    <input required type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" 
                      value={formData.studio} onChange={e => setFormData({...formData, studio: e.target.value})} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm text-slate-400 font-medium">工作室地址 / Google Maps <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-3.5 text-slate-500" />
                      <input required type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-emerald-500 outline-none" 
                        value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="可貼上 Google Maps 或輸入完整地址" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm text-slate-400 font-medium">期望成團人數</label>
                    <div className="relative">
                      <Users size={18} className="absolute left-4 top-3.5 text-slate-500" />
                      <input 
                        type="number" 
                        required 
                        min="2" 
                        max="40"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-emerald-500 outline-none"
                        value={formData.minPlayers} 
                        onChange={e => setFormData({...formData, minPlayers: e.target.value})}
                        placeholder="例如: 4"
                      />
                    </div>
                  </div>
                </>
              )}

              {createMode === 'event' && (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 text-sm text-slate-400 space-y-2">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" />
                    連刷場次暫停新增
                  </h4>
                  <p>目前平台已停止新增連刷團，舊有資料仍會在大廳與我的活動中顯示，若需要協助請聯繫管理員。</p>
                </div>
              )}

              <div className="pt-2">
                <button type="submit" disabled={user.flakeCount >= 3} className={`w-full font-bold text-lg py-4 rounded-xl shadow-lg active:scale-95 transition-all ${user.flakeCount >= 3 ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : createMode === 'wish' ? 'bg-pink-500 text-white shadow-pink-500/20 hover:bg-pink-400' : 'bg-emerald-500 text-slate-900 shadow-emerald-500/20 hover:bg-emerald-400'}`}>
                  {user.flakeCount >= 3 ? '帳號受限無法操作' : (createMode === 'wish' ? '發布許願' : (isEditing ? '更新活動' : '發布揪團'))}
                </button>
                {isEditing && (
                  <button type="button" onClick={() => { setIsEditing(false); setActiveTab('lobby'); }} className="w-full text-slate-500 text-sm mt-4 hover:text-slate-300">
                    取消編輯
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
              
              {/* 編輯個人資料按鈕 (如果已經改過名字，就隱藏或變更行為，這裡選擇如果次數 >= 1 就顯示提示) */}
              <button 
                  onClick={() => {
                      if (isEditingProfile) {
                          setIsEditingProfile(false);
                      } else {
                          if (user.nameChangedCount >= 1) {
                              showToast("您已經修改過一次暱稱，無法再次修改", "error");
                              return;
                          }
                          setProfileName(user.displayName);
                          setIsEditingProfile(true);
                      }
                  }}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${user.nameChangedCount >= 1 ? 'text-slate-600 cursor-not-allowed bg-slate-800/20' : 'text-slate-400 hover:text-white bg-slate-800/50'}`}
              >
                  {isEditingProfile ? <X size={18}/> : <Settings size={18} />}
              </button>

               <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700 relative overflow-hidden">
                 {user.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <User size={40} className="text-slate-500"/>}
                 </div>
               </div>

                {isEditingProfile ? (
                    <div className="animate-in fade-in duration-300 mb-4">
                        <div className="text-xs text-yellow-500 mb-2">注意：暱稱只能修改一次</div>
                        <input 
                            type="text" 
                            value={profileName} 
                            onChange={(e) => setProfileName(e.target.value)}
                            className="bg-slate-800 text-white text-center font-bold text-lg px-3 py-1 rounded-lg border border-slate-700 outline-none focus:border-emerald-500 w-full mb-2"
                            placeholder="輸入新暱稱"
                        />
                        <button 
                            onClick={handleUpdateProfile}
                            className="px-4 py-1.5 bg-emerald-500 text-slate-900 text-sm font-bold rounded-lg hover:bg-emerald-400"
                        >
                            確認修改 (剩下 0 次機會)
                        </button>
                    </div>
                ) : (
               <h2 className="text-xl font-bold text-white">{user.displayName}</h2>
                )}

               <div className="flex justify-center gap-4 mt-3 text-sm text-slate-400">
                 <div className="flex flex-col"><span className="font-bold text-white text-lg">{myEvents.length + myWaitlists.length}</span><span className="text-xs">活動/候補</span></div>
                 <div className="w-px bg-slate-700"></div>
                 <div className="flex flex-col"><span className={`font-bold text-lg ${user.flakeCount>0?'text-red-400':'text-emerald-400'}`}>{user.flakeCount}</span><span className="text-xs">跳車</span></div>
               </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white px-1 mb-3">我的許願</h3>
              {myWishes.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed mb-8">
                  尚未許願，去許願池看看吧！
                </div>
              ) : (
                myWishes.map(wish => {
                  const currentCount = wish.wishCount || 1;
                  const targetCount = wish.targetCount || 4;
                  const isFull = currentCount >= targetCount;
                  const wishLocationLink = getMapsUrl(wish.location);

                  return (
                    <div key={wish.id} className="bg-slate-900 rounded-3xl p-5 border border-slate-800 mb-6 shadow-xl relative overflow-hidden group">
                       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-purple-500 opacity-70" />
                       
                       <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 mr-2">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-bold bg-pink-500/10 text-pink-400 px-2.5 py-1 rounded-lg border border-pink-500/20 flex items-center">
                                <Sparkles size={12} className="mr-1.5"/> 許願中
                            </span>
                            {isFull && (
                                <span className="text-xs font-bold bg-yellow-500/10 text-yellow-400 px-2.5 py-1 rounded-lg border border-yellow-500/20 flex items-center animate-pulse">
                                    <BellRing size={12} className="mr-1.5"/> 人數已滿，可開團！
                                </span>
                            )}
                             <span className="text-xs font-medium text-slate-500 px-2 py-1 bg-slate-800 rounded-lg">
                                {wish.region}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-1.5 leading-tight">{wish.title}</h3>
                          <div className="text-sm font-medium text-slate-400 flex items-center">
                            <MapPin size={14} className="mr-1.5 text-slate-500" />
                            {wishLocationLink ? (
                              <a
                                href={wishLocationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-300 hover:text-emerald-200 underline-offset-2 hover:underline transition-colors"
                              >
                                {wish.studio || '查看地圖'}
                              </a>
                            ) : (
                              wish.studio
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={() => handleViewWishMembers(wish)}
                                className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 border border-slate-700 transition-colors"
                                title="查看成員"
                            >
                                <Users size={16} />
                            </button>
                            <button
                                onClick={() => handleShareWish(wish)}
                                className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 border border-slate-700 transition-colors"
                                title="分享許願"
                            >
                                <Share2 size={16} />
                            </button>
                            <button 
                                onClick={() => handleCancelWish(wish.id)}
                                className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
                                title={wish.hostUid === user.uid ? "刪除許願" : "取消許願"}
                            >
                                {wish.hostUid === user.uid ? <Trash2 size={16} /> : <LogOut size={16} />}
                            </button>
                        </div>
                       </div>
                       
                       {/* Progress Bar */}
                       <div className="mb-4">
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                <span>集氣進度</span>
                                <span className={isFull ? "text-yellow-400 font-bold" : "text-slate-400"}>
                                    {currentCount} / {targetCount} 人
                                </span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-yellow-400' : 'bg-pink-500'}`}
                                    style={{ width: `${Math.min((currentCount / targetCount) * 100, 100)}%` }}
                                ></div>
                            </div>
                       </div>
                    </div>
                  );
                })
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-white px-1 mb-3">我的活動 (含候補)</h3>
              {[...myEvents, ...myWaitlists].length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  目前沒有任何行程，快去大廳找團吧！
                </div>
              ) : (
                events.filter(e => myEvents.includes(e.id) || myWaitlists.includes(e.id)).map(ev => {
                  const isWaitlisted = myWaitlists.includes(ev.id);
                  const isPastEvent = isEventPast(ev);
                  const guestNotices = (ev.guestRemovalNotices || []).filter(n => n.ownerUid === user.uid);
                  const locationLink = getMapsUrl(ev.location);
                  const isHost = ev.hostUid === user.uid;
                  return (
                    <div key={ev.id} className="bg-slate-900 rounded-3xl p-5 border border-slate-800 mb-6 shadow-xl relative overflow-hidden group">
                      {/* 頂部裝飾條 */}
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70" />

                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {isPastEvent ? (
                              <span className="text-xs font-bold bg-slate-500/10 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-500/20 flex items-center">
                                <Clock size={12} className="mr-1.5" /> 已結團
                              </span>
                            ) : isWaitlisted ? (
                              <span className="text-xs font-bold bg-yellow-500/10 text-yellow-400 px-2.5 py-1 rounded-lg border border-yellow-500/20 flex items-center">
                                <Hourglass size={12} className="mr-1.5"/> 候補排隊中
                              </span>
                            ) : (
                              <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center">
                                <CheckCircle size={12} className="mr-1.5"/> 正取已參加
                              </span>
                            )}
                            <span className="text-xs font-medium text-slate-500 px-2 py-1 bg-slate-800 rounded-lg">
                                {ev.region}
                            </span>
                          {ev.isChainEvent && (
                            <span className="text-xs font-bold bg-amber-500/15 text-amber-300 px-2 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1">
                              <Sparkles size={12} />
                              連刷 x{1 + (ev.chainSessions?.length || 0)}
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-white mb-1.5 leading-tight">{ev.title}</h3>
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                            <button 
                              onClick={() => handleViewHostProfile(ev.hostUid, ev.host)}
                              className="text-emerald-300 hover:text-emerald-200 font-semibold flex items-center gap-1"
                            >
                              {ev.host || '神秘主揪'}
                              <Sparkles size={12} />
                            </button>
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300">
                              Lv.{Math.max(1, hostStats[ev.hostUid]?.count || 1)}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-slate-400 flex items-center">
                            <MapPin size={14} className="mr-1.5 text-slate-500" />
                            {locationLink ? (
                              <a 
                                href={locationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-300 hover:text-emerald-200 underline-offset-2 hover:underline transition-colors"
                              >
                                {ev.studio || '查看地圖'}
                              </a>
                            ) : (
                              <span>{ev.studio}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 absolute top-4 right-4 z-20">
                            {/* 非主揪且非被檢舉人可見：若有進行中的檢舉，在右上角顯示附議按鈕 */}
                            {ev.hostUid !== user.uid && ev.pendingFlake && ev.pendingFlake.targetUid !== user.uid && (
                                <button 
                                    onClick={() => handleConfirmFlake(ev)}
                                    className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-lg shadow-lg shadow-red-500/30 font-bold text-xs hover:bg-red-600 transition-colors border border-red-400 animate-pulse"
                                >
                                    <AlertTriangle size={14} className="fill-current" />
                                    跳車附議
                                </button>
                            )}
                        </div>

                        {/* 操作按鈕群組 (主揪) */}
                        {ev.hostUid === user.uid && (
                          <div className="flex flex-col gap-2 mt-8">
                             <div className="flex gap-2 justify-end">
                                <button onClick={() => handleEdit(ev)} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 border border-slate-700 transition-colors">
                              <Edit size={16} />
                            </button>
                                <button onClick={() => handleDelete(ev.id)} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-red-400 border border-slate-700 transition-colors">
                              <Trash2 size={16} />
                                </button>
                             </div>
                             <button 
                                onClick={() => {
                                    setManagingEvent(ev);
                                    setIsViewOnlyMode(false);
                                    setShowManageModal(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold text-xs border border-indigo-500/20 hover:bg-indigo-500/20 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                            >
                                <Users size={14} />
                                管理 ({ev.participants.length + (ev.guests?.length || 0)})
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* 資訊網格 */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                         <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50 flex flex-col justify-center">
                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar size={12}/> 日期</div>
                            <div className="text-sm font-bold text-slate-200">{ev.date}</div>
                         </div>
                         <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50 flex flex-col justify-center">
                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Clock size={12}/> 時間</div>
                            <div className="text-sm font-bold text-slate-200">{ev.time}</div>
                         </div>
                      </div>

                      {ev.isChainEvent && ev.chainSessions?.length > 0 && (
                        <div className="mb-4">
                          <button 
                            type="button"
                            onClick={() => toggleChainDetails(ev.id)}
                            className="w-full flex items-center justify-between text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 hover:bg-amber-500/20 transition-all"
                          >
                            <span>連刷場次詳情（共 {1 + ev.chainSessions.length} 團）</span>
                            <ChevronDown size={14} className={`transition-transform ${expandedChainInfo[ev.id] ? 'rotate-180' : ''}`} />
                          </button>
                          {expandedChainInfo[ev.id] && (
                            <div className="mt-3 space-y-3">
                              {ev.chainSessions.map((session, idx) => (
                                <div key={session.id || idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm font-bold text-white">
                                      第 {idx + 2} 團：{session.title || '未命名主題'}
                                    </div>
                                    {session.type && (
                                      <span className="text-[10px] text-slate-300 px-2 py-0.5 bg-slate-800 rounded border border-slate-700">
                                        {session.type}
                                      </span>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                                    <div className="flex items-center gap-1">
                                      <Calendar size={12} className="text-slate-500" /> {session.date || '-'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock size={12} className="text-slate-500" /> {session.time || '-'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <DollarSign size={12} className="text-slate-500" /> ${session.price || '—'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {ev.contactLineId && (
                        <div className="mb-4 p-3 bg-slate-800/30 rounded-xl border border-slate-700/30 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                <MessageCircle size={16} />
                             </div>
                             <div>
                                <div className="text-[10px] text-slate-500 font-medium">主揪社群名稱</div>
                                <div className="text-sm font-mono font-bold text-white select-all">{ev.contactLineId}</div>
                             </div>
                          </div>
                          <button 
                            onClick={() => navigator.clipboard.writeText(ev.contactLineId).then(() => showToast("已複製", "success"))}
                            className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
                          >
                            複製
                          </button>
                        </div>
                      )}

                      {guestNotices.length > 0 && (
                        <div className="mb-4 space-y-2">
                          {guestNotices.map(notice => (
                            <div key={notice.id || `${notice.ownerUid}-${notice.guestName}`} className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-xs text-yellow-100">
                              <div className="font-semibold text-yellow-300 flex items-center gap-1">
                                <AlertCircle size={12} />
                                攜伴調整通知
                              </div>
                              <p className="mt-1 text-slate-100 leading-relaxed">
                                {notice.removedByName || '主揪'} 已移除你代報的「{notice.guestName || '攜伴'}」，如有疑問請直接私訊主揪。
                              </p>
                              <button 
                                onClick={() => handleDismissGuestNotice(ev.id, notice)}
                                className="mt-2 text-[11px] text-yellow-300 hover:text-yellow-200 underline"
                              >
                                知道了，隱藏通知
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {ev.guests && ev.guests.length > 0 && (
                        <div className="mb-4">
                          <div className="text-[13px] font-semibold text-slate-300 mb-2 flex items-center gap-2">
                            <UserPlus size={14} className="text-emerald-400" />
                            攜伴名單（{ev.guests.length}）
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {ev.guests.map((guest, idx) => (
                              <div 
                                key={`${guest.name || 'guest'}-${idx}`} 
                                className="px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-sm text-slate-200 flex flex-col min-w-[120px]"
                              >
                                <span className="font-bold">{guest.name || `朋友 ${idx + 1}`}</span>
                                <span className="text-[11px] text-slate-500">
                                  由 {guest.addedByName || '團員'} 代報
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 mb-4">
                         {/* 新增分享按鈕 */}
                         <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleShare(ev.id);
                            }}
                            className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700 hover:text-white transition-all border border-slate-700 flex items-center justify-center gap-2"
                         >
                             <Share2 size={16} className="text-purple-400" />
                             分享
                         </button>
                      </div>

                      <div className="flex gap-3 mb-4">
                        <button 
                          onClick={() => handleAddToCalendar(ev)}
                          className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700 hover:text-white transition-all border border-slate-700 flex items-center justify-center gap-2"
                        >
                           <CalendarPlus size={16} className="text-emerald-400" />
                           行事曆
                        </button>
                        <button 
                          onClick={() => handleNavigation(ev.location)}
                          className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700 hover:text-white transition-all border border-slate-700 flex items-center justify-center gap-2"
                        >
                           <Navigation size={16} className="text-blue-400" />
                           導航
                        </button>
                      </div>

                      <button 
                        onClick={() => {
                            setManagingEvent(ev);
                            setIsViewOnlyMode(true);
                            setShowManageModal(true);
                        }}
                        className="w-full py-2.5 mb-3 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700 hover:text-white transition-all border border-slate-700 flex items-center justify-center gap-2"
                      >
                          <Users size={16} className="text-emerald-400" />
                          查看已參加成員
                      </button>

                      <button 
                        disabled={isHost}
                        onClick={() => {
                            if (isHost) {
                                showToast("主揪請使用垃圾桶按鈕關團，無法自行跳車", "info");
                                return;
                            }
                            promptCancel(ev.id);
                        }} 
                        className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center border transition-all active:scale-95
                          ${isHost
                            ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                            : isWaitlisted 
                              ? 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800 hover:text-slate-300' 
                              : 'bg-red-500/5 text-red-400 border-red-500/10 hover:bg-red-500/10'}`}
                      >
                        {isHost ? (
                          <> <Ban size={16} className="mr-2" /> 主揪請用垃圾桶關團 </>
                        ) : isWaitlisted ? (
                          <> <X size={16} className="mr-2" /> 取消候補申請</>
                        ) : (
                          <> <LogOut size={16} className="mr-2" /> 退出此揪團 (跳車)</>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
              
              {/* Load More Button */}
              {hasMore && (
                <button 
                  onClick={() => fetchEvents(true)}
                  disabled={loadingMore}
                  className="w-full py-3 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? '載入中...' : '載入更多活動'}
                </button>
              )}
            </div>
          </div>
        )}
        {activeTab === 'hostProfile' && viewingHostUid && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
              
              <button 
                onClick={() => {
                  setViewingHostUid(null);
                  setViewingHostName("");
                  setViewingHostPhotoURL(null);
                  setActiveTab('lobby');
                }}
                className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-white bg-slate-800/50 transition-colors"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700 relative overflow-hidden">
                  {viewingHostPhotoURL ? (
                    <img src={viewingHostPhotoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-slate-500"/>
                  )}
                </div>
              </div>

              <h2 className="text-xl font-bold text-white mb-2">{viewingHostName || '主揪'}</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Lv.{Math.max(1, hostStats[viewingHostUid]?.count || 1)}
              </span>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                  <p className="text-xs text-slate-500">歷史開團</p>
                  <p className="text-lg font-bold text-white">{hostHistoryEvents.length}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                  <p className="text-xs text-slate-500">進行中</p>
                  <p className="text-lg font-bold text-emerald-400">
                    {hostHistoryEvents.filter(ev => {
                      const todayStr = formatDate(new Date());
                      const eventDate = new Date(ev.date);
                      eventDate.setHours(0, 0, 0, 0);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return eventDate >= today && !ev.isFull;
                    }).length}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                  <p className="text-xs text-slate-500">缺人場次</p>
                  <p className="text-lg font-bold text-yellow-300">
                    {hostHistoryEvents.filter(ev => {
                      const todayStr = formatDate(new Date());
                      const eventDate = new Date(ev.date);
                      eventDate.setHours(0, 0, 0, 0);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return eventDate >= today && ev.totalSlots > getEffectiveCurrentSlots(ev);
                    }).length}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white px-1 mb-3">歷史開團記錄</h3>
              {hostHistoryEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">
                  還沒有開團記錄
                </div>
              ) : (
                hostHistoryEvents.map(ev => {
                  const todayStr = formatDate(new Date());
                  const eventDate = new Date(ev.date);
                  eventDate.setHours(0, 0, 0, 0);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isPast = eventDate < today;
                  const locationLink = getMapsUrl(ev.location);
                  const eventIsFull = getEffectiveCurrentSlots(ev) >= ev.totalSlots;

                  return (
                    <div key={ev.id} className="bg-slate-900 rounded-3xl p-5 border border-slate-800 mb-6 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70" />

                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {isPast ? (
                              <span className="text-xs font-bold bg-slate-500/10 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-500/20">
                                已結團
                              </span>
                            ) : eventIsFull ? (
                              <span className="text-xs font-bold bg-red-500/10 text-red-400 px-2.5 py-1 rounded-lg border border-red-500/20">
                                額滿
                              </span>
                            ) : (
                              <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                進行中
                              </span>
                            )}
                            <span className="text-xs font-medium text-slate-500 px-2 py-1 bg-slate-800 rounded-lg">
                              {ev.region}
                            </span>
                            {ev.isChainEvent && (
                              <span className="text-xs font-bold bg-amber-500/15 text-amber-300 px-2 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1">
                                <Sparkles size={12} />
                                連刷 x{1 + (ev.chainSessions?.length || 0)}
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-white mb-1.5 leading-tight">{ev.title}</h3>
                          <div className="text-sm font-medium text-slate-400 flex items-center mb-2">
                            <MapPin size={14} className="mr-1.5 text-slate-500" />
                            {locationLink ? (
                              <a
                                href={locationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-300 hover:text-emerald-200 underline-offset-2 hover:underline transition-colors"
                              >
                                {ev.studio || '查看地圖'}
                              </a>
                            ) : (
                              ev.studio
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} className="text-slate-500" /> {ev.date || '-'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={12} className="text-slate-500" /> {ev.time || '-'}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign size={12} className="text-slate-500" /> ${ev.price || '—'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-start text-xs mb-1.5">
                          <span className={eventIsFull ? "text-red-400" : "text-emerald-400"}>
                            {eventIsFull ? "額滿" : `缺 ${getRemainingSlots(ev)} 人`}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${eventIsFull ? 'bg-slate-600' : 'bg-emerald-500'}`} 
                            style={{ width: `${ev.totalSlots ? Math.min((getEffectiveCurrentSlots(ev) / ev.totalSlots) * 100, 100) : 0}%` }} 
                          />
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setManagingEvent(ev);
                          setIsViewOnlyMode(true);
                          setShowManageModal(true);
                        }}
                        className="w-full py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700 hover:text-white transition-all border border-slate-700 flex items-center justify-center gap-2"
                      >
                        <Users size={16} className="text-emerald-400" />
                        查看參加成員
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ===== 角色人格測驗 Tab ===== */}
        {activeTab === 'quiz' && (
          <div className="space-y-4 animate-in fade-in duration-300 pb-24">
            
            {/* 返回按鈕 */}
            <button
              onClick={() => setActiveTab('lobby')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft size={20} />
              <span>返回大廳</span>
            </button>

            {/* 測驗介紹頁 */}
            {quizStep === 'intro' && (
              <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-3xl p-6 border border-purple-500/30 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
                
                <div className="relative z-10">
                  <div className="text-6xl mb-4">🎮</div>
                  <h2 className="text-2xl font-bold text-white mb-2">2025 密室玩家年度回顧</h2>
                  <h3 className="text-lg text-purple-300 mb-6">× 角色人格測驗</h3>
                  
                  <p className="text-slate-300 mb-6 text-sm leading-relaxed">
                    10 道題目，揭曉你在密室裡的真實面貌！<br/>
                    你是指揮官、解謎王、還是氣氛擔當？
                  </p>

                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {QUIZ_ATTRIBUTES.map(attr => (
                      <span 
                        key={attr.key}
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ backgroundColor: attr.color + '30', color: attr.color }}
                      >
                        {attr.name}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => setQuizStep('nickname')}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl text-lg hover:from-purple-400 hover:to-pink-400 transition-all transform hover:scale-[1.02] shadow-lg shadow-purple-500/30"
                  >
                    開始測驗 →
                  </button>
                </div>
              </div>
            )}

            {/* 輸入暱稱頁 */}
            {quizStep === 'nickname' && (
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">✏️</div>
                  <h2 className="text-xl font-bold text-white mb-2">輸入你的暱稱</h2>
                  <p className="text-slate-400 text-sm">這會顯示在你的測驗結果上</p>
                </div>

                <input
                  type="text"
                  value={quizNickname}
                  onChange={(e) => setQuizNickname(e.target.value)}
                  placeholder="請輸入暱稱..."
                  maxLength={20}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-lg mb-4"
                />

                <button
                  onClick={() => {
                    if (quizNickname.trim()) {
                      setQuizStep('questions');
                    }
                  }}
                  disabled={!quizNickname.trim()}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-400 hover:to-pink-400 transition-all"
                >
                  正式開始 →
                </button>
              </div>
            )}

            {/* 答題頁 */}
            {quizStep === 'questions' && (
              <div className="space-y-4">
                {/* 進度條 */}
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-sm">題目進度</span>
                    <span className="text-purple-400 font-bold">{quizCurrentQ + 1} / {QUIZ_QUESTIONS.length}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                      style={{ width: `${((quizCurrentQ + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 題目卡片 */}
                <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
                  <div className="text-purple-400 text-sm font-bold mb-2">Q{quizCurrentQ + 1}</div>
                  <h3 className="text-lg font-bold text-white mb-6 leading-relaxed">
                    {QUIZ_QUESTIONS[quizCurrentQ].question}
                  </h3>

                  <div className="space-y-3">
                    {QUIZ_QUESTIONS[quizCurrentQ].options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const newAnswers = { ...quizAnswers, [quizCurrentQ]: option };
                          setQuizAnswers(newAnswers);
                          
                          // 延遲跳轉到下一題
                          setTimeout(() => {
                            if (quizCurrentQ < QUIZ_QUESTIONS.length - 1) {
                              setQuizCurrentQ(quizCurrentQ + 1);
                            } else {
                              // 計算結果
                              const result = calculateQuizResult(newAnswers);
                              setQuizResult(result);
                              setQuizStep('result');
                            }
                          }, 300);
                        }}
                        className={`w-full p-4 text-left rounded-xl border transition-all ${
                          quizAnswers[quizCurrentQ] === option
                            ? 'bg-purple-500/20 border-purple-500 text-white'
                            : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-purple-400 font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                        {option.text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 導航按鈕 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setQuizCurrentQ(Math.max(0, quizCurrentQ - 1))}
                    disabled={quizCurrentQ === 0}
                    className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                  >
                    ← 上一題
                  </button>
                  {quizAnswers[quizCurrentQ] && quizCurrentQ < QUIZ_QUESTIONS.length - 1 && (
                    <button
                      onClick={() => setQuizCurrentQ(quizCurrentQ + 1)}
                      className="flex-1 py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-400 transition-colors"
                    >
                      下一題 →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 結果頁 */}
            {quizStep === 'result' && quizResult && (
              <div className="space-y-4">
                
                {/* 結果卡片區域 */}
                <div 
                  className="space-y-3 p-4 rounded-3xl"
                  style={{ backgroundColor: '#020617' }}
                >
                  {/* 標題 */}
                  <div className="text-center mb-2">
                    <div style={{ color: '#c084fc' }} className="text-xs font-bold">🎮 2025 密室玩家年度回顧</div>
                  </div>
                  
                  {/* 主結果卡片 */}
                  <div 
                    className="rounded-2xl p-5 text-center relative overflow-hidden"
                    style={{ 
                      background: quizResult.character.id === 'tank' ? 'linear-gradient(to bottom right, #f59e0b, #ea580c)' :
                                  quizResult.character.id === 'brain' ? 'linear-gradient(to bottom right, #3b82f6, #4f46e5)' :
                                  quizResult.character.id === 'observer' ? 'linear-gradient(to bottom right, #10b981, #0d9488)' :
                                  quizResult.character.id === 'leader' ? 'linear-gradient(to bottom right, #eab308, #d97706)' :
                                  quizResult.character.id === 'support' ? 'linear-gradient(to bottom right, #ec4899, #e11d48)' :
                                  quizResult.character.id === 'team' ? 'linear-gradient(to bottom right, #a855f7, #7c3aed)' :
                                  quizResult.character.id === 'chaos' ? 'linear-gradient(to bottom right, #06b6d4, #3b82f6)' :
                                  'linear-gradient(to bottom right, #64748b, #334155)'
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.2)' }}></div>
                    <div style={{ position: 'relative', zIndex: 10 }}>
                      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{quizResult.character.emoji}</div>
                      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{quizNickname} 的密室人格是</div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', marginBottom: '0.5rem' }}>{quizResult.character.name}</h2>
                      <div
                        style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem', lineHeight: 1.6, fontStyle: 'italic' }}
                        className="break-words whitespace-pre-wrap"
                      >
                        「{quizResult.character.description.split('。').filter(s => s.trim()).map((part, i, arr) => (
                          <React.Fragment key={i}>
                            {part.trim()}
                            {i < arr.length - 1 ? '。' : ''}
                            {i < arr.length - 1 && <br />}
                          </React.Fragment>
                        ))}」
                      </div>
                    </div>
                  </div>

                  {/* 六邊形雷達圖 */}
                  <div className="rounded-2xl p-4" style={{ backgroundColor: '#0f172a' }}>
                    <h3 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '0.75rem', textAlign: 'center', fontSize: '0.875rem' }}>🎯 屬性面板</h3>
                    
                    {/* SVG 雷達圖 */}
                    <div className="flex justify-center mb-3">
                      <svg viewBox="0 0 200 200" className="w-64 h-64">
                        {/* 背景六邊形網格 */}
                        {[1, 0.75, 0.5, 0.25].map((scale, i) => (
                          <polygon
                            key={i}
                            points={QUIZ_ATTRIBUTES.map((_, idx) => {
                              const angle = (idx * 60 - 90) * (Math.PI / 180);
                              const r = 90 * scale; // 增大六邊形
                              return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#334155"
                            strokeWidth="1"
                          />
                        ))}
                        
                        {/* 軸線 */}
                        {QUIZ_ATTRIBUTES.map((_, idx) => {
                          const angle = (idx * 60 - 90) * (Math.PI / 180);
                          return (
                            <line
                              key={idx}
                              x1="100"
                              y1="100"
                              x2={100 + 80 * Math.cos(angle)}
                              y2={100 + 80 * Math.sin(angle)}
                              stroke="#334155"
                              strokeWidth="1"
                            />
                          );
                        })}
                        
                        {/* 數據多邊形 */}
                        <polygon
                          points={QUIZ_ATTRIBUTES.map((attr, idx) => {
                            const angle = (idx * 60 - 90) * (Math.PI / 180);
                            const maxScore = 10; // 調整為更合理的最大值
                            const score = quizResult.scores[attr.key] || 0;
                            const r = Math.min((score / maxScore) * 90, 90); // 增大並確保不超過外框
                            return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
                          }).join(' ')}
                          fill="rgba(168, 85, 247, 0.3)"
                          stroke="#a855f7"
                          strokeWidth="2"
                        />
                        
                        {/* 數據點 */}
                        {QUIZ_ATTRIBUTES.map((attr, idx) => {
                          const angle = (idx * 60 - 90) * (Math.PI / 180);
                          const maxScore = 10; // 調整為更合理的最大值
                          const score = quizResult.scores[attr.key] || 0;
                          const r = Math.min((score / maxScore) * 90, 90); // 增大並確保不超過外框
                          return (
                            <circle
                              key={idx}
                              cx={100 + r * Math.cos(angle)}
                              cy={100 + r * Math.sin(angle)}
                              r="4"
                              fill={attr.color}
                            />
                          );
                        })}
                        
                        {/* 標籤 */}
                        {QUIZ_ATTRIBUTES.map((attr, idx) => {
                          const angle = (idx * 60 - 90) * (Math.PI / 180);
                          const r = 95;
                          return (
                            <text
                              key={idx}
                              x={100 + r * Math.cos(angle)}
                              y={100 + r * Math.sin(angle)}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill={attr.color}
                              fontSize="10"
                              fontWeight="bold"
                            >
                              {attr.name}
                            </text>
                          );
                        })}
                      </svg>
                    </div>
                  </div>

                  {/* 相生相剋 */}
                  <div className="rounded-2xl p-4" style={{ backgroundColor: '#0f172a' }}>
                    <h3 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '0.75rem', textAlign: 'center', fontSize: '0.875rem' }}>⚔️ 相生相剋</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                      <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}>
                        <div style={{ color: '#34d399', fontSize: '10px', marginBottom: '0.125rem' }}>最佳隊友</div>
                        <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.875rem' }}>{quizResult.character.bestMatchName}</div>
                      </div>
                      <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}>
                        <div style={{ color: '#f87171', fontSize: '10px', marginBottom: '0.125rem' }}>天敵</div>
                        <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.875rem' }}>{quizResult.character.enemyName}</div>
                      </div>
                    </div>
                  </div>

                  {/* 水印 */}
                  <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
                    <div style={{ color: '#64748b', fontSize: '10px' }}>made by IG:hu._escaperoom</div>
                  </div>
                </div>

                {/* 分享按鈕區域 */}
                <div className="space-y-3">
                  {/* 分享到 IG 說明 */}
                  <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-purple-500/30 rounded-2xl p-4">
                    <div className="text-center text-white font-bold mb-2">📱 分享到 Instagram 限動</div>
                    <div className="text-slate-400 text-xs text-center mb-3">
                      生成 9:16 比例的精美圖片
                    </div>
                    
                    {/* 生成/分享圖片按鈕 */}
                    <button
                      onClick={async () => {
                        if (isGeneratingImage) return;
                        
                        setIsGeneratingImage(true);
                        showToast("正在生成圖片...", "info");
                        
                        // 檢測是否為真正的手機（排除 Windows/Mac 桌面）
                        const userAgent = navigator.userAgent;
                        const isWindows = /Windows/i.test(userAgent);
                        const isMac = /Macintosh/i.test(userAgent);
                        const isDesktop = isWindows || isMac;
                        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
                        const isMobile = isMobileDevice && !isDesktop;
                        
                        try {
                          const canvas = await generateQuizResultImage(quizNickname, quizResult);
                          
                          // 轉換為 blob
                          canvas.toBlob(async (blob) => {
                            if (!blob) {
                              showToast("圖片生成失敗", "error");
                              setIsGeneratingImage(false);
                              return;
                            }
                            
                            // 只有手機才使用 Web Share API 分享
                            if (isMobile && navigator.share && navigator.canShare) {
                              const file = new File([blob], 'quiz-result.png', { type: 'image/png' });
                              const shareData = { files: [file] };
                              
                              if (navigator.canShare(shareData)) {
                                try {
                                  await navigator.share(shareData);
                                  showToast("分享成功！", "success");
                                  setIsGeneratingImage(false);
                                  return;
                                } catch (err) {
                                  if (err.name === 'AbortError') {
                                    setIsGeneratingImage(false);
                                    return;
                                  }
                                  // 分享失敗，改為下載
                                }
                              }
                            }
                            
                            // 電腦：直接下載圖片
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `密室人格測驗_${quizNickname}_${quizResult.character.name}.png`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            showToast("圖片已下載！請到 IG 限動上傳分享", "success");
                            setIsGeneratingImage(false);
                          }, 'image/png');
                        } catch (err) {
                          console.error('Image generation error:', err);
                          showToast("圖片生成失敗，請稍後再試", "error");
                          setIsGeneratingImage(false);
                        }
                      }}
                      disabled={isGeneratingImage}
                      className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isGeneratingImage ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          生成中...
                        </>
                      ) : (
                        <>
                          <Download size={20} />
                          📸 分享/下載圖片 (手機/PC)
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* 分享測驗按鈕 */}
                  <button
                    onClick={async () => {
                      const shareText = `🎮 2025 密室玩家年度回顧

我是「${quizResult.character.name}」${quizResult.character.emoji}

「${quizResult.character.description}」

最佳隊友：${quizResult.character.bestMatchName}
天敵：${quizResult.character.enemyName}

快來測測你是什麼類型的密室玩家！
${window.location.origin}?tab=quiz

made by IG:hu._escaperoom`;
                      
                      // 檢測是否為真正的手機（排除 Windows/Mac 桌面）
                      const userAgent = navigator.userAgent;
                      const isWindows = /Windows/i.test(userAgent);
                      const isMac = /Macintosh/i.test(userAgent);
                      const isDesktop = isWindows || isMac;
                      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
                      const isMobile = isMobileDevice && !isDesktop;
                      
                      if (isMobile && navigator.share) {
                        try {
                          await navigator.share({
                            title: '2025 密室玩家人格測驗',
                            text: shareText,
                            url: window.location.origin + '?tab=quiz'
                          });
                          showToast("分享成功！", "success");
                          return;
                        } catch (err) {
                          if (err.name === 'AbortError') return;
                        }
                      }
                      
                      // 電腦：直接複製文字
                      try {
                        await navigator.clipboard.writeText(shareText);
                        showToast("已複製分享文字！", "success");
                      } catch {
                        showToast("複製失敗，請手動選取複製", "error");
                      }
                    }}
                    className="w-full py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Share2 size={18} />
                    分享測驗
                  </button>

                  <button
                    onClick={() => {
                      setQuizStep('intro');
                      setQuizCurrentQ(0);
                      setQuizAnswers({});
                      setQuizResult(null);
                      setQuizNickname("");
                    }}
                    className="w-full py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    重新測驗
                  </button>

                  <button
                    onClick={() => setActiveTab('lobby')}
                    className="w-full py-3 bg-emerald-500/20 text-emerald-400 font-bold rounded-xl hover:bg-emerald-500/30 transition-colors"
                  >
                    返回找團
                  </button>
                </div>

                {/* 版權標示 */}
                <div className="text-center text-slate-500 text-xs pt-4">
                  made by IG:hu._escaperoom
                </div>
              </div>
            )}

          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center py-8">
              <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="小迷糊密室逃脫揪團平台 Logo" 
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">小迷糊密室逃脫揪團平台</h1>
              <p className="text-slate-400">v1.0.0</p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-6">
                
                {/* Founder */}
                <div className="text-center">
                    <h3 className="text-emerald-400 font-bold mb-1">Founder</h3>
                    <div className="text-xl font-bold text-white mb-3">小迷糊</div>
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => setShowSponsorModal(true)}
                            className="px-4 py-2 bg-pink-500/10 text-pink-400 rounded-xl text-sm font-bold hover:bg-pink-500/20 transition-colors"
                        >
                            贊助小迷糊
                        </button>
                        <a 
                            href="https://www.instagram.com/hu._escaperoom/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-purple-500/10 text-purple-400 rounded-xl text-sm font-bold hover:bg-purple-500/20 transition-colors flex items-center gap-2"
                        >
                            聯繫小迷糊
                            <ExternalLink size={14} />
                        </a>
                    </div>
                </div>

                <div className="h-px bg-slate-800 w-full" />

                {/* Engineer */}
                <div className="text-center">
                    <h3 className="text-blue-400 font-bold mb-1">用愛發電工程師</h3>
                    <div className="text-xl font-bold text-white mb-1">曠</div>
                    <div className="text-sm text-slate-400 mb-2">運營小工作室 NextEdge AI Studio</div>
                    <p className="text-xs text-slate-500 mb-3">
                        "有需要做網頁可以找你！報小迷糊名字有折扣"
                    </p>
                    <a 
                        href="https://nextedge-ai-studio.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl text-sm font-bold hover:bg-blue-500/20 transition-colors inline-flex items-center gap-2"
                    >
                        NextEdge AI Studio 官網
                        <ExternalLink size={14} />
                    </a>
                </div>

                <div className="h-px bg-slate-800 w-full" />

                {/* Co-Maintainer */}
                <div className="text-center">
                    <h3 className="text-indigo-400 font-bold mb-1">協作者 / 維運</h3>
                    <div className="flex items-center justify-center gap-3 mb-1">
                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                             <span className="text-xl">👻</span>
                        </div>
                        <div className="text-xl font-bold text-white">飄</div>
                    </div>
                    <div className="text-sm text-slate-400">我是飄，負責維運。</div>
                    <div className="text-sm text-slate-400">偶爾幫忙修修 bug。</div>
                </div>

                 <div className="h-px bg-slate-800 w-full" />
                 
                 {/* Terms */}
                 <div>
                    <h3 className="text-slate-400 font-bold mb-3 text-center">[ 使用條款 ]</h3>
                    <div className="text-xs text-slate-500 space-y-2 leading-relaxed bg-slate-950/50 p-4 rounded-xl">
                        <p>1. 本平台僅提供資訊交流與媒合，不介入實際交易與糾紛處理。</p>
                        <p>2. 請使用者保持友善交流，禁止騷擾、詐騙或發表不當言論。</p>
                        <p>3. 參加活動請準時出席，若無法參加請提前告知主揪。</p>
                        <p>4. 平台有權移除違規內容或停用違規帳號。</p>
                        <p>5. 相關活動風險請自行評估，本平台不負連帶責任。</p>
                    </div>
                 </div>

                 <div className="h-px bg-slate-800 w-full" />
                 
                 {/* Legal Links */}
                 <div className="flex justify-center gap-6">
                    <a
                        href="/terms"
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium underline underline-offset-4"
                    >
                        使用條款
                    </a>
                    <a
                        href="/privacy"
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium underline underline-offset-4"
                    >
                        隱私權政策
                    </a>
                 </div>

            </div>

            <div className="text-center pb-8">
              <p className="text-slate-500 text-xs">
                © {new Date().getFullYear()} NextEdge AI Studio. All Rights Reserved.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* Guest Join Modal */}
      {showGuestModal && (() => {
        const targetEvent = events.find(e => e.id === guestEventId);
        const options = guestSessionOptions.length > 0 ? guestSessionOptions : [{
            id: 'main',
            label: targetEvent ? `主場：${targetEvent.title}` : '主場',
            remaining: targetEvent ? Math.max((targetEvent.totalSlots || 0) - (targetEvent.currentSlots || 0), 0) : 0
        }];
        const selectedSession = options.find(opt => opt.id === guestSessionId) || options[0];
        const allowedGuestSlots = selectedSession ? selectedSession.remaining : 0;
        const filledGuests = guestNames.filter(n => n.trim()).length;
        const canAddMoreGuests = allowedGuestSlots > 0 && guestNames.length < allowedGuestSlots;
        const exceedsLimit = allowedGuestSlots > 0 && filledGuests > allowedGuestSlots;
        const confirmDisabled = filledGuests === 0 || allowedGuestSlots === 0 || exceedsLimit;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-6 border border-slate-800 shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                        <UserPlus className="text-emerald-500 mr-2" />
                        攜伴參加
                    </h3>
                    <p className="text-slate-400 mb-2 text-sm">
                        幫朋友代報名，每位朋友都會佔用一個名額。
                    </p>
                    {options.length > 1 && (
                        <div className="mb-3">
                            <label className="text-xs text-slate-500 mb-1 block">選擇場次</label>
                            <select
                                value={guestSessionId}
                                onChange={(e) => setGuestSessionId(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                            >
                                {options.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="text-xs text-slate-500 mb-2">
                        {selectedSession?.label || '主場'} 剩餘可代報 <span className="text-white font-bold">{allowedGuestSlots}</span> 位朋友
                    </div>
                    {exceedsLimit && (
                        <div className="mb-2 text-xs text-yellow-400">
                            名單超過名額，請刪減至 {allowedGuestSlots} 位朋友。
                        </div>
                    )}
                    
                    {allowedGuestSlots > 0 ? (
                        <div className="space-y-3 mb-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
                            {guestNames.map((name, index) => (
                                <div key={index} className="flex gap-2">
                                    <input 
                                        type="text" 
                                        autoFocus={index === guestNames.length - 1}
                                        value={name}
                                        onChange={(e) => {
                                            const newNames = [...guestNames];
                                            newNames[index] = e.target.value;
                                            setGuestNames(newNames);
                                        }}
                                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500"
                                        placeholder={`朋友 ${index + 1} 的名字`}
                                    />
                                    {guestNames.length > 1 && (
                                        <button 
                                            onClick={() => {
                                                const newNames = guestNames.filter((_, i) => i !== index);
                                                setGuestNames(newNames);
                                            }}
                                            className="p-3 bg-slate-800 text-slate-400 hover:text-red-400 rounded-xl border border-slate-700 transition-colors"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mb-4 p-3 text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                            目前僅剩讓您自己加入的名額，暫時無法再代報朋友。
                        </div>
                    )}

                    {allowedGuestSlots > 0 && (
                        <button 
                            disabled={!canAddMoreGuests}
                            onClick={() => setGuestNames([...guestNames, ""])}
                            className={`w-full py-3 mb-4 rounded-xl border border-dashed text-sm font-bold flex items-center justify-center gap-2 transition-all
                                ${canAddMoreGuests 
                                    ? 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800/50' 
                                    : 'border-slate-800 text-slate-600 cursor-not-allowed bg-slate-900/50'}`}
                        >
                            {canAddMoreGuests ? (
                                <>
                                    <Plus size={16} />
                                    增加一位朋友
                                </>
                            ) : (
                                <span>已達本團人數上限</span>
                            )}
                        </button>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={closeGuestModal} className="py-2.5 rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors font-medium">取消</button>
                        <button 
                            onClick={handleGuestJoin} 
                            disabled={confirmDisabled}
                            className={`py-2.5 rounded-xl font-bold transition-all ${confirmDisabled ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : 'text-slate-900 bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'}`}
                        >
                            確認代報名 ({filledGuests}人)
                        </button>
                    </div>
                </div>
            </div>
        );
      })()}

      {showChainModal && chainEventTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-800 shadow-2xl relative flex flex-col max-h-[80vh]">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400" />
            <button onClick={() => { setShowChainModal(false); setChainEventTarget(null); }} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full transition-colors">
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              選擇要參加的場次
            </h3>
            <p className="text-xs text-slate-500 mb-4">可以自由勾選要參加的場次，未勾選即視為不參加。</p>
            <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1">
              {getChainSessionList(chainEventTarget).map((session, idx) => {
                const sessionId = session.id === 'main' ? 'main' : session.id;
                const alreadyJoined = session.participants?.includes(user?.uid);
                const selected = chainSelection.hasOwnProperty(sessionId) ? chainSelection[sessionId] : alreadyJoined;
                const total = session.totalSlots || chainEventTarget.totalSlots || 0;
                const current = session.currentSlots ?? (session.participants?.length || 0);
                const isFull = total ? current >= total : false;
                const disableToggle = !selected && isFull && !alreadyJoined;
                return (
                  <div key={`${sessionId}-${idx}`} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
                    <input 
                      type="checkbox"
                      disabled={disableToggle}
                      checked={selected}
                      onChange={() => handleChainSessionToggle(sessionId)}
                      className="mt-1 w-4 h-4 text-purple-500 bg-slate-800 border-slate-700 rounded focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">
                            {sessionId === 'main' ? '主場' : `第 ${idx} 場`}：{session.title || '未命名主題'}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1"><Calendar size={11} /> {session.date || '-'}</span>
                            <span className="flex items-center gap-1"><Clock size={11} /> {session.time || '-'}</span>
                            <span className="flex items-center gap-1"><DollarSign size={11} /> ${session.price || '—'}</span>
                          </p>
                        </div>
                        {session.type && (
                          <span className="text-[10px] text-slate-300 px-2 py-0.5 bg-slate-800 rounded border border-slate-700">
                            {session.type}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-2">
                        <span>名額：{current}/{total || '—'}</span>
                        {disableToggle && <span className="text-red-400 font-semibold">已額滿</span>}
                        {alreadyJoined && !selected && <span className="text-yellow-400">將取消此場</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => { setShowChainModal(false); setChainEventTarget(null); }} className="py-3 rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors font-semibold">
                取消
              </button>
              <button onClick={handleChainSelectionConfirm} className="py-3 rounded-xl text-slate-900 bg-purple-500 hover:bg-purple-400 font-bold shadow-lg shadow-purple-500/20 transition-all">
                確認更新
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-6 border border-slate-800 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center">
              {confirmModal.action === 'join' 
                ? <CheckCircle className="text-emerald-500 mr-2" /> 
                : confirmModal.action === 'confirmFlake'
                  ? <AlertTriangle className="text-red-500 mr-2" />
                  : <AlertTriangle className="text-red-500 mr-2" />}
              
              {confirmModal.title || (confirmModal.action === 'join' ? '確認報名？' :
               confirmModal.action === 'cancel' 
                ? (myWaitlists.includes(confirmModal.eventId) ? '確定取消候補？' : '確定要跳車嗎？')
                : '確定要刪除？')}
            </h3>
            <p className="text-slate-400 mb-6 whitespace-pre-line">
              {confirmModal.message || (confirmModal.action === 'join' 
                ? `確定要報名參加「${confirmModal.title}」嗎？` 
                : confirmModal.action === 'cancel' 
                ? (myWaitlists.includes(confirmModal.eventId) 
                    ? '取消候補不會影響您的信用分數。' 
                    : `這將會增加您的跳車次數 (${user.flakeCount + 1})。`)
                : '刪除後所有報名者都會被移除，且無法復原。')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setConfirmModal({show:false})} className="py-3 rounded-xl text-slate-300 bg-slate-800">取消</button>
              <button onClick={executeAction} className={`py-3 rounded-xl text-white font-bold ${confirmModal.action === 'join' ? 'bg-emerald-500' : confirmModal.action === 'confirmFlake' ? 'bg-red-500' : 'bg-red-500'}`}>
                {confirmModal.action === 'join' ? '確認參加' : confirmModal.action === 'confirmFlake' ? '確認附議' : '確認執行'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wish Members Modal */}
      {wishMembersModal.show && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-800 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                <h3 className="text-lg font-bold text-white flex items-center">
                    <Users size={20} className="mr-2 text-pink-400" />
                    已集氣成員
                </h3>
                <button 
                    onClick={() => setWishMembersModal({ show: false, wishId: null, members: [] })}
                    className="text-slate-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                {wishMembersModal.members.length === 0 ? (
                    <p className="text-center text-slate-500 py-4">還沒有人集氣，快去邀請朋友吧！</p>
                ) : (
                    wishMembersModal.members.map((member) => (
                        <div key={member.uid} className="flex items-center gap-3 bg-slate-800/30 p-3 rounded-xl border border-slate-800/50">
                            {member.photoURL ? (
                                <img src={member.photoURL} alt={member.displayName} className="w-10 h-10 rounded-full border border-slate-700" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                                    <User size={20} />
                                </div>
                            )}
                            <div>
                                <div className="text-sm font-bold text-white">{member.displayName}</div>
                                <div className="text-xs text-slate-500">集氣夥伴</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
          </div>
        </div>
      )}

      {/* Share Prompt Modal */}
      {sharePrompt.show && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-800 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-white">開團成功！</h3>
                <p className="text-slate-400 text-sm">
                    現在就分享到 LINE 社群，<br/>邀請大家一起來玩吧！
                </p>
                
                <button
                    onClick={() => {
                        const { eventId, eventData } = sharePrompt;
                        const shareUrl = `${window.location.origin}?eventId=${eventId}`;
                        const text = `
主題：${eventData.title}

工作室：${eventData.studio}

目前人數：1人 滿人${eventData.maxPlayers}人

時間、日期：${eventData.time} ${eventData.date}

費用：$${eventData.price}/人

如果有興趣加入的話，可以點擊網址報名

${shareUrl}
`.trim();
                        
                        // Copy to clipboard first
                        navigator.clipboard.writeText(text).then(() => {
                            showToast("內容已複製！正在開啟 LINE...");
                            // Try to open LINE share
                            window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, '_blank');
                        }).catch(() => {
                             window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, '_blank');
                        });
                        
                        setSharePrompt({ show: false, eventId: null, eventData: null });
                    }}
                    className="w-full py-3 bg-[#06C755] hover:bg-[#05b64d] text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                    <Share2 size={20} />
                    分享至 LINE 社群
                </button>
                
                <button
                    onClick={() => setSharePrompt({ show: false, eventId: null, eventData: null })}
                    className="text-slate-500 text-sm hover:text-white transition-colors"
                >
                    稍後再說
                </button>
             </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl shadow-xl flex items-center z-50 min-w-[300px] animate-in slide-in-from-top-4 fade-in duration-300 ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-slate-900'}`}>
          {notification.type === 'error' ? <AlertTriangle size={20} className="mr-2" /> : <CheckCircle size={20} className="mr-2" />}
          <span className="font-medium text-sm">{notification.msg}</span>
        </div>
      )}

      <BottomNav />
    </div>
  );
}