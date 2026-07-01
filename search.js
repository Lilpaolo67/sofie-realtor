/* ═══════════════════════════════════════════════════
   SOFIE REALTOR — Map Search Script (Leaflet.js)
   ═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // Navbar hamburger mobile toggle
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
    });
  }

  /* ── 1. GOOGLE SHEET DATABASE CONFIGURATION ── */
  const spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/1U6lntxYnBabrKq-xWEpc800TVUg0fWHc-YkDywWqMtY/export?format=csv';

  // Fallback properties in case Google Sheet is empty or fails to load
  const fallbackProperties = [
    {
      id: 1,
      type: 'house',
      title: 'Modern Villa in Banawa Heights',
      location: 'Banawa, Cebu City',
      price: 12500000,
      priceLabel: '₱12.5M',
      beds: 4,
      baths: 3,
      size: 350,
      lat: 10.3122,
      lng: 123.8889,
      image: 'images/property_house.jpg'
    },
    {
      id: 2,
      type: 'condo',
      title: 'Sky Suite at Cebu IT Park',
      location: 'Cebu IT Park, Lahug',
      price: 6800000,
      priceLabel: '₱6.8M',
      beds: 2,
      baths: 2,
      size: 88,
      lat: 10.3278,
      lng: 123.9061,
      image: 'images/property_condo.jpg'
    },
    {
      id: 3,
      type: 'commercial',
      title: 'Prime Office Space, Mandaue',
      location: 'A.S. Fortuna, Mandaue City',
      price: 9200000,
      priceLabel: '₱9.2M',
      beds: 'Office',
      baths: 'Parking',
      size: 220,
      lat: 10.3444,
      lng: 123.9214,
      image: 'images/property_commercial.jpg'
    },
    {
      id: 4,
      type: 'condo',
      title: 'Luxury Newton Beach condo',
      location: 'Mactan Newtown, Lapu-Lapu',
      price: 18500000,
      priceLabel: '₱18.5M',
      beds: 3,
      baths: 3,
      size: 150,
      lat: 10.3115,
      lng: 124.0194,
      image: 'images/property_condo.jpg'
    },
    {
      id: 5,
      type: 'house',
      title: 'Premium Townhouse in Lahug',
      location: 'Lahug, Cebu City',
      price: 7900000,
      priceLabel: '₱7.9M',
      beds: 3,
      baths: 3,
      size: 180,
      lat: 10.3320,
      lng: 123.8988,
      image: 'images/property_house.jpg'
    }
  ];

  // Cebu neighborhood coordinates dictionary for auto-geocoding
  const locationCoordinates = {
    'banawa': [10.3122, 123.8889],
    'lahug': [10.3278, 123.9061],
    'it park': [10.3278, 123.9061],
    'mandaue': [10.3444, 123.9214],
    'mactan': [10.3115, 124.0194],
    'lapu-lapu': [10.3115, 124.0194],
    'talamban': [10.3708, 123.9172],
    'guadalupe': [10.3150, 123.8850],
    'busay': [10.3667, 123.8833],
    'liloan': [10.4000, 124.0000],
    'consolacion': [10.3833, 123.9667],
    'talisay': [10.2500, 123.8333]
  };

  // Robust CSV Parser
  function parseCSV(text) {
    if (!text || text.trim() === '') return [];
    
    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i+1];

      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',') {
        if (inQuotes) {
          row[row.length - 1] += ',';
        } else {
          row.push('');
        }
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && next === '\n') {
          i++; // skip \n
        }
        if (inQuotes) {
          row[row.length - 1] += '\n';
        } else {
          lines.push(row);
          row = [''];
        }
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }

    if (lines.length < 2) return [];

    const headers = lines[0].map(h => h.trim().toLowerCase());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i];
      if (values.length < headers.length) continue;
      
      const item = {};
      headers.forEach((header, index) => {
        let val = values[index] ? values[index].trim() : '';
        if (['id', 'lat', 'lng', 'beds', 'baths', 'area'].includes(header)) {
          const num = parseFloat(val);
          item[header] = isNaN(num) ? val : num;
        } else if (header === 'price') {
          const cleanPrice = parseFloat(val.replace(/[^\d.]/g, ''));
          item[header] = isNaN(cleanPrice) ? 0 : cleanPrice;
          item.priceLabel = val;
        } else {
          item[header] = val;
        }
      });

      // Simple validation: only id and title are strictly required
      if (item.id && item.title) {
        // 1. Auto-format priceLabel if missing or empty
        if (!item.priceLabel && item.price) {
          const priceNum = parseFloat(item.price);
          if (priceNum >= 1000000) {
            item.priceLabel = `₱${(priceNum / 1000000).toFixed(1).replace('.0', '')}M`;
          } else {
            item.priceLabel = `₱${(priceNum / 1000).toFixed(0)}K`;
          }
        } else if (!item.priceLabel) {
          item.priceLabel = 'Contact';
        }

        // 2. Resolve GPS coordinates if lat/lng are missing or empty
        let lat = parseFloat(item.lat);
        let lng = parseFloat(item.lng);
        
        if (isNaN(lat) || isNaN(lng) || !lat || !lng) {
          const locLower = item.location ? item.location.toLowerCase() : '';
          let found = false;
          
          for (const [key, coords] of Object.entries(locationCoordinates)) {
            if (locLower.includes(key)) {
              lat = coords[0];
              lng = coords[1];
              found = true;
              break;
            }
          }
          
          if (!found) {
            lat = 10.3157; // Cebu City center fallback
            lng = 123.8854;
          }
          
          // Add random jitter to prevent stacked pins overlapping
          lat += (Math.random() - 0.5) * 0.008;
          lng += (Math.random() - 0.5) * 0.008;
          
          item.lat = lat;
          item.lng = lng;
        }

        // 3. Fallback standard image if empty
        if (!item.image) {
          const typeLower = item.type ? item.type.toLowerCase().trim() : '';
          item.image = typeLower.includes('condo') ? 'images/property_condo.jpg' : 
                       typeLower.includes('commercial') ? 'images/property_commercial.jpg' : 
                       'images/property_house.jpg';
        }
        data.push(item);
      }
    }
    return data;
  }

  /* ── 2. INITIALIZE MAP (Centered in Metro Cebu) ── */
  const map = L.map('map', {
    center: [10.3157, 123.8854], // Cebu City coordinates
    zoom: 13,
    zoomControl: false // position it manually
  });

  // Position Zoom control at bottom right
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Add clean light-themed map layer permanently for readability
  const lightTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  const markerGroup = L.layerGroup().addTo(map);
  let activeMarkers = {}; // stores references to pins by property ID

  /* ── 3. RENDER CARD LISTINGS ── */
  const listingsList = document.getElementById('listingsList');
  const countNum      = document.getElementById('countNum');

  function renderListings(properties) {
    listingsList.innerHTML = '';
    countNum.textContent = properties.length;

    if (properties.length === 0) {
      listingsList.innerHTML = `
        <div style="text-align:center; padding:40px 20px; color:rgba(255,255,255,0.4)">
          <p style="font-size:1.5rem; font-family:var(--font-serif); margin-bottom:8px">No listings found</p>
          <p style="font-size:0.8rem">Try widening your filters or location search.</p>
        </div>
      `;
      return;
    }

    const redPinSvg = `<svg viewBox="0 0 24 24" fill="#A31515" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px; position:relative; top:-1px;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;

    properties.forEach(prop => {
      const card = document.createElement('article');
      card.className = 'listing-card';
      card.id = `card-${prop.id}`;
      card.innerHTML = `
        <div class="listing-img-wrap" style="height:150px">
          <img src="${prop.image}" alt="${prop.title}" class="listing-img" />
          <div class="listing-badge listing-badge--new">${prop.type}</div>
        </div>
        <div class="listing-info" style="padding:16px">
          <h3 class="listing-title" style="font-size:1.15rem">${prop.title}</h3>
          <p class="listing-location" style="margin-bottom:8px">${redPinSvg} ${prop.location}</p>
          <div class="listing-details" style="margin-bottom:12px; padding-bottom:12px">
            <span>🛏 ${prop.beds} Beds</span>
            <span>🛁 ${prop.baths}</span>
            <span>📐 ${prop.size} sqm</span>
          </div>
          <div class="listing-footer">
            <span class="listing-price" style="font-size:1.15rem">₱ ${prop.price.toLocaleString()}</span>
            <span class="listing-cta" style="font-size:0.68rem">View Map</span>
          </div>
        </div>
      `;

      // Click card to center map on the pin
      card.addEventListener('click', () => {
        // Highlight active card
        document.querySelectorAll('.listing-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        // Focus map
        map.setView([prop.lat, prop.lng], 15);

        // Open popup automatically
        if (activeMarkers[prop.id]) {
          activeMarkers[prop.id].openPopup();
        }

        // On mobile, automatically show the map panel when a listing is clicked
        if (window.innerWidth < 768) {
          const container = document.querySelector('.search-container');
          container.classList.add('map-active');
          document.getElementById('viewToggleBtn').innerHTML = '<span class="toggle-icon">📋</span> Show List';
        }
      });

      listingsList.appendChild(card);
    });
  }

  /* ── 4. DRAW MAP PINS ── */
  function renderMarkers(properties) {
    markerGroup.clearLayers(); // clear old pins
    activeMarkers = {};

    properties.forEach(prop => {
      // Custom HTML pin displaying the price
      const priceIcon = L.divIcon({
        className: 'price-marker-html',
        html: `<div class="price-marker-pin" id="pin-${prop.id}">${prop.priceLabel}</div>`,
        iconSize: [60, 24],
        iconAnchor: [30, 12]
      });

      // Create marker with popup
      const marker = L.marker([prop.lat, prop.lng], { icon: priceIcon })
        .bindPopup(`
          <div class="map-popup-card">
            <img src="${prop.image}" alt="${prop.title}" class="map-popup-img" />
            <h4 class="map-popup-title">${prop.title}</h4>
            <span class="map-popup-price">₱ ${prop.price.toLocaleString()}</span>
            <a href="index.html#contact" class="btn btn-gold btn-sm" style="width:100%; text-align:center; padding:6px; font-size:0.6rem; margin-top:4px">Book viewing</a>
          </div>
        `)
        .addTo(markerGroup);

      activeMarkers[prop.id] = marker;

      // Click pin to highlight corresponding card on the sidebar
      marker.on('click', () => {
        // Highlight active card
        document.querySelectorAll('.listing-card').forEach(c => c.classList.remove('active'));
        const card = document.getElementById(`card-${prop.id}`);
        if (card) {
          card.classList.add('active');
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });

    // Auto-adjust map view to fit all pins
    if (properties.length > 0) {
      const bounds = L.latLngBounds(properties.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }

  /* ── 5. FILTER LOGIC ── */
  const keywordFilter = document.getElementById('searchKeyword');
  const typeFilter = document.getElementById('propertyType');
  const priceFilter = document.getElementById('priceRange');

  function runFilters() {
    const searchVal = keywordFilter ? keywordFilter.value.toLowerCase().trim() : '';
    const selectedType = typeFilter.value;
    const selectedPrice = priceFilter.value;

    const filtered = cebuProperties.filter(prop => {
      // Keyword Match (checks title, location, description, type)
      let matchesKeyword = true;
      if (searchVal !== '') {
        const title = prop.title ? prop.title.toLowerCase() : '';
        const loc = prop.location ? prop.location.toLowerCase() : '';
        const desc = prop.description ? prop.description.toLowerCase() : '';
        const type = prop.type ? prop.type.toLowerCase() : '';
        
        matchesKeyword = title.includes(searchVal) || 
                         loc.includes(searchVal) || 
                         desc.includes(searchVal) || 
                         type.includes(searchVal);
      }

      // Type Match (handles variations like Condominium -> condo)
      let propType = prop.type ? prop.type.toLowerCase().trim() : '';
      let matchesType = false;
      if (selectedType === 'all') {
        matchesType = true;
      } else if (selectedType === 'house' && (propType.includes('house') || propType.includes('villa') || propType.includes('townhouse'))) {
        matchesType = true;
      } else if (selectedType === 'condo' && (propType.includes('condo') || propType.includes('suite'))) {
        matchesType = true;
      } else if (selectedType === 'commercial' && (propType.includes('commercial') || propType.includes('office') || propType.includes('retail'))) {
        matchesType = true;
      }

      // Price Match
      const matchesPrice = (selectedPrice === 'all' || prop.price <= parseInt(selectedPrice, 10));

      return matchesKeyword && matchesType && matchesPrice;
    });

    renderListings(filtered);
    renderMarkers(filtered);
  }

  if (keywordFilter) {
    keywordFilter.addEventListener('input', runFilters);
  }
  typeFilter.addEventListener('change', runFilters);
  priceFilter.addEventListener('change', runFilters);

  /* ── 6. MOBILE PANEL VIEW TOGGLE ── */
  const toggleBtn = document.getElementById('viewToggleBtn');
  const container = document.querySelector('.search-container');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isMapActive = container.classList.toggle('map-active');
      if (isMapActive) {
        toggleBtn.innerHTML = '<span class="toggle-icon">📋</span> Show List';
        // force leaflet map to recalculate size since it was hidden
        setTimeout(() => map.invalidateSize(), 300);
      } else {
        toggleBtn.innerHTML = '<span class="toggle-icon">🗺️</span> Show Map';
      }
    });
  }

  /* ── 7. LIGHT/DARK THEME TOGGLE ── */
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      themeToggle.textContent = '🌙';
    }

    themeToggle.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light-theme');
      themeToggle.textContent = isLight ? '🌙' : '☀️';
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
  }

  // Fetch from Google Sheet
  fetch(spreadsheetUrl)
    .then(response => response.text())
    .then(csvText => {
      const parsed = parseCSV(csvText);
      if (parsed && parsed.length > 0) {
        cebuProperties = parsed;
        console.log('Listings loaded from Google Sheet:', cebuProperties.length);
      } else {
        console.warn('Google Sheet empty or invalid headers. Using fallback data.');
        cebuProperties = fallbackProperties;
      }
      initApp();
    })
    .catch(error => {
      console.error('Error fetching Google Sheet:', error);
      cebuProperties = fallbackProperties;
      initApp();
    });

  function initApp() {
    renderListings(cebuProperties);
    renderMarkers(cebuProperties);

    // Auto-focus property from URL query ?id=X
    const urlParams = new URLSearchParams(window.location.search);
    const propId = parseInt(urlParams.get('id'), 10);
    if (propId) {
      setTimeout(() => {
        const card = document.getElementById(`card-${propId}`);
        if (card) {
          card.click();
        }
      }, 450); // Wait for Leaflet maps to initialize
    }
  }
});
