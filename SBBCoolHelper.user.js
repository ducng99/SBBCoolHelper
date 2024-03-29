// ==UserScript==
// @name         SBB Cool Helper
// @namespace    maxhyt.SBBCoolHelper
// @version      2.1.0
// @description  Add VIP features to SBB site
// @license      AGPL-3.0-or-later
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

(function() {
    'use strict';

    // Extensions
    /**
     * Append a new element to the DOM from a string
     * @param {string} elementInString string representation of an element
     * @return {Element} the new element appended
     */
    Element.prototype.appendFromString = function(elementInString) {
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
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.voteButton.loading {
    animation: spin 0.75s cubic-bezier(.3,.75,.47,1) infinite;
}

div.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
    `);

    // Constants
    // Icons by Font Awesome
    const THUMBS_UP_ICON = '<svg viewBox="0 0 512 512"><path fill="currentColor" d="M128 447.1V223.1c0-17.67-14.33-31.1-32-31.1H32c-17.67 0-32 14.33-32 31.1v223.1c0 17.67 14.33 31.1 32 31.1h64C113.7 479.1 128 465.6 128 447.1zM512 224.1c0-26.5-21.48-47.98-48-47.98h-146.5c22.77-37.91 34.52-80.88 34.52-96.02C352 56.52 333.5 32 302.5 32c-63.13 0-26.36 76.15-108.2 141.6L178 186.6C166.2 196.1 160.2 210 160.1 224c-.0234 .0234 0 0 0 0L160 384c0 15.1 7.113 29.33 19.2 38.39l34.14 25.59C241 468.8 274.7 480 309.3 480H368c26.52 0 48-21.47 48-47.98c0-3.635-.4805-7.143-1.246-10.55C434 415.2 448 397.4 448 376c0-9.148-2.697-17.61-7.139-24.88C463.1 347 480 327.5 480 304.1c0-12.5-4.893-23.78-12.72-32.32C492.2 270.1 512 249.5 512 224.1z"></path></svg>';
    const THUMBS_DOWN_ICON = '<svg viewBox="0 0 512 512"><path fill="currentColor" d="M96 32.04H32c-17.67 0-32 14.32-32 31.1v223.1c0 17.67 14.33 31.1 32 31.1h64c17.67 0 32-14.33 32-31.1V64.03C128 46.36 113.7 32.04 96 32.04zM467.3 240.2C475.1 231.7 480 220.4 480 207.9c0-23.47-16.87-42.92-39.14-47.09C445.3 153.6 448 145.1 448 135.1c0-21.32-14-39.18-33.25-45.43C415.5 87.12 416 83.61 416 79.98C416 53.47 394.5 32 368 32h-58.69c-34.61 0-68.28 11.22-95.97 31.98L179.2 89.57C167.1 98.63 160 112.9 160 127.1l.1074 160c0 0-.0234-.0234 0 0c.0703 13.99 6.123 27.94 17.91 37.36l16.3 13.03C276.2 403.9 239.4 480 302.5 480c30.96 0 49.47-24.52 49.47-48.11c0-15.15-11.76-58.12-34.52-96.02H464c26.52 0 48-21.47 48-47.98C512 262.5 492.2 241.9 467.3 240.2z"></path></svg>';
    const ROTATE_LEFT_ICON = '<svg viewBox="0 0 512 512"><path fill="currentColor" d="M480 256c0 123.4-100.5 223.9-223.9 223.9c-48.84 0-95.17-15.58-134.2-44.86c-14.12-10.59-16.97-30.66-6.375-44.81c10.59-14.12 30.62-16.94 44.81-6.375c27.84 20.91 61 31.94 95.88 31.94C344.3 415.8 416 344.1 416 256s-71.69-159.8-159.8-159.8c-37.46 0-73.09 13.49-101.3 36.64l45.12 45.14c17.01 17.02 4.955 46.1-19.1 46.1H35.17C24.58 224.1 16 215.5 16 204.9V59.04c0-24.04 29.07-36.08 46.07-19.07l47.6 47.63C149.9 52.71 201.5 32.11 256.1 32.11C379.5 32.11 480 132.6 480 256z"></path></svg>';

    const VOTE_SEG_OPTIONS = {
        Up: 1,
        Down: 0,
        Undo: 20
    };

    const CATEGORIES = { 'sponsor': 'Sponsor', 'selfpromo': 'Unpaid/Self promotion', 'interaction': 'Interaction reminder', 'intro': 'Intermission/Intro animation', 'outro': 'Endcards/Credits', 'preview': 'Preview/Recap/Hook', 'music_offtopic': 'Music: Non-music', 'filler': 'Filler Tangent', 'poi_highlight': 'Highlight', 'exclusive_access': 'Exclusive Access', 'chapter': 'Chapter' };
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

    const DarkModeButton = document.body.querySelector('#darkmode');

    // Button to set User ID
    const userIDSetButton = DarkModeButton.parentNode.appendFromString('<button class="btn me-2">👨‍💻 Set UserID</button>');
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

    // If private ID is stored, get other user info associated with it if not already stored
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
        userIDSetButton.classList.add('btn-warning');
    }

    /**
     * Update the Set UserID button to show the current user
     * @param {string} username
     * @param {boolean} isVIP
     */
    function UpdateSetUserIDButton(username, isVIP) {
        userIDSetButton.classList.remove('btn-warning');
        userIDSetButton.classList.add('btn-secondary');
        userIDSetButton.textContent = '';

        if (isVIP) {
            userIDSetButton.append('👑 ');
        }
        else {
            userIDSetButton.append('👨‍💻 ');
        }

        // Show max 10 characters
        userIDSetButton.append(`${username.substring(0, 10)}`);
    }

    // Setup toasts container
    const TOASTS_CONTAINER = document.body.appendFromString(`<div class="toast-container position-fixed top-0 start-50 translate-middle-x mt-3" style="z-index: 1111"></div>`);

    /**
     * Unleash da powah
     */
    function Main() {
        IsStarted = true;

        const segmentsTable = document.body.querySelector('table');
        const tableHeaders = [...segmentsTable.querySelectorAll('th')];
        const tableRows = [...segmentsTable.querySelectorAll('tbody tr')];

        // Grab index for "Votes" and "Category" columns
        tableHeaders.forEach((header, i) => {
            if (header.textContent.includes('Votes')) {
                VoteHeaderIndex = i;
            }
            else if (header.textContent.includes('Category')) {
                CategoryHeaderIndex = i;
            }
        });

        // Add buttons to each segments in table
        tableRows.forEach(row => {
            AddVotingButtonsToRow(row);
            AddCategoryChangeButtonToRow(row);
        });

        // VIP only buttons
        if (GM_getValue(STORAGE_VARS.IsVIP)) {
            // Add category lock & purge segments button
            let videoID = '';
            const youtubeURL = document.body.querySelector('li.list-group-item > a[href^="https://www.youtube.com"], li.list-group-item > a[href^="https://youtu.be"]')?.href;
            if (youtubeURL) {
                if (youtubeURL.includes('youtube.com')) {
                    videoID = new URL(youtubeURL).searchParams.get('v');
                }
                else if (youtubeURL.includes('youtu.be')) {
                    videoID = new URL(youtubeURL).pathname.substring(1);
                }
            }

            if (videoID) {
                const navbarContainer = DarkModeButton.parentNode;

                // Category lock button
                if (!navbarContainer.querySelector(".categoryLockButton")) {
                    const categoryLockButton = document.createElement('button');
                    categoryLockButton.classList.add('btn', 'btn-warning', 'me-2', 'categoryLockButton');
                    categoryLockButton.append('🔒 Lock categories');
                    categoryLockButton.addEventListener('click', () => ShowLockCategoriesModal(videoID));

                    navbarContainer.insertBefore(categoryLockButton, DarkModeButton);
                }

                // Purge segments button
                if (!navbarContainer.querySelector(".purgeSegmentsButton")) {
                    const purgeSegmentsButton = document.createElement('button');
                    purgeSegmentsButton.classList.add('btn', 'btn-danger', 'me-2', 'purgeSegmentsButton');
                    purgeSegmentsButton.append('🗑 Purge segments');
                    purgeSegmentsButton.addEventListener('click', () => {
                        const [_, acceptButton] = ShowConfirmModal('Purge segments', `Are you sure you want to purge all segments on ${videoID}?`, () => {
                            SendPurgeSegments(videoID);
                        });

                        acceptButton.classList.remove('btn-primary');
                        acceptButton.classList.add('btn-danger');
                    });

                    navbarContainer.insertBefore(purgeSegmentsButton, DarkModeButton);
                }
            }
        }
    }

    /**
     * Add upvote, downvote and undo vote buttons to segment row
     * @param {Element} row 
     */
    function AddVotingButtonsToRow(row) {
        if (!row.children[VoteHeaderIndex].querySelector('.voteButtonsContainer')) {
            const votingContainer = row.children[VoteHeaderIndex].appendFromString('<div class="voteButtonsContainer"></div>');

            // Upvote button
            const upvoteButton = votingContainer.appendFromString(`<div class="voteButton" title="Upvote this segment">${THUMBS_UP_ICON}</div>`);
            upvoteButton.addEventListener('click', () => {
                if (!upvoteButton.classList.contains('disabled') && confirm('Confirm upvoting?')) {
                    const segmentId = row.querySelector('textarea[name="UUID"]')?.value;
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
                }
            });

            // Downvote button
            const downvoteButton = votingContainer.appendFromString(`<div class="voteButton">${THUMBS_DOWN_ICON}</div>`);

            if (row.children[VoteHeaderIndex].textContent.includes('🔒')) {
                if (GM_getValue(STORAGE_VARS.IsVIP)) {
                    downvoteButton.setAttribute('title', 'This segment is locked by a VIP, be sure to discuss first before downvoting this segment');
                    downvoteButton.style.color = '#ffc83d';
                }
                else {
                    downvoteButton.setAttribute('title', 'This segment is locked by a VIP');
                    downvoteButton.classList.add('disabled');
                }
            }
            else {
                downvoteButton.setAttribute('title', 'Downvote this segment');
            }

            downvoteButton.addEventListener('click', () => {
                if (!downvoteButton.classList.contains('disabled') && confirm('Confirm downvoting?')) {
                    const segmentId = row.querySelector('textarea[name="UUID"]')?.value;
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
                }
            });

            // Undo vote button
            const undovoteButton = votingContainer.appendFromString(`<div class="voteButton" title="Undo vote on this segment">${ROTATE_LEFT_ICON}</div>`);
            undovoteButton.addEventListener('click', () => {
                if (!undovoteButton.classList.contains('disabled') && confirm('Confirm undo vote?')) {
                    const segmentId = row.querySelector('textarea[name="UUID"]')?.value;
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
                }
            });

            row.children[VoteHeaderIndex].style.minWidth = '6.7em'; // Make room for voting buttons

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
    }

    /**
     * Add category change button to segment row if user is VIP or user created the segment
     * @param {HTMLElement} row 
     */
    function AddCategoryChangeButtonToRow(row) {
        if (!row.children[CategoryHeaderIndex].querySelector('.changeSegmentBtn') && (GM_getValue(STORAGE_VARS.IsVIP) || row.querySelector('textarea[name="UserID"]')?.value === GM_getValue(STORAGE_VARS.PublicUserID))) {
            row.children[CategoryHeaderIndex].appendChild(document.createElement('br'));

            const categoryChangeButton = row.children[CategoryHeaderIndex].appendFromString('<button class="changeSegmentBtn btn btn-secondary btn-sm mt-1" title="Change this segment\'s category">✏</button>');
            categoryChangeButton.addEventListener('click', () => {
                categoryChangeButton.classList.add('disabled');

                const segmentId = row.querySelector('textarea[name="UUID"]')?.value;
                const category = CATEGORIES_VALUES.find(c => row.children[CategoryHeaderIndex].textContent.toLowerCase().includes(c));

                ShowCategoryChangeModal(segmentId, category, () => {
                    categoryChangeButton.classList.remove('disabled');
                });
            });
        }
    }

    /**
     * Show a modal with a list of categories to choose from and a button to save the category
     * @param {string} segmentId UUID of the segment
     * @param {string} category current category of the segment
     * @param {() => void|undefined} onClosed function to call when the modal is closed
     */
    function ShowCategoryChangeModal(segmentId, category, onClosed) {
        // Create a modal
        const modal = new Modal;
        modal.Title = 'Change category';

        // Add categories to modal
        modal.Body.appendFromString('<label for="modal_select_category">Select a new category:</label>');

        const categorySelect = modal.Body.appendFromString('<select id="modal_select_category" class="form-select mt-2"></select>');

        CATEGORIES_VALUES.forEach(cat => {
            const option = categorySelect.appendFromString(`<option value=${cat}>${CATEGORIES[cat]}</option>`);

            if (category === cat) {
                option.selected = true;
                option.disabled = true;
            }
        });

        // Assign close function to modal
        modal.OnClosed = onClosed;

        // Assign save function to modal
        modal.AddButton('Save changes', (button) => {
            if (confirm(`Confirm changing category from "${category}" to "${categorySelect.value}"?`)) {
                button.classList.add('disabled');
                const spinner = button.appendFromString('<span class="spinner-border spinner-border-sm ms-1" role="status" aria-hidden="true"></span>');

                SendCategoryUpdate(segmentId, categorySelect.value, modal.CloseModal.bind(modal), () => {
                    spinner.remove();
                    button.classList.remove('disabled');
                });
            }
        });
    }

    /**
     * Show a modal to lock categories of a video
     * @param {string} videoID 
     * @param {() => void|undefined} onClosed function to call when the modal is closed
     */
    function ShowLockCategoriesModal(videoID, onClosed) {
        // Create a modal
        const modal = new Modal;
        modal.Title = 'Lock/Unlock categories for ' + videoID;

        // Add categories to modal
        modal.Body.appendFromString('<h5>Choose categories:</h5>');

        const selectAllCategoriesButton = modal.Body.appendFromString('<button class="btn btn-secondary btn-sm my-1">(Un)Select all</button>');
        selectAllCategoriesButton.addEventListener('click', () => {
            const checkboxes = [...modal.Body.querySelectorAll('#modal_categories_container input[type="checkbox"]')];

            if (checkboxes.find(c => c.checked)) {
                checkboxes.forEach(checkbox => {
                    checkbox.checked = false;
                });
            }
            else {
                checkboxes.forEach(checkbox => {
                    if (!['filler', 'poi_highlight', 'exclusive_access', 'chapter'].includes(checkbox.value)) {
                        checkbox.checked = true;
                    }
                });
            }
        });

        const categoriesContainer = modal.Body.appendFromString('<div id="modal_categories_container" class="row"></div>');
        const categoriesContainerLeftCol = categoriesContainer.appendFromString('<div class="col-12 col-sm-6"></div>');
        const categoriesContainerRightCol = categoriesContainer.appendFromString('<div class="col-12 col-sm-6"></div>');

        CATEGORIES_VALUES.forEach((cat, i) => {
            const box = document.createElement('div');
            box.classList.add('form-check');

            const checkbox = box.appendFromString(`<input class="form-check-input" type="checkbox" id="modal_checkbox_category_${cat}" value="${cat}" />`);
            box.appendFromString(`<label class="form-check-label" for="modal_checkbox_category_${cat}">${CATEGORIES[cat]}</label>`);

            if (i < CATEGORIES_VALUES.length / 2) {
                categoriesContainerLeftCol.appendChild(box);
            }
            else {
                categoriesContainerRightCol.appendChild(box);
            }

            if (cat === 'chapter') {
                checkbox.addEventListener('change', () => {
                    const chapter_type_checkbox = modal.Body.querySelector('#modal_checkbox_type_chapter')

                    if (chapter_type_checkbox) {
                        chapter_type_checkbox.checked = checkbox.checked;
                    }
                });
            } else if (cat === 'poi_highlight') {
                checkbox.addEventListener('change', () => {
                    const poi_type_checkbox = modal.Body.querySelector('#modal_checkbox_type_poi')

                    if (poi_type_checkbox) {
                        poi_type_checkbox.checked = checkbox.checked;
                    }
                });
            }
        });

        // Add action types to modal
        modal.Body.appendFromString('<h5 class="mt-3">Choose action types:</h5>');

        const actionTypesContainer = modal.Body.appendFromString('<div id="modal_action_types_container"></div>');
        ACTION_TYPES_VALUES.forEach(type => {
            const box = actionTypesContainer.appendFromString('<div class="form-check"></div>');

            const checkbox = box.appendFromString(`<input class="form-check-input" type="checkbox" id="modal_checkbox_type_${type}" value="${type}" checked />`);
            box.appendFromString(`<label class="form-check-label" for="modal_checkbox_type_${type}">${ACTION_TYPES[type]}</label>`);

            actionTypesContainer.appendChild(box);

            if (type === 'chapter' || type === 'poi') {
                checkbox.disabled = true;
                checkbox.classList.add('disabled');
                checkbox.checked = false;
            }
        });

        // Add reason to modal
        modal.Body.appendFromString('<h5 class="mt-3">Reason:</h5>');
        const reasonTextarea = modal.Body.appendFromString('<textarea class="form-control" width="100%" style="resize: vertical"></textarea>');

        // Assign close function to modal
        modal.OnClosed = onClosed;

        // Add unlock button to modal
        modal.AddButton('🔓 Unlock', (button) => {
            const categories = [...modal.Body.querySelectorAll('#modal_categories_container input[type="checkbox"]:checked')].map(c => c.value);
            const actionTypes = [...modal.Body.querySelectorAll('#modal_action_types_container input[type="checkbox"]:checked')].map(t => t.value);

            if (categories.length === 0 || actionTypes.length === 0) {
                ShowToast('Please select at least one category and action type to unlock.', TOAST_TYPE.Warning);
            }
            else if (confirm('Confirm unlocking these categories?\n\n' + categories.join(', '))) {
                button.classList.add('disabled');
                const spinner = button.appendFromString('<span class="spinner-border spinner-border-sm ms-1" role="status" aria-hidden="true"></span>');

                SendUnlockCategories(videoID, categories, actionTypes, modal.CloseModal.bind(modal), () => {
                    spinner.remove();
                    button.classList.remove('disabled');
                });
            }
        });

        // Add lock button to modal
        modal.AddButton('🔒 Lock', (button) => {
            // Bootstrap will clone the `categoriesContainer` and `actionTypesContainer` (I think), therefore we need to get the values by querying the body
            const categories = [...modal.Body.querySelectorAll('#modal_categories_container input[type="checkbox"]:checked')].map(c => c.value);
            const actionTypes = [...modal.Body.querySelectorAll('#modal_action_types_container input[type="checkbox"]:checked')].map(t => t.value);
            const reason = reasonTextarea.value;

            if (categories.length === 0 || actionTypes.length === 0) {
                ShowToast('Please select at least one category and action type to lock.', TOAST_TYPE.Warning);
            }
            else if (confirm('Confirm locking these categories?\n\n' + categories.join(', '))) {
                button.classList.add('disabled');
                const spinner = button.appendFromString('<span class="spinner-border spinner-border-sm ms-1" role="status" aria-hidden="true"></span>');

                SendLockCategories(videoID, categories, actionTypes, reason, modal.CloseModal.bind(modal), () => {
                    spinner.remove();
                    button.classList.remove('disabled');
                });
            }
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
            modal.CloseModal().bind(modal);
        });
        const declineButton = modal.AddButton('No', () => {
            if (onDecline) onDecline();
            modal.CloseModal().bind(modal);
        });

        declineButton.classList.remove('btn-primary');
        declineButton.classList.add('btn-secondary');

        return [modal, acceptButton, declineButton];
    }

    /**
     * I'm crazy am I?
     */
    class Modal {
        /** @type {bootstrap.Modal} */
        _bootstrapModal;

        /** @type {HTMLDivElement} */
        _modal;
        /** @type {HTMLDivElement} */
        _modalBody;
        /** @type {HTMLHeadElement} */
        _title;

        /** @type {() => any|undefined} */
        _onClosed;

        constructor() {
            // Create the modal
            this._modal = document.body.appendFromString(`<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog"><div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"></h5>
                    <button type="button" data-bs-dismiss="modal" class="btn-close" title="Close"></button>
                </div>
                <div class="modal-body"></div>
                <div class="modal-footer"></div>
            </div></div></div>`);

            this._title = this._modal.querySelector('.modal-title');
            this._modalBody = this._modal.querySelector('.modal-body');

            document.body.appendChild(this._modal);

            this._bootstrapModal = new bootstrap.Modal(this._modal);
            this._bootstrapModal.show();

            this._modal.addEventListener('hide.bs.modal', () => {
                if (this._onClosed) this._onClosed();
            });

            this._modal.addEventListener('hidden.bs.modal', this._modal.remove);
        }

        CloseModal() {
            this._bootstrapModal.hide();
        }

        /**
         * Add a button at the bottom of the modal (primary buttons)
         * @param {string} text Button text
         * @param {(button: HTMLButtonElement) => any} action Action to perform when button is clicked
         * @return {HTMLButtonElement} The button element
         */
        AddButton(text, action) {
            const button = this._modal.querySelector('.modal-footer').appendFromString(`<button type="button" class="btn btn-primary">${text}</button>`);
            button.addEventListener('click', () => action(button));
            return button;
        }

        /**
         * @param {string} title
         */
        set Title(title) {
            this._title.append(title);
        }

        /**
         * @param {() => any} onClosed
         */
        set OnClosed(onClosed) {
            this._onClosed = onClosed;
        }

        get Body() { return this._modalBody; }
    }

    /**
     * Display a toast message (duh)
     * @param {string} message message to display
     * @param {TOAST_TYPE} type toast type (normal, warning, danger)
     */
    function ShowToast(message, type = TOAST_TYPE.Normal) {
        const toast = TOASTS_CONTAINER.appendFromString(`<div class="toast align-items-center" role="alert" aria-live="assertive" aria-atomic="true"><div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div></div>`);

        switch (type) {
            case TOAST_TYPE.Normal:
                toast.classList.add('text-white', 'bg-dark');
                break;
            case TOAST_TYPE.Warning:
                toast.classList.add('text-black', 'bg-warning');
                break;
            case TOAST_TYPE.Danger:
                toast.classList.add('text-white', 'bg-danger');
                break;
            default:
                break;
        }

        new bootstrap.Toast(toast).show();
    }

    /**
     * Send request to API for voting on segments
     * @param {string} uuid
     * @param {VOTE_SEG_OPTIONS} voteID
     * @param {() => void|undefined} onSuccess function to call when the request is successful
     * @param {() => void|undefined} onError function to call when the request returns an error or there is an error with input
    */
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
                onload: function(response) {
                    switch (response.status) {
                        case 403:
                            ShowToast('Vote is rejected\n\n' + response.response.message, TOAST_TYPE.Danger);
                            if (onError) onError();
                            break;
                        case 400:
                            ShowToast('Failed to vote on the segment. Please check the segment info and your User ID\n\n' +
                                'UUID: ' + uuid + '\n' +
                                'Type: ' + voteID,
                                TOAST_TYPE.Danger);
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
                onerror: function() {
                    ShowToast('Failed to send the request, something might be wrong with the server or your internet is 💩.', TOAST_TYPE.Warning);
                    if (onError) onError();
                }
            });
        }
    }

    /**
     * Update category of a segment
     * @param {string} uuid segment UUID
     * @param {string} category the new category of the segment
     * @param {() => void|undefined} onSuccess function to call when the request is successful
     * @param {() => void|undefined} onError function to call when the request returns an error or there is an error with input
     */
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
                onload: function(response) {
                    switch (response.status) {
                        case 403:
                            ShowToast('Update is rejected\n\n' + response.response.message, TOAST_TYPE.Danger);
                            if (onError) onError();
                            break;
                        case 400:
                            ShowToast('Failed to update the category. Please check the segment info and your User ID\n\n' +
                                'UUID: ' + uuid + '\n' +
                                'Category: ' + category,
                                TOAST_TYPE.Danger);
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
                onerror: function() {
                    ShowToast('Failed to send the request, something might be wrong with the server or your internet is 💩.', TOAST_TYPE.Warning);
                    if (onError) onError();
                }
            });
        }
    }

    /**
     * Send request to lock categories for a video
     * @param {string} videoID 
     * @param {string[]} categories an array of categories being locked
     * @param {string[]} actionTypes an array of action types being locked
     * @param {string} reason why these categories are locked
     * @param {() => void|undefined} onSuccess function to call when the request is successful
     * @param {() => void|undefined} onError function to call when the request returns an error or there is an error with input
     */
    function SendLockCategories(videoID, categories, actionTypes, reason, onSuccess, onError) {
        const userID = GM_getValue(STORAGE_VARS.PrivateUserID);
        const invalidCategories = categories.filter(c => !(c in CATEGORIES));
        const invalidActionTypes = actionTypes.filter(t => !(t in ACTION_TYPES));

        if (!VerifyPrivateUserID(userID)) {
            ShowToast(`Invalid user ID: "${userID}"`, TOAST_TYPE.Warning);

            if (onError) onError();
        }
        else if (invalidCategories.length > 0) {
            ShowToast('Invalid categories: ' + invalidCategories.join(', '), TOAST_TYPE.Warning);

            if (onError) onError();
        }
        else if (invalidActionTypes.length > 0) {
            ShowToast('Invalid action types: ' + invalidActionTypes.join(', '), TOAST_TYPE.Warning);

            if (onError) onError();
        }
        else {
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://sponsor.ajay.app/api/lockCategories',
                data: JSON.stringify({ videoID, userID, categories, actionTypes, reason }),
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000,
                onload: function(response) {
                    switch (response.status) {
                        case 400:
                            ShowToast('Failed to lock categories. Please check these info and your User ID\n\n' +
                                'Video ID: ' + videoID + '\n' +
                                'Categories: ' + categories.join(', ') + '\n' +
                                'Action types: ' + actionTypes.join(', ') + '\n' +
                                'Reason: ' + reason,
                                TOAST_TYPE.Danger);
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
                            ShowToast('Failed to send the request, something might be wrong with the server.', TOAST_TYPE.Warning);
                            if (onError) onError();
                            break;
                    }
                },
                onerror: function() {
                    ShowToast('Failed to send the request, something might be wrong with the server or your internet is 💩.', TOAST_TYPE.Warning);
                    if (onError) onError();
                }
            });
        }
    }

    /**
     * Send request to unlock categories for a video
     * @param {string} videoID 
     * @param {string[]} categories an array of categories being locked
     * @param {string[]} actionTypes an array of action types being locked
     * @param {() => void|undefined} onSuccess function to call when the request is successful
     * @param {() => void|undefined} onError function to call when the request returns an error or there is an error with input
     */
    function SendUnlockCategories(videoID, categories, actionTypes, onSuccess, onError) {
        const userID = GM_getValue(STORAGE_VARS.PrivateUserID);
        const invalidCategories = categories.filter(c => !(c in CATEGORIES));
        const invalidActionTypes = actionTypes.filter(t => !(t in ACTION_TYPES));

        if (!VerifyPrivateUserID(userID)) {
            ShowToast(`Invalid user ID: "${userID}"`, TOAST_TYPE.Warning);

            if (onError) onError();
        }
        else if (invalidCategories.length > 0) {
            ShowToast('Invalid categories: ' + invalidCategories.join(', '), TOAST_TYPE.Warning);

            if (onError) onError();
        }
        else if (invalidActionTypes.length > 0) {
            ShowToast('Invalid action types: ' + invalidActionTypes.join(', '), TOAST_TYPE.Warning);

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
                onload: function(response) {
                    switch (response.status) {
                        case 400:
                            ShowToast('Failed to unlock categories. Please check these info and your User ID\n\n' +
                                'Video ID: ' + videoID + '\n' +
                                'Categories: ' + categories.join(', ') + '\n' +
                                'Action types: ' + actionTypes.join(', '),
                                TOAST_TYPE.Danger);
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
                            ShowToast('Failed to send the request, something might be wrong with the server.', TOAST_TYPE.Warning);
                            if (onError) onError();
                            break;
                    }
                },
                onerror: function() {
                    ShowToast('Failed to send the request, something might be wrong with the server or your internet is 💩.', TOAST_TYPE.Warning);
                    if (onError) onError();
                }
            });
        }
    }

    /**
     * Send request to remove all segments on a video
     * @param {string} videoID 
     * @param {() => void|undefined} onSuccess function to call when the request is successful
     * @param {() => void|undefined} onError function to call when the request returns an error or there is an error with input
     */
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
                onload: function(response) {
                    switch (response.status) {
                        case 400:
                            ShowToast('Failed to purge segments. Please check these info and your User ID\n\n' +
                                'Video ID: ' + videoID,
                                TOAST_TYPE.Danger);
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
                            ShowToast('Failed to send the request, something might be wrong with the server.', TOAST_TYPE.Warning);
                            if (onError) onError();
                            break;
                    }
                },
                onerror: function() {
                    ShowToast('Failed to send the request, something might be wrong with the server or your internet is 💩.', TOAST_TYPE.Warning);
                    if (onError) onError();
                }
            });
        }
    }

    /**
     * Send request to receive information about the current user and store it in the GM storage
     * @param {({publicUserID: string, username: string, isVIP: boolean}) => void} onSuccess 
     * @param {() => void} onError function to call when the request returns an error or there is an error with input
     */
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
                onload: function(response) {
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
                            ShowToast('Failed to send the request, something might be wrong with the server.', TOAST_TYPE.Warning);
                            if (onError) onError();
                            break;
                    }
                },
                onerror: function() {
                    ShowToast('Failed to send the request, something might be wrong with the server or your internet is 💩.', TOAST_TYPE.Warning);
                    if (onError) onError();
                }
            });
        }
    }

    // Utilities
    function VerifyUUID(uuid) {
        return /^[a-f0-9]{64,65}$/.test(uuid);
    }

    function VerifyPrivateUserID(userID) {
        return userID && userID.length >= 32;
    }

    // Event listener for new segments
    document.addEventListener('newSegments', (event) => Main());
})();
