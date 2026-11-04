import Link from "next/link";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { SUBJECTS } from "@/lib/data/subjects";
import { NAV_LINKS } from "@/lib/data/nav-links";
import { SITE } from "@/lib/site";

export function Footer() {
  const popularSubjects = SUBJECTS.slice(0, 6);

  return (
    <footer className="bg-forest-deep text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/65">
              Connecting students in Tamale with qualified, vetted home tutors. Quality education, delivered to your door.
            </p>
            <a href={SITE.lmsUrl} className="mt-6 inline-flex rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
              Student & tutor portal →
            </a>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Explore</h3>
            <ul className="mt-4 space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/65 transition-colors hover:text-white">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Subjects</h3>
            <ul className="mt-4 space-y-3">
              {popularSubjects.map((subject) => (
                <li key={subject}>
                  <Link href="/teachers" className="text-sm text-white/65 transition-colors hover:text-white">{subject}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Contact us</h3>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span className="flex flex-col gap-1">
                  {SITE.phones.map((p) => (
                    <a key={p.tel} href={`tel:${p.tel}`} className="text-white/65 hover:text-white">{p.display}</a>
                  ))}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <a href={`https://wa.me/${SITE.whatsapp}`} className="text-white/65 hover:text-white">Chat on WhatsApp</a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <a href={`mailto:${SITE.email}`} className="break-all text-white/65 hover:text-white">{SITE.email}</a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span className="text-white/65">{SITE.location}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-white/45">© {new Date().getFullYear()} Inspired Minds Home Tuition Agency. All rights reserved.</p>
          <p className="text-sm text-white/45">Tamale · Northern Region · Ghana</p>
        </div>
      </div>
    </footer>
  );
}
