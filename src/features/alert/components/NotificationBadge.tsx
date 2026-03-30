import { useNotificationBadge } from '../hooks/useNotificationBadge';

interface NotificationBadgeProps {
  className?: string;
}

export const NotificationBadge = ({ className }: NotificationBadgeProps) => {
  const { count, isLoading, isError } = useNotificationBadge();

  if (isLoading || isError || count === 0) return null;

  const displayCount = count >= 100 ? '99+' : String(count);

  return (
    <span
      className={`
        absolute -top-1 -right-1
        min-w-[18px] h-[18px] px-1
        flex items-center justify-center
        rounded-full
        bg-[#EF4444] text-white
        text-[10px] font-bold leading-none
        ${className ?? ''}
      `}
    >
      {displayCount}
    </span>
  );
};
