const adminSession = JSON.parse(localStorage.getItem('shop_user')) || null;

// --- CENTRAL PORT ROUTING ---
// This explicitly points your Live Server browser requests directly to your running Node backend
const BACKEND_BASE_URL = 'http://localhost:5000';

// Security wall check on entry
if (!adminSession || adminSession.role !== 'admin') {
    alert("Access Denied. Admins entries only.");
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    fetchAdminOrdersLog();
    fetchAdminInventoryLog(); // Added to load your products inventory table automatically on entry
    setupProductFormSubmission();
});

// --- RENDER COMPREHENSIVE CUSTOMER ORDERS LOGS ---
async function fetchAdminOrdersLog() {
    const logContainer = document.getElementById('admin-orders-log');
    try {
        // Pointed directly to port 5000 base URL configuration
        const res = await fetch(`${BACKEND_BASE_URL}/api/orders`, {
            headers: { 'Authorization': `Bearer ${adminSession.token}` }
        });
        const orders = await res.json();

        if (orders.length === 0) {
            logContainer.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No orders have been submitted yet.</td></tr>`;
            return;
        }

        logContainer.innerHTML = orders.map(order => `
            <tr>
                <td class="font-monospace fw-bold text-secondary">${order._id}</td>
                <td>
                    <div><b>${order.user ? order.user.name : 'Guest User'}</b></div>
                    <div class="small text-muted">${order.user ? order.user.email : ''}</div>
                </td>
                <td class="fw-bold text-dark">$${order.totalPrice.toFixed(2)}</td>
                <td>
                    <span class="badge ${getStatusBadgeStyle(order.status)}">${order.status}</span>
                </td>
                <td>
                    <select class="form-select form-select-sm" onchange="updateOrderStatus('${order._id}', this.value)">
                        <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                        <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        logContainer.innerHTML = `<tr><td colspan="5" class="text-danger text-center">Failed connection to administration logging lines.</td></tr>`;
    }
}

function getStatusBadgeStyle(status) {
    switch (status) {
        case 'Pending': return 'bg-warning text-dark';
        case 'Processing': return 'bg-info text-dark';
        case 'Shipped': return 'bg-primary';
        case 'Delivered': return 'bg-success';
        case 'Cancelled': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

// --- UPDATE ORDER MILESTONES ---
window.updateOrderStatus = async function(orderId, newStatus) {
    try {
        // Pointed directly to port 5000 base URL configuration
        const res = await fetch(`${BACKEND_BASE_URL}/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminSession.token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
            alert(`Order status updated successfully to: ${newStatus}`);
            fetchAdminOrdersLog();
        } else {
            alert("Failed to modify target order status profile context.");
        }
    } catch (err) {
        alert("Error executing data tracking shift commands.");
    }
};

// --- INVENTORY MANAGEMENT MANIPULATIONS ---
function setupProductFormSubmission() {
    const form = document.getElementById('add-product-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const editId = document.getElementById('p-edit-id').value;
        const name = document.getElementById('p-name').value;
        const price = parseFloat(document.getElementById('p-price').value);
        const category = document.getElementById('p-category').value;
        const countInStock = parseInt(document.getElementById('p-stock').value);
        const imageUrl = document.getElementById('p-image').value;
        const description = document.getElementById('p-desc').value;

        const payload = { name, description, price, imageUrl, category, countInStock };

        // Determine if we are updating an existing product or adding a new one
        const isEditMode = editId !== "";
        const targetUrl = isEditMode ? `${BACKEND_BASE_URL}/api/products/${editId}` : `${BACKEND_BASE_URL}/api/products`;
        const targetMethod = isEditMode ? 'PUT' : 'POST';

        try {
            const res = await fetch(targetUrl, {
                method: targetMethod,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminSession.token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                if (isEditMode) {
                    alert("Product structural changes updated successfully inside MongoDB!");
                    clearEditState();
                } else {
                    alert("Product published successfully into MongoDB Atlas store data tracks!");
                    form.reset();
                }
                fetchAdminInventoryLog(); // Refresh table changes dynamically
            } else {
                const data = await res.json();
                alert(`Operation failed: ${data.message}`);
            }
        } catch (err) {
            alert("Network system failure executing data transmission loops.");
        }
    });
}

// --- DYNAMIC LIVE STORE INVENTORY LOADING LOGIC ---
async function fetchAdminInventoryLog() {
    const invContainer = document.getElementById('admin-inventory-log');
    if (!invContainer) return;

    try {
        // Pointed directly to port 5000 base URL configuration
        const res = await fetch(`${BACKEND_BASE_URL}/api/products`);
        const products = await res.json();

        if (products.length === 0) {
            invContainer.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No products found in the database.</td></tr>`;
            return;
        }

        invContainer.innerHTML = products.map(product => `
            <tr>
                <td>
                    <img src="${product.imageUrl}" alt="" style="width: 45px; height: 45px; object-fit: cover;" class="rounded border">
                </td>
                <td>
                    <div class="fw-bold text-dark">${product.name}</div>
                    <div class="text-muted small text-truncate" style="max-width: 220px;">${product.description}</div>
                </td>
                <td class="fw-bold">$${product.price.toFixed(2)}</td>
                <td>
                    <span class="badge ${product.countInStock > 0 ? 'bg-success' : 'bg-danger'}">
                        ${product.countInStock} units
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary py-0 px-2" onclick="prepareProductEdit('${encodeURIComponent(JSON.stringify(product))}')">
                            Edit
                        </button>
                        <button class="btn btn-outline-danger py-0 px-2" onclick="deleteProductFromStore('${product._id}')">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        invContainer.innerHTML = `<tr><td colspan="5" class="text-danger text-center">Failed connection to inventory lines.</td></tr>`;
    }
}

// --- POPULATE FORM FOR EDITING WORKFLOWS ---
window.prepareProductEdit = function(encodedProductJson) {
    const product = JSON.parse(decodeURIComponent(encodedProductJson));

    // Fill form elements with active document attributes
    document.getElementById('p-edit-id').value = product._id;
    document.getElementById('p-name').value = product.name;
    document.getElementById('p-price').value = product.price;
    document.getElementById('p-category').value = product.category;
    document.getElementById('p-stock').value = product.countInStock;
    document.getElementById('p-image').value = product.imageUrl;
    document.getElementById('p-desc').value = product.description;

    // Shift interface titles and control classes
    document.getElementById('form-action-title').innerText = "Modify Storefront Product";
    document.getElementById('submit-btn').innerText = "Update Item Document";
    document.getElementById('submit-btn').className = "btn btn-primary btn-sm w-100 fw-bold";
    document.getElementById('cancel-edit-btn').classList.remove('d-none');

    // Scroll smoothly straight up to form fields area
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- RESET FORM BACK TO CREATION MODE ---
window.clearEditState = function() {
    document.getElementById('add-product-form').reset();
    document.getElementById('p-edit-id').value = "";
    
    document.getElementById('form-action-title').innerText = "Inventory Management Add";
    document.getElementById('submit-btn').innerText = "Publish Item Document";
    document.getElementById('submit-btn').className = "btn btn-danger btn-sm w-100 fw-bold";
    document.getElementById('cancel-edit-btn').classList.add('d-none');
};

// --- PERMANENT INVENTORY DELETION FUNCTION ---
window.deleteProductFromStore = async function(productId) {
    if (!confirm("Are you sure you want to permanently delete this item from your live storefront?")) return;

    try {
        // Pointed directly to port 5000 base URL configuration
        const res = await fetch(`${BACKEND_BASE_URL}/api/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminSession.token}` }
        });

        if (res.ok) {
            alert("Product removed from database inventory tracker!");
            if (document.getElementById('p-edit-id').value === productId) {
                clearEditState();
            }
            fetchAdminInventoryLog(); // Instantly clears the product item row dynamically
        } else {
            const errorData = await res.json();
            alert(`Removal denied: ${errorData.message}`);
        }
    } catch (err) {
        alert("Network failure executing deletion sequences.");
    }
};