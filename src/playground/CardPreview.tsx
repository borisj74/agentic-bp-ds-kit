"use client";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { registry } from "./registry";
import styles from "./master.module.css";

// Pieces shrink to fit the preview, but never below this; past it they are cropped and fade out.
const MIN_SCALE = 0.6;

// Gallery card previews render on the client, so cards can pass handlers (onToggle, onCalculate) to kit pieces.
export function CardPreview({ name }: { name: string }) {
  const entry = registry[name];
  if (!entry) return null;
  return <FitPreview crop={entry.cardCrop}>{entry.card}</FitPreview>;
}

// Scales a card's piece down until it fits the padded preview box, centred. The piece keeps the box's width, so the
// scale never changes its layout (no feedback). crop keeps full size and shows the start of a wide bar, fading at the end.
function FitPreview({ children, crop = false }: { children: ReactNode; crop?: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, top: 0, left: 0, cropX: false, cropY: false });

  useLayoutEffect(() => {
    const box = boxRef.current;
    const inner = innerRef.current;
    if (!box || !inner) return;
    const measure = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      if (!w || !h) return;
      // Layout sizes, untouched by the transform: how tall the piece is and how far it runs past the box.
      const tall = inner.offsetHeight;
      const span = Math.max(inner.scrollWidth, w);
      const scale = crop ? 1 : Math.max(Math.min(1, h / tall, w / span), MIN_SCALE);
      const next = {
        scale: Math.round(scale * 100) / 100,
        top: Math.max((h - tall * scale) / 2, 0),
        // Too wide even at the smallest scale: start at the left and fade out on the right.
        left: crop ? 0 : Math.max((w - span * scale) / 2, 0),
        cropX: span * scale > w + 1,
        cropY: tall * scale > h + 1,
      };
      setFit((f) => (Object.keys(next).every((k) => Math.abs(Number(next[k as keyof typeof next]) - Number(f[k as keyof typeof f])) < 0.5) && next.scale === f.scale ? f : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [crop]);

  return (
    <div ref={boxRef} className={styles.fit} data-crop-x={fit.cropX || undefined} data-crop-y={fit.cropY || undefined}>
      <div
        ref={innerRef}
        className={[styles.fitInner, crop ? styles.fitStart : ""].join(" ")}
        style={{ top: fit.top, left: fit.left, transform: fit.scale === 1 ? undefined : `scale(${fit.scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

// Pattern galleries show the whole screen, not one piece: the page renders at its own size and is scaled down
// to the card's width, anchored at the top left, so what you see is the top of the real thing. The rest is
// cropped and faded with the same mask the component cards use.
export function PagePreview({ name, width = 1280, height = 900 }: { name: string; width?: number; height?: number }) {
  const entry = registry[name];
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => {
      const w = box.clientWidth;
      if (w) setScale(Math.round((w / width) * 1000) / 1000);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, [width]);

  if (!entry?.page) return <CardPreview name={name} />;
  // Cropped at the bottom whenever the page is taller than the box, which it always is at this scale.
  return (
    <div ref={boxRef} className={styles.page} data-crop-y>
      <div className={styles.pageInner} style={{ width, height, transform: `scale(${scale})` }}>{entry.page}</div>
    </div>
  );
}
