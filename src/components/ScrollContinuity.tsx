import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

export default function ScrollContinuity() {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 72, damping: 28, mass: 0.45 });

  const flowY = useTransform(progress, [0, 1], ["0%", "-32%"]);
  const planeY = useTransform(progress, [0, 1], ["10vh", "-18vh"]);
  const planeRotate = useTransform(progress, [0, 1], [8, -7]);
  const lineScale = useTransform(progress, [0, 0.48, 1], [0.82, 1.08, 0.92]);
  const aperture = useTransform(progress, [0, 0.5, 1], ["36%", "52%", "42%"]);

  if (prefersReducedMotion) return null;

  return (
    <div className="scroll-continuity" aria-hidden="true">
      <motion.div className="continuity-aperture" style={{ width: aperture, height: aperture }} />
      <motion.div className="continuity-plane" style={{ y: planeY, rotate: planeRotate, scale: lineScale }} />
      <motion.div className="continuity-flow continuity-flow-a" style={{ y: flowY }} />
      <motion.div className="continuity-flow continuity-flow-b" style={{ y: flowY }} />
    </div>
  );
}
