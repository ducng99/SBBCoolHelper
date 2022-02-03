// ==UserScript==
// @name         SBB Cool Helper
// @namespace    maxhyt.SBBCoolHelper
// @version      1.1.5.0
// @description  Add VIP features to SBB site
// @license      AGPL-3.0-or-later
// @copyright    2022. Thomas Nguyen
// @author       Maxhyt
// @match        https://sb.ltn.fi/*
// @icon         https://icons.duckduckgo.com/ip2/sb.ltn.fi.ico
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    // Extensions    
    /**
     * Append a new element to the DOM from a string
     * @param {string} elementInString string representation of an element
     * @return {HTMLElement} the new element appended
     */
    HTMLElement.prototype.appendFromString = function (elementInString) {
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

    const CATEGORIES = ['sponsor', 'selfpromo', 'interaction', 'intro', 'outro', 'preview', 'music_offtopic', 'filler', 'poi_highlight', 'exclusive_access'];
    const CATEGORIES_NAMES = ['Sponsor', 'Unpaid/Self promotion', 'Interaction reminder', 'Intermission/Intro animation', 'Endcards/Credits', 'Preview/Recap', 'Non-music', 'Filler/Tangent', 'Highlight', 'Exclusive Access'];
    const ACTION_TYPES = ['skip', 'mute', 'full'];

    // Please give me enum JS 😢
    const TOAST_TYPE = { Normal: 'Normal', Warning: 'Warning', Danger: 'Danger' };

    // Global variables
    let IsStarted = false;
    let VoteHeaderIndex = -1;
    let CategoryHeaderIndex = -1;

    const DarkModeButton = document.body.querySelector('#darkmode');

    // Button to set User ID
    const userIDSetButton = DarkModeButton.parentNode.appendFromString('<button class="btn me-2">Set UserID</button>');
    userIDSetButton.addEventListener('click', () => {
        const userID = prompt("Enter your private user ID:");

        if (VerifyPrivateUserID(userID)) {
            GM_setValue('userID', userID);
            ShowToast('Saved!');
            userIDSetButton.classList.remove('btn-warning');
            userIDSetButton.classList.add('btn-secondary');

            if (!IsStarted) Main();
        }
        else if (userID) {
            ShowToast("Invalid user ID! Please try again.", TOAST_TYPE.Warning);
        }
    });

    if (VerifyPrivateUserID(GM_getValue('userID'))) {
        userIDSetButton.classList.add('btn-secondary');
        Main();
    }
    else {
        userIDSetButton.classList.add('btn-warning');
    }

    // Setup toasts container
    const TOASTS_CONTAINER = document.body.appendFromString(`<div class="toast-container position-fixed top-0 start-50 translate-middle-x mt-3" style="z-index: 1111"></div>`);

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

        // Add category lock button
        let videoID = '';
        const youtubeURL = document.body.querySelector('li.list-group-item > a[href^="https://www.youtube.com"], li.list-group-item > a[href^="https://youtu.be"]')?.href;
        if (youtubeURL.includes('youtube.com')) {
            videoID = new URL(youtubeURL).searchParams.get('v');
        }
        else if (youtubeURL.includes('youtu.be')) {
            videoID = new URL(youtubeURL).pathname.substring(1);
        }

        if (videoID) {
            const categoryLockButton = document.createElement('button');
            categoryLockButton.classList.add('btn', 'btn-warning', 'me-2');
            categoryLockButton.append('🔒');

            categoryLockButton.addEventListener('click', () => ShowLockCategoriesModal(videoID));

            DarkModeButton.parentNode.insertBefore(categoryLockButton, DarkModeButton);
        }
    }

    /**
     * Add upvote, downvote and undo vote buttons to segment row
     * @param {HTMLElement} row 
     */
    function AddVotingButtonsToRow(row) {
        const votingContainer = row.children[VoteHeaderIndex].appendFromString('<div></div>');

        // Upvote button
        const upvoteButton = votingContainer.appendFromString(`<div class="voteButton" title="Upvote this segment">${THUMBS_UP_ICON}</div>`);
        upvoteButton.addEventListener('click', () => {
            if (!upvoteButton.classList.contains('disabled') && confirm('Confirm upvoting?')) {
                const segmentId = row.querySelector('textarea[name="UUID"]')?.value;
                DisableVoteButtons();
                upvoteButton.classList.add('loading');

                SendVoteSegment(segmentId, VOTE_SEG_OPTIONS.Up, () => {
                    upvoteButton.classList.remove('disabled', 'loading');
                    upvoteButton.style.color = 'green';
                    downvoteButton.classList.remove('disabled');
                    downvoteButton.style.color = '';
                    undovoteButton.classList.remove('disabled');
                });
            }
        });

        // Downvote button
        const downvoteButton = votingContainer.appendFromString(`<div class="voteButton">${THUMBS_DOWN_ICON}</div>`);

        if (row.children[VoteHeaderIndex].textContent.includes('👑')) {
            downvoteButton.setAttribute('title', 'This user is a VIP, be sure to discuss first before downvoting this segment');
            downvoteButton.style.color = '#ffc83d';
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
                    upvoteButton.classList.remove('disabled');
                    upvoteButton.style.color = '';
                    downvoteButton.classList.remove('disabled', 'loading');
                    downvoteButton.style.color = 'red';
                    undovoteButton.classList.remove('disabled');
                });
            }
        });

        // Undo vote button
        const undovoteButton = votingContainer.appendFromString(`<div class="voteButton disabled" title="Undo vote on this segment">${ROTATE_LEFT_ICON}</div>`);
        undovoteButton.addEventListener('click', () => {
            if (!undovoteButton.classList.contains('disabled') && confirm('Confirm undo vote?')) {
                const segmentId = row.querySelector('textarea[name="UUID"]')?.value;
                DisableVoteButtons();
                undovoteButton.classList.add('loading');

                SendVoteSegment(segmentId, VOTE_SEG_OPTIONS.Undo, () => {
                    upvoteButton.classList.remove('disabled');
                    upvoteButton.style.color = '';
                    downvoteButton.classList.remove('disabled');
                    downvoteButton.style.color = '';
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
    }

    /**
     * Add category change button to segment row
     * @param {HTMLElement} row 
     */
    function AddCategoryChangeButtonToRow(row) {
        row.children[CategoryHeaderIndex].appendChild(document.createElement('br'));

        const categoryChangeButton = row.children[CategoryHeaderIndex].appendFromString('<button class="btn btn-secondary btn-sm mt-1" title="Change this segment\'s category">✏</button>');
        categoryChangeButton.addEventListener('click', () => {
            categoryChangeButton.classList.add('disabled');

            const segmentId = row.querySelector('textarea[name="UUID"]')?.value;
            const category = CATEGORIES.find(c => row.children[CategoryHeaderIndex].textContent.includes(c));

            ShowCategoryChangeModal(segmentId, category, () => {
                categoryChangeButton.classList.remove('disabled');
            });
        });
    }

    /**
     * Show a modal with a list of categories to choose from and a button to save the category
     * @param {string} segmentId UUID of the segment
     * @param {string} category current category of the segment
     * @param {Function|undefined} onClosed function to call when the modal is closed
     */
    function ShowCategoryChangeModal(segmentId, category, onClosed) {
        // Create a modal
        const modal = new Modal;
        modal.Title = 'Change category';

        // Add categories to modal
        modal.Body.appendFromString('<label for="modal_select_category">Select a new category:</label>');

        const categorySelect = modal.Body.appendFromString('<select id="modal_select_category" class="form-select mt-2"></select>');

        CATEGORIES.forEach((cat, i) => {
            const option = categorySelect.appendFromString(`<option value=${cat}>${CATEGORIES_NAMES[i]}</option>`);

            if (category === cat) {
                option.selected = true;
                option.disabled = true;
            }
        });

        // Assign close function to modal
        modal.OnClosed = onClosed;

        // Assign save function to modal
        modal.AddButton('Save changes', () => {
            if (confirm(`Confirm changing category from "${category}" to "${categorySelect.value}"?`)) {
                SendCategoryUpdate(segmentId, categorySelect.value, modal.CloseModal);
            }
        });
    }

    /**
     * Show a modal to lock categories of a video
     * @param {string} videoID 
     * @param {Function|undefined} onClosed function to call when the modal is closed
     */
    function ShowLockCategoriesModal(videoID, onClosed) {
        // Create a modal
        const modal = new Modal;
        modal.Title = 'Lock/Unlock categories for ' + videoID;

        // Add categories to modal
        modal.Body.appendFromString('<h5>Choose categories to (un)lock:</h5>');

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
                    if (!['filler', 'poi_highlight', 'exclusive_access'].includes(checkbox.value)) {
                        checkbox.checked = true;
                    }
                });
            }
        });

        const categoriesContainer = modal.Body.appendFromString('<div id="modal_categories_container" class="row"></div>');
        const categoriesContainerLeftCol = categoriesContainer.appendFromString('<div class="col-12 col-sm-6"></div>');
        const categoriesContainerRightCol = categoriesContainer.appendFromString('<div class="col-12 col-sm-6"></div>');

        CATEGORIES.forEach((cat, i) => {
            const box = document.createElement('div');
            box.classList.add('form-check');

            box.appendFromString(`<input class="form-check-input" type="checkbox" id="modal_checkbox_category_${cat}" value="${cat}">`);
            box.appendFromString(`<label class="form-check-label" for="modal_checkbox_category_${cat}">${CATEGORIES_NAMES[i]}</label>`);

            if (i < CATEGORIES.length / 2) {
                categoriesContainerLeftCol.appendChild(box);
            }
            else {
                categoriesContainerRightCol.appendChild(box);
            }
        });

        // Add action types to modal
        modal.Body.appendFromString('<h5 class="mt-3">Choose action types to (un)lock:</h5>');

        const actionTypesContainer = modal.Body.appendFromString('<div id="modal_action_types_container"></div>');
        ACTION_TYPES.forEach(type => {
            const box = actionTypesContainer.appendFromString('<div class="form-check"></div>');

            box.appendFromString(`<input class="form-check-input" type="checkbox" id="modal_checkbox_type_${type}" value="${type}" checked/>`);
            box.appendFromString(`<label class="form-check-label" for="modal_checkbox_type_${type}">${type}</label>`);

            actionTypesContainer.appendChild(box);
        });

        // Add reason to modal
        modal.Body.appendFromString('<h5 class="mt-3">Reason:</h5>');
        const reasonTextarea = modal.Body.appendFromString('<textarea class="form-control" width="100%" style="resize: vertical"></textarea>');

        // Assign close function to modal
        modal.OnClosed = onClosed;

        // Add unlock button to modal
        modal.AddButton('🔓 Unlock', () => {
            const categories = [...modal.Body.querySelectorAll('#modal_categories_container input[type="checkbox"]:checked')].map(c => c.value);
            const actionTypes = [...modal.Body.querySelectorAll('#modal_action_types_container input[type="checkbox"]:checked')].map(t => t.value);

            if (categories.length === 0 || actionTypes.length === 0) {
                ShowToast('Please select at least one category and action type to unlock.', TOAST_TYPE.Warning);
            }
            else if (confirm('Confirm unlocking these categories?\n\n' + categories.join(', '))) {
                SendUnlockCategories(videoID, categories, actionTypes, modal.CloseModal.bind(modal));
            }
        });

        // Add lock button to modal
        modal.AddButton('🔒 Lock', () => {
            // Bootstrap will clone the `categoriesContainer` and `actionTypesContainer` (I think), therefore we need to get the values by querying the body
            const categories = [...modal.Body.querySelectorAll('#modal_categories_container input[type="checkbox"]:checked')].map(c => c.value);
            const actionTypes = [...modal.Body.querySelectorAll('#modal_action_types_container input[type="checkbox"]:checked')].map(t => t.value);
            const reason = reasonTextarea.value;

            if (categories.length === 0 || actionTypes.length === 0) {
                ShowToast('Please select at least one category and action type to lock.', TOAST_TYPE.Warning);
            }
            else if (confirm('Confirm locking these categories?\n\n' + categories.join(', '))) {
                SendLockCategories(videoID, categories, actionTypes, reason, modal.CloseModal.bind(modal));
            }
        });
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

        /** @type {Function|undefined} */
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
         * @param {(this: HTMLButtonElement, ev: MouseEvent) => any} action Action to perform when button is clicked
         */
        AddButton(text, action) {
            const button = this._modal.querySelector('.modal-footer').appendFromString(`<button type="button" class="btn btn-primary">${text}</button>`);
            button.addEventListener('click', action);
        }

        /**
         * @param {string} title
         */
        set Title(title) {
            this._title.append(title);
        }

        /**
         * @param {Function} onClosed
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
     * TODO: replace alerts with something more user-friendly
     * @param {string} uuid
     * @param {VOTE_SEG_OPTIONS} voteID
     * @param {Function|undefined} onFinish function to call when the request is finished (both success or fail)
    */
    function SendVoteSegment(uuid, voteID, onFinish) {
        const userID = GM_getValue('userID');

        if (!VerifyUUID(uuid)) {
            ShowToast(`Invalid segment ID: "${uuid}"`, TOAST_TYPE.Warning);

            if (onFinish) onFinish();
        }
        else if (Object.values(VOTE_SEG_OPTIONS).indexOf(voteID) === -1) {
            ShowToast(`Invalid vote ID: "${voteID}"`, TOAST_TYPE.Warning);

            if (onFinish) onFinish();
        }
        else if (!VerifyPrivateUserID(userID)) {
            ShowToast(`Invalid user ID: "${userID}"`, TOAST_TYPE.Warning);

            if (onFinish) onFinish();
        }
        else {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `https://sponsor.ajay.app/api/voteOnSponsorTime?UUID=${uuid}&userID=${userID}&type=${voteID}`,
                responseType: 'json',
                onload: function (response) {
                    switch (response.status) {
                        case 403:
                            ShowToast('Vote is rejected\n\n' + response.response.message, TOAST_TYPE.Danger);
                            break;
                        case 400:
                            ShowToast('Failed to vote on the segment. Please check the segment info and your User ID\n\n' +
                                'UUID: ' + uuid + '\n' +
                                'Type: ' + voteID,
                                TOAST_TYPE.Danger);
                            break;
                        case 200:
                            ShowToast('Voted!');
                            break;
                        default:
                            ShowToast('Failed to send the request, something might be wrong with the server.', TOAST_TYPE.Warning);
                            break;
                    }

                    if (onFinish) onFinish();
                },
                onerror: function () {
                    ShowToast('Failed to send the request, something might be wrong with the server or your internet is 💩.', TOAST_TYPE.Warning);

                    if (onFinish) onFinish();
                }
            });
        }
    }

    /**
     * Update category of a segment
     * @param {string} uuid segment UUID
     * @param {string} category the new category of the segment
     * @param {Function|undefined} onFinish function to call when the request is finished (both success or fail)
     */
    function SendCategoryUpdate(uuid, category, onFinish) {
        const userID = GM_getValue('userID');

        if (!VerifyUUID(uuid)) {
            ShowToast(`Invalid segment ID: "${uuid}"`, TOAST_TYPE.Warning);

            if (onFinish) onFinish();
        }
        else if (CATEGORIES.indexOf(category) === -1) {
            ShowToast(`Invalid category name: "${category}"`, TOAST_TYPE.Warning);

            if (onFinish) onFinish();
        }
        else if (!VerifyPrivateUserID(userID)) {
            ShowToast(`Invalid user ID: "${userID}"`, TOAST_TYPE.Warning);

            if (onFinish) onFinish();
        }
        else {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `https://sponsor.ajay.app/api/voteSponsorTimeCategory?UUID=${uuid}&userID=${userID}&category=${category}`,
                responseType: 'json',
                onload: function (response) {
                    switch (response.status) {
                        case 403:
                            ShowToast('Update is rejected\n\n' + response.response.message, TOAST_TYPE.Danger);
                            break;
                        case 400:
                            ShowToast('Failed to update the category. Please check the segment info and your User ID\n\n' +
                                'UUID: ' + uuid + '\n' +
                                'Category: ' + category,
                                TOAST_TYPE.Danger);
                            break;
                        case 200:
                            ShowToast('Updated!');
                            break;
                        default:
                            ShowToast('Failed to send the request, something might be wrong with the server.', TOAST_TYPE.Warning);
                            break;
                    }

                    if (onFinish) onFinish();
                },
                onerror: function () {
                    ShowToast('Failed to send the request, something might be wrong with the server or your internet is 💩.', TOAST_TYPE.Warning);

                    if (onFinish) onFinish();
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
     * @param {Function|undefined} onFinish function to call when the request is finished (both success or fail)
     */
    function SendLockCategories(videoID, categories, actionTypes, reason, onFinish) {
        const userID = GM_getValue('userID');
        const invalidCategories = categories.filter(c => CATEGORIES.indexOf(c) === -1);
        const invalidActionTypes = actionTypes.filter(t => ACTION_TYPES.indexOf(t) === -1);

        if (!VerifyPrivateUserID(userID)) {
            ShowToast(`Invalid user ID: "${userID}"`, TOAST_TYPE.Warning);

            if (onFinish) onFinish();
        }
        else if (invalidCategories.length > 0) {
            ShowToast('Invalid categories: ' + invalidCategories.join(', '), TOAST_TYPE.Warning);

            if (onFinish) onFinish();
        }
        else if (invalidActionTypes.length > 0) {
            ShowToast('Invalid action types: ' + invalidActionTypes.join(', '), TOAST_TYPE.Warning);

            if (onFinish) onFinish();
        }
        else {
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://sponsor.ajay.app/api/lockCategories',
                data: JSON.stringify({ videoID, userID, categories, actionTypes, reason }),
                headers: { 'Content-Type': 'application/json' },
                onload: function (response) {
                    switch (response.status) {
                        case 400:
                            ShowToast('Failed to lock categories. Please check these info and your User ID\n\n' +
                                'Video ID: ' + videoID + '\n' +
                                'Categories: ' + categories.join(', ') + '\n' +
                                'Action types: ' + actionTypes.join(', ') + '\n' +
                                'Reason: ' + reason,
                                TOAST_TYPE.Danger);
                            break;
                        case 403:
                            ShowToast('Lock is rejected. You are not a VIP', TOAST_TYPE.Danger);
                            break;
                        case 200:
                            ShowToast('Locked!');
                            break;
                        default:
                            ShowToast('Failed to send the request, something might be wrong with the server.', TOAST_TYPE.Warning);
                            break;
                    }

                    if (onFinish) onFinish();
                },
                onerror: function () {
                    ShowToast('Failed to send the request, something might be wrong with the server or your internet is 💩.', TOAST_TYPE.Warning);

                    if (onFinish) onFinish();
                }
            });
        }
    }

    /**
     * Send request to unlock categories for a video
     * @param {string} videoID 
     * @param {string[]} categories an array of categories being locked
     * @param {string[]} actionTypes an array of action types being locked
     * @param {Function|undefined} onFinish function to call when the request is finished (both success or fail)
     */
    function SendUnlockCategories(videoID, categories, actionTypes, onFinish) {
        const userID = GM_getValue('userID');
        const invalidCategories = categories.filter(c => CATEGORIES.indexOf(c) === -1);
        const invalidActionTypes = actionTypes.filter(t => ACTION_TYPES.indexOf(t) === -1);

        if (!VerifyPrivateUserID(userID)) {
            ShowToast(`Invalid user ID: "${userID}"`, TOAST_TYPE.Warning);

            if (onFinish) onFinish();
        }
        else if (invalidCategories.length > 0) {
            ShowToast('Invalid categories: ' + invalidCategories.join(', '), TOAST_TYPE.Warning);

            if (onFinish) onFinish();
        }
        else if (invalidActionTypes.length > 0) {
            ShowToast('Invalid action types: ' + invalidActionTypes.join(', '), TOAST_TYPE.Warning);

            if (onFinish) onFinish();
        }
        else {
            GM_xmlhttpRequest({
                method: 'DELETE',
                url: 'https://sponsor.ajay.app/api/lockCategories',
                data: JSON.stringify({ videoID, userID, categories, actionTypes }),
                headers: { 'Content-Type': 'application/json' },
                responseType: 'json',
                onload: function (response) {
                    switch (response.status) {
                        case 400:
                            ShowToast('Failed to unlock categories. Please check these info and your User ID\n\n' +
                                'Video ID: ' + videoID + '\n' +
                                'Categories: ' + categories.join(', ') + '\n' +
                                'Action types: ' + actionTypes.join(', '),
                                TOAST_TYPE.Danger);
                            break;
                        case 403:
                            ShowToast('Unlock is rejected. You are not a VIP', TOAST_TYPE.Danger);
                            break;
                        case 200:
                            ShowToast(response.response.message);
                            break;
                        default:
                            ShowToast('Failed to send the request, something might be wrong with the server.', TOAST_TYPE.Warning);
                            break;
                    }

                    if (onFinish) onFinish();
                },
                onerror: function () {
                    ShowToast('Failed to send the request, something might be wrong with the server or your internet is 💩.', TOAST_TYPE.Warning);

                    if (onFinish) onFinish();
                }
            });
        }
    }

    // Utilities
    function VerifyUUID(uuid) {
        return /^[a-f0-9]{64,65}$/.test(uuid);
    }

    function VerifyPrivateUserID(userID) {
        return userID.length >= 32;
    }
})();