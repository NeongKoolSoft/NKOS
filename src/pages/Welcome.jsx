// 내부 박스만 흰색 + 버튼 청록색 적용 버전 + Footer 포함
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer"; // ✅ Footer 가져오기

export default function Welcome() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/login");
  };

  return (
    // 전체를 세로 방향 레이아웃으로: 위 카드 + 아래 Footer
    <div className="min-h-screen bg-slate-100 flex flex-col">

      {/* 가운데 카드 영역 */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        {/* 전체 큰 박스 */}
        <div className="w-full max-w-5xl bg-white/40 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-sm">
          {/* 상단 넓은 영역 */}
          <div className="px-8 py-10">
            <p className="text-sm text-slate-600 mb-2">
              요즘, 나도 모르게 흐트러진 마음…
            </p>
            <h1 className="text-3xl font-bold text-blue-600 leading-snug">
              AI가 오늘의 의사결정 패턴을 읽어드립니다.
            </h1>

            <p className="text-black text-sm space-y-2 mb-4">
              하루 1~2줄만 기록하면,<br />
              넝쿨OS가 감정이 아닌{" "}
              <span className="font-semibold">행동 모드</span>와{" "}
              <span className="font-semibold">에너지 흐름</span>을 분석해<br />
              오늘 해야 할 일에 집중하도록 도와줘요.
            </p>
          </div>

          {/* 내부 박스 영역은 흰색 카드로 구분 */}
          <div className="px-8 pb-10 space-y-10">
            {/* 오늘의 패턴 예시 카드 — 흰색 박스 */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                {/* 왼쪽 뱃지 */}
                <span className="text-xs font-bold bg-blue-50 border border-blue-100 px-3 py-1 rounded-full text-slate-900">
                  오늘의 패턴 예시
                </span>
                {/* 우측 상단 텍스트 */}
                <span className="text-xs font-bold text-black">
                  STABILIZE → REFLECT
                </span>
              </div>

              {/* 메인 문구 */}
              <p className="text-black font-bold text-lg mb-4 leading-snug">
                오늘은 속도를 늦추고, 쌓여 있던 생각과 일을 정리하면 좋은 날이에요.
              </p>

              {/* 리스트 */}
              <ul className="text-black text-sm space-y-2 mb-4">
                <li>• 머릿속을 차지하던 할 일 3가지만 남기기</li>
                <li>• ‘해야 했는데 미뤄둔 것’ 1개만 오늘 처리하기</li>
                <li>• 잠들기 전, 오늘 하루를 한 줄로 정리해보기</li>
              </ul>

              {/* 하단 설명 */}
              <p className="text-black text-sm">
                이런 제안이{" "}
                <span className="font-bold text-blue-600">당신의 기록</span>
                을 바탕으로 자동 생성됩니다.
              </p>
            </section>

            {/* 기능 3개 카드 — 흰색 박스 */}
            <section className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-blue-500 mb-2">행동 모드 분석</h3>
                <p className="text-sm text-black leading-relaxed">
                  DELAY, STABILIZE, DECISIVE 등 6가지 모드로 오늘의 상태를
                  정리해줘요.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-blue-500 mb-2">
                  에너지 흐름 리듬 보기
                </h3>
                <p className="text-sm text-black leading-relaxed">
                  요즘 내가 언제 흔들리고, 언제 몰입하는지 주간·월간 패턴으로
                  확인해요.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-blue-500 mb-2">
                  오늘의 Next Action
                </h3>
                <p className="text-sm text-black leading-relaxed">
                  모드에 맞춰, 오늘 딱 1~3개의 실행 추천을 AI가 제안해줘요.
                </p>
              </div>
            </section>

            {/* CTA 버튼 */}
            <section>
              <button
                onClick={handleStart}
                className="w-full md:w-auto h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-md transition"
              >
                오늘의 패턴 무료 분석하기
              </button>
              <p className="mt-2 text-xs text-slate-500">
                Google 계정으로 1초 로그인 · 언제든지 탈퇴 가능 · 광고 없음
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* 하단 Footer 영역 */}
      <Footer />
    </div>
  );
}
