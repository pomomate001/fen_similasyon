import type { SimDef } from '../../engine/types';
import narration from './narration.tr.json';
import { S01Elma } from './scenes/S01Elma';
import { S02Yercekimi } from './scenes/S02Yercekimi';
import { S03Ozellikler } from './scenes/S03Ozellikler';
import { S04Top } from './scenes/S04Top';
import { S05Araba } from './scenes/S05Araba';
import { S06Roket } from './scenes/S06Roket';
import { S07Bileske } from './scenes/S07Bileske';
import { S08Halat } from './scenes/S08Halat';
import { S09Laboratuvar } from './scenes/S09Laboratuvar';
import { S10Gorevler } from './scenes/S10Gorevler';
import { S11Kapanis } from './scenes/S11Kapanis';

const sim: SimDef = {
  id: 'bileske-kuvvet',
  title: 'Bileşke Kuvvet',
  parts: ['Kuvveti Tanıyalım', 'Bileşke Kuvvet', 'Uygula ve Keşfet'],
  narration,
  audioBase: './audio/bileske-kuvvet/',
  scenes: [
    {
      id: 'elma',
      title: 'Ağaçtaki Elma',
      part: 0,
      component: S01Elma,
      teacherNotes: [
        'Cevabı açıklamadan önce öğrencilerin tahminlerini alın: "Elmayı ne aşağı çekti?"',
        'Olası yanıtlar: rüzgâr, ağırlık, yerçekimi, "kendiliğinden". Hepsini tahtaya not edip bir sonraki sahnede karşılaştırın.',
        'Model: hava direnci ihmal edildi; elma giderek hızlanarak düşer.',
      ],
    },
    {
      id: 'yercekimi',
      title: 'Yerçekimi Kuvveti',
      part: 0,
      component: S02Yercekimi,
      teacherNotes: [
        '"Aşağı" yönü, Dünya\'nın merkezine doğru demektir; coğrafi "güney" ile karıştırılmamalıdır.',
        'Elma daldayken de yerçekimi kuvveti etki eder; sap elmayı tutar. Bu durumun kuvvet çözümlemesi (dengelenmiş kuvvetler) sonraki konunun kapsamındadır.',
        'Zaman durdurma gösterimi, hareketin tek bir anındaki kuvveti incelemek içindir.',
      ],
    },
    {
      id: 'ozellikler',
      title: 'Kuvvetin Özellikleri',
      part: 0,
      component: S03Ozellikler,
      teacherNotes: [
        'Ders kitabındaki dört özellik: uygulama noktası, yön, doğrultu, büyüklük (s. 46).',
        'Yön ile doğrultu farkı: doğrultu iki zıt yönü kapsar (düşey doğrultu = yukarı ve aşağı).',
        'Değerler temsilidir: yaklaşık 100 g’lık bir elmaya yaklaşık 1 N yerçekimi kuvveti etki eder. Kütle–ağırlık ilişkisi bu konunun kapsamında değildir.',
        'Yerçekimi oku cismin ortasından çizilir; temas kuvvetleri ise temas noktasından (kutuyu iten elin değdiği yer).',
      ],
    },
    {
      id: 'top',
      title: 'Yukarı Atılan Top',
      part: 0,
      component: S04Top,
      teacherNotes: [
        'Devam Et’e basmadan önce sorun: "Top yükselirken ona yukarı doğru bir kuvvet etki ediyor mu?"',
        'Yaygın kavram yanılgısı: "Hareket varsa hareket yönünde bir kuvvet vardır." Top elden ayrıldıktan sonra ona yalnızca yerçekimi kuvveti etki eder (hava direnci ihmal).',
        'El topa yalnızca temas süresince kuvvet uygular. A anında elin kuvveti yerçekiminden büyük gösterilmiştir; bu sahnede sayısal değer kullanılmaz.',
        '"Yukarı çıkma kuvveti" kartı bilinçli bir çeldiricidir.',
      ],
    },
    {
      id: 'araba',
      title: 'Aynı Yönlü Kuvvetler',
      part: 1,
      component: S05Araba,
      teacherNotes: [
        'Bileşke kuvvetin ders kitabındaki tanımı: "Birden fazla kuvvetin yaptığı etkiyi tek başına yapabilen kuvvet" (s. 54).',
        'İten ve çeken kuvvetlerin uygulama noktaları farklıdır, yönleri aynıdır (Etkinlik İstasyonu-2, 5. durum).',
        'Model: arabalar özdeş, sürtünme ihmal edildi. Başlangıçta duran arabalar aynı bileşke kuvvetle aynı biçimde hızlanır.',
        'Öğrencilere robot için önce tahmin ettirin, sonra denetin.',
      ],
    },
    {
      id: 'roket',
      title: 'Roket: Zıt Yönlü Kuvvetler',
      part: 1,
      component: S06Roket,
      teacherNotes: [
        'Zaman, roketin rampadan ayrıldığı anda durdurulmuştur. Rampadayken rampanın uyguladığı kuvvet de vardır; bu yüzden kalkış anı seçilmiştir.',
        'Değerler temsilîdir (100 N motor, 10 N yerçekimi). Hava direnci ihmal edilmiştir.',
        'Kuvvet okları, ders kitabındaki örneklerde olduğu gibi cismin ortasından çizilmiştir; motor kuvvetinin gerçek uygulama noktası motorun bulunduğu alt kısımdır.',
      ],
    },
    {
      id: 'bileske',
      title: 'Bileşkeyi Hesapla',
      part: 1,
      component: S07Bileske,
      teacherNotes: [
        'Kitaptaki gösterim: R = büyük kuvvet − küçük kuvvet; R büyük kuvvetin yönünde, doğrultusu kuvvetlerle aynı (s. 54).',
        'Başlangıçta duran cisim bileşke kuvvet yönünde harekete geçer. Ancak hareket eden her cisim bileşke kuvvet yönünde hareket etmez: yükselen topa aşağı yönde kuvvet etki ediyordu (Sahne 4).',
        'Ayrıntılı hareket–kuvvet ilişkisi (yavaşlama, durma) dengelenmiş/dengelenmemiş kuvvetler konusunda işlenecektir.',
      ],
    },
    {
      id: 'halat',
      title: 'Halat Çekme',
      part: 2,
      component: S08Halat,
      teacherNotes: [
        'Takım içindeki kuvvetler aynı yönlüdür (toplanır), takımların kuvvetleri zıt yönlüdür (çıkarılır). Oyun iki kuralı birleştirir.',
        'Model: halata etki eden kuvvetler incelenir. Gerçek oyunda kazananı ayakların zemine uyguladığı kuvvet (sürtünme) de etkiler; bu ayrıntı kapsam dışıdır.',
        '2. turda birden çok doğru çözüm vardır; öğrencilerden farklı çözümler isteyebilirsiniz.',
      ],
    },
    {
      id: 'laboratuvar',
      title: 'Kuvvet Laboratuvarı',
      part: 2,
      component: S09Laboratuvar,
      teacherNotes: [
        'Serbest deney alanıdır. Önce tahmin (mavi kesikli ok), sonra "Göster" ile karşılaştırma yapılır.',
        'R = 0 durumunda kutu harekete geçmez; bu durumun adı (dengelenmiş kuvvetler) sonraki simülasyonda verilecektir.',
        'Sahne, üç deney türü (aynı yönlü, zıt yönlü, üç kuvvet) denendiğinde tamamlanır; öğretmen dilerse önceden de devam edebilir.',
      ],
    },
    {
      id: 'gorevler',
      title: 'Mini Meydan Okumalar',
      part: 2,
      component: S10Gorevler,
      teacherNotes: [
        'Görevler kolaydan zora sıralanmıştır ve ders kitabındaki pekiştirme istasyonlarıyla örtüşür (ör. her kare 2 N, üç kuvvet, iten–çeken).',
        'İki yanlış denemeden sonra görsel ipucu açılır (kare sayıları). Süre sınırı yoktur.',
        'Yıldızlı görev (3 N, 4 N, 5 N) ünite sonu sorusuyla aynıdır: en büyük 12 N, en küçük 2 N.',
      ],
    },
    {
      id: 'kapanis',
      title: 'Kapanış',
      part: 2,
      component: S11Kapanis,
      teacherNotes: [
        'Üç kısa kontrol, öğrenme çıktısının temel öğelerini yoklar: kuvvetin özellikleri, bileşkenin bulunması, bileşkenin tanımı.',
        '3. kontroldeki "her zaman hareket yönündedir" seçeneği bilinçli bir çeldiricidir (Sahne 4 ile bağlantı).',
        'Merak sorusunun cevabı verilmez; dengelenmiş ve dengelenmemiş kuvvetler simülasyonuna köprüdür.',
      ],
    },
  ],
};

export default sim;
