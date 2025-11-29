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

app.use(cors());
app.use(express.json());

// 🌟 [핵심] 리액트 빌드 파일('dist')을 브라우저에 제공
app.use(express.static(path.join(__dirname, 'dist')));

// 모드 목표 정의
const MODE_GOALS = {
    'DECISIVE': '불필요한 선택지를 제거하고, 1~2개의 핵심 행동을 즉시 시작하게 합니다.',
    'REFLECT': '외부 행동을 멈추고, 현재의 생각, 감정, 패턴을 관찰하게 합니다.',
    'EXPLORATORY': '압박 없이 새로운 정보나 아이디어를 자유롭게 수집하게 합니다.',
    'SIMPLIFY': '복잡성을 줄이고, 시스템을 간결화하여 부담을 낮춥니다.',
    'STABILIZE': '현재의 루틴과 상태를 유지하며, 변동성을 최소화합니다.',
    'DELAY': '에너지를 회복하고 번아웃을 예방하는 가장 쉬운 휴식을 권장합니다.'
};

console.log(`\n=== 🚀 넝쿨OS 통합 서버 가동 (http://localhost:${port}) ===`);

// =================================================================
// 3. API 엔드포인트: 행동 추천
// =================================================================
app.post('/api/generate-action', async (req, res) => {
    console.log("📡 [행동 추천 요청] 처리 시작...");
    
    try {
        const { finalMode, signals, userLog } = req.body;
        const modeGoal = MODE_GOALS[finalMode] || '행동 추천';
        const signalsString = Object.entries(signals || {}).map(([k, v]) => `- ${k}: ${v}/5`).join('\n');

        const prompt = `
            ## 역할
            당신은 의사결정 모드 엔진 'NKOS'입니다.
            ## 제약조건
            1. 한국어로 40자~60자 이내의 한 문장으로 작성하세요.
            2. 구체적인 행동을 지시하세요.
            ## 분석 맥락
            - 모드: ${finalMode}
            - 목표: ${modeGoal}
            - 신호: ${signalsString}
            ## 사용자 기록
            "${userLog}"
            ## 요청사항
            위 내용을 바탕으로 지금 당장 할 수 있는 작은 행동 하나를 추천해주세요.
        `;

        // 구글 API 호출 (gemini-2.0-flash + 헤더 인증)
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
                generationConfig: { temperature: 0.7, maxOutputTokens: 100 }
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Google API Error: ${JSON.stringify(err)}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error("API 응답이 비어있습니다.");

        res.json({ action: text.trim() });
        console.log("✅ [완료] 행동 추천 결과 전송됨");

    } catch (error) {
        console.error("❌ [오류]", error);
        res.status(500).json({ error: '서버 오류 발생' });
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
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`✅ 서버 정상 가동 중 (http://localhost:${port})`);
});