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
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
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
