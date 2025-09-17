(function () {
  "use strict";

  const KEY = "cart_v1";
  const fmt = (n)=> new Intl.NumberFormat('ru-RU').format(n) + ' ₽';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { items: [] }; }
    catch { return { items: [] }; }
  }
  const state = load();
  const find  = (id) => state.items.find(i => i.id === id);

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
    dispatchEvent(new CustomEvent("cart:change", { detail: state }));
  }

  const api = {
    get()   { return structuredClone(state); },
    count() { return state.items.reduce((a, i) => a + i.qty, 0); },
    total() { return state.items.reduce((a, i) => a + i.qty * i.price, 0); },

    add(item, qty = 1) {
      const price = Number(item.price) || 0;
      const ex = find(item.id);
      if (ex) ex.qty += qty;
      else state.items.push({ id: item.id, name: item.name, price, image: item.image || "", qty });
      save();
    },

    setQty(id, qty) {
      const it = find(id); if (!it) return;
      it.qty = Math.max(0, Number(qty) || 0);
      if (it.qty === 0) api.remove(id); else save();
    },

    remove(id) {
      const idx = state.items.findIndex(i => i.id === id);
      if (idx > -1) { state.items.splice(idx, 1); save(); }
    },

    clear() { state.items.splice(0); save(); }
  };
  window.CART = api;

  // ====== бейдж на иконке ======
  function renderBadge() {
    const btn = document.querySelector('.icon_btn[aria-label="Открыть корзину"]');
    if (!btn) return;
    let b = btn.querySelector(".cart-badge");
    if (!b) { b = document.createElement("span"); b.className = "cart-badge"; btn.appendChild(b); }
    const c = api.count();
    b.textContent = c > 99 ? "99+" : String(c);
    b.style.display = c ? "grid" : "none";
  }

  // ====== мини-корзина (drawer) ======
  const el = {
    root:   document.getElementById("miniCart"),
    list:   document.getElementById("cartList"),
    total:  document.getElementById("cartTotal"),
    clear:  document.getElementById("cartClear"),
    openBtn: document.querySelector('.icon_btn[aria-label="Открыть корзину"]'),
  };

  function openCart() {
    if (!el.root) return;
    el.root.removeAttribute("hidden");
    el.root.setAttribute("aria-hidden","false");
    renderMiniCart();
  }
  function closeCart() {
    if (!el.root) return;
    el.root.setAttribute("aria-hidden","true");
    el.root.setAttribute("hidden","");
  }

  function renderMiniCart() {
    if (!el.list || !el.total) return;
    const s = api.get();
    if (!s.items.length) {
      el.list.innerHTML = `<p>Корзина пуста.</p>`;
    } else {
      el.list.innerHTML = s.items.map(i => `
        <div class="cart-item" data-id="${i.id}">
          <img class="cart-item__img" src="${i.image || ''}" alt="" />
          <div>
            <div class="cart-item__title">${i.name}</div>
            <div class="cart-item__meta">Цена: ${fmt(i.price)}</div>
            <div class="cart-item__qty">
              <button data-qty="-1" aria-label="Уменьшить">−</button>
              <span>${i.qty}</span>
              <button data-qty="+1" aria-label="Увеличить">+</button>
            </div>
          </div>
          <div style="display:grid; gap:6px; justify-items:end;">
            <div class="cart-item__price">${fmt(i.qty * i.price)}</div>
            <button class="cart-item__remove" title="Удалить" aria-label="Удалить">×</button>
          </div>
        </div>
      `).join("");
    }
    el.total.textContent = fmt(api.total());
  }

  // Делегирование событий в списке
  el.list?.addEventListener("click", (e)=>{
    const itemEl = e.target.closest(".cart-item"); if (!itemEl) return;
    const id = itemEl.dataset.id;

    if (e.target.matches("[data-qty]")) {
      const dq = Number(e.target.getAttribute("data-qty")); // +1 или -1
      const it = find(id);
      api.setQty(id, (it?.qty || 0) + dq);
      renderMiniCart();
      return;
    }
    if (e.target.matches(".cart-item__remove")) {
      api.remove(id);
      renderMiniCart();
      return;
    }
  });

    // Очистить корзину
    el.clear?.addEventListener("click", () => {
    CART.clear();              // чистим localStorage и state
    // renderMiniCart();       // не обязательно: ниже cart:change сам перерисует
    });

  // Открыть / закрыть
  el.openBtn?.addEventListener("click", openCart);
  document.addEventListener("click", (e)=>{
    if (e.target.matches("[data-cart-close]") || e.target.closest("[data-cart-close]")) closeCart();
  });
  document.addEventListener("keydown", (e)=>{ if (e.key === "Escape") closeCart(); });

  // Инициализация и реакции
  document.addEventListener("DOMContentLoaded", ()=>{ renderBadge(); /* отрисуем, если открыть */ });
  addEventListener("cart:change", ()=>{ renderBadge(); if (el.root && el.root.getAttribute("aria-hidden")==="false") renderMiniCart(); });

  // ----- TOASTS -----
let __toastBox;
function ensureToastBox(){
  if (!__toastBox){
    __toastBox = document.createElement('div');
    __toastBox.className = 'toasts';
    document.body.appendChild(__toastBox);
  }
}
function notify(message, {type='success', timeout=2000} = {}){
  ensureToastBox();
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = message;
  __toastBox.appendChild(el);
  requestAnimationFrame(()=> el.classList.add('is-shown'));
  setTimeout(()=>{
    el.classList.remove('is-shown'); el.classList.add('is-hide');
    setTimeout(()=> el.remove(), 250);
  }, timeout);
}
// доступно глобально (можно вызывать откуда угодно)
window.toast = notify;
CART.notify = notify;

})();

