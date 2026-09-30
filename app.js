/**
 * VOCRadar Client Application Controller (Root version for GitHub Pages)
 */

import { analyzeReviews } from './src/core/analyzer.js';
import { exportToCSV, exportToMarkdown } from './src/core/exporter.js';
import { LicenseManager } from './src/core/license.js';
import { SAMPLE_PRESETS } from './src/data/sample-presets.js';
import { escapeHTML } from './src/core/sanitize.js';

const licenseManager = new LicenseManager();
let currentReport = null;

// DOM Elements
const reviewInput = document.getElementById('review-input');
const btnAnalyze = document.getElementById('btn-analyze');
const btnClear = document.getElementById('btn-clear');
const fileUpload = document.getElementById('file-upload');
const resultsPanel = document.getElementById('results-panel');

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

// Toolbar
const btnExportCSV = document.getElementById('btn-export-csv');
const btnCopyMD = document.getElementById('btn-copy-md');
const btnExportJSON = document.getElementById('btn-export-json');

// License Modal
const btnProModal = document.getElementById('btn-pro-modal');
const modalPro = document.getElementById('modal-pro');
const modalClose = document.getElementById('modal-close');
const inputLicenseKey = document.getElementById('input-license-key');
const btnActivateLicense = document.getElementById('btn-activate-license');
const licenseMsg = document.getElementById('license-msg');
const navLicenseStatus = document.getElementById('nav-license-status');

// Initialize State
function init() {
  updateLicenseUI();
  setupEventListeners();
  // Auto-load first preset for instant visual delight
  loadPreset('earbuds');
}

function updateLicenseUI() {
  if (licenseManager.isPro()) {
    navLicenseStatus.textContent = 'PRO ACTIVATED (Unlimited)';
    btnProModal.style.background = 'rgba(16, 185, 129, 0.2)';
    btnProModal.style.borderColor = 'rgba(16, 185, 129, 0.5)';
    btnProModal.style.color = '#6ee7b7';
  } else {
    navLicenseStatus.textContent = 'Upgrade to PRO ($14.99/mo)';
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

  // Export Buttons
  btnExportCSV.addEventListener('click', handleExportCSV);
  btnCopyMD.addEventListener('click', handleCopyMD);
  btnExportJSON.addEventListener('click', handleExportJSON);

  // Modal
  btnProModal.addEventListener('click', () => {
    modalPro.style.display = 'flex';
  });
  modalClose.addEventListener('click', () => {
    modalPro.style.display = 'none';
  });
  window.addEventListener('click', (e) => {
    if (e.target === modalPro) modalPro.style.display = 'none';
  });

  // License Activation
  btnActivateLicense.addEventListener('click', handleLicenseActivation);
}

function loadPreset(key) {
  const preset = SAMPLE_PRESETS[key];
  if (!preset) return;
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
  };
  reader.readAsText(file);
}

function runAnalysis() {
  const text = reviewInput.value.trim();
  if (!text) {
    alert('분석할 리뷰 텍스트를 입력하거나 빠른 체험 버튼을 클릭해주세요.');
    return;
  }

  // Visual feedback
  btnAnalyze.innerHTML = '<span class="btn-icon">⏳</span><span>분석 중... (0.8s)</span>';
  btnAnalyze.disabled = true;

  setTimeout(() => {
    currentReport = analyzeReviews(text);
    renderResults(currentReport);

    btnAnalyze.innerHTML = '<span class="btn-icon">⚡</span><span>리뷰 인텔리전스 분석 시작 (3초 소요)</span>';
    btnAnalyze.disabled = false;
  }, 300);
}

function renderResults(report) {
  if (!report || report.status !== 'SUCCESS') return;

  resultsPanel.style.display = 'block';
  resultsPanel.scrollIntoView({ behavior: 'smooth' });

  // 1. Metrics
  metricTotal.textContent = report.totalReviews.toLocaleString() + '개';
  metricScore.textContent = report.opportunityScore;
  metricLevel.textContent = report.opportunityLevel;

  const s = report.sentimentSummary;
  sentimentNeg.style.width = `${s.negativePercent}%`;
  sentimentNeu.style.width = `${s.neutralPercent}%`;
  sentimentPos.style.width = `${s.positivePercent}%`;
  valNeg.textContent = `${s.negativePercent}%`;
  valNeu.textContent = `${s.neutralPercent}%`;
  valPos.textContent = `${s.positivePercent}%`;

  // 2. Fatal Flaws
  flawsList.innerHTML = '';
  if (report.fatalFlaws.length === 0) {
    flawsList.innerHTML = '<p class="card-hint">감지된 치명적 결함이 없습니다.</p>';
  } else {
    report.fatalFlaws.slice(0, 5).forEach(flaw => {
      const item = document.createElement('div');
      item.className = 'flaw-item';
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
  }

  // 3. Unmet Desires
  desiresList.innerHTML = '';
  if (report.unmetDesires.length === 0) {
    desiresList.innerHTML = '<p class="card-hint">명시적인 기능 추가 요청 구문이 없습니다.</p>';
  } else {
    report.unmetDesires.slice(0, 5).forEach(desire => {
      const item = document.createElement('div');
      item.className = 'desire-item';
      item.innerHTML = `
        <div class="desire-title">💡 "${escapeHTML(desire.desire)}"</div>
        <div class="desire-quote">${escapeHTML(desire.context)}</div>
      `;
      desiresList.appendChild(item);
    });
  }

  // 4. Killer Ad Hooks
  adHooksList.innerHTML = '';
  if (report.adAngles.length === 0) {
    adHooksList.innerHTML = '<p class="card-hint">추출된 광고 카피 앵글이 없습니다.</p>';
  } else {
    report.adAngles.slice(0, 5).forEach(ad => {
      const item = document.createElement('div');
      item.className = 'ad-item';
      item.innerHTML = `
        <div class="ad-hook">🎯 원문 Hook: "${escapeHTML(ad.hook)}"</div>
        <div class="ad-copy-box"><strong>추천 카피:</strong> ${escapeHTML(ad.recommendedAdCopy)}</div>
      `;
      adHooksList.appendChild(item);
    });
  }

  // 5. Checklist
  checklistBody.innerHTML = '';
  report.actionableChecklist.forEach((item, idx) => {
    const row = document.createElement('label');
    row.className = 'check-item';
    row.innerHTML = `
      <input type="checkbox" id="chk-${idx}">
      <span class="check-text">[${item.priority}] ${escapeHTML(item.action)}</span>
    `;
    checklistBody.appendChild(row);
  });
}

function handleExportCSV() {
  if (!currentReport) return;
  const csv = exportToCSV(currentReport);
  downloadFile(csv, 'VOCRadar_Report.csv', 'text/csv;charset=utf-8;');
}

function handleCopyMD() {
  if (!currentReport) return;
  const md = exportToMarkdown(currentReport);
  navigator.clipboard.writeText(md).then(() => {
    alert('마크다운 요약 리포트가 클립보드에 복사되었습니다!');
  }).catch(() => {
    alert('클립보드 접근 권한이 필요합니다.');
  });
}

function handleExportJSON() {
  if (!currentReport) return;
  const jsonStr = JSON.stringify(currentReport, null, 2);
  downloadFile(jsonStr, 'VOCRadar_Report.json', 'application/json');
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
    setTimeout(() => {
      modalPro.style.display = 'none';
    }, 1500);
  } else {
    licenseMsg.textContent = `❌ ${res.error}`;
    licenseMsg.style.color = '#f43f5e';
  }
}

// Start
init();
