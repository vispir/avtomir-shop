(function () {
  "use strict";

  // ===== Утилиты =====
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const debounce = (fn, wait = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); }; };
  const formatPrice = n => (new Intl.NumberFormat('ru-RU').format(n) + ' ₽');

  // ===== Элементы =====
  const els = {
    grid:        $("#productsGrid"),
    search:      $("#searchInput"),
    minPrice:    $("#minPrice"),
    maxPrice:    $("#maxPrice"),
    reset:       $("#resetFilters"),
    volumeChecks: $$('input[name="volume"]'),

    modal:       $("#productModal"),
    modalImg:    $("#modalImage"),
    modalTitle:  $("#modalTitle"),
    modalBrand:  $("#modalBrand"),
    modalVolume: $("#modalVolume"),
    modalDesc:   $("#modalDesc"),
    modalPrice:  $("#modalPrice"),
    modalBuy:    $("#modalBuyBtn"),
  };

  // сетка класс
  els.grid && els.grid.classList.add("products-grid");

  // ===== Данные =====
  const data = Array.isArray(window.PRODUCTS) ? window.PRODUCTS.slice() : [];
  let filtered = data.slice();

  // ===== Пагинация (стрелки) =====
  let page = 0;
  const pageSize = 8; // показываем 8 карточек за раз
  const btnPrev = $(".pg-prev");
  const btnNext = $(".pg-next");

  // ===== Шаблон карточки (как на Главной) =====
  function cardTemplate(p){
    return `
      <article class="product-card" data-id="${p.id}">
        <div class="card-media">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
          <div class="media-cta">Посмотреть товар</div>
        </div>

        <div class="card-meta">
          <span class="price">${formatPrice(p.price)}</span>
        </div>

        <div class="card-body">
          <h3 class="title">${p.name}</h3>
          <p class="excerpt">${p.desc ? p.desc : (Array.isArray(p.tags) ? p.tags.slice(0,3).join(' · ') : '')}</p>
        </div>

        <div class="card-foot">
          <button class="btn-go" type="button" data-action="buy">Приобрести</button>
        </div>
      </article>
    `;
  }

  // ===== Рендер сетки (с пагинацией + анимацией) =====
  function renderGrid(list, {direction} = {}) {
    if (!els.grid) return;

    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    page = Math.min(page, totalPages - 1);

    // анимация ухода
    if (direction) {
      els.grid.classList.remove("is-enter","is-leave-left","is-leave-right");
      els.grid.classList.add(direction === "next" ? "is-leave-left" : "is-leave-right");
    }

    const start = page * pageSize;
    const slice = list.slice(start, start + pageSize);

    const doRender = () => {
      if (!slice.length) {
        els.grid.innerHTML = `<p>Ничего не найдено. Измените фильтры.</p>`;
      } else {
        els.grid.innerHTML = slice.map(cardTemplate).join("");

        // клики по «Приобрести» → модалка (только на свежих нодах)
        $$(".product-card [data-action='buy']", els.grid).forEach(btn=>{
          btn.addEventListener('click', (e)=>{
            e.stopPropagation();
            const card = e.currentTarget.closest('.product-card');
            const id = card?.dataset.id;
            const item = data.find(x=>x.id===id);
            if(item) openModal(item);
          });
        });
      }

      // анимация входа
      if (direction) {
        requestAnimationFrame(()=>{
          els.grid.classList.remove("is-leave-left","is-leave-right");
          els.grid.classList.add("is-enter");
          setTimeout(()=> els.grid.classList.remove("is-enter"), 220);
        });
      }

      // состояние кнопок
      if (btnPrev && btnNext) {
        btnPrev.disabled = (page <= 0) || (totalPages <= 1);
        btnNext.disabled = (page >= totalPages - 1) || (totalPages <= 1);
      }
    };

    if (direction) setTimeout(doRender, 180);
    else doRender();
  }

  // ===== Фильтры =====
  function getActiveVolumes() {
    return els.volumeChecks.filter(ch => ch.checked).map(ch => Number(ch.value));
  }

  function applyFilters() {
    const q = (els.search?.value || "").trim().toLowerCase();
    const vlist = getActiveVolumes();
    const min = Number(els.minPrice?.value || 0);
    const max = Number(els.maxPrice?.value || Number.POSITIVE_INFINITY);

    filtered = data.filter(p => {
      const textHit =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (Array.isArray(p.tags) && p.tags.some(t => String(t).toLowerCase().includes(q)));

      const volHit = !vlist.length || vlist.includes(Number(p.volumeL));
      const price = Number(p.price || 0);
      const priceHit = price >= min && price <= max;

      return textHit && volHit && priceHit;
    });

    page = 0;              // ← сбрасываем на первую страницу
    renderGrid(filtered);
  }

  const applyFiltersDebounced = debounce(applyFilters, 150);

  function resetFilters() {
    if (els.search) els.search.value = "";
    if (els.minPrice) els.minPrice.value = "";
    if (els.maxPrice) els.maxPrice.value = "";
    els.volumeChecks.forEach(ch => ch.checked = false);
    applyFilters();
  }

  // ===== Модалка =====
  function openModal(item) {
    if (!els.modal) return;

    // заполняем данные
    els.modalImg.src = item.image;
    els.modalImg.alt = item.name;
    els.modalTitle.textContent = item.name;
    els.modalBrand.textContent = item.brand;
    els.modalVolume.textContent = `${item.volumeL} L`;
    els.modalDesc.textContent = item.desc || "";
    els.modalPrice.textContent = formatPrice(item.price);
    els.modal.dataset.id = item.id;

    // --- количество и итог ---
    const minusEl   = $("#modalQtyMinus");
    const plusEl    = $("#modalQtyPlus");
    const inputEl   = $("#modalQtyInput");
    const subtotalEl= $("#modalSubtotal");

    // снимаем старые слушатели: клонируем
    const replace = (el)=>{ const n = el?.cloneNode(true); el?.replaceWith(n); return n; };
    const buyBtn  = els.modalBuy = replace(els.modalBuy);
    const minus   = replace(minusEl);
    const plus    = replace(plusEl);
    const input   = replace(inputEl);
    const subtotal= subtotalEl;

    const updateSubtotal = ()=>{
      const qty = Math.max(1, Number(input.value || 1));
      input.value = qty;
      subtotal.textContent = formatPrice(qty * (Number(item.price) || 0));
    };

    input.value = 1;
    updateSubtotal();

    minus.onclick = ()=>{ input.value = Math.max(1, Number(input.value||1) - 1); updateSubtotal(); };
    plus.onclick  = ()=>{ input.value = Math.max(1, Number(input.value||1) + 1); updateSubtotal(); };
    input.oninput = updateSubtotal;

    buyBtn.onclick = ()=>{
      const qty = Math.max(1, Number(input.value||1));
      CART.add({ id: item.id, name: item.name, price: item.price, image: item.image }, qty);
      closeModal();
      if (typeof window.toast === "function") {
        window.toast(`Добавлено в корзину: ${item.name} × ${qty}`, { type: "success", timeout: 2000 });
      }
    };

    // показать модалку (один раз)
    els.modal.removeAttribute("hidden");
    els.modal.setAttribute("aria-hidden","false");
    setTimeout(()=> els.modal.querySelector(".modal__close")?.focus(), 0);
  }

  function closeModal() {
    els.modal?.setAttribute("aria-hidden", "true");
    els.modal?.setAttribute("hidden", "");
  }

  function modalEvents() {
    document.addEventListener("click", (e) => {
      if (e.target && (e.target.matches("[data-close-modal]") || e.target.closest("[data-close-modal]"))) {
        closeModal();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  // ===== Инициализация =====
  function bindFilters() {
    els.search?.addEventListener("input", applyFiltersDebounced);
    els.minPrice?.addEventListener("input", applyFiltersDebounced);
    els.maxPrice?.addEventListener("input", applyFiltersDebounced);
    els.volumeChecks.forEach(ch => ch.addEventListener("change", applyFilters));
    els.reset?.addEventListener("click", resetFilters);
  }

  function init() {
    if (init.done) return;
    init.done = true;

    modalEvents();
    bindFilters();

    // читаем ?id= и ?q=
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    const q  = params.get("q");

    if (q && els.search) {
      els.search.value = q;
      applyFilters(); // отфильтруем сразу
    } else {
      renderGrid(filtered); // просто рендерим первую страницу
    }

    if (id) {
      const item = data.find(x => x.id === id);
      if (item) openModal(item);
    }

    // стрелки
    btnPrev?.addEventListener('click', ()=>{
      if (page > 0){ page -= 1; renderGrid(filtered, {direction: "prev"}); }
    });
    btnNext?.addEventListener('click', ()=>{
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      if (page < totalPages - 1){ page += 1; renderGrid(filtered, {direction: "next"}); }
    });

    // клавиатура ← →
    document.addEventListener('keydown', (e)=>{
      if (e.key === "ArrowLeft") btnPrev?.click();
      if (e.key === "ArrowRight") btnNext?.click();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
