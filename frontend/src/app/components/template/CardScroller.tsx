export default function CardScroller({
    items,
    renderCard,
    cardWidth = 140,
    cardMaxWidth = 170,
    gridCols = 3,
    className = "",
    ...rest
  }) {
    return (
      <div className={`w-full ${className}`} {...rest}>
        <div
          className={`
            flex overflow-x-auto snap-x gap-x-10 py-2 px-1 scrollbar-thin scrollbar-thumb-[var(--primary)]/40
            md:grid md:grid-cols-${gridCols} md:gap-x-40 md:gap-y-6
            md:overflow-x-visible md:snap-none
          `}
          style={{
            maxWidth: "100vw",
            boxSizing: "border-box",
          }}
        >
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className={`
                snap-center flex-shrink-0
                flex flex-col items-center text-center
                p-2.5
                rounded-3xl
                bg-[var(--surface-variant)]/30
                border border-[var(--primary)]/10
                shadow-[0_2px_12px_0_rgba(123,47,242,0.05)]
                hover:shadow-[0_6px_32px_0_rgba(123,47,242,0.15)]
                hover:bg-[var(--primary)]/10
                hover:border-[var(--primary)]/40
                transition
                cursor-pointer
                select-none
                backdrop-blur-md
                group
                md:min-w-0 md:max-w-full md:w-full
              `}
              style={{
                WebkitBackdropFilter: "blur(4px)",
                backdropFilter: "blur(4px)",
                minWidth: cardWidth,
                maxWidth: cardMaxWidth,
                width: cardWidth,
              }}
            >
              {renderCard(item)}
            </div>
          ))}
        </div>
      </div>
    );
  }
  