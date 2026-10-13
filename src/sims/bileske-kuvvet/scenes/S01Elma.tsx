import { gsap } from 'gsap';
import { useRef, useState } from 'react';
import { Apple, AppleTree } from '../../../art/nature';
import { useScript } from '../../../engine/react';
import { sfx } from '../../../engine/sfx';
import { positionFromRest } from '../../../physics/motion';
import { APPLE_GROUND_Y, APPLE_HANG, GROUND_Y, Landscape, SceneSvg, TREE } from '../common';
import { T } from '../timings';

/** Sahne 1 — Merak: Ağaçtaki elma. Sahne çizilerek oluşur, elma düşer, soru sorulur. */
export function S01Elma() {
  const sun = useRef<SVGGElement>(null);
  const clouds = useRef<SVGGElement>(null);
  const hills = useRef<SVGGElement>(null);
  const ground = useRef<SVGGElement>(null);
  const flowers = useRef<SVGGElement>(null);
  const trunk = useRef<SVGGElement>(null);
  const branches = useRef<SVGGElement>(null);
  const canopy = useRef<SVGGElement>(null);
  const appleRef = useRef<SVGGElement>(null);
  const treeWrap = useRef<SVGGElement>(null);

  const [appleY, setAppleY] = useState(APPLE_HANG.y);
  const [rot, setRot] = useState(0);
  const [question, setQuestion] = useState(false);

  useScript(async (s) => {
    const inks = Array.from(branches.current?.querySelectorAll<SVGPathElement>('.ink') ?? []);
    const blobs = Array.from(canopy.current?.querySelectorAll<SVGElement>('.blob') ?? []);
    s.run(() => {
      inks.forEach((p) => {
        const len = p.getTotalLength?.() ?? 600;
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      gsap.set(blobs, { scale: 0, transformOrigin: '50% 50%' });
      gsap.set(trunk.current, { scaleY: 0, transformOrigin: '50% 100%' });
      gsap.set(appleRef.current, { scale: 0, transformOrigin: '50% 0%' });
      gsap.set(treeWrap.current, { opacity: 1 });
    });

    // 1) Sahne aşamalı olarak çizilerek oluşur
    await s.timeline((tl) => {
      tl.to([sun.current, clouds.current], { opacity: 1, duration: 0.8 })
        .fromTo(hills.current, { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.4')
        .to(ground.current, { opacity: 1, duration: 0.5 }, '-=0.3')
        .to(trunk.current, { scaleY: 1, duration: T.drawPart, ease: 'power2.out' })
        .to(inks, { strokeDashoffset: 0, duration: T.drawPart, stagger: 0.15, ease: 'power1.inOut' }, '-=0.1')
        .to(blobs, { scale: 1, duration: 0.5, stagger: T.drawStagger, ease: 'back.out(1.6)' }, '-=0.3')
        .to(appleRef.current, { scale: 1, duration: 0.6, ease: 'back.out(2)' })
        .fromTo(flowers.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3');
    });

    // 2) Elma rüzgârda hafifçe sallanır, sapı kopar
    await s.animate(0, 1, T.appleSway, (v) => setRot(Math.sin(v * Math.PI * 4) * 7 * (1 - v * 0.3)), 'sine.inOut');
    setRot(0);
    await s.wait(0.25);

    // 3) Sap kopar ("çıt"), elma başlangıçta durduğu yerden giderek hızlanarak düşer
    //    (hava direnci ihmal) ve yere çarpar ("tok").
    sfx.snap();
    await s.wait(0.12);
    const drop = APPLE_GROUND_Y - APPLE_HANG.y;
    const g = (2 * drop) / (T.appleFall * T.appleFall);
    sfx.whoosh(T.appleFall);
    await s.animate(0, T.appleFall, T.appleFall, (t) => setAppleY(APPLE_HANG.y + positionFromRest(g, 1, t)), 'none');
    sfx.thud();
    await s.tween(appleRef.current, { scaleY: 0.92, duration: 0.08, yoyo: true, repeat: 1, transformOrigin: '50% 100%' });

    // 4) Anlatım ve soru
    await s.narrate('s1.a');
    setQuestion(true);
    await s.narrate('s1.b');
    s.complete();
  });

  return (
    <>
      <SceneSvg>
        <Landscape hidden refs={{ sun, clouds, hills, ground, flowers }} />
        <g ref={treeWrap} style={{ opacity: 0 }}>
          <AppleTree baseX={TREE.baseX} groundY={GROUND_Y} branchTip={TREE.branchTip} refs={{ trunk, branches, canopy }} />
        </g>
        <g transform={`rotate(${rot} ${APPLE_HANG.x} ${TREE.branchTip.y})`}>
          <g ref={appleRef}>
            <Apple x={APPLE_HANG.x} y={appleY} s={1} data-testid="apple" />
          </g>
        </g>
      </SceneSvg>
      {question && (
        <div className="prompt-card fade-in" data-testid="question">
          <div style={{ fontSize: 22, color: 'var(--interact)', fontWeight: 700, letterSpacing: '0.06em' }}>DÜŞÜNELİM · TARTIŞALIM</div>
          Elmanın yere düşmesini sağlayan kuvvet nedir?
        </div>
      )}
    </>
  );
}
