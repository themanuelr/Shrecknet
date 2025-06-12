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
      <div className={`w-full ${className} py-4`} {...rest}>
  <div
    className={`
      flex overflow-x-auto snap-x gap-x-7 py-2 px-1
      scrollbar-thin scrollbar-thumb-[var(--primary)]/40
      md:gap-x-10 md:gap-y-6
      md:overflow-x-visible md:snap-none
      bg-white/5 rounded-2xl backdrop-blur-md border border-white/15 shadow-md
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
          p-3
          rounded-2xl
          bg-white/10
          border border-white/20
          shadow-xl
          hover:shadow-[0_8px_32px_0_rgba(123,47,242,0.15)]
          hover:border-[var(--primary)]/40
          hover:bg-[var(--primary)]/10
          transition
          cursor-pointer
          select-none
          group
          md:min-w-0 md:max-w-full md:w-full
        `}
        style={{
          WebkitBackdropFilter: "blur(5px)",
          backdropFilter: "blur(5px)",
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
  