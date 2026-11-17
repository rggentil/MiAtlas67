/** The MiAtlas67 wordmark: «MiAtlas» plus a tilted «67» block. */
export function Logo() {
  return (
    <p className="flex items-center font-display text-3xl leading-none">
      MiAtlas
      <span className="ml-1.5 -rotate-6 rounded-[10px] border-3 border-ink bg-accent px-1.5 py-0.5 text-2xl shadow-block-sm">
        67
      </span>
    </p>
  );
}
