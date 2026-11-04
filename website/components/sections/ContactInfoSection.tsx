import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { SITE } from "@/lib/site";

const CONTACT_INFO = [
  {
    icon: Phone,
    title: "Call us",
    lines: SITE.phones.map((p) => ({ text: p.display, href: `tel:${p.tel}` })),
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    lines: [{ text: "Chat with us now", href: `https://wa.me/${SITE.whatsapp}` }],
  },
  {
    icon: Mail,
    title: "Email",
    lines: [{ text: SITE.email, href: `mailto:${SITE.email}` }],
  },
  {
    icon: MapPin,
    title: "Location",
    lines: [{ text: SITE.location }],
  },
];

export function ContactInfoSection() {
  return (
    <section className="bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONTACT_INFO.map(({ icon: Icon, title, lines }) => (
            <div key={title} className="flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-xs">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                {lines.map((line) =>
                  "href" in line && line.href ? (
                    <a key={line.text} href={line.href} className="block break-words text-sm text-muted-foreground hover:text-primary">
                      {line.text}
                    </a>
                  ) : (
                    <p key={line.text} className="text-sm text-muted-foreground">{line.text}</p>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
