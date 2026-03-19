interface StockAvatarProps {
  color: string;
  text: string;
  size?: number;
  radius?: number;
}

function getFontSize(text: string, size: number): number {
  const isSmall = size <= 32;
  if (text.length >= 3) return isSmall ? 9 : 10;
  if (text.length === 2) return isSmall ? 9.5 : 13;
  return isSmall ? 14 : 16;
}

export default function StockAvatar({ color, text, size = 32, radius = 9 }: StockAvatarProps) {
  const fontSize = getFontSize(text, size);

  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: radius,
        background: color,
        fontSize,
        flexShrink: 0,
      }}
      className="flex items-center justify-center text-white font-black"
    >
      {text}
    </div>
  );
}
