import { Search, ArrowRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export function SearchBar({ size = "lg", initial = "" }: { size?: "lg" | "md"; initial?: string }) {
  const [q, setQ] = useState(initial);
  const navigate = useNavigate();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search", search: { q } as never });
  };
  const isLg = size === "lg";
  return (
    <form
      onSubmit={handleSubmit}
      className={`group relative flex w-full items-center overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur shadow-xl shadow-primary/5 transition-all focus-within:border-primary focus-within:shadow-primary/20 ${
        isLg ? "h-16" : "h-12"
      }`}
    >
      <Search className={`ml-4 shrink-0 text-muted-foreground ${isLg ? "h-6 w-6" : "h-5 w-5"}`} />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search for iPhone, MacBook, headphones..."
        className={`flex-1 bg-transparent px-4 outline-none placeholder:text-muted-foreground ${
          isLg ? "text-base" : "text-sm"
        }`}
      />
      <button
        type="submit"
        className={`m-1.5 inline-flex items-center gap-2 rounded-xl bg-brand-gradient font-semibold text-brand-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02] ${
          isLg ? "px-6 py-3 text-sm" : "px-4 py-2 text-sm"
        }`}
      >
        Search
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
