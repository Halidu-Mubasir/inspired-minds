import Image from "next/image";
import { BookOpenCheck, MessagesSquare, Sparkles } from "lucide-react";

const POINTS = [
  { icon: BookOpenCheck, text: "Lesson plans, homework and notes from your tutor in one place" },
  { icon: MessagesSquare, text: "Message your tutor between sessions" },
  { icon: Sparkles, text: "An AI study helper that guides you, not does it for you" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[radial-gradient(closest-side,var(--gold),transparent)] opacity-24" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-[radial-gradient(closest-side,var(--leaf),transparent)] opacity-48" aria-hidden />

        <div className="relative flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1.5">
            <Image src="/logo-mark.png" alt="" width={40} height={40} priority />
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            Inspired <span className="text-gold">Minds</span>
          </span>
        </div>

        <div className="relative mt-auto max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-tight text-white">
            Where every lesson keeps going after the tutor leaves.
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4 text-gold" />
                </span>
                <span className="text-sm leading-relaxed text-sidebar-foreground/85">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-12 text-xs text-sidebar-muted">Inspired Minds Home Tuition Agency · Tamale, Ghana</p>
      </aside>

      <main className="flex flex-col items-center justify-center px-5 py-12 sm:px-10">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <Image src="/logo-mark.png" alt="" width={40} height={40} priority />
          <span className="text-lg font-bold tracking-tight text-primary">
            Inspired <span className="text-leaf">Minds</span>
          </span>
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
