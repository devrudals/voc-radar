import assert from 'assert';

function isNoiseLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length <= 2) return true;
  if (/^[★☆\s\d\.\/\(\)\-]+$/.test(trimmed) && trimmed.length < 15) return true;
  if (/^(?:\d(?:\.\d)?\s*(?:out of 5 stars|점 만점에|점|stars?)|★+|☆+)/i.test(trimmed)) return true;
  if (/^(?:별점|평점|rating|stars)\s*[:\d\.\/]/i.test(trimmed)) return true;
  if (/^(?:신고하기|신고|report(?:\s+abuse)?|수정|삭제|더보기|접기|목록으로|답글|댓글)$/i.test(trimmed)) return true;
  if (/^(?:도움이 돼요|도움이 안돼요|도움돼요|도움 안돼요|helpful|unhelpful)(?:\s*\d+)?$/i.test(trimmed)) return true;
  if (/^\d+\s*명(?:에게)?\s*도움이\s*되었습니다/i.test(trimmed)) return true;
  if (/^\d+\s*people found this helpful/i.test(trimmed)) return true;
  if (/^(?:베스트순|최신순|추천순|랭킹순|쿠팡체험단|verified purchase|top reviewer)/i.test(trimmed)) return true;
  if (/^(?:reviewed in .+ on |작성일\s*[:\.]?|등록일\s*[:\.]?)/i.test(trimmed)) return true;
  if (/^\d{4}[\.\-\/]\d{1,2}[\.\-\/]\d{1,2}(?:\s+\d{1,2}:\d{2})?$/.test(trimmed)) return true;
  if (/^(?:옵션|색상|사이즈|스타일|용량|color|size|style|flavor|variant)\s*[:]/i.test(trimmed)) return true;
  if (/^[가-힣A-Za-z]\*{1,4}[가-힣A-Za-z0-9]?$/.test(trimmed)) return true;
  return false;
}

export function parseReviewsWithStats(input) {
  if (Array.isArray(input)) {
    const reviews = input.filter(r => r && r.length > 5);
    return {
      reviews,
      stats: {
        totalRawLines: input.length,
        noiseLinesFiltered: 0,
        validReviews: reviews.length,
        detectedFormat: 'Array'
      }
    };
  }

  if (typeof input !== 'string' || !input.trim()) {
    return {
      reviews: [],
      stats: { totalRawLines: 0, noiseLinesFiltered: 0, validReviews: 0, detectedFormat: 'Empty' }
    };
  }

  const rawLines = input.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const totalRawLines = rawLines.length;

  // 1. TSV Detection (Excel / Google Sheets clipboard)
  const tabLines = rawLines.filter(l => l.includes('\t'));
  if (tabLines.length >= 2 || (rawLines.length === 1 && rawLines[0].includes('\t'))) {
    const rows = rawLines.map(l => l.split('\t'));
    const numCols = Math.max(...rows.map(r => r.length));

    // Check header row for review column
    const headerRow = rows[0].map(c => c.replace(/^["'\s]+|["'\s]+$/g, '').toLowerCase());
    const headerIdx = headerRow.findIndex(col =>
      ['review', 'reviews', 'comment', 'comments', 'body', 'content', 'text', 'feedback', '후기', '내용', '리뷰', '평가'].some(k => col.includes(k))
    );

    let targetColIdx = headerIdx;
    let startRow = headerIdx !== -1 ? 1 : 0;

    // Fallback: Pick column with longest average length
    if (targetColIdx === -1) {
      let maxAvgLen = -1;
      for (let c = 0; c < numCols; c++) {
        let totalLen = 0;
        let count = 0;
        for (let r = startRow; r < rows.length; r++) {
          if (rows[r][c]) {
            totalLen += rows[r][c].trim().length;
            count++;
          }
        }
        const avg = count > 0 ? totalLen / count : 0;
        if (avg > maxAvgLen) {
          maxAvgLen = avg;
          targetColIdx = c;
        }
      }
    }

    if (targetColIdx !== -1) {
      const reviews = [];
      let noiseCount = 0;
      for (let i = startRow; i < rows.length; i++) {
        const val = rows[i][targetColIdx] ? rows[i][targetColIdx].replace(/^["'\s]+|["'\s]+$/g, '').trim() : '';
        if (val.length > 5 && !isNoiseLine(val)) {
          reviews.push(val);
        } else if (val) {
          noiseCount++;
        }
      }
      return {
        reviews,
        stats: {
          totalRawLines,
          noiseLinesFiltered: noiseCount + (headerIdx !== -1 ? 1 : 0),
          validReviews: reviews.length,
          detectedFormat: 'TSV (Excel/Sheets)'
        }
      };
    }
  }

  // 2. CSV Detection
  if (rawLines.length > 1 && rawLines[0].includes(',')) {
    const headerCols = rawLines[0].split(',').map(c => c.replace(/^["'\s]+|["'\s]+$/g, '').toLowerCase());
    const targetIdx = headerCols.findIndex(col =>
      ['review', 'reviews', 'comment', 'comments', 'body', 'content', 'text', 'feedback', '후기', '내용', '리뷰', '평가'].some(k => col.includes(k))
    );

    if (targetIdx !== -1) {
      const reviews = [];
      let noiseCount = 0;
      for (let i = 1; i < rawLines.length; i++) {
        const row = rawLines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rawLines[i].split(',');
        if (row && row[targetIdx]) {
          const val = row[targetIdx].replace(/^["'\s]+|["'\s]+$/g, '').trim();
          if (val.length > 5 && !isNoiseLine(val)) {
            reviews.push(val);
          } else {
            noiseCount++;
          }
        }
      }
      if (reviews.length > 0) {
        return {
          reviews,
          stats: {
            totalRawLines,
            noiseLinesFiltered: noiseCount + 1,
            validReviews: reviews.length,
            detectedFormat: 'CSV'
          }
        };
      }
    }
  }

  // 3. Fallback: Web Page Scrape & Multiline De-noising
  let noiseCount = 0;
  const reviews = [];

  const rawBlocks = input.split(/\r?\n\s*\r?\n+/);
  if (rawBlocks.length > 1) {
    for (const block of rawBlocks) {
      const bLines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const cleanLines = [];
      for (const line of bLines) {
        if (isNoiseLine(line)) {
          noiseCount++;
        } else {
          cleanLines.push(line);
        }
      }
      if (cleanLines.length > 0) {
        const reviewText = cleanLines.join(' ').trim();
        if (reviewText.length > 5) reviews.push(reviewText);
      }
    }
  } else {
    let currentReviewLines = [];
    const lines = input.split(/\r?\n/).map(l => l.trim());
    for (const line of lines) {
      if (!line) {
        if (currentReviewLines.length > 0) {
          const t = currentReviewLines.join(' ').trim();
          if (t.length > 5) reviews.push(t);
          currentReviewLines = [];
        }
        continue;
      }
      if (isNoiseLine(line)) {
        noiseCount++;
        if (currentReviewLines.length > 0) {
          const t = currentReviewLines.join(' ').trim();
          if (t.length > 5) reviews.push(t);
          currentReviewLines = [];
        }
      } else {
        if (/^\d+[\.\)]\s+/.test(line)) {
          if (currentReviewLines.length > 0) {
            const t = currentReviewLines.join(' ').trim();
            if (t.length > 5) reviews.push(t);
            currentReviewLines = [];
          }
          currentReviewLines.push(line.replace(/^\d+[\.\)]\s*/, ''));
        } else {
          currentReviewLines.push(line);
        }
      }
    }
    if (currentReviewLines.length > 0) {
      const t = currentReviewLines.join(' ').trim();
      if (t.length > 5) reviews.push(t);
    }
  }

  return {
    reviews,
    stats: {
      totalRawLines,
      noiseLinesFiltered: noiseCount,
      validReviews: reviews.length,
      detectedFormat: noiseCount > 0 ? 'Web Page Paste' : 'Text'
    }
  };
}

// Run assertions
const tsvInput = `ID\tDate\tUser\tReview Text\tStars\n1\t2024-01-01\tKim\tBattery died after 2 days\t1\n2\t2024-01-02\tLee\tVery loud and annoying noise\t1`;
const tsvRes = parseReviewsWithStats(tsvInput);
assert.strictEqual(tsvRes.reviews.length, 2);
assert.strictEqual(tsvRes.reviews[0], 'Battery died after 2 days');
assert.strictEqual(tsvRes.stats.detectedFormat, 'TSV (Excel/Sheets)');

const coupangInput = `홍*동 2024.08.12 신고하기\n★☆☆☆☆\n옵션: 블루\n배터리가 3일 만에 방전돼요. 충전도 안 됨.\n12명에게 도움이 되었습니다.\n도움이 돼요\n\n이*수 2024.08.13\n★★☆☆☆\n마감이 너무 부실하고 유격이 심합니다.`;
const cpRes = parseReviewsWithStats(coupangInput);
assert.strictEqual(cpRes.reviews.length, 2);
assert.ok(cpRes.stats.noiseLinesFiltered >= 4);

const gate1Raw = "Review 1: Sound is great.\n\nReview 2: Battery died after 2 days.<script>alert(1)</script>\n\nReview 3: Too big.";
const gate1Res = parseReviewsWithStats(gate1Raw);
assert.strictEqual(gate1Res.reviews.length, 3);

console.log('✅ ALL_PARSER_TESTS_PASSED');
