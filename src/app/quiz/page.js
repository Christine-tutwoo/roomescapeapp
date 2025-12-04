'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, RefreshCcw, Share2 } from 'lucide-react';

const ROLE_KEYS = ['tank', 'brain', 'sherlock', 'hamster', 'mascot'];

const QUIZ_ATTRIBUTES = [
  { key: 'courage', name: '膽量', color: '#f97316' },
  { key: 'leadership', name: '領導', color: '#facc15' },
  { key: 'logic', name: '邏輯', color: '#38bdf8' },
  { key: 'observation', name: '觀察', color: '#34d399' },
  { key: 'teamwork', name: '團隊', color: '#c084fc' },
  { key: 'humor', name: '歡樂', color: '#fb7185' }
];

const QUIZ_CHARACTERS = [
  {
    id: 'tank',
    name: '破陣坦克',
    title: 'The Tank',
    emoji: '🛡️',
    slogan: '別怕，躲我後面！',
    description:
      '你是團隊的安全感來源！當燈光熄滅、鬼怪衝出來時，你總是擋在最前面。你未必最會解數學題，但你的決策力與勇氣是團隊能繼續前進的關鍵。',
    bestMatchName: '極致倉鼠',
    enemyName: '解謎大腦',
    gradient: 'from-amber-500 to-orange-600'
  },
  {
    id: 'brain',
    name: '解謎大腦',
    title: 'The Mastermind',
    emoji: '🧠',
    slogan: '安靜！給我三秒鐘。',
    description:
      '你是密室裡的 CPU！面對滿牆的數字與符號，別人看到的是亂碼，你看到的是答案。卡關時大家都會用崇拜的眼神看向你，你是通關的希望。',
    bestMatchName: '鷹眼搜查官',
    enemyName: '暴力解鎖王',
    gradient: 'from-blue-600 to-indigo-700'
  },
  {
    id: 'sherlock',
    name: '鷹眼搜查官',
    title: 'The Sherlock',
    emoji: '🔍',
    slogan: '這裡怎麼有一把鑰匙？',
    description:
      '如果沒有你，大腦再強也沒用，因為線索都是你找到的。你擁有「翻箱倒櫃」的執照，總能從地毯下、夾層裡摸出關鍵道具，是最被低估的 MVP。',
    bestMatchName: '解謎大腦',
    enemyName: '佛系吉祥物',
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'hamster',
    name: '極致倉鼠',
    title: 'The Hamster',
    emoji: '🐹',
    slogan: '啊啊啊啊啊啊啊！！！',
    description:
      '你的尖叫聲比鬼還恐怖！你把密室玩成了極限體能王，整場都在深蹲與折返跑。雖然解謎貢獻不高，但你提供無可取代的情緒價值。',
    bestMatchName: '破陣坦克',
    enemyName: '工作人員',
    gradient: 'from-pink-500 to-rose-500'
  },
  {
    id: 'mascot',
    name: '佛系吉祥物',
    title: 'The Mascot',
    emoji: '🧸',
    slogan: '我是誰？我在哪？隊友真棒。',
    description:
      '你是密室裡的氣氛組。當大家為謎題焦頭爛額時，你總是用超然的態度面對。你負責黏在強者後面，也負責在最後合照站 C 位。',
    bestMatchName: '破陣坦克',
    enemyName: '解謎大腦',
    gradient: 'from-purple-500 to-fuchsia-500'
  },
  {
    id: 'ace',
    name: '六邊形戰士',
    title: 'The Ace',
    emoji: '🌟',
    slogan: '你們退後，我來處理。',
    description:
      '你是密室裡的傳說生物！既能當坦克擋鬼，又能解開最難的邏輯題，還能找到藏在天花板的鑰匙。你一個人就抵過一支隊伍。',
    bestMatchName: '任何凡人隊友',
    enemyName: '時間限制',
    gradient: 'from-amber-400 to-rose-500'
  }
];

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: '朋友們揪了一場密室逃脫，在挑選主題時，你的態度通常是？',
    options: [
      { text: '「走啊！哪次不走！時間我來喬。」', scores: { tank: 1 } },
      { text: '「呃...很恐嗎？如果要玩我只能負責尖叫喔。」', scores: { hamster: 1 } },
      {
        text: '先去網路上查心得，確認謎題邏輯順不順，不要只是在那邊嚇人。',
        scores: { sherlock: 1 }
      },
      { text: '「好耶！我來揪那個誰誰誰，看他被嚇一定很好笑。」', scores: { mascot: 1 } }
    ]
  },
  {
    id: 2,
    question: '剛進入密室，眼罩拿下來的一瞬間，你會做什麼？',
    options: [
      { text: '大聲指揮：「大家先報一下自己手邊有什麼鎖！」', scores: { tank: 1 } },
      { text: '默默觀察牆上的符號與數字，開始思考關聯。', scores: { brain: 1 } },
      { text: '馬上開始翻箱倒櫃，摸任何可以移動的東西。', scores: { sherlock: 1 } },
      { text: '「我要黏在他後面！」抓住某個朋友，跟著他走就對了。', scores: { mascot: 1 } }
    ]
  },
  {
    id: 3,
    question: '隊伍卡關了，面對超複雜的圖像密碼鎖，你會？',
    options: [
      { text: '「我們換一題解！這題先跳過。」', scores: { tank: 1 } },
      { text: '「把剛才那個道具拿過來，我覺得跟這個顏色有關。」', scores: { brain: 1 } },
      { text: '繼續在房間角落摸索，看有沒有遺漏的線索紙條。', scores: { sherlock: 1 } },
      { text: '在旁邊幫大家加油，或拿手電筒負責照亮。', scores: { mascot: 1 } }
    ]
  },
  {
    id: 4,
    question: '突然燈光全滅，NPC 出現並靠近，你會？',
    options: [
      { text: '立刻站在最前面擋住隊友：「你們躲我後面！」', scores: { tank: 1 }, meta: { block: true } },
      { text: '冷靜貼牆蹲下，確認 NPC 動線以免被抓。', scores: { brain: 1 } },
      { text: '雖然害怕，還是在縫隙裡偷看 NPC 走位。', scores: { sherlock: 1 } },
      { text: '放聲尖叫，整個人縮成一團抱住別人腿。', scores: { hamster: 1 } }
    ]
  },
  {
    id: 5,
    question: '拿到一塊「奇怪的透明板子」但不知道怎麼用，你會？',
    options: [
      { text: '拿著板子直接去各種洞試，或問對講機求救。', scores: { tank: 1 } },
      { text: '思考剛才哪題缺這塊拼圖，檢查形狀吻合。', scores: { brain: 1 } },
      { text: '拿去對著燈光照，看有沒有隱藏字。', scores: { sherlock: 1 } },
      { text: '拿來當防身武器，順便問：「我們是不是快過關了？」', scores: { mascot: 1 } }
    ]
  },
  {
    id: 6,
    question: '需要一名隊員單獨鑽進狹窄通風管拿鑰匙，你會？',
    options: [
      { text: '「我來吧！你們都不敢的話。」', scores: { tank: 1 } },
      { text: '分析誰的身形最適合，提醒他注意事項。', scores: { brain: 1 } },
      { text: '在通風口拿手電筒照路，確認裡面安全。', scores: { sherlock: 1 } },
      { text: '「拜託不要選我！我在這裡幫你們把風！」', scores: { hamster: 1 } }
    ]
  },
  {
    id: 7,
    question: '最後一關只剩 3 分鐘，你會？',
    options: [
      { text: '快速分配工作：「你算那個，我來輸入！」', scores: { tank: 1 } },
      { text: '大腦全速運轉，拿紙筆瘋狂計算進入心流。', scores: { brain: 1 }, meta: { flow: true } },
      { text: '幫忙檢查大家輸入的密碼有沒有按錯，回報時間。', scores: { sherlock: 1 } },
      { text: '開始亂猜密碼，或已經準備好要失敗了。', scores: { mascot: 1 } }
    ]
  },
  {
    id: 8,
    question: '劇情大反轉，原來引導你們的聲音才是大壞蛋，你會？',
    options: [
      { text: '「我就知道！剛那個提示怪怪的。」', scores: { tank: 1 } },
      { text: '迅速回想劇情細節，把故事線串在一起。', scores: { brain: 1 } },
      { text: '不管劇情了，專注在逃脫流程。', scores: { sherlock: 1 } },
      { text: '「蛤？真的假的？我剛都沒在聽劇情耶！」', scores: { mascot: 1 } }
    ]
  },
  {
    id: 9,
    question: '遊戲結束正在講解劇情，你通常在做什麼？',
    options: [
      { text: '熱烈討論剛剛哪裡設計得超棒或不合理。', scores: { brain: 1 } },
      { text: '安靜聽講，現在才終於把所有謎題想通。', scores: { brain: 1 } },
      { text: '已經在看手機，找待會晚餐要吃什麼。', scores: { mascot: 1 } },
      { text: '跑去跟嚇你的 NPC 合照，或玩沒解完的道具。', scores: { sherlock: 1 } }
    ]
  },
  {
    id: 10,
    question: '最後合照時你會拿什麼手舉牌？',
    options: [
      { text: '「全場最罩」、「帶飛全場」、「智商在線」', scores: { tank: 1 } },
      { text: '「邏輯鬼才」、「CARRY」、「通靈王」', scores: { brain: 1 } },
      { text: '「好雷隊友」、「我是路人」、「我就廢」', scores: { mascot: 1 } },
      { text: '「人體尖叫雞」、「我是倉鼠」、「嚇到漏尿」', scores: { hamster: 1 } }
    ]
  }
];

const CHARACTER_COLORS = {
  tank: ['#f59e0b', '#ea580c'],
  brain: ['#3b82f6', '#4f46e5'],
  sherlock: ['#10b981', '#0d9488'],
  hamster: ['#ec4899', '#db2777'],
  mascot: ['#a855f7', '#7c3aed'],
  ace: ['#fcd34d', '#f472b6']
};

const drawRoundedRect = (ctx, x, y, width, height, radius, fill, stroke) => {
  const r = Math.min(radius, height / 2, width / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
};

const wrapLines = (ctx, text, maxWidth) => {
  if (!text) return [];
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const chars = Array.from(cleaned);
  const lines = [];
  let current = '';
  chars.forEach((char) => {
    const testLine = current + char;
    if (ctx.measureText(testLine).width > maxWidth && current) {
      lines.push(current);
      current = char === ' ' ? '' : char;
    } else {
      current = testLine;
    }
  });
  if (current) lines.push(current);
  return lines;
};

const drawRadarChart = (ctx, centerX, centerY, radius, scores) => {
  const axes = QUIZ_ATTRIBUTES.length;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
  [1, 0.75, 0.5, 0.25].forEach((scale) => {
    ctx.beginPath();
    QUIZ_ATTRIBUTES.forEach((_, idx) => {
      const angle = (Math.PI * 2 * idx) / axes - Math.PI / 2;
      const r = radius * scale;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  });

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  QUIZ_ATTRIBUTES.forEach((_, idx) => {
    const angle = (Math.PI * 2 * idx) / axes - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();
  });

  const maxScore = 10;
  const points = QUIZ_ATTRIBUTES.map((attr, idx) => {
    const angle = (Math.PI * 2 * idx) / axes - Math.PI / 2;
    const score = Math.min(scores[attr.key] || 0, maxScore);
    const r = (score / maxScore) * radius;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    };
  });

  ctx.beginPath();
  points.forEach((point, idx) => {
    if (idx === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.stroke();

  points.forEach((point, idx) => {
    ctx.beginPath();
    ctx.fillStyle = QUIZ_ATTRIBUTES[idx].color;
    ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  QUIZ_ATTRIBUTES.forEach((attr, idx) => {
    const angle = (Math.PI * 2 * idx) / axes - Math.PI / 2;
    const labelR = radius + 28;
    const x = centerX + labelR * Math.cos(angle);
    const y = centerY + labelR * Math.sin(angle);
    ctx.font = '28px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = attr.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(attr.name, x, y);
  });
};

const generateQuizResultImage = async (nickname, result) => {
  if (typeof document === 'undefined') {
    throw new Error('缺少瀏覽器環境');
  }
  if (!result?.character) {
    throw new Error('結果資料不完整');
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGradient.addColorStop(0, '#020617');
  bgGradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#c084fc';
  ctx.font = '42px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText('🎮 2025 密室玩家年度回顧', 80, 120);
  ctx.fillStyle = '#a5b4fc';
  ctx.font = '34px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText('× 角色人格測驗', 80, 170);

  const [colorStart, colorEnd] = CHARACTER_COLORS[result.character.id] || CHARACTER_COLORS.tank;
  const heroGradient = ctx.createLinearGradient(80, 220, 1000, 580);
  heroGradient.addColorStop(0, colorStart);
  heroGradient.addColorStop(1, colorEnd);
  drawRoundedRect(ctx, 80, 220, 920, 360, 42, heroGradient);

  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  drawRoundedRect(ctx, 80, 220, 920, 360, 42, null, 'rgba(255,255,255,0.2)');

  ctx.fillStyle = '#ffffff';
  ctx.font = '90px "Noto Color Emoji", "Segoe UI Emoji", sans-serif';
  ctx.fillText(result.character.emoji, 120, 360);

  ctx.font = '32px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(`${nickname} 的密室人格是`, 240, 320);

  ctx.font = '64px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(result.character.name, 240, 390);

  ctx.font = '30px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(`「${result.character.slogan}」`, 240, 440);

  ctx.font = '28px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  const descLines = wrapLines(ctx, result.character.description, 820);
  descLines.forEach((line, idx) => {
    ctx.fillText(line, 120, 500 + idx * 38);
  });

  drawRoundedRect(ctx, 80, 620, 920, 520, 36, 'rgba(15, 23, 42, 0.9)');
  ctx.fillStyle = '#ffffff';
  ctx.font = '36px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎯 屬性面板', canvas.width / 2, 680);

  drawRadarChart(ctx, canvas.width / 2, 900, 220, result.scores);

  drawRoundedRect(ctx, 80, 1170, 920, 260, 36, 'rgba(15, 23, 42, 0.9)');
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '36px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText('⚔️ 相生相剋', canvas.width / 2, 1230);

  ctx.font = '28px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillStyle = '#34d399';
  ctx.fillText('最佳隊友', canvas.width / 2 - 220, 1290);
  ctx.fillStyle = '#ffffff';
  ctx.font = '38px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText(result.character.bestMatchName, canvas.width / 2 - 220, 1340);

  ctx.fillStyle = '#f87171';
  ctx.font = '28px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText('天敵', canvas.width / 2 + 220, 1290);
  ctx.fillStyle = '#ffffff';
  ctx.font = '38px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText(result.character.enemyName, canvas.width / 2 + 220, 1340);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#cbd5f5';
  ctx.font = '30px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText('快來測測你是什麼類型的密室玩家！', 80, 1510);
  ctx.fillStyle = '#a5b4fc';
  ctx.font = '30px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  const quizUrl = typeof window !== 'undefined' ? `${window.location.origin}/quiz` : 'https://xiaomihu.tw/quiz';
  ctx.fillText(quizUrl, 80, 1555);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '28px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText('made by IG:hu._escaperoom', canvas.width / 2, 1820);

  return canvas;
};

const calculateQuizResult = (answers) => {
  const roleScores = ROLE_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
  let pickedBlock = false;
  let pickedFlow = false;

  Object.values(answers).forEach((answer) => {
    if (!answer) return;
    Object.entries(answer.scores || {}).forEach(([role, score]) => {
      if (roleScores[role] !== undefined) {
        roleScores[role] += Number(score) || 0;
      }
    });
    if (answer.meta?.block) pickedBlock = true;
    if (answer.meta?.flow) pickedFlow = true;
  });

  const isAce = (roleScores.tank >= 3 && roleScores.brain >= 3) || (pickedBlock && pickedFlow);
  const characterId = isAce
    ? 'ace'
    : ROLE_KEYS.reduce(
        (best, role) => (roleScores[role] > roleScores[best] ? role : best),
        ROLE_KEYS[0]
      );

  const character =
    QUIZ_CHARACTERS.find((c) => c.id === characterId) ||
    QUIZ_CHARACTERS.find((c) => c.id === 'mascot');

  const clampScore = (value) => Math.max(0, Math.min(10, Number(value) || 0));
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

const QuizPage = () => {
  const [quizStep, setQuizStep] = useState('intro');
  const [quizNickname, setQuizNickname] = useState('');
  const [quizCurrentQ, setQuizCurrentQ] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'info' });

  const progressPercent = useMemo(
    () => ((quizCurrentQ + 1) / QUIZ_QUESTIONS.length) * 100,
    [quizCurrentQ]
  );

  const showToast = (msg, type = 'info', duration = 2500) => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), duration);
  };

  const handleGenerateImage = async () => {
    if (!quizResult) return;
    if (!quizNickname.trim()) {
      showToast('請先輸入暱稱', 'error');
      return;
    }
    if (isGeneratingImage) return;
    setIsGeneratingImage(true);
    showToast('正在生成圖片...', 'info', 1500);
    try {
      const canvas = await generateQuizResultImage(quizNickname.trim(), quizResult);
      canvas.toBlob(async (blob) => {
        if (!blob) {
          showToast('圖片生成失敗', 'error');
          setIsGeneratingImage(false);
          return;
        }
        const ua = navigator.userAgent || '';
        const isWindows = /Windows/i.test(ua);
        const isMac = /Macintosh/i.test(ua);
        const isDesktop = isWindows || isMac;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) && !isDesktop;

        if (isMobile && navigator.share && navigator.canShare) {
          const file = new File([blob], 'quiz-result.png', { type: 'image/png' });
          const shareData = { files: [file] };
          if (navigator.canShare(shareData)) {
            try {
              await navigator.share(shareData);
              showToast('分享成功！', 'success');
              setIsGeneratingImage(false);
              return;
            } catch (err) {
              if (err.name === 'AbortError') {
                setIsGeneratingImage(false);
                return;
              }
            }
          }
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `密室人格測驗_${quizNickname}_${quizResult.character.name}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('圖片已下載，快去 IG 限動分享！', 'success');
        setIsGeneratingImage(false);
      }, 'image/png');
    } catch (error) {
      console.error('generate image failed', error);
      showToast('圖片生成失敗，請稍後再試', 'error');
      setIsGeneratingImage(false);
    }
  };

  const handleShareQuiz = async () => {
    if (!quizResult) return;
    const shareText = `🎮 2025 密室玩家年度回顧

我是「${quizResult.character.name}」${quizResult.character.emoji}

「${quizResult.character.description}」

最佳隊友：${quizResult.character.bestMatchName}
天敵：${quizResult.character.enemyName}

快來測測你是什麼類型的密室玩家！
${typeof window !== 'undefined' ? `${window.location.origin}/quiz` : 'https://xiaomihu.tw/quiz'}

made by IG:hu._escaperoom`;

    const ua = navigator.userAgent || '';
    const isWindows = /Windows/i.test(ua);
    const isMac = /Macintosh/i.test(ua);
    const isDesktop = isWindows || isMac;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) && !isDesktop;

    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: '2025 密室玩家人格測驗',
          text: shareText,
          url: typeof window !== 'undefined' ? `${window.location.origin}/quiz` : undefined
        });
        showToast('分享成功！', 'success');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      showToast('已複製分享文字！', 'success');
    } catch (err) {
      console.error('copy failed', err);
      showToast('複製失敗，請手動複製', 'error');
    }
  };

  const resetQuiz = () => {
    setQuizStep('intro');
    setQuizCurrentQ(0);
    setQuizAnswers({});
    setQuizResult(null);
    setQuizNickname('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-900 bg-slate-950/80 backdrop-blur">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
            返回揪團
          </Link>
          <div className="text-right">
            <div className="text-xs text-slate-500">2025 密室玩家年度回顧</div>
            <div className="text-sm font-bold text-white">角色人格測驗</div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4 pb-32">
        {quizStep === 'intro' && (
          <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-3xl p-6 border border-purple-500/30 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.15),_transparent_60%)]" />
            <div className="relative z-10 space-y-4">
              <div className="text-6xl">🎮</div>
              <h1 className="text-2xl font-bold">2025 密室玩家年度回顧</h1>
              <p className="text-purple-200 text-sm">× 角色人格測驗</p>
              <p className="text-slate-200 text-sm leading-relaxed">
                10 道情境題，揭曉你在密室裡的真實面貌！你是指揮官、解謎王，
                還是氣氛擔當？
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {QUIZ_ATTRIBUTES.map((attr) => (
                  <span
                    key={attr.key}
                    className="px-3 py-1 text-xs font-bold rounded-full"
                    style={{ color: attr.color, backgroundColor: `${attr.color}22` }}
                  >
                    {attr.name}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setQuizStep('nickname')}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 font-bold hover:from-purple-400 hover:to-pink-400 transition shadow-lg shadow-purple-500/30 text-white text-lg"
              >
                開始測驗 →
              </button>
            </div>
          </div>
        )}

        {quizStep === 'nickname' && (
          <div className="bg-slate-900 rounded-3xl p-6 space-y-4 border border-slate-800">
            <div className="text-center space-y-2">
              <div className="text-4xl">✏️</div>
              <h2 className="text-xl font-bold">輸入你的暱稱</h2>
              <p className="text-slate-400 text-sm">將顯示在測驗結果卡片上</p>
            </div>
            <input
              type="text"
              value={quizNickname}
              onChange={(e) => setQuizNickname(e.target.value)}
              maxLength={20}
              placeholder="請輸入暱稱..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-center text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={() => quizNickname.trim() && setQuizStep('questions')}
              disabled={!quizNickname.trim()}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold hover:from-purple-400 hover:to-pink-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              正式開始 →
            </button>
          </div>
        )}

        {quizStep === 'questions' && (
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>題目進度</span>
                <span className="text-purple-300 font-semibold">
                  {quizCurrentQ + 1} / {QUIZ_QUESTIONS.length}
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-5">
              <div className="text-purple-400 text-sm font-bold">Q{quizCurrentQ + 1}</div>
              <h3 className="text-lg font-bold leading-relaxed">
                {QUIZ_QUESTIONS[quizCurrentQ].question}
              </h3>
              <div className="space-y-3">
                {QUIZ_QUESTIONS[quizCurrentQ].options.map((option, idx) => {
                  const isSelected = quizAnswers[quizCurrentQ] === option;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        const newAnswers = { ...quizAnswers, [quizCurrentQ]: option };
                        setQuizAnswers(newAnswers);
                        setTimeout(() => {
                          if (quizCurrentQ < QUIZ_QUESTIONS.length - 1) {
                            setQuizCurrentQ((prev) => prev + 1);
                          } else {
                            const result = calculateQuizResult(newAnswers);
                            setQuizResult(result);
                            setQuizStep('result');
                          }
                        }, 250);
                      }}
                      className={`w-full p-4 text-left rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-purple-500/20 border-purple-400 text-white'
                          : 'bg-slate-800/60 border-slate-700 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-purple-400 font-bold mr-2">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      {option.text}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setQuizCurrentQ((prev) => Math.max(0, prev - 1))}
                disabled={quizCurrentQ === 0}
                className="flex-1 py-3 bg-slate-800 text-slate-200 rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← 上一題
              </button>
              {quizAnswers[quizCurrentQ] && quizCurrentQ < QUIZ_QUESTIONS.length - 1 && (
                <button
                  onClick={() => setQuizCurrentQ((prev) => Math.min(QUIZ_QUESTIONS.length - 1, prev + 1))}
                  className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-400"
                >
                  下一題 →
                </button>
              )}
            </div>
          </div>
        )}

        {quizStep === 'result' && quizResult && (
          <div className="space-y-4">
            <div className="space-y-4 rounded-3xl p-4" style={{ backgroundColor: '#020617' }}>
              <div className="text-center text-xs text-purple-200 font-bold">
                🎮 2025 密室玩家年度回顧
              </div>
              <div
                className={`rounded-3xl p-6 text-center bg-gradient-to-br ${quizResult.character.gradient}`}
              >
                <div className="text-4xl mb-2">{quizResult.character.emoji}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2">
                  {quizResult.character.title}
                </div>
                <div className="text-xs text-white/80 mb-1">{quizNickname} 的密室人格是</div>
                <h2 className="text-2xl font-black">{quizResult.character.name}</h2>
                <p className="text-sm text-white/80 italic mt-4">
                  「{quizResult.character.slogan}」
                </p>
                <p className="text-sm text-white/90 leading-relaxed mt-3">
                  {quizResult.character.description}
                </p>
              </div>

              <div className="rounded-2xl p-4 bg-slate-900 border border-slate-800">
                <h3 className="text-center text-sm font-bold text-white mb-3">🎯 屬性面板</h3>
                <div className="flex justify-center">
                  <svg viewBox="0 0 220 220" className="w-64 h-64">
                    {[1, 0.75, 0.5, 0.25].map((scale, i) => (
                      <polygon
                        key={i}
                        points={QUIZ_ATTRIBUTES.map((_, idx) => {
                          const angle = (idx * 60 - 90) * (Math.PI / 180);
                          const r = 90 * scale;
                          return `${110 + r * Math.cos(angle)},${110 + r * Math.sin(angle)}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#334155"
                        strokeWidth="1"
                      />
                    ))}
                    {QUIZ_ATTRIBUTES.map((_, idx) => {
                      const angle = (idx * 60 - 90) * (Math.PI / 180);
                      return (
                        <line
                          key={idx}
                          x1="110"
                          y1="110"
                          x2={110 + 90 * Math.cos(angle)}
                          y2={110 + 90 * Math.sin(angle)}
                          stroke="#334155"
                          strokeWidth="1"
                        />
                      );
                    })}
                    <polygon
                      points={QUIZ_ATTRIBUTES.map((attr, idx) => {
                        const angle = (idx * 60 - 90) * (Math.PI / 180);
                        const score = Math.min(quizResult.scores[attr.key] || 0, 10);
                        const r = (score / 10) * 90;
                        return `${110 + r * Math.cos(angle)},${110 + r * Math.sin(angle)}`;
                      }).join(' ')}
                      fill="rgba(168, 85, 247, 0.35)"
                      stroke="#a855f7"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>

              <div className="rounded-2xl p-4 bg-slate-900 border border-slate-800">
                <h3 className="text-center text-sm font-bold text-white mb-3">⚔️ 相生相剋</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/5 p-3 text-center">
                    <div className="text-xs text-emerald-300">最佳隊友</div>
                    <div className="text-sm font-bold text-white">{quizResult.character.bestMatchName}</div>
                  </div>
                  <div className="rounded-xl border border-rose-400/40 bg-rose-400/5 p-3 text-center">
                    <div className="text-xs text-rose-300">天敵</div>
                    <div className="text-sm font-bold text-white">{quizResult.character.enemyName}</div>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-slate-500">made by IG:hu._escaperoom</div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40"
              >
                {isGeneratingImage ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    📸 分享/下載圖片 (手機/PC)
                  </>
                )}
              </button>

              <button
                onClick={handleShareQuiz}
                className="w-full py-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center gap-2 font-bold text-slate-200 hover:bg-slate-800"
              >
                <Share2 size={18} />
                分享測驗
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={resetQuiz}
                  className="py-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center gap-2 text-sm font-bold"
                >
                  <RefreshCcw size={16} />
                  重新測驗
                </button>
                <Link
                  href="/"
                  className="py-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-bold flex items-center justify-center gap-2"
                >
                  返回找團
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {toast.show && (
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
            toast.type === 'error'
              ? 'bg-rose-500 text-white'
              : toast.type === 'success'
              ? 'bg-emerald-500 text-slate-900'
              : 'bg-slate-800 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default QuizPage;

