import React from 'react';
import { SuhoHamster, SuhoKakaoLogo } from './SuhoHamster';
import {
  Award,
  EyeOff,
  HeartHandshake,
  Lock,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';

interface SuhoGuidePosterProps {
  classNameText?: string;
}

/**
 * 교실 게시판 게시 및 A4/A3 인쇄용 수호톡 규칙·점수 안내 인포그래픽
 */
export const SuhoGuidePoster: React.FC<SuhoGuidePosterProps> = ({
  classNameText = '우리 반 수호톡',
}) => {
  return (
    <div className="a4-page bg-[#FCF9F2] border-2 border-[#3C1E1E] rounded-3xl p-5 sm:p-6 text-[#2D201A] flex flex-col justify-between gap-3.5">
      {/* 1. 상단 타이틀 배너 */}
      <header className="rounded-2xl bg-[#FEE500] border-2 border-[#3C1E1E] px-5 py-3.5 flex items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 bg-white border border-[#3C1E1E]/30 rounded-full px-2.5 py-0.5 text-[11px] font-black text-[#3C1E1E]">
            <SuhoKakaoLogo size={15} />
            <span>{classNameText} · 교실 안내판</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#3C1E1E] leading-tight">
            우리 반 비밀 수호천사 「수호톡」 약속 &amp; 점수표
          </h1>
          <p className="text-xs font-bold text-[#3C1E1E]/85">
            들키지 않고 몰래 마음을 전하는 따뜻한 비밀 프로젝트! 아래 4가지 약속을 꼭 지켜요.
          </p>
        </div>

        <div className="shrink-0 bg-white rounded-2xl border-2 border-[#3C1E1E] p-1.5 shadow-xs">
          <SuhoHamster variant="welcome" angelStyle="girl" size={72} />
        </div>
      </header>

      {/* 2. 수호천사 4대 비밀 약속 */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-black text-[#3C1E1E] flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-[#1B4D3E]" strokeWidth={2.5} />
            <span>수호천사 4가지 비밀 약속 (꼭 지켜요!)</span>
          </h2>
          <span className="text-[11px] font-extrabold text-[#735020] bg-[#FFF5D6] border border-[#E9D9AE] px-2.5 py-0.5 rounded-full">
            비밀이 지켜져야 더 재미있어요!
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-white border-2 border-[#E7DED0] p-3 flex items-start gap-2.5">
            <div className="shrink-0 bg-[#E8F3EC] rounded-xl p-1 border border-[#1B4D3E]/20">
              <SuhoHamster variant="stealth" size={46} />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black text-[#1B4D3E]">
                1. 들키지 말고 몰래 미션!
              </div>
              <p className="text-[11px] text-[#4A3B32] leading-snug mt-0.5 font-medium">
                내가 누구인지 들키지 않게 조용히 도와주고, 실천한 일은 수호톡에 기록해요.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white border-2 border-[#E7DED0] p-3 flex items-start gap-2.5">
            <div className="shrink-0 bg-[#FFF5D6] rounded-xl p-2 border border-[#E9D9AE] text-[#735020]">
              <EyeOff className="w-7 h-7" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black text-[#3C1E1E]">
                2. 눈치채도 끝까지 모른 척!
              </div>
              <p className="text-[11px] text-[#4A3B32] leading-snug mt-0.5 font-medium">
                누군지 알아챘다고 먼저 말하면 수호천사 친구의{' '}
                <strong className="text-[#B45309]">힘이 쏙 빠져요!</strong> 마지막 날 추리에서 맞혀요.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white border-2 border-[#E7DED0] p-3 flex items-start gap-2.5">
            <div className="shrink-0 bg-red-50 rounded-xl p-2 border border-red-200 text-red-700">
              <ShieldAlert className="w-7 h-7" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black text-red-800">
                3. 다른 친구 비밀도 절대 비밀!
              </div>
              <p className="text-[11px] text-[#4A3B32] leading-snug mt-0.5 font-medium">
                우연히 다른 친구의 수호천사가 누구인지 알게 되더라도 절대 소문내거나 말하지 않아요.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white border-2 border-[#E7DED0] p-3 flex items-start gap-2.5">
            <div className="shrink-0 bg-[#FFF5D6] rounded-xl p-2 border border-[#E9D9AE] text-[#1B4D3E]">
              <Users className="w-7 h-7" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black text-[#1B4D3E]">
                4. 여러 친구에게 골고루 베풀기!
              </div>
              <p className="text-[11px] text-[#4A3B32] leading-snug mt-0.5 font-medium">
                내 짝꿍에게만 잘해주면 금방 들켜요! 평소 여러 친구들을 두루 챙겨야 끝까지 안 들켜요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 3단계 활동 흐름 */}
      <section className="rounded-2xl bg-white border-2 border-[#E7DED0] p-3 space-y-2">
        <h2 className="text-xs sm:text-sm font-black text-[#3C1E1E] flex items-center gap-1.5">
          <MessageCircle className="w-4 h-4 text-[#D97706]" strokeWidth={2.4} />
          <span>수호톡 3단계 활동 순서 (선생님이 수호톡을 열면 1:1 대화도 해요!)</span>
        </h2>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-[#FFFBEB] border border-[#FDE68A] px-2.5 py-2">
            <span className="inline-block px-2 py-0.5 rounded-full bg-[#FEE500] text-[#3C1E1E] text-[10px] font-black">
              1단계 · 첫 편지
            </span>
            <p className="text-[11px] font-bold text-[#2D201A] mt-1 leading-snug">
              수호천사에게 첫 편지 보내고, 내 짝꿍에게 비밀 답장 쓰기
            </p>
          </div>

          <div className="rounded-xl bg-[#E8F3EC]/70 border border-[#1B4D3E]/25 px-2.5 py-2">
            <span className="inline-block px-2 py-0.5 rounded-full bg-[#1B4D3E] text-white text-[10px] font-black">
              2단계 · 비밀 활동
            </span>
            <p className="text-[11px] font-bold text-[#2D201A] mt-1 leading-snug">
              몰래 도와주고 기록 남기기 + 친구가 해준 일 ‘확인했어요’ 누르기
            </p>
          </div>

          <div className="rounded-xl bg-[#FFF4F1] border border-[#F3D2CA] px-2.5 py-2">
            <span className="inline-block px-2 py-0.5 rounded-full bg-[#3C1E1E] text-[#FEE500] text-[10px] font-black">
              3단계 · 정체 공개
            </span>
            <p className="text-[11px] font-bold text-[#2D201A] mt-1 leading-snug">
              내 수호천사 추리하기 + 감사·정체 공개 편지 쓰고 정체 확인!
            </p>
          </div>
        </div>
      </section>

      {/* 4. 점수 얻는 방법 한눈에 보기 */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-black text-[#3C1E1E] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#D97706]" strokeWidth={2.5} />
            <span>수호톡 점수 얻는 방법 한눈에 보기</span>
          </h2>
          <span className="text-[11px] font-bold text-[#685852]">
            2단계 활동은 짝꿍이 ‘확인했어요’를 누르면 점수가 올라가요!
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-xl bg-white border border-[#E7DED0] p-2.5 text-center flex flex-col items-center justify-between gap-1">
            <SuhoHamster variant="stealth" angelStyle="girl" size={44} />
            <div className="text-[11px] font-black text-[#191919]">몰래 챙겨주기</div>
            <div className="text-[10px] text-[#767676] leading-tight">자리·물건 정돈</div>
            <span className="px-2 py-0.5 rounded-full bg-[#F5F6F8] border border-[#E5E7EB] text-[11px] font-black text-[#1B4D3E]">
              +10점
            </span>
          </div>

          <div className="rounded-xl bg-white border border-[#E7DED0] p-2.5 text-center flex flex-col items-center justify-between gap-1">
            <SuhoHamster variant="heart" angelStyle="boy" size={44} />
            <div className="text-[11px] font-black text-[#191919]">마음 표현하기</div>
            <div className="text-[10px] text-[#767676] leading-tight">쪽지·칭찬·박수</div>
            <span className="px-2 py-0.5 rounded-full bg-[#FFF4F1] border border-[#F3D2CA] text-[11px] font-black text-[#9F1239]">
              +20점
            </span>
          </div>

          <div className="rounded-xl bg-white border border-[#E7DED0] p-2.5 text-center flex flex-col items-center justify-between gap-1">
            <SuhoHamster variant="quest" angelStyle="girl" size={44} />
            <div className="text-[11px] font-black text-[#191919]">주간 미션</div>
            <div className="text-[10px] text-[#767676] leading-tight">선생님 특별 미션</div>
            <span className="px-2 py-0.5 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[11px] font-black text-[#B45309]">
              +25점
            </span>
          </div>

          <div className="rounded-xl bg-white border border-[#E7DED0] p-2.5 text-center flex flex-col items-center justify-between gap-1">
            <SuhoHamster variant="power" angelStyle="boy" size={44} />
            <div className="text-[11px] font-black text-[#191919]">직접 도와주기</div>
            <div className="text-[10px] text-[#767676] leading-tight">용기 내어 돕기</div>
            <span className="px-2 py-0.5 rounded-full bg-[#FEE500] border border-[#D97706]/40 text-[11px] font-black text-[#3C1E1E]">
              +30점
            </span>
          </div>
        </div>

        {/* 편지 · 보너스 · 훈장 요약 3칸 */}
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <div className="rounded-xl bg-white border border-[#E7DED0] px-3 py-2 flex items-center justify-between gap-2">
            <div>
              <div className="font-black text-[#191919]">1단계 첫 편지·답장</div>
              <div className="text-[10px] text-[#767676]">5글자 이상 정성껏</div>
            </div>
            <span className="font-black text-[#B45309] shrink-0">각 +15점</span>
          </div>

          <div className="rounded-xl bg-white border border-[#E7DED0] px-3 py-2 flex items-center justify-between gap-2">
            <div>
              <div className="font-black text-[#191919]">3단계 추리·숨기기</div>
              <div className="text-[10px] text-[#767676]">마지막 편지 각 +15점</div>
            </div>
            <span className="font-black text-[#1B4D3E] shrink-0">각 +50점</span>
          </div>

          <div className="rounded-xl bg-[#FFF5D6] border border-[#E9D9AE] px-3 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#D97706] shrink-0" />
              <div>
                <div className="font-black text-[#3C1E1E]">선생님 훈장</div>
                <div className="text-[10px] text-[#735020]">성실·배려 활동 시</div>
              </div>
            </div>
            <span className="font-black text-[#3C1E1E] shrink-0">+30점</span>
          </div>
        </div>
      </section>

      {/* 5. 하단 공식 스탬프 & 응원 푸터 */}
      <footer className="border-t-2 border-dashed border-[#D7C1A7] pt-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#3C1E1E]">
          <HeartHandshake className="w-4 h-4 text-[#1B4D3E] shrink-0" />
          <span>
            서로를 몰래 챙겨주는 따뜻한 마음! 오늘도 우리 반 수호천사 파이팅!
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-[#767676]">
            ※ 정체 숨기기 보너스: 인증 5회↑ &amp; 안 들킴
          </span>
          <SuhoHamster variant="stamp" size={46} />
        </div>
      </footer>
    </div>
  );
};
