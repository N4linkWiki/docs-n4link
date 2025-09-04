// === ADVANCED DOCUMENTATION SYSTEM ===
class AdvancedDocumentation {
  constructor() {
    this.currentSection = "welcome";
    this.searchIndex = [];
    this.shortcuts = {};
    this.readingProgress = 0;

    this.init();
  }

  init() {
    this.buildSearchIndex();
    this.setupEventListeners();
    this.initializeFeatures();
    this.setupKeyboardShortcuts();
  }

  buildSearchIndex() {
    // Build search index from all content
    const sections = document.querySelectorAll(".content-section");
    sections.forEach((section) => {
      const title = section.querySelector("h1, h2")?.textContent || "";
      const content = section.textContent.toLowerCase();
      const id = section.id;

      this.searchIndex.push({
        id,
        title,
        content,
        element: section,
      });
    });
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById("search-input");
    const searchResults = document.getElementById("search-results");

    if (searchInput && searchResults) {
      searchInput.addEventListener("input", (e) => {
        this.handleSearch(e.target.value, searchResults);
      });
    }

    // Reading progress
    window.addEventListener("scroll", () => {
      this.updateReadingProgress();
      this.updateBackToTop();
      this.updateBreadcrumb();
      this.updateTOC();
    });

    // Close search on click outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-container")) {
        const searchResults = document.getElementById("search-results");
        if (searchResults) {
          searchResults.classList.remove("show");
        }
      }
    });

    // URL hash handling
    window.addEventListener("hashchange", () => {
      this.handleHashChange();
    });

    // Company logo interactions
    document.querySelectorAll(".company-logo").forEach((logo) => {
      logo.addEventListener("click", () => {
        this.showCompanyInfo(logo.dataset.company);
      });
    });
  }

  handleSearch(query, resultsContainer) {
    if (query.length < 2) {
      resultsContainer.classList.remove("show");
      return;
    }

    const results = this.searchIndex
      .filter(
        (item) =>
          item.content.includes(query.toLowerCase()) ||
          item.title.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);

    this.displaySearchResults(results, query, resultsContainer);
  }

  displaySearchResults(results, query, container) {
    if (results.length === 0) {
      container.innerHTML =
        '<div class="search-result-item">Nenhum resultado encontrado</div>';
    } else {
      container.innerHTML = results
        .map((result) => {
          const highlightedTitle = this.highlightText(result.title, query);
          const snippet = this.getSnippet(result.content, query);

          return `
                            <div class="search-result-item" onclick="showSection('${result.id}')">
                                <div class="search-result-title">${highlightedTitle}</div>
                                <div class="search-result-content">${snippet}</div>
                            </div>
                        `;
        })
        .join("");
    }
    container.classList.add("show");
  }

  highlightText(text, query) {
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, '<span class="search-highlight">$1</span>');
  }

  getSnippet(content, query) {
    const queryIndex = content.toLowerCase().indexOf(query.toLowerCase());
    if (queryIndex === -1) return content.substring(0, 100) + "...";

    const start = Math.max(0, queryIndex - 50);
    const end = Math.min(content.length, queryIndex + query.length + 50);
    let snippet = content.substring(start, end);

    if (start > 0) snippet = "..." + snippet;
    if (end < content.length) snippet = snippet + "...";

    return this.highlightText(snippet, query);
  }

  updateReadingProgress() {
    const currentSectionElement = document.querySelector(
      ".content-section.active"
    );
    if (!currentSectionElement) return;

    const rect = currentSectionElement.getBoundingClientRect();
    const sectionHeight = currentSectionElement.offsetHeight;
    const viewportHeight = window.innerHeight;
    const scrolled = Math.max(0, -rect.top);
    const progress = Math.min(
      100,
      (scrolled / (sectionHeight - viewportHeight)) * 100
    );

    const progressBar = document.getElementById("reading-progress");
    if (progressBar) {
      progressBar.style.width = `${Math.max(0, progress)}%`;
    }
  }

  updateBackToTop() {
    const backToTop = document.getElementById("back-to-top");
    if (backToTop) {
      if (window.scrollY > 500) {
        backToTop.classList.add("show");
      } else {
        backToTop.classList.remove("show");
      }
    }
  }

  updateBreadcrumb() {
    const breadcrumb = document.getElementById("breadcrumb");
    const current = document.getElementById("breadcrumb-current");

    if (breadcrumb && current) {
      if (window.scrollY > 200) {
        breadcrumb.classList.add("show");
        const activeSection = document.querySelector(".content-section.active");
        if (activeSection) {
          const title =
            activeSection.querySelector("h1, h2")?.textContent || "";
          current.textContent = title;
        }
      } else {
        breadcrumb.classList.remove("show");
      }
    }
  }

  updateTOC() {
    const currentSection = document.querySelector(".content-section.active");
    const tocContainer = document.getElementById("toc-container");
    const tocContent = document.getElementById("toc-content");

    if (!tocContainer || !tocContent || !currentSection) {
      if (tocContainer) tocContainer.classList.remove("show");
      return;
    }

    const headings = currentSection.querySelectorAll("h2, h3");
    if (headings.length < 2) {
      tocContainer.classList.remove("show");
      return;
    }

    tocContent.innerHTML = Array.from(headings)
      .map((heading, index) => {
        const id = `toc-${this.currentSection}-${index}`;
        heading.id = id;
        return `<a href="#${id}" class="toc-item" onclick="event.preventDefault(); advancedDocs.scrollToHeading('${id}'); return false;">${heading.textContent}</a>`;
      })
      .join("");

    tocContainer.classList.add("show");

    // Update active TOC item
    this.updateActiveTOCItem(headings);
  }

  scrollToHeading(headingId) {
    const element = document.getElementById(headingId);
    if (element) {
      const headerHeight = 140; // Altura do header fixo + margem
      const elementPosition =
        element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }

  updateActiveTOCItem(headings) {
    const tocItems = document.querySelectorAll(".toc-item");
    let activeIndex = -1;
    const scrollPosition = window.scrollY + 150; // Offset para o header

    headings.forEach((heading, index) => {
      const headingPosition =
        heading.getBoundingClientRect().top + window.pageYOffset;
      if (scrollPosition >= headingPosition) {
        activeIndex = index;
      }
    });

    // Se nenhuma seção foi encontrada, ativar a primeira
    if (activeIndex === -1) activeIndex = 0;

    tocItems.forEach((item, index) => {
      item.classList.toggle("active", index === activeIndex);
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ctrl+K or Cmd+K for search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("search-input");
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Escape to close dropdowns
      if (e.key === "Escape") {
        const searchResults = document.getElementById("search-results");
        const translatorDropdown = document.getElementById(
          "translator-dropdown"
        );

        if (searchResults) searchResults.classList.remove("show");
        if (translatorDropdown) translatorDropdown.classList.remove("show");
      }

      // Home key to scroll to top
      if (e.key === "Home" && !e.target.matches("input, textarea")) {
        e.preventDefault();
        this.scrollToTop();
      }

      // End key to scroll to bottom
      if (e.key === "End" && !e.target.matches("input, textarea")) {
        e.preventDefault();
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }
    });
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  showCompanyInfo(companyName) {
    console.log(`Showing info for: ${companyName}`);
  }

  handleHashChange() {
    const hash = window.location.hash.slice(1);
    if (hash && document.getElementById(hash)) {
      showSection(hash);
    }
  }

  initializeFeatures() {
    setTimeout(() => {
      this.updateReadingProgress();
      this.updateTOC();
    }, 100);
  }
}

// === MOBILE MENU SYSTEM ===
function toggleMobileMenu() {
  const overlay = document.getElementById("mobile-menu-overlay");
  const menu = document.getElementById("mobile-menu");
  const button = document.getElementById("mobile-menu-button");
  const hamburger = document.getElementById("hamburger");

  if (!overlay || !menu || !hamburger) return;

  const isOpen = overlay.classList.contains("show");

  if (isOpen) {
    overlay.classList.remove("show");
    menu.classList.remove("show");
    hamburger.classList.remove("active");
    document.body.style.overflow = "";
  } else {
    // Copy sidebar content to mobile menu
    const sidebarNav = document.querySelector(".sidebar nav");
    const mobileNavContent = document.getElementById("mobile-nav-content");
    if (sidebarNav && mobileNavContent) {
      mobileNavContent.innerHTML = sidebarNav.innerHTML;
    }

    overlay.classList.add("show");
    menu.classList.add("show");
    hamburger.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

// === THEME SYSTEM ===
class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem("n4link-theme") || "light";
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.updateUI();
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === "light" ? "dark" : "light";
    this.applyTheme(this.currentTheme);
    this.updateUI();
    localStorage.setItem("n4link-theme", this.currentTheme);
  }

  applyTheme(theme) {
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }

  updateUI() {
    const themeIcon = document.getElementById("theme-icon");
    if (themeIcon) {
      if (this.currentTheme === "light") {
        themeIcon.className = "sun-icon";
      } else {
        themeIcon.className = "moon-icon";
      }
    }
  }
}

// === NAVIGATION SYSTEM ===
function showSection(sectionId) {
  // Remove active class from all sections
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active");
  });

  // Add active class to target section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add("active");
    if (advancedDocs) {
      advancedDocs.currentSection = sectionId;
    }
  }

  // Update navigation buttons
  document.querySelectorAll(".nav-links button").forEach((btn) => {
    btn.classList.remove("active");
  });

  const activeButton = document.querySelector(
    `[onclick="showSection('${sectionId}')"]`
  );
  if (activeButton) {
    activeButton.classList.add("active");
  }

  // Update URL hash
  window.history.pushState(null, null, `#${sectionId}`);

  // Close mobile menu if open
  const overlay = document.getElementById("mobile-menu-overlay");
  if (overlay && overlay.classList.contains("show")) {
    toggleMobileMenu();
  }

  // Close search results
  const searchResults = document.getElementById("search-results");
  if (searchResults) {
    searchResults.classList.remove("show");
  }

  window.scrollTo({ top: 0, behavior: "smooth" });

  // Update TOC and other features
  setTimeout(() => {
    if (advancedDocs) {
      advancedDocs.updateTOC();
      advancedDocs.updateReadingProgress();
    }
  }, 100);
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// === GLOBAL FUNCTIONS ===
function toggleTheme() {
  if (themeManager) {
    themeManager.toggleTheme();
  }
}

function toggleTranslator() {
  const dropdown = document.getElementById("translator-dropdown");
  if (dropdown) {
    dropdown.classList.toggle("show");
  }
}

// Global instances
const themeManager = new ThemeManager();
let advancedDocs;

// Close dropdowns when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".translator")) {
    const dropdown = document.getElementById("translator-dropdown");
    if (dropdown) {
      dropdown.classList.remove("show");
    }
  }
});

// Initialize everything
document.addEventListener("DOMContentLoaded", () => {
  themeManager.init();

  const firstNavButton = document.querySelector(".nav-links button");
  if (firstNavButton) {
    firstNavButton.classList.add("active");
  }

  // Initialize advanced documentation features
  advancedDocs = new AdvancedDocumentation();

  // Handle initial hash
  const hash = window.location.hash.slice(1);
  if (hash && document.getElementById(hash)) {
    showSection(hash);
  }
});
