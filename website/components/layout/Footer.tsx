import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin } from "lucide-react";
import { SUBJECTS } from "@/lib/data/subjects";
import { NAV_LINKS } from "@/lib/data/nav-links";

export function Footer() {
  const popularSubjects = SUBJECTS.slice(0, 8);

  return (
    <footer style={{ backgroundColor: "#0c2340" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: Brand */}
          <div>
            <div className="mb-4">
              <Image
                src="/logo.jpeg"
                alt="Inspired Minds Home Tuition Agency"
                width={160}
                height={50}
                className="h-12 w-auto rounded-lg bg-white px-2 py-1 object-contain"
              />
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Connecting students in Tamale with qualified, vetted home tutors.
              Quality education, delivered to your door.
            </p>
            {/* Social placeholders */}
            <div className="flex gap-3 mt-6">
              {["f", "in", "t"].map((s) => (
                <div
                  key={s}
                  className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-xs font-bold cursor-pointer hover:bg-white/20 transition-colors"
                >
                  {s.toUpperCase()}
                </div>
              ))}
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Subjects */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Subjects
            </h3>
            <ul className="space-y-3">
              {popularSubjects.map((subject) => (
                <li key={subject}>
                  <Link
                    href="/teachers"
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {subject}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-sky-400 mt-0.5 flex-shrink-0" />
                <span className="text-white/60 text-sm">
                  0550 583 636 / 0506 402 626
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-sky-400 mt-0.5 flex-shrink-0" />
                <span className="text-white/60 text-sm">inspiredmindst@gmail.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-sky-400 mt-0.5 flex-shrink-0" />
                <span className="text-white/60 text-sm">
                  Tamale, Northern Region, Ghana
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} Inspired Minds Agency. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-white/40 hover:text-white/70 text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-white/40 hover:text-white/70 text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
