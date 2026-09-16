// ToolX Pro - Global Shared Layout & Navigation Configuration
const CATEGORIES_DATA = [
    {
        id: 'ai-tools',
        name: 'AI Writing & Tools',
        icon: '🤖',
        isAi: true,
        tools: [
            { id: 'ai-humanizer', name: 'AI Text Humanizer', desc: 'Elevate AI drafts into polished human writing with natural nuance and effortless flow.', path: 'ai-humanizer.html' },
            { id: 'grammar-fixer', name: 'AI Grammar & Spell Fixer', desc: 'Check and fix spelling, grammar mistakes, punctuation, and refine writing tone instantly.', path: 'grammar-fixer.html' },
            { id: 'ai-resume', name: 'AI Resume Maker', desc: 'Build an outstanding professional resume using AI.', isFuture: true },
            { id: 'ai-cover-letter', name: 'AI Cover Letter', desc: 'Generate tailored cover letters for your job applications.', isFuture: true }
        ]
    },
    {
        id: 'student-corner',
        name: 'Student Corner',
        icon: '🎓',
        tools: [
            { id: 'assignment-cover', name: 'Assignment Cover Generator', desc: 'Create and download custom print-ready assignment cover pages for All Universities or Southeast University.', path: 'assignment-cover.html' },
            { id: 'bd-gpa', name: 'SSC & HSC GPA Calculator', desc: 'Calculate your SSC/HSC board exam GPA with official 4th subject bonus rules (5.00 Scale).', path: 'bd-gpa.html' },
            { id: 'bd-cgpa', name: 'BD University CGPA Calculator', desc: 'Calculate Cumulative CGPA & Semester GPA for National University, Public & Private Universities (UGC 4.00 Scale).', path: 'bd-cgpa.html' }
        ]
    },
    {
        id: 'pdf-tools',
        name: 'PDF Tools',
        icon: '📄',
        tools: [
            { id: 'pdf-to-word', name: 'PDF to Word Converter', desc: 'Convert PDF documents into editable Word files (.docx / .doc).', path: 'pdf-to-word.html' },
            { id: 'pdf-merge', name: 'PDF Merge', desc: 'Combine multiple PDF files into one single PDF document.', path: 'pdf-merge.html' },
            { id: 'image-to-pdf', name: 'Image to PDF', desc: 'Combine multiple image files into a single clean PDF document.', path: 'image-to-pdf.html' },
            { id: 'pdf-compressor', name: 'PDF Compressor', desc: 'Reduce storage size of PDF files.', path: 'pdf-compressor.html' },
            { id: 'pdf-reorder', name: 'PDF Page Reorder & Delete', desc: 'Reorder or delete PDF pages easily.', path: 'pdf-reorder.html' }
        ]
    },
    {
        id: 'image-tools',
        name: 'Image Tools',
        icon: '🖼️',
        tools: [
            { id: 'image-compressor', name: 'Image Compressor', desc: 'Reduce the file size of JPG, PNG, or WebP images while keeping quality.', path: 'image-compressor.html' },
            { id: 'image-converter', name: 'Image Converter', desc: 'Convert image files instantly between JPG, PNG, and WebP formats.', path: 'image-converter.html' },
            { id: 'passport-photo', name: 'Passport Photo Maker', desc: 'Create 2x2 inch / 35x45mm passport photos with white/blue background & A4 print sheet.', path: 'passport-photo.html' },
            { id: 'bg-remover', name: 'Transparent PNG Generator', desc: 'Remove white/solid background from logos, signatures, and graphics.', path: 'bg-remover.html' }
        ]
    },
    {
        id: 'utility-tools',
        name: 'Calculators & Utilities',
        icon: '🛠️',
        tools: [
            { id: 'age-calculator', name: 'Age Calculator', desc: 'Calculate your exact age in years, months, days, and next birthday details.', path: 'age-calculator.html' },
            { id: 'bmi-calculator', name: 'BMI Health Calculator', desc: 'Calculate your Body Mass Index (BMI) and check your health classification.', path: 'bmi-calculator.html' },
            { id: 'word-counter', name: 'Word & Character Counter', desc: 'Count words, characters, lines, sentences, and estimated reading time.', path: 'word-counter.html' },
            { id: 'bangla-unicode', name: 'Bangla Unicode Converter', desc: 'Convert Bijoy keyboard legacy typing to Unicode Bangla and vice-versa.', path: 'bangla-unicode.html' },
            { id: 'qr-generator', name: 'QR Code Generator', desc: 'Generate customized high-quality QR codes for links, text, or phone numbers.', path: 'qr-generator.html' },
            { id: 'qr-scanner', name: 'QR Code Scanner', desc: 'Scan QR codes using your device camera or upload image files.', path: 'qr-scanner.html' },
            { id: 'unit-converter', name: 'Unit Converter', desc: 'Convert between different units of length, weight, and temperature.', path: 'unit-converter.html' },
            { id: 'file-size-converter', name: 'File Size Converter', desc: 'Convert file storage sizes between Bytes, KB, MB, GB, TB, and PB.', path: 'file-size-converter.html' }
        ]
    }
];

document.addEventListener("DOMContentLoaded", () => {
    // Detect Path Depth & Page Type
    const path = window.location.pathname.toLowerCase();
    const isSubFolder = path.includes('/tools/') || path.includes('/blog/');
    const isToolPage = path.includes('/tools/');
    const isHomePage = path.endsWith('/index.html') || path.endsWith('/') || path === '' || (!path.includes('.html') && !isSubFolder);
    const homePath = isSubFolder ? '../index.html' : 'index.html';
    const toolsPrefix = isSubFolder ? '' : 'tools/';
    
    // Inject Layout Elements
    injectGoogleAdSense();
    injectHeader(homePath, isSubFolder, isHomePage);
    injectFooter(homePath, isSubFolder, isHomePage);
    // injectSocialBarAd(); // Temporarily paused during Google AdSense review
    
    if (isToolPage) {
        injectSidebar(toolsPrefix);
    }
    
    // Initialize Theme
    initTheme();
    
    // Initialize Future Tools Modal (Coming Soon)
    initFutureModal();

    // Initialize Page Scrolling/Interaction links
    initNavInteractions();

    // Initialize Sticky Header & Floating Back-To-Top Button
    initStickyAndBackToTop();

    // Initialize Mobile Navigation Drawer (Feedback UI)
    initMobileDrawer(homePath, isSubFolder, isHomePage);
});

// Theme Handling
function initTheme() {
    const themeBtn = document.getElementById("theme-toggle-btn");
    const currentTheme = localStorage.getItem("theme") || "light";
    
    document.documentElement.setAttribute("data-theme", currentTheme);
    updateThemeIcon(currentTheme);
    
    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            const current = document.documentElement.getAttribute("data-theme");
            const target = current === "dark" ? "light" : "dark";
            
            document.documentElement.setAttribute("data-theme", target);
            localStorage.setItem("theme", target);
            updateThemeIcon(target);
        });
    }
}

// Update Theme Toggle Switch State
function updateThemeIcon(theme) {
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
        if (theme === "dark") {
            themeBtn.classList.add("dark-active");
            themeBtn.setAttribute("title", "Switch to Light Mode");
        } else {
            themeBtn.classList.remove("dark-active");
            themeBtn.setAttribute("title", "Switch to Dark Mode");
        }
    }
}


// Inject Adsterra Social Bar / In-Page Ad Dynamically
function injectSocialBarAd() {
    if (!document.getElementById("adsterra-socialbar-script")) {
        const adScript = document.createElement("script");
        adScript.id = "adsterra-socialbar-script";
        adScript.type = "text/javascript";
        adScript.src = "https://pl30581150.effectivecpmnetwork.com/9a/d4/a9/9ad4a99b6bc2074f56c68c54f76384d5.js";
        document.head.appendChild(adScript);
    }
}

// Inject Header Navbar with Navigation Menu (Feedback 1)
function injectHeader(homePath, isSubFolder, isHomePage) {
    const header = document.getElementById("main-header");
    if (!header) return;
    
    header.className = "header-nav";
    
    const categoriesLink = isHomePage ? '#tools-container' : `${homePath}#tools-container`;
    const blogLink = isHomePage ? '#blog-container' : `${homePath}#blog-container`;
    const aboutLink = isSubFolder ? '../about.html' : 'about.html';
    const contactLink = isSubFolder ? '../contact.html' : 'contact.html';
    
    header.innerHTML = `
        <a href="${homePath}" class="logo-container" style="display:flex; align-items:center; gap:8px;">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 6px rgba(251, 140, 0, 0.4)); flex-shrink:0;">
                <rect width="32" height="32" rx="10" fill="url(#logo-grad-header)" />
                <path d="M10 10L22 22" stroke="white" stroke-width="4" stroke-linecap="round" />
                <path d="M22 10L10 22" stroke="rgba(255,255,255,0.6)" stroke-width="4" stroke-linecap="round" />
                <circle cx="16" cy="16" r="3" fill="#E65100" />
                <defs>
                    <linearGradient id="logo-grad-header" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#FFCA28" />
                        <stop offset="1" stop-color="#F57C00" />
                    </linearGradient>
                </defs>
            </svg>
            <span class="logo-text">ToolX<span class="logo-pro-badge">PRO</span></span>
        </a>
        <ul class="nav-menu">
            <li><a href="${homePath}" class="nav-menu-link">Home</a></li>
            <li><a href="${categoriesLink}" class="nav-menu-link">Categories</a></li>
            <li><a href="${blogLink}" class="nav-menu-link">Blog</a></li>
            <li><a href="${aboutLink}" class="nav-menu-link">About</a></li>
            <li><a href="${contactLink}" class="nav-menu-link">Contact</a></li>
        </ul>
        <div class="nav-actions">
            <div id="theme-toggle-btn" class="theme-switch" role="button" tabindex="0" title="Toggle Light/Dark Theme">
                <span class="switch-icon sun">☀️</span>
                <span class="switch-icon moon">🌙</span>
                <span class="switch-thumb"></span>
            </div>
            <button id="hamburger-menu-btn" class="hamburger-btn" title="Open Menu">☰</button>
        </div>
    `;
}

// Inject Sidebar (Only for Tool pages)
function injectSidebar(toolsPrefix) {
    const sidebar = document.getElementById("main-sidebar");
    if (!sidebar) return;
    sidebar.style.display = "none";
    sidebar.innerHTML = "";
    return;
    
    // Get Current Tool ID
    const pathParts = window.location.pathname.split('/');
    const currentFileName = pathParts[pathParts.length - 1];
    
    let sidebarHtml = '';
    
    CATEGORIES_DATA.forEach(category => {
        sidebarHtml += `
            <div class="sidebar-category">
                <div class="sidebar-title">${category.icon} ${category.name}</div>
                <ul class="sidebar-menu">
        `;
        
        category.tools.forEach(tool => {
            if (tool.isFuture) {
                sidebarHtml += `
                    <li>
                        <a href="#" class="sidebar-link future-tool-trigger" data-tool="${tool.name}">
                            🤖 ${tool.name} <span class="badge badge-ai" style="font-size:0.6rem; padding: 1px 4px;">AI</span>
                        </a>
                    </li>
                `;
            } else {
                const isActive = tool.path === currentFileName ? 'active' : '';
                sidebarHtml += `
                    <li>
                        <a href="${toolsPrefix}${tool.path}" class="sidebar-link ${isActive}">
                            👉 ${tool.name}
                        </a>
                    </li>
                `;
            }
        });
        
        sidebarHtml += `
                </ul>
            </div>
        `;
    });
    
    sidebar.innerHTML = sidebarHtml;
}

// Inject Rich SaaS-Style Footer (Feedback 5)
function injectFooter(homePath, isSubFolder, isHomePage) {
    const footer = document.getElementById("main-footer");
    if (!footer) return;
    
    footer.className = "footer-container";
    
    const year = new Date().getFullYear();
    const categoriesLink = isHomePage ? '#tools-container' : `${homePath}#tools-container`;
    const blogLink = isHomePage ? '#blog-container' : `${homePath}#blog-container`;
    const aboutLink = isSubFolder ? '../about.html' : 'about.html';
    const contactLink = isSubFolder ? '../contact.html' : 'contact.html';
    const privacyLink = isSubFolder ? '../privacy-policy.html' : 'privacy-policy.html';
    const termsLink = isSubFolder ? '../terms.html' : 'terms.html';
    const disclaimerLink = isSubFolder ? '../disclaimer.html' : 'disclaimer.html';
    
    footer.innerHTML = `
        <div class="footer-top">
            <div class="footer-brand-col">
                <a href="${homePath}" class="logo-container" style="display:flex; align-items:center; gap:8px;">
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 6px rgba(251, 140, 0, 0.4)); flex-shrink:0;">
                        <rect width="32" height="32" rx="10" fill="url(#logo-grad-footer)" />
                        <path d="M10 10L22 22" stroke="white" stroke-width="4" stroke-linecap="round" />
                        <path d="M22 10L10 22" stroke="rgba(255,255,255,0.6)" stroke-width="4" stroke-linecap="round" />
                        <circle cx="16" cy="16" r="3" fill="#E65100" />
                        <defs>
                            <linearGradient id="logo-grad-footer" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#FFCA28" />
                                <stop offset="1" stop-color="#F57C00" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span class="logo-text">ToolX<span class="logo-pro-badge">PRO</span></span>
                </a>
                <p class="footer-brand-desc">
                    ToolX Pro provides free, fast, and completely secure client-side utility tools. We do not transmit or store your personal files or input parameters on any server.
                </p>
                <div class="footer-social-icons">
                    <a href="https://www.facebook.com/sanjidalam69" target="_blank" rel="noopener noreferrer" class="footer-social-btn" title="Facebook">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                    <a href="https://www.instagram.com/sanjidalam69/?hl=en" target="_blank" rel="noopener noreferrer" class="footer-social-btn" title="Instagram">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                    <a href="https://github.com/sanjidalam69" target="_blank" rel="noopener noreferrer" class="footer-social-btn" title="GitHub">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                    </a>
                    <a href="https://www.linkedin.com/in/sanjid-alam-29752619b/" target="_blank" rel="noopener noreferrer" class="footer-social-btn" title="LinkedIn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                    </a>
                </div>
            </div>
            
            <div>
                <h4 class="footer-col-title">Quick Links</h4>
                <ul class="footer-links-list">
                    <li><a href="${homePath}">Home Dashboard</a></li>
                    <li><a href="${categoriesLink}">Tools Directory</a></li>
                    <li><a href="${blogLink}">Latest Blog Articles</a></li>
                    <li><a href="${aboutLink}">About Project</a></li>
                </ul>
            </div>

            <div>
                <h4 class="footer-col-title">Legal</h4>
                <ul class="footer-links-list">
                    <li><a href="${privacyLink}">Privacy Policy</a></li>
                    <li><a href="${termsLink}">Terms of Service</a></li>
                    <li><a href="${disclaimerLink}">Disclaimer</a></li>
                    <li><a href="#" class="modal-trigger" data-modal="sitemap">Sitemap</a></li>
                </ul>
            </div>

            <div>
                <h4 class="footer-col-title">Contact Us</h4>
                <ul class="footer-links-list">
                    <li style="font-size:0.9rem; margin-bottom:5px;"><a href="${contactLink}" style="color:inherit; text-decoration:underline;">Contact Page</a></li>
                    <li style="font-size:0.9rem; margin-bottom:5px;">📧 ai.sanjid.alam@gmail.com</li>
                    <li style="font-size:0.9rem; margin-bottom:5px;">📍 Dhaka, Bangladesh</li>
                    <li style="font-size:0.9rem; color:var(--text-secondary);">Response Time: Under 24h</li>
                </ul>
            </div>
        </div>
        
        <div class="footer-bottom" style="position: relative;">
            <div class="footer-mandatory-links" style="display: flex; gap: 12px; justify-content: center; align-items: center; flex-wrap: wrap; margin-bottom: 12px; font-size: 0.92rem; font-weight: 600;">
                <a href="${aboutLink}" style="color: var(--text-primary); text-decoration: underline;">About</a>
                <span style="color: var(--text-secondary); opacity: 0.6;">|</span>
                <a href="${contactLink}" style="color: var(--text-primary); text-decoration: underline;">Contact</a>
                <span style="color: var(--text-secondary); opacity: 0.6;">|</span>
                <a href="${privacyLink}" style="color: var(--text-primary); text-decoration: underline;">Privacy Policy</a>
                <span style="color: var(--text-secondary); opacity: 0.6;">|</span>
                <a href="${termsLink}" style="color: var(--text-primary); text-decoration: underline;">Terms of Service</a>
                <span style="color: var(--text-secondary); opacity: 0.6;">|</span>
                <a href="${disclaimerLink}" style="color: var(--text-primary); text-decoration: underline;">Disclaimer</a>
            </div>
            <p>© ${year} <b>ToolX Pro</b>. Designed & Developed with ❤️ by <a href="https://www.linkedin.com/in/sanjid-alam-29752619b/" target="_blank" rel="noopener noreferrer" style="color:inherit; font-weight:bold; text-decoration:underline;">Sanjid Alam</a>. All rights reserved.</p>
            <p style="color:var(--text-secondary);">Everything runs 100% locally. No server data costs.</p>
        </div>
    `;
}



// Initialize Custom Generic Modals (About, Contact, Privacy, Terms)
function initNavInteractions() {
    let genericModal = document.getElementById("generic-info-modal");
    if (!genericModal) {
        genericModal = document.createElement("div");
        genericModal.id = "generic-info-modal";
        genericModal.className = "modal-overlay";
        genericModal.innerHTML = `
            <div class="modal-card" style="text-align:left; max-width:550px; padding:2rem; max-height: 85vh; overflow-y: auto;">
                <h3 class="modal-title" id="info-modal-title" style="margin-bottom:12px; border-bottom:1px solid var(--border-color); padding-bottom:8px;">Information</h3>
                <div class="modal-desc" id="info-modal-body" style="text-align:left; line-height:1.5; color:var(--text-primary);">
                    Details...
                </div>
                <button class="btn btn-primary" id="info-modal-close" style="width:auto; min-width:100px; margin-top:15px; margin-left:auto; display:block;">Close</button>
            </div>
        `;
        document.body.appendChild(genericModal);
    }

    const closeBtn = document.getElementById("info-modal-close");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            genericModal.classList.remove("active");
        });
    }

    genericModal.addEventListener("click", (e) => {
        if (e.target === genericModal) {
            genericModal.classList.remove("active");
        }
    });

    // Content database for generic modals
    const modalContent = {
        about: {
            title: "ℹ️ About ToolX Pro",
            body: `
                <div style="display:flex; flex-direction:column; gap:14px; line-height:1.6;">
                    <p><b>ToolX Pro</b> is a premier, privacy-first web utility platform designed to make daily digital tasks effortless for students, professionals, creators, and developers.</p>
                    
                    <div style="background:var(--primary-glow); padding:14px; border-radius:10px; border-left:4px solid var(--accent); font-size:0.92rem;">
                        🔒 <b>100% Client-Side Privacy Guarantee:</b> All calculations, image compression, PDF processing, and text conversions execute entirely inside your local browser sandbox. Your private files and text never leave your device.
                    </div>

                    <h4 style="font-size:1.05rem; margin-top:4px; color:var(--text-primary);">💡 Key Highlights & Features</h4>
                    <ul style="padding-left:20px; font-size:0.92rem; display:flex; flex-direction:column; gap:6px;">
                        <li><b>29+ Premium Web Utilities:</b> Free calculators, image compressors, background removers, PDF editors, and converters.</li>
                        <li><b>Bangladesh Specials:</b> Tailored tools including SSC/HSC Board GPA, Bijoy to Unicode, and BD VAT.</li>
                        <li><b>Zero Registration Required:</b> No account signup, email verification, or personal info needed.</li>
                        <li><b>Instant & Offline Capable:</b> Since code runs in your browser, most tools work even offline.</li>
                        <li><b>100% Mathematical Accuracy:</b> Built using official WHO, BD Education Board, and banking formulas.</li>
                    </ul>

                    <p style="font-size:0.9rem; color:var(--text-secondary); margin-top:4px;">Designed & Developed with ❤️ by <a href="https://www.linkedin.com/in/sanjid-alam-29752619b/" target="_blank" rel="noopener noreferrer" style="color:var(--primary); font-weight:bold;">Sanjid Alam</a>.</p>
                    
                    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:6px;">
                        <a href="https://www.facebook.com/sanjidalam69" target="_blank" rel="noopener noreferrer" style="padding:6px 12px; background:var(--bg-secondary); border-radius:6px; border:1px solid var(--border-color); text-decoration:none; font-size:0.85rem; font-weight:600; color:var(--text-primary);">🌐 Facebook</a>
                        <a href="https://www.instagram.com/sanjidalam69/?hl=en" target="_blank" rel="noopener noreferrer" style="padding:6px 12px; background:var(--bg-secondary); border-radius:6px; border:1px solid var(--border-color); text-decoration:none; font-size:0.85rem; font-weight:600; color:var(--text-primary);">📸 Instagram</a>
                        <a href="https://github.com/sanjidalam69" target="_blank" rel="noopener noreferrer" style="padding:6px 12px; background:var(--bg-secondary); border-radius:6px; border:1px solid var(--border-color); text-decoration:none; font-size:0.85rem; font-weight:600; color:var(--text-primary);">🐙 GitHub</a>
                        <a href="https://www.linkedin.com/in/sanjid-alam-29752619b/" target="_blank" rel="noopener noreferrer" style="padding:6px 12px; background:var(--bg-secondary); border-radius:6px; border:1px solid var(--border-color); text-decoration:none; font-size:0.85rem; font-weight:600; color:var(--text-primary);">🔗 LinkedIn</a>
                    </div>
                </div>
            `
        },
        contact: {
            title: "📧 Contact & Social Profiles",
            body: `
                <p style="margin-bottom:10px;">Connect directly with the developer <b>Sanjid Alam</b> for feedback, tool requests, or queries:</p>
                <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:15px;">
                    <a href="https://www.facebook.com/sanjidalam69" target="_blank" rel="noopener noreferrer" style="display:flex; align-items:center; gap:10px; background:var(--bg-secondary); padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); text-decoration:none; color:var(--text-primary); font-weight:600;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        Facebook: Sanjid Alam
                    </a>
                    <a href="https://www.instagram.com/sanjidalam69/?hl=en" target="_blank" rel="noopener noreferrer" style="display:flex; align-items:center; gap:10px; background:var(--bg-secondary); padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); text-decoration:none; color:var(--text-primary); font-weight:600;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#E4405F"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        Instagram: @sanjidalam69
                    </a>
                    <a href="https://github.com/sanjidalam69" target="_blank" rel="noopener noreferrer" style="display:flex; align-items:center; gap:10px; background:var(--bg-secondary); padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); text-decoration:none; color:var(--text-primary); font-weight:600;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                        GitHub: @sanjidalam69
                    </a>
                    <a href="https://www.linkedin.com/in/sanjid-alam-29752619b/" target="_blank" rel="noopener noreferrer" style="display:flex; align-items:center; gap:10px; background:var(--bg-secondary); padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); text-decoration:none; color:var(--text-primary); font-weight:600;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                        LinkedIn: Sanjid Alam
                    </a>
                </div>
                <p style="font-size:0.85rem; color:var(--text-secondary);">Direct Email: support@ToolXPro.co</p>
            `
        },
        privacy: {
            title: "🔒 Privacy Policy",
            body: `
                <p style="margin-bottom:10px;"><b>Your privacy is our number one priority.</b></p>
                <p style="margin-bottom:10px;">Since ToolX Pro runs entirely on client-side code, we do not collect, process, or store any data you input in our calculators, image compressors, or text counters. All operations are done in your local browser sandbox.</p>
                <p style="margin-bottom:10px;">We use standard Google AdSense cookies and anonymous Google Analytics to understand traffic volumes, which do not identify you personally.</p>
                <p>By using this portal, you agree to this local-sandbox policy.</p>
            `
        },
        terms: {
            title: "📄 Terms of Service",
            body: `
                <p style="margin-bottom:10px;">Welcome to ToolX Pro. By accessing our website, you agree to use our tools responsibly.</p>
                <p style="margin-bottom:10px;">All tools are provided "as is" without guarantees of continuous availability or 100% mathematical accuracy. We do our best to maintain the highest standard of calculation correctness.</p>
                <p>Commercial scraping or reverse engineering of our offline tool bundles is prohibited without explicit consent.</p>
            `
        },
        disclaimer: {
            title: "⚠️ Disclaimer",
            body: `
                <p style="margin-bottom:10px;">The calculations and conversions provided by ToolX Pro are for informational purposes only.</p>
                <p style="margin-bottom:10px;">• <b>Financial Tools (EMI):</b> Always verify results with your bank or financial advisor before signing loan terms.</p>
                <p style="margin-bottom:10px;">• <b>Health Tools (BMI):</b> Consult a licensed doctor or dietitian for professional medical diagnostics.</p>
                <p>We are not liable for any losses or damages arising from the use of our services.</p>
            `
        },
        sitemap: {
            title: "🗺️ Sitemap Directory",
            body: `
                <p style="margin-bottom:10px;">List of all available pages in ToolX Pro:</p>
                <ul style="padding-left:20px; display:flex; flex-direction:column; gap:6px;">
                    <li><a href="../index.html" style="color:var(--primary);">Home Dashboard</a></li>
                    <li><a href="../index.html#tools-container" style="color:var(--primary);">All Tools Categories</a></li>
                    <li><a href="../index.html#blog-container" style="color:var(--primary);">Latest Articles Blog</a></li>
                    <li>Age, BMI, EMI, GPA, Sales Tax, Image tools, PDF tools, Word Counter, QR, Unit, Currency, File converters.</li>
                </ul>
            `
        }
    };

    // Attach Click Events to triggers
    document.addEventListener("click", (e) => {
        const trigger = e.target.closest(".modal-trigger");
        if (trigger) {
            e.preventDefault();
            const modalKey = trigger.getAttribute("data-modal");
            const content = modalContent[modalKey];
            
            if (content) {
                document.getElementById("info-modal-title").innerHTML = content.title;
                document.getElementById("info-modal-body").innerHTML = content.body;
                genericModal.classList.add("active");
            }
        }
    });
}

// Initialize Coming Soon Modal for Future/AI Tools
function initFutureModal() {
    let modal = document.getElementById("coming-soon-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "coming-soon-modal";
        modal.className = "modal-overlay";
        modal.innerHTML = `
            <div class="modal-card">
                <div class="modal-icon">🤖</div>
                <div class="modal-title" id="modal-tool-name">AI Tool</div>
                <div class="modal-desc">This AI-powered utility is currently in development. It will be available in the upcoming releases!</div>
                <button class="btn btn-primary" id="modal-close-btn" style="width:auto; min-width:120px;">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    const closeBtn = document.getElementById("modal-close-btn");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            modal.classList.remove("active");
        });
    }
    
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("active");
        }
    });

    // Attach triggers
    document.addEventListener("click", (e) => {
        const trigger = e.target.closest(".future-tool-trigger");
        if (trigger) {
            e.preventDefault();
            const name = trigger.getAttribute("data-tool") || "AI Tool";
            document.getElementById("modal-tool-name").innerText = `${name} (Coming Soon)`;
            modal.classList.add("active");
        }
    });
}

// Initialize Mobile Drawer Overlay (Feedback UI)
function initMobileDrawer(homePath, isSubFolder, isHomePage) {
    let drawer = document.getElementById("mobile-drawer-overlay");
    if (!drawer) {
        drawer = document.createElement("div");
        drawer.id = "mobile-drawer-overlay";
        drawer.className = "drawer-overlay";
        
        const categoriesLink = isHomePage ? '#tools-container' : `${homePath}#tools-container`;
        const blogLink = isHomePage ? '#blog-container' : `${homePath}#blog-container`;
        const aboutLink = isSubFolder ? '../about.html' : 'about.html';
        const contactLink = isSubFolder ? '../contact.html' : 'contact.html';
        
        drawer.innerHTML = `
            <div class="drawer-panel">
                <div class="drawer-header">
                    <span style="font-family:var(--font-header); font-weight:800; color:var(--primary); font-size:1.2rem;">🛠️ Menu</span>
                    <button class="drawer-close-btn" id="drawer-close-btn">&times;</button>
                </div>
                <ul class="drawer-menu">
                    <li><a href="${homePath}" class="drawer-menu-link">Home</a></li>
                    <li><a href="${categoriesLink}" class="drawer-menu-link">Categories</a></li>
                    <li><a href="${blogLink}" class="drawer-menu-link">Blog</a></li>
                    <li><a href="${aboutLink}" class="drawer-menu-link">About</a></li>
                    <li><a href="${contactLink}" class="drawer-menu-link">Contact</a></li>
                </ul>
            </div>
        `;
        document.body.appendChild(drawer);
    }
    
    const openBtn = document.getElementById("hamburger-menu-btn");
    const closeBtn = document.getElementById("drawer-close-btn");
    
    if (openBtn) {
        openBtn.addEventListener("click", () => {
            drawer.classList.add("active");
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            drawer.classList.remove("active");
        });
    }
    
    drawer.addEventListener("click", (e) => {
        if (e.target === drawer) {
            drawer.classList.remove("active");
        }
    });
    
    // Close drawer when clicking nav links
    const links = drawer.querySelectorAll(".drawer-menu-link");
    links.forEach(link => {
        link.addEventListener("click", () => {
            drawer.classList.remove("active");
        });
    });
}

// Global Custom Toast Notification Engine (Feedback UI)
window.showToast = function(message, type = 'success') {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.style.cssText = "position:fixed; top:25px; right:25px; z-index:9999; display:flex; flex-direction:column; gap:10px; pointer-events:none;";
        document.body.appendChild(container);
    }
    
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    
    const icon = type === 'success' ? '✅' : '⚠️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    
    if (type === 'error') {
        toast.style.borderLeftColor = 'var(--danger)';
    }
    
    container.appendChild(toast);
    
    // Trigger slide-in transition
    setTimeout(() => {
        toast.style.transform = "translateX(0)";
    }, 10);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = "translateX(120%)";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Sticky Header and Floating Back-to-Top Controller
function initStickyAndBackToTop() {
    const header = document.getElementById("main-header");
    
    // Inject Floating Scroll To Top Button
    let topBtn = document.getElementById("floating-top-btn");
    if (!topBtn) {
        topBtn = document.createElement("button");
        topBtn.id = "floating-top-btn";
        topBtn.className = "floating-top-btn";
        topBtn.setAttribute("title", "Scroll back to top");
        topBtn.setAttribute("aria-label", "Scroll back to top");
        topBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
        `;
        document.body.appendChild(topBtn);
        
        topBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    const handleScroll = () => {
        const scrollPos = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        
        if (header) {
            if (scrollPos > 20) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }
        }
        
        if (topBtn) {
            if (scrollPos > 250) {
                topBtn.classList.add("visible");
            } else {
                topBtn.classList.remove("visible");
            }
        }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
}

// Global Google AdSense Integration
function injectGoogleAdSense() {
    if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
        const script = document.createElement("script");
        script.async = true;
        script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6731712917349369";
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);
    }
}


