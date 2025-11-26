'use client';
'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Users, MapPin, Calendar, Clock, DollarSign, Ghost, Search, UserPlus, CheckCircle, CalendarPlus, Navigation, ExternalLink, LogOut, AlertTriangle, Ban, X, Edit, Trash2, Filter, Tag, Info, MessageCircle, Hourglass } from 'lucide-react';

// --- 模擬資料庫 (Mock Data) ---
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);

const formatDate = (date) => date.toISOString().split('T')[0];

const INITIAL_EVENTS = [
  {
    id: 1,
    title: "籠中鳥",
    studio: "笨蛋工作室",
    date: formatDate(today),
    time: "14:00",
    endTime: "16:00",
    location: "台北市松山區寶清街31號1樓",
    price: 650,
    priceFull: 600,
    deposit: 200,
    totalSlots: 6,
    currentSlots: 4,
    tags: ["恐怖", "新手友善"],
    type: "恐怖驚悚",
    isFull: false,
    host: "阿偉"
  },
  {
    id: 2,
    title: "秦關",
    studio: "玩笑實驗室",
    date: formatDate(tomorrow),
    time: "19:00",
    endTime: "21:00",
    location: "台北市內湖區內湖路一段136號",
    price: 800,
    priceFull: 750,
    deposit: 300,
    totalSlots: 8,
    currentSlots: 8, // 故意設為滿團，方便測試候補
    tags: ["大型機關", "古裝"],
    type: "機關冒險",
    isFull: true,
    host: "小美"
  },
  {
    id: 3,
    title: "觀落陰",
    studio: "Miss Game",
    date: formatDate(nextWeek),
    time: "15:30",
    endTime: "17:30",
    location: "台北市萬華區漢中街24號",
    price: 600,
    priceFull: 600,
    deposit: 200,
    totalSlots: 5,
    currentSlots: 2,
    tags: ["微恐", "劇情向"],
    type: "劇情沉浸",
    isFull: false,
    host: "你是鬼吧"
  }
];

export default function EscapeRoomApp() {
  // --- 全域狀態 ---
  // 用戶狀態
  const [user, setUser] = useState(null); 
  // 頁面狀態
  const [activeTab, setActiveTab] = useState('lobby'); 
  // 活動資料
  const [events, setEvents] = useState(INITIAL_EVENTS);
  
  // 狀態管理：區分「正取」和「候補」
  const [myEvents, setMyEvents] = useState([]); // 存正取的 ID
  const [myWaitlists, setMyWaitlists] = useState([]); // 存候補的 ID
  
  // --- 篩選與編輯狀態 ---
  const [filterDateType, setFilterDateType] = useState('All'); 
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDemoBanner, setShowDemoBanner] = useState(true); 

  // --- UI 狀態 ---
  const [notification, setNotification] = useState({ show: false, msg: "", type: "success" });
  const [confirmModal, setConfirmModal] = useState({ show: false, eventId: null, action: null }); 

  // --- 表單狀態 ---
  const [formData, setFormData] = useState({
    title: "", studio: "", date: "", time: "", 
    price: "", priceFull: "", 
    totalSlots: 6, location: "", type: "恐怖驚悚"
  });

  // --- 功能: 模擬登入 ---
  const handleLogin = () => {
    const mockUser = {
      uid: "user_123",
      displayName: "熱血密室迷",
      email: "player@example.com",
      photoURL: "https://api.dicebear.com/7.x/ghost/svg?seed=Felix",
      flakeCount: 0, 
      isBanned: false 
    };
    mockUser.displayName = "阿偉"; 
    
    setUser(mockUser);
    setMyEvents([1]); 
    showToast(`歡迎回來，${mockUser.displayName}！`, "success");
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('lobby');
    setMyEvents([]);
    setMyWaitlists([]);
  };

  // --- 功能: 篩選 ---
  const getFilteredEvents = () => {
    const now = new Date();
    const todayStr = formatDate(now);
    
    let filtered = events.filter(ev => {
      return ev.date >= todayStr;
    });

    if (filterDateType === 'Today') {
      filtered = filtered.filter(ev => ev.date === todayStr);
    } else if (filterDateType === 'Tomorrow') {
      const tmr = new Date();
      tmr.setDate(tmr.getDate() + 1);
      filtered = filtered.filter(ev => ev.date === formatDate(tmr));
    } else if (filterDateType === 'Weekend') {
      filtered = filtered.filter(ev => {
        const d = new Date(ev.date);
        const day = d.getDay();
        return (day === 0 || day === 6) && ev.date >= todayStr;
      });
    }

    return filtered;
  };

  // --- 功能: 編輯與刪除 ---
  const handleEdit = (ev) => {
    setFormData({
      title: ev.title, studio: ev.studio, date: ev.date, time: ev.time,
      price: ev.price, priceFull: ev.priceFull || ev.price,
      totalSlots: ev.totalSlots, location: ev.location, type: ev.type || "恐怖驚悚"
    });
    setEditingId(ev.id);
    setIsEditing(true);
    setActiveTab('create');
  };

  const handleDelete = (id) => {
    if (!confirm("確定要刪除這個揪團嗎？此操作無法復原。")) return;
    setEvents(events.filter(e => e.id !== id));
    setMyEvents(myEvents.filter(eid => eid !== id));
    setMyWaitlists(myWaitlists.filter(eid => eid !== id));
    showToast("揪團已刪除", "success");
  };

  // --- 功能: 報名與候補邏輯 (核心修改) ---
  const handleJoin = (id) => {
    if (!user) { showToast("請先登入！", "error"); return; }
    if (user.flakeCount >= 3) { showToast("帳號受限。", "error"); return; }

    const targetEvent = events.find(e => e.id === id);
    if (!targetEvent) return;

    // 判斷是正取還是候補
    if (targetEvent.currentSlots >= targetEvent.totalSlots) {
      // --- 滿團：加入候補 ---
      if (!myWaitlists.includes(id)) {
        setMyWaitlists([...myWaitlists, id]);
        showToast("已加入候補名單！若有空缺將通知您", "success");
      }
    } else {
      // --- 未滿：直接正取 ---
      setEvents(events.map(ev => {
        if (ev.id === id) {
          const newSlots = ev.currentSlots + 1;
          return { ...ev, currentSlots: newSlots, isFull: newSlots >= ev.totalSlots };
        }
        return ev;
      }));
      if (!myEvents.includes(id)) setMyEvents([...myEvents, id]);
      showToast(`報名成功！`, "success");
    }
  };

  const promptCancel = (id) => setConfirmModal({ show: true, eventId: id, action: 'cancel' });

  const executeAction = () => {
    const { eventId, action } = confirmModal;
    if (action === 'cancel') {
      // 檢查是取消正取還是取消候補
      const isWaitlisted = myWaitlists.includes(eventId);

      if (isWaitlisted) {
        // --- 取消候補 (不扣信用分) ---
        setMyWaitlists(myWaitlists.filter(eid => eid !== eventId));
        showToast("已取消候補申請", "success");
      } else {
        // --- 取消正取 (跳車，扣信用分) ---
        const newFlakeCount = user.flakeCount + 1;
        setUser({ ...user, flakeCount: newFlakeCount, isBanned: newFlakeCount >= 3 });
        
        // 釋出名額
        setEvents(events.map(ev => ev.id === eventId ? { ...ev, currentSlots: ev.currentSlots - 1, isFull: false } : ev));
        setMyEvents(myEvents.filter(eid => eid !== eventId));
        
        showToast(newFlakeCount >= 3 ? "跳車次數過多，帳號已凍結" : "已取消報名 (跳車+1)", "error");
      }
    }
    setConfirmModal({ show: false, eventId: null, action: null });
  };

  // --- 表單送出 ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) return;

    if (isEditing) {
      setEvents(events.map(ev => {
        if (ev.id === editingId) {
          return {
            ...ev,
            ...formData,
            isFull: ev.currentSlots >= formData.totalSlots
          };
        }
        return ev;
      }));
      showToast("活動更新成功！", "success");
      setIsEditing(false);
      setEditingId(null);
    } else {
      const newEventObj = {
        id: Date.now(), 
        ...formData,
        priceFull: formData.priceFull || formData.price,
        currentSlots: 1,
        isFull: false,
        endTime: "23:59",
        tags: [formData.type],
        host: user.displayName
      };
      setEvents([newEventObj, ...events]);
      setMyEvents([...myEvents, newEventObj.id]);
      showToast("開團成功！", "success");
    }
    
    setFormData({ title: "", studio: "", date: "", time: "", price: "", priceFull: "", totalSlots: 6, location: "", type: "恐怖驚悚" });
    setActiveTab('lobby');
  };

  // --- Helper ---
  const showToast = (msg, type = "success") => {
    setNotification({ show: true, msg, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 3000);
  };

  // --- Components ---
  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe z-40">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        <button onClick={() => setActiveTab('lobby')} className={`flex flex-col items-center space-y-1 ${activeTab === 'lobby' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <Search size={24} />
          <span className="text-xs">找團</span>
        </button>
        <button 
          onClick={() => {
            setActiveTab('create');
            setIsEditing(false);
            setFormData({ title: "", studio: "", date: "", time: "", price: "", priceFull: "", totalSlots: 6, location: "", type: "恐怖驚悚" });
          }} 
          className="flex flex-col items-center justify-center -mt-8 bg-emerald-500 text-white w-14 h-14 rounded-full shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
        >
          <Plus size={28} />
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center space-y-1 ${activeTab === 'profile' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <UserPlus size={24} />
          <span className="text-xs">我的</span>
        </button>
      </div>
    </div>
  );

  // 登入畫面
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border-4 border-slate-800 mb-8 shadow-xl shadow-emerald-500/10">
          <Ghost size={48} className="text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          小迷糊密室逃脫揪團APP
        </h1>
        <p className="text-slate-400 mb-8 max-w-xs">
          最懂密室玩家的揪團神器。<br/>
          主揪管理、自動防雷、行程同步。
        </p>
        <button onClick={handleLogin} className="w-full max-w-xs bg-white text-slate-900 font-bold py-3.5 rounded-xl flex items-center justify-center space-x-3 hover:bg-slate-100 transition-all active:scale-95">
          <span>使用 Google 帳號登入</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 selection:bg-emerald-500/30">
      
      {/* 頂部 Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        
        {/* 體驗版警示條 */}
        {showDemoBanner && (
          <div className="bg-indigo-600/20 px-4 py-2 text-xs text-indigo-200 flex items-start justify-between">
            <div className="flex gap-2">
              <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-indigo-300 block mb-0.5">目前為「體驗版」模式</strong>
                資料僅暫存，重新整理後會重置。
              </span>
            </div>
            <button onClick={() => setShowDemoBanner(false)} className="text-indigo-400 p-1 hover:text-white"><X size={14}/></button>
          </div>
        )}

        <div className="px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent truncate max-w-[70%]">
            小迷糊密室逃脫揪團APP
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="text-slate-400 hover:text-white"><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        
        {/* 頁面: 找團大廳 */}
        {activeTab === 'lobby' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            
            {/* 社群宣傳 Banner */}
            <a 
              href="https://linktr.ee/hu._escaperoom" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 text-white shadow-lg flex items-center justify-between group hover:brightness-110 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-white/20 p-2.5 rounded-full backdrop-blur-sm border border-white/20">
                  <MessageCircle size={22} className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-sm md:text-base">加入小迷糊密室社群</div>
                  <div className="text-xs text-purple-100 mt-0.5">找隊友、聊密室、看評論 👉</div>
                </div>
              </div>
              <ExternalLink size={18} className="text-purple-200 group-hover:text-white transition-colors relative z-10" />
            </a>

            {/* 日期篩選器 */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide pt-2">
              <Filter size={16} className="text-slate-500 shrink-0 ml-1" />
              {['All', 'Today', 'Tomorrow', 'Weekend'].map((type) => (
                <button 
                  key={type} 
                  onClick={() => setFilterDateType(type)}
                  className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors
                    ${filterDateType === type 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'}`}
                >
                  {type === 'All' ? '全部日期' : type === 'Today' ? '今天' : type === 'Tomorrow' ? '明天' : '本週末'}
                </button>
              ))}
            </div>

            {getFilteredEvents().length === 0 ? (
              <div className="text-center py-10 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                <Ghost size={40} className="mx-auto mb-2 opacity-20" />
                <p>目前沒有符合的揪團<br/>快來當主揪開一團吧！</p>
              </div>
            ) : (
              getFilteredEvents().map((ev) => {
                const isJoined = myEvents.includes(ev.id);
                const isWaitlisted = myWaitlists.includes(ev.id);
                
                return (
                  <div key={ev.id} className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
                    {/* 主揪管理按鈕 */}
                    {ev.host === user.displayName && (
                      <div className="absolute top-3 right-3 flex space-x-2 z-20">
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(ev); }} className="p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 border border-slate-700">
                          <Edit size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(ev.id); }} className="p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 border border-slate-700">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-3 pr-16">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            {ev.type}
                          </span>
                          <h3 className="text-lg font-bold text-white truncate">{ev.title}</h3>
                        </div>
                        <div className="text-sm text-slate-400 flex items-center">
                          <MapPin size={12} className="mr-1 shrink-0" />
                          <span className="truncate">{ev.studio}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-300 mb-4 bg-slate-950/30 p-3 rounded-xl">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-2 text-slate-500" />
                        {ev.date}
                      </div>
                      <div className="flex items-center">
                        <Clock size={14} className="mr-2 text-slate-500" />
                        {ev.time}
                      </div>
                      <div className="flex items-center col-span-2">
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
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-400">主揪：{ev.host}</span>
                        <span className={ev.isFull ? "text-red-400" : "text-emerald-400"}>
                          {ev.isFull ? "額滿" : `缺 ${ev.totalSlots - ev.currentSlots} 人`}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${ev.isFull ? 'bg-slate-600' : 'bg-emerald-500'}`} style={{ width: `${(ev.currentSlots / ev.totalSlots) * 100}%` }} />
                      </div>
                    </div>

                    <button 
                      disabled={isJoined || isWaitlisted}
                      onClick={() => handleJoin(ev.id)}
                      className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 flex items-center justify-center
                        ${isJoined 
                          ? 'bg-slate-800 text-emerald-400 border border-emerald-500/20 cursor-not-allowed' 
                          : isWaitlisted
                            ? 'bg-slate-800 text-yellow-400 border border-yellow-500/20 cursor-not-allowed'
                            : ev.isFull 
                              ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20' 
                              : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'}`}
                    >
                      {isJoined 
                        ? <><CheckCircle size={16} className="mr-2"/> 已參加 (正取)</>
                        : isWaitlisted 
                          ? <><Hourglass size={16} className="mr-2"/> 已在候補名單</>
                          : ev.isFull 
                            ? '額滿，排候補' 
                            : '我要 +1'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 頁面: 開新團 / 編輯團 */}
        {activeTab === 'create' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              {isEditing ? <Edit className="mr-2 text-emerald-400" /> : <Plus className="mr-2 text-emerald-400" />}
              {isEditing ? '編輯揪團內容' : '建立新揪團'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              
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

              <div className="space-y-1.5">
                <label className="text-sm text-slate-400 font-medium">工作室 <span className="text-red-500">*</span></label>
                <input required type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" 
                  value={formData.studio} onChange={e => setFormData({...formData, studio: e.target.value})} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-slate-400 font-medium">完整地址 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-3.5 text-slate-500" />
                  <input required type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-emerald-500 outline-none" 
                    value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="方便大家導航" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-400 font-medium">日期 <span className="text-red-500">*</span></label>
                  <input required type="date" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none [color-scheme:dark]" 
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-400 font-medium">時間 <span className="text-red-500">*</span></label>
                  <input required type="time" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none [color-scheme:dark]" 
                    value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>

              {/* 價格設定區 */}
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
                      <input required type="number" className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white focus:border-emerald-500 outline-none" 
                        value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="600" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-slate-400 font-medium">滿團優惠價 (選填)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-slate-500">$</span>
                      <input type="number" className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white focus:border-emerald-500 outline-none" 
                        value={formData.priceFull} onChange={e => setFormData({...formData, priceFull: e.target.value})} placeholder="550" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500">若有設定滿團價，大廳會顯示「(滿團 $550)」供玩家參考。</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-slate-400 font-medium">總人數 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Users size={18} className="absolute left-4 top-3.5 text-slate-500" />
                  <select required className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-emerald-500 outline-none appearance-none"
                    value={formData.totalSlots} onChange={e => setFormData({...formData, totalSlots: Number(e.target.value)})}>
                    {[4,5,6,7,8,10].map(n => <option key={n} value={n}>{n} 人</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={user.flakeCount >= 3} className={`w-full font-bold text-lg py-4 rounded-xl shadow-lg active:scale-95 transition-all ${user.flakeCount >= 3 ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 text-slate-900 shadow-emerald-500/20 hover:bg-emerald-400'}`}>
                  {user.flakeCount >= 3 ? '帳號受限' : (isEditing ? '更新揪團資訊' : '發布揪團')}
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

        {/* 頁面: 個人資料 */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
               <div className="flex items-center justify-center mb-4">
                 <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700 relative">
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full" />
                 </div>
               </div>
               <h2 className="text-xl font-bold text-white">{user.displayName}</h2>
               <div className="flex justify-center gap-4 mt-3 text-sm text-slate-400">
                 <div className="flex flex-col"><span className="font-bold text-white text-lg">{myEvents.length + myWaitlists.length}</span><span className="text-xs">活動/候補</span></div>
                 <div className="w-px bg-slate-700"></div>
                 <div className="flex flex-col"><span className={`font-bold text-lg ${user.flakeCount>0?'text-red-400':'text-emerald-400'}`}>{user.flakeCount}</span><span className="text-xs">跳車</span></div>
               </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white px-1 mb-3">我的活動 (含候補)</h3>
              {[...myEvents, ...myWaitlists].length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  目前沒有任何行程，快去大廳找團吧！
                </div>
              ) : (
                // 合併顯示正取和候補的活動
                events.filter(e => myEvents.includes(e.id) || myWaitlists.includes(e.id)).map(ev => {
                  const isWaitlisted = myWaitlists.includes(ev.id);
                  return (
                    <div key={ev.id} className="bg-slate-900 rounded-2xl p-4 border border-slate-800 mb-4 shadow-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {/* 狀態標籤 */}
                            {isWaitlisted ? (
                              <span className="text-xs font-bold bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/20 flex items-center">
                                <Hourglass size={12} className="mr-1"/> 候補排隊中
                              </span>
                            ) : (
                              <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center">
                                <CheckCircle size={12} className="mr-1"/> 正取已參加
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-white mb-1">{ev.title}</h3>
                          <div className="text-sm text-slate-400 flex items-center">
                            <MapPin size={12} className="mr-1" />{ev.studio}
                          </div>
                        </div>
                        
                        {/* 主揪管理區 */}
                        {ev.host === user.displayName && (
                          <div className="flex space-x-2">
                            <button onClick={() => handleEdit(ev)} className="p-2 bg-slate-800 rounded-lg text-emerald-400 border border-slate-700 hover:bg-slate-700">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(ev.id)} className="p-2 bg-slate-800 rounded-lg text-red-400 border border-slate-700 hover:bg-slate-700">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* 導航與行事曆 (僅正取顯示，或候補也可以看地點) */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <button className="flex items-center justify-center py-2.5 bg-slate-800 text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors border border-slate-700">
                           <CalendarPlus size={16} className="mr-2 text-emerald-400" />
                           行事曆
                        </button>
                        <button className="flex items-center justify-center py-2.5 bg-slate-800 text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors border border-slate-700">
                           <Navigation size={16} className="mr-2 text-blue-400" />
                           導航
                        </button>
                      </div>

                      {/* 跳車/取消候補按鈕 */}
                      <button 
                        onClick={() => promptCancel(ev.id)} 
                        className={`w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center border
                          ${isWaitlisted 
                            ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'}`}
                      >
                        {isWaitlisted ? (
                          <> <X size={16} className="mr-2" /> 取消候補 (不扣分)</>
                        ) : (
                          <> <LogOut size={16} className="mr-2" /> 取消參加 / 跳車</>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* 彈窗元件 */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-6 border border-slate-800 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center">
              <AlertTriangle className="text-red-500 mr-2" />
              {confirmModal.action === 'cancel' 
                ? (myWaitlists.includes(confirmModal.eventId) ? '確定取消候補？' : '確定要跳車嗎？')
                : '確定要刪除？'}
            </h3>
            <p className="text-slate-400 mb-6">
              {confirmModal.action === 'cancel' 
                ? (myWaitlists.includes(confirmModal.eventId) 
                    ? '取消候補不會影響您的信用分數。' 
                    : `這將會增加您的跳車次數 (${user.flakeCount + 1})。`)
                : '刪除後所有報名者都會被移除，且無法復原。'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setConfirmModal({show:false})} className="py-3 rounded-xl text-slate-300 bg-slate-800">取消</button>
              <button onClick={executeAction} className="py-3 rounded-xl text-white bg-red-500 font-bold">確認執行</button>
            </div>
          </div>
        </div>
      )}

      {/* 顯示 Toast */}
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