const INVENTORY_REFRESH_EVENT = "inventory:refresh-requested";

export const broadcastInventoryRefresh = (detail = {}) => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(INVENTORY_REFRESH_EVENT, {
      detail: {
        ...detail,
        timestamp: new Date().toISOString(),
      },
    })
  );
};

export const subscribeToInventoryRefresh = (listener) => {
  if (typeof window === "undefined" || typeof listener !== "function") {
    return () => {};
  }

  const handleRefresh = (event) => {
    listener(event.detail || {});
  };

  window.addEventListener(INVENTORY_REFRESH_EVENT, handleRefresh);
  return () => window.removeEventListener(INVENTORY_REFRESH_EVENT, handleRefresh);
};

export { INVENTORY_REFRESH_EVENT };
