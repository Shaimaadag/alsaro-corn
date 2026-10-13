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
    alert(`تمت إضافة (${name}) إلى السلة بنجاح!`);
}

function updateCartUI() {
    const listEl = document.getElementById('cart-items-list');
    const badgeEl = document.getElementById('cart-badge');
    const totalEl = document.getElementById('cart-total');

    if (!listEl || !badgeEl || !totalEl) return;

    listEl.innerHTML = '';
    let total = 0;
    let totalCount = 0;

    if (cart.length === 0) {
        listEl.innerHTML = '<li class="list-group-item bg-transparent text-muted text-center py-4">السلة فارغة حالياً 🌽</li>';
    }

    cart.forEach((item, index) => {
        total += item.price * item.qty;
        totalCount += item.qty;

        const li = document.createElement('li');
        li.className = 'list-group-item bg-transparent text-light d-flex justify-content-between align-items-center border-secondary';
        li.innerHTML = `
            <div>
                <h6 class="mb-0 fw-bold">${item.name}</h6>
                <small class="text-muted">${item.price} JOD × ${item.qty}</small>
            </div>
            <button onclick="removeItem(${index})" class="btn btn-sm btn-outline-danger"><i class="fas fa-trash"></i></button>
        `;
        listEl.appendChild(li);
    });

    badgeEl.innerText = totalCount;
    totalEl.innerText = total.toFixed(2) + ' JOD';
}

function removeItem(index) {
    cart.splice(index, 1);
    updateCartUI();
}

async function checkoutWhatsApp() {
    if (cart.length === 0) {
        alert('السلة فارغة! يرجى اختيار بعض المنتجات أولاً.');
        return;
    }

    const phone = document.getElementById('customer-phone').value;
    if (!phone) {
        alert('يرجى إدخال رقم الهاتف.');
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
            alert('شكراً لك! تم إضافة رأيك بنجاح وسيظهر في الموقع.');
            document.getElementById('review-form').reset();
            // يمكنك هنا استدعاء دالة لتحديث قائمة الآراء وعرض الرأي الجديد فوراً
            loadReviews(); 
        } else {
            alert('حدث خطأ أثناء إرسال الرأي، يحاول مجدداً.');
        }
    } catch (err) {
        console.error('Error submitting review:', err);
        alert('تعذر الاتصال بالسيرفر.');
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