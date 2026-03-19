interface Tab {
  label: string;
  value: string;
}

interface TabBarProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export default function TabBar({ tabs, value, onChange, size = 'md', className = '' }: TabBarProps) {
  const fontSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'py-3' : 'py-3.5';

  return (
    <div className={`flex border-b border-[#e5e7eb] ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`flex-1 ${padding} ${fontSize} font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? 'text-primary border-primary font-bold'
                : 'text-[#9ca3af] border-transparent'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
