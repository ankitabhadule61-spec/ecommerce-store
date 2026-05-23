// --- STATE MANAGEMENT VARS ---
let cart = JSON.parse(localStorage.getItem('quickshop_cart')) || [];
const userSession = JSON.parse(localStorage.getItem('shop_user')) || null;

// The central URL pointing directly to your Node/Express server application
const BACKEND_BASE_URL = 'http://localhost:5000';

// Runs instantly when the document loads in the browser
document.addEventListener("DOMContentLoaded", () => {
    updateNavbarUI();
    updateCartBadgeCount();
    
    // Page Route Checking Rules
    if (document.getElementById('product-container')) {
        fetchStoreCatalog();
        fetchUserOrdersTracking(); // <-- Now automatically syncs tracking profiles on catalog entry
    }
    if (document.getElementById('auth-form')) {
        setupAuthenticationPageLogic();
    }
    if (document.getElementById('cart-items-wrapper')) {
        renderCartItemsView();
    }
});

// --- NAVBAR MANAGEMENT ---
function updateNavbarUI() {
    const authWrapper = document.getElementById('nav-auth');
    if (!authWrapper) return;

    if (userSession) {
        authWrapper.innerHTML = `
            <span class="text-light small me-2">Hi, <b>${userSession.name}</b></span>
            ${userSession.role === 'admin' ? '<a class="btn btn-warning btn-sm me-2" href="admin.html">Admin</a>' : ''}
            <button class="btn btn-danger btn-sm" id="logout-btn">Logout</button>
        `;
        document.getElementById('logout-btn').addEventListener('click', () => {
            // FIXED: Use removeItem instead of clear to preserve cart data
            localStorage.removeItem('shop_user');
            window.location.href = "login.html"; // Redirects cleanly back to auth screen
        });
    }
}

function updateCartBadgeCount() {
    const badge = document.getElementById('cart-count');
    if (badge) {
        badge.innerText = cart.reduce((acc, item) => acc + item.qty, 0);
    }
}

// --- FETCH & RENDER CATALOG ---
async function fetchStoreCatalog() {
    const container = document.getElementById('product-container');
    try {
        // Direct route traffic to Port 5000 safely
        const response = await fetch(`${BACKEND_BASE_URL}/api/products`);
        const products = await response.json();

        if (products.length === 0) {
            container.innerHTML = `<p class="text-center text-muted col-12">The store inventory is currently empty.</p>`;
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="col-md-4 col-sm-6">
                <div class="card h-100 shadow-sm border-0">
                    <img src="${product.imageUrl}" class="card-img-top object-fit-cover" style="height: 200px;" alt="${product.name}">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title fw-bold">${product.name}</h5>
                        <p class="card-text text-muted small flex-grow-1">${product.description}</p>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <span class="fs-5 fw-bold text-dark">$${product.price.toFixed(2)}</span>
                            <button class="btn btn-dark btn-sm" onclick="addToCart('${product._id}', '${product.name}', ${product.price}, '${product.imageUrl}')">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<p class="text-danger text-center col-12">Error fetching database catalog files.</p>`;
    }
}

// --- CART FUNCTIONS ---
window.addToCart = function(id, name, price, image) {
    const existingIndex = cart.findIndex(item => item.product === id);
    if (existingIndex > -1) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push({ product: id, name, price, image, qty: 1 });
    }
    localStorage.setItem('quickshop_cart', JSON.stringify(cart));
    updateCartBadgeCount();
    alert(`${name} added to your cart!`);
};

function renderCartItemsView() {
    const wrapper = document.getElementById('cart-items-wrapper');
    if (!wrapper) return;
    
    if (cart.length === 0) {
        wrapper.innerHTML = `<p class="text-center py-4 text-muted">Your shopping cart is currently empty.</p>`;
        document.getElementById('checkout-btn').disabled = true;
        return;
    }

    let subtotal = 0;
    wrapper.innerHTML = cart.map((item, index) => {
        subtotal += item.price * item.qty;
        return `
            <div class="d-flex align-items-center justify-content-between border-bottom py-3">
                <div class="d-flex align-items-center">
                    <img src="${item.image}" alt="" style="width: 60px; height: 60px; object-fit: cover;" class="rounded me-3">
                    <div>
                        <h6 class="mb-0 fw-bold">${item.name}</h6>
                        <small class="text-muted">$${item.price.toFixed(2)} x ${item.qty}</small>
                    </div>
                </div>
                <button class="btn btn-outline-danger btn-sm" onclick="removeItemFromCart(${index})">Remove</button>
            </div>
        `;
    }).join('');

    document.getElementById('summary-subtotal').innerText = `$${subtotal.toFixed(2)}`;
    document.getElementById('summary-total').innerText = `$${subtotal.toFixed(2)}`;

    // Set up Checkout Event
    document.getElementById('checkout-btn').onclick = () => handleOrderCheckoutSubmit(subtotal);
}

window.removeItemFromCart = function(index) {
    cart.splice(index, 1);
    localStorage.setItem('quickshop_cart', JSON.stringify(cart));
    renderCartItemsView();
    updateCartBadgeCount();
};

async function handleOrderCheckoutSubmit(totalCost) {
    if (!userSession) {
        alert("Please register or login to complete your purchase!");
        window.location.href = "login.html";
        return;
    }

    const statusDiv = document.getElementById('checkout-status');
    statusDiv.classList.remove('d-none');
    statusDiv.innerText = "Processing order with server security fields...";

    try {
        // Direct checkout submission pipeline straight to port 5000
        const res = await fetch(`${BACKEND_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userSession.token}`
            },
            body: JSON.stringify({ orderItems: cart, totalPrice: totalCost })
        });
        const data = await res.json();

        if (res.ok) {
            statusDiv.className = "alert alert-success mt-3";
            statusDiv.innerText = `Success! Order references created ID: ${data._id}. Thank you for shopping!`;
            cart = [];
            localStorage.removeItem('quickshop_cart');
            updateCartBadgeCount();
            setTimeout(() => { window.location.href = "index.html"; }, 4000);
        } else {
            statusDiv.className = "alert alert-danger mt-3";
            statusDiv.innerText = data.message || "Checkout execution halted.";
        }
    } catch (err) {
        statusDiv.className = "alert alert-danger mt-3";
        statusDiv.innerText = "Network transmission breakdown error.";
    }
}

// --- AUTHENTICATION ROUTING FORM CONTROLLER ---
function setupAuthenticationPageLogic() {
    let isLoginState = true;
    const form = document.getElementById('auth-form');
    const title = document.getElementById('form-title');
    const subtitle = document.getElementById('form-subtitle');
    const nameGroup = document.getElementById('name-group');
    const submitBtn = document.getElementById('submit-btn');
    const toggleLink = document.getElementById('toggle-link');
    const toggleText = document.getElementById('toggle-text');
    const alertBox = document.getElementById('auth-alert');

    toggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginState = !isLoginState;
        alertBox.classList.add('d-none');
        
        if (isLoginState) {
            title.innerText = "Welcome Back";
            subtitle.innerText = "Please sign in to continue shopping";
            nameGroup.classList.add('d-none');
            submitBtn.innerText = "Sign In";
            toggleText.innerText = "New customer?";
            toggleLink.innerText = "Create account";
        } else {
            title.innerText = "Create Account";
            subtitle.innerText = "Sign up for quick ordering tracking fields";
            nameGroup.classList.remove('d-none');
            submitBtn.innerText = "Register Account";
            toggleText.innerText = "Already registered?";
            toggleLink.innerText = "Login instead";
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertBox.classList.add('d-none');

        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const name = document.getElementById('auth-name').value;

        // Route connection stream mappings updated to direct targets
        const path = isLoginState ? '/api/auth/login' : '/api/auth/register';
        const endpoint = `${BACKEND_BASE_URL}${path}`;
        
        // Removed the old role tracking variable. 
        // Registration profiles now implicitly resolve to standard 'user' privileges.
        const payload = isLoginState 
            ? { email, password } 
            : { name, email, password, role: 'user' };

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('shop_user', JSON.stringify(data));
                // Ensure cart state persists during login redirect
                localStorage.setItem('quickshop_cart', JSON.stringify(cart));
                
                if (data.role === 'admin') {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "index.html";
                }
            } else {
                alertBox.classList.remove('d-none');
                alertBox.innerText = data.message || "Authentication error.";
            }
        } catch (err) {
            alertBox.classList.remove('d-none');
            alertBox.innerText = "Failed connection stream server runtime error.";
        }
    });
}

// --- USER-SPECIFIC ORDERS LIVE TRACKING SYSTEM ---
async function fetchUserOrdersTracking() {
    const trackingSection = document.getElementById('tracking-section');
    const trackingLog = document.getElementById('user-tracking-log');
    
    // Safety exit: If user isn't logged in, or layout nodes aren't present, halt execution
    if (!userSession || !trackingSection || !trackingLog) return;

    try {
        // DYNAMIC ENDPOINT ROUTING RULE:
        // Admin profile tracks read from global access logs, Customer logs hit user-specific fields
        const targetEndpoint = userSession.role === 'admin'
            ? `${BACKEND_BASE_URL}/api/orders`
            : `${BACKEND_BASE_URL}/api/orders/myorders`;

        const res = await fetch(targetEndpoint, {
            headers: { 'Authorization': `Bearer ${userSession.token}` }
        });
        const orders = await res.json();

        // Reveal the section and inject the data rows if tracking entries are found
        if (Array.isArray(orders) && orders.length > 0) {
            trackingSection.classList.remove('d-none');
            
            trackingLog.innerHTML = orders.map(order => {
                let badgeStyle = 'bg-secondary';
                if (order.status === 'Pending') badgeStyle = 'bg-warning text-dark';
                if (order.status === 'Processing') badgeStyle = 'bg-info text-dark';
                if (order.status === 'Shipped') badgeStyle = 'bg-primary';
                if (order.status === 'Delivered') badgeStyle = 'bg-success';
                if (order.status === 'Cancelled') badgeStyle = 'bg-danger';

                return `
                    <tr>
                        <td class="font-monospace fw-bold text-secondary ps-3">${order._id}</td>
                        <td class="fw-bold">$${order.totalPrice.toFixed(2)}</td>
                        <td>
                            <span class="badge ${badgeStyle} p-2">${order.status}</span>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            // Keep container neat and hidden if no orders exist for this user session yet
            trackingSection.classList.add('d-none');
        }
    } catch (err) {
        console.error("Tracking framework synchronization malfunction:", err);
    }
}