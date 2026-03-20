"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import {
  ArrowRight,
  ExternalLink,
  Menu,
  X,
  Twitter,
  ChevronRight,
  Shield,
  Layers,
  TrendingUp,
} from "lucide-react";

/* ─────────────────────────────────────────────
   3‑D Floating Credit Layers Visual
────────────────────────────────────────────── */
function CreditPrism() {
  return (
    <div
      className="relative mx-auto"
      style={{ width: 340, height: 340, perspective: "900px" }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(79,70,229,0.35) 0%, rgba(34,211,238,0.12) 55%, transparent 75%)",
          filter: "blur(28px)",
          top: "10%",
          left: "10%",
          right: "10%",
          bottom: "10%",
        }}
      />
      <motion.div
        style={{ transformStyle: "preserve-3d", width: "100%", height: "100%" }}
        animate={{ rotateY: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          className="absolute"
          style={{
            width: 200,
            height: 120,
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%) translateZ(100px) rotateX(10deg)",
            background: "linear-gradient(135deg, rgba(79,70,229,0.22), rgba(79,70,229,0.06))",
            border: "1px solid rgba(79,70,229,0.45)",
            borderRadius: 14,
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Shield size={22} className="text-indigo-400" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(229,231,235,0.9)", letterSpacing: "0.05em" }}>
            REPUTATION
          </span>
        </motion.div>
        <motion.div
          className="absolute"
          style={{
            width: 200,
            height: 120,
            left: "50%",
            top: "22%",
            transform: "translate(-50%,-50%) translateZ(-30px) rotateX(-18deg) rotateY(55deg)",
            background: "linear-gradient(135deg, rgba(34,211,238,0.18), rgba(34,211,238,0.05))",
            border: "1px solid rgba(34,211,238,0.4)",
            borderRadius: 14,
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Layers size={22} className="text-cyan-400" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(229,231,235,0.9)", letterSpacing: "0.05em" }}>
            NFT COLLATERAL
          </span>
        </motion.div>
        <motion.div
          className="absolute"
          style={{
            width: 200,
            height: 120,
            left: "50%",
            top: "78%",
            transform: "translate(-50%,-50%) translateZ(-30px) rotateX(18deg) rotateY(-55deg)",
            background: "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(34,197,94,0.05))",
            border: "1px solid rgba(34,197,94,0.35)",
            borderRadius: 14,
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <TrendingUp size={22} className="text-emerald-400" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(229,231,235,0.9)", letterSpacing: "0.05em" }}>
            YIELD-BACKED
          </span>
        </motion.div>
      </motion.div>
      <motion.div
        className="absolute"
        style={{
          width: 300,
          height: 300,
          left: "50%",
          top: "50%",
          marginLeft: -150,
          marginTop: -150,
          border: "1px dashed rgba(79,70,229,0.22)",
          borderRadius: "50%",
        }}
        animate={{ rotateZ: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        <div style={{ position: "absolute", top: -5, left: "50%", marginLeft: -5, width: 10, height: 10, borderRadius: "50%", background: "#4f46e5", boxShadow: "0 0 12px 4px rgba(79,70,229,0.6)" }} />
      </motion.div>
      <motion.div
        className="absolute"
        style={{
          width: 240,
          height: 240,
          left: "50%",
          top: "50%",
          marginLeft: -120,
          marginTop: -120,
          border: "1px dashed rgba(34,211,238,0.18)",
          borderRadius: "50%",
        }}
        animate={{ rotateZ: -360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <div style={{ position: "absolute", bottom: -4, left: "50%", marginLeft: -4, width: 8, height: 8, borderRadius: "50%", background: "#22d3ee", boxShadow: "0 0 10px 3px rgba(34,211,238,0.5)" }} />
      </motion.div>
    </div>
  );
}

function GridBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(79,70,229,0.18) 0%, transparent 70%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "30%", background: "linear-gradient(to bottom, transparent, var(--background))" }} />
    </div>
  );
}

function Navbar() {
  const { isConnected, bnsName, address, connect, isConnecting } = useWallet();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Docs", href: "https://docs.acredoprotocol.xyz", external: true },
    { label: "Blog", href: "#blog", external: false },
    { label: "X / Twitter", href: "https://x.com/acredoprotocol", external: true, icon: <Twitter size={14} /> },
  ];

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        background: scrolled ? "rgba(7,10,15,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        transition: "background 0.3s, backdrop-filter 0.3s, border-color 0.3s",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/acredo-logo.jpg" alt="Acredo" height={36} style={{ height: 36, width: "auto", borderRadius: 6, objectFit: "contain" }} />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors"
              style={{ color: "rgba(229,231,235,0.65)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(229,231,235,1)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(229,231,235,0.65)")}
            >
              {link.icon}
              {link.label}
              {link.external && <ExternalLink size={11} />}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={isConnected ? undefined : connect}
            disabled={isConnecting}
            className="hidden rounded-lg px-4 py-1.5 text-sm font-medium sm:inline-flex items-center gap-1.5"
            style={{ background: "rgba(79,70,229,0.15)", border: "1px solid rgba(79,70,229,0.45)", color: isConnected ? "#22d3ee" : "#a5b4fc", cursor: isConnecting ? "not-allowed" : "pointer" }}
            onMouseEnter={(e) => { if (!isConnected && !isConnecting) { e.currentTarget.style.background = "rgba(79,70,229,0.28)"; e.currentTarget.style.borderColor = "rgba(79,70,229,0.7)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(79,70,229,0.15)"; e.currentTarget.style.borderColor = "rgba(79,70,229,0.45)"; }}
          >
            {isConnecting ? "Connecting…" : isConnected ? (bnsName ?? (address ? address.slice(0, 8) + "…" : "Connected")) : "Connect Wallet"}
          </button>
          <Link
            href="/dashboard"
            className="hidden rounded-lg px-4 py-1.5 text-sm font-semibold sm:inline-flex items-center gap-1.5"
            style={{ background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "#fff" }}
          >
            Dashboard <ChevronRight size={14} />
          </Link>
          <button
            className="ml-1 rounded-lg p-2 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {open ? <X size={18} color="#e5e7eb" /> : <Menu size={18} color="#e5e7eb" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ background: "rgba(7,10,15,0.97)", borderTop: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
                  style={{ color: "rgba(229,231,235,0.75)", background: "rgba(255,255,255,0.03)" }}
                >
                  {link.icon}{link.label}{link.external && <ExternalLink size={11} />}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                <button
                  onClick={() => { setOpen(false); if (!isConnected) connect(); }}
                  disabled={isConnecting}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium"
                  style={{ background: "rgba(79,70,229,0.15)", border: "1px solid rgba(79,70,229,0.4)", color: "#a5b4fc" }}
                >
                  {isConnecting ? "Connecting…" : isConnected ? (bnsName ?? "Connected") : "Connect Wallet"}
                </button>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "#fff" }}
                >
                  Get Started →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

type CreditCardProps = {
  icon: React.ReactNode;
  label: string;
  tag: string;
  description: string;
  accentColor: string;
  delay?: number;
};

function CreditModelCard({ icon, label, tag, description, accentColor, delay = 0 }: CreditCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width - 0.5;
    const cy = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: cy * -14, y: cx * 14 });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay }}
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{ perspective: 800 }}
    >
      <motion.div
        style={{
          rotateX: tilt.x,
          rotateY: tilt.y,
          transition: "transform 0.15s ease",
          transformStyle: "preserve-3d",
          background: "linear-gradient(160deg, rgba(11,18,32,0.95), rgba(15,23,42,0.85))",
          border: `1px solid ${accentColor}33`,
          borderRadius: 16,
          padding: "1.75rem",
          height: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, background: `radial-gradient(circle at top right, ${accentColor}20, transparent 65%)`, pointerEvents: "none" }} />
        <div className="mb-4 inline-flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, background: `${accentColor}18`, border: `1px solid ${accentColor}40` }}>
          {icon}
        </div>
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", color: "#e5e7eb" }}>{label}</h3>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", padding: "2px 8px", borderRadius: 999, background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}35`, whiteSpace: "nowrap", flexShrink: 0 }}>
            {tag}
          </span>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(229,231,235,0.6)" }}>{description}</p>
      </motion.div>
    </motion.div>
  );
}

function Step({ num, title, desc, delay }: { num: number; title: string; desc: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay }}
      className="flex items-start gap-4"
    >
      <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: 40, height: 40, background: "linear-gradient(135deg, #4f46e5 0%, #22d3ee 100%)", fontSize: 15, fontWeight: 700, color: "#fff" }}>
        {num}
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 650, color: "#e5e7eb", marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(229,231,235,0.6)" }}>{desc}</div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const { connect, isConnecting, isConnected } = useWallet();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div style={{ background: "var(--background)", color: "var(--foreground)", minHeight: "100dvh", overflowX: "hidden" }}>
      <Navbar />

      {/* HERO */}
      <section ref={heroRef} className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 pt-16">
        <GridBackground />
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 flex w-full max-w-7xl flex-col items-center gap-8 lg:flex-row lg:justify-between lg:gap-12"
        >
          {/* Left */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:max-w-[520px]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1"
              style={{ background: "rgba(79,70,229,0.12)", border: "1px solid rgba(79,70,229,0.35)", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", color: "#a5b4fc" }}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#22d3ee" }} />
              BUILT ON STACKS · BITCOIN DEFI
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.04em", color: "#f1f5f9", marginBottom: 20 }}
            >
              Structured Credit
              <br />
              <span style={{ background: "linear-gradient(90deg, #818cf8 0%, #22d3ee 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                for Bitcoin DeFi
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}
              style={{ fontSize: "clamp(1rem, 2vw, 1.15rem)", lineHeight: 1.65, color: "rgba(229,231,235,0.65)", marginBottom: 32, maxWidth: 460 }}
            >
              Borrow using reputation, NFTs, or yield-backed positions on Stacks. A native credit layer combining peer-to-peer credit with pool-based liquidity.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all"
                style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "#fff", boxShadow: "0 0 24px rgba(79,70,229,0.4)" }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 36px rgba(79,70,229,0.65)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 24px rgba(79,70,229,0.4)")}
              >
                Get Started <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>

              <button
                onClick={isConnected ? undefined : connect}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "#e5e7eb", cursor: isConnecting ? "not-allowed" : "pointer" }}
                onMouseEnter={(e) => { if (!isConnecting) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              >
                {isConnecting ? "Connecting…" : isConnected ? "Wallet Connected ✓" : "Connect Wallet"}
              </button>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1.5 text-sm transition-colors"
                style={{ color: "rgba(229,231,235,0.5)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(229,231,235,0.9)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(229,231,235,0.5)")}
              >
                Learn More <ChevronRight size={14} />
              </a>
            </motion.div>
          </div>

          {/* Right: 3-D prism (desktop) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className="hidden lg:block"
            style={{ flexShrink: 0 }}
          >
            <CreditPrism />
          </motion.div>
        </motion.div>

        {/* Prism mobile */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.35 }}
          className="relative z-10 mt-8 block lg:hidden"
          style={{ maxWidth: 280, width: "100%", margin: "2rem auto 0" }}
        >
          <div style={{ transform: "scale(0.82)", transformOrigin: "center" }}>
            <CreditPrism />
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ color: "rgba(229,231,235,0.25)", fontSize: 22 }}>↓</motion.div>
        </motion.div>
      </section>

      {/* CREDIT MODELS */}
      <section className="relative px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-4 text-center">
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#818cf8", textTransform: "uppercase" }}>Core Credit Models</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.07 }}
            className="mb-4 text-center"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#f1f5f9" }}
          >
            Three Ways to Access Credit
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.12 }}
            className="mx-auto mb-14 max-w-lg text-center"
            style={{ fontSize: 15, color: "rgba(229,231,235,0.55)", lineHeight: 1.7 }}
          >
            Acredo supports reputation-based, NFT-collateralized, and yield-backed borrowing — giving every user a path to liquidity.
          </motion.p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <CreditModelCard
              icon={<Shield size={20} color="#818cf8" />}
              label="Reputation-Based Lending"
              tag="P2P"
              accentColor="#818cf8"
              description="Access capital based on your on-chain identity and activity via BNS. Loans are directly funded by lenders — no pool, no intermediary."
              delay={0}
            />
            <CreditModelCard
              icon={<Layers size={20} color="#22d3ee" />}
              label="NFT-Backed Lending"
              tag="P2P"
              accentColor="#22d3ee"
              description="Unlock liquidity from your NFTs by using them as escrow-backed collateral. Peer-to-peer, secured by verified asset value."
              delay={0.1}
            />
            <CreditModelCard
              icon={<TrendingUp size={20} color="#34d399" />}
              label="Yield-Backed Borrowing"
              tag="POOL"
              accentColor="#34d399"
              description="Deposit USDCX into Acredo vaults connected to Stacks DeFi protocols. Borrow against projected yield through pooled liquidity."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* LIQUIDITY LAYER */}
      <section className="relative px-4 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(34,211,238,0.06) 0%, transparent 70%)" }} />
        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#22d3ee", textTransform: "uppercase", display: "block", marginBottom: 12 }}>Liquidity Layer</span>
              <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.4rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#f1f5f9", marginBottom: 16, lineHeight: 1.15 }}>
                Credit Markets,<br />Separated from Liquidity
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(229,231,235,0.58)", marginBottom: 24 }}>
                P2P lending operates independently — lenders and borrowers connect directly. Yield-backed borrowing draws from a shared liquidity pool. You can deposit into the pool or vault to earn passive yield.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
                style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.35)", color: "#22d3ee" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(34,211,238,0.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(34,211,238,0.12)")}
              >
                Explore the App <ArrowRight size={14} />
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.1 }} className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "P2P Credit", sub: "Direct lender-borrower", color: "#818cf8", detail: "Reputation & NFT-backed loans bypass pools entirely." },
                { label: "Yield Pool", sub: "Pooled liquidity", color: "#22d3ee", detail: "Deposit USDCX, earn yield, fund yield-backed loans." },
                { label: "Vault", sub: "DeFi-connected vaults", color: "#34d399", detail: "USDCX vaults generate projected yield via Stacks." },
                { label: "BNS Identity", sub: "On-chain reputation", color: "#f59e0b", detail: "Your Bitcoin Name Service record builds borrowing power." },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}
                  style={{ background: "linear-gradient(160deg, rgba(11,18,32,0.95), rgba(15,23,42,0.8))", border: `1px solid ${item.color}28`, borderRadius: 12, padding: "1.2rem" }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", color: item.color, marginBottom: 4 }}>{item.sub.toUpperCase()}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#e5e7eb", marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "rgba(229,231,235,0.5)", lineHeight: 1.5 }}>{item.detail}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#818cf8", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
                How It Works
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.4rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#f1f5f9", marginBottom: 40, lineHeight: 1.15 }}
              >
                Up and Running<br />in Three Steps
              </motion.h2>
              <div className="flex flex-col gap-8">
                <Step num={1} title="Connect your Wallet" desc="Use the Hiro or Leather wallet to connect your Stacks address. Your BNS name and on-chain activity are read automatically." delay={0} />
                <Step num={2} title="Choose a Credit Model" desc="Pick reputation-based P2P, NFT-collateralized, or yield-backed borrowing — whichever fits your assets and goals." delay={0.1} />
                <Step num={3} title="Access Liquidity" desc="Borrow based on identity, assets, or yield. Repay on-chain with full transparency. Your reputation builds over time." delay={0.2} />
              </div>
              <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.35 }} className="mt-10">
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "#fff", boxShadow: "0 0 28px rgba(79,70,229,0.38)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 40px rgba(79,70,229,0.6)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 28px rgba(79,70,229,0.38)")}
                >
                  Open Dashboard <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            </div>

            {/* Capabilities panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
              style={{ background: "linear-gradient(160deg, rgba(11,18,32,0.95), rgba(15,23,42,0.9))", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "2rem", position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.2), transparent 65%)", pointerEvents: "none" }} />
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: "rgba(229,231,235,0.4)", marginBottom: 20, textTransform: "uppercase" }}>Protocol Capabilities</div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { title: "BNS-Powered Identity", desc: "Leverage your Bitcoin Name for reputation-based credit", icon: "◈", color: "#818cf8" },
                  { title: "NFT Escrow", desc: "Lock NFT collateral in smart contract escrow instantly", icon: "◆", color: "#22d3ee" },
                  { title: "Yield Vaults", desc: "USDCX deposits generate real yield on Stacks DeFi", icon: "◉", color: "#34d399" },
                  { title: "P2P Marketplace", desc: "Direct lender-borrower matching with no middle layer", icon: "◎", color: "#f59e0b" },
                ].map((item) => (
                  <div key={item.title} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "1rem" }}>
                    <div style={{ fontSize: 20, marginBottom: 8, color: item.color }}>{item.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 650, color: "#e5e7eb", marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(229,231,235,0.45)", lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="px-4 pb-24 pt-8 sm:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl overflow-hidden rounded-2xl"
          style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.18) 0%, rgba(34,211,238,0.1) 100%)", border: "1px solid rgba(79,70,229,0.3)", padding: "clamp(2rem, 5vw, 3.5rem)", textAlign: "center", position: "relative" }}
        >
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "32px 32px", pointerEvents: "none" }} />
          <h2 style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#f1f5f9", marginBottom: 12 }}>Ready to borrow on Bitcoin?</h2>
          <p style={{ fontSize: 15, color: "rgba(229,231,235,0.58)", marginBottom: 28, maxWidth: 400, margin: "0 auto 28px" }}>
            Connect your wallet and access structured credit in minutes. No KYC, no centralized gatekeepers — just your on-chain identity.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)", color: "#fff", boxShadow: "0 0 28px rgba(79,70,229,0.45)" }}
            >
              Get Started <ArrowRight size={15} />
            </Link>
            <a
              href="https://docs.acredoprotocol.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl px-6 py-3.5 text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e5e7eb" }}
            >
              Read the Docs <ExternalLink size={13} />
            </a>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "2rem 1.5rem" }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/acredo-logo.jpg" alt="Acredo Protocol" height={30} style={{ height: 30, width: "auto", borderRadius: 4, objectFit: "contain" }} />
          </div>
          <div className="flex items-center gap-5">
            {[
              { label: "Docs", href: "https://docs.acredoprotocol.xyz", external: true },
              { label: "Blog", href: "#blog", external: false },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="text-xs transition-colors"
                style={{ color: "rgba(229,231,235,0.4)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(229,231,235,0.8)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(229,231,235,0.4)")}
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://x.com/acredoprotocol"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs transition-colors"
              style={{ color: "rgba(229,231,235,0.4)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(229,231,235,0.8)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(229,231,235,0.4)")}
            >
              <Twitter size={12} /> Twitter
            </a>
          </div>
          <span style={{ fontSize: 11, color: "rgba(229,231,235,0.25)" }}>© {new Date().getFullYear()} Acredo Protocol. Built on Stacks.</span>
        </div>
      </footer>
    </div>
  );
}
