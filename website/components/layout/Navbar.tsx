"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, Phone, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/layout/Logo";
import { NAV_LINKS } from "@/lib/data/nav-links";
import { SITE } from "@/lib/site";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.5rem] items-center justify-between gap-6">
          <Logo />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive ? "text-primary" : "text-foreground/70 hover:text-primary"
                  }`}
                >
                  {link.label}
                  {isActive && <span className="absolute inset-x-3.5 -bottom-[1.15rem] h-0.5 rounded-full bg-gold" aria-hidden />}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <a href={SITE.lmsUrl} className="rounded-lg px-3.5 py-2 text-sm font-semibold text-primary hover:bg-secondary">
              Log in
            </a>
            <Link href="/contact" className="btn-primary px-5 py-2.5 text-sm">
              Request a tutor
            </Link>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="rounded-lg border-0 bg-transparent p-2 text-foreground/80 outline-none hover:bg-secondary lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="border-b px-6 py-5">
                <Logo onClick={() => setOpen(false)} />
              </div>
              <nav className="flex flex-col gap-1 p-4" aria-label="Main">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                        isActive ? "bg-secondary text-primary" : "text-foreground/80 hover:bg-secondary"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="space-y-3 border-t p-6">
                <Link href="/contact" onClick={() => setOpen(false)} className="btn-primary w-full">
                  Request a tutor <ArrowRight className="h-4 w-4" />
                </Link>
                <a href={SITE.lmsUrl} className="btn-outline w-full">Log in to the portal</a>
                <a href={`tel:${SITE.phones[0].tel}`} className="flex items-center justify-center gap-2 pt-2 text-sm font-medium text-muted-foreground">
                  <Phone className="h-4 w-4" /> {SITE.phones[0].display}
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
