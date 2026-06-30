interface PaneProps {
  title: string;
  hint: string;
}

export function Pane({ title, hint }: PaneProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-xs text-sm opacity-60">{hint}</p>
    </div>
  );
}
