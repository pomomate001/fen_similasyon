import { LaunchPad, Rocket, ROCKET_CENTER_Y } from '../../art/objects';
import type { Force, Scale } from '../../physics/forces';
import { Grid, ScaleBadge, UpDownGauge } from '../../ui/force/Grid';

/** Roket sahneleri (S6–S7) ortak yerleşimi */
export const RK = {
  x: 820,
  groundY: 900,
  padY: 770,
  /** Kalkış anında roketin alt ucu (rampadan yeni ayrılmış) */
  bottomY: 748,
};
export const RK_CENTER = { x: RK.x, y: RK.bottomY + ROCKET_CENTER_Y };
export const RK_SCALE: Scale = { newtonsPerCell: 10, pxPerCell: 42 };

export const MOTOR: Force = { id: 'motor', magnitude: 100, sign: 1, axis: 'dusey', name: 'Motor kuvveti' };
export const GRAVITY: Force = { id: 'yer', magnitude: 10, sign: -1, axis: 'dusey', name: 'Yerçekimi kuvveti' };

export function RocketBackdrop({ dim = false }: { dim?: boolean }) {
  return (
    <g className={`time-freeze ${dim ? 'frozen' : ''}`}>
      <defs>
        <linearGradient id="duskSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fc3e6" />
          <stop offset="0.7" stopColor="#dcebf2" />
          <stop offset="1" stopColor="#f4ecd9" />
        </linearGradient>
      </defs>
      <rect width={1920} height={1080} fill="url(#duskSky)" />
      <path d="M0 760 C 300 700, 640 730, 980 690 C 1300 650, 1620 720, 1920 700 V900 H0 Z" fill="#b5d3ae" />
      <rect x={0} y={RK.groundY} width={1920} height={180} fill="#a8d08a" />
      <path d={`M0 ${RK.groundY} H1920`} stroke="#86b46c" strokeWidth={4} />
      <rect x={RK.x - 260} y={RK.groundY - 8} width={520} height={30} rx={12} fill="#c9c3b5" />
    </g>
  );
}

export function RocketGrid({ opacity = 0.7 }: { opacity?: number }) {
  const cell = RK_SCALE.pxPerCell;
  const rowsUp = 11;
  const rowsDown = 3;
  return (
    <g opacity={opacity} data-testid="rocket-grid">
      <Grid x={RK.x - cell * 2} y={RK_CENTER.y - cell * rowsUp} cols={4} rows={rowsUp + rowsDown} cell={cell} />
    </g>
  );
}

export function RocketScaleBadge() {
  return <ScaleBadge x={RK.x + 130} y={RK_CENTER.y + 60} cell={RK_SCALE.pxPerCell} newtons={RK_SCALE.newtonsPerCell} />;
}

/** lift: rampadan yükseklik (px). Kalkış anı: lift = KALKIS_LIFT */
export const KALKIS_LIFT = RK.padY - RK.bottomY;
export function RocketOnPad({ lift = 0, flame = 1, rise = 0 }: { lift?: number; flame?: number; rise?: number }) {
  return (
    <g>
      <LaunchPad x={RK.x} y={RK.padY} groundY={RK.groundY} />
      <g transform={`translate(0 ${-rise})`}>
        <Rocket x={RK.x} y={RK.padY - lift} flame={flame} />
      </g>
    </g>
  );
}

export function RocketGauge() {
  return <UpDownGauge x={RK.x - 440} y={170} height={560} />;
}
