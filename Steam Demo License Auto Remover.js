// ==UserScript==
// @name         One-Click Steam Demo License Auto Remover
// @namespace    https://github.com/joex92/Steam-Auto-Demo-License-Remover
// @version      3.1.3
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
    let pkgOpt = {retry: false, skipped: false};
    const retrybtn = document.createElement('button');
    const skipbtn = document.createElement('button');
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

        retrybtn.hidden = true;
        retrybtn.textContent = '🔄 Retry';
        retrybtn.style.backgroundColor = '#FFD700';
        retrybtn.style.color = '#000';
        retrybtn.style.border = 'none';
        retrybtn.style.padding = '5px 12px';
        retrybtn.style.marginLeft = '15px';
        retrybtn.style.cursor = 'pointer';
        retrybtn.style.borderRadius = '4px';
        retrybtn.style.fontWeight = 'bold';

        skipbtn.hidden = true;
        skipbtn.textContent = '⏭️ Skip';
        skipbtn.style.backgroundColor = '#FFD700';
        skipbtn.style.color = '#000';
        skipbtn.style.border = 'none';
        skipbtn.style.padding = '5px 12px';
        skipbtn.style.marginLeft = '15px';
        skipbtn.style.cursor = 'pointer';
        skipbtn.style.borderRadius = '4px';
        skipbtn.style.fontWeight = 'bold';
        
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
                chklbl.hidden = true;
                statusDiv.hidden = false;
                statusDiv.textContent = '';
                statusDiv.style.resize = 'vertical';
                startCleaning(statusDiv).then(() => {
                    if ( timer.wasStopped ) {
                        statusDiv.textContent += `\n❌ Cleaning stopped by user! \n`;
                    } else {
                        statusDiv.textContent += '\n✨ Completed！\n';
                        // btn.disabled = false;
                        chklbl.hidden = false;
                        retrybtn.hidden = true;
                        skipbtn.hidden = true;
                    }
                    btn.textContent = '🧹 Start cleaning';
                });
            } else {
                if ( timer.stop() ) {
                    chklbl.hidden = false;
                    retrybtn.hidden = true;
                    skipbtn.hidden = true;
                }
            }
        });
        
        chklbl.addEventListener('click', () => {
            chk.checked = !chk.checked;
        });
        
        retrybtn.addEventListener('click', () => {
            pkgOpt.retry = true;
            timer.stop();
        });
        
        skipbtn.addEventListener('click', () => {
            pkgOpt.skipped = true;
            timer.stop();
        });

        titleElem.parentNode.insertBefore(btn, titleElem.nextSibling);
        titleElem.parentNode.insertBefore(chklbl, btn.nextSibling);
        titleElem.parentNode.insertBefore(retrybtn, chklbl.nextSibling);
        titleElem.parentNode.insertBefore(skipbtn, retrybtn.nextSibling);
        titleElem.parentNode.insertBefore(statusDiv, skipbtn.nextSibling);
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
                const isDemo = (cells[1].innerText.search(/\b(demo|prologue|trial|episode|alpha|beta|sample|part|trailer|демо|пролог|эпизод|альфа|бета|тест|пробная)\b|(体験|試用|デモ|ベータ|アルファ|序章|试玩|試玩|体验|體驗|演示|前編|前篇|체험|프롤로그|에피소드|알파|베타)(版|판)?|お試し/i) > -1) || noDemo; // /(\s|\()(demo|prologue)(?![a-z])/i

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
                let msg = `\n\tError code:${data.success}\n\t`;
                switch (data.success) {
                    // case 1:
        				// msg += '(OK)'; 
        				// break;
        			case 2:
        				msg += '(Operation is restricted, which may have triggered a speed limit. Please try again later)'; 
        				break;
        			case 3:
        				msg += '(No Connection)'; 
        				break;
        			case 4:
        				msg += '(No Connection Retry)'; 
        				break;
        			case 5:
        				msg += '(Invalid Password)'; 
        				break;
        			case 6:
        				msg += '(Logged In Elsewhere)'; 
        				break;
        			case 7:
        				msg += '(Invalid Protocol Ver)'; 
        				break;
        			case 8:
        				msg += '(Invalid Param)'; 
        				break;
        			case 9:
        				msg += '(File Not Found)'; 
        				break;
        			case 10:
        				msg += '(Busy)'; 
        				break;
        			case 11:
        				msg += '(Invalid State)'; 
        				break;
        			case 12:
        				msg += '(Invalid Name)'; 
        				break;
        			case 13:
        				msg += '(Invalid Email)'; 
        				break;
        			case 14:
        				msg += '(Duplicate Name)'; 
        				break;
        			case 15:
        				msg += '(Access Denied)'; 
        				break;
        			case 16:
        				msg += '(Timeout)'; 
        				break;
        			case 17:
        				msg += '(Banned)'; 
        				break;
        			case 18:
        				msg += '(Account Not Found)'; 
        				break;
        			case 19:
        				msg += '(Invalid Steam ID)'; 
        				break;
        			case 20:
        				msg += '(Service Unavailable)'; 
        				break;
        			case 21:
        				msg += '(Not Logged On)'; 
        				break;
        			case 22:
        				msg += '(Pending)'; 
        				break;
        			case 23:
        				msg += '(Encryption Failure)'; 
        				break;
        			case 24:
        				msg += '(The session has expired. Please log in again)'; 
        				break;
        			case 25:
        				msg += '(Limit Exceeded)'; 
        				break;
        			case 26:
        				msg += '(Revoked)'; 
        				break;
        			case 27:
        				msg += '(Expired)'; 
        				break;
        			case 28:
        				msg += '(Already Redeemed)'; 
        				break;
        			case 29:
        				msg += '(Duplicate Request)'; 
        				break;
        			case 30:
        				msg += '(Already Owned)'; 
        				break;
        			case 31:
        				msg += '(IP Not Found)'; 
        				break;
        			case 32:
        				msg += '(Persist Failed)'; 
        				break;
        			case 33:
        				msg += '(Locking Failed)'; 
        				break;
        			case 34:
        				msg += '(Logon Session Replaced)'; 
        				break;
        			case 35:
        				msg += '(Connect Failed)'; 
        				break;
        			case 36:
        				msg += '(Handshake Failed)'; 
        				break;
        			case 37:
        				msg += '(IO Failure)'; 
        				break;
        			case 38:
        				msg += '(Remote Disconnect)'; 
        				break;
        			case 39:
        				msg += '(Shopping Cart Not Found)'; 
        				break;
        			case 40:
        				msg += '(Blocked)'; 
        				break;
        			case 41:
        				msg += '(Ignored)'; 
        				break;
        			case 42:
        				msg += '(No Match)'; 
        				break;
        			case 43:
        				msg += '(Account Disabled)'; 
        				break;
        			case 44:
        				msg += '(Service Read Only)'; 
        				break;
        			case 45:
        				msg += '(Account Not Featured)'; 
        				break;
        			case 46:
        				msg += '(Administrator OK)'; 
        				break;
        			case 47:
        				msg += '(Content Version)'; 
        				break;
        			case 48:
        				msg += '(Try Another CM)'; 
        				break;
        			case 49:
        				msg += '(Password Required To Kick Session)'; 
        				break;
        			case 50:
        				msg += '(Already Logged In Elsewhere)'; 
        				break;
        			case 51:
        				msg += '(Suspended)'; 
        				break;
        			case 52:
        				msg += '(Cancelled)'; 
        				break;
        			case 53:
        				msg += '(Data Corruption)'; 
        				break;
        			case 54:
        				msg += '(Disk Full)'; 
        				break;
        			case 55:
        				msg += '(Remote Call Failed)'; 
        				break;
        			case 56:
        				msg += '(Password Not Set)'; 
        				break;
        			case 56:
        				msg += '(Password Unset)'; 
        				break;
        			case 57:
        				msg += '(External Account Unlinked)'; 
        				break;
        			case 58:
        				msg += '(PSN Ticket Invalid)'; 
        				break;
        			case 59:
        				msg += '(External Account Already Linked)'; 
        				break;
        			case 60:
        				msg += '(Remote File Conflict)'; 
        				break;
        			case 61:
        				msg += '(Illegal Password)'; 
        				break;
        			case 62:
        				msg += '(Same As Previous Value)'; 
        				break;
        			case 63:
        				msg += '(Account Logon Denied)'; 
        				break;
        			case 64:
        				msg += '(Cannot Use Old Password)'; 
        				break;
        			case 65:
        				msg += '(Invalid Login Auth Code)'; 
        				break;
        			case 66:
        				msg += '(Account Logon Denied No Mail Sent)'; 
        				break;
        			case 66:
        				msg += '(Account Logon Denied No Mail)'; 
        				break;
        			case 67:
        				msg += '(Hardware Not Capable Of IPT)'; 
        				break;
        			case 68:
        				msg += '(IPT Init Error)'; 
        				break;
        			case 69:
        				msg += '(Parental Control Restricted)'; 
        				break;
        			case 70:
        				msg += '(Facebook Query Error)'; 
        				break;
        			case 71:
        				msg += '(Expired Login Auth Code)'; 
        				break;
        			case 72:
        				msg += '(IP Login Restriction Failed)'; 
        				break;
        			case 73:
        				msg += '(Account Locked)'; 
        				break;
        			case 73:
        				msg += '(Account Locked Down)'; 
        				break;
        			case 74:
        				msg += '(Account Logon Denied Verified Email Required)'; 
        				break;
        			case 75:
        				msg += '(No Matching URL)'; 
        				break;
        			case 76:
        				msg += '(Bad Response)'; 
        				break;
        			case 77:
        				msg += '(Require Password Re Entry)'; 
        				break;
        			case 78:
        				msg += '(Value Out Of Range)'; 
        				break;
        			case 79:
        				msg += '(Unexpected Error)'; 
        				break;
        			case 80:
        				msg += '(Disabled)'; 
        				break;
        			case 81:
        				msg += '(Invalid CEG Submission)'; 
        				break;
        			case 82:
        				msg += '(Restricted Device)'; 
        				break;
        			case 83:
        				msg += '(Region Locked)'; 
        				break;
        			case 84:
        				msg += '(Steam rejected the request; this may be due to rate limiting or an invalid request)'; 
        				break;
        			case 85:
        				msg += '(Account Logon Denied Need Two Factor Code)'; 
        				break;
        			case 85:
        				msg += '(Account Login Denied Need Two Factor)'; 
        				break;
        			case 86:
        				msg += '(Item Or Entry Has Been Deleted)'; 
        				break;
        			case 86:
        				msg += '(Item Deleted)'; 
        				break;
        			case 87:
        				msg += '(Account Login Denied Throttle)'; 
        				break;
        			case 88:
        				msg += '(Two Factor Code Mismatch)'; 
        				break;
        			case 89:
        				msg += '(Two Factor Activation Code Mismatch)'; 
        				break;
        			case 90:
        				msg += '(Account Associated To Multiple Players)'; 
        				break;
        			case 90:
        				msg += '(Account Associated To Multiple Partners)'; 
        				break;
        			case 91:
        				msg += '(Not Modified)'; 
        				break;
        			case 92:
        				msg += '(No Mobile Device Available)'; 
        				break;
        			case 92:
        				msg += '(No Mobile Device)'; 
        				break;
        			case 93:
        				msg += '(Time Is Out Of Sync)'; 
        				break;
        			case 93:
        				msg += '(Time Not Synced)'; 
        				break;
        			case 94:
        				msg += '(Sms Code Failed)'; 
        				break;
        			case 95:
        				msg += '(Too Many Accounts Access This Resource)'; 
        				break;
        			case 95:
        				msg += '(Account Limit Exceeded)'; 
        				break;
        			case 96:
        				msg += '(Account Activity Limit Exceeded)'; 
        				break;
        			case 97:
        				msg += '(Phone Activity Limit Exceeded)'; 
        				break;
        			case 98:
        				msg += '(Refund To Wallet)'; 
        				break;
        			case 99:
        				msg += '(Email Send Failure)'; 
        				break;
        			case 100:
        				msg += '(Not Settled)'; 
        				break;
        			case 101:
        				msg += '(Need Captcha)'; 
        				break;
        			case 102:
        				msg += '(GSLT Denied)'; 
        				break;
        			case 103:
        				msg += '(GS Owner Denied)'; 
        				break;
        			case 104:
        				msg += '(Invalid Item Type)'; 
        				break;
        			case 105:
        				msg += '(IP Banned)'; 
        				break;
        			case 106:
        				msg += '(GSLT Expired)'; 
        				break;
        			case 107:
        				msg += '(Insufficient Funds)'; 
        				break;
        			case 108:
        				msg += '(Too Many Pending)'; 
        				break;
        			case 109:
        				msg += '(No Site Licenses Found)'; 
        				break;
        			case 110:
        				msg += '(WG Network Send Exceeded)'; 
        				break;
        			case 111:
        				msg += '(Account Not Friends)'; 
        				break;
        			case 112:
        				msg += '(Limited User Account)'; 
        				break;
        			case 113:
        				msg += '(Cant Remove Item)'; 
        				break;
        			case 114:
        				msg += '(Account Has Been Deleted)'; 
        				break;
        			case 114:
        				msg += '(Account Deleted)'; 
        				break;
        			case 115:
        				msg += '(Account Has An Existing User Cancelled License)'; 
        				break;
        			case 115:
        				msg += '(Existing User Cancelled License)'; 
        				break;
        			case 116:
        				msg += '(Denied Due To Community Cooldown)'; 
        				break;
        			case 116:
        				msg += '(Community Cooldown)'; 
        				break;
        			case 117:
        				msg += '(No Launcher Specified)'; 
        				break;
        			case 118:
        				msg += '(Must Agree To SSA)'; 
        				break;
        			case 119:
        				msg += '(Client No Longer Supported)'; 
        				break;
        			case 119:
        				msg += '(Launcher Migrated)'; 
        				break;
        			case 120:
        				msg += '(Current Steam Realm Does Not Match)'; 
        				break;
        			case 120:
        				msg += '(Steam Realm Mismatch)'; 
        				break;
        			case 121:
        				msg += '(Invalid Signature)'; 
        				break;
        			case 122:
        				msg += '(Parse Failure)'; 
        				break;
        			case 123:
        				msg += '(No Verified Phone)'; 
        				break;
        			case 124:
        				msg += '(Insufficient Battery)'; 
        				break;
        			case 125:
        				msg += '(Charger Required)'; 
        				break;
        			case 126:
        				msg += '(Cached Credential Invalid)'; 
        				break;
        			case 127:
        				msg += '(Phone Number Is VOIP)'; 
        				break;
        			case 128:
        				msg += '(Not Supported)'; 
        				break;
        			case 129:
        				msg += '(Family Size Limit Exceeded)'; 
        				break;
        			default:
        				msg += '(Unknown Error)'; 
        				break;
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
        console.log(`Removing ${total} games:`, games);
        
        if (total === 0) {
            statusDiv.textContent = '✅ No games found to be removed。';
            return;
        }

        let hasError84 = false; 
        let avgCount = 1;
        let avgSum = 0;
        let delay = 500;
        let retries = 0;

        statusDiv.textContent += `🚀 Automatic remove of ${chk.checked ? "demo" : "free"} games has begun...\nA total of ${total} removable ${chk.checked ? "demo" : "free"} games were found.\n\n`;

        if ( retrybtn.hidden ) retrybtn.hidden = false;
        if ( skipbtn.hidden ) skipbtn.hidden = false;
        
        for (let i = 0; i < total; ) { 
            const g = games[i];
            const remainingCount = total - i;

            statusDiv.textContent += `🗑️ Removing game #${i + 1}：${g.itemName} (Package ID: ${g.packageId}) [Retries: ${retries}]\n`;
            
            const result = await removeGame(g.packageId);
            
            if (result.success) {
                statusDiv.textContent += `✅ Successfully removed\n`;
                i++;
                hasError84 = false;
                retries = 0;
            } else {
                statusDiv.textContent += `❌ Failed to remove. Reason：${result.error}\n`;
                if (result.code === 84) {
                    hasError84 = true;
                } else {
                    hasError84 = false;
                }
                retries++;
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
                statusDiv.textContent += `Estimated remaining time：${remainingMinutes} minute(s) ≈ ${remainingDays} day(s)\n\n`;
                statusDiv.textContent += `⏳ Waiting ${(delay/1000).toFixed(2)} seconds before continuing...\n\n`;
                statusDiv.scrollTop = statusDiv.scrollHeight;
                await timer.start(delay);
                if ( timer.wasStopped ) { 
                    if ( pkgOpt.retry ) pkgOpt.retry = false;
                    else if ( pkgOpt.skipped ) {
                        pkgOpt.skipped = false;
                        i++;
                    } else break;
                }
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
