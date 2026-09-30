/**
 * VOCRadar Chrome Extension Content Script
 * Scrapes customer reviews from Amazon, Coupang, and Smartstore with multi-selector fallback
 */

(() => {
  // Listen for message from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'SCRAPE_REVIEWS') {
      const reviews = extractReviewsFromPage();
      sendResponse({ status: 'OK', reviews, pageTitle: document.title });
    }
    return true; // Keep message channel open for async response
  });

  function extractReviewsFromPage() {
    const collected = [];
    const url = window.location.href;

    // 1. Amazon Review Selectors
    if (url.includes('amazon.')) {
      const amazonNodes = document.querySelectorAll(
        '[data-hook="review-body"] span, .review-text-content span, .review-text'
      );
      amazonNodes.forEach(node => {
        const text = node.innerText.trim();
        if (text.length > 15 && !collected.includes(text)) {
          collected.push(text);
        }
      });
    }

    // 2. Coupang Review Selectors
    if (url.includes('coupang.com')) {
      const coupangNodes = document.querySelectorAll(
        '.sdp-review__article__list__review__content, .js_reviewArticleContent'
      );
      coupangNodes.forEach(node => {
        const text = node.innerText.trim();
        if (text.length > 15 && !collected.includes(text)) {
          collected.push(text);
        }
      });
    }

    // 3. Naver Smartstore Selectors
    if (url.includes('smartstore.naver.com')) {
      const naverNodes = document.querySelectorAll(
        '._3QoErZ9nvi, .YEtwtZFL3n, [class*="review_content"]'
      );
      naverNodes.forEach(node => {
        const text = node.innerText.trim();
        if (text.length > 15 && !collected.includes(text)) {
          collected.push(text);
        }
      });
    }

    // 4. Universal Fallback: Text-First Heuristic Parsing
    // If specific selectors found nothing, search paragraphs containing review-like sentiment keywords
    if (collected.length === 0) {
      const paragraphs = document.querySelectorAll('p, div[class*="review"], div[class*="comment"]');
      paragraphs.forEach(p => {
        const t = p.innerText.trim();
        if (t.length > 20 && t.length < 500 && (
          t.includes('battery') || t.includes('broke') || t.includes('quality') ||
          t.includes('refund') || t.includes('불량') || t.includes('배송') || t.includes('환불')
        )) {
          if (!collected.includes(t)) collected.push(t);
        }
      });
    }

    return collected;
  }
})();
