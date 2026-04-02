import type { ReactNode } from "react";

const CubeWorkspaceLoading = (): ReactNode => {
  return (
    <div className="space-y-8">
      <div className="space-y-5 rounded-[2rem] border border-white/80 bg-white/90 p-8 shadow-panel backdrop-blur xl:p-10">
        <div className="h-10 w-40 rounded-full bg-slate-200" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.8fr)]">
          <div className="space-y-3">
            <div className="h-4 w-32 rounded-full bg-slate-200" />
            <div className="h-12 w-72 rounded-[1rem] bg-slate-100" />
            <div className="h-24 rounded-[1.5rem] bg-slate-100" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="h-24 rounded-[1.25rem] bg-slate-100" />
            <div className="h-24 rounded-[1.25rem] bg-slate-100" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(25rem,0.95fr)]">
        <div className="space-y-4">
          <div className="h-8 w-56 rounded-full bg-slate-200" />
          <div className="h-[24rem] rounded-[1.5rem] bg-slate-100" />
        </div>
        <div className="h-[32rem] rounded-[1.5rem] bg-slate-100" />
      </div>
    </div>
  );
};

export default CubeWorkspaceLoading;
