interface AlertStockAvatarProps {
  color: string;
  ini: string;
  logoUrl?: string | null;
}

export default function AlertStockAvatar({ color, ini, logoUrl }: AlertStockAvatarProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        className="h-7 w-7 shrink-0 rounded-[7px] object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[9px] font-black leading-[13.5px] text-white"
      style={{ backgroundColor: color }}
    >
      {ini}
    </div>
  );
}
