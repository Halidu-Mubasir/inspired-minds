export function TutorsHeroSection() {
  return (
    <section
      className="relative py-20"
      style={{
        background: "linear-gradient(135deg, #0c2340 0%, #0d3461 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          Meet Our Tutors
        </h1>
        <p className="mt-4 text-lg text-white/75 max-w-2xl mx-auto">
          Every tutor on our platform is personally vetted, qualified, and passionate
          about teaching. Browse our team and discover the expertise available to
          your child.
        </p>

        {/* Vetting highlights */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {[
            "Qualification Verified",
            "Subject Assessed",
            "Panel Interviewed",
            "Background Checked",
          ].map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm text-white/80"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
