import { addChat } from '../ui/hud';
import { handleUtterance } from './classifier';
import { confuse } from './confusion';

/* Web Speech API — ko-KR 연속 인식, interim 실시간 표시.
 * 타입 정의가 lib.dom에 없어 any로 다룬다 (Chrome/Edge 전용 API). */
export function initVoice() {
  const micbtn = document.getElementById('micbtn')!, miclabel = document.getElementById('miclabel')!,
        interimEl = document.getElementById('interim') as HTMLDivElement;
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  let rec: any = null, listening = false;
  if (SR) {
    rec = new SR(); rec.lang = 'ko-KR'; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) { interimEl.style.display = 'none'; handleUtterance(r[0].transcript, r[0].confidence); }
        else interim += r[0].transcript;
      }
      if (interim) { interimEl.textContent = '🎤 ' + interim; interimEl.style.display = 'block'; }
    };
    rec.onend = () => { if (listening) try { rec.start(); } catch (_) {} };
    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed') { addChat('', '⚠️ 마이크 권한을 허용해주세요.', 'sys'); stopMic(); }
      else if (e.error === 'no-speech' && listening) { confuse('nohear'); }
    };
  } else {
    addChat('', '⚠️ 이 브라우저는 음성 인식을 지원하지 않아요. Chrome에서 열어주세요.', 'sys');
  }
  function startMic() {
    if (!rec) return; listening = true; micbtn.classList.add('on');
    miclabel.textContent = '듣는 중… 눌러서 끄기'; try { rec.start(); } catch (_) {}
    addChat('', '🎙️ 음성 인식 시작 — 말해보세요!', 'sys');
  }
  function stopMic() {
    listening = false; micbtn.classList.remove('on');
    miclabel.textContent = '누르면 듣기 시작'; interimEl.style.display = 'none'; if (rec) try { rec.stop(); } catch (_) {}
  }
  micbtn.onclick = () => listening ? stopMic() : startMic();
}
