/**
 * AI Analyst — powered by Claude (Anthropic API)
 *
 * HOW TO USE:
 * The Anthropic API is called directly from the client for development.
 * For production, add a backend proxy to protect your API key.
 *
 * API KEY SETUP:
 * 1. Go to https://console.anthropic.com
 * 2. Create account → API Keys → Create Key
 * 3. Add to .env: VITE_ANTHROPIC_API_KEY=sk-ant-xxxx
 *
 * ⚠️ SECURITY WARNING:
 * Never expose your Anthropic API key in production client-side code.
 * Use a backend (Express, Next.js API routes, Firebase Functions) as a proxy.
 * For development/demo purposes only.
 */

import { useState, useRef, useEffect } from 'react';
import { Send, BrainCircuit, Loader2, Sparkles, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import { usePortfolioStore } from '../../store/portfolioStore';
import { formatCurrency, formatPercent } from '../../lib/utils';
import type { AIMessage } from '../../types';

const SYSTEM_PROMPT = (portfolioContext: string) => `You are EquityLens AI, an expert portfolio analyst and financial advisor assistant. You help investors understand their portfolio, analyze performance, identify risks, and make informed decisions.

Current Portfolio Context:
${portfolioContext}

Guidelines:
- Be concise but insightful
- Use data from the portfolio when relevant
- Provide actionable advice
- Flag risks clearly
- Format numbers properly (%, $)
- Be educational but not overwhelming
- Add emojis sparingly for clarity
- Always remind users you're not a registered financial advisor for major decisions`;

function buildPortfolioContext(
  holdings: ReturnType<typeof usePortfolioStore>['holdings'],
  stats: ReturnType<typeof usePortfolioStore>['stats'],
  transactions: ReturnType<typeof usePortfolioStore>['transactions']
): string {
  if (!holdings.length) return 'No holdings yet.';

  const lines = [
    `Total Portfolio Value: ${formatCurrency(stats.totalValue)}`,
    `Total Cost Basis: ${formatCurrency(stats.totalCost)}`,
    `Total P&L: ${formatCurrency(stats.totalGain)} (${formatPercent(stats.totalGainPercent)})`,
    `Day Change: ${formatCurrency(stats.dayGain)} (${formatPercent(stats.dayGainPercent)})`,
    '',
    'Holdings:',
    ...holdings.map(
      (h) =>
        `  ${h.ticker} (${h.companyName}): ${h.quantity.toFixed(2)} shares @ ${formatCurrency(h.currentPrice)} = ${formatCurrency(h.currentValue)} | P&L: ${formatPercent(h.gainPercent)}`
    ),
    '',
    `Total Transactions: ${transactions.length}`,
  ];

  return lines.join('\n');
}

const QUICK_PROMPTS = [
  { icon: BarChart3, label: 'Analyze my portfolio', prompt: 'Give me a comprehensive analysis of my portfolio including diversification, risk, and performance.' },
  { icon: AlertTriangle, label: 'Identify risks', prompt: 'What are the main risks in my portfolio? What should I be worried about?' },
  { icon: TrendingUp, label: 'Growth opportunities', prompt: 'Based on my current portfolio, where do you see growth opportunities or underweighted sectors?' },
  { icon: Sparkles, label: 'Rebalancing advice', prompt: 'Should I rebalance my portfolio? What would you recommend?' },
];

export function AIChat() {
  const { holdings, stats, transactions } = usePortfolioStore();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: AIMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const portfolioContext = buildPortfolioContext(holdings, stats, transactions);
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

      if (!apiKey) {
        throw new Error('No Anthropic API key configured. Add VITE_ANTHROPIC_API_KEY to your .env file.');
      }

      const historyMessages = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: SYSTEM_PROMPT(portfolioContext),
          messages: [...historyMessages, { role: 'user', content: text }],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message || `API error ${response.status}`);
      }

      const data = await response.json() as { content: Array<{ type: string; text: string }> };
      const content = data.content.find((c) => c.type === 'text')?.text || 'No response';

      const assistantMsg: AIMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg: AIMessage = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ ${String(err)}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--accent-cyan-dim)', border: '1px solid rgba(34,211,238,0.2)' }}
            >
              <BrainCircuit size={28} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                AI Portfolio Analyst
              </h3>
              <p className="text-sm max-w-sm" style={{ color: 'var(--text-muted)' }}>
                Ask me anything about your portfolio — performance, risks, diversification, or investment strategies.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(prompt)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-left transition-all duration-150 hover:scale-[1.02]"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <Icon size={13} style={{ color: 'var(--accent-cyan)', shrink: 0 }} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mr-2 mt-0.5"
                style={{ background: 'var(--accent-cyan-dim)', border: '1px solid rgba(34,211,238,0.2)' }}
              >
                <BrainCircuit size={13} style={{ color: 'var(--accent-cyan)' }} />
              </div>
            )}
            <div
              className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
              style={
                msg.role === 'user'
                  ? { background: 'var(--accent-cyan-dim)', color: 'var(--text-primary)', border: '1px solid rgba(34,211,238,0.2)', borderBottomRightRadius: 4 }
                  : { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderBottomLeftRadius: 4 }
              }
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent-cyan-dim)', border: '1px solid rgba(34,211,238,0.2)' }}
            >
              <BrainCircuit size={13} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div
              className="px-4 py-3 rounded-2xl rounded-bl-sm"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-1.5">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: 'var(--accent-cyan)', animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Analyzing…</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4">
        <div
          className="flex items-end gap-2 rounded-xl p-2"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your portfolio…"
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-sm px-2 py-1"
            style={{ color: 'var(--text-primary)', maxHeight: 120 }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150"
            style={{
              background: input.trim() && !loading ? 'var(--accent-cyan)' : 'var(--bg-overlay)',
              color: input.trim() && !loading ? '#05090f' : 'var(--text-muted)',
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          AI insights are for educational purposes only — not financial advice.
        </p>
      </div>
    </div>
  );
}
