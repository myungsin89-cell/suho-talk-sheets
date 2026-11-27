import React from 'react';
import { HamsterVariant } from '../types';

export type AngelStyle = 'boy' | 'girl';

/**
 * 포즈별 기본 캐릭터 스타일 ('boy' | 'girl')
 * - 수호천사 캐릭터가 남자아이/여자아이 포즈로 고루 어우러지도록 기본값을 매핑합니다.
 */
const DEFAULT_POSE_STYLE: Record<Exclude<HamsterVariant, 'stamp'>, AngelStyle> = {
  welcome: 'girl',
  quest: 'boy',
  stealth: 'boy',
  heart: 'girl',
  power: 'boy',
};

export const getAngelImageUrl = (
  pose: HamsterVariant,
  style?: AngelStyle
): string => {
  if (pose === 'stamp') {
    return '/assets/suho-angel/shared-stamp.png';
  }
  const chosen = style ?? DEFAULT_POSE_STYLE[pose];
  return `/assets/suho-angel/${chosen}-${pose}.png`;
};

/**
 * 필요 시 외부 경로로 덮어쓸 수 있는 커스텀 이미지 매핑
 */
export const CUSTOM_HAMSTER_PNG_MAP: Partial<Record<HamsterVariant, string>> = {};

interface SuhoHamsterProps {
  variant: HamsterVariant;
  size?: number;
  className?: string;
  customImageUrl?: string;
  angelStyle?: AngelStyle;
}

const VARIANT_ALT: Record<HamsterVariant, string> = {
  welcome: '수호천사 캐릭터 - 환영',
  quest: '수호천사 캐릭터 - 주간 미션',
  stealth: '수호천사 캐릭터 - 비밀 활동',
  heart: '수호천사 캐릭터 - 따뜻한 마음',
  power: '수호천사 캐릭터 - 응원 및 도움',
  stamp: '수호톡 공식 인증 도장',
};

/**
 * 수호톡 시그니처 캐릭터 (<SuhoHamster />)
 * 노란 봉투 수호천사(남자아이·여자아이) 및 공용 인증 도장 PNG를 렌더링합니다.
 */
export const SuhoHamster: React.FC<SuhoHamsterProps> = ({
  variant,
  size = 96,
  className = '',
  customImageUrl,
  angelStyle,
}) => {
  const src =
    customImageUrl ||
    CUSTOM_HAMSTER_PNG_MAP[variant] ||
    getAngelImageUrl(variant, angelStyle);

  return (
    <img
      src={src}
      alt={VARIANT_ALT[variant]}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`object-contain select-none shrink-0 ${className}`}
    />
  );
};

/**
 * 수호톡 대표 아이콘 (<SuhoKakaoLogo />)
 * 하트 봉인이 찍힌 노란 봉투 말풍선 SVG 로고
 */
export const SuhoKakaoLogo: React.FC<{
  size?: number;
  className?: string;
  dark?: boolean;
}> = ({ size = 40, className = '', dark = false }) => {
  return (
    <img
      src={dark ? '/suho-icon-dark.svg' : '/suho-icon.svg'}
      alt="수호톡 로고"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`object-contain select-none shrink-0 ${className}`}
    />
  );
};
