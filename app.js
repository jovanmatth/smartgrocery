/**
 * SMART GROCERY APP - app.js
 * Asisten Belanja Presisi & Anti-Boncos untuk Rian Anak Kos
 * Mengimplementasikan SRS F-01 sampai F-06 dengan presisi matematis
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
    budgetCap: 500000, // Default dompet Rian Rp 500.000
    cart: [],
    history: [],
    priceDatabase: {}, // { "Beras Ramos 5kg": { lastPrice: 70000, category: "Sembako & Pokok", unit: "kg", date: "..." } }
    activeTab: 'cart', // 'cart' or 'history'
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
    // Theme
    themeToggle: document.getElementById('btn-theme-toggle'),
    themeIconSun: document.getElementById('theme-icon-sun'),
    themeIconMoon: document.getElementById('theme-icon-moon'),

    // Top Actions & Tabs
    btnQuickCalc: document.getElementById('btn-quick-calc'),
    tabBtnCart: document.getElementById('tab-btn-cart'),
    tabBtnHistory: document.getElementById('tab-btn-history'),
    viewCart: document.getElementById('view-active-cart'),
    viewHistory: document.getElementById('view-history-db'),
    badgeCartCount: document.getElementById('badge-cart-count'),
    badgeHistoryCount: document.getElementById('badge-history-count'),

    // Budget Cap (F-05)
    inputBudgetCap: document.getElementById('input-budget-cap'),
    btnSaveBudget: document.getElementById('btn-save-budget'),
    budgetCard: document.getElementById('budget-safety-section'),
    budgetStatusText: document.getElementById('budget-status-text'),
    budgetPercentText: document.getElementById('budget-percent-text'),
    budgetProgressBar: document.getElementById('budget-progress-bar'),
    statTotalExpense: document.getElementById('stat-total-expense'),
    statItemsCount: document.getElementById('stat-items-count'),
    boxRemainingBudget: document.getElementById('box-remaining-budget'),
    labelRemainingBudget: document.getElementById('label-remaining-budget'),
    statRemainingBudget: document.getElementById('stat-remaining-budget'),
    statRemainingNote: document.getElementById('stat-remaining-note'),
    statTotalSaved: document.getElementById('stat-total-saved'),
    statDiscountRate: document.getElementById('stat-discount-rate'),
    budgetAlertBanner: document.getElementById('budget-alert-banner'),
    budgetAlertTitle: document.getElementById('budget-alert-title'),
    budgetAlertDesc: document.getElementById('budget-alert-desc'),

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
    
    // Discount Inputs (F-03)
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

    // Mobile Sticky Bar
    mobileBottomBar: document.getElementById('mobile-bottom-bar'),
    mobileBarTotalVal: document.getElementById('mobile-bar-total-val'),
    mobileBarStatusVal: document.getElementById('mobile-bar-status-val'),
    btnMobileScrollForm: document.getElementById('btn-mobile-scroll-form'),

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

    // History & DB View (F-06)
    btnExportData: document.getElementById('btn-export-data'),
    btnImportDataTrigger: document.getElementById('btn-import-data-trigger'),
    inputImportFile: document.getElementById('input-import-file'),
    dbTotalTransactions: document.getElementById('db-total-transactions'),
    dbTotalKnownItems: document.getElementById('db-total-known-items'),
    dbTotalAllTimeSpent: document.getElementById('db-total-all-time-spent'),
    tbodyPriceMaster: document.getElementById('tbody-price-master'),
    historyTransactionsContainer: document.getElementById('history-transactions-container'),
    emptyHistoryNotice: document.getElementById('empty-history-notice'),

    // Supabase Cloud Sync
    btnCloudSync: document.getElementById('btn-cloud-sync'),
    cloudStatusDot: document.getElementById('cloud-status-dot'),
    cloudStatusText: document.getElementById('cloud-status-text'),
    modalSupabaseSync: document.getElementById('modal-supabase-sync'),
    btnCloseSupabaseModal: document.getElementById('btn-close-supabase-modal'),
    inputSupabaseUrl: document.getElementById('input-supabase-url'),
    inputSupabaseKey: document.getElementById('input-supabase-key'),
    supabaseConnectionStatus: document.getElementById('supabase-connection-status'),
    btnSaveConnectSupabase: document.getElementById('btn-save-connect-supabase'),
    btnDisconnectSupabase: document.getElementById('btn-disconnect-supabase'),

    // Toast
    toastContainer: document.getElementById('toast-container')
  };

  // =========================================================================
  // 3. NUMBER FORMATTING & CURRENCY UTILITIES (IDR)
  // =========================================================================

  /**
   * Format number as Indonesian Rupiah string (e.g., 50000 -> "50.000")
   */
  function formatNumberIDR(num) {
    if (isNaN(num) || num === null || num === undefined) return '0';
    return Math.round(num).toLocaleString('id-ID');
  }

  /**
   * Format with currency symbol (e.g., 50000 -> "Rp 50.000")
   */
  function formatRupiah(num) {
    return 'Rp ' + formatNumberIDR(num);
  }

  /**
   * Parse user currency input (handles dots, spaces, etc.)
   */
  function parseRupiahInput(value) {
    if (!value) return 0;
    const cleanStr = value.toString().replace(/[^0-9]/g, '');
    const num = parseInt(cleanStr, 10);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Mask input on typing to formatted number
   */
  function attachRupiahMask(inputEl, onChangeCallback) {
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
  // 4. F-03: TIERED DISCOUNT CALCULATOR ENGINE (Logika Diskon Bertingkat)
  // =========================================================================

  /**
   * Menghitung diskon bertingkat / bertumpuk secara matematis:
   * Rumus: P_A = P_0 * (1 - A/100)
   *        P_B = P_A * (1 - B/100)
   *        ...
   * @param {number} initialPrice - Harga awal sebelum diskon
   * @param {string} discountStr - Contoh: "50% + 20%", "50 + 20", "30%", "25"
   * @returns {Object} { finalPrice, totalSavings, effectivePercent, steps: [] }
   */
  function calculateTieredDiscount(initialPrice, discountStr) {
    if (!initialPrice || initialPrice <= 0) {
      return { finalPrice: 0, totalSavings: 0, effectivePercent: 0, steps: [] };
    }

    if (!discountStr || discountStr.trim() === '') {
      return {
        finalPrice: initialPrice,
        totalSavings: 0,
        effectivePercent: 0,
        steps: []
      };
    }

    // Ekstrak semua angka persentase (mendukung pemisah '+', '&', spasi, koma)
    // Contoh: "50% + 20%" -> [50, 20]
    const matches = discountStr.match(/(\d+(\.\d+)?)/g);
    if (!matches || matches.length === 0) {
      return {
        finalPrice: initialPrice,
        totalSavings: 0,
        effectivePercent: 0,
        steps: []
      };
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

  /**
   * Menghitung diskon berdasarkan tipe: Persen Bertingkat ATAU Nominal Langsung
   */
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
        formulaSummary: nominal > 0 ? `Potongan Langsung ${formatRupiah(nominal)}` : 'Tanpa Potongan'
      };
    } else {
      // Persen bertingkat
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

  /**
   * Membandingkan harga satuan saat ini vs harga bulan lalu
   * Menghasilkan indikator visual: 🔴 Naik (↑), 🟢 Turun (↓), 🟡 Setara (=)
   */
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
        text: `Naik ${formatRupiah(diff)} (+${diffPercent}%) vs bln lalu`,
        diffAmount: diff,
        diffPercent: diffPercent,
        badgeClass: 'up'
      };
    } else if (diff < 0) {
      const absDiff = Math.abs(diff);
      const absPercent = Math.abs(diffPercent);
      return {
        status: 'down',
        symbol: '🟢 ↓',
        text: `Turun ${formatRupiah(absDiff)} (-${absPercent}%) vs bln lalu`,
        diffAmount: diff,
        diffPercent: diffPercent,
        badgeClass: 'down'
      };
    } else {
      return {
        status: 'equal',
        symbol: '🟡 =',
        text: `Harga Stabil (Sama dengan bulan lalu: ${formatRupiah(lastMonthPrice)})`,
        diffAmount: 0,
        diffPercent: 0,
        badgeClass: 'equal'
      };
    }
  }

  // =========================================================================
  // 6. FORM LIVE PREVIEW & RECALCULATION (F-02, F-03, F-04)
  // =========================================================================

  function updateFormLiveCalculation() {
    const rawPrice = parseRupiahInput(elements.inputItemPrice.value);
    const lastPrice = parseRupiahInput(elements.inputItemLastPrice.value);
    const qty = parseFloat(elements.inputItemQty.value) || 0;
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
    
    // Hitung total belanja dari keranjang aktif
    let totalExpense = 0;
    let totalOriginal = 0;
    let totalSaved = 0;
    let totalItems = state.cart.length;
    let totalUnits = 0;
    let totalDiffVsLastMonth = 0;
    let itemsWithLastMonthCount = 0;

    state.cart.forEach(item => {
      totalExpense += item.subtotal;
      totalOriginal += Math.round(item.unitPrice * item.qty);
      totalSaved += item.totalSavings;
      totalUnits += item.qty;

      if (item.lastMonthPrice && item.lastMonthPrice > 0) {
        totalDiffVsLastMonth += (item.finalUnitPrice - item.lastMonthPrice) * item.qty;
        itemsWithLastMonthCount++;
      }
    });

    const remainingBudget = budget - totalExpense;
    const usagePercent = budget > 0 ? (totalExpense / budget) * 100 : 0;
    const clampedPercent = Math.min(100, Math.max(0, usagePercent));

    // Update Stat Values
    elements.statTotalExpense.textContent = formatRupiah(totalExpense);
    elements.statItemsCount.textContent = `${totalItems} jenis barang (${totalUnits % 1 === 0 ? totalUnits : totalUnits.toFixed(1)} unit)`;
    elements.statTotalSaved.textContent = formatRupiah(totalSaved);
    
    const savedRate = totalOriginal > 0 ? ((totalSaved / totalOriginal) * 100).toFixed(1) : 0;
    elements.statDiscountRate.textContent = `Hemat ${savedRate}% dari harga normal ${formatRupiah(totalOriginal)}`;

    // Update Sisa Budget Box
    if (remainingBudget >= 0) {
      elements.labelRemainingBudget.textContent = 'Sisa Dompet Tersedia';
      elements.statRemainingBudget.textContent = formatRupiah(remainingBudget);
      elements.statRemainingBudget.className = 'stat-value success';
      elements.statRemainingNote.textContent = 'Bisa belanja dengan tenang';
    } else {
      elements.labelRemainingBudget.textContent = '🚨 OVER BUDGET / DEFISIT';
      elements.statRemainingBudget.textContent = `- ${formatRupiah(Math.abs(remainingBudget))}`;
      elements.statRemainingBudget.className = 'stat-value danger';
      elements.statRemainingNote.textContent = 'Harus kurangi barang dari keranjang!';
    }

    // Update Visual Progress Bar & Alert Banner
    elements.budgetPercentText.textContent = `${usagePercent.toFixed(1)}% Terpakai`;
    elements.budgetProgressBar.style.width = `${clampedPercent}%`;

    // Remove state classes first
    elements.budgetCard.classList.remove('warning-state', 'danger-state');
    elements.budgetProgressBar.classList.remove('safe', 'warning', 'danger');
    elements.budgetAlertBanner.classList.add('hidden');
    elements.budgetAlertBanner.classList.remove('warning', 'danger');

    const statusDot = elements.budgetStatusText.querySelector('.status-dot');
    statusDot.className = 'status-dot';

    if (usagePercent >= 100) {
      // 🔴 BAHAYA / OVER BUDGET
      elements.budgetCard.classList.add('danger-state');
      elements.budgetProgressBar.classList.add('danger');
      statusDot.classList.add('danger');
      elements.budgetStatusText.innerHTML = '<span class="status-dot danger"></span> Status: 🚨 BAHAYA! Dompet Jebol!';
      
      elements.budgetAlertBanner.classList.remove('hidden');
      elements.budgetAlertBanner.classList.add('danger');
      elements.budgetAlertTitle.textContent = `🚨 PERINGATAN KERAS: MELEBIHI BATAS ANGGARAN (${formatRupiah(Math.abs(remainingBudget))})`;
      elements.budgetAlertDesc.textContent = `Rian, tagihan belanja kasir (${formatRupiah(totalExpense)}) sudah melampaui batas dompetmu (${formatRupiah(budget)}). Hapus atau kurangi kuantitas barang sebelum ke kasir agar tidak malu!`;
    } else if (usagePercent >= 75) {
      // 🟡 WASPADA (75% - 99%)
      elements.budgetCard.classList.add('warning-state');
      elements.budgetProgressBar.classList.add('warning');
      statusDot.classList.add('warning');
      elements.budgetStatusText.innerHTML = '<span class="status-dot warning"></span> Status: ⚠️ WASPADA! Mendekati Batas Dompet';
      
      elements.budgetAlertBanner.classList.remove('hidden');
      elements.budgetAlertBanner.classList.add('warning');
      elements.budgetAlertTitle.textContent = `⚠️ Perhatian: Anggaran Sisa Sedikit (${formatRupiah(remainingBudget)})`;
      elements.budgetAlertDesc.textContent = `Anda sudah memakai ${usagePercent.toFixed(1)}% dari batas dompet. Cek kembali daftar belanjaan untuk memastikan prioritas kebutuhan pokok.`;
    } else {
      // 🟢 AMAN (< 75%)
      elements.budgetProgressBar.classList.add('safe');
      statusDot.classList.add('safe');
      elements.budgetStatusText.innerHTML = '<span class="status-dot safe"></span> Status: Aman Terkendali';
    }

    // Update Footer Totals
    elements.footerRawSubtotal.textContent = formatRupiah(totalOriginal);
    elements.footerSavingsTotal.textContent = `- ${formatRupiah(totalSaved)}`;
    elements.footerGrandTotal.textContent = formatRupiah(totalExpense);
    elements.badgeCartCount.textContent = totalItems.toString();

    // Update Toolbar Stats
    elements.toolbarCartCount.innerHTML = `<strong>${totalItems}</strong> barang di keranjang`;
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

    // Update Mobile Sticky Bottom Bar
    elements.mobileBarTotalVal.textContent = formatRupiah(totalExpense);
    if (remainingBudget >= 0) {
      elements.mobileBarStatusVal.textContent = `Sisa Dompet: ${formatRupiah(remainingBudget)}`;
      elements.mobileBarStatusVal.className = 'mobile-bar-budget-status';
    } else {
      elements.mobileBarStatusVal.textContent = `🚨 Over: -${formatRupiah(Math.abs(remainingBudget))}`;
      elements.mobileBarStatusVal.className = 'mobile-bar-budget-status danger';
    }
  }

  // =========================================================================
  // 8. CART RENDERING & ACTIONS
  // =========================================================================

  function renderCartList() {
    const container = elements.cartItemsContainer;
    container.innerHTML = '';

    // Filter items based on search and category
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
      const itemRow = document.createElement('div');
      itemRow.className = 'cart-item-row';
      itemRow.dataset.id = item.id;

      // Comparator badge for card (F-04)
      const comp = compareWithLastMonthPrice(item.finalUnitPrice, item.lastMonthPrice);

      // Has discount?
      const hasDiscount = item.savingsPerUnit > 0;

      itemRow.innerHTML = `
        <div class="cart-item-check">
          <input type="checkbox" ${item.checked ? 'checked' : ''} data-id="${item.id}" class="check-item-trolley" title="Tandai sudah masuk troli">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-title-row">
            <span class="item-name ${item.checked ? 'text-muted' : ''}" style="${item.checked ? 'text-decoration: line-through;' : ''}">
              ${item.name}
            </span>
            <span class="item-category-pill">${item.category}</span>
            <span class="price-comp-badge ${comp.badgeClass}" title="${comp.text}">
              ${comp.symbol} ${comp.status === 'up' ? `+${formatRupiah(comp.diffAmount)}` : (comp.status === 'down' ? `-${formatRupiah(Math.abs(comp.diffAmount))}` : (comp.status === 'equal' ? 'Sama' : 'Baru'))}
            </span>
          </div>
          
          <div class="cart-item-pricing-row">
            ${hasDiscount ? `<span class="original-price-strike">${formatRupiah(item.unitPrice)}</span>` : ''}
            <span class="final-unit-price">${formatRupiah(item.finalUnitPrice)} / ${item.unit}</span>
            ${hasDiscount ? `<span class="promo-tag-pill">Promo: ${item.discountString || formatRupiah(item.discountNominal)} (-${formatRupiah(item.savingsPerUnit)})</span>` : ''}
            ${item.lastMonthPrice > 0 ? `<span class="text-muted" style="font-size:0.72rem;">(Bln lalu: ${formatRupiah(item.lastMonthPrice)})</span>` : ''}
          </div>
        </div>

        <div class="cart-item-right">
          <span class="cart-item-subtotal">${formatRupiah(item.subtotal)}</span>
          <div class="item-qty-actions">
            <button class="btn-mini-step btn-dec" data-id="${item.id}" title="Kurangi Qty">-</button>
            <span class="item-qty-display">${item.qty} ${item.unit}</span>
            <button class="btn-mini-step btn-inc" data-id="${item.id}" title="Tambah Qty">+</button>
          </div>
          <div class="item-row-ops">
            <button class="btn-item-op edit" data-id="${item.id}" title="Edit Data Barang">Edit</button>
            <span>&bull;</span>
            <button class="btn-item-op delete" data-id="${item.id}" title="Hapus Barang">Hapus</button>
          </div>
        </div>
      `;

      container.appendChild(itemRow);
    });

    updateBudgetDashboard();
    saveCartToStorage();
  }

  // =========================================================================
  // 9. CART ITEM OPERATIONS (Add, Edit, Update, Delete)
  // =========================================================================

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

    // Kalkulasi diskon
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
      // Mode Edit
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
      // Mode Tambah Baru
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
      showToast(`"${name}" ditambahkan ke keranjang`, 'success');

      // Update harga di database memori master lokal (F-06 realtime memory)
      recordItemPriceInMemory(name, category, unit, finalUnitPrice);
      resetItemForm();
    }

    renderCartList();
  }

  function editCartItem(id) {
    const item = state.cart.find(i => i.id === id);
    if (!item) return;

    elements.itemEditId.value = item.id;
    elements.inputItemName.value = item.name;
    elements.selectItemCategory.value = item.category;
    elements.selectItemUnit.value = item.unit;
    elements.inputItemQty.value = item.qty;
    elements.inputItemPrice.value = formatNumberIDR(item.unitPrice);
    elements.inputItemLastPrice.value = item.lastMonthPrice ? formatNumberIDR(item.lastMonthPrice) : '';

    if (item.discountType === 'nominal') {
      switchDiscountType('nominal');
      elements.inputDiscountNominal.value = formatNumberIDR(item.discountNominal || 0);
      elements.inputDiscountString.value = '';
    } else {
      switchDiscountType('percent');
      elements.inputDiscountString.value = item.discountString || '';
      elements.inputDiscountNominal.value = '';
    }

    elements.formCardTitle.textContent = `Edit Barang: ${item.name}`;
    elements.btnSubmitText.textContent = 'Simpan Perubahan';
    elements.btnCancelEdit.classList.remove('hidden');

    updateFormLiveCalculation();

    // Scroll form into view
    elements.formItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function deleteCartItem(id) {
    const item = state.cart.find(i => i.id === id);
    const itemName = item ? item.name : 'Barang';

    state.cart = state.cart.filter(i => i.id !== id);
    deleteCartItemFromCloud(id);
    renderCartList();
    showToast(`"${itemName}" telah dihapus`, 'warning');
  }

  function updateItemQty(id, delta) {
    const item = state.cart.find(i => i.id === id);
    if (!item) return;

    let newQty = item.qty + delta;
    if (newQty <= 0) {
      deleteCartItem(id);
      return;
    }

    // Round nicely
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
    elements.itemEditId.value = '';
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
  // 10. F-06: MASTER DATABASE HARGA & AUTO-COMPLETE DARI HISTORI
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
    renderPriceMasterTable();
  }

  function populateHistoryDatalist() {
    const datalist = elements.historyDatalist;
    datalist.innerHTML = '';

    Object.keys(state.priceDatabase).forEach(itemName => {
      const option = document.createElement('option');
      option.value = itemName;
      datalist.appendChild(option);
    });
  }

  /**
   * Saat Rian mengetik nama barang, otomatis cek apakah barang ini pernah dibeli
   * Jika ada, otomatis isi 'Harga Bulan Lalu', kategori, dan satuan!
   */
  function handleItemNameInput(e) {
    const query = e.target.value.trim();
    if (!query) {
      elements.badgeAutoFilled.classList.add('hidden');
      return;
    }

    // Exact match or case-insensitive match
    const matchedKey = Object.keys(state.priceDatabase).find(
      k => k.toLowerCase() === query.toLowerCase()
    );

    if (matchedKey) {
      const record = state.priceDatabase[matchedKey];
      if (record && record.lastPrice > 0) {
        // Auto-fill last month price
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
  // 11. F-06: RIWAYAT TRANSAKSI & SELESAIKAN BELANJA (Checkout Bulanan)
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

    // Kalkulasi total
    let totalExpense = 0;
    let totalOriginal = 0;
    let totalSavings = 0;

    state.cart.forEach(item => {
      totalExpense += item.subtotal;
      totalOriginal += Math.round(item.unitPrice * item.qty);
      totalSavings += item.totalSavings;

      // Perbarui master price database resmi dengan harga akhir yang baru dibeli
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

    // Tampilkan struk digital konfirmasi
    openReceiptModal(newSession);

    // Kosongkan keranjang aktif
    state.cart = [];
    saveCartToStorage();
    renderCartList();
    renderHistorySection();

    showToast('🎉 Transaksi tersimpan ke Riwayat & Database harga diperbarui!', 'success');
  }

  function renderHistorySection() {
    // Stats pills
    elements.dbTotalTransactions.textContent = state.history.length.toString();
    elements.dbTotalKnownItems.textContent = Object.keys(state.priceDatabase).length.toString();
    elements.badgeHistoryCount.textContent = state.history.length.toString();

    let allTimeSpent = 0;
    state.history.forEach(s => {
      allTimeSpent += s.totalExpense;
    });
    elements.dbTotalAllTimeSpent.textContent = formatRupiah(allTimeSpent);

    // History list
    const container = elements.historyTransactionsContainer;
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
          <div class="history-session-head">
            <div>
              <span class="session-badge">${session.id}</span>
              <span class="session-date ml-2">&bull; ${session.date}</span>
            </div>
            <div>
              <span class="badge-tag ${isOver ? 'danger' : 'info'}">
                ${isOver ? '🚨 Over Budget' : '✅ Sesuai Budget'}
              </span>
            </div>
          </div>
          
          <div class="history-session-details">
            <div class="session-metrics">
              <div>
                <span class="stat-label">Total Tagihan Kasir</span>
                <span class="session-total">${formatRupiah(session.totalExpense)}</span>
              </div>
              <div>
                <span class="stat-label">Total Hemat Diskon</span>
                <span class="stat-value text-success font-bold" style="font-size:1.15rem;">${formatRupiah(session.totalSavings)}</span>
              </div>
              <div>
                <span class="stat-label">Jumlah Barang</span>
                <span style="font-size:0.95rem; font-weight:700;">${session.items.length} item</span>
              </div>
            </div>

            <div class="session-actions">
              <button class="btn-secondary-sm btn-view-hist-receipt" data-id="${session.id}">
                Lihat Struk Digital
              </button>
              <button class="btn-outline-danger-sm btn-delete-history" data-id="${session.id}" title="Hapus Riwayat Ini">
                Hapus
              </button>
            </div>
          </div>
        `;

        container.appendChild(card);
      });
    }

    renderPriceMasterTable();
  }

  function renderPriceMasterTable() {
    const tbody = elements.tbodyPriceMaster;
    tbody.innerHTML = '';

    const keys = Object.keys(state.priceDatabase);
    if (keys.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted">Belum ada data barang di database master. Data harga akan otomatis tercatat setelah belanjaan selesai.</td>
        </tr>
      `;
      return;
    }

    keys.forEach(key => {
      const item = state.priceDatabase[key];
      const dateStr = item.lastDate ? new Date(item.lastDate).toLocaleDateString('id-ID') : '-';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.name}</strong></td>
        <td><span class="item-category-pill">${item.category}</span></td>
        <td>${item.unit}</td>
        <td><strong class="font-mono text-success">${formatRupiah(item.lastPrice)}</strong></td>
        <td class="text-muted">${dateStr}</td>
        <td>
          <button class="btn-tiny btn-use-item-fast" data-name="${item.name}">+ Ke Form</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // =========================================================================
  // 12. DIGITAL THERMAL RECEIPT MODAL (Struk Anti Pudar)
  // =========================================================================

  function openReceiptModal(sessionData) {
    const isDraft = !sessionData;
    const session = sessionData || {
      id: 'DRAFT-' + Date.now().toString().slice(-4),
      date: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      budgetCap: state.budgetCap,
      items: state.cart
    };

    let subtotalRaw = 0;
    let savingsTotal = 0;
    let grandTotal = 0;

    session.items.forEach(i => {
      subtotalRaw += Math.round(i.unitPrice * i.qty);
      savingsTotal += i.totalSavings;
      grandTotal += i.subtotal;
    });

    elements.receiptDate.textContent = session.date;
    elements.receiptSessionId.textContent = session.id;

    // Items list
    elements.receiptItemsTbody.innerHTML = '';
    session.items.forEach(i => {
      const block = document.createElement('div');
      block.className = 'receipt-item-block';
      block.innerHTML = `
        <div class="r-item-line-1">
          <span>${i.name}</span>
          <span>${formatRupiah(i.subtotal)}</span>
        </div>
        <div class="r-item-line-2">
          <span>${i.qty} ${i.unit} @ ${formatRupiah(i.finalUnitPrice)} ${i.savingsPerUnit > 0 ? `(Disc ${formatRupiah(i.savingsPerUnit)})` : ''}</span>
          <span>${i.lastMonthPrice ? (i.finalUnitPrice > i.lastMonthPrice ? '▲ NAIK' : (i.finalUnitPrice < i.lastMonthPrice ? '▼ TURUN' : '=')) : ''}</span>
        </div>
      `;
      elements.receiptItemsTbody.appendChild(block);
    });

    elements.receiptSubtotalOriginal.textContent = formatRupiah(subtotalRaw);
    elements.receiptTotalSavings.textContent = `- ${formatRupiah(savingsTotal)}`;
    elements.receiptGrandTotal.textContent = formatRupiah(grandTotal);
    elements.receiptBudgetLimit.textContent = formatRupiah(session.budgetCap);

    const walletRem = session.budgetCap - grandTotal;
    if (walletRem >= 0) {
      elements.receiptWalletBalance.textContent = `SISA: ${formatRupiah(walletRem)}`;
      elements.receiptWalletBalance.className = 'text-success font-bold';
    } else {
      elements.receiptWalletBalance.textContent = `DEFISIT: -${formatRupiah(Math.abs(walletRem))}`;
      elements.receiptWalletBalance.className = 'text-danger font-bold';
    }

    elements.modalReceiptView.classList.remove('hidden');
  }

  function downloadReceiptAsText() {
    const date = elements.receiptDate.textContent;
    const sessionId = elements.receiptSessionId.textContent;
    const itemsTbody = elements.receiptItemsTbody;

    let textReceipt = `
========================================
           SMART GROCERY KOS            
   Solusi Belanja Hemat & Presisi Rian   
========================================
WAKTU   : ${date}
SESI    : ${sessionId}
PENGGUNA: Rian (Anak Kos)
----------------------------------------
DAFTAR BELANJA:
`;

    // Ambil item dari state keranjang atau sesi
    const activeItems = state.cart.length > 0 ? state.cart : (state.history[0]?.items || []);
    activeItems.forEach(item => {
      textReceipt += `\n${item.name}\n  ${item.qty} ${item.unit} x ${formatRupiah(item.finalUnitPrice)} = ${formatRupiah(item.subtotal)}`;
      if (item.savingsPerUnit > 0) {
        textReceipt += ` [Hemat: ${formatRupiah(item.totalSavings)}]`;
      }
    });

    textReceipt += `\n
----------------------------------------
TOTAL SEBELUM DISKON : ${elements.receiptSubtotalOriginal.textContent}
TOTAL HEMAT DISKON   : ${elements.receiptTotalSavings.textContent}
TOTAL TAGIHAN KASIR  : ${elements.receiptGrandTotal.textContent}
----------------------------------------
BATAS BUDGET DOMPET  : ${elements.receiptBudgetLimit.textContent}
STATUS SISA DOMPET   : ${elements.receiptWalletBalance.textContent}
========================================
     STRUK DIGITAL ANTI PUDAR RIAN      
========================================
`;

    const blob = new Blob([textReceipt], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Struk_Belanja_${sessionId}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('Teks struk berhasil diunduh!', 'success');
  }

  // =========================================================================
  // 13. QUICK CALCULATOR MODAL (F-03 Standalone Promo Checker)
  // =========================================================================

  function openQuickCalcModal() {
    elements.modalQuickCalc.classList.remove('hidden');
    updateQuickCalcModal();
  }

  function updateQuickCalcModal() {
    const rawPrice = parseRupiahInput(elements.calcModalPrice.value) || 100000;
    const discStr = elements.calcModalDiscount.value || '50% + 20%';

    const res = calculateTieredDiscount(rawPrice, discStr);
    elements.calcModalFinalPrice.textContent = formatRupiah(res.finalPrice);
    elements.calcModalEffectivePct.textContent = `${res.effectivePercent}%`;
    elements.calcModalSavedAmount.textContent = formatRupiah(res.totalSavings);

    // Dynamic educational text
    if (res.steps.length > 1) {
      const stepExplain = res.steps.map(s => `Tahap ${s.tier}: diskon ${s.rate}%`).join(' -> ');
      elements.calcModalExplanation.innerHTML = `
        Promo <strong>"${discStr}"</strong> bukanlah diskon langsung penjumlahan! Perhitungan bertahap: ${stepExplain}.<br>
        Diskon efektif sebenarnya adalah <strong>${res.effectivePercent}%</strong>, menghemat <strong>${formatRupiah(res.totalSavings)}</strong>.
      `;
    } else if (res.steps.length === 1) {
      elements.calcModalExplanation.innerHTML = `
        Diskon tunggal sebesar <strong>${res.steps[0].rate}%</strong> memotong harga asli sebesar <strong>${formatRupiah(res.totalSavings)}</strong>.
      `;
    } else {
      elements.calcModalExplanation.innerHTML = 'Masukkan teks diskon seperti "50% + 20%" atau klik pilihan promo di atas.';
    }
  }

  function useQuickCalcInForm() {
    const rawPrice = parseRupiahInput(elements.calcModalPrice.value);
    const discStr = elements.calcModalDiscount.value;

    if (rawPrice > 0) {
      elements.inputItemPrice.value = formatNumberIDR(rawPrice);
    }
    if (discStr) {
      switchDiscountType('percent');
      elements.inputDiscountString.value = discStr;
    }
    updateFormLiveCalculation();
    elements.modalQuickCalc.classList.add('hidden');
    elements.formItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('Nilai kalkulator dimasukkan ke form belanja!', 'success');
  }

  // =========================================================================
  // 14. DATA CLEAN ROUTINE (Membersihkan Dummy & Placeholder)
  // =========================================================================

  function clearAllDummyData() {
    // Bersihkan dummy demo data jika ada di localStorage / memori
    if (state.cart.some(c => c.id && c.id.startsWith('item_demo_'))) {
      state.cart = state.cart.filter(c => !c.id.startsWith('item_demo_'));
      saveCartToStorage();
    }
    if (state.history.some(h => h.id === 'SG-001-SEPT26')) {
      state.history = state.history.filter(h => h.id !== 'SG-001-SEPT26');
      saveHistoryToStorage();
    }
    // Bersihkan master price yang berasal dari data dummy
    const dummyNames = ['Beras Ramos 5kg', 'Telur Ayam Negeri', 'Minyak Goreng 2L', 'Mie Instan Goreng (10 pcs)', 'Sabun Mandi Cair 450ml', 'Susu UHT 1 Liter', 'Kopi Tubruk Kos (1 Renteng)'];
    let changedPriceDb = false;
    dummyNames.forEach(dName => {
      if (state.priceDatabase[dName]) {
        delete state.priceDatabase[dName];
        changedPriceDb = true;
      }
    });
    if (changedPriceDb) {
      savePriceDbToStorage();
      populateHistoryDatalist();
    }
    renderCartList();
    renderHistorySection();
  }

  // =========================================================================
  // 15. PERSISTENCE & LOCAL STORAGE
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
      if (c) state.cart = JSON.parse(c) || [];

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

  // Backup & Restore
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
  // 15.5 SUPABASE REALTIME CLOUD INTEGRATION (100% Realtime Sync)
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
      elements.cloudStatusText.textContent = isOnline ? 'Realtime 100%' : 'Supabase';
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
          console.log('✅ Supabase Realtime Channel aktif 100%!');
        }
      });
  }

  function handleRealtimeCartChange(payload) {
    const { eventType, new: newRec, old: oldRec } = payload;
    console.log('⚡ Event Realtime Keranjang:', eventType, payload);

    if (eventType === 'INSERT') {
      const exists = state.cart.some(i => i.id === newRec.id);
      if (!exists) {
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
        showToast(`⚡ Realtime: "${newRec.name}" ditambahkan dari cloud!`, 'info');
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
      showToast(`⚡ Realtime: Batas anggaran diperbarui ke ${formatRupiah(state.budgetCap)}`, 'info');
    }
  }

  async function syncInitialDataFromCloud() {
    if (!state.supabase) return;

    try {
      // 1. Ambil cart items dari Supabase
      const { data: cloudCart, error: errCart } = await state.supabase.from('cart_items').select('*');
      if (!errCart && cloudCart && cloudCart.length > 0) {
        state.cart = cloudCart.map(c => ({
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
      } else if (!errCart && state.cart.length > 0) {
        pushAllLocalCartToCloud();
      }

      // 2. Ambil budget dari Supabase
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

  async function pushAllLocalCartToCloud() {
    if (!state.supabase || !state.isSupabaseOnline) return;
    for (const item of state.cart) {
      await pushCartItemToCloud(item);
    }
  }

  // =========================================================================
  // 16. THEME TOGGLE & TOAST ALERTS
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
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 300ms ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // =========================================================================
  // 17. EVENT LISTENERS INITIALIZATION
  // =========================================================================

  function initEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', () => {
      setTheme(state.theme === 'light' ? 'dark' : 'light');
    });

    // Navigation Tabs
    elements.tabBtnCart.addEventListener('click', () => {
      state.activeTab = 'cart';
      elements.tabBtnCart.classList.add('active');
      elements.tabBtnHistory.classList.remove('active');
      elements.viewCart.classList.add('active');
      elements.viewHistory.classList.remove('active');
    });

    elements.tabBtnHistory.addEventListener('click', () => {
      state.activeTab = 'history';
      elements.tabBtnHistory.classList.add('active');
      elements.tabBtnCart.classList.remove('active');
      elements.viewHistory.classList.add('active');
      elements.viewCart.classList.remove('active');
      renderHistorySection();
    });

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
      showToast(`Batas anggaran dompet diatur ke ${formatRupiah(val)}`, 'success');
    });

    // Currency masks on item form
    attachRupiahMask(elements.inputItemPrice, () => updateFormLiveCalculation());
    attachRupiahMask(elements.inputItemLastPrice, () => updateFormLiveCalculation());
    attachRupiahMask(elements.inputDiscountNominal, () => updateFormLiveCalculation());

    // Auto-complete & price memory on typing item name
    elements.inputItemName.addEventListener('input', handleItemNameInput);

    // Qty changes
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

    // Unit & Category selection
    elements.selectItemUnit.addEventListener('change', updateFormLiveCalculation);
    elements.selectItemCategory.addEventListener('change', updateFormLiveCalculation);

    // Discount type toggling
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

    // Form submission & cancel
    elements.formItem.addEventListener('submit', handleFormSubmit);
    elements.btnResetForm.addEventListener('click', resetItemForm);
    elements.btnCancelEdit.addEventListener('click', resetItemForm);

    // Cart Container Delegated Events (Qty +/-, Edit, Delete, Check)
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
      if (confirm('Yakin ingin mengosongkan semua barang di keranjang belanja saat ini?')) {
        state.cart = [];
        renderCartList();
        showToast('Keranjang belanja dikosongkan.', 'info');
      }
    });

    // Cart Checkout / Finish Shopping (F-06)
    elements.btnFinishShopping.addEventListener('click', finishCurrentShoppingSession);
    elements.btnViewReceiptDraft.addEventListener('click', () => {
      if (state.cart.length === 0) {
        showToast('Tambahkan barang terlebih dahulu untuk melihat draft struk!', 'warning');
        return;
      }
      openReceiptModal(null);
    });

    // Mobile scroll to form
    elements.btnMobileScrollForm.addEventListener('click', () => {
      elements.formItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    // History View Actions
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

    // Fast Add to Form from Price Master Table
    elements.tbodyPriceMaster.addEventListener('click', (e) => {
      const btnFast = e.target.closest('.btn-use-item-fast');
      if (btnFast) {
        const itemName = btnFast.dataset.name;
        const record = state.priceDatabase[itemName];
        if (record) {
          elements.inputItemName.value = record.name;
          elements.selectItemCategory.value = record.category;
          elements.selectItemUnit.value = record.unit;
          elements.inputItemPrice.value = formatNumberIDR(record.lastPrice);
          elements.inputItemLastPrice.value = formatNumberIDR(record.lastPrice);
          updateFormLiveCalculation();
          // Switch to cart view
          elements.tabBtnCart.click();
          elements.formItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          showToast(`Barang "${record.name}" dimuat ke form!`, 'success');
        }
      }
    });

    // Backup & Restore
    elements.btnExportData.addEventListener('click', exportDataJSON);
    elements.btnImportDataTrigger.addEventListener('click', () => elements.inputImportFile.click());
    elements.inputImportFile.addEventListener('change', importDataJSON);

    // Supabase Cloud modal controls
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
      showToast('Koneksi Supabase diputus. Kembali ke penyimpanan lokal.', 'info');
      elements.modalSupabaseSync.classList.add('hidden');
    });

    // Close modals on clicking outside overlay
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
  // 18. APP STARTUP / BOOTSTRAP
  // =========================================================================

  function initApp() {
    loadAllFromStorage();
    initEventListeners();
    populateHistoryDatalist();
    updateFormLiveCalculation();
    renderCartList();

    // Cek koneksi Supabase otomatis dengan kredensial Jovan
    const DEFAULT_SB_URL = 'https://vkxhztbgajlulkukwxgd.supabase.co';
    const DEFAULT_SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZreGh6dGJnYWpsdWxrdWt3eGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMjU2ODYsImV4cCI6MjEwNjkwMTY4Nn0.m8s-KixPPeIt_WKZiV0n4I6NNnsajyS09wcQ3Vd6LSU';

    const savedSbUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || DEFAULT_SB_URL;
    const savedSbKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || DEFAULT_SB_KEY;
    if (savedSbUrl && savedSbKey) {
      initSupabaseClient(savedSbUrl, savedSbKey);
    }

    // Bersihkan dummy demo data jika ada agar aplikasi 100% bersih
    clearAllDummyData();
  }

  // Launch on DOM Content Loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
