import React from 'react';
import { MedalIconType } from '../types';

interface HonorMedalIconProps {
  type: MedalIconType;
  size?: number;
  className?: string;
}

/**
 * 교사가 학생에게 직접 수여하는 '영예의 훈장(+30점)' 전용 SVG 아이콘
 * - 차콜 브라운 리본 + 골드 메달 디자인 (카카오톡 옐로우/브라운 테마 조화)
 */
export const HonorMedalIcon: React.FC<HonorMedalIconProps> = ({
  type,
  size = 44,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none shrink-0 ${className}`}
      aria-label={`영예의 훈장 - ${type}`}
    >
      {/* 상단 차콜 브라운 훈장 리본 (V자 형태) */}
      <path
        d="M20 8H30L32 24H24L20 8Z"
        fill="#3C1E1E"
        stroke="#191919"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M44 8H34L32 24H40L44 8Z"
        fill="#5C3D2E"
        stroke="#191919"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* 리본 중앙 골드 버클 */}
      <rect
        x="26"
        y="21"
        width="12"
        height="5"
        rx="2"
        fill="#FEE500"
        stroke="#3C1E1E"
        strokeWidth="1.8"
      />

      {/* 메달 외곽 금빛 원 & 테두리 */}
      <circle
        cx="32"
        cy="41"
        r="17"
        fill="#FEE500"
        stroke="#D97706"
        strokeWidth="2.4"
      />
      <circle
        cx="32"
        cy="41"
        r="13.5"
        fill="#FFFBEB"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeDasharray="3 2"
      />

      {/* 유형별 중앙 훈장 심볼 */}
      {type === 'medal' && (
        <g>
          <path
            d="M23 43C23 37 26.5 34 28 33M41 43C41 37 37.5 34 36 33"
            stroke="#3C1E1E"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M32 33L34.2 38.2L39.8 38.7L35.5 42.3L36.8 47.8L32 44.8L27.2 47.8L28.5 42.3L24.2 38.7L29.8 38.2L32 33Z"
            fill="#F59E0B"
            stroke="#3C1E1E"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </g>
      )}

      {type === 'crown' && (
        <path
          d="M22 46L24 36L28.5 40.5L32 34L35.5 40.5L40 36L42 46H22Z"
          fill="#F59E0B"
          stroke="#3C1E1E"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      )}

      {type === 'shield' && (
        <g>
          <path
            d="M32 32L40 35V41.5C40 46 36.5 49 32 50.5C27.5 49 24 46 24 41.5V35L32 32Z"
            fill="#3C1E1E"
            stroke="#191919"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M28.5 41L31 43.5L35.8 38.5"
            stroke="#FEE500"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {type === 'star' && (
        <path
          d="M32 32L34.7 37.8L41 38.6L36.3 43L37.5 49.2L32 46.2L26.5 49.2L27.7 43L23 38.6L29.3 37.8L32 32Z"
          fill="#F59E0B"
          stroke="#3C1E1E"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      )}

      {type === 'heart' && (
        <path
          d="M32 48.5C32 48.5 23 42.8 23 37.2C23 34.5 25.1 32.8 27.5 32.8C29.4 32.8 31 33.9 32 35.5C33 33.9 34.6 32.8 36.5 32.8C38.9 32.8 41 34.5 41 37.2C41 42.8 32 48.5 32 48.5Z"
          fill="#F59E0B"
          stroke="#3C1E1E"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};
