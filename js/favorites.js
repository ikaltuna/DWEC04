// js/favorites.js

(function () {
  const STORAGE_KEY = "cinetren_favorites";

  function getFavorites() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((id) => typeof id === "string" || typeof id === "number");
      }
      return [];
    } catch (e) {
      console.error("Error leyendo favoritos", e);
      return [];
    }
  }

  function saveFavorites(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("Error guardando favoritos", e);
    }
  }

  function isFavorite(id) {
    const idStr = String(id);
    return getFavorites().includes(idStr);
  }

  function toggleFavorite(id) {
    const idStr = String(id);
    const favorites = getFavorites();
    const index = favorites.indexOf(idStr);
    if (index === -1) {
      favorites.push(idStr);
    } else {
      favorites.splice(index, 1);
    }
    saveFavorites(favorites);
    return favorites;
  }

  window.Favorites = {
    getFavorites,
    isFavorite,
    toggleFavorite,
  };
})();
