export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto p-6 text-sm leading-6 text-gray-700">
      <h1 className="text-2xl font-bold mb-4">이용약관</h1>

      <p className="mb-4">
        본 약관은 넝쿨OS(이하 “서비스”) 이용과 관련하여 서비스 제공자와 이용자의 권리,
        의무 및 책임 사항을 규정함을 목적으로 합니다.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">1. 서비스의 제공</h2>
      <p>
        본 서비스는 이용자가 매일 간단한 기록을 입력하면 상태 분석 및 의사결정 모드를
        제공하는 자기관리 도구입니다.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">2. 이용자의 의무</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>허위 정보 입력 금지</li>
        <li>서비스의 정상적 운영을 방해하는 행위 금지</li>
        <li>개인 계정의 보안 유지 책임</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">3. 계정 관리</h2>
      <p>
        서비스는 Google OAuth 인증을 통해 로그인합니다. 이용자가 계정 삭제를 원할 경우
        설정 메뉴 또는 문의를 통해 요청할 수 있습니다.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">4. 기록 데이터</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>이용자가 작성한 기록은 본인 계정에 귀속됩니다.</li>
        <li>기록 삭제는 이용자가 언제든지 수행할 수 있습니다.</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">5. 책임의 제한</h2>
      <p>
        서비스는 개인의 상태 분석 및 조언을 돕는 참고용 도구이며,
        전문 상담 또는 진단의 대체 수단이 아닙니다.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">6. 약관 변경</h2>
      <p>
        서비스는 필요 시 약관을 변경할 수 있으며, 변경 시 앱 내 공지 또는 접속 화면을 통해 안내합니다.
      </p>

      <p className="mt-8 text-xs text-gray-500">
        본 이용약관은 서비스 개선 및 법령 개정에 따라 변경될 수 있습니다.
      </p>
    </div>
  );
}
