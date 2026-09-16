import { Search, SlidersHorizontal, X } from "lucide-react";

const ServiceFilters = ({
  search,
  setSearch,
  category,
  setCategory,
  categories,
  resultCount,
}) => {
  const hasFilters =
    search.trim() !== "" || category !== "All";

  return (
    <div className="rounded-[26px] border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative w-full lg:max-w-md">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search services..."
            className="focus-ring h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-10 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Count */}
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <SlidersHorizontal size={16} />

          <span>
            {resultCount}{" "}
            {resultCount === 1 ? "service" : "services"}
          </span>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((item) => {
            const active = category === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={[
                  "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200",
                  active
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-950",
                ].join(" ")}
              >
                {item}
              </button>
            );
          })}
        </div>
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            setCategory("All");
          }}
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 transition hover:text-zinc-950"
        >
          <X size={14} />
          Clear filters
        </button>
      )}
    </div>
  );
};

export default ServiceFilters;