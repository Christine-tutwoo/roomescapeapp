'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import {
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc,
  getDocs, query, orderBy, where, limit, startAfter, arrayUnion, arrayRemove, deleteField
} from 'firebase/firestore';
import {
  Plus, Users, MapPin, Calendar, Clock, DollarSign, Ghost, Search,
  UserPlus, CheckCircle, CalendarPlus, Navigation, ExternalLink,
  LogOut, AlertTriangle, Ban, X, Edit, Trash2, Filter, Tag, Info,
  MessageCircle, Hourglass, ChevronLeft, ChevronRight, Grid,
  Ticket, Gift, Timer, Globe, AlertCircle, Coffee, CalendarDays,
  Download, Settings, User, Sparkles, Heart, Share2, BellRing, ArrowLeft,
  ChevronDown
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
    icon: <Ticket className="text-[#212121]" />
  },
  {
    id: 2,
    studio: "揪揪玩工作室",
    title: "現場折 50 元",
    content: "出示公告即可現場折 50 元 (主題：寶寶睡)。",
    period: "即日起 - 2026/6/30",
    color: "from-pink-500 to-rose-500",
    icon: <DollarSign className="text-[#212121]" />
  },
  {
    id: 3,
    studio: "塊陶阿",
    title: "百元折價券 (下次使用)",
    content: "私訊小迷糊IG並出示預約截圖，遊玩後依人頭數給予百元折價卷(連刷可適用)。見鬼十法、醫怨、荒村小學適用。",
    period: "長期優惠",
    color: "from-orange-500 to-red-600",
    icon: <Ghost className="text-[#212121]" />
  },
  {
    id: 4,
    studio: "EnterSpace",
    title: "百元折價券 (下次使用)",
    content: "體驗後至「逃脫吧」留言並出示群組證明，每人獲一張百元折價券(下次使用)。需4人以上，每場最多用6張。",
    period: "2026/01/01 - 2026/06/30",
    color: "from-blue-600 to-indigo-700",
    icon: <ExternalLink className="text-[#212121]" />
  },
  {
    id: 5,
    studio: "Miss GAME",
    title: "《幻隱光靈：三界》95折",
    content: "私訊社群IG出示「確認遊玩」截圖，索取優惠碼。於FunNow預訂時輸入即可享95折。",
    period: "長期優惠",
    color: "from-purple-600 to-fuchsia-600",
    icon: <Tag className="text-[#212121]" />
  },
  {
    id: 6,
    studio: "癮密工作室",
    title: "【平日】百元折價券 (限量)",
    content: "私訊小迷糊IG出示預約截圖，平日場次現場直接折抵100元。每團限用一張，需3人以上。",
    period: "長期優惠",
    color: "from-emerald-600 to-teal-600",
    icon: <Clock className="text-[#212121]" />
  },
  {
    id: 7,
    studio: "純密室 (中原店)",
    title: "【平日】連刷四場優惠",
    content: "平日至中原店連刷四場，4人(含)以上，即可獲得「一人」折「兩百元」的優惠。需私訊登記。",
    period: "長期優惠",
    color: "from-yellow-600 to-amber-600",
    icon: <Users className="text-[#212121]" />
  },
  {
    id: 8,
    studio: "月蝕謎願-室在哈邏密室逃脫工作室",
    title: "百元折價券 (下次使用)",
    content: "看人頭數給予一百元折價卷（下次使用）。",
    period: "長期優惠",
    color: "from-indigo-600 to-purple-600",
    icon: <Ticket className="text-[#212121]" />
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

export default function LobbyPage() {
  // --- 全域狀態 ---
  const [inWebView, setInWebView] = useState(false);
  const [user, setUser] = useState(VISITOR_USER);
  const [activeTab, setActiveTab] = useState('lobby'); // 'lobby' or 'wishes' 
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [wishes, setWishes] = useState([]); // 新增許願池狀態
  const [lastVisible, setLastVisible] = useState(null);
  const lastVisibleRef = useRef(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const EVENTS_PER_PAGE = 9;
  const loadMoreSentinelRef = useRef(null);
  const isFetchingMoreRef = useRef(false);

  // 這些狀態現在改為從 events 和 user.uid 推導，但為了相容現有程式碼，
  // 我們稍後會用 useEffect 來更新它們，或者直接在 render 時計算。
  // 為了最小化改動，我們先保留狀態，但透過 useEffect 同步。
  const [myEvents, setMyEvents] = useState([]);
  const [myWaitlists, setMyWaitlists] = useState([]);
  const [myPendingApprovals, setMyPendingApprovals] = useState([]);

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
  const [hostProfiles, setHostProfiles] = useState({});
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

  const getHostDisplayName = (target) => {
    if (!target) return "主揪";
    const uid = typeof target === 'string' ? target : target.hostUid;
    const profile = uid ? hostProfiles[uid] : null;
    if (profile?.displayName) return profile.displayName;
    if (typeof target === 'object' && target !== null && target.host) {
      return target.host;
    }
    return "主揪";
  };
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

  // （人格測驗邏輯已移至 /quiz 頁面）

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

  const syncCreateFromUrl = () => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setIsCreateOpen(params.get('action') === 'create');
  };

  const openCreatePanel = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('action', 'create');
    window.history.pushState({}, '', url);
    setIsCreateOpen(true);
  };

  const closeCreatePanel = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.delete('action');
    window.history.pushState({}, '', url);
    setIsCreateOpen(false);
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
      setActiveTab('lobby'); // create tab 已移除，維持在 lobby
      openCreatePanel();
    };
    if (!requireAuth()) return;
    if (hasCommunityIdentity) {
      proceed();
    } else {
      runWithIdentity('create', proceed);
    }
  };

  // sync create panel state with url + back/forward
  useEffect(() => {
    if (typeof window === 'undefined') return;
    syncCreateFromUrl();
    window.addEventListener('popstate', syncCreateFromUrl);
    return () => window.removeEventListener('popstate', syncCreateFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // create modal 不需要自動捲動（避免打斷使用者瀏覽列表）

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
      const shouldEdit = urlParams.get('edit') === 'true';
      const shouldManage = urlParams.get('manage') === 'true';

      // 處理 tab 參數（quiz 轉導至新頁面）
      if (sharedTab === 'quiz') {
        window.location.href = `${window.location.origin}/quiz`;
        return;
      } else if (sharedEventId) {
        setFilterEventId(sharedEventId);
        setActiveTab('lobby');
        // 直接從 Firestore 載入該活動，確保分享連結可用
        getDoc(doc(db, "events", sharedEventId)).then(eventDoc => {
          if (eventDoc.exists()) {
            const eventData = { id: eventDoc.id, ...eventDoc.data() };
            setSharedEvent(eventData);
            
            // 如果需要編輯，儲存編輯標記到 sessionStorage，等待用戶登入後處理
            if (shouldEdit) {
              sessionStorage.setItem('pendingEditEventId', sharedEventId);
            }
            // 如果需要打開主揪管理（審核/名單），也延後到登入後處理
            if (shouldManage) {
              sessionStorage.setItem('pendingManageEventId', sharedEventId);
            }
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
          
          // 檢查是否有待處理的編輯請求
          const pendingEditEventId = sessionStorage.getItem('pendingEditEventId');
          if (pendingEditEventId) {
            sessionStorage.removeItem('pendingEditEventId');
            // 載入活動資料並進入編輯模式
            getDoc(doc(db, "events", pendingEditEventId)).then(eventDoc => {
              if (eventDoc.exists()) {
                const eventData = { id: eventDoc.id, ...eventDoc.data() };
                if (eventData.hostUid === currentUser.uid) {
                  if (eventData.isChainEvent) {
                    showToast("連刷舊團目前僅供檢視，無法在此編輯", "info");
                    return;
                  }
                  setFormData({
                    title: eventData.title, 
                    studio: eventData.studio, 
                    region: eventData.region || "北部", 
                    category: eventData.category || "密室逃脫", 
                    date: eventData.date, 
                    time: eventData.time,
                    price: eventData.price, 
                    priceFull: eventData.priceFull || eventData.price,
                    totalSlots: eventData.totalSlots, 
                    location: eventData.location, 
                    type: eventData.type || "恐怖驚悚",
                    website: eventData.website || "", 
                    description: eventData.description || "",
                    meetingTime: eventData.meetingTime || "15", 
                    duration: eventData.duration || "120", 
                    minPlayers: eventData.minPlayers || 4,
                    teammateNote: eventData.teammateNote || "", 
                    contactLineId: eventData.contactLineId || "", 
                    isChainEvent: false, 
                    chainSessions: [],
                    builtInPlayers: eventData.builtInPlayers || ""
                  });
                  setEditingId(eventData.id);
                  setIsEditing(true);
                  setActiveTab('lobby');
                  setCreateMode('event');
                  openCreatePanel();
                  setFilterEventId(pendingEditEventId);
                  
                  // 清除 URL 中的 edit 參數
                  const newUrl = new URL(window.location.href);
                  newUrl.searchParams.delete('edit');
                  window.history.replaceState({}, '', newUrl);
                } else {
                  showToast("您沒有權限編輯此活動", "error");
                }
              }
            }).catch(err => {
              console.error("Error loading event for edit:", err);
            });
          }

          // 檢查是否有待處理的主揪管理（開啟名單/審核視窗）
          const pendingManageEventId = sessionStorage.getItem('pendingManageEventId');
          if (pendingManageEventId) {
            sessionStorage.removeItem('pendingManageEventId');
            getDoc(doc(db, "events", pendingManageEventId)).then(eventDoc => {
              if (!eventDoc.exists()) return;
              const eventData = { id: eventDoc.id, ...eventDoc.data() };
              if (eventData.hostUid !== currentUser.uid) {
                showToast("您沒有權限管理此活動", "error");
                return;
              }
              setManagingEvent(eventData);
              setIsViewOnlyMode(false);
              setShowManageModal(true);
              setFilterEventId(pendingManageEventId);

              // 清除 URL 中的 manage 參數
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete('manage');
              window.history.replaceState({}, '', newUrl);
            }).catch(err => {
              console.error("Error loading event for manage:", err);
            });
          }
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
  const fetchEvents = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        if (isFetchingMoreRef.current) return;
        isFetchingMoreRef.current = true;
        setLoadingMore(true);
      }

      const todayStr = formatDate(new Date());
      let q;

      const cursor = isLoadMore ? lastVisibleRef.current : null;
      if (isLoadMore && cursor) {
        q = query(
          collection(db, "events"),
          where("date", ">=", todayStr),
          orderBy("date", "asc"),
          orderBy("time", "asc"),
          startAfter(cursor),
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
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      if (lastDoc) {
        setLastVisible(lastDoc);
        lastVisibleRef.current = lastDoc; // 立刻同步，避免連續觸發造成重複頁面
      } else if (isLoadMore) {
        // load more 時若沒有新資料，直接停止
        setHasMore(false);
      }
      setHasMore(querySnapshot.docs.length === EVENTS_PER_PAGE);

      if (isLoadMore) {
        setEvents(prev => {
          // 防止重複 id（解決 React duplicate key 警告）
          const map = new Map(prev.map(e => [e.id, e]));
          newEvents.forEach(e => {
            map.set(e.id, e);
          });
          return Array.from(map.values());
        });
      } else {
        setEvents(() => {
          const map = new Map();
          newEvents.forEach(e => map.set(e.id, e));
          return Array.from(map.values());
        });
        // reset cursor ref for fresh query
        lastVisibleRef.current = lastDoc;
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      showToast("載入活動失敗", "error");
    } finally {
      if (isLoadMore) isFetchingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [EVENTS_PER_PAGE]);

  // Infinite scroll (RWD 友善)：接近底部自動載入更多
  useEffect(() => {
    if (!hasMore) return;
    if (loadingMore) return;
    if (filterEventId) return; // 分享單一活動時不自動載入
    const el = loadMoreSentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          fetchEvents(true);
        }
      },
      { root: null, rootMargin: '600px 0px', threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, filterEventId, fetchEvents]);

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
    if (!events.length) return;
    const uniqueHostUids = Array.from(new Set(events.map(ev => ev.hostUid).filter(Boolean)));
    const missing = uniqueHostUids.filter(uid => !hostProfiles[uid]);
    if (missing.length === 0) return;

    let isCancelled = false;
    const fetchHostProfiles = async () => {
      const updates = {};
      await Promise.all(missing.map(async (uid) => {
        try {
          const snap = await getDoc(doc(db, "users", uid));
          if (snap.exists()) {
            const data = snap.data();
            updates[uid] = {
              displayName: data.communityNickname || data.displayName || "主揪",
              communityNickname: data.communityNickname || "",
              googleDisplayName: data.displayName || "",
              photoURL: data.photoURL || null
            };
          } else {
            updates[uid] = {
              displayName: "主揪",
              communityNickname: "",
              googleDisplayName: "",
              photoURL: null
            };
          }
        } catch (error) {
          console.error("Error fetching host profile:", error);
        }
      }));
      if (!isCancelled && Object.keys(updates).length > 0) {
        setHostProfiles(prev => ({ ...prev, ...updates }));
      }
    };

    fetchHostProfiles();
    return () => { isCancelled = true; };
  }, [events, hostProfiles]);

  useEffect(() => {
    if (!filterHostUid) {
      setFilterHostName("");
      return;
    }
    const profileName = hostProfiles[filterHostUid]?.displayName;
    if (profileName) {
      setFilterHostName(profileName);
      return;
    }
    const hostEvent = events.find(ev => ev.hostUid === filterHostUid);
    if (hostEvent) {
      setFilterHostName(hostEvent.host || "");
    }
  }, [filterHostUid, events, hostProfiles]);

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
      const pending = [];
      events.forEach(ev => {
        const isParticipant = ev.participants && ev.participants.includes(user.uid);
        const hasGuestRecord = ev.guests?.some(g => g.addedByUid === user.uid);
        const pendingApprovals = Array.isArray(ev.pendingApprovals) ? ev.pendingApprovals : [];
        const isPending = pendingApprovals.some(req => req.uid === user.uid);
        if (isParticipant || hasGuestRecord) {
          joined.push(ev.id);
        }
        if (ev.waitlist && ev.waitlist.includes(user.uid)) {
          waiting.push(ev.id);
        }
        if (isPending) {
          pending.push(ev.id);
        }
      });
      setMyEvents(joined);
      setMyWaitlists(waiting);
      setMyPendingApprovals(pending);
    } else {
      setMyEvents([]);
      setMyWaitlists([]);
      setMyPendingApprovals([]);
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
      setMyPendingApprovals([]);
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
          name: hostProfiles[ev.hostUid]?.displayName || ev.host || "主揪",
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
  }, [events, hostProfiles]);

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
    const url = `${window.location.origin}/lobby?eventId=${eventId}`;

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
    const [pendingList, setPendingList] = useState([]);
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

          const normalizeUserDoc = (snap) => {
            if (!snap.exists()) return { uid: snap.id, displayName: '未知使用者' };
            const data = snap.data();
            const preferredName = data.communityNickname || data.displayName || "未命名玩家";
            return {
              ...data,
              uid: snap.id,
              googleDisplayName: data.displayName || "",
              displayName: preferredName
            };
          };

          setParticipants(pSnaps.map(normalizeUserDoc));
          setWaitlist(wSnaps.map(normalizeUserDoc));
          setGuestList(latestEvent.guests || managingEvent.guests || []);
          setPendingList(latestEvent.pendingApprovals || managingEvent.pendingApprovals || []);
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
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-bg-primary w-full max-w-sm rounded-[2.5rem] p-8 border border-white/40 shadow-premium relative flex flex-col max-h-[85vh] overflow-hidden glass-edge">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent-orange to-accent-orange-hover opacity-80" />

          <button
            onClick={() => { setShowManageModal(false); setManagingEvent(null); }}
            className="absolute top-5 right-5 p-2 text-text-secondary hover:text-text-primary bg-bg-secondary/50 rounded-full transition-all hover:scale-110 active:scale-90"
          >
            <X size={20} className="stroke-[2.5]" />
          </button>

          <h3 className="text-2xl font-black font-outfit text-text-primary mb-1.5 tracking-tight">
            {isHost ? '管理成員' : '參與成員'}
          </h3>
          <p className="text-text-secondary text-sm font-medium leading-relaxed mb-6">
            {isHost ? '處理審核與名單異動。' : '查看這場揪團的小夥伴。'}
          </p>

          {managingEvent.pendingFlake && !isViewOnlyMode && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-pulse">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-black font-outfit text-red-500 uppercase tracking-tight">跳車檢舉進行中</p>
                  <p className="text-[11px] font-bold text-text-secondary mt-1 leading-relaxed">
                    已回報 <strong>{managingEvent.pendingFlake.targetName}</strong> 未出席。
                    等待其他團員附議...
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-y-auto custom-scrollbar space-y-8 pr-1 flex-1">
            {/* 正式成員 */}
            <div>
              <div className="text-[10px] font-black font-outfit uppercase tracking-widest text-accent-orange mb-4 flex items-center gap-2">
                <Users size={14} className="stroke-[2.5]" />
                正式成員 · {participants.length}
              </div>
              <div className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-6 opacity-40">
                    <Hourglass size={20} className="animate-spin" />
                  </div>
                ) : participants.length === 0 ? (
                  <p className="text-xs font-bold text-text-secondary text-center py-4 opacity-40">暫無正式成員</p>
                ) : (
                  participants.map(p => (
                    <div key={p.uid} className="flex flex-col bg-white border border-accent-beige/10 p-4 rounded-2xl shadow-sm gap-4 transition-all hover:shadow-md">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center overflow-hidden border border-accent-beige/20 shadow-inner">
                            {p.photoURL ? <img src={p.photoURL} alt="" className="w-full h-full object-cover" /> : <User size={20} className="text-text-secondary" />}
                          </div>
                          <div>
                            <div className="text-sm font-black font-outfit text-text-primary tracking-tight">
                              {p.displayName} {p.uid === managingEvent.hostUid && <span className="text-accent-orange ml-1 text-[10px] border border-accent-orange/20 px-1.5 py-0.5 rounded-full">主揪</span>}
                            </div>
                            {p.flakeCount > 0 && (
                              <div className="flex items-center text-[10px] font-black font-outfit text-red-500/70 gap-1 mt-0.5">
                                <LogOut size={10} className="stroke-[2.5]" /> 歷史跳車 {p.flakeCount} 次
                              </div>
                            )}
                          </div>
                        </div>
                        {isHost && p.uid !== managingEvent.hostUid && (
                          <button
                            onClick={() => handleKick(managingEvent, p.uid, 'participant')}
                            className="p-2 text-text-secondary hover:text-red-500 bg-bg-secondary/50 hover:bg-red-500/10 rounded-xl transition-all"
                            title="移除成員"
                          >
                            <Trash2 size={16} className="stroke-[2.5]" />
                          </button>
                        )}
                      </div>

                      {isHost && p.uid !== managingEvent.hostUid && !managingEvent.pendingFlake && (
                        <button
                          onClick={() => handleReportFlake(managingEvent, p.uid, p.displayName)}
                          className="w-full py-2.5 rounded-xl bg-red-500/5 text-red-500 text-[11px] font-black font-outfit uppercase tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        >
                          回報未出席 (跳車)
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 審核中 */}
            {pendingList.length > 0 && (
              <div className="animate-in slide-in-from-bottom-2 duration-400">
                <div className="text-[10px] font-black font-outfit uppercase tracking-widest text-[#7A7A7A] mb-4 flex items-center gap-2">
                  <Hourglass size={14} className="stroke-[2.5]" />
                  等待審核 · {pendingList.length}
                </div>
                <div className="space-y-3">
                  {pendingList.map(req => {
                    const requestedDate = (() => {
                      if (!req.requestedAt) return null;
                      if (typeof req.requestedAt === 'number') return new Date(req.requestedAt);
                      if (req.requestedAt?.seconds) return new Date(req.requestedAt.seconds * 1000);
                      return null;
                    })();
                    const timeLabel = requestedDate ? requestedDate.toLocaleString('zh-TW', { hour12: false }) : '';
                    const guestNames = (req.guestNames || []).filter(Boolean);
                    const needSelfApproval = !!req.includeSelf && !(managingEvent.participants || []).includes(req.uid);
                    return (
                      <div key={req.requestId || req.uid} className="flex flex-col bg-bg-secondary/30 p-4 rounded-2xl border border-accent-beige/10 gap-3 border-dashed">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm font-black font-outfit text-text-primary tracking-tight">
                              {req.communityNickname || req.displayName || '匿名玩家'}
                            </div>
                            {!!req.displayName && req.communityNickname && req.displayName !== req.communityNickname && (
                              <div className="text-[10px] font-bold text-text-secondary mt-0.5 opacity-60">Google：{req.displayName}</div>
                            )}
                            {timeLabel && <div className="text-[10px] font-bold text-text-secondary mt-1">{timeLabel}</div>}

                            {needSelfApproval && (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-accent-orange/10 text-accent-orange text-[10px] font-black font-outfit rounded-full mt-2 border border-accent-orange/20">
                                <User size={10} className="stroke-[2.5]" /> 本人申請
                              </div>
                            )}

                            {guestNames.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {guestNames.map((g, gi) => (
                                  <span key={gi} className="px-2 py-1 bg-bg-primary border border-accent-beige/20 rounded-lg text-[10px] font-bold text-text-secondary shadow-sm">
                                    攜伴：{g}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {!isHost && req.uid === user?.uid && (
                            <div className="px-2.5 py-1 bg-white/50 border border-accent-beige/20 rounded-full text-[10px] font-black font-outfit text-text-secondary uppercase tracking-wider">
                              審核中
                            </div>
                          )}
                        </div>

                        {req.uid === user?.uid && (
                          <button
                            onClick={() => handleWithdrawPendingRequest(managingEvent.id)}
                            className="w-full py-2 text-[10px] font-black font-outfit uppercase tracking-widest text-text-secondary hover:text-red-500 transition-colors"
                          >
                            取消這筆申請
                          </button>
                        )}

                        {isHost && (
                          <div className="grid grid-cols-2 gap-3 mt-1">
                            <button
                              onClick={() => handleRejectPendingRequest(managingEvent.id, req.requestId)}
                              className="py-2.5 rounded-xl bg-white text-text-secondary border border-accent-beige/30 hover:bg-red-50 duration-200 text-[11px] font-black font-outfit uppercase tracking-widest"
                            >
                              拒絕
                            </button>
                            <button
                              onClick={() => handleApprovePendingRequest(managingEvent.id, req.requestId)}
                              className="py-2.5 rounded-xl bg-accent-orange text-white shadow-premium hover:bg-accent-orange-hover duration-200 text-[11px] font-black font-outfit uppercase tracking-widest"
                            >
                              同意
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 攜伴名單 */}
            <div>
              <div className="text-[10px] font-black font-outfit uppercase tracking-widest text-[#7A7A7A] mb-4 flex items-center gap-2">
                <UserPlus size={14} className="stroke-[2.5]" />
                攜伴名單 · {guestList.length}
              </div>
              {guestList.length === 0 ? (
                <div className="text-center py-6 opacity-30">
                  <Ghost size={32} className="mx-auto mb-2" />
                  <p className="text-[11px] font-bold text-text-secondary">暫無攜伴紀錄</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {guestList.map((guest, idx) => (
                    <div key={`${guest.id || guest.name || 'guest'}-${idx}`} className="bg-bg-secondary/20 p-4 rounded-2xl border border-accent-beige/10 flex items-center justify-between gap-4 shadow-sm">
                      <div>
                        <div className="text-sm font-black font-outfit text-text-primary tracking-tight">{guest.name || `朋友 ${idx + 1}`}</div>
                        <div className="text-[10px] font-bold text-text-secondary mt-0.5">由 <span className="text-accent-orange">{guest.addedByName || '團員'}</span> 代報</div>
                        <div className="inline-block px-2 py-0.5 bg-white/50 border border-accent-beige/20 rounded-md text-[9px] font-black font-outfit uppercase text-text-secondary tracking-widest mt-2">{getGuestSessionLabel(guest)}</div>
                      </div>
                      {isHost && (
                        <button
                          onClick={() => handleRemoveGuestEntry(guest)}
                          className="p-2 text-text-secondary hover:text-red-500 bg-white/50 hover:bg-red-500/10 rounded-xl transition-all shadow-sm"
                          title="移除攜伴"
                        >
                          <Trash2 size={16} className="stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 候補名單 */}
            <div>
              <div className="text-[10px] font-black font-outfit uppercase tracking-widest text-[#7A7A7A] mb-4 flex items-center gap-2">
                <Hourglass size={14} className="stroke-[2.5]" />
                候補名單 · {waitlist.length}
              </div>
              <div className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-6 opacity-40">
                    <Hourglass size={20} className="animate-spin" />
                  </div>
                ) : waitlist.length === 0 ? (
                  <p className="text-xs font-bold text-text-secondary text-center py-4 opacity-40">暫無候補成員</p>
                ) : (
                  waitlist.map(p => (
                    <div key={p.uid} className="flex justify-between items-center bg-white border border-accent-beige/10 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center overflow-hidden border border-accent-beige/20 shadow-inner">
                          {p.photoURL ? <img src={p.photoURL} alt="" className="w-full h-full object-cover" /> : <User size={20} className="text-text-secondary" />}
                        </div>
                        <div>
                          <div className="text-sm font-black font-outfit text-text-primary tracking-tight">{p.displayName}</div>
                          {p.flakeCount > 0 && (
                            <div className="flex items-center text-[10px] font-black font-outfit text-red-500/70 gap-1 mt-0.5">
                              <LogOut size={10} className="stroke-[2.5]" /> {p.flakeCount} 次跳車
                            </div>
                          )}
                        </div>
                      </div>
                      {isHost && (
                        <button
                          onClick={() => handleKick(managingEvent, p.uid, 'waitlist')}
                          className="p-2 text-text-secondary hover:text-red-500 bg-bg-secondary/50 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <Trash2 size={16} className="stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SponsorModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 border border-[#EBE3D7] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#FF8C00] to-[#FFA500]" />

        <button onClick={() => setShowSponsorModal(false)} className="absolute top-4 right-4 p-2 text-[#7A7A7A] hover:text-[#212121] bg-[#EBE3D7]/50 rounded-full transition-colors">
          <X size={18} />
        </button>

        <div className="text-center mt-2">
          <div className="w-16 h-16 bg-[#FF8C00]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#FF8C00]/30">
            <Coffee size={32} className="text-[#FF8C00]" />
          </div>
          <h3 className="text-xl font-bold text-[#212121] mb-2">贊助小迷糊</h3>
          <p className="text-[#7A7A7A] text-sm mb-6">您的支持是我們持續開發的動力！</p>

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
              className="flex-1 py-3 rounded-xl bg-[#EBE3D7] text-[#212121] font-bold text-sm border border-[#D1C7BB] hover:bg-[#D1C7BB] transition-all flex items-center justify-center gap-2"
            >
              <Download size={16} />
              下載 QR Code
            </button>
            <button
              onClick={() => setShowSponsorModal(false)}
              className="flex-1 py-3 rounded-xl bg-[#FF8C00] text-[#212121] font-bold text-sm shadow-lg shadow-[#FF8C00]/20 hover:bg-[#FFA500] active:scale-95 transition-all"
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
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 border border-[#EBE3D7] shadow-2xl relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#FF8C00] to-[#FFA500]" />

        <button onClick={() => setShowImageModal(false)} className="absolute top-4 right-4 p-2 text-[#7A7A7A] hover:text-[#212121] bg-[#EBE3D7]/50 rounded-full transition-colors z-10">
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

    const getEventCounts = (d) => {
      if (!d) return { openCount: 0, fullCount: 0 };
      const dateStr = formatDate(d);
      // 日曆同時顯示：可報名(橘) / 已滿團(紅)
      let openCount = 0;
      let fullCount = 0;
      events.forEach((e) => {
        if (e.date !== dateStr) return;
        const remaining = getRemainingSlots(e);
        if (remaining > 0) openCount += 1;
        else fullCount += 1;
      });
      return { openCount, fullCount };
    };

    const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    const selectedDateEvents = selectedDate
      ? events.filter(e => {
        if (e.date !== formatDate(selectedDate)) return false;
        const remaining = getRemainingSlots(e);
        return remaining > 0; // 只顯示還有名額的活動
      })
      : [];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-lg rounded-2xl border border-[#EBE3D7] shadow-2xl flex flex-col max-h-[90vh]">
          <div className="p-4 border-b border-[#EBE3D7] flex justify-between items-center bg-white/50 rounded-t-2xl">
            <h3 className="text-xl font-bold text-[#212121] flex items-center gap-2">
              <Calendar size={20} className="text-[#FF8C00]" />
              揪團日曆
            </h3>
            <button onClick={() => setShowCalendar(false)} className="p-2 hover:bg-[#EBE3D7] rounded-full text-[#7A7A7A] hover:text-[#212121] transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto p-4 custom-scrollbar">
            <div className="flex justify-between items-center mb-4">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-[#EBE3D7] rounded-lg text-[#7A7A7A]"><ChevronLeft /></button>
              <span className="text-lg font-bold text-[#212121]">
                {year} 年 {month + 1} 月
              </span>
              <button onClick={handleNextMonth} className="p-2 hover:bg-[#EBE3D7] rounded-lg text-[#7A7A7A]"><ChevronRight /></button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-6">
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <div key={d} className="text-center text-[#7A7A7A] text-sm py-2 font-medium">{d}</div>
              ))}
              {days.map((d, idx) => {
                if (!d) return <div key={`empty-${idx}`} className="aspect-square"></div>;

                const { openCount, fullCount } = getEventCounts(d);
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
                        ? 'bg-[#EBE3D7]/20 text-[#7A7A7A] cursor-not-allowed'
                        : isSelected
                          ? 'bg-[#544B40] text-white shadow-lg'
                          : 'bg-white hover:bg-[#EBE3D7] text-[#212121] border border-[#EBE3D7]'}
                                        ${isToday ? 'ring-2 ring-[#FF8C00]/50' : ''}
                                    `}
                  >
                    <span className={`text-sm ${isSelected ? 'font-bold' : ''}`}>{d.getDate()}</span>
                    {!isPast && (openCount > 0 || fullCount > 0) && (
                      <div className="mt-1 flex items-center gap-1">
                        {openCount > 0 && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-[#FF8C00]/20 text-[#FF8C00]'
                            }`}
                            title="可報名場次"
                          >
                            {openCount}
                          </span>
                        )}
                        {fullCount > 0 && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-[#E74C3C]/10 text-[#E74C3C]'
                            }`}
                            title="已滿團場次"
                          >
                            {fullCount}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h4 className="text-[#7A7A7A] text-sm font-medium mb-2 border-b border-[#EBE3D7] pb-2">
                  {formatDate(selectedDate)} 的揪團 ({selectedDateEvents.length})
                </h4>
                {selectedDateEvents.length === 0 ? (
                  <p className="text-center text-[#7A7A7A] py-4">這天還沒有人開團</p>
                ) : (
                  selectedDateEvents.map(ev => (
                    <div key={ev.id} onClick={() => { setShowCalendar(false); /* 這裡可以做捲動定位 */ }} className="bg-[#EBE3D7] rounded-xl p-3 flex justify-between items-center cursor-pointer hover:bg-[#D1C7BB] transition-colors border border-[#D1C7BB]/50">
                      <div>
                        <div className="font-bold text-[#212121] text-sm">{ev.title}</div>
                        <div className="text-xs text-[#7A7A7A] flex items-center gap-2 mt-1">
                          <span>{ev.time}</span>
                          <span>•</span>
                          <span>{ev.studio}</span>
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded font-bold ${getRemainingSlots(ev) === 0 ? 'bg-[#E74C3C]/10 text-[#E74C3C]' : 'bg-[#FF8C00]/10 text-[#FF8C00]'}`}>
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

    const details = `主揪: ${getHostDisplayName(ev)}\n地點: ${ev.location}\n備註: ${ev.description || '無'}\n遊玩時長: ${durationMinutes} 分鐘`;
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
    setActiveTab('lobby');
    setCreateMode('event');
    openCreatePanel();
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

  const getEventById = (id) => {
    if (!id) return null;
    const localMatch = events.find(e => e.id === id);
    if (localMatch) return localMatch;
    if (sharedEvent && sharedEvent.id === id) return sharedEvent;
    return null;
  };

  const promptJoin = (id) => {
    if (user?.flakeCount >= 3) { showToast("帳號受限。", "error"); return; }
    const targetEvent = getEventById(id);
    if (!targetEvent) return;
    runWithIdentity('join', () => {
      const contactHint = targetEvent.contactLineId
        ? `送出申請後請到 LINE 群「${targetEvent.contactLineId}」告知主揪，等待審核通過才算報名成功。`
        : '送出申請後請到 LINE 群聯絡主揪，等待審核通過才算報名成功。';
      setConfirmModal({
        show: true,
        eventId: id,
        action: 'join',
        title: targetEvent.title,
        message: `${contactHint}\n點擊「確認參加」僅送出審核，不會直接佔用名額。`
      });
    });
  };

  const handleWithdrawPendingRequest = async (eventId) => {
    if (!user) return;
    const targetEvent = getEventById(eventId);
    if (!targetEvent) return;

    const pendingList = Array.isArray(targetEvent.pendingApprovals) ? [...targetEvent.pendingApprovals] : [];
    const updatedPending = pendingList.filter(req => req.uid !== user.uid);
    if (updatedPending.length === pendingList.length) {
      showToast("目前沒有待審核申請", "info");
      return;
    }

    try {
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, { pendingApprovals: updatedPending });
      showToast("已取消審核申請", "success");
      fetchEvents(false);
    } catch (error) {
      console.error("Withdraw pending request failed:", error);
      showToast("取消失敗，請稍後再試", "error");
    }
  };

  const handleHostApprovalAction = async (eventId, requestId, decision) => {
    if (!user) return;
    const targetEvent = getEventById(eventId);
    if (!targetEvent) return;
    if (targetEvent.hostUid !== user.uid) {
      showToast("僅主揪可操作審核", "error");
      return;
    }

    const pendingList = Array.isArray(targetEvent.pendingApprovals) ? [...targetEvent.pendingApprovals] : [];
    const targetRequest = pendingList.find(req => req.requestId === requestId);
    if (!targetRequest) {
      showToast("找不到這筆審核申請", "error");
      return;
    }
    const updatedPending = pendingList.filter(req => req.requestId !== requestId);
    const eventRef = doc(db, "events", eventId);

    try {
      if (decision === 'approve') {
        const alreadyParticipant = targetEvent.participants?.includes(targetRequest.uid);
        const includeSelf = !!targetRequest.includeSelf;
        const guestNames = Array.isArray(targetRequest.guestNames) ? targetRequest.guestNames.filter(Boolean) : [];
        const currentSlots = Number(targetEvent.currentSlots || 0);
        const totalSlots = Number(targetEvent.totalSlots || 0);
        let slotsNeeded = guestNames.length;
        const shouldAddSelf = includeSelf && !alreadyParticipant;
        if (shouldAddSelf) slotsNeeded += 1;

        if (totalSlots && currentSlots + slotsNeeded > totalSlots) {
          showToast("名額不足，請先釋出座位", "error");
          return;
        }

        let newSlots = currentSlots;
        const updatePayload = {
          pendingApprovals: updatedPending,
        };

        if (shouldAddSelf) {
          updatePayload.participants = arrayUnion(targetRequest.uid);
          newSlots += 1;
        }

        if (guestNames.length > 0) {
          const newGuests = guestNames.map(name => ({
            id: generateRandomId(),
            addedByUid: targetRequest.uid,
            addedByName: targetRequest.communityNickname || targetRequest.displayName || "團員",
            name,
            addedAt: Date.now()
          }));
          updatePayload.guests = arrayUnion(...newGuests);
          newSlots += guestNames.length;
        }

        if (slotsNeeded > 0) {
          updatePayload.currentSlots = newSlots;
          updatePayload.isFull = totalSlots ? newSlots >= totalSlots : false;
        }

        await updateDoc(eventRef, updatePayload);
        showToast("已同意加入，記得在 LINE 群回覆對方", "success");
      } else {
        await updateDoc(eventRef, { pendingApprovals: updatedPending });
        showToast("已拒絕此申請", "info");
      }
      fetchEvents(false);
    } catch (error) {
      console.error("Host approval action failed:", error);
      showToast("操作失敗，請稍後再試", "error");
    }
  };

  const handleApprovePendingRequest = (eventId, requestId) => handleHostApprovalAction(eventId, requestId, 'approve');
  const handleRejectPendingRequest = (eventId, requestId) => handleHostApprovalAction(eventId, requestId, 'reject');

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
    const fallbackName = name || hostStats[uid]?.name || "";
    setViewingHostName(getHostDisplayName({ hostUid: uid, host: fallbackName }));
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
      const eventRef = doc(db, "events", guestEventId);
      const eventSnap = await getDoc(eventRef);
      if (!eventSnap.exists()) {
        showToast("活動不存在或已被刪除", "error");
        return;
      }
      const eventData = eventSnap.data();
      const pendingList = Array.isArray(eventData.pendingApprovals) ? [...eventData.pendingApprovals] : [];
      const timestamp = Date.now();
      const requestIndex = pendingList.findIndex(req => req.uid === user.uid);

      if (requestIndex >= 0) {
        const existing = pendingList[requestIndex];
        const mergedGuests = Array.from(new Set([...(existing.guestNames || []), ...validGuests]));
        pendingList[requestIndex] = {
          ...existing,
          guestNames: mergedGuests,
          requestedAt: timestamp,
          includeSelf: existing.includeSelf || false
        };
      } else {
        pendingList.push({
          requestId: generateRandomId(),
          uid: user.uid,
          displayName: user.displayName || "團員",
          communityNickname: user.communityNickname || "",
          requestedAt: timestamp,
          includeSelf: false,
          guestNames: validGuests
        });
      }

      await updateDoc(eventRef, { pendingApprovals: pendingList });
      showToast(`攜伴申請已送出！請在 LINE 群通知主揪審核。`, "info", 5000);
      closeGuestModal();
      fetchEvents(false);
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
      const event = getEventById(eventId);
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
      const targetEvent = getEventById(eventId);
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
          const pendingList = Array.isArray(targetEvent.pendingApprovals) ? [...targetEvent.pendingApprovals] : [];
          const alreadyPending = pendingList.some(req => req.uid === user.uid);
          const alreadyJoined = targetEvent.participants?.includes(user.uid);
          if (alreadyJoined) {
            showToast("你已在名單中，無需重複申請", "info");
            setConfirmModal({ show: false, eventId: null, action: null });
            return;
          }
          if (alreadyPending) {
            showToast("已送出申請，請到 LINE 群提醒主揪審核", "info");
          } else {
            const requestPayload = {
              requestId: generateRandomId(),
              uid: user.uid,
              displayName: user.displayName || "匿名玩家",
              communityNickname: user.communityNickname || "",
              requestedAt: Date.now(),
              includeSelf: true,
              guestNames: []
            };
            pendingList.push(requestPayload);
            await updateDoc(eventRef, {
              pendingApprovals: pendingList
            });
            showToast("已送出 +1 申請！請到 LINE 群聯絡主揪等候審核。", "info", 5000);
          }
          fetchEvents(false);
        }
      } catch (error) {
        console.error("Error joining event: ", error);
        showToast("加入失敗: " + error.message, "error");
      }
    } else if (action === 'cancel') {
      const isWaitlisted = myWaitlists.includes(eventId);
      const targetEvent = getEventById(eventId);

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
            pendingApprovals: [],
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

  // 導覽統一由 AppLayout 右上角漢堡選單處理（已移除手機 BottomNav）

  if (inWebView) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-white p-8 rounded-2xl border border-[#EBE3D7] shadow-2xl max-w-md w-full">
          <div className="w-16 h-16 bg-[#FFE4B5]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} className="text-[#FF8C00]" />
          </div>
          <h1 className="text-2xl font-bold text-[#212121] mb-4">請使用瀏覽器開啟</h1>
          <p className="text-[#7A7A7A] mb-6 leading-relaxed">
            Google 安全政策限制在 App 內嵌瀏覽器（如 LINE, Facebook）中進行登入。
          </p>
          <div className="bg-[#EBE3D7]/50 rounded-xl p-4 text-sm text-[#7A7A7A] text-left mb-6">
            <p className="font-medium text-[#212121] mb-2">操作步驟：</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>點擊右上角的選單圖示 <span className="inline-block bg-[#D1C7BB] px-1.5 rounded">...</span></li>
              <li>選擇「在瀏覽器開啟」或「Open in Chrome/Safari」</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#212121] font-sans">

      {showCalendar && <CalendarModal />}

      {showSponsorModal && <SponsorModal />}

      {showImageModal && <ImageModal />}

      {showManageModal && <ManageParticipantsModal />}

      {/* FAB: 開團（手機/桌機皆顯示；手機 icon-only、桌機含文字） */}
      <button
        type="button"
        onClick={() => {
          if (isCreateOpen) {
            closeCreatePanel();
            return;
          }
          openCreateTab();
        }}
        className="fixed right-4 md:right-6 bottom-[calc(env(safe-area-inset-bottom)+1rem)] md:bottom-6 z-40 flex items-center justify-center md:justify-start gap-0 md:gap-3 w-14 h-14 md:w-auto md:h-auto md:px-5 md:py-4 rounded-full bg-accent-orange text-white font-black shadow-premium hover:shadow-[0_20px_40px_-15px_oklch(0%_0_0_/_0.18)] hover:-translate-y-0.5 active:scale-95 transition-all"
        aria-label={isCreateOpen ? '關閉開團' : '開團'}
      >
        {isCreateOpen ? <X size={22} className="stroke-[2.5]" /> : <Plus size={22} className="stroke-[2.5]" />}
        <span className="hidden md:inline font-outfit uppercase tracking-wider text-sm">{isCreateOpen ? '關閉' : '開團'}</span>
      </button>

      {showIdentityModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[#EBE3D7] shadow-2xl relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF8C00] via-[#FFA500] to-[#FF8C00]" />
            <button
              onClick={handleIdentityModalClose}
              className="absolute top-3 right-3 text-[#7A7A7A] hover:text-[#212121] transition-colors"
            >
              <X size={20} />
            </button>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs text-[#FF8C00] font-semibold mb-1">最後一步</p>
                <h3 className="text-xl font-bold text-[#212121]">確認社群身份</h3>
                <p className="text-sm text-[#7A7A7A] mt-1">
                  {identityIntent === 'join'
                    ? '為了讓主揪聯繫到你，我們需要確認你在社群中的資訊。'
                    : '發起揪團前，請先確認你在社群中的可聯絡資訊。'}
                </p>
              </div>

              {identityStep === 'question' && (
                <div className="space-y-4">
                  <p className="text-[#212121] font-semibold text-lg">你是否已經加入小迷糊的社群？</p>
                  <div className="space-y-3">
                    <button
                      onClick={handleIdentityAnswerYes}
                      className="w-full py-3 rounded-xl bg-[#FF8C00] text-[#212121] font-bold hover:bg-[#FFA500] transition-colors"
                    >
                      我已在社群內
                    </button>
                    <button
                      onClick={handleIdentityAnswerNo}
                      className="w-full py-3 rounded-xl border border-[#D1C7BB] text-[#7A7A7A] hover:border-[#FF8C00] hover:text-[#212121] transition-colors"
                    >
                      尚未加入，前往加入社群
                    </button>
                  </div>
                  <p className="text-xs text-[#7A7A7A]">
                    將在新分頁開啟社群邀請連結，加入後請返回此視窗繼續操作。
                  </p>
                </div>
              )}

              {identityStep === 'group' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-[#7A7A7A] font-medium">你在社群內的暱稱</label>
                    <input
                      type="text"
                      value={identityFormGroup}
                      onChange={(e) => setIdentityFormGroup(e.target.value)}
                      className="w-full bg-[#EBE3D7] border border-[#D1C7BB] rounded-xl px-4 py-3 text-[#212121] placeholder:text-[#7A7A7A] focus:border-emerald-500 outline-none"
                      placeholder="請輸入社群暱稱"
                    />
                    <p className="text-xs text-amber-300 flex items-center gap-1">
                      ⚠️ 此暱稱是主揪辨識你的依據，填錯可能會被移除。
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIdentityStep('question')}
                      className="flex-1 py-3 rounded-xl border border-[#D1C7BB] text-[#7A7A7A] hover:text-[#212121]"
                    >
                      上一步
                    </button>
                    <button
                      onClick={handleIdentityGroupConfirm}
                      className="flex-1 py-3 rounded-xl bg-[#FF8C00] text-[#212121] font-bold hover:bg-[#FFA500]"
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

      {/* Header is handled by AppLayout */}
      <main className="max-w-md md:max-w-4xl lg:max-w-6xl mx-auto p-3 sm:p-4 md:p-6">

        {/* Toggle View Mode (Lobby / Wishes) */}
        <div className="flex bg-bg-secondary/50 p-1 rounded-2xl mb-6 border border-accent-beige/20 shadow-inner backdrop-blur-md">
          <button
            onClick={() => setActiveTab('lobby')}
            className={`flex-1 py-3 rounded-xl text-sm font-black font-outfit uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'lobby' ? 'bg-accent-orange text-text-primary shadow-premium scale-[1.02]' : 'bg-transparent text-text-secondary hover:text-text-primary'}`}
          >
            <Search size={18} className={activeTab === 'lobby' ? 'stroke-[2.5]' : ''} />
            列表
          </button>
          <button
            onClick={() => setActiveTab('wishes')}
            className={`flex-1 py-3 rounded-xl text-sm font-black font-outfit uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'wishes' ? 'bg-accent-orange text-text-primary shadow-premium scale-[1.02]' : 'bg-transparent text-text-secondary hover:text-text-primary'}`}
          >
            <Sparkles size={18} className={activeTab === 'wishes' ? 'stroke-[2.5]' : ''} />
            許願池
          </button>
        </div>

        {activeTab === 'lobby' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Filter Section */}
            <div className="bg-white p-4 md:p-6 rounded-3xl border border-[#EBE3D7] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF8C00]/5 rounded-full blur-3xl -z-10"></div>

              {/* 如果是分享連結模式，顯示返回所有活動的按鈕 */}
              {filterEventId && (
                <div className="mb-6 p-5 bg-accent-orange/10 border border-accent-orange/20 rounded-2xl flex items-center justify-between glass-edge animate-in fade-in slide-in-from-top-4">
                  <div className="flex items-center text-accent-orange font-black font-outfit tracking-tight">
                    <Sparkles size={20} className="mr-3 animate-pulse" />
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
                    className="btn-primary px-5 py-2 text-sm shadow-premium"
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
                    className="block bg-accent-orange rounded-2xl p-5 text-text-primary shadow-premium flex items-center justify-between group hover:brightness-105 active:scale-[0.98] transition-all relative overflow-hidden mb-6"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-12 -mt-12 group-hover:scale-120 transition-transform duration-700"></div>

                    <div className="flex items-center gap-4 relative z-10">
                      <div className="bg-white/30 p-1.5 rounded-full backdrop-blur-md border border-white/40 shadow-xl">
                        <img
                          src="/logo.png"
                          alt="小迷糊 Logo"
                          className="w-14 h-14 rounded-full object-cover shadow-inner"
                        />
                      </div>
                      <div>
                        <div className="font-black font-outfit text-base md:text-lg text-text-primary tracking-tight">加入小迷糊密室社群</div>
                        <div className="text-xs font-bold text-text-primary/70 mt-0.5 uppercase tracking-wider">找隊友、聊密室、看評論 👉</div>
                      </div>
                    </div>
                    <ExternalLink size={20} className="text-text-primary group-hover:translate-x-1 transition-transform relative z-10 stroke-[2.5]" />
                  </a>

                  {/* 進階篩選器區塊 */}
                  <div className="space-y-4 bg-bg-secondary/30 p-5 rounded-3xl border border-accent-beige/20 backdrop-blur-sm">

                    {/* 第一排：篩選選單 (響應式 Grid) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full bg-bg-primary/50 text-text-primary text-xs font-bold px-4 py-2.5 rounded-xl border border-accent-beige/20 outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange/20 appearance-none transition-all cursor-pointer"
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
                        className="w-full bg-[#EBE3D7] text-[#212121] text-xs px-3 py-2 rounded-xl border border-[#D1C7BB] outline-none focus:border-emerald-500 appearance-none"
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
                        className="w-full bg-[#EBE3D7] text-[#212121] text-xs px-3 py-2 rounded-xl border border-[#D1C7BB] outline-none focus:border-emerald-500 appearance-none"
                      >
                        <option value="All">全部工作室</option>
                        {availableStudios.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                      </select>

                      <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="w-full bg-[#EBE3D7] text-[#212121] text-xs px-3 py-2 rounded-xl border border-[#D1C7BB] outline-none focus:border-emerald-500 appearance-none"
                      >
                        <option value="All">全部月份</option>
                        {availableMonths.filter(m => m !== 'All').map(m => <option key={m} value={m}>{m}月</option>)}
                      </select>

                      <select
                        value={filterPrice}
                        onChange={(e) => setFilterPrice(e.target.value)}
                        className="w-full bg-[#EBE3D7] text-[#212121] text-xs px-3 py-2 rounded-xl border border-[#D1C7BB] outline-none focus:border-emerald-500 appearance-none"
                      >
                        <option value="All">全部費用</option>
                        <option value="under500">$500以下</option>
                        <option value="500-1000">$500 - $1000</option>
                        <option value="above1000">$1000以上</option>
                      </select>

                      <select
                        value={filterSlots}
                        onChange={(e) => setFilterSlots(e.target.value)}
                        className="w-full bg-[#EBE3D7] text-[#212121] text-xs px-3 py-2 rounded-xl border border-[#D1C7BB] outline-none focus:border-emerald-500 appearance-none"
                      >
                        <option value="All">所有狀態</option>
                        <option value="available">尚有名額</option>
                        <option value="full">已額滿</option>
                        <option value="1">缺 1 人</option>
                        <option value="2">缺 2 人</option>
                        <option value="3+">缺 3 人以上</option>
                      </select>
                    </div>

                    {/* 第二排：日期標籤與搜尋 (響應式 Flex) */}
                    <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-2 md:gap-3">
                      {['All', 'Today', 'Tomorrow', 'Weekend'].map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setFilterDateType(type);
                            setSelectedDateFilter(null); // 清除特定日期篩選
                          }}
                          className={`flex-1 min-w-[70px] px-3 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors text-center
                    ${filterDateType === type
                              ? 'bg-[#544B40] text-white shadow-lg'
                              : 'bg-white text-[#212121] hover:bg-[#EBE3D7] border border-[#EBE3D7]'}`}
                        >
                          {type === 'All' ? '不限' : type === 'Today' ? '今天' : type === 'Tomorrow' ? '明天' : '週末'}
                        </button>
                      ))}

                      <button
                        onClick={() => setShowCalendar(true)}
                        className="shrink-0 px-4 py-2.5 bg-[#EBE3D7] text-[#FF8C00] rounded-xl border border-[#D1C7BB] hover:bg-[#D1C7BB] active:scale-95 transition-all flex items-center justify-center gap-1.5 min-w-[80px]"
                        aria-label="打開日曆"
                      >
                        <CalendarDays size={16} />
                        <span className="text-xs font-medium">日曆</span>
                      </button>

                      <div className="relative w-full md:flex-1 mt-1 md:mt-0">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="搜尋活動、工作室、介紹..."
                          className="w-full bg-bg-primary text-text-primary text-sm font-medium px-4 py-3 pl-10 rounded-xl border border-accent-beige/20 outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange/20 transition-all placeholder:text-text-secondary placeholder:font-normal shadow-inner"
                        />
                        <Search size={18} className="absolute left-3.5 top-3.5 text-text-secondary" />
                      </div>
                    </div>
                  </div>
                </>
              )}
              {/* End of conditional rendering for filter section */}
            </div>
            {/* End of Filter Section div */}

            {/* 活動列表 - 響應式 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-10">
              {filterHostUid && (
                <div className="col-span-full bg-bg-secondary/30 border border-accent-beige/20 rounded-3xl p-6 mb-4 flex flex-col gap-6 backdrop-blur-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-black font-outfit uppercase tracking-widest text-text-secondary mb-1">正在檢視的主揪</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-black font-outfit text-text-primary tracking-tight">{filterHostName || hostStats[filterHostUid]?.name || '主揪'}</span>
                        <span className="text-xs font-black px-2.5 py-1 rounded-full bg-accent-orange/15 text-accent-orange border border-accent-orange/20 font-outfit uppercase tracking-wider">
                          Lv.{Math.max(1, hostStats[filterHostUid]?.count || 1)}
                        </span>
                      </div>
                    </div>
                    <button onClick={clearHostFilter} className="text-sm font-bold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors">
                      <ArrowLeft size={16} />
                      返回所有活動
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-bg-primary/50 rounded-2xl p-4 border border-accent-beige/10 shadow-inner">
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">歷史開團</p>
                      <p className="text-xl font-black font-outfit text-text-primary">{hostStats[filterHostUid]?.count || 0}</p>
                    </div>
                    <div className="bg-bg-primary/50 rounded-2xl p-4 border border-accent-beige/10 shadow-inner">
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">進行中</p>
                      <p className="text-xl font-black font-outfit text-accent-orange">{hostStats[filterHostUid]?.active || 0}</p>
                    </div>
                    <div className="bg-bg-primary/50 rounded-2xl p-4 border border-accent-beige/10 shadow-inner">
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">缺人場次</p>
                      <p className="text-xl font-black font-outfit text-accent-orange-hover">{hostStats[filterHostUid]?.missing || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {getFilteredEvents().length === 0 ? (
                <div className="col-span-full text-center py-20 text-text-secondary bg-bg-secondary/20 rounded-3xl border border-accent-beige/20 border-dashed">
                  <Ghost size={48} className="mx-auto mb-4 opacity-10" />
                  <p className="text-base font-medium">目前沒有符合的揪團<br /><span className="text-sm opacity-60">快來當主揪開一團吧！</span></p>
                </div>
              ) : (
                getFilteredEvents().map((ev) => {
                  const isJoined = myEvents.includes(ev.id);
                  const isWaitlisted = myWaitlists.includes(ev.id);
                  const pendingApprovals = Array.isArray(ev.pendingApprovals) ? ev.pendingApprovals : [];
                  const isPendingApproval = pendingApprovals.some(req => req.uid === user?.uid);
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
                  const hostName = getHostDisplayName(ev);
                  const joinButtonDisabled = ev.isChainEvent ? false : (isJoined || isWaitlisted || isPendingApproval);
                  const joinButtonClass = ev.isChainEvent
                    ? 'btn-primary bg-purple-600 hover:bg-purple-500 shadow-purple-900/10'
                    : isJoined
                      ? 'bg-bg-secondary/50 text-accent-orange border border-accent-orange/20 cursor-not-allowed font-black'
                      : isPendingApproval
                        ? 'bg-bg-secondary/50 text-text-secondary border border-accent-beige/20 cursor-not-allowed font-black'
                        : isWaitlisted
                          ? 'bg-bg-secondary/50 text-accent-orange border border-accent-orange/20 cursor-not-allowed font-black'
                          : eventIsFull
                            ? 'bg-accent-orange/10 text-accent-orange hover:bg-accent-orange/20 border border-accent-orange/20 font-black'
                            : 'btn-primary';

                  return (
                    <div key={ev.id} className="card-premium h-full flex flex-col group p-6">

                      <div className="flex justify-between items-start mb-4 relative">
                        <div className="w-full">
                          {/* 標籤列 */}
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className="text-[10px] font-black bg-bg-secondary text-text-primary px-2 py-1 rounded-md border border-accent-beige/20 uppercase tracking-widest font-outfit">
                              {ev.type}
                            </span>
                            <span className="text-[10px] font-black bg-accent-orange/10 text-accent-orange px-2 py-1 rounded-md border border-accent-orange/20 uppercase tracking-widest font-outfit">
                              {ev.category}
                            </span>
                            <span className="text-[10px] font-black bg-bg-secondary text-text-primary px-2 py-1 rounded-md border border-accent-beige/20 uppercase tracking-widest font-outfit">
                              {ev.region}
                            </span>
                            {ev.isChainEvent && (
                              <span className="text-[10px] font-black bg-purple-500/10 text-purple-600 px-2 py-1 rounded-md border border-purple-500/20 flex items-center gap-1.5 animate-pulse uppercase tracking-widest font-outfit">
                                <Sparkles size={10} className="stroke-[2.5]" />
                                連刷 x{1 + (ev.chainSessions?.length || 0)}
                              </span>
                            )}
                          </div>

                          {/* 標題 */}
                          <h3 className="text-xl md:text-2xl font-black font-outfit text-text-primary mb-2.5 leading-tight tracking-tight block group-hover:text-accent-orange transition-colors">
                            {ev.title}
                          </h3>

                          <div className="flex items-center justify-between text-[11px] mb-4">
                            <button
                              onClick={() => handleViewHostProfile(ev.hostUid, hostName)}
                              className="group/host inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-orange/10 text-accent-orange border border-accent-orange/20 font-black font-outfit uppercase tracking-widest transition-all duration-200 hover:bg-accent-orange/20 hover:border-accent-orange/40 hover:shadow-premium hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-orange/40"
                              aria-label={`查看主揪檔案：${hostName}`}
                            >
                              <img src="/logo.png" className="w-4 h-4 rounded-full" alt="" />
                              <span className="max-w-[9rem] truncate underline decoration-accent-orange/30 underline-offset-4 group-hover/host:decoration-accent-orange/70">
                                {hostName}
                              </span>
                              <Sparkles size={12} className="stroke-[2.5] transition-transform duration-200 group-hover/host:rotate-12 group-hover/host:scale-110" />
                            </button>
                            <span className="px-2.5 py-1 rounded-full bg-bg-secondary text-text-secondary font-black border border-accent-beige/10 font-outfit uppercase tracking-widest">
                              Lv.{Math.max(1, hostStats[ev.hostUid]?.count || 1)}
                            </span>
                          </div>

                          <div className="text-sm font-bold text-text-secondary flex items-center mb-4 min-h-[1.5rem]">
                            <MapPin size={16} className="mr-2 shrink-0 text-accent-orange/60" />
                            {locationLink ? (
                              <a
                                href={locationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate text-text-primary hover:text-accent-orange underline decoration-accent-orange/30 underline-offset-4 transition-all"
                              >
                                {ev.studio || '查看地圖'}
                              </a>
                            ) : (
                              <span className="truncate">{ev.studio}</span>
                            )}
                          </div>

                          {/* 簡介與網站 */}
                          {ev.description && (
                            <p className="text-xs text-text-secondary mb-4 line-clamp-2 leading-relaxed font-medium">
                              {ev.description.length > 50 ? ev.description.substring(0, 50) + '...' : ev.description}
                            </p>
                          )}
                          {ev.teammateNote && (
                            <div className="bg-bg-secondary/40 p-3 rounded-xl mb-4 border border-accent-beige/10 border-dashed group-hover:bg-bg-secondary/60 transition-colors">
                              <div className="text-[9px] text-accent-orange font-black mb-1.5 flex items-center uppercase tracking-[0.2em] font-outfit">
                                <MessageCircle size={10} className="mr-1.5 stroke-[2.5]" /> 主揪備註
                              </div>
                              <div className="text-xs text-text-primary font-medium italic">{ev.teammateNote}</div>
                            </div>
                          )}

                          {/* 分享按鈕 */}
                          <div className="absolute top-0 right-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShare(ev.id);
                              }}
                              className="p-2.5 bg-bg-secondary/50 rounded-xl text-text-secondary hover:text-accent-orange border border-accent-beige/10 backdrop-blur-sm transition-all shadow-sm"
                            >
                              <Share2 size={18} className="stroke-[2.5]" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm text-text-primary mb-5 bg-bg-secondary/30 p-4 rounded-2xl border border-accent-beige/10 shadow-inner group-hover:bg-bg-secondary/50 transition-colors">
                        <div className="flex items-center font-bold">
                          <Calendar size={16} className="mr-3 text-accent-orange/60 stroke-[2.5]" />
                          {ev.date}
                        </div>
                        <div className="flex items-center font-bold">
                          <Clock size={16} className="mr-3 text-accent-orange/60 stroke-[2.5]" />
                          {ev.time}
                        </div>

                        {/* 時間與人數詳情 */}
                        <div className="flex items-center col-span-2 gap-4 text-[10px] border-t border-accent-beige/10 pt-3 mt-1 font-black uppercase tracking-widest font-outfit text-text-secondary overflow-hidden">
                          <div className="flex items-center whitespace-nowrap" title="集合時間">
                            <AlertCircle size={12} className="mr-1.5 text-accent-orange/60 stroke-[2.5]" />
                            提早{ev.meetingTime || 15}分
                          </div>
                          <div className="flex items-center whitespace-nowrap" title="遊戲時長">
                            <Timer size={12} className="mr-1.5 text-accent-orange/60 stroke-[2.5]" />
                            {ev.duration || 100}MIN
                          </div>
                          <div className="flex items-center whitespace-nowrap" title="成團人數">
                            <Users size={12} className="mr-1.5 text-accent-orange/60 stroke-[2.5]" />
                            {ev.minPlayers || 4}P成團
                          </div>
                        </div>

                        {ev.isChainEvent && ev.chainSessions?.length > 0 && (
                          <div className="col-span-2 mt-4">
                            <button
                              type="button"
                              onClick={() => toggleChainDetails(ev.id)}
                              className="w-full flex items-center justify-between text-[11px] font-black font-outfit uppercase tracking-widest text-purple-600 bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-2.5 hover:bg-purple-500/20 transition-all shadow-sm"
                            >
                              <span>連刷詳情（共 {1 + ev.chainSessions.length} 團）</span>
                              <ChevronDown size={14} className={`transition-transform duration-300 ${expandedChainInfo[ev.id] ? 'rotate-180' : ''}`} />
                            </button>
                            {expandedChainInfo[ev.id] && (
                              <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                {ev.chainSessions.map((session, idx) => (
                                  <div key={session.id || idx} className="bg-white/80 border border-accent-beige/10 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-2.5">
                                      <div className="text-sm font-black font-outfit text-text-primary tracking-tight">
                                        #{idx + 2} {session.title || '未命名主題'}
                                      </div>
                                      {session.type && (
                                        <span className="text-[9px] font-black text-text-secondary px-2 py-0.5 bg-bg-secondary rounded border border-accent-beige/10 uppercase tracking-widest">
                                          {session.type}
                                        </span>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 text-[11px] font-bold text-text-secondary">
                                      <div className="flex items-center gap-1.5">
                                        <Calendar size={12} className="text-accent-orange/40" /> {session.date || '-'}
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Clock size={12} className="text-accent-orange/40" /> {session.time || '-'}
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <DollarSign size={12} className="text-accent-orange/40" /> ${session.price || '—'}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {isJoined && ev.contactLineId && (
                          <div className="mt-4 p-3 bg-bg-secondary/60 rounded-xl border border-accent-beige/10 animate-in fade-in slide-in-from-bottom-2">
                            <div className="text-[10px] font-black text-text-secondary mb-2 uppercase tracking-widest font-outfit">主揪社群名稱：</div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-text-primary font-black font-mono bg-white px-3 py-1.5 rounded-lg border border-accent-beige/20 shadow-sm select-all tracking-wider text-base">
                                {ev.contactLineId}
                              </span>
                              <button
                                onClick={() => navigator.clipboard.writeText(ev.contactLineId).then(() => showToast("已複製"))}
                                className="text-[10px] font-black bg-accent-orange/10 text-accent-orange px-3 py-1.5 rounded-lg border border-accent-orange/20 hover:bg-accent-orange hover:text-text-primary transition-all uppercase tracking-widest font-outfit"
                              >
                                複製
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center col-span-2 pt-3 border-t border-accent-beige/10 mt-1">
                          <DollarSign size={16} className="mr-3 text-accent-orange/60 stroke-[2.5]" />
                          <div className="flex items-baseline gap-2">
                            <span className="text-text-primary font-black text-lg font-outfit tracking-tight">
                              ${ev.price}
                              <span className="text-xs text-text-secondary font-bold ml-1">/ PERSON</span>
                            </span>
                            {parseInt(ev.priceFull) < parseInt(ev.price) && (
                              <span className="text-[11px] font-black bg-accent-orange/10 text-accent-orange px-2 py-0.5 rounded border border-accent-orange/20 font-outfit uppercase tracking-[0.1em]">
                                滿團 ${ev.priceFull}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mb-6 mt-auto">
                        <div className="flex justify-between text-[11px] font-black font-outfit uppercase tracking-widest mb-2">
                          <span className={eventIsFull ? "text-text-secondary" : "text-accent-orange"}>
                            {eventIsFull ? "EVENT FULL" : `MISSING ${getRemainingSlots(ev)} SLOTS`}
                          </span>
                          <span className="text-text-secondary opacity-60">
                            {getEffectiveCurrentSlots(ev)} / {ev.totalSlots}
                          </span>
                        </div>
                        <div className="h-2 bg-bg-secondary rounded-full overflow-hidden shadow-inner border border-accent-beige/5">
                          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${eventIsFull ? 'bg-text-secondary opacity-30 shadow-[0_0_8px_rgba(0,0,0,0.1)]' : 'bg-gradient-to-r from-accent-orange to-accent-orange-hover shadow-[0_0_12px_rgba(255,140,0,0.4)]'}`} style={{ width: `${ev.totalSlots ? Math.min((getEffectiveCurrentSlots(ev) / ev.totalSlots) * 100, 100) : 0}%` }} />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            setManagingEvent(ev);
                            setIsViewOnlyMode(true);
                            setShowManageModal(true);
                          }}
                          className="w-full py-3 bg-bg-secondary/50 text-text-primary rounded-xl text-xs font-black font-outfit uppercase tracking-widest hover:bg-bg-secondary hover:translate-y-[-1px] active:translate-y-0 transition-all border border-accent-beige/10 flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Users size={16} className="text-accent-orange/60 stroke-[2.5]" />
                          查看已參加成員
                        </button>

                        <div className="flex gap-3">
                          <button
                            disabled={joinButtonDisabled}
                            onClick={() => {
                              if (ev.isChainEvent) {
                                openChainSelectionModal(ev);
                              } else {
                                promptJoin(ev.id);
                              }
                            }}
                            className={`flex-1 py-3.5 rounded-xl font-black font-outfit uppercase tracking-[0.1em] text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2 shadow-premium hover:brightness-105 ${joinButtonClass}`}
                          >
                            {ev.isChainEvent ? (
                              chainJoinedCount > 0 ? (
                                <><CheckCircle size={18} className="stroke-[2.5]" /> 已選 {chainJoinedCount} 場</>
                              ) : (
                                <>選擇連刷場次</>
                              )
                            ) : isJoined ? (
                              <><CheckCircle size={18} className="stroke-[2.5] mr-2" /> 已參加 (正取)</>
                            ) : isPendingApproval ? (
                              <><Hourglass size={16} className="mr-2" /> 等待主揪審核</>
                            ) : isWaitlisted ? (
                              <><Hourglass size={16} className="mr-2" /> 已在候補名單</>
                            ) : eventIsFull ? (
                              '額滿，排候補'
                            ) : (
                              <><UserPlus size={16} className="mr-2" /> 我要 +1</>
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
                              className="px-4 py-2.5 rounded-xl bg-[#EBE3D7] text-[#7A7A7A] font-bold text-sm border border-[#D1C7BB] hover:bg-[#D1C7BB] transition-all flex items-center justify-center"
                            >
                              <UserPlus size={18} className="mr-2" />
                              攜伴
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Load More (RWD): mobile sticky bar + desktop normal */}
              {hasMore && !filterEventId && (
                <div className="col-span-full">
                  <div ref={loadMoreSentinelRef} className="h-1" />
                  <div className="sticky md:static z-30 bottom-[calc(env(safe-area-inset-bottom)+1rem)] md:bottom-auto mt-4">
                    <div className="bg-bg-primary/90 backdrop-blur-xl border border-accent-beige/20 rounded-2xl shadow-premium p-2">
                      <button
                        onClick={() => fetchEvents(true)}
                        disabled={loadingMore}
                        className="btn-primary w-full inline-flex items-center justify-center"
                      >
                        {loadingMore ? '載入中...' : '載入更多活動'}
                      </button>
                      <div className="text-center text-[11px] text-text-secondary mt-2 font-bold">
                        滑到底會自動載入（每次 9 筆）
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Promotions tab removed - now in /promotions page */}

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
                  className="bg-pink-500 text-[#212121] px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-400 transition-colors"
                >
                  查看所有許願
                </button>
              </div>
            )}

            <div className="grid gap-4">
              {(filterWishId ? wishes.filter(w => w.id === filterWishId) : wishes).length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-[#7A7A7A] mb-4">{filterWishId ? "找不到該許願，可能已被刪除" : "目前還沒有人許願"}</p>
                  {!filterWishId && (
                    <button onClick={() => { setActiveTab('lobby'); setCreateMode('wish'); openCreatePanel(); }} className="px-4 py-2 bg-pink-500 text-[#212121] rounded-xl text-sm font-bold shadow-lg shadow-pink-500/20 hover:bg-pink-400 transition-all">
                      我來許第一個願！
                    </button>
                  )}
                  {filterWishId && (
                    <button onClick={() => setFilterWishId(null)} className="px-4 py-2 bg-[#EBE3D7] text-[#7A7A7A] rounded-xl text-sm font-bold hover:bg-[#D1C7BB] transition-all">
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
                    <div key={wish.id} className="bg-white rounded-2xl p-4 border border-[#EBE3D7] shadow-lg relative overflow-hidden group hover:border-pink-500/30 transition-all">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-pink-500 to-purple-500" />

                      <div className="flex flex-wrap gap-2 mb-2 pl-3 items-center">
                        <span className="text-[10px] font-medium text-[#212121] px-2 py-1 bg-pink-500/20 rounded border border-pink-500/30">
                          {wish.category}
                        </span>
                        <span className="text-[10px] font-medium text-[#7A7A7A] px-2 py-1 bg-[#EBE3D7] rounded border border-[#D1C7BB]">
                          {wish.region}
                        </span>
                        <span className="text-[10px] font-medium text-[#7A7A7A] px-2 py-1 bg-[#EBE3D7] rounded border border-[#D1C7BB]">
                          {wish.type}
                        </span>
                        {isFull && (
                          <span className="ml-auto text-xs font-bold bg-[#FFE4B5]/20 text-[#FF8C00] px-2 py-1 rounded-lg border border-[#FF8C00]/30 flex items-center animate-pulse">
                            <BellRing size={12} className="mr-1" /> 人數已滿
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-[#212121] mb-2 pl-3">{wish.title}</h3>

                      <div className="pl-3 space-y-1 mb-4">
                        <div className="text-sm font-medium text-[#7A7A7A] flex items-center">
                          <MapPin size={14} className="mr-1.5 text-[#7A7A7A]" />
                          {wishLocationLink ? (
                            <a
                              href={wishLocationLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FF8C00] hover:text-emerald-200 underline-offset-2 hover:underline transition-colors"
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
                            className="text-xs text-[#7A7A7A] flex items-center gap-1 hover:text-emerald-200 transition-colors"
                          >
                            <Navigation size={12} className="text-[#7A7A7A]" />
                            {wish.location}
                          </a>
                        )}
                      </div>

                      {wish.description && (
                        <div className="pl-3 mb-4">
                          <div className="text-xs font-medium text-[#7A7A7A] mb-1">活動簡介</div>
                          <p className="text-xs text-[#212121] leading-relaxed whitespace-pre-wrap break-words">
                            {wish.description}
                          </p>
                        </div>
                      )}

                      {wish.hostNote && (
                        <div className="pl-3 mb-4">
                          <div className="text-xs font-medium text-[#7A7A7A] mb-1">主揪備註</div>
                          <div className="text-xs text-[#212121] font-medium italic bg-[#F7F4EF] border border-[#EBE3D7] rounded-lg px-3 py-2 leading-relaxed whitespace-pre-wrap break-words">
                            {wish.hostNote}
                          </div>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="pl-3 pr-1 mb-4">
                        <div className="flex justify-between text-xs text-[#7A7A7A] mb-1">
                          <span>集氣進度</span>
                          <span className={isFull ? "text-[#FF8C00] font-bold" : "text-[#7A7A7A]"}>
                            {currentCount} / {targetCount} 人
                          </span>
                        </div>
                        <div className="w-full bg-[#EBE3D7] rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-yellow-400' : 'bg-pink-500'}`}
                            style={{ width: `${Math.min((currentCount / targetCount) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="pl-3 flex items-center justify-between mt-2 pt-3 border-t border-[#EBE3D7]/50">
                        <div className="text-xs text-[#7A7A7A] mr-auto">
                          發起人：{wish.host}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewWishMembers(wish)}
                            className="p-1.5 bg-[#EBE3D7] text-[#7A7A7A] rounded-lg hover:bg-[#D1C7BB] hover:text-[#FF8C00] transition-colors"
                            title="查看成員"
                          >
                            <Users size={16} />
                          </button>
                          <button
                            onClick={() => handleShareWish(wish)}
                            className="p-1.5 bg-[#EBE3D7] text-[#7A7A7A] rounded-lg hover:bg-[#D1C7BB] hover:text-[#FF8C00] transition-colors"
                            title="分享"
                          >
                            <Share2 size={16} />
                          </button>
                          <button
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                                    ${isWished
                                ? 'bg-pink-500 text-[#212121] border-pink-500 hover:bg-pink-600'
                                : 'bg-pink-500/10 text-pink-400 border-pink-500/20 hover:bg-pink-500/20'}`}
                            onClick={() => handleJoinWish(wish)}
                          >
                            <Heart size={14} className={isWished ? "fill-current" : ""} />
                            {isWished ? `已集氣` : `集氣 +1`}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Create tab removed - now handled by FAB button and query param */}
        {isCreateOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6"
            onClick={closeCreatePanel}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="w-full md:max-w-3xl bg-bg-primary rounded-t-[2rem] md:rounded-[2rem] border border-white/40 shadow-premium overflow-hidden animate-in fade-in slide-in-from-bottom-4 md:zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-h-[85vh] overflow-y-auto p-5 md:p-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <h2 className="text-xl font-bold text-[#212121] flex items-center">
                    {createMode === 'wish' ? <Sparkles className="mr-2 text-[#FF8C00]" /> : (isEditing ? <Edit className="mr-2 text-[#FF8C00]" /> : <Plus className="mr-2 text-[#FF8C00]" />)}
                    {createMode === 'wish' ? '許願新活動' : (isEditing ? '編輯揪團內容' : '建立新揪團')}
                  </h2>
                  <button
                    type="button"
                    onClick={closeCreatePanel}
                    className="p-2 rounded-xl bg-[#EBE3D7] text-[#7A7A7A] font-bold hover:bg-[#D1C7BB] hover:text-[#212121] transition-all inline-flex items-center gap-2"
                    aria-label="關閉"
                  >
                    <X size={18} />
                  </button>
                </div>

            {/* 許願切換按鈕 */}
            {!isEditing && (
              <div className="flex bg-[#EBE3D7] p-1 rounded-xl mb-6">
                <button
                  onClick={() => setCreateMode('event')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${createMode === 'event' ? 'bg-[#FFE4B5] text-[#212121] shadow-lg shadow-[#FF8C00]/20' : 'text-[#7A7A7A] hover:text-[#212121]'}`}
                >
                  發起揪團
                </button>
                <button
                  onClick={() => setCreateMode('wish')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${createMode === 'wish' ? 'bg-[#FFE4B5] text-[#212121] shadow-lg shadow-[#FF8C00]/20' : 'text-[#7A7A7A] hover:text-[#212121]'}`}
                >
                  許願池
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-[#7A7A7A] font-medium">活動分類 <span className="text-red-500">*</span></label>
                  <select required className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] focus:border-emerald-500 outline-none"
                    value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    {['密室逃脫', '劇本殺', 'TRPG', '桌遊'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-[#7A7A7A] font-medium">所在地區 <span className="text-red-500">*</span></label>
                  <select required className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] focus:border-emerald-500 outline-none"
                    value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })}>
                    {['北部', '中部', '南部', '東部', '離島'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-[#7A7A7A] font-medium">主題名稱 <span className="text-red-500">*</span></label>
                  <input required type="text" className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] focus:border-emerald-500 outline-none"
                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="例如: 籠中鳥" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-[#7A7A7A] font-medium">密室類型 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Tag size={18} className="absolute left-4 top-3.5 text-[#7A7A7A]" />
                    <select required className="w-full bg-white border border-[#EBE3D7] rounded-xl pl-10 pr-4 py-3 text-[#212121] focus:border-emerald-500 outline-none appearance-none"
                      value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                      {['恐怖驚悚', '機關冒險', '劇情沉浸', '推理懸疑', '歡樂新手'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* 網站與簡介 */}
              <div className="space-y-1.5">
                <label className="text-sm text-[#7A7A7A] font-medium">官網連結 (選填)</label>
                <div className="relative">
                  <Globe size={18} className="absolute left-4 top-3.5 text-[#7A7A7A]" />
                  <input type="url" className="w-full bg-white border border-[#EBE3D7] rounded-xl pl-10 pr-4 py-3 text-[#212121] focus:border-emerald-500 outline-none"
                    value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="https://..." />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-[#7A7A7A] font-medium">活動簡介 (選填，最多50字)</label>
                <textarea
                  maxLength={50}
                  className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] focus:border-emerald-500 outline-none h-20 resize-none"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="簡單介紹劇情..."
                />
                <div className="text-xs text-[#7A7A7A] text-right">
                  {formData.description.length}/50
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-[#7A7A7A] font-medium">主揪備註 (選填)</label>
                <input type="text" className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] focus:border-emerald-500 outline-none"
                  value={formData.teammateNote} onChange={e => setFormData({ ...formData, teammateNote: e.target.value })} placeholder="想提醒隊友的事項..." />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-[#7A7A7A] font-medium">{createMode === 'wish' ? '主辦社群名稱' : '主揪社群名稱'} (參加後才可見)</label>
                <input type="text" className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] focus:border-emerald-500 outline-none"
                  value={formData.contactLineId} onChange={e => setFormData({ ...formData, contactLineId: e.target.value })} placeholder="方便大家聯繫你" />
              </div>

              {/* 許願模式隱藏以下欄位 */}
              {createMode === 'event' && (
                <>
                  {/* 時間與人數細節 */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#7A7A7A] font-medium">提前抵達(分)</label>
                      <input type="number" className="w-full bg-white border border-[#EBE3D7] rounded-xl px-3 py-3 text-[#212121] focus:border-emerald-500 outline-none text-center"
                        value={formData.meetingTime} onChange={e => setFormData({ ...formData, meetingTime: e.target.value })} placeholder="15" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#7A7A7A] font-medium">遊戲總時長(分)</label>
                      <input type="number" className="w-full bg-white border border-[#EBE3D7] rounded-xl px-3 py-3 text-[#212121] focus:border-emerald-500 outline-none text-center"
                        value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="120" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#7A7A7A] font-medium">成團最低人數</label>
                      <input type="number" className="w-full bg-white border border-[#EBE3D7] rounded-xl px-3 py-3 text-[#212121] focus:border-emerald-500 outline-none text-center"
                        value={formData.minPlayers} onChange={e => setFormData({ ...formData, minPlayers: e.target.value })} placeholder="4" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm text-[#7A7A7A] font-medium">工作室 <span className="text-red-500">*</span></label>
                    <input required type="text" className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] focus:border-emerald-500 outline-none"
                      value={formData.studio} onChange={e => setFormData({ ...formData, studio: e.target.value })} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm text-[#7A7A7A] font-medium">完整地址 / Google Maps 連結 <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-3.5 text-[#7A7A7A]" />
                      <input required type="text" className="w-full bg-white border border-[#EBE3D7] rounded-xl pl-10 pr-4 py-3 text-[#212121] focus:border-emerald-500 outline-none"
                        value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="可貼上 Google Maps 或輸入完整地址" />
                    </div>
                  </div>


                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm text-[#7A7A7A] font-medium">日期 <span className="text-red-500">*</span></label>
                      <input 
                        required 
                        type="date" 
                        className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] focus:border-emerald-500 outline-none"
                        style={{ colorScheme: 'light' }}
                        min={formatDate(new Date())}
                        max={maxEventDate}
                        value={formData.date} 
                        onChange={e => setFormData({ ...formData, date: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm text-[#7A7A7A] font-medium">時間 <span className="text-red-500">*</span></label>
                      <input 
                        required 
                        type="time" 
                        className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] focus:border-emerald-500 outline-none"
                        style={{ colorScheme: 'light' }}
                        value={formData.time} 
                        onChange={e => setFormData({ ...formData, time: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div className="bg-white/50 p-4 rounded-xl border border-[#EBE3D7] border-dashed space-y-4">
                    <div className="text-sm font-bold text-[#FF8C00] flex items-center">
                      <DollarSign size={14} className="mr-1" />
                      每人費用設定 (請備現金)
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm text-[#7A7A7A] font-medium">未滿團/基本價 <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-[#7A7A7A]">$</span>
                          <input required type="number" min="0" step="1" className="w-full bg-white border border-[#EBE3D7] rounded-xl pl-8 pr-4 py-3 text-[#212121] focus:border-emerald-500 outline-none"
                            value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="600" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm text-[#7A7A7A] font-medium">滿團優惠價 (選填)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-[#7A7A7A]">$</span>
                          <input type="number" min="0" step="1" className="w-full bg-white border border-[#EBE3D7] rounded-xl pl-8 pr-4 py-3 text-[#212121] focus:border-emerald-500 outline-none"
                            value={formData.priceFull} onChange={e => setFormData({ ...formData, priceFull: e.target.value })} placeholder="550" />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-[#7A7A7A]">若有設定滿團價，大廳會顯示「(滿團 $550)」供玩家參考。</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm text-[#7A7A7A] font-medium">總人數 <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Users size={18} className="absolute left-4 top-3.5 text-[#7A7A7A]" />
                        <input
                          type="number"
                          required
                          min="2"
                          max="40"
                          className="w-full bg-white border border-[#EBE3D7] rounded-xl pl-10 pr-4 py-3 text-[#212121] focus:border-emerald-500 outline-none"
                          value={formData.totalSlots}
                          onChange={e => setFormData({ ...formData, totalSlots: e.target.value })}
                          placeholder="請輸入人數"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm text-[#7A7A7A] font-medium">內建人數 (選填)</label>
                      <div className="relative">
                        <Users size={18} className="absolute left-4 top-3.5 text-[#7A7A7A]" />
                        <input
                          type="number"
                          min="0"
                          max="40"
                          className="w-full bg-white border border-[#EBE3D7] rounded-xl pl-10 pr-4 py-3 text-[#212121] focus:border-emerald-500 outline-none"
                          value={formData.builtInPlayers || ''}
                          onChange={e => setFormData({ ...formData, builtInPlayers: e.target.value })}
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
                    <label className="text-sm text-[#7A7A7A] font-medium">工作室 <span className="text-red-500">*</span></label>
                    <input required type="text" className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] focus:border-emerald-500 outline-none"
                      value={formData.studio} onChange={e => setFormData({ ...formData, studio: e.target.value })} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm text-[#7A7A7A] font-medium">工作室地址 / Google Maps <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-3.5 text-[#7A7A7A]" />
                      <input required type="text" className="w-full bg-white border border-[#EBE3D7] rounded-xl pl-10 pr-4 py-3 text-[#212121] focus:border-emerald-500 outline-none"
                        value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="可貼上 Google Maps 或輸入完整地址" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm text-[#7A7A7A] font-medium">期望成團人數</label>
                    <div className="relative">
                      <Users size={18} className="absolute left-4 top-3.5 text-[#7A7A7A]" />
                      <input
                        type="number"
                        required
                        min="2"
                        max="40"
                        className="w-full bg-white border border-[#EBE3D7] rounded-xl pl-10 pr-4 py-3 text-[#212121] focus:border-emerald-500 outline-none"
                        value={formData.minPlayers}
                        onChange={e => setFormData({ ...formData, minPlayers: e.target.value })}
                        placeholder="例如: 4"
                      />
                    </div>
                  </div>
                </>
              )}


              <div className="pt-2">
                <button type="submit" disabled={user.flakeCount >= 3} className={`w-full font-bold text-lg py-4 rounded-xl shadow-lg active:scale-95 transition-all ${user.flakeCount >= 3 ? 'bg-[#EBE3D7] text-[#7A7A7A] cursor-not-allowed' : createMode === 'wish' ? 'bg-pink-500 text-[#212121] shadow-pink-500/20 hover:bg-pink-400' : 'bg-[#FF8C00] text-[#212121] shadow-[#FF8C00]/20 hover:bg-[#FFA500]'}`}>
                  {user.flakeCount >= 3 ? '帳號受限無法操作' : (createMode === 'wish' ? '發布許願' : (isEditing ? '更新活動' : '發布揪團'))}
                </button>
                {isEditing && (
                  <button type="button" onClick={() => { setIsEditing(false); setActiveTab('lobby'); }} className="w-full text-[#7A7A7A] text-sm mt-4 hover:text-[#7A7A7A]">
                    取消編輯
                  </button>
                )}
              </div>
            </form>
              </div>
            </div>
          </div>
        )}

        {/* Profile tab removed - now in /profile page */}
        {false && activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl p-6 border border-[#EBE3D7] text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF8C00] to-[#FFA500]" />

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
                className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${user.nameChangedCount >= 1 ? 'text-slate-600 cursor-not-allowed bg-[#EBE3D7]/20' : 'text-[#7A7A7A] hover:text-[#212121] bg-[#EBE3D7]/50'}`}
              >
                {isEditingProfile ? <X size={18} /> : <Settings size={18} />}
              </button>

              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-[#EBE3D7] rounded-full flex items-center justify-center border-2 border-[#D1C7BB] relative overflow-hidden">
                  {user.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <User size={40} className="text-[#7A7A7A]" />}
                </div>
              </div>

              {isEditingProfile ? (
                <div className="animate-in fade-in duration-300 mb-4">
                  <div className="text-xs text-[#FF8C00] mb-2">注意：暱稱只能修改一次</div>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="bg-[#EBE3D7] text-[#212121] text-center font-bold text-lg px-3 py-1 rounded-lg border border-[#D1C7BB] outline-none focus:border-emerald-500 w-full mb-2"
                    placeholder="輸入新暱稱"
                  />
                  <button
                    onClick={handleUpdateProfile}
                    className="px-4 py-1.5 bg-[#FF8C00] text-[#212121] text-sm font-bold rounded-lg hover:bg-[#FFA500]"
                  >
                    確認修改 (剩下 0 次機會)
                  </button>
                </div>
              ) : (
                <h2 className="text-xl font-bold text-[#212121]">{user.displayName}</h2>
              )}

              <div className="flex justify-center gap-4 mt-3 text-sm text-[#7A7A7A]">
                <div className="flex flex-col"><span className="font-bold text-[#212121] text-lg">{myEvents.length + myWaitlists.length}</span><span className="text-xs">活動/候補</span></div>
                <div className="w-px bg-[#D1C7BB]"></div>
                <div className="flex flex-col"><span className={`font-bold text-lg ${user.flakeCount > 0 ? 'text-[#E74C3C]' : 'text-[#FF8C00]'}`}>{user.flakeCount}</span><span className="text-xs">跳車</span></div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#212121] px-1 mb-3">我的許願</h3>
              {myWishes.length === 0 ? (
                <div className="text-center py-8 text-[#7A7A7A] bg-white/50 rounded-3xl border border-[#EBE3D7] border-dashed mb-8">
                  尚未許願，去許願池看看吧！
                </div>
              ) : (
                myWishes.map(wish => {
                  const currentCount = wish.wishCount || 1;
                  const targetCount = wish.targetCount || 4;
                  const isFull = currentCount >= targetCount;
                  const wishLocationLink = getMapsUrl(wish.location);

                  return (
                    <div key={wish.id} className="bg-white rounded-3xl p-5 border border-[#EBE3D7] mb-6 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-purple-500 opacity-70" />

                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 mr-2">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-bold bg-pink-500/10 text-pink-400 px-2.5 py-1 rounded-lg border border-pink-500/20 flex items-center">
                              <Sparkles size={12} className="mr-1.5" /> 許願中
                            </span>
                            {isFull && (
                              <span className="text-xs font-bold bg-[#FFE4B5]/20 text-[#FF8C00] px-2.5 py-1 rounded-lg border border-[#FF8C00]/30 flex items-center animate-pulse">
                                <BellRing size={12} className="mr-1.5" /> 人數已滿，可開團！
                              </span>
                            )}
                            <span className="text-xs font-medium text-[#7A7A7A] px-2 py-1 bg-[#EBE3D7] rounded-lg">
                              {wish.region}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-[#212121] mb-1.5 leading-tight">{wish.title}</h3>
                          <div className="text-sm font-medium text-[#7A7A7A] flex items-center">
                            <MapPin size={14} className="mr-1.5 text-[#7A7A7A]" />
                            {wishLocationLink ? (
                              <a
                                href={wishLocationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#FF8C00] hover:text-emerald-200 underline-offset-2 hover:underline transition-colors"
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
                            className="p-2 bg-[#EBE3D7] rounded-xl text-[#7A7A7A] hover:text-[#FF8C00] border border-[#D1C7BB] transition-colors"
                            title="查看成員"
                          >
                            <Users size={16} />
                          </button>
                          <button
                            onClick={() => handleShareWish(wish)}
                            className="p-2 bg-[#EBE3D7] rounded-xl text-[#7A7A7A] hover:text-[#FF8C00] border border-[#D1C7BB] transition-colors"
                            title="分享許願"
                          >
                            <Share2 size={16} />
                          </button>
                          <button
                            onClick={() => handleCancelWish(wish.id)}
                            className="p-2 bg-[#EBE3D7] rounded-xl text-[#7A7A7A] hover:text-[#E74C3C] border border-[#D1C7BB] transition-colors"
                            title={wish.hostUid === user.uid ? "刪除許願" : "取消許願"}
                          >
                            {wish.hostUid === user.uid ? <Trash2 size={16} /> : <LogOut size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-[#7A7A7A] mb-1">
                          <span>集氣進度</span>
                          <span className={isFull ? "text-[#FF8C00] font-bold" : "text-[#7A7A7A]"}>
                            {currentCount} / {targetCount} 人
                          </span>
                        </div>
                        <div className="w-full bg-[#EBE3D7] rounded-full h-2 overflow-hidden">
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
              <h3 className="text-lg font-bold text-[#212121] px-1 mb-3">我的活動 (含候補)</h3>
              {[...myEvents, ...myWaitlists].length === 0 ? (
                <div className="text-center py-8 text-[#7A7A7A]">
                  目前沒有任何行程，快去大廳找團吧！
                </div>
              ) : (
                events
                  .filter(e => myEvents.includes(e.id) || myWaitlists.includes(e.id) || myPendingApprovals.includes(e.id))
                  .map(ev => {
                    const isWaitlisted = myWaitlists.includes(ev.id);
                    const isPendingJoin = myPendingApprovals.includes(ev.id);
                    const isPastEvent = isEventPast(ev);
                    const guestNotices = (ev.guestRemovalNotices || []).filter(n => n.ownerUid === user.uid);
                    const locationLink = getMapsUrl(ev.location);
                    const isHost = ev.hostUid === user.uid;
                    const hostPendingRequests = Array.isArray(ev.pendingApprovals) ? ev.pendingApprovals : [];
                    const hostName = getHostDisplayName(ev);
                    return (
                      <div key={ev.id} className="bg-white rounded-3xl p-5 border border-[#EBE3D7] mb-6 shadow-xl relative overflow-hidden group">
                        {/* 頂部裝飾條 */}
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70" />

                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              {isPastEvent ? (
                                <span className="text-xs font-bold bg-slate-500/10 text-[#7A7A7A] px-2.5 py-1 rounded-lg border border-slate-500/20 flex items-center">
                                  <Clock size={12} className="mr-1.5" /> 已結團
                                </span>
                              ) : isPendingJoin ? (
                                <span className="text-xs font-bold bg-[#FFE4B5]/20 text-[#7A7A7A] px-2.5 py-1 rounded-lg border border-[#FF8C00]/30 flex items-center">
                                  <Hourglass size={12} className="mr-1.5" /> 審核中
                                </span>
                              ) : isWaitlisted ? (
                                <span className="text-xs font-bold bg-[#FFE4B5]/20 text-[#FF8C00] px-2.5 py-1 rounded-lg border border-[#FF8C00]/30 flex items-center">
                                  <Hourglass size={12} className="mr-1.5" /> 候補排隊中
                                </span>
                              ) : (
                                <span className="text-xs font-bold bg-[#FF8C00]/10 text-[#FF8C00] px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center">
                                  <CheckCircle size={12} className="mr-1.5" /> 正取已參加
                                </span>
                              )}
                              <span className="text-xs font-medium text-[#7A7A7A] px-2 py-1 bg-[#EBE3D7] rounded-lg">
                                {ev.region}
                              </span>
                              {ev.isChainEvent && (
                                <span className="text-xs font-bold bg-amber-500/15 text-amber-300 px-2 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1">
                                  <Sparkles size={12} />
                                  連刷 x{1 + (ev.chainSessions?.length || 0)}
                                </span>
                              )}
                            </div>
                            <h3 className="text-xl font-bold text-[#212121] mb-1.5 leading-tight">{ev.title}</h3>
                            <div className="flex items-center justify-between text-xs text-[#7A7A7A] mb-2">
                              <button
                                onClick={() => handleViewHostProfile(ev.hostUid, hostName)}
                                className="group/host inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF8C00]/10 text-[#FF8C00] border border-[#FF8C00]/20 font-bold transition-all duration-200 hover:bg-[#FF8C00]/20 hover:border-[#FF8C00]/40 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]/40"
                                aria-label={`查看主揪檔案：${hostName}`}
                              >
                                <span className="max-w-[10rem] truncate underline decoration-[#FF8C00]/30 underline-offset-4 group-hover/host:decoration-[#FF8C00]/70">
                                  {hostName}
                                </span>
                                <Sparkles size={12} className="transition-transform duration-200 group-hover/host:rotate-12 group-hover/host:scale-110" />
                              </button>
                              <span className="px-2 py-0.5 rounded-full bg-[#EBE3D7] border border-[#D1C7BB] text-[10px] text-[#7A7A7A]">
                                Lv.{Math.max(1, hostStats[ev.hostUid]?.count || 1)}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-[#7A7A7A] flex items-center">
                              <MapPin size={14} className="mr-1.5 text-[#7A7A7A]" />
                              {locationLink ? (
                                <a
                                  href={locationLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#FF8C00] hover:text-emerald-200 underline-offset-2 hover:underline transition-colors"
                                >
                                  {ev.studio || '查看地圖'}
                                </a>
                              ) : (
                                <span>{ev.studio}</span>
                              )}
                            </div>
                            {isPendingJoin && (
                              <div className="mt-3 p-3 bg-[#FFE4B5]/20 border border-[#FF8C00]/30 rounded-xl text-xs text-[#212121]">
                                已送出 +1 申請，請在 LINE 群提醒主揪審核。未被同意前不會佔用名額。
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 absolute top-4 right-4 z-20">
                            {/* 非主揪且非被檢舉人可見：若有進行中的檢舉，在右上角顯示附議按鈕 */}
                            {ev.hostUid !== user.uid && ev.pendingFlake && ev.pendingFlake.targetUid !== user.uid && (
                              <button
                                onClick={() => handleConfirmFlake(ev)}
                                className="flex items-center gap-1.5 bg-red-500 text-[#212121] px-3 py-1.5 rounded-lg shadow-lg shadow-red-500/30 font-bold text-xs hover:bg-red-600 transition-colors border border-red-400 animate-pulse"
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
                                <button onClick={() => handleEdit(ev)} className="p-2 bg-[#EBE3D7] rounded-xl text-[#7A7A7A] hover:text-[#FF8C00] border border-[#D1C7BB] transition-colors">
                                  <Edit size={16} />
                                </button>
                                <button onClick={() => handleDelete(ev.id)} className="p-2 bg-[#EBE3D7] rounded-xl text-[#7A7A7A] hover:text-[#E74C3C] border border-[#D1C7BB] transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <button
                                onClick={() => {
                                  setManagingEvent(ev);
                                  setIsViewOnlyMode(false);
                                  setShowManageModal(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-[#FFE4B5]/20 text-[#7A7A7A] font-bold text-xs border border-[#FF8C00]/30 hover:bg-[#FFE4B5]/30 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                              >
                                <Users size={14} />
                                管理 ({ev.participants.length + (ev.guests?.length || 0)})
                                {hostPendingRequests.length > 0 && (
                                  <span className="ml-2 px-2 py-0.5 rounded-full bg-[#FFE4B5]/20 border border-[#FF8C00]/30 text-[#212121] text-[10px] flex items-center gap-1">
                                    <Hourglass size={10} />
                                    {hostPendingRequests.length}
                                  </span>
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 資訊網格 */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-slate-950/50 rounded-xl p-3 border border-[#EBE3D7]/50 flex flex-col justify-center">
                            <div className="text-xs text-[#7A7A7A] mb-1 flex items-center gap-1"><Calendar size={12} /> 日期</div>
                            <div className="text-sm font-bold text-[#212121]">{ev.date}</div>
                          </div>
                          <div className="bg-slate-950/50 rounded-xl p-3 border border-[#EBE3D7]/50 flex flex-col justify-center">
                            <div className="text-xs text-[#7A7A7A] mb-1 flex items-center gap-1"><Clock size={12} /> 時間</div>
                            <div className="text-sm font-bold text-[#212121]">{ev.time}</div>
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
                                  <div key={session.id || idx} className="bg-white/80 border border-[#EBE3D7] rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="text-sm font-bold text-[#212121]">
                                        第 {idx + 2} 團：{session.title || '未命名主題'}
                                      </div>
                                      {session.type && (
                                        <span className="text-[10px] text-[#7A7A7A] px-2 py-0.5 bg-[#EBE3D7] rounded border border-[#D1C7BB]">
                                          {session.type}
                                        </span>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs text-[#7A7A7A]">
                                      <div className="flex items-center gap-1">
                                        <Calendar size={12} className="text-[#7A7A7A]" /> {session.date || '-'}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock size={12} className="text-[#7A7A7A]" /> {session.time || '-'}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <DollarSign size={12} className="text-[#7A7A7A]" /> ${session.price || '—'}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {ev.contactLineId && (
                          <div className="mb-4 p-3 bg-[#EBE3D7]/30 rounded-xl border border-[#D1C7BB]/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#EBE3D7] flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                <MessageCircle size={16} />
                              </div>
                              <div>
                                <div className="text-[10px] text-[#7A7A7A] font-medium">主揪社群名稱</div>
                                <div className="text-sm font-mono font-bold text-[#212121] select-all">{ev.contactLineId}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => navigator.clipboard.writeText(ev.contactLineId).then(() => showToast("已複製", "success"))}
                              className="text-xs text-[#7A7A7A] hover:text-[#212121] px-2 py-1 bg-[#EBE3D7] rounded-lg"
                            >
                              複製
                            </button>
                          </div>
                        )}

                        {guestNotices.length > 0 && (
                          <div className="mb-4 space-y-2">
                            {guestNotices.map(notice => (
                              <div key={notice.id || `${notice.ownerUid}-${notice.guestName}`} className="p-3 bg-[#FFE4B5]/20 border border-yellow-500/30 rounded-xl text-xs text-yellow-100">
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
                            <div className="text-[13px] font-semibold text-[#7A7A7A] mb-2 flex items-center gap-2">
                              <UserPlus size={14} className="text-[#FF8C00]" />
                              攜伴名單（{ev.guests.length}）
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {ev.guests.map((guest, idx) => (
                                <div
                                  key={`${guest.name || 'guest'}-${idx}`}
                                  className="px-3 py-1.5 rounded-xl bg-[#EBE3D7]/60 border border-[#D1C7BB]/60 text-sm text-[#212121] flex flex-col min-w-[120px]"
                                >
                                  <span className="font-bold">{guest.name || `朋友 ${idx + 1}`}</span>
                                  <span className="text-[11px] text-[#7A7A7A]">
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
                            className="flex-1 py-2.5 bg-[#EBE3D7] text-[#7A7A7A] rounded-xl text-sm font-bold hover:bg-[#D1C7BB] hover:text-[#212121] transition-all border border-[#D1C7BB] flex items-center justify-center gap-2"
                          >
                            <Share2 size={16} className="text-purple-400" />
                            分享
                          </button>
                        </div>

                        <div className="flex gap-3 mb-4">
                          <button
                            onClick={() => handleAddToCalendar(ev)}
                            className="flex-1 py-2.5 bg-[#EBE3D7] text-[#7A7A7A] rounded-xl text-sm font-bold hover:bg-[#D1C7BB] hover:text-[#212121] transition-all border border-[#D1C7BB] flex items-center justify-center gap-2"
                          >
                            <CalendarPlus size={16} className="text-[#FF8C00]" />
                            行事曆
                          </button>
                          <button
                            onClick={() => handleNavigation(ev.location)}
                            className="flex-1 py-2.5 bg-[#EBE3D7] text-[#7A7A7A] rounded-xl text-sm font-bold hover:bg-[#D1C7BB] hover:text-[#212121] transition-all border border-[#D1C7BB] flex items-center justify-center gap-2"
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
                          className="w-full py-2.5 mb-3 bg-[#EBE3D7] text-[#7A7A7A] rounded-xl text-sm font-bold hover:bg-[#D1C7BB] hover:text-[#212121] transition-all border border-[#D1C7BB] flex items-center justify-center gap-2"
                        >
                          <Users size={16} className="text-[#FF8C00]" />
                          查看已參加成員
                        </button>

                        {isPendingJoin ? (
                          <button
                            onClick={() => handleWithdrawPendingRequest(ev.id)}
                            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center border border-[#FF8C00]/30 text-[#212121] bg-white hover:bg-[#EBE3D7] active:scale-95 transition-all"
                          >
                            <X size={16} className="mr-2" />
                            取消審核申請
                          </button>
                        ) : (
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
                                ? 'bg-white text-[#7A7A7A] border-[#EBE3D7] cursor-not-allowed'
                                : isWaitlisted
                                  ? 'bg-white text-[#7A7A7A] border-[#EBE3D7] hover:bg-[#EBE3D7] hover:text-[#7A7A7A]'
                                  : 'bg-red-500/5 text-[#E74C3C] border-red-500/10 hover:bg-[#E74C3C]/10'}`}
                          >
                            {isHost ? (
                              <> <Ban size={16} className="mr-2" /> 主揪請用垃圾桶關團 </>
                            ) : isWaitlisted ? (
                              <> <X size={16} className="mr-2" /> 取消候補申請</>
                            ) : (
                              <> <LogOut size={16} className="mr-2" /> 退出此揪團 (跳車)</>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })
              )}

              {/* Load More (RWD): mobile sticky bar + desktop normal */}
              {hasMore && (
                <div className="pt-4">
                  <div ref={loadMoreSentinelRef} className="h-1" />
                  <div className="sticky md:static z-30 bottom-[calc(env(safe-area-inset-bottom)+1rem)] md:bottom-auto mt-4">
                    <div className="bg-bg-primary/90 backdrop-blur-xl border border-accent-beige/20 rounded-2xl shadow-premium p-2">
                      <button
                        onClick={() => fetchEvents(true)}
                        disabled={loadingMore}
                        className="btn-primary w-full inline-flex items-center justify-center"
                      >
                        {loadingMore ? '載入中...' : '載入更多活動'}
                      </button>
                      <div className="text-center text-[11px] text-text-secondary mt-2 font-bold">
                        滑到底會自動載入（每次 9 筆）
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'hostProfile' && viewingHostUid && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-10">
            <div className="card-premium p-8 text-center relative overflow-hidden glass-edge">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent-orange via-accent-orange-hover to-purple-500 opacity-80" />

              <button
                onClick={() => {
                  setViewingHostUid(null);
                  setViewingHostName("");
                  setViewingHostPhotoURL(null);
                  setActiveTab('lobby');
                }}
                className="absolute top-6 left-6 p-2 rounded-full text-text-secondary hover:text-text-primary bg-bg-secondary/50 transition-all hover:scale-110 active:scale-90 shadow-sm"
              >
                <ArrowLeft size={20} className="stroke-[2.5]" />
              </button>

              <div className="flex items-center justify-center mb-6">
                <div className="w-24 h-24 bg-bg-secondary rounded-[2.5rem] flex items-center justify-center border-2 border-white/40 relative overflow-hidden shadow-premium group">
                  {viewingHostPhotoURL ? (
                    <img src={viewingHostPhotoURL} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <User size={48} className="text-text-secondary opacity-40" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
              </div>

              <h2 className="text-3xl font-black font-outfit text-text-primary mb-2 tracking-tight">
                {viewingHostName || '神秘主揪'}
              </h2>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent-orange/10 text-accent-orange border border-accent-orange/20 font-black font-outfit text-[11px] uppercase tracking-widest mb-8">
                LEVEL {Math.max(1, hostStats[viewingHostUid]?.count || 1)}
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="bg-bg-secondary/30 rounded-2xl p-4 border border-accent-beige/10 shadow-inner">
                  <p className="text-[10px] font-black font-outfit uppercase tracking-widest text-text-secondary mb-1">歷史開團</p>
                  <p className="text-2xl font-black font-outfit text-text-primary">{hostHistoryEvents.length}</p>
                </div>
                <div className="bg-bg-secondary/30 rounded-2xl p-4 border border-accent-beige/10 shadow-inner">
                  <p className="text-[10px] font-black font-outfit uppercase tracking-widest text-text-secondary mb-1">進行中</p>
                  <p className="text-2xl font-black font-outfit text-accent-orange">
                    {hostHistoryEvents.filter(ev => {
                      const eventDate = new Date(ev.date);
                      eventDate.setHours(0, 0, 0, 0);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return eventDate >= today && !ev.isFull;
                    }).length}
                  </p>
                </div>
                <div className="bg-bg-secondary/30 rounded-2xl p-4 border border-accent-beige/10 shadow-inner">
                  <p className="text-[10px] font-black font-outfit uppercase tracking-widest text-text-secondary mb-1">缺人場次</p>
                  <p className="text-2xl font-black font-outfit text-accent-orange-hover">
                    {hostHistoryEvents.filter(ev => {
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

            <div className="px-1">
              <h3 className="text-xl font-black font-outfit text-text-primary mb-6 flex items-center gap-3 tracking-tight">
                <div className="p-2 bg-accent-orange/10 rounded-xl text-accent-orange">
                  <CalendarDays size={20} className="stroke-[2.5]" />
                </div>
                歷史開團記錄
              </h3>

              {hostHistoryEvents.length === 0 ? (
                <div className="text-center py-20 text-text-secondary bg-bg-secondary/20 rounded-[2.5rem] border border-accent-beige/20 border-dashed">
                  <Ghost size={48} className="mx-auto mb-4 opacity-10" />
                  <p className="text-base font-medium">還沒有任何開團記錄</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {hostHistoryEvents.map(ev => {
                    const eventDate = new Date(ev.date);
                    eventDate.setHours(0, 0, 0, 0);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isPast = eventDate < today;
                    const locationLink = getMapsUrl(ev.location);
                    const eventIsFull = getEffectiveCurrentSlots(ev) >= ev.totalSlots;

                    return (
                      <div key={ev.id} className="card-premium p-6 group h-full flex flex-col">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-accent-beige/10 group-hover:bg-accent-orange/40 transition-colors" />

                        <div className="flex justify-between items-start mb-4 pl-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              {isPast ? (
                                <span className="text-[10px] font-black font-outfit uppercase tracking-widest bg-slate-500/10 text-text-secondary px-2.5 py-1 rounded-md border border-slate-500/20">已結團</span>
                              ) : eventIsFull ? (
                                <span className="text-[10px] font-black font-outfit uppercase tracking-widest bg-red-500/10 text-red-500 px-2.5 py-1 rounded-md border border-red-500/20">額滿</span>
                              ) : (
                                <span className="text-[10px] font-black font-outfit uppercase tracking-widest bg-accent-orange/10 text-accent-orange px-2.5 py-1 rounded-md border border-accent-orange/20 animate-pulse">進行中</span>
                              )}
                              <span className="text-[10px] font-black font-outfit uppercase tracking-widest bg-bg-secondary text-text-primary px-2.5 py-1 rounded-md border border-accent-beige/20">{ev.region}</span>
                            </div>

                            <h3 className="text-lg font-black font-outfit text-text-primary mb-2 leading-tight tracking-tight group-hover:text-accent-orange transition-colors">{ev.title}</h3>

                            <div className="text-xs font-bold text-text-secondary flex items-center mb-3">
                              <MapPin size={14} className="mr-2 text-accent-orange/60 shrink-0" />
                              <span className="truncate">{ev.studio}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-3 text-[10px] font-black font-outfit uppercase tracking-widest text-text-secondary pt-4 border-t border-accent-beige/10">
                              <div className="flex items-center gap-1.5"><Calendar size={12} className="stroke-[2.5]" /> {ev.date || '-'}</div>
                              <div className="flex items-center gap-1.5"><Clock size={12} className="stroke-[2.5]" /> {ev.time || '-'}</div>
                              <div className="flex items-center gap-1.5 text-accent-orange"><DollarSign size={12} className="stroke-[2.5]" /> ${ev.price || '—'}</div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto pt-4 pl-2">
                          <button
                            onClick={() => {
                              setManagingEvent(ev);
                              setIsViewOnlyMode(true);
                              setShowManageModal(true);
                            }}
                            className="w-full py-2.5 bg-bg-secondary/50 text-text-secondary hover:text-text-primary border border-accent-beige/20 rounded-xl text-[10px] font-black font-outfit uppercase tracking-widest transition-all hover:border-accent-orange/20 flex items-center justify-center gap-2"
                          >
                            <Users size={14} className="stroke-[2.5]" />
                            查看參與成員
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* About tab removed - now in /about page */}
        {false && activeTab === 'about' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center py-8">
              <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="小迷糊密室揪團平台 Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <h1 className="text-2xl font-bold text-[#212121] mb-2">小迷糊密室揪團平台</h1>
              {/* SEO / 內容結構：補足可見的 H2，讓首頁標題層級更完整 */}
              <div className="mt-4 space-y-2">
                <h2 className="text-sm font-bold text-[#212121]">
                  快速找隊友揪團：即時招募、名額與候補管理
                </h2>
                <h2 className="text-sm font-bold text-[#212121]">
                  密室玩家人格測驗：找到更合拍的解謎搭檔
                </h2>
                <h2 className="text-sm font-bold text-[#212121]">
                  活動管理與優惠情報：揪團更輕鬆、出發更安心
                </h2>
              </div>
              <p className="text-[#7A7A7A]">v1.0.0</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#EBE3D7] space-y-6">

              {/* Founder */}
              <div className="text-center">
                <h3 className="text-[#FF8C00] font-bold mb-1">Founder</h3>
                <div className="text-xl font-bold text-[#212121] mb-3">小迷糊</div>
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

              <div className="h-px bg-[#EBE3D7] w-full" />

              {/* Engineer */}
              <div className="text-center">
                <h3 className="text-blue-400 font-bold mb-1">用愛發電工程師</h3>
                <div className="text-xl font-bold text-[#212121] mb-1">曠</div>
                <div className="text-sm text-[#7A7A7A] mb-2">運營小工作室 NextEdge AI Studio</div>
                <p className="text-xs text-[#7A7A7A] mb-3">
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

              <div className="h-px bg-[#EBE3D7] w-full" />

              {/* Co-Maintainer */}
              <div className="text-center">
                <h3 className="text-[#7A7A7A] font-bold mb-1">協作者 / 維運</h3>
                <div className="flex items-center justify-center gap-3 mb-1">
                  <div className="w-10 h-10 bg-[#EBE3D7] rounded-full flex items-center justify-center border border-[#D1C7BB]">
                    <span className="text-xl">👻</span>
                  </div>
                  <div className="text-xl font-bold text-[#212121]">飄</div>
                </div>
                <div className="text-sm text-[#7A7A7A]">我是飄，負責維運。</div>
                <div className="text-sm text-[#7A7A7A]">偶爾幫忙修修 bug。</div>
              </div>

              <div className="h-px bg-[#EBE3D7] w-full" />

              {/* Terms */}
              <div>
                <h3 className="text-[#7A7A7A] font-bold mb-3 text-center">[ 使用條款 ]</h3>
                <div className="text-xs text-[#7A7A7A] space-y-2 leading-relaxed bg-slate-950/50 p-4 rounded-xl">
                  <p>1. 本平台僅提供資訊交流與媒合，不介入實際交易與糾紛處理。</p>
                  <p>2. 請使用者保持友善交流，禁止騷擾、詐騙或發表不當言論。</p>
                  <p>3. 參加活動請準時出席，若無法參加請提前告知主揪。</p>
                  <p>4. 平台有權移除違規內容或停用違規帳號。</p>
                  <p>5. 相關活動風險請自行評估，本平台不負連帶責任。</p>
                </div>
              </div>

              <div className="h-px bg-[#EBE3D7] w-full" />

              {/* Legal Links */}
              <div className="flex justify-center gap-6">
                <a
                  href="/terms"
                  className="text-[#FF8C00] hover:text-[#FF8C00] text-sm font-medium underline underline-offset-4"
                >
                  使用條款
                </a>
                <a
                  href="/privacy"
                  className="text-[#FF8C00] hover:text-[#FF8C00] text-sm font-medium underline underline-offset-4"
                >
                  隱私權政策
                </a>
              </div>

            </div>

            <div className="text-center pb-8">
              <p className="text-[#7A7A7A] text-xs">
                © {new Date().getFullYear()} NextEdge AI Studio. All Rights Reserved.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* Guest Join Modal */}
      {showGuestModal && (() => {
        const targetEvent = getEventById(guestEventId);
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
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-bg-primary w-full max-w-sm rounded-[2.5rem] p-8 border border-white/40 shadow-premium relative overflow-hidden glass-edge">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent-orange to-accent-orange-hover opacity-80" />

              <h3 className="text-2xl font-black font-outfit text-text-primary mb-2 flex items-center gap-3 tracking-tight">
                <div className="p-2 bg-accent-orange/10 rounded-xl text-accent-orange">
                  <UserPlus size={24} className="stroke-[2.5]" />
                </div>
                攜伴參加
              </h3>

              <p className="text-text-secondary mb-6 text-sm font-medium leading-relaxed">
                幫朋友代報名，每位朋友都會佔用一個名額。
              </p>

              {options.length > 1 && (
                <div className="mb-5">
                  <label className="text-[10px] font-black font-outfit uppercase tracking-widest text-text-secondary mb-1.5 block">選擇預期場次</label>
                  <select
                    value={guestSessionId}
                    onChange={(e) => setGuestSessionId(e.target.value)}
                    className="w-full bg-bg-secondary/50 text-text-primary text-sm font-bold px-4 py-3 rounded-xl border border-accent-beige/20 outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange/20 appearance-none transition-all cursor-pointer"
                  >
                    {options.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="text-[10px] font-black font-outfit uppercase tracking-widest text-text-secondary mb-4 flex items-center gap-2">
                <Sparkles size={12} className="text-accent-orange" />
                {selectedSession?.label || '主場'} 剩餘可代報 <span className="text-accent-orange text-xs">{allowedGuestSlots}</span> 位朋友
              </div>

              {exceedsLimit && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] font-bold text-red-500 flex items-center gap-2 animate-pulse">
                  <AlertCircle size={14} />
                  名單超過名額，請刪減至 {allowedGuestSlots} 位。
                </div>
              )}

              {allowedGuestSlots > 0 ? (
                <div className="space-y-3 mb-6 max-h-[35vh] overflow-y-auto custom-scrollbar pr-2">
                  {guestNames.map((name, index) => (
                    <div key={index} className="flex gap-3 animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                      <input
                        type="text"
                        autoFocus={index === guestNames.length - 1}
                        value={name}
                        onChange={(e) => {
                          const newNames = [...guestNames];
                          newNames[index] = e.target.value;
                          setGuestNames(newNames);
                        }}
                        className="flex-1 bg-white border border-accent-beige/20 rounded-xl px-4 py-3 text-text-primary text-sm font-bold outline-none focus:border-accent-orange transition-all shadow-inner placeholder:font-normal placeholder:text-text-secondary opacity-80 focus:opacity-100"
                        placeholder={`朋友 ${index + 1} 的名字`}
                      />
                      {guestNames.length > 1 && (
                        <button
                          onClick={() => {
                            const newNames = guestNames.filter((_, i) => i !== index);
                            setGuestNames(newNames);
                          }}
                          className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl border border-red-500/20 transition-all shadow-sm"
                        >
                          <Trash2 size={18} className="stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-6 p-4 text-xs font-bold text-accent-orange bg-accent-orange/10 border border-accent-orange/20 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} /> 目前暫無多餘名額。
                  </div>
                  <p className="font-medium opacity-80 text-[10px]">需保留一個名額給自己，暫時無法再代報朋友。</p>
                </div>
              )}

              {allowedGuestSlots > 0 && (
                <button
                  disabled={!canAddMoreGuests}
                  onClick={() => setGuestNames([...guestNames, ""])}
                  className={`w-full py-3.5 mb-8 rounded-2xl border-2 border-dashed font-black font-outfit uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all
                                ${canAddMoreGuests
                      ? 'border-accent-beige/40 text-text-secondary hover:text-text-primary hover:border-accent-orange/40 hover:bg-bg-secondary/30'
                      : 'border-bg-secondary text-text-secondary/30 cursor-not-allowed bg-transparent'}`}
                >
                  {canAddMoreGuests ? (
                    <>
                      <Plus size={16} className="stroke-[2.5]" />
                      增加一位朋友
                    </>
                  ) : (
                    <span>已達本團人數上限</span>
                  )}
                </button>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button onClick={closeGuestModal} className="py-3.5 rounded-2xl text-text-secondary bg-bg-secondary/50 hover:bg-bg-secondary hover:text-text-primary transition-all font-black font-outfit uppercase tracking-widest text-xs">取消</button>
                <button
                  onClick={handleGuestJoin}
                  disabled={confirmDisabled}
                  className={`py-3.5 rounded-2xl font-black font-outfit uppercase tracking-widest text-xs transition-all active:scale-[0.97] ${confirmDisabled ? 'bg-bg-secondary text-text-secondary/40 cursor-not-allowed border border-accent-beige/10' : 'btn-primary shadow-premium'}`}
                >
                  確認代報 ({filledGuests}人)
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showChainModal && chainEventTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-bg-primary w-full max-w-md rounded-[2.5rem] p-8 border border-white/40 shadow-premium relative flex flex-col max-h-[85vh] overflow-hidden glass-edge">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-pink-400 to-accent-orange opacity-80" />

            <button onClick={() => { setShowChainModal(false); setChainEventTarget(null); }} className="absolute top-5 right-5 p-2 text-text-secondary hover:text-text-primary bg-bg-secondary/50 rounded-full transition-all hover:scale-110 active:scale-90">
              <X size={20} className="stroke-[2.5]" />
            </button>

            <h3 className="text-2xl font-black font-outfit text-text-primary mb-1.5 flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
                <Sparkles size={24} className="stroke-[2.5] animate-pulse" />
              </div>
              參加連刷場次
            </h3>

            <p className="text-text-secondary mb-6 text-sm font-medium leading-relaxed">
              可以自由勾選要參加的場次，未勾選即視為不參加。
            </p>

            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 mb-8">
              {getChainSessionList(chainEventTarget).map((session, idx) => {
                const sessionId = session.id === 'main' ? 'main' : session.id;
                const alreadyJoined = session.participants?.includes(user?.uid);
                const selected = chainSelection.hasOwnProperty(sessionId) ? chainSelection[sessionId] : alreadyJoined;
                const total = session.totalSlots || chainEventTarget.totalSlots || 0;
                const current = session.currentSlots ?? (session.participants?.length || 0);
                const isFull = total ? current >= total : false;
                const disableToggle = !selected && isFull && !alreadyJoined;

                return (
                  <div key={`${sessionId}-${idx}`} className={`group bg-white border rounded-2xl p-5 flex items-start gap-4 transition-all duration-300 ${selected ? 'border-purple-500/30 bg-purple-500/[0.02] shadow-sm' : 'border-accent-beige/10 grayscale-[0.3] opacity-80 hover:opacity-100 hover:grayscale-0'}`}>
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        disabled={disableToggle}
                        checked={selected}
                        onChange={() => handleChainSessionToggle(sessionId)}
                        className="w-5 h-5 text-purple-500 bg-bg-secondary border-accent-beige/30 rounded-lg focus:ring-purple-500/50 cursor-pointer transition-all"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className={`text-base font-black font-outfit tracking-tight transition-colors ${selected ? 'text-text-primary' : 'text-text-secondary'}`}>
                          {sessionId === 'main' ? '第一站' : `站點 ${idx + 1}`}：{session.title || '未命名主題'}
                        </p>
                        {session.type && (
                          <span className="text-[10px] font-black text-text-secondary px-2.5 py-1 bg-bg-secondary/50 rounded-md border border-accent-beige/10 uppercase tracking-widest font-outfit">
                            {session.type}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] font-bold text-text-secondary mb-3">
                        <span className="flex items-center gap-2"><Calendar size={13} className="text-purple-500/50" /> {session.date || '-'}</span>
                        <span className="flex items-center gap-2"><Clock size={13} className="text-purple-500/50" /> {session.time || '-'}</span>
                        <span className="flex items-center gap-2 font-black text-text-primary">${session.price || '—'}</span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-accent-beige/5">
                        <div className="flex items-center gap-3">
                          <div className="text-[10px] font-black font-outfit uppercase tracking-widest text-text-secondary">
                            已報名 <span className={isFull ? "text-red-500" : "text-purple-500"}>{current}</span> / {total || '—'}
                          </div>
                          {disableToggle && <span className="text-[10px] font-black bg-red-500/10 text-red-500 px-2 py-0.5 rounded uppercase tracking-wider">額滿</span>}
                        </div>
                        {alreadyJoined && !selected && <span className="text-[10px] font-black text-accent-orange uppercase tracking-wider animate-pulse">即將退出</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto">
              <button onClick={() => { setShowChainModal(false); setChainEventTarget(null); }} className="py-4 rounded-2xl text-text-secondary bg-bg-secondary/50 hover:bg-bg-secondary hover:text-text-primary transition-all font-black font-outfit uppercase tracking-widest text-xs">
                取消
              </button>
              <button onClick={handleChainSelectionConfirm} className="py-4 rounded-2xl text-text-primary bg-purple-600 hover:bg-purple-500 font-black font-outfit uppercase tracking-widest text-xs shadow-premium transition-all active:scale-[0.97]">
                確認更新場次
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-bg-primary w-full max-w-sm rounded-[2.5rem] p-8 border border-white/40 shadow-premium relative overflow-hidden glass-edge text-center">
            <div className={`absolute top-0 left-0 w-full h-1.5 opacity-80 ${confirmModal.action === 'join' ? 'bg-accent-orange' : 'bg-red-500'}`} />

            <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 shadow-xl ${confirmModal.action === 'join' ? 'bg-accent-orange/10 text-accent-orange' : 'bg-red-500/10 text-red-500'}`}>
              {confirmModal.action === 'join'
                ? <CheckCircle size={40} className="stroke-[2.5]" />
                : confirmModal.action === 'confirmFlake'
                  ? <AlertTriangle size={40} className="stroke-[2.5] animate-bounce" />
                  : <AlertTriangle size={40} className="stroke-[2.5]" />}
            </div>

            <h3 className="text-2xl font-black font-outfit text-text-primary mb-3 tracking-tight">
              {confirmModal.title || (confirmModal.action === 'join' ? '確認報名？' :
                confirmModal.action === 'cancel'
                  ? (myWaitlists.includes(confirmModal.eventId) ? '確定取消候補？' : '確定要跳車嗎？')
                  : '確定要刪除？')}
            </h3>

            <p className="text-text-secondary mb-8 text-sm font-medium leading-relaxed whitespace-pre-line px-2">
              {confirmModal.message || (confirmModal.action === 'join'
                ? `確定要報名參加「${confirmModal.title}」嗎？`
                : confirmModal.action === 'cancel'
                  ? (myWaitlists.includes(confirmModal.eventId)
                    ? '取消候補不會影響您的信用分數。'
                    : `這將會增加您的跳車次數 (${user.flakeCount + 1})。`)
                  : '刪除後所有報名者都會被移除，且無法復原。')}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setConfirmModal({ show: false })} className="py-3.5 rounded-2xl text-text-secondary bg-bg-secondary/50 hover:bg-bg-secondary hover:text-text-primary transition-all font-black font-outfit uppercase tracking-widest text-xs">取消</button>
              <button
                onClick={executeAction}
                className={`py-3.5 rounded-2xl font-black font-outfit uppercase tracking-widest text-xs transition-all active:scale-[0.97] shadow-premium ${confirmModal.action === 'join' ? 'btn-primary' : 'bg-red-500 text-text-primary hover:bg-red-600'}`}
              >
                {confirmModal.action === 'join' ? '確認參加' : confirmModal.action === 'confirmFlake' ? '確認附議' : '確認執行'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wish Members Modal */}
      {wishMembersModal.show && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-bg-primary w-full max-w-sm rounded-[2.5rem] border border-white/40 shadow-premium overflow-hidden animate-in zoom-in-95 duration-200 glass-edge">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 to-purple-500 opacity-80" />

            <div className="p-6 border-b border-accent-beige/10 flex items-center justify-between bg-bg-secondary/30">
              <h3 className="text-xl font-black font-outfit text-text-primary flex items-center gap-3 tracking-tight">
                <div className="p-2 bg-pink-500/10 rounded-xl text-pink-500">
                  <Users size={20} className="stroke-[2.5]" />
                </div>
                已集氣成員
              </h3>
              <button
                onClick={() => setWishMembersModal({ show: false, wishId: null, members: [] })}
                className="p-2 text-text-secondary hover:text-text-primary bg-bg-secondary/50 rounded-full transition-all"
              >
                <X size={20} className="stroke-[2.5]" />
              </button>
            </div>

            <div className="p-6 max-h-[50vh] overflow-y-auto space-y-4 custom-scrollbar">
              {wishMembersModal.members.length === 0 ? (
                <div className="text-center py-10 opacity-40">
                  <Ghost size={40} className="mx-auto mb-3" />
                  <p className="text-sm font-bold text-text-secondary">還沒有人集氣，快去邀請朋友吧！</p>
                </div>
              ) : (
                wishMembersModal.members.map((member, idx) => (
                  <div key={member.uid} className="flex items-center gap-4 bg-white/80 p-4 rounded-[1.5rem] border border-accent-beige/10 shadow-sm animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                    {member.photoURL ? (
                      <img src={member.photoURL} alt={member.displayName} className="w-12 h-12 rounded-full border-2 border-accent-beige/20 shadow-sm object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center text-text-secondary border border-accent-beige/20 shadow-inner">
                        <User size={24} />
                      </div>
                    )}
                    <div>
                      <div className="text-base font-black font-outfit text-text-primary tracking-tight">{member.displayName}</div>
                      <div className="text-[10px] font-black font-outfit uppercase tracking-widest text-pink-500/70">集氣夥伴 · LEVEL 1</div>
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
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-bg-primary w-full max-w-sm rounded-[2.5rem] border border-white/40 shadow-premium overflow-hidden animate-in zoom-in-95 duration-200 glass-edge text-center p-8">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent-orange to-accent-orange-hover opacity-80" />

            <div className="w-24 h-24 bg-accent-orange/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl text-accent-orange border border-accent-orange/20">
              <CheckCircle size={48} className="stroke-[2.5] animate-in zoom-in-50 duration-500" />
            </div>

            <h3 className="text-3xl font-black font-outfit text-text-primary mb-3 tracking-tight">開團成功！</h3>
            <p className="text-text-secondary text-sm font-medium leading-relaxed mb-8">
              現在就分享到 LINE 社群，<br />邀請大家一起來解謎吧！
            </p>

            <button
              onClick={() => {
                const { eventId, eventData } = sharePrompt;
                const shareUrl = `${window.location.origin}/lobby?eventId=${eventId}`;
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
              className="w-full py-4 bg-[#06C755] hover:bg-[#05b64d] text-text-primary font-black font-outfit uppercase tracking-[0.15em] text-sm rounded-2xl shadow-premium transition-all active:scale-[0.97] flex items-center justify-center gap-3 mb-4"
            >
              <Share2 size={20} className="stroke-[2.5]" />
              分享至 LINE 社群
            </button>

            <button
              onClick={() => setSharePrompt({ show: false, eventId: null, eventData: null })}
              className="text-text-secondary text-[11px] font-black font-outfit uppercase tracking-widest hover:text-text-primary transition-colors py-2"
            >
              稍後再說
            </button>
          </div>
        </div>
      )}

      {notification.show && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl shadow-xl flex items-center z-50 min-w-[300px] animate-in slide-in-from-top-4 fade-in duration-300 ${notification.type === 'error' ? 'bg-red-500 text-[#212121]' : 'bg-[#FF8C00] text-[#212121]'}`}>
          {notification.type === 'error' ? <AlertTriangle size={20} className="mr-2" /> : <CheckCircle size={20} className="mr-2" />}
          <span className="font-medium text-sm">{notification.msg}</span>
        </div>
      )}

      {/* 導覽統一由 AppLayout 處理 */}
    </div>
  );
}