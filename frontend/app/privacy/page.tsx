import Link from 'next/link';

export const metadata = {
  title: '개인정보처리방침 - 프라이스체크',
  description: '프라이스체크 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] bg-gray-50 py-12">
      <div className="container-narrow">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">개인정보처리방침</h1>
          <p className="text-gray-500 mb-8">최종 수정일: 2024년 11월 29일</p>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-8 leading-relaxed">
              프라이스체크(이하 &quot;서비스&quot;)는 개인정보보호법에 따라 이용자의 개인정보를 보호하고
              이와 관련한 고충을 신속하고 원활하게 처리하기 위하여 다음과 같이 개인정보처리방침을
              수립·공개합니다.
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                제1조 (수집하는 개인정보 항목)
              </h2>
              <p className="text-gray-600 mb-3">서비스는 회원가입 및 서비스 제공을 위해 다음의 개인정보를 수집합니다:</p>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-2">필수 수집 항목</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>이메일 주소</li>
                  <li>비밀번호 (암호화 저장)</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">자동 수집 항목</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>서비스 이용기록 (가격 조회 히스토리)</li>
                  <li>접속 로그, IP 주소, 쿠키</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                제2조 (개인정보의 수집 및 이용 목적)
              </h2>
              <p className="text-gray-600 mb-3">서비스는 수집한 개인정보를 다음의 목적으로 이용합니다:</p>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li>
                  <strong>회원 관리:</strong> 회원제 서비스 이용에 따른 본인확인, 개인식별, 불량회원 부정이용 방지
                </li>
                <li>
                  <strong>서비스 제공:</strong> 가격 조회 히스토리 저장, 찜하기 기능 제공
                </li>
                <li>
                  <strong>서비스 개선:</strong> 신규 서비스 개발, 서비스 품질 향상
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                제3조 (개인정보의 보유 및 이용 기간)
              </h2>
              <p className="text-gray-600 mb-3">
                서비스는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
                단, 관련 법령에 의해 보존이 필요한 경우 아래와 같이 보관합니다:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="text-gray-600 space-y-2">
                  <li><strong>회원 탈퇴 시:</strong> 즉시 삭제 (단, 부정이용 방지를 위해 이메일은 30일간 보관)</li>
                  <li><strong>서비스 이용기록:</strong> 3년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                  <li><strong>접속 로그:</strong> 3개월 (통신비밀보호법)</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                제4조 (개인정보의 제3자 제공)
              </h2>
              <p className="text-gray-600">
                서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다.
                다만, 다음의 경우에는 예외로 합니다:
              </p>
              <ul className="list-disc list-inside text-gray-600 mt-3 space-y-1">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령의 규정에 의하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                제5조 (개인정보 처리의 위탁)
              </h2>
              <p className="text-gray-600 mb-3">
                서비스는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-900">수탁업체</th>
                      <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-900">위탁 업무</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">Amazon Web Services (AWS)</td>
                      <td className="border border-gray-200 px-4 py-2">클라우드 서버 및 이미지 저장소 운영</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">Railway / Render</td>
                      <td className="border border-gray-200 px-4 py-2">백엔드 서버 호스팅</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">Vercel</td>
                      <td className="border border-gray-200 px-4 py-2">프론트엔드 서버 호스팅</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                제6조 (이용자의 권리와 행사 방법)
              </h2>
              <p className="text-gray-600 mb-3">이용자는 다음의 권리를 행사할 수 있습니다:</p>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li><strong>열람권:</strong> 본인의 개인정보 처리 현황을 열람할 수 있습니다.</li>
                <li><strong>정정권:</strong> 개인정보가 잘못된 경우 정정을 요청할 수 있습니다.</li>
                <li><strong>삭제권:</strong> 개인정보의 삭제를 요청할 수 있습니다.</li>
                <li><strong>처리정지권:</strong> 개인정보 처리의 정지를 요청할 수 있습니다.</li>
              </ol>
              <p className="text-gray-600 mt-3">
                위 권리 행사는 서비스 내 설정 또는 개인정보 보호책임자에게 연락하여 요청할 수 있습니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                제7조 (개인정보의 안전성 확보 조치)
              </h2>
              <p className="text-gray-600 mb-3">서비스는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li><strong>비밀번호 암호화:</strong> 비밀번호는 bcrypt 알고리즘으로 암호화하여 저장합니다.</li>
                <li><strong>통신 암호화:</strong> HTTPS를 통해 모든 데이터 전송을 암호화합니다.</li>
                <li><strong>접근 제한:</strong> 개인정보에 대한 접근 권한을 최소한으로 제한합니다.</li>
                <li><strong>보안 프로그램:</strong> 해킹 등에 대비하여 보안 프로그램을 설치·운영합니다.</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                제8조 (개인정보 자동 수집 장치의 설치·운영 및 거부)
              </h2>
              <p className="text-gray-600 mb-3">
                서비스는 이용자에게 개별적인 서비스를 제공하기 위해 쿠키(cookie)를 사용합니다.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">쿠키의 사용 목적</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>로그인 상태 유지</li>
                  <li>서비스 이용 편의 제공</li>
                </ul>
                <h3 className="font-medium text-gray-900 mt-4 mb-2">쿠키 설정 거부 방법</h3>
                <p className="text-gray-600 text-sm">
                  웹 브라우저의 설정에서 쿠키를 거부할 수 있습니다. 단, 쿠키를 거부할 경우 서비스 이용에
                  제한이 있을 수 있습니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                제9조 (개인정보 보호책임자)
              </h2>
              <p className="text-gray-600 mb-3">
                서비스는 개인정보 처리에 관한 업무를 총괄하고, 개인정보 처리와 관련한 불만처리 및
                피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">
                  <strong>개인정보 보호책임자</strong><br />
                  담당: 프라이스체크 운영팀<br />
                  이메일: privacy@pricecheck.kr
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                제10조 (권익침해 구제방법)
              </h2>
              <p className="text-gray-600 mb-3">
                이용자는 개인정보침해로 인한 구제를 받기 위하여 아래 기관에 분쟁해결이나 상담 등을 신청할 수 있습니다:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm text-gray-600">
                <p>
                  <strong>개인정보분쟁조정위원회:</strong> (국번없이) 1833-6972 | www.kopico.go.kr
                </p>
                <p>
                  <strong>개인정보침해신고센터:</strong> (국번없이) 118 | privacy.kisa.or.kr
                </p>
                <p>
                  <strong>대검찰청 사이버수사과:</strong> (국번없이) 1301 | www.spo.go.kr
                </p>
                <p>
                  <strong>경찰청 사이버안전국:</strong> (국번없이) 182 | cyberbureau.police.go.kr
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                제11조 (개인정보처리방침 변경)
              </h2>
              <p className="text-gray-600">
                이 개인정보처리방침은 2024년 11월 29일부터 적용됩니다. 법령, 정책 또는 보안기술의 변경에 따라
                내용이 추가·삭제·수정될 경우, 변경사항의 시행 7일 전부터 서비스 내 공지사항을 통해 고지합니다.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-700 font-medium no-underline"
            >
              &larr; 홈으로 돌아가기
            </Link>
            <Link
              href="/terms"
              className="text-gray-600 hover:text-gray-700 font-medium no-underline sm:ml-auto"
            >
              이용약관 보기 &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
