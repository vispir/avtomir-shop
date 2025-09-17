(function(){
  "use strict";

  const els = {
    list:   document.getElementById("cartPageList"),
    count:  document.getElementById("cartPageCount"),
    total:  document.getElementById("cartPageTotal"),
    clear:  document.getElementById("cartPageClear"),
    checkout: document.getElementById("cartPageCheckout")
  };

  const fmt = n => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';

  function render(){
    const s = CART.get();
    if(!s.items.length){
      els.list.innerHTML = `<p>Корзина пуста.</p>`;
      els.count.textContent = "0";
      els.total.textContent = fmt(0);
      return;
    }

    els.list.innerHTML = s.items.map(i=>`
      <div class="cart-page__item" data-id="${i.id}">
        <img src="${i.image||''}" alt="">
        <div>
          <h3 class="cart-page__title">${i.name}</h3>
          <div class="cart-page__meta">Цена: ${fmt(i.price)}</div>
        </div>
        <div class="cart-page__qty">
          <button data-qty="-1">−</button>
          <span>${i.qty}</span>
          <button data-qty="+1">+</button>
        </div>
        <div style="display:grid; gap:6px; justify-items:end;">
          <div class="cart-page__price">${fmt(i.qty * i.price)}</div>
          <button class="cart-page__remove">×</button>
        </div>
      </div>
    `).join("");

    els.count.textContent = String(CART.count());
    els.total.textContent = fmt(CART.total());
  }

  // делегирование событий
  els.list?.addEventListener("click",(e)=>{
    const row = e.target.closest(".cart-page__item"); if(!row) return;
    const id = row.dataset.id;
    if(e.target.matches("[data-qty]")){
      const dq = Number(e.target.getAttribute("data-qty"));
      const it = CART.get().items.find(x=>x.id===id);
      CART.setQty(id, (it?.qty || 0)+dq);
      render();
    }
    if(e.target.matches(".cart-page__remove")){
      CART.remove(id); render();
    }
  });

  els.clear?.addEventListener("click",()=>{ CART.clear(); render(); });
  els.checkout?.addEventListener("click",()=>{ alert("Благодарим Вас за покупку!"); });

  document.addEventListener("DOMContentLoaded", render);
  addEventListener("cart:change", render);
})();
