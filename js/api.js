// js/api.js

const TMDB_API_KEY = "1376260e8468e445c0d3c75c14947200";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

(function () {
  function buildUrl(path, params = {}) {
    const url = new URL(TMDB_BASE_URL + path);
    url.searchParams.set("api_key", TMDB_API_KEY);
    url.searchParams.set("language", "es-ES");
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  }

  async function handleResponse(res) {
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error API (${res.status}): ${text}`);
    }
    return res.json();
  }

  async function getPopularMovies(page = 1) {
    const url = buildUrl("/movie/popular", { page });
    const data = await fetch(url).then(handleResponse);
    return data.results || [];
  }

  async function getMovieDetails(id) {
    if (!id) throw new Error("ID no proporcionado");
    const url = buildUrl(`/movie/${id}`);
    return fetch(url).then(handleResponse);
  }

  async function getSimilarMovies(id, page = 1) {
    if (!id) throw new Error("ID no proporcionado");
    const url = buildUrl(`/movie/${id}/similar`, { page });
    const data = await fetch(url).then(handleResponse);
    return data.results || [];
  }

  function getPosterUrl(path, size = "w185") {
    if (!path) return "";
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  }

  window.API = {
    getPopularMovies,
    getMovieDetails,
    getSimilarMovies,
    getPosterUrl,
  };
})();
