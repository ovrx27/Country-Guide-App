// --- STATE MANAGEMENT ---
// Using localStorage to remember registered users and current session
const STORAGE_KEY_USERS = 'global_explorer_users';
const STORAGE_KEY_SESSION = 'global_explorer_current_user';

// --- DOM ELEMENTS ---
const toSignupSpan = document.getElementById('to-signup');
const toSigninSpan = document.getElementById('to-signin');
const signinCard = document.getElementById('signin-card');
const signupCard = document.getElementById('signup-card');

const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');

const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const welcomeUserText = document.getElementById('welcome-user');
const logoutBtn = document.getElementById('logout-btn');

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const countryResult = document.getElementById('country-result');
const errorMessage = document.getElementById('error-message');

// --- AUTHENTICATION FLOW TOGGLES ---
toSignupSpan.addEventListener('click', () => {
    signinCard.classList.add('hidden');
    signupCard.classList.remove('hidden');
});

toSigninSpan.addEventListener('click', () => {
    signupCard.classList.add('hidden');
    signinCard.classList.remove('hidden');
});

// Helper functions for state
function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_USERS)) || [];
}

// Sign Up Handler
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    if (password.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
    }

    const users = getUsers();
    if (users.some(u => u.email === email)) {
        alert('An account with this email already exists.');
        return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

    alert('Account created successfully! Please Sign In.');
    signupForm.reset();
    toSigninSpan.click(); // Redirect to sign in card
});

// Sign In Handler
signinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;

    const users = getUsers();
    const validUser = users.find(u => u.email === email && u.password === password);

    if (!validUser) {
        alert('Invalid email or password.');
        return;
    }

    // Set Session
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(validUser));
    signinForm.reset();
    checkSession();
});

// Log out Handler
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY_SESSION);
    countryResult.innerHTML = '';
    countryResult.classList.add('hidden');
    searchInput.value = '';
    checkSession();
});

// Route / View Guard
function checkSession() {
    const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEY_SESSION));
    if (currentUser) {
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        welcomeUserText.textContent = `Welcome, ${currentUser.name}`;
    } else {
        appContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');
    }
}

// --- COUNTRY GUIDE LOGIC (API INTEGRATION) ---
async function fetchCountryData() {
    const countryName = searchInput.value.trim();
    if (!countryName) return;

    errorMessage.classList.add('hidden');
    countryResult.classList.add('hidden');

    try {
        // Fetching data from the public RestCountries API
        const response = await fetch(`https://restcountries.com{encodeURIComponent(countryName)}`);
        
        if (!response.ok) {
            throw new Error('Country not found. Try checking the spelling.');
        }

        const data = await response.json();
        const country = data[0]; // Take the primary match

        // Extract complex parameters gracefully
        const languages = Object.values(country.languages || {}).join(', ') || 'N/A';
        const currencies = Object.values(country.currencies || {})
            .map(c => `${c.name} (${c.symbol || ''})`).join(', ') || 'N/A';
        const population = country.population.toLocaleString();
        const region = `${country.region} (${country.subregion || ''})`;

        // Inject data into layout
        countryResult.innerHTML = `
            <div class="country-card">
                <div class="country-flag">
                    <img src="${country.flags.svg}" alt="Flag of ${country.name.common}">
                </div>
                <div class="country-details">
                    <h2>${country.name.common}</h2>
                    <div class="info-item"><strong>Official Name:</strong> ${country.name.official}</div>
                    <div class="info-item"><strong>Capital:</strong> ${country.capital ? country.capital[0] : 'N/A'}</div>
                    <div class="info-item"><strong>Region:</strong> ${region}</div>
                    <div class="info-item"><strong>Population:</strong> ${population}</div>
                    <div class="info-item"><strong>Languages:</strong> ${languages}</div>
                    <div class="info-item"><strong>Currency:</strong> ${currencies}</div>
                </div>
            </div>
        `;
        countryResult.classList.remove('hidden');

    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.classList.remove('hidden');
    }
}

// Search triggers
searchBtn.addEventListener('click', fetchCountryData);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'key' || e.key === 'Enter') {
        fetchCountryData();
    }
});

// Run session check on load
window.addEventListener('DOMContentLoaded', checkSession);
