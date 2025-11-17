// ==UserScript==
// @name         One-Click Steam Demo License Auto Remover
// @namespace    https://github.com/joex92/Steam-Auto-Demo-License-Remover
// @version      1.3
// @description  Original by PeiqiLi. This is an English Translated version with the addition of removing demo/prologue titles only.
// @author       PeiqiLi + JoeX92
// @match        https://store.steampowered.com/account/licenses/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=steampowered.com
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const chk = document.createElement('input');
    
    function insertButton() {
        const titleElem = document.querySelector('.page_content > h2');
        if (!titleElem) {
            console.warn('Element not found，Please check if you are at https://store.steampowered.com/account/licenses/');
            return;
        }

        const btn = document.createElement('button');
        btn.textContent = '🧹 Start cleaning';
        btn.style.backgroundColor = '#FFD700';
        btn.style.color = '#000';
        btn.style.border = 'none';
        btn.style.padding = '5px 12px';
        btn.style.marginLeft = '15px';
        btn.style.cursor = 'pointer';
        btn.style.borderRadius = '4px';
        btn.style.fontWeight = 'bold';
                
        const chklbl = document.createElement('label');
        chk.type = 'checkbox';
        chk.name = 'option';
        chk.value = 'selected';
        chk.checked = true;
        chklbl.appendChild(chk);
        chklbl.appendChild(document.createTextNode(' Demo Titles Only'));
        chklbl.style.backgroundColor = '#FFD700';
        chklbl.style.color = '#000';
        chklbl.style.border = 'none';
        chklbl.style.padding = '5px 12px';
        chklbl.style.marginLeft = '15px';
        chklbl.style.cursor = 'pointer';
        chklbl.style.borderRadius = '4px';
        chklbl.style.fontWeight = 'bold';
        
        const statusDiv = document.createElement('pre');
        statusDiv.style.border = '1px solid #ccc';
        statusDiv.style.padding = '10px';
        statusDiv.style.marginTop = '10px';
        statusDiv.style.maxHeight = '300px';
        statusDiv.style.overflowY = 'auto';
        statusDiv.style.whiteSpace = 'pre-wrap';
        statusDiv.style.backgroundColor = '#FFD700';
        statusDiv.style.color = '#000';

        btn.addEventListener('click', () => {
            btn.disabled = true;
            chk.disabled = true;
            statusDiv.textContent = '';
            startCleaning(statusDiv).then(() => {
                statusDiv.textContent += '\n🎉 Completed！\n';
                btn.disabled = false;
                chk.disabled = false;
            });
        });

        titleElem.parentNode.insertBefore(btn, titleElem.nextSibling);
        titleElem.parentNode.insertBefore(chklbl, btn.nextSibling);
        titleElem.parentNode.insertBefore(statusDiv, chklbl.nextSibling);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function randomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function scanRemovableGames(noDemo = false) {
        const rows = document.querySelectorAll('.account_table tr');
        const games = [];

        rows.forEach(row => {
            const removeLink = row.querySelector('a[href^="javascript:RemoveFreeLicense"]');
            if (removeLink) {
                const cells = row.querySelectorAll('td');
                const itemName = cells[1].innerText.split("\n")[1];

                const href = removeLink.getAttribute('href');
                const match = href.match(/RemoveFreeLicense\(\s*(\d+)\s*,/);
                const packageId = match ? match[1] : null;
                const isDemo = (cells[1].innerText.search(/(\s|\()(demo|prologue)(?![a-z])/i) > -1) || noDemo;

                if (packageId && isDemo) {
                    games.push({
                        packageId,
                        itemName,
                        removeLink
                    });
                }
            }
        });

        return games;
    }

    async function removeGame(packageId) {
        try {
            const response = await fetch('https://store.steampowered.com/account/removelicense', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `sessionid=${encodeURIComponent(g_sessionID)}&packageid=${encodeURIComponent(packageId)}`
            });

            if (!response.ok) {
                return { success: false, error: `HTTP Status ${response.status}` };
            }

            const data = await response.json();
            if (data.success === 1) {
                return { success: true };
            } else {
                let msg = `Error code: ${data.success}`;
                if (data.success === 2) {
                    msg += '（Operation is restricted, which may have triggered a speed limit. Please try again later）';
                } else if (data.success === 84) {
                    msg += '（Steam rejected the request; this may be due to rate limiting or an invalid request）';
                } else if (data.success === 24) {
                    msg += '（The session has expired. Please log in again）';
                }
                return { success: false, error: msg, code: data.success };
            }
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async function startCleaning(statusDiv) {
        const games = scanRemovableGames(!chk.checked);
        const total = games.length;

        if (total === 0) {
            statusDiv.textContent = '✅ No games found to be removed。';
            return;
        }

        let hasError84 = false; 

        statusDiv.textContent += `🚀 Automatic remove of ${chk.checked ? "demo" : "free"} games has begun...\nA total of ${total} removable ${chk.checked ? "demo" : "free"} games were found.\n\n`;

        for (let i = 0; i < total; ) { 
            const g = games[i];
            const remainingCount = total - i;

     
            const avgDelay = hasError84 ? 420000 : 1000;; 
            const remainingTimeMs = remainingCount * avgDelay;
            const remainingMinutes = Math.floor(remainingTimeMs / 60000);
            const remainingDays = (remainingMinutes / 1440).toFixed(2);

            statusDiv.textContent += `🗑️ Removing game #${i + 1}：${g.itemName} (Package ID: ${g.packageId})\n`;
            statusDiv.textContent += `Removed：${i} / ${total} (${((i / total)*100).toFixed(2)}%)\n`;
            statusDiv.textContent += `Estimated remaining time：${remainingMinutes} minute(s) ≈ ${remainingDays} day(s)\n`;

            const result = await removeGame(g.packageId);

            if (result.success) {
                statusDiv.textContent += `✅ Successfully removed\n\n`;
                i++;  
            } else {
                statusDiv.textContent += `❌ Failed to remove. Reason：\n\t${result.error}\n\n`;
                if (result.code === 84) {
                    hasError84 = true;
                }
            }

            statusDiv.scrollTop = statusDiv.scrollHeight;

            if (i < total) {
                const delay = hasError84 ? randomDelay(120000, 360000) : randomDelay(500, 1500);
                statusDiv.textContent += `⏳ Waiting ${Math.floor(delay/1000)} seconds before continuing...\n\n`;
                statusDiv.scrollTop = statusDiv.scrollHeight;
                await sleep(delay);
            }
        }
    }

    function waitForPage() {
        return new Promise(resolve => {
            if (document.querySelector('.page_content > h2')) {
                resolve();
            } else {
                const observer = new MutationObserver(() => {
                    if (document.querySelector('.page_content > h2')) {
                        observer.disconnect();
                        resolve();
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true });
            }
        });
    }

    waitForPage().then(() => {
        insertButton();
    });
})();
