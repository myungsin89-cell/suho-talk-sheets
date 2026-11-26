import React from 'react';
import { HamsterVariant } from '../types';

/**
 * 추후 PNG 이미지 파일로 교체하고 싶을 때 아래 객체에 경로를 넣으면
 * 인라인 SVG 대신 해당 PNG 이미지가 자동 렌더링됩니다.
 */
export const CUSTOM_HAMSTER_PNG_MAP: Partial<Record<HamsterVariant, string>> = {
  // welcome: '/assets/hamster-welcome.png',
  // quest: '/assets/hamster-quest.png',
  // stealth: '/assets/hamster-stealth.png',
  // heart: '/assets/hamster-heart.png',
  // power: '/assets/hamster-power.png',
  // stamp: '/assets/hamster-stamp.png',
};

interface SuhoHamsterProps {
  variant: HamsterVariant;
  size?: number;
  className?: string;
  customImageUrl?: string;
}

/**
 * 시그니처 마스코트: 수호천사 햄스터 (<SuhoHamster />)
 * - 필수 외형: 동글동글한 2등신 갈색/크림색 햄스터
 * - 안경 없음 (No glasses)
 * - 붉은색 볼터치 없음 (No red blush)
 * - 웃을 때 귀여운 외덧니(작은 송곳니 1개) 살짝 보임
 * - 진녹색(#1B4D3E) 티셔츠 착용
 * - 머리 위 노란 천사 링(#F59E0B 헤일로) + 등 뒤 작은 흰색 천사 날개
 */
export const SuhoHamster: React.FC<SuhoHamsterProps> = ({
  variant,
  size = 96,
  className = '',
  customImageUrl,
}) => {
  const overrideSrc = customImageUrl || CUSTOM_HAMSTER_PNG_MAP[variant];

  if (overrideSrc) {
    return (
      <img
        src={overrideSrc}
        alt={`수호천사 햄스터 - ${variant}`}
        style={{ width: size, height: size }}
        className={`object-contain select-none ${className}`}
      />
    );
  }

  // 6) stamp (A4 인쇄 워크북 & 배지용): 초록색 라인아트 스탬프 도장 모습
  if (variant === 'stamp') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`select-none ${className}`}
        aria-label="수호톡 공식 인증 스탬프"
      >
        {/* 외부 스탬프 이중 원 */}
        <circle
          cx="60"
          cy="60"
          r="55"
          stroke="#191919"
          strokeWidth="2.5"
          strokeDasharray="6 3"
        />
        <circle cx="60" cy="60" r="49" stroke="#191919" strokeWidth="1.8" />

        {/* 상단/하단 데코 별표(선형) */}
        <path
          d="M60 14L61.5 17.5L65 19L61.5 20.5L60 24L58.5 20.5L55 19L58.5 17.5L60 14Z"
          stroke="#1B4D3E"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* 천사 링 (헤일로) */}
        <ellipse
          cx="60"
          cy="27"
          rx="14"
          ry="4"
          stroke="#1B4D3E"
          strokeWidth="2"
        />

        {/* 작은 천사 날개 (좌/우) */}
        <path
          d="M32 68C23 64 21 55 28 53C31 52 35 55 37 59"
          stroke="#1B4D3E"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M88 68C97 64 99 55 92 53C89 52 85 55 83 59"
          stroke="#1B4D3E"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 동그란 귀 */}
        <circle cx="41" cy="39" r="8" fill="#FAF8F5" stroke="#1B4D3E" strokeWidth="2" />
        <circle cx="79" cy="39" r="8" fill="#FAF8F5" stroke="#1B4D3E" strokeWidth="2" />

        {/* 2등신 몸통 (진녹색 티셔츠 라인아트) */}
        <path
          d="M39 73C39 66 47 62 60 62C73 62 81 66 81 73V86C81 89 78 91 74 91H46C42 91 39 89 39 86V73Z"
          fill="#E8F3EC"
          stroke="#1B4D3E"
          strokeWidth="2"
        />
        {/* 티셔츠 심볼 */}
        <circle cx="58.5" cy="78.5" r="2.2" stroke="#1B4D3E" strokeWidth="1.4" />
        <circle cx="61.5" cy="78.5" r="2.2" stroke="#1B4D3E" strokeWidth="1.4" />
        <circle cx="58.5" cy="81.5" r="2.2" stroke="#1B4D3E" strokeWidth="1.4" />
        <circle cx="61.5" cy="81.5" r="2.2" stroke="#1B4D3E" strokeWidth="1.4" />

        {/* 동글동글한 머리 (볼터치 없음, 안경 없음) */}
        <rect
          x="35"
          y="35"
          width="50"
          height="36"
          rx="18"
          fill="#FAF8F5"
          stroke="#1B4D3E"
          strokeWidth="2"
        />
        {/* 이마 가르마 무늬 */}
        <path
          d="M60 35C56 41 48 44 41 44M60 35C64 41 72 44 79 44"
          stroke="#1B4D3E"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* 초롱초롱한 눈 (안경 없음) */}
        <circle cx="49" cy="51" r="2.6" fill="#1B4D3E" />
        <circle cx="71" cy="51" r="2.6" fill="#1B4D3E" />

        {/* 코와 웃는 입 + 외덧니 1개 */}
        <ellipse cx="60" cy="55" rx="2.2" ry="1.6" fill="#1B4D3E" />
        <path
          d="M54 58.5C55.5 63.5 64.5 63.5 66 58.5Z"
          fill="#FAF8F5"
          stroke="#1B4D3E"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* 귀여운 외덧니 (오른쪽 작은 송곳니 1개) */}
        <path
          d="M61.5 58.8L63 61.5L64.3 58.8"
          fill="#FAF8F5"
          stroke="#1B4D3E"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />

        {/* 하단 스탬프 리본 텍스트 라인 */}
        <text
          x="60"
          y="103"
          textAnchor="middle"
          fill="#191919"
          fontSize="8.5"
          fontWeight="800"
          letterSpacing="1.5"
        >
          SUHO-TALK CERTIFIED
        </text>
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-label={`수호천사 햄스터 - ${variant}`}
    >
      {/* 배경 은은한 오라 원 */}
      <circle
        cx="60"
        cy="64"
        r="46"
        fill={variant === 'quest' ? '#FEF3C7' : '#E8F3EC'}
        opacity="0.7"
      />

      {/* power 포즈 전용: 등 뒤 진녹색 수호 망토 */}
      {variant === 'power' && (
        <path
          d="M32 68L22 98C22 101 38 104 60 104C82 104 98 101 98 98L88 68H32Z"
          fill="#1B4D3E"
          stroke="#12352A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}

      {/* 등 뒤 작은 흰색 천사 날개 (좌/우) */}
      <g>
        <path
          d="M33 69C19 65 15 53 24 49C29 47 34 51 37 57C31 56 26 60 33 69Z"
          fill="#FFFFFF"
          stroke="#1B4D3E"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M27 59C21 57 19 52 25 50"
          stroke="#4A7C59"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M87 69C101 65 105 53 96 49C91 47 86 51 83 57C89 56 94 60 87 69Z"
          fill="#FFFFFF"
          stroke="#1B4D3E"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M93 59C99 57 101 52 95 50"
          stroke="#4A7C59"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>

      {/* 머리 위 노란 천사 링 (헤일로 #F59E0B) */}
      <ellipse
        cx="60"
        cy="17"
        rx="17"
        ry="4.8"
        stroke="#F59E0B"
        strokeWidth="3.5"
        fill="none"
      />
      <ellipse
        cx="55"
        cy="15.5"
        rx="6"
        ry="1.2"
        fill="#FEF3C7"
        opacity="0.9"
      />

      {/* 동글동글한 햄스터 귀 (좌/우) */}
      <circle
        cx="38"
        cy="34"
        r="10"
        fill="#D69E66"
        stroke="#1B4D3E"
        strokeWidth="2.2"
      />
      <circle cx="38" cy="34" r="5.5" fill="#F4DEC2" />
      <circle
        cx="82"
        cy="34"
        r="10"
        fill="#D69E66"
        stroke="#1B4D3E"
        strokeWidth="2.2"
      />
      <circle cx="82" cy="34" r="5.5" fill="#F4DEC2" />

      {/* 2등신 몸통: 진녹색(#1B4D3E) 티셔츠 */}
      <path
        d="M35 72C35 63 45 59 60 59C75 59 85 63 85 72V93C85 97.5 81 101 76 101H44C39 101 35 97.5 35 93V72Z"
        fill="#1B4D3E"
        stroke="#12352A"
        strokeWidth="2.2"
      />
      {/* 티셔츠 카라 자수 */}
      <path
        d="M50 61C53 65 67 65 70 61"
        stroke="#E8F3EC"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* 귀여운 짧은 다리 */}
      <ellipse
        cx="48"
        cy="102"
        rx="7"
        ry="4.5"
        fill="#FFF8EE"
        stroke="#1B4D3E"
        strokeWidth="2"
      />
      <ellipse
        cx="72"
        cy="102"
        rx="7"
        ry="4.5"
        fill="#FFF8EE"
        stroke="#1B4D3E"
        strokeWidth="2"
      />

      {/* 2등신 큰 얼굴 (골든 브라운 + 크림색 하관, 볼터치 없음!) */}
      <rect
        x="29"
        y="28"
        width="62"
        height="44"
        rx="22"
        fill="#DDA66E"
        stroke="#1B4D3E"
        strokeWidth="2.2"
      />
      {/* 크림색 얼굴 중앙/볼 털 패턴 */}
      <path
        d="M32 52C32 42 42 38 49 43C54 46 57 46 60 44C63 46 66 46 71 43C78 38 88 42 88 52C88 64 78 71 60 71C42 71 32 64 32 52Z"
        fill="#FFF8EE"
      />
      {/* 얼굴 외곽선 다시 깔끔하게 정리 */}
      <rect
        x="29"
        y="28"
        width="62"
        height="44"
        rx="22"
        fill="none"
        stroke="#1B4D3E"
        strokeWidth="2.2"
      />

      {/* 눈 (안경 절대 없음, 맑고 반짝이는 검은 눈동자) */}
      <circle cx="46" cy="48" r="3.8" fill="#1B4D3E" />
      <circle cx="44.8" cy="46.7" r="1.3" fill="#FFFFFF" />
      <circle cx="74" cy="48" r="3.8" fill="#1B4D3E" />
      <circle cx="72.8" cy="46.7" r="1.3" fill="#FFFFFF" />

      {/* power 포즈일 때 살짝 다부진 눈썹 */}
      {variant === 'power' && (
        <>
          <path
            d="M41 41L49 43"
            stroke="#1B4D3E"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M79 41L71 43"
            stroke="#1B4D3E"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </>
      )}

      {/* 작은 코 */}
      <ellipse cx="60" cy="52.5" rx="2.8" ry="2" fill="#8C583A" />

      {/* 입을 벌리고 웃는 입 + 귀여운 외덧니(작은 송곳니 1개) */}
      <path
        d="M52.5 56C52.5 56 56 57.2 60 57.2C64 57.2 67.5 56 67.5 56C67 63 63.8 65.5 60 65.5C56.2 65.5 53 63 52.5 56Z"
        fill="#A64B4B"
        stroke="#1B4D3E"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* 입 안 혀 */}
      <path
        d="M55.5 62.5C57 60.5 63 60.5 64.5 62.5C63.2 64.5 56.8 64.5 55.5 62.5Z"
        fill="#E58C8A"
      />
      {/* ★ 필수 포인트: 귀여운 외덧니 (오른쪽 위 작은 흰색 송곳니 1개) */}
      <path
        d="M61.8 56.8L63.6 60.8L65.4 56.5Z"
        fill="#FFFFFF"
        stroke="#1B4D3E"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* ==================== 포즈별 소품 & 팔 동작 ==================== */}

      {/* 1) welcome: 편지 봉투를 들고 활짝 웃는 모습 */}
      {variant === 'welcome' && (
        <g>
          {/* 편지 봉투 */}
          <rect
            x="41"
            y="71"
            width="38"
            height="25"
            rx="4"
            fill="#FAF8F5"
            stroke="#1B4D3E"
            strokeWidth="2"
          />
          <path
            d="M42 72L60 84L78 72"
            stroke="#4A7C59"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* 실링 스탬프 */}
          <circle cx="60" cy="83" r="5.5" fill="#F59E0B" />
          <circle cx="58.7" cy="81.7" r="1.7" fill="#E8F3EC" />
          <circle cx="61.3" cy="81.7" r="1.7" fill="#E8F3EC" />
          <circle cx="58.7" cy="84.3" r="1.7" fill="#E8F3EC" />
          <circle cx="61.3" cy="84.3" r="1.7" fill="#E8F3EC" />
          {/* 편지를 잡은 두 손 */}
          <circle
            cx="41"
            cy="83"
            r="5.2"
            fill="#FFF8EE"
            stroke="#1B4D3E"
            strokeWidth="2"
          />
          <circle
            cx="79"
            cy="83"
            r="5.2"
            fill="#FFF8EE"
            stroke="#1B4D3E"
            strokeWidth="2"
          />
        </g>
      )}

      {/* 2) quest: 반짝이는 황금 별 지팡이를 들고 있는 모습 */}
      {variant === 'quest' && (
        <g>
          {/* 티셔츠 중앙 별 배지 */}
          <circle cx="60" cy="82" r="6" fill="#F59E0B" />
          <path
            d="M57.5 82H62.5M60 79.5V84.5"
            stroke="#E8F3EC"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* 왼손 */}
          <circle
            cx="39"
            cy="80"
            r="5.2"
            fill="#FFF8EE"
            stroke="#1B4D3E"
            strokeWidth="2"
          />
          {/* 황금 별 지팡이 */}
          <line
            x1="83"
            y1="92"
            x2="97"
            y2="54"
            stroke="#D97706"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M97 41L100.2 47.6L107.5 48.6L102.2 53.7L103.5 61L97 57.5L90.5 61L91.8 53.7L86.5 48.6L93.8 47.6L97 41Z"
            fill="#F59E0B"
            stroke="#1B4D3E"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* 반짝이 선형 효과 */}
          <path
            d="M108 35V40M105.5 37.5H110.5"
            stroke="#F59E0B"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* 지팡이를 잡은 오른손 */}
          <circle
            cx="87"
            cy="78"
            r="5.2"
            fill="#FFF8EE"
            stroke="#1B4D3E"
            strokeWidth="2"
          />
        </g>
      )}

      {/* 3) stealth: 커다란 초록 나뭇잎 뒤에 살짝 숨어서 '쉿!' 포즈 */}
      {variant === 'stealth' && (
        <g>
          {/* 커다란 초록 나뭇잎 */}
          <path
            d="M66 95C66 73 82 59 103 61C104 81 90 96 66 95Z"
            fill="#4A7C59"
            stroke="#1B4D3E"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M68 93C78 82 88 72 100 64"
            stroke="#E8F3EC"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* 나뭇잎을 잡은 오른손 */}
          <circle
            cx="75"
            cy="85"
            r="5"
            fill="#FFF8EE"
            stroke="#1B4D3E"
            strokeWidth="2"
          />
          {/* 입가에 '쉿!' 하고 올린 왼손과 검지 */}
          <path
            d="M54 68V59"
            stroke="#FFF8EE"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M54 68V59"
            stroke="#1B4D3E"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="52"
            cy="70"
            r="5.2"
            fill="#FFF8EE"
            stroke="#1B4D3E"
            strokeWidth="2"
          />
        </g>
      )}

      {/* 4) heart: 따뜻한 마음 톡 말풍선/편지를 두 손으로 소중히 건네는 모습 */}
      {variant === 'heart' && (
        <g>
          {/* 민트색 마음 톡 말풍선 카드 */}
          <path
            d="M39 74C39 70.7 41.7 68 45 68H75C78.3 68 81 70.7 81 74V88C81 91.3 78.3 94 75 94H64L60 99L56 94H45C41.7 94 39 91.3 39 88V74Z"
            fill="#E8F3EC"
            stroke="#1B4D3E"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* 말풍선 속 따뜻한 하트 심볼 */}
          <path
            d="M60 88.5C60 88.5 51 83 51 77.5C51 74.8 53.2 73 55.5 73C57.4 73 59 74.2 60 75.8C61 74.2 62.6 73 64.5 73C66.8 73 69 74.8 69 77.5C69 83 60 88.5 60 88.5Z"
            fill="#F59E0B"
            stroke="#1B4D3E"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          {/* 소중히 건네는 두 손 */}
          <circle
            cx="40"
            cy="82"
            r="5.2"
            fill="#FFF8EE"
            stroke="#1B4D3E"
            strokeWidth="2"
          />
          <circle
            cx="80"
            cy="82"
            r="5.2"
            fill="#FFF8EE"
            stroke="#1B4D3E"
            strokeWidth="2"
          />
        </g>
      )}

      {/* 5) power: 진녹색 망토를 두르고 두 주먹을 불끈 쥐며 화이팅하는 모습 */}
      {variant === 'power' && (
        <g>
          {/* 망토 고정 황금 브로치 */}
          <circle
            cx="60"
            cy="66"
            r="4.5"
            fill="#F59E0B"
            stroke="#1B4D3E"
            strokeWidth="1.8"
          />
          {/* 티셔츠 번개/파워 심볼 */}
          <path
            d="M62 74L55 83H61L58 92L66 82H60L62 74Z"
            fill="#F59E0B"
            stroke="#12352A"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          {/* 불끈 쥔 두 주먹 (만세 화이팅 포즈) */}
          <circle
            cx="31"
            cy="68"
            r="6"
            fill="#FFF8EE"
            stroke="#1B4D3E"
            strokeWidth="2.2"
          />
          <circle
            cx="89"
            cy="68"
            r="6"
            fill="#FFF8EE"
            stroke="#1B4D3E"
            strokeWidth="2.2"
          />
        </g>
      )}
    </svg>
  );
};

/**
 * 카카오톡 테마 시그니처 로고 (<SuhoKakaoLogo />)
 * 노란 말풍선(#FEE500) 안에 '카톡' 대신 '수호'가 들어간 친숙한 메신저 로고 배지
 */
export const SuhoKakaoLogo: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 40, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none shrink-0 ${className}`}
      aria-label="수호톡 로고"
    >
      {/* 노란 라운드 스퀘어 배경 */}
      <rect width="64" height="64" rx="18" fill="#FEE500" />
      {/* 카카오톡 스타일 짙은 브라운 말풍선 + 꼬리 */}
      <path
        d="M32 14C19.85 14 10 21.73 10 31.27C10 37.37 14.03 42.73 20.13 45.82L17.92 53.7C17.71 54.45 18.56 55.04 19.21 54.61L28.56 48.39C29.68 48.52 30.83 48.59 32 48.59C44.15 48.59 54 40.86 54 31.32C54 21.73 44.15 14 32 14Z"
        fill="#3C1E1E"
      />
      {/* 말풍선 내부: '수호' 글자 */}
      <text
        x="32"
        y="36.5"
        textAnchor="middle"
        fill="#FEE500"
        fontSize="15.5"
        fontWeight="900"
        letterSpacing="-0.5"
      >
        수호
      </text>
    </svg>
  );
};
