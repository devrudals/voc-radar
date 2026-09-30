# 📡 VOCRadar (Voice of Customer Intelligence)

> **"경쟁사 부정 리뷰 500개를 3초 만에 분석하여 다음 대박 상품의 스펙과 고효율 광고 카피를 뽑아냅니다."**  
> 100% 클라이언트 로컬 연산 기반 • 토큰 원가 \$0.00 • 글로벌 달러 정기 결제(LemonSqueezy) 탑재.

---

## 💡 제품 개요 (Product Overview)
아마존, 쿠팡, 쇼피파이, 스마트스토어의 상위 셀러 제품 부정 리뷰(1~3점)를 붙여넣거나 CSV를 업로드하면, 다음 3가지 핵심 인텔리전스를 즉시 생성합니다:
1. 🚨 **치명적 결함 TOP 5 (Fatal Flaws):** 소비자가 제품을 반품하고 분노하는 진짜 이유
2. 💡 **고객이 애타게 찾는 기능 (Unmet Desires):** 다음 신제품에 추가하면 독점적 우위를 점하는 기능
3. 🎯 **전환율 2배 킬러 광고 카피 (Ad Hooks):** 구매자의 실제 감정을 저격하는 마케팅 카피
4. 🛠️ **OEM/ODM 공장 발주용 스펙 개선 체크리스트:** 제조사에 그대로 전달할 수 있는 불량 예방 가이드

---

## ⚡ 빠른 시작 (Quick Start)

### 1. 로컬 웹 애플리케이션 실행
```bash
cd /Users/dlrudals/.gemini/antigravity/scratch/voc-radar
npm start
```
* 브라우저에서 `http://localhost:3000` 접속
* 상단 **"🎧 무선 이어폰"**, **"💧 스마트 텀블러"**, **"🪑 인체공학 의자"** 1초 빠른 체험 버튼 클릭

### 2. 크롬 확장 프로그램 (Chrome Extension) 로드
1. Chrome 브라우저에서 `chrome://extensions` 접속
2. 우측 상단 **"개발자 모드(Developer mode)"** 활성화
3. **"압축해제된 확장 프로그램을 로드합니다(Load unpacked)"** 클릭
4. `/Users/dlrudals/.gemini/antigravity/scratch/voc-radar/extension` 폴더 선택
5. 아마존/쿠팡 상품 페이지에서 아이콘을 누르고 **"현재 페이지 리뷰 즉시 추출"** 클릭!

---

## 💰 수익화 구조 (Monetization & Unit Economics)
* **요금제:**
  * Free: 회당 30개 리뷰 기본 분석
  * **Pro Unlimited:** **$14.99 / 월** (또는 $49 평생 라이선스 LTD)
* **원가 구조:**
  * 리뷰 파싱 & NLP 휴리스틱: 브라우저 자바스크립트 엔진 100% 오프라인 처리 (토큰 비용 **$0.00**)
  * 정적 호스팅: Vercel / Cloudflare Pages (**$0.00**)
  * 결제 대행: LemonSqueezy (5% + $0.50)
  * **순수익률: 91.6%+**

---

## 📁 디렉토리 구조
```
voc-radar/
├── src/
│   ├── core/              # 0토큰 리뷰 마이닝, 내보내기, 보안, 라이선스 코어
│   ├── data/              # 3대 고효율 실전 데모 샘플 데이터셋
│   └── server.js          # 제로 디펜던시 정적 웹 서버
├── public/                # 모던 테크 다크모드 웹 대시보드
├── extension/             # 크롬 익스텐션 Manifest V3 번들
├── launch-kit/            # Product Hunt, Reddit, Twitter, 콜드메일 마케팅 에셋
├── scripts/               # Unlazy 자동 수용 게이트(GATES) 검증 스크립트
├── GATES.md               # Unlazy 승인 원장
├── BUSINESS_VERIFICATION.md # 수익성 & 유닛 이코노믹스 검증서
└── CRITIC_VERDICT.md      # 크리틱 카운실 4인 사전 공격 판정서
```
