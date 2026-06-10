import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CursorExperience() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const springX = useSpring(mouseX, { stiffness: 120, damping: 28, mass: 0.4 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 28, mass: 0.4 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      setActive(true);
      mouseX.set(event.clientX);
      mouseY.set(event.clientY);
      document.documentElement.style.setProperty("--cursor-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--cursor-y", `${event.clientY}px`);
    };

    const handleLeave = () => setActive(false);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerleave", handleLeave);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerleave", handleLeave);
    };
  }, [mouseX, mouseY]);

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="cursor-aura"
        style={{ x: springX, y: springY, opacity: active ? 1 : 0 }}
      />
      <motion.div
        aria-hidden="true"
        className="cursor-core"
        style={{ x: springX, y: springY, opacity: active ? 1 : 0 }}
      />
    </>
  );
}
