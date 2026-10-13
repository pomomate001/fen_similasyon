import type { ComponentType } from 'react';
import type { NarrationManifest } from './narration';

export interface SceneDef {
  id: string;
  title: string;
  /** Bölüm indeksi (SimDef.parts içinde) */
  part: number;
  component: ComponentType;
  /** Öğretmen paneli: tartışma soruları, bilimsel notlar, basitleştirmeler */
  teacherNotes?: string[];
}

export interface SimDef {
  id: string;
  title: string;
  parts: string[];
  scenes: SceneDef[];
  narration: NarrationManifest;
  /** Ses dosyalarının bulunduğu klasör (public altında, göreli) */
  audioBase: string;
}
