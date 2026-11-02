import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Renders AI-written Markdown. react-markdown ignores raw HTML by default, so model output
 * can't inject markup; links open in a new tab.
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "text-sm leading-relaxed space-y-2 break-words",
        "[&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:font-semibold",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
        "[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3",
        "[&_table]:w-full [&_table]:text-left [&_th]:border-b [&_th]:pb-1 [&_td]:py-1 [&_td]:pr-3",
        "[&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
