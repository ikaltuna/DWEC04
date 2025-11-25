// js/favoritos.js

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("fav-tbody");
  const loadingEl = document.getElementById("fav-loading");
  const errorEl = document.getElementById("fav-error");
  const emptyEl = document.getElementById("fav-empty");

  const searchInput = document.getElementById("fav-search");
  const minRatingInput = document.getElementById("min-rating");
  const yearSelect = document.getElementById("year-select");
  const resetBtn = document.getElementById("fav-reset");

  let allFavoritesMovies = [];
  let filteredMovies = [];

  async function init() {
    showLoading();
    hideError();
    try {
      const ids = window.Favorites.getFavorites();
      if (!ids.length) {
        showEmpty();
        return;
      }

      const promises = ids.map((id) => window.API.getMovieDetails(id));
      allFavoritesMovies = await Promise.all(promises);
      fillYearSelect(allFavoritesMovies);
      applyFilters();
    } catch (err) {
      console.error(err);
      showError("No se han podido cargar tus favoritos.");
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

  function showEmpty() {
    if (emptyEl) emptyEl.classList.remove("hidden");
  }

  function hideEmpty() {
    if (emptyEl) emptyEl.classList.add("hidden");
  }

  function fillYearSelect(movies) {
    const years = new Set();
    movies.forEach((m) => {
      if (m.release_date) {
        years.add(m.release_date.substring(0, 4));
      }
    });

    const sortedYears = Array.from(years).sort((a, b) => b.localeCompare(a));
    yearSelect.innerHTML = '<option value="">Todos</option>';
    sortedYears.forEach((year) => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    });
  }

  function applyFilters() {
    const text = searchInput.value.trim().toLowerCase();
    const minRating = parseFloat(minRatingInput.value) || 0;
    const year = yearSelect.value;

    filteredMovies = allFavoritesMovies.filter((m) => {
      const matchText = (m.title || "").toLowerCase().includes(text);
      const matchRating = (m.vote_average || 0) >= minRating;
      const matchYear =
        !year || (m.release_date || "").startsWith(year);
      return matchText && matchRating && matchYear;
    });

    hideEmpty();
    if (!filteredMovies.length) {
      showEmpty();
    }

    renderTable(filteredMovies);
  }

  function renderTable(movies) {
    tbody.innerHTML = "";
    if (!movies.length) {
      return;
    }

    movies.forEach((movie) => {
      const tr = document.createElement("tr");
      tr.classList.add("clickable-row");
      tr.dataset.id = movie.id;

      const posterUrl = window.API.getPosterUrl(movie.poster_path, "w92");
      const releaseDate = movie.release_date || "-";

      tr.innerHTML = `
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
        <td>${releaseDate}</td>
        <td>
          <button class="icon-btn fav active" type="button" data-id="${movie.id}" aria-label="Quitar de favoritos">
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
        if (!isFav) {
          showToast("Eliminado de favoritos");
          const row = btn.closest("tr");
          if (row) row.remove();
        } else {
          showToast("Añadido a favoritos");
        }

        allFavoritesMovies = allFavoritesMovies.filter(
          (m) => window.Favorites.isFavorite(m.id)
        );
        applyFilters();
      });
    });
  }

  function goToDetail(id) {
    window.location.href = `detalle.html?id=${encodeURIComponent(id)}`;
  }

  searchInput.addEventListener("input", applyFilters);
  minRatingInput.addEventListener("input", applyFilters);
  yearSelect.addEventListener("change", applyFilters);
  resetBtn.addEventListener("click", () => {
    searchInput.value = "";
    minRatingInput.value = "0";
    yearSelect.value = "";
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
