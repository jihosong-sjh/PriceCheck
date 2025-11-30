import Link from 'next/link';

export const metadata = {
  title: '이용약관 - 프라이스체크',
  description: '프라이스체크 서비스 이용약관',
};

export default function TermsPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] bg-gray-50 py-12">
      <div className="container-narrow">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">이용약관</h1>
          <p className="text-gray-500 mb-8">최종 수정일: 2024년 11월 29일</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제1조 (목적)</h2>
              <p className="text-gray-600 leading-relaxed">
                이 약관은 프라이스체크(이하 &quot;서비스&quot;)가 제공하는 중고 전자제품 가격 가이드 서비스의
                이용조건 및 절차, 이용자와 서비스 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제2조 (용어의 정의)</h2>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li>&quot;서비스&quot;란 프라이스체크가 제공하는 중고 전자제품 시세 조회 및 가격 추천 서비스를 말합니다.</li>
                <li>&quot;이용자&quot;란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
                <li>&quot;회원&quot;이란 서비스에 회원가입을 한 자로서, 지속적으로 서비스를 이용할 수 있는 자를 말합니다.</li>
                <li>&quot;비회원&quot;이란 회원가입 없이 서비스를 이용하는 자를 말합니다.</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제3조 (서비스의 내용)</h2>
              <p className="text-gray-600 mb-3">서비스는 다음과 같은 기능을 제공합니다:</p>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li>중고 전자제품(스마트폰, 노트북, 태블릿, 스마트워치, 이어폰 등)의 시세 조회</li>
                <li>제품 상태에 따른 적정 판매가 추천</li>
                <li>번개장터, 중고나라 등 주요 중고거래 플랫폼의 시세 비교</li>
                <li>회원 대상 가격 조회 히스토리 저장 및 조회</li>
                <li>회원 대상 관심 제품 찜하기 기능</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제4조 (서비스 이용)</h2>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li>서비스는 연중무휴, 1일 24시간 제공을 원칙으로 합니다.</li>
                <li>다만, 시스템 점검, 서버 장애, 기타 불가피한 사유로 서비스가 일시 중단될 수 있습니다.</li>
                <li>비회원도 기본적인 가격 조회 서비스를 이용할 수 있습니다.</li>
                <li>히스토리 저장, 찜하기 등 일부 기능은 회원가입 후 이용 가능합니다.</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제5조 (회원가입)</h2>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li>회원가입은 이용자가 약관에 동의하고 회원정보를 입력한 후, 서비스가 이를 승인함으로써 성립됩니다.</li>
                <li>회원가입 시 이메일 주소와 비밀번호가 필요합니다.</li>
                <li>타인의 정보를 도용하여 가입한 경우 회원자격이 박탈될 수 있습니다.</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제6조 (회원의 의무)</h2>
              <p className="text-gray-600 mb-3">회원은 다음 행위를 하여서는 안 됩니다:</p>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li>타인의 개인정보 도용</li>
                <li>서비스의 정상적인 운영을 방해하는 행위</li>
                <li>서비스를 이용한 영리 목적의 활동 (서비스 제공자의 사전 동의 없이)</li>
                <li>서비스의 데이터를 무단으로 수집, 복제, 배포하는 행위</li>
                <li>기타 관련 법령에 위배되는 행위</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제7조 (면책조항)</h2>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li>
                  <strong>가격 정보의 참고성:</strong> 서비스가 제공하는 가격 정보는 참고용이며,
                  실제 거래가격과 다를 수 있습니다. 서비스는 가격 정보의 정확성을 보장하지 않습니다.
                </li>
                <li>
                  <strong>거래 책임:</strong> 서비스는 중고 거래 중개를 하지 않으며,
                  이용자 간 거래로 인한 분쟁에 대해 책임을 지지 않습니다.
                </li>
                <li>
                  <strong>데이터 손실:</strong> 천재지변, 시스템 장애 등 불가항력으로 인한
                  데이터 손실에 대해 책임을 지지 않습니다.
                </li>
                <li>
                  <strong>외부 플랫폼:</strong> 시세 정보는 외부 플랫폼(번개장터, 중고나라 등)에서
                  수집되며, 해당 플랫폼의 정책 변경으로 인한 서비스 제한에 대해 책임을 지지 않습니다.
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제8조 (서비스 변경 및 중단)</h2>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li>서비스는 운영상, 기술상 필요에 따라 서비스 내용을 변경할 수 있습니다.</li>
                <li>서비스 변경 시 변경 내용을 서비스 내 공지합니다.</li>
                <li>서비스는 사업 종료 등의 사유로 서비스를 중단할 수 있으며, 이 경우 30일 전에 공지합니다.</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제9조 (회원 탈퇴)</h2>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li>회원은 언제든지 서비스 내 탈퇴 기능을 통해 회원 탈퇴를 요청할 수 있습니다.</li>
                <li>탈퇴 시 회원의 개인정보 및 서비스 이용기록은 관련 법령에 따라 일정 기간 보관 후 삭제됩니다.</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">제10조 (분쟁 해결)</h2>
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                <li>서비스와 이용자 간 발생한 분쟁은 상호 협의하여 해결합니다.</li>
                <li>협의가 이루어지지 않을 경우, 관할 법원은 서비스 제공자의 소재지를 관할하는 법원으로 합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">부칙</h2>
              <p className="text-gray-600">
                본 약관은 2024년 11월 29일부터 시행됩니다.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-700 font-medium no-underline"
            >
              &larr; 홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
