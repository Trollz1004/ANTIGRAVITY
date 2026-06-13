import clsx from "@/lib/clsx";

interface SparkProps {
  values: number[];
  color?: "brand" | "success" | "info" | "warning";
  height?: number;
  width?: number;
  fill?: boolean;
}

export function Sparkline({
  values,
  color = "brand",
  height = 64,
  width = 280,
  fill = true,
}: SparkProps) {
  const w = width;
  const h = height;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - 6 - ((v - min) / span) * (h - 12);
    return [x, y] as const;
  });
  const line = pts
    .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(" ");
  const area = fill ? line + ` L ${w} ${h} L 0 ${h} Z` : "";

  return (
    <svg
      className={clsx("spark", color)}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: h, display: "block" }}
    >
      {fill && <path className="fill" d={area} />}
      <path className="line" d={line} />
    </svg>
  );
}
