// public/script.js

let cart = [];

function addToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ name, price, qty: 1 });
    }
    updateCartUI();
    
    // تنبيه بسيط عند الإضافة
    showToast(`تمت إضافة (${name}) إلى السلة بنجاح! 🌽`);
}
function showToast(message) {
    const toastEl = document.getElementById('cartToast');
    const toastMsgEl = document.getElementById('toast-message');
    
    if (toastEl && toastMsgEl) {
        toastMsgEl.innerText = message;
        const toast = new bootstrap.Toast(toastEl, { delay: 2500 });
        toast.show();
    }
}

// تحديث واجهة السلة وتفاصيل العناصر
function updateCartUI() {
    const cartList = document.getElementById('cart-items-list');
    const cartBadge = document.getElementById('cart-badge');
    const cartTotal = document.getElementById('cart-total');

    if (!cartList || !cartBadge || !cartTotal) return;

    // تفريغ القائمة قبل إعادة الرسم
    cartList.innerHTML = '';

    let totalAmount = 0;
    let totalItemsCount = 0;

    if (cart.length === 0) {
        cartList.innerHTML = `
            <li class="list-group-item bg-transparent text-muted text-center py-4 border-0">
                السلة فارغة حالياً 🌽
            </li>`;
    } else {
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.qty;
            totalAmount += itemTotal;
            totalItemsCount += item.qty;

            const li = document.createElement('li');
            li.className = 'list-group-item bg-transparent text-light border-secondary d-flex align-items-center justify-content-between py-3 px-0';
            
            li.innerHTML = `
                <div>
                    <h6 class="mb-1 fw-bold text-warning">${item.name}</h6>
                    <small class="text-muted">${item.price.toFixed(2)} JOD × ${item.qty} = <span class="text-light fw-bold">${itemTotal.toFixed(2)} JOD</span></small>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <button onclick="decreaseQty(${index})" class="btn btn-sm btn-outline-danger rounded-circle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="fw-bold px-1 fs-6">${item.qty}</span>
                    <button onclick="increaseQty(${index})" class="btn btn-sm btn-outline-warning rounded-circle d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            `;
            cartList.appendChild(li);
        });
    }

    // تحديث المجموع والعداد العائم
    cartBadge.innerText = totalItemsCount;
    cartTotal.innerText = `${totalAmount.toFixed(2)} JOD`;
}

// زيادة كمية صنف محدد
function increaseQty(index) {
    if (cart[index]) {
        cart[index].qty += 1;
        updateCartUI();
    }
}

// إنقاص كمية صنف محدد أو حذفه إن وصلت الكمية لـ 0
function decreaseQty(index) {
    if (cart[index]) {
        if (cart[index].qty > 1) {
            cart[index].qty -= 1;
        } else {
            // حذف العنصر تماماً عند الوصول للصفر
            cart.splice(index, 1);
        }
        updateCartUI();
    }
}

async function refreshData() {
    try {
        // يمكنك إظهار مؤشر تحميل خفيف هنا إذا أردتِ
        const response = await fetch('/api/reviews'); // أو الرابط الخاص بك على Render
        if (!response.ok) throw new Error('Failed to fetch reviews');

        const reviews = await response.json();
        
        // إعادة رسم قائمة التقييمات في الواجهة
        renderReviews(reviews);
        
        // إشعار أنيق بتحديث البيانات (اختياري)
        showToast('تم تحديث البيانات بنجاح! 🔄');
    } catch (error) {
        console.error('Error refreshing data:', error);
    }
}
// دالة مساعدة لرسم الآراء ديناميكياً
function renderReviews(reviews) {
    const container = document.getElementById('reviews-container');
    if (!container) return;

    if (reviews.length === 0) {
        container.innerHTML = `<p class="text-muted text-center font-arabic">لا توجد تقييمات حالياً.</p>`;
        return;
    }

    container.innerHTML = reviews.map(rev => `
        <div class="col-md-4">
            <div class="card card-custom h-100 p-4 text-light text-start rounded-4 position-relative">
                <div class="mb-3 text-warning fs-5">
                    ${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}
                </div>
                <p class="font-arabic mb-4" style="line-height: 1.8;">
                    "${rev.comment}"
                </p>
                <div class="d-flex align-items-center mt-auto">
                    <div class="rounded-circle bg-warning text-dark fw-bold d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                        ${rev.name ? rev.name.charAt(0) : 'ز'}
                    </div>
                    <div>
                        <h6 class="mb-0 fw-bold text-warning">${rev.name}</h6>
                        <small class="text-muted">زبون ذرة السرو</small>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}
// إغلاق القائمة الجانبية تلقائياً عند النقر على أي رابط بداخله
document.querySelectorAll('#menuDrawer .nav-link').forEach(link => {
    link.addEventListener('click', () => {
        const menuDrawerEl = document.getElementById('menuDrawer');
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(menuDrawerEl);
        if (bsOffcanvas) {
            bsOffcanvas.hide();
        }
    });
});

function removeItem(index) {
    cart.splice(index, 1);
    updateCartUI();
}

async function checkoutWhatsApp() {
    if (cart.length === 0) {
        showToast('السلة فارغة! يرجى اختيار بعض المنتجات أولاً.');
        return;
    }

    const phone = document.getElementById('customer-phone').value;
    if (!phone) {
        showToast('يرجى إدخال رقم الهاتف.');
        return;
    }

    let total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let itemsSummary = cart.map(i => `${i.qty}x ${i.name}`).join('، ');

    // 1. إرسال الطلب للسيرفر وحفظه في قاعدة البيانات (في الخلفية)
    try {
        const response = await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: phone,
                items: itemsSummary,
                total_price: total
            })
        });
        const data = await response.json();
        
        if (data.success) {
            console.log("Order saved to database successfully.");
        }
    } catch (err) {
        console.error("Error saving order to database:", err);
    }

    // 2. تجهيز نص رسالة الواتساب بدقة
    const shopWhatsAppNumber = "962792553845"; // رقم هاتف المحل
    
    let messageText = `مرحباً، أريد إتمام الطلب:\n`;
    cart.forEach(item => {
        messageText += `- ${item.name} (الكمية: ${item.qty}) - ${item.price * item.qty} دينار\n`;
    });
    messageText += `المجموع الكلي: ${total} دينار\n`;
    messageText += `رقم الهاتف للتواصل: ${phone}`;

    // 3. التوجيه المباشر للواتساب بما يتوافق مع الأيفون والأندرويد
    const encodedMessage = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${shopWhatsAppNumber}?text=${encodedMessage}`;
    
    window.location.href = whatsappUrl;
}

async function submitReview(event) {
    event.preventDefault(); // منع إعادة تحميل الصفحة

    const name = document.getElementById('reviewer-name').value;
    const rating = document.getElementById('review-rating').value;
    const comment = document.getElementById('reviewer-comment').value;

    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, rating, comment })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('شكراً لك! تم إضافة رأيك بنجاح وسيظهر في الموقع.');
            document.getElementById('review-form').reset();
            // يمكنك هنا استدعاء دالة لتحديث قائمة الآراء وعرض الرأي الجديد فوراً
            loadReviews(); 
        } else {
            showToast('حدث خطأ أثناء إرسال الرأي، يحاول مجدداً.');
        }
    } catch (err) {
        console.error('Error submitting review:', err);
        showToast('تعذر الاتصال بالسيرفر.');
    }
}

// دالة لجلب وعرض الآراء تلقائياً
async function loadReviews() {
    try {
        const response = await fetch('/api/reviews');
        const reviews = await response.json();
        
        const container = document.getElementById('reviews-container');
        if (!container) return; // إذا لم يكن السيكشن موجوداً في الصفحة
        
        if (reviews.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">كن أول من يشاركنا رأيه!</p>';
            return;
        }

        container.innerHTML = reviews.map(r => `
            <div class="col-md-4 mb-4">
                <div class="card card-custom h-100 p-4 text-light text-start rounded-4 position-relative">
                    <div class="mb-3 text-warning fs-5">
                        ${'⭐'.repeat(r.rating)}
                    </div>
                    <p class="font-arabic mb-4" style="line-height: 1.8;">
                        "${r.comment}"
                    </p>
                    <div class="d-flex align-items-center mt-auto">
                        <div class="rounded-circle bg-warning text-dark fw-bold d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                            ${r.name.charAt(0)}
                        </div>
                        <div>
                            <h6 class="mb-0 fw-bold text-warning">${r.name}</h6>
                            <small class="text-muted">زبون للمحل</small>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error loading reviews:', err);
    }
}

// استدعاء الدالة عند فتح الصفحة
window.addEventListener('DOMContentLoaded', loadReviews);