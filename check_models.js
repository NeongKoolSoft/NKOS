// check_models.js
// 구글 서버에 "나한테 허용된 모델 목록 다 보여줘"라고 요청하는 스크립트

import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const url = "https://generativelanguage.googleapis.com/v1beta/models";

console.log("🔍 구글 서버에 모델 목록을 조회 중입니다...");
console.log(`🔑 사용 중인 키: ${apiKey ? "확인됨 (OK)" : "없음 (ERROR)"}`);

async function listModels() {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-goog-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.error) {
            console.error("\n❌ [조회 실패] 에러가 발생했습니다:");
            console.error(JSON.stringify(data.error, null, 2));
        } else {
            console.log("\n✅ [조회 성공] 사용 가능한 모델 목록:");
            console.log("------------------------------------------------");
            // 모델 이름만 깔끔하게 출력
            if (data.models) {
                data.models.forEach(model => {
                    // "models/gemini-pro" -> "gemini-pro"
                    console.log(`📌 ${model.name.replace('models/', '')}`);
                });
                console.log("------------------------------------------------");
                console.log("👉 위 목록에 있는 이름 중 하나를 server.js에 적으세요.");
            } else {
                console.log("⚠️ 목록이 비어있습니다. API 키 권한을 다시 확인하세요.");
            }
        }
    } catch (error) {
        console.error("❌ 네트워크/코드 오류:", error);
    }
}

listModels();