/** Birimlendirme ızgarası: ders kitabındaki "her kare 1 N'ı gösterir" gösterimi. */
export function Grid({
  x,
  y,
  cols,
  rows,
  cell,
  opacity = 1,
  testId,
}: {
  x: number;
  y: number;
  cols: number;
  rows: number;
  cell: number;
  opacity?: number;
  testId?: string;
}) {
  const w = cols * cell;
  const h = rows * cell;
  const lines = [];
  for (let i = 0; i <= cols; i++) {
    lines.push(<line key={`v${i}`} x1={x + i * cell} y1={y} x2={x + i * cell} y2={y + h} />);
  }
  for (let j = 0; j <= rows; j++) {
    lines.push(<line key={`h${j}`} x1={x} y1={y + j * cell} x2={x + w} y2={y + j * cell} />);
  }
  return (
    <g opacity={opacity} data-testid={testId} data-cell={cell}>
      <rect x={x} y={y} width={w} height={h} fill="rgba(255,255,255,0.78)" rx={6} />
      <g stroke="#b9c3d3" strokeWidth={1.6}>{lines}</g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#9aa6b8" strokeWidth={2.5} rx={6} />
    </g>
  );
}

/** "1 kare = 10 N" ölçek rozeti */
export function ScaleBadge({ x, y, cell, newtons }: { x: number; y: number; cell: number; newtons: number }) {
  return (
    <g data-testid="scale-badge">
      <rect x={x} y={y} width={cell + 230} height={Math.max(cell, 40) + 28} rx={16} fill="#fff" stroke="#d6dbe5" strokeWidth={2} />
      <rect
        x={x + 14}
        y={y + 14}
        width={cell}
        height={cell}
        fill="rgba(255,255,255,0.8)"
        stroke="#7f8ca1"
        strokeWidth={2.5}
      />
      <text x={x + cell + 30} y={y + 14 + cell / 2 + 10} fontSize={28} fontWeight={650} fill="var(--ink)">
        1 kare = {newtons} N
      </text>
    </g>
  );
}

/** Yandan görünüşte yatay eksen: ◄ Batı | Doğu ► (Kuzey/Güney ekranın düşeyi için KULLANILMAZ) */
export function EastWestStrip({ x, y, width }: { x: number; y: number; width: number }) {
  return (
    <g data-testid="direction-strip" fontSize={26} fontWeight={650} fill="var(--ink-soft)">
      <line x1={x + 70} y1={y} x2={x + width - 70} y2={y} stroke="#aab4c4" strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />
      <path d={`M${x} ${y} l22 -13 v26z`} fill="#8b97aa" />
      <text x={x + 30} y={y + 9}>
        Batı
      </text>
      <path d={`M${x + width} ${y} l-22 -13 v26z`} fill="#8b97aa" />
      <text x={x + width - 30} y={y + 9} textAnchor="end">
        Doğu
      </text>
    </g>
  );
}

/** Düşey yön göstergesi: ▲ Yukarı / ▼ Aşağı */
export function UpDownGauge({ x, y, height }: { x: number; y: number; height: number }) {
  return (
    <g data-testid="direction-gauge" fontSize={24} fontWeight={650} fill="var(--ink-soft)">
      <line x1={x} y1={y + 40} x2={x} y2={y + height - 40} stroke="#aab4c4" strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />
      <path d={`M${x} ${y} l-13 22 h26z`} fill="#8b97aa" />
      <text x={x + 22} y={y + 20}>
        Yukarı
      </text>
      <path d={`M${x} ${y + height} l-13 -22 h26z`} fill="#8b97aa" />
      <text x={x + 22} y={y + height - 4}>
        Aşağı
      </text>
    </g>
  );
}
