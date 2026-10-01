/**
 * VOCRadar Chrome Extension Popup Controller
 * Apple Pro / HIG Aesthetic & Zero Server Cost Execution
 */

let lastExtractedReviews = [];

document.getElementById('btn-scrape-now').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  const resultsEl = document.getElementById('results');
  const statCount = document.getElementById('stat-count');
  const statOpp = document.getElementById('stat-opp');
  const miniFlaws = document.getElementById('mini-flaws');
  const btnCopy = document.getElementById('btn-copy-reviews');

  statusEl.textContent = '페이지에서 리뷰를 추출하고 있습니다...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      statusEl.textContent = '활성화된 브라우저 탭을 찾을 수 없습니다.';
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: 'SCRAPE_REVIEWS' }, (response) => {
      if (chrome.runtime.lastError || !response || !response.reviews) {
        statusEl.textContent = '리뷰 요소를 감지할 수 없습니다. 상품 리뷰 섹션으로 스크롤 후 다시 시도해주세요.';
        return;
      }

      const reviews = response.reviews;
      if (reviews.length === 0) {
        statusEl.textContent = '추출된 리뷰 텍스트가 없습니다.';
        return;
      }

      lastExtractedReviews = reviews;
      statusEl.textContent = `${reviews.length}개의 리뷰 텍스트가 정제 추출되었습니다.`;
      resultsEl.style.display = 'block';
      if (btnCopy) btnCopy.style.display = 'inline-flex';
      statCount.textContent = `${reviews.length}개`;

      // Fast Client Opportunity Scoring
      let negCount = 0;
      const flawKeywords = ['broke', 'battery', 'charge', 'leak', 'cheap', '고장', '환불', '배터리', '누수', '파손', '불량', '유격'];
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

      const oppScore = Math.min(96, Math.max(30, Math.round((negCount / (reviews.length || 1)) * 100) + 35));
      statOpp.textContent = `${oppScore} / 100`;

      miniFlaws.innerHTML = '';
      if (detectedFlaws.length === 0) {
        detectedFlaws.push('일반 사용감 피드백');
      }

      detectedFlaws.slice(0, 3).forEach(flaw => {
        const div = document.createElement('div');
        div.className = 'flaw-mini-item';
        div.textContent = `빈출 키워드: "${flaw}"`;
        miniFlaws.appendChild(div);
      });
    });
  } catch (err) {
    statusEl.textContent = '추출 중 오류가 발생했습니다: ' + err.message;
  }
});

const btnCopyReviews = document.getElementById('btn-copy-reviews');
if (btnCopyReviews) {
  btnCopyReviews.addEventListener('click', () => {
    if (lastExtractedReviews.length > 0) {
      navigator.clipboard.writeText(lastExtractedReviews.join('\n\n'));
      btnCopyReviews.querySelector('span').textContent = '복사 완료!';
      setTimeout(() => {
        btnCopyReviews.querySelector('span').textContent = '리뷰 텍스트 복사';
      }, 2000);
    }
  });
}
