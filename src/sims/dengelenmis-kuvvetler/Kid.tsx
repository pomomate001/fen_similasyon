/**
 * Siyah-beyaz, mürekkep çizgili öğrenci karakteri (yandan görünüş, sağa bakar).
 * Eklemli iskelet: tüm açılar derece cinsinden, "aşağı"dan ileriye (+x) doğru ölçülür.
 * Yerel koordinatların başlangıcı leğen kemiğidir; gövde bu nokta etrafında döner.
 * Kırmızı yalnızca telefondadır.
 */
export type Gender = 'kiz' | 'erkek';
export type Face = 'phone' | 'shock' | 'hang' | 'happy';

export interface Pose {
  /** Gövde dönüşü (derece). 90 = yüz üstü, baş sağda. */
  rot: number;
  thighF: number;
  shinF: number;
  thighB: number;
  shinB: number;
  armF: number;
  foreF: number;
  armB: number;
  foreB: number;
  /** Baş eğimi (+ = öne/aşağı) */
  head: number;
  face: Face;
  phone: boolean;
  /** Çanta kapağı açıklığı 0–1 */
  pack: number;
  /** Balon direğinin uzunluğu 0–1 */
  mast: number;
  /** At kuyruğu salınımı (derece) */
  pony: number;
}

export const INK = '#161616';
export const RED = '#e0262b';
export const RED_DARK = '#8f1418';
const SW = 4;
const BACK = '#e4e4e0';

const THIGH = 78;
const SHIN = 74;
const UPPER = 54;
const FORE = 50;
const HIP = { x: 2, y: -4 };
const SHOULDER = { x: 4, y: -110 };
const NECK = { x: 8, y: -122 };
const HEAD = { x: 12, y: -166 };
const HEAD_R = 40;
const MAST_BASE = { x: -64, y: -68 };
const MAST_LEN = 86;

/** Kütle merkezi (kuvvet oklarının uygulama noktası) */
export const COM = { x: 2, y: -58 };

type P = { x: number; y: number };

function dir(a: number): P {
  const r = (a * Math.PI) / 180;
  return { x: Math.sin(r), y: Math.cos(r) };
}

function chain(root: P, a1: number, l1: number, a2: number, l2: number): [P, P] {
  const d1 = dir(a1);
  const j = { x: root.x + d1.x * l1, y: root.y + d1.y * l1 };
  const d2 = dir(a2);
  return [j, { x: j.x + d2.x * l2, y: j.y + d2.y * l2 }];
}

/** Balon iplerinin bağlandığı göbek (yerel) */
export function anchorLocal(mast: number): P {
  return { x: MAST_BASE.x - MAST_LEN * mast - 9, y: MAST_BASE.y };
}

export function toWorld(p: P, x: number, y: number, rot: number): P {
  const r = (rot * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: x + p.x * c - p.y * s, y: y + p.x * s + p.y * c };
}

/** Telefonu tutan elin konumu (yerel) */
export function handLocal(pose: Pose): P {
  return chain(SHOULDER, pose.armF, UPPER, pose.foreF, FORE)[1];
}

/** Ayağın tabanı leğenin ne kadar altında (yürürken leğen yüksekliği için) */
export function footDrop(pose: Pose): number {
  const [, aF] = chain(HIP, pose.thighF, THIGH, pose.shinF, SHIN);
  const [, aB] = chain(HIP, pose.thighB, THIGH, pose.shinB, SHIN);
  return Math.max(aF.y, aB.y) + 13;
}

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const k = Math.max(0, Math.min(1, t));
  const m = (u: number, v: number) => u + (v - u) * k;
  return {
    rot: m(a.rot, b.rot),
    thighF: m(a.thighF, b.thighF),
    shinF: m(a.shinF, b.shinF),
    thighB: m(a.thighB, b.thighB),
    shinB: m(a.shinB, b.shinB),
    armF: m(a.armF, b.armF),
    foreF: m(a.foreF, b.foreF),
    armB: m(a.armB, b.armB),
    foreB: m(a.foreB, b.foreB),
    head: m(a.head, b.head),
    face: k < 0.5 ? a.face : b.face,
    phone: k < 0.5 ? a.phone : b.phone,
    pack: m(a.pack, b.pack),
    mast: m(a.mast, b.mast),
    pony: m(a.pony, b.pony),
  };
}

/** Telefona bakarak yürüme; phi: adım evresi (radyan) */
export function walkPose(phi: number): Pose {
  const s = Math.sin(phi);
  const kneeF = 8 + 34 * Math.max(0, Math.cos(phi));
  const kneeB = 8 + 34 * Math.max(0, -Math.cos(phi));
  return {
    rot: 2,
    thighF: 24 * s,
    shinF: 24 * s - kneeF,
    thighB: -24 * s,
    shinB: -24 * s - kneeB,
    armF: 16,
    foreF: 122 + 3 * Math.sin(phi * 2),
    armB: -20 * s,
    foreB: -20 * s + 18,
    head: 26,
    face: 'phone',
    phone: true,
    pack: 0,
    mast: 0,
    pony: 6 * Math.sin(phi * 2),
  };
}

export const IDLE_POSE: Pose = { ...walkPose(0), thighF: 3, shinF: 1, thighB: -3, shinB: -4 };

/** Düşüş: kollar havada, bacaklar çırpınır */
export function fallPose(t: number): Pose {
  return {
    rot: 0,
    thighF: 26 + 18 * Math.sin(t * 15),
    shinF: 8 + 18 * Math.sin(t * 15),
    thighB: -6 + 18 * Math.sin(t * 15 + 2.4),
    shinB: -30 + 14 * Math.sin(t * 15 + 2.4),
    armF: 150 + 16 * Math.sin(t * 17),
    foreF: 165 + 16 * Math.sin(t * 17),
    armB: 165 + 16 * Math.sin(t * 17 + 2),
    foreB: 175 + 14 * Math.sin(t * 17 + 2),
    head: -8,
    face: 'shock',
    phone: false,
    pack: 0,
    mast: 0,
    pony: -30,
  };
}

/** Yüz üstü asılı: kollar ve bacaklar aşağı sarkar (yerel +x = dünyada aşağı) */
export function hangPose(t: number, face: Face = 'hang'): Pose {
  const w = Math.sin(t * 1.4);
  return {
    rot: 90,
    thighF: 50 + 3 * w,
    shinF: 40 + 4 * w,
    thighB: 34 - 3 * w,
    shinB: 22 - 4 * w,
    armF: 84 + 4 * Math.sin(t * 1.7),
    foreF: 96 + 4 * Math.sin(t * 1.7),
    armB: 74 + 4 * Math.sin(t * 1.7 + 1),
    foreB: 86 + 4 * Math.sin(t * 1.7 + 1),
    head: 4,
    face,
    phone: false,
    pack: 1,
    mast: 1,
    pony: 70,
  };
}

function Tube({ pts, w, fill }: { pts: P[]; w: number; fill: string }) {
  const d = `M${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')}`;
  return (
    <>
      <path d={d} stroke={INK} strokeWidth={w + 2 * SW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={fill} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

function Shoe({ at, a, back }: { at: P; a: number; back?: boolean }) {
  return (
    <g transform={`translate(${at.x.toFixed(1)} ${at.y.toFixed(1)}) rotate(${(-a).toFixed(1)})`}>
      <path
        d="M-12,-8 L14,-8 Q34,-6 35,6 L35,12 L-13,12 Z"
        fill={back ? '#3a3a3a' : '#222'}
        stroke={INK}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path d="M-11,7 L33,7" stroke="#fff" strokeWidth={3} />
    </g>
  );
}

function Leg({ pose, front, gender }: { pose: Pose; front: boolean; gender: Gender }) {
  const t = front ? pose.thighF : pose.thighB;
  const s = front ? pose.shinF : pose.shinB;
  const [knee, ankle] = chain(HIP, t, THIGH, s, SHIN);
  const pants = gender === 'erkek' ? (front ? 'url(#dg-hatch)' : 'url(#dg-hatch-back)') : front ? '#fff' : BACK;
  return (
    <g>
      <Tube pts={[HIP, knee, ankle]} w={gender === 'erkek' ? 28 : 22} fill={pants} />
      <Shoe at={ankle} a={s} back={!front} />
    </g>
  );
}

function Arm({ pose, front }: { pose: Pose; front: boolean }) {
  const a = front ? pose.armF : pose.armB;
  const f = front ? pose.foreF : pose.foreB;
  const [elbow, hand] = chain(SHOULDER, a, UPPER, f, FORE);
  const fill = front ? '#fff' : BACK;
  return (
    <g>
      <Tube pts={[SHOULDER, elbow, hand]} w={18} fill={fill} />
      {/* kol ağzı: üst kol tişört içinde */}
      <Tube pts={[SHOULDER, { x: SHOULDER.x + dir(a).x * 30, y: SHOULDER.y + dir(a).y * 30 }]} w={26} fill={fill} />
      <circle cx={hand.x} cy={hand.y} r={11} fill={fill} stroke={INK} strokeWidth={SW} />
      {front && pose.phone && <PhoneInHand hand={hand} />}
    </g>
  );
}

function PhoneInHand({ hand }: { hand: P }) {
  return (
    <g transform={`translate(${hand.x.toFixed(1)} ${hand.y.toFixed(1)})`}>
      {/* ekran ışığı */}
      <g stroke={INK} strokeWidth={2.5} strokeLinecap="round" opacity={0.55}>
        <path d="M-4,-20 L-12,-40" />
        <path d="M6,-22 L4,-46" />
        <path d="M16,-20 L22,-40" />
      </g>
      <g transform="rotate(-24)">
        <Phone />
      </g>
    </g>
  );
}

/** Telefon (kırmızı); merkez orijinde */
export function Phone() {
  return (
    <g data-testid="phone">
      <rect x={-21} y={-8} width={42} height={12} rx={4} fill={RED} stroke={RED_DARK} strokeWidth={3} />
      <path d="M-15,-8 L15,-8" stroke="#fff" strokeWidth={2} opacity={0.7} />
    </g>
  );
}

function Hair({ gender, pony }: { gender: Gender; pony: number }) {
  if (gender === 'erkek') {
    return (
      <g>
        <path
          d="M54,-180 C52,-204 22,-216 -2,-210 C-28,-204 -38,-182 -32,-156 C-30,-148 -24,-144 -18,-146 C-20,-160 -14,-172 -2,-176 C8,-172 14,-178 18,-184 C26,-176 40,-178 54,-180 Z"
          fill="#1c1c1c"
          stroke={INK}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        <path d="M4,-202 C14,-206 26,-204 34,-198" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.8} />
      </g>
    );
  }
  return (
    <g>
      {/* at kuyruğu */}
      <g transform={`rotate(${pony.toFixed(1)} -28 -190)`}>
        <path
          d="M-28,-194 C-58,-196 -74,-176 -72,-146 C-70,-124 -58,-110 -48,-104 C-54,-126 -50,-150 -26,-178 Z"
          fill="#1c1c1c"
          stroke={INK}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        <path d="M-60,-160 C-62,-146 -58,-130 -52,-120" stroke="#fff" strokeWidth={2.5} fill="none" opacity={0.7} />
      </g>
      <path
        d="M56,-176 C54,-204 24,-218 -2,-212 C-30,-206 -40,-182 -34,-152 C-32,-140 -26,-134 -18,-138 C-22,-156 -16,-170 -4,-174 C14,-170 30,-176 40,-186 C44,-180 50,-178 56,-176 Z"
        fill="#1c1c1c"
        stroke={INK}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <rect x={-34} y={-198} width={14} height={18} rx={5} transform="rotate(-20 -27 -189)" fill="#fff" stroke={INK} strokeWidth={3} />
      <path d="M2,-204 C14,-208 28,-204 36,-196" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.8} />
    </g>
  );
}

function FaceFeatures({ face }: { face: Face }) {
  const eye =
    face === 'shock' ? (
      <g>
        <ellipse cx={36} cy={-170} rx={8} ry={10} fill="#fff" stroke={INK} strokeWidth={3} />
        <circle cx={38} cy={-169} r={3.5} fill={INK} />
        <path d="M26,-188 Q36,-196 46,-190" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      </g>
    ) : face === 'phone' ? (
      <g>
        <path d="M28,-170 Q36,-166 44,-170" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        <circle cx={38} cy={-165} r={3.6} fill={INK} />
        <path d="M28,-184 L44,-182" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
      </g>
    ) : (
      <g>
        <circle cx={38} cy={-170} r={4.5} fill={INK} />
        <path
          d={face === 'hang' ? 'M28,-186 Q36,-190 46,-184' : 'M28,-186 Q36,-192 46,-188'}
          stroke={INK}
          strokeWidth={3.5}
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  const mouth =
    face === 'shock' ? (
      <ellipse cx={42} cy={-146} rx={6} ry={8} fill={INK} />
    ) : face === 'happy' ? (
      <path d="M34,-150 Q42,-140 50,-150" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
    ) : face === 'hang' ? (
      <path d="M36,-146 Q43,-150 49,-146" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
    ) : (
      <path d="M38,-147 L48,-147" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
    );
  return (
    <g>
      {eye}
      <path d="M51,-166 Q60,-158 52,-154" stroke={INK} strokeWidth={3.5} fill="#fff" strokeLinecap="round" strokeLinejoin="round" />
      {mouth}
      {face === 'shock' && (
        <g stroke={INK} strokeWidth={4} strokeLinecap="round">
          <path d="M70,-208 L84,-222" />
          <path d="M80,-186 L100,-190" />
          <path d="M50,-222 L54,-242" />
        </g>
      )}
    </g>
  );
}

function Head({ pose, gender }: { pose: Pose; gender: Gender }) {
  return (
    <g transform={`rotate(${pose.head.toFixed(1)} ${NECK.x} ${NECK.y})`}>
      <Tube pts={[NECK, { x: 10, y: -138 }]} w={18} fill="#fff" />
      <circle cx={HEAD.x} cy={HEAD.y} r={HEAD_R} fill="#fff" stroke={INK} strokeWidth={SW} />
      <path d="M-2,-172 Q-12,-166 -2,-156" stroke={INK} strokeWidth={3.5} fill="#fff" strokeLinecap="round" />
      <Hair gender={gender} pony={pose.pony} />
      <FaceFeatures face={pose.face} />
    </g>
  );
}

function Backpack({ pose }: { pose: Pose }) {
  const m = pose.mast;
  const tipX = MAST_BASE.x - MAST_LEN * m;
  return (
    <g>
      {/* askı */}
      <path d="M-22,-104 C-4,-118 14,-112 16,-96 L14,-58" stroke={INK} strokeWidth={10} fill="none" strokeLinecap="round" />
      <path d="M-22,-104 C-4,-118 14,-112 16,-96 L14,-58" stroke="#9a9a96" strokeWidth={4} fill="none" strokeLinecap="round" />
      {/* teleskopik direk */}
      {m > 0.01 && (
        <g>
          <path d={`M${MAST_BASE.x},${MAST_BASE.y} L${(MAST_BASE.x - MAST_LEN * Math.min(m, 0.55)).toFixed(1)},${MAST_BASE.y}`} stroke={INK} strokeWidth={16} strokeLinecap="round" />
          <path d={`M${MAST_BASE.x},${MAST_BASE.y} L${(MAST_BASE.x - MAST_LEN * Math.min(m, 0.55)).toFixed(1)},${MAST_BASE.y}`} stroke="#bcbcb8" strokeWidth={8} strokeLinecap="round" />
          <path d={`M${MAST_BASE.x},${MAST_BASE.y} L${tipX.toFixed(1)},${MAST_BASE.y}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
          <path d={`M${MAST_BASE.x},${MAST_BASE.y} L${tipX.toFixed(1)},${MAST_BASE.y}`} stroke="#fff" strokeWidth={3} strokeLinecap="round" />
          <circle cx={tipX - 9} cy={MAST_BASE.y} r={10} fill="#fff" stroke={INK} strokeWidth={SW} />
          <circle cx={tipX - 9} cy={MAST_BASE.y} r={3} fill={INK} />
        </g>
      )}
      <rect x={-68} y={-112} width={48} height={88} rx={16} fill="url(#dg-cross)" stroke={INK} strokeWidth={SW} />
      <rect x={-66} y={-62} width={32} height={30} rx={8} fill="#fff" stroke={INK} strokeWidth={3} />
      <path d="M-62,-50 L-38,-50" stroke={INK} strokeWidth={3} />
      {/* fırlatma kapağı: sırt yüzeyinde, açılınca menteşe etrafında döner */}
      <g transform={`rotate(${(-120 * pose.pack).toFixed(1)} -68 -86)`}>
        <rect x={-74} y={-86} width={12} height={34} rx={4} fill="#fff" stroke={INK} strokeWidth={3} />
        <circle cx={-68} cy={-69} r={3} fill={INK} />
      </g>
    </g>
  );
}

function Torso({ gender }: { gender: Gender }) {
  return (
    <g>
      {gender === 'erkek' ? (
        <rect x={-26} y={-22} width={52} height={28} rx={10} fill="url(#dg-hatch)" stroke={INK} strokeWidth={SW} />
      ) : (
        <path d="M-25,-22 L25,-22 L40,34 Q2,42 -36,34 Z" fill="url(#dg-hatch)" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      )}
      <path
        d="M-26,-12 C-30,-50 -30,-90 -22,-110 C-12,-122 14,-124 24,-108 C30,-86 30,-46 26,-12 Z"
        fill="#fff"
        stroke={INK}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      {gender === 'kiz' ? (
        <path d="M2,-116 L14,-104 L22,-116" stroke={INK} strokeWidth={3} fill="none" strokeLinejoin="round" />
      ) : (
        <path d="M-2,-116 Q12,-106 22,-114" stroke={INK} strokeWidth={3} fill="none" />
      )}
    </g>
  );
}

export function Kid({ gender, pose, x, y }: { gender: Gender; pose: Pose; x: number; y: number }) {
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${pose.rot.toFixed(2)})`} data-testid="kid" data-gender={gender}>
      <Arm pose={pose} front={false} />
      <Leg pose={pose} front={false} gender={gender} />
      {gender === 'kiz' && <Leg pose={pose} front gender={gender} />}
      <Torso gender={gender} />
      {gender === 'erkek' && <Leg pose={pose} front gender={gender} />}
      <Backpack pose={pose} />
      <Head pose={pose} gender={gender} />
      <Arm pose={pose} front />
    </g>
  );
}

/** Desenler: tarama (pantolon/etek), çapraz tarama (çanta), kaya dokusu */
export function InkDefs() {
  return (
    <defs>
      <pattern id="dg-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
        <rect width="9" height="9" fill="#fff" />
        <path d="M0,0 V9" stroke="#3a3a3a" strokeWidth="2.6" />
      </pattern>
      <pattern id="dg-hatch-back" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
        <rect width="9" height="9" fill={BACK} />
        <path d="M0,0 V9" stroke="#3a3a3a" strokeWidth="3" />
      </pattern>
      <pattern id="dg-cross" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="10" height="10" fill="#d6d6d2" />
        <path d="M0,0 V10 M0,0 H10" stroke="#555" strokeWidth="1.6" />
      </pattern>
      <pattern id="dg-hill" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
        <rect width="14" height="14" fill="#f7f7f4" />
        <path d="M0,0 V14" stroke="#cfcfca" strokeWidth="2" />
      </pattern>
    </defs>
  );
}
