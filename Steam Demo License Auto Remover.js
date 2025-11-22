// ==UserScript==
// @name         One-Click Steam Demo License Auto Remover
// @namespace    https://github.com/joex92/Steam-Auto-Demo-License-Remover
// @version      2.6
// @description  Original by PeiqiLi. This is an English Translated version with the addition of removing demo/prologue titles only.
// @author       PeiqiLi + JoeX92
// @match        https://store.steampowered.com/account/licenses/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=steampowered.com
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    class SleepTimer {
        constructor() {
            this.timeoutId = null;
            this.resolvePromise = null;
            this.startTime = 0;
            this.elapsed = 0;
            // Tracks the state: 'idle', 'running', 'completed', 'stopped'
            this.status = 'idle'; 
        }
    
        // --- Helper Getters ---
        get isRunning() {
            return this.status === 'running';
        }
    
        get wasStopped() {
            return this.status === 'stopped';
        }
    
        // --- Methods ---
        start(ms) {
            if (this.timeoutId) this.stop();
    
            this.startTime = Date.now();
            this.elapsed = 0;
            this.status = 'running';
    
            return new Promise((resolve) => {
                this.resolvePromise = resolve;
                this.timeoutId = setTimeout(() => {
                    this.elapsed = ms;
                    this.status = 'completed';
                    resolve(false); 
                    this._cleanup();
                }, ms);
            });
        }
    
        stop() {
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
                this.elapsed = Date.now() - this.startTime;
                this.status = 'stopped'; // <--- Interrupted manually
    
                if (this.resolvePromise) {
                    this.resolvePromise(true); 
                }
                
                this._cleanup();
                return true;
            }
            return false;
        }
    
        _cleanup() {
            this.timeoutId = null;
            this.resolvePromise = null;
        }
    }
    const timer = new SleepTimer();
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
                
        const chklbl = document.createElement('button');
        chk.type = 'checkbox';
        chk.name = 'option';
        chk.value = 'selected';
        chk.checked = true;
        chk.style.pointerEvents = 'none';
        chklbl.appendChild(document.createTextNode('📋 Demo Titles Only '));
        chklbl.appendChild(chk);
        chklbl.style.backgroundColor = '#FFD700';
        chklbl.style.color = '#000';
        chklbl.style.border = 'none';
        chklbl.style.padding = '5px 12px';
        chklbl.style.marginLeft = '15px';
        chklbl.style.cursor = 'pointer';
        chklbl.style.borderRadius = '4px';
        chklbl.style.fontWeight = 'bold';
        
        const statusDiv = document.createElement('pre');
        statusDiv.hidden = true;
        statusDiv.style.border = '1px solid #ccc';
        statusDiv.style.padding = '10px';
        statusDiv.style.marginTop = '10px';
        statusDiv.style.maxHeight = '300px';
        statusDiv.style.overflowY = 'auto';
        statusDiv.style.whiteSpace = 'pre-wrap';
        statusDiv.style.backgroundColor = '#FFD700';
        statusDiv.style.color = '#000';

        btn.addEventListener('click', () => {
            // btn.disabled = true;
            if ( btn.textContent === '🧹 Start cleaning' ) {
                btn.textContent = '🚫 Stop cleaning';
                chk.disabled = true;
                chklbl.disabled = true;
                statusDiv.hidden = false;
                statusDiv.textContent = '';
                statusDiv.style.resize = 'vertical';
                startCleaning(statusDiv).then(() => {
                    if ( timer.wasStopped ) {
                        statusDiv.textContent += `\n❌ Cleaning stopped by user! \n`;
                    } else {
                        statusDiv.textContent += '\n✨ Completed！\n';
                        // btn.disabled = false;
                        chk.disabled = false;
                        chklbl.disabled = false;
                    }
                    btn.textContent = '🧹 Start cleaning';
                });
            } else {
                if ( timer.stop() ) {
                    chk.disabled = false;
                    chklbl.disabled = false;
                }
            }
        });
        
        chklbl.addEventListener('click', () => {
            chk.checked = !chk.checked;
        });

        titleElem.parentNode.insertBefore(btn, titleElem.nextSibling);
        titleElem.parentNode.insertBefore(chklbl, btn.nextSibling);
        titleElem.parentNode.insertBefore(statusDiv, chklbl.nextSibling);
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
                const isDemo = (cells[1].innerText.search(/\b(demo|prologue)\b/i> -1) || noDemo; // /(\s|\()(demo|prologue)(?![a-z])/i

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
        let avgCount = 1;
        let avgSum = 0;
        let delay = 500;

        statusDiv.textContent += `🚀 Automatic remove of ${chk.checked ? "demo" : "free"} games has begun...\nA total of ${total} removable ${chk.checked ? "demo" : "free"} games were found.\n\n`;

        for (let i = 0; i < total; ) { 
            const g = games[i];
            const remainingCount = total - i;

            statusDiv.textContent += `🗑️ Removing game #${i + 1}：${g.itemName} (Package ID: ${g.packageId})\n`;

            const result = await removeGame(g.packageId);
            
            if (result.success) {
                statusDiv.textContent += `✅ Successfully removed\n\n`;
                i++;
                hasError84 = false;
            } else {
                statusDiv.textContent += `❌ Failed to remove. Reason：\n\t${result.error}\n\n`;
                if (result.code === 84) {
                    hasError84 = true;
                } else {
                    hasError84 = false;
                }
            }
            
            statusDiv.textContent += `Removed：${i} / ${total} (${((i / total)*100).toFixed(2)}%)\n`;
            statusDiv.scrollTop = statusDiv.scrollHeight;

            if (i < total) {
                delay = hasError84 ? randomDelay(120000, 360000) : randomDelay(500, 1500);
                avgSum += delay;
                const avgDelay = avgSum / avgCount; // hasError84 ? 420000 : 1000;;
                const remainingTimeMs = remainingCount * avgDelay;
                const remainingMinutes = (remainingTimeMs / 60000).toFixed(2);
                const remainingDays = (remainingMinutes / 1440).toFixed(2);
                statusDiv.textContent += `Estimated remaining time：${remainingMinutes} minute(s) ≈ ${remainingDays} day(s)\n`;
                statusDiv.textContent += `⏳ Waiting ${(delay/1000).toFixed(2)} seconds before continuing...\n`;
                statusDiv.scrollTop = statusDiv.scrollHeight;
                await timer.start(delay);
                if ( timer.wasStopped ) break;
            }
            if ( delay > 1500 ) avgCount++;
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
