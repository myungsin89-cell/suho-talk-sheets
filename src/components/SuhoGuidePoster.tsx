import React from 'react';
import { SuhoHamster, SuhoKakaoLogo } from './SuhoHamster';
import {
  ArrowRight,
  Award,
  EyeOff,
  HeartHandshake,
  Lock,
  MessageCircle,
  ShieldAlert,
  Sparkles,
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
    <div className="a4-page a4-poster-page break-keep w-full max-w-[760px] mx-auto min-h-[1030px] bg-[#FCF9F2] border-2 border-[#3C1E1E] rounded-3xl p-5 text-[#2D201A] flex flex-col justify-between gap-3 shadow-sm">
      {/* 0. 상단 히어로 배너 */}
      <header className="rounded-2xl bg-[#FEE500] border-2 border-[#3C1E1E] px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="shrink-0 bg-white rounded-2xl border-2 border-[#3C1E1E] p-1 shadow-xs">
          <SuhoHamster variant="welcome" angelStyle="boy" size={72} />
        </div>

        <div className="flex-1 min-w-0 text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-white border border-[#3C1E1E]/40 rounded-full px-3 py-0.5 text-[11px] font-black text-[#3C1E1E]">
            <SuhoKakaoLogo size={16} />
            <span>{classNameText} · 교실 게시판 안내판</span>
          </div>
          <h1 className="text-[22px] font-black tracking-tight text-[#3C1E1E] leading-tight">
            우리 반 비밀 수호천사 「수호톡」
          </h1>
          <p className="text-[12.5px] font-extrabold text-[#3C1E1E]/90">
            비밀 약속 4가지 · 3단계 활동 순서 · 점수 얻는 방법 한눈에 보기
          </p>
        </div>

        <div className="shrink-0 bg-white rounded-2xl border-2 border-[#3C1E1E] p-1 shadow-xs">
          <SuhoHamster variant="welcome" angelStyle="girl" size={72} />
        </div>
      </header>

      {/* 1. 수호천사 4가지 비밀 약속 */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-black text-[#3C1E1E] flex items-center gap-2">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-[#1B4D3E] text-white text-[11px] font-black">
              01
            </span>
            <Lock className="w-4 h-4 text-[#1B4D3E]" strokeWidth={2.5} />
            <span>수호천사 4가지 비밀 약속 — 꼭 지켜요!</span>
          </h2>
          <span className="text-[11px] font-extrabold text-[#735020] bg-[#FFF5D6] border border-[#E9D9AE] px-2.5 py-0.5 rounded-full shrink-0">
            비밀이 지켜져야 끝까지 두근두근!
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* 약속 1 */}
          <div className="rounded-2xl bg-[#F2F8F4] border-2 border-[#B7DBC5] p-3 flex items-start gap-2.5">
            <div className="shrink-0 bg-white rounded-xl p-1 border border-[#B7DBC5]">
              <SuhoHamster variant="stealth" angelStyle="boy" size={52} />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded-md bg-[#1B4D3E] text-white text-[10px] font-black shrink-0">
                  약속 1
                </span>
                <div className="text-[13.5px] font-black text-[#1B4D3E] leading-tight">
                  들키지 말고 몰래 미션하기!
                </div>
              </div>
              <p className="text-[11.5px] text-[#324239] leading-relaxed font-semibold">
                내가 누구인지 들키지 않게 조용히 짝꿍을 챙겨주고, 실천한 일은 잊지 말고 수호톡에 기록해요.
              </p>
            </div>
          </div>

          {/* 약속 2 */}
          <div className="rounded-2xl bg-[#FFFBEB] border-2 border-[#F5D68E] p-3 flex items-start gap-2.5">
            <div className="shrink-0 w-[62px] h-[62px] bg-white rounded-xl border border-[#F5D68E] flex items-center justify-center text-[#B45309]">
              <EyeOff className="w-8 h-8" strokeWidth={2.3} />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded-md bg-[#B45309] text-white text-[10px] font-black shrink-0">
                  약속 2
                </span>
                <div className="text-[13.5px] font-black text-[#7C3A06] leading-tight">
                  눈치채도 끝까지 모른 척하기!
                </div>
              </div>
              <p className="text-[11.5px] text-[#4A3B32] leading-relaxed font-semibold">
                누군지 알아챘다고 먼저 말하면 수호천사 친구의{' '}
                <strong className="text-[#B45309] underline decoration-[#F59E0B] underline-offset-2">
                  힘이 쏙 빠져요!
                </strong>{' '}
                끝까지 모른 척하고 마지막 날 추리에서 맞혀요.
              </p>
            </div>
          </div>

          {/* 약속 3 */}
          <div className="rounded-2xl bg-[#FFF5F5] border-2 border-[#F5C2C7] p-3 flex items-start gap-2.5">
            <div className="shrink-0 w-[62px] h-[62px] bg-white rounded-xl border border-[#F5C2C7] flex items-center justify-center text-[#B91C1C]">
              <ShieldAlert className="w-8 h-8" strokeWidth={2.3} />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded-md bg-[#B91C1C] text-white text-[10px] font-black shrink-0">
                  약속 3
                </span>
                <div className="text-[13.5px] font-black text-[#991B1B] leading-tight">
                  다른 친구 비밀도 절대 비밀!
                </div>
              </div>
              <p className="text-[11.5px] text-[#4A3B32] leading-relaxed font-semibold">
                우연히 다른 친구의 수호천사가 누구인지 알게 되더라도 절대 소문내거나 귀띔하지 않아요.
              </p>
            </div>
          </div>

          {/* 약속 4 */}
          <div className="rounded-2xl bg-[#F2F8F4] border-2 border-[#B7DBC5] p-3 flex items-start gap-2.5">
            <div className="shrink-0 bg-white rounded-xl p-1 border border-[#B7DBC5]">
              <SuhoHamster variant="heart" angelStyle="girl" size={52} />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded-md bg-[#1B4D3E] text-white text-[10px] font-black shrink-0">
                  약속 4
                </span>
                <div className="text-[13.5px] font-black text-[#1B4D3E] leading-tight">
                  여러 친구에게 골고루 베풀기!
                </div>
              </div>
              <p className="text-[11.5px] text-[#324239] leading-relaxed font-semibold">
                내 짝꿍에게만 잘해주면 금방 들켜요! 평소 여러 친구들을 두루 챙겨야 끝까지 안 들킬 수 있어요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 수호톡 3단계 활동 순서 + 깜짝 1:1 톡방 */}
      <section className="rounded-2xl bg-white border-2 border-[#E2D6C5] p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-black text-[#3C1E1E] flex items-center gap-2">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-[#D97706] text-white text-[11px] font-black">
              02
            </span>
            <span>수호톡 3단계 활동 순서</span>
          </h2>
          <span className="text-[11px] font-bold text-[#685852]">
            선생님 안내에 따라 단계별로 열려요
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-1.5 text-center">
          <div className="rounded-xl bg-[#FFFBEB] border border-[#FDE68A] px-2.5 py-2.5 flex flex-col justify-center">
            <span className="inline-block self-center px-2.5 py-0.5 rounded-full bg-[#FEE500] border border-[#3C1E1E]/25 text-[#3C1E1E] text-[11px] font-black">
              1단계 · 첫 편지
            </span>
            <p className="text-[11.5px] font-bold text-[#2D201A] mt-1.5 leading-snug">
              내 수호천사에게 첫 편지를 보내고, 내 짝꿍에게 비밀 답장을 써요.
            </p>
          </div>

          <div className="flex items-center justify-center text-[#B45309]">
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </div>

          <div className="rounded-xl bg-[#EEF7F1] border border-[#B7DBC5] px-2.5 py-2.5 flex flex-col justify-center">
            <span className="inline-block self-center px-2.5 py-0.5 rounded-full bg-[#1B4D3E] text-white text-[11px] font-black">
              2단계 · 비밀 활동
            </span>
            <p className="text-[11.5px] font-bold text-[#2D201A] mt-1.5 leading-snug">
              몰래 도와주고 기록해요! 친구가 해준 일은 ‘확인했어요’로 확인해요.
            </p>
          </div>

          <div className="flex items-center justify-center text-[#1B4D3E]">
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </div>

          <div className="rounded-xl bg-[#FFF4F1] border border-[#F3D2CA] px-2.5 py-2.5 flex flex-col justify-center">
            <span className="inline-block self-center px-2.5 py-0.5 rounded-full bg-[#3C1E1E] text-[#FEE500] text-[11px] font-black">
              3단계 · 정체 공개
            </span>
            <p className="text-[11.5px] font-bold text-[#2D201A] mt-1.5 leading-snug">
              내 수호천사를 추리하고, 마지막 감사·정체 공개 편지를 쓴 뒤 정체 확인!
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-[#FFF5D6] border border-[#E9D9AE] px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <MessageCircle className="w-4 h-4 text-[#B45309] shrink-0" strokeWidth={2.4} />
            <p className="text-[11.5px] font-bold text-[#3C1E1E]">
              <strong className="font-black">깜짝 이벤트 · 수호천사와 1:1 톡하기</strong> — 선생님이 대화방을 열어 주시면 수호천사·짝꿍과 실시간 비밀 톡을 나눌 수 있어요!
            </p>
          </div>
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-white border border-[#E9D9AE] text-[10.5px] font-black text-[#735020]">
            정체 힌트는 조심조심
          </span>
        </div>
      </section>

      {/* 3. 수호톡 점수표 & 실천 아이디어 */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-black text-[#3C1E1E] flex items-center gap-2">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-[#3C1E1E] text-[#FEE500] text-[11px] font-black">
              03
            </span>
            <Sparkles className="w-4 h-4 text-[#D97706]" strokeWidth={2.5} />
            <span>수호톡 점수 얻는 방법 &amp; 실천 예시</span>
          </h2>
          <span className="text-[10.5px] font-extrabold text-[#1B4D3E] bg-[#EEF7F1] border border-[#B7DBC5] px-2.5 py-0.5 rounded-full shrink-0">
            상시 활동 하루 2회 · 주간 미션 1회 (짝꿍 확인 시 지급!)
          </span>
        </div>

        {/* 4대 활동 카드 */}
        <div className="grid grid-cols-4 gap-2.5">
          {/* 몰래 챙겨주기 */}
          <div className="rounded-2xl bg-white border-2 border-[#E2D6C5] p-2.5 text-center flex flex-col items-center justify-between gap-1.5">
            <SuhoHamster variant="stealth" angelStyle="girl" size={54} />
            <div className="space-y-1">
              <div className="text-[13px] font-black text-[#191919]">몰래 챙겨주기</div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#EEF7F1] border border-[#B7DBC5] text-[12px] font-black text-[#1B4D3E]">
                +10점
              </span>
            </div>
            <div className="w-full rounded-xl bg-[#F8FAF9] border border-[#E5EAE7] px-2 py-1.5 text-[10.5px] leading-snug text-[#4A3B32] font-semibold text-left">
              <div>• 의자 넣기·자리 정돈</div>
              <div>• 떨어진 물건 챙겨주기</div>
            </div>
          </div>

          {/* 마음 표현하기 */}
          <div className="rounded-2xl bg-white border-2 border-[#E2D6C5] p-2.5 text-center flex flex-col items-center justify-between gap-1.5">
            <SuhoHamster variant="heart" angelStyle="boy" size={54} />
            <div className="space-y-1">
              <div className="text-[13px] font-black text-[#191919]">마음 표현하기</div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FFF4F1] border border-[#F3D2CA] text-[12px] font-black text-[#9F1239]">
                +20점
              </span>
            </div>
            <div className="w-full rounded-xl bg-[#FFF9F8] border border-[#F5E1DC] px-2 py-1.5 text-[10.5px] leading-snug text-[#4A3B32] font-semibold text-left">
              <div>• 사물함·책상 응원 쪽지</div>
              <div>• 발표할 때 큰 박수·칭찬</div>
            </div>
          </div>

          {/* 주간 미션 */}
          <div className="rounded-2xl bg-white border-2 border-[#E2D6C5] p-2.5 text-center flex flex-col items-center justify-between gap-1.5">
            <SuhoHamster variant="quest" angelStyle="girl" size={54} />
            <div className="space-y-1">
              <div className="text-[13px] font-black text-[#191919]">주간 미션</div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[12px] font-black text-[#B45309]">
                +25점
              </span>
            </div>
            <div className="w-full rounded-xl bg-[#FFFDF4] border border-[#F7E8B5] px-2 py-1.5 text-[10.5px] leading-snug text-[#4A3B32] font-semibold text-left">
              <div>• 선생님 주간 특별 미션</div>
              <div>• 미션당 1회 도전 가능</div>
            </div>
          </div>

          {/* 직접 도와주기 */}
          <div className="rounded-2xl bg-white border-2 border-[#E2D6C5] p-2.5 text-center flex flex-col items-center justify-between gap-1.5">
            <SuhoHamster variant="power" angelStyle="boy" size={54} />
            <div className="space-y-1">
              <div className="text-[13px] font-black text-[#191919]">직접 도와주기</div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FEE500] border border-[#D97706]/50 text-[12px] font-black text-[#3C1E1E]">
                +30점
              </span>
            </div>
            <div className="w-full rounded-xl bg-[#FFFBEB] border border-[#F5DF8A] px-2 py-1.5 text-[10.5px] leading-snug text-[#4A3B32] font-semibold text-left">
              <div>• 우유·청소·학습 돕기</div>
              <div>• 용기 내어 직접 손 내밀기</div>
            </div>
          </div>
        </div>

        {/* 편지 · 추리/숨기기 · 훈장 보너스 4칸 */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-white border border-[#E2D6C5] px-3 py-2 flex items-center justify-between gap-2">
            <div>
              <div className="text-[12px] font-black text-[#191919]">
                1단계 첫 편지 &amp; 첫 답장
              </div>
              <div className="text-[10.5px] text-[#685852] font-semibold">
                5글자 이상 정성껏 작성 시 각각 지급
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-[11.5px] font-black text-[#B45309] shrink-0">
              각 +15점 (최대 +30)
            </span>
          </div>

          <div className="rounded-xl bg-white border border-[#E2D6C5] px-3 py-2 flex items-center justify-between gap-2">
            <div>
              <div className="text-[12px] font-black text-[#191919]">
                3단계 마지막 편지 2통
              </div>
              <div className="text-[10.5px] text-[#685852] font-semibold">
                감사 편지 + 정체 공개 편지 정성 작성 시
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#FFF4F1] border border-[#F3D2CA] text-[11.5px] font-black text-[#9F1239] shrink-0">
              각 +15점 (최대 +30)
            </span>
          </div>

          <div className="rounded-xl bg-white border border-[#E2D6C5] px-3 py-2 flex items-center justify-between gap-2">
            <div>
              <div className="text-[12px] font-black text-[#191919]">
                3단계 추리 &amp; 정체 숨기기
              </div>
              <div className="text-[10.5px] text-[#685852] font-semibold">
                추리 정답 +50점 · 숨기기(인증 5회↑ &amp; 안 들킴) +50점
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#EEF7F1] border border-[#B7DBC5] text-[11.5px] font-black text-[#1B4D3E] shrink-0">
              최대 +100점
            </span>
          </div>

          <div className="rounded-xl bg-[#FFF5D6] border border-[#E9D9AE] px-3 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Award className="w-5 h-5 text-[#B45309] shrink-0" />
              <div>
                <div className="text-[12px] font-black text-[#3C1E1E]">
                  선생님 영예의 훈장
                </div>
                <div className="text-[10.5px] text-[#735020] font-semibold">
                  성실한 활동·따뜻한 배려 시 선생님 수여
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E9D9AE] text-[11.5px] font-black text-[#3C1E1E] shrink-0">
              개당 +30점
            </span>
          </div>
        </div>
      </section>

      {/* 4. 하단 응원 & 공식 스탬프 푸터 */}
      <footer className="rounded-2xl bg-[#3C1E1E] text-[#FCF9F2] px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <HeartHandshake className="w-6 h-6 text-[#FEE500] shrink-0" />
          <div className="min-w-0 space-y-0.5">
            <div className="text-[12.5px] font-black text-[#FEE500] leading-tight">
              “점수보다 더 빛나는 건 친구를 생각하는 따뜻한 마음! 오늘도 우리 반 수호천사 파이팅!”
            </div>
            <div className="text-[10.5px] font-semibold text-[#E7DED0]">
              ※ 거짓 활동 기록은 안 돼요! 짝꿍이 ‘확인했어요’를 눌러 주어야 점수가 인정됩니다.
            </div>
          </div>
        </div>

        <div className="shrink-0 bg-white rounded-full p-1 border-2 border-[#FEE500]">
          <SuhoHamster variant="stamp" size={48} />
        </div>
      </footer>
    </div>
  );
};
