let buyerAccounts = [];
let sellerAccounts = [];
let menus = {};
let currentOrderId = null;

// Memuat data akun pembeli dari file JSON
async function loadBuyerData() {
  try {
    const response = await fetch('js/logbuyer.json');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    buyerAccounts = data.buyers;
  } catch (error) {
    console.error("Gagal memuat data akun pembeli:", error);
  }
}

// Memuat data akun penjual dari file JSON
async function loadSellerData() {
  try {
    const response = await fetch('js/logsell.json');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    sellerAccounts = data.sellers;
  } catch (error) {
    console.error("Gagal memuat data akun penjual:", error);
  }
}

// Memuat data menu dari file JSON
async function loadMenuData() {
  try {
    const response = await fetch('js/menu.json');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    menus = await response.json();
  } catch (error) {
    console.error("Gagal memuat data menu:", error);
  }
}

// Panggil fungsi loadBuyerData, loadSellerData, dan loadMenuData saat inisialisasi
Promise.all([loadBuyerData(), loadSellerData(), loadMenuData()])
  .then(() => {
    console.log("Data akun pembeli, penjual, dan menu berhasil dimuat.");
  })
  .catch((error) => {
    console.error("Error saat memuat data:", error);
  });

// Fungsi untuk menampilkan daftar tenant
function displayTenantList() {
  const tenantListContainer = document.getElementById("tenant-list");
  tenantListContainer.innerHTML = "";

  sellerAccounts.forEach((seller, index) => {
    const tenantCard = document.createElement("div");
    tenantCard.className = "bg-white p-4 rounded shadow-md";
    tenantCard.innerHTML = `
      <h3 class="text-lg font-semibold">${seller.name}</h3>
      <p class="text-sm text-gray-600">Menyediakan berbagai makanan dan minuman.</p>
      <button class="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onclick="viewMenu(${index + 1})">Lihat Menu</button>
    `;
    tenantListContainer.appendChild(tenantCard);
  });
}

// Fungsi untuk menampilkan rekomendasi menu
function displayRecommendedMenu() {
  const recommendedContainer = document.getElementById("recommended-menu");
  recommendedContainer.innerHTML = "";

  const currentDate = new Date().toDateString();
  const storedDate = localStorage.getItem("recommendationDate");
  const storedRecommendations = JSON.parse(localStorage.getItem("recommendedMenu")) || [];

  if (currentDate !== storedDate || storedRecommendations.length === 0) {
    const recommendedItems = getRandomMenuItems(3);
    localStorage.setItem("recommendedMenu", JSON.stringify(recommendedItems));
    localStorage.setItem("recommendationDate", currentDate);
  }

  const recommendedItems = JSON.parse(localStorage.getItem("recommendedMenu"));
  recommendedItems.forEach(item => {
    const menuItem = document.createElement("div");
    menuItem.className = "bg-white p-4 rounded shadow-md";
    menuItem.innerHTML = `
      <h3 class="text-lg font-semibold">${item.name}</h3>
      <p class="text-sm text-gray-600">Harga: Rp${item.price}</p>
    `;
    recommendedContainer.appendChild(menuItem);
  });
}

// Fungsi untuk mendapatkan item menu acak
function getRandomMenuItems(count) {
  const allItems = Object.values(menus).flatMap(menu => menu.items);
  const randomItems = [];
  const usedIndices = new Set();

  while (randomItems.length < count && randomItems.length < allItems.length) {
    const randomIndex = Math.floor(Math.random() * allItems.length);
    if (!usedIndices.has(randomIndex)) {
      randomItems.push(allItems[randomIndex]);
      usedIndices.add(randomIndex);
    }
  }
  return randomItems;
}

// Fungsi untuk menampilkan menu terakhir dibeli
function displayLastPurchasedMenu() {
  const lastPurchasedContainer = document.getElementById("last-purchased-menu");
  lastPurchasedContainer.innerHTML = "";

  const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
  if (orderHistory.length === 0) {
    lastPurchasedContainer.innerHTML = "<p class='text-gray-600'>Belum ada pembelian.</p>";
    return;
  }

  const lastOrder = orderHistory[orderHistory.length - 1];
  lastOrder.items.forEach(item => {
    const menuItem = document.createElement("div");
    menuItem.className = "bg-white p-4 rounded shadow-md";
    menuItem.innerHTML = `
      <h3 class="text-lg font-semibold">${item.name}</h3>
      <p class="text-sm text-gray-600">Harga: Rp${item.price}</p>
    `;
    lastPurchasedContainer.appendChild(menuItem);
  });
}

// Go to login page
function goToLogin() {
  document.querySelector(".splash-screen").classList.add("hidden");
  document.querySelector("#login-screen").classList.remove("hidden");
}

// Handle login
function login() {
  const nisn = document.getElementById("nisn").value;
  const password = document.getElementById("password").value;

  // Handle buyer login
  const buyer = buyerAccounts.find((account) => account.nisn === nisn && account.password === password);
  if (buyer) {
    Swal.fire({
      icon: "success",
      title: `Login ${buyer.name} Berhasil!`,
      showConfirmButton: false,
      timer: 1500,
    }).then(() => {
      window.location.href = "pembeli-dashboard.html";
    });
    return;
  }

  // Handle seller login
  const seller = sellerAccounts.find((account) => account.username === nisn && account.password === password);
  if (seller) {
    Swal.fire({
      icon: "success",
      title: `Login ${seller.name} Berhasil!`,
      showConfirmButton: false,
      timer: 1500,
    }).then(() => {
      localStorage.setItem("currentSeller", seller.username); // Menyimpan tenant yang login
      window.location.href = "penjual-dashboard.html";
    });
    return;
  }

  // Jika login gagal
  Swal.fire({
    icon: "error",
    title: "Login Gagal!",
    text: "NISN/Username atau Password salah",
    showConfirmButton: true,
  });
}

// Add item to cart
function addToCart(tenantId, menuItemId) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const menuItems = getMenuItems(tenantId);
  const menuItem = menuItems.find((item) => item.id === menuItemId);
  if (!menuItem) {
    Swal.fire({
      icon: "error",
      title: "Item tidak ditemukan",
      showConfirmButton: true,
    });
    return;
  }
  // Menambahkan informasi tenant ke setiap item
  menuItem.tenantId = tenantId;
  cart.push(menuItem);
  localStorage.setItem("cart", JSON.stringify(cart));

  Swal.fire({
    icon: "success",
    title: `Menu item ${menuItem.name} ditambahkan ke keranjang!`,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 1500,
  });
}

// Get menu items for tenant
function getMenuItems(tenantId) {
  const menu = menus[tenantId];
  if (menu) {
    return menu.items;
  }
  return [];
}

// Display cart items
function displayCartItems() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartContainer = document.getElementById("cart-items");
  cartContainer.innerHTML = "";

  cart.forEach((item, index) => {
    const cartItem = document.createElement("div");
    cartItem.className =
      "bg-white p-4 rounded shadow-md mb-4 flex justify-between items-center";
    cartItem.innerHTML = `
            <div>
                <h3 class="text-lg font-semibold">${item.name}</h3>
                <p class="text-sm text-gray-600">Harga: Rp${item.price}</p>
            </div>
            <button class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600" onclick="removeFromCart(${index})">Hapus</button>
        `;
    cartContainer.appendChild(cartItem);
  });

  // Calculate total price
  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
  document.getElementById("total-price").innerText = `Total: Rp${totalPrice}`;
}

// Remove item from cart
function removeFromCart(itemIndex) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.splice(itemIndex, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  displayCartItems();
}

// Confirm order
function confirmOrder() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Keranjang Kosong",
      text: "Silakan tambahkan item ke keranjang terlebih dahulu.",
      showConfirmButton: true,
    });
    return;
  }

  const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
  const order = {
    id: orderHistory.length + 1,
    items: cart,
    total: cart.reduce((sum, item) => sum + item.price, 0),
    status: "Menunggu Pembayaran",
    kodePengambilan: Math.floor(Math.random() * 100000).toString().padStart(5, '0'), // Menghasilkan kode pengambilan 5 digit
    paymentMethod: "",
  };
  orderHistory.push(order);
  localStorage.setItem("orderHistory", JSON.stringify(orderHistory));
  localStorage.removeItem("cart");

  // Jika keranjang tidak kosong, arahkan ke halaman konfirmasi pembayaran
  window.location.href = "confirm-order.html";
}

// Select payment method
function selectPaymentMethod(method) {
  const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
  const lastOrder = orderHistory[orderHistory.length - 1];
  if (lastOrder) {
    lastOrder.paymentMethod = method;
    localStorage.setItem("orderHistory", JSON.stringify(orderHistory));
    Swal.fire({
      icon: "success",
      title: `Metode pembayaran ${method} dipilih!`,
      showConfirmButton: false,
      timer: 1500,
    }).then(() => {
      window.location.href = "order-status.html";
    });
  }
}

// Display order status
function displayOrderStatus() {
  const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
  const lastOrder = orderHistory[orderHistory.length - 1];
  if (!lastOrder) {
    Swal.fire({
      icon: "info",
      title: "Tidak ada pesanan.",
      text: "Silakan buat pesanan terlebih dahulu.",
      showConfirmButton: true,
    }).then(() => {
      window.location.href = "tenant-list.html";
    });
    return;
  }

  document.getElementById("order-status").innerText = lastOrder.status;
  document.getElementById("pickup-code").innerText =
    lastOrder.kodePengambilan;
  document.getElementById("payment-method").innerText =
    lastOrder.paymentMethod || "Belum dipilih";
}

// Complete order
function completeOrder() {
  const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
  const lastOrder = orderHistory[orderHistory.length - 1];
  if (lastOrder) {
    if (lastOrder.paymentMethod === "") {
      Swal.fire({
        icon: "warning",
        title: "Pembayaran Belum Dipilih",
        text: "Silakan pilih metode pembayaran.",
        showConfirmButton: true,
      });
      return;
    }
    lastOrder.status = "Pesanan Selesai";
    localStorage.setItem("orderHistory", JSON.stringify(orderHistory));

    Swal.fire({
      icon: "success",
      title: "Pesanan Selesai!",
      text: `Kode Pengambilan: ${lastOrder.kodePengambilan}`,
      showConfirmButton: true,
    }).then(() => {
      window.location.href = "order-history.html";
    });
  }
}

// Display order history
function displayOrderHistory() {
  const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
  const historyContainer = document.getElementById("order-history");
  historyContainer.innerHTML = "";

  if (orderHistory.length === 0) {
    historyContainer.innerHTML =
      '<p class="text-gray-600">Tidak ada riwayat pembelian.</p>';
    return;
  }

  orderHistory.forEach((order) => {
    const orderItem = document.createElement("div");
    orderItem.className = "bg-white p-4 rounded shadow-md mb-4";
    orderItem.innerHTML = `
            <h3 class="text-lg font-semibold mb-2">Pesanan ${order.id}</h3>
            <ul class="list-disc list-inside mb-2">
                ${order.items
                  .map((item) => `<li>${item.name} - Rp${item.price}</li>`)
                  .join("")}
            </ul>
            <p class="text-sm text-gray-600">Total: Rp${order.total}</p>
            <p class="text-sm text-gray-600">Status: ${order.status}</p>
            <p class="text-sm text-gray-600">Kode Pengambilan: ${
              order.kodePengambilan
            }</p>
            <p class="text-sm text-gray-600">Metode Pembayaran: ${
              order.paymentMethod || "Belum dipilih"
            }</p>
        `;
    historyContainer.appendChild(orderItem);
  });
}

// Display incoming orders for sellers
function displayIncomingOrders() {
  const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
  const currentSeller = localStorage.getItem("currentSeller");
  if (!currentSeller) {
    Swal.fire({
      icon: "error",
      title: "Gagal Memuat",
      text: "Penjual tidak terdeteksi.",
      showConfirmButton: true,
    });
    return;
  }
  // Memfilter pesanan berdasarkan tenant yang login
  const tenantId = parseInt(currentSeller.replace('tenant', ''));
  const incomingOrders = orderHistory.filter(
    (order) =>
      order.items.some((item) => item.tenantId === tenantId) &&
      order.status !== "Pesanan Selesai"
  );
  const ordersContainer = document.getElementById("incoming-orders");
  ordersContainer.innerHTML = "";

  if (incomingOrders.length === 0) {
    ordersContainer.innerHTML =
      '<p class="text-gray-600">Tidak ada pesanan masuk.</p>';
    return;
  }

  incomingOrders.forEach((order) => {
    const orderItem = document.createElement("div");
    orderItem.className = "bg-white p-4 rounded shadow-md mb-4";
    orderItem.innerHTML = `
            <h3 class="text-lg font-semibold mb-2">Pesanan ${order.id}</h3>
            <ul class="list-disc list-inside mb-2">
                ${order.items
                  .filter((item) => item.tenantId === tenantId)
                  .map((item) => `<li>${item.name} - Rp${item.price}</li>`)
                  .join("")}
            </ul>
            <p class="text-sm text-gray-600">Total: Rp${order.total}</p>
            <button class="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onclick="openPickupCodeModal(${order.id})">Verifikasi Kode Pengambilan</button>
        `;
    ordersContainer.appendChild(orderItem);
  });
}

// Buka modal untuk memasukkan kode pengambilan
function openPickupCodeModal(orderId) {
  currentOrderId = orderId; // Simpan ID pesanan yang sedang diproses
  document.getElementById("pickup-code-modal").classList.remove("hidden");
}

// Tutup modal kode pengambilan
function closePickupCodeModal() {
  document.getElementById("pickup-code-modal").classList.add("hidden");
}

// Verifikasi kode pengambilan
function verifyPickupCode() {
  const enteredCode = document.getElementById("input-pickup-code").value.trim();
  const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
  const order = orderHistory.find((order) => order.id === currentOrderId);

  if (order && order.kodePengambilan === enteredCode) {
    order.status = "Pesanan Selesai";
    localStorage.setItem("orderHistory", JSON.stringify(orderHistory));

    Swal.fire({
      icon: "success",
      title: "Kode Pengambilan Benar!",
      text: `Pesanan dengan kode ${enteredCode} telah diselesaikan.`,
      showConfirmButton: true,
    }).then(() => {
      closePickupCodeModal();
      displayIncomingOrders();
    });
  } else {
    Swal.fire({
      icon: "error",
      title: "Kode Pengambilan Salah",
      text: "Silakan periksa kembali kode pengambilan yang Anda masukkan.",
      showConfirmButton: true,
    });
  }
}

// View order details
function viewOrderDetails(orderId) {
  const orderHistory = JSON.parse(localStorage.getItem("orderHistory")) || [];
  const order = orderHistory.find((order) => order.id === orderId);
  if (order) {
    const orderDetailContainer = document.getElementById("order-detail");
    orderDetailContainer.innerHTML = `
            <h3 class="text-lg font-semibold mb-2">Pesanan ${order.id}</h3>
            <ul class="list-disc list-inside mb-2">
                ${order.items
                  .map((item) => `<li>${item.name} - Rp${item.price}</li>`)
                  .join("")}
            </ul>
            <p class="text-sm text-gray-600">Total: Rp${order.total}</p>
            <p class="text-sm text-gray-600">Kode Pengambilan: ${
              order.kodePengambilan
            }</p>
            <button class="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600" onclick="openPickupCodeModal(${order.id})">Tandai Selesai</button>
        `;
  } else {
    Swal.fire({
      icon: "error",
      title: "Pesanan Tidak Ditemukan",
      showConfirmButton: true,
    }).then(() => {
      window.history.back();
    });
  }
}

// Navigate back
function goBack() {
  window.history.back();
}

// Navigate to tenant list
function goToTenants() {
  window.location.href = "tenant-list.html";
}

// Navigate to cart
function goToCart() {
  window.location.href = "cart.html";
}

// Logout
function logout() {
  Swal.fire({
    title: "Apakah Anda yakin ingin keluar?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Ya, keluar",
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem("currentSeller");
      window.location.href = "index.html";
    }
  });
}
