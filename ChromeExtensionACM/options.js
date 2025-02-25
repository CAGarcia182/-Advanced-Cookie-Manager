
/**
 * Adds an event listener to the form with id 'whitelistForm' to handle form submission.
 * On form submission, prevents the default form submission behavior, retrieves the value
 * from the input with id 'whitelist', splits it by commas, and saves it to the browser's
 * sync storage under the key 'whitelist'. Displays an alert when the whitelist is saved.
 * 
 * Retrieves the 'whitelist' from the browser's sync storage on page load and, if it exists,
 * sets the value of the input with id 'whitelist' to the comma-separated list of whitelist items.
 */
document.addEventListener('DOMContentLoaded', function() {
    let input = document.getElementById('whitelist');

    // Load saved whitelist
    chrome.storage.sync.get('whitelist', function(data) {
        if (data.whitelist) {
            input.value = data.whitelist.join(', ');
        }
    });

    // Save new whitelist
    document.getElementById('whitelistForm').addEventListener('submit', function(event) {
        event.preventDefault();
        let whitelist = input.value.split(',').map(domain => domain.trim());

        chrome.storage.sync.set({ 'whitelist': whitelist }, function() {
            alert('Whitelist saved!');
        });
    });
});

