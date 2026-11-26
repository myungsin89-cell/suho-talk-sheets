import React from 'react';
import { ClassConfig, Student } from '../types';
import { QRCodeSVG } from 'qrcode.react';

interface LoginSlipPrintSheetProps {
  classId: string;
  students: Student[];
  config: ClassConfig;
  loginUrl: string;
}

const chunkStudents = (list: Student[], size: number): Student[][] => {
  const chunks: Student[][] = [];
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size));
  }
  return chunks;
};

/**
 * A4 1장당 최대 10명(2열 × 5행) 실선 자르기용 직사각형 학생 개인 입장 코드 카드 시트
 */
export const LoginSlipPrintSheet: React.FC<LoginSlipPrintSheetProps> = ({
  classId,
  students,
  config,
  loginUrl,
}) => {
  const pages = chunkStudents(students, 10);

  return (
    <div className="space-y-6">
      {pages.map((pageStudents, pageIdx) => (
        <div
          key={pageIdx}
          className={`a4-slip-page bg-white rounded-none border border-[#D1D5DB] p-4 ${
            pageIdx < pages.length - 1 ? 'a4-page-break' : ''
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#374151] pb-2 mb-3 text-xs font-extrabold text-[#191919]">
            <span>
              {config.className} · 개인 비밀 입장 카드 (실선을 따라 직사각형으로 잘라 나눠주세요)
            </span>
            <span className="text-[#767676]">
              {pageIdx + 1} / {pages.length}쪽
            </span>
          </div>

          <div className="grid grid-cols-2 pl-[1px] pt-[1px]">
            {pageStudents.map((stu) => (
              <div
                key={stu.id}
                className="border border-solid border-[#374151] -ml-[1px] -mt-[1px] rounded-none p-3.5 bg-white flex items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="text-[11px] font-bold text-[#767676] truncate">
                    {config.className}
                  </div>
                  <div className="text-sm font-black text-[#191919]">
                    {stu.number}번 {stu.name}
                  </div>
                  <div className="text-[10px] font-bold text-[#767676]">
                    비밀 입장 코드 (영문·숫자 4자리)
                  </div>
                  <div>
                    <span className="text-lg font-mono font-black tracking-[0.25em] bg-[#FFFBEB] border border-[#FDE68A] text-[#3C1E1E] px-2.5 py-1 rounded-none inline-block">
                      {stu.pin}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#767676]">
                    친구에게 비밀! 필통에 잘 보관하세요.
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-center gap-1">
                  <QRCodeSVG
                    value={loginUrl}
                    size={64}
                    level="M"
                    bgColor="#FFFFFF"
                    fgColor="#191919"
                  />
                  <span className="text-[10px] font-bold text-[#767676]">
                    접속 QR
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
