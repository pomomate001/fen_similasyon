/**
 * İçerik hiyerarşisi: Ders → Sınıf → Ünite → Bölüm → Konu → Simülasyon.
 * Yeni bir simülasyon eklemek için: src/sims/<id>/ klasörü + burada bir konu satırı
 * + src/sims/registry.ts'de bir kayıt.
 * Henüz geliştirilmemiş içerik "yakinda" durumundadır ve başlatılamaz.
 */
export type TopicStatus = 'hazir' | 'yakinda';

export interface Topic {
  id: string;
  title: string;
  status: TopicStatus;
  simId?: string;
  summary?: string;
  /** Öğretim programı öğrenme çıktısı */
  outcome?: { code: string; text: string };
  goals?: string[];
  structure?: Array<{ name: string; scenes: number }>;
  minutes?: string;
}

export interface Section {
  no: number;
  title: string;
  topics: Topic[];
}

export interface Unit {
  no: number;
  title: string;
  sections: Section[];
}

export interface Grade {
  grade: number;
  units: Unit[];
}

export interface Subject {
  id: string;
  title: string;
  grades: Grade[];
}

export const catalog: Subject = {
  id: 'fen-bilimleri',
  title: 'Fen Bilimleri',
  grades: [
    {
      grade: 6,
      units: [
        {
          no: 2,
          title: 'Kuvvetin Etkisinde Hareket',
          sections: [
            {
              no: 1,
              title: 'Bileşke Kuvvet',
              topics: [
                {
                  id: 'bileske-kuvvet',
                  title: 'Bileşke Kuvvet',
                  status: 'hazir',
                  simId: 'bileske-kuvvet',
                  summary:
                    'Daldan düşen bir elmadan kalkışa hazır bir rokete: kuvvetleri görün, yerleştirin ve birden fazla kuvvetin etkisini tek bir kuvvetle göstermeyi keşfedin.',
                  outcome: {
                    code: 'FB.6.2.1',
                    text: 'Bir cisme etki eden aynı doğrultudaki kuvvetler arasındaki ilişkileri açıklayarak bileşke kuvveti yapılandırabilme',
                  },
                  goals: [
                    'Kuvvetin uygulama noktası, yön, doğrultu ve büyüklüğünü ayırt eder.',
                    'Aynı ve zıt yönlü kuvvetlerin bileşkesini bulur ve çizer.',
                    'Bileşke kuvveti kendi cümleleriyle açıklar.',
                  ],
                  structure: [
                    { name: 'Kuvveti Tanıyalım', scenes: 4 },
                    { name: 'Bileşke Kuvvet', scenes: 3 },
                    { name: 'Uygula ve Keşfet', scenes: 4 },
                  ],
                  minutes: '35–40 dk',
                },
                {
                  id: 'dengelenmis-kuvvetler',
                  title: 'Dengelenmiş ve Dengelenmemiş Kuvvetler',
                  status: 'yakinda',
                },
              ],
            },
            {
              no: 2,
              title: 'Sabit Süratli ve Sabit Hızlı Hareket',
              topics: [{ id: 'surat-hiz', title: 'Sürat ve Hız', status: 'yakinda' }],
            },
          ],
        },
      ],
    },
  ],
};

export function findTopicBySim(simId: string): Topic | undefined {
  for (const g of catalog.grades)
    for (const u of g.units)
      for (const s of u.sections)
        for (const t of s.topics) if (t.simId === simId) return t;
  return undefined;
}
