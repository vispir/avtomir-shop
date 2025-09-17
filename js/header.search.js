(function(){
  "use strict";

  const fmt = n => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
  const data = Array.isArray(window.PRODUCTS) ? window.PRODUCTS.slice() : [];

  // Находим поле поиска в шапке главной
  const form  = document.querySelector("header .search");
  const input = document.querySelector("header .search_input");
  if (!form || !input) return; // на всякий случай

  // Создаём контейнер подсказок
  const box = document.createElement("div");
  box.className = "search-suggest";
  box.innerHTML = `<div class="search-suggest__list" role="listbox" id="suggestList"></div>`;
  form.appendChild(box);
  const list = box.querySelector("#suggestList");

  let cur = -1;        // индекс «активной» подсказки
  let items = [];      // текущие результаты

  const open  = ()=> box.classList.add("is-open");
  const close = ()=> { box.classList.remove("is-open"); cur = -1; };

  // Рендер подсказок
  function render(q){
    const term = (q||"").trim().toLowerCase();
    if (!term) { list.innerHTML = ""; close(); return; }

    // Поиск по name/brand/tags
    items = data.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.brand.toLowerCase().includes(term) ||
      (Array.isArray(p.tags) && p.tags.some(t => String(t).toLowerCase().includes(term)))
    ).slice(0, 8);

    if (!items.length) {
      list.innerHTML = `<div class="search-suggest__empty">Ничего не найдено</div>`;
      open(); return;
    }

    list.innerHTML = items.map((p, i) => `
      <div class="search-suggest__item" role="option" data-idx="${i}" data-id="${p.id}">
        <img class="search-suggest__img" src="${p.image||''}" alt="">
        <div>
          <div class="search-suggest__title">${p.name}</div>
          <div class="search-suggest__meta">${p.brand} · ${p.volumeL}L</div>
        </div>
        <div class="search-suggest__price">${fmt(p.price)}</div>
      </div>
    `).join("");
    cur = -1;
    open();
  }

  // Дебаунс ввода
  let t = null;
  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(()=> render(input.value), 150);
  });

  // Клик по элементу
  list.addEventListener("click", (e)=>{
    const item = e.target.closest(".search-suggest__item");
    if (!item) return;
    const idx = Number(item.dataset.idx);
    goTo(items[idx]);
  });

  // Навигация клавиатурой
  input.addEventListener("keydown", (e)=>{
    if (!box.classList.contains("is-open")) return;
    if (["ArrowDown","ArrowUp","Enter","Escape"].includes(e.key)) e.preventDefault();

    if (e.key === "ArrowDown") move(1);
    if (e.key === "ArrowUp")   move(-1);
    if (e.key === "Enter") {
      if (cur >= 0 && items[cur]) goTo(items[cur]);
      else if (input.value.trim()) goToQuery(input.value.trim());
    }
    if (e.key === "Escape") close();
  });

  function move(d){
    const rows = Array.from(list.querySelectorAll(".search-suggest__item"));
    if (!rows.length) return;
    cur = (cur + d + rows.length) % rows.length;
    rows.forEach(r => r.classList.remove("is-active"));
    rows[cur].classList.add("is-active");
    rows[cur].scrollIntoView({ block: "nearest" });
  }

  // Клик вне — закрыть
  document.addEventListener("click", (e)=>{
    if (!form.contains(e.target)) close();
  });

  // Переходы:
  // 1) конкретный товар -> products.html?id=...
  function goTo(item){
    close();
    if (!item || !item.id) return;
    location.href = `products.html?id=${encodeURIComponent(item.id)}`;
  }
  // 2) просто запрос -> products.html?q=...
  function goToQuery(q){
    close();
    location.href = `products.html?q=${encodeURIComponent(q)}`;
  }
})();
