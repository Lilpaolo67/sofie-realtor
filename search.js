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

  /* ── 1. PROPERTY MOCK DATA WITH GPS COORDINATES (CEBU) ── */
  const cebuProperties = [
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
      image: 'images/property_house.png'
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
      image: 'images/property_condo.png'
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
      image: 'images/property_commercial.png'
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
      image: 'images/property_condo.png'
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
      image: 'images/property_house.png'
    }
  ];

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
  const activeMarkers = {}; // stores references to pins by property ID

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
  const typeFilter = document.getElementById('propertyType');
  const priceFilter = document.getElementById('priceRange');

  function runFilters() {
    const selectedType = typeFilter.value;
    const selectedPrice = priceFilter.value;

    const filtered = cebuProperties.filter(prop => {
      // Type Match
      const matchesType = (selectedType === 'all' || prop.type === selectedType);
      // Price Match
      const matchesPrice = (selectedPrice === 'all' || prop.price <= parseInt(selectedPrice, 10));

      return matchesType && matchesPrice;
    });

    renderListings(filtered);
    renderMarkers(filtered);
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

  // Run initial render
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
    }, 400); // Wait for Leaflet maps to initialize
  }
});
