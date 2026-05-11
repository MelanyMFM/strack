import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getSectorColor, formatCurrency, formatPercent } from '../../lib/utils';
import type { Holding } from '../../types';

interface AllocationChartProps {
  holdings: Holding[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip px-3 py-2 text-xs">
      <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{d.name}</div>
      <div className="font-mono-num" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(d.value)}</div>
      <div className="font-mono-num" style={{ color: 'var(--text-muted)' }}>{d.percent.toFixed(1)}%</div>
    </div>
  );
};

export function AllocationChart({ holdings }: AllocationChartProps) {
  const data = useMemo(() => {
    // Group by sector
    const sectors = new Map<string, number>();
    let total = 0;
    for (const h of holdings) {
      sectors.set(h.sector, (sectors.get(h.sector) || 0) + h.currentValue);
      total += h.currentValue;
    }
    return Array.from(sectors.entries())
      .map(([name, value]) => ({
        name,
        value,
        percent: total > 0 ? (value / total) * 100 : 0,
        color: getSectorColor(name),
      }))
      .sort((a, b) => b.value - a.value);
  }, [holdings]);

  if (!holdings.length) {
    return (
      <div
        className="h-48 rounded-xl flex items-center justify-center text-sm"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
      >
        No holdings to display
      </div>
    );
  }

  return (
    <div className="flex gap-6 items-center">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex-1 space-y-1.5">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
            <div className="text-xs flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
              {d.name}
            </div>
            <div className="text-xs font-mono-num" style={{ color: 'var(--text-muted)' }}>
              {d.percent.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Holdings bar allocation chart ───────────────────────────────────────────
export function HoldingsAllocation({ holdings }: AllocationChartProps) {
  const total = holdings.reduce((s, h) => s + h.currentValue, 0);

  return (
    <div className="space-y-3">
      {holdings.slice(0, 8).map((h) => {
        const pct = total > 0 ? (h.currentValue / total) * 100 : 0;
        return (
          <div key={h.ticker}>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                {h.logo && (
                  <img src={h.logo} alt={h.ticker} className="w-4 h-4 rounded object-contain" />
                )}
                <span className="text-xs font-medium font-mono-num" style={{ color: 'var(--text-primary)' }}>
                  {h.ticker}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {h.companyName}
                </span>
              </div>
              <span className="text-xs font-mono-num" style={{ color: 'var(--text-secondary)' }}>
                {pct.toFixed(1)}%
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: 'var(--bg-overlay)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${getSectorColor(h.sector)}, ${getSectorColor(h.sector)}88)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
