// src/lib/modeSignals.js
// 텍스트에서 넝쿨OS 신호 벡터 추출 (FSM 2.1)

// 0~3 사이 값으로 제한
const clamp = (x) => Math.max(0, Math.min(3, x));

export function extractSignals(text) {
  const t = (text || "").trim();
  const has = (w) => t.includes(w);

  // 기본값
  // 0: 매우 낮음 / 3: 매우 높음
  let emotion_vs_logic = 1;          // 0: 매우 논리 / 3: 매우 감정
  let risk_avoidance = 0;            // 0: 위험 감수 / 3: 위험 회피
  let responsibility_avoidance = 0;  // 0: 책임 적극 수용 / 3: 회피
  let analysis_paralysis = 0;        // 0~3
  let priority_confusion = 0;        // 0~3
  let energy_level = 1;              // 0: 완전 바닥 / 3: 에너지 충만
  let novelty_drive = 0;             // 0: 안정 선호 / 3: 새로움/탐색 선호

  // -----------------------------
  // 감정 vs 논리
  // -----------------------------
  if (
    has("불안") ||
    has("초조") ||
    has("짜증") ||
    has("우울") ||
    has("화가")
  ) {
    emotion_vs_logic += 1;
  }

  if (
    has("논리") ||
    has("분석") ||
    has("정리했다") ||
    has("계획을 정리") ||
    has("정리했고")
  ) {
    emotion_vs_logic -= 1;
  }

  // -----------------------------
  // 위험 회피 (실패/걱정/위험)
  // -----------------------------
  if (
    has("위험") ||
    has("망할까") ||
    has("망하면") ||
    has("실패할까") ||
    has("실패하면")
  ) {
    risk_avoidance += 2;
  }

  if (
    has("불안") ||
    has("걱정") ||
    has("초조")
  ) {
    risk_avoidance += 1;
  }

  if (
    has("일단 해보") ||
    has("시도해보") ||
    has("도전") ||
    has("실험")
  ) {
    risk_avoidance -= 1;
  }

  // -----------------------------
  // 책임 회피
  // -----------------------------
  if (
    has("책임지기 싫") ||
    has("내 탓") ||
    has("남 탓") ||
    has("피하고 싶")
  ) {
    responsibility_avoidance += 2;
  }

  // -----------------------------
  // 분석 마비
  // -----------------------------
  if (
    has("계속 생각만") ||
    has("머리만 복잡") ||
    has("고민만") ||
    has("생각만 많")
  ) {
    analysis_paralysis += 2;
  }

  if (
    has("결정을 못") ||
    has("결정 못했") ||
    has("결정이 안 난다")
  ) {
    analysis_paralysis += 2;
  }

  // -----------------------------
  // 우선순위 혼란
  // -----------------------------
  if (
    has("뭐부터") ||
    has("우선순위") ||
    has("정리가 안") ||
    has("막연") ||
    has("헷갈") ||
    has("복잡해서 정리")
  ) {
    priority_confusion += 2;
  }

  // -----------------------------
  // 에너지 레벨
  // -----------------------------
  if (
    has("기운이 없다") ||
    has("피곤") ||
    has("지쳤다") ||
    has("힘들다")
  ) {
    energy_level -= 1;
  }

  if (
    has("에너지가 있다") ||
    has("기운이 난다") ||
    has("힘이 난다") ||
    has("의욕이 생겼다")
  ) {
    energy_level += 1;
  }

  // -----------------------------
  // 새로움/탐색 욕구 (novelty_drive)
  // -----------------------------
  const hasNovelKeyword =
    has("새로운") ||
    has("아이디어") ||
    has("실험") ||
    has("탐색") ||
    has("시도해보고 싶다") ||
    has("해보고 싶다");

  const hasExcited =
    has("설레") ||
    has("기대된다") ||
    has("재미있을 것 같다");

  if (hasNovelKeyword && hasExcited) {
    // 설렘 + 새로움
    novelty_drive += 3;
  } else if (hasNovelKeyword) {
    novelty_drive += 2;
  }

  if (has("아이디어가 떠올랐다") || has("아이디어가 떠오른")) {
    novelty_drive += 2;
  }

  return {
    emotion_vs_logic: clamp(emotion_vs_logic),
    risk_avoidance: clamp(risk_avoidance),
    responsibility_avoidance: clamp(responsibility_avoidance),
    analysis_paralysis: clamp(analysis_paralysis),
    priority_confusion: clamp(priority_confusion),
    energy_level: clamp(energy_level),
    novelty_drive: clamp(novelty_drive),
  };
}
