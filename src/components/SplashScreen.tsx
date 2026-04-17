import { useState, useEffect, useRef } from 'react';
import { version } from '../../package.json';
import { motion, AnimatePresence } from 'framer-motion';
import { Satellite } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

function Particle({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        background: `radial-gradient(circle, rgba(0,122,255,0.6) 0%, transparent 70%)`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0, 1.5, 0],
        y: [0, -30 - Math.random() * 40],
      }}
      transition={{
        duration: 2.5,
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

function OrbitDot({ angle, radius, delay, dotSize }: { angle: number; radius: number; delay: number; dotSize: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-[#0A84FF]"
      style={{
        width: dotSize,
        height: dotSize,
        left: '50%',
        top: '50%',
        marginLeft: -dotSize / 2,
        marginTop: -dotSize / 2,
      }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 1, 0.3],
        x: [0, Math.cos(angle) * radius, Math.cos(angle + Math.PI) * radius],
        y: [0, Math.sin(angle) * radius, Math.sin(angle + Math.PI) * radius],
      }}
      transition={{
        duration: 3,
        delay,
        ease: 'easeInOut',
        repeat: 0,
      }}
    />
  );
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'logo' | 'text' | 'done'>('logo');
  // Stabilize onFinish via ref so parent re-renders (e.g. 1s header tick) don't
  // reset the splash timers and trap the user on the loading screen.
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 800);
    const t2 = setTimeout(() => setPhase('done'), 2600);
    const t3 = setTimeout(() => onFinishRef.current(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + Math.random() * 8 + 2;
      });
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: 30 + Math.random() * 40,
    y: 30 + Math.random() * 40,
    size: 4 + Math.random() * 8,
    delay: 0.3 + Math.random() * 1.5,
  }));

  const orbits = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    angle: (i / 6) * Math.PI * 2,
    radius: 60 + Math.random() * 30,
    delay: 0.2 + i * 0.15,
    dotSize: 3 + Math.random() * 3,
  }));

  return (
    <AnimatePresence>
      {phase !== 'done' ? (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at 50% 40%, #001a3a 0%, #000000 60%, #000000 100%)',
          }}
        >
          {/* 背景光晕 */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute w-[500px] h-[500px] rounded-full"
              style={{
                left: '50%',
                top: '40%',
                marginLeft: -250,
                marginTop: -250,
                background: 'radial-gradient(circle, rgba(0,122,255,0.12) 0%, transparent 70%)',
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 0.6] }}
              transition={{ duration: 2, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute w-[300px] h-[300px] rounded-full"
              style={{
                left: '50%',
                top: '40%',
                marginLeft: -150,
                marginTop: -150,
                background: 'radial-gradient(circle, rgba(0,122,255,0.08) 0%, transparent 70%)',
              }}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.5, 1.2], opacity: [0, 0.8, 0.4] }}
              transition={{ duration: 2.5, delay: 0.3, ease: 'easeOut' }}
            />
          </div>

          {/* 粒子 */}
          {particles.map(p => (
            <Particle key={p.id} delay={p.delay} x={p.x} y={p.y} size={p.size} />
          ))}

          {/* Logo 区域 */}
          <div className="relative">
            {/* 轨道点 */}
            {orbits.map(o => (
              <OrbitDot key={o.id} angle={o.angle} radius={o.radius} delay={o.delay} dotSize={o.dotSize} />
            ))}

            {/* 外环 */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                width: 120,
                height: 120,
                left: '50%',
                top: '50%',
                marginLeft: -60,
                marginTop: -60,
                border: '1px solid rgba(0,122,255,0.2)',
              }}
              initial={{ scale: 0, opacity: 0, rotate: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: 360 }}
              transition={{ duration: 2, ease: 'easeOut' }}
            />

            {/* Logo 图标 */}
            <motion.div
              className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,122,255,0.25) 0%, rgba(0,122,255,0.15) 100%)',
                border: '1px solid rgba(0,122,255,0.3)',
                boxShadow: '0 0 60px rgba(0,122,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
              initial={{ scale: 0, opacity: 0, rotateY: -90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.5 }}
              >
                <Satellite size={36} className="text-[#0A84FF]" strokeWidth={1.5} />
              </motion.div>
            </motion.div>
          </div>

          {/* 标题文字 */}
          <motion.div
            className="mt-8 text-center relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: phase === 'text' ? 1 : 0, y: phase === 'text' ? 0 : 20 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h1 className="text-white text-2xl font-semibold tracking-tight">
              LoRa GPS
            </h1>
            <p className="text-white/30 text-sm mt-1.5 tracking-wide">
              LocalNetwork 位置追踪系统
            </p>
          </motion.div>

          {/* 底部加载条 */}
          <motion.div
            className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'text' ? 1 : 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="h-[2px] w-full bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #007AFF, #0A84FF)',
                  width: `${Math.min(progress, 100)}%`,
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <p className="text-white/20 text-[10px] text-center mt-2 font-mono">
              {progress < 100 ? '正在初始化...' : '准备就绪'}
            </p>
          </motion.div>

          {/* 底部版本号 */}
          <motion.p
            className="absolute bottom-6 text-white/10 text-[10px] font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            v{version}
          </motion.p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
