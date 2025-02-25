chrome.runtime.onInstalled.addListener(() => {
    console.log("Advanced Cookie Manager installed.");
});

chrome.cookies.onChanged.addListener((changeInfo) => {
    chrome.storage.local.get(["lastCookies", "cookieHistory"], (data) => {
        let lastCookies = data.lastCookies || [];
        let history = data.cookieHistory || [];
        let currentCookies = [...lastCookies];

        if (!changeInfo.removed) {
            // Cookie added/updated
            currentCookies.push({
                name: changeInfo.cookie.name,
                domain: changeInfo.cookie.domain
            });
            history.push(`Added: ${changeInfo.cookie.name} (${changeInfo.cookie.domain})`);
        } else {
            // Cookie removed
            currentCookies = currentCookies.filter(cookie =>
                !(cookie.name === changeInfo.cookie.name && cookie.domain === changeInfo.cookie.domain)
            );
            history.push(`Deleted: ${changeInfo.cookie.name} (${changeInfo.cookie.domain})`);
        }

        // Keep only last 100
        if (history.length > 100) {
            history = history.slice(-100);
        }

        chrome.storage.local.set({
            lastCookies: currentCookies,
            cookieHistory: history
        });
    });
});
