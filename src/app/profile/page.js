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
import { ExternalLink, LogIn, LogOut, Settings, Share2, Trash2, Users, X, Edit2, Check, XCircle } from 'lucide-react';
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

  const totalEventCount = myEventBuckets.joined.length + myEventBuckets.waitlisted.length;

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

                return (
                  <div key={ev.id} className="bg-white rounded-3xl p-5 border border-[#EBE3D7] shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
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

                      <Link
                        href={`/lobby?eventId=${encodeURIComponent(ev.id)}`}
                        className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-[#EBE3D7] text-[#212121] rounded-xl text-sm font-bold border border-[#D1C7BB]"
                        title="到大廳定位此活動"
                      >
                        前往
                        <ExternalLink size={16} />
                      </Link>
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


