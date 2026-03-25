import searchIco from '@/assets/search.svg';

interface MyPageSearchPlaceholderProps {
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function MyPageSearchPlaceholder({
  placeholder,
  value,
  onChange,
}: MyPageSearchPlaceholderProps) {
  const showCenteredHint = !!onChange && !(value ?? '').trim();

  return (
    <div className="relative mt-1 mb-7 h-8 w-full rounded-lg border border-[rgba(2,32,71,0.05)] bg-[#f0f4f9]">
      {onChange ? (
        <>
          <input
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder=""
            className="h-full w-full bg-transparent px-4 text-center text-[13px] font-medium leading-5 text-[#374151] focus:outline-none"
          />
          {showCenteredHint && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="inline-flex items-center gap-2 text-[13px] font-medium leading-5 text-[#9ca3af]">
                <img
                  src={searchIco}
                  alt=""
                  className="h-3.5 w-3.5 shrink-0 opacity-60"
                  width={14}
                  height={14}
                  aria-hidden
                />
                <span>{placeholder}</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full items-center justify-center">
          <div className="inline-flex items-center gap-2 text-[13px] font-medium leading-5 text-[#9ca3af]">
            <img src={searchIco} alt="" className="h-3.5 w-3.5 shrink-0 opacity-60" width={14} height={14} aria-hidden />
            <span>{placeholder}</span>
          </div>
        </div>
      )}
    </div>
  );
}
