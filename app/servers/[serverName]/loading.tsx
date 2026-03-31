import type { ReactNode } from "react";

const Loading = (): ReactNode => {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-panel backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="h-8 w-40 rounded-full bg-slate-200" />
          <div className="h-12 w-72 rounded-2xl bg-slate-100" />
          <div className="h-24 rounded-3xl bg-slate-100" />
        </div>
        <div className="h-48 rounded-[1.5rem] bg-slate-950/90" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.3fr_0.7fr]">
        <div className="h-96 rounded-[1.5rem] bg-slate-100" />
        <div className="h-96 rounded-[1.5rem] bg-slate-100" />
      </div>
    </div>
  );
};

export default Loading;
