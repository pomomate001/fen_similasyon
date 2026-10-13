# Fen Keşif Atölyesi

Türkiye Yüzyılı Maarif Modeli'ne uygun, akıllı tahtaya (FATİH) ve dokunmatik kullanıma göre tasarlanmış
etkileşimli fen bilimleri simülasyonları.

**İlk simülasyon:** 6. Sınıf · 2. Ünite *Kuvvetin Etkisinde Hareket* · 1. Bölüm · **Bileşke Kuvvet**
(öğrenme çıktısı **FB.6.2.1**).

## Çalıştırma

Gerekenler: Node.js 20+.

```bash
npm install
npm run dev          # http://localhost:5173
```

Derleme (statik dosyalar `dist/` klasörüne; herhangi bir klasörden, USB'den veya web sunucusundan açılabilir):

```bash
npm run build
npm run preview
```

### Testler

```bash
npm test               # birim testleri (fizik, sahne motoru, anlatım manifesti)
npx playwright install chromium   # yalnızca ilk kez
npm run test:e2e       # uçtan uca: tam akış, ekran boyutları, kontroller, ses, dokunmatik
```

### Öğretmen kısayolları

| Tuş | İşlev |
|---|---|
| → · PageDown · Enter | Devam Et (sunum kumandaları da çalışır) |
| ← · PageUp | Önceki sahne |
| P · Boşluk | Duraklat / Sürdür |

Sahne haritasındaki noktalara dokunarak istenen sahneye geçilebilir. ⓘ düğmesi öğretmen notlarını açar;
oradan kontrol çubuğu tahtanın diğer tarafına alınabilir.

Önizleme/test parametreleri: `?sahne=5` (doğrudan sahne), `?ses=0` (sessiz), `?hiz=4` (hızlandırılmış).
Örnek: `http://localhost:5173/?ses=0#/sim/bileske-kuvvet?sahne=7`

## Mimari

```
src/
  engine/        Sahne motoru: PlayerController (durum, gezinme, duraklatma), betik API'si,
                 anlatım oynatıcısı (tek kanal), sinyaller, ses efektleri
  physics/       forces.ts (bileşke, işlem satırı, ok geometrisi) · motion.ts (kinematik)
  ui/            Stage (16:9 ölçekleme), SimPlayer (kontroller, altyazı), ForceArrow,
                 AdjustableArrow, Grid, etkileşim kancaları (sürükle, seç-yerleştir)
  art/           Programatik SVG illüstrasyonlar
  content/       catalog.ts — Ders → Sınıf → Ünite → Bölüm → Konu hiyerarşisi
  sims/
    registry.ts  Simülasyon kayıtları (gerektiğinde yüklenir)
    bileske-kuvvet/
      index.ts            Sahne listesi + öğretmen notları
      narration.tr.json   Tüm anlatım metinleri (sahne kodundan ayrı)
      timings.ts          Animasyon süreleri
      scenes/S01…S11      Sahneler
public/audio/bileske-kuvvet/   EMA Lightning ile üretilmiş anlatım sesleri (MP3)
```

**Tek doğruluk kaynağı:** Ekrandaki her ok uzunluğu, etiket, işlem satırı ve yön sözcüğü
`physics/forces.ts` fonksiyonlarından türetilir; görsel ile hesap ayrışamaz (birim ve E2E testlerle denetlenir).

**Sahne betikleri:** Her sahne `useScript(async (s) => { … })` ile yazılır
(`s.narrate`, `s.tween`, `s.waitContinue`, `s.waitFor`, `s.complete`). Sahne değişince betik iptal edilir,
animasyonlar geri alınır ve ses durur; eski sahneden hiçbir şey yenisine sızmaz.
Bütün zamanlama GSAP'in küresel zaman çizelgesindedir; "Duraklat" her şeyi tek noktadan durdurur.

### Yeni simülasyon eklemek

1. `src/sims/<kimlik>/` altında sahneleri, `narration.tr.json` ve `index.ts` (SimDef) dosyalarını oluşturun.
2. `src/sims/registry.ts` içine kaydı ekleyin.
3. `src/content/catalog.ts` içinde ilgili konunun `status` değerini `hazir`, `simId` değerini kimlik yapın.

## Seslendirme (EMA Lightning)

Anlatım metinleri `narration.tr.json` içindedir. `text` ekranda görünen metindir; `tts` (isteğe bağlı)
EMA'ya gönderilen metindir. `tts` yoksa metin otomatik dönüştürülür: **kesme işaretleri kaldırılır**
(EMA "Dünya'nın" gibi ifadeleri bozuk okuyor), "10 N" → "10 newton".

Bir metni değiştirdikten sonra:

1. `npm run narration:list` ile EMA'ya gidecek metinleri listeleyin.
2. Değişen satırları EMA Lightning MCP aracıyla (`speak_turkish`, hız 0.95) üretin.
3. Kimlik ↔ WAV eşlemesini bir TSV dosyasına yazıp dönüştürün (MP3 64 kbps, mono; süreler manifeste yazılır):

```bash
npm run audio:encode -- <eşleme.tsv> <EMA çıktı klasörü> src/sims/bileske-kuvvet/narration.tr.json public/audio/bileske-kuvvet
```

Ses kapalıyken ya da bir dosya eksikken simülasyon altyazıyla ve manifestteki sürelerle çalışmaya devam eder.

Kararlar ve gerekçeleri için: [docs/KARARLAR.md](docs/KARARLAR.md)
