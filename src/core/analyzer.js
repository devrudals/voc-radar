/**
 * VOCRadar Core Analyzer Engine
 * 100% Zero-Token, Client-Side Heuristic & Pattern Mining for E-Commerce Reviews
 */

import { stripHTML, escapeHTML } from './sanitize.js';

// Negative & Defect Keyword Dictionaries (Multi-language: EN & KO)
const FLAW_CATEGORIES = {
  DURABILITY: {
    label: '내구성 및 품질 불량 (Durability & Breakage)',
    icon: '🔨',
    keywords: [
      'broke', 'broken', 'defective', 'died', 'cracked', 'snapped', 'cheap plastic',
      'stopped working', 'poor quality', 'fell apart', 'garbage', 'junk',
      '고장', '부러짐', '파손', '불량', '내구성', '플라스틱 싸구려', '망가짐', '헐거움'
    ]
  },
  BATTERY_POWER: {
    label: '배터리 및 전원 이슈 (Battery & Charging)',
    icon: '🔋',
    keywords: [
      'battery', 'charging', 'won\'t charge', 'dies fast', 'drains quickly', 'overheating',
      'charger', 'charge life', 'drain',
      '배터리', '충전', '방전', '발열', '조루', '충전기', '완충'
    ]
  },
  ERGONOMICS_FIT: {
    label: '착용감/사이즈/사용감 불편 (Fit & Ergonomics)',
    icon: '📏',
    keywords: [
      'uncomfortable', 'too small', 'too big', 'doesn\'t fit', 'hurts', 'painful',
      'heavy', 'tight', 'loose', 'awkward',
      '불편', '너무 작음', '너무 큼', '안 맞음', '통증', '아픔', '무거움', '사이즈 미스'
    ]
  },
  USABILITY_UX: {
    label: '조작 복잡성 및 설명서 부실 (Usability & Manual)',
    icon: '📖',
    keywords: [
      'confusing', 'hard to use', 'instructions unclear', 'manual missing', 'complicated',
      'glitchy', 'setup nightmare',
      '어려움', '복잡함', '설명서 부실', '조작 불편', '오류', '설정 복잡'
    ]
  },
  CUSTOMER_SUPPORT: {
    label: '배송/환불/고객 서비스 불만 (Support & Return)',
    icon: '📦',
    keywords: [
      'customer service', 'support', 'refused refund', 'return window', 'never arrived',
      'missing piece', 'open box', 'scam',
      '고객센터', '환불 거부', '반품', '누락', '배송 지연', '응대 불친절'
    ]
  }
};

// Patterns for Feature Requests / Unmet Desires
const DESIRE_PATTERNS = [
  /(?:wish (?:it|there|they) (?:had|was|were|included|offered))([^.!?\n]+)/gi,
  /(?:if only (?:it|they))([^.!?\n]+)/gi,
  /(?:would be (?:much )?better if)([^.!?\n]+)/gi,
  /(?:please add|should include|needs? a?)([^.!?\n]+)/gi,
  /([가-힣\w\s]+(?:있었으면 좋겠|추가되면 좋겠|개선이 필요|바랍니다|아쉽습니다))/gi
];

// Patterns for Winning Ad Angles / Emotional Hooks
const AD_HOOK_PATTERNS = [
  /(?:finally found|game changer|saved my|worth every penny|best purchase|unlike other)([^.!?\n]+)/gi,
  /(?:don't waste your money on|stay away from|wish i knew before buying)([^.!?\n]+)/gi,
  /(?:인생템|역대급|다른 제품 쓰다가|돈 아끼지 말고|진작 살걸)([^.!?\n]+)/gi
];

/**
 * Parses raw text or CSV input into clean review items with automatic column detection
 * @param {string|string[]} input 
 * @returns {string[]} Array of normalized review texts
 */
export function normalizeReviews(input) {
  if (Array.isArray(input)) {
    return input.map(r => stripHTML(r)).filter(r => r.length > 5);
  }
  if (typeof input !== 'string') return [];

  const cleaned = stripHTML(input);

  // Check if input is a structured CSV file
  const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length > 1 && lines[0].includes(',')) {
    const headerCols = lines[0].split(',').map(c => c.replace(/^["']|["']$/g, '').trim().toLowerCase());
    const targetIdx = headerCols.findIndex(col => 
      ['review', 'reviews', 'comment', 'comments', 'body', 'content', 'text', 'feedback', '후기', '내용', '리뷰'].some(k => col.includes(k))
    );

    if (targetIdx !== -1) {
      const extracted = [];
      for (let i = 1; i < lines.length; i++) {
        // Simple CSV row parser handling quoted commas
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
        if (row && row[targetIdx]) {
          const val = row[targetIdx].replace(/^["']|["']$/g, '').trim();
          if (val.length > 5) extracted.push(val);
        }
      }
      if (extracted.length > 0) return extracted;
    }
  }

  // Fallback: Split by double newline, carriage return, or numbered lists (e.g. "1. ", "2) ")
  return cleaned
    .split(/\n{2,}|\r\n{2,}|(?:\n\d+[\.\)])|(?:\n[-•*]\s+)/g)
    .map(r => r.trim())
    .filter(r => r.length > 5);
}

/**
 * Main Review Analysis Function
 * Runs in O(N) linear time, 0 tokens.
 * @param {string|string[]} rawReviews 
 * @param {object} options 
 * @returns {object} Full VOC Intelligence Report
 */
export function analyzeReviews(rawReviews, options = {}) {
  const reviews = normalizeReviews(rawReviews);
  const totalReviews = reviews.length;

  if (totalReviews === 0) {
    return {
      status: 'EMPTY',
      totalReviews: 0,
      fatalFlaws: [],
      unmetDesires: [],
      adAngles: [],
      sentimentSummary: { positive: 0, neutral: 0, negative: 0 },
      opportunityScore: 0,
      actionableChecklist: []
    };
  }

  // Tracking categories
  const flawCounts = {};
  const flawQuotes = {};
  for (const key of Object.keys(FLAW_CATEGORIES)) {
    flawCounts[key] = 0;
    flawQuotes[key] = [];
  }

  const unmetDesires = [];
  const adAngles = [];
  let negativeCount = 0;
  let positiveCount = 0;
  let neutralCount = 0;

  for (const review of reviews) {
    const lower = review.toLowerCase();
    let isNeg = false;
    let isPos = false;

    // 1. Detect Fatal Flaws
    for (const [key, category] of Object.entries(FLAW_CATEGORIES)) {
      for (const kw of category.keywords) {
        if (lower.includes(kw.toLowerCase())) {
          flawCounts[key]++;
          isNeg = true;
          if (flawQuotes[key].length < 3) {
            flawQuotes[key].push(review.length > 180 ? review.substring(0, 180) + '...' : review);
          }
          break; // Avoid double counting same category in single review
        }
      }
    }

    // 2. Extract Unmet Desires
    for (const pattern of DESIRE_PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(review)) !== null) {
        const rawQuote = match[0].trim();
        if (rawQuote.length > 8 && rawQuote.length < 150) {
          unmetDesires.push({
            quote: rawQuote,
            context: review.length > 120 ? review.substring(0, 120) + '...' : review
          });
          break;
        }
      }
    }

    // 3. Extract High-Converting Ad Angles
    for (const pattern of AD_HOOK_PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(review)) !== null) {
        const hookText = match[0].trim();
        if (hookText.length > 6 && hookText.length < 140) {
          adAngles.push({
            hook: hookText,
            type: hookText.includes('waste') || hookText.includes('away') ? 'NEGATIVE_ATTACK' : 'BENEFIT_CONTRAST'
          });
          break;
        }
      }
    }

    // Sentiment heuristic
    if (isNeg) {
      negativeCount++;
    } else if (lower.includes('great') || lower.includes('love') || lower.includes('perfect') || lower.includes('좋아') || lower.includes('최고')) {
      positiveCount++;
      isPos = true;
    } else {
      neutralCount++;
    }
  }

  // Format Top Fatal Flaws
  const fatalFlaws = Object.entries(flawCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => {
      const percentage = Math.round((count / totalReviews) * 100);
      return {
        id: key,
        category: FLAW_CATEGORIES[key].label,
        icon: FLAW_CATEGORIES[key].icon,
        count,
        percentage,
        severity: percentage > 25 ? 'CRITICAL' : percentage > 10 ? 'HIGH' : 'MEDIUM',
        evidenceQuotes: flawQuotes[key]
      };
    });

  // Unique top desires and ad angles
  const uniqueDesires = Array.from(new Set(unmetDesires.map(d => d.quote)))
    .slice(0, 5)
    .map(quote => {
      const found = unmetDesires.find(d => d.quote === quote);
      return {
        desire: quote,
        context: found ? found.context : ''
      };
    });

  const uniqueAdAngles = Array.from(new Set(adAngles.map(a => a.hook)))
    .slice(0, 5)
    .map(hook => {
      const found = adAngles.find(a => a.hook === hook);
      return {
        hook,
        type: found ? found.type : 'BENEFIT_CONTRAST',
        recommendedAdCopy: generateAdCopy(hook)
      };
    });

  // Calculate Opportunity Score (0 ~ 100)
  // Higher negative review % and clear flaws mean a BIGGER opportunity to enter with an improved product!
  const negRatio = (negativeCount / totalReviews);
  const flawDiversity = Math.min(1, fatalFlaws.length / 3);
  const opportunityScore = Math.min(99, Math.round((negRatio * 60) + (flawDiversity * 30) + 10));

  // Actionable Manufacturing & Sourcing Checklist
  const actionableChecklist = fatalFlaws.map(flaw => {
    return {
      category: flaw.category,
      action: `제조/공장 오더 시 [${flaw.category}] 보완 지침 전달 (리뷰의 ${flaw.percentage}%가 불만 제기)`,
      priority: flaw.severity
    };
  });

  return {
    status: 'SUCCESS',
    totalReviews,
    sentimentSummary: {
      positivePercent: Math.round((positiveCount / totalReviews) * 100),
      neutralPercent: Math.round((neutralCount / totalReviews) * 100),
      negativePercent: Math.round((negativeCount / totalReviews) * 100)
    },
    opportunityScore,
    opportunityLevel: opportunityScore > 70 ? '극상 (High Entry Opportunity - Competitor is vulnerable)' : '보통 (Moderate)',
    fatalFlaws,
    unmetDesires: uniqueDesires,
    adAngles: uniqueAdAngles,
    actionableChecklist
  };
}

/**
 * Generates an ad headline based on buyer emotional hook
 */
function generateAdCopy(hook) {
  if (hook.toLowerCase().includes('waste') || hook.toLowerCase().includes('돈 아끼')) {
    return `"${hook}" - 이제 돈 낭비하지 마세요. 불량률 0%에 도전하는 진짜 제품.`;
  }
  return `고객들이 극찬한 핵심 이유: "${hook}". 지금 바로 경험해보세요.`;
}
