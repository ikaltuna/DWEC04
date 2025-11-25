// js/detalle.js

document.addEventListener("DOMContentLoaded", () => {
  const detailContainer = document.getElementById("movie-detail");
  const similarTbody = document.getElementById("similar-tbody");
  const loadingSimilar = document.getElementById("similar-loading");
  const errorSimilar = document.getElementById("similar-error");
  const backButton = document.getElementById("back-button");

  const params = new URLSearchParams(window.location.search);
  const movieId = params.get("id");

  let similarMovies = [];
  let currentSortKey = "title";
  let currentSortAsc = true;

  if (backButton) {
    backButton.addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "../index.html";
      }
    });
  }

  if (!movieId) {
    detailContainer.innerHTML =
      "<p class='error'>No se ha proporcionado ninguna película.</p>";
    return;
  }

  async function init() {
    await Promise.all([loadDetail(), loadSimilar()]);
  }

  async function loadDetail() {
    try {
      const movie = await window.API.getMovieDetails(movieId);
      renderDetail(movie);
    } catch (err) {
      console.error(err);
      detailContainer.innerHTML =
        "<p class='error'>No se ha podido cargar la información de la película.</p>";
    }
  }

  async function loadSimilar() {
    showSimilarLoading();
    hideSimilarError();
    try {
      similarMovies = await window.API.getSimilarMovies(movieId);
      renderSimilar(similarMovies);
    } catch (err) {
      console.error(err);
      showSimilarError("No se han podido cargar las películas similares.");
    } finally {
      hideSimilarLoading();
    }
  }

  function renderDetail(movie) {
    const posterUrl = window.API.getPosterUrl(movie.poster_path, "w342");
    const year = movie.release_date ? movie.release_date.substring(0, 4) : "";
    const isFav = window.Favorites.isFavorite(movie.id);

    detailContainer.innerHTML = `
      <div>
        ${
          posterUrl ? `<img src="${posterUrl}" alt="Póster de ${movie.title}" class="poster-large" />` : ""
        }
      </div>
      <div class="detail-meta">
        <h2 class="detail-title">${movie.title}</h2>
        <div class="detail-sub">
          ${year ? `<span>${year}</span>` : ""}
          ${movie.runtime ? ` • ${movie.runtime} min` : ""}
          ${
            movie.original_language
              ? ` • Idioma: ${movie.original_language.toUpperCase()}`
              : ""
          }
        </div>

        <div class="detail-kpis">
          <span class="detail-kpi">⭐ ${movie.vote_average?.toFixed(1) ?? "-"} / 10</span>
          <span class="detail-kpi">Votos: ${movie.vote_count ?? "-"}</span>
          <span class="detail-kpi">Popularidad: ${movie.popularity?.toFixed(0) ?? "-"}</span>
        </div>

        <div>
          ${(movie.genres || [])
            .map((g) => `<span class="badge">${g.name}</span>`)
            .join(" ")}
        </div>

        <p class="detail-overview">${movie.overview || "Sin sinopsis disponible."}</p>

        <button id="fav-detail-btn" class="favorite-btn" type="button" data-id="${movie.id}">
          <span class="favorite-icon">${isFav ? "★" : "☆"}</span>
          <span>${isFav ? "Quitar de favoritos" : "Añadir a favoritos"}</span>
        </button>
      </div>
    `;

    const favBtn = document.getElementById("fav-detail-btn");
    if (favBtn) {
      favBtn.addEventListener("click", () => {
        const id = favBtn.getAttribute("data-id");
        window.Favorites.toggleFavorite(id);
        const nowFav = window.Favorites.isFavorite(id);
        favBtn.querySelector(".favorite-icon").textContent = nowFav ? "★" : "☆";
        favBtn.querySelector("span:nth-child(2)").textContent = nowFav
          ? "Quitar de favoritos"
          : "Añadir a favoritos";
        showToast(nowFav ? "Añadido a favoritos" : "Eliminado de favoritos");
      });
    }
  }

  function showSimilarLoading() {
    if (loadingSimilar) loadingSimilar.classList.remove("hidden");
  }

  function hideSimilarLoading() {
    if (loadingSimilar) loadingSimilar.classList.add("hidden");
  }

  function showSimilarError(message) {
    if (!errorSimilar) return;
    errorSimilar.textContent = message;
    errorSimilar.classList.remove("hidden");
  }

  function hideSimilarError() {
    if (!errorSimilar) return;
    errorSimilar.textContent = "";
    errorSimilar.classList.add("hidden");
  }

  function renderSimilar(list) {
    similarTbody.innerHTML = "";
    if (!list.length) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        '<td colspan="4" class="empty-row">No se encontraron películas similares.</td>';
      similarTbody.appendChild(tr);
      return;
    }

    list.forEach((movie) => {
      const tr = document.createElement("tr");
      tr.classList.add("clickable-row");

      tr.addEventListener("click", () => {
        window.location.href = `detalle.html?id=${encodeURIComponent(
          movie.id
        )}`;
      });

      tr.innerHTML = `
        <td>${movie.title}</td>
        <td>${movie.vote_average?.toFixed(1) ?? "-"}</td>
        <td>${movie.popularity?.toFixed(0) ?? "-"}</td>
        <td>${movie.release_date ?? "-"}</td>
      `;

      similarTbody.appendChild(tr);
    });

    const headers = document.querySelectorAll(
      ".data-table.interactive thead th"
    );
    headers.forEach((th) => {
      th.addEventListener("click", () => {
        const key = th.getAttribute("data-sort");
        if (!key) return;
        if (currentSortKey === key) {
          currentSortAsc = !currentSortAsc;
        } else {
          currentSortKey = key;
          currentSortAsc = true;
        }
        sortSimilar(currentSortKey, currentSortAsc);
        renderSimilar(similarMovies);
        updateSortIndicators();
      });
    });

    updateSortIndicators();
  }

  function sortSimilar(key, asc) {
    similarMovies.sort((a, b) => {
      let va = a[key];
      let vb = b[key];

      if (key === "title") {
        va = (va || "").toString().toLowerCase();
        vb = (vb || "").toString().toLowerCase();
        return asc ? va.localeCompare(vb) : vb.localeCompare(va);
      }

      if (key === "release_date") {
        va = va || "";
        vb = vb || "";
        return asc ? va.localeCompare(vb) : vb.localeCompare(va);
      }

      va = va || 0;
      vb = vb || 0;
      return asc ? va - vb : vb - va;
    });
  }

  function updateSortIndicators() {
    const headers = document.querySelectorAll(
      ".data-table.interactive thead th"
    );
    headers.forEach((th) => {
      th.classList.remove("sorted-asc", "sorted-desc");
      const key = th.getAttribute("data-sort");
      if (key === currentSortKey) {
        th.classList.add(currentSortAsc ? "sorted-asc" : "sorted-desc");
      }
    });
  }

  
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
