/**
 * =========================================================================
 * NF SMART TECH - USER PANEL SCRIPT (Min.js)
 * Sequence: 1. Telegram Notification (First) -> 2. Admin Panel / Firebase Save
 * =========================================================================
 */

// =========================================================================
// 🚨 ১. আপনার টেলিগ্রাম বট টোকেন ও চ্যাট আইডি এখানে সরাসরি বসিয়ে দিন:
// (কোটেশন "" এর ভেতরে আপনার বট টোকেন এবং চ্যাট আইডি পেস্ট করুন)
// =========================================================================
const DIRECT_TELEGRAM_CONFIG = {
  botToken: "8645892108:AAGgjImkXpt0ZiayfRZhGN1ckLzX2Ujk4V4",
  chatId: "8115404430",
  enabled: true
};

// ২. FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyDEL4Ztcm_C1frGm1NKKrbL-HAwS3j2J8I",
  authDomain: "nr-world-34259.firebaseapp.com",
  databaseURL: "https://nr-world-34259-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nr-world-34259",
  storageBucket: "nr-world-34259.firebasestorage.app",
  messagingSenderId: "995564906610",
  appId: "1:995564906610:web:476af48d626feb31243aeb"
};

// ৩. INITIALIZE FIREBASE SDK
let db = null;
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.database();
} catch (err) {
  console.error("Firebase init failed:", err);
}

// ৪. APPLICATION STATE
const AppState = {
  products: {},
  categories: {},
  banners: {},
  coupons: {},
  deliveryRules: { insideDhaka: 60, outsideDhaka: 120, freeDeliveryThreshold: 0 },
  telegramSettings: {},
  settings: {},
  policies: {},
  cart: [],
  activeFilterCatId: 'all',
  appliedCoupon: null
};

// জেলা ও থানার ডেটা
const districtsData = {
  "ঢাকা": ["ধানমন্ডি", "উত্তরা", "মিরপুর", "গুলশান", "তেজগাঁও", "রামপুরা", "সাভার", "কেরানীগঞ্জ", "ডেমরা", "ওয়ারী", "মতিঝিল", "মোহাম্মদপুর", "বাড্ডা"],
  "কুমিল্লা": ["কুমিল্লা সদর", "লাকসাম", "চৌদ্দগ্রাম", "ব্রাহ্মণপাড়া", "বুড়িচং", "চান্দিনা", "মুরাদনগর", "হোমনা", "দেবীদ্বার"],
  "চট্টগ্রাম": ["কোতোয়ালি", "পাহাড়তলী", "পাঁচলাইশ", "ডবলমুরিং", "হালিশহর", "সীতাকুণ্ড", "বোয়ালখালী", "রাউজান", "ফটিকছড়ি"],
  "সিলেট": ["সিলেট সদর", "দক্ষিণ সুরমা", "জকিগঞ্জ", "গোলাপগঞ্জ", "বিয়ানীবাজার", "কানাইঘাট", "বালাগঞ্জ"],
  "রাজশাহী": ["বোয়ালিয়া", "রাজপাড়া", "মতিহার", "শাহ মখদুম", "পবা", "চারঘাট", "বাঘা", "গোদাগাড়ী"],
  "খুলনা": ["সোনাডাঙ্গা", "খালিশপুর", "দৌলতপুর", "কোতোয়ালি", "বটিয়াঘাট", "ডুমুরিয়া", "রূপসা"],
  "বরিশাল": ["বরিশাল সদর", "বাবুগঞ্জ", "উজিরপুর", "মেহেন্দিগঞ্জ", "বাকেরগঞ্জ", "গৌরনদী"],
  "রংপুর": ["রংপুর সদর", "মির্জাগঞ্জ", "পীরগঞ্জ", "বদরগঞ্জ", "তারাগঞ্জ", "গঙ্গাচড়া"],
  "গাজীপুর": ["গাজীপুর সদর", "কালিয়াকৈর", "কাপাসিয়া", "শ্রীপুর", "কালীগঞ্জ", "টঙ্গী"],
  "নারায়ণগঞ্জ": ["নারায়ণগঞ্জ সদর", "বন্দর", "আড়াইহাজার", "সোনারগাঁ", "রূপগঞ্জ"],
  "বগুড়া": ["বগুড়া সদর", "শিবগঞ্জ", "শেরপুর", "ধুনট", "গাবতলী"],
  "ময়মনসিংহ": ["ময়মনসিংহ সদর", "মুক্তাগাছা", "ফুলবাড়িয়া", "ত্রিশাল", "ভালুকা"]
};

function getThanasForDistrict(distName) {
  return districtsData[distName] || ["সদর থানা"];
}

// ৫. FIREBASE REALTIME LISTENERS
function initFirebaseListeners() {
  if (!db) {
    showToast("ডাটাবেজ সংযোগ পাওয়া যায়নি!", "error");
    return;
  }

  // ক্যাটাগরি
  db.ref("categories").on("value", snapshot => {
    AppState.categories = snapshot.val() || {};
    renderCategoryBar();
    renderSideMenuCategories();
  });

  // প্রোডাক্টস
  db.ref("products").on("value", snapshot => {
    AppState.products = snapshot.val() || {};
    renderHomeProducts();
    if (document.getElementById('allProductsContainer').style.display === 'block') {
      filterCategory(AppState.activeFilterCatId);
    }
  });

  // ব্যানার
  db.ref("banners").on("value", snapshot => {
    AppState.banners = snapshot.val() || {};
    renderBanners();
  });

  // ডেলিভারি চার্জ
  db.ref("deliveryRules").on("value", snapshot => {
    const val = snapshot.val();
    if (val) {
      AppState.deliveryRules = {
        insideDhaka: Number(val.insideDhaka) || 60,
        outsideDhaka: Number(val.outsideDhaka) || 120,
        freeDeliveryThreshold: Number(val.freeDeliveryThreshold) || 0
      };
    }
    if (document.getElementById('checkoutSummaryBox')) {
      recalculateCheckoutTotals();
    }
  });

  // কুপন
  db.ref("coupons").on("value", snapshot => {
    AppState.coupons = snapshot.val() || {};
  });

  // টেলিগ্রাম সেটিংস (ফায়ারবেস ব্যাকআপ)
  db.ref("telegramSettings").on("value", snapshot => {
    AppState.telegramSettings = snapshot.val() || {};
  });

  // সাধারণ সেটিংস ও ফুটার ডেটা
  db.ref("settings").on("value", snapshot => {
    AppState.settings = snapshot.val() || {};
    applyGeneralSettings();
  });

  // মারকিউ নোটিশ বার
  db.ref("notices/general").on("value", snapshot => {
    const notice = snapshot.val();
    const bar = document.getElementById("announcementBar");
    const txt = document.getElementById("announcementText");
    if (notice && notice.active !== false && notice.content && notice.content.trim() !== "") {
      txt.textContent = notice.content;
      bar.style.display = "block";
    } else {
      bar.style.display = "none";
    }
  });

  // পলিসি পেজ
  db.ref("policies").on("value", snapshot => {
    AppState.policies = snapshot.val() || {};
  });

  // কালার থিম
  db.ref("theme").on("value", snapshot => {
    const theme = snapshot.val();
    if (theme) {
      if (theme.primaryColor) document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
      if (theme.accentColor) document.documentElement.style.setProperty('--accent-color', theme.accentColor);
      if (theme.bgColor) document.documentElement.style.setProperty('--bg-color', theme.bgColor);
      if (theme.surfaceColor) document.documentElement.style.setProperty('--surface-color', theme.surfaceColor);
    }
  });
}

// ৬. ফুটার ও স্টোর ইনফরমেশন সিঙ্ক
function applyGeneralSettings() {
  const s = AppState.settings || {};

  if (s.storeName) {
    document.title = `${s.storeName} - প্রিমিয়াম গ্যাজেট ও ই-কমার্স শপ`;
    document.getElementById("storeBrandName").textContent = s.storeName;
    document.getElementById("footerStoreName").textContent = s.storeName;
    document.getElementById("footerCopyName").textContent = s.storeName;
  }
  if (s.logoUrl) {
    document.getElementById("storeLogoImg").src = s.logoUrl;
  }

  if (s.footerText) {
    document.getElementById("footerAboutText").textContent = s.footerText;
  }

  const phone = s.phone || "0965-8699887";
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  document.getElementById("footerPhoneVal").textContent = phone;
  document.getElementById("footerPhoneCard").href = `tel:${cleanPhone}`;
  const sidePhone = document.querySelector("#sideMenuPhone span");
  if (sidePhone) sidePhone.textContent = phone;

  const wa = s.whatsapp || "01840-829940";
  const cleanWa = wa.replace(/[^0-9]/g, '');
  document.getElementById("footerWhatsappVal").textContent = wa;
  document.getElementById("footerWhatsappCard").href = `https://wa.me/${cleanWa}`;
  document.getElementById("floatingWhatsappBtn").href = `https://wa.me/${cleanWa}`;

  const email = s.email || "nfonlinebd@gmail.com";
  document.getElementById("footerEmailVal").textContent = email;
  document.getElementById("footerEmailCard").href = `mailto:${email}`;
  const sideEmail = document.querySelector("#sideMenuEmail span");
  if (sideEmail) sideEmail.textContent = email;

  renderFooterSocials(s);
}

function renderFooterSocials(s) {
  const container = document.getElementById("footerSocialIconsContainer");
  const cleanWa = (s.whatsapp || "01840829940").replace(/[^0-9]/g, '');
  
  let html = '';
  html += `<a href="https://wa.me/${cleanWa}" target="_blank" rel="noopener noreferrer" class="social-pill-btn wa" title="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>`;

  if (s.tiktokUrl || !s.storeName) {
    const tt = s.tiktokUrl || "https://tiktok.com/@nfsmarttech.com";
    html += `<a href="${tt}" target="_blank" rel="noopener noreferrer" class="social-pill-btn tiktok" title="TikTok"><i class="fa-brands fa-tiktok"></i></a>`;
  }

  if (s.facebookUrl) {
    html += `<a href="${s.facebookUrl}" target="_blank" rel="noopener noreferrer" class="social-pill-btn fb" title="Facebook"><i class="fa-brands fa-facebook-f"></i></a>`;
  }

  if (s.youtubeUrl) {
    html += `<a href="${s.youtubeUrl}" target="_blank" rel="noopener noreferrer" class="social-pill-btn yt" title="YouTube"><i class="fa-brands fa-youtube"></i></a>`;
  }

  if (s.instagramUrl) {
    html += `<a href="${s.instagramUrl}" target="_blank" rel="noopener noreferrer" class="social-pill-btn ig" title="Instagram"><i class="fa-brands fa-instagram"></i></a>`;
  }

  container.innerHTML = html;
}

// ৭. ক্যাটাগরি ও মেনু বার
function renderCategoryBar() {
  const scrollBox = document.getElementById("categoryScroll");
  const cats = Object.values(AppState.categories).filter(c => c.active !== false);

  let html = `
    <div class="cat-card ${AppState.activeFilterCatId === 'all' ? 'active' : ''}" onclick="filterCategory('all')">
      <div class="cat-icon-fallback">🌟</div>
      <div class="cat-name">সব পণ্য</div>
    </div>
  `;

  cats.forEach(c => {
    const isSelected = AppState.activeFilterCatId === c.id;
    html += `
      <div class="cat-card ${isSelected ? 'active' : ''}" onclick="filterCategory('${c.id}')">
        ${c.imageUrl 
          ? `<img src="${escapeHTML(c.imageUrl)}" class="cat-thumb-img" alt="${escapeHTML(c.name)}" onerror="this.outerHTML='<div class=\\'cat-icon-fallback\\'>📦</div>'">` 
          : `<div class="cat-icon-fallback">📦</div>`
        }
        <div class="cat-name">${escapeHTML(c.name)}</div>
      </div>
    `;
  });

  scrollBox.innerHTML = html;
}

function renderSideMenuCategories() {
  const container = document.getElementById("sideMenuCategoriesList");
  const cats = Object.values(AppState.categories).filter(c => c.active !== false);

  let html = `<a href="javascript:void(0)" onclick="toggleSideMenu(); filterCategory('all');"><i class="fa-solid fa-layer-group"></i> সব পণ্য</a>`;
  cats.forEach(c => {
    html += `
      <a href="javascript:void(0)" onclick="toggleSideMenu(); filterCategory('${c.id}');">
        <i class="fa-solid fa-angle-right"></i> ${escapeHTML(c.name)}
      </a>
    `;
  });
  container.innerHTML = html;
}

// ৮. ব্যানার স্লাইডার
let bannerTimer = null;
let currentBannerIdx = 0;

function renderBanners() {
  const slider = document.getElementById("bannerSlider");
  const dotsContainer = document.getElementById("sliderIndicators");
  const banners = Object.values(AppState.banners)
    .filter(b => b.active !== false)
    .sort((a, b) => (Number(a.order) || 1) - (Number(b.order) || 1));

  if (banners.length === 0) {
    slider.innerHTML = `
      <div class="banner-slide">
        <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop&q=80" alt="Banner fallback">
      </div>
    `;
    dotsContainer.innerHTML = '';
    return;
  }

  slider.innerHTML = banners.map(b => `
    <div class="banner-slide" onclick="handleBannerClick('${b.linkedProductId || ''}')">
      <img src="${escapeHTML(b.imageUrl)}" alt="${escapeHTML(b.title || 'Banner')}" onerror="this.src='https://via.placeholder.com/1200x400?text=NF+Smart+Tech'">
      ${b.title || b.subtitle ? `
        <div class="banner-slide-overlay">
          ${b.title ? `<div class="banner-slide-title">${escapeHTML(b.title)}</div>` : ''}
          ${b.subtitle ? `<div class="banner-slide-subtitle">${escapeHTML(b.subtitle)}</div>` : ''}
          ${b.ctaText ? `<span class="banner-cta-badge">${escapeHTML(b.ctaText)}</span>` : ''}
        </div>
      ` : ''}
    </div>
  `).join("");

  dotsContainer.innerHTML = banners.map((_, i) => `<span class="slider-dot ${i === 0 ? 'active' : ''}"></span>`).join("");

  clearInterval(bannerTimer);
  currentBannerIdx = 0;
  if (banners.length > 1) {
    bannerTimer = setInterval(() => {
      currentBannerIdx = (currentBannerIdx + 1) % banners.length;
      slider.scrollTo({ left: slider.clientWidth * currentBannerIdx, behavior: 'smooth' });
      document.querySelectorAll(".slider-dot").forEach((d, i) => {
        d.classList.toggle("active", i === currentBannerIdx);
      });
    }, 5500);
  }
}

function handleBannerClick(productId) {
  if (productId && AppState.products[productId]) {
    openProductDetails(productId);
  }
}

// ৯. পণ্য তালিকা ও ফিল্টারিং
function getActiveProductsList() {
  return Object.values(AppState.products).filter(p => p.active !== false);
}

function renderHomeProducts() {
  const grid = document.getElementById("homeProductGrid");
  const prods = getActiveProductsList();

  if (prods.length === 0) {
    grid.innerHTML = `<div class="loading-state-box"><p>কোনো পণ্য পাওয়া যায়নি।</p></div>`;
    return;
  }

  grid.innerHTML = "";
  prods.forEach(p => grid.appendChild(createProductCard(p)));
}

function createProductCard(product) {
  const div = document.createElement("div");
  div.className = "product-card";
  div.onclick = () => openProductDetails(product.id);

  const regPrice = Number(product.regularPrice) || 0;
  const discPrice = Number(product.discountedPrice) || regPrice;
  const savings = Math.max(0, regPrice - discPrice);
  const isOutOfStock = product.stockStatus === 'out-of-stock' || Number(product.stockQuantity) <= 0;

  const catName = AppState.categories[product.categoryId]?.name || "";
  const mainImg = product.imageUrl || (product.images && product.images[0]) || 'https://via.placeholder.com/300?text=No+Image';

  div.innerHTML = `
    ${savings > 0 ? `<div class="discount-badge">Save ${savings}৳</div>` : ''}
    ${isOutOfStock ? `<div class="stock-badge-out">Stock Out</div>` : ''}
    <div class="product-card-img-wrap">
      <img src="${escapeHTML(mainImg)}" alt="${escapeHTML(product.name)}" onerror="this.src='https://via.placeholder.com/300?text=Image+Not+Found'">
    </div>
    <div class="product-info">
      ${catName ? `<div class="product-category-label">${escapeHTML(catName)}</div>` : ''}
      <div class="product-title" title="${escapeHTML(product.name)}">${escapeHTML(product.name)}</div>
      <div class="price-box">
        <span class="product-price">${discPrice} টাকা</span>
        ${savings > 0 ? `<span class="old-price">${regPrice}৳</span>` : ''}
      </div>
    </div>
  `;
  return div;
}

function filterCategory(catId) {
  AppState.activeFilterCatId = catId;
  const isAll = catId === 'all';

  document.getElementById('mainContainer').style.display = isAll ? 'block' : 'none';
  document.getElementById('bannerSection').style.display = isAll ? 'block' : 'none';
  document.getElementById('allProductsContainer').style.display = isAll ? 'none' : 'block';

  const catObj = AppState.categories[catId];
  const catTitle = isAll ? 'সকল প্রোডাক্ট ক্যাটালগ' : (catObj ? catObj.name + ' ক্যাটাগরি' : 'ক্যাটাগরি পণ্য');
  document.getElementById('pageCategoryTitle').textContent = catTitle;

  const grid = document.getElementById('fullProductGrid');
  grid.innerHTML = '';

  const prods = getActiveProductsList().filter(p => isAll || p.categoryId === catId);
  if (prods.length === 0) {
    grid.innerHTML = `<div class="loading-state-box"><p>এই ক্যাটাগরিতে কোনো পণ্য পাওয়া যায়নি।</p></div>`;
  } else {
    prods.forEach(p => grid.appendChild(createProductCard(p)));
  }

  renderCategoryBar();
  window.scrollTo(0, 0);
}

function showAllProductsPage() {
  filterCategory('all');
  document.getElementById('mainContainer').style.display = 'none';
  document.getElementById('bannerSection').style.display = 'none';
  document.getElementById('allProductsContainer').style.display = 'block';
  document.getElementById('pageCategoryTitle').textContent = 'সকল প্রোডাক্ট ক্যাটালগ';

  const grid = document.getElementById('fullProductGrid');
  grid.innerHTML = '';
  getActiveProductsList().forEach(p => grid.appendChild(createProductCard(p)));
}

function goToHome() {
  AppState.activeFilterCatId = 'all';
  document.getElementById('allProductsContainer').style.display = 'none';
  document.getElementById('mainContainer').style.display = 'block';
  document.getElementById('bannerSection').style.display = 'block';
  renderCategoryBar();
  window.scrollTo(0, 0);
}

// ১০. ভ্যারিয়েন্ট ও কালার এক্সট্রা প্রাইজ ক্যালকুলেশন
window.activeProductConfig = {
  productId: null,
  basePrice: 0,
  selectedVariants: {},
  totalCalculatedPrice: 0
};

function parseOptionExtraPrice(rawStr) {
  if (typeof rawStr !== 'string') return { name: String(rawStr), extra: 0 };
  const match = rawStr.match(/\(\s*\+\s*([0-9]+)\s*(?:tk|টাকা)?\s*\)/i);
  if (match) {
    const extra = Number(match[1]) || 0;
    const cleanName = rawStr.replace(match[0], '').trim();
    return { name: cleanName, extra: extra };
  }
  return { name: rawStr.trim(), extra: 0 };
}

function openProductDetails(productId) {
  const p = AppState.products[productId];
  if (!p) return;

  const modalBody = document.getElementById('modalBody');
  const allImgs = (p.images && p.images.length > 0) ? p.images : [p.imageUrl || 'https://via.placeholder.com/500'];

  const imagesHtml = allImgs.map(img => `
    <div class="detail-img-item">
      <img src="${escapeHTML(img)}" alt="${escapeHTML(p.name)}" onerror="this.src='https://via.placeholder.com/500?text=Preview'">
    </div>
  `).join("");

  const regPrice = Number(p.regularPrice) || 0;
  const baseDiscountPrice = Number(p.discountedPrice) || regPrice;
  const isOutOfStock = p.stockStatus === 'out-of-stock' || Number(p.stockQuantity) <= 0;

  window.activeProductConfig = {
    productId: p.id,
    basePrice: baseDiscountPrice,
    selectedVariants: {},
    totalCalculatedPrice: baseDiscountPrice
  };

  let variantsHtml = '';
  if (p.variants && typeof p.variants === 'object') {
    Object.entries(p.variants).forEach(([grp, opts]) => {
      if (Array.isArray(opts) && opts.length > 0) {
        const firstParsed = parseOptionExtraPrice(opts[0]);
        window.activeProductConfig.selectedVariants[grp] = firstParsed;

        const chips = opts.map((opt, idx) => {
          const parsed = parseOptionExtraPrice(opt);
          const isSelected = idx === 0;
          return `
            <div class="variant-chip ${isSelected ? 'selected' : ''}" 
                 onclick="selectVariantOption('${escapeHTML(grp)}', '${escapeHTML(parsed.name)}', ${parsed.extra}, this)">
              <span>${escapeHTML(parsed.name)}</span>
              ${parsed.extra > 0 ? `<span class="extra-price-tag">+৳${parsed.extra}</span>` : ''}
            </div>
          `;
        }).join("");

        variantsHtml += `
          <div class="options-section">
            <div class="option-group-title"><i class="fa-solid fa-sliders"></i> ${escapeHTML(grp)} নির্বাচন করুন:</div>
            <div class="variant-options-row">${chips}</div>
          </div>
        `;
      }
    });
  }

  const relatedProds = getActiveProductsList().filter(it => it.categoryId === p.categoryId && it.id !== p.id);
  const relatedHtml = relatedProds.slice(0, 8).map(rp => `
    <div class="horizontal-card" onclick="openProductDetails('${rp.id}')">
      <img src="${rp.imageUrl || (rp.images && rp.images[0]) || ''}" alt="${escapeHTML(rp.name)}">
      <div class="horizontal-card-info">
        <div style="font-size: 11px; font-weight: 600; height: 26px; overflow: hidden;">${escapeHTML(rp.name)}</div>
        <div style="font-size: 12px; color: var(--accent-color); font-weight: bold; margin-top: 3px;">৳${rp.discountedPrice || rp.regularPrice}</div>
      </div>
    </div>
  `).join("");

  const waNum = (AppState.settings.whatsapp || '01840829940').replace(/[^0-9]/g, '');
  const callNum = (AppState.settings.phone || '09658699887').replace(/[^0-9+]/g, '');

  const actionButtons = !isOutOfStock ? `
    <div class="action-buttons-grid">
      <button class="action-btn btn-cart" onclick="addToCartConfigured('${p.id}')">
        <i class="fa-solid fa-cart-plus"></i> কার্টে যোগ করুন
      </button>
      <button class="action-btn btn-order" onclick="openCheckoutSingle('${p.id}')">
        <i class="fa-solid fa-bolt"></i> সরাসরি অর্ডার
      </button>
      <a href="https://wa.me/${waNum}?text=${encodeURIComponent(`আসসালামু আলাইকুম, আমি ${p.name} সম্পর্কে জানতে চাই।`)}" target="_blank" class="action-btn btn-whatsapp">
        <i class="fa-brands fa-whatsapp"></i> WhatsApp
      </a>
      <a href="tel:${callNum}" class="action-btn btn-call">
        <i class="fa-solid fa-phone"></i> কল করুন
      </a>
    </div>
  ` : `<div style="background:#ef4444; color:white; padding:10px; text-align:center; font-weight:bold; border-radius:6px; margin:12px 0;">দুঃখিত, এই পণ্যটি বর্তমানে স্টক আউট রয়েছে!</div>`;

  modalBody.innerHTML = `
    <div class="detail-container-inner">
      <div class="detail-image-slider">${imagesHtml}</div>
      <h2 class="detail-title-under-image">${escapeHTML(p.name)}</h2>

      <div class="detail-price-box">
        <span class="detail-price" id="modalLivePrice">৳${baseDiscountPrice}</span>
        ${regPrice > baseDiscountPrice ? `<span class="detail-old-price">৳${regPrice}</span>` : ''}
        ${regPrice > baseDiscountPrice ? `<span class="save-badge">Save ৳${regPrice - baseDiscountPrice}</span>` : ''}
      </div>

      <div id="modalPriceBreakdown" class="price-breakdown-note d-none"></div>

      ${variantsHtml}
      ${actionButtons}

      <div class="detail-description">
        <h3><i class="fa-solid fa-file-lines text-primary"></i> পণ্যের বিবরণী</h3>
        <p>${escapeHTML(p.description || 'এই পণ্যের বিস্তারিত বিবরণ শীঘ্রই যুক্ত করা হবে।')}</p>
      </div>

      ${relatedProds.length > 0 ? `
        <div style="margin-top: 18px;">
          <h3 style="font-size: 14px; margin-bottom: 8px; color: var(--primary-color);">সম্পর্কিত পণ্যসমূহ</h3>
          <div class="horizontal-scroll-section">${relatedHtml}</div>
        </div>
      ` : ''}
    </div>
  `;

  document.getElementById('globalModal').style.display = 'flex';
  updateLiveCalculatedPrice();
  window.scrollTo(0, 0);
}

function selectVariantOption(groupName, optionName, extraPrice, element) {
  const parent = element.parentElement;
  parent.querySelectorAll('.variant-chip').forEach(c => c.classList.remove('selected'));
  element.classList.add('selected');

  window.activeProductConfig.selectedVariants[groupName] = {
    name: optionName,
    extra: Number(extraPrice) || 0
  };

  updateLiveCalculatedPrice();
}

function updateLiveCalculatedPrice() {
  const cfg = window.activeProductConfig;
  let totalExtra = 0;
  const breakdownParts = [];

  Object.entries(cfg.selectedVariants).forEach(([grp, item]) => {
    if (item.extra > 0) {
      totalExtra += item.extra;
      breakdownParts.push(`${grp} (${item.name}): +৳${item.extra}`);
    }
  });

  const finalPrice = cfg.basePrice + totalExtra;
  cfg.totalCalculatedPrice = finalPrice;

  const priceElem = document.getElementById("modalLivePrice");
  if (priceElem) priceElem.textContent = `৳${finalPrice}`;

  const noteElem = document.getElementById("modalPriceBreakdown");
  if (noteElem) {
    if (totalExtra > 0) {
      noteElem.classList.remove("d-none");
      noteElem.innerHTML = `<i class="fa-solid fa-circle-info"></i> মূল্য হিসাব: মূল ৳${cfg.basePrice} + ${breakdownParts.join(" + ")} = মোট <strong>৳${finalPrice}</strong>`;
    } else {
      noteElem.classList.add("d-none");
    }
  }
}

// ১১. কার্ট সিস্টেম
function addToCartConfigured(productId) {
  const p = AppState.products[productId];
  if (!p) return;

  const isOutOfStock = p.stockStatus === 'out-of-stock' || Number(p.stockQuantity) <= 0;
  if (isOutOfStock) {
    showToast("দুঃখিত! এই পণ্যটি বর্তমানে স্টকে নেই।", "error");
    return;
  }

  const cfg = window.activeProductConfig;
  const selectedVariantsRecord = {};
  Object.entries(cfg.selectedVariants).forEach(([k, val]) => {
    selectedVariantsRecord[k] = val.extra > 0 ? `${val.name} (+৳${val.extra})` : val.name;
  });

  const variantKey = Object.entries(selectedVariantsRecord).map(([k, v]) => `${k}:${v}`).sort().join("|");
  const cartItemKey = `${productId}_${variantKey}`;

  const existing = AppState.cart.find(it => it.cartKey === cartItemKey);
  const currentStock = Number(p.stockQuantity) || 999;

  if (existing) {
    if (existing.qty + 1 > currentStock) {
      showToast("স্টকে থাকা পরিমাণের চেয়ে বেশি যোগ করা যাবে না!", "error");
      return;
    }
    existing.qty += 1;
  } else {
    AppState.cart.push({
      productId: p.id,
      name: p.name,
      price: cfg.totalCalculatedPrice,
      basePrice: cfg.basePrice,
      image: p.imageUrl || (p.images && p.images[0]) || '',
      variants: selectedVariantsRecord,
      cartKey: cartItemKey,
      qty: 1
    });
  }

  updateCartCounter();
  showToast("পণ্যটি সফলভাবে কার্টে যুক্ত হয়েছে!", "success");
}

function updateCartCounter() {
  const totalQty = AppState.cart.reduce((sum, it) => sum + it.qty, 0);
  document.getElementById("cartCountFloat").textContent = totalQty;
}

function toggleCartCornerPopup(event) {
  if (event) event.stopPropagation();
  const pop = document.getElementById("cartCornerPopup");
  pop.classList.toggle("active");
  if (pop.classList.contains("active")) {
    renderCartCorner();
  }
}

function renderCartCorner() {
  const listDiv = document.getElementById("cartCornerItemsList");
  const summaryDiv = document.getElementById("cartCornerSummary");

  if (AppState.cart.length === 0) {
    listDiv.innerHTML = `<p style="text-align:center; padding:24px 0; color:#64748b; font-size:13px;">আপনার কার্ট বর্তমানে খালি।</p>`;
    summaryDiv.innerHTML = '';
    return;
  }

  let subtotal = 0;
  listDiv.innerHTML = AppState.cart.map((item, idx) => {
    subtotal += item.price * item.qty;
    const vStr = Object.entries(item.variants || {}).map(([k, v]) => `${k}: ${v}`).join(", ");
    return `
      <div class="cart-item-row">
        <img src="${item.image}" alt="${escapeHTML(item.name)}" onerror="this.src='https://via.placeholder.com/48'">
        <div style="flex-grow: 1;">
          <div style="font-size: 11.5px; font-weight: 700;">${escapeHTML(item.name)}</div>
          ${vStr ? `<div style="font-size: 10px; color: #64748b;">${escapeHTML(vStr)}</div>` : ''}
          <div style="font-size: 11.5px; color: var(--accent-color); font-weight: 800;">৳${item.price} &times; ${item.qty}</div>
          <div class="qty-adjuster">
            <button onclick="changeCartQty(${idx}, -1)">-</button>
            <span style="font-size: 11px; font-weight: 700;">${item.qty}</span>
            <button onclick="changeCartQty(${idx}, 1)">+</button>
          </div>
        </div>
        <button class="cart-remove-btn" onclick="removeCartItem(${idx})" title="মুছে ফেলুন">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;
  }).join("");

  summaryDiv.innerHTML = `
    <div style="font-size: 12.5px; border-top: 1px solid var(--border-color); padding-top: 8px; margin-bottom: 10px;">
      <div style="display:flex; justify-content:space-between;">
        <span>সাবটোটাল:</span> <strong>৳${subtotal}</strong>
      </div>
    </div>
    <button class="submit-order-btn" onclick="openCheckoutMultiple()">
      <i class="fa-solid fa-cart-arrow-down"></i> চেকআউট করুন
    </button>
  `;
}

function changeCartQty(index, delta) {
  const item = AppState.cart[index];
  if (!item) return;

  const product = AppState.products[item.productId];
  const stockLimit = product ? Number(product.stockQuantity) || 999 : 999;

  item.qty += delta;
  if (item.qty > stockLimit) {
    item.qty = stockLimit;
    showToast("সর্বোচ্চ স্টক পরিমাণ পৌঁছে গেছে!", "error");
  }
  if (item.qty <= 0) {
    AppState.cart.splice(index, 1);
  }

  updateCartCounter();
  renderCartCorner();
}

function removeCartItem(index) {
  AppState.cart.splice(index, 1);
  updateCartCounter();
  renderCartCorner();
}

// ১২. চেকআউট স্ক্রিন
window.checkoutMode = 'cart';
window.singleCheckoutItem = null;

function openCheckoutSingle(productId) {
  const p = AppState.products[productId];
  if (!p) return;

  const isOutOfStock = p.stockStatus === 'out-of-stock' || Number(p.stockQuantity) <= 0;
  if (isOutOfStock) {
    showToast("দুঃখিত! এই পণ্যটি বর্তমানে স্টকে নেই।", "error");
    return;
  }

  const cfg = window.activeProductConfig;
  const selectedVariantsRecord = {};
  Object.entries(cfg.selectedVariants).forEach(([k, val]) => {
    selectedVariantsRecord[k] = val.extra > 0 ? `${val.name} (+৳${val.extra})` : val.name;
  });

  window.checkoutMode = 'single';
  window.singleCheckoutItem = {
    productId: p.id,
    name: p.name,
    price: cfg.totalCalculatedPrice,
    image: p.imageUrl || (p.images && p.images[0]) || '',
    variants: selectedVariantsRecord,
    qty: 1
  };

  document.getElementById('globalModal').style.display = 'flex';
  renderCheckoutView();
}

function openCheckoutMultiple() {
  if (AppState.cart.length === 0) {
    showToast("কার্টে কোনো পণ্য নেই!", "error");
    return;
  }
  document.getElementById("cartCornerPopup").classList.remove("active");
  window.checkoutMode = 'cart';
  document.getElementById('globalModal').style.display = 'flex';
  renderCheckoutView();
}

function getDeliveryFee(district, subtotal) {
  const rules = AppState.deliveryRules;
  if (rules.freeDeliveryThreshold > 0 && subtotal >= rules.freeDeliveryThreshold) {
    return 0;
  }
  return district === "ঢাকা" ? rules.insideDhaka : rules.outsideDhaka;
}

function renderCheckoutView() {
  const items = window.checkoutMode === 'single' ? [window.singleCheckoutItem] : AppState.cart;
  let subtotal = 0;

  const itemsHtml = items.map((it, idx) => {
    subtotal += it.price * it.qty;
    const vStr = Object.entries(it.variants || {}).map(([k, v]) => `${k}: ${v}`).join(", ");
    return `
      <div class="cart-item-row">
        <img src="${it.image}" alt="${escapeHTML(it.name)}" onerror="this.src='https://via.placeholder.com/48'">
        <div style="flex-grow: 1;">
          <div style="font-size: 12px; font-weight: 700;">${escapeHTML(it.name)}</div>
          ${vStr ? `<div style="font-size: 10px; color: #64748b;">${escapeHTML(vStr)}</div>` : ''}
          <div style="font-size: 12px; color: var(--accent-color); font-weight: 800;">৳${it.price} &times; ${it.qty} = ৳${it.price * it.qty}</div>
          <div class="qty-adjuster">
            <button onclick="updateCheckoutQty(${idx}, -1)">-</button>
            <span style="font-size: 11px; font-weight: 700;">${it.qty}</span>
            <button onclick="updateCheckoutQty(${idx}, 1)">+</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  const allDistricts = Object.keys(districtsData);
  const districtOptions = `<option value="">জেলা নির্বাচন করুন</option>` + allDistricts.map(d => `<option value="${d}">${d}</option>`).join("");

  const modalBody = document.getElementById("modalBody");
  modalBody.innerHTML = `
    <div class="detail-container-inner">
      <h2 class="detail-title-under-image" style="border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        <i class="fa-solid fa-truck-fast text-primary"></i> অর্ডার চেকআউট (ক্যাশ অন ডেলিভারি)
      </h2>

      <div style="background: #f8fafc; padding: 10px; border-radius: var(--radius-sm); margin-bottom: 12px; border: 1px solid var(--border-color);">
        <div style="font-weight: 700; font-size: 12.5px; margin-bottom: 6px;">অর্ডারকৃত পণ্যসমূহ:</div>
        <div>${itemsHtml}</div>
      </div>

      <!-- কুপন সেকশন -->
      <div class="coupon-input-group">
        <input type="text" id="couponCodeInput" placeholder="কুপন কোড (যদি থাকে)..." value="${AppState.appliedCoupon ? AppState.appliedCoupon.code : ''}">
        <button class="btn-apply-coupon" onclick="applyCouponCode()">কুপন প্রয়োগ</button>
      </div>
      <div id="couponStatusMessage" style="font-size: 11.5px; margin-bottom: 6px;"></div>

      <!-- লাইভ হিসাব বক্স -->
      <div class="checkout-summary" id="checkoutSummaryBox">
        <div class="summary-row"><span>পণ্যের সাব-টোটাল:</span> <strong>৳<span id="chkSubtotal">${subtotal}</span></strong></div>
        <div class="summary-row"><span>ডিসকাউন্ট (কুপন):</span> <strong>-৳<span id="chkDiscount">0</span></strong></div>
        <div class="summary-row"><span>ডেলিভারি চার্জ:</span> <strong>৳<span id="chkDelivery">0</span></strong></div>
        <div class="summary-row" style="font-size: 14.5px; font-weight: 800; color: var(--accent-color); border-top: 1px dashed var(--border-color); padding-top: 6px; margin-top: 4px;">
          <span>সর্বমোট প্রদেয়:</span> <span>৳<span id="chkGrandTotal">${subtotal}</span></span>
        </div>
      </div>

      <div class="delivery-notice">
        <i class="fa-solid fa-box-open"></i> পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধ করুন। কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই।
      </div>

      <div class="form-group">
        <label>আপনার সম্পূর্ণ নাম <span style="color:var(--danger-color)">*</span></label>
        <input type="text" id="custName" placeholder="যেমন: মো: আরিফুল ইসলাম" oninput="removeError(this)">
      </div>

      <div class="form-group">
        <label>মোবাইল নম্বর (১১ ডিজিট) <span style="color:var(--danger-color)">*</span></label>
        <input type="tel" id="custPhone" maxlength="11" placeholder="01XXXXXXXXX" oninput="removeError(this)">
      </div>

      <div class="form-group">
        <label>জেলা নির্বাচন করুন <span style="color:var(--danger-color)">*</span></label>
        <select id="custDistrict" onchange="handleDistrictChange(this.value); removeError(this)">
          ${districtOptions}
        </select>
      </div>

      <div class="form-group">
        <label>থানা / উপজেলা <span style="color:var(--danger-color)">*</span></label>
        <select id="custThana" onchange="removeError(this)">
          <option value="">প্রথমে জেলা নির্বাচন করুন</option>
        </select>
      </div>

      <div class="form-group">
        <label>গ্রাম বা বিস্তারিত ঠিকানা <span style="color:var(--danger-color)">*</span></label>
        <input type="text" id="custAddress" placeholder="রোড নং, হাউজ নং, এলাকা বা গ্রামের নাম লিখুন" oninput="removeError(this)">
      </div>

      <div class="form-group">
        <label>অর্ডার সংক্রান্ত নোট (ঐচ্ছিক)</label>
        <input type="text" id="custNote" placeholder="ডেলিভারির জন্য কোনো বিশেষ নির্দেশনা থাকলে লিখুন">
      </div>

      <button class="submit-order-btn" id="submitOrderBtn" onclick="submitFinalOrder()">
        <i class="fa-solid fa-circle-check"></i> অর্ডার কনফার্ম করুন
      </button>
    </div>
  `;

  recalculateCheckoutTotals();
}

function handleDistrictChange(dist) {
  const thanaSelect = document.getElementById("custThana");
  thanaSelect.innerHTML = `<option value="">থানা / উপজেলা নির্বাচন করুন</option>`;
  if (dist) {
    const thanas = getThanasForDistrict(dist);
    thanas.forEach(t => {
      thanaSelect.innerHTML += `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`;
    });
  }
  recalculateCheckoutTotals();
}

function recalculateCheckoutTotals() {
  const items = window.checkoutMode === 'single' ? [window.singleCheckoutItem] : AppState.cart;
  const subtotal = items.reduce((s, it) => s + (it.price * it.qty), 0);

  const district = document.getElementById("custDistrict")?.value || "";
  let deliveryFee = district ? getDeliveryFee(district, subtotal) : (AppState.deliveryRules.insideDhaka || 60);

  let discount = 0;
  if (AppState.appliedCoupon) {
    const cpn = AppState.appliedCoupon;
    if (subtotal >= (cpn.minOrder || 0)) {
      discount = cpn.type === 'percentage' ? Math.round((subtotal * cpn.discount) / 100) : (Number(cpn.discount) || 0);
    } else {
      AppState.appliedCoupon = null;
    }
  }

  const grandTotal = Math.max(0, subtotal - discount) + deliveryFee;

  const subElem = document.getElementById("chkSubtotal");
  const discElem = document.getElementById("chkDiscount");
  const delElem = document.getElementById("chkDelivery");
  const grandElem = document.getElementById("chkGrandTotal");

  if (subElem) subElem.textContent = subtotal;
  if (discElem) discElem.textContent = discount;
  if (delElem) delElem.textContent = deliveryFee;
  if (grandElem) grandElem.textContent = grandTotal;
}

function applyCouponCode() {
  const input = document.getElementById("couponCodeInput");
  const statusMsg = document.getElementById("couponStatusMessage");
  const code = input.value.trim().toUpperCase();

  if (!code) {
    statusMsg.innerHTML = `<span style="color:var(--danger-color);">কুপন কোড লিখুন!</span>`;
    return;
  }

  const coupon = AppState.coupons[code];
  if (!coupon || coupon.active === false) {
    statusMsg.innerHTML = `<span style="color:var(--danger-color);">অবৈধ বা মেয়াদোত্তীর্ণ কুপন!</span>`;
    AppState.appliedCoupon = null;
    recalculateCheckoutTotals();
    return;
  }

  const items = window.checkoutMode === 'single' ? [window.singleCheckoutItem] : AppState.cart;
  const subtotal = items.reduce((s, it) => s + (it.price * it.qty), 0);

  if (coupon.minOrder && subtotal < coupon.minOrder) {
    statusMsg.innerHTML = `<span style="color:var(--danger-color);">এই কুপনে ন্যূনতম ৳${coupon.minOrder} টাকার অর্ডার আবশ্যক।</span>`;
    AppState.appliedCoupon = null;
    recalculateCheckoutTotals();
    return;
  }

  AppState.appliedCoupon = coupon;
  statusMsg.innerHTML = `<span style="color:var(--success-color);"><i class="fa-solid fa-check"></i> কুপন কোড সফলভাবে যোগ হয়েছে!</span>`;
  recalculateCheckoutTotals();
}

function updateCheckoutQty(index, delta) {
  if (window.checkoutMode === 'single') {
    window.singleCheckoutItem.qty += delta;
    if (window.singleCheckoutItem.qty < 1) window.singleCheckoutItem.qty = 1;
  } else {
    AppState.cart[index].qty += delta;
    if (AppState.cart[index].qty < 1) AppState.cart[index].qty = 1;
    updateCartCounter();
  }
  renderCheckoutView();
}

function removeError(el) {
  el.classList.remove('error-input');
}

// ১৩. টেলিগ্রাম এস্কেপ হেল্পার
function escapeTelegramHTML(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// =========================================================================
// ১৪. সবার আগে টেলিগ্রামে অর্ডার ডিটেইলস পাঠানো (TELEGRAM DISPATCH FIRST)
// =========================================================================
async function sendTelegramNotificationFirst(order) {
  try {
    // সরাসরি উপরে দেওয়া কনফিগ থেকে বট টোকেন নেওয়া
    let botToken = (DIRECT_TELEGRAM_CONFIG.botToken || "").trim();
    let chatId = (DIRECT_TELEGRAM_CONFIG.chatId || "").trim();

    // যদি উপরে ফাঁকা থাকে, তখন ফায়ারবেস থেকে নেওয়ার চেষ্টা করবে
    if (!botToken || !chatId) {
      const snap = await db.ref("telegramSettings").once("value");
      const tg = snap.val() || AppState.telegramSettings || {};
      botToken = (tg.botToken || "").trim();
      chatId = (tg.chatId || "").trim();
    }

    if (!botToken || !chatId) {
      console.error("টেলিগ্রাম বট টোকেন অথবা চ্যাট আইডি সেট করা নেই!");
      return;
    }

    // পণ্যের তালিকা ফরম্যাটিং
    const itemsListHTML = (order.items || []).map((i, idx) => {
      const v = Object.entries(i.variants || {}).map(([k, val]) => `${escapeTelegramHTML(k)}: ${escapeTelegramHTML(val)}`).join(", ");
      return `📦 <b>পণ্য #${idx + 1}:</b> ${escapeTelegramHTML(i.name)}\n` +
             `${v ? `   🏷️ <i>ভ্যারিয়েন্ট:</i> ${v}\n` : ''}` +
             `   🔢 <i>পরিমাণ:</i> ${i.quantity} টি\n` +
             `   💵 <i>ইউনিট মূল্য:</i> ৳${i.price}\n` +
             `   💰 <i>মোট:</i> ৳${i.price * i.quantity}`;
    }).join("\n\n");

    const htmlMsg = 
      `🚨 <b>নতুন ওয়েবসাইট অর্ডার এসেছে!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 <b>অর্ডার আইডি:</b> <code>#${escapeTelegramHTML(order.orderId)}</code>\n` +
      `⏰ <b>তারিখ ও সময়:</b> ${new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 <b>গ্রাহকের বিস্তারিত তথ্য:</b>\n` +
      `• <b>নাম:</b> ${escapeTelegramHTML(order.customer.name)}\n` +
      `• <b>মোবাইল নম্বর:</b> <code>${escapeTelegramHTML(order.customer.phone)}</code>\n` +
      `• <b>জেলা:</b> ${escapeTelegramHTML(order.customer.district)}\n` +
      `• <b>থানা/উপজেলা:</b> ${escapeTelegramHTML(order.customer.thana)}\n` +
      `• <b>সম্পূর্ণ ঠিকানা:</b> ${escapeTelegramHTML(order.customer.area)}\n` +
      `${order.customer.note ? `• <b>কাস্টমার নোট:</b> <i>${escapeTelegramHTML(order.customer.note)}</i>\n` : ''}` +
      `\n━━━━━━━━━━━━━━━━━━━━━\n` +
      `🛍️ <b>অর্ডারকৃত পণ্যসমূহ:</b>\n\n` +
      `${itemsListHTML}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `💳 <b>হিসাব ও বিলের বিবরণী:</b>\n` +
      `• সাবটোটাল: <b>৳${order.pricingSnapshot.subtotal}</b>\n` +
      `• ডেলিভারি চার্জ: <b>৳${order.pricingSnapshot.deliveryFee}</b>\n` +
      `${order.pricingSnapshot.discount > 0 ? `• কুপন ছাড় (${escapeTelegramHTML(order.pricingSnapshot.couponCode || 'Promo')}): <b>-৳${order.pricingSnapshot.discount}</b>\n` : ''}` +
      `• পেমেন্ট মেথড: <b>ক্যাশ অন ডেলিভারি (COD)</b>\n` +
      `💰 <b>সর্বমোট প্রদেয় বিল: ৳${order.pricingSnapshot.totalAmount}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━`;

    // টেলিগ্রামে সরাসরি রিকোয়েস্ট
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlMsg,
        parse_mode: "HTML"
      })
    });

    const data = await res.json();

    // কোনো কারণে টেলিগ্রাম HTML রিজেক্ট করলে প্লেইন টেক্সট ব্যাকআপ পাঠানো
    if (!data.ok) {
      console.warn("Telegram HTML mode rejected. Sending plain text fallback:", data.description);

      const plainItems = (order.items || []).map((i, idx) => {
        const v = Object.entries(i.variants || {}).map(([k, val]) => `${k}: ${val}`).join(", ");
        return `#${idx + 1} ${i.name} ${v ? `(${v})` : ''} - ${i.quantity} টি x ৳${i.price} = ৳${i.price * i.quantity}`;
      }).join("\n");

      const plainMsg = 
        `[নতুন ওয়েবসাইট অর্ডার]\n` +
        `অর্ডার আইডি: #${order.orderId}\n` +
        `তারিখ: ${new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}\n\n` +
        `গ্রাহক: ${order.customer.name}\n` +
        `ফোন: ${order.customer.phone}\n` +
        `ঠিকানা: ${order.customer.area}, ${order.customer.thana}, ${order.customer.district}\n` +
        `${order.customer.note ? `নোট: ${order.customer.note}\n` : ''}\n` +
        `পণ্যসমূহ:\n${plainItems}\n\n` +
        `সাবটোটাল: ৳${order.pricingSnapshot.subtotal}\n` +
        `ডেলিভারি চার্জ: ৳${order.pricingSnapshot.deliveryFee}\n` +
        `${order.pricingSnapshot.discount > 0 ? `ছাড়: -৳${order.pricingSnapshot.discount}\n` : ''}` +
        `সর্বমোট বিল: ৳${order.pricingSnapshot.totalAmount} (COD)`;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: plainMsg
        })
      });
    } else {
      console.log("Telegram notification sent successfully!");
    }

  } catch (err) {
    console.error("Telegram direct dispatch error:", err);
  }
}

// =========================================================================
// ১৫. চূড়ান্ত অর্ডার সাবমিশন (১. টেলিগ্রাম সবার আগে -> ২. ফায়ারবেস/অ্যাডমিন প্যানেল)
// =========================================================================
async function submitFinalOrder() {
  const nameInput = document.getElementById("custName");
  const phoneInput = document.getElementById("custPhone");
  const districtSelect = document.getElementById("custDistrict");
  const thanaSelect = document.getElementById("custThana");
  const addressInput = document.getElementById("custAddress");
  const noteInput = document.getElementById("custNote");
  const submitBtn = document.getElementById("submitOrderBtn");

  let hasError = false;

  if (!nameInput.value.trim()) { nameInput.classList.add("error-input"); hasError = true; }
  else nameInput.classList.remove("error-input");

  const phoneRegex = /^01[0-9]{9}$/;
  if (!phoneRegex.test(phoneInput.value.trim())) { phoneInput.classList.add("error-input"); hasError = true; }
  else phoneInput.classList.remove("error-input");

  if (!districtSelect.value) { districtSelect.classList.add("error-input"); hasError = true; }
  else districtSelect.classList.remove("error-input");

  if (!thanaSelect.value) { thanaSelect.classList.add("error-input"); hasError = true; }
  else thanaSelect.classList.remove("error-input");

  if (!addressInput.value.trim()) { addressInput.classList.add("error-input"); hasError = true; }
  else addressInput.classList.remove("error-input");

  if (hasError) {
    showToast("দয়া করে প্রয়োজনীয় সব তথ্য সঠিকভাবে লিখুন।", "error");
    return;
  }

  const rawItems = window.checkoutMode === 'single' ? [window.singleCheckoutItem] : AppState.cart;
  if (!rawItems || rawItems.length === 0) {
    showToast("কার্টে কোনো পণ্য পাওয়া যায়নি!", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<div class="spinner" style="width:18px;height:18px;margin:0;"></div> অর্ডার প্রসেস হচ্ছে...`;

  try {
    let liveSubtotal = 0;
    const finalOrderItems = [];

    for (const item of rawItems) {
      const pSnap = await db.ref(`products/${item.productId}`).once('value');
      const liveP = pSnap.val();

      if (!liveP || liveP.active === false) {
        throw new Error(`পণ্য '${item.name}' বর্তমানে অনুপলব্ধ!`);
      }

      if (liveP.stockStatus === 'out-of-stock' || (Number(liveP.stockQuantity) < item.qty)) {
        throw new Error(`পণ্য '${item.name}' পর্যাপ্ত স্টকে নেই!`);
      }

      const itemFinalUnitPrice = item.price;
      liveSubtotal += itemFinalUnitPrice * item.qty;

      finalOrderItems.push({
        id: item.productId,
        name: liveP.name,
        price: itemFinalUnitPrice,
        quantity: item.qty,
        variants: item.variants || {},
        imageUrl: liveP.imageUrl || (liveP.images && liveP.images[0]) || ''
      });
    }

    const customerDistrict = districtSelect.value;
    const liveDeliveryFee = getDeliveryFee(customerDistrict, liveSubtotal);

    let liveDiscount = 0;
    if (AppState.appliedCoupon) {
      const cSnap = await db.ref(`coupons/${AppState.appliedCoupon.code}`).once('value');
      const liveCoupon = cSnap.val();
      if (liveCoupon && liveCoupon.active !== false && liveSubtotal >= (liveCoupon.minOrder || 0)) {
        liveDiscount = liveCoupon.type === 'percentage' 
          ? Math.round((liveSubtotal * liveCoupon.discount) / 100) 
          : (Number(liveCoupon.discount) || 0);
      }
    }

    const liveTotalAmount = Math.max(0, liveSubtotal - liveDiscount) + liveDeliveryFee;
    const orderId = "NF" + Date.now().toString().slice(-6);

    const orderPayload = {
      orderId: orderId,
      customer: {
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        district: customerDistrict,
        thana: thanaSelect.value,
        area: addressInput.value.trim(),
        note: noteInput.value.trim()
      },
      items: finalOrderItems,
      pricingSnapshot: {
        subtotal: liveSubtotal,
        deliveryFee: liveDeliveryFee,
        discount: liveDiscount,
        totalAmount: liveTotalAmount,
        couponCode: AppState.appliedCoupon ? AppState.appliedCoupon.code : null
      },
      paymentMethod: "Cash on Delivery",
      status: "Pending",
      statusHistory: [
        { status: "Pending", timestamp: Date.now(), updatedBy: "Customer (Web)" }
      ],
      createdAt: firebase.database.ServerValue.TIMESTAMP
    };

    // =========================================================================
    // ১. সবার আগে টেলিগ্রামে সম্পূর্ণ অর্ডার পাঠানো (Telegram First)
    // =========================================================================
    await sendTelegramNotificationFirst(orderPayload);

    // =========================================================================
    // ২. টেলিগ্রামের পর অ্যাডমিন প্যানেল / ফায়ারবেসে অর্ডার সেভ করা (Admin Panel Save)
    // =========================================================================
    await db.ref(`orders/${orderId}`).set(orderPayload);

    // কার্ট রিসেট
    if (window.checkoutMode === 'cart') {
      AppState.cart = [];
      updateCartCounter();
    }
    AppState.appliedCoupon = null;

    // সফলতার রসিদ দেখানো
    renderOrderSuccessReceipt(orderPayload);

  } catch (err) {
    console.error("Order submit error:", err);
    showToast(err.message || "অর্ডার সম্পন্ন হতে ব্যর্থ হয়েছে।", "error");
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> অর্ডার কনফার্ম করুন`;
  }
}

function renderOrderSuccessReceipt(o) {
  const modalBody = document.getElementById("modalBody");
  const helpline = AppState.settings.phone || "0965-8699887";

  modalBody.innerHTML = `
    <div class="detail-container-inner">
      <div class="success-box">
        <div class="success-icon"><i class="fa-solid fa-circle-check"></i></div>
        <h2 style="color: var(--success-color); font-size: 18px; margin-bottom: 6px;">আপনার অর্ডারটি সফল হয়েছে!</h2>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          অর্ডার আইডি: <strong>#${o.orderId}</strong>। আমাদের কাস্টমার প্রতিনিধি শীঘ্রই কল করে অর্ডারটি নিশ্চিত করবেন।
        </p>
      </div>

      <div class="checkout-summary" style="font-size: 12.5px;">
        <div style="font-weight: 700; margin-bottom: 8px; color: var(--primary-color);">অর্ডারের বিবরণ:</div>
        <p><strong>নাম:</strong> ${escapeHTML(o.customer.name)}</p>
        <p><strong>মোবাইল:</strong> ${escapeHTML(o.customer.phone)}</p>
        <p><strong>ঠিকানা:</strong> ${escapeHTML(o.customer.area)}, ${escapeHTML(o.customer.thana)}, ${escapeHTML(o.customer.district)}</p>
        <p><strong>পেমেন্ট:</strong> ক্যাশ অন ডেলিভারি (COD)</p>
        <div style="border-top: 1px dashed var(--border-color); margin-top: 6px; padding-top: 6px; font-weight: 800; color: var(--accent-color);">
          সর্বমোট প্রদেয়: ৳${o.pricingSnapshot.totalAmount}
        </div>
      </div>

      <div style="background: #eef2f3; padding: 12px; border-radius: var(--radius-sm); text-align: center; margin-bottom: 14px; font-size: 13px; font-weight: 700; color: var(--primary-color);">
        📞 হেল্পলাইন: <a href="tel:${helpline.replace(/[^0-9+]/g, '')}" style="color: var(--accent-color); text-decoration: none;">${helpline}</a>
      </div>

      <button class="submit-order-btn" onclick="closeModal(); goToHome();">
        <i class="fa-solid fa-house"></i> হোমে ফিরে যান
      </button>
    </div>
  `;
}

// ১৬. পলিসি ও ইনফো মোডাল
function openPolicyModal(policyType) {
  const modalBody = document.getElementById("modalBody");
  const titles = {
    about: "আমাদের সম্পর্কে (About Us)",
    shipping: "ডেলিভারি পলিসি (Shipping Policy)",
    return: "রিটার্ন ও রিফান্ড নীতি (Return & Refund)",
    terms: "টার্মস ও কন্ডিশনস (Terms & Conditions)",
    privacy: "প্রাইভেসি পলিসি (Privacy Policy)"
  };

  const dynamicContent = AppState.policies[policyType];

  let bodyHtml = '';
  if (policyType === 'about' && !dynamicContent) {
    bodyHtml = `
      <div class="about-full-container">
        <div class="about-slide-block">
          <img src="https://i.ibb.co/BHK9kB7X/64797494668.png" alt="Founder" class="about-profile-img" onerror="this.src='https://via.placeholder.com/100'">
          <div class="about-slide-title">Fahim Ahammed (Company CEO)</div>
          <div class="about-slide-desc" style="font-size:12.5px;color:#64748b;">
            NF Smart Tech-এর প্রতিষ্ঠাতা ও সিইও। আমরা গ্রাহকদের হাতে সেরা মানের প্রিমিয়াম গ্যাজেট ও ইলেকট্রনিক্স পণ্য বিশ্বস্ততার সাথে পৌঁছে দিতে প্রতিজ্ঞাবদ্ধ।
          </div>
        </div>
        <div class="about-slide-block">
          <img src="https://i.ibb.co/zTYS7fPk/69044013097.png" alt="Studio Room" class="about-full-img" onerror="this.src='https://via.placeholder.com/600x200'">
          <div class="about-slide-title">আমাদের প্রোডাক্ট স্টুডিও</div>
          <div class="about-slide-desc" style="font-size:12.5px;color:#64748b;">
            আমাদের নিজস্ব শোকেসিং ও রিভিউ স্টুডিও রুম। যেখান থেকে প্রতিটি পণ্যের রিয়েল ভিডিও ও কোয়ালিটি নিশ্চিত করা হয়।
          </div>
        </div>
      </div>
    `;
  } else {
    bodyHtml = `
      <div class="policy-text-body">
        ${escapeHTML(dynamicContent || 'এই পলিসি তথ্যটি অ্যাডমিন প্যানেল থেকে শীঘ্রই আপডেট করা হবে।')}
      </div>
    `;
  }

  modalBody.innerHTML = `
    <div class="detail-container-inner">
      <h2 class="detail-title-under-image" style="margin-bottom: 14px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        ${titles[policyType] || 'তথ্য'}
      </h2>
      ${bodyHtml}
      <button class="submit-order-btn" style="margin-top: 16px;" onclick="closeModal()">বন্ধ করুন</button>
    </div>
  `;

  document.getElementById("globalModal").style.display = "flex";
  window.scrollTo(0, 0);
}

// ১৭. সার্চ ও ইউজার ইন্টারঅ্যাকশন
function toggleSearchPopup(event) {
  if (event) event.stopPropagation();
  const box = document.getElementById("searchPopupBox");
  box.classList.toggle("active");
  if (box.classList.contains("active")) {
    document.getElementById("searchInput").focus();
  }
}

function clearSearchInput() {
  document.getElementById("searchInput").value = "";
  document.getElementById("searchSuggestionsList").innerHTML = "";
  document.getElementById("searchInput").focus();
}

function handleSearchInput() {
  const query = document.getElementById("searchInput").value.toLowerCase().trim();
  const listDiv = document.getElementById("searchSuggestionsList");
  listDiv.innerHTML = "";

  if (!query) return;

  const matched = getActiveProductsList().filter(p => p.name.toLowerCase().includes(query));

  if (matched.length === 0) {
    listDiv.innerHTML = `<div style="padding: 12px; text-align:center; font-size:12px; color:#64748b;">কোনো পণ্য পাওয়া যায়নি</div>`;
    return;
  }

  matched.forEach(p => {
    const row = document.createElement("div");
    row.className = "suggestion-row";
    row.innerHTML = `
      <img src="${p.imageUrl || (p.images && p.images[0]) || ''}" alt="${escapeHTML(p.name)}" onerror="this.src='https://via.placeholder.com/40'">
      <div>
        <div style="font-weight: 600; font-size: 13px;">${escapeHTML(p.name)}</div>
        <div style="color: var(--accent-color); font-weight: 700; font-size: 12px;">৳${p.discountedPrice || p.regularPrice}</div>
      </div>
    `;
    row.onclick = () => {
      document.getElementById("searchPopupBox").classList.remove("active");
      openProductDetails(p.id);
    };
    listDiv.appendChild(row);
  });
}

function toggleSideMenu(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("sideMenuOverlay");
  menu.classList.toggle("active");
  overlay.classList.toggle("active");
}

function handleBodyScroll() {
  document.getElementById("searchPopupBox").classList.remove("active");
  document.getElementById("cartCornerPopup").classList.remove("active");
}

window.onclick = function() {
  document.getElementById("searchPopupBox").classList.remove("active");
  document.getElementById("cartCornerPopup").classList.remove("active");
  document.getElementById("sideMenu").classList.remove("active");
  document.getElementById("sideMenuOverlay").classList.remove("active");
};

function closeModal() {
  document.getElementById("globalModal").style.display = "none";
}

function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message, type = "info") {
  const container = document.getElementById("userToastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `user-toast ${type}`;
  toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// ১৮. DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  initFirebaseListeners();
  document.getElementById("currentYear").textContent = new Date().getFullYear();
});