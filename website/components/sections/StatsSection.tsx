const STATS = [
  { value: "200+", label: "Qualified Tutors" },
  { value: "500+", label: "Students Helped" },
  { value: "15+", label: "Subjects Covered" },
  { value: "98%", label: "Satisfaction Rate" },
];

export function StatsSection() {
  return (
    <section className="bg-slate-50 border-y border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-bold text-sky-500">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
