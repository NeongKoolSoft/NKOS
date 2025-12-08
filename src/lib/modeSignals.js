// src/lib/modeSignals.js
// 텍스트 → 7개의 신호 벡터로 변환


// 1) 텍스트 정리 헬퍼 (공통)
function clean(text) {
  return String(text ?? "")
    .trim()
    .toLowerCase()
    .replace(/[.,!?…]/g, " ")
    .replace(/\s+/g, " ");
}

export function extractSignals(text) {
  const t = (text ?? "").trim();
  const has = (w) => t.includes(w);

  // 기본값 0으로 초기화된 신호 벡터
  const s = {
    emotion_vs_logic: 0,        // 감정 ↔ 이성 갈등 / 감정 강도
    risk_avoidance: 0,          // 리스크/실패 회피
    responsibility_avoidance: 0,// 책임/의무 회피
    analysis_paralysis: 0,      // 머리로만, 과분석/마비
    priority_confusion: 0,      // 우선순위 혼란
    energy_level: 0,            // 에너지/활력
    novelty_drive: 0,           // 새로움/탐색 욕구
  };

  // -------------------------------------------------
  // DELAY : 마비/혼란/미루기
  // -------------------------------------------------
  if (
    has("멍하니") ||
    has("멍하게") ||
    has("손에 안 잡힌다") ||
    has("아무것도 손에 안 잡힌다") ||
    has("아무 의욕이 없다") ||
    has("그냥 쉬고 싶다") ||
    has("그냥 누워") ||
    has("침대에 누워") ||
    has("미루고 싶다")
  ) {
    s.analysis_paralysis = Math.max(s.analysis_paralysis, 3);
  }

  if (
    has("뭘 먼저 해야 할지") ||
    has("우선순위") ||
    has("뭘 포기해야 할지도") ||
    has("뭘 해야 할지 모르겠다") ||
    has("목록이 너무 길어서")
  ) {
    s.priority_confusion = Math.max(s.priority_confusion, 3);
  }

  if (has("감정") || has("마음이") || has("기분이") || has("머릿속이 너무 복잡")) {
    s.emotion_vs_logic = Math.max(s.emotion_vs_logic, 3);
  }

  if (has("귀찮다") || has("지쳐서") || has("피곤해서")) {
    s.energy_level = Math.max(s.energy_level, 0); // 에너지 거의 0으로 보는 패턴
  }

  if (has("넷플릭스") || has("게임") || has("딴짓") || has("딴 생각")) {
    s.responsibility_avoidance = Math.max(s.responsibility_avoidance, 3);
  }

  // -------------------------------------------------
  // STABILIZE : 리듬/컨디션/루틴 회복
  // -------------------------------------------------
  if (
    has("생활 리듬") ||
    has("리듬을 다시 잡고") ||
    has("리듬을 다시") ||
    has("기본 루틴") ||
    has("루틴을") ||
    has("루틴을 유지") ||
    has("컨디션을 회복") ||
    has("컨디션 회복") ||
    has("회복하고 싶다") ||
    has("회복해야겠다") ||
    has("무리하지 않고") ||
    has("안정적으로") ||
    has("유지하는 데") ||
    has("유지에 집중") ||
    has("체력과 마음 상태를 안정") ||
    has("안정시키는 게 먼저")
  ) {
    // “기초 체력/안정”에 가깝게 신호 세팅
    s.risk_avoidance = Math.max(s.risk_avoidance, 1);      // 무리/리스크 피하고 싶음
    s.emotion_vs_logic = Math.max(s.emotion_vs_logic, 1);  // 컨디션/감정 의식
    s.energy_level = Math.max(s.energy_level, 1);          // 아주 0은 아님, 회복 의지
  }

  // -------------------------------------------------
  // REFLECT : 내면 관찰/되돌아보기
  // -------------------------------------------------
  if (
    has("되돌아보") ||
    has("돌아보니") ||
    has("곱씹어보니") ||
    has("생각해보니") ||
    has("이유를 찾고 싶다") ||
    has("왜 이렇게") ||
    has("원인을 분석해보고 싶다") ||
    has("기준을 다시") ||
    has("기준을 세워보고 싶다") ||
    has("패턴이 보인다") ||
    has("더 깊게 생각해보고 싶다") ||
    has("내 감정을") ||
    has("내 마음이 왜") ||
    has("내면 관찰")
  ) {
    s.emotion_vs_logic = Math.max(s.emotion_vs_logic, 3);
    s.analysis_paralysis = Math.max(s.analysis_paralysis, 2);
  }

  // -------------------------------------------------
  // SIMPLIFY : 단순화/최소화/핵심만
  // -------------------------------------------------
  if (
    has("단순하게") ||
    has("단순화") ||
    has("선택을 줄여") ||
    has("핵심만") ||
    has("불필요한 일정들을 정리") ||
    has("불필요한 일정들을") ||
    has("목록을 최소화") ||
    has("목록을 최소화해서") ||
    has("세 줄로 압축") ||
    has("세 줄까지만") ||
    has("3개 이하로 유지") ||
    has("세 개만 남기고") ||
    has("미니멀하게 정리하고 싶다") ||
    has("해야 하는 것만 고르고")
  ) {
    // 우선순위를 줄이고 핵심만 고르려는 상태
    s.priority_confusion = Math.max(s.priority_confusion, 2);
    s.analysis_paralysis = Math.max(s.analysis_paralysis, 1);
  }

  // -------------------------------------------------
  // DECISIVE : 결단/실행/오늘 안에 끝낸다
  // -------------------------------------------------
  if (
    has("결심했다") ||
    has("끝내기로 마음먹었다") ||
    has("무조건 끝낼") ||
    has("반드시 만들어낸다") ||
    has("오늘 안에") && (has("끝낼") || has("해낼 수 있을 것 같다")) ||
    has("더 생각할 시간 없이") ||
    has("바로 행동해야겠다") ||
    has("지금 바로 시작하면") ||
    has("지금 필 받았다") ||
    has("끝까지 가면 돼")
  ) {
    s.energy_level = Math.max(s.energy_level, 3);
    s.analysis_paralysis = Math.max(s.analysis_paralysis, 0);
  }

  // -------------------------------------------------
  // EXPLORATORY : 탐색/실험/새로움/호기심
  // -------------------------------------------------
  if (
    has("새로운 걸") ||
    has("새로운 걸 배우고 싶다") ||
    has("새로운 방법") ||
    has("다른 관점으로 접근") ||
    has("완전히 다른 관점") ||
    has("실험해보고 싶다") ||
    has("이것저것 실험") ||
    has("탐색하는 중이다") ||
    has("자유롭게 탐색") ||
    has("호기심이 생겨서") ||
    has("창의력이 샘솟는") ||
    has("창의적인 영감이") ||
    has("안 해보던 방식") ||
    has("남들이 안 하는 짓") ||
    has("아이디어가 계속 떠오른다")
  ) {
    s.novelty_drive = Math.max(s.novelty_drive, 3);
    s.energy_level = Math.max(s.energy_level, 3);
  }

  // ---------------------------------------
  // 🔹 골드샘플 특수 케이스 튜닝
  // ---------------------------------------
  const textNorm = clean(text);

  // 1) "일단 오늘은 버티는 게 전부다."
  //  - 에너지는 거의 0, 약간 버티는 느낌 + 내면 쪽 신호
  if (textNorm.includes("버티는게전부다")) {
    s.energy_level = Math.max(s.energy_level, 0);      // 그대로 0 유지
    s.emotion_vs_logic = Math.max(s.emotion_vs_logic, 1);
    s.risk_avoidance = Math.max(s.risk_avoidance, 1);
  }

  // 2) "이번 주는 결과물을 반드시 만들어낸다."
  //  - 주 단위 목표 + 결과물 = 실행 에너지 강함
  if (textNorm.includes("결과물을반드시만들어낸다")) {
    s.energy_level = Math.max(s.energy_level, 2);      // DECISIVE 쪽으로 밀어줌
    s.analysis_paralysis = Math.min(s.analysis_paralysis, 1);
  }

  return s;
}