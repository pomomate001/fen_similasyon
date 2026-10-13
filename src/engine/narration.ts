/**
 * Seslendirme metinleri sahne kodundan ayrı, JSON manifestte tutulur.
 * Bir metin veya ses kaydı değiştiğinde yalnızca manifest güncellenir.
 *
 *  text     : ekranda (altyazıda) görünen metin. **kalın** işaretli kısımlar vurgulanır.
 *  tts      : (isteğe bağlı) EMA'ya gönderilen metin. Yoksa text'ten otomatik türetilir.
 *  duration : (saniye) ses dosyasının gerçek süresi; üretim betiği yazar.
 *  file     : ses dosyası adı; üretim betiği yazar.
 */
export interface NarrationLine {
  text: string;
  tts?: string;
  file?: string;
  duration?: number;
}

export type NarrationManifest = Record<string, NarrationLine>;

export interface TextPart {
  t: string;
  em: boolean;
}

/** "**yerçekimi** kuvveti" → [{t:'yerçekimi',em:true},{t:' kuvveti',em:false}] */
export function parseEmphasis(text: string): TextPart[] {
  const parts: TextPart[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ t: text.slice(last, m.index), em: false });
    parts.push({ t: m[1], em: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ t: text.slice(last), em: false });
  return parts;
}

export function plainText(text: string): string {
  return text.replace(/\*\*/g, '');
}

/**
 * EMA için metin: kesme işaretleri okunuşu bozduğundan kaldırılır
 * (Dünya'nın → Dünyanın), birimler ve semboller okunur hâle getirilir.
 */
export function toTtsText(line: NarrationLine): string {
  if (line.tts) return line.tts;
  return plainText(line.text)
    .replace(/['’‘`]/g, '')
    .replace(/(\d)\s*N\b/g, '$1 newton')
    .replace(/–/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Ses dosyası yoksa (ör. üretilmemişse) okuma hızına göre tahmini süre (sn). */
export function estimateDuration(text: string): number {
  const words = plainText(text).split(/\s+/).filter(Boolean).length;
  return Math.max(1.6, words / 2.2 + 0.4);
}

export function lineDuration(line: NarrationLine): number {
  return line.duration && line.duration > 0 ? line.duration : estimateDuration(line.text);
}
