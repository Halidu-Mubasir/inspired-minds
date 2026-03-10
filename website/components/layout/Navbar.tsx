"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NAV_LINKS } from "@/lib/data/nav-links";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{ backgroundColor: "#0c2340" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.jpeg"
              alt="Inspired Minds Home Tuition Agency"
              width={160}
              height={50}
              className="h-12 w-auto rounded-lg bg-white px-2 py-1 object-contain"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm px-4 py-2 transition-colors"
            >
              Contact Us
            </Link>
          </div>

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="md:hidden text-white/80 hover:text-white p-2 bg-transparent border-0 outline-none">
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 border-r-0 p-0"
              style={{ backgroundColor: "#0c2340" }}
            >
              {/* Mobile header */}
              <div className="flex items-center px-6 py-5 border-b border-white/10">
                <Image
                  src="/logo.jpeg"
                  alt="Inspired Minds Home Tuition Agency"
                  width={140}
                  height={44}
                  className="h-11 w-auto rounded-lg bg-white px-2 py-1 object-contain"
                />
              </div>

              {/* Mobile links */}
              <nav className="flex flex-col gap-1 p-4">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <div className="mt-4 px-4">
                  <Link
                    href="/contact"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm px-4 py-2.5 transition-colors"
                  >
                    Contact Us
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
