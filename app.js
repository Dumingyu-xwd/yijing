/**
 * app.js - 主逻辑
 * 配置项：上线前修改 WORKER_URL 和 AD_UNIT_ID
 */

// ======================== 配置 ========================
const CONFIG = {
  // Cloudflare Worker 地址（部署后替换）
  WORKER_URL: 'https://yijing-api-xvlhenljcv.cn-hangzhou.fcapp.run',

  // Google AdSense / AdMob H5 广告单元ID（替换为你自己的）
  AD_CLIENT: 'ca-pub-XXXXXXXXXXXXXXXX',
  AD_SLOT:   'XXXXXXXXXX',

  // 开发模式：true=跳过广告直接解锁，上线前改为 false
  DEV_MODE: true,
};

// ======================== 状态 ========================
let isChinese   = true;
let selectedDir = null;   // 当前选中的方向 key
let currentGua  = null;   // 当前卦象数据
let currentYaos = null;   // 当前爻象数组
let isUnlocked  = false;  // 主方向是否已解锁
let aiResult    = null;   // AI返回的完整文本
let pendingSignalKey = null; // 待解锁的其他维度

// ======================== 多语言 ========================
const I18N = {
  zh: {
    navTitle:      '易经六爻',
    heroTitle:     '六爻占卜',
    heroSub:       '心诚则灵，静心默想所问之事',
    dirDivider:    '选择所问方向',
    dirLabel:      '摇卦前，请先选择你想问的方向',
    shakeBtnReady: '开始摇卦',
    shakeBtnWait:  '请先选择方向',
    guaDivider:    '卦象',
    resultDivider: '解卦',
    unlockHint:    '观看广告，解锁完整解卦详情',
    unlockBtnText: '▶ 观看广告解锁完整解卦',
    loadingText:   '正在解卦，请稍候…',
    signalDivider: '其他维度信号',
    reshake:       '重新摇卦',
    previewSuffix: '…（观看广告查看完整解析）',
    signalUnlock:  '▶ 观看广告查看',
    toastSelectDir:'请先选择所问方向',
    toastAdLoading:'广告加载中，请稍候…',
    toastUnlocked: '✓ 已解锁',
    toastAiFail:   '网络异常，已显示基础解卦',
  },
  en: {
    navTitle:      'I Ching',
    heroTitle:     'Six Lines Divination',
    heroSub:       'Calm your mind and focus on your question',
    dirDivider:    'Choose Your Question',
    dirLabel:      'Select a direction before shaking',
    shakeBtnReady: 'Shake the Oracle',
    shakeBtnWait:  'Select a direction first',
    guaDivider:    'Hexagram',
    resultDivider: 'Reading',
    unlockHint:    'Watch an ad to unlock full reading',
    unlockBtnText: '▶ Watch Ad to Unlock',
    loadingText:   'Consulting the oracle…',
    signalDivider: 'Other Signals Detected',
    reshake:       'Shake Again',
    previewSuffix: '… (watch ad for full reading)',
    signalUnlock:  '▶ Watch Ad to View',
    toastSelectDir:'Please select a direction first',
    toastAdLoading:'Loading ad, please wait…',
    toastUnlocked: '✓ Unlocked',
    toastAiFail:   'Network error, showing basic reading',
  },
};

function t(key) {
  return (isChinese ? I18N.zh : I18N.en)[key] || key;
}

function toggleLang() {
  isChinese = !isChinese;
  document.getElementById('langBtn').textContent = isChinese ? 'EN' : '中文';
  renderLang();
}

function renderLang() {
  const ids = ['navTitle','heroTitle','heroSub','dirDivider','dirLabel',
                'guaDivider','resultDivider','signalDivider','reshakeBtnText','loadingText'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(id.replace('Text','').replace('Divider','Divider'));
  });
  // 单独处理
  document.getElementById('navTitle').textContent       = t('navTitle');
  document.getElementById('heroTitle').textContent      = t('heroTitle');
  document.getElementById('heroSub').textContent        = t('heroSub');
  document.getElementById('dirDivider').textContent     = t('dirDivider');
  document.getElementById('dirLabel').textContent       = t('dirLabel');
  document.getElementById('reshakeBtnText').textContent = t('reshake');
  document.getElementById('loadingText').textContent    = t('loadingText');

  if (document.getElementById('guaDivider'))
    document.getElementById('guaDivider').textContent   = t('guaDivider');
  if (document.getElementById('resultDivider'))
    document.getElementById('resultDivider').textContent= t('resultDivider');
  if (document.getElementById('signalDivider'))
    document.getElementById('signalDivider').textContent= t('signalDivider');
  if (document.getElementById('unlockHint'))
    document.getElementById('unlockHint').textContent   = t('unlockHint');
  if (document.getElementById('unlockBtnText'))
    document.getElementById('unlockBtnText').textContent= t('unlockBtnText');

  // 重渲染方向按钮
  renderDirectionGrid();

  // 如果当前有卦象，刷新卦名显示
  if (currentGua) {
    document.getElementById('guaName').textContent   = isChinese ? currentGua.name_zh : currentGua.name_en;
    document.getElementById('guaNameEn').textContent = isChinese ? '' : '';
    document.getElementById('guaci').textContent     = isChinese ? currentGua.guaci_zh : currentGua.guaci_en;
    // 刷新解卦标题
    const dir = DIRECTIONS.find(d => d.key === selectedDir);
    if (dir) {
      document.getElementById('resultIcon').textContent  = dir.icon;
      document.getElementById('resultTitle').textContent = isChinese
        ? `${dir.zh}解卦`
        : `${dir.en} Reading`;
    }
  }
}

// ======================== 方向按钮 ========================
function renderDirectionGrid() {
  const grid = document.getElementById('dirGrid');
  grid.innerHTML = DIRECTIONS.map(d => `
    <button class="dir-btn ${selectedDir === d.key ? 'selected' : ''}"
            onclick="selectDir('${d.key}')">
      <span class="icon">${d.icon}</span>
      <span>${isChinese ? d.zh : d.en}</span>
    </button>
  `).join('');
}

function selectDir(key) {
  selectedDir = key;
  renderDirectionGrid();
  const btn = document.getElementById('shakeBtn');
  btn.disabled = false;
  document.getElementById('shakeBtnText').textContent = t('shakeBtnReady');
}

// ======================== 摇卦 ========================
function onShake() {
  if (!selectedDir) { showToast(t('toastSelectDir')); return; }

  // 动画
  const symbol = document.getElementById('heroSymbol');
  symbol.classList.remove('shaking');
  void symbol.offsetWidth;
  symbol.classList.add('shaking');

  // 生成卦象
  const result = shakeGua();
  currentGua  = result.gua;
  currentYaos = result.yaos;
  isUnlocked  = false;
  aiResult    = null;

  // 渲染卦名
  document.getElementById('guaName').textContent   = isChinese ? currentGua.name_zh : currentGua.name_en;
  document.getElementById('guaNameEn').textContent = '';
  document.getElementById('guaci').textContent     = isChinese ? currentGua.guaci_zh : currentGua.guaci_en;

  // 渲染爻象（上爻→初爻，视觉上从上到下）
  const yaoList = document.getElementById('yaoList');
  const YAO_NAMES_ZH = ['初爻','二爻','三爻','四爻','五爻','上爻'];
  const YAO_NAMES_EN = ['1st','2nd','3rd','4th','5th','6th'];
  yaoList.innerHTML = result.yaos.map((y, i) => `
    <div class="yao-item ${y.isMoving ? 'moving' : ''}">
      <span class="yao-label">${isChinese ? YAO_NAMES_ZH[i] : YAO_NAMES_EN[i]}</span>
      <span class="yao-line">${getYaoSymbol(y)}</span>
      <span class="yao-type">${y.isMoving ? (isChinese ? '动' : 'Move') : ''}</span>
    </div>
  `).join('');

  // 方向标题
  const dir = DIRECTIONS.find(d => d.key === selectedDir);
  document.getElementById('resultIcon').textContent  = dir.icon;
  document.getElementById('resultTitle').textContent = isChinese
    ? `${dir.zh}解卦`
    : `${dir.en} Reading`;

  // 显示免费预览（兜底文本）
  const fallback = FALLBACK_TEXTS[selectedDir];
  const preview  = isChinese ? fallback.zh : fallback.en;
  document.getElementById('previewText').textContent = preview + t('previewSuffix');

  // 重置解锁区
  document.getElementById('previewArea').style.display = '';
  document.getElementById('fullArea').classList.remove('visible');
  document.getElementById('loadingArea').style.display = 'none';
  document.getElementById('signalArea').style.display  = 'none';
  document.getElementById('unlockBtn').disabled        = false;
  document.getElementById('unlockBtnText').textContent = t('unlockBtnText');

  // 显示卦象区
  document.getElementById('guaSection').style.display = '';

  // 滚动到卦象
  setTimeout(() => {
    document.getElementById('guaSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function getYaoSymbol(y) {
  if (y.type === 'laoyang')  return '○  ━━━━━━━';
  if (y.type === 'shaoyang') return '   ━━━━━━━';
  if (y.type === 'shaoyin')  return '   ━━━  ━━━';
  if (y.type === 'laoyin')   return '×  ━━━  ━━━';
  return '';
}

function onReshake() {
  // 滚回顶部方向选择
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('guaSection').style.display = 'none';
  isUnlocked = false;
  aiResult   = null;
}

// ======================== 广告解锁 ========================
function onUnlock() {
  if (CONFIG.DEV_MODE) {
    // 开发模式直接解锁
    doUnlock();
    return;
  }
  // 正式模式：展示广告
  showAd(() => doUnlock());
}

function doUnlock() {
  isUnlocked = true;
  document.getElementById('previewArea').style.display = 'none';
  document.getElementById('loadingArea').style.display = '';
  document.getElementById('loadingText').textContent   = t('loadingText');

  callAI(selectedDir, (content, error) => {
    document.getElementById('loadingArea').style.display = 'none';

    if (error || !content) {
      // AI失败，展示兜底文本
      showToast(t('toastAiFail'));
      const fallback = FALLBACK_TEXTS[selectedDir];
      renderFullContent(isChinese ? fallback.zh : fallback.en, null);
      return;
    }

    aiResult = content;
    renderFullContent(content, null);
    showToast(t('toastUnlocked'));
  });
}

// 解锁其他维度信号
function onUnlockSignal(signalKey, btnEl) {
  pendingSignalKey = signalKey;
  if (CONFIG.DEV_MODE) {
    doUnlockSignal(signalKey, btnEl);
    return;
  }
  btnEl.disabled = true;
  btnEl.textContent = t('toastAdLoading');
  showAd(() => doUnlockSignal(signalKey, btnEl));
}

function doUnlockSignal(signalKey, btnEl) {
  // 替换按钮为loading
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.textContent = t('loadingText');
  }

  callAI(signalKey, (content, error) => {
    const area = document.getElementById('signal_detail_' + signalKey);
    if (area) {
      area.textContent = error || !content
        ? (isChinese ? FALLBACK_TEXTS[signalKey]?.zh : FALLBACK_TEXTS[signalKey]?.en) || ''
        : extractMainContent(content);
      area.style.display = '';
    }
    if (btnEl) btnEl.style.display = 'none';
  });
}

// ======================== 渲染完整解卦内容 ========================
function renderFullContent(rawText, _unused) {
  const fullArea = document.getElementById('fullArea');
  const fullContent = document.getElementById('fullContent');

  // 解析AI返回的结构化文本
  const blocks = parseAIResult(rawText);
  fullContent.innerHTML = '';
  blocks.forEach(b => {
    const block = document.createElement('div');
    block.className = 'result-block';
    if (b.title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'result-block-title';
      titleEl.textContent = '【' + b.title + '】';
      block.appendChild(titleEl);
    }
    const contentEl = document.createElement('div');
    contentEl.className = 'result-block-content';
    contentEl.style.whiteSpace = 'pre-wrap';
    contentEl.textContent = b.content;
    block.appendChild(contentEl);
    fullContent.appendChild(block);
  });

  // 解析其他维度信号
  const signals = parseSignals(rawText);
  if (signals.length > 0) {
    const signalList = document.getElementById('signalList');
    signalList.innerHTML = signals.map(s => {
      const dir = DIRECTIONS.find(d => d.zh === s.key || d.en === s.key || d.key === s.key);
      const dirKey = dir ? dir.key : '';
      return `
        <div class="signal-item">
          <span class="signal-tag">${s.key}</span>
          <div>
            <div class="signal-text">${s.text}</div>
            ${dirKey ? `
              <div id="signal_detail_${dirKey}" style="display:none; margin-top:8px; color:var(--text-dim); font-size:14px;"></div>
              <button class="more-signal-btn"
                      onclick="onUnlockSignal('${dirKey}', this)">
                ${t('signalUnlock')} ${dir ? (isChinese ? dir.zh : dir.en) : s.key} ${isChinese ? '详解' : 'Detail'}
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
    document.getElementById('signalArea').style.display = '';
  }

  fullArea.classList.add('visible');
}

// 解析AI文本为结构化块
function parseAIResult(text) {
  if (!text) return [];
  const blocks = [];
  // 按【】分块
  const parts = text.split(/【([^】]+)】/);
  // parts[0]=前置内容, parts[1]=标题1, parts[2]=内容1, ...
  for (let i = 1; i < parts.length; i += 2) {
    const title   = parts[i] || '';
    const content = (parts[i+1] || '').trim();
    if (title === '其他信号') continue; // 信号单独处理
    if (content) {
      blocks.push({
        title,
        content: content,
      });
    }
  }
  if (blocks.length === 0) {
    // 没有结构化内容，直接展示
    blocks.push({ title: '', content: text });
  }
  return blocks;
}

// 解析其他维度信号
function parseSignals(text) {
  if (!text) return [];
  const signals = [];
  // 匹配【其他信号】段落
  const signalMatch = text.match(/【其他信号】([\s\S]*?)(?=【|$)/);
  if (!signalMatch) return [];
  const signalText = signalMatch[1].trim();
  if (!signalText || signalText === '无') return [];

  // 解析 [维度]：内容 格式
  const lines = signalText.split('\n').filter(l => l.trim());
  lines.forEach(line => {
    const m = line.match(/[【\[](.+?)[】\]][:：](.+)/);
    if (m) {
      signals.push({ key: m[1].trim(), text: m[2].trim() });
    } else if (line.trim() && line.trim() !== '无') {
      // 无格式，直接加入
      signals.push({ key: isChinese ? '提示' : 'Note', text: line.trim() });
    }
  });
  return signals;
}

// 提取主要内容（用于信号展开）
function extractMainContent(text) {
  const mainMatch = text.match(/【主解】([\s\S]*?)(?=【|$)/);
  if (mainMatch) return mainMatch[1].trim();
  return text;
}

// ======================== 调用AI ========================
function callAI(direction, callback) {
  const yaoLines = currentYaos
    ? currentYaos.map((y, i) => `第${i+1}爻：${y.label}${y.isMoving ? '（动）' : ''}`).join('，')
    : '';

  const payload = {
    guaName:   currentGua.name_zh,
    guaDesc:   currentGua.guaci_zh,
    direction: direction,
    yaoLines:  yaoLines,
  };

  fetch(CONFIG.WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  .then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  })
  .then(data => callback(data.content, null))
  .catch(err => callback(null, err.message));
}

// ======================== 广告（H5 AdSense 激励广告占位） ========================
// H5原生没有激励广告API，这里用展示广告+倒计时模拟
// 正式上线可接入 Google IMA SDK 或 AdSense
function showAd(onComplete) {
  // 创建广告遮罩
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,.9); z-index:9999;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    color:#fff; font-family:sans-serif;
  `;

  let countdown = 5;
  overlay.innerHTML = `
    <div style="font-size:14px; color:#aaa; margin-bottom:16px;">广告 · Advertisement</div>
    <div style="width:300px; height:250px; background:#222; border:1px solid #444;
                display:flex; align-items:center; justify-content:center; color:#666; font-size:13px;">
      广告位<br>Ad Placeholder<br><br>
      接入 Google AdSense / IMA SDK 后显示真实广告
    </div>
    <div id="adCountdown" style="margin-top:20px; font-size:16px; color:#c9a84c;">
      ${countdown}秒后可关闭
    </div>
    <button id="adCloseBtn" disabled style="
      margin-top:12px; padding:10px 30px; background:#c9a84c; border:none;
      border-radius:20px; color:#1a1209; font-size:15px; cursor:not-allowed; opacity:.4;">
      关闭 / Close
    </button>
  `;

  document.body.appendChild(overlay);

  const timer = setInterval(() => {
    countdown--;
    const cdEl = document.getElementById('adCountdown');
    if (cdEl) {
      cdEl.textContent = countdown > 0
        ? `${countdown}秒后可关闭`
        : '可以关闭了';
    }
    if (countdown <= 0) {
      clearInterval(timer);
      const btn = document.getElementById('adCloseBtn');
      if (btn) {
        btn.disabled  = false;
        btn.style.opacity = '1';
        btn.style.cursor  = 'pointer';
        btn.onclick = () => {
          document.body.removeChild(overlay);
          onComplete();
        };
      }
    }
  }, 1000);
}

// ======================== Toast ========================
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

// ======================== 初始化 ========================
document.addEventListener('DOMContentLoaded', () => {
  renderDirectionGrid();
  renderLang();
});
