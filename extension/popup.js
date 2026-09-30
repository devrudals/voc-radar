/**
 * Chrome Extension Popup Script
 */

document.getElementById('btn-scrape-now').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  const resultsEl = document.getElementById('results');
  const statCount = document.getElementById('stat-count');
  const statOpp = document.getElementById('stat-opp');
  const miniFlaws = document.getElementById('mini-flaws');

  statusEl.textContent = '리뷰 추출 중...';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    statusEl.textContent = '활성화된 탭을 찾을 수 없습니다.';
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: 'SCRAPE_REVIEWS' }, (response) => {
    if (chrome.runtime.lastError || !response || !response.reviews) {
      statusEl.textContent = '리뷰를 감지할 수 없습니다. 상품 리뷰 영역으로 스크롤해주세요.';
      return;
    }

    const reviews = response.reviews;
    if (reviews.length === 0) {
      statusEl.textContent = '추출된 리뷰가 없습니다.';
      return;
    }

    statusEl.textContent = `✅ ${reviews.length}개 리뷰 분석 완료!`;
    resultsEl.style.display = 'block';
    statCount.textContent = `${reviews.length}개`;

    // Simple fast client scoring
    let negCount = 0;
    const flawKeywords = ['broke', 'battery', 'charge', 'leak', 'cheap', '고장', '환불', '배터리', '누수'];
    const detectedFlaws = [];

    reviews.forEach(r => {
      const lower = r.toLowerCase();
      flawKeywords.forEach(k => {
        if (lower.includes(k) && !detectedFlaws.includes(k)) {
          detectedFlaws.push(k);
          negCount++;
        }
      });
    });

    const oppScore = Math.min(95, Math.round((negCount / (reviews.length || 1)) * 100) + 40);
    statOpp.textContent = `${oppScore} / 100`;

    miniFlaws.innerHTML = '';
    detectedFlaws.slice(0, 3).forEach(flaw => {
      const div = document.createElement('div');
      div.className = 'flaw-mini-item';
      div.textContent = `🚨 빈출 결함 키워드: "${flaw}"`;
      miniFlaws.appendChild(div);
    });
  });
});
