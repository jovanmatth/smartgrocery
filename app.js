/**
 * SMART GROCERY & BUDGET SAFETY TRACKER - app.js (v3.0.0 Mobile PWA)
 * Asisten Belanja Presisi & Anti-Boncos untuk Siswa Rantau
 * Mengimplementasikan SRS F-01 sampai F-06 dengan presisi matematis dan arsitektur mobile native
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. STATE & STORAGE MANAGEMENT
  // =========================================================================

  const STORAGE_KEYS = {
    BUDGET: 'sg_budget_cap',
    CART: 'sg_cart_items',
    HISTORY: 'sg_history_sessions',
    PRICE_DB: 'sg_price_database',
    THEME: 'sg_theme_mode',
    SUPABASE_URL: 'sg_supabase_url',
    SUPABASE_KEY: 'sg_supabase_key'
  };

  const state = {
    budgetCap: 500000, // Default dompet siswa rantau Rp 500.000
    cart: [],
    history: [],
    priceDatabase: {}, // { "Beras Ramos": { name: "Beras Ramos", lastPrice: 70000, category: "Sembako & Pokok", unit: "kg", lastDate: "..." } }
    activeTab: 'cart', // 'cart', 'history', or 'budget'
    historySubtab: 'price', // 'price' or 'archive'
    editingItemId: null,
    discountType: 'percent', // 'percent' or 'nominal'
    theme: 'light',
    searchQuery: '',
    categoryFilter: 'ALL',
    supabase: null,
    isSupabaseOnline: false,
    realtimeChannel: null
  };

  // =========================================================================
  // 2. DOM ELEMENT REFERENCES
  // =========================================================================

  const elements = {
    // Theme Toggle
    themeToggle: document.getElementById('btn-theme-toggle'),
    themeIconSun: document.getElementById('theme-icon-sun'),
    themeIconMoon: document.getElementById('theme-icon-moon'),

    // Top Header & Cloud
    btnQuickCalc: document.getElementById('btn-quick-calc'),
    btnCloudSync: document.getElementById('btn-cloud-sync'),
    cloudStatusDot: document.getElementById('cloud-status-dot'),
    cloudStatusText: document.getElementById('cloud-status-text'),

    // Bottom Navigation Bar (Lucide Icons)
    navBtnCart: document.getElementById('nav-btn-cart'),
    navBtnHistory: document.getElementById('nav-btn-history'),
    navBtnBudget: document.getElementById('nav-btn-budget'),
    badgeCartCount: document.getElementById('badge-cart-count'),
    badgeHistoryCount: document.getElementById('badge-history-count'),
    badgeBudgetWarning: document.getElementById('badge-budget-warning'),

    // Views
    viewCart: document.getElementById('view-active-cart'),
    viewHistory: document.getElementById('view-history-db'),
    viewBudget: document.getElementById('view-budget-safety'),

    // Mobile Mini Trolley Header
    trolleyTotalPriceDisplay: document.getElementById('trolley-total-price-display'),
    trolleySafetyBadge: document.getElementById('trolley-safety-badge'),
    btnToggleFormDrawer: document.getElementById('btn-toggle-form-drawer'),
    btnCloseForm: document.getElementById('btn-close-form'),
    formItemContainer: document.getElementById('form-item-container'),

    // Item Form (F-01, F-02, F-03, F-04)
    formItem: document.getElementById('form-grocery-item'),
    formCardTitle: document.getElementById('form-card-title'),
    btnResetForm: document.getElementById('btn-reset-form'),
    itemEditId: document.getElementById('item-edit-id'),
    inputItemName: document.getElementById('input-item-name'),
    historyDatalist: document.getElementById('history-item-datalist'),
    selectItemCategory: document.getElementById('select-item-category'),
    selectItemUnit: document.getElementById('select-item-unit'),
    inputItemQty: document.getElementById('input-item-qty'),
    btnQtyMinus: document.getElementById('btn-qty-minus'),
    btnQtyPlus: document.getElementById('btn-qty-plus'),
    inputItemPrice: document.getElementById('input-item-price'),
    inputItemLastPrice: document.getElementById('input-item-last-price'),
    badgeAutoFilled: document.getElementById('badge-auto-filled'),

    // Discount Feature (F-03)
    discTypeBtns: document.querySelectorAll('.disc-type-btn'),
    discPercentContainer: document.getElementById('disc-percent-container'),
    discNominalContainer: document.getElementById('disc-nominal-container'),
    inputDiscountString: document.getElementById('input-discount-string'),
    inputDiscountNominal: document.getElementById('input-discount-nominal'),
    discountPresets: document.querySelectorAll('.discount-presets .preset-chip'),
    discountCalcBreakdown: document.getElementById('discount-calc-breakdown'),
    calcFormulaText: document.getElementById('calc-formula-text'),
    calcEffectivePercent: document.getElementById('calc-effective-percent'),
    calcSavingsPerUnit: document.getElementById('calc-savings-per-unit'),

    // Live Preview
    liveComparatorBadge: document.getElementById('live-comparator-badge'),
    liveUnitFinalPrice: document.getElementById('live-unit-final-price'),
    liveItemSubtotal: document.getElementById('live-item-subtotal'),
    liveComparatorDetail: document.getElementById('live-comparator-detail'),
    btnSubmitItem: document.getElementById('btn-submit-item'),
    btnSubmitText: document.getElementById('btn-submit-text'),
    btnCancelEdit: document.getElementById('btn-cancel-edit'),

    // Cart List
    searchCartInput: document.getElementById('search-cart-input'),
    filterCartCategory: document.getElementById('filter-cart-category'),
    cartItemsContainer: document.getElementById('cart-items-container'),
    emptyCartMessage: document.getElementById('empty-cart-message'),
    toolbarCartCount: document.getElementById('toolbar-cart-count'),
    toolbarPriceDiffSummary: document.getElementById('toolbar-price-diff-summary'),
    btnClearCart: document.getElementById('btn-clear-cart'),
    footerRawSubtotal: document.getElementById('footer-raw-subtotal'),
    footerSavingsTotal: document.getElementById('footer-savings-total'),
    footerGrandTotal: document.getElementById('footer-grand-total'),
    btnViewReceiptDraft: document.getElementById('btn-view-receipt-draft'),
    btnFinishShopping: document.getElementById('btn-finish-shopping'),

    // History View (F-06)
    dbTotalTransactions: document.getElementById('db-total-transactions'),
    dbTotalKnownItems: document.getElementById('db-total-known-items'),
    dbTotalAllTimeSpent: document.getElementById('db-total-all-time-spent'),
    subtabPriceDb: document.getElementById('subtab-price-db'),
    subtabSessionsArchive: document.getElementById('subtab-sessions-archive'),
    subviewPriceCatalog: document.getElementById('subview-price-catalog'),
    subviewSessionsArchive: document.getElementById('subview-sessions-archive'),
    searchPriceMaster: document.getElementById('search-price-master'),
    priceMasterCardsContainer: document.getElementById('price-master-cards-container'),
    emptyPriceNotice: document.getElementById('empty-price-notice'),
    historyTransactionsContainer: document.getElementById('history-transactions-container'),
    emptyHistoryNotice: document.getElementById('empty-history-notice'),
    btnExportData: document.getElementById('btn-export-data'),
    btnImportDataTrigger: document.getElementById('btn-import-data-trigger'),
    inputImportFile: document.getElementById('input-import-file'),

    // Budget Cap View (F-05)
    inputBudgetCap: document.getElementById('input-budget-cap'),
    btnSaveBudget: document.getElementById('btn-save-budget'),
    btnBudgetPresets: document.querySelectorAll('.btn-budget-preset'),
    budgetCard: document.getElementById('budget-safety-section'),
    budgetStatusText: document.getElementById('budget-status-text'),
    budgetPercentText: document.getElementById('budget-percent-text'),
    budgetProgressBar: document.getElementById('budget-progress-bar'),
    budgetAlertBanner: document.getElementById('budget-alert-banner'),
    budgetAlertTitle: document.getElementById('budget-alert-title'),
    budgetAlertDesc: document.getElementById('budget-alert-desc'),
    statTotalExpense: document.getElementById('stat-total-expense'),
    statItemsCount: document.getElementById('stat-items-count'),
    boxRemainingBudget: document.getElementById('box-remaining-budget'),
    labelRemainingBudget: document.getElementById('label-remaining-budget'),
    statRemainingBudget: document.getElementById('stat-remaining-budget'),
    statRemainingNote: document.getElementById('stat-remaining-note'),
    statTotalSaved: document.getElementById('stat-total-saved'),
    statDiscountRate: document.getElementById('stat-discount-rate'),
    categoryBarsContainer: document.getElementById('category-bars-container'),

    // Quick Calculator Modal
    modalQuickCalc: document.getElementById('modal-quick-calc'),
    btnCloseCalcModal: document.getElementById('btn-close-calc-modal'),
    calcModalPrice: document.getElementById('calc-modal-price'),
    calcModalDiscount: document.getElementById('calc-modal-discount'),
    calcModalFinalPrice: document.getElementById('calc-modal-final-price'),
    calcModalEffectivePct: document.getElementById('calc-modal-effective-pct'),
    calcModalSavedAmount: document.getElementById('calc-modal-saved-amount'),
    calcModalExplanation: document.getElementById('calc-modal-explanation'),
    btnUseInForm: document.getElementById('btn-use-in-form'),

    // Thermal Receipt Modal
    modalReceiptView: document.getElementById('modal-receipt-view'),
    btnCloseReceiptModal: document.getElementById('btn-close-receipt-modal'),
    receiptDate: document.getElementById('receipt-date'),
    receiptSessionId: document.getElementById('receipt-session-id'),
    receiptItemsTbody: document.getElementById('receipt-items-tbody'),
    receiptSubtotalOriginal: document.getElementById('receipt-subtotal-original'),
    receiptTotalSavings: document.getElementById('receipt-total-savings'),
    receiptGrandTotal: document.getElementById('receipt-grand-total'),
    receiptBudgetLimit: document.getElementById('receipt-budget-limit'),
    receiptWalletBalance: document.getElementById('receipt-wallet-balance'),
    receiptDiffStat: document.getElementById('receipt-diff-stat'),
    btnPrintReceipt: document.getElementById('btn-print-receipt'),
    btnDownloadReceiptText: document.getElementById('btn-download-receipt-text'),

    // Supabase Cloud Sync Modal
    modalSupabaseSync: document.getElementById('modal-supabase-sync'),
    btnCloseSupabaseModal: document.getElementById('btn-close-supabase-modal'),
    inputSupabaseUrl: document.getElementById('input-supabase-url'),
    inputSupabaseKey: document.getElementById('input-supabase-key'),
    supabaseConnectionStatus: document.getElementById('supabase-connection-status'),
    btnSaveConnectSupabase: document.getElementById('btn-save-connect-supabase'),
    btnDisconnectSupabase: document.getElementById('btn-disconnect-supabase'),

    // Toast Container
    toastContainer: document.getElementById('toast-container')
  };

  // =========================================================================
  // 3. CURRENCY & NUMBER UTILITIES (IDR)
  // =========================================================================

  function formatNumberIDR(num) {
    if (isNaN(num) || num === null || num === undefined) return '0';
    return Math.round(num).toLocaleString('id-ID');
  }

  function formatRupiah(num) {
    return 'Rp ' + formatNumberIDR(num);
  }

  function parseRupiahInput(value) {
    if (!value) return 0;
    const cleanStr = value.toString().replace(/[^0-9]/g, '');
    const num = parseInt(cleanStr, 10);
    return isNaN(num) ? 0 : num;
  }

  function attachRupiahMask(inputEl, onChangeCallback) {
    if (!inputEl) return;
    inputEl.addEventListener('input', (e) => {
      const rawVal = parseRupiahInput(e.target.value);
      if (rawVal === 0 && e.target.value.trim() === '') {
        e.target.value = '';
      } else {
        e.target.value = formatNumberIDR(rawVal);
      }
      if (onChangeCallback) onChangeCallback(rawVal);
    });
  }

  // =========================================================================
  // 4. F-03: TIERED DISCOUNT CALCULATOR ENGINE (Rumus Diskon Bertingkat)
  // =========================================================================

  /**
   * Menghitung diskon bertingkat / bertumpuk secara matematis:
   * Rumus: P_1 = P_0 * (1 - A/100)
   *        P_2 = P_1 * (1 - B/100)
   * @param {number} initialPrice
   * @param {string} discountStr (e.g. "50% + 20%", "25%")
   */
  function calculateTieredDiscount(initialPrice, discountStr) {
    if (!initialPrice || initialPrice <= 0) {
      return { finalPrice: 0, totalSavings: 0, effectivePercent: 0, steps: [] };
    }

    if (!discountStr || discountStr.trim() === '') {
      return { finalPrice: initialPrice, totalSavings: 0, effectivePercent: 0, steps: [] };
    }

    // Ekstrak angka persentase
    const matches = discountStr.match(/(\d+(\.\d+)?)/g);
    if (!matches || matches.length === 0) {
      return { finalPrice: initialPrice, totalSavings: 0, effectivePercent: 0, steps: [] };
    }

    let currentPrice = initialPrice;
    const steps = [];

    matches.forEach((rateStr, idx) => {
      const rate = parseFloat(rateStr);
      if (rate > 0) {
        const discountAmount = currentPrice * (rate / 100);
        const priceAfter = Math.max(0, currentPrice - discountAmount);
        steps.push({
          tier: idx + 1,
          rate: rate,
          startPrice: currentPrice,
          discountAmount: discountAmount,
          priceAfter: priceAfter
        });
        currentPrice = priceAfter;
      }
    });

    const finalPrice = Math.round(currentPrice);
    const totalSavings = Math.round(initialPrice - finalPrice);
    const effectivePercent = initialPrice > 0 ? (totalSavings / initialPrice) * 100 : 0;

    return {
      finalPrice,
      totalSavings,
      effectivePercent: parseFloat(effectivePercent.toFixed(1)),
      steps
    };
  }

  function calculateItemDiscount(basePrice, discType, discString, discNominal) {
    if (!basePrice || basePrice <= 0) {
      return { finalUnitPrice: 0, savingsPerUnit: 0, effectivePercent: 0, formulaSummary: 'Tanpa Diskon' };
    }

    if (discType === 'nominal') {
      const nominal = Math.min(basePrice, Math.max(0, discNominal || 0));
      const finalUnitPrice = basePrice - nominal;
      const effectivePercent = basePrice > 0 ? (nominal / basePrice) * 100 : 0;
      return {
        finalUnitPrice,
        savingsPerUnit: nominal,
        effectivePercent: parseFloat(effectivePercent.toFixed(1)),
        formulaSummary: nominal > 0 ? `Potongan ${formatRupiah(nominal)}` : 'Tanpa Potongan'
      };
    } else {
      const res = calculateTieredDiscount(basePrice, discString);
      let formula = 'Tanpa Diskon';
      if (res.steps.length > 0) {
        formula = res.steps.map(s => `${s.rate}%`).join(' + ');
      }
      return {
        finalUnitPrice: res.finalPrice,
        savingsPerUnit: res.totalSavings,
        effectivePercent: res.effectivePercent,
        formulaSummary: formula
      };
    }
  }

  // =========================================================================
  // 5. F-04: KOMPARATOR HARGA REALTIME VS BULAN LALU
  // =========================================================================

  function compareWithLastMonthPrice(currentUnitPrice, lastMonthPrice) {
    if (!lastMonthPrice || lastMonthPrice <= 0) {
      return {
        status: 'neutral',
        symbol: '⚪',
        text: 'Item Baru (Belum ada data bulan lalu)',
        diffAmount: 0,
        diffPercent: 0,
        badgeClass: 'neutral'
      };
    }

    const diff = currentUnitPrice - lastMonthPrice;
    const diffPercent = parseFloat(((diff / lastMonthPrice) * 100).toFixed(1));

    if (diff > 0) {
      return {
        status: 'up',
        symbol: '🔴 ↑',
        text: `Naik ${formatRupiah(diff)} (+${diffPercent}%) vs bln lalu (${formatRupiah(lastMonthPrice)})`,
        diffAmount: diff,
        diffPercent,
        badgeClass: 'up'
      };
    } else if (diff < 0) {
      return {
        status: 'down',
        symbol: '🟢 ↓',
        text: `Turun ${formatRupiah(Math.abs(diff))} (${diffPercent}%) vs bln lalu (${formatRupiah(lastMonthPrice)})`,
        diffAmount: diff,
        diffPercent,
        badgeClass: 'down'
      };
    } else {
      return {
        status: 'equal',
        symbol: '🟡 =',
        text: `Harga Stabil sama dengan bulan lalu (${formatRupiah(lastMonthPrice)})`,
        diffAmount: 0,
        diffPercent: 0,
        badgeClass: 'equal'
      };
    }
  }

  // =========================================================================
  // 6. F-02: LIVE CALCULATION ENGINE FORM INPUT
  // =========================================================================

  function updateFormLiveCalculation() {
    const rawPrice = parseRupiahInput(elements.inputItemPrice.value);
    const lastPrice = parseRupiahInput(elements.inputItemLastPrice.value);
    const qty = parseFloat(elements.inputItemQty.value) || 1;
    const unit = elements.selectItemUnit.value || 'pcs';

    let discResult;
    if (state.discountType === 'percent') {
      const discStr = elements.inputDiscountString.value.trim();
      discResult = calculateItemDiscount(rawPrice, 'percent', discStr, 0);
    } else {
      const discNominal = parseRupiahInput(elements.inputDiscountNominal.value);
      discResult = calculateItemDiscount(rawPrice, 'nominal', '', discNominal);
    }

    const finalUnitPrice = discResult.finalUnitPrice;
    const subtotal = Math.round(finalUnitPrice * qty);

    // Update Breakdown Box (F-03)
    if (discResult.savingsPerUnit > 0) {
      elements.discountCalcBreakdown.classList.remove('hidden');
      elements.calcFormulaText.textContent = discResult.formulaSummary;
      elements.calcEffectivePercent.textContent = `${discResult.effectivePercent}%`;
      elements.calcSavingsPerUnit.textContent = `${formatRupiah(discResult.savingsPerUnit)} / ${unit}`;
    } else {
      elements.discountCalcBreakdown.classList.add('hidden');
    }

    // Update Live Preview (F-02)
    elements.liveUnitFinalPrice.textContent = `${formatRupiah(finalUnitPrice)} / ${unit}`;
    elements.liveItemSubtotal.textContent = formatRupiah(subtotal);

    // Update Price Comparator Preview (F-04)
    const comp = compareWithLastMonthPrice(finalUnitPrice, lastPrice);
    elements.liveComparatorBadge.className = `price-comp-badge ${comp.badgeClass}`;
    elements.liveComparatorBadge.textContent = `${comp.symbol} ${comp.status === 'neutral' ? 'Item Baru' : (comp.status === 'up' ? 'Lebih Mahal' : (comp.status === 'down' ? 'Lebih Murah' : 'Stabil'))}`;
    
    if (lastPrice > 0) {
      elements.liveComparatorDetail.innerHTML = `
        <span class="comp-desc-text font-bold ${comp.badgeClass === 'up' ? 'text-danger' : (comp.badgeClass === 'down' ? 'text-success' : 'text-warning')}">
          ${comp.text}
        </span>
      `;
    } else {
      elements.liveComparatorDetail.innerHTML = `
        <span class="comp-desc-text">Harga bulan lalu kosong. Barang ini akan disimpan sebagai referensi baru.</span>
      `;
    }
  }

  // =========================================================================
  // 7. F-05: BUDGET SAFETY CAP ENGINE & VISUAL INDICATORS
  // =========================================================================

  function updateBudgetDashboard() {
    const budget = state.budgetCap;
    
    let totalExpense = 0;
    let totalOriginal = 0;
    let totalSaved = 0;
    let totalItems = state.cart.length;
    let totalUnits = 0;
    let totalDiffVsLastMonth = 0;
    let itemsWithLastMonthCount = 0;

    const categoryTotals = {};

    state.cart.forEach(item => {
      totalExpense += item.subtotal;
      totalOriginal += Math.round(item.unitPrice * item.qty);
      totalSaved += item.totalSavings;
      totalUnits += item.qty;

      // Category spending tracking
      const cat = item.category || 'Lainnya';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + item.subtotal;

      if (item.lastMonthPrice && item.lastMonthPrice > 0) {
        totalDiffVsLastMonth += (item.finalUnitPrice - item.lastMonthPrice) * item.qty;
        itemsWithLastMonthCount++;
      }
    });

    const remainingBudget = budget - totalExpense;
    const usagePercent = budget > 0 ? (totalExpense / budget) * 100 : 0;
    const clampedPercent = Math.min(100, Math.max(0, usagePercent));

    // Update Stat Values in Budget Tab
    elements.statTotalExpense.textContent = formatRupiah(totalExpense);
    elements.statItemsCount.textContent = `${totalItems} jenis barang (${totalUnits % 1 === 0 ? totalUnits : totalUnits.toFixed(1)} unit)`;
    elements.statTotalSaved.textContent = formatRupiah(totalSaved);
    
    const savedRate = totalOriginal > 0 ? ((totalSaved / totalOriginal) * 100).toFixed(1) : 0;
    elements.statDiscountRate.textContent = `Hemat ${savedRate}% dari total normal (${formatRupiah(totalOriginal)})`;

    // Sisa Budget Box
    if (remainingBudget >= 0) {
      elements.labelRemainingBudget.textContent = 'Sisa Dompet Tersedia';
      elements.statRemainingBudget.textContent = formatRupiah(remainingBudget);
      elements.statRemainingBudget.className = 'stat-value success';
      elements.statRemainingNote.textContent = 'Bisa belanja dengan aman & tenang';
    } else {
      elements.labelRemainingBudget.textContent = '🚨 OVER BUDGET / DEFISIT';
      elements.statRemainingBudget.textContent = `- ${formatRupiah(Math.abs(remainingBudget))}`;
      elements.statRemainingBudget.className = 'stat-value danger';
      elements.statRemainingNote.textContent = 'Kurangi barang troli sebelum ke kasir!';
    }

    // Visual Meter Progress Bar & Status
    elements.budgetPercentText.textContent = `${usagePercent.toFixed(1)}% Terpakai`;
    elements.budgetProgressBar.style.width = `${clampedPercent}%`;

    elements.budgetCard.classList.remove('warning-state', 'danger-state');
    elements.budgetProgressBar.classList.remove('safe', 'warning', 'danger');
    elements.budgetAlertBanner.classList.add('hidden');
    elements.budgetAlertBanner.classList.remove('warning', 'danger');

    // Mini trolley sticky bar update
    elements.trolleyTotalPriceDisplay.textContent = formatRupiah(totalExpense);

    if (usagePercent >= 100) {
      // 🔴 BAHAYA / OVER BUDGET (≥ 100%)
      elements.budgetCard.classList.add('danger-state');
      elements.budgetProgressBar.classList.add('danger');
      elements.budgetStatusText.innerHTML = '<span class="status-dot danger"></span> Status: 🚨 BAHAYA! Dompet Jebol!';
      
      elements.budgetAlertBanner.classList.remove('hidden');
      elements.budgetAlertBanner.classList.add('danger');
      elements.budgetAlertTitle.textContent = `🚨 PERINGATAN KERAS: OVER BUDGET (${formatRupiah(Math.abs(remainingBudget))})`;
      elements.budgetAlertDesc.textContent = `Tagihan kasir (${formatRupiah(totalExpense)}) sudah melampaui batas dompet (${formatRupiah(budget)}). Hapus atau kurangi barang dari troli!`;

      // Mini trolley header
      elements.trolleySafetyBadge.className = 'trolley-status-pill danger';
      elements.trolleySafetyBadge.innerHTML = `<span class="status-dot danger"></span> Over: -${formatRupiah(Math.abs(remainingBudget))}`;

      // Bottom nav warning dot
      elements.badgeBudgetWarning.classList.remove('hidden');
    } else if (usagePercent >= 75) {
      // 🟡 WASPADA (75% - 99%)
      elements.budgetCard.classList.add('warning-state');
      elements.budgetProgressBar.classList.add('warning');
      elements.budgetStatusText.innerHTML = '<span class="status-dot warning"></span> Status: ⚠️ WASPADA! Mendekati Limit';
      
      elements.budgetAlertBanner.classList.remove('hidden');
      elements.budgetAlertBanner.classList.add('warning');
      elements.budgetAlertTitle.textContent = `⚠️ Perhatian: Anggaran Sisa Sedikit (${formatRupiah(remainingBudget)})`;
      elements.budgetAlertDesc.textContent = `Anda sudah memakai ${usagePercent.toFixed(1)}% dari dompet. Cek kembali prioritas belanja.`;

      elements.trolleySafetyBadge.className = 'trolley-status-pill warning';
      elements.trolleySafetyBadge.innerHTML = `<span class="status-dot warning"></span> Sisa ${formatRupiah(remainingBudget)}`;

      elements.badgeBudgetWarning.classList.remove('hidden');
    } else {
      // 🟢 AMAN (< 75%)
      elements.budgetProgressBar.classList.add('safe');
      elements.budgetStatusText.innerHTML = '<span class="status-dot safe"></span> Status: Aman Terkendali';

      elements.trolleySafetyBadge.className = 'trolley-status-pill safe';
      elements.trolleySafetyBadge.innerHTML = `<span class="status-dot safe"></span> Sisa ${formatRupiah(remainingBudget)}`;

      elements.badgeBudgetWarning.classList.add('hidden');
    }

    // Update Footer Totals
    elements.footerRawSubtotal.textContent = formatRupiah(totalOriginal);
    elements.footerSavingsTotal.textContent = `- ${formatRupiah(totalSaved)}`;
    elements.footerGrandTotal.textContent = formatRupiah(totalExpense);
    elements.badgeCartCount.textContent = totalItems.toString();

    // Update Toolbar Stats
    elements.toolbarCartCount.textContent = `${totalItems} barang`;
    if (itemsWithLastMonthCount > 0) {
      if (totalDiffVsLastMonth > 0) {
        elements.toolbarPriceDiffSummary.className = 'summary-diff-pill text-danger';
        elements.toolbarPriceDiffSummary.textContent = `🔴 Inflasi vs Bln Lalu: +${formatRupiah(totalDiffVsLastMonth)}`;
      } else if (totalDiffVsLastMonth < 0) {
        elements.toolbarPriceDiffSummary.className = 'summary-diff-pill text-success';
        elements.toolbarPriceDiffSummary.textContent = `🟢 Lebih Murah vs Bln Lalu: -${formatRupiah(Math.abs(totalDiffVsLastMonth))}`;
      } else {
        elements.toolbarPriceDiffSummary.className = 'summary-diff-pill text-warning';
        elements.toolbarPriceDiffSummary.textContent = '🟡 Harga Stabil vs Bulan Lalu';
      }
    } else {
      elements.toolbarPriceDiffSummary.className = 'summary-diff-pill';
      elements.toolbarPriceDiffSummary.textContent = 'Membandingkan harga otomatis';
    }

    // Render Category Breakdown Bars
    renderCategoryBars(categoryTotals, totalExpense);
  }

  function renderCategoryBars(categoryTotals, totalExpense) {
    const container = elements.categoryBarsContainer;
    if (!container) return;
    container.innerHTML = '';

    const categories = Object.keys(categoryTotals);
    if (categories.length === 0 || totalExpense === 0) {
      container.innerHTML = `<p class="text-muted" style="font-size:0.74rem;">Belum ada alokasi belanja. Masukkan barang ke troli.</p>`;
      return;
    }

    categories.sort((a, b) => categoryTotals[b] - categoryTotals[a]);

    categories.forEach(cat => {
      const amount = categoryTotals[cat];
      const pct = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0;

      const item = document.createElement('div');
      item.className = 'cat-bar-item';
      item.innerHTML = `
        <div class="cat-bar-label-row">
          <span>${cat}</span>
          <span>${formatRupiah(amount)} (${pct}%)</span>
        </div>
        <div class="cat-bar-track">
          <div class="cat-bar-fill" style="width: ${pct}%;"></div>
        </div>
      `;
      container.appendChild(item);
    });
  }

  // =========================================================================
  // 8. CART RENDERING & OPERATIONS (Mobile Cards - NO TABLE)
  // =========================================================================

  function renderCartList() {
    const container = elements.cartItemsContainer;
    container.innerHTML = '';

    const filtered = state.cart.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(state.searchQuery.toLowerCase());
      const matchCat = state.categoryFilter === 'ALL' || item.category === state.categoryFilter;
      return matchSearch && matchCat;
    });

    if (filtered.length === 0) {
      if (state.cart.length === 0) {
        elements.emptyCartMessage.classList.remove('hidden');
        container.appendChild(elements.emptyCartMessage);
      } else {
        const noMatch = document.createElement('div');
        noMatch.className = 'empty-cart-state';
        noMatch.innerHTML = `
          <p>Tidak ada barang yang cocok dengan filter "${state.searchQuery}".</p>
        `;
        container.appendChild(noMatch);
      }
      updateBudgetDashboard();
      return;
    }

    elements.emptyCartMessage.classList.add('hidden');

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'cart-item-row';
      card.dataset.id = item.id;

      const comp = compareWithLastMonthPrice(item.finalUnitPrice, item.lastMonthPrice);
      const hasDiscount = item.savingsPerUnit > 0;

      card.innerHTML = `
        <div class="cart-item-top">
          <div class="cart-item-title-col">
            <input type="checkbox" ${item.checked ? 'checked' : ''} data-id="${item.id}" class="check-item-trolley" title="Tandai sudah masuk troli">
            <div class="item-title-meta">
              <span class="item-name ${item.checked ? 'text-muted' : ''}" style="${item.checked ? 'text-decoration: line-through;' : ''}">
                ${item.name}
              </span>
              <div class="item-meta-pills">
                <span class="item-category-pill">${item.category}</span>
                <span class="price-comp-badge ${comp.badgeClass}" title="${comp.text}">
                  ${comp.symbol} ${comp.status === 'up' ? `+${formatRupiah(comp.diffAmount)}` : (comp.status === 'down' ? `-${formatRupiah(Math.abs(comp.diffAmount))}` : (comp.status === 'equal' ? 'Sama' : 'Baru'))}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="cart-item-pricing-row">
          ${hasDiscount ? `<span class="original-price-strike">${formatRupiah(item.unitPrice)}</span>` : ''}
          <span class="final-unit-price">${formatRupiah(item.finalUnitPrice)} / ${item.unit}</span>
          ${hasDiscount ? `<span class="promo-tag-pill">Promo: ${item.discountString || formatRupiah(item.discountNominal)} (-${formatRupiah(item.savingsPerUnit)})</span>` : ''}
          ${item.lastMonthPrice > 0 ? `<span class="text-muted" style="font-size:0.72rem;">(Bln lalu: ${formatRupiah(item.lastMonthPrice)})</span>` : ''}
        </div>

        <div class="cart-item-bottom">
          <div class="item-qty-actions">
            <button class="btn-mini-step btn-dec" data-id="${item.id}" title="Kurangi Qty">-</button>
            <span class="item-qty-display">${item.qty} ${item.unit}</span>
            <button class="btn-mini-step btn-inc" data-id="${item.id}" title="Tambah Qty">+</button>
          </div>
          <div class="cart-item-total-col">
            <span class="cart-item-subtotal">${formatRupiah(item.subtotal)}</span>
            <div class="item-row-ops">
              <button class="btn-item-op edit" data-id="${item.id}">Edit</button>
              <span>&bull;</span>
              <button class="btn-item-op delete" data-id="${item.id}">Hapus</button>
            </div>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    updateBudgetDashboard();
    saveCartToStorage();
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    const name = elements.inputItemName.value.trim();
    if (!name) {
      showToast('Nama barang wajib diisi!', 'warning');
      return;
    }

    const category = elements.selectItemCategory.value;
    const unit = elements.selectItemUnit.value;
    const qty = parseFloat(elements.inputItemQty.value) || 1;
    const unitPrice = parseRupiahInput(elements.inputItemPrice.value);
    const lastMonthPrice = parseRupiahInput(elements.inputItemLastPrice.value);

    if (unitPrice <= 0) {
      showToast('Harga satuan harus lebih dari Rp 0!', 'warning');
      return;
    }

    let discType = state.discountType;
    let discString = elements.inputDiscountString.value.trim();
    let discNominal = parseRupiahInput(elements.inputDiscountNominal.value);

    const discResult = calculateItemDiscount(unitPrice, discType, discString, discNominal);
    const finalUnitPrice = discResult.finalUnitPrice;
    const subtotal = Math.round(finalUnitPrice * qty);
    const savingsPerUnit = discResult.savingsPerUnit;
    const totalSavings = Math.round(savingsPerUnit * qty);

    const editId = elements.itemEditId.value;

    if (editId) {
      const idx = state.cart.findIndex(i => i.id === editId);
      if (idx !== -1) {
        state.cart[idx] = {
          ...state.cart[idx],
          name,
          category,
          unit,
          qty,
          unitPrice,
          lastMonthPrice,
          discountType: discType,
          discountString: discType === 'percent' ? discString : '',
          discountNominal: discType === 'nominal' ? discNominal : 0,
          finalUnitPrice,
          subtotal,
          savingsPerUnit,
          totalSavings
        };
        pushCartItemToCloud(state.cart[idx]);
        showToast(`Berhasil memperbarui "${name}"`, 'success');
      }
      resetItemForm();
    } else {
      const newItem = {
        id: 'item_' + Date.now(),
        name,
        category,
        unit,
        qty,
        unitPrice,
        lastMonthPrice,
        discountType: discType,
        discountString: discType === 'percent' ? discString : '',
        discountNominal: discType === 'nominal' ? discNominal : 0,
        finalUnitPrice,
        subtotal,
        savingsPerUnit,
        totalSavings,
        checked: false
      };

      state.cart.unshift(newItem);
      pushCartItemToCloud(newItem);
      showToast(`"${name}" ditambahkan ke troli`, 'success');

      recordItemPriceInMemory(name, category, unit, finalUnitPrice);
      resetItemForm();
    }

    renderCartList();
  }

  function editCartItem(id) {
    const item = state.cart.find(i => i.id === id);
    if (!item) return;

    // Ensure form is open
    elements.formItemContainer.classList.remove('collapsed');

    elements.itemEditId.value = item.id;
    elements.inputItemName.value = item.name;
    elements.selectItemCategory.value = item.category;
    elements.selectItemUnit.value = item.unit;
    elements.inputItemQty.value = item.qty;
    elements.inputItemPrice.value = formatNumberIDR(item.unitPrice);
    elements.inputItemLastPrice.value = item.lastMonthPrice ? formatNumberIDR(item.lastMonthPrice) : '';

    if (item.discountType === 'nominal') {
      switchDiscountType('nominal');
      elements.inputDiscountNominal.value = formatNumberIDR(item.discountNominal);
    } else {
      switchDiscountType('percent');
      elements.inputDiscountString.value = item.discountString || '';
    }

    elements.formCardTitle.textContent = `Edit "${item.name}"`;
    elements.btnSubmitText.textContent = 'Simpan Perubahan';
    elements.btnCancelEdit.classList.remove('hidden');

    updateFormLiveCalculation();
    elements.formItemContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function deleteCartItem(id) {
    const item = state.cart.find(i => i.id === id);
    const name = item ? item.name : 'Barang';
    state.cart = state.cart.filter(i => i.id !== id);
    deleteCartItemFromCloud(id);
    renderCartList();
    showToast(`"${name}" dihapus dari keranjang.`, 'info');
  }

  function updateItemQty(id, delta) {
    const item = state.cart.find(i => i.id === id);
    if (!item) return;

    let newQty = item.qty + delta;
    if (newQty <= 0) {
      deleteCartItem(id);
      return;
    }

    newQty = Math.round(newQty * 10) / 10;
    item.qty = newQty;
    item.subtotal = Math.round(item.finalUnitPrice * newQty);
    item.totalSavings = Math.round(item.savingsPerUnit * newQty);

    pushCartItemToCloud(item);
    renderCartList();
  }

  function toggleItemChecked(id, isChecked) {
    const item = state.cart.find(i => i.id === id);
    if (item) {
      item.checked = isChecked;
      saveCartToStorage();
      pushCartItemToCloud(item);
    }
  }

  function resetItemForm() {
    elements.itemEditId.value = '';
    elements.formItem.reset();
    elements.inputItemQty.value = 1;
    elements.formCardTitle.textContent = 'Tambah Barang Belanjaan';
    elements.btnSubmitText.textContent = 'Masukkan ke Keranjang';
    elements.btnCancelEdit.classList.add('hidden');
    elements.badgeAutoFilled.classList.add('hidden');
    switchDiscountType('percent');
    updateFormLiveCalculation();
  }

  function switchDiscountType(type) {
    state.discountType = type;
    elements.discTypeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });

    if (type === 'percent') {
      elements.discPercentContainer.classList.remove('hidden');
      elements.discNominalContainer.classList.add('hidden');
    } else {
      elements.discPercentContainer.classList.add('hidden');
      elements.discNominalContainer.classList.remove('hidden');
    }
    updateFormLiveCalculation();
  }

  // =========================================================================
  // 9. F-06: MASTER DATABASE HARGA & AUTO-COMPLETE DARI HISTORI
  // =========================================================================

  function recordItemPriceInMemory(name, category, unit, finalPrice) {
    if (!name || finalPrice <= 0) return;
    state.priceDatabase[name.trim()] = {
      name: name.trim(),
      category: category || 'Sembako & Pokok',
      unit: unit || 'pcs',
      lastPrice: finalPrice,
      lastDate: new Date().toISOString()
    };
    savePriceDbToStorage();
    populateHistoryDatalist();
    renderPriceMasterCards();
  }

  function populateHistoryDatalist() {
    const datalist = elements.historyDatalist;
    if (!datalist) return;
    datalist.innerHTML = '';

    Object.keys(state.priceDatabase).forEach(itemName => {
      const option = document.createElement('option');
      option.value = itemName;
      datalist.appendChild(option);
    });
  }

  function handleItemNameInput(e) {
    const query = e.target.value.trim();
    if (!query) {
      elements.badgeAutoFilled.classList.add('hidden');
      return;
    }

    const matchedKey = Object.keys(state.priceDatabase).find(
      k => k.toLowerCase() === query.toLowerCase()
    );

    if (matchedKey) {
      const record = state.priceDatabase[matchedKey];
      if (record && record.lastPrice > 0) {
        elements.inputItemLastPrice.value = formatNumberIDR(record.lastPrice);
        if (record.category) elements.selectItemCategory.value = record.category;
        if (record.unit) elements.selectItemUnit.value = record.unit;
        elements.badgeAutoFilled.classList.remove('hidden');
        elements.badgeAutoFilled.textContent = `⚡ Auto: Rp ${formatNumberIDR(record.lastPrice)}`;
        updateFormLiveCalculation();
        return;
      }
    }
    elements.badgeAutoFilled.classList.add('hidden');
  }

  // =========================================================================
  // 10. F-06: RIWAYAT TRANSAKSI & SELESAIKAN BELANJA (Checkout Bulanan)
  // =========================================================================

  function finishCurrentShoppingSession() {
    if (state.cart.length === 0) {
      showToast('Keranjang masih kosong, tidak ada yang perlu disimpan!', 'warning');
      return;
    }

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let totalExpense = 0;
    let totalOriginal = 0;
    let totalSavings = 0;

    state.cart.forEach(item => {
      totalExpense += item.subtotal;
      totalOriginal += Math.round(item.unitPrice * item.qty);
      totalSavings += item.totalSavings;

      recordItemPriceInMemory(item.name, item.category, item.unit, item.finalUnitPrice);
    });

    const sessionId = 'SG-' + String(state.history.length + 1).padStart(3, '0') + '-' + Date.now().toString().slice(-4);

    const newSession = {
      id: sessionId,
      date: dateFormatted,
      timestamp: now.getTime(),
      budgetCap: state.budgetCap,
      totalExpense,
      totalOriginal,
      totalSavings,
      remainingWallet: state.budgetCap - totalExpense,
      items: JSON.parse(JSON.stringify(state.cart))
    };

    state.history.unshift(newSession);
    saveHistoryToStorage();

    // Buka struk digital
    openReceiptModal(newSession);

    // Kosongkan keranjang
    state.cart = [];
    saveCartToStorage();
    renderCartList();
    renderHistorySection();

    showToast('🎉 Transaksi tersimpan ke Riwayat & Database harga diperbarui!', 'success');
  }

  function renderHistorySection() {
    elements.dbTotalTransactions.textContent = state.history.length.toString();
    elements.dbTotalKnownItems.textContent = Object.keys(state.priceDatabase).length.toString();
    elements.badgeHistoryCount.textContent = state.history.length.toString();

    let allTimeSpent = 0;
    state.history.forEach(s => {
      allTimeSpent += s.totalExpense;
    });
    elements.dbTotalAllTimeSpent.textContent = formatRupiah(allTimeSpent);

    // Render Archive Sessions
    const container = elements.historyTransactionsContainer;
    if (container) {
      container.innerHTML = '';

      if (state.history.length === 0) {
        elements.emptyHistoryNotice.classList.remove('hidden');
        container.appendChild(elements.emptyHistoryNotice);
      } else {
        elements.emptyHistoryNotice.classList.add('hidden');

        state.history.forEach(session => {
          const card = document.createElement('div');
          card.className = 'history-session-card';

          const isOver = session.remainingWallet < 0;

          card.innerHTML = `
            <div class="hs-head">
              <span class="hs-date">${session.date}</span>
              <span class="hs-id">${session.id}</span>
            </div>
            
            <div class="hs-body">
              <div>
                <span class="stat-label">Total Tagihan Kasir</span>
                <span class="hs-total">${formatRupiah(session.totalExpense)}</span>
              </div>
              <div style="text-align: right;">
                <span class="price-comp-badge ${isOver ? 'up' : 'down'}">
                  ${isOver ? '🚨 Over Budget' : '✅ Sesuai Budget'}
                </span>
                <span class="stat-detail" style="margin-top:2px;">${session.items.length} jenis barang</span>
              </div>
            </div>

            <div class="hs-actions">
              <button class="btn-view-hist-receipt" data-id="${session.id}">
                🧾 Buka Struk Digital
              </button>
              <button class="btn-delete-history" data-id="${session.id}" title="Hapus Sesi Ini">
                ✕
              </button>
            </div>
          `;

          container.appendChild(card);
        });
      }
    }

    renderPriceMasterCards();
  }

  function renderPriceMasterCards() {
    const container = elements.priceMasterCardsContainer;
    if (!container) return;
    container.innerHTML = '';

    const search = (elements.searchPriceMaster ? elements.searchPriceMaster.value : '').toLowerCase().trim();
    const keys = Object.keys(state.priceDatabase).filter(key => {
      if (!search) return true;
      return key.toLowerCase().includes(search) || 
             (state.priceDatabase[key].category || '').toLowerCase().includes(search);
    });

    if (keys.length === 0) {
      if (elements.emptyPriceNotice) {
        elements.emptyPriceNotice.classList.remove('hidden');
        if (search) {
          elements.emptyPriceNotice.innerHTML = `<p>Tidak ada barang yang cocok dengan "${search}".</p>`;
        } else {
          elements.emptyPriceNotice.innerHTML = `<p>Belum ada data barang tersimpan. Selesaikan belanja di kasir untuk otomatis mengindeks harga barang!</p>`;
        }
        container.appendChild(elements.emptyPriceNotice);
      }
      return;
    }

    if (elements.emptyPriceNotice) elements.emptyPriceNotice.classList.add('hidden');

    keys.forEach(key => {
      const item = state.priceDatabase[key];
      const dateStr = item.lastDate ? new Date(item.lastDate).toLocaleDateString('id-ID') : '-';

      const card = document.createElement('div');
      card.className = 'price-master-card';
      card.innerHTML = `
        <div class="pm-info">
          <span class="pm-name">${item.name}</span>
          <span class="pm-meta">${item.category} &bull; ${item.unit} &bull; Tgl: ${dateStr}</span>
        </div>
        <div class="pm-price-wrap">
          <span class="pm-price">${formatRupiah(item.lastPrice)}</span>
          <button class="btn-use-item-fast" data-name="${item.name}">+ Ke Troli</button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function useItemFastInCart(itemName) {
    const record = state.priceDatabase[itemName];
    if (record) {
      elements.inputItemName.value = record.name;
      elements.selectItemCategory.value = record.category;
      elements.selectItemUnit.value = record.unit;
      elements.inputItemPrice.value = formatNumberIDR(record.lastPrice);
      elements.inputItemLastPrice.value = formatNumberIDR(record.lastPrice);
      updateFormLiveCalculation();
      
      switchTab('cart');
      
      elements.formItemContainer.classList.remove('collapsed');
      elements.formItemContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast(`Barang "${record.name}" dimuat ke form!`, 'success');
    }
  }

  // =========================================================================
  // 11. DIGITAL THERMAL RECEIPT MODAL (Struk Anti Pudar)
  // =========================================================================

  function openReceiptModal(sessionData) {
    const isDraft = !sessionData;
    const session = sessionData || {
      id: 'DRAFT-' + Date.now().toString().slice(-4),
      date: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      budgetCap: state.budgetCap,
      items: state.cart
    };

    let totalExpense = 0;
    let totalOriginal = 0;
    let totalSavings = 0;
    let diffVsLastMonth = 0;
    let diffItemsCount = 0;

    session.items.forEach(item => {
      totalExpense += item.subtotal;
      totalOriginal += Math.round(item.unitPrice * item.qty);
      totalSavings += item.totalSavings;
      if (item.lastMonthPrice && item.lastMonthPrice > 0) {
        diffVsLastMonth += (item.finalUnitPrice - item.lastMonthPrice) * item.qty;
        diffItemsCount++;
      }
    });

    elements.receiptDate.textContent = session.date;
    elements.receiptSessionId.textContent = session.id + (isDraft ? ' (DRAFT)' : '');
    elements.receiptSubtotalOriginal.textContent = formatRupiah(totalOriginal);
    elements.receiptTotalSavings.textContent = `- ${formatRupiah(totalSavings)}`;
    elements.receiptGrandTotal.textContent = formatRupiah(totalExpense);
    elements.receiptBudgetLimit.textContent = formatRupiah(session.budgetCap || state.budgetCap);

    const remaining = (session.budgetCap || state.budgetCap) - totalExpense;
    if (remaining >= 0) {
      elements.receiptWalletBalance.textContent = `Aman (+${formatRupiah(remaining)})`;
      elements.receiptWalletBalance.style.color = '#10b981';
    } else {
      elements.receiptWalletBalance.textContent = `DEFISIT (-${formatRupiah(Math.abs(remaining))})`;
      elements.receiptWalletBalance.style.color = '#ef4444';
    }

    if (diffItemsCount > 0) {
      if (diffVsLastMonth > 0) {
        elements.receiptDiffStat.textContent = `Inflasi (+${formatRupiah(diffVsLastMonth)}) vs bulan lalu`;
        elements.receiptDiffStat.style.color = '#ef4444';
      } else if (diffVsLastMonth < 0) {
        elements.receiptDiffStat.textContent = `Lebih Hemat (-${formatRupiah(Math.abs(diffVsLastMonth))}) vs bulan lalu`;
        elements.receiptDiffStat.style.color = '#10b981';
      } else {
        elements.receiptDiffStat.textContent = `Stabil setara bulan lalu`;
        elements.receiptDiffStat.style.color = '#f59e0b';
      }
    } else {
      elements.receiptDiffStat.textContent = `Belum ada komparasi historis`;
      elements.receiptDiffStat.style.color = '#64748b';
    }

    const tbody = elements.receiptItemsTbody;
    tbody.innerHTML = '';

    session.items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'receipt-item-row-print';
      row.innerHTML = `
        <div style="flex:1;">
          <div>${item.name}</div>
          <div style="font-size:0.68rem; color:#666;">
            ${item.qty} ${item.unit} &times; ${formatRupiah(item.finalUnitPrice)}
            ${item.savingsPerUnit > 0 ? `(Disc: ${item.discountString || formatRupiah(item.discountNominal)})` : ''}
          </div>
        </div>
        <div style="font-weight:700;">
          ${formatRupiah(item.subtotal)}
        </div>
      `;
      tbody.appendChild(row);
    });

    elements.modalReceiptView.classList.remove('hidden');
  }

  function downloadReceiptAsText() {
    const text = elements.modalReceiptView.querySelector('.thermal-receipt').innerText;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Struk_Belanja_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('Teks struk berhasil diunduh!', 'success');
  }

  // =========================================================================
  // 12. QUICK CALCULATOR MODAL (F-03 Utility)
  // =========================================================================

  function openQuickCalcModal() {
    elements.calcModalPrice.value = '';
    elements.calcModalDiscount.value = '50% + 20%';
    updateQuickCalcModal();
    elements.modalQuickCalc.classList.remove('hidden');
    elements.calcModalPrice.focus();
  }

  function updateQuickCalcModal() {
    const price = parseRupiahInput(elements.calcModalPrice.value);
    const discStr = elements.calcModalDiscount.value.trim();

    const res = calculateTieredDiscount(price, discStr);

    elements.calcModalFinalPrice.textContent = formatRupiah(res.finalPrice);
    elements.calcModalEffectivePct.textContent = `${res.effectivePercent}%`;
    elements.calcModalSavedAmount.textContent = formatRupiah(res.totalSavings);

    if (res.steps.length > 1) {
      const rates = res.steps.map(s => `${s.rate}%`).join(' + ');
      elements.calcModalExplanation.innerHTML = `
        Diskon bertingkat <strong>${rates}</strong>: harga mula-mula dipotong ${res.steps[0].rate}%, 
        lalu sisanya dipotong ${res.steps[1].rate}%. Diskon efektif adalah <strong>${res.effectivePercent}%</strong>, BUKAN ${res.steps.reduce((acc, s) => acc + s.rate, 0)}%!
      `;
    } else if (res.steps.length === 1) {
      elements.calcModalExplanation.textContent = `Diskon tunggal ${res.steps[0].rate}%. Potongan harga langsung sebesar ${formatRupiah(res.totalSavings)}.`;
    } else {
      elements.calcModalExplanation.textContent = `Masukkan harga rak dan rumus diskon (misal: "50% + 20%").`;
    }
  }

  function useQuickCalcInForm() {
    const price = parseRupiahInput(elements.calcModalPrice.value);
    const discStr = elements.calcModalDiscount.value.trim();

    if (price > 0) {
      elements.inputItemPrice.value = formatNumberIDR(price);
      elements.inputDiscountString.value = discStr;
      switchDiscountType('percent');
      updateFormLiveCalculation();
      elements.modalQuickCalc.classList.add('hidden');
      
      switchTab('cart');
      elements.formItemContainer.classList.remove('collapsed');
      showToast('Hasil kalkulator diskon berhasil diterapkan ke form!', 'success');
    } else {
      showToast('Masukkan harga label di rak terlebih dahulu!', 'warning');
    }
  }

  // =========================================================================
  // 13. VIEW & NAVIGATION SWITCHING (Bottom Navigation Bar)
  // =========================================================================

  function switchTab(tabName) {
    state.activeTab = tabName;

    elements.viewCart.classList.toggle('active', tabName === 'cart');
    elements.viewHistory.classList.toggle('active', tabName === 'history');
    elements.viewBudget.classList.toggle('active', tabName === 'budget');

    elements.navBtnCart.classList.toggle('active', tabName === 'cart');
    elements.navBtnHistory.classList.toggle('active', tabName === 'history');
    elements.navBtnBudget.classList.toggle('active', tabName === 'budget');

    if (tabName === 'history') {
      renderHistorySection();
    } else if (tabName === 'budget') {
      updateBudgetDashboard();
    }
  }

  function switchHistorySubtab(subtab) {
    state.historySubtab = subtab;
    if (subtab === 'price') {
      elements.subtabPriceDb.classList.add('active');
      elements.subtabSessionsArchive.classList.remove('active');
      elements.subviewPriceCatalog.classList.remove('hidden');
      elements.subviewSessionsArchive.classList.add('hidden');
      renderPriceMasterCards();
    } else {
      elements.subtabSessionsArchive.classList.add('active');
      elements.subtabPriceDb.classList.remove('active');
      elements.subviewSessionsArchive.classList.remove('hidden');
      elements.subviewPriceCatalog.classList.add('hidden');
    }
  }

  // =========================================================================
  // 14. SUPABASE REALTIME CLOUD INTEGRATION
  // =========================================================================

  function initSupabaseClient(url, key) {
    if (!url || !key || typeof window.supabase === 'undefined') {
      updateSupabaseUIStatus(false, 'Mode Offline (LocalStorage Lokal)');
      return false;
    }

    try {
      state.supabase = window.supabase.createClient(url.trim(), key.trim());
      state.isSupabaseOnline = true;
      updateSupabaseUIStatus(true, '🟢 Terhubung Cloud (100% Realtime)');
      subscribeSupabaseRealtime();
      syncInitialDataFromCloud();
      return true;
    } catch (err) {
      console.error('Gagal inisialisasi Supabase:', err);
      updateSupabaseUIStatus(false, '❌ Gagal Terhubung: ' + err.message);
      return false;
    }
  }

  function updateSupabaseUIStatus(isOnline, statusMessage) {
    state.isSupabaseOnline = isOnline;
    if (elements.cloudStatusDot) {
      elements.cloudStatusDot.className = `cloud-indicator-dot ${isOnline ? 'online' : 'offline'}`;
    }
    if (elements.cloudStatusText) {
      elements.cloudStatusText.textContent = isOnline ? 'Realtime 100%' : 'Cloud';
    }
    if (elements.supabaseConnectionStatus) {
      elements.supabaseConnectionStatus.innerHTML = `
        <span class="status-dot ${isOnline ? 'safe' : ''}" style="${isOnline ? '' : 'background:#94a3b8;'}"></span> ${statusMessage}
      `;
    }
  }

  function subscribeSupabaseRealtime() {
    if (!state.supabase) return;

    if (state.realtimeChannel) {
      state.supabase.removeChannel(state.realtimeChannel);
    }

    state.realtimeChannel = state.supabase
      .channel('smartgrocery_realtime_broadcast')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cart_items' },
        (payload) => handleRealtimeCartChange(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budget_settings' },
        (payload) => handleRealtimeBudgetChange(payload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Supabase Realtime Channel aktif!');
        }
      });
  }

  function handleRealtimeCartChange(payload) {
    const { eventType, new: newRec, old: oldRec } = payload;
    if (eventType === 'INSERT') {
      if (!state.cart.some(i => i.id === newRec.id)) {
        state.cart.unshift({
          id: newRec.id,
          name: newRec.name,
          category: newRec.category,
          unit: newRec.unit,
          qty: parseFloat(newRec.qty),
          unitPrice: parseFloat(newRec.unit_price),
          lastMonthPrice: parseFloat(newRec.last_month_price || 0),
          discountType: newRec.discount_type,
          discountString: newRec.discount_string,
          discountNominal: parseFloat(newRec.discount_nominal || 0),
          finalUnitPrice: parseFloat(newRec.final_unit_price),
          subtotal: parseFloat(newRec.subtotal),
          savingsPerUnit: parseFloat(newRec.savings_per_unit || 0),
          totalSavings: parseFloat(newRec.total_savings || 0),
          checked: !!newRec.checked
        });
        saveCartToStorage();
        renderCartList();
      }
    } else if (eventType === 'UPDATE') {
      const idx = state.cart.findIndex(i => i.id === newRec.id);
      if (idx !== -1) {
        state.cart[idx] = {
          ...state.cart[idx],
          name: newRec.name,
          category: newRec.category,
          unit: newRec.unit,
          qty: parseFloat(newRec.qty),
          unitPrice: parseFloat(newRec.unit_price),
          lastMonthPrice: parseFloat(newRec.last_month_price || 0),
          discountType: newRec.discount_type,
          discountString: newRec.discount_string,
          discountNominal: parseFloat(newRec.discount_nominal || 0),
          finalUnitPrice: parseFloat(newRec.final_unit_price),
          subtotal: parseFloat(newRec.subtotal),
          savingsPerUnit: parseFloat(newRec.savings_per_unit || 0),
          totalSavings: parseFloat(newRec.total_savings || 0),
          checked: !!newRec.checked
        };
        saveCartToStorage();
        renderCartList();
      }
    } else if (eventType === 'DELETE') {
      state.cart = state.cart.filter(i => i.id !== oldRec.id);
      saveCartToStorage();
      renderCartList();
    }
  }

  function handleRealtimeBudgetChange(payload) {
    if (payload.new && payload.new.budget_cap) {
      state.budgetCap = parseFloat(payload.new.budget_cap);
      elements.inputBudgetCap.value = formatNumberIDR(state.budgetCap);
      saveBudgetToStorage();
      updateBudgetDashboard();
    }
  }

  async function syncInitialDataFromCloud() {
    if (!state.supabase) return;

    try {
      const { data: cloudCart, error: errCart } = await state.supabase.from('cart_items').select('*');
      if (!errCart && cloudCart) {
        const cleanCloudCart = cloudCart.filter(c => !c.id.startsWith('item_demo_'));
        state.cart = cleanCloudCart.map(c => ({
          id: c.id,
          name: c.name,
          category: c.category,
          unit: c.unit,
          qty: parseFloat(c.qty),
          unitPrice: parseFloat(c.unit_price),
          lastMonthPrice: parseFloat(c.last_month_price || 0),
          discountType: c.discount_type,
          discountString: c.discount_string,
          discountNominal: parseFloat(c.discount_nominal || 0),
          finalUnitPrice: parseFloat(c.final_unit_price),
          subtotal: parseFloat(c.subtotal),
          savingsPerUnit: parseFloat(c.savings_per_unit || 0),
          totalSavings: parseFloat(c.total_savings || 0),
          checked: !!c.checked
        }));
        saveCartToStorage();
        renderCartList();
      }

      const { data: bData } = await state.supabase.from('budget_settings').select('*').limit(1);
      if (bData && bData.length > 0) {
        state.budgetCap = parseFloat(bData[0].budget_cap);
        elements.inputBudgetCap.value = formatNumberIDR(state.budgetCap);
        saveBudgetToStorage();
        updateBudgetDashboard();
      }
    } catch (e) {
      console.warn('Sync cloud warning:', e);
    }
  }

  async function pushCartItemToCloud(item) {
    if (!state.supabase || !state.isSupabaseOnline) return;
    try {
      await state.supabase.from('cart_items').upsert({
        id: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        qty: item.qty,
        unit_price: item.unitPrice,
        last_month_price: item.lastMonthPrice || 0,
        discount_type: item.discountType,
        discount_string: item.discountString || '',
        discount_nominal: item.discountNominal || 0,
        final_unit_price: item.finalUnitPrice,
        subtotal: item.subtotal,
        savings_per_unit: item.savingsPerUnit || 0,
        total_savings: item.totalSavings || 0,
        checked: item.checked || false,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error push cart item to cloud:', e);
    }
  }

  async function deleteCartItemFromCloud(id) {
    if (!state.supabase || !state.isSupabaseOnline) return;
    try {
      await state.supabase.from('cart_items').delete().eq('id', id);
    } catch (e) {
      console.error('Error delete item from cloud:', e);
    }
  }

  async function pushBudgetToCloud(val) {
    if (!state.supabase || !state.isSupabaseOnline) return;
    try {
      await state.supabase.from('budget_settings').upsert({
        id: 'primary_budget',
        budget_cap: val,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error push budget to cloud:', e);
    }
  }

  // =========================================================================
  // 15. THEME & TOAST ALERTS
  // =========================================================================

  function setTheme(t) {
    state.theme = t;
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(STORAGE_KEYS.THEME, t);
    if (t === 'dark') {
      elements.themeIconSun.classList.remove('hidden');
      elements.themeIconMoon.classList.add('hidden');
    } else {
      elements.themeIconSun.classList.add('hidden');
      elements.themeIconMoon.classList.remove('hidden');
    }
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'danger') icon = '🚨';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 250ms ease';
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  // =========================================================================
  // 16. LOCAL STORAGE PERSISTENCE
  // =========================================================================

  function saveBudgetToStorage() {
    localStorage.setItem(STORAGE_KEYS.BUDGET, state.budgetCap.toString());
  }

  function saveCartToStorage() {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(state.cart));
  }

  function saveHistoryToStorage() {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
  }

  function savePriceDbToStorage() {
    localStorage.setItem(STORAGE_KEYS.PRICE_DB, JSON.stringify(state.priceDatabase));
  }

  function loadAllFromStorage() {
    try {
      const b = localStorage.getItem(STORAGE_KEYS.BUDGET);
      if (b) state.budgetCap = parseInt(b, 10) || 500000;
      elements.inputBudgetCap.value = formatNumberIDR(state.budgetCap);

      const c = localStorage.getItem(STORAGE_KEYS.CART);
      if (c) {
        state.cart = JSON.parse(c) || [];
      } else {
        state.cart = [];
      }

      const h = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (h) state.history = JSON.parse(h) || [];

      const p = localStorage.getItem(STORAGE_KEYS.PRICE_DB);
      if (p) state.priceDatabase = JSON.parse(p) || {};

      const t = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
      setTheme(t);
    } catch (e) {
      console.error('Error loading localStorage:', e);
    }
  }

  function exportDataJSON() {
    const backup = {
      budgetCap: state.budgetCap,
      cart: state.cart,
      history: state.history,
      priceDatabase: state.priceDatabase,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SmartGrocery_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('Cadangan data berhasil diekspor!', 'success');
  }

  function importDataJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.budgetCap !== undefined) state.budgetCap = data.budgetCap;
        if (Array.isArray(data.cart)) state.cart = data.cart;
        if (Array.isArray(data.history)) state.history = data.history;
        if (data.priceDatabase) state.priceDatabase = data.priceDatabase;

        saveBudgetToStorage();
        saveCartToStorage();
        saveHistoryToStorage();
        savePriceDbToStorage();

        elements.inputBudgetCap.value = formatNumberIDR(state.budgetCap);
        populateHistoryDatalist();
        renderCartList();
        renderHistorySection();
        showToast('Data berhasil dipulihkan dari berkas!', 'success');
      } catch (err) {
        showToast('Gagal membaca berkas JSON yang valid.', 'danger');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // =========================================================================
  // 17. EVENT LISTENERS INITIALIZATION
  // =========================================================================

  function initEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', () => {
      setTheme(state.theme === 'light' ? 'dark' : 'light');
    });

    // Bottom Navigation Bar
    elements.navBtnCart.addEventListener('click', () => switchTab('cart'));
    elements.navBtnHistory.addEventListener('click', () => switchTab('history'));
    elements.navBtnBudget.addEventListener('click', () => switchTab('budget'));

    // Form Drawer Collapse / Expand
    if (elements.btnToggleFormDrawer) {
      elements.btnToggleFormDrawer.addEventListener('click', () => {
        elements.formItemContainer.classList.toggle('collapsed');
        const isCollapsed = elements.formItemContainer.classList.contains('collapsed');
        elements.btnToggleFormDrawer.querySelector('.toggle-text').textContent = isCollapsed ? 'Tambah Barang' : 'Tutup Form';
        elements.btnToggleFormDrawer.querySelector('.toggle-icon').textContent = isCollapsed ? '+' : '✕';
        if (!isCollapsed) {
          elements.inputItemName.focus();
        }
      });
    }

    if (elements.btnCloseForm) {
      elements.btnCloseForm.addEventListener('click', () => {
        elements.formItemContainer.classList.add('collapsed');
        elements.btnToggleFormDrawer.querySelector('.toggle-text').textContent = 'Tambah Barang';
        elements.btnToggleFormDrawer.querySelector('.toggle-icon').textContent = '+';
      });
    }

    // Budget Cap Events
    attachRupiahMask(elements.inputBudgetCap);
    elements.btnSaveBudget.addEventListener('click', () => {
      const val = parseRupiahInput(elements.inputBudgetCap.value);
      if (val <= 0) {
        showToast('Batas anggaran harus lebih dari Rp 0', 'warning');
        return;
      }
      state.budgetCap = val;
      saveBudgetToStorage();
      pushBudgetToCloud(val);
      updateBudgetDashboard();
      showToast(`Batas dompet diatur ke ${formatRupiah(val)}`, 'success');
    });

    // Budget Preset Buttons in Anggaran View
    elements.btnBudgetPresets.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.val, 10);
        if (val > 0) {
          state.budgetCap = val;
          elements.inputBudgetCap.value = formatNumberIDR(val);
          elements.btnBudgetPresets.forEach(b => b.classList.toggle('active', b === btn));
          saveBudgetToStorage();
          pushBudgetToCloud(val);
          updateBudgetDashboard();
          showToast(`Batas dompet diatur ke ${formatRupiah(val)}`, 'success');
        }
      });
    });

    // Form currency masks
    attachRupiahMask(elements.inputItemPrice, () => updateFormLiveCalculation());
    attachRupiahMask(elements.inputItemLastPrice, () => updateFormLiveCalculation());
    attachRupiahMask(elements.inputDiscountNominal, () => updateFormLiveCalculation());

    // Auto-complete history memory on item name typing
    elements.inputItemName.addEventListener('input', handleItemNameInput);

    // Qty Stepper
    elements.inputItemQty.addEventListener('input', updateFormLiveCalculation);
    elements.btnQtyMinus.addEventListener('click', () => {
      let q = parseFloat(elements.inputItemQty.value) || 1;
      if (q > 1) {
        elements.inputItemQty.value = Math.max(1, q - 1);
        updateFormLiveCalculation();
      }
    });
    elements.btnQtyPlus.addEventListener('click', () => {
      let q = parseFloat(elements.inputItemQty.value) || 1;
      elements.inputItemQty.value = q + 1;
      updateFormLiveCalculation();
    });

    // Unit & Category select
    elements.selectItemUnit.addEventListener('change', updateFormLiveCalculation);
    elements.selectItemCategory.addEventListener('change', updateFormLiveCalculation);

    // Discount type tabs
    elements.discTypeBtns.forEach(btn => {
      btn.addEventListener('click', () => switchDiscountType(btn.dataset.type));
    });

    // Discount string typing
    elements.inputDiscountString.addEventListener('input', updateFormLiveCalculation);

    // Discount preset chips in form
    elements.discountPresets.forEach(chip => {
      chip.addEventListener('click', () => {
        const preset = chip.dataset.preset;
        if (preset === '0%') {
          elements.inputDiscountString.value = '';
        } else {
          elements.inputDiscountString.value = preset;
        }
        updateFormLiveCalculation();
      });
    });

    // Form submit & cancel
    elements.formItem.addEventListener('submit', handleFormSubmit);
    elements.btnResetForm.addEventListener('click', resetItemForm);
    elements.btnCancelEdit.addEventListener('click', resetItemForm);

    // Cart List Events (Stepper +/-, Edit, Delete, Check)
    elements.cartItemsContainer.addEventListener('click', (e) => {
      const btnInc = e.target.closest('.btn-inc');
      const btnDec = e.target.closest('.btn-dec');
      const btnEdit = e.target.closest('.btn-item-op.edit');
      const btnDel = e.target.closest('.btn-item-op.delete');

      if (btnInc) {
        updateItemQty(btnInc.dataset.id, 1);
        return;
      }
      if (btnDec) {
        updateItemQty(btnDec.dataset.id, -1);
        return;
      }
      if (btnEdit) {
        editCartItem(btnEdit.dataset.id);
        return;
      }
      if (btnDel) {
        deleteCartItem(btnDel.dataset.id);
        return;
      }
    });

    elements.cartItemsContainer.addEventListener('change', (e) => {
      const check = e.target.closest('.check-item-trolley');
      if (check) {
        toggleItemChecked(check.dataset.id, check.checked);
        renderCartList();
      }
    });

    // Filter & Search Cart
    elements.searchCartInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      renderCartList();
    });

    elements.filterCartCategory.addEventListener('change', (e) => {
      state.categoryFilter = e.target.value;
      renderCartList();
    });

    // Clear cart
    elements.btnClearCart.addEventListener('click', () => {
      if (state.cart.length === 0) return;
      if (confirm('Yakin ingin mengosongkan semua barang di troli belanja?')) {
        state.cart = [];
        renderCartList();
        showToast('Keranjang troli dikosongkan.', 'info');
      }
    });

    // Checkout & Draft receipt
    elements.btnFinishShopping.addEventListener('click', finishCurrentShoppingSession);
    elements.btnViewReceiptDraft.addEventListener('click', () => {
      if (state.cart.length === 0) {
        showToast('Tambahkan barang terlebih dahulu untuk melihat draft struk!', 'warning');
        return;
      }
      openReceiptModal(null);
    });

    // Quick Calculator Modal
    elements.btnQuickCalc.addEventListener('click', openQuickCalcModal);
    elements.btnCloseCalcModal.addEventListener('click', () => elements.modalQuickCalc.classList.add('hidden'));
    attachRupiahMask(elements.calcModalPrice, updateQuickCalcModal);
    elements.calcModalDiscount.addEventListener('input', updateQuickCalcModal);
    elements.btnUseInForm.addEventListener('click', useQuickCalcInForm);

    // Modal Receipt
    elements.btnCloseReceiptModal.addEventListener('click', () => elements.modalReceiptView.classList.add('hidden'));
    elements.btnPrintReceipt.addEventListener('click', () => window.print());
    elements.btnDownloadReceiptText.addEventListener('click', downloadReceiptAsText);

    // History Sub-tabs
    if (elements.subtabPriceDb) {
      elements.subtabPriceDb.addEventListener('click', () => switchHistorySubtab('price'));
    }
    if (elements.subtabSessionsArchive) {
      elements.subtabSessionsArchive.addEventListener('click', () => switchHistorySubtab('archive'));
    }

    if (elements.searchPriceMaster) {
      elements.searchPriceMaster.addEventListener('input', renderPriceMasterCards);
    }

    // Price Master Cards Click Delegation (+ Ke Troli)
    if (elements.priceMasterCardsContainer) {
      elements.priceMasterCardsContainer.addEventListener('click', (e) => {
        const btnFast = e.target.closest('.btn-use-item-fast');
        if (btnFast) {
          useItemFastInCart(btnFast.dataset.name);
        }
      });
    }

    // History View Archive Click Delegation
    if (elements.historyTransactionsContainer) {
      elements.historyTransactionsContainer.addEventListener('click', (e) => {
        const btnView = e.target.closest('.btn-view-hist-receipt');
        const btnDel = e.target.closest('.btn-delete-history');

        if (btnView) {
          const id = btnView.dataset.id;
          const session = state.history.find(h => h.id === id);
          if (session) openReceiptModal(session);
          return;
        }

        if (btnDel) {
          const id = btnDel.dataset.id;
          if (confirm('Hapus arsip sesi belanja ini?')) {
            state.history = state.history.filter(h => h.id !== id);
            saveHistoryToStorage();
            renderHistorySection();
            showToast('Sesi riwayat belanja dihapus.', 'info');
          }
          return;
        }
      });
    }

    // Backup & Restore
    elements.btnExportData.addEventListener('click', exportDataJSON);
    elements.btnImportDataTrigger.addEventListener('click', () => elements.inputImportFile.click());
    elements.inputImportFile.addEventListener('change', importDataJSON);

    // Supabase Cloud Modal
    const DEFAULT_SUPABASE_CONFIG = {
      URL: 'https://vkxhztbgajlulkukwxgd.supabase.co',
      KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZreGh6dGJnYWpsdWxrdWt3eGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMjU2ODYsImV4cCI6MjEwNjkwMTY4Nn0.m8s-KixPPeIt_WKZiV0n4I6NNnsajyS09wcQ3Vd6LSU'
    };

    elements.btnCloudSync.addEventListener('click', () => {
      elements.inputSupabaseUrl.value = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || DEFAULT_SUPABASE_CONFIG.URL;
      elements.inputSupabaseKey.value = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || DEFAULT_SUPABASE_CONFIG.KEY;
      elements.modalSupabaseSync.classList.remove('hidden');
    });

    elements.btnCloseSupabaseModal.addEventListener('click', () => {
      elements.modalSupabaseSync.classList.add('hidden');
    });

    elements.btnSaveConnectSupabase.addEventListener('click', () => {
      const url = elements.inputSupabaseUrl.value.trim() || DEFAULT_SUPABASE_CONFIG.URL;
      const key = elements.inputSupabaseKey.value.trim() || DEFAULT_SUPABASE_CONFIG.KEY;
      if (!url || !key) {
        showToast('Supabase URL & Anon Key wajib diisi!', 'warning');
        return;
      }
      localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url);
      localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, key);
      const success = initSupabaseClient(url, key);
      if (success) {
        showToast('🚀 Terhubung ke Supabase! Realtime aktif 100%', 'success');
        elements.modalSupabaseSync.classList.add('hidden');
      } else {
        showToast('Gagal menghubungkan ke Supabase. Periksa URL dan Key.', 'danger');
      }
    });

    elements.btnDisconnectSupabase.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
      localStorage.removeItem(STORAGE_KEYS.SUPABASE_KEY);
      state.supabase = null;
      updateSupabaseUIStatus(false, 'Mode Offline (LocalStorage Lokal)');
      showToast('Koneksi Supabase diputus. Kembali ke mode lokal.', 'info');
      elements.modalSupabaseSync.classList.add('hidden');
    });

    // Close modals on clicking overlay outside card
    window.addEventListener('click', (e) => {
      if (e.target === elements.modalQuickCalc) elements.modalQuickCalc.classList.add('hidden');
      if (e.target === elements.modalReceiptView) elements.modalReceiptView.classList.add('hidden');
      if (e.target === elements.modalSupabaseSync) elements.modalSupabaseSync.classList.add('hidden');
    });
  }

  // Global helper for preset buttons inside HTML
  window.app = {
    setQuickCalcPreset: function (preset) {
      elements.calcModalDiscount.value = preset;
      updateQuickCalcModal();
    }
  };

  // =========================================================================
  // 18. APP BOOTSTRAP
  // =========================================================================

  function initApp() {
    loadAllFromStorage();
    initEventListeners();
    populateHistoryDatalist();
    updateFormLiveCalculation();
    renderCartList();

    const DEFAULT_SB_URL = 'https://vkxhztbgajlulkukwxgd.supabase.co';
    const DEFAULT_SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZreGh6dGJnYWpsdWxrdWt3eGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMjU2ODYsImV4cCI6MjEwNjkwMTY4Nn0.m8s-KixPPeIt_WKZiV0n4I6NNnsajyS09wcQ3Vd6LSU';

    const savedSbUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || DEFAULT_SB_URL;
    const savedSbKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || DEFAULT_SB_KEY;
    if (savedSbUrl && savedSbKey) {
      initSupabaseClient(savedSbUrl, savedSbKey);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
