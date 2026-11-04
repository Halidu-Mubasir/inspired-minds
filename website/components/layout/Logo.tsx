import Image from "next/image";
import Link from "next/link";

/** The bulb-and-book mark with the wordmark, as in the agency logo. */
export function Logo({ light = false, onClick }: { light?: boolean; onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="flex shrink-0 items-center gap-2.5" aria-label="Inspired Minds home">
      <span className={light ? "flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1" : "flex h-11 w-11 items-center"}>
        <Image src="/logo-mark.png" alt="" width={44} height={44} className="h-full w-full object-contain" priority />
      </span>
      <span className="leading-none">
        <span className={`block text-lg font-extrabold tracking-tight ${light ? "text-white" : "text-primary"}`}>
          INSPIRED <span className="text-gold">MINDS</span>
        </span>
        <span className={`mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] ${light ? "text-white/60" : "text-muted-foreground"}`}>
          Home Tuition Agency
        </span>
      </span>
    </Link>
  );
}
