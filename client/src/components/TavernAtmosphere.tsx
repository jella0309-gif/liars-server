import React, { useEffect, useRef } from 'react';

/** Decorative scene; pointer motion stays outside React's render loop. */
export function TavernAtmosphere() {
  const scene = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = matchMedia(
      '(prefers-reduced-motion: no-preference) and (pointer: fine)'
    );
    let frame = 0;
    const move = (event: PointerEvent) => {
      if (!media.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        scene.current?.style.setProperty(
          '--scene-x',
          `${(event.clientX / innerWidth - 0.5) * -10}px`
        );
        scene.current?.style.setProperty(
          '--scene-y',
          `${(event.clientY / innerHeight - 0.5) * -6}px`
        );
      });
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      scene.current?.style.setProperty('--scene-x', '0px');
      scene.current?.style.setProperty('--scene-y', '0px');
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('blur', reset);
    media.addEventListener('change', reset);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('blur', reset);
      media.removeEventListener('change', reset);
    };
  }, []);
  return (
    <div ref={scene} className="tavern-atmosphere" aria-hidden="true">
      <div className="tavern-scene" />
      <div className="tavern-shade" />
      <div className="tavern-lamplight" />
      <div className="tavern-neon-glow" />
      <div className="tavern-smoke smoke-one" />
      <div className="tavern-smoke smoke-two" />
      <div className="tavern-embers">
        {Array.from({ length: 9 }, (_, i) => (
          <i
            key={i}
            style={
              {
                '--ember-x': `${8 + ((i * 31) % 86)}%`,
                '--ember-delay': `${i * -1.7}s`,
                '--ember-duration': `${10 + (i % 4) * 3}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
