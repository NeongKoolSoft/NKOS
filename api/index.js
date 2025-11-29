// api/index.js (Vercel 배포용 서버리스 함수)

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

dotenv.config();

const app = express();

// Vercel은 자체적으로 CORS 처리를 하지만, 안전을 위해 추가
app.use(cors());
app.use(express.json());

const MODE_GOALS = {
    'DECISIVE': '불필요한 선택지를 제거하고, 1~2개의 핵심 행동을 즉시 시작하게 합니다.',
    'REFLECT': '외부 행동을 멈추고, 현재의 생각, 감정, 패턴을 관찰하게 합니다.',
    'EXPLORATORY': '압박 없이 새로운 정보나 아이디어를 자유롭게 수집하게 합니다.',
    'SIMPLIFY': '복잡성을 줄이고, 시스템을 간결화하여 부담을 낮춥니다.',
    'STABILIZE': '현재의 루틴과 상태를 유지하며, 변동성을 최소화합니다.',
    'DELAY': '에너지를 회복하고 번아웃을 예방하는 가장 쉬운 휴식을 권장합니다.'
};

// 1. 행동 추천 API
app.post('/api/generate-action', async (req, res) => {
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

        const modelName = "gemini-2.0-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
        const apiKey = process.env.GEMINI_API_KEY;

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
        res.json({ action: text.trim() });

    } catch (error) {
        console.error("Vercel API Error:", error);
        res.status(500).json({ error: 'AI 분석 실패' });
    }
});

// 2. 리포트 생성 API
app.post('/api/generate-report', async (req, res) => {
    try {
        const { logs } = req.body;
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
        const apiKey = process.env.GEMINI_API_KEY;

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

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        res.json({ report: text });

    } catch (error) {
        console.error("Vercel Report Error:", error);
        res.status(500).json({ error: '리포트 생성 실패' });
    }
});

// 🌟 Vercel은 app.listen() 대신 app을 export 해야 합니다.
export default app;