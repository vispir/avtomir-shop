"use strict";

(() => {

    // Вспомогательная функция для циклического слайдера
    function loopIndex(n, length) {
  if (length === 0) return 0;
  return (n + length) % length; // всегда в диапазоне 0..length-1
}

  // helpers
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const debounce = (fn, wait = 120) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); }; };

  document.addEventListener("DOMContentLoaded", () => {
    console.log("%c Автомир: сайт запущен", "background:#d7ff60;color:#111;padding:2px 8px;border-radius:6px");
    initHeroSlider();
    initProductsCarousel();
  });

  // HERO слайдер (работает с .slider_img)
    function initHeroSlider() {
  const slider = document.querySelector(".slider");
  if (!slider) return;

  const images = Array.from(slider.querySelectorAll(".slider_img"));
  const prev   = slider.querySelector(".slider_arrow--left");
  const next   = slider.querySelector(".slider_arrow--next, .slider_arrow--right");
  if (!images.length) return;

  // стартовый индекс — по .is-active, иначе 0
  let index = Math.max(0, images.findIndex(img => img.classList.contains("is-active")));
  if (index < 0) index = 0;

  // ЖЕЛЕЗОБЕТОННЫЙ рендер: inline-стили перебивают любые спорные правила
  const render = () => {
    images.forEach((img, i) => {
      const on = i === index;
      img.classList.toggle("is-active", on);

      // жёстко управляем видимостью
      img.style.position   = "absolute";
      img.style.inset      = "0";
      img.style.width      = "100%";
      img.style.height     = "100%";
      img.style.objectFit  = "cover";
      img.style.opacity    = on ? "1" : "0";
      img.style.visibility = on ? "visible" : "hidden";
      img.style.zIndex     = on ? "2" : "1";
      img.setAttribute("aria-hidden", on ? "false" : "true");
    });


    
    //if (prev) {
     // const dis = index <= 0;
  //    prev.disabled = dis;
    //  prev.style.opacity = dis ? "0.4" : "1";
//    }
 //   if (next) {
 //     const dis = index >= images.length - 1;
  //    next.disabled = dis;
  //    next.style.opacity = dis ? "0.4" : "1";
    //    }



    // мини-лог для нас (можно потом удалить)
    console.log("[HERO] index:", index, "/", images.length, "active src:", images[index]?.getAttribute("src"));
  };

  const wrap = (n) => loopIndex(n, images.length);

  prev && prev.addEventListener("click", () => { index = wrap(index - 1); render(); });
  next && next.addEventListener("click", () => { index = wrap(index + 1); render(); });

  // свайп (простая версия)
  let startX = 0, dragging = false, pid = null;
  const endSwipe = (clientX) => {
    if (!dragging) return;
    const dx = clientX - startX;
    const threshold = slider.clientWidth * 0.15;
    if (dx < -threshold) index = clamp(index + 1);
    else if (dx > threshold) index = clamp(index - 1);
    try { pid && slider.releasePointerCapture(pid); } catch {}
    dragging = false; pid = null;
    render();
  };
  slider.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".slider_arrow")) return;
    dragging = true;
    startX = e.clientX;
    pid = e.pointerId;
    try { slider.setPointerCapture(pid); } catch {}
  });
  slider.addEventListener("pointerup",    (e) => endSwipe(e.clientX));
  slider.addEventListener("pointercancel",(e) => endSwipe(e.clientX));
  slider.addEventListener("pointerleave", (e) => endSwipe(e.clientX));

  // первый рендер
  render();
}

  // Карусель товаров («окном»)
  function initProductsCarousel() {
    const viewport = $(".products_carousel .products_viewport");
    const track    = viewport && ($("#productsTrack") || $(".products_track", viewport));
    if (!viewport || !track) return;

    const btnPrev = $("#prodPrev") || $(".products_nav.is-overlay .round:first-child", viewport);
    const btnNext = $("#prodNext") || $(".products_nav.is-overlay .round:last-child",  viewport);

    const page = () => viewport.clientWidth;
    const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth - 1);

    const go = dir => track.scrollBy({ left: dir * page(), behavior: "smooth" });
    const update = () => {
      const sl = track.scrollLeft;
      if (btnPrev) { const dis = sl <= 0;          btnPrev.toggleAttribute("disabled", dis); btnPrev.style.opacity = dis ? .4 : 1; }
      if (btnNext) { const dis = sl >= maxScroll(); btnNext.toggleAttribute("disabled", dis); btnNext.style.opacity = dis ? .4 : 1; }
    };

    btnPrev && btnPrev.addEventListener("click", e => { e.preventDefault(); go(-1); });
    btnNext && btnNext.addEventListener("click", e => { e.preventDefault(); go(1); });

    track.addEventListener("scroll", debounce(update, 80));
    window.addEventListener("resize", debounce(update, 120));
    update();
  }
})();

// ===== ABOUT PAGE ONLY =====
function initAboutPage() {
  // Аккордеон — только если есть заголовки
  const headers = document.querySelectorAll(".accordion-header");
  if (headers.length) {
    headers.forEach(btn => {
      btn.addEventListener("click", () => {
        btn.parentElement.classList.toggle("active");
      });
    });
  }

  // Слайдер — только если есть все элементы
  const slides = document.querySelector(".about .slides");
  const images = slides ? slides.querySelectorAll("img") : null;
  const prevBtn = document.querySelector(".about .prev");
  const nextBtn = document.querySelector(".about .next");

  if (slides && images && images.length && prevBtn && nextBtn) {
    let currentIndex = 0;
    const show = (i) => {
      const n = images.length;
      currentIndex = (i + n) % n;
      slides.style.transform = `translateX(-${currentIndex * 100}%)`;
    };
    prevBtn.addEventListener("click", () => show(currentIndex - 1));
    nextBtn.addEventListener("click", () => show(currentIndex + 1));
    show(0); // старт
  }
}

// Запускаем безопасно на любой странице
document.addEventListener("DOMContentLoaded", () => {
  // Инициализация раздела "О магазине" происходит только при наличии .about
  if (document.querySelector(".about")) {
    initAboutPage();
  }
});

// ===== CONTACT PAGE ONLY =====
function initContactPage() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const toast = document.getElementById('formToast');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const name = (fd.get('name') || '').toString().trim();
    const phone = (fd.get('phone') || '').toString().trim();
    const msg = (fd.get('message') || '').toString().trim();
    const agree = fd.get('agree');

    // Простая валидация
    const errors = [];
    if (name.length < 2) errors.push('Укажите имя');
    if (phone.length < 6) errors.push('Укажите телефон');
    if (msg.length < 5) errors.push('Опишите вопрос');
    if (!agree) errors.push('Подтвердите согласие');

    if (errors.length) {
      toast.textContent = errors.join(' · ');
      toast.style.background = 'rgba(255, 255, 255, 0.12)';
      toast.style.border = '1px solid rgba(239,68,68,.35)';
      toast.style.color = '#ff0808ff';
      toast.classList.add('show');
      return;
    }

    // Здесь мог бы быть реальный отправитель (fetch на форму/почту)
    toast.textContent = 'Сообщение отправлено! Мы свяжемся с вами.';
    toast.style.background = 'rgba(255, 255, 255, 0.12)';
    toast.style.border = '1px solid rgba(34,197,94,.3)';
    toast.style.color = '#167227ff';
    toast.classList.add('show');

    form.reset();
    setTimeout(() => toast.classList.remove('show'), 3500);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.contact')) initContactPage();
});
