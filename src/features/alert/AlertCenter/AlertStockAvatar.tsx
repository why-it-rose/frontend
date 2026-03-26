export default function AlertStockAvatar({ color, ini }: { color: string; ini: string }) {
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[9px] font-black leading-[13.5px] text-white"
      style={{ backgroundColor: color }}
    >
      {ini}
    </div>
  );
}
