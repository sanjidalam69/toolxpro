// ToolX Pro - Advanced Search & Autocomplete Engine (v35.0)
document.addEventListener("DOMContentLoaded", () => {
    const searchBar = document.getElementById("search-bar");
    const searchContainer = document.querySelector(".search-container");
    const toolCards = document.querySelectorAll(".tool-card");
    const toolSections = document.querySelectorAll(".tools-section");

    if (searchBar && searchContainer) {
        // Create Floating Live Autocomplete Dropdown
        const dropdown = document.createElement("div");
        dropdown.id = "search-dropdown-results";
        dropdown.className = "search-dropdown";
        dropdown.style.display = "none";
        searchContainer.appendChild(dropdown);

        let selectedIndex = -1;

        searchBar.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            const path = window.location.pathname.toLowerCase();
            const isSubFolder = path.includes('/tools/') || path.includes('/blog/') || path.includes('/categories/');
            const hubCards = document.querySelectorAll(".hub-card");

            // 1. Filter Homepage Category Hub Cards (if on homepage)
            if (hubCards.length > 0) {
                hubCards.forEach(card => {
                    if (query === "") {
                        card.style.display = "flex";
                    } else {
                        const title = card.querySelector(".hub-card-title") ? card.querySelector(".hub-card-title").innerText.toLowerCase() : "";
                        const desc = card.querySelector(".hub-card-desc") ? card.querySelector(".hub-card-desc").innerText.toLowerCase() : "";
                        const toolsList = card.querySelector(".hub-tools-list") ? card.querySelector(".hub-tools-list").innerText.toLowerCase() : "";
                        const isMatch = title.includes(query) || desc.includes(query) || toolsList.includes(query);
                        card.style.display = isMatch ? "flex" : "none";
                    }
                });
            }

            // Also filter legacy tools-section if present
            if (toolSections.length > 0) {
                toolSections.forEach(section => {
                    let sectionHasVisibleCards = false;
                    const cards = section.querySelectorAll(".tool-card");
                    cards.forEach(card => {
                        const title = card.querySelector(".tool-card-title")?.innerText.toLowerCase() || "";
                        const desc = card.querySelector(".tool-card-desc")?.innerText.toLowerCase() || "";
                        const keywords = card.getAttribute("data-keywords")?.toLowerCase() || "";
                        const isMatch = title.includes(query) || desc.includes(query) || keywords.includes(query);
                        if (isMatch) {
                            card.style.display = "flex";
                            sectionHasVisibleCards = true;
                        } else {
                            card.style.display = "none";
                        }
                    });
                    section.style.display = (sectionHasVisibleCards || query === "") ? "block" : "none";
                });
            }

            // 2. Populate Floating Autocomplete Dropdown
            if (query.length === 0) {
                dropdown.style.display = "none";
                dropdown.innerHTML = "";
                return;
            }

            const matches = [];

            // Primary source: CATEGORIES_DATA (Global knowledge of all 25 tools + 6 hubs)
            if (typeof CATEGORIES_DATA !== "undefined" && Array.isArray(CATEGORIES_DATA)) {
                CATEGORIES_DATA.forEach(cat => {
                    const catHref = isSubFolder ? `../categories/${cat.file}` : `categories/${cat.file}`;
                    // Category Hub Match
                    if (cat.name.toLowerCase().includes(query) || (cat.desc && cat.desc.toLowerCase().includes(query))) {
                        matches.push({
                            title: `${cat.name} (Hub)`,
                            desc: cat.desc,
                            icon: cat.icon,
                            href: catHref
                        });
                    }
                    // Tools within this category
                    if (Array.isArray(cat.tools)) {
                        cat.tools.forEach(tool => {
                            if (!tool.path) return;
                            const toolHref = isSubFolder ? `../tools/${tool.path}` : `tools/${tool.path}`;
                            const haystack = `${tool.name} ${tool.desc || ''} ${tool.id} ${cat.name}`.toLowerCase();
                            if (haystack.includes(query)) {
                                matches.push({
                                    title: tool.name,
                                    desc: tool.desc || `Open ${tool.name} in ${cat.name}`,
                                    icon: cat.icon,
                                    href: toolHref
                                });
                            }
                        });
                    }
                });
            } else if (toolCards.length > 0) {
                // Fallback to DOM elements if CATEGORIES_DATA is missing
                toolCards.forEach(card => {
                    const title = card.querySelector(".tool-card-title")?.innerText || "";
                    const desc = card.querySelector(".tool-card-desc")?.innerText || "";
                    const icon = card.querySelector(".tool-card-icon")?.innerText || "🛠️";
                    const href = card.getAttribute("href") || "#";
                    const keywords = card.getAttribute("data-keywords") || "";

                    if (title.toLowerCase().includes(query) || desc.toLowerCase().includes(query) || keywords.toLowerCase().includes(query)) {
                        matches.push({ title, desc, icon, href });
                    }
                });
            }

            if (matches.length > 0) {
                let html = '<div class="dropdown-header">🔍 Instant Matching Tools & Hubs</div><ul class="dropdown-list">';
                matches.slice(0, 8).forEach((item, index) => {
                    html += `
                        <li class="dropdown-item" data-index="${index}">
                            <a href="${item.href}" class="dropdown-link">
                                <span class="dropdown-icon">${item.icon}</span>
                                <div class="dropdown-info">
                                    <div class="dropdown-title">${highlightMatch(item.title, query)}</div>
                                    <div class="dropdown-desc">${item.desc}</div>
                                </div>
                                <span class="dropdown-arrow">→</span>
                            </a>
                        </li>
                    `;
                });
                html += '</ul>';
                dropdown.innerHTML = html;
                dropdown.style.display = "block";
            } else {
                dropdown.innerHTML = `
                    <div class="dropdown-no-results">
                        <span>🔍 No tools found matching "<strong>${escapeHtml(query)}</strong>"</span>
                    </div>
                `;
                dropdown.style.display = "block";
            }
        });

        function highlightMatch(text, query) {
            try {
                const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(${escapedQuery})`, "gi");
                return text.replace(regex, "<mark>$1</mark>");
            } catch (e) {
                return text;
            }
        }

        function escapeHtml(string) {
            return String(string).replace(/[&<>"']/g, function (s) {
                return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s];
            });
        }

        // Keyboard Navigation (ArrowUp, ArrowDown, Enter, Esc)
        searchBar.addEventListener("keydown", (e) => {
            const items = dropdown.querySelectorAll(".dropdown-item");
            if (items.length === 0) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % items.length;
                updateSelection(items);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                updateSelection(items);
            } else if (e.key === "Enter" && selectedIndex >= 0) {
                e.preventDefault();
                const selectedLink = items[selectedIndex].querySelector("a");
                if (selectedLink) window.location.href = selectedLink.href;
            } else if (e.key === "Escape") {
                dropdown.style.display = "none";
            }
        });

        function updateSelection(items) {
            items.forEach((item, i) => {
                if (i === selectedIndex) {
                    item.classList.add("selected");
                    item.scrollIntoView({ block: "nearest" });
                } else {
                    item.classList.remove("selected");
                }
            });
        }

        // Focus search on '/' keypress
        document.addEventListener("keydown", (e) => {
            if ((e.key === "/" || (e.ctrlKey && e.key === "k")) && document.activeElement !== searchBar) {
                e.preventDefault();
                searchBar.focus();
                searchBar.select();
            }
        });

        // Hide dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (!searchContainer.contains(e.target)) {
                dropdown.style.display = "none";
            }
        });
    }

    // Scroll Fade-Up Animations & Navbar Shadow
    const headerNav = document.querySelector('.header-nav');
    if (headerNav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                headerNav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
            } else {
                headerNav.style.boxShadow = 'none';
            }
        });
    }
});
