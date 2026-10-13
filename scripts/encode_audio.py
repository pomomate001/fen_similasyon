"""EMA Lightning WAV çıktılarını sıkıştırıp (MP3, 64 kbps, mono) projeye kopyalar
ve anlatım manifestine dosya adı ile gerçek süreyi yazar.

Kullanım:
  python -I scripts/encode_audio.py <eşleme.tsv> <ema-çıktı-klasörü> <manifest.json> <hedef-klasör>
eşleme.tsv satırları:  <anlatım-kimliği>\t<ema-dosya-adı (uzantısız)>
"""
import json
import sys
import wave
from collections import OrderedDict
from pathlib import Path

import lameenc
import numpy as np

mapping_path, src_dir, manifest_path, out_dir = map(Path, sys.argv[1:5])
out_dir.mkdir(parents=True, exist_ok=True)

mapping = OrderedDict()
for line in mapping_path.read_text(encoding="utf-8").splitlines():
    if line.strip():
        k, v = line.split("\t")
        mapping[k.strip()] = v.strip()  # sonraki satır öncekini geçersiz kılar

manifest = json.loads(manifest_path.read_text(encoding="utf-8"), object_pairs_hook=OrderedDict)
missing = [k for k in manifest if k not in mapping]
extra = [k for k in mapping if k not in manifest]
if extra:
    print("Manifestte olmayan eşlemeler:", extra)

PAD = 0.08  # baş/son boşluk (sn)
total = 0.0
for key, name in mapping.items():
    if key not in manifest:
        continue
    with wave.open(str(src_dir / f"{name}.wav"), "rb") as w:
        sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
        assert ch == 1 and sw == 2, (key, ch, sw)
        pcm = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    # baştaki/sondaki sessizliği kırp
    loud = np.where(np.abs(pcm) > 400)[0]
    if len(loud):
        a = max(0, loud[0] - int(PAD * sr))
        b = min(len(pcm), loud[-1] + int(PAD * sr))
        pcm = pcm[a:b]
    enc = lameenc.Encoder()
    enc.set_bit_rate(64)
    enc.set_in_sample_rate(sr)
    enc.set_channels(1)
    enc.set_quality(2)
    mp3 = enc.encode(pcm.tobytes()) + enc.flush()
    (out_dir / f"{key}.mp3").write_bytes(mp3)
    dur = round(len(pcm) / sr, 2)
    total += dur
    manifest[key]["file"] = f"{key}.mp3"
    manifest[key]["duration"] = dur

manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
size = sum(p.stat().st_size for p in out_dir.glob("*.mp3"))
print(f"{len(mapping)} klip, toplam {total:.1f} sn, {size/1e6:.2f} MB")
if missing:
    print("SESİ OLMAYAN SATIRLAR:", missing)
    sys.exit(1)
