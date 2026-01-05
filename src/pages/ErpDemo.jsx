import { useState } from "react";

export default function ErpDemo() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [debugSql, setDebugSql] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setAnswer(null);
    setDebugSql(null);

    try {
      const res = await fetch("http://localhost:3000/api/erp-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      setAnswer(data.answer);
      setDebugSql(data.debugSql); // AI가 짠 쿼리도 보여주기 (기술 자랑용)
    } catch (err) {
      setAnswer("죄송합니다. 서버 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-32 pb-12 px-4">
      <div className="w-full max-w-2xl">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
            NKOS ERP AI
          </span>
          <h1 className="text-3xl font-bold text-slate-800 mt-4 mb-2">
            경영자 전용 AI 비서
          </h1>
          <p className="text-slate-500">
            복잡한 메뉴 찾지 마세요. 그냥 물어보면 데이터에서 답을 찾아드립니다.
          </p>
        </div>

        {/* 채팅 입력 카드 */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <form onSubmit={handleAsk} className="relative">
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 pr-16 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
              placeholder="예: 삼성전자 미수금 얼마야?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 font-medium transition-colors disabled:bg-slate-300"
            >
              {loading ? "분석중..." : "질문"}
            </button>
          </form>

          {/* 추천 질문 가이드 */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {["삼성전자 미수금 알려줘", "이번 달 매출 1위 품목은?", "한도 초과한 거래처 있어?"].map((q) => (
              <button
                key={q}
                onClick={() => setQuestion(q)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* 결과 카드 (답변이 있을 때만 표시) */}
        {answer && (
          <div className="mt-6 animate-fade-in-up">
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
              {/* 상단: AI 답변 */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-white">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    AI
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-800 text-lg leading-relaxed font-medium">
                      {answer}
                    </p>
                  </div>
                </div>
              </div>

              {/* 하단: 기술적 근거 (SQL) - 신뢰도 상승용 */}
              {debugSql && (
                <div className="px-6 py-4 bg-slate-900 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <span>⚡ AI가 생성한 검증 쿼리 (SQL)</span>
                  </p>
                  <code className="text-xs text-green-400 font-mono block overflow-x-auto">
                    {debugSql}
                  </code>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}