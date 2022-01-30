// ==UserScript==
// @name         SBB Cool Helper
// @namespace    maxhyt.sbbVIPHelper
// @version      1.0
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

    GM_addStyle(`
.voteButton {
    display: inline-block;
    width: 1.3em;
    height: 1.3em;
    cursor: pointer;
    margin: 0.2em;
}

div.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
    `);

    // Constants
    // Icons by Font Awesome
    const thumbsUpIcon = '<svg viewBox="0 0 512 512"><path fill="currentColor" d="M128 447.1V223.1c0-17.67-14.33-31.1-32-31.1H32c-17.67 0-32 14.33-32 31.1v223.1c0 17.67 14.33 31.1 32 31.1h64C113.7 479.1 128 465.6 128 447.1zM512 224.1c0-26.5-21.48-47.98-48-47.98h-146.5c22.77-37.91 34.52-80.88 34.52-96.02C352 56.52 333.5 32 302.5 32c-63.13 0-26.36 76.15-108.2 141.6L178 186.6C166.2 196.1 160.2 210 160.1 224c-.0234 .0234 0 0 0 0L160 384c0 15.1 7.113 29.33 19.2 38.39l34.14 25.59C241 468.8 274.7 480 309.3 480H368c26.52 0 48-21.47 48-47.98c0-3.635-.4805-7.143-1.246-10.55C434 415.2 448 397.4 448 376c0-9.148-2.697-17.61-7.139-24.88C463.1 347 480 327.5 480 304.1c0-12.5-4.893-23.78-12.72-32.32C492.2 270.1 512 249.5 512 224.1z"></path></svg>';
    const thumbsDownIcon = '<svg viewBox="0 0 512 512"><path fill="currentColor" d="M96 32.04H32c-17.67 0-32 14.32-32 31.1v223.1c0 17.67 14.33 31.1 32 31.1h64c17.67 0 32-14.33 32-31.1V64.03C128 46.36 113.7 32.04 96 32.04zM467.3 240.2C475.1 231.7 480 220.4 480 207.9c0-23.47-16.87-42.92-39.14-47.09C445.3 153.6 448 145.1 448 135.1c0-21.32-14-39.18-33.25-45.43C415.5 87.12 416 83.61 416 79.98C416 53.47 394.5 32 368 32h-58.69c-34.61 0-68.28 11.22-95.97 31.98L179.2 89.57C167.1 98.63 160 112.9 160 127.1l.1074 160c0 0-.0234-.0234 0 0c.0703 13.99 6.123 27.94 17.91 37.36l16.3 13.03C276.2 403.9 239.4 480 302.5 480c30.96 0 49.47-24.52 49.47-48.11c0-15.15-11.76-58.12-34.52-96.02H464c26.52 0 48-21.47 48-47.98C512 262.5 492.2 241.9 467.3 240.2z"></path></svg>';
    const rotateLeftIcon = '<svg viewBox="0 0 512 512"><path fill="currentColor" d="M480 256c0 123.4-100.5 223.9-223.9 223.9c-48.84 0-95.17-15.58-134.2-44.86c-14.12-10.59-16.97-30.66-6.375-44.81c10.59-14.12 30.62-16.94 44.81-6.375c27.84 20.91 61 31.94 95.88 31.94C344.3 415.8 416 344.1 416 256s-71.69-159.8-159.8-159.8c-37.46 0-73.09 13.49-101.3 36.64l45.12 45.14c17.01 17.02 4.955 46.1-19.1 46.1H35.17C24.58 224.1 16 215.5 16 204.9V59.04c0-24.04 29.07-36.08 46.07-19.07l47.6 47.63C149.9 52.71 201.5 32.11 256.1 32.11C379.5 32.11 480 132.6 480 256z"></path></svg>';

    const VOTE_SEG_OPTIONS = {
        UP: 1,
        DOWN: 0,
        UNDO: 20
    };

    const CATEGORIES = ['sponsor', 'selfpromo', 'interaction', 'intro', 'outro', 'preview', 'music_offtopic', 'filler'];
    
    // Global variables
    let IsLoaded = false;
    let VoteHeaderIndex = -1;
    let CategoryHeaderIndex = -1;

    // Button to set User ID
    const userIDSetButton = document.createElement('button');
    userIDSetButton.classList.add('btn', 'btn-secondary', 'me-2');
    userIDSetButton.innerHTML = "Set UserID";
    userIDSetButton.addEventListener('click', () => {
        const userID = prompt("Enter your private user ID:");

        if (VerifyUserID(userID)) {
            GM_setValue('userID', userID);
            alert('Saved!');
            
            if (!IsLoaded) Main();
        }
        else if (userID) {
            alert("Invalid user ID! Please try again.");
        }
    });
    document.body.querySelector('nav > div').appendChild(userIDSetButton);
    
    if (VerifyUserID(GM_getValue('userID'))) Main();

    function Main() {
        IsLoaded = true;
        
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
    }

    /**
     * Add upvote, downvote and undo vote buttons to segment row
     * @param {HTMLElement} row 
     */
    function AddVotingButtonsToRow(row) {
        const votingContainer = document.createElement('div');

        // Upvote button
        const upvoteButton = document.createElement('div');
        upvoteButton.innerHTML = thumbsUpIcon;
        upvoteButton.classList.add('voteButton');
        upvoteButton.setAttribute('title', 'Upvote this segment');
        upvoteButton.addEventListener('click', () => {
            if (!upvoteButton.classList.contains('disabled') && confirm('Confirm upvoting?')) {
                const segmentId = row.querySelector('textarea[name="UUID"]')?.value;
                upvoteButton.classList.add('disabled');

                SendVoteSegment(segmentId, VOTE_SEG_OPTIONS.UP, () => {
                    upvoteButton.classList.remove('disabled');
                });
            }
        });
        votingContainer.appendChild(upvoteButton);

        // Downvote button
        const downvoteButton = document.createElement('div');
        downvoteButton.innerHTML = thumbsDownIcon;
        downvoteButton.classList.add('voteButton');

        if (row.children[VoteHeaderIndex].textContent.includes('👑')) {
            if (row.querySelector('textarea[name="UserID"]')?.value === GM_getValue('userID')) {
                downvoteButton.setAttribute('title', 'This user is a VIP, be sure to discuss first before downvoting this segment');
            }

            downvoteButton.style.color = '#ffc83d';
        }
        
        if (!downvoteButton.hasAttribute('title')) {
            downvoteButton.setAttribute('title', 'Downvote this segment');
        }

        downvoteButton.addEventListener('click', () => {
            if (!downvoteButton.classList.contains('disabled') && confirm('Confirm downvoting?')) {
                const segmentId = row.querySelector('textarea[name="UUID"]')?.value;
                downvoteButton.classList.add('disabled');

                SendVoteSegment(segmentId, VOTE_SEG_OPTIONS.DOWN, () => {
                    downvoteButton.classList.remove('disabled');
                });
            }
        });
        votingContainer.appendChild(downvoteButton);

        // Undo vote button
        const undovoteButton = document.createElement('div');
        undovoteButton.innerHTML = rotateLeftIcon;
        undovoteButton.classList.add('voteButton');
        undovoteButton.setAttribute('title', 'Undo vote on this segment');
        undovoteButton.addEventListener('click', () => {
            if (!undovoteButton.classList.contains('disabled') && confirm('Confirm undo vote?')) {
                const segmentId = row.querySelector('textarea[name="UUID"]')?.value;
                undovoteButton.classList.add('disabled');

                SendVoteSegment(segmentId, VOTE_SEG_OPTIONS.UNDO, () => {
                    undovoteButton.classList.remove('disabled');
                });
            }
        });
        votingContainer.appendChild(undovoteButton);

        row.children[VoteHeaderIndex].style.minWidth = '6.1em'; // Make room for voting buttons
        row.children[VoteHeaderIndex].appendChild(votingContainer);
    }

    /**
     * Add category change button to segment row
     * @param {HTMLElement} row 
     */
    function AddCategoryChangeButtonToRow(row) {
        const categoryChangeButton = document.createElement('button');
        categoryChangeButton.classList.add('btn', 'btn-secondary', 'btn-sm', 'mt-1');
        categoryChangeButton.setAttribute('title', "Change this segment's category");
        categoryChangeButton.innerHTML = '✏';
        categoryChangeButton.addEventListener('click', () => {
            categoryChangeButton.classList.add('disabled');

            const segmentId = row.querySelector('textarea[name="UUID"]')?.value;
            const category = CATEGORIES.find(c => row.children[CategoryHeaderIndex].textContent.includes(c));

            ShowCategoryChangeModal(segmentId, category, () => {
                categoryChangeButton.classList.remove('disabled');
            });
        });

        row.children[CategoryHeaderIndex].appendChild(document.createElement('br'));
        row.children[CategoryHeaderIndex].appendChild(categoryChangeButton);
    }

    /**
     * Show a modal with a list of categories to choose from and a button to save the category
     * @param {string} segmentId UUID of the segment
     * @param {string} category current category of the segment
     * @param {Function|undefined} onClosed function to call when the modal is closed
     */
    function ShowCategoryChangeModal(segmentId, category, onClosed) {
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.classList.add('modal-backdrop', 'show');
        document.body.appendChild(backdrop);

        // Create the modal
        const modal = document.createElement('div');
        modal.classList.add('modal', 'd-block');

        modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Change category</h5>
                <button type="button" action="close" class="btn-close" title="Close"></button>
            </div>
            <div class="modal-body">
            Select a new category:
            </div>
            <div class="modal-footer">
                <button type="button" action="close" class="btn btn-secondary">Close</button>
                <button type="button" action="save" class="btn btn-primary">Save changes</button>
            </div>
            </div>
        </div>
        `;

        // Add categories to modal
        const modalBody = modal.querySelector('.modal-body');
        const categorySelectElm = document.createElement('select');

        CATEGORIES.forEach(c => {
            const option = document.createElement('option');
            option.value = c;
            option.text = c;

            if (category === c) {
                option.selected = true;
                option.disabled = true;
            }

            categorySelectElm.appendChild(option);
        });

        modalBody.appendChild(categorySelectElm);

        // Assign functionality to close buttons
        modal.querySelectorAll('button[action="close"]').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });

        modal.querySelector('button[action="save"]').addEventListener('click', () => {
            if (confirm(`Confirm changing category from "${category}" to "${categorySelectElm.value}"?`)) {
                SendCategoryUpdate(segmentId, categorySelectElm.value, closeModal);
            }
        });
        
        // Close modal if backdrop is clicked
        modal.addEventListener('click', (event) => {
            event.stopPropagation();
            if (event.target === event.currentTarget) closeModal();
        });

        function closeModal() {
            modal.remove();
            backdrop.remove();
            if (onClosed) onClosed();
        }

        document.body.appendChild(modal);
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
            alert(`Invalid segment ID: "${uuid}"`);

            if (onFinish) onFinish();
        }
        else if (Object.values(VOTE_SEG_OPTIONS).indexOf(voteID) === -1) {
            alert('Invalid vote ID: ' + voteID);

            if (onFinish) onFinish();
        }
        else if (!VerifyUserID(userID)) {
            alert(`Invalid user ID: "${userID}"`);

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
                            alert('Vote is rejected\n\n' + response.response.message);
                            break;
                        case 400:
                            alert('Failed to vote on the segment. Please check the segment info and your User ID\n\n' +
                                'UUID: ' + uuid + '\n' +
                                'Type: ' + voteID);
                            break;
                        default:
                            alert('Voted!');
                            break;
                    }

                    if (onFinish) onFinish();
                },
                onerror: function () {
                    alert('Failed to send the request, something might be wrong with the server or your internet is 💩.');

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
            alert(`Invalid segment ID: "${uuid}"`);

            if (onFinish) onFinish();
        }
        else if (CATEGORIES.indexOf(category) === -1) {
            alert(`Invalid category name: "${category}"`);

            if (onFinish) onFinish();
        }
        else if (!VerifyUserID(userID)) {
            alert(`Invalid user ID: "${userID}"`);

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
                            alert('Update is rejected\n\n' + response.response.message);
                            break;
                        case 400:
                            alert('Failed to update the category. Please check the segment info and your User ID\n\n' +
                                'UUID: ' + uuid + '\n' +
                                'Category: ' + category);
                            break;
                        default:
                            alert('Updated!');
                            break;
                    }

                    if (onFinish) onFinish();
                },
                onerror: function () {
                    alert('Failed to send the request, something might be wrong with the server or your internet is 💩.');

                    if (onFinish) onFinish();
                }
            });
        }
    }

    function VerifyUUID(uuid) {
        return /[A-Z0-9]{64}/i.test(uuid);
    }

    function VerifyUserID(userID) {
        return /[A-Z0-9]{36}/i.test(userID);
    }
})();