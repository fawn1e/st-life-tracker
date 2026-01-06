// ═══════════════════════════════════════════════════════════════
//  LIFE TRACKER v2.1 - Popup Over Button
// ═══════════════════════════════════════════════════════════════

import { getContext, extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "life-tracker";

// ═══════════════════════════════════════════════════════════════
//  BABY SIZE
// ═══════════════════════════════════════════════════════════════

const BABY_SIZES = {
    4: "Poppy seed", 5: "Sesame seed", 6: "Lentil", 7: "Blueberry",
    8: "Raspberry", 9: "Cherry", 10: "Strawberry", 11: "Lime",
    12: "Plum", 13: "Lemon", 14: "Nectarine", 15: "Orange",
    16: "Avocado", 17: "Pear", 18: "Bell pepper", 19: "Mango",
    20: "Banana", 21: "Pomegranate", 22: "Papaya", 23: "Grapefruit",
    24: "Cantaloupe", 25: "Cauliflower", 26: "Lettuce", 27: "Cabbage",
    28: "Eggplant", 29: "Squash", 30: "Coconut", 31: "Pineapple",
    32: "Jicama", 33: "Honeydew", 34: "Cantaloupe", 35: "Coconut",
    36: "Honeydew", 37: "Winter melon", 38: "Pumpkin", 39: "Watermelon",
    40: "Pumpkin"
};

// ═══════════════════════════════════════════════════════════════
//  HTML TEMPLATES
// ═══════════════════════════════════════════════════════════════

const TEMPLATES = {
    conception: (data) => `
<div style="background:transparent;color:var(--SmartThemeBodyColor);font-family:'Courier New',monospace;font-size:0.85em;padding:5px;margin-top:-15px;margin-bottom:20px;text-align:center;letter-spacing:1px;opacity:0.9;border-bottom:1px dashed var(--SmartThemeBorderColor);">
<span style="opacity:0.7;"><i class="fa-solid fa-dice"></i> ROLL:</span>
<span style="color:var(--SmartThemeQuoteColor);font-weight:bold;">${data.roll}/100</span>
<span style="margin:0 8px;color:var(--SmartThemeBorderColor);">|</span>
<span style="opacity:0.7;"><i class="fa-solid fa-baby"></i> CONCEPTION:</span>
<span style="color:var(--SmartThemeQuoteColor);font-weight:bold;">${data.success ? 'Yes' : 'No'}</span>
<span style="margin:0 8px;color:var(--SmartThemeBorderColor);">|</span>
<span style="color:var(--SmartThemeQuoteColor);font-weight:bold;"><i class="fa-regular fa-calendar-check"></i> DUE: ${data.dueDate}</span>
</div>`,

    pregnancy: (data) => `
<div style="background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:6px;padding:10px;margin-top:5px;margin-bottom:20px;font-family:'Courier New',monospace;font-size:0.85em;line-height:1.5;color:var(--SmartThemeBodyColor);">
<div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:4px;padding-bottom:4px;font-weight:bold;color:var(--SmartThemeQuoteColor);text-transform:uppercase;letter-spacing:1px;">
<i class="fa-solid fa-person-pregnant"></i> Pregnancy Status</div>
<div style="font-size:0.75em;text-transform:uppercase;margin-bottom:8px;color:var(--SmartThemeQuoteColor);opacity:0.8;">
<i class="fa-solid fa-eye${data.disclosed ? '' : '-slash'}"></i> Knowledge: <span style="font-weight:bold;">${data.disclosed ? 'DISCLOSED' : 'HIDDEN'}</span></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
<div><span style="opacity:0.7;"><i class="fa-regular fa-clock"></i> Week:</span> <strong style="color:var(--SmartThemeQuoteColor);">${data.week}</strong></div>
<div><span style="opacity:0.7;"><i class="fa-solid fa-apple-whole"></i> Size:</span> <strong style="color:var(--SmartThemeQuoteColor);">${data.size}</strong></div>
<div><span style="opacity:0.7;"><i class="fa-regular fa-calendar-check"></i> Due:</span> <strong style="color:var(--SmartThemeQuoteColor);">${data.dueDate}</strong></div>
<div><span style="opacity:0.7;"><i class="fa-solid fa-venus-mars"></i> Gender:</span> <strong style="color:var(--SmartThemeQuoteColor);">${data.gender}</strong></div>
</div>
<div style="margin-top:8px;border-top:1px dotted var(--SmartThemeBorderColor);padding-top:5px;">
<div style="margin-bottom:4px;"><span style="color:var(--SmartThemeQuoteColor);"><i class="fa-solid fa-head-side-virus"></i> Symptoms:</span> <span style="opacity:0.9;">${data.symptoms}</span></div>
<div style="margin-bottom:4px;"><span style="color:var(--SmartThemeQuoteColor);"><i class="fa-solid fa-user-doctor"></i> Next Visit:</span> <span style="opacity:0.9;">${data.nextVisit}</span></div>
<div><span style="color:#e76f51;"><i class="fa-solid fa-triangle-exclamation"></i> Risks:</span> <span style="opacity:0.9;font-style:italic;">${data.risks}</span></div>
</div></div>`,

    birth: (data) => `
<div style="background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;padding:12px;margin-top:5px;margin-bottom:20px;font-family:'Courier New',monospace;font-size:0.85em;line-height:1.5;color:var(--SmartThemeBodyColor);border-left:4px solid var(--SmartThemeQuoteColor);">
<div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:6px;padding-bottom:4px;font-weight:bold;color:var(--SmartThemeQuoteColor);text-transform:uppercase;letter-spacing:1.5px;display:flex;justify-content:space-between;">
<span><i class="fa-solid fa-baby-carriage"></i> Birth Report</span>
<span style="font-size:0.8em;opacity:0.7;">${data.timestamp}</span></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
<div><span style="opacity:0.7;"><i class="fa-solid fa-venus-mars"></i> Gender:</span> <strong style="color:var(--SmartThemeQuoteColor);">${data.gender}</strong></div>
<div><span style="opacity:0.7;"><i class="fa-solid fa-circle-check"></i> US:</span> <strong style="color:var(--SmartThemeQuoteColor);">${data.usAccuracy}</strong></div>
<div><span style="opacity:0.7;"><i class="fa-solid fa-weight-scale"></i> Weight:</span> <strong style="color:var(--SmartThemeQuoteColor);">${data.weight} kg</strong></div>
<div><span style="opacity:0.7;"><i class="fa-solid fa-ruler-vertical"></i> Height:</span> <strong style="color:var(--SmartThemeQuoteColor);">${data.height} cm</strong></div>
</div>
<div style="margin-top:10px;border-top:1px solid var(--SmartThemeBorderColor);padding-top:8px;">
<div style="margin-bottom:4px;"><span style="color:var(--SmartThemeQuoteColor);font-weight:bold;"><i class="fa-solid fa-dna"></i> Genetics:</span></div>
<div style="font-size:0.9em;padding-left:10px;border-left:2px solid var(--SmartThemeBorderColor);margin-bottom:8px;">
<span style="opacity:0.8;">Dominance:</span> <strong>${data.dominance}</strong><br>
<span style="opacity:0.8;">Features:</span> ${data.features}<br>
<span style="opacity:0.8;">Temperament:</span> ${data.temperament}</div></div>
<div style="margin-top:8px;background:rgba(0,0,0,0.15);padding:8px;border-radius:4px;">
<div style="margin-bottom:4px;"><span style="color:#2a9d8f;"><i class="fa-solid fa-heart-pulse"></i> Health:</span> <span style="font-weight:bold;opacity:0.9;">${data.health}</span></div>
<div><span style="color:#e76f51;"><i class="fa-solid fa-microscope"></i> Pathology:</span> <span style="opacity:0.9;font-style:italic;">${data.pathology}</span></div>
</div></div>`,

    babyCare: (data) => `
<div style="background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:6px;padding:10px;margin-top:5px;margin-bottom:20px;font-family:'Courier New',monospace;font-size:0.85em;line-height:1.5;color:var(--SmartThemeBodyColor);">
<div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:4px;padding-bottom:4px;font-weight:bold;color:var(--SmartThemeQuoteColor);text-transform:uppercase;letter-spacing:1px;">
<i class="fa-solid fa-baby"></i> Baby Care</div>
<div style="font-size:0.75em;text-transform:uppercase;margin-bottom:8px;color:var(--SmartThemeQuoteColor);opacity:0.8;">
<i class="fa-solid fa-id-card"></i> ${data.name} | ${data.age}</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
<div><span style="opacity:0.7;"><i class="fa-solid fa-utensils"></i> Hunger:</span> <strong style="color:var(--SmartThemeQuoteColor);">${data.hunger}</strong></div>
<div><span style="opacity:0.7;"><i class="fa-solid fa-soap"></i> Hygiene:</span> <strong style="color:var(--SmartThemeQuoteColor);">${data.hygiene}</strong></div>
<div><span style="opacity:0.7;"><i class="fa-solid fa-bed"></i> Energy:</span> <strong style="color:var(--SmartThemeQuoteColor);">${data.energy}</strong></div>
<div><span style="opacity:0.7;"><i class="fa-solid fa-face-smile"></i> Mood:</span> <strong style="color:var(--SmartThemeQuoteColor);">${data.mood}</strong></div>
</div>
<div style="margin-top:8px;border-top:1px dotted var(--SmartThemeBorderColor);padding-top:5px;">
<div style="margin-bottom:4px;"><span style="color:var(--SmartThemeQuoteColor);"><i class="fa-solid fa-dna"></i> Traits:</span> <span style="opacity:0.9;">${data.traits}</span></div>
<div style="margin-bottom:4px;"><span style="color:var(--SmartThemeQuoteColor);"><i class="fa-solid fa-star"></i> Milestone:</span> <span style="opacity:0.9;">${data.milestone}</span></div>
<div style="margin-bottom:4px;"><span style="color:var(--SmartThemeQuoteColor);"><i class="fa-solid fa-user-doctor"></i> Medical:</span> <span style="opacity:0.9;">${data.medical}</span></div>
<div style="background:rgba(231,111,81,0.1);padding:3px;border-radius:3px;margin-top:5px;">
<span style="color:#e76f51;"><i class="fa-solid fa-circle-exclamation"></i></span> <span style="opacity:0.9;font-style:italic;">${data.immediateNeed}</span></div>
</div></div>`
};

// ═══════════════════════════════════════════════════════════════
//  SETTINGS FORMS
// ═══════════════════════════════════════════════════════════════

const SETTINGS_HTML = {
    conception: () => `
        <div class="lt-settings-header">
            <span class="lt-settings-title"><i class="fa-solid fa-dice"></i> Conception Roll</span>
            <button class="lt-back-btn" id="lt-back"><i class="fa-solid fa-arrow-left"></i> Back</button>
        </div>
        <div class="lt-row">
            <div class="lt-field">
                <label>Base Chance (%)</label>
                <input type="number" id="lt-c-chance" value="25" min="1" max="100">
            </div>
            <div class="lt-field">
                <label>Manual Roll</label>
                <input type="number" id="lt-c-manual" placeholder="Auto" min="1" max="100">
            </div>
        </div>
        <div class="lt-field">
            <label>Story Date</label>
            <input type="date" id="lt-c-date" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="lt-actions">
            <button class="lt-btn lt-btn-secondary" id="lt-cancel"><i class="fa-solid fa-xmark"></i> Cancel</button>
            <button class="lt-btn lt-btn-primary" id="lt-c-roll"><i class="fa-solid fa-dice"></i> Roll</button>
        </div>`,

    pregnancy: (saved) => `
        <div class="lt-settings-header">
            <span class="lt-settings-title"><i class="fa-solid fa-person-pregnant"></i> Pregnancy</span>
            <button class="lt-back-btn" id="lt-back"><i class="fa-solid fa-arrow-left"></i> Back</button>
        </div>
        <div class="lt-row">
            <div class="lt-field">
                <label>Week</label>
                <input type="number" id="lt-p-week" value="${saved?.week || 8}" min="1" max="42">
            </div>
            <div class="lt-field">
                <label>Due Date</label>
                <input type="date" id="lt-p-due" value="${saved?.rawDue || ''}">
            </div>
        </div>
        <div class="lt-row">
            <div class="lt-field">
                <label>Knowledge</label>
                <select id="lt-p-disclosed">
                    <option value="false">Hidden</option>
                    <option value="true" ${saved?.disclosed ? 'selected' : ''}>Disclosed</option>
                </select>
            </div>
            <div class="lt-field">
                <label>Gender</label>
                <select id="lt-p-gender">
                    <option value="Unknown">Unknown</option>
                    <option value="Boy">Boy</option>
                    <option value="Girl">Girl</option>
                    <option value="Twins">Twins</option>
                </select>
            </div>
        </div>
        <div class="lt-field">
            <label>Symptoms</label>
            <input type="text" id="lt-p-symptoms" placeholder="Fatigue, Nausea..." value="${saved?.symptoms || ''}">
        </div>
        <div class="lt-row">
            <div class="lt-field">
                <label>Next Visit</label>
                <input type="text" id="lt-p-visit" value="${saved?.nextVisit || ''}">
            </div>
            <div class="lt-field">
                <label>Risks</label>
                <input type="text" id="lt-p-risks" placeholder="Stable" value="${saved?.risks || ''}">
            </div>
        </div>
        <div class="lt-actions">
            <button class="lt-btn lt-btn-secondary" id="lt-cancel"><i class="fa-solid fa-xmark"></i> Cancel</button>
            <button class="lt-btn lt-btn-primary" id="lt-p-insert"><i class="fa-solid fa-paste"></i> Insert</button>
        </div>`,

    birth: (saved) => `
        <div class="lt-settings-header">
            <span class="lt-settings-title"><i class="fa-solid fa-baby-carriage"></i> Birth Report</span>
            <button class="lt-back-btn" id="lt-back"><i class="fa-solid fa-arrow-left"></i> Back</button>
        </div>
        <div class="lt-row">
            <div class="lt-field">
                <label>Gender</label>
                <select id="lt-b-gender">
                    <option value="Girl">Girl</option>
                    <option value="Boy">Boy</option>
                    <option value="Twins">Twins</option>
                </select>
            </div>
            <div class="lt-field">
                <label>Ultrasound</label>
                <select id="lt-b-accuracy">
                    <option value="Confirmed">Confirmed</option>
                    <option value="Missed">Missed</option>
                </select>
            </div>
        </div>
        <div class="lt-row">
            <div class="lt-field">
                <label>Weight (kg)</label>
                <input type="number" id="lt-b-weight" value="3.2" step="0.1" min="1" max="6">
            </div>
            <div class="lt-field">
                <label>Height (cm)</label>
                <input type="number" id="lt-b-height" value="50" min="30" max="60">
            </div>
        </div>
        <div class="lt-field">
            <label>Dominance</label>
            <input type="text" id="lt-b-dominance" placeholder="Mother (60%)">
        </div>
        <div class="lt-field">
            <label>Features</label>
            <input type="text" id="lt-b-features" placeholder="Mother's eyes...">
        </div>
        <div class="lt-field">
            <label>Temperament</label>
            <input type="text" id="lt-b-temperament" placeholder="Calm, Curious...">
        </div>
        <div class="lt-row">
            <div class="lt-field">
                <label>Health</label>
                <select id="lt-b-health">
                    <option value="Excellent">Excellent</option>
                    <option value="Stable">Stable</option>
                    <option value="Under Observation">Under Obs</option>
                    <option value="Critical">Critical</option>
                </select>
            </div>
            <div class="lt-field">
                <label>Pathology</label>
                <input type="text" id="lt-b-pathology" placeholder="None">
            </div>
        </div>
        <div class="lt-actions">
            <button class="lt-btn lt-btn-secondary" id="lt-cancel"><i class="fa-solid fa-xmark"></i> Cancel</button>
            <button class="lt-btn lt-btn-primary" id="lt-b-insert"><i class="fa-solid fa-paste"></i> Insert</button>
        </div>`,

    babyCare: (saved) => `
        <div class="lt-settings-header">
            <span class="lt-settings-title"><i class="fa-solid fa-baby"></i> Baby Care</span>
            <button class="lt-back-btn" id="lt-back"><i class="fa-solid fa-arrow-left"></i> Back</button>
        </div>
        <div class="lt-row">
            <div class="lt-field">
                <label>Name</label>
                <input type="text" id="lt-bc-name" value="${saved?.name || ''}">
            </div>
            <div class="lt-field">
                <label>Age</label>
                <input type="text" id="lt-bc-age" placeholder="2 weeks" value="${saved?.age || ''}">
            </div>
        </div>
        <div class="lt-row">
            <div class="lt-field">
                <label>Hunger</label>
                <select id="lt-bc-hunger">
                    <option value="Full">Full</option>
                    <option value="Satisfied">Satisfied</option>
                    <option value="Hungry">Hungry</option>
                    <option value="Starving">Starving</option>
                </select>
            </div>
            <div class="lt-field">
                <label>Hygiene</label>
                <select id="lt-bc-hygiene">
                    <option value="Clean">Clean</option>
                    <option value="Needs Change">Needs Change</option>
                    <option value="Soiled">Soiled</option>
                </select>
            </div>
        </div>
        <div class="lt-row">
            <div class="lt-field">
                <label>Energy</label>
                <select id="lt-bc-energy">
                    <option value="Rested">Rested</option>
                    <option value="Awake">Awake</option>
                    <option value="Tired">Tired</option>
                    <option value="Exhausted">Exhausted</option>
                </select>
            </div>
            <div class="lt-field">
                <label>Mood</label>
                <select id="lt-bc-mood">
                    <option value="Content">Content</option>
                    <option value="Happy">Happy</option>
                    <option value="Fussy">Fussy</option>
                    <option value="Crying">Crying</option>
                </select>
            </div>
        </div>
        <div class="lt-field">
            <label>Traits</label>
            <input type="text" id="lt-bc-traits" value="${saved?.traits || ''}">
        </div>
        <div class="lt-field">
            <label>Next Milestone</label>
            <input type="text" id="lt-bc-milestone" value="${saved?.milestone || ''}">
        </div>
        <div class="lt-field">
            <label>Medical</label>
            <input type="text" id="lt-bc-medical" value="${saved?.medical || ''}">
        </div>
        <div class="lt-field">
            <label>Immediate Need</label>
            <input type="text" id="lt-bc-need" value="${saved?.immediateNeed || ''}">
        </div>
        <div class="lt-actions">
            <button class="lt-btn lt-btn-secondary" id="lt-cancel"><i class="fa-solid fa-xmark"></i> Cancel</button>
            <button class="lt-btn lt-btn-primary" id="lt-bc-insert"><i class="fa-solid fa-paste"></i> Insert</button>
        </div>`
};

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

function getCurrentChatId() {
    const context = getContext();
    return context.chatId || 'default';
}

function getChatData(type) {
    const chatId = getCurrentChatId();
    const settings = extension_settings[extensionName] || {};
    return settings.chatData?.[chatId]?.[type] || null;
}

function saveChatData(type, data) {
    const chatId = getCurrentChatId();
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = { chatData: {} };
    }
    if (!extension_settings[extensionName].chatData) {
        extension_settings[extensionName].chatData = {};
    }
    if (!extension_settings[extensionName].chatData[chatId]) {
        extension_settings[extensionName].chatData[chatId] = {};
    }
    extension_settings[extensionName].chatData[chatId][type] = data;
    saveSettingsDebounced();
}

function formatDate(date) {
    if (!date) return 'TBD';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
}

function calculateDueDate(conceptionDate) {
    const date = new Date(conceptionDate);
    date.setDate(date.getDate() + 280);
    return date;
}

function insertToTextarea(text) {
    const textarea = document.getElementById('send_textarea');
    if (textarea) {
        const start = textarea.selectionStart;
        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(textarea.selectionEnd);
        textarea.value = before + text + after;
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

// ═══════════════════════════════════════════════════════════════
//  UI FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function closePopup() {
    $('#lt-popup').removeClass('open');
    $('#life-tracker-button').removeClass('active');
    showMenu();
}

function togglePopup() {
    const $popup = $('#lt-popup');
    if ($popup.hasClass('open')) {
        closePopup();
    } else {
        $popup.addClass('open');
        $('#life-tracker-button').addClass('active');
    }
}

function showMenu() {
    $('#lt-menu').show();
    $('#lt-settings').removeClass('open').empty();
}

function showSettings(type) {
    $('#lt-menu').hide();
    const saved = getChatData(type);
    const html = SETTINGS_HTML[type](saved);
    $('#lt-settings').html(html).addClass('open');
    bindSettingsEvents(type);
}

function bindSettingsEvents(type) {
    $('#lt-back').on('click', showMenu);
    $('#lt-cancel').on('click', closePopup);

    switch (type) {
        case 'conception':
            $('#lt-c-roll').on('click', () => {
                const chance = parseInt($('#lt-c-chance').val()) || 25;
                const manual = $('#lt-c-manual').val();
                const roll = manual ? parseInt(manual) : Math.floor(Math.random() * 100) + 1;
                const success = roll <= chance;
                const storyDate = $('#lt-c-date').val() || new Date().toISOString().split('T')[0];
                const dueDate = success ? formatDate(calculateDueDate(storyDate)) : 'N/A';
                const data = { roll, success, dueDate, conceptionDate: storyDate };
                saveChatData('conception', data);
                insertToTextarea(TEMPLATES.conception(data));
                closePopup();
            });
            break;

        case 'pregnancy':
            $('#lt-p-insert').on('click', () => {
                const week = parseInt($('#lt-p-week').val()) || 8;
                const rawDue = $('#lt-p-due').val();
                const data = {
                    week,
                    size: BABY_SIZES[week] || 'Baby',
                    dueDate: formatDate(rawDue),
                    rawDue,
                    disclosed: $('#lt-p-disclosed').val() === 'true',
                    gender: $('#lt-p-gender').val(),
                    symptoms: $('#lt-p-symptoms').val() || 'None',
                    nextVisit: $('#lt-p-visit').val() || 'TBD',
                    risks: $('#lt-p-risks').val() || 'Stable'
                };
                saveChatData('pregnancy', data);
                insertToTextarea(TEMPLATES.pregnancy(data));
                closePopup();
            });
            break;

        case 'birth':
            $('#lt-b-insert').on('click', () => {
                const data = {
                    gender: $('#lt-b-gender').val(),
                    usAccuracy: $('#lt-b-accuracy').val(),
                    weight: $('#lt-b-weight').val(),
                    height: $('#lt-b-height').val(),
                    dominance: $('#lt-b-dominance').val() || 'Mother (60%)',
                    features: $('#lt-b-features').val() || "Mother's eyes, Father's hair",
                    temperament: $('#lt-b-temperament').val() || 'Calm, Curious',
                    health: $('#lt-b-health').val(),
                    pathology: $('#lt-b-pathology').val() || 'None',
                    timestamp: new Date().toLocaleDateString()
                };
                saveChatData('birth', data);
                insertToTextarea(TEMPLATES.birth(data));
                closePopup();
            });
            break;

        case 'babyCare':
            $('#lt-bc-insert').on('click', () => {
                const data = {
                    name: $('#lt-bc-name').val() || 'Unnamed',
                    age: $('#lt-bc-age').val() || '0 weeks',
                    hunger: $('#lt-bc-hunger').val(),
                    hygiene: $('#lt-bc-hygiene').val(),
                    energy: $('#lt-bc-energy').val(),
                    mood: $('#lt-bc-mood').val(),
                    traits: $('#lt-bc-traits').val() || 'Calm',
                    milestone: $('#lt-bc-milestone').val() || 'Smiling',
                    medical: $('#lt-bc-medical').val() || 'TBD',
                    immediateNeed: $('#lt-bc-need').val() || 'None'
                };
                saveChatData('babyCare', data);
                insertToTextarea(TEMPLATES.babyCare(data));
                closePopup();
            });
            break;
    }
}

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════

jQuery(async () => {
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = { chatData: {} };
    }

    // Create wrapper with button and popup
    const wrapperHtml = `
    <div id="lt-wrapper">
        <div id="life-tracker-button" class="fa-solid fa-heart-pulse" title="Life Tracker"></div>
        <div id="lt-popup">
            <div class="lt-header">
                <h3><i class="fa-solid fa-heart-pulse"></i> Life Tracker</h3>
                <button class="lt-close-btn" id="lt-close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="lt-menu" id="lt-menu">
                <button class="lt-menu-item" data-type="conception">
                    <i class="fa-solid fa-dice"></i> Conception Roll
                </button>
                <button class="lt-menu-item" data-type="pregnancy">
                    <i class="fa-solid fa-person-pregnant"></i> Pregnancy Tracker
                </button>
                <button class="lt-menu-item" data-type="birth">
                    <i class="fa-solid fa-baby-carriage"></i> Birth Report
                </button>
                <button class="lt-menu-item" data-type="babyCare">
                    <i class="fa-solid fa-baby"></i> Baby Care
                </button>
            </div>
            <div class="lt-settings" id="lt-settings"></div>
        </div>
    </div>`;

    $('#leftSendForm').prepend(wrapperHtml);

    // Events
    $('#life-tracker-button').on('click', (e) => {
        e.stopPropagation();
        togglePopup();
    });

    $('#lt-close').on('click', closePopup);

    $('.lt-menu-item').on('click', function() {
        showSettings($(this).data('type'));
    });

    $(document).on('click', (e) => {
        if (!$(e.target).closest('#lt-wrapper').length) {
            closePopup();
        }
    });

    $(document).on('keydown', (e) => {
        if (e.key === 'Escape') closePopup();
    });

    console.log('[Life Tracker] Ready');
});
