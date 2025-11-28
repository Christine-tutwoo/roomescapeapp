'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc,
  getDocs, query, orderBy, where, limit, startAfter, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { 
  Plus, Users, MapPin, Calendar, Clock, DollarSign, Ghost, Search, 
  UserPlus, CheckCircle, CalendarPlus, Navigation, ExternalLink, 
  LogOut, AlertTriangle, Ban, X, Edit, Trash2, Filter, Tag, Info, 
  MessageCircle, Hourglass,   ChevronLeft, ChevronRight, Grid,
  Ticket, Gift, Timer, Globe, AlertCircle, Coffee, CalendarDays,
  Download, Settings, User, Sparkles, Heart, Share2, BellRing, ArrowLeft
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
  const [user, setUser] = useState(null); 
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
  const [filterEventId, setFilterEventId] = useState(null); // 用於分享連結的單一活動顯示
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

  const [formData, setFormData] = useState({
    title: "", studio: "", region: "北部", category: "密室逃脫", date: "", time: "", 
    price: "", priceFull: "", 
    totalSlots: 6, location: "", type: "恐怖驚悚",
    website: "", description: "", meetingTime: "15", duration: "120", minPlayers: 4,
    teammateNote: "", contactLineId: ""
  });
  const [createMode, setCreateMode] = useState('event'); // 'event' or 'wish'
  const [guestNames, setGuestNames] = useState([""]); // 攜伴姓名列表
  const [showGuestModal, setShowGuestModal] = useState(false); // 攜伴輸入框
  const [guestEventId, setGuestEventId] = useState(null); // 暫存要攜伴參加的活動 ID

  // --- WebView Check & URL Params Check ---
  useEffect(() => {
    if (isWebView()) {
      setInWebView(true);
    }
    
    // Check for shared event ID in URL
    if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedEventId = urlParams.get('eventId');
        if (sharedEventId) {
            setFilterEventId(sharedEventId);
            setActiveTab('lobby');
        }
    }
  }, []);

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
              isBanned: false,
              nameChangedCount: 0 // Initialize name change count
            };
            await setDoc(userRef, userData, { merge: true });
          } else {
              // 更新登入時間或同步 Google 資料
              await setDoc(userRef, {
                  displayName: userData.displayName || currentUser.displayName || "匿名玩家", // 優先使用 DB 中的暱稱，若無則用 Google 的
                  photoURL: userData.photoURL || currentUser.photoURL || "https://api.dicebear.com/7.x/ghost/svg?seed=" + currentUser.uid,
                  email: currentUser.email,
                  lastSeen: new Date(),
                  nameChangedCount: userData.nameChangedCount || 0 // Ensure field exists
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

  const myWishes = useMemo(() => {
    if (!user) return [];
    return wishes.filter(w => w.wishedBy?.includes(user.uid));
  }, [wishes, user]);

  const getFilteredEvents = () => {
    const now = new Date();
     // 設定時間為 00:00:00 以便只比較日期部分
     now.setHours(0, 0, 0, 0);
    const todayStr = formatDate(now);
    
     let filtered = events;
 
     // 0. 如果有指定 Event ID (分享連結)，只顯示該活動
     if (filterEventId) {
         return filtered.filter(ev => ev.id === filterEventId);
     }

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
            const slotsLeft = ev.totalSlots - ev.currentSlots;
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
    const url = `${window.location.origin}?eventId=${eventId}`;
    navigator.clipboard.writeText(url).then(() => {
        showToast("連結已複製！", "success");
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

    const isHost = user && managingEvent && user.uid === managingEvent.hostUid && !isViewOnlyMode;

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
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
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
      fetchEvents(false); // Refresh events
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

  const handleGuestJoin = async () => {
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
        
        // 檢查名額是否足夠
        if (targetEvent.currentSlots + validGuests.length > targetEvent.totalSlots) {
             showToast(`名額不足，目前僅剩 ${targetEvent.totalSlots - targetEvent.currentSlots} 個空位`, "error");
             return;
        }

        // 準備要加入的 guests 陣列
        const newGuests = validGuests.map(name => ({
            hostUid: user.uid,
            name: name.trim(),
            addedAt: new Date()
        }));

        const newSlots = targetEvent.currentSlots + newGuests.length;
        
        await updateDoc(eventRef, {
            currentSlots: newSlots,
            isFull: newSlots >= targetEvent.totalSlots,
            guests: arrayUnion(...newGuests) // 使用 spread operator 加入多個
        });
        
        showToast(`已幫 ${validGuests.join('、')} 報名成功！`, "success");
        setShowGuestModal(false);
        setGuestNames([""]); // 重置為單一空字串
        setGuestEventId(null);
        fetchEvents(false); // Refresh
    } catch (error) {
        console.error("Error adding guests:", error);
        showToast("攜伴失敗: " + error.message, "error");
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
      if (createMode === 'wish') {
        // 許願模式
        await addDoc(collection(db, "wishes"), {
          title: formData.title,
          studio: formData.studio,
          region: formData.region,
          category: formData.category,
          type: formData.type,
          website: formData.website || "",
          location: formData.location, // 工作室地址
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
        setActiveTab('lobby');
        // Reset Filters to ensure the new event is visible if it matches default logic
        setFilterCategory('All');
        setFilterRegion('All');
        setFilterStudio('All');
        setFilterMonth('All');
        setFilterDateType('All');
        setSelectedDateFilter(null);
        // Refresh events to show the changes
        fetchEvents(false);
      }
    
      setFormData({ 
        title: "", studio: "", region: "北部", category: "密室逃脫", date: "", time: "", 
        price: "", priceFull: "", totalSlots: 6, location: "", type: "恐怖驚悚",
        website: "", description: "", meetingTime: "15", duration: "120", minPlayers: 4,
        teammateNote: "", contactLineId: ""
      });
    } catch (error) {
      console.error("Error adding/updating document: ", error);
      showToast("操作失敗: " + error.message, "error");
    }
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
          onClick={() => {
            setActiveTab('create');
            setIsEditing(false);
            setCreateMode('event'); // Default to event mode
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

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border-4 border-slate-800 mb-8 shadow-xl shadow-emerald-500/10">
          <Sparkles size={48} className="text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          小迷糊密室逃脫揪團平台
        </h1>
        <p className="text-slate-400 mb-8 max-w-xs leading-relaxed">
          下一場冒險。從這裡出發。<br/>
          找隊友、排行程，一次搞定。
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
       
       {showImageModal && <ImageModal />}
       
       {showManageModal && <ManageParticipantsModal />}

       <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent truncate max-w-[70%]">
            小迷糊密室逃脫揪團平台
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="text-slate-400 hover:text-white"><LogOut size={18} /></button>
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

                    <div className="flex justify-between items-start mb-3 pr-12 relative">
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
                        </div>

                        {/* 標題 (獨立一行) */}
                        <h3 className="text-xl font-bold text-white mb-2 leading-tight block">{ev.title}</h3>
                        
                        <div className="text-sm font-bold text-slate-300 flex items-center mb-3">
                          <MapPin size={14} className="mr-1.5 shrink-0 text-slate-500" />
                          <span className="truncate">{ev.studio}</span>
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
                          disabled={isJoined || isWaitlisted}
                            onClick={() => promptJoin(ev.id)}
                          className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 flex items-center justify-center
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
                                : <><UserPlus size={16} className="mr-2"/> 我要 +1</>}
                        </button>

                        {!isJoined && !isWaitlisted && !ev.isFull && (
                            <button 
                                onClick={() => {
                                    setGuestEventId(ev.id);
                                    setShowGuestModal(true);
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
            <div className="grid gap-4">
              {wishes.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-500 mb-4">目前還沒有人許願</p>
                  <button onClick={() => { setActiveTab('create'); setCreateMode('wish'); }} className="px-4 py-2 bg-pink-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-pink-500/20 hover:bg-pink-400 transition-all">
                    我來許第一個願！
                  </button>
                </div>
              ) : (
                wishes.map(wish => {
                  const currentCount = wish.wishCount || 1;
                  const targetCount = wish.targetCount || 4;
                  const isFull = currentCount >= targetCount;
                  const isWished = wish.wishedBy?.includes(user?.uid);

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
                            {wish.studio}
                        </div>
                        {wish.location && (
                            <div className="text-xs text-slate-500 flex items-center">
                                <Navigation size={12} className="mr-1.5" />
                                {wish.location}
                            </div>
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
                        <div className="text-xs text-slate-500">
                            發起人：{wish.host}
                        </div>
                        <button 
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                                ${isWished 
                                    ? 'bg-pink-500 text-white border-pink-500 hover:bg-pink-600' 
                                    : 'bg-pink-500/10 text-pink-400 border-pink-500/20 hover:bg-pink-500/20'}`}
                            onClick={() => handleJoinWish(wish)}
                        >
                            <Heart size={14} className={isWished ? "fill-current" : ""} />
                            {isWished ? `已集氣 (${wish.wishCount || 0})` : `集氣 +1 (${wish.wishCount || 0})`}
                        </button>
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
                <label className="text-sm text-slate-400 font-medium">想找的隊友 (選填)</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" 
                  value={formData.teammateNote} onChange={e => setFormData({...formData, teammateNote: e.target.value})} placeholder="例如：缺坦克、需要會解謎的..." />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-slate-400 font-medium">{createMode === 'wish' ? '主辦 LINE ID' : '主揪 LINE ID'} (參加後才可見)</label>
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
                      <input 
                        type="number" 
                        required 
                        min="2" 
                        max="20"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-emerald-500 outline-none"
                        value={formData.totalSlots} 
                        onChange={e => setFormData({...formData, totalSlots: e.target.value})}
                        placeholder="請輸入人數"
                      />
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
                    <label className="text-sm text-slate-400 font-medium">工作室地址 <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-3.5 text-slate-500" />
                      <input required type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-emerald-500 outline-none" 
                        value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="方便大家導航" />
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
                        max="20"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-emerald-500 outline-none"
                        value={formData.minPlayers} 
                        onChange={e => setFormData({...formData, minPlayers: e.target.value})}
                        placeholder="例如: 4"
                      />
                    </div>
                  </div>
                </>
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
                            {wish.studio}
                          </div>
                        </div>
                        <button 
                            onClick={() => handleCancelWish(wish.id)}
                            className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-red-400 border border-slate-700 transition-colors shrink-0"
                            title={wish.hostUid === user.uid ? "刪除許願" : "取消許願"}
                        >
                            {wish.hostUid === user.uid ? <Trash2 size={16} /> : <LogOut size={16} />}
                        </button>
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

      {/* Guest Join Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-6 border border-slate-800 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                    <UserPlus className="text-emerald-500 mr-2" />
                    攜伴參加
                </h3>
                <p className="text-slate-400 mb-4 text-sm">
                    幫朋友代報名，每位朋友都會佔用一個名額。<br/>
                    請輸入朋友的暱稱：
                </p>
                
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

                {(() => {
                    const targetEvent = events.find(e => e.id === guestEventId);
                    const remainingSlots = targetEvent ? targetEvent.totalSlots - targetEvent.currentSlots : 0;
                    const canAddMore = guestNames.length < remainingSlots;

                    return (
                        <button 
                            disabled={!canAddMore}
                            onClick={() => setGuestNames([...guestNames, ""])}
                            className={`w-full py-3 mb-4 rounded-xl border border-dashed text-sm font-bold flex items-center justify-center gap-2 transition-all
                                ${canAddMore 
                                    ? 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800/50' 
                                    : 'border-slate-800 text-slate-600 cursor-not-allowed bg-slate-900/50'}`}
                        >
                            {canAddMore ? (
                                <>
                                    <Plus size={16} />
                                    增加一位朋友
                                </>
                            ) : (
                                <span>已達本團人數上限</span>
                            )}
                        </button>
                    );
                })()}

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowGuestModal(false)} className="py-2.5 rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors font-medium">取消</button>
                    <button onClick={handleGuestJoin} className="py-2.5 rounded-xl text-slate-900 bg-emerald-500 hover:bg-emerald-400 font-bold shadow-lg shadow-emerald-500/20 transition-all">
                        確認代報名 ({guestNames.filter(n => n.trim()).length}人)
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