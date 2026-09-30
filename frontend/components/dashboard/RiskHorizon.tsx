import { Activity, ArrowUpRight, Cpu, ShieldCheck, Sparkles } from "lucide-react";

interface RiskHorizonProps {
  posture: string;
  riskCount: number;
  assetCount: number;
  onOpenStudio: () => void;
}

export function RiskHorizon({ posture, riskCount, assetCount, onOpenStudio }: RiskHorizonProps) {
  return (
    <section className="risk-horizon overflow-hidden rounded-[28px] border border-cyan-300/20 p-5 sm:p-7 relative">
      <div className="risk-horizon-grid" aria-hidden="true" />
      <div className="relative z-10 grid gap-8 xl:grid-cols-[1.1fr_.9fr] items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-[10px] font-bold tracking-[.16em] text-cyan-100"><Activity className="h-3.5 w-3.5 text-cyan-300" /> COMMAND DECK · MONITORING</div>
          <h2 className="mt-5 max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl">Your cyber posture, <span className="risk-gradient">made actionable.</span></h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">CRISP connects risk, controls, and investment decisions into a single intelligence surface—so the next move is clear before exposure compounds.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={onOpenStudio} className="risk-primary"><Sparkles className="h-4 w-4" /> Model a decision <ArrowUpRight className="h-4 w-4" /></button>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/35 px-3 text-xs text-slate-300"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Controls mapped to exposure</div>
          </div>
        </div>
        <div className="risk-orbit" aria-label="Cyber posture visual">
          <div className="orbit-ring orbit-one" /><div className="orbit-ring orbit-two" /><div className="orbit-node node-core"><Cpu className="h-6 w-6" /><span>CRISP</span></div>
          <div className="orbit-node node-risk"><b>{riskCount}</b><span>PRIORITIES</span></div><div className="orbit-node node-assets"><b>{assetCount}</b><span>ASSETS</span></div>
          <div className="orbit-node node-posture"><i /><span>{posture}</span></div>
          <svg className="orbit-lines" viewBox="0 0 420 260" fill="none" aria-hidden="true"><path d="M208 130 86 56M208 130l120-62M208 130l8 90" /><path d="M86 56l130 164 112-152" /></svg>
        </div>
      </div>
    </section>
  );
}
