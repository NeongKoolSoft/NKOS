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
// 3. API 엔드포인트: LLM 기반 분석 + 행동 추천
//    입력: { userLog }
//    출력: { signals: {..}, recommendedAction: "..." }
// =================================================================
app.post('/api/generate-action', async (req, res) => {
  console.log("📡 [행동 분석 + 추천 요청] 처리 시작...");

  try {
    const { userLog } = req.body;

    // 기본 검증
    if (!userLog || typeof userLog !== "string") {
      return res.status(400).json({ error: "userLog가 필요합니다." });
    }

    // 💡 LLM에게 점수 + 행동을 JSON으로 달라고 요청
    const prompt = `
당신은 의사결정 모드 엔진 "NKOS"입니다.

[모드 목록]
- DELAY
- STABILIZE
- SIMPLIFY
- DECISIVE
- EXPLORATORY
- REFLECT

[사용자 기록]
"${userLog}"

1단계) 각 모드에 대해 0~5점으로 점수를 매기세요.
2단계) 지금 이 사용자에게 도움이 되는 구체적인 행동을 한 문장으로 제안하세요.

아래 JSON 형식으로만 응답하세요. 설명 문장은 쓰지 마세요.

{
  "signals": {
    "DELAY": 0,
    "STABILIZE": 0,
    "SIMPLIFY": 0,
    "DECISIVE": 0,
    "EXPLORATORY": 0,
    "REFLECT": 0
  },
  "recommendedAction": "여기에 한국어 한 문장으로 행동 제안을 적으세요."
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
          temperature: 0.3,      // 패턴 점수는 안정적으로
          maxOutputTokens: 200,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Google API Error: ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("API 응답이 비어있습니다.");

    // 🔎 디버깅용으로 한번 찍어보기 (원하면 유지)
    console.log("🔍 LLM raw response:\n", text);

    // 🔧 1) 코드블럭/잡다한 텍스트 제거하고 JSON 부분만 추출
    let jsonStr;
    const trimmed = text.trim();

    // "{" 와 "}" 위치를 찾아서 그 사이만 잘라내기
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");

    if (start === -1 || end === -1) {
    throw new Error("JSON 본문을 찾지 못했습니다: " + trimmed);
    }

    jsonStr = trimmed.slice(start, end + 1);        

    // 🔧 2) JSON 파싱
    let parsed;
    try {
    parsed = JSON.parse(jsonStr);
    } catch (e) {
    console.error("❌ JSON 파싱 실패:", jsonStr);
    throw new Error("JSON 파싱 실패: " + e.message);
    }

    // 최소 형식 검증
    if (!parsed.signals || typeof parsed.recommendedAction !== "string") {
      throw new Error("응답 형식이 올바르지 않습니다: " + text);
    }

    // ✅ 프론트가 기대하는 형태 그대로 반환
    //    { signals, recommendedAction }
    res.json(parsed);
    console.log("✅ [완료] 분석 + 추천 결과 전송됨");

  } catch (error) {
    console.error("❌ [오류]", error);
    res.status(500).json({ error: "서버 오류 발생" });
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