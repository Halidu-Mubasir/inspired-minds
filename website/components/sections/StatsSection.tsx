// Only publish numbers the agency can back up: parents check.
const STATS = [
  { value: "200+", label: "Qualified tutors" },
  { value: "500+", label: "Students helped" },
  { value: "15+", label: "Subjects covered" },
  { value: "98%", label: "Satisfaction rate" },
];

export function StatsSection() {
  return (
    <section className="border-y bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 divide-border lg:grid-cols-4 lg:divide-x">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col px-4 py-8 text-center lg:py-10">
              <dt className="order-2 mt-1 text-sm font-medium text-muted-foreground">{stat.label}</dt>
              <dd className="order-1 font-display text-4xl font-semibold text-primary sm:text-5xl">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
