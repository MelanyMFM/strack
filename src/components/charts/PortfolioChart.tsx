import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { CandleData } from '../../types';

interface PortfolioChartProps {
  data: CandleData[];
  loading?: boolean;
  ticker?: string;
  color?: string;
}

const RANGES = ['1M', '3M', '6M', '1Y', 'ALL'] as const;

function filterByRange(data: CandleData[], range: typeof RANGES[number]): CandleData[] {
  if (range === 'ALL' || !data.length) return data;
  const now = new Date();
  const days = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }[range];
  const cutoff = new Date(now.getTime() - days * 86_400_000).toISOString().split('T')[0];
  return data.filter((d) => d.date >= cutoff);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value as number;
  const prev = payload[0]?.payload?.prev as number | undefined;
  const change = prev ? val - prev : 0;
  const changePct = prev ? (change / prev) * 100 : 0;

  return (
    <div className="chart-tooltip px-3 py-2 text-xs">
      <div style={{ color: 'var(--text-muted)' }}>{formatDate(label)}</div>
      <div className="font-mono-num font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>
        {formatCurrency(val)}
      </div>
      {prev && (
        <div
          className="font-mono-num"
          style={{ color: change >= 0 ? 'var(--success)' : 'var(--danger)' }}
        >
          {change >= 0 ? '+' : ''}{formatCurrency(change)} ({changePct.toFixed(2)}%)
        </div>
      )}
    </div>
  );
};

export function PortfolioChart({ data, loading, color = '#22d3ee' }: PortfolioChartProps) {
  const [range, setRange] = useState<typeof RANGES[number]>('1Y');

  const filtered = useMemo(() => filterByRange(data, range), [data, range]);

  const enriched = useMemo(
    () =>
      filtered.map((d, i) => ({
        ...d,
        value: d.close,
        prev: i > 0 ? filtered[i - 1].close : undefined,
      })),
    [filtered]
  );

  const isPositive = enriched.length > 1
    ? enriched[enriched.length - 1].value >= enriched[0].value
    : true;

  const lineColor = isPositive ? 'var(--success)' : 'var(--danger)';
  const fillId = `gradient-${color.replace('#', '')}`;

  if (loading) {
    return (
      <div className="w-full h-64 skeleton rounded-xl" />
    );
  }

  if (!data.length) {
    return (
      <div
        className="w-full h-64 rounded-xl flex items-center justify-center text-sm"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
      >
        No chart data available
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Range selector */}
      <div className="flex items-center gap-1 mb-4">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className="px-3 py-1 rounded-md text-xs font-medium font-mono-num transition-all duration-150"
            style={
              range === r
                ? { background: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)', border: '1px solid rgba(34,211,238,0.3)' }
                : { background: 'transparent', color: 'var(--text-muted)', border: '1px solid transparent' }
            }
          >
            {r}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={enriched} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.15} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border-subtle)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'DM Mono' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => {
              const d = new Date(v);
              return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
            }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'DM Mono' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            fill={`url(#${fillId})`}
            dot={false}
            activeDot={{ r: 4, fill: lineColor, stroke: 'var(--bg-base)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
