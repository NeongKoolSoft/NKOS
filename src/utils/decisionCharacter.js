// src/utils/decisionCharacter.js
// ---------------------------------------------
// "나의 의사결정 캐릭터" 계산 유틸
// ---------------------------------------------
// - 입력: Supabase logs 테이블에서 가져온 logs 배열
//   예) [{ mode: "STABILIZE", text: "...", ... }, ...]
//
// - 출력: 캐릭터 정보 객체
//   {
//     id: "CLEANER" | "HARMONIZER" | "EXPLORER" | "SEED",
//     label: "CLEANER",            // 영문 코드명
//     titleKo: "CLEANER 타입",     // 한글 이름
//     tagline: "한 줄 소개",       // UI에서 바로 쓸 한 줄 설명
//     description: "자세한 설명"   // 원하는 곳에서 추가로 사용 가능
//   }
//
// - 캐릭터 기준
//   • CLEANER     : SIMPLIFY 모드 비중이 높은 사람
//   • HARMONIZER  : STABILIZE + REFLECT + DELAY 비중이 높은 사람
//   • EXPLORER    : EXPLORATORY + DECISIVE 비중이 높은 사람
// ---------------------------------------------

// 캐릭터 분석을 시작할 최소 기록 개수
// - 이 값 미만이면 "씨앗 단계(Seed)"로 처리
export const CHARACTER_MIN_LOGS = 20;

/**
 * 주어진 logs 배열을 기반으로
 * CLEANER / HARMONIZER / EXPLORER 중 어떤 캐릭터에 가까운지 계산한다.
 *
 * @param {Array} logs - Supabase "logs" 테이블에서 가져온 전체 기록
 *   각 요소 예시:
 *   {
 *     id: number,
 *     mode: "DELAY" | "STABILIZE" | "SIMPLIFY" | "DECISIVE" | "EXPLORATORY" | "REFLECT",
 *     text: string,
 *     ...
 *   }
 *
 * @returns {Object|null} character
 *   - logs가 비어 있으면 null
 *   - 기록이 CHARACTER_MIN_LOGS 미만이면 "SEED" 캐릭터 반환
 *   - 충분히 쌓이면 세 캐릭터 중 하나 반환
 */
export function getDecisionCharacterFromLogs(logs) {
  // logs가 없거나 빈 배열이면 캐릭터 분석 불가 → null
  if (!logs || logs.length === 0) return null;

  const totalLogs = logs.length;

  // --------------------------------------------------
  // 1) 기록 개수가 너무 적으면 "씨앗 단계(Seed)"로 처리
  //    → UI에서는 "조금 더 기록이 필요합니다" 메시지 사용
  // --------------------------------------------------
  if (totalLogs < CHARACTER_MIN_LOGS) {
    return {
      id: "SEED",
      label: "Seed",
      titleKo: "씨앗 단계",
      tagline: "기록이 조금 더 필요해요.",
      description:
        "기록이 20개 이상 쌓이면, 당신만의 의사결정 캐릭터가 나타납니다.",
    };
  }

  // --------------------------------------------------
  // 2) 모드별 카운트 집계
  //    logs[] 에 담겨 있는 mode 필드를 기준으로
  //    DELAY / STABILIZE / SIMPLIFY / DECISIVE / EXPLORATORY / REFLECT
  //    각각 몇 번 등장했는지 센다.
  // --------------------------------------------------
  const counts = logs.reduce((acc, log) => {
    const m = log.mode;
    if (!m) return acc;
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});

  // --------------------------------------------------
  // 3) 캐릭터별 점수 계산 로직
  //
  //   CLEANER     : SIMPLIFY 모드가 얼마나 자주 나왔는가
  //   HARMONIZER  : STABILIZE + REFLECT + DELAY의 합
  //   EXPLORER    : EXPLORATORY + DECISIVE의 합
  //
  //   → 이 세 점수 중 가장 높은 것을 "대표 캐릭터"로 선택
  // --------------------------------------------------

  // CLEANER : 단순화/정리 성향 (SIMPLIFY)
  const cleanerScore = counts.SIMPLIFY || 0;

  // HARMONIZER : 조화/안정/균형 성향
  //   STABILIZE(안정), REFLECT(성찰), DELAY(속도 조절/휴식) 합산
  const harmonizerScore =
    (counts.STABILIZE || 0) +
    (counts.REFLECT || 0) +
    (counts.DELAY || 0);

  // EXPLORER : 탐색/실험/전진 성향
  //   EXPLORATORY(탐색), DECISIVE(결단/실행) 합산
  const explorerScore =
    (counts.EXPLORATORY || 0) + (counts.DECISIVE || 0);

  // 캐릭터 후보들을 하나의 배열로 모아서,
  // 점수(score)가 가장 높은 캐릭터를 선택한다.
  const buckets = [
    { key: "CLEANER",    score: cleanerScore },
    { key: "HARMONIZER", score: harmonizerScore },
    { key: "EXPLORER",   score: explorerScore },
  ];

  // reduce를 사용해 score가 가장 높은 항목(top)을 찾는다.
  const top = buckets.reduce((max, cur) =>
    cur.score > max.score ? cur : max
  );

  // --------------------------------------------------
  // 4) 최종 캐릭터 정보 반환
  //    - label      : 영문 코드명 (UI/로직 공통 사용)
  //    - titleKo    : 한글 이름 (툴팁/설명에 사용 가능)
  //    - tagline    : UI에 바로 보여줄 "한 줄 소개"
  //    - description: 더 자세한 설명이 필요할 때 사용
  // --------------------------------------------------
  switch (top.key) {
    case "CLEANER":
      return {
        id: "CLEANER",
        label: "CLEANER",
        titleKo: "CLEANER 타입",
        // 🔹 한 줄 소개 (UI에서 주로 사용)
        tagline: 
            "복잡한 상황에서 흐릿한 것을 걷어내고 핵심만 남깁니다.\n" +
            "선택을 단순하게 정리해 명확한 길을 찾는 타입입니다.",

        // 🔹 더 자세한 설명 (향후 상세 페이지 등에서 사용 가능)
        description:
          "정리와 단순화에 강해서, 많은 선택지 속에서도 본질만 골라내는 결정을 잘합니다.",
      };

    case "HARMONIZER":
      return {
        id: "HARMONIZER",
        label: "HARMONIZER",
        titleKo: "HARMONIZER 타입",
        // 조화 / 안정 / 균형 기반 한 줄 소개
        tagline:
            "속도를 조절하며 감정과 생각의 균형점을 차분히 맞춥니다.\n" +
            "안정과 조화를 바탕으로 무리 없는 결정을 이어가는 타입입니다.",        
        description:
          "안정과 성찰을 기반으로 리듬을 조절하며, 무리하지 않는 선택을 선호하는 타입입니다.",
      };

    case "EXPLORER":
      return {
        id: "EXPLORER",
        label: "EXPLORER",
        titleKo: "EXPLORER 타입",
        tagline:
            "새로운 가능성을 향해 자연스럽게 발걸음을 옮깁니다.\n" +
            "변화를 두려워하지 않고 탐색과 시도로 길을 열어가는 타입입니다.",        
        description:
          "변화를 두려워하지 않고, 실험과 도전을 통해 새로운 길을 열어가는 결정 패턴이 드러납니다.",
      };

    // 이론상 여기로 올 일은 거의 없지만,
    // 안전하게 기본값(Seed)을 한 번 더 정의해 둔다.
    default:
      return {
        id: "SEED",
        label: "Seed",
        titleKo: "씨앗 단계",
        tagline: "아직 패턴이 명확하지 않습니다.",
        description:
          "조금 더 다양한 상황에서 기록이 쌓이면, 뚜렷한 캐릭터가 드러납니다.",
      };
  }
}
