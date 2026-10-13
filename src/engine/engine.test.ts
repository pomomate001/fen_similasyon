import { gsap } from 'gsap';
import { NarrationAudio, type AudioLike } from './audio';
import { PlayerController } from './controller';
import { estimateDuration, parseEmphasis, toTtsText, type NarrationManifest } from './narration';
import { createScriptApi } from './script';
import { createSignal, isCancel } from './signal';

/** Sahte ses: hangi dosyaların çalındığını/durdurulduğunu kaydeder. */
function fakeAudio(opts: { failOn?: string } = {}) {
  const log: string[] = [];
  const factory = (url: string): AudioLike => {
    const a: AudioLike = {
      src: url,
      muted: false,
      currentTime: 0,
      onerror: null,
      play() {
        if (opts.failOn && url.endsWith(opts.failOn)) return Promise.reject(new Error('404'));
        log.push(`play:${url}`);
        return Promise.resolve();
      },
      pause() {
        log.push(`pause:${url}`);
      },
    };
    return a;
  };
  return { log, audio: new NarrationAudio('/a/', factory) };
}

const manifest: NarrationManifest = {
  a: { text: 'Birinci **cümle**.', file: 'a.wav', duration: 0.4 },
  b: { text: "Dünya'nın cümlesi.", file: 'b.wav', duration: 0.4 },
  c: { text: 'Üçüncü.', file: 'c.wav', duration: 0.4 },
};

const TS = 8; // testleri hızlandırmak için zaman ölçeği
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function setup(extra: { failOn?: string; sceneCount?: number } = {}) {
  const { log, audio } = fakeAudio(extra);
  const ctrl = new PlayerController({
    sceneCount: extra.sceneCount ?? 3,
    manifest,
    audio,
    timeScale: TS,
    navLockMs: 0,
    gap: 0.05,
  });
  const ac = new AbortController();
  const gctx = gsap.context(() => undefined);
  const s = createScriptApi(ctrl, ac.signal, gctx);
  return { ctrl, s, ac, gctx, log, audio };
}

afterEach(() => {
  gsap.globalTimeline.resume();
  gsap.globalTimeline.timeScale(1);
});

describe('anlatım metinleri', () => {
  it('vurgu işaretleri ayrıştırılır', () => {
    expect(parseEmphasis('Bu **yerçekimi** kuvveti')).toEqual([
      { t: 'Bu ', em: false },
      { t: 'yerçekimi', em: true },
      { t: ' kuvveti', em: false },
    ]);
  });

  it('EMA metninde kesme işareti kaldırılır, N okunur hâle gelir', () => {
    expect(toTtsText({ text: "Dünya'nın **merkezine** doğru 10 N" })).toBe('Dünyanın merkezine doğru 10 newton');
  });

  it('özel tts metni önceliklidir', () => {
    expect(toTtsText({ text: 'R = 90 N', tts: 'R doksan newton' })).toBe('R doksan newton');
  });

  it('tahmini süre makul aralıktadır', () => {
    expect(estimateDuration('bir iki üç dört beş altı yedi sekiz dokuz on')).toBeGreaterThan(3);
    expect(estimateDuration('Tamam')).toBeGreaterThanOrEqual(1.6);
  });
});

describe('sahne betiği ve oynatıcı', () => {
  it('anlatım altyazıyı gösterir, sesi çalar ve süre sonunda biter', async () => {
    const { ctrl, s, log } = setup();
    const p = s.narrate('a');
    expect(ctrl.getSnapshot().subtitle?.id).toBe('a');
    expect(ctrl.getSnapshot().narrating).toBe(true);
    await p;
    expect(ctrl.getSnapshot().narrating).toBe(false);
    expect(log).toContain('play:/a/a.wav');
  });

  it('Devam Et beklenir; basılmadan betik ilerlemez', async () => {
    const { ctrl, s } = setup();
    let passed = false;
    const p = s.waitContinue().then(() => (passed = true));
    expect(ctrl.getSnapshot().phase).toBe('waiting');
    await sleep(60);
    expect(passed).toBe(false);
    ctrl.pressContinue();
    await p;
    expect(passed).toBe(true);
    expect(ctrl.getSnapshot().phase).toBe('running');
  });

  it('iptal edilen sahnede bekleyen adımlar CancelError ile sonlanır ve ses durur', async () => {
    const { ctrl, s, ac, gctx, log } = setup();
    const p = s.narrate('a').catch((e) => e);
    ac.abort();
    gctx.revert();
    ctrl.sceneEnded();
    const err = await p;
    expect(isCancel(err)).toBe(true);
    expect(log.some((l) => l.startsWith('pause:'))).toBe(true);
  });

  it('duraklatınca zaman durur, sürdürünce devam eder', async () => {
    const { ctrl, s } = setup();
    let done = false;
    const p = s.wait(0.8).then(() => (done = true)); // 0.8/8 = 100 ms
    ctrl.setPaused(true);
    await sleep(250);
    expect(done).toBe(false);
    ctrl.setPaused(false);
    await p;
    expect(done).toBe(true);
  });

  it('duraklatılmışken Devam Et etkisizdir', async () => {
    const { ctrl, s } = setup();
    let passed = false;
    void s.waitContinue().then(() => (passed = true));
    ctrl.setPaused(true);
    ctrl.pressContinue();
    await sleep(20);
    expect(passed).toBe(false);
    ctrl.setPaused(false);
  });

  it('bekleyen yokken gelen tetikleme saklanır (anlatım sırasında basılan Kontrol Et kaybolmaz)', async () => {
    const sig = createSignal<number>();
    sig.fire(7);
    expect(await sig.wait()).toBe(7);
    sig.fire(8);
    sig.clear();
    let got: number | null = null;
    void sig.wait().then((v) => (got = v));
    await sleep(10);
    expect(got).toBeNull();
    sig.fire(9);
    await sleep(0);
    expect(got).toBe(9);
  });

  it('sinyal beklenir', async () => {
    const { s } = setup();
    const sig = createSignal<number>();
    const p = s.waitFor(sig);
    sig.fire(42);
    expect(await p).toBe(42);
  });

  it('eksik ses dosyasında betik sessizce devam eder', async () => {
    const { s, audio } = setup({ failOn: 'b.wav' });
    await s.narrate('b');
    await sleep(10);
    expect(audio.failures).toContain('b.wav');
  });

  it('manifestte olmayan anlatım betiği durdurmaz', async () => {
    const { s } = setup();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await s.narrate('yok');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('yeni anlatım başlarken önceki ses durdurulur (üst üste binme yok)', () => {
    const { ctrl, log } = setup();
    ctrl.startNarration('a');
    ctrl.startNarration('b');
    const iPauseA = log.indexOf('pause:/a/a.wav');
    const iPlayB = log.indexOf('play:/a/b.wav');
    expect(iPauseA).toBeGreaterThan(-1);
    expect(iPauseA).toBeLessThan(iPlayB);
  });

  it('eski anlatımın bitişi yeni anlatımın durumunu bozmaz', () => {
    const { ctrl } = setup();
    const t1 = ctrl.startNarration('a');
    ctrl.startNarration('b');
    ctrl.endNarration(t1);
    expect(ctrl.getSnapshot().narrating).toBe(true);
    expect(ctrl.getSnapshot().subtitle?.id).toBe('b');
  });

  it('Anlatımı Tekrar Dinle: son Devam Et\'ten beri okunanları sırayla çalar', async () => {
    const { ctrl, s, log } = setup();
    await s.narrate('a');
    await s.narrate('b');
    void s.waitContinue();
    log.length = 0;
    ctrl.replay();
    expect(ctrl.getSnapshot().replaying).toBe(true);
    await sleep(250);
    expect(log.filter((l) => l.startsWith('play:'))).toEqual(['play:/a/a.wav', 'play:/a/b.wav']);
    expect(ctrl.getSnapshot().replaying).toBe(false);
  });

  it('tekrar dinleme sırasında Devam Et tekrarı keser', async () => {
    const { ctrl, s } = setup();
    await s.narrate('a');
    const p = s.waitContinue();
    ctrl.replay();
    ctrl.pressContinue();
    await p;
    expect(ctrl.getSnapshot().replaying).toBe(false);
  });

  it('sahne tamamlanınca Devam Et sonraki sahneye geçer', () => {
    const { ctrl } = setup();
    ctrl.complete();
    ctrl.pressContinue();
    expect(ctrl.getSnapshot().sceneIndex).toBe(1);
    expect(ctrl.getSnapshot().phase).toBe('running');
  });

  it('son sahne tamamlanınca simülasyon biter', () => {
    const { ctrl } = setup({ sceneCount: 1 });
    ctrl.complete();
    ctrl.pressContinue();
    expect(ctrl.getSnapshot().finished).toBe(true);
  });

  it('önceki sahne ve baştan başlatma sahne anahtarını yeniler', () => {
    const { ctrl } = setup();
    ctrl.goTo(2);
    const k = ctrl.getSnapshot().sceneKey;
    ctrl.prev();
    expect(ctrl.getSnapshot().sceneIndex).toBe(1);
    ctrl.restartAll();
    expect(ctrl.getSnapshot().sceneIndex).toBe(0);
    expect(ctrl.getSnapshot().sceneKey).toBeGreaterThan(k);
  });

  it('art arda hızlı gezinme tıklamaları kilitlenir', () => {
    const { audio } = fakeAudio();
    const ctrl = new PlayerController({ sceneCount: 5, manifest, audio, navLockMs: 400 });
    ctrl.goTo(1);
    ctrl.goTo(2);
    ctrl.goTo(3);
    expect(ctrl.getSnapshot().sceneIndex).toBe(1);
  });

  it('sahne değişince duraklatma kalkar', () => {
    const { ctrl } = setup();
    ctrl.setPaused(true);
    ctrl.goTo(1);
    expect(ctrl.getSnapshot().paused).toBe(false);
  });

  it('ses kapatılınca sessiz çalınır, altyazı sürer', async () => {
    const { ctrl, s } = setup();
    ctrl.setMuted(true);
    const p = s.narrate('a');
    expect(ctrl.getSnapshot().subtitle?.id).toBe('a');
    await p;
    expect(ctrl.getSnapshot().muted).toBe(true);
  });
});
