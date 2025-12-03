// server.js (최종 배포용)
// 기능 1: 리액트 화면 보여주기 (Static File Serving)
// 기능 2: Gemini API 통신 (AI Logic)

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// 1. API 키 확인
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ API 키가 없습니다. .env 파일을 확인해주세요.");
    process.exit(1);
}

// 2. 서버 설정
const app = express();
const port = process.env.PORT || 3001;

// 현재 파일 경로 계산 (ES Module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
  origin: [
    "http://localhost:5173",               // 로컬 개발 프론트
    "https://nkos.vercel.app"             // 실제 배포된 프론트 주소
  ]
}));
app.use(express.json());

// 💚 콜드 스타트 방지용 아주 가벼운 헬스체크 엔드포인트
app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    ts: Date.now(),
  });
});

// 모드 목표 정의
const MODE_GOALS = {
    'DECISIVE': '불필요한 선택지를 제거하고, 1~2개의 핵심 행동을 즉시 시작하게 합니다.',
    'REFLECT': '외부 행동을 멈추고, 현재의 생각, 감정, 패턴을 관찰하게 합니다.',
    'EXPLORATORY': '압박 없이 새로운 정보나 아이디어를 자유롭게 수집하게 합니다.',
    'SIMPLIFY': '복잡성을 줄이고, 시스템을 간결화하여 부담을 낮춥니다.',
    'STABILIZE': '현재의 루틴과 상태를 유지하며, 변동성을 최소화합니다.',
    'DELAY': '에너지를 회복하고 번아웃을 예방하는 가장 쉬운 휴식을 권장합니다.'
};

console.log(`🚀 NKOS Backend running on port ${port}`);

// =================================================================
// 3. API 엔드포인트: LLM 기반 분석 + 행동 추천 (안전 버전)
//    입력: { userLog }
//    출력 (성공 시): { signals: {..}, recommendedAction: "..." }
//    출력 (실패 시): { signals: null, recommendedAction: "" }  ← fallback
// =================================================================
app.post("/api/generate-action", async (req, res) => {
  console.log("📡 [행동 분석 + 추천 요청] 처리 시작...");

  const { userLog } = req.body;

  // 기본 검증
  if (!userLog || typeof userLog !== "string") {
    console.warn("⚠️ userLog 누락 또는 타입 오류:", userLog);
    return res.json({ signals: null, recommendedAction: "" });
  }

  try {
// 6. AI에게 보낼 편지(프롬프트) 작성 (스케일링 버전)
// server.js 프롬프트 부분 수정 (개념적 정의 버전)
// server.js 프롬프트 부분 (Delay 모드 구출 작전)
        const prompt = `
            ## 역할
            당신은 'NungleOS'의 초정밀 심리 분석 엔진입니다.

            ## 사용자 기록
            "${userLog}"

            ## 임무 1: 심리 신호 분석 (0~3점 척도)
            **아래의 [핵심 기준]을 반드시 지켜서 평가하세요.**

            1) **emotion_vs_logic** (0: 이성적 ~ 3: 감성적)
               - 💡 **중요:** "피곤하다", "힘들다", "졸리다"는 육체적 상태이므로 **0점**입니다.
               - 비유적인 표현("중력 10배" 등)이라도 몸이 힘든 거라면 감정이 아니라 상태 서술입니다 (0~1점).

            2) **risk_avoidance** (0: 대담함 ~ 3: 불안/공포)
               - 실패에 대한 두려움이나 걱정이 있을 때만 높게 잡으세요.

            3) **responsibility_avoidance** (0: 주도적 ~ 3: 회피적)
               - "하기 싫다", "내일로 미루자", "도망가고 싶다"는 강력한 회피 신호(3점)입니다.

            4) **analysis_paralysis** (0: 행동 중심 ~ 3: 생각 과다/정지)
               - 💡 **핵심 기준:** 행동이 멈춘 상태를 체크하세요.
               - "멍하다", "아무것도 안 하고 싶다", "잠만 자고 싶다", "손에 안 잡힌다"는 **행동 마비** 상태이므로 무조건 **3점**을 부여하세요.
               - 고민하느라 못 움직이는 것뿐만 아니라, **지쳐서 멈춘 것도 마비**입니다.

            5) **priority_confusion** (0: 명확 ~ 3: 혼란)
               - 뭘 해야 할지 모르는 상태일 때 3점.

            6) **energy_level** (0: 고갈/무기력 ~ 3: 활력)
               - "힘들다", "지쳤다", "귀찮다", "의욕 없다"는 **0점**입니다.

            7) **novelty_drive** (0: 익숙함 ~ 3: 호기심)

            ## 임무 2: 맞춤형 행동 추천
            (80자 이내, 사용자의 상태를 반영한 구체적 행동 1가지)

            ## 출력 형식 (JSON Only)
            {
                "signals": {
                    "emotion_vs_logic": 0,
                    "risk_avoidance": 0,
                    "responsibility_avoidance": 0,
                    "analysis_paralysis": 0,
                    "priority_confusion": 0,
                    "energy_level": 0,
                    "novelty_drive": 0
                },
                "recommendedAction": "..."
            }
        `;

        

    const modelName = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.0,
            topP: 0.1,
            topK: 1,
            maxOutputTokens: 200
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("❌ Google API Error:", err);
      // 여기서 바로 500 던지지 말고, 프론트가 fallback 쓰게 함
      return res.json({ signals: null, recommendedAction: "" });
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      console.error("❌ LLM 응답 비어 있음");
      return res.json({ signals: null, recommendedAction: "" });
    }

    console.log("🔍 LLM raw response:\n", raw);

    // 코드블럭/설명 제거 후 JSON 부분만 추출
    const trimmed = raw.trim();
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1) {
      console.error("❌ JSON 본문 위치를 찾지 못함:", trimmed);
      return res.json({ signals: null, recommendedAction: "" });
    }

    const jsonStr = trimmed.slice(start, end + 1);

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error("❌ JSON 파싱 실패:", jsonStr, e);
      return res.json({ signals: null, recommendedAction: "" });
    }

    if (!parsed.signals || typeof parsed.recommendedAction !== "string") {
      console.error("❌ JSON 형식 오류:", parsed);
      return res.json({ signals: null, recommendedAction: "" });
    }

    // ✅ 정상: 프론트가 그대로 사용하는 형태
    console.log("✅ [완료] 분석 + 추천 결과 전송됨");
    return res.json(parsed);
  } catch (error) {
    console.error("❌ [핸들러 내부 오류]", error);
    // 여기도 500 대신 fallback
    return res.json({ signals: null, recommendedAction: "" });
  }
});

// =================================================================
// 4. API 엔드포인트: 리포트 생성
// =================================================================
app.post('/api/generate-report', async (req, res) => {
    console.log("📊 [리포트 요청] 처리 시작...");

    try {
        const { logs } = req.body;
        if (!logs || logs.length === 0) throw new Error("기록 없음");

        const logsContext = logs.map(log => `- [${log.date}] ${log.mode}: ${log.text}`).join('\n');
        
        const prompt = `
            ## 역할: 회고 비서
            ## 데이터: ${logsContext}
            ## 요청: 
            1. 이번 주 핵심 키워드 3개
            2. 감정 흐름 요약 (3문장)
            3. 다음 주 조언 (1문장)
            위 내용을 마크다운으로 작성해주세요.
        `;

        const modelName = "gemini-2.0-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
            })
        });

        if (!response.ok) throw new Error("Google API Error");
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        res.json({ report: text });
        console.log("✅ [완료] 리포트 전송됨");

    } catch (error) {
        console.error("❌ [오류]", error);
        res.status(500).json({ error: '리포트 생성 실패' });
    }
});

// =================================================================
// 5. 모든 기타 요청은 React 화면(index.html)으로 돌려보냄
// (새로고침 시 404 방지)
// =================================================================

app.listen(port, () => {
    console.log(`✅ 서버 정상 가동 중 (http://localhost:${port})`);
});