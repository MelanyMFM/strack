import { AIChat } from '../components/ai/AIChat';
import { BrainCircuit, Zap, Shield } from 'lucide-react';

export function AIAnalyst() {
  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 56px - 48px)' }}>
      {/* Info banner */}
      <div
        className="flex items-start gap-4 p-4 rounded-xl mb-4 shrink-0"
        style={{ background: 'var(--accent-cyan-dim)', border: '1px solid rgba(34,211,238,0.15)' }}
      >
        <BrainCircuit size={18} style={{ color: 'var(--accent-cyan)', marginTop: 1, shrink: 0 }} />
        <div>
          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            AI Portfolio Analyst — powered by Claude
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Your portfolio data is sent to Claude to generate personalized insights. For production, route through a backend proxy to keep your API key private.
          </div>
        </div>
        <div className="flex items-center gap-3 ml-auto shrink-0">
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Zap size={11} style={{ color: 'var(--accent-cyan)' }} />
            Claude Sonnet 4
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Shield size={11} style={{ color: 'var(--success)' }} />
            Context-aware
          </div>
        </div>
      </div>

      {/* Chat fills remaining height */}
      <div className="flex-1 card overflow-hidden flex flex-col min-h-0">
        <AIChat />
      </div>
    </div>
  );
}
