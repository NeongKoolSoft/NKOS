// src/components/DemoFeature.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { extractSignals, decideMode } from "../lib/modeEngine";
import { getPatternBoosts } from "../lib/modePatterns";

// API URL (환경변수 또는 로컬)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const API_URL = `${API_BASE_URL}/api/generate-action`;

const MODE_LABEL = {
  DELAY: "DELAY : 결정 보류",
  STABILIZE: "STABILIZE : 안정 회복",
  SIMPLIFY: "SIMPLIFY : 단순화",
  DECISIVE: "DECISIVE : 결단/실행",
  EXPLORATORY: "EXPLORATORY : 탐색/실험",
  REFLECT: "REFLECT : 성찰/내면 정리",
};

export default function DemoFeature() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // 분석 결과 담는 곳

  const handleAnalyze = async () => {
    if (!text.trim()) {
      alert("내용을 입력해주세요!");
      return;
    }
    setLoading(true);

    try {
      // 1. AI 분석 요청 (DB 저장 X)
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userLog: text }),
      });
      
      const aiData = await response.json();
      
      // 2. 로컬 엔진으로 모드 산출
      const signals = extractSignals(text);
      const patternBoosts = getPatternBoosts(text);
      // 이전 모드는 없으므로 빈 값 처리
      const finalMode = decideMode(signals, patternBoosts, ""); 
      
      const action = aiData?.recommendedAction || "잠시 숨을 고르고, 가장 쉬운 일부터 시작해보세요.";

      // 3. 결과 세팅 (모달 띄우기용)
      setResult({ mode: finalMode, action });

    } catch (error) {
      console.error("분석 실패", error);
      alert("일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    // 구글 로그인 함수 (Supabase)
    navigate("/login"); // 혹은 supabase.auth.signInWithOAuth(...) 직접 호출
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-8">
      {/* 1. 입력 영역 (로그인 전 노출) */}
      {!result ? (
        <div className="bg-white p-2 rounded-2xl shadow-lg border-2 border-blue-100 flex flex-col md:flex-row gap-2 transition-all hover:shadow-xl hover:border-blue-300">
          <textarea
            className="flex-1 p-4 rounded-xl resize-none outline-none text-gray-700 bg-transparent h-24 md:h-auto"
            placeholder="지금 머릿속을 맴도는 생각이나 고민을 적어보세요. (로그인 없이 3초 분석)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAnalyze();
                }
            }}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 py-4 md:py-0 transition-all flex items-center justify-center gap-2 min-w-[140px]"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>분석 중..</span>
              </>
            ) : (
              <>
                <span>🚀 체험하기</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* 2. 결과 모달 (분석 후 노출) */
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-blue-100 animate-slideUp text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-purple-400"></div>
          
          <h3 className="text-gray-500 text-sm font-bold mb-2 uppercase tracking-wider">Analysis Result</h3>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            지금 넝쿨님은 <br/>
            {/* 영어 모드명 */}
            <span className="text-blue-600 font-extrabold block text-4xl mb-1">
            {MODE_LABEL[result.mode]?.split(":")[0].trim()}
            </span>
            {/* 한글 모드명 (작게) */}
            <span className="text-gray-500 text-lg font-medium">
            ({MODE_LABEL[result.mode]?.split(":")[1].trim()})
            </span>
            <span className="text-gray-800 text-2xl font-bold ml-1">상태입니다.</span>
          </h2>

          <div className="bg-gray-50 p-6 rounded-2xl mb-8 text-left">
            <span className="text-2xl mr-2">💡</span>
            <span className="text-gray-700 font-medium leading-relaxed">{result.action}</span>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleLogin}
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              이 기록 저장하고 계속하기 (3초 가입)
            </button>
            <button
              onClick={() => { setResult(null); setText(""); }}
              className="text-gray-400 text-sm hover:text-gray-600 underline"
            >
              다시 테스트하기
            </button>
          </div>
          
          <p className="mt-4 text-xs text-gray-400">
            * 체험판 데이터는 저장되지 않습니다. 저장하려면 로그인하세요.
          </p>
        </div>
      )}
    </div>
  );
}