function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function getFranchiseData() {
  const franchiseKey = getQueryParam("franchise") || "marvel";
  return {
    franchiseKey,
    franchise: window.SITE_DATA.franchises[franchiseKey]
  };
}

function getUniverseData() {
  const { franchiseKey, franchise } = getFranchiseData();
  const universeId = getQueryParam("universe");
  const universe = franchise?.universes.find((entry) => entry.id === universeId);
  return { franchiseKey, franchise, universeId, universe };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function titleCaseImportance(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function renderUniversePage() {
  const page = document.body.dataset.page;
  if (page !== "universe") return;

  const { franchiseKey, franchise } = getFranchiseData();
  if (!franchise) return;

  const titleEl = document.getElementById("franchiseTitle");
  const headingEl = document.getElementById("universeHeading");
  const subheadingEl = document.getElementById("universeSubheading");
  const gridEl = document.getElementById("universeGrid");

  titleEl.textContent = franchise.label;
  headingEl.textContent = franchise.heading;
  subheadingEl.textContent = franchise.subheading;

  gridEl.innerHTML = franchise.universes
  .map((universe) => {
    const cardLink = `timeline.html?franchise=${franchiseKey}&universe=${universe.id}`;
    const countLabel = universe.count === 1 ? "title" : "titles";
const previewItems = universe.items || [];

    return `
      <a class="universe-card universe-hover-card" href="${cardLink}" data-universe-id="${escapeHtml(universe.id)}">
        <div class="universe-main">
          <div>
            <h2>${escapeHtml(universe.name)}</h2>
            <p>${escapeHtml(universe.description)}</p>
          </div>

          <div class="universe-footer">
            <strong>${universe.count} ${countLabel}</strong>
            <span>View Timeline →</span>
          </div>
        </div>

        <div class="universe-preview">
          <div class="universe-preview-track">
            ${previewItems
              .map(
                (item) => `
                  <div class="universe-preview-poster">
                    <img src="${escapeHtml(item.posterImage)}" alt="${escapeHtml(item.title)} poster" loading="lazy">
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
      </a>
    `;
  })
  .join("");
}

const ORDER_META = {
  recommended: {
    label: "Recommended Order",
    text: "The best order for first-time viewers, optimizing story flow and reveals."
  },
  release: {
    label: "Release Order",
    text: "The order these projects originally came out."
  },
  chronological: {
    label: "Chronological Order",
    text: "The order events happen in-universe."
  }
};

function sortItems(items, orderType) {
  const map = {
    recommended: "recommendedOrder",
    release: "releaseOrder",
    chronological: "chronologicalOrder"
  };

  const key = map[orderType] || "recommendedOrder";
  return [...items].sort((a, b) => a[key] - b[key]);
}

function sequenceKey(items, type) {
  return sortItems(items, type)
    .map((item) => item.id)
    .join("|");
}

function getAvailableOrders(items) {
  const preferredOrder = ["recommended", "release", "chronological"];
  const seen = new Set();
  const result = [];

  preferredOrder.forEach((type) => {
    const key = sequenceKey(items, type);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(type);
    }
  });

  return result;
}

function createTimelineCard(item, orderType) {
  const importanceClass = `tag-${item.importance}`;
  const rankMap = {
    recommended: item.recommendedOrder,
    release: item.releaseOrder,
    chronological: item.chronologicalOrder
  };

  return `
    <article class="timeline-card" data-item-id="${escapeHtml(item.id)}">
      <div class="poster-image-wrap">
        <img
          class="poster-image"
          src="${escapeHtml(item.posterImage)}"
          alt="${escapeHtml(item.title)} poster"
          loading="lazy"
        />
        <div class="poster-top">
          <span class="rating-pill">
            <span class="gold-star">★</span>${item.rating.toFixed(1)}
          </span>
          <span class="tag-pill ${importanceClass}">
  ${escapeHtml(
    item.importance === "recommended"
      ? "Recommend"
      : item.importance === "skippable"
      ? "Skip"
      : titleCaseImportance(item.importance)
  )}
</span>
        </div>
      </div>

      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(String(item.year))}</p>

      <div class="order-marker">
        <span class="order-dot"></span>
        <span>#${rankMap[orderType]}</span>
      </div>
    </article>
  `;
}

function iconSvg(type) {
  const icons = {
    calendar:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"></rect><line x1="8" y1="3.5" x2="8" y2="7"></line><line x1="16" y1="3.5" x2="16" y2="7"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    clock:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><line x1="12" y1="7.5" x2="12" y2="12.5"></line><line x1="12" y1="12.5" x2="15.5" y2="14.5"></line></svg>',
    user:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"></circle><path d="M5 19c1.8-3.1 4.1-4.5 7-4.5s5.2 1.4 7 4.5"></path></svg>',
    play:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><polygon points="10,8.5 16,12 10,15.5"></polygon></svg>'
  };

  return icons[type];
}

function renderModalItem(item) {
  const modalHero = document.getElementById("modalHero");
  const modalBody = document.getElementById("modalBody");

  modalHero.innerHTML = `
    <img src="${escapeHtml(item.posterImage)}" alt="" class="modal-hero-image" />
  `;

  modalBody.innerHTML = `
    <div class="modal-layout">
      <div class="modal-poster-wrap">
        <img
          class="modal-poster-image"
          src="${escapeHtml(item.posterImage)}"
          alt="${escapeHtml(item.title)} poster"
        />
      </div>

      <div>
  <div class="modal-header-copy">
    <div class="modal-title-row">
      <h2>${escapeHtml(item.title)}</h2>
      <span class="modal-year">(${escapeHtml(String(item.year))})</span>
    </div>

    <div class="modal-meta-line">
      <span><span class="gold-star">★</span> ${item.rating.toFixed(1)}/10</span>
      <span>•</span>
      <span>${escapeHtml(item.watch)}</span>
      <span class="tag-pill tag-${item.importance}">
        ${escapeHtml(titleCaseImportance(item.importance))}
      </span>
    </div>
  </div>

  <div class="synopsis-block">
          <h3>Synopsis</h3>
          <p>${escapeHtml(item.synopsis)}</p>
        </div>

        <div class="meta-grid">
          <div class="meta-block">
            <span class="meta-icon">${iconSvg("calendar")}</span>
            <div>
              <small>Release Date</small>
              <strong>${escapeHtml(item.releaseDate)}</strong>
            </div>
          </div>

          <div class="meta-block">
            <span class="meta-icon">${iconSvg("play")}</span>
            <div>
              <small>Where to Watch</small>
              <strong><span class="watch-pill">${escapeHtml(item.watch)}</span></strong>
            </div>
          </div>

          <div class="meta-block">
            <span class="meta-icon">${iconSvg("clock")}</span>
            <div>
              <small>Duration</small>
              <strong>${escapeHtml(item.duration)}</strong>
            </div>
          </div>

          <div class="meta-block">
            <span class="meta-icon">${iconSvg("user")}</span>
            <div>
              <small>Director / Creator</small>
              <strong>${escapeHtml(item.director)}</strong>
            </div>
          </div>
        </div>

        <div class="reason-box">
          <div class="reason-title">
            <span class="dot ${escapeHtml(item.importance)}"></span>
            <span>Why is this ${escapeHtml(titleCaseImportance(item.importance))}?</span>
          </div>
          <div>${escapeHtml(item.reason)}</div>
        </div>
      </div>
    </div>
  `;
}

function renderTimelinePage() {
  const page = document.body.dataset.page;
  if (page !== "timeline") return;

  const { franchiseKey, universe } = getUniverseData();
  if (!universe) return;

  const backLink = document.getElementById("backToUniverse");
  const titleEl = document.getElementById("timelineTitle");
  const descEl = document.getElementById("timelineDescription");
  const trackEl = document.getElementById("timelineTrack");
  const orderDescEl = document.getElementById("orderDescription");
  const tabsWrap = document.getElementById("tabRow");
  const modal = document.getElementById("modalOverlay");
  const closeModalButton = document.getElementById("closeModal");

  backLink.href = `universe.html?franchise=${franchiseKey}`;
  titleEl.textContent = universe.name;
  descEl.textContent = universe.description;

  const availableOrders = getAvailableOrders(universe.items);
  let currentOrder = availableOrders[0] || "recommended";

  function renderTabs() {
    tabsWrap.innerHTML = availableOrders
      .map((type, index) => {
        const label = availableOrders.length === 1 ? "Watch Order" : ORDER_META[type].label;
        return `<button class="tab-button ${index === 0 ? "active" : ""}" data-order="${type}">${label}</button>`;
      })
      .join("");

    tabsWrap.querySelectorAll(".tab-button").forEach((tab) => {
      tab.addEventListener("click", () => {
        tabsWrap.querySelectorAll(".tab-button").forEach((entry) => {
          entry.classList.remove("active");
        });

        tab.classList.add("active");
        currentOrder = tab.dataset.order;
        renderCards();
      });
    });
  }

  function renderCards() {
    orderDescEl.textContent =
      availableOrders.length === 1
        ? "This universe only needs one watch order because the available orders match."
        : ORDER_META[currentOrder].text;

    const sortedItems = sortItems(universe.items, currentOrder);

    trackEl.innerHTML = sortedItems
      .map((item) => createTimelineCard(item, currentOrder))
      .join("");

    trackEl.querySelectorAll(".timeline-card").forEach((card) => {
      card.addEventListener("click", () => {
        const selected = sortedItems.find((entry) => entry.id === card.dataset.itemId);
        if (!selected) return;

        renderModalItem(selected);
        modal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
      });
    });
  }

  renderTabs();
  renderCards();

 function closeModal() {
  modal.classList.add("closing");

  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("closing");
    document.body.style.overflow = "";
  }, 180);
}

closeModalButton?.addEventListener("click", closeModal);

modal?.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});
}

function enableUniverseHoverRotation() {
  const cards = document.querySelectorAll(".universe-hover-card");

  cards.forEach((card) => {
    const posters = Array.from(card.querySelectorAll(".universe-preview-poster"));

    if (posters.length === 0) return;

    let interval = null;
    let currentIndex = 0;

    function updateRotation() {
      const total = posters.length;

      posters.forEach((poster, i) => {
        poster.classList.remove("is-center", "is-left", "is-right", "is-hidden");

        if (total === 1) {
          poster.classList.add("is-center");
          return;
        }

        if (i === currentIndex) {
          poster.classList.add("is-center");
        } else if (i === (currentIndex + 1) % total) {
          poster.classList.add("is-right");
        } else if (i === (currentIndex - 1 + total) % total) {
          poster.classList.add("is-left");
        } else {
          poster.classList.add("is-hidden");
        }
      });
    }

    function startRotation() {
      updateRotation();

      interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % posters.length;
        updateRotation();
      }, 1200);
    }

    function stopRotation() {
      clearInterval(interval);
      interval = null;
      currentIndex = 0;
      updateRotation();
    }

    card.addEventListener("mouseenter", () => {
      if (!interval) startRotation();
    });

    card.addEventListener("mouseleave", () => {
      stopRotation();
    });

    updateRotation();
  });
}

renderUniversePage();
enableUniverseHoverRotation();
renderTimelinePage();