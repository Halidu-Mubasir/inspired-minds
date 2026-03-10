import { Phone, Mail, MapPin } from "lucide-react";

const CONTACT_INFO = [
  {
    icon: Phone,
    title: "Call / WhatsApp",
    lines: ["0550 583 636", "0506 402 626"],
    color: "bg-sky-50 text-sky-600",
  },
  {
    icon: Mail,
    title: "Email",
    lines: ["inspiredmindst@gmail.com"],
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: MapPin,
    title: "Location",
    lines: ["Tamale, Northern Region", "Ghana"],
    color: "bg-violet-50 text-violet-600",
  },
];

export function ContactInfoSection() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {CONTACT_INFO.map(({ icon: Icon, title, lines, color }) => (
            <div
              key={title}
              className="flex flex-col items-center text-center rounded-2xl border border-gray-100 p-8 bg-gray-50"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl mb-4 ${color} bg-opacity-20`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-[#0c2340] text-lg mb-2">{title}</h3>
              {lines.map((line) => (
                <p key={line} className="text-gray-600 text-sm">
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
