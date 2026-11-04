interface StatChip {
  label: string;
  value: number;
  color?: "default" | "green" | "amber" | "red" | "blue";
}

interface StatsRowProps {
  stats: StatChip[];
}

const colorMap = {
  default: "bg-muted text-muted-foreground",
  green: "bg-success-soft text-success",
  amber: "bg-warning-soft text-warning",
  red: "bg-danger-soft text-destructive",
  blue: "bg-info-soft text-info",
};

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${colorMap[stat.color ?? "default"]}`}
        >
          <span className="font-bold">{stat.value}</span>
          <span>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
