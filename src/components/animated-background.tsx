export function AnimatedBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -top-32 -left-24 h-[32rem] w-[32rem] rounded-full bg-primary/25 blur-3xl animate-blob-1" />
      <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent/30 blur-3xl animate-blob-2" />
      <div className="absolute -bottom-40 left-1/3 h-[30rem] w-[30rem] rounded-full bg-orange-300/40 blur-3xl animate-blob-3" />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}
