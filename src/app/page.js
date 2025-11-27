'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc,
  onSnapshot, query, orderBy, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { 
  Plus, Users, MapPin, Calendar, Clock, DollarSign, Ghost, Search, 
  UserPlus, CheckCircle, CalendarPlus, Navigation, ExternalLink, 
  LogOut, AlertTriangle, Ban, X, Edit, Trash2, Filter, Tag, Info, 
  MessageCircle, Hourglass, ChevronLeft, ChevronRight, Grid,
  Ticket, Gift, Timer, Globe, AlertCircle, Coffee, CalendarDays,
  Download, Settings, User
} from 'lucide-react';

    // 移除 INITIAL_EVENTS，因為現在使用 Firestore
    const INITIAL_EVENTS = [];
    // 這些常數可以保留
const today = new Date();
    // ...

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
  }
];

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function EscapeRoomApp() {
  // --- 全域狀態 ---
  const [user, setUser] = useState(null); 
  const [activeTab, setActiveTab] = useState('lobby'); 
  const [events, setEvents] = useState([]); // 改為空陣列，等待 Firestore 資料
  
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // 新增搜尋狀態

  const [filterDateType, setFilterDateType] = useState('All'); 
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDemoBanner, setShowDemoBanner] = useState(true); 

  const [notification, setNotification] = useState({ show: false, msg: "", type: "success" });
  const [confirmModal, setConfirmModal] = useState({ show: false, eventId: null, action: null }); 
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [managingEvent, setManagingEvent] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");

  const [formData, setFormData] = useState({
    title: "", studio: "", region: "北部", category: "密室逃脫", date: "", time: "", 
    price: "", priceFull: "", 
    totalSlots: 6, location: "", type: "恐怖驚悚",
    website: "", description: "", meetingTime: "15", duration: "120", minPlayers: 4,
    teammateNote: "", contactLineId: ""
  });

  // --- Auth 監聽 & User Data Sync ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
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
              isBanned: false
            };
            await setDoc(userRef, userData, { merge: true });
          } else {
              // 更新登入時間或同步 Google 資料
              await setDoc(userRef, {
                  displayName: userData.displayName || currentUser.displayName || "匿名玩家", // 優先使用 DB 中的暱稱，若無則用 Google 的
                  photoURL: userData.photoURL || currentUser.photoURL || "https://api.dicebear.com/7.x/ghost/svg?seed=" + currentUser.uid,
                  email: currentUser.email,
                  lastSeen: new Date()
              }, { merge: true });
          }

          setUser(userData);
        } catch (error) {
          console.error("Error fetching user data:", error);
          // 如果資料庫讀取失敗，至少先讓使用者登入，但顯示錯誤
          setUser({
            uid: currentUser.uid,
            displayName: currentUser.displayName || "使用者",
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            flakeCount: 0,
            isBanned: false
          });
          showToast("資料同步錯誤，部分功能可能受限", "error");
        }
      } else {
        setUser(null);
        setMyEvents([]);
        setMyWaitlists([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Real-time Events Listener ---
  useEffect(() => {
    // 監聽 events 集合
    const q = query(collection(db, "events"), orderBy("date", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventsData = [];
      querySnapshot.forEach((doc) => {
        eventsData.push({ id: doc.id, ...doc.data() });
      });
      setEvents(eventsData);
    });

    return () => unsubscribe();
  }, []);

  // --- Sync My Events / Waitlists ---
  useEffect(() => {
    if (user && events.length > 0) {
      const joined = [];
      const waiting = [];
      events.forEach(ev => {
        if (ev.participants && ev.participants.includes(user.uid)) {
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

  const getFilteredEvents = () => {
    const now = new Date();
     // 設定時間為 00:00:00 以便只比較日期部分
     now.setHours(0, 0, 0, 0);
    const todayStr = formatDate(now);
    
     let filtered = events;
 
     // 1. 基礎日期過濾：只顯示今天及未來的團
     filtered = filtered.filter(ev => {
       const eventDate = new Date(ev.date);
       eventDate.setHours(0, 0, 0, 0); // 確保只比較日期
       return eventDate >= now;
     });

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

    // 3. 搜尋過濾
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(ev => 
        ev.title.toLowerCase().includes(lowerQuery) || 
        (ev.description && ev.description.toLowerCase().includes(lowerQuery)) ||
        ev.studio.toLowerCase().includes(lowerQuery)
      );
    }

    // 4. 快速標籤
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
        return (day === 0 || day === 6);
      });
    }

    return filtered;
  };

  const handleUpdateProfile = async () => {
    if (!user || !profileName.trim()) return;
    try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            displayName: profileName
        });
        // 更新本地 user state，確保畫面即時反應
        setUser(prev => ({ ...prev, displayName: profileName }));
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
        
        if (type === 'waitlist') {
            await updateDoc(eventRef, {
                waitlist: arrayRemove(userId)
            });
        } else {
            const newSlots = event.currentSlots - 1;
            await updateDoc(eventRef, {
                participants: arrayRemove(userId),
                currentSlots: newSlots < 0 ? 0 : newSlots,
                isFull: false
            });
        }
        
        if (managingEvent && managingEvent.id === event.id) {
            setManagingEvent(prev => ({
                ...prev,
                [type === 'waitlist' ? 'waitlist' : 'participants']: prev[type === 'waitlist' ? 'waitlist' : 'participants'].filter(uid => uid !== userId),
                currentSlots: type === 'participant' ? prev.currentSlots - 1 : prev.currentSlots
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!managingEvent) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 重新抓取 event 資料以確保 pendingFlake 是最新的 (雖然外面有傳進來，但為求保險)
                const eventSnap = await getDoc(doc(db, "events", managingEvent.id));
                const currentEventData = eventSnap.data();
                
                // 如果有 pendingFlake，同步更新 managingEvent 狀態供 UI 顯示
                // 注意：這裡可能會造成 loop 如果沒有妥善處理，但因為依賴 managingEvent.id 且只在 mount 時跑，
                // 實際上我們應該依賴外部傳入的 managingEvent (它是即時的嗎？)
                // 這裡為了簡單，我們直接用 props 傳進來的 managingEvent 的 participants
                
                const pPromises = (managingEvent.participants || []).map(uid => getDoc(doc(db, "users", uid)));
                const wPromises = (managingEvent.waitlist || []).map(uid => getDoc(doc(db, "users", uid)));
                
                const [pSnaps, wSnaps] = await Promise.all([Promise.all(pPromises), Promise.all(wPromises)]);
                
                setParticipants(pSnaps.map(s => s.exists() ? s.data() : { uid: s.id, displayName: '未知使用者' }));
                setWaitlist(wSnaps.map(s => s.exists() ? s.data() : { uid: s.id, displayName: '未知使用者' }));
            } catch (err) {
                console.error("Error fetching users:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [managingEvent]);

    if (!managingEvent) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-slate-800 shadow-2xl relative flex flex-col max-h-[80vh]">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500" />
                
                <button onClick={() => { setShowManageModal(false); setManagingEvent(null); }} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full transition-colors">
                    <X size={18} />
                </button>

                <h3 className="text-xl font-bold text-white mb-1">管理團員</h3>
                <p className="text-slate-400 text-xs mb-4">可以移除成員或回報跳車。</p>

                {/* 顯示正在進行的檢舉狀態 */}
                {managingEvent.pendingFlake && (
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
                                                <img src={p.photoURL} alt="" className="w-full h-full object-cover"/>
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
                                        {p.uid !== managingEvent.hostUid && (
                                            <button 
                                                onClick={() => handleKick(managingEvent, p.uid, 'participant')}
                                                className="text-xs bg-slate-700 text-slate-400 px-3 py-1.5 rounded-lg hover:bg-slate-600 transition-colors"
                                            >
                                                移除
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* 只有主揪可以看到檢舉按鈕，且不能檢舉自己，也不能重複檢舉 */}
                                    {p.uid !== managingEvent.hostUid && !managingEvent.pendingFlake && (
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
                                            <img src={p.photoURL} alt="" className="w-full h-full object-cover"/>
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
                                    <button 
                                        onClick={() => handleKick(managingEvent, p.uid, 'waitlist')}
                                        className="text-xs bg-slate-700 text-slate-400 px-2 py-1.5 rounded-lg hover:bg-slate-600 transition-colors"
                                    >
                                        移除
                                    </button>
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
                                    onClick={() => setSelectedDate(d)}
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
                                        <div className={`text-xs px-2 py-1 rounded font-bold ${ev.currentSlots >= ev.totalSlots ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                            {ev.currentSlots >= ev.totalSlots ? '滿' : `缺${ev.totalSlots - ev.currentSlots}`}
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
    // 簡單實作 Google Calendar 連結
    const startTime = ev.date.replace(/-/g, '') + 'T' + ev.time.replace(':', '') + '00';
    // 假設活動 2 小時，若有 endTime 則使用，否則預設 +2h
    // 為了簡化，這裡暫時不精確計算結束時間，讀者可自行擴充
    const endTime = ev.endTime ? ev.date.replace(/-/g, '') + 'T' + ev.endTime.replace(':', '') + '00' : startTime;
    
    const details = `主揪: ${ev.host}\n地點: ${ev.location}\n備註: ${ev.description || '無'}`;
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(ev.location)}`;
    
    window.open(url, '_blank');
  };

  const handleNavigation = (location) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    window.open(url, '_blank');
  };

  const handleEdit = (ev) => {
    if (ev.hostUid !== user.uid) {
        showToast("您沒有權限編輯此活動", "error");
        return;
    }
    setFormData({
      title: ev.title, studio: ev.studio, region: ev.region || "北部", category: ev.category || "密室逃脫", date: ev.date, time: ev.time,
      price: ev.price, priceFull: ev.priceFull || ev.price,
      totalSlots: ev.totalSlots, location: ev.location, type: ev.type || "恐怖驚悚",
      website: ev.website || "", description: ev.description || "", 
      meetingTime: ev.meetingTime || "15", duration: ev.duration || "120", minPlayers: ev.minPlayers || 4,
      teammateNote: ev.teammateNote || "", contactLineId: ev.contactLineId || ""
    });
    setEditingId(ev.id);
    setIsEditing(true);
    setActiveTab('create');
  };

  const handleDelete = async (id) => {
    const eventToDelete = events.find(e => e.id === id);
    if (!eventToDelete) return;

    if (eventToDelete.hostUid !== user.uid) {
        showToast("您沒有權限刪除此活動", "error");
        return;
    }

    if (!confirm("確定要刪除這個揪團嗎？此操作無法復原。")) return;
    try {
      // 1. 備份/紀錄關團資訊到 archived_events 集合
      await setDoc(doc(db, "archived_events", id), {
        ...eventToDelete,
        archivedAt: new Date(),
        finalParticipants: eventToDelete.participants || [],
        finalWaitlist: eventToDelete.waitlist || []
      });

      // 2. 從 events 集合中移除
      await deleteDoc(doc(db, "events", id));
      showToast("揪團已關閉並封存", "success");
    } catch (error) {
      console.error("Error removing document: ", error);
      showToast("刪除失敗", "error");
    }
  };

  const promptJoin = (id) => {
    if (!user) { showToast("請先登入！", "error"); return; }
    if (user.flakeCount >= 3) { showToast("帳號受限。", "error"); return; }
    const targetEvent = events.find(e => e.id === id);
    if (!targetEvent) return;

    // 如果是候補，不需要太嚴重的確認，但為了統一體驗也可以加
    // 這裡假設直接顯示確認視窗
    setConfirmModal({ show: true, eventId: id, action: 'join', title: targetEvent.title });
  };

  const handleJoin = async (id) => {
    // 這個函式現在改為由 executeAction 呼叫，或者保留給內部邏輯
    // 為了避免混淆，我們把邏輯移到 executeAction 或獨立出來
    // 這裡保留空殼或移除，下面會重寫 executeAction
  };

  const promptCancel = (id) => setConfirmModal({ show: true, eventId: id, action: 'cancel' });

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
                }
            } else {
                const newSlots = targetEvent.currentSlots + 1;
                await updateDoc(eventRef, {
                    participants: arrayUnion(user.uid),
                    currentSlots: newSlots,
                    isFull: newSlots >= targetEvent.totalSlots
                });
                showToast(`報名成功！`, "success");
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
      } else {
            if (!targetEvent) return; // Should not happen

            // Update user flake count
        const newFlakeCount = user.flakeCount + 1;
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                flakeCount: newFlakeCount,
                isBanned: newFlakeCount >= 3
            });
            // Update local user state immediately to reflect change
        setUser({ ...user, flakeCount: newFlakeCount, isBanned: newFlakeCount >= 3 });
        
            // Remove from event
            const newSlots = targetEvent.currentSlots - 1;
            await updateDoc(eventRef, {
                participants: arrayRemove(user.uid),
                currentSlots: newSlots < 0 ? 0 : newSlots,
                isFull: false
            });
        
        showToast(newFlakeCount >= 3 ? "跳車次數過多，帳號已凍結" : "已取消報名 (跳車+1)", "error");
        }
      } catch (error) {
          console.error("Error executing action: ", error);
          showToast("操作失敗", "error");
      }
    }
    setConfirmModal({ show: false, eventId: null, action: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
    if (isEditing) {
        const eventRef = doc(db, "events", editingId);
        // 取得目前的 event 以計算 isFull
        const currentEvent = events.find(ev => ev.id === editingId);
        const newTotalSlots = Number(formData.totalSlots);
        const isFull = currentEvent ? currentEvent.currentSlots >= newTotalSlots : false;

        await updateDoc(eventRef, {
            ...formData,
          totalSlots: newTotalSlots,
          priceFull: formData.priceFull || formData.price,
          isFull: isFull
        });
        
      showToast("活動更新成功！", "success");
      setIsEditing(false);
      setEditingId(null);
    } else {
        await addDoc(collection(db, "events"), {
        ...formData,
          totalSlots: Number(formData.totalSlots),
        priceFull: formData.priceFull || formData.price,
        currentSlots: 1,
        isFull: false,
          endTime: "23:59", // 簡化處理
        tags: [formData.type],
          host: user.displayName,
          hostUid: user.uid,
          participants: [user.uid],
          waitlist: [],
          createdAt: new Date()
        });
      showToast("開團成功！", "success");
    }
    
      setFormData({ 
        title: "", studio: "", region: "北部", category: "密室逃脫", date: "", time: "", 
        price: "", priceFull: "", totalSlots: 6, location: "", type: "恐怖驚悚",
        website: "", description: "", meetingTime: "15", duration: "120", minPlayers: 4,
        teammateNote: "", contactLineId: ""
      });
    setActiveTab('lobby');
      // Reset Filters to ensure the new event is visible if it matches default logic
      setFilterCategory('All');
      setFilterRegion('All');
      setFilterStudio('All');
      setFilterMonth('All');
      setFilterDateType('All');
    } catch (error) {
      console.error("Error adding/updating document: ", error);
      showToast("操作失敗: " + error.message, "error");
    }
  };

  const showToast = (msg, type = "success") => {
    setNotification({ show: true, msg, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 3000);
  };

  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe z-40">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        <button onClick={() => setActiveTab('lobby')} className={`flex flex-col items-center space-y-1 ${activeTab === 'lobby' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <Search size={24} />
          <span className="text-xs">找團</span>
        </button>
        <button onClick={() => setActiveTab('promotions')} className={`flex flex-col items-center space-y-1 ${activeTab === 'promotions' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <Ticket size={24} />
          <span className="text-xs">優惠</span>
        </button>
        <button 
          onClick={() => {
            setActiveTab('create');
            setIsEditing(false);
          setFormData({ 
            title: "", studio: "", region: "北部", category: "密室逃脫", date: "", time: "", 
            price: "", priceFull: "", totalSlots: 6, location: "", type: "恐怖驚悚",
            website: "", description: "", meetingTime: "15", duration: "120", minPlayers: 4,
            teammateNote: "", contactLineId: ""
          });
          }} 
          className="flex flex-col items-center justify-center -mt-8 bg-emerald-500 text-white w-14 h-14 rounded-full shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
        >
          <Plus size={28} />
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center space-y-1 ${activeTab === 'profile' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <UserPlus size={24} />
          <span className="text-xs">我的</span>
        </button>
        <button onClick={() => setActiveTab('about')} className={`flex flex-col items-center space-y-1 ${activeTab === 'about' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <Info size={24} />
          <span className="text-xs">關於</span>
        </button>
      </div>
    </div>
  );

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
      
       {showCalendar && <CalendarModal />}
       
       {showSponsorModal && <SponsorModal />}
       
       {showManageModal && <ManageParticipantsModal />}

       <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
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
        
        {activeTab === 'lobby' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            
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

            {/* 進階篩選器區塊 */}
            <div className="space-y-4 bg-slate-900/50 p-4 rounded-3xl border border-slate-800">
              
              {/* 第一排：篩選選單 (改為 2x2 Grid) */}
              <div className="grid grid-cols-2 gap-3">
                 <select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-slate-800 text-white text-sm px-4 py-3 rounded-xl border border-slate-700 outline-none focus:border-emerald-500 appearance-none"
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
                    className="w-full bg-slate-800 text-white text-sm px-4 py-3 rounded-xl border border-slate-700 outline-none focus:border-emerald-500 appearance-none"
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
                    className="w-full bg-slate-800 text-white text-sm px-4 py-3 rounded-xl border border-slate-700 outline-none focus:border-emerald-500 appearance-none"
                 >
                   <option value="All">全部工作室</option>
                   {availableStudios.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                 </select>

                 <select 
                    value={filterMonth} 
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full bg-slate-800 text-white text-sm px-4 py-3 rounded-xl border border-slate-700 outline-none focus:border-emerald-500 appearance-none"
                 >
                   <option value="All">全部月份</option>
                   {availableMonths.filter(m => m !== 'All').map(m => <option key={m} value={m}>{m}月</option>)}
                 </select>
              </div>

              {/* 第二排：日期標籤與搜尋 (改為 Flex Wrap) */}
              <div className="flex flex-wrap items-center gap-2">
              {['All', 'Today', 'Tomorrow', 'Weekend'].map((type) => (
                <button 
                  key={type} 
                  onClick={() => setFilterDateType(type)}
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
                    {user && ev.hostUid === user.uid && (
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
                          {/* 顯示類別 */}
                          <span className="text-xs font-bold bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">
                            {ev.category}
                          </span>
                          <span className="text-xs font-bold bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                            {ev.region}
                          </span>
                          <h3 className="text-lg font-bold text-white truncate">{ev.title}</h3>
                        </div>
                        <div className="text-base font-bold text-slate-300 flex items-center mt-1">
                          <MapPin size={14} className="mr-1 shrink-0" />
                          <span className="truncate">{ev.studio}</span>
                        </div>
                        
                        {/* 簡介與網站 */}
                        {ev.description && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2">{ev.description}</p>
                        )}
                        {ev.teammateNote && (
                          <p className="text-xs text-emerald-400 mt-1 font-medium">徵求隊友：{ev.teammateNote}</p>
                        )}
                        {ev.website && (
                          <a href={ev.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-400 mt-1 hover:text-indigo-300">
                            <Globe size={10} /> 官網介紹
                          </a>
                        )}
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

                      {isJoined && ev.contactLineId && (
                        <div className="mt-3 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                          <div className="text-xs text-slate-400 mb-1">主揪聯繫方式 (僅參加者可見)：</div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 select-all">
                              {ev.contactLineId}
                            </span>
                            <span className="text-[10px] text-slate-500">(LINE ID)</span>
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
                      onClick={() => promptJoin(ev.id)}
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
                        <button className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-700 transition-colors">
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
              <button className="mt-3 text-emerald-400 text-sm font-bold hover:underline">
                聯繫我們刊登
              </button>
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              {isEditing ? <Edit className="mr-2 text-emerald-400" /> : <Plus className="mr-2 text-emerald-400" />}
              {isEditing ? '編輯揪團內容' : '建立新揪團'}
            </h2>
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
                <label className="text-sm text-slate-400 font-medium">活動簡介 (選填)</label>
                <textarea className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none h-20 resize-none" 
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="簡單介紹劇情..." />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-slate-400 font-medium">想找的隊友 (選填)</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" 
                  value={formData.teammateNote} onChange={e => setFormData({...formData, teammateNote: e.target.value})} placeholder="例如：缺坦克、需要會解謎的..." />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-slate-400 font-medium">主揪 LINE ID (參加後才可見)</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" 
                  value={formData.contactLineId} onChange={e => setFormData({...formData, contactLineId: e.target.value})} placeholder="方便大家聯繫你" />
              </div>

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
                  <label className="text-sm text-slate-400 font-medium">所在地區 <span className="text-red-500">*</span></label>
                  <select required className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                    value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})}>
                    {['北部', '中部', '南部', '東部', '離島'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
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
                    min={formatDate(new Date())}
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

        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
                
                {/* 編輯個人資料按鈕 */}
                <button 
                    onClick={() => {
                        if (isEditingProfile) {
                            setIsEditingProfile(false);
                        } else {
                            setProfileName(user.displayName);
                            setIsEditingProfile(true);
                        }
                    }}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full transition-colors"
                >
                    {isEditingProfile ? <X size={18}/> : <Settings size={18} />}
                </button>

               <div className="flex items-center justify-center mb-4">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700 relative overflow-hidden">
                   <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                 </div>
               </div>

                {isEditingProfile ? (
                    <div className="animate-in fade-in duration-300 mb-4">
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
                            儲存修改
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
              <h3 className="text-lg font-bold text-white px-1 mb-3">我的活動 (含候補)</h3>
              {[...myEvents, ...myWaitlists].length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  目前沒有任何行程，快去大廳找團吧！
                </div>
              ) : (
                events.filter(e => myEvents.includes(e.id) || myWaitlists.includes(e.id)).map(ev => {
                  const isWaitlisted = myWaitlists.includes(ev.id);
                  return (
                    <div key={ev.id} className="bg-slate-900 rounded-3xl p-5 border border-slate-800 mb-6 shadow-xl relative overflow-hidden group">
                      {/* 頂部裝飾條 */}
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70" />

                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {isWaitlisted ? (
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
                          </div>
                          <h3 className="text-xl font-bold text-white mb-1.5 leading-tight">{ev.title}</h3>
                          <div className="text-sm font-medium text-slate-400 flex items-center">
                            <MapPin size={14} className="mr-1.5 text-slate-500" />
                            {ev.studio}
                          </div>
                        </div>
                        
                        {/* 非主揪且非被檢舉人可見：若有進行中的檢舉，在右上角顯示附議按鈕 */}
                        {ev.hostUid !== user.uid && ev.pendingFlake && ev.pendingFlake.targetUid !== user.uid && (
                            <div className="absolute top-4 right-4 z-20 animate-pulse">
                                <button 
                                    onClick={() => handleConfirmFlake(ev)}
                                    className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-lg shadow-lg shadow-red-500/30 font-bold text-xs hover:bg-red-600 transition-colors border border-red-400"
                                >
                                    <AlertTriangle size={14} className="fill-current" />
                                    跳車附議
                                </button>
                            </div>
                        )}

                        {/* 操作按鈕群組 (主揪) */}
                        {ev.hostUid === user.uid && (
                          <div className="flex flex-col gap-2">
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
                                    setShowManageModal(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold text-xs border border-indigo-500/20 hover:bg-indigo-500/20 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                            >
                                <Users size={14} />
                                管理 ({ev.participants.length})
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

                      {ev.contactLineId && (
                        <div className="mb-4 p-3 bg-slate-800/30 rounded-xl border border-slate-700/30 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                <MessageCircle size={16} />
                             </div>
                             <div>
                                <div className="text-[10px] text-slate-500 font-medium">主揪 LINE ID</div>
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
                        onClick={() => promptCancel(ev.id)} 
                        className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center border transition-all active:scale-95
                          ${isWaitlisted 
                            ? 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800 hover:text-slate-300' 
                            : 'bg-red-500/5 text-red-400 border-red-500/10 hover:bg-red-500/10'}`}
                      >
                        {isWaitlisted ? (
                          <> <X size={16} className="mr-2" /> 取消候補申請</>
                        ) : (
                          <> <LogOut size={16} className="mr-2" /> 退出此揪團 (跳車)</>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
        {activeTab === 'about' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">關於我們</h2>
            
            {/* 作者卡片 */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
               <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700 mx-auto mb-3 relative">
                  <Ghost size={40} className="text-emerald-500 animate-pulse" />
               </div>
               <h3 className="text-xl font-bold text-white mb-1">Hi 我是小迷糊</h3>
               <p className="text-emerald-400 text-xs font-bold mb-4">發起人 / 笨蛋</p>
               <p className="text-slate-400 text-sm leading-relaxed mb-4">
                 我是笨蛋<br/>
                 這個東西是用愛發電<br/>
                 你的支持是我們的動力<br/>
                 歡迎贊助我們一杯咖啡 ☕
               </p>
               <button 
                 onClick={() => setShowSponsorModal(true)}
                 className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-900 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 <Coffee size={16} />
                 贊助小迷糊
               </button>
            </div>

            {/* 協作者卡片 */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg flex items-center gap-4">
               <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700 shrink-0">
                  <span className="text-2xl">👻</span>
               </div>
               <div>
                 <h3 className="text-lg font-bold text-white">飄</h3>
                 <p className="text-indigo-400 text-xs font-bold mb-1">協作者 / 維運</p>
                 <p className="text-slate-400 text-xs">
                   我是飄，負責維運。<br/>
                   偶爾幫忙修修 bug。
                 </p>
               </div>
            </div>

            <div className="text-center text-slate-600 text-xs mt-8">
              <p>小迷糊密室逃脫揪團 APP v1.0.0</p>
              <p>© 2023 All Rights Reserved.</p>
            </div>
          </div>
        )}
      </main>

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