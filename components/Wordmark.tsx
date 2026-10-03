"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BlurText from "@/components/reactbits/BlurText";

/** 左上角的名字：首次进入时逐字母由虚到实，播完换回普通文字（恢复字距） */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export default function Wordmark({ name, href }: { name: string; href: string }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setDone(true);
  }, []);

  return (
    <Link href={href} className="wordmark" aria-label={name}>
      {done ? (
        name
      ) : (
        <BlurText
          text={name}
          animateBy="letters"
          delay={55}
          stepDuration={0.5}
          easing={easeOut}
          animationFrom={{ filter: "blur(6px)", opacity: 0, y: 3 }}
          animationTo={[{ filter: "blur(0px)", opacity: 1, y: 0 }]}
          onAnimationComplete={() => setDone(true)}
        />
      )}
    </Link>
  );
}
