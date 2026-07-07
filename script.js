/**
 * CineVault - Movie Search & Watchlist App
 * Powered by TMDB API
 */

const API_KEY = 'dddfbb91ea81cb27eb835db2c45745d9';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_PATH = 'https://image.tmdb.org/t/p/original';

// State Management
let watchlist = JSON.parse(localStorage.getItem('cinevault_watchlist')) || [];
let currentView = 'home'; // 'home' or 'watchlist'
let currentSearchQuery = '';

// DOM Elements
const movieGrid = document.getElementById('movie-grid');
const searchInput = document.getElementById('movie-search');
const sectionTitle = document.getElementById('section-title');
const navHome = document.getElementById('nav-home');
const navWatchlist = document.getElementById('nav-watchlist');
const logoBtn = document.getElementById('logo-btn');
const watchlistEmpty = document.getElementById('watchlist-empty');
const backHomeBtn = document.getElementById('back-home-btn');
const heroSection = document.getElementById('hero-section');
const movieModal = document.getElementById('movie-modal');
const closeModal = document.getElementById('close-modal');
const modalContent = document.getElementById('modal-content');

/**
 * INITIALIZATION
 */
document.addEventListener('DOMContentLoaded', () => {
    fetchMovies('/movie/popular');
    setupHero();
});

/**
 * API CALLS
 */
async function fetchMovies(endpoint, query = '') {
    showLoader();
    try {
        const url = query
            ? `${BASE_URL}${endpoint}?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
            : `${BASE_URL}${endpoint}?api_key=${API_KEY}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.results) {
            renderMovies(data.results);
        }
    } catch (error) {
        console.error('Error fetching movies:', error);
        movieGrid.innerHTML = `<p class="text-center col-span-full py-10">Something went wrong. Please try again later.</p>`;
    }
}

async function fetchMovieDetails(id) {
    try {
        const res = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&append_to_response=credits,videos`);
        const data = await res.json();
        renderModal(data);
    } catch (error) {
        console.error('Error fetching details:', error);
    }
}

async function setupHero() {
    try {
        const res = await fetch(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}`);
        const data = await res.json();
        const movie = data.results[0];

        if (movie) {
            heroSection.classList.remove('hidden');
            document.getElementById('hero-img').src = BACKDROP_PATH + movie.backdrop_path;
            document.getElementById('hero-title').innerText = movie.title;
            document.getElementById('hero-desc').innerText = movie.overview;
            document.getElementById('hero-details-btn').onclick = () => openModal(movie.id);
        }
    } catch (error) {
        console.error('Hero setup failed:', error);
    }
}

/**
 * UI RENDERING
 */
function renderMovies(movies) {
    movieGrid.innerHTML = '';

    if (movies.length === 0) {
        movieGrid.innerHTML = `<p class="text-center col-span-full py-10 text-lightGray text-xl">No movies found for "${currentSearchQuery}"</p>`;
        return;
    }

    movies.forEach(movie => {
        if (!movie.poster_path) return; // Skip movies without posters

        const isWatchlisted = watchlist.some(m => m.id === movie.id);
        const card = document.createElement('div');
        card.className = 'movie-card group cursor-pointer relative';
        card.innerHTML = `
            <div class="relative overflow-hidden rounded-xl shadow-lg aspect-[2/3]">
                <img src="${IMG_PATH + movie.poster_path}" alt="${movie.title}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <button class="watchlist-btn-quick absolute top-3 right-3 p-2 bg-darkBg/80 rounded-full hover:bg-netflixRed transition transform hover:scale-110" data-id="${movie.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ${isWatchlisted ? 'fill-netflixRed text-netflixRed' : 'text-white'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </button>
                    <span class="text-xs font-bold bg-netflixRed px-2 py-1 rounded w-fit mb-2">${movie.vote_average.toFixed(1)}</span>
                    <h3 class="font-bold text-white leading-tight mb-1 truncate">${movie.title}</h3>
                    <p class="text-lightGray text-xs">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</p>
                </div>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.closest('.watchlist-btn-quick')) {
                e.stopPropagation();
                toggleWatchlist(movie);
                return;
            }
            openModal(movie.id);
        });

        movieGrid.appendChild(card);
    });
}

function renderModal(movie) {
    const isWatchlisted = watchlist.some(m => m.id === movie.id);
    const directors = movie.credits.crew.filter(c => c.job === 'Director').map(d => d.name).join(', ');
    const cast = movie.credits.cast.slice(0, 5).map(a => a.name).join(', ');
    const genres = movie.genres.map(g => g.name).join(', ');

    modalContent.innerHTML = `
        <div class="md:w-1/3 p-0 md:p-0 overflow-hidden">
            <img src="${IMG_PATH + movie.poster_path}" alt="${movie.title}" class="w-full h-full object-cover rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
        </div>
        <div class="md:w-2/3 p-8 flex flex-col justify-center">
            <div class="flex flex-wrap gap-2 mb-4">
                <span class="bg-netflixRed text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Movie</span>
                <span class="bg-white/10 text-lightGray text-xs font-bold px-2 py-1 rounded capitalize">${movie.status}</span>
            </div>
            <h2 class="text-4xl font-extrabold mb-2">${movie.title}</h2>
            <div class="flex items-center gap-4 text-sm mb-6 text-lightGray">
                <span class="flex items-center gap-1 text-yellow-500 font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    ${movie.vote_average.toFixed(1)}
                </span>
                <span>${movie.release_date.split('-')[0]}</span>
                <span>${movie.runtime} min</span>
            </div>
            
            <p class="text-lg leading-relaxed mb-6 text-gray-200 italic">"${movie.tagline || ''}"</p>
            <p class="text-lightGray mb-8 leading-loose">${movie.overview}</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-sm border-t border-white/10 pt-6">
                <div>
                    <p class="text-white/40 mb-1">Starring</p>
                    <p>${cast}</p>
                </div>
                <div>
                    <p class="text-white/40 mb-1">Director</p>
                    <p>${directors}</p>
                </div>
                <div>
                    <p class="text-white/40 mb-1">Genre</p>
                    <p>${genres}</p>
                </div>
            </div>

            <div class="flex flex-wrap gap-4 mt-auto">
                <button class="watchlist-toggle-modal flex items-center gap-2 bg-netflixRed hover:bg-netflixRed/80 text-white px-8 py-3 rounded-md font-bold transition transform active:scale-95" data-id="${movie.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ${isWatchlisted ? 'fill-white' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <span>${isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}</span>
                </button>
            </div>
        </div>
    `;

    // Hook up modal watchlist button
    const modalWatchlistBtn = modalContent.querySelector('.watchlist-toggle-modal');
    modalWatchlistBtn.onclick = () => {
        toggleWatchlist(movie);
        renderModal(movie); // Re-render modal UI to update button state
    };
}

/**
 * ACTIONS
 */
function toggleWatchlist(movie) {
    const index = watchlist.findIndex(m => m.id === movie.id);
    if (index === -1) {
        watchlist.push(movie);
    } else {
        watchlist.splice(index, 1);
    }
    localStorage.setItem('cinevault_watchlist', JSON.stringify(watchlist));

    // Refresh current view if we're in watchlist mode
    if (currentView === 'watchlist') {
        renderWatchlist();
    } else {
        // Just refresh the grid to update the icon states
        updateGridUI();
    }
}

function updateGridUI() {
    // This is a simple way to refresh icons without re-fetching
    const cards = document.querySelectorAll('.movie-card');
    cards.forEach(card => {
        const id = parseInt(card.querySelector('.watchlist-btn-quick').dataset.id);
        const isWatchlisted = watchlist.some(m => m.id === id);
        const svg = card.querySelector('svg');
        if (isWatchlisted) {
            svg.classList.add('fill-netflixRed', 'text-netflixRed');
        } else {
            svg.classList.remove('fill-netflixRed', 'text-netflixRed');
        }
    });
}

function renderWatchlist() {
    currentView = 'watchlist';
    heroSection.classList.add('hidden');
    sectionTitle.innerHTML = `<span class="w-1.5 h-8 bg-netflixRed rounded-full"></span> My Private Vault`;

    if (watchlist.length === 0) {
        movieGrid.innerHTML = '';
        watchlistEmpty.classList.remove('hidden');
    } else {
        watchlistEmpty.classList.add('hidden');
        renderMovies(watchlist);
    }
}

function showLoader() {
    movieGrid.innerHTML = `
        <div class="col-span-full flex justify-center items-center py-20">
            <div class="loader"></div>
        </div>
    `;
}

/**
 * NAVIGATION & SEARCH
 */
searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    currentSearchQuery = query;

    if (query.trim() === '') {
        if (currentView === 'home') {
            heroSection.classList.remove('hidden');
            sectionTitle.innerHTML = `<span class="w-1.5 h-8 bg-netflixRed rounded-full"></span> Popular Movies`;
            fetchMovies('/movie/popular');
        } else {
            renderWatchlist();
        }
        return;
    }

    heroSection.classList.add('hidden');
    sectionTitle.innerHTML = `<span class="w-1.5 h-8 bg-netflixRed rounded-full"></span> Search Results for "${query}"`;
    fetchMovies('/search/movie', query);
});

navHome.onclick = () => {
    currentView = 'home';
    searchInput.value = ''; // Clear search
    currentSearchQuery = '';
    navHome.classList.add('text-white');
    navHome.classList.remove('text-lightGray');
    navWatchlist.classList.remove('text-white');
    navWatchlist.classList.add('text-lightGray');
    heroSection.classList.remove('hidden');
    sectionTitle.innerHTML = `<span class="w-1.5 h-8 bg-netflixRed rounded-full"></span> Popular Movies`;
    watchlistEmpty.classList.add('hidden');
    fetchMovies('/movie/popular');
};

navWatchlist.onclick = () => {
    currentView = 'watchlist';
    navWatchlist.classList.add('text-white');
    navWatchlist.classList.remove('text-lightGray');
    navHome.classList.remove('text-white');
    navHome.classList.add('text-lightGray');
    renderWatchlist();
};

logoBtn.onclick = () => navHome.onclick();
backHomeBtn.onclick = () => navHome.onclick();

/**
 * MODAL HANDLERS
 */
function openModal(id) {
    fetchMovieDetails(id);
    movieModal.classList.add('modal-show');
    document.body.style.overflow = 'hidden'; // Prevent scroll
}

closeModal.onclick = () => {
    movieModal.classList.remove('modal-show');
    document.body.style.overflow = 'auto';
};

window.onclick = (e) => {
    if (e.target === movieModal) {
        closeModal.onclick();
    }
};
