/* 욕설 순화 — 금칙어를 무협 세계관의 미칭(美稱)으로 치환한다.
 * 차단·삭제 대신 유머로 승화하는 것이 설계 의도 (docs/01 §2-5, docs/02 §2.1).
 * 서버 전환 시 이 로직을 서버측 채팅 파이프라인으로 이식한다 (docs/03 §2). */

const BAD_WORDS = [
  '씨발', '시발', '씨팔', '씨바', 'ㅆㅂ', 'ㅅㅂ',
  '개새끼', '새끼', '병신', '븅신', 'ㅄ', '또라이',
  '미친놈', '미친년', '미친', '지랄', '존나', '졸라',
  '엿먹', '꺼져', '닥쳐', '등신', '멍청', '바보',
  '호구', '찐따', '재수없',
];

const NICE_WORDS = ['왕자님', '공자님', '대협', '소협', '귀공자님', '협객님', '군자님', '현자님'];

// 긴 단어 우선 매칭 ('개새끼'가 '새끼'보다 먼저 잡히도록)
const BAD_RE = new RegExp([...BAD_WORDS].sort((a, b) => b.length - a.length).join('|'), 'g');

export function softenChat(text: string): string {
  return text.replace(BAD_RE, () => NICE_WORDS[Math.floor(Math.random() * NICE_WORDS.length)]);
}
