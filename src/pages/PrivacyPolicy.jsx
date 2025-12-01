export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto p-6 text-sm leading-6 text-gray-700">
      <h1 className="text-2xl font-bold mb-4">개인정보처리방침</h1>

      <p className="mb-4">
        넝쿨OS(이하 “서비스”)는 이용자의 개인정보를 중요하게 생각하며,
        「개인정보 보호법」 등 관련 법령을 준수합니다. 본 방침은 서비스 이용과 관련하여
        수집되는 개인정보의 처리 목적, 보관 기간, 이용자 권리 등을 안내합니다.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">1. 수집하는 개인정보 항목</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Google OAuth 로그인 정보(이메일)</li>
        <li>사용자가 직접 입력한 하루 기록(텍스트)</li>
        <li>서비스 이용 과정에서 자동 생성되는 로그 데이터</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">2. 개인정보 수집 및 이용 목적</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>로그인 기반 사용자 식별</li>
        <li>사용자별 기록 저장 및 분석 기능 제공</li>
        <li>서비스 품질 향상을 위한 통계 분석</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">3. 개인정보 보관 및 이용 기간</h2>
      <p>
        이용자가 서비스에서 직접 삭제하지 않는 한, 기록 및 계정 정보는 계속 보관됩니다.
        단, 개인정보 삭제 요청 시 지체 없이 삭제합니다.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">4. 개인정보 제3자 제공</h2>
      <p>
        서비스는 이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">5. 개인정보처리 위탁</h2>
      <p>
        서비스는 데이터 저장 및 인증 기능 제공을 위해 Supabase 및 Google OAuth 서비스를 이용합니다.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">6. 이용자 권리</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>개인정보 조회 및 수정</li>
        <li>계정 삭제 요청 가능</li>
        <li>개인 기록 삭제 가능</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">7. 개인정보 보호를 위한 조치</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>암호화 기반 저장</li>
        <li>접근 권한 최소화</li>
        <li>주요 설정 및 민감 데이터 보호 조치</li>
      </ul>

      <p className="mt-8 text-xs text-gray-500">
        본 개인정보처리방침은 서비스 개선 및 법령 개정에 따라 변경될 수 있습니다.
      </p>
    </div>
  );
}
