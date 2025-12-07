// src/components/AiErrorNotice.jsx
// LLM / AI 관련 에러를 사용자에게 부드럽게 안내하는 공통 컴포넌트

/**
 * 백엔드에서 내려주는 code 기준으로 사용자용 메시지 생성
 */
export function getAiErrorMessage(code, fallbackMessage) {
  switch (code) {
    case "LOCAL_DAILY_LIMIT":
    case "REMOTE_QUOTA_EXCEEDED":
      return {
        title: "오늘 AI 분석 한도가 모두 사용되었어요.",
        body: [
          "기록은 정상적으로 저장되었지만,",
          "모드 분석·추천·리포트 생성은 내일 다시 사용할 수 있어요.",
          "오늘은 그냥 편하게 기록만 쌓아두셔도 괜찮아요.",
        ],
      };

    case "REMOTE_BLOCKED":
      return {
        title: "잠시 후 다시 시도해 주세요.",
        body: [
          "지금은 AI 요청이 몰려 잠시 대기 중이에요.",
          "몇 분 뒤에 다시 시도하면 정상적으로 동작할 가능성이 높아요.",
        ],
      };

    case "LLM_DISABLED":
      return {
        title: "현재 AI 기능이 비활성화되어 있어요.",
        body: [
          "내부 점검 또는 설정 변경 중일 수 있어요.",
          "잠시 후 다시 시도해 주세요.",
        ],
      };

    case "NO_API_KEY":
      return {
        title: "AI 설정에 문제가 있어요.",
        body: [
          "서버의 AI 설정(API Key)이 올바르게 설정되지 않았어요.",
          "운영자에게 문의해 주세요.",
        ],
      };

    case "LLM_UNKNOWN_ERROR":
    default:
      return {
        title: "AI 분석 중 문제가 발생했어요.",
        body: [
          fallbackMessage ||
            "일시적인 오류일 수 있어요. 잠시 후 다시 시도해 주세요.",
        ],
      };
  }
}

/**
 * 실제 UI 컴포넌트
 *
 * props:
 *  - code: 백엔드에서 내려준 에러 코드
 *  - message: 백엔드에서 내려준 원본 메시지(있으면 사용)
 *  - onRetry?: 다시 시도 버튼 클릭 시 호출
 *  - compact?: true면 조금 더 작은 스타일
 */
export default function AiErrorNotice({ code, message, onRetry, compact }) {
  const { title, body } = getAiErrorMessage(code, message);

  return (
    <div
      className={
        "nk-card-soft border border-amber-200 bg-amber-50/80 text-[12px] text-amber-900 space-y-1 " +
        (compact ? "py-2 px-3" : "py-3 px-4")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold flex items-center gap-1.5">
          <span>⚠️</span>
          <span>{title}</span>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-[11px] px-2 py-1 rounded-full border border-amber-300 bg-white/70 hover:bg-white transition"
          >
            다시 시도
          </button>
        )}
      </div>

      <div className="text-[11px] leading-relaxed text-amber-800">
        {body.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
      </div>
    </div>
  );
}
