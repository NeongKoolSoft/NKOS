import React from "react";

export default function DebugPanel({
  text,
  signals,
  patternBoosts,
  scores,
  finalMode,
}) {
  if (!text) return null;

  return (
    <div className="mt-6 nk-card bg-nk-soft-bg text-sm">
      <h3 className="font-semibold mb-2 text-gray-700">
        🔍 디버그 패널 (Developer Mode)
      </h3>

      {/* 입력 문장 */}
      <div className="mb-3">
        <div className="text-xs text-gray-500">입력 텍스트</div>
        <div className="p-2 bg-white border rounded">{text}</div>
      </div>

      {/* 신호 벡터 */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">🧬 Signals (신호 벡터)</div>
        <table className="w-full text-xs">
          <tbody>
            {Object.entries(signals || {}).map(([k, v]) => (
              <tr key={k}>
                <td className="font-semibold w-48 pr-2">{k}</td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 패턴 부스트 */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">🧠 Pattern Boosts</div>
        <table className="w-full text-xs">
          <tbody>
            {Object.entries(patternBoosts || {}).map(([k, v]) => (
              <tr key={k}>
                <td className="font-semibold w-48 pr-2">{k}</td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모드 점수 */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">📊 Mode Scores</div>
        <table className="w-full text-xs border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-1">Mode</th>
              <th className="p-1">Score</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(scores || {}).map(([mode, value]) => (
              <tr key={mode}>
                <td className="font-semibold p-1">{mode}</td>
                <td className="p-1">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 최종 모드 */}
      <div className="mt-4 p-2 bg-blue-100 border border-blue-300 rounded">
        <span className="font-semibold">🎯 Final Mode: </span>
        <span className="text-blue-700 font-bold">{finalMode}</span>
      </div>
    </div>
  );
}
