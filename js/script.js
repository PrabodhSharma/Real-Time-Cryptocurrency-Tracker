// CoinGecko API configuration
const API_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true';
const API_KEY = 'CG-SkM4V5d7AoTh2dM5zGJP3duw';

// State management
let cryptoData = [];
let filteredCryptoData = [];
let comparedCryptos = [];

// DOM Elements
const cryptoList = document.getElementById('crypto-list');
const comparisonSection = document.getElementById('comparison-section');
const sortSelect = document.getElementById('sort-select');
const searchInput = document.getElementById('search-input');

// Fetch cryptocurrency data
async function fetchCryptoData() {
    try {
        const response = await fetch(API_URL, {
            headers: {
                'x-cg-pro-api-key': API_KEY
            }
        });
        cryptoData = await response.json();
        filteredCryptoData = [...cryptoData];
        renderCryptoList();
    } catch (error) {
        console.error('Error fetching crypto data:', error);
        alert('Failed to fetch cryptocurrency data. Please try again later.');
    }
}

// Search cryptocurrencies
function searchCryptos() {
    const searchTerm = searchInput.value.toLowerCase();
    filteredCryptoData = cryptoData.filter(crypto => 
        crypto.name.toLowerCase().includes(searchTerm) || 
        crypto.symbol.toLowerCase().includes(searchTerm)
    );
    renderCryptoList();
}

// Sort cryptocurrencies
function sortCryptos(method) {
    filteredCryptoData.sort((a, b) => {
        switch(method) {
            case 'market_cap_desc': return b.market_cap - a.market_cap;
            case 'market_cap_asc': return a.market_cap - b.market_cap;
            case 'price_asc': return a.current_price - b.current_price;
            case 'price_desc': return b.current_price - a.current_price;
            case 'change_asc': return a.price_change_percentage_24h - b.price_change_percentage_24h;
            case 'change_desc': return b.price_change_percentage_24h - a.price_change_percentage_24h;
        }
    });
    renderCryptoList();
}

// Create Sparkline Chart
function createSparkline(sparklineData) {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 30;
    canvas.className = 'trend-chart';
    
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = sparklineData[0] <= sparklineData[sparklineData.length - 1] ? '#4CAF50' : '#F44336';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    sparklineData.forEach((price, index) => {
        const x = (index / (sparklineData.length - 1)) * 100;
        const y = 30 - ((price - Math.min(...sparklineData)) / (Math.max(...sparklineData) - Math.min(...sparklineData))) * 30;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    
    return canvas;
}

// Render crypto list
function renderCryptoList() {
    cryptoList.innerHTML = '';
    filteredCryptoData.forEach((crypto, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td class="crypto-name">
                <img src="${crypto.image}" class="crypto-logo" alt="${crypto.name}">
                <div>
                    <strong>${crypto.name}</strong>
                    <br>
                    <small>${crypto.symbol.toUpperCase()}</small>
                </div>
            </td>
            <td>$${crypto.current_price.toLocaleString()}</td>
            <td class="${crypto.price_change_percentage_24h >= 0 ? 'positive-change' : 'negative-change'}">
                ${crypto.price_change_percentage_24h.toFixed(2)}%
            </td>
            <td class="trend-cell"></td>
            <td>$${(crypto.market_cap / 1000000).toFixed(2)}M</td>
            <td>
                <button class="compare-btn" data-id="${crypto.id}">Compare</button>
            </td>
        `;

        // Append sparkline
        const trendCell = row.querySelector('.trend-cell');
        if (crypto.sparkline_in_7d && crypto.sparkline_in_7d.price) {
            trendCell.appendChild(createSparkline(crypto.sparkline_in_7d.price));
        }

        cryptoList.appendChild(row);
    });

    // Add event listeners
    document.querySelectorAll('.compare-btn').forEach(btn => {
        btn.addEventListener('click', addToComparison);
    });
}

// Add to comparison
function addToComparison(event) {
    const cryptoId = event.target.dataset.id;
    const crypto = cryptoData.find(c => c.id === cryptoId);

    if (comparedCryptos.length < 5 && !comparedCryptos.some(c => c.id === cryptoId)) {
        comparedCryptos.push(crypto);
        renderComparisonSection();
    } else {
        alert('Maximum 5 cryptocurrencies can be compared or cryptocurrency already added.');
    }
}

// Render comparison section
function renderComparisonSection() {
    comparisonSection.style.display = comparedCryptos.length > 0 ? 'flex' : 'none';
    comparisonSection.innerHTML = comparedCryptos.map(crypto => `
        <div class="comparison-crypto">
            <button class="remove-comparison" data-id="${crypto.id}">✕</button>
            <img src="${crypto.image}" class="crypto-logo" alt="${crypto.name}">
            <h3>${crypto.symbol.toUpperCase()}</h3>
            <p>$${crypto.current_price.toLocaleString()}</p>
            <p class="${crypto.price_change_percentage_24h >= 0 ? 'positive-change' : 'negative-change'}">
                ${crypto.price_change_percentage_24h.toFixed(2)}%
            </p>
        </div>
    `).join('');

    // Add remove comparison listeners
    document.querySelectorAll('.remove-comparison').forEach(btn => {
        btn.addEventListener('click', removeFromComparison);
    });
}

// Remove from comparison
function removeFromComparison(event) {
    const cryptoId = event.target.dataset.id;
    comparedCryptos = comparedCryptos.filter(c => c.id !== cryptoId);
    renderComparisonSection();
}

// Event Listeners
searchInput.addEventListener('input', searchCryptos);

sortSelect.addEventListener('change', (e) => {
    sortCryptos(e.target.value);
});

// Initial data fetch
fetchCryptoData();