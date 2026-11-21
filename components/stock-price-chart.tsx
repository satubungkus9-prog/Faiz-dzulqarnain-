import { useState } from "react";
import type { GlobalStock } from "@/lib/global-stocks";
import { formatLocalCurrency, formatUsd } from "@/lib/global-stocks";

type Timeframe = "1H" | "1M" | "1B" | "1T";

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "1H": "1 Hari",
  "1M": "1 Minggu",
  "1B": "1 Bulan",
  "1T": "1 Tahun",
};

export function StockPriceChart({ stock }: { stock: GlobalStock }) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1B");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const series = stock.history[timeframe];
  const minVal = Math.min(...series);
  const maxVal = Math.max(...series);
  const range = maxVal - minVal || 1;

  const startPrice = series[0];
  const currentDisplayPrice = hoverIndex !== null ? series[hoverIndex] : stock.priceUsd;
  const periodDelta = currentDisplayPrice - startPrice;
  const periodDeltaPct = startPrice > 0 ? (periodDelta / startPrice) * 100 : 0;
  const isPositive = periodDelta >= 0;

  const width = 640;
  const height = 180;
  const padX = 12;
  const padY = 16;

  const points = series.map((val, idx) => {
    const x =
      padX + (idx / Math.max(1, series.length - 1)) * (width - padX * 2);
    const y =
      height - padY - ((val - minVal) / range) * (height - padY * 2);
    return { x, y, val };
  });

  const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `M ${points[0].x.toFixed(1)},${(height - padY).toFixed(1)} L ${points
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" L ")} L ${points[points.length - 1].x.toFixed(1)},${(height - padY).toFixed(
    1
  )} Z`;

  const strokeColor = isPositive ? "#16a34a" : "#dc2626";
  const gradientId = `chart-grad-${stock.ticker.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">{stock.ticker}</span>
            <span aria-hidden="true">·</span>
            <span>{stock.exchange}</span>
            <span aria-hidden="true">·</span>
            <span>{stock.country}</span>
            <span aria-hidden="true">·</span>
            <span>{stock.sector}</span>
          </div>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            {stock.name}
          </h3>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
              {formatUsd(currentDisplayPrice)}
            </span>
            {stock.localCurrency !== "USD" && (
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                ({formatLocalCurrency(stock.localPrice, stock.localCurrency)})
              </span>
            )}
            <span
              className={`font-mono text-xs font-medium tabular-nums ${
                isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {isPositive ? "+" : ""}
              {periodDeltaPct.toFixed(2)}% ({TIMEFRAME_LABELS[timeframe]})
            </span>
          </div>
        </div>

        <div
          className="flex items-center gap-1 rounded-lg bg-muted p-1 self-start"
          role="group"
          aria-label="Rentang waktu grafik"
        >
          {(["1H", "1M", "1B", "1T"] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                timeframe === tf
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-44 w-full overflow-visible select-none"
          role="img"
          aria-label={`Grafik harga ${stock.name} (${stock.ticker})`}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <line
            x1={padX}
            y1={padY}
            x2={width - padX}
            y2={padY}
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeDasharray="3 3"
          />
          <line
            x1={padX}
            y1={height / 2}
            x2={width - padX}
            y2={height / 2}
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeDasharray="3 3"
          />
          <line
            x1={padX}
            y1={height - padY}
            x2={width - padX}
            y2={height - padY}
            stroke="currentColor"
            strokeOpacity="0.08"
          />

          <path d={areaPath} fill={`url(#${gradientId})`} />
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {points.map((pt, idx) => (
            <g key={idx}>
              <rect
                x={pt.x - width / series.length / 2}
                y={0}
                width={width / series.length}
                height={height}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoverIndex(idx)}
              />
              {(hoverIndex === idx || (hoverIndex === null && idx === points.length - 1)) && (
                <>
                  <line
                    x1={pt.x}
                    y1={padY}
                    x2={pt.x}
                    y2={height - padY}
                    stroke={strokeColor}
                    strokeOpacity="0.35"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4.5"
                    fill={strokeColor}
                    stroke="var(--card)"
                    strokeWidth="2"
                  />
                </>
              )}
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-5">
        <div>
          <p className="text-xs text-muted-foreground">Kapitalisasi Pasar</p>
          <p className="mt-0.5 font-mono text-sm font-medium tabular-nums text-foreground">
            ${stock.marketCapUsdB.toLocaleString("en-US")}B
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Rasio P/E</p>
          <p className="mt-0.5 font-mono text-sm font-medium tabular-nums text-foreground">
            {stock.peRatio.toFixed(1)}x
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Imbal Hasil Dividen</p>
          <p className="mt-0.5 font-mono text-sm font-medium tabular-nums text-foreground">
            {stock.dividendYieldPercent.toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Rentang 52 Minggu</p>
          <p className="mt-0.5 font-mono text-sm font-medium tabular-nums text-foreground">
            ${stock.low52wUsd} – ${stock.high52wUsd}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Volume 24 Jam</p>
          <p className="mt-0.5 font-mono text-sm font-medium tabular-nums text-foreground">
            {stock.volume24hM.toFixed(1)}M lbr
          </p>
        </div>
      </div>
    </div>
  );
}
