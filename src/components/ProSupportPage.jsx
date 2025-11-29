// src/components/ProSupportPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function ProSupportPage() {
  const [user, setUser] = useState(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | done | error
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error(error);
        setError("로그인 정보를 불러오지 못했습니다.");
        return;
      }
      if (!data.user) {
        setError("Pro 활성화 요청을 하려면 먼저 로그인해야 합니다.");
        return;
      }
      setUser(data.user);
    };
    loadUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setStatus("submitting");
    setError("");

    try {
      const { error: insertError } = await supabase
        .from("pro_activation_requests")
        .insert([
          {
            user_id: user.id,
            email: user.email,
            amount: amount ? Number(amount) : null,
            message,
          },
        ]);

      if (insertError) throw insertError;

      setStatus("done");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError("요청을 저장하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  if (error) {
    return (
      <section className="py-10 px-4">
        <div className="max-w-md mx-auto nk-card text-center text-sm text-red-500">
          {error}
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="py-10 px-4">
        <div className="max-w-md mx-auto nk-card text-center text-sm text-gray-500">
          로그인 정보를 확인하고 있습니다...
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 px-4">
      <div className="max-w-md mx-auto nk-card">
        <h2 className="nk-title-main text-xl font-bold mb-3">
          Pro 활성화 요청
        </h2>
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          카카오톡으로 후원해주셔서 감사합니다 🌱
          <br />
          아래 정보를 남겨주시면, 확인 후 24시간 이내에 Pro 권한을 열어드립니다.
        </p>

        {status === "done" ? (
          <div className="text-sm text-green-600">
            요청이 접수되었습니다. 후원 내역이 확인되면 Pro가 활성화됩니다. 🙌
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-gray-600 mb-1">이메일</label>
              <input
                type="email"
                value={user.email || ""}
                readOnly
                className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-gray-600 mb-1">
                후원 금액 (선택, 숫자만)
              </label>
              <input
                type="number"
                placeholder="예: 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-gray-600 mb-1">
                메시지 / 확인에 도움이 될 정보
              </label>
              <textarea
                rows={3}
                placeholder="예: 카카오뱅크에서 홍길동 이름으로 송금했습니다."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {status === "error" && (
              <div className="text-xs text-red-500">{error}</div>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="nk-btn-primary w-full py-2 rounded-full font-semibold"
            >
              {status === "submitting" ? "요청 보내는 중..." : "Pro 활성화 요청 보내기"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default ProSupportPage;
