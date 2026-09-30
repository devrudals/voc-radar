/**
 * VOCRadar Client Application Controller - v2.0 Production
 */

import { analyzeReviews } from './src/core/analyzer.js';
import { exportToCSV, exportToMarkdown } from './src/core/exporter.js';
import { LicenseManager } from './src/core/license.js';
import { SAMPLE_PRESETS } from './src/data/sample-presets.js';
import { escapeHTML } from './src/core/sanitize.js';

const licenseManager = new LicenseManager();
let currentReport = null;
let currentLang = 'ko';

// DOM Elements
const reviewInput = document.getElementById('review-input');
const btnAnalyze = document.getElementById('btn-analyze');
const btnClear = document.getElementById('btn-clear');
const fileUpload = document.getElementById('file-upload');
const resultsPanel = document.getElementById('results-panel');
const resultsSearch = document.getElementById('results-search');

// Metrics
const metricTotal = document.getElementById('metric-total-reviews');
const metricScore = document.getElementById('metric-opp-score');
const metricLevel = document.getElementById('metric-opp-level');
const sentimentNeg = document.getElementById('sentiment-neg');
const sentimentNeu = document.getElementById('sentiment-neu');
const sentimentPos = document.getElementById('sentiment-pos');
const valNeg = document.getElementById('val-neg');
const valNeu = document.getElementById('val-neu');
const valPos = document.getElementById('val-pos');

// Columns & Checklist
const flawsList = document.getElementById('flaws-list');
const desiresList = document.getElementById('desires-list');
const adHooksList = document.getElementById('ad-hooks-list');
const checklistBody = document.getElementById('checklist-body');
const paywallFlawsGate = document.getElementById('paywall-flaws-gate');
const paywallChecklistGate = document.getElementById('paywall-checklist-gate');

// Toolbar & Actions
const btnExportCSV = document.getElementById('btn-export-csv');
const btnCopyMD = document.getElementById('btn-copy-md');
const btnPrintPDF = document.getElementById('btn-print-pdf');
const btnShareX = document.getElementById('btn-share-x');
const btnTopLTD = document.getElementById('btn-top-ltd');
const toastEl = document.getElementById('toast');

// License Modal
const btnProModal = document.getElementById('btn-pro-modal');
const modalPro = document.getElementById('modal-pro');
const modalClose = document.getElementById('modal-close');
const inputLicenseKey = document.getElementById('input-license-key');
const btnActivateLicense = document.getElementById('btn-activate-license');
const licenseMsg = document.getElementById('license-msg');
const navLicenseStatus = document.getElementById('nav-license-status');

// Language Switch
const langKO = document.getElementById('lang-ko');
const langEN = document.getElementById('lang-en');

// Internationalization Dictionary
const I18N = {
  ko: {
    heroTitle: '경쟁사 <span class="gradient-text">부정 리뷰 300개</span>를 3초 만에 분석하여<br>다음 대박 상품의 스펙과 광고 카피를 뽑아냅니다',
    heroSub: '아마존, 쿠팡, 스마트스토어 리뷰를 붙여넣으세요. 손가락 노가다 10시간을 1초 만에 끝내고<br><strong>[치명적 결함 TOP 5 + 고객이 애타게 찾는 기능 + 전환율 2배 광고 카피]</strong>를 즉시 추출합니다.',
    analyzeBtn: '리뷰 인텔리전스 분석 시작 (3초 소요)',
    extBtn: 'Chrome Extension (.zip)',
    proBtn: 'Upgrade to PRO ($14.99/mo)',
    proActive: 'PRO ACTIVATED (Unlimited)',
    totalReviews: '분석된 총 리뷰 수',
    oppScore: '시장 진입 기회 지수 (Opportunity Score)',
    sentiment: '감성 비율 (부정 vs 긍정)'
  },
  en: {
    heroTitle: 'Analyze <span class="gradient-text">300 Competitor Negative Reviews</span> in 3 Seconds<br>To Extract Next Winning Product Specs & Killer Ad Copy',
    heroSub: 'Paste Amazon, Shopify, or Coupang reviews. Cut 10 hours of manual reading to 1 second.<br>Instantly reveal <strong>[Top 5 Fatal Flaws + Unmet Desires + High-Converting Ad Hooks]</strong>.',
    analyzeBtn: 'Analyze Review Intelligence (3s)',
    extBtn: 'Download Extension (.zip)',
    proBtn: 'Upgrade to PRO ($14.99/mo)',
    proActive: 'PRO ACTIVATED (Unlimited)',
    totalReviews: 'Total Reviews Analyzed',
    oppScore: 'Market Opportunity Score',
    sentiment: 'Sentiment Distribution'
  }
};

// Initialize State
function init() {
  updateLicenseUI();
  setupEventListeners();
  loadPreset('earbuds');
}

function updateLicenseUI() {
  const isPro = licenseManager.isPro();
  if (isPro) {
    navLicenseStatus.textContent = I18N[currentLang].proActive;
    btnProModal.style.background = 'rgba(16, 185, 129, 0.2)';
    btnProModal.style.borderColor = 'rgba(16, 185, 129, 0.5)';
    btnProModal.style.color = '#6ee7b7';
  } else {
    navLicenseStatus.textContent = I18N[currentLang].proBtn;
  }

  // Re-render if report exists to show/hide paywalls
  if (currentReport) {
    renderResults(currentReport);
  }
}

function setupEventListeners() {
  // Preset Pills
  document.querySelectorAll('.pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.dataset.preset;
      loadPreset(presetKey);
    });
  });

  // Language Toggle
  langKO.addEventListener('click', () => switchLanguage('ko'));
  langEN.addEventListener('click', () => switchLanguage('en'));

  // Analyze Button
  btnAnalyze.addEventListener('click', runAnalysis);

  // Clear Button
  btnClear.addEventListener('click', () => {
    reviewInput.value = '';
    resultsPanel.style.display = 'none';
    currentReport = null;
  });

  // File Upload
  fileUpload.addEventListener('change', handleFileUpload);

  // Results In-search filter
  resultsSearch.addEventListener('input', handleResultsFilter);

  // Export Buttons
  btnExportCSV.addEventListener('click', handleExportCSV);
  btnCopyMD.addEventListener('click', handleCopyMD);
  btnPrintPDF.addEventListener('click', () => window.print());
  btnShareX.addEventListener('click', handleShareTwitter);

  // Paywall Buttons triggering modal
  document.querySelectorAll('.btn-unlock-paywall').forEach(btn => {
    btn.addEventListener('click', () => {
      modalPro.style.display = 'flex';
    });
  });

  // Modal Triggers
  btnProModal.addEventListener('click', () => modalPro.style.display = 'flex');
  btnTopLTD.addEventListener('click', () => modalPro.style.display = 'flex');
  modalClose.addEventListener('click', () => modalPro.style.display = 'none');
  window.addEventListener('click', (e) => {
    if (e.target === modalPro) modalPro.style.display = 'none';
  });

  // License Activation
  btnActivateLicense.addEventListener('click', handleLicenseActivation);
}

function switchLanguage(lang) {
  currentLang = lang;
  if (lang === 'ko') {
    langKO.classList.add('active');
    langEN.classList.remove('active');
  } else {
    langEN.classList.add('active');
    langKO.classList.remove('active');
  }

  const dict = I18N[lang];
  document.getElementById('t-hero-title').innerHTML = dict.heroTitle;
  document.getElementById('t-hero-subtitle').innerHTML = dict.heroSub;
  document.getElementById('t-analyze-btn').textContent = dict.analyzeBtn;
  document.getElementById('t-ext-btn').textContent = dict.extBtn;
  updateLicenseUI();
  showToast(lang === 'ko' ? '한국어로 전환되었습니다.' : 'Switched to English.');
}

function loadPreset(key) {
  const preset = SAMPLE_PRESETS[key];
  if (!preset) return;
  document.querySelectorAll('.pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === key);
  });
  reviewInput.value = preset.reviews.join('\n\n');
  runAnalysis();
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    reviewInput.value = event.target.result;
    runAnalysis();
    showToast(`${file.name} 파일을 성공적으로 불러왔습니다.`);
  };
  reader.readAsText(file);
}

function runAnalysis() {
  const text = reviewInput.value.trim();
  if (!text) {
    showToast('분석할 리뷰 텍스트를 입력해주세요.', 'error');
    return;
  }

  btnAnalyze.innerHTML = '<span class="btn-icon">⏳</span><span>분석 중... (0.3s)</span>';
  btnAnalyze.disabled = true;

  setTimeout(() => {
    currentReport = analyzeReviews(text);
    renderResults(currentReport);

    btnAnalyze.innerHTML = '<span class="btn-icon">⚡</span><span>리뷰 인텔리전스 분석 시작 (3초 소요)</span>';
    btnAnalyze.disabled = false;
    showToast('리뷰 분석이 완료되었습니다! 🚀');
  }, 200);
}

function renderResults(report) {
  if (!report || report.status !== 'SUCCESS') return;

  resultsPanel.style.display = 'block';
  const isPro = licenseManager.isPro();

  // 1. Metrics & SVG Gauge Animation
  metricTotal.textContent = report.totalReviews.toLocaleString() + '개';
  metricScore.textContent = report.opportunityScore;
  metricLevel.textContent = report.opportunityLevel;

  const gaugeFill = document.getElementById('gauge-fill');
  if (gaugeFill) {
    const maxDash = 141.37;
    const offset = Math.max(0, maxDash - (maxDash * (report.opportunityScore / 100)));
    gaugeFill.style.strokeDashoffset = offset.toFixed(2);
  }

  const s = report.sentimentSummary;
  sentimentNeg.style.width = `${s.negativePercent}%`;
  sentimentNeu.style.width = `${s.neutralPercent}%`;
  sentimentPos.style.width = `${s.positivePercent}%`;
  valNeg.textContent = `${s.negativePercent}%`;
  valNeu.textContent = `${s.neutralPercent}%`;
  valPos.textContent = `${s.positivePercent}%`;

  // 2. Fatal Flaws (Freemium Paywall: Free users see top 2, Pro sees all 5)
  flawsList.innerHTML = '';
  const visibleFlaws = isPro ? report.fatalFlaws.slice(0, 5) : report.fatalFlaws.slice(0, 2);

  visibleFlaws.forEach(flaw => {
    const item = document.createElement('div');
    item.className = 'flaw-item';
    item.dataset.search = (flaw.category + ' ' + (flaw.evidenceQuotes[0] || '')).toLowerCase();
    item.innerHTML = `
      <div class="flaw-top">
        <span class="flaw-cat">${flaw.icon} ${escapeHTML(flaw.category)}</span>
        <span class="flaw-badge ${flaw.severity}">${flaw.percentage}% (${flaw.count}건)</span>
      </div>
      <div class="flaw-bar-wrap">
        <div class="flaw-bar" style="width: ${flaw.percentage}%"></div>
      </div>
      ${flaw.evidenceQuotes[0] ? `<div class="flaw-quote">"${escapeHTML(flaw.evidenceQuotes[0])}"</div>` : ''}
    `;
    flawsList.appendChild(item);
  });

  // Toggle Paywall Gate on Flaws
  if (!isPro && report.fatalFlaws.length > 2) {
    paywallFlawsGate.style.display = 'block';
  } else {
    paywallFlawsGate.style.display = 'none';
  }

  // 3. Unmet Desires
  desiresList.innerHTML = '';
  report.unmetDesires.slice(0, 5).forEach(desire => {
    const item = document.createElement('div');
    item.className = 'desire-item';
    item.dataset.search = (desire.desire + ' ' + desire.context).toLowerCase();
    item.innerHTML = `
      <div class="desire-title">💡 "${escapeHTML(desire.desire)}"</div>
      <div class="desire-quote">${escapeHTML(desire.context)}</div>
    `;
    desiresList.appendChild(item);
  });

  // 4. Killer Ad Hooks with 1-click Copy
  adHooksList.innerHTML = '';
  report.adAngles.slice(0, 5).forEach(ad => {
    const item = document.createElement('div');
    item.className = 'ad-item';
    item.dataset.search = (ad.hook + ' ' + ad.recommendedAdCopy).toLowerCase();
    item.innerHTML = `
      <div class="ad-hook">🎯 원문 Hook: "${escapeHTML(ad.hook)}"</div>
      <div class="ad-copy-box">
        <span>${escapeHTML(ad.recommendedAdCopy)}</span>
        <button class="btn-mini-copy" data-copy="${escapeHTML(ad.recommendedAdCopy)}">복사 📋</button>
      </div>
    `;
    adHooksList.appendChild(item);
  });

  // Bind mini copy buttons
  document.querySelectorAll('.btn-mini-copy').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const textToCopy = e.target.getAttribute('data-copy');
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('광고 카피가 복사되었습니다! ✨');
      });
    });
  });

  // 5. Checklist (Freemium Gate)
  checklistBody.innerHTML = '';
  const visibleChecklist = isPro ? report.actionableChecklist : report.actionableChecklist.slice(0, 2);

  visibleChecklist.forEach((item, idx) => {
    const row = document.createElement('label');
    row.className = 'check-item';
    row.innerHTML = `
      <input type="checkbox" id="chk-${idx}">
      <span class="check-text">[${item.priority}] ${escapeHTML(item.action)}</span>
    `;
    checklistBody.appendChild(row);
  });

  // Toggle Paywall Gate on Checklist
  if (!isPro && report.actionableChecklist.length > 2) {
    paywallChecklistGate.style.display = 'block';
  } else {
    paywallChecklistGate.style.display = 'none';
  }
}

let searchDebounceTimer = null;
function handleResultsFilter(e) {
  clearTimeout(searchDebounceTimer);
  const target = e.target;
  searchDebounceTimer = setTimeout(() => {
    const query = target.value.toLowerCase().trim();
    document.querySelectorAll('.flaw-item, .desire-item, .ad-item').forEach(el => {
      const text = el.dataset.search || '';
      el.style.display = (!query || text.includes(query)) ? 'block' : 'none';
    });
  }, 120);
}

function handleExportCSV() {
  if (!currentReport) return;
  const csv = exportToCSV(currentReport);
  downloadFile(csv, 'VOCRadar_Report.csv', 'text/csv;charset=utf-8;');
  showToast('엑셀/CSV 리포트가 다운로드되었습니다.');
}

function handleCopyMD() {
  if (!currentReport) return;
  const md = exportToMarkdown(currentReport);
  navigator.clipboard.writeText(md).then(() => {
    showToast('마크다운 요약이 클립보드에 복사되었습니다! 📋');
  });
}

function handleShareTwitter() {
  if (!currentReport) return;
  const opp = currentReport.opportunityScore;
  const count = currentReport.totalReviews;
  const text = encodeURIComponent(
    `Just analyzed ${count} competitor reviews with VOCRadar!\n\n` +
    `🚨 Found top refund triggers & Opportunity Score: ${opp}/100.\n` +
    `Mine reviews in 3s with 0 token cost: https://devrudals.github.io/voc-radar/`
  );
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

function showToast(msg, type = 'info') {
  toastEl.textContent = msg;
  toastEl.style.display = 'block';
  toastEl.style.borderColor = type === 'error' ? 'rgba(244, 63, 94, 0.4)' : 'rgba(99, 102, 241, 0.4)';
  setTimeout(() => {
    toastEl.style.display = 'none';
  }, 2400);
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function handleLicenseActivation() {
  const key = inputLicenseKey.value.trim();
  licenseMsg.textContent = '인증 중...';
  licenseMsg.style.color = '#c7d2fe';

  const res = await licenseManager.activateLicense(key);
  if (res.valid) {
    licenseMsg.textContent = '✅ PRO 라이선스가 성공적으로 활성화되었습니다!';
    licenseMsg.style.color = '#10b981';
    updateLicenseUI();
    showToast('🎉 PRO 플랜이 활성화되어 모든 잠금이 해제되었습니다!');
    setTimeout(() => {
      modalPro.style.display = 'none';
    }, 1200);
  } else {
    licenseMsg.textContent = `❌ ${res.error}`;
    licenseMsg.style.color = '#f43f5e';
  }
}

// Start
init();
