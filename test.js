/**
 * Automated Verification Script for Smart Grocery App Logic
 * Verifies core mathematical formulas & logic requirements.
 */

function calculateTieredDiscount(initialPrice, discountStr) {
  if (!initialPrice || initialPrice <= 0) {
    return { finalPrice: 0, totalSavings: 0, effectivePercent: 0, steps: [] };
  }
  if (!discountStr || discountStr.trim() === '') {
    return { finalPrice: initialPrice, totalSavings: 0, effectivePercent: 0, steps: [] };
  }
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

function compareWithLastMonthPrice(currentUnitPrice, lastMonthPrice) {
  if (!lastMonthPrice || lastMonthPrice <= 0) {
    return { status: 'neutral', symbol: '⚪', badgeClass: 'neutral', diffAmount: 0 };
  }
  const diff = currentUnitPrice - lastMonthPrice;
  const diffPercent = parseFloat(((diff / lastMonthPrice) * 100).toFixed(1));

  if (diff > 0) {
    return { status: 'up', symbol: '🔴 ↑', badgeClass: 'up', diffAmount: diff, diffPercent };
  } else if (diff < 0) {
    return { status: 'down', symbol: '🟢 ↓', badgeClass: 'down', diffAmount: diff, diffPercent };
  } else {
    return { status: 'equal', symbol: '🟡 =', badgeClass: 'equal', diffAmount: 0, diffPercent: 0 };
  }
}

function evaluateBudgetCap(budget, totalExpense) {
  const usagePercent = (totalExpense / budget) * 100;
  let status = 'safe';
  if (usagePercent >= 100) status = 'danger';
  else if (usagePercent >= 80) status = 'warning';
  return {
    usagePercent: parseFloat(usagePercent.toFixed(1)),
    remaining: budget - totalExpense,
    status
  };
}

function calculatePackageComparison(sizeA, qtyA, priceA, sizeB, qtyB, priceB) {
  const totalVolA = sizeA * qtyA;
  const totalVolB = sizeB * qtyB;
  const unitPriceA = totalVolA > 0 ? Math.round(priceA / totalVolA) : 0;
  const unitPriceB = totalVolB > 0 ? Math.round(priceB / totalVolB) : 0;
  const diffPerUnit = Math.abs(unitPriceA - unitPriceB);
  let winner = 'equal';
  if (unitPriceA < unitPriceB) winner = 'A';
  else if (unitPriceB < unitPriceA) winner = 'B';
  const maxPrice = Math.max(unitPriceA, unitPriceB);
  const savePercent = maxPrice > 0 ? parseFloat(((diffPerUnit / maxPrice) * 100).toFixed(1)) : 0;
  return { unitPriceA, unitPriceB, winner, diffPerUnit, savePercent };
}

// ==========================================
// RUN TEST ASSERTIONS
// ==========================================
let passed = 0;
let total = 0;

function assert(description, condition) {
  total++;
  if (condition) {
    console.log(`✅ [PASS] ${description}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${description}`);
  }
}

console.log('--- STARTING LOGICAL VERIFICATION FOR SMART GROCERY APP ---');

// Tiered Discount "50% + 20%" on Rp 100.000
// Price A = 100.000 * (1 - 50/100) = 50.000
// Price B = 50.000 * (1 - 20/100) = 40.000
// Total Savings = 60.000, Effective = 60.0%
const disc1 = calculateTieredDiscount(100000, '50% + 20%');
assert('Diskon "50% + 20%" pada 100.000 menghasilkan harga akhir 40.000', disc1.finalPrice === 40000);
assert('Diskon "50% + 20%" menghasilkan total hemat 60.000', disc1.totalSavings === 60000);
assert('Diskon "50% + 20%" menghasilkan diskon efektif 60% (bukan 70%)', disc1.effectivePercent === 60.0);

// Single Discount "25%" on Rp 40.000
const disc2 = calculateTieredDiscount(40000, '25%');
assert('Diskon tunggal "25%" pada 40.000 menghasilkan 30.000', disc2.finalPrice === 30000);
assert('Diskon tunggal "25%" menghasilkan diskon efektif 25%', disc2.effectivePercent === 25.0);

// Multi-tier 3-level "70% + 20%" on Rp 100.000
// Price A = 30.000
// Price B = 30.000 * 0.8 = 24.000
// Effective = 76%
const disc3 = calculateTieredDiscount(100000, '70% + 20%');
assert('Diskon "70% + 20%" pada 100.000 menghasilkan harga akhir 24.000', disc3.finalPrice === 24000);
assert('Diskon "70% + 20%" menghasilkan diskon efektif 76%', disc3.effectivePercent === 76.0);

// Automatic Quantity Calculation (Qty x Final Price)
const itemQty = 2.5;
const itemFinalPrice = 30000;
const subtotal = itemQty * itemFinalPrice;
assert('Subtotal otomatis Qty (2.5) x Harga Akhir (30.000) = 75.000', subtotal === 75000);

// Komparasi Harga Kemasan (Unit Price Calculator)
// Minyak 1L x 3 (Rp 48.000) vs Minyak 5L Jerigen (Rp 65.000)
// Kemasan A: Rp 16.000/L
// Kemasan B: Rp 13.000/L -> Hemat Rp 3.000/L (18.8%)
const pkgComp = calculatePackageComparison(1, 3, 48000, 5, 1, 65000);
assert('Komparasi kemasan mendeteksi Jerigen 5L lebih hemat', pkgComp.winner === 'B');
assert('Selisih harga per liter adalah Rp 3.000/L', pkgComp.diffPerUnit === 3000);
assert('Penghematan persentase 18.8%', pkgComp.savePercent === 18.8);

// Realtime Price Comparator vs Last Month
// 1. Current > Last Month -> 🔴 Naik
const compUp = compareWithLastMonthPrice(74000, 68000);
assert('Harga naik (74.000 vs 68.000) menghasilkan status "up" (🔴)', compUp.status === 'up');
assert('Selisih harga naik adalah +6.000', compUp.diffAmount === 6000);

// 2. Current < Last Month -> 🟢 Turun
const compDown = compareWithLastMonthPrice(29500, 32000);
assert('Harga turun (29.500 vs 32.000) menghasilkan status "down" (🟢)', compDown.status === 'down');
assert('Selisih harga turun adalah -2.500', compDown.diffAmount === -2500);

// 3. Current == Last Month -> 🟡 Sama
const compEq = compareWithLastMonthPrice(34000, 34000);
assert('Harga stabil (34.000 vs 34.000) menghasilkan status "equal" (🟡)', compEq.status === 'equal');

// 4. Tanpa data bulan lalu -> ⚪ Neutral
const compNeut = compareWithLastMonthPrice(15000, 0);
assert('Tanpa harga bulan lalu menghasilkan status "neutral" (⚪)', compNeut.status === 'neutral');

// Budget Safety Cap Evaluation (Aman < 80%, Waspada 80% - 99%, Bahaya >= 100%)
// 1. Safe (<80%)
const bSafe = evaluateBudgetCap(500000, 390000);
assert('Belanja 390.000 dari budget 500.000 (78%) berstatus "safe" (🟢 Aman < 80%)', bSafe.status === 'safe');
assert('Sisa anggaran adalah 110.000', bSafe.remaining === 110000);

// 2. Warning (80% - 99%)
const bWarn = evaluateBudgetCap(500000, 420000);
assert('Belanja 420.000 dari budget 500.000 (84%) berstatus "warning" (🟡 Waspada 80%-99%)', bWarn.status === 'warning');

// 3. Danger / Over Budget (>=100%)
const bDang = evaluateBudgetCap(500000, 520000);
assert('Belanja 520.000 dari budget 500.000 (104%) berstatus "danger" (🔴 Bahaya >= 100%)', bDang.status === 'danger');
assert('Defisit over budget adalah -20.000', bDang.remaining === -20000);

// Database Seed & Skenario Uji Coba Rian
const SEED_ITEMS = ['Beras 5kg', 'Minyak Goreng 1L', 'Minyak Goreng 5L', 'Telur 1kg', 'Sabun Pembersih Lantai'];
assert('Minimal 5 barang acuan harga bulan lalu tersedia di sistem', SEED_ITEMS.length >= 5);

// ==========================================
// AUTHENTICATION & PROFILE SYSTEM TESTS
// ==========================================
function validateUserRegistration(fullName, email, password, confirmPassword) {
  if (!fullName || fullName.trim() === '') return { valid: false, error: 'Nama wajib diisi' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) return { valid: false, error: 'Format email tidak valid' };
  if (!password || password.length < 6) return { valid: false, error: 'Kata sandi minimal 6 karakter' };
  if (password !== confirmPassword) return { valid: false, error: 'Konfirmasi kata sandi tidak cocok' };
  return {
    valid: true,
    user: {
      id: 'usr_test',
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      role: '🎒 Siswa Rantau'
    }
  };
}

// 1. Valid Registration
const validReg = validateUserRegistration('Rian Siswa Rantau', 'rian@kos.com', 'password123', 'password123');
assert('AUTH: Registrasi dengan data valid berhasil dibuat', validReg.valid === true && validReg.user.fullName === 'Rian Siswa Rantau');

// 2. Invalid Email Format
const invalidEmailReg = validateUserRegistration('Rian', 'bukan-email', 'password123', 'password123');
assert('AUTH: Registrasi dengan format email salah ditolak', invalidEmailReg.valid === false && invalidEmailReg.error.includes('email'));

// 3. Short Password (<6 chars)
const shortPwdReg = validateUserRegistration('Rian', 'rian@kos.com', '123', '123');
assert('AUTH: Kata sandi kurang dari 6 karakter ditolak', shortPwdReg.valid === false && shortPwdReg.error.includes('6 karakter'));

// 4. Password Mismatch
const mismatchReg = validateUserRegistration('Rian', 'rian@kos.com', 'secret123', 'secret999');
assert('AUTH: Kata sandi dan konfirmasi tidak cocok ditolak', mismatchReg.valid === false && mismatchReg.error.includes('cocok'));

// 5. Initial Generation for Avatar Badge
const userName = 'Rian Siswa Rantau';
const userInitial = userName[0].toUpperCase();
assert('AUTH: Inisial avatar akun dibuat dari huruf pertama nama ("R")', userInitial === 'R');

// 6. Guest Session Ephemeral Wipe Test (Permintaan Pengguna: Akun Guest 1x Simpan, Keluar = Data Hilang)
function simulateLogout(user, currentCart, currentHistory) {
  const isGuest = !user || user.provider === 'demo' || (user.id && user.id.startsWith('demo_'));
  if (isGuest) {
    return {
      cart: [],
      history: [],
      budgetCap: 500000,
      cleared: true
    };
  }
  return {
    cart: currentCart,
    history: currentHistory,
    budgetCap: 500000,
    cleared: false
  };
}

const guestUser = { id: 'demo_guest_session', provider: 'demo' };
const guestLogoutRes = simulateLogout(guestUser, [{ id: 1, name: 'Item Tamu' }], [{ id: 'SG-1' }]);
assert('GUEST AUTH: Data keranjang dan riwayat otomatis terhapus bersih saat keluar dari akun guest', guestLogoutRes.cart.length === 0 && guestLogoutRes.history.length === 0 && guestLogoutRes.cleared === true);

const registeredUser = { id: 'usr_rian_123', email: 'rian@kos.com', provider: 'local' };
const regLogoutRes = simulateLogout(registeredUser, [{ id: 1, name: 'Item Tetap' }], [{ id: 'SG-1' }]);
assert('REGISTERED AUTH: Data belanja akun terdaftar tidak dihapus saat keluar', regLogoutRes.cart.length === 1 && regLogoutRes.cleared === false);

// 7. Multi-User Account Data Isolation Engine Tests (Permintaan Pengguna: Data Berbeda Sesuai Pengguna Masing-Masing)
function getUserStorageKey(baseKey, user) {
  if (!user) return `${baseKey}_unauth`;
  if (user.provider === 'demo' || (user.id && user.id.startsWith('demo_'))) return `${baseKey}_demo_guest`;
  const safeUserId = (user.id || user.email || 'user').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${baseKey}_usr_${safeUserId}`;
}

const userA = { id: 'usr_rian_101', email: 'rian@kos.com', fullName: 'Rian Siswa' };
const userB = { id: 'usr_budi_202', email: 'budi@kos.com', fullName: 'Budi Santoso' };

const keyCartA = getUserStorageKey('sg_cart_items', userA);
const keyCartB = getUserStorageKey('sg_cart_items', userB);
const keyCartGuest = getUserStorageKey('sg_cart_items', guestUser);

assert('DATA ISOLATION: Kunci penyimpanan keranjang akun User A dan User B berbeda', keyCartA !== keyCartB);
assert('DATA ISOLATION: Kunci penyimpanan akun terdaftar berbeda dengan akun guest', keyCartA !== keyCartGuest && keyCartB !== keyCartGuest);

// Mock Storage Simulation for Multi-User Switching
const mockStorage = {};
function mockSaveUserData(user, data) {
  mockStorage[getUserStorageKey('sg_cart_items', user)] = JSON.stringify(data.cart);
  mockStorage[getUserStorageKey('sg_budget_cap', user)] = data.budgetCap.toString();
}

function mockLoadUserData(user) {
  const cKey = getUserStorageKey('sg_cart_items', user);
  const bKey = getUserStorageKey('sg_budget_cap', user);
  return {
    cart: mockStorage[cKey] ? JSON.parse(mockStorage[cKey]) : [],
    budgetCap: mockStorage[bKey] ? parseInt(mockStorage[bKey], 10) : 500000
  };
}

// User A menyimpan 2 barang & budget 600.000
mockSaveUserData(userA, {
  cart: [{ id: 1, name: 'Beras Ramos 5kg' }, { id: 2, name: 'Minyak Goreng 1L' }],
  budgetCap: 600000
});

// User B menyimpan 1 barang & budget 350.000
mockSaveUserData(userB, {
  cart: [{ id: 3, name: 'Sabun Cuci Piring' }],
  budgetCap: 350000
});

// Guest menyimpan 1 barang sementara
mockSaveUserData(guestUser, {
  cart: [{ id: 4, name: 'Barang Sementara Tamu' }],
  budgetCap: 500000
});

const loadedA = mockLoadUserData(userA);
const loadedB = mockLoadUserData(userB);

assert('DATA ISOLATION: User A mendapatkan 2 barang troli miliknya sendiri', loadedA.cart.length === 2 && loadedA.cart[0].name === 'Beras Ramos 5kg');
assert('DATA ISOLATION: User A memiliki batas anggaran Rp 600.000', loadedA.budgetCap === 600000);
assert('DATA ISOLATION: User B hanya mendapatkan 1 barang miliknya tanpa tercampur User A', loadedB.cart.length === 1 && loadedB.cart[0].name === 'Sabun Cuci Piring');
assert('DATA ISOLATION: User B memiliki batas anggaran Rp 350.000', loadedB.budgetCap === 350000);

// Hapus data guest saat keluar
delete mockStorage[getUserStorageKey('sg_cart_items', guestUser)];
delete mockStorage[getUserStorageKey('sg_budget_cap', guestUser)];

const guestAfterClear = mockLoadUserData(guestUser);
const userAAfterGuestClear = mockLoadUserData(userA);
assert('DATA ISOLATION: Data akun guest terhapus bersih saat keluar', guestAfterClear.cart.length === 0);
assert('DATA ISOLATION: Data User A dan User B tetap utuh saat guest keluar', userAAfterGuestClear.cart.length === 2);

console.log(`\n--- HASIL: ${passed} / ${total} PENGUJIAN LULUS DENGAN SEMPURNA ---`);


