const GRID_POSTS_SLUG = "social-media-grid-posts";
const GRID_POSTS_PER_LINE = 3;

const isGridPostsService = (service) =>
  String(service?.slug || "").toLowerCase() === GRID_POSTS_SLUG;

const getGridPostPricingModes = (service) => {
  if (!isGridPostsService(service)) {
    return [];
  }

  const linePrice = Number(service.basePrice || 0);
  return [
    {
      key: "line",
      label: "Line-wise",
      unitPrice: linePrice,
      unit: "line",
      itemsPerUnit: GRID_POSTS_PER_LINE,
    },
    {
      key: "single_post",
      label: "Single post",
      unitPrice: linePrice / GRID_POSTS_PER_LINE,
      unit: "post",
      itemsPerUnit: 1,
    },
  ];
};

const resolveGridPostPricingMode = (service, requestedKey) => {
  if (!isGridPostsService(service)) {
    return null;
  }

  const key = requestedKey || "line";
  return getGridPostPricingModes(service).find((mode) => mode.key === key) || null;
};

module.exports = {
  GRID_POSTS_PER_LINE,
  getGridPostPricingModes,
  isGridPostsService,
  resolveGridPostPricingMode,
};
