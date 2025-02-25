document.addEventListener('DOMContentLoaded', () => {
    console.log("Popup script loaded!");

    // Load dark mode preference
    chrome.storage.sync.get('darkMode', (data) => {
        if (data.darkMode) {
            document.body.classList.add('dark-mode');
        }
    });

    // Setup all UI
    setupDarkModeToggle();
    setupDeleteAllButton();
    setupStorageClearButtons();
    setupRefreshButton();
    setupManageWhitelistButton();
    setupWhitelistForm();
    setupBackToMainButton();
    setupFilterInput();

    // Load cookies & recent activity
    loadCookies();
    loadCookieHistory();
    setInterval(loadCookieHistory, 1000);
});

/*************************************************************
 * 1) Dark Mode Toggle
 *************************************************************/
function setupDarkModeToggle() {
    let darkModeBtn = document.getElementById('darkModeToggle');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            chrome.storage.sync.set({
                'darkMode': document.body.classList.contains('dark-mode')
            });
        });
    }
}



/*************************************************************
 * 1.2) By calling this function from your “Delete All Cookies” loop, I can  skip removing cookies for whitelisted domains.
 *************************************************************/

function isDomainWhitelisted(cookieDomain, whitelist) {
    // Remove leading dots, e.g. ".google.com" -> "google.com"
    let normalized = cookieDomain.startsWith('.') 
      ? cookieDomain.substring(1) 
      : cookieDomain;

    for (let w of whitelist) {
        let wNorm = w.startsWith('.') ? w.substring(1) : w;
        if (normalized.endsWith(wNorm)) {
            return true;
        }
    }
    return false;
}


/*************************************************************
 * 2) Delete All Cookies
 *************************************************************/
function setupDeleteAllButton() {
    let deleteAllBtn = document.getElementById('deleteAll');
    if (!deleteAllBtn) return;

    deleteAllBtn.addEventListener('click', function() {
        if (confirm("Are you sure you want to delete ALL non-whitelisted cookies?")) {
            chrome.storage.sync.get('whitelist', (data) => {
                let whitelist = data.whitelist || [];
    
                chrome.cookies.getAll({}, function(cookies) {
                    cookies.forEach(cookie => {
                        // If the domain is whitelisted, SKIP removing it:
                        if (!isDomainWhitelisted(cookie.domain, whitelist)) {
                            chrome.cookies.remove({
                                url: "https://" + cookie.domain + "/",
                                name: cookie.name
                            });
                        }
                    });
                });
    
                alert("All non-whitelisted cookies deleted!");
                loadCookies();
            });
        }
    });
    
}



function isDomainWhitelisted(cookieDomain, whitelist) {
    // Remove leading dots, e.g. ".google.com" -> "google.com"
    let normalized = cookieDomain.startsWith('.') 
      ? cookieDomain.substring(1) 
      : cookieDomain;

    for (let w of whitelist) {
        let wNorm = w.startsWith('.') ? w.substring(1) : w;
        if (normalized.endsWith(wNorm)) {
            return true;
        }
    }
    return false;
}









/*************************************************************
 * 3) Clear Local/Session Storage
 *************************************************************/
function setupStorageClearButtons() {
    let clearLocalBtn = document.getElementById('clearLocalStorage');
    let clearSessionBtn = document.getElementById('clearSessionStorage');

    if (clearLocalBtn) {
        clearLocalBtn.onclick = () => {
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                let currentTab = tabs[0];
                if (currentTab.url.startsWith("chrome://")) {
                    alert("Please navigate to a normal website before clearing local storage!");
                    return;
                }
                chrome.scripting.executeScript({
                    target: { tabId: currentTab.id },
                    func: () => {
                        localStorage.clear();
                        console.log("Local Storage cleared!");
                    }
                }, () => {
                    alert("Local Storage Cleared!");
                });
            });
        };
    }

    if (clearSessionBtn) {
        clearSessionBtn.onclick = () => {
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                let currentTab = tabs[0];
                if (currentTab.url.startsWith("chrome://")) {
                    alert("Please navigate to a normal website before clearing session storage!");
                    return;
                }
                chrome.scripting.executeScript({
                    target: { tabId: currentTab.id },
                    func: () => {
                        sessionStorage.clear();
                        console.log("Session Storage cleared!");
                    }
                }, () => {
                    alert("Session Storage Cleared!");
                });
            });
        };
    }
}

/*************************************************************
 * 4) Refresh Cookies
 *************************************************************/
function setupRefreshButton() {
    let refreshBtn = document.getElementById('refreshCookies');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            console.log("Manual refresh of cookies...");
            loadCookies();
        });
    }
}

/*************************************************************
 * 5) Show Whitelist Screen
 *************************************************************/
function setupManageWhitelistButton() {
    let showWhitelistBtn = document.getElementById('showWhitelistBtn');
    let mainView = document.getElementById('mainView');
    let whitelistView = document.getElementById('whitelistView');

    if (showWhitelistBtn && mainView && whitelistView) {
        showWhitelistBtn.addEventListener('click', () => {
            mainView.style.display = 'none';
            whitelistView.style.display = 'block';
            // Render the existing whitelist
            renderWhitelistDomains();
        });
    }
}

/*************************************************************
 * 5.1) Whitelist Form Handling
 *************************************************************/
function setupWhitelistForm() {
    let whitelistForm = document.getElementById('whitelistForm');
    if (!whitelistForm) return;

    whitelistForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let input = document.getElementById('whitelistInput');
        let statusEl = document.getElementById('whitelistStatus');
        if (!input) return;

        // handle multiple domains separated by commas
        let domains = input.value.split(',')
            .map(d => d.trim())
            .filter(d => d);

        chrome.storage.sync.get('whitelist', (data) => {
            let currentList = data.whitelist || [];
            // Merge new domains
            let merged = [...new Set([...currentList, ...domains])]; // remove duplicates

            chrome.storage.sync.set({ 'whitelist': merged }, () => {
                if (statusEl) {
                    statusEl.textContent = "Domain(s) added!";
                    setTimeout(() => {
                        statusEl.textContent = "";
                    }, 1500);
                }
                input.value = "";
                renderWhitelistDomains(); // refresh the list
                loadCookies(); // re-filter cookie list
            });
        });
    });
}

/*************************************************************
 * 5.2) Render Whitelist Domains
 *      Shows each domain with a remove button
 *************************************************************/
function renderWhitelistDomains() {
    let listEl = document.getElementById('whitelistDomainsList');
    if (!listEl) return;

    chrome.storage.sync.get('whitelist', (data) => {
        let wList = data.whitelist || [];
        listEl.innerHTML = "";

        if (wList.length === 0) {
            listEl.innerHTML = "<p>No domains currently whitelisted.</p>";
            return;
        }

        wList.forEach(domain => {
            let li = document.createElement('li');
            li.textContent = domain;

            let removeBtn = document.createElement('button');
            removeBtn.textContent = "Remove";
            removeBtn.addEventListener('click', () => {
                removeWhitelistDomain(domain);
            });

            li.appendChild(removeBtn);
            listEl.appendChild(li);
        });
    });
}

/*************************************************************
 * Remove a single domain from the whitelist
 *************************************************************/
function removeWhitelistDomain(domain) {
    chrome.storage.sync.get('whitelist', (data) => {
        let wList = data.whitelist || [];
        let updated = wList.filter(d => d !== domain);
        chrome.storage.sync.set({ 'whitelist': updated }, () => {
            renderWhitelistDomains();
            loadCookies(); // refresh
        });
    });
}

/*************************************************************
 * 5.3) Back to Main
 *************************************************************/
function setupBackToMainButton() {
    let backBtn = document.getElementById('backToMainBtn');
    let mainView = document.getElementById('mainView');
    let whitelistView = document.getElementById('whitelistView');

    if (backBtn && mainView && whitelistView) {
        backBtn.addEventListener('click', () => {
            whitelistView.style.display = 'none';
            mainView.style.display = 'block';
        });
    }
}

/*************************************************************
 * 6) Filtering cookies
 *************************************************************/
function setupFilterInput() {
    let filterInput = document.getElementById('filterInput');
    if (filterInput) {
        filterInput.addEventListener('input', () => {
            filterCookies(filterInput.value);
        });
    }
}

function filterCookies(filterText) {
    filterText = filterText.toLowerCase();
    let cards = document.querySelectorAll('.cookie-card');

    cards.forEach(card => {
        let name = card.dataset.name.toLowerCase();
        let domain = card.dataset.domain.toLowerCase();
        if (name.includes(filterText) || domain.includes(filterText)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

/*************************************************************
 * 7) Load Cookies (Newest on top)
 *************************************************************/
function loadCookies() {
    console.log("Loading cookies...");
    let container = document.getElementById('cookieContainer');
    if (!container) {
        console.error("Cookie container not found!");
        return;
    }
    container.innerHTML = '';

    chrome.storage.sync.get('whitelist', (data) => {
        let whitelist = data.whitelist || [];

        chrome.cookies.getAll({}, (cookies) => {
            console.log("Cookies retrieved:", cookies.length);

            if (cookies.length === 0) {
                container.innerHTML = "<p>No cookies found.</p>";
                return;
            }

            // Reverse array so newest cookies appear first
            cookies.reverse().forEach(cookie => {
                if (!isDomainWhitelisted(cookie.domain, whitelist)) {
                    // Create a card for each cookie
                    let card = document.createElement('div');
                    card.classList.add("cookie-card");
                    card.dataset.name = cookie.name;
                    card.dataset.domain = cookie.domain;
                    card.dataset.value = cookie.value;

                    card.innerHTML = `
                      <div>
                        <strong>${cookie.name}</strong><br>
                        <small>${cookie.domain}</small>
                      </div>
                      <div>
                        <button class="edit-cookie">Edit</button>
                        <button class="delete-cookie">X</button>
                      </div>
                    `;

                    // Edit cookie
                    card.querySelector(".edit-cookie").addEventListener('click', () => {
                        let newValue = prompt("Edit Cookie Value:", cookie.value);
                        if (newValue !== null) {
                            chrome.cookies.set({
                                url: "https://" + cookie.domain + "/",
                                name: cookie.name,
                                value: newValue
                            }, () => {
                                if (chrome.runtime.lastError) {
                                    console.warn("Could not set cookie:", chrome.runtime.lastError.message);
                                } else {
                                    console.log(`Updated cookie value for: ${cookie.name}`);
                                    loadCookies();
                                }
                            });
                        }
                    });

                    // Delete cookie
                    card.querySelector(".delete-cookie").addEventListener('click', () => {
                        chrome.cookies.remove({
                            url: "https://" + cookie.domain + "/",
                            name: cookie.name
                        }, () => {
                            if (chrome.runtime.lastError) {
                                console.warn("Could not remove cookie:", chrome.runtime.lastError.message);
                            } else {
                                console.log(`Deleted cookie: ${cookie.name}`);
                                card.remove();
                            }
                        });
                    });

                    container.appendChild(card);
                }
            });
        });
    });
}

/*************************************************************
 * 8) Subdomain-friendly check
 *************************************************************/
function isDomainWhitelisted(cookieDomain, whitelist) {
    let normalized = cookieDomain.startsWith('.') 
      ? cookieDomain.substring(1) 
      : cookieDomain;

    for (let w of whitelist) {
        let wNorm = w.startsWith('.') ? w.substring(1) : w;
        if (normalized.endsWith(wNorm)) {
            return true;
        }
    }
    return false;
}

/*************************************************************
 * 9) Load Cookie History
 *************************************************************/
function loadCookieHistory() {
    chrome.storage.local.get("cookieHistory", function(data) {
        let history = data.cookieHistory || [];
        let historyContainer = document.getElementById('cookieHistory');
        if (!historyContainer) return;

        historyContainer.innerHTML = "<h3>Recent Activity</h3>";
        // Show newest first
        history.slice(-5).reverse().forEach(entry => {
            let p = document.createElement('p');
            p.textContent = entry;
            historyContainer.appendChild(p);
        });
    });
}
