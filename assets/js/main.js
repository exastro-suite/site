document.addEventListener("DOMContentLoaded", () => {
  initHeroFit();
  initGridBackground();
  fadeInBackgroundImage();
  initScrollMeter();
  initScrollStep();
  initReleaseNotice();
  initNewsPager();
  initNoticeHide();
  initCookieNotice();
  initAnchorScroll();
  initHeaderShow();
  initHeaderMenu();
  initMotionToggle();
  initImageDialog();
  initFeatureToggleAll();
  initScrollReveal();
});

/* ===== スクロールで表示：セクション2以降の中身をフェードイン =====
 * 見出し（.section__head）と本文（.section__body）の子要素に .reveal を付け、
 * 画面に入ったら .is-revealed を付ける（一度表示したら戻さない）。
 * 見出し・本文それぞれの中で順番に少しずつ遅らせて表示する。
 * 親要素に transform を掛けると sticky の見出しや背景の同心円の重なりが変わるため、子要素に付ける。
 */
function initScrollReveal() {
  const groups = document.querySelectorAll(
    ".section:not(.section--hero) .section__head, .section:not(.section--hero) .section__body"
  );
  if (!groups.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-revealed");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -10% 0px" });

  groups.forEach((group) => {
    Array.from(group.children).forEach((el, i) => {
      el.classList.add("reveal");
      el.style.setProperty("--reveal-delay", `${i * 0.15}s`);
      observer.observe(el);
    });
  });
}

/* ===== ファーストビュー：中身を画面の約8割に拡縮する =====
 * 基準の文字サイズで並べたときの大きさを測り、幅は画面の、高さは固定ヘッダーと下端のお知らせを
 * 除いた範囲の 80% に収まる文字サイズを --hero-font に入れる（中の大きさは CSS ですべて em 指定）。
 * 横に並べる形と縦に積む形（.is-stacked）の両方を測り、縦積みがはっきり大きく表示できるときだけ縦積みにする。
 */
function initHeroFit() {
  const inner = document.querySelector(".hero__inner");
  if (!inner) return;
  const RATIO = 0.8;
  const BASE = 16; // 測るときの文字サイズ（px）
  const STACK_BIAS = 1.15; // 縦積みを選ぶのは、横並びよりこの倍率以上大きく表示できるとき

  // 見えている範囲の高さは 100svh で測る（スマートフォンでアドレスバーが出入りしても拡縮し直さないため）
  // 重要なお知らせ（.hero__alert）を置いている間は、その高さ分（--hero-alert-space）も除く
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;top:0;visibility:hidden;pointer-events:none;" +
    "height:calc(100vh - var(--header-height) - var(--notice-height) - var(--hero-alert-space));" +
    "height:calc(100svh - var(--header-height) - var(--notice-height) - var(--hero-alert-space))";
  document.body.append(probe);

  let pending = false;
  function update() {
    pending = false;
    const width = document.documentElement.clientWidth * RATIO;
    const height = probe.offsetHeight * RATIO;
    inner.style.setProperty("--hero-font", `${BASE}px`);
    const scaleOf = (stacked) => {
      inner.classList.toggle("is-stacked", stacked);
      return Math.min(width / inner.offsetWidth, height / inner.offsetHeight);
    };
    const wide = scaleOf(false);
    const stacked = scaleOf(true);
    const useStacked = stacked > wide * STACK_BIAS;
    inner.classList.toggle("is-stacked", useStacked);
    inner.style.setProperty("--hero-font", `${BASE * (useStacked ? stacked : wide)}px`);
  }

  const requestUpdate = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(update);
  };
  window.addEventListener("resize", requestUpdate);
  update();
  // Web フォントの読み込みで文字幅が変わるため、読み込み後に測り直してから表示する
  const show = () => {
    update();
    document.documentElement.classList.remove("is-hero-pending");
  };
  if (document.fonts) document.fonts.ready.then(show);
  else show();
}

/* ===== 固定ヘッダー：読み込みが終わったら上から出す =====
 * head.html で html に付けた .is-header-pending を少し待ってから外す（動きは CSS の transition）。
 */
const HEADER_SHOW_DELAY = 500; // 出すまでの待ち時間（ミリ秒）

function initHeaderShow() {
  setTimeout(() => document.documentElement.classList.remove("is-header-pending"), HEADER_SHOW_DELAY);
}

/* ===== 固定ヘッダー：狭い画面のメニュー開閉 =====
 * ページ内リンクを押したとき・Esc キーで閉じる。
 */
function initHeaderMenu() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const toggle = header.querySelector(".site-header__toggle");

  const setOpen = (open) => {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
  };

  toggle.addEventListener("click", () => setOpen(!header.classList.contains("is-open")));
  header.querySelector(".site-header__menu").addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
}

/* ===== アニメーションのオン／オフ =====
 * ヘッダーの Motion スイッチで html に .is-motion-off を付け外しする（止め方は CSS と initGridBackground）。
 * 選んだ状態は localStorage に残し、ほかのページや次に開いたときも同じにする
 * （表示前に反映するため、読み込み時の付け外しは各ページの head に書いている）。
 */
const MOTION_STORAGE_KEY = "exastro-motion";

function isMotionOff() {
  return document.documentElement.classList.contains("is-motion-off");
}

function initMotionToggle() {
  const toggle = document.querySelector(".motion-toggle");
  if (!toggle) return;

  const apply = (on) => {
    document.documentElement.classList.toggle("is-motion-off", !on);
    toggle.setAttribute("aria-pressed", String(on));
    toggle.title = on ? "アニメーションを止める" : "アニメーションを動かす";
  };
  apply(!isMotionOff());

  toggle.addEventListener("click", () => {
    const on = isMotionOff();
    apply(on);
    try {
      localStorage.setItem(MOTION_STORAGE_KEY, on ? "on" : "off");
    } catch {
      // 保存できない環境（プライベートブラウズなど）では、このページの中だけ切り替える
    }
  });
}

/* ===== 画像の拡大表示 =====
 * .image-zoom を押すと、中の画像をダイアログで大きく表示する（見た目は CSS の .image-dialog）。
 * ボタンに data-full があればその画像を、なければ中の画像をそのまま表示する。
 * 閉じるのは × ボタン・背景のクリック・Esc キー（Esc は dialog の標準の動き）。
 * 画像を読み込み終わるまでは .is-loading で前の画像を隠し、読み込み中の表示を出す。
 *
 * data-gallery に同じ値を持つボタンはひとまとまりのスライドにし、前後ボタン・← → キー・スワイプで切り替える
 * （端まで行くと反対の端に戻る）。ボタンが <details> の中にあれば、その summary を見出しとして画像の上に出す。
 * 切り替えるときは今の画像を進む向きへ送り出し（.is-leaving）、次の画像を反対側から入れる（data-dir）。
 */
function initImageDialog() {
  const buttons = document.querySelectorAll(".image-zoom");
  if (!buttons.length) return;

  const dialog = document.createElement("dialog");
  dialog.className = "image-dialog";
  dialog.setAttribute("aria-label", "画像の拡大表示");
  dialog.innerHTML =
    '<figure class="image-dialog__figure">' +
    '<div class="image-dialog__head"></div>' +
    '<img class="image-dialog__img" alt="">' +
    '<figcaption class="image-dialog__caption"></figcaption>' +
    "</figure>" +
    '<div class="image-dialog__nav">' +
    '<button class="image-dialog__step image-dialog__step--prev" type="button" aria-label="前のスライド"></button>' +
    '<p class="image-dialog__count" aria-live="polite"></p>' +
    '<button class="image-dialog__step image-dialog__step--next" type="button" aria-label="次のスライド"></button>' +
    "</div>" +
    '<p class="image-dialog__loading" role="status"></p>' +
    '<button class="image-dialog__close" type="button" aria-label="閉じる"></button>';
  document.body.append(dialog);
  const figure = dialog.querySelector(".image-dialog__figure");
  const head = dialog.querySelector(".image-dialog__head");
  const img = dialog.querySelector(".image-dialog__img");
  const caption = dialog.querySelector(".image-dialog__caption");
  const count = dialog.querySelector(".image-dialog__count");
  const loading = dialog.querySelector(".image-dialog__loading");

  let slides = []; // 開いているスライドのボタン（ギャラリーでなければ 1 枚だけ）
  let current = 0;
  let switching = false;

  // src を差し替えると前の画像の読み込みは取りやめになるので、load・error は今の画像のものだけ届く
  const finish = (failed) => {
    dialog.classList.remove("is-loading");
    dialog.classList.toggle("is-error", failed);
    loading.textContent = failed ? "画像を読み込めませんでした。" : "";
  };
  img.addEventListener("load", () => finish(false));
  img.addEventListener("error", () => finish(true));

  const fullSrc = (button) => {
    const source = button.querySelector("img");
    return button.dataset.full || source.currentSrc || source.src;
  };

  // slides[index] の画像と見出しを表示する
  const show = (index) => {
    current = index;
    const button = slides[index];
    const source = button.querySelector("img");
    dialog.classList.add("is-loading");
    dialog.classList.remove("is-error");
    loading.textContent = "読み込み中…";
    // 前の画像が残って見えないよう、いったん外してから読み込む
    img.removeAttribute("src");
    img.src = fullSrc(button);
    img.alt = source.alt;

    const summary = button.closest("details")?.querySelector("summary");
    head.replaceChildren(...(summary ? Array.from(summary.childNodes, (node) => node.cloneNode(true)) : []));
    head.hidden = !summary;
    caption.textContent = source.alt;
    caption.hidden = !source.alt || !!summary;
    count.textContent = `${index + 1} / ${slides.length}`;

    // 隣のスライドは先に読み込んでおき、切り替えたときに待たせない
    if (slides.length > 1) {
      [index - 1, index + 1].forEach((i) => {
        new Image().src = fullSrc(slides[(i + slides.length) % slides.length]);
      });
    }
  };

  // step = 1 で次へ、-1 で前へ
  const move = (step) => {
    if (slides.length < 2 || switching) return;
    const next = (current + step + slides.length) % slides.length;
    dialog.dataset.dir = step > 0 ? "next" : "prev";
    if (isMotionOff()) {
      show(next);
      return;
    }
    switching = true;
    dialog.classList.add("is-leaving");
    afterLeave = () => {
      stopLeaving();
      show(next);
    };
    figure.addEventListener("animationend", afterLeave, { once: true });
  };

  // 送り出しの途中で閉じたときに、次に開いたときの登場の動きで切り替わらないよう取り消す
  let afterLeave = null;
  const stopLeaving = () => {
    if (afterLeave) figure.removeEventListener("animationend", afterLeave);
    afterLeave = null;
    switching = false;
    dialog.classList.remove("is-leaving");
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!button.querySelector("img")) return;
      const group = button.dataset.gallery;
      slides = group
        ? Array.from(buttons).filter((b) => b.dataset.gallery === group && b.querySelector("img"))
        : [button];
      dialog.classList.toggle("is-gallery", slides.length > 1);
      stopLeaving();
      delete dialog.dataset.dir;
      show(slides.indexOf(button));
      dialog.showModal();
    });
  });

  dialog.querySelector(".image-dialog__step--prev").addEventListener("click", () => move(-1));
  dialog.querySelector(".image-dialog__step--next").addEventListener("click", () => move(1));
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") move(-1);
    else if (e.key === "ArrowRight") move(1);
  });

  // 横に払ったら切り替える（縦の動きが大きいときは何もしない）
  let touchX = null;
  let touchY = 0;
  dialog.addEventListener("touchstart", (e) => {
    touchX = e.touches.length === 1 ? e.touches[0].clientX : null;
    touchY = e.touches[0].clientY;
  }, { passive: true });
  dialog.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    touchX = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
  });

  dialog.querySelector(".image-dialog__close").addEventListener("click", () => dialog.close());
  // 画像と説明の外（ダイアログの余白＝背景）を押したら閉じる
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
}

/* ===== Control Plane の8つの要素：すべて開く／すべて閉じる =====
 * 1つでも閉じていれば「すべて開く」、すべて開いていれば「すべて閉じる」にする。
 * 要素を1つずつ開閉したときも toggle イベントで表示を合わせる。
 * 押したらセクション（#governed-execution）の先頭へスクロールし、開閉した一覧を上から見られるようにする。
 */
function initFeatureToggleAll() {
  const wrap = document.querySelector(".control-plane__toggle-all");
  const features = document.querySelectorAll(".control-plane__feature");
  if (!wrap || !features.length) return;
  const button = wrap.querySelector(".control-plane__toggle-all-button");
  const label = wrap.querySelector(".control-plane__toggle-all-label");

  const allOpen = () => Array.from(features).every((d) => d.open);
  const update = () => {
    const open = allOpen();
    button.setAttribute("aria-expanded", String(open));
    label.textContent = open ? "すべて閉じる" : "すべて開く";
  };

  button.addEventListener("click", () => {
    const open = !allOpen();
    features.forEach((d) => {
      d.open = open;
    });
    const section = wrap.closest(".section");
    if (section) smoothScrollTo(section);
  });
  features.forEach((d) => d.addEventListener("toggle", update));
  update();
  wrap.hidden = false;
}

/* ===== ページ内リンク：なめらかにスクロール =====
 * CSS の scroll-behavior: smooth は、OS でアニメーションを減らす設定にしていると
 * ブラウザが一瞬で移動させてしまうため、JS で毎フレーム位置を動かす。
 */
let smoothScrollFrame = 0;

// 要素の上端までなめらかにスクロールする（ページ内リンクとセクション移動のボタンで共通）
function smoothScrollTo(target) {
  const DURATION = 900; // ミリ秒
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const start = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const end = Math.min(max, Math.max(0, start + target.getBoundingClientRect().top));
  const startTime = performance.now();
  cancelAnimationFrame(smoothScrollFrame);
  const step = (now) => {
    const t = Math.min(1, (now - startTime) / DURATION);
    // html の scroll-behavior: smooth が毎回かからないよう instant で動かす
    window.scrollTo({ top: start + (end - start) * ease(t), behavior: "instant" });
    if (t < 1) smoothScrollFrame = requestAnimationFrame(step);
  };
  smoothScrollFrame = requestAnimationFrame(step);
}

function initAnchorScroll() {
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const id = decodeURIComponent(link.hash.slice(1));
    const target = id ? document.getElementById(id) : document.documentElement;
    if (!target) return;
    e.preventDefault();
    smoothScrollTo(target);
    history.pushState(null, "", link.hash);
  });
}

/* ===== メモリの上下：前後のセクションへ移動 =====
 * 今の表示位置より上（下）で、いちばん近いセクション（最後のセクションの次はフッター）の上端へスクロールする。
 * ページの先頭・末尾では、その先へ移動できないボタンを押せなくする。
 */
function initScrollStep() {
  const prev = document.querySelector(".scroll-step--prev");
  const next = document.querySelector(".scroll-step--next");
  if (!prev || !next) return;
  // 移動先：各セクションと、最後のセクションの次にフッター
  const sections = [...document.querySelectorAll("main .section, .site-footer")];
  const EPSILON = 2; // スクロール位置の端数で同じセクションを選び直さないための余裕（px）

  // 現在の表示位置を基準にした各セクションの上端（小さい順）
  const offsets = () => sections.map((section) => section.getBoundingClientRect().top);

  prev.addEventListener("click", () => {
    const index = offsets().findLastIndex((top) => top < -EPSILON);
    smoothScrollTo(index >= 0 ? sections[index] : document.documentElement);
  });

  next.addEventListener("click", () => {
    const index = offsets().findIndex((top) => top > EPSILON);
    if (index >= 0) smoothScrollTo(sections[index]);
  });

  let pending = false;
  function update() {
    pending = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    prev.disabled = window.scrollY <= EPSILON;
    next.disabled = window.scrollY >= max - EPSILON;
  }

  const requestUpdate = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(update);
  };
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  update();
}

/* ===== お知らせ：フッターが見えたら隠す =====
 * フッターと重ならないよう、フッターが画面に入っている間は .notice-bar に .is-hidden を付ける
 * （隠す動き自体は CSS の transition）。
 */
function initNoticeHide() {
  const notice = document.querySelector(".notice-bar");
  const footer = document.querySelector(".site-footer");
  if (!notice || !footer) return;

  new IntersectionObserver(([entry]) => {
    notice.classList.toggle("is-hidden", entry.isIntersecting);
  }).observe(footer);
}

/* ===== クッキーの告知 =====
 * 画面下端にお知らせの代わりに表示し、OK を押したらフェードアウトしてお知らせを下から出す。
 * 表示している間はフッターの下に余白を取り、OK を押したらフェードアウトと同時に余白を縮める。
 * OK を押したことは localStorage に残し、次に開いたときからは表示せず、少し待ってお知らせを出す
 * （OK を押さずに閉じた・移動した場合は次も表示する）。
 */
const COOKIE_NOTICE_STORAGE_KEY = "exastro-cookie-notice";
const NOTICE_SHOW_DELAY = 500; // 次に開いたとき、お知らせを出すまでの待ち時間（ミリ秒）

function initCookieNotice() {
  const notice = document.querySelector(".cookie-notice");
  const showBar = () => document.documentElement.classList.remove("is-notice-pending");

  let accepted = false;
  try {
    accepted = localStorage.getItem(COOKIE_NOTICE_STORAGE_KEY) === "ok";
  } catch {
    // 読めない環境（プライベートブラウズなど）では毎回表示する
  }
  if (!notice || accepted) {
    setTimeout(showBar, NOTICE_SHOW_DELAY);
    return;
  }
  notice.hidden = false;
  // フッターの下に告知の高さ分の余白を取る（sections.css）
  document.documentElement.classList.add("has-cookie-notice");

  notice.querySelector(".cookie-notice__ok").addEventListener("click", () => {
    notice.classList.add("is-closing");
    document.documentElement.classList.remove("has-cookie-notice");
    notice.addEventListener("transitionend", () => {
      notice.hidden = true;
      showBar();
    }, { once: true });
    try {
      localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, "ok");
    } catch {
      // 保存できない環境では、このページの中だけ閉じる
    }
  });
}

/* ===== News & Articles：ページ送り（/latest/） =====
 * data-per-page の件数ずつ表示し、下のページ送り（.latest__pager）で切り替える。
 * 表示中のページは URL の ?page= に残し、記事から戻ったときや再読み込みでも同じページを出す。
 * JS が動かないときは全件を表示する。
 */
function initNewsPager() {
  const list = document.querySelector(".latest__news[data-per-page]");
  const pager = document.querySelector(".latest__pager");
  if (!list || !pager) return;

  const items = Array.from(list.children);
  const perPage = Number(list.dataset.perPage);
  const pageCount = Math.ceil(items.length / perPage);
  if (!(perPage > 0) || pageCount <= 1) return;

  const makeButton = (label, page, className) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `latest__pager-button ${className}`;
    button.textContent = label;
    button.dataset.page = page;
    return button;
  };
  const prev = makeButton("前へ", 0, "latest__pager-button--prev");
  const next = makeButton("次へ", 0, "latest__pager-button--next");
  const numbers = [];
  for (let i = 1; i <= pageCount; i++) numbers.push(makeButton(String(i), i, "latest__pager-button--num"));
  pager.append(prev, ...numbers, next);
  pager.hidden = false;

  const show = (page) => {
    items.forEach((item, i) => {
      item.hidden = Math.floor(i / perPage) + 1 !== page;
    });
    numbers.forEach((button, i) => {
      if (i + 1 === page) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    prev.dataset.page = page - 1;
    next.dataset.page = page + 1;
    prev.disabled = page === 1;
    next.disabled = page === pageCount;
  };

  const params = new URLSearchParams(location.search);
  const initial = Math.min(pageCount, Math.max(1, Math.floor(Number(params.get("page"))) || 1));
  show(initial);

  pager.addEventListener("click", (e) => {
    const button = e.target.closest(".latest__pager-button");
    if (!button || button.disabled) return;
    const page = Number(button.dataset.page);
    show(page);
    const url = new URL(location.href);
    if (page === 1) url.searchParams.delete("page");
    else url.searchParams.set("page", page);
    history.replaceState(null, "", url);
    // 切り替えたら一覧の先頭へ戻す（固定ヘッダーの分は scroll-margin-top で空ける）
    list.scrollIntoView({ block: "start" });
  });
}

/* ===== お知らせ：最新リリース =====
 * GitHub の API から最新リリースのバージョンと公開日を取得して表示する。
 * 取得できなかった場合は HTML に書いた文言（リリースページへのリンク）のまま。
 */
function initReleaseNotice() {
  const text = document.querySelector(".notice-bar__text");
  if (!text) return;

  const API_URL = "https://api.github.com/repos/exastro-suite/exastro-it-automation/releases/latest";
  fetch(API_URL, { headers: { Accept: "application/vnd.github+json" } })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((release) => {
      const date = new Date(release.published_at);
      if (!release.tag_name || Number.isNaN(date.getTime())) return;
      const published = date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
      text.textContent = `Exastro IT Automation ${release.tag_name} を ${published} にリリースしました。`;
    })
    .catch((error) => console.warn("最新リリースを取得できませんでした。", error));
}

/* ===== スクロール位置のメモリ =====
 * ページ全体のどこまでスクロールしたかを 0〜100% で右端に表示する。
 * メモリ上をクリックするとその位置へ移動し、ドラッグで連続してスクロールできる。
 */
function initScrollMeter() {
  const meter = document.querySelector(".scroll-meter");
  if (!meter) return;
  const ticks = meter.querySelector(".scroll-meter__ticks");
  const current = meter.querySelector(".scroll-meter__current");

  const TICK_STEP = 5;    // 目盛りの間隔（%）
  const MAJOR_STEP = 25;  // 長い目盛りと数値を付ける間隔（%）

  for (let v = 0; v <= 100; v += TICK_STEP) {
    const tick = document.createElement("span");
    tick.className = "scroll-meter__tick";
    tick.style.setProperty("--pos", v / 100);
    if (v % MAJOR_STEP === 0) {
      tick.classList.add("is-major");
      const label = document.createElement("span");
      label.className = "scroll-meter__label";
      label.textContent = `${v}%`;
      tick.append(label);
    }
    ticks.append(tick);
  }

  let pending = false;
  function update() {
    pending = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    meter.style.setProperty("--progress", progress.toFixed(4));
    current.textContent = `${Math.round(progress * 100)}%`;
  }

  // スクロールイベントは連続して来るので、1フレームに1回だけ更新する
  function requestUpdate() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(update);
  }

  // メモリ上の縦位置（0〜1）に対応するページ位置へスクロールする
  function scrollToPointer(e, behavior) {
    const rect = meter.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: ratio * max, behavior });
  }

  meter.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    meter.setPointerCapture(e.pointerId);
    meter.classList.add("is-dragging");
    scrollToPointer(e, "smooth");
  });

  // ドラッグ中はカーソルに遅れずついてくるよう、アニメーションなしで動かす
  meter.addEventListener("pointermove", (e) => {
    if (!meter.hasPointerCapture(e.pointerId)) return;
    scrollToPointer(e, "instant");
  });

  const endDrag = () => meter.classList.remove("is-dragging");
  meter.addEventListener("pointerup", endDrag);
  meter.addEventListener("pointercancel", endDrag);

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  update();
}

/* ===== 背景画像：読み込み完了でフェードイン =====
 * 画像は CSS（.section-bg::after）で指定しているので、その URL を読み取って先読みし、
 * 読み込めたら .section-bg に .is-bg-loaded を付ける（フェード自体は CSS の transition）。
 */
function fadeInBackgroundImage() {
  const bgEl = document.querySelector(".section-bg");
  if (!bgEl) return;

  // キャッシュ済みで即座に読み込めた場合も、透明な状態を一度描画してから
  // クラスを付けないとフェードが起きないため、2フレーム待つ
  const show = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    bgEl.classList.add("is-bg-loaded");
  }));
  const bg = getComputedStyle(bgEl, "::after").backgroundImage;
  const match = bg.match(/url\(["']?(.+?)["']?\)/);
  if (!match) {
    show();
    return;
  }

  const img = new Image();
  img.src = match[1];
  // decode() でデコードまで済ませてから表示し、フェード中のカクつきを防ぐ
  img.decode().then(show, show);
}

/* ===== 背景：ループする立体格子 =====
 * 立方体格子の中をカメラが前進し続け、1マス進むごとに位置を戻してループさせる。
 * カメラは左右・上下とも45度振った向き（BASE_YAW・BASE_PITCH）を基準にし、
 * マウス位置に合わせてそこから向き（ヨー・ピッチ）が滑らかに変わる。
 * 描画範囲はセクション1の背景（.section-bg）で、画面外にある間は描画を止める。
 */
function initGridBackground() {
  const canvas = document.querySelector(".bg-grid");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const bgEl = canvas.closest(".section-bg");

  const RANGE = 16;              // カメラから各軸に何マス分の格子を描くか
  const FAR = RANGE;            // この距離で完全にフェードアウト
  const NEAR = 0.05;            // ニアクリップ面
  const SPEED = 0.1;           // 前進速度（マス/秒）
  const BASE_YAW = Math.PI / 4;   // 基準の左右の向き（45度。正で右を向く）
  const BASE_PITCH = Math.PI / 4; // 基準の上下の向き（45度。正で見下ろす）
  const MAX_YAW = 0.2;         // 左右の最大回転（ラジアン）
  const MAX_PITCH = 0.15;        // 上下の最大回転（ラジアン）
  const EASE = 0.5;               // マウス追従の滑らかさ（大きいほど速い）
  const BUCKETS = 8;           // 透明度ごとにまとめて描画する段階数
  const NODE_SIZE = 0.01;       // 交点の半径（格子1マスに対する比率）
  const NODE_MIN = 0.6;         // 交点の最小半径（線幅に対する倍率）
  const NODE_MAX = 3;           // 交点の最大半径（px）
  const BG_TILT = 0.15;         // 背景画像の傾き（格子の回転に対する比率）

  // 奥（暗い青）→ 手前（シアン）の色
  const FAR_COLOR = [30, 79, 216];   // --color-cosmic-blue
  const NEAR_COLOR = [0, 200, 255];  // --color-neon-cyan

  const SIZE = RANGE * 2 + 1;
  const COUNT = SIZE * SIZE * SIZE;
  const px = new Float32Array(COUNT); // カメラ座標系での点
  const py = new Float32Array(COUNT);
  const pz = new Float32Array(COUNT);
  const bucketPaths = new Array(BUCKETS);
  const nodePaths = new Array(BUCKETS);
  const bucketStyles = [];
  for (let b = 0; b < BUCKETS; b++) {
    const t = (b + 1) / BUCKETS;
    const c = FAR_COLOR.map((v, i) => Math.round(v + (NEAR_COLOR[i] - v) * t));
    bucketStyles.push({
      color: `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${(t * 0.85).toFixed(3)})`,
      width: 0.6 + t * 1.2,
    });
  }

  let width = 0;
  let height = 0;
  let focal = 0;
  let dpr = 1;

  const pointer = { x: 0, y: 0 };   // -1〜1 に正規化したマウス位置
  const view = { yaw: BASE_YAW, pitch: BASE_PITCH, x: 0, y: 0 };
  let offset = 0;
  let lastTime = performance.now();
  let visible = true;
  let needsRender = true; // アニメーションを止めている間も、サイズが変わったら1枚だけ描き直す

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    focal = Math.max(width, height) * 0.6;
    needsRender = true;
  }

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / width) * 2 - 1;
    pointer.y = ((e.clientY - rect.top) / height) * 2 - 1;
  }

  function onPointerLeave() {
    pointer.x = 0;
    pointer.y = 0;
  }

  // 背景画像を格子と同じ向きに、控えめに傾ける（基準の45度の分は傾けず、マウスで動いた分だけ）
  function updateBackgroundTilt() {
    const style = bgEl.style;
    style.setProperty("--bg-ry", `${((view.yaw - BASE_YAW) * BG_TILT).toFixed(4)}rad`);
    style.setProperty("--bg-rx", `${(-(view.pitch - BASE_PITCH) * BG_TILT).toFixed(4)}rad`);
  }

  function update(dt) {
    offset = (offset + SPEED * dt) % 1;

    const k = 1 - Math.exp(-EASE * dt);
    view.yaw += (BASE_YAW + pointer.x * MAX_YAW - view.yaw) * k;
    view.pitch += (BASE_PITCH + pointer.y * MAX_PITCH - view.pitch) * k;
    // 向きに加えて位置も少しずらし、視差で立体感を強める
    view.x += (pointer.x * 0.18 - view.x) * k;
    view.y += (pointer.y * 0.12 - view.y) * k;
  }

  // 格子点をカメラ座標系に変換
  function transformPoints() {
    const cy = Math.cos(view.yaw), sy = Math.sin(view.yaw);
    const cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
    let n = 0;
    for (let i = -RANGE; i <= RANGE; i++) {
      const wx = i - view.x;
      for (let j = -RANGE; j <= RANGE; j++) {
        const wy = j - view.y;
        for (let l = -RANGE; l <= RANGE; l++) {
          const wz = l - offset;
          const x1 = wx * cy - wz * sy;
          const z1 = wx * sy + wz * cy;
          px[n] = x1;
          py[n] = wy * cp - z1 * sp;
          pz[n] = wy * sp + z1 * cp;
          n++;
        }
      }
    }
  }

  function addSegment(a, b) {
    let ax = px[a], ay = py[a], az = pz[a];
    let bx = px[b], by = py[b], bz = pz[b];

    // 中点までの距離でフェード（球状に消えていく）
    const mx = (ax + bx) / 2, my = (ay + by) / 2, mz = (az + bz) / 2;
    const dist = Math.sqrt(mx * mx + my * my + mz * mz);
    if (dist >= FAR) return;

    if (az < NEAR && bz < NEAR) return;
    if (az < NEAR) {
      const t = (NEAR - az) / (bz - az);
      ax += (bx - ax) * t; ay += (by - ay) * t; az = NEAR;
    } else if (bz < NEAR) {
      const t = (NEAR - bz) / (az - bz);
      bx += (ax - bx) * t; by += (ay - by) * t; bz = NEAR;
    }

    const fade = 1 - dist / FAR;
    const alpha = fade * fade * Math.min(1, dist / 0.8);
    const bucket = Math.min(BUCKETS - 1, Math.floor(alpha * BUCKETS));
    if (bucket < 0) return;

    const path = bucketPaths[bucket];
    const hw = width / 2, hh = height / 2;
    path.moveTo(hw + (ax / az) * focal, hh + (ay / az) * focal);
    path.lineTo(hw + (bx / bz) * focal, hh + (by / bz) * focal);
  }

  // 交点を線より少し太い点として描く（遠近に合わせて大きさが変わる）
  function addNode(n) {
    const x = px[n], y = py[n], z = pz[n];
    if (z < NEAR) return;
    const dist = Math.sqrt(x * x + y * y + z * z);
    if (dist >= FAR) return;

    const fade = 1 - dist / FAR;
    const alpha = fade * fade * Math.min(1, dist / 0.8);
    const bucket = Math.min(BUCKETS - 1, Math.floor(alpha * BUCKETS));

    const minRadius = (bucketStyles[bucket].width / 2) * NODE_MIN;
    const radius = Math.min(NODE_MAX, Math.max(minRadius, (NODE_SIZE / z) * focal));
    const sx = width / 2 + (x / z) * focal;
    const sy = height / 2 + (y / z) * focal;
    if (sx < -radius || sx > width + radius || sy < -radius || sy > height + radius) return;

    const path = nodePaths[bucket];
    path.moveTo(sx + radius, sy);
    path.arc(sx, sy, radius, 0, Math.PI * 2);
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    transformPoints();

    for (let b = 0; b < BUCKETS; b++) {
      bucketPaths[b] = new Path2D();
      nodePaths[b] = new Path2D();
    }

    const strideI = SIZE * SIZE;
    const strideJ = SIZE;
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE; j++) {
        for (let l = 0; l < SIZE; l++) {
          const n = i * strideI + j * strideJ + l;
          if (i + 1 < SIZE) addSegment(n, n + strideI);
          if (j + 1 < SIZE) addSegment(n, n + strideJ);
          if (l + 1 < SIZE) addSegment(n, n + 1);
          addNode(n);
        }
      }
    }

    ctx.lineCap = "round";
    for (let b = 0; b < BUCKETS; b++) {
      ctx.strokeStyle = bucketStyles[b].color;
      ctx.lineWidth = bucketStyles[b].width;
      ctx.stroke(bucketPaths[b]);
      ctx.fillStyle = bucketStyles[b].color;
      ctx.fill(nodePaths[b]);
    }
  }

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    // アニメーションを止めている間は前進もマウスへの追従もせず、止まった絵のままにする
    const paused = isMotionOff();
    if (visible && (!paused || needsRender)) {
      if (!paused) {
        update(dt);
        updateBackgroundTilt();
      }
      render();
      needsRender = false;
    }
    requestAnimationFrame(loop);
  }

  // セクションの高さは内容や画面幅で変わるので、要素のサイズ変化を監視する
  new ResizeObserver(resize).observe(canvas);
  resize();

  // 画面外にある間は描画しない
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }).observe(canvas);

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onPointerLeave);
  requestAnimationFrame(loop);
}
