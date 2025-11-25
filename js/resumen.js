// js/resumen.js

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("movies-tbody");
  const loadingEl = document.getElementById("loading");
  const errorEl = document.getElementById("error");
  const searchInput = document.getElementById("search-input");
  const sortSelect = document.getElementById("sort-select");
  const resetFiltersBtn = document.getElementById("reset-filters");

  const kpiCount = document.getElementById("kpi-count");
  const kpiRating = document.getElementById("kpi-rating");
  const kpiPopularity = document.getElementById("kpi-popularity");

  let allMovies = [];
  let filteredMovies = [];

  async function init() {
    showLoading();
    hideError();
    try {
      const movies = await window.API.getPopularMovies(1);
      allMovies = movies;
      applyFilters();
    } catch (err) {
      console.error(err);
      showError("No se han podido cargar las películas. Inténtalo más tarde.");
    } finally {
      hideLoading();
    }
  }

  function showLoading() {
    if (loadingEl) loadingEl.classList.remove("hidden");
  }

  function hideLoading() {
    if (loadingEl) loadingEl.classList.add("hidden");
  }

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  }

  function hideError() {
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }

  function updateKPIs(movies) {
    const count = movies.length;
    kpiCount.textContent = String(count);

    if (count === 0) {
      kpiRating.textContent = "-";
      kpiPopularity.textContent = "-";
      return;
    }

    const avgRating =
      movies.reduce((sum, m) => sum + (m.vote_average || 0), 0) / count;
    const avgPop =
      movies.reduce((sum, m) => sum + (m.popularity || 0), 0) / count;

    kpiRating.textContent = avgRating.toFixed(1);
    kpiPopularity.textContent = avgPop.toFixed(0);
  }

  function applyFilters() {
    const text = searchInput.value.trim().toLowerCase();
    const sortBy = sortSelect.value;

    filteredMovies = allMovies.filter((m) =>
      (m.title || "").toLowerCase().includes(text)
    );

    filteredMovies.sort((a, b) => {
      if (sortBy === "release_date") {
        return (b.release_date || "").localeCompare(a.release_date || "");
      }
      return (b[sortBy] || 0) - (a[sortBy] || 0);
    });

    updateKPIs(filteredMovies);
    renderTable(filteredMovies);
  }

  function renderTable(movies) {
    tbody.innerHTML = "";
    if (movies.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = '<td colspan="8" class="empty-row">No se han encontrado resultados.</td>';
      tbody.appendChild(tr);
      return;
    }

    movies.forEach((movie, index) => {
      const tr = document.createElement("tr");
      tr.classList.add("clickable-row");
      tr.dataset.id = movie.id;

      const posterUrl = window.API.getPosterUrl(movie.poster_path, "w92");
      const releaseDate = movie.release_date || "-";

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>
          ${
            posterUrl
              ? `<img src="${posterUrl}" alt="Póster de ${movie.title || ""}" class="poster-thumb" />`
              : ""
          }
        </td>
        <td>${movie.title || "-"}</td>
        <td>${movie.vote_average?.toFixed(1) ?? "-"}</td>
        <td>${movie.vote_count ?? "-"}</td>
        <td>${movie.popularity?.toFixed(0) ?? "-"}</td>
        <td>${releaseDate}</td>
        <td>
          <button class="icon-btn fav ${
            window.Favorites.isFavorite(movie.id) ? "active" : ""
          }" type="button" data-id="${movie.id}" aria-label="Marcar como favorito">
            ★
          </button>
        </td>
      `;

      tr.addEventListener("click", () => {
        goToDetail(movie.id);
      });

      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".icon-btn.fav").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        window.Favorites.toggleFavorite(id);
        const isFav = window.Favorites.isFavorite(id);
        btn.classList.toggle("active", isFav);
        showToast(isFav ? "Añadido a favoritos" : "Eliminado de favoritos");
      });
    });
  }

  function goToDetail(id) {
    window.location.href = `html/detalle.html?id=${encodeURIComponent(id)}`;
  }

  searchInput.addEventListener("input", applyFilters);
  sortSelect.addEventListener("change", applyFilters);
  resetFiltersBtn.addEventListener("click", () => {
    searchInput.value = "";
    sortSelect.value = "popularity";
    applyFilters();
  });

  
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}


  init();
});
