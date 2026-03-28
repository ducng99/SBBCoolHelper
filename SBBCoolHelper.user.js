// ==UserScript==
// @name         SBB Cool Helper
// @namespace    maxhyt.SBBCoolHelper
// @version      3.0.0
// @description  Add VIP features to SBB site
// @license      MIT
// @author       Maxhyt
// @updateURL    https://raw.githubusercontent.com/ducng99/SBBCoolHelper/master/SBBCoolHelper.user.js
// @downloadURL  https://raw.githubusercontent.com/ducng99/SBBCoolHelper/master/SBBCoolHelper.user.js
// @match        https://sb.ltn.fi/*
// @icon         https://icons.duckduckgo.com/ip2/sb.ltn.fi.ico
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    /**
     * Append a new element to the DOM from a string
     * @param {string} elementInString string representation of an element
     * @return {Element} the new element appended
     */
    Element.prototype.appendFromString = function (elementInString) {
        let tmpDOM = document.createElement('div');
        tmpDOM.innerHTML = elementInString;
        return this.appendChild(tmpDOM.firstChild);
    }

    GM_addStyle(`
.voteButton {
    display: inline-block;
    width: 1.3em;
    cursor: pointer;
    margin-top: 0.2em;
    margin-left: 0.3em;
    margin-right: 0.3em;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.voteButton.loading {
    animation: spin 0.75s cubic-bezier(.3,.75,.47,1) infinite;
    transform-origin: center;
}

.voteButton.disabled, .changeSegmentBtn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.sbb-helper-toast-container {
    position: fixed;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
}

.sbb-helper-toast {
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    color: white;
    font-size: 0.875rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    animation: toast-in 0.3s ease-out;
    min-width: 200px;
    text-align: center;
}

.sbb-helper-toast.warning {
    background-color: #f59e0b;
    color: black;
}

.sbb-helper-toast.danger {
    background-color: #dc2626;
}

.sbb-helper-toast.normal {
    background-color: #1f2937;
}

@keyframes toast-in {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
}

.sbb-helper-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.sbb-helper-modal {
    background: var(--mantine-color-body, #fff);
    border-radius: 0.5rem;
    padding: 1.5rem;
    min-width: 300px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.sbb-helper-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.sbb-helper-modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
}

.sbb-helper-modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    opacity: 0.5;
}

.sbb-helper-modal-close:hover {
    opacity: 1;
}

.sbb-helper-modal-body {
    margin-bottom: 1rem;
}

.sbb-helper-modal-footer {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}

.sbb-helper-btn {
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    transition: opacity 0.2s;
}

.sbb-helper-btn:hover {
    opacity: 0.9;
}

.sbb-helper-btn-primary {
    background-color: #228be6;
    color: white;
}

.sbb-helper-btn-secondary {
    background-color: #868e96;
    color: white;
}

.sbb-helper-btn-danger {
    background-color: #fa5252;
    color: white;
}

.sbb-helper-btn-warning {
    background-color: #fab005;
    color: black;
}
`);

    // Constants

    // Icons by Font Awesome
    const THUMBS_UP_ICON = '<svg viewBox="0 0 512 512" width="16" height="16"><path fill="currentColor" d="M128 447.1V223.1c0-17.67-14.33-31.1-32-31.1H32c-17.67 0-32 14.33-32 31.1v223.1c0 17.67 14.33 31.1 32 31.1h64C113.7 479.1 128 465.6 128 447.1zM512 224.1c0-26.5-21.48-47.98-48-47.98h-146.5c22.77-37.91 34.52-80.88 34.52-96.02C352 56.52 333.5 32 302.5 32c-63.13 0-26.36 76.15-108.2 141.6L178 186.6C166.2 196.1 160.2 210 160.1 224c-.0234 .0234 0 0 0 0L160 384c0 15.1 7.113 29.33 19.2 38.39l34.14 25.59C241 468.8 274.7 480 309.3 480H368c26.52 0 48-21.47 48-47.98c0-3.635-.4805-7.143-1.246-10.55C434 415.2 448 397.4 448 376c0-9.148-2.697-17.61-7.139-24.88C463.1 347 480 327.5 480 304.1c0-12.5-4.893-23.78-12.72-32.32C492.2 270.1 512 249.5 512 224.1z"></path></svg>';
    const THUMBS_DOWN_ICON = '<svg viewBox="0 0 512 512" width="16" height="16"><path fill="currentColor" d="M96 32.04H32c-17.67 0-32 14.32-32 31.1v223.1c0 17.67 14.33 31.1 32 31.1h64c17.67 0 32-14.33 32-31.1V64.03C128 46.36 113.7 32.04 96 32.04zM467.3 240.2C475.1 231.7 480 220.4 480 207.9c0-23.47-16.87-42.92-39.14-47.09C445.3 153.6 448 145.1 448 135.1c0-21.32-14-39.18-33.25-45.43C415.5 87.12 416 83.61 416 79.98C416 53.47 394.5 32 368 32h-58.69c-34.61 0-68.28 11.22-95.97 31.98L179.2 89.57C167.1 98.63 160 112.9 160 127.1l.1074 160c0 0-.0234-.0234 0 0c.0703 13.99 6.123 27.94 17.91 37.36l16.3 13.03C276.2 403.9 239.4 480 302.5 480c30.96 0 49.47-24.52 49.47-48.11c0-15.15-11.76-58.12-34.52-96.02H464c26.52 0 48-21.47 48-47.98C512 262.5 492.2 241.9 467.3 240.2z"></path></svg>';
    const ROTATE_LEFT_ICON = '<svg viewBox="0 0 512 512" width="16" height="16"><path fill="currentColor" d="M480 256c0 123.4-100.5 223.9-223.9 223.9c-48.84 0-95.17-15.58-134.2-44.86c-14.12-10.59-16.97-30.66-6.375-44.81c10.59-14.12 30.62-16.94 44.81-6.375c27.84 20.91 61 31.94 95.88 31.94C344.3 415.8 416 344.1 416 256s-71.69-159.8-159.8-159.8c-37.46 0-73.09 13.49-101.3 36.64l45.12 45.14c17.01 17.02 4.955 46.1-19.1 46.1H35.17C24.58 224.1 16 215.5 16 204.9V59.04c0-24.04 29.07-36.08 46.07-19.07l47.6 47.63C149.9 52.71 201.5 32.11 256.1 32.11C379.5 32.11 480 132.6 480 256z"></path></svg>';

    // Vote segment options
    const VOTE_SEG_OPTIONS = { Up: 1, Down: 0, Undo: 20 };
    const CATEGORIES = { 'sponsor': 'Sponsor', 'selfpromo': 'Unpaid/Self promotion', 'interaction': 'Interaction reminder', 'intro': 'Intermission/Intro animation', 'outro': 'Endcards/Credits', 'preview': 'Preview/Recap', 'hook': 'Hook/Greetings', 'music_offtopic': 'Music: Non-music', 'filler': 'Filler Tangent', 'poi_highlight': 'Highlight', 'exclusive_access': 'Exclusive Access', 'chapter': 'Chapter' };
    const CATEGORIES_VALUES = Object.keys(CATEGORIES);
    const ACTION_TYPES = { 'skip': 'Skip', 'mute': 'Mute', 'full': 'Full video', 'poi': 'Point of interest', 'chapter': 'Chapter' };
    const ACTION_TYPES_VALUES = Object.keys(ACTION_TYPES);
    const STORAGE_VARS = { PrivateUserID: 'userID', PublicUserID: 'publicUserID', Username: 'username', IsVIP: 'isVIP' };

    // Please give me enum JS 😢
    const TOAST_TYPE = { Normal: 0, Warning: 1, Danger: 2 };

    // Global variables
    let IsStarted = false;
    let VoteHeaderIndex = -1;
    let CategoryHeaderIndex = -1;
    let dataTableInitialized = false;
    let buttonsWrapper = null;

    // Find the main navbar element
    function findNavbar() {
        return document.querySelector('.mantine-Group-root');
    }

    // Get or create the buttons wrapper in the navbar
    function getNavbarButtonsWrapper() {
        if (buttonsWrapper && buttonsWrapper.parentElement) {
            return buttonsWrapper;
        }

        const navbar = findNavbar();
        if (!navbar) return null;

        buttonsWrapper = navbar.querySelector('.sbb-helper-buttons-wrapper');
        if (buttonsWrapper) return buttonsWrapper;

        buttonsWrapper = document.createElement('div');
        buttonsWrapper.className = 'sbb-helper-buttons-wrapper';
        buttonsWrapper.style.cssText = 'display: flex; gap: 0.5rem; align-items: center;';

        const children = navbar.children;
        if (children.length >= 2) {
            navbar.insertBefore(buttonsWrapper, children[1]);
        } else {
            navbar.appendChild(buttonsWrapper);
        }

        return buttonsWrapper;
    }

    // Find the segments data table
    function findDataTable() {
        return document.querySelector('.mantine-datatable');
    }

    // Find table header cells
    function findTableHeaders() {
        return document.querySelectorAll('.mantine-datatable-header-cell-sortable');
    }

    // Find table data rows
    function findTableRows() {
        return document.querySelectorAll('.mantine-datatable-row');
    }

    // Extract video ID from the current page
    function findVideoId() {
        const titleMatch = document.title.match(/Video ([a-zA-Z0-9_-]+) \|/);
        if (titleMatch) return titleMatch[1];

        const iframe = document.querySelector('iframe[src*="youtube"]');
        if (iframe) {
            const src = iframe.getAttribute('src');
            const match = src.match(/youtube.*\.com\/embed\/([a-zA-Z0-9_-]+)/);
            if (match) return match[1];
        }

        const videoTitle = document.querySelector("h2.mantine-Title-root > span")?.textContent;
        if (videoTitle) {
            const videoTitleMatch = videoTitle.trim().match(/^([a-zA-Z0-9_-]+)$/);
            if (videoTitleMatch) return videoTitleMatch[1];
        }

        return null;
    }

    // Initialize navbar buttons (Set UserID button)
    function initNavbarButtons() {
        const wrapper = getNavbarButtonsWrapper();
        if (!wrapper) return false;

        if (!wrapper.querySelector('.sbbUserIdButton')) {
            const userIDSetButton = document.createElement('button');
            userIDSetButton.className = 'sbbUserIdButton sbb-helper-btn mantine-Button-root mantine-Button-size-xs';
            userIDSetButton.textContent = '👨‍💻 Set UserID';
            userIDSetButton.style.cssText = 'font-size: 0.75rem; padding: 0.25rem 0.5rem;';
            userIDSetButton.addEventListener('click', () => {
                const userID = prompt("Enter your private user ID:");
                if (VerifyPrivateUserID(userID)) {
                    GM_setValue(STORAGE_VARS.PrivateUserID, userID);
                    SendGetUserInfo((info) => {
                        ShowToast('Saved!');
                        UpdateSetUserIDButton(info.username, info.isVIP);
                        if (!IsStarted) Main();
                    });
                }
                else if (userID) {
                    ShowToast("Invalid user ID! Please try again.", TOAST_TYPE.Warning);
                }
            });
            wrapper.appendChild(userIDSetButton);

            if (VerifyPrivateUserID(GM_getValue(STORAGE_VARS.PrivateUserID))) {
                let publicUserID = GM_getValue(STORAGE_VARS.PublicUserID);
                let username = GM_getValue(STORAGE_VARS.Username);
                let isVIP = GM_getValue(STORAGE_VARS.IsVIP);

                if (publicUserID && username && isVIP) {
                    UpdateSetUserIDButton(username, isVIP);
                    if (!IsStarted) Main();
                }
                else {
                    SendGetUserInfo((info) => {
                        UpdateSetUserIDButton(info.username, info.isVIP);
                        if (!IsStarted) Main();
                    });
                }
            }
            else {
                userIDSetButton.classList.add('sbb-helper-btn-warning');
            }
        }
        return true;
    }

    /**
     * Update the Set UserID button to show the current user
     * @param {string} username
     * @param {boolean} isVIP
     */
    function UpdateSetUserIDButton(username, isVIP) {
        const wrapper = getNavbarButtonsWrapper();
        if (!wrapper) return;

        const button = wrapper.querySelector('.sbbUserIdButton');
        if (!button) return;

        button.classList.remove('sbb-helper-btn-warning');
        button.classList.add('sbb-helper-btn-secondary');
        button.textContent = '';

        if (isVIP) {
            button.append('👑 ');
        }
        else {
            button.append('👨‍💻 ');
        }
        button.append(`${username.substring(0, 10)}`);
    }

    // Unleash da powah
    function Main() {
        IsStarted = true;

        const headers = findTableHeaders();
        const rows = findTableRows();

        headers.forEach((header, i) => {
            const title = header.getAttribute('title') || header.textContent;
            if (title && title.includes('Votes')) {
                VoteHeaderIndex = i;
            }
            else if (title && title.includes('Category')) {
                CategoryHeaderIndex = i;
            }
        });

        if (rows.length > 0) {
            dataTableInitialized = true;
        }

        rows.forEach(row => {
            AddVotingButtonsToRow(row);
            AddCategoryChangeButtonToRow(row);
        });

        if (GM_getValue(STORAGE_VARS.IsVIP)) {
            const videoID = findVideoId();
            if (videoID) {
                addVIPButtons(videoID);
            }
        }
    }

    // Add VIP-only buttons (lock categories, purge segments)
    function addVIPButtons(videoID) {
        const wrapper = getNavbarButtonsWrapper();
        if (!wrapper) return;

        if (!wrapper.querySelector('.categoryLockButton')) {
            const categoryLockButton = document.createElement('button');
            categoryLockButton.className = 'categoryLockButton sbb-helper-btn sbb-helper-btn-warning';
            categoryLockButton.textContent = '🔒 Lock categories';
            categoryLockButton.style.cssText = 'font-size: 0.75rem; padding: 0.25rem 0.5rem;';
            categoryLockButton.addEventListener('click', () => ShowLockCategoriesModal(videoID));
            wrapper.appendChild(categoryLockButton);
        }

        if (!wrapper.querySelector('.purgeSegmentsButton')) {
            const purgeSegmentsButton = document.createElement('button');
            purgeSegmentsButton.className = 'purgeSegmentsButton sbb-helper-btn sbb-helper-btn-danger';
            purgeSegmentsButton.textContent = '🗑 Purge segments';
            purgeSegmentsButton.style.cssText = 'font-size: 0.75rem; padding: 0.25rem 0.5rem;';
            purgeSegmentsButton.addEventListener('click', () => {
                const [_, acceptButton] = ShowConfirmModal('Purge segments', `Are you sure you want to purge all segments on ${videoID}?`, () => {
                    SendPurgeSegments(videoID);
                });
                acceptButton.classList.remove('sbb-helper-btn-primary');
                acceptButton.classList.add('sbb-helper-btn-danger');
            });
            wrapper.appendChild(purgeSegmentsButton);
        }
    }

    // Get segment UUID from table row
    function getUUIDFromRow(row) {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 10) {
            const uuidLink = cells[9].querySelector('a');
            if (uuidLink) {
                const content = uuidLink.textContent;
                if (content && /^[a-f0-9]{64,65}$/i.test(content)) {
                    return content;
                }
            }
        }
        return null;
    }

    // Get user ID from table row
    function getUserIdFromRow(row) {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 12) {
            const userIdLink = cells[11].querySelector('a');
            if (userIdLink) {
                const content = userIdLink.textContent;
                if (content && /^[a-f0-9]{64,65}$/i.test(content)) {
                    return content;
                }
            }
        }
        return null;
    }

    // Check if segment is locked (VIP locked)
    function getLockedFromCell(cell) {
        const badges = cell.querySelectorAll('.mantine-Badge-label');
        for (let badge of badges) {
            if (badge.textContent.includes('🔒')) {
                return true;
            }
        }
        return false;
    }

    /**
     * Add upvote, downvote and undo vote buttons to segment row
     * @param {Element} row
     */
    function AddVotingButtonsToRow(row) {
        if (row.querySelector('.voteButtonsContainer')) return;

        const cells = row.querySelectorAll('.mantine-Table-td');
        const votesCell = cells[VoteHeaderIndex >= 0 ? VoteHeaderIndex : 4];
        if (!votesCell) return;

        const votingContainer = votesCell.appendFromString('<div class="voteButtonsContainer" style="display: flex; align-items: center;"></div>');

        const upvoteButton = votingContainer.appendFromString(`<div class="voteButton" title="Upvote this segment">${THUMBS_UP_ICON}</div>`);
        upvoteButton.addEventListener('click', () => {
            if (upvoteButton.classList.contains('disabled')) return;
            if (!confirm('Confirm upvoting?')) return;

            const segmentId = getUUIDFromRow(row);
            if (!segmentId) {
                ShowToast("Could not find segment ID", TOAST_TYPE.Warning);
                return;
            }

            DisableVoteButtons();
            upvoteButton.classList.add('loading');

            SendVoteSegment(segmentId, VOTE_SEG_OPTIONS.Up, () => {
                EnableVoteButtons();
                upvoteButton.classList.remove('loading');
                upvoteButton.style.color = 'green';
                downvoteButton.style.color = '';
            }, () => {
                EnableVoteButtons();
                upvoteButton.classList.remove('loading');
            });
        });

        const downvoteButton = votingContainer.appendFromString(`<div class="voteButton" title="Downvote this segment">${THUMBS_DOWN_ICON}</div>`);

        if (getLockedFromCell(votesCell)) {
            if (GM_getValue(STORAGE_VARS.IsVIP)) {
                downvoteButton.setAttribute('title', 'This segment is locked by a VIP');
                downvoteButton.style.color = '#ffc83d';
            }
            else {
                downvoteButton.setAttribute('title', 'This segment is locked by a VIP');
                downvoteButton.classList.add('disabled');
            }
        }

        downvoteButton.addEventListener('click', () => {
            if (downvoteButton.classList.contains('disabled')) return;
            if (!confirm('Confirm downvoting?')) return;

            const segmentId = getUUIDFromRow(row);
            if (!segmentId) {
                ShowToast("Could not find segment ID", TOAST_TYPE.Warning);
                return;
            }

            DisableVoteButtons();
            downvoteButton.classList.add('loading');

            SendVoteSegment(segmentId, VOTE_SEG_OPTIONS.Down, () => {
                EnableVoteButtons();
                upvoteButton.style.color = '';
                downvoteButton.classList.remove('loading');
                downvoteButton.style.color = 'red';
            }, () => {
                EnableVoteButtons();
                downvoteButton.classList.remove('loading');
            });
        });

        const undovoteButton = votingContainer.appendFromString(`<div class="voteButton" title="Undo vote on this segment">${ROTATE_LEFT_ICON}</div>`);
        undovoteButton.addEventListener('click', () => {
            if (undovoteButton.classList.contains('disabled')) return;
            if (!confirm('Confirm undo vote?')) return;

            const segmentId = getUUIDFromRow(row);
            if (!segmentId) {
                ShowToast("Could not find segment ID", TOAST_TYPE.Warning);
                return;
            }

            DisableVoteButtons();
            undovoteButton.classList.add('loading');

            SendVoteSegment(segmentId, VOTE_SEG_OPTIONS.Undo, () => {
                EnableVoteButtons();
                upvoteButton.style.color = '';
                downvoteButton.style.color = '';
                undovoteButton.classList.remove('loading');
            }, () => {
                EnableVoteButtons();
                undovoteButton.classList.remove('loading');
            });
        });

        function DisableVoteButtons() {
            upvoteButton.classList.add('disabled');
            downvoteButton.classList.add('disabled');
            undovoteButton.classList.add('disabled');
        }

        function EnableVoteButtons() {
            upvoteButton.classList.remove('disabled');
            downvoteButton.classList.remove('disabled');
            undovoteButton.classList.remove('disabled');
        }
    }

    /**
     * Add category change button to segment row if user is VIP or user created the segment
     * @param {HTMLElement} row
     */
    function AddCategoryChangeButtonToRow(row) {
        const cells = row.querySelectorAll('.mantine-Table-td');
        const categoryCell = cells[CategoryHeaderIndex >= 0 ? CategoryHeaderIndex : 5];
        if (!categoryCell) return;

        if (categoryCell.querySelector('.changeSegmentBtn')) return;

        const rowUserId = getUserIdFromRow(row);
        const publicUserId = GM_getValue(STORAGE_VARS.PublicUserID);

        if (!GM_getValue(STORAGE_VARS.IsVIP) && rowUserId !== publicUserId) return;

        const categoryChangeButton = categoryCell.appendFromString('<button class="changeSegmentBtn" title="Change category" style="background: none; border: 1px solid #868e96; border-radius: 0.25rem; padding: 0.1rem 0.3rem; margin-left: 0.5rem; cursor: pointer; font-size: 0.75rem;">✏</button>');

        categoryChangeButton.addEventListener('click', () => {
            categoryChangeButton.classList.add('disabled');

            const segmentId = getUUIDFromRow(row);
            const category = CATEGORIES_VALUES.find(c => categoryCell.textContent.toLowerCase().includes(c));

            ShowCategoryChangeModal(segmentId, category, () => {
                categoryChangeButton.classList.remove('disabled');
            });
        });
    }

    /**
     * Show a modal with a list of categories to choose from and a button to save the category
     * @param {string} segmentId UUID of the segment
     * @param {string} category current category of the segment
     * @param {() => void|undefined} onClosed function to call when the modal is closed
     */
    function ShowCategoryChangeModal(segmentId, category, onClosed) {
        const modal = new Modal;
        modal.Title = 'Change category';

        modal.Body.appendFromString('<label for="modal_select_category">Select a new category:</label>');
        const categorySelect = modal.Body.appendFromString('<select id="modal_select_category" style="width: 100%; padding: 0.5rem; margin-top: 0.5rem; border: 1px solid #ced4da; border-radius: 0.25rem;"></select>');

        CATEGORIES_VALUES.forEach(cat => {
            const option = categorySelect.appendFromString(`<option value="${cat}">${CATEGORIES[cat]}</option>`);
            if (category === cat) {
                option.selected = true;
                option.disabled = true;
            }
        });

        modal.OnClosed = onClosed;

        modal.AddButton('Save changes', (button) => {
            if (!confirm(`Confirm changing category from "${category}" to "${categorySelect.value}"?`)) return;

            button.classList.add('disabled');
            button.textContent = 'Saving...';

            SendCategoryUpdate(segmentId, categorySelect.value, modal.CloseModal.bind(modal), () => {
                button.classList.remove('disabled');
                button.textContent = 'Save changes';
            });
        });
    }

    /**
     * Show a modal to lock categories of a video
     * @param {string} videoID
     * @param {() => void|undefined} onClosed function to call when the modal is closed
     */
    function ShowLockCategoriesModal(videoID, onClosed) {
        const modal = new Modal;
        modal.Title = 'Lock/Unlock categories for ' + videoID;

        modal.Body.appendFromString('<h5 style="margin-bottom: 0.5rem;">Choose categories:</h5>');

        const selectAllButton = modal.Body.appendFromString('<button class="sbb-helper-btn sbb-helper-btn-secondary" style="margin-bottom: 1rem;">(Un)Select all</button>');
        selectAllButton.addEventListener('click', () => {
            const checkboxes = modal.Body.querySelectorAll('input[type="checkbox"][id^="modal_checkbox_category_"]');
            const checked = Array.from(checkboxes).find(c => c.checked);
            checkboxes.forEach(cb => cb.checked = !checked);
        });

        const categoriesContainer = modal.Body.appendFromString('<div id="modal_categories_container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;"></div>');

        CATEGORIES_VALUES.forEach((cat, i) => {
            const box = document.createElement('div');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `modal_checkbox_category_${cat}`;
            checkbox.value = cat;

            const label = document.createElement('label');
            label.htmlFor = `modal_checkbox_category_${cat}`;
            label.textContent = CATEGORIES[cat];
            label.style.marginLeft = '0.25rem';

            box.appendChild(checkbox);
            box.appendChild(label);
            categoriesContainer.appendChild(box);
        });

        modal.Body.appendFromString('<h5 style="margin: 1rem 0 0.5rem;">Choose action types:</h5>');

        const actionTypesContainer = modal.Body.appendFromString('<div id="modal_action_types_container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;"></div>');

        ACTION_TYPES_VALUES.forEach(type => {
            const box = document.createElement('div');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `modal_checkbox_type_${type}`;
            checkbox.value = type;
            checkbox.checked = true;

            if (type === 'chapter' || type === 'poi') {
                checkbox.disabled = true;
            }

            const label = document.createElement('label');
            label.htmlFor = `modal_checkbox_type_${type}`;
            label.textContent = ACTION_TYPES[type];
            label.style.marginLeft = '0.25rem';

            box.appendChild(checkbox);
            box.appendChild(label);
            actionTypesContainer.appendChild(box);
        });

        modal.Body.appendFromString('<h5 style="margin: 1rem 0 0.5rem;">Reason:</h5>');
        const reasonTextarea = modal.Body.appendFromString('<textarea style="width: 100%; padding: 0.5rem; border: 1px solid #ced4da; border-radius: 0.25rem; resize: vertical;" rows="3"></textarea>');

        modal.OnClosed = onClosed;

        modal.AddButton('🔓 Unlock', (button) => {
            const categories = Array.from(modal.Body.querySelectorAll('#modal_categories_container input[type="checkbox"]:checked')).map(c => c.value);
            const actionTypes = Array.from(modal.Body.querySelectorAll('#modal_action_types_container input[type="checkbox"]:checked')).map(t => t.value);

            if (categories.length === 0 || actionTypes.length === 0) {
                ShowToast('Please select at least one category and action type to unlock.', TOAST_TYPE.Warning);
                return;
            }

            if (!confirm('Confirm unlocking these categories?\n\n' + categories.join(', '))) return;

            button.disabled = true;
            button.textContent = 'Unlocking...';

            SendUnlockCategories(videoID, categories, actionTypes, modal.CloseModal.bind(modal), () => {
                button.disabled = false;
                button.textContent = '🔓 Unlock';
            });
        });

        modal.AddButton('🔒 Lock', (button) => {
            const categories = Array.from(modal.Body.querySelectorAll('#modal_categories_container input[type="checkbox"]:checked')).map(c => c.value);
            const actionTypes = Array.from(modal.Body.querySelectorAll('#modal_action_types_container input[type="checkbox"]:checked')).map(t => t.value);
            const reason = reasonTextarea.value;

            if (categories.length === 0 || actionTypes.length === 0) {
                ShowToast('Please select at least one category and action type to lock.', TOAST_TYPE.Warning);
                return;
            }

            if (!confirm('Confirm locking these categories?\n\n' + categories.join(', '))) return;

            button.disabled = true;
            button.textContent = 'Locking...';

            SendLockCategories(videoID, categories, actionTypes, reason, modal.CloseModal.bind(modal), () => {
                button.disabled = false;
                button.textContent = '🔒 Lock';
            });
        });
    }

    /**
     * Show a confirmation modal
     * @param {string} title modal's title
     * @param {string} message modal's message
     * @param {() => void|undefined} onAccept function to be called when user press Yes button
     * @param {() => void|undefined} onDecline function to be called when user press No button
     * @returns {[Modal, HTMLButtonElement, HTMLButtonElement]} the modal instance, accept and decline buttons
     */
    function ShowConfirmModal(title, message, onAccept, onDecline) {
        const modal = new Modal;
        modal.Title = title;
        modal.Body.appendFromString(`<p>${message}</p>`);

        const acceptButton = modal.AddButton('Yes', () => {
            if (onAccept) onAccept();
            modal.CloseModal();
        });

        const declineButton = modal.AddButton('No', () => {
            if (onDecline) onDecline();
            modal.CloseModal();
        });

        declineButton.classList.remove('sbb-helper-btn-primary');
        declineButton.classList.add('sbb-helper-btn-secondary');

        return [modal, acceptButton, declineButton];
    }

    // I'm crazy am I?
    class Modal {
        _modal;
        _modalBody;
        _title;
        _onClosed;

        constructor() {
            this._modal = document.body.appendFromString(`<div class="sbb-helper-modal-overlay">
                <div class="sbb-helper-modal">
                    <div class="sbb-helper-modal-header">
                        <h5 class="sbb-helper-modal-title"></h5>
                        <button type="button" class="sbb-helper-modal-close" title="Close">&times;</button>
                    </div>
                    <div class="sbb-helper-modal-body"></div>
                    <div class="sbb-helper-modal-footer"></div>
                </div></div>`);

            this._title = this._modal.querySelector('.sbb-helper-modal-title');
            this._modalBody = this._modal.querySelector('.sbb-helper-modal-body');

            const closeBtn = this._modal.querySelector('.sbb-helper-modal-close');
            closeBtn.addEventListener('click', () => this.CloseModal());

            this._modal.addEventListener('click', (e) => {
                if (e.target === this._modal) this.CloseModal();
            });

            document.body.appendChild(this._modal);
        }

        CloseModal() {
            if (this._onClosed) this._onClosed();
            this._modal.remove();
        }

        AddButton(text, action) {
            const button = this._modal.querySelector('.sbb-helper-modal-footer').appendFromString(`<button type="button" class="sbb-helper-btn sbb-helper-btn-primary">${text}</button>`);
            button.addEventListener('click', () => action(button));
            return button;
        }

        set Title(title) {
            this._title.textContent = title;
        }

        set OnClosed(onClosed) {
            this._onClosed = onClosed;
        }

        get Body() { return this._modalBody; }
    }

    // Show a toast notification
    function ShowToast(message, type = TOAST_TYPE.Normal) {
        let container = document.querySelector('.sbb-helper-toast-container');
        if (!container) {
            container = document.body.appendFromString('<div class="sbb-helper-toast-container"></div>');
        }

        const toast = container.appendFromString(`<div class="sbb-helper-toast"></div>`);
        toast.textContent = message;

        switch (type) {
            case TOAST_TYPE.Normal:
                toast.classList.add('normal');
                break;
            case TOAST_TYPE.Warning:
                toast.classList.add('warning');
                break;
            case TOAST_TYPE.Danger:
                toast.classList.add('danger');
                break;
        }

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function SendVoteSegment(uuid, voteID, onSuccess, onError) {
        const userID = GM_getValue(STORAGE_VARS.PrivateUserID);

        if (!VerifyUUID(uuid)) {
            ShowToast(`Invalid segment ID: "${uuid}"`, TOAST_TYPE.Warning);
            if (onError) onError();
        }
        else if (Object.values(VOTE_SEG_OPTIONS).indexOf(voteID) === -1) {
            ShowToast(`Invalid vote ID: "${voteID}"`, TOAST_TYPE.Warning);
            if (onError) onError();
        }
        else if (!VerifyPrivateUserID(userID)) {
            ShowToast(`Invalid user ID: "${userID}"`, TOAST_TYPE.Warning);
            if (onError) onError();
        }
        else {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `https://sponsor.ajay.app/api/voteOnSponsorTime?UUID=${uuid}&userID=${userID}&type=${voteID}`,
                responseType: 'json',
                timeout: 5000,
                onload: function (response) {
                    switch (response.status) {
                        case 403:
                            ShowToast('Vote is rejected\n\n' + response.response.message, TOAST_TYPE.Danger);
                            if (onError) onError();
                            break;
                        case 400:
                            ShowToast('Failed to vote on the segment. Please check the segment info and your User ID\n\nUUID: ' + uuid + '\nType: ' + voteID, TOAST_TYPE.Danger);
                            if (onError) onError();
                            break;
                        case 200:
                            ShowToast('Voted!');
                            if (onSuccess) onSuccess();
                            break;
                        default:
                            ShowToast('Failed to send the request, something might be wrong with the server.', TOAST_TYPE.Warning);
                            if (onError) onError();
                            break;
                    }
                },
                onerror: function () {
                    ShowToast('Failed to send the request, check your internet connection.', TOAST_TYPE.Warning);
                    if (onError) onError();
                }
            });
        }
    }

    function SendCategoryUpdate(uuid, category, onSuccess, onError) {
        const userID = GM_getValue(STORAGE_VARS.PrivateUserID);

        if (!VerifyUUID(uuid)) {
            ShowToast(`Invalid segment ID: "${uuid}"`, TOAST_TYPE.Warning);
            if (onError) onError();
        }
        else if (!(category in CATEGORIES)) {
            ShowToast(`Invalid category name: "${category}"`, TOAST_TYPE.Warning);
            if (onError) onError();
        }
        else if (!VerifyPrivateUserID(userID)) {
            ShowToast(`Invalid user ID: "${userID}"`, TOAST_TYPE.Warning);
            if (onError) onError();
        }
        else {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `https://sponsor.ajay.app/api/voteOnSponsorTime?UUID=${uuid}&userID=${userID}&category=${category}`,
                responseType: 'json',
                timeout: 5000,
                onload: function (response) {
                    switch (response.status) {
                        case 403:
                            ShowToast('Update is rejected\n\n' + response.response.message, TOAST_TYPE.Danger);
                            if (onError) onError();
                            break;
                        case 400:
                            ShowToast('Failed to update the category. Please check the segment info and your User ID', TOAST_TYPE.Danger);
                            if (onError) onError();
                            break;
                        case 200:
                            ShowToast('Updated!');
                            if (onSuccess) onSuccess();
                            break;
                        default:
                            ShowToast('Failed to send the request, something might be wrong with the server.', TOAST_TYPE.Warning);
                            if (onError) onError();
                            break;
                    }
                },
                onerror: function () {
                    ShowToast('Failed to send the request, check your internet connection.', TOAST_TYPE.Warning);
                    if (onError) onError();
                }
            });
        }
    }

    function SendLockCategories(videoID, categories, actionTypes, reason, onSuccess, onError) {
        const userID = GM_getValue(STORAGE_VARS.PrivateUserID);

        if (!VerifyPrivateUserID(userID)) {
            ShowToast(`Invalid user ID: "${userID}"`, TOAST_TYPE.Warning);
            if (onError) onError();
        }
        else {
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://sponsor.ajay.app/api/lockCategories',
                data: JSON.stringify({ videoID, userID, categories, actionTypes, reason }),
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000,
                onload: function (response) {
                    switch (response.status) {
                        case 400:
                            ShowToast('Failed to lock categories. Check your info and User ID', TOAST_TYPE.Danger);
                            if (onError) onError();
                            break;
                        case 403:
                            ShowToast('Lock is rejected. You are not a VIP', TOAST_TYPE.Danger);
                            if (onError) onError();
                            break;
                        case 200:
                            ShowToast('Locked!');
                            if (onSuccess) onSuccess();
                            break;
                        default:
                            ShowToast('Failed to send the request.', TOAST_TYPE.Warning);
                            if (onError) onError();
                            break;
                    }
                },
                onerror: function () {
                    ShowToast('Failed to send the request.', TOAST_TYPE.Warning);
                    if (onError) onError();
                }
            });
        }
    }

    function SendUnlockCategories(videoID, categories, actionTypes, onSuccess, onError) {
        const userID = GM_getValue(STORAGE_VARS.PrivateUserID);

        if (!VerifyPrivateUserID(userID)) {
            ShowToast(`Invalid user ID: "${userID}"`, TOAST_TYPE.Warning);
            if (onError) onError();
        }
        else {
            GM_xmlhttpRequest({
                method: 'DELETE',
                url: 'https://sponsor.ajay.app/api/lockCategories',
                data: JSON.stringify({ videoID, userID, categories, actionTypes }),
                headers: { 'Content-Type': 'application/json' },
                responseType: 'json',
                timeout: 5000,
                onload: function (response) {
                    switch (response.status) {
                        case 400:
                            ShowToast('Failed to unlock categories. Check your info and User ID', TOAST_TYPE.Danger);
                            if (onError) onError();
                            break;
                        case 403:
                            ShowToast('Unlock is rejected. You are not a VIP', TOAST_TYPE.Danger);
                            if (onError) onError();
                            break;
                        case 200:
                            ShowToast(response.response.message);
                            if (onSuccess) onSuccess();
                            break;
                        default:
                            ShowToast('Failed to send the request.', TOAST_TYPE.Warning);
                            if (onError) onError();
                            break;
                    }
                },
                onerror: function () {
                    ShowToast('Failed to send the request.', TOAST_TYPE.Warning);
                    if (onError) onError();
                }
            });
        }
    }

    function SendPurgeSegments(videoID, onSuccess, onError) {
        const userID = GM_getValue(STORAGE_VARS.PrivateUserID);

        if (!VerifyPrivateUserID(userID)) {
            ShowToast(`Invalid user ID: "${userID}"`, TOAST_TYPE.Warning);
            if (onError) onError();
        }
        else {
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://sponsor.ajay.app/api/purgeAllSegments',
                data: JSON.stringify({ videoID, userID }),
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000,
                onload: function (response) {
                    switch (response.status) {
                        case 400:
                            ShowToast('Failed to purge segments. Check your info and User ID', TOAST_TYPE.Danger);
                            if (onError) onError();
                            break;
                        case 403:
                            ShowToast('Purge is rejected. You are not a VIP', TOAST_TYPE.Danger);
                            if (onError) onError();
                            break;
                        case 200:
                            ShowToast('Purged all segments!');
                            if (onSuccess) onSuccess();
                            break;
                        default:
                            ShowToast('Failed to send the request.', TOAST_TYPE.Warning);
                            if (onError) onError();
                            break;
                    }
                },
                onerror: function () {
                    ShowToast('Failed to send the request.', TOAST_TYPE.Warning);
                    if (onError) onError();
                }
            });
        }
    }

    function SendGetUserInfo(onSuccess, onError) {
        const userID = GM_getValue(STORAGE_VARS.PrivateUserID);

        if (!VerifyPrivateUserID(userID)) {
            ShowToast(`Invalid user ID: "${userID}"`, TOAST_TYPE.Warning);
            if (onError) onError();
        }
        else {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://sponsor.ajay.app/api/userInfo?userID=${userID}&values=["userID","userName","vip"]`,
                responseType: 'json',
                timeout: 5000,
                onload: function (response) {
                    switch (response.status) {
                        case 400:
                            ShowToast('Failed to get user info. Please check your User ID', TOAST_TYPE.Danger);
                            if (onError) onError();
                            break;
                        case 200:
                            GM_setValue(STORAGE_VARS.PublicUserID, response.response.userID);
                            GM_setValue(STORAGE_VARS.Username, response.response.userName);
                            GM_setValue(STORAGE_VARS.IsVIP, response.response.vip);
                            if (onSuccess) onSuccess({ publicUserID: response.response.userID, username: response.response.userName, isVIP: response.response.vip });
                            break;
                        default:
                            ShowToast('Failed to send the request.', TOAST_TYPE.Warning);
                            if (onError) onError();
                            break;
                    }
                },
                onerror: function () {
                    ShowToast('Failed to send the request.', TOAST_TYPE.Warning);
                    if (onError) onError();
                }
            });
        }
    }

    // Validate UUID format
    function VerifyUUID(uuid) {
        return /^[a-f0-9]{64,65}$/i.test(uuid);
    }

    // Validate private user ID format
    function VerifyPrivateUserID(userID) {
        return userID && userID.length >= 32;
    }

    // Setup observer to reinitialize on navigation
    function setupObserver() {
        let lastUrl = location.href;
        const observer = new MutationObserver((mutations) => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                IsStarted = false;
                dataTableInitialized = false;
                VoteHeaderIndex = -1;
                CategoryHeaderIndex = -1;
                setTimeout(attemptInit, 1000);
                return;
            }

            const rows = findTableRows();

            if (!IsStarted || !dataTableInitialized) {
                if (rows.length > 0 && !dataTableInitialized) {
                    Main();
                }
            }

            if (IsStarted && dataTableInitialized) {
                rows.forEach(row => {
                    if (!row.querySelector('.voteButtonsContainer')) {
                        AddVotingButtonsToRow(row);
                        AddCategoryChangeButtonToRow(row);
                    }
                });
            }

            const wrapper = getNavbarButtonsWrapper();
            if (wrapper && !wrapper.querySelector('.sbbUserIdButton')) {
                initNavbarButtons();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Attempt to initialize the script
    function attemptInit() {
        const navbarReady = initNavbarButtons();
        if (navbarReady) {
            const table = findDataTable();
            if (table) {
                Main();
            }
        }
    }

    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(attemptInit, 1500);
                setupObserver();
            });
        } else {
            setTimeout(attemptInit, 1500);
            setupObserver();
        }
    }

    init();
})();
