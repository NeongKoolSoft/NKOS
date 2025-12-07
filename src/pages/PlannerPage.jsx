// src/pages/PlannerPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  fetchPlannerForDate,
  getTodayDateString,
  savePlannerItem,
  upsertPlannerEntry,
  deletePlannerItem,
  fetchModeForDate,
} from "../lib/plannerRepository";

function PlannerPage() {
  const [userId, setUserId] = useState(null);
  const [date, setDate] = useState(getTodayDateString());

  const [entry, setEntry] = useState(null); // nkos_planner_entries
  const [items, setItems] = useState([]); // planner_items

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [modeForDate, setModeForDate] = useState(null);
  const [completionStats, setCompletionStats] = useState({
    completed: 0,
    total: 0,
    rate: null,
  });

  // 1) 로그인 유저 확인
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("로그인이 필요합니다.");
        setLoading(false);
        return;
      }
      setUserId(user.id);
    };
    loadUser();
  }, []);

  // 2) 유저 + 날짜가 정해지면 플래너 + 모드 불러오기
  useEffect(() => {
    if (!userId || !date) return;

    const run = async () => {
      setLoading(true);
      setError("");
      try {
        // 2-1) 플래너 헤더 + 아이템
        const { entry, items } = await fetchPlannerForDate(userId, date);

        setEntry(
          entry || {
            title: "",
            status: "",
            note: "",
          }
        );
        setItems(items || []);

        // 2-2) 오늘의 모드
        const mode = await fetchModeForDate(userId, date);
        setModeForDate(mode);

        // 2-3) 실행률 계산
        setCompletionStats(calculateCompletionStats(items || []));
      } catch (e) {
        console.error("Planner load error:", e);
        setError("플래너를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [userId, date]);

  // 3) 아이템 목록이 바뀔 때마다 실행률 재계산
  useEffect(() => {
    setCompletionStats(calculateCompletionStats(items));
  }, [items]);

  // 4) 헤더 저장 (제목/메모 등)
  const handleSaveHeader = async () => {
    if (!userId) return;
    try {
      setSaving(true);
      const updated = await upsertPlannerEntry(userId, date, entry || {});
      setEntry(updated);
    } catch (e) {
      console.error("Header save error:", e);
      alert("플래너 정보를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 5-1) 아이템 로컬 상태만 업데이트 (DB 저장 X)
  const handleChangeItemLocal = (idx, changes) => {
    setItems((prev) => {
      const target = prev[idx] || { id: null, text: "", completed: false };
      const next = [...prev];
      next[idx] = { ...target, ...changes };
      return next;
    });
  };

  // 5-2) 실제 Supabase 저장 (체크박스/blur 시 호출)
  const handleSaveItem = async (idx, extraChanges = {}) => {
    if (!userId) return;
    const current = items[idx];
    if (!current) return;

    const payload = { ...current, ...extraChanges };

    try {
      setSaving(true);
      const saved = await savePlannerItem(userId, date, payload);

      setItems((prev) => {
        const next = [...prev];
        next[idx] = saved;
        return next;
      });
    } catch (e) {
      console.error("Item save error:", e);
      alert("계획 줄을 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 6) 새로운 줄 추가 (최대 3줄)
  const handleAddItem = () => {
    if (items.length >= 3) {
      alert(
        "넝쿨플래너는 기본 3줄 계획을 권장합니다. (필요하면 코드에서 제한을 풀어도 됩니다!)"
      );
      return;
    }
    setItems((prev) => [...prev, { id: null, text: "", completed: false }]);
  };

  // 7) 아이템 삭제
  const handleDeleteItem = async (idx) => {
    const target = items[idx];
    if (!target) return;
    if (target.id) {
      try {
        setSaving(true);
        await deletePlannerItem(userId, target.id);
      } catch (e) {
        console.error("Item delete error:", e);
        alert("계획 줄을 삭제하지 못했습니다.");
      } finally {
        setSaving(false);
      }
    }
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // UI -----------------------------------------------------------------
  if (loading && !userId) {
    return (
      <section className="py-6 px-5">
        <div className="max-w-3xl mx-auto text-center text-gray-400">
          로그인 정보를 확인하는 중입니다...
        </div>
      </section>
    );
  }

  const { completed, total, rate } = completionStats;

  return (
    <section className="py-6 px-5 pb-20">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 제목 영역 */}
        <div className="flex items-center justify-between">
          <h2 className="nk-title-main text-2xl font-bold">넝쿨플래너</h2>
          <input
            type="date"
            className="border rounded px-2 py-1 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {error && (
          <div className="nk-banner-strong text-xs md:text-sm">{error}</div>
        )}

        {/* 헤더 (제목 / 메모) */}
        <div className="nk-card-soft space-y-3">
          <div>
            <label className="text-xs text-gray-500">오늘의 한 줄 제목</label>
            <input
              type="text"
              className="w-full mt-1 border rounded px-3 py-2 text-sm"
              placeholder="예: 오늘은 '속도보다 방향' 점검하기"
              value={entry?.title || ""}
              onChange={(e) =>
                setEntry((prev) => ({ ...(prev || {}), title: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">메모 / 의도</label>
            <textarea
              className="w-full mt-1 border rounded px-3 py-2 text-sm resize-none"
              rows={3}
              placeholder="오늘 하루를 어떻게 쓰고 싶은지 간단히 적어보세요."
              value={entry?.note || ""}
              onChange={(e) =>
                setEntry((prev) => ({ ...(prev || {}), note: e.target.value }))
              }
            />
          </div>

          <button
            onClick={handleSaveHeader}
            className="nk-btn-primary text-xs px-3 py-2 rounded-lg"
            disabled={saving}
          >
            {saving ? "저장 중..." : "헤더 저장"}
          </button>
        </div>

        {/* 하루 3줄 계획 */}
        <div className="nk-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              🌱 오늘의 3줄 계획
            </h3>
            <button
              className="text-xs text-nk-primary"
              onClick={handleAddItem}
            >
              + 줄 추가
            </button>
          </div>

          {items.length === 0 && (
            <p className="text-xs text-gray-400">
              아직 계획이 없어요. 아래 버튼으로 첫 줄을 추가해보세요.
            </p>
          )}

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={item.id ?? idx}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={!!item.completed}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    // 로컬 업데이트 + DB 저장
                    handleChangeItemLocal(idx, { completed: checked });
                    handleSaveItem(idx, { completed: checked });
                  }}
                />
                <input
                  type="text"
                  className="flex-1 border rounded px-2 py-1 text-sm"
                  placeholder={`계획 #${idx + 1}`}
                  value={item.text || ""}
                  onChange={(e) =>
                    handleChangeItemLocal(idx, { text: e.target.value })
                  }
                  onBlur={() => handleSaveItem(idx)}
                />
                <button
                  className="text-[11px] text-gray-400"
                  onClick={() => handleDeleteItem(idx)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 오늘의 모드 × 실행률 연결 카드 */}
        <div className="nk-card space-y-2 mt-6">
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#64748b",
              marginBottom: "8px",
            }}
          >
            📊 오늘의 연결 분석
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "baseline",
              marginBottom: "4px",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: 600 }}>
              모드:&nbsp;
              <span style={{ color: "#2563eb" }}>
                {modeForDate || "모드 정보 없음"}
              </span>
            </div>

            <div style={{ fontSize: "14px", color: "#64748b" }}>
              실행률:&nbsp;
              {rate == null
                ? "계획이 아직 없어요"
                : `${completed}/${total} (${rate}%)`}
            </div>
          </div>

          <p style={{ fontSize: "14px", color: "#475569", marginTop: "8px" }}>
            {getInsightMessage(modeForDate, rate)}
          </p>
        </div>

        {saving && (
          <div className="text-[11px] text-gray-400 text-right">
            저장 중입니다...
          </div>
        )}
      </div>
    </section>
  );
}

// 실행률 계산 유틸
function calculateCompletionStats(items) {
  if (!items || items.length === 0) {
    return { completed: 0, total: 0, rate: null };
  }
  const total = items.length;
  const completed = items.filter((i) => i.completed).length;
  const rate = Math.round((completed / total) * 100);
  return { completed, total, rate };
}

// 모드 + 실행률 코멘트
function getInsightMessage(mode, rate) {
  if (!mode && rate == null) {
    return "아직 오늘의 기록과 계획이 충분하지 않아요. 모드 기록과 3줄 계획을 남겨보면 패턴이 보이기 시작해요.";
  }

  if (!mode) {
    return "오늘의 모드는 아직 확정되지 않았어요. 넝쿨Mode에서 짧은 기록을 남겨 모드를 확인해보세요.";
  }

  if (rate == null) {
    return `오늘은 ${mode} 모드예요. 아직 계획이 없으니, 가볍게 1~2줄만 세워봐도 좋아요.`;
  }

  if (rate >= 80) {
    return `${mode} 모드에서 실행력이 아주 좋네요. 이런 날에는 중요한 일을 과감하게 배치해도 좋아요.`;
  }
  if (rate >= 50) {
    return `${mode} 모드에서 필요한 일의 절반 이상을 해냈어요. 남은 한두 줄은 내일로 넘겨도 괜찮아요.`;
  }
  if (rate > 0) {
    return `${mode} 모드에서는 너무 높은 기대를 걸기보다, 작은 한 줄을 완성하는 감각을 유지해보면 좋아요.`;
  }

  return `${mode} 모드에서 오늘은 쉬어가는 흐름이었어요. 이런 날이 있어야 리듬이 유지되니, 스스로를 너무 다그치지 않아도 괜찮아요.`;
}

export default PlannerPage;
