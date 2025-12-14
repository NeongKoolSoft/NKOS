// src/lib/modePatterns.js
// 넝쿨OS FSM 보조 패턴 (최소 패턴 버전)
// 👉 순수 FSM(신호 기반)이 1순위 판단이고,
// 👉 패턴은 "아주 명확한 의도"에만 +1점 정도만 보조한다.

export function getPatternBoosts(text) {
  const t = (typeof text === "string" ? text : String(text ?? "")).trim();
  const has = (w) => t.includes(w);

  return {
    // DELAY는 패턴 보정 안 함 (신호로 충분)
    DELAY: 0,

    // 🔹 STABILIZE — 안정/회복/컨디션 회복 계열
    STABILIZE:
      has("회복") ||
      has("안정") ||
      has("컨디션") ||
      has("루틴") ||
      has("유지") ||
      has("리듬") ||
      has("무리하지") ? 1 : 0,      

    // 🔹 REFLECT — 되돌아보기/되짚기/기준 재정비 계열
    REFLECT:
      has("되돌아보") ||
      has("돌아보니") ||
      has("되짚어") ||
      has("기준을 다시") ||
      has("다시 생각해보") ? 1 : 0,

    // 🔹 SIMPLIFY — 단순화·압축·핵심만·3줄
    SIMPLIFY:
      has("핵심만") ||
      has("선택을 줄") ||
      has("단순하게") ||
      has("3줄") ||
      has("세 줄") ||
      has("세 개만") ||
      has("최소화") ? 1 : 0,

    // 🔹 DECISIVE — 지금/바로 + 시작/실행/진행
    DECISIVE:
      (has("바로") || has("지금")) &&
      (has("시작") || has("실행") || has("진행")) ? 1 : 0,

    // 🔹 EXPLORATORY — 새로운 방법/다른 방식/새로운 시도
    EXPLORATORY:
      has("새로운 방법") ||
      has("새로운 시도") ||
      has("다른 방식") ||
      has("탐색하고 싶다") ? 1 : 0,
  };
}
