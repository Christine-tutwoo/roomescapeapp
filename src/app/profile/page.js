'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { onAuthStateChanged, signInWithPopup, signOut, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  limit,
  arrayRemove,
} from 'firebase/firestore';
import { ExternalLink, LogIn, LogOut, Settings, Share2, Trash2, Users, X, Edit2, Check, XCircle, Edit } from 'lucide-react';
import Link from 'next/link';

const VISITOR_USER = {
  uid: 'visitor',
  displayName: '訪客',
  email: '',
  photoURL: '',
  flakeCount: 0,
  isBanned: false,
  nameChangedCount: 0,
  communityNickname: '',
  isVisitor: true,
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
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

export default function ProfilePage() {
  const [user, setUser] = useState(VISITOR_USER);
  const [loadingUser, setLoadingUser] = useState(true);

  const [events, setEvents] = useState([]);
  const [wishes, setWishes] = useState([]);

  const [notification, setNotification] = useState({ show: false, msg: '', type: 'success' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');

  const [wishMembersModal, setWishMembersModal] = useState({ show: false, wishId: null, members: [] });

  // --- 活動編輯（在 Profile 內用 modal 編輯，避免跳去 lobby） ---
  const [editEventModal, setEditEventModal] = useState({ show: false, eventId: null });
  const [editEventForm, setEditEventForm] = useState({
    title: '',
    studio: '',
    region: '北部',
    category: '密室逃脫',
    type: '恐怖驚悚',
    date: '',
    time: '',
    price: '',
    priceFull: '',
    totalSlots: '',
    location: '',
    website: '',
    description: '',
    teammateNote: '',
    contactLineId: '',
    meetingTime: '15',
    duration: '120',
    minPlayers: '4',
    builtInPlayers: '',
  });

  // Modal UX: open 時鎖住背景捲動（手機較不會「滑到背景」）
  useEffect(() => {
    const shouldLock = !!(wishMembersModal.show || editEventModal.show);
    if (!shouldLock) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [wishMembersModal.show, editEventModal.show]);

  const showToast = (msg, type = 'success', duration = 3000) => {
    setNotification({ show: true, msg, type });
    window.setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, duration);
  };

  // --- Auth + user doc sync (與 lobby 目前的 users collection 結構對齊) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoadingUser(true);
      try {
        if (!currentUser) {
          setUser(VISITOR_USER);
          return;
        }

        if (currentUser.isAnonymous) {
          setUser(VISITOR_USER);
          return;
        }

        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        let userData = userSnap.data();

        if (!userData) {
          userData = {
            uid: currentUser.uid,
            displayName: currentUser.displayName || '匿名玩家',
            email: currentUser.email,
            photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/ghost/svg?seed=${currentUser.uid}`,
            flakeCount: 0,
            isBanned: false,
            nameChangedCount: 0,
            communityNickname: '',
            isVisitor: false,
            lastSeen: new Date(),
          };
          await setDoc(userRef, userData, { merge: true });
        } else {
          await setDoc(
            userRef,
            {
              displayName: userData.displayName || currentUser.displayName || '匿名玩家',
              photoURL: userData.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/ghost/svg?seed=${currentUser.uid}`,
              email: currentUser.email,
              lastSeen: new Date(),
              nameChangedCount: userData.nameChangedCount || 0,
              flakeCount: userData.flakeCount || 0,
              isBanned: !!userData.isBanned,
              communityNickname: userData.communityNickname || '',
              isVisitor: false,
            },
            { merge: true }
          );
        }

        const normalizedDisplayName =
          userData.communityNickname || userData.displayName || currentUser.displayName || '匿名玩家';

        setUser({
          ...userData,
          uid: currentUser.uid,
          email: currentUser.email || userData.email || '',
          photoURL:
            userData.photoURL ||
            currentUser.photoURL ||
            `https://api.dicebear.com/7.x/ghost/svg?seed=${currentUser.uid}`,
          displayName: normalizedDisplayName,
          communityNickname: userData.communityNickname || '',
          nameChangedCount: userData.nameChangedCount || 0,
          flakeCount: userData.flakeCount || 0,
          isBanned: !!userData.isBanned,
          isVisitor: false,
        });
      } catch (error) {
        console.error('Profile: Error fetching user data:', error);
        showToast('資料同步錯誤，部分功能可能受限', 'error');
      } finally {
        setLoadingUser(false);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEvents = async () => {
    try {
      const todayStr = formatDate(new Date());
      const q = query(
        collection(db, 'events'),
        where('date', '>=', todayStr),
        orderBy('date', 'asc'),
        orderBy('time', 'asc'),
        limit(200)
      );
      const querySnapshot = await getDocs(q);
      const newEvents = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEvents(newEvents);
    } catch (error) {
      console.error('Profile: Error fetching events:', error);
      showToast('載入活動失敗', 'error');
    }
  };

  const fetchWishes = async () => {
    try {
      const q = query(collection(db, 'wishes'), orderBy('createdAt', 'desc'), limit(200));
      const querySnapshot = await getDocs(q);
      const newWishes = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setWishes(newWishes);
    } catch (error) {
      console.error('Profile: Error fetching wishes:', error);
      showToast('載入許願失敗', 'error');
    }
  };

  useEffect(() => {
    // 未登入就不用拉資料（避免多餘讀取）
    if (user?.isVisitor) return;
    fetchEvents();
    fetchWishes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, user?.isVisitor]);

  const myWishes = useMemo(() => {
    if (!user || user.isVisitor) return [];
    return wishes.filter((w) => w.wishedBy?.includes(user.uid));
  }, [wishes, user]);

  const myEventBuckets = useMemo(() => {
    if (!user || user.isVisitor) {
      return { joined: [], waitlisted: [], pending: [] };
    }
    const joined = [];
    const waitlisted = [];
    const pending = [];
    for (const ev of events) {
      if (Array.isArray(ev.participants) && ev.participants.includes(user.uid)) joined.push(ev);
      if (Array.isArray(ev.waitlist) && ev.waitlist.includes(user.uid)) waitlisted.push(ev);
      const pendingApprovals = Array.isArray(ev.pendingApprovals) ? ev.pendingApprovals : [];
      if (pendingApprovals.some((req) => req?.uid === user.uid)) pending.push(ev);
    }
    return { joined, waitlisted, pending };
  }, [events, user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('登入成功！', 'success');
    } catch (error) {
      console.error('Profile: Login failed', error);
      showToast(`登入失敗：${error?.message || '未知錯誤'}`, 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast('已登出', 'success');
    } catch (error) {
      console.error('Profile: Logout failed', error);
      showToast('登出失敗', 'error');
    }
  };

  const handleUpdateDisplayNameOnce = async () => {
    if (!user || user.isVisitor) return;
    const nextName = profileName.trim();
    if (!nextName) return;

    if ((user.nameChangedCount || 0) >= 1) {
      showToast('您已經修改過一次暱稱，無法再次修改', 'error');
      setIsEditingProfile(false);
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: nextName,
        nameChangedCount: (user.nameChangedCount || 0) + 1,
      });

      // 同步 Firebase Auth，避免 AppLayout 顯示舊名字
      if (auth.currentUser) {
        try {
          await updateFirebaseProfile(auth.currentUser, { displayName: nextName });
        } catch (e) {
          // 不阻擋主流程（Firebase Auth 可能被停用或權限限制）
          console.warn('Profile: update firebase auth displayName failed', e);
        }
      }

      setUser((prev) => ({
        ...prev,
        displayName: nextName,
        nameChangedCount: (prev.nameChangedCount || 0) + 1,
      }));
      setIsEditingProfile(false);
      showToast('暱稱已更新', 'success');
    } catch (error) {
      console.error('Profile: Update displayName failed', error);
      showToast('更新失敗', 'error');
    }
  };


  const handleCancelWish = async (wishId) => {
    if (!user || user.isVisitor) return;
    const wish = wishes.find((w) => w.id === wishId);
    if (!wish) return;

    if (!confirm(wish.hostUid === user.uid ? '確定要刪除這個許願嗎？' : '確定要取消許願嗎？')) return;

    try {
      if (wish.hostUid === user.uid) {
        await deleteDoc(doc(db, 'wishes', wishId));
        showToast('許願已刪除', 'success');
      } else {
        await updateDoc(doc(db, 'wishes', wishId), {
          wishedBy: arrayRemove(user.uid),
          wishCount: (wish.wishCount || 1) - 1,
        });
        showToast('已取消許願', 'success');
      }
      fetchWishes();
    } catch (error) {
      console.error('Profile: Error cancelling wish:', error);
      showToast('操作失敗', 'error');
    }
  };

  const handleShareWish = (wish) => {
    const url = new URL(window.location.origin + '/lobby');
    url.searchParams.set('wishId', wish.id);
    const text = `我正在許願 ${wish.title} 團 如果有興趣的人歡迎點選下面連結集氣!\n\n${url.toString()}`;
    navigator.clipboard
      .writeText(text)
      .then(() => showToast('連結已複製，快去邀請朋友集氣！', 'success'))
      .catch((err) => {
        console.error('Profile: Failed to copy', err);
        showToast('複製失敗', 'error');
      });
  };

  const handleViewWishMembers = async (wish) => {
    if (!wish.wishedBy || wish.wishedBy.length === 0) {
      setWishMembersModal({ show: true, wishId: wish.id, members: [] });
      return;
    }
    try {
      const memberPromises = wish.wishedBy.map((uid) => getDoc(doc(db, 'users', uid)));
      const memberSnaps = await Promise.all(memberPromises);
      const members = memberSnaps.map((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          return {
            uid: snap.id,
            displayName: data.communityNickname || data.displayName || '未命名玩家',
            photoURL: data.photoURL || '',
          };
        }
        return { uid: 'unknown', displayName: '未知玩家', photoURL: '' };
      });
      setWishMembersModal({ show: true, wishId: wish.id, members });
    } catch (error) {
      console.error('Profile: Error fetching wish members:', error);
      showToast('無法載入成員名單', 'error');
    }
  };

  const openEditEventModal = (ev) => {
    if (!ev) return;
    if (ev.isChainEvent) {
      showToast('連刷舊團目前僅供檢視，無法在此編輯', 'info');
      return;
    }
    setEditEventForm({
      title: ev.title || '',
      studio: ev.studio || '',
      region: ev.region || '北部',
      category: ev.category || '密室逃脫',
      type: ev.type || '恐怖驚悚',
      date: ev.date || '',
      time: ev.time || '',
      price: String(ev.price ?? ''),
      priceFull: String(ev.priceFull ?? ''),
      totalSlots: String(ev.totalSlots ?? ''),
      location: ev.location || '',
      website: ev.website || '',
      description: ev.description || '',
      teammateNote: ev.teammateNote || '',
      contactLineId: ev.contactLineId || '',
      meetingTime: String(ev.meetingTime ?? '15'),
      duration: String(ev.duration ?? '120'),
      minPlayers: String(ev.minPlayers ?? '4'),
      builtInPlayers: String(ev.builtInPlayers ?? ''),
    });
    setEditEventModal({ show: true, eventId: ev.id });
  };

  const closeEditEventModal = () => {
    setEditEventModal({ show: false, eventId: null });
  };

  const handleSaveEventEdit = async () => {
    if (!user || user.isVisitor) return;
    const eventId = editEventModal.eventId;
    if (!eventId) return;

    const snap = await getDoc(doc(db, 'events', eventId));
    if (!snap.exists()) {
      showToast('找不到此活動，可能已被刪除', 'error');
      closeEditEventModal();
      fetchEvents();
      return;
    }
    const ev = { id: snap.id, ...snap.data() };
    if (ev.hostUid !== user.uid) {
      showToast('您沒有權限編輯此活動', 'error');
      closeEditEventModal();
      return;
    }
    if (ev.isChainEvent) {
      showToast('連刷舊團目前僅供檢視，無法在此編輯', 'info');
      closeEditEventModal();
      return;
    }

    const title = editEventForm.title.trim();
    const studio = editEventForm.studio.trim();
    const location = editEventForm.location.trim();
    const date = editEventForm.date;
    const time = editEventForm.time;
    const totalSlots = Number(editEventForm.totalSlots);
    const price = Number(editEventForm.price);
    const priceFull = editEventForm.priceFull === '' ? price : Number(editEventForm.priceFull);
    const builtInRaw = Number(editEventForm.builtInPlayers);
    const builtInPlayers = Number.isFinite(builtInRaw) ? Math.max(0, Math.floor(builtInRaw)) : 0;

    if (!title || !studio || !location || !date || !time) {
      showToast('請填寫必填欄位', 'error');
      return;
    }
    if (!Number.isFinite(totalSlots) || totalSlots < 2) {
      showToast('總人數需為 2 以上', 'error');
      return;
    }
    const currentSlots = Number(ev.currentSlots || 0);
    if (Number.isFinite(currentSlots) && totalSlots < currentSlots) {
      showToast(`總人數不可小於目前人數 (${currentSlots})`, 'error');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      showToast('費用需為 0 或正整數', 'error');
      return;
    }
    if (price > 999999) {
      showToast('費用最高為 999999，請重新輸入', 'error');
      return;
    }
    if (!Number.isFinite(priceFull) || priceFull < 0) {
      showToast('滿團優惠價需為 0 或正整數', 'error');
      return;
    }
    if (priceFull > 999999) {
      showToast('滿團優惠價最高為 999999，請重新輸入', 'error');
      return;
    }
    if (builtInPlayers >= totalSlots) {
      showToast('內建人數需小於總人數，且不可為負', 'error');
      return;
    }

    try {
      await updateDoc(doc(db, 'events', eventId), {
        title,
        studio,
        region: editEventForm.region,
        category: editEventForm.category,
        type: editEventForm.type,
        date,
        time,
        price,
        priceFull,
        totalSlots,
        location,
        website: editEventForm.website.trim(),
        description: editEventForm.description.trim(),
        teammateNote: editEventForm.teammateNote.trim(),
        contactLineId: editEventForm.contactLineId.trim(),
        meetingTime: Number(editEventForm.meetingTime) || 15,
        duration: Number(editEventForm.duration) || 120,
        minPlayers: Number(editEventForm.minPlayers) || 4,
        builtInPlayers,
      });
      showToast('活動已更新', 'success');
      closeEditEventModal();
      fetchEvents();
    } catch (error) {
      console.error('Profile: update event failed', error);
      showToast('更新失敗', 'error');
    }
  };

  // --- 我的活動操作（補回：關團刪除 / 取消候補 / 取消審核申請 / 退出揪團(跳車)） ---
  const handleDeleteEvent = async (eventId) => {
    if (!user || user.isVisitor) return;
    const target = events.find((e) => e.id === eventId);
    if (!target) return;
    if (target.hostUid !== user.uid) {
      showToast('您沒有權限刪除此活動', 'error');
      return;
    }
    if (target.isChainEvent) {
      showToast('連刷舊團目前僅供檢視，無法在此操作', 'info');
      return;
    }
    if (!confirm('確定要刪除這個揪團嗎？此操作無法復原。')) return;

    try {
      // 與 LobbyPage 對齊：先備份至 archived_events，再刪除 events
      await setDoc(doc(db, 'archived_events', eventId), {
        ...target,
        hostUid: target.hostUid || user.uid,
        archivedAt: new Date(),
        finalParticipants: target.participants || [],
        finalWaitlist: target.waitlist || [],
      });
      await deleteDoc(doc(db, 'events', eventId));
      showToast('揪團已刪除並封存', 'success');
      fetchEvents();
    } catch (error) {
      console.error('Profile: delete event failed', error);
      showToast('刪除失敗', 'error');
    }
  };

  const handleCancelWaitlist = async (eventId) => {
    if (!user || user.isVisitor) return;
    try {
      await updateDoc(doc(db, 'events', eventId), { waitlist: arrayRemove(user.uid) });
      showToast('已取消候補申請', 'success');
      fetchEvents();
    } catch (error) {
      console.error('Profile: cancel waitlist failed', error);
      showToast('操作失敗', 'error');
    }
  };

  const handleWithdrawPending = async (eventId) => {
    if (!user || user.isVisitor) return;
    try {
      const snap = await getDoc(doc(db, 'events', eventId));
      if (!snap.exists()) return;
      const data = snap.data();
      const pending = Array.isArray(data.pendingApprovals) ? [...data.pendingApprovals] : [];
      const updated = pending.filter((req) => req?.uid !== user.uid);
      await updateDoc(doc(db, 'events', eventId), { pendingApprovals: updated });
      showToast('已取消審核申請', 'success');
      fetchEvents();
    } catch (error) {
      console.error('Profile: withdraw pending failed', error);
      showToast('操作失敗', 'error');
    }
  };

  const handleLeaveEvent = async (eventId) => {
    if (!user || user.isVisitor) return;
    const target = events.find((e) => e.id === eventId);
    if (!target) return;
    if (target.hostUid === user.uid) {
      showToast('主揪請使用刪除按鈕關團，無法自行跳車', 'info');
      return;
    }
    if (!confirm(`確定要退出此揪團嗎？\n\n這將會增加您的跳車次數 (${(user.flakeCount || 0) + 1})。`)) return;

    try {
      // 讀取最新資料避免 race condition
      const snap = await getDoc(doc(db, 'events', eventId));
      if (!snap.exists()) return;
      const ev = { id: snap.id, ...snap.data() };
      const isStillParticipant = Array.isArray(ev.participants) && ev.participants.includes(user.uid);
      if (!isStillParticipant) {
        showToast('您已不在此揪團，無需重複退出', 'info');
        fetchEvents();
        return;
      }

      // 1) 更新 user flakeCount（與 LobbyPage 對齊：>=3 直接凍結）
      const newFlakeCount = (user.flakeCount || 0) + 1;
      await updateDoc(doc(db, 'users', user.uid), {
        flakeCount: newFlakeCount,
        isBanned: newFlakeCount >= 3,
      });
      setUser((prev) => ({ ...prev, flakeCount: newFlakeCount, isBanned: newFlakeCount >= 3 }));

      // 2) 移除本人與攜伴、釋放名額、解除滿團狀態
      const userGuests = (ev.guests || []).filter((g) => g?.addedByUid === user.uid);
      const remainingGuests = (ev.guests || []).filter((g) => g?.addedByUid !== user.uid);
      const remainingNotices = (ev.guestRemovalNotices || []).filter((n) => n?.ownerUid !== user.uid);
      const slotsToRelease = 1 + userGuests.length;
      const newSlots = (ev.currentSlots || 0) - slotsToRelease;

      await updateDoc(doc(db, 'events', eventId), {
        participants: arrayRemove(user.uid),
        guests: remainingGuests,
        guestRemovalNotices: remainingNotices,
        currentSlots: newSlots < 0 ? 0 : newSlots,
        isFull: false,
      });

      showToast(newFlakeCount >= 3 ? '跳車次數過多，帳號已凍結' : '已取消報名 (跳車+1)', 'error');
      fetchEvents();
    } catch (error) {
      console.error('Profile: leave event failed', error);
      showToast('操作失敗', 'error');
    }
  };

  const totalEventCount = myEventBuckets.joined.length + myEventBuckets.waitlisted.length;
  const hostPendingEvents = useMemo(() => {
    if (!user || user.isVisitor) return [];
    return events
      .filter((ev) => ev.hostUid === user.uid)
      .filter((ev) => Array.isArray(ev.pendingApprovals) && ev.pendingApprovals.length > 0);
  }, [events, user]);

  const hostWishNotifications = useMemo(() => {
    if (!user || user.isVisitor) return [];
    return wishes
      .filter((w) => w.hostUid === user.uid)
      .filter((w) => (w.wishCount || 0) > 1 || ((w.targetCount || 0) > 0 && (w.wishCount || 0) >= (w.targetCount || 0)))
      .sort((a, b) => (b.wishCount || 0) - (a.wishCount || 0));
  }, [wishes, user]);

  return (
    <div className="py-4 space-y-6">
      {/* Toast */}
      {notification.show && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-bold ${
              notification.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : notification.type === 'info'
                  ? 'bg-[#EBE3D7] text-[#212121] border-[#D1C7BB]'
                  : 'bg-[#FFE4B5] text-[#212121] border-[#FF8C00]/30'
            }`}
          >
            {notification.msg}
          </div>
        </div>
      )}

      {/* Wish members modal */}
      {wishMembersModal.show && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[#EBE3D7] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#EBE3D7]">
              <div className="font-bold text-[#212121]">許願成員</div>
              <button
                onClick={() => setWishMembersModal({ show: false, wishId: null, members: [] })}
                className="p-2 rounded-lg hover:bg-[#EBE3D7]"
              >
                <X size={18} className="text-[#7A7A7A]" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {wishMembersModal.members.length === 0 ? (
                <div className="text-sm text-[#7A7A7A] text-center py-10">目前還沒有成員</div>
              ) : (
                wishMembersModal.members.map((m) => (
                  <div key={m.uid} className="flex items-center gap-3 p-3 bg-[#F7F4EF] rounded-xl border border-[#EBE3D7]">
                    {m.photoURL ? (
                      <img
                        src={m.photoURL}
                        alt={m.displayName}
                        className="w-10 h-10 rounded-full border border-[#D1C7BB] object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full border border-[#D1C7BB] bg-[#EBE3D7]" />
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-[#212121] truncate">{m.displayName}</div>
                      <div className="text-xs text-[#7A7A7A] truncate">{m.uid}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editEventModal.show && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
          onClick={closeEditEventModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full md:max-w-3xl bg-white rounded-t-2xl md:rounded-2xl border border-[#EBE3D7] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[85dvh] md:max-h-[85vh] overflow-y-auto overscroll-contain p-5 md:p-8 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="text-xs text-[#7A7A7A] font-bold uppercase tracking-widest">編輯揪團</div>
                  <div className="text-xl font-bold text-[#212121] mt-1">更新活動資訊</div>
                </div>
                <button
                  type="button"
                  onClick={closeEditEventModal}
                  className="p-2 rounded-xl bg-[#EBE3D7] text-[#7A7A7A] hover:bg-[#D1C7BB] hover:text-[#212121] transition-all"
                  aria-label="關閉"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-sm text-[#7A7A7A] font-medium">活動分類 *</label>
                  <select
                    className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] outline-none focus:border-[#FF8C00]"
                    value={editEventForm.category}
                    onChange={(e) => setEditEventForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    {['密室逃脫', '劇本殺', 'TRPG', '桌遊'].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-sm text-[#7A7A7A] font-medium">所在地區 *</label>
                  <select
                    className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] outline-none focus:border-[#FF8C00]"
                    value={editEventForm.region}
                    onChange={(e) => setEditEventForm((p) => ({ ...p, region: e.target.value }))}
                  >
                    {['北部', '中部', '南部', '東部', '離島'].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-sm text-[#7A7A7A] font-medium">主題名稱 *</label>
                  <input
                    className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] outline-none focus:border-[#FF8C00]"
                    value={editEventForm.title}
                    onChange={(e) => setEditEventForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-sm text-[#7A7A7A] font-medium">密室類型 *</label>
                  <select
                    className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] outline-none focus:border-[#FF8C00]"
                    value={editEventForm.type}
                    onChange={(e) => setEditEventForm((p) => ({ ...p, type: e.target.value }))}
                  >
                    {['恐怖驚悚', '機關冒險', '劇情沉浸', '推理懸疑', '歡樂新手'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm text-[#7A7A7A] font-medium">工作室 *</label>
                  <input
                    className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] outline-none focus:border-[#FF8C00]"
                    value={editEventForm.studio}
                    onChange={(e) => setEditEventForm((p) => ({ ...p, studio: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm text-[#7A7A7A] font-medium">完整地址 / Google Maps *</label>
                  <input
                    className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] outline-none focus:border-[#FF8C00]"
                    value={editEventForm.location}
                    onChange={(e) => setEditEventForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="可貼上 Google Maps 或輸入完整地址"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-sm text-[#7A7A7A] font-medium">日期 *</label>
                  <input
                    type="date"
                    className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] outline-none focus:border-[#FF8C00]"
                    style={{ colorScheme: 'light' }}
                    value={editEventForm.date}
                    onChange={(e) => setEditEventForm((p) => ({ ...p, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-sm text-[#7A7A7A] font-medium">時間 *</label>
                  <input
                    type="time"
                    className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] outline-none focus:border-[#FF8C00]"
                    style={{ colorScheme: 'light' }}
                    value={editEventForm.time}
                    onChange={(e) => setEditEventForm((p) => ({ ...p, time: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-sm text-[#7A7A7A] font-medium">未滿團/基本價（每人）*</label>
                  <input
                    type="number"
                    min="0"
                    max="999999"
                    step="1"
                    className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] outline-none focus:border-[#FF8C00]"
                    value={editEventForm.price}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (Number(value) >= 0 && Number(value) <= 999999)) {
                        setEditEventForm((p) => ({ ...p, price: value }));
                      }
                    }}
                  />
                </div>
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-sm text-[#7A7A7A] font-medium">滿團優惠價（選填）</label>
                  <input
                    type="number"
                    min="0"
                    max="999999"
                    step="1"
                    className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] outline-none focus:border-[#FF8C00]"
                    value={editEventForm.priceFull}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (Number(value) >= 0 && Number(value) <= 999999)) {
                        setEditEventForm((p) => ({ ...p, priceFull: value }));
                      }
                    }}
                  />
                </div>

                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-sm text-[#7A7A7A] font-medium">總人數 *</label>
                  <input
                    type="number"
                    min="2"
                    step="1"
                    className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] outline-none focus:border-[#FF8C00]"
                    value={editEventForm.totalSlots}
                    onChange={(e) => setEditEventForm((p) => ({ ...p, totalSlots: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-sm text-[#7A7A7A] font-medium">內建人數（選填）</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] outline-none focus:border-[#FF8C00]"
                    value={editEventForm.builtInPlayers}
                    onChange={(e) => setEditEventForm((p) => ({ ...p, builtInPlayers: e.target.value }))}
                    placeholder="已有隊友人數"
                  />
                  <p className="text-xs text-[#B1977A]">系統會預留位置，並於列表顯示主揪已佔位置人數。</p>
                </div>
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-sm text-[#7A7A7A] font-medium">主揪社群名稱（參加後可見）</label>
                  <input
                    className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] outline-none focus:border-[#FF8C00]"
                    value={editEventForm.contactLineId}
                    onChange={(e) => setEditEventForm((p) => ({ ...p, contactLineId: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm text-[#7A7A7A] font-medium">官網連結（選填）</label>
                  <input
                    type="url"
                    className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] outline-none focus:border-[#FF8C00]"
                    value={editEventForm.website}
                    onChange={(e) => setEditEventForm((p) => ({ ...p, website: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm text-[#7A7A7A] font-medium">活動簡介（選填，最多 50 字）</label>
                  <textarea
                    maxLength={50}
                    className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] outline-none focus:border-[#FF8C00] h-20 resize-none"
                    value={editEventForm.description}
                    onChange={(e) => setEditEventForm((p) => ({ ...p, description: e.target.value }))}
                  />
                  <div className="text-xs text-[#7A7A7A] text-right">{editEventForm.description.length}/50</div>
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm text-[#7A7A7A] font-medium">主揪備註（選填）</label>
                  <input
                    className="w-full bg-white border border-[#EBE3D7] rounded-xl px-4 py-3 text-[#212121] outline-none focus:border-[#FF8C00]"
                    value={editEventForm.teammateNote}
                    onChange={(e) => setEditEventForm((p) => ({ ...p, teammateNote: e.target.value }))}
                  />
                </div>

                <div className="col-span-2 pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleSaveEventEdit}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FF8C00] text-white rounded-xl text-sm font-bold hover:bg-[#FFA500] transition-all shadow-md"
                  >
                    <Check size={18} />
                    儲存變更
                  </button>
                  <button
                    type="button"
                    onClick={closeEditEventModal}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#EBE3D7] text-[#212121] rounded-xl text-sm font-bold border border-[#D1C7BB] hover:bg-[#D1C7BB] transition-all"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="bg-white rounded-2xl p-6 border border-[#EBE3D7] text-center relative overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF8C00] to-[#FFA500]" />

        <div className="flex items-center justify-center mb-6">
          <div className="w-24 h-24 bg-[#EBE3D7] rounded-full flex items-center justify-center border-3 border-[#D1C7BB] relative overflow-hidden shadow-inner">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#EBE3D7] to-[#D1C7BB]" />
            )}
          </div>
        </div>

        {loadingUser ? (
          <div className="text-sm text-[#7A7A7A] py-8">載入中...</div>
        ) : user?.isVisitor ? (
          <div className="space-y-6 py-4">
            <h2 className="text-2xl font-bold text-[#212121]">尚未登入</h2>
            <p className="text-sm text-[#7A7A7A] leading-relaxed">登入後即可查看我的活動、我的許願與修改暱稱。</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={handleLogin}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#212121] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md"
              >
                <LogIn size={18} />
                Google 登入
              </button>
              <Link
                href="/lobby"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#EBE3D7] text-[#212121] rounded-xl text-sm font-bold border-2 border-[#D1C7BB] hover:bg-[#D1C7BB] transition-all"
              >
                去大廳看看
                <ExternalLink size={18} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 名稱編輯區塊 */}
            <div className="relative">
              {isEditingProfile ? (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="text-xs text-[#FF8C00] font-medium bg-[#FFE4B5]/50 px-3 py-1 rounded-full border border-[#FF8C00]/30">
                      ⚠️ 注意：暱稱只能修改一次
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateDisplayNameOnce();
                        } else if (e.key === 'Escape') {
                          setIsEditingProfile(false);
                          setProfileName(user.displayName || '');
                        }
                      }}
                      autoFocus
                      className="flex-1 bg-[#F7F4EF] text-[#212121] text-center font-bold text-xl px-4 py-3 rounded-xl border-2 border-[#D1C7BB] outline-none focus:border-[#FF8C00] transition-colors"
                      placeholder="輸入新暱稱"
                    />
                    <button
                      onClick={handleUpdateDisplayNameOnce}
                      className="p-3 bg-[#FF8C00] text-white rounded-xl hover:bg-[#FFA500] transition-all shadow-md"
                      title="確認修改"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingProfile(false);
                        setProfileName(user.displayName || '');
                      }}
                      className="p-3 bg-[#EBE3D7] text-[#7A7A7A] rounded-xl hover:bg-[#D1C7BB] transition-all"
                      title="取消"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <h2
                    onClick={() => {
                      if ((user.nameChangedCount || 0) >= 1) {
                        showToast('您已經修改過一次暱稱，無法再次修改', 'error');
                        return;
                      }
                      setProfileName(user.displayName || '');
                      setIsEditingProfile(true);
                    }}
                    className={`text-2xl font-bold text-[#212121] cursor-pointer hover:text-[#FF8C00] transition-colors ${
                      (user.nameChangedCount || 0) >= 1 ? 'cursor-default hover:text-[#212121]' : ''
                    }`}
                  >
                    {user.displayName}
                  </h2>
                  {(user.nameChangedCount || 0) < 1 && (
                    <button
                      onClick={() => {
                        setProfileName(user.displayName || '');
                        setIsEditingProfile(true);
                      }}
                      className="p-2 text-[#7A7A7A] hover:text-[#FF8C00] hover:bg-[#FFE4B5]/30 rounded-lg transition-all"
                      title="編輯暱稱"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 統計資訊 */}
            <div className="flex justify-center gap-6 py-2">
              <div className="flex flex-col items-center">
                <span className="font-bold text-[#212121] text-2xl">{totalEventCount}</span>
                <span className="text-xs text-[#7A7A7A] mt-1">活動/候補</span>
              </div>
              <div className="w-px bg-[#D1C7BB] h-12" />
              <div className="flex flex-col items-center">
                <span className={`font-bold text-2xl ${user.flakeCount > 0 ? 'text-[#E74C3C]' : 'text-[#FF8C00]'}`}>
                  {user.flakeCount || 0}
                </span>
                <span className="text-xs text-[#7A7A7A] mt-1">跳車</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 主揪審核（待處理） */}
      {!user?.isVisitor && hostPendingEvents.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-[#EBE3D7] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#212121]">主揪審核</h3>
            <div className="text-xs font-bold text-[#FF8C00] bg-[#FFE4B5]/60 border border-[#FF8C00]/30 px-3 py-1 rounded-full">
              待審核 {hostPendingEvents.reduce((sum, ev) => sum + (ev.pendingApprovals?.length || 0), 0)} 人
            </div>
          </div>
          <div className="space-y-3">
            {hostPendingEvents.slice(0, 5).map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-2xl border border-[#EBE3D7] bg-[#F7F4EF] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-bold text-[#212121] truncate">{ev.title}</div>
                  <div className="text-xs text-[#7A7A7A] mt-1 truncate">
                    {ev.date} {ev.time} · 待審核 {ev.pendingApprovals?.length || 0} 人
                  </div>
                </div>
                <Link
                  href={`/lobby?eventId=${encodeURIComponent(ev.id)}&manage=true`}
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-[#FF8C00] text-white rounded-xl text-sm font-bold hover:bg-[#FFA500] transition-all shadow-md"
                  title="前往審核"
                >
                  前往審核
                  <ExternalLink size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 集氣通知（我的許願被集氣） */}
      {!user?.isVisitor && hostWishNotifications.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-[#EBE3D7] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#212121]">集氣通知</h3>
            <div className="text-xs font-bold text-[#7A7A7A] bg-[#EBE3D7] border border-[#D1C7BB] px-3 py-1 rounded-full">
              {hostWishNotifications.length} 則
            </div>
          </div>
          <div className="space-y-3">
            {hostWishNotifications.slice(0, 6).map((wish) => {
              const currentCount = wish.wishCount || 1;
              const targetCount = wish.targetCount || 4;
              const isFull = currentCount >= targetCount;
              return (
                <div
                  key={wish.id}
                  className="p-4 rounded-2xl border border-[#EBE3D7] bg-[#F7F4EF] flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-bold text-[#212121] truncate">{wish.title}</div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          isFull
                            ? 'bg-[#FFE4B5]/60 text-[#FF8C00] border-[#FF8C00]/30'
                            : 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                        }`}
                      >
                        {currentCount}/{targetCount}
                      </span>
                      {isFull && (
                        <span className="text-xs font-bold bg-emerald-500/10 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          可開團
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#7A7A7A] mt-1 truncate">
                      {wish.studio} · {wish.region}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewWishMembers(wish)}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-[#EBE3D7] text-[#212121] rounded-xl text-sm font-bold border border-[#D1C7BB] hover:bg-[#D1C7BB] transition-all"
                      title="查看集氣成員"
                    >
                      <Users size={16} />
                    </button>
                    <Link
                      href={`/lobby?wishId=${encodeURIComponent(wish.id)}`}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-[#EBE3D7] text-[#212121] rounded-xl text-sm font-bold border border-[#D1C7BB] hover:bg-[#D1C7BB] transition-all"
                      title="前往許願池定位"
                    >
                      前往
                      <ExternalLink size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 我的活動（簡化：只顯示清單，避免把 lobby 的所有操作再複製一份） */}
      {!user?.isVisitor && (
        <div>
          <h3 className="text-xl font-bold text-[#212121] px-1 mb-4">我的活動</h3>
          {myEventBuckets.joined.length + myEventBuckets.waitlisted.length + myEventBuckets.pending.length === 0 ? (
            <div className="text-center py-12 text-[#7A7A7A] bg-[#F7F4EF] rounded-2xl border-2 border-[#EBE3D7] border-dashed">
              <div className="text-4xl mb-3">🎯</div>
              <div className="text-base font-medium mb-2">目前沒有任何行程</div>
              <div className="text-sm mb-4">快去大廳找團吧！</div>
              <Link
                href="/lobby"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF8C00] text-[#212121] rounded-xl text-sm font-bold hover:bg-[#FFA500] transition-all shadow-md"
              >
                前往大廳
                <ExternalLink size={18} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {[...myEventBuckets.pending, ...myEventBuckets.joined, ...myEventBuckets.waitlisted].map((ev) => {
                const isPending = myEventBuckets.pending.some((e) => e.id === ev.id);
                const isJoined = myEventBuckets.joined.some((e) => e.id === ev.id);
                const isWaitlisted = myEventBuckets.waitlisted.some((e) => e.id === ev.id);
                const locationLink = getMapsUrl(ev.location || '');
                const isHost = ev.hostUid === user.uid;

                return (
                  <div key={ev.id} className="bg-white rounded-3xl p-5 border border-[#EBE3D7] shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {isHost && (
                            <span className="text-xs font-bold bg-[#FF8C00]/10 text-[#FF8C00] px-2.5 py-1 rounded-lg border border-[#FF8C00]/20">
                              我主辦
                            </span>
                          )}
                          {isPending && (
                            <span className="text-xs font-bold bg-amber-500/10 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-500/20">
                              待審核
                            </span>
                          )}
                          {isJoined && (
                            <span className="text-xs font-bold bg-emerald-500/10 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                              已加入
                            </span>
                          )}
                          {isWaitlisted && (
                            <span className="text-xs font-bold bg-slate-500/10 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-500/20">
                              候補
                            </span>
                          )}
                          <span className="text-xs font-medium text-[#7A7A7A] px-2 py-1 bg-[#EBE3D7] rounded-lg">
                            {ev.region || '未填地區'}
                          </span>
                        </div>
                        <div className="text-lg font-bold text-[#212121] truncate">{ev.title}</div>
                        <div className="text-sm text-[#7A7A7A] mt-1">
                          {ev.date} {ev.time} · {ev.studio}
                        </div>
                        {locationLink && (
                          <a
                            href={locationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#FF8C00] hover:underline underline-offset-2 mt-1 inline-block"
                          >
                            查看地圖
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isHost && (
                          <button
                            type="button"
                            onClick={() => openEditEventModal(ev)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-[#FF8C00] text-white rounded-xl text-sm font-bold hover:bg-[#FFA500] transition-all shadow-md"
                            title="編輯揪團"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {isHost && !ev.isChainEvent && (
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-[#EBE3D7] text-[#7A7A7A] rounded-xl text-sm font-bold border border-[#D1C7BB] hover:bg-[#D1C7BB] hover:text-[#E74C3C] transition-all"
                            title="刪除揪團"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleWithdrawPending(ev.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-[#EBE3D7] text-[#7A7A7A] rounded-xl text-sm font-bold border border-[#D1C7BB] hover:bg-[#D1C7BB] transition-all"
                            title="取消審核申請"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        {isWaitlisted && (
                          <button
                            type="button"
                            onClick={() => handleCancelWaitlist(ev.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-[#EBE3D7] text-[#7A7A7A] rounded-xl text-sm font-bold border border-[#D1C7BB] hover:bg-[#D1C7BB] transition-all"
                            title="取消候補申請"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        {isJoined && !isHost && (
                          <button
                            type="button"
                            onClick={() => handleLeaveEvent(ev.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-[#EBE3D7] text-[#7A7A7A] rounded-xl text-sm font-bold border border-[#D1C7BB] hover:bg-[#D1C7BB] hover:text-[#E74C3C] transition-all"
                            title="退出此揪團 (跳車)"
                          >
                            <LogOut size={16} />
                          </button>
                        )}
                        <Link
                          href={`/lobby?eventId=${encodeURIComponent(ev.id)}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#EBE3D7] text-[#212121] rounded-xl text-sm font-bold border border-[#D1C7BB] hover:bg-[#D1C7BB] transition-all"
                          title="到大廳定位此活動"
                        >
                          前往
                          <ExternalLink size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 我的許願 */}
      {!user?.isVisitor && (
        <div>
          <h3 className="text-xl font-bold text-[#212121] px-1 mb-4">我的許願</h3>
          {myWishes.length === 0 ? (
            <div className="text-center py-12 text-[#7A7A7A] bg-[#F7F4EF] rounded-2xl border-2 border-[#EBE3D7] border-dashed mb-8">
              <div className="text-4xl mb-3">✨</div>
              <div className="text-base font-medium mb-2">尚未許願</div>
              <div className="text-sm">去許願池看看吧！</div>
            </div>
          ) : (
            myWishes.map((wish) => {
              const currentCount = wish.wishCount || 1;
              const targetCount = wish.targetCount || 4;
              const isFull = currentCount >= targetCount;
              const wishLocationLink = getMapsUrl(wish.location || '');

              return (
                <div
                  key={wish.id}
                  className="bg-white rounded-3xl p-5 border border-[#EBE3D7] mb-6 shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-purple-500 opacity-70" />

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 mr-2 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-bold bg-pink-500/10 text-pink-400 px-2.5 py-1 rounded-lg border border-pink-500/20">
                          許願中
                        </span>
                        {isFull && (
                          <span className="text-xs font-bold bg-[#FFE4B5]/20 text-[#FF8C00] px-2.5 py-1 rounded-lg border border-[#FF8C00]/30">
                            人數已滿，可開團！
                          </span>
                        )}
                        <span className="text-xs font-medium text-[#7A7A7A] px-2 py-1 bg-[#EBE3D7] rounded-lg">
                          {wish.region}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-[#212121] mb-1.5 leading-tight truncate">{wish.title}</h3>
                      <div className="text-sm font-medium text-[#7A7A7A] flex items-center">
                        <span className="truncate">
                          {wishLocationLink ? (
                            <a
                              href={wishLocationLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FF8C00] hover:underline underline-offset-2"
                            >
                              {wish.studio || '查看地圖'}
                            </a>
                          ) : (
                            wish.studio
                          )}
                        </span>
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
                        title={wish.hostUid === user.uid ? '刪除許願' : '取消許願'}
                      >
                        {wish.hostUid === user.uid ? <Trash2 size={16} /> : <LogOut size={16} />}
                      </button>
                    </div>
                  </div>

                  {wish.description && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-[#7A7A7A] mb-1">活動簡介</div>
                      <p className="text-sm text-[#212121] leading-relaxed whitespace-pre-wrap break-words">
                        {wish.description}
                      </p>
                    </div>
                  )}

                  {wish.hostNote && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-[#7A7A7A] mb-1">主揪備註</div>
                      <div className="text-sm text-[#212121] font-medium italic bg-[#F7F4EF] border border-[#EBE3D7] rounded-lg px-3 py-2 leading-relaxed whitespace-pre-wrap break-words">
                        {wish.hostNote}
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-1">
                    <div className="flex justify-between text-xs text-[#7A7A7A] mb-1">
                      <span>集氣進度</span>
                      <span className={isFull ? 'text-[#FF8C00] font-bold' : 'text-[#7A7A7A]'}>
                        {currentCount} / {targetCount} 人
                      </span>
                    </div>
                    <div className="w-full bg-[#EBE3D7] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-yellow-400' : 'bg-pink-500'}`}
                        style={{ width: `${Math.min((currentCount / targetCount) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}


