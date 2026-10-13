import { ObjectDefs, Rocket } from '../art/objects';
import { catalog, type Topic } from '../content/catalog';
import { sfx } from '../engine/sfx';
import { navigate } from '../router';
import { ForceArrow } from '../ui/force/ForceArrow';
import { IconLock, IconPlay } from '../ui/icons';
import { Stage } from '../ui/Stage';
import './home.css';

export function Home() {
  const grade = catalog.grades[0];
  const unit = grade.units[0];
  const featured = unit.sections[0].topics.find((t) => t.status === 'hazir')!;
  const upcoming: Array<{ section: string; topic: Topic }> = [];
  unit.sections.forEach((s) =>
    s.topics.forEach((t) => {
      if (t.status === 'yakinda') upcoming.push({ section: `${s.no}. Bölüm · ${s.title}`, topic: t });
    }),
  );

  const start = () => {
    sfx.unlock();
    navigate(`/sim/${featured.simId}`);
  };

  return (
    <Stage>
      <div className="home" data-testid="home">
        <HomeBackdrop />

        <header className="home-head">
          <div className="brand">
            <BrandMark />
            <div>
              <div className="brand-name">Fen Keşif Atölyesi</div>
              <div className="brand-sub">Gözlemle · Tahmin et · Dene · Keşfet</div>
            </div>
          </div>
          <nav className="grades" aria-label="Sınıflar">
            {[5, 6, 7, 8].map((g) => {
              const active = catalog.grades.some((x) => x.grade === g);
              return (
                <span key={g} className={`grade ${active ? 'active' : 'soon'}`} aria-disabled={!active}>
                  {g}. Sınıf
                  {!active && <small>Yakında</small>}
                </span>
              );
            })}
          </nav>
        </header>

        <div className="crumbs" aria-label="Konum">
          <span>{catalog.title}</span>
          <Chevron />
          <span>{grade.grade}. Sınıf</span>
          <Chevron />
          <span className="unit">
            {unit.no}. Ünite: {unit.title}
          </span>
        </div>

        <article className="feature" data-testid="topic-bileske-kuvvet">
          <div className="feature-art">
            <FeatureIllustration />
          </div>
          <div className="feature-body">
            <div className="eyebrow">1. Bölüm · Simülasyon</div>
            <h1>{featured.title}</h1>
            <p className="summary">{featured.summary}</p>
            {featured.outcome && (
              <div className="outcome">
                <span className="code">{featured.outcome.code}</span>
                <span>{featured.outcome.text}</span>
              </div>
            )}
            <ul className="goals">
              {featured.goals?.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
            <div className="structure">
              {featured.structure?.map((p, i) => (
                <div className="part" key={p.name}>
                  <span className="num">{i + 1}</span>
                  <span className="name">{p.name}</span>
                  <span className="dots">
                    {Array.from({ length: p.scenes }, (_, k) => (
                      <i key={k} />
                    ))}
                  </span>
                </div>
              ))}
            </div>
            <div className="launch">
              <button className="btn btn-primary start" onClick={start} data-testid="start">
                <IconPlay /> Başlat
              </button>
              <div className="time">≈ {featured.minutes} · 11 sahne</div>
            </div>
          </div>
        </article>

        <aside className="upcoming" aria-label="Yakında">
          {upcoming.map(({ section, topic }) => (
            <div className="soon-card" key={topic.id} aria-disabled="true" data-testid={`soon-${topic.id}`}>
              <div className="soon-tag">
                <IconLock /> Yakında
              </div>
              <div className="soon-section">{section}</div>
              <div className="soon-title">{topic.title}</div>
            </div>
          ))}
        </aside>

        <footer className="home-foot">Akıllı tahta için tasarlandı · Anlatımı duymak için hoparlörü açın</footer>
      </div>
    </Stage>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

function BrandMark() {
  return (
    <svg viewBox="0 0 100 100" width="92" height="92" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="#1b2333" />
      <path d="M50 78 V 30" stroke="#e5383b" strokeWidth="9" strokeLinecap="round" />
      <path d="M50 18 L62 36 H38 Z" fill="#e5383b" />
      <path d="M30 62 H 70" stroke="#1f6fe5" strokeWidth="9" strokeLinecap="round" />
      <path d="M82 62 L66 72 V52 Z" fill="#1f6fe5" />
      <circle cx="50" cy="62" r="7" fill="#ffb020" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}

function HomeBackdrop() {
  return (
    <svg className="home-backdrop" viewBox="0 0 1920 1080" aria-hidden="true">
      <defs>
        <pattern id="homeGrid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M48 0 H0 V48" fill="none" stroke="#e7e0d2" strokeWidth="1.5" />
        </pattern>
        <linearGradient id="homeFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf8f2" stopOpacity="0" />
          <stop offset="1" stopColor="#fbf8f2" />
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#homeGrid)" />
      <rect width="1920" height="1080" fill="url(#homeFade)" />
      <circle cx="1720" cy="140" r="260" fill="#ece7ff" opacity="0.7" />
      <circle cx="120" cy="980" r="220" fill="#dff1ea" opacity="0.8" />
    </svg>
  );
}

function FeatureIllustration() {
  return (
    <svg viewBox="0 0 640 760" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ borderRadius: 30 }}>
      <ObjectDefs />
      <defs>
        <linearGradient id="featSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#25345a" />
          <stop offset="1" stopColor="#3f5d8f" />
        </linearGradient>
      </defs>
      <rect width="640" height="760" rx="36" fill="url(#featSky)" />
      {Array.from({ length: 26 }, (_, i) => (
        <circle key={i} cx={(i * 97) % 620 + 10} cy={(i * 53) % 420 + 20} r={i % 3 === 0 ? 2.6 : 1.6} fill="#fff" opacity={0.7} />
      ))}
      <path d="M0 640 C 160 600, 420 620, 640 590 V760 H0 Z" fill="#2c4470" />
      <path d="M0 690 C 200 660, 420 680, 640 660 V760 H0 Z" fill="#203458" />
      <g className="feat-rocket">
        <Rocket x={300} y={560} s={1.05} flame={1} />
      </g>
      <ForceArrow x={300} y={413} axis="dusey" sign={1} length={300} kind="force" label="100 N" labelPos="left" />
      <ForceArrow x={300} y={413} axis="dusey" sign={-1} length={30} kind="force" />
      <ForceArrow x={418} y={413} axis="dusey" sign={1} length={270} kind="resultant" label="R" labelPos="right" />
    </svg>
  );
}
