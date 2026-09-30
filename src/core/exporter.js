/**
 * Structured Exporter Module
 * Generates CSV (sanitized against formula injection), Markdown, and JSON
 */

import { sanitizeCSVCell } from './sanitize.js';

/**
 * Converts VOC Analysis Report to CSV format ready for Excel/Google Sheets
 * @param {object} report 
 * @returns {string} CSV text
 */
export function exportToCSV(report) {
  if (!report || report.status !== 'SUCCESS') return '';

  const rows = [];
  rows.push(['Section', 'Category / Item', 'Metric / Frequency', 'Evidence Quote / Action', 'Priority / Type']);

  // Summary row
  rows.push([
    sanitizeCSVCell('Summary'),
    sanitizeCSVCell('Total Reviews Analyzed'),
    sanitizeCSVCell(report.totalReviews.toString()),
    sanitizeCSVCell(`Opportunity Score: ${report.opportunityScore}/100`),
    sanitizeCSVCell(report.opportunityLevel)
  ]);

  // Fatal Flaws
  if (report.fatalFlaws) {
    report.fatalFlaws.forEach(flaw => {
      rows.push([
        sanitizeCSVCell('Fatal Flaws'),
        sanitizeCSVCell(flaw.category),
        sanitizeCSVCell(`${flaw.percentage}% (${flaw.count} reviews)`),
        sanitizeCSVCell(flaw.evidenceQuotes[0] || ''),
        sanitizeCSVCell(flaw.severity)
      ]);
    });
  }

  // Unmet Desires
  if (report.unmetDesires) {
    report.unmetDesires.forEach(desire => {
      rows.push([
        sanitizeCSVCell('Unmet Desires'),
        sanitizeCSVCell(desire.desire),
        sanitizeCSVCell('N/A'),
        sanitizeCSVCell(desire.context),
        sanitizeCSVCell('FEATURE_REQUEST')
      ]);
    });
  }

  // Ad Hooks
  if (report.adAngles) {
    report.adAngles.forEach(ad => {
      rows.push([
        sanitizeCSVCell('Ad Angles'),
        sanitizeCSVCell(ad.hook),
        sanitizeCSVCell('N/A'),
        sanitizeCSVCell(ad.recommendedAdCopy),
        sanitizeCSVCell(ad.type)
      ]);
    });
  }

  // Actionable Checklist
  if (report.actionableChecklist) {
    report.actionableChecklist.forEach(item => {
      rows.push([
        sanitizeCSVCell('Manufacturing Checklist'),
        sanitizeCSVCell(item.category),
        sanitizeCSVCell('ACTION_ITEM'),
        sanitizeCSVCell(item.action),
        sanitizeCSVCell(item.priority)
      ]);
    });
  }

  return rows.map(r => r.join(',')).join('\n');
}

/**
 * Generates an executive Markdown report
 * @param {object} report 
 * @returns {string} Markdown text
 */
export function exportToMarkdown(report) {
  if (!report || report.status !== 'SUCCESS') return '';

  let md = `# 📊 VOCRadar Intelligence Report\n\n`;
  md += `> **분석 모수:** ${report.totalReviews}개 리뷰 | **진입 기회 지수 (Opportunity Score):** **${report.opportunityScore}/100** (${report.opportunityLevel})\n\n`;
  
  md += `## 🚨 1. 치명적 결함 TOP (제조/소싱 시 개선 필수)\n`;
  report.fatalFlaws.forEach((flaw, idx) => {
    md += `${idx + 1}. **${flaw.category}** - 불만율 ${flaw.percentage}% (${flaw.count}건) [심각도: ${flaw.severity}]\n`;
    if (flaw.evidenceQuotes && flaw.evidenceQuotes.length > 0) {
      md += `   - *" ${flaw.evidenceQuotes[0]} "*\n`;
    }
  });

  md += `\n## 💡 2. 고객들이 애타게 찾는 기능 (차별화 포인트)\n`;
  report.unmetDesires.forEach((d, idx) => {
    md += `${idx + 1}. *" ${d.desire} "*\n`;
  });

  md += `\n## 🎯 3. 고효율 광고 카피 앵글 (상세페이지 & 광고 활용)\n`;
  report.adAngles.forEach((a, idx) => {
    md += `${idx + 1}. **Hook:** "${a.hook}"\n   👉 추천 카피: *${a.recommendedAdCopy}*\n`;
  });

  md += `\n## 🛠️ 4. 공장/제조사 전달용 스펙 개선 체크리스트\n`;
  report.actionableChecklist.forEach(item => {
    md += `- [ ] [${item.priority}] ${item.action}\n`;
  });

  return md;
}
