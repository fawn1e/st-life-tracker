/* ═══════════════════════════════════════════════════════════════
   FAWN'S LIFE TRACKER - Main Extension Script
   Version: 1.0.0
   ═══════════════════════════════════════════════════════════════ */

console.log("Fawn's Life Tracker: Initializing...");

import { extension_settings, getContext } from "../../../extensions.js";
import { eventSource, event_types } from "../../../../script.js";

const extensionName = "fawns-life-tracker";

// Default settings
const defaultSettings = {
    enabled: true
};

// Initialize settings
if (!extension_settings[extensionName]) {
    extension_settings[extensionName] = { ...defaultSettings };
}

// Tracker templates configuration
const TRACKERS = {
    conception: {
        id: 'conception',
        name: 'Conception Roll',
        icon: 'fa-solid fa-dice',
        description: 'Pregnancy chance calculation',
        fields: [
            { id: 'roll', label: 'Roll Result (1-100)', type: 'number', min: 1, max: 100, default: '' },
            { id: 'conception', label: 'Conception Result', type: 'select', options: ['Yes', 'No'], default: 'No' },
            { id: 'dueDate', label: 'Due Date', type: 'date', default: '' }
        ]
    },
    pregnancy: {
        id: 'pregnancy',
        name: 'Pregnancy Tracker',
        icon: 'fa-solid fa-person-pregnant',
        description: 'Track pregnancy progress & symptoms',
        fields: [
            { id: 'knowledge', label: 'Knowledge Status', type: 'select', options: ['Hidden', 'Disclosed'], default: 'Hidden' },
            { id: 'week', label: 'Current Week', type: 'number', min: 1, max: 42, default: '' },
            { id: 'size', label: 'Baby Size (fruit comparison)', type: 'text', default: '' },
            { id: 'dueDate', label: 'Due Date', type: 'date', default: '' },
            { id: 'gender', label: 'Gender', type: 'select', options: ['Unknown', 'Boy', 'Girl', 'Twins'], default: 'Unknown' },
            { id: 'symptoms', label: 'Current Symptoms', type: 'textarea', default: '' },
            { id: 'nextVisit', label: 'Next Checkup', type: 'text', default: '' },
            { id: 'risks', label: 'Risks/Concerns', type: 'text', default: 'Stable' }
        ]
    },
    birth: {
        id: 'birth',
        name: 'Birth Report',
        icon: 'fa-solid fa-baby-carriage',
        description: 'Newborn stats & genetics',
        fields: [
            { id: 'gender', label: 'Gender', type: 'select', options: ['Boy', 'Girl', 'Twins (Boys)', 'Twins (Girls)', 'Twins (Mixed)'], default: 'Boy' },
            { id: 'usAccuracy', label: 'Ultrasound Accuracy', type: 'select', options: ['Confirmed', 'Missed (Surprise!)'], default: 'Confirmed' },
            { id: 'weight', label: 'Weight (kg)', type: 'text', default: '' },
            { id: 'height', label: 'Height (cm)', type: 'text', default: '' },
            { id: 'dominance', label: 'Genetic Dominance', type: 'text', default: '' },
            { id: 'features', label: 'Physical Features', type: 'textarea', default: '' },
            { id: 'temperament', label: 'Temperament Traits', type: 'text', default: '' },
            { id: 'health', label: 'Vital Health', type: 'select', options: ['Stable', 'Under Observation', 'Critical'], default: 'Stable' },
            { id: 'pathology', label: 'Pathology/Defects', type: 'text', default: 'None Detected' }
        ]
    },
    babyCare: {
        id: 'babyCare',
        name: 'Baby Care Monitor',
        icon: 'fa-solid fa-baby',
        description: 'Track baby needs & development',
        fields: [
            { id: 'name', label: 'Baby Name', type: 'text', default: '' },
            { id: 'age', label: 'Age', type: 'text', default: '' },
            { id: 'hunger', label: 'Hunger', type: 'select', options: ['Full', 'Satisfied', 'Hungry', 'Starving'], default: 'Full' },
            { id: 'hygiene', label: 'Hygiene', type: 'select', options: ['Clean', 'Needs Change', 'Soiled'], default: 'Clean' },
            { id: 'energy', label: 'Energy', type: 'select', options: ['Rested', 'Active', 'Tired', 'Exhausted'], default: 'Rested' },
            { id: 'mood', label: 'Mood', type: 'select', options: ['Happy', 'Content', 'Fussy', 'Crying', 'Sleeping'], default: 'Content' },
            { id: 'traits', label: 'Personality Traits', type: 'text', default: '' },
            { id: 'milestone', label: 'Next Milestone', type: 'text', default: '' },
            { id: 'medical', label: 'Next Medical Visit', type: 'text', default: '' },
            { id: 'immediateNeed', label: 'Immediate Need', type: 'text', default: 'None' }
        ]
    }
};

// Chat-specific data storage
let chatTrackerData = {};
let undoHistory = [];

/* ═══════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */

function getCurrentChatId() {
    try {
        const context = getContext();
        if (context && context.chatId) {
            return context.chatId.toString();
        }
        return 'global';
    } catch (e) {
        console.warn('FLT: Could not get chat ID:', e);
        return 'global';
    }
}

function loadChatData() {
    try {
        const chatId = getCurrentChatId();
        const key = `flt_data_${chatId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            chatTrackerData = JSON.parse(saved);
            console.log('FLT: Loaded data for chat', chatId);
        } else {
            chatTrackerData = {};
        }
    } catch (e) {
        console.warn('FLT: Could not load chat data:', e);
        chatTrackerData = {};
    }
}

function saveChatData() {
    try {
        const chatId = getCurrentChatId();
        const key = `flt_data_${chatId}`;
        localStorage.setItem(key, JSON.stringify(chatTrackerData));
        console.log('FLT: Saved data for chat', chatId);
    } catch (e) {
        console.warn('FLT: Could not save chat data:', e);
    }
}

function formatDate(dateString) {
    if (!dateString) return '[Date]';
    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateString;
    }
}

function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.flt-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `flt-toast ${type}`;
    toast.innerHTML = `
        <i class="fa-solid fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* ═══════════════════════════════════════════════════════════════
   POPUP FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */

function closePopup() {
    const popup = document.getElementById("flt-popup");
    if (popup) popup.remove();
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
}

function createPopup(content, width = "500px") {
    closePopup();

    const popup = document.createElement("div");
    popup.id = "flt-popup";

    const isMobile = window.innerWidth <= 768;
    const maxWidth = isMobile ? "calc(100vw - 40px)" : `min(${width}, 90vw)`;

    popup.innerHTML = `
        <div id="flt-popup-bg" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 99998;
            touch-action: pan-y;
        "></div>
        <div id="flt-popup-content" style="
            position: fixed;
            top: ${isMobile ? '20px' : '50%'};
            left: 50%;
            transform: ${isMobile ? 'translateX(-50%)' : 'translate(-50%, -50%)'};
            width: ${maxWidth};
            max-height: ${isMobile ? 'calc(100vh - 40px)' : '80vh'};
            background: var(--SmartThemeBlurTintColor);
            border: 1px solid var(--SmartThemeBorderColor);
            border-radius: 12px;
            padding: ${isMobile ? '20px 16px' : '20px'};
            z-index: 99999;
            box-sizing: border-box;
            overflow-y: auto;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        ">
            ${content}
        </div>
    `;

    document.body.appendChild(popup);
    document.body.style.overflow = 'hidden';

    if (isMobile) {
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
    }

    document.getElementById("flt-popup-bg").addEventListener("click", closePopup);

    const closeOnEsc = function(e) {
        if (e.key === 'Escape') {
            closePopup();
            document.removeEventListener('keydown', closeOnEsc);
        }
    };
    document.addEventListener('keydown', closeOnEsc);

    return popup;
}

/* ═══════════════════════════════════════════════════════════════
   TRACKER HTML GENERATORS
   ═══════════════════════════════════════════════════════════════ */

function generateTrackerHTML(trackerId, data) {
    switch (trackerId) {
        case 'conception':
            return generateConceptionHTML(data);
        case 'pregnancy':
            return generatePregnancyHTML(data);
        case 'birth':
            return generateBirthHTML(data);
        case 'babyCare':
            return generateBabyCareHTML(data);
        default:
            return '<p>Unknown tracker type</p>';
    }
}

function generateConceptionHTML(data) {
    const roll = data.roll || '[Roll]';
    const conception = data.conception || '[Result]';
    const dueDate = data.dueDate ? formatDate(data.dueDate) : '[Date]';

    return `<div style="
    background: transparent;
    color: var(--SmartThemeBodyColor);
    font-family: 'Courier New', monospace;
    font-size: 0.85em;
    padding: 5px;
    margin-top: -15px;
    margin-bottom: 20px;
    text-align: center;
    letter-spacing: 1px;
    opacity: 0.9;
    border-bottom: 1px dashed var(--SmartThemeBorderColor);
">
    <span style="color: var(--SmartThemeBodyColor); opacity: 0.7;">
        <i class="fa-solid fa-dice"></i> ROLL:
    </span>
    <span style="color: var(--SmartThemeAccent); font-weight: bold;">
        ${roll}/100
    </span>
    <span style="margin: 0 8px; color: var(--SmartThemeBorderColor);">|</span>
    <span style="color: var(--SmartThemeBodyColor); opacity: 0.7;">
        <i class="fa-solid fa-baby"></i> CONCEPTION:
    </span>
    <span style="color: var(--SmartThemeQuoteColor); font-weight: bold;">
        ${conception}
    </span>
    <span style="margin: 0 8px; color: var(--SmartThemeBorderColor);">|</span>
    <span style="color: var(--SmartThemeAccent); font-weight: bold;">
        <i class="fa-regular fa-calendar-check"></i> DUE: ${dueDate}
    </span>
</div>`;
}

function generatePregnancyHTML(data) {
    const eyeIcon = data.knowledge === 'Hidden' ? 'fa-eye-slash' : 'fa-eye';

    return `<div style="
    background: color-mix(in srgb, var(--SmartThemeBodyColor) 5%, transparent);
    border: 1px solid var(--SmartThemeBorderColor);
    border-radius: 6px;
    padding: 10px;
    margin-top: 5px;
    margin-bottom: 20px;
    font-family: 'Courier New', monospace;
    font-size: 0.85em;
    line-height: 1.5;
    color: var(--SmartThemeBodyColor);
">
    <div style="
        border-bottom: 1px dashed var(--SmartThemeBorderColor);
        margin-bottom: 4px;
        padding-bottom: 4px;
        font-weight: bold;
        color: var(--SmartThemeAccent);
        text-transform: uppercase;
        letter-spacing: 1px;
    ">
        <i class="fa-solid fa-person-pregnant"></i> Pregnancy Status
    </div>
    <div style="
        font-size: 0.75em;
        text-transform: uppercase;
        margin-bottom: 8px;
        color: var(--SmartThemeAccent);
        opacity: 0.8;
    ">
        <i class="fa-solid ${eyeIcon}"></i> Knowledge: <span style="font-weight: bold;">${data.knowledge || 'Hidden'}</span>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
        <div>
            <span style="opacity:0.7;"><i class="fa-regular fa-clock"></i> Week:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.week || '[Week]'}</strong>
        </div>
        <div>
            <span style="opacity:0.7;"><i class="fa-solid fa-apple-whole"></i> Size:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.size || '[Size]'}</strong>
        </div>
        <div>
            <span style="opacity:0.7;"><i class="fa-regular fa-calendar-check"></i> Due:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.dueDate ? formatDate(data.dueDate) : '[Date]'}</strong>
        </div>
        <div>
            <span style="opacity:0.7;"><i class="fa-solid fa-venus-mars"></i> Gender:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.gender || 'Unknown'}</strong>
        </div>
    </div>
    <div style="margin-top: 8px; border-top: 1px dotted var(--SmartThemeBorderColor); padding-top: 5px;">
        <div style="margin-bottom: 4px;">
            <span style="color: var(--SmartThemeAccent);"><i class="fa-solid fa-head-side-virus"></i> Symptoms:</span>
            <span style="opacity: 0.9;">${data.symptoms || '[Symptoms]'}</span>
        </div>
        <div style="margin-bottom: 4px;">
            <span style="color: var(--SmartThemeAccent);"><i class="fa-solid fa-user-doctor"></i> Next Visit:</span>
            <span style="opacity: 0.9;">${data.nextVisit || '[Next Visit]'}</span>
        </div>
        <div>
            <span style="color: #e76f51;"><i class="fa-solid fa-triangle-exclamation"></i> Risks:</span>
            <span style="opacity: 0.9; font-style: italic;">${data.risks || 'Stable'}</span>
        </div>
    </div>
</div>`;
}

function generateBirthHTML(data) {
    const timestamp = Date.now();

    return `<div style="
    background: color-mix(in srgb, var(--SmartThemeBodyColor) 5%, transparent);
    border: 1px solid var(--SmartThemeBorderColor);
    border-radius: 8px;
    padding: 12px;
    margin-top: 5px;
    margin-bottom: 20px;
    font-family: 'Courier New', monospace;
    font-size: 0.85em;
    line-height: 1.5;
    color: var(--SmartThemeBodyColor);
    border-left: 4px solid var(--SmartThemeAccent);
">
    <div style="
        border-bottom: 1px dashed var(--SmartThemeBorderColor);
        margin-bottom: 6px;
        padding-bottom: 4px;
        font-weight: bold;
        color: var(--SmartThemeAccent);
        text-transform: uppercase;
        letter-spacing: 1.5px;
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 5px;
    ">
        <span><i class="fa-solid fa-baby-carriage"></i> Newborn Birth Report</span>
        <span style="font-size: 0.8em; opacity: 0.7;">FILE_REV_${timestamp}</span>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div>
            <span style="opacity:0.7;"><i class="fa-solid fa-venus-mars"></i> Gender:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.gender || '[Gender]'}</strong>
        </div>
        <div>
            <span style="opacity:0.7;"><i class="fa-solid fa-circle-check"></i> US-Accuracy:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.usAccuracy || 'Confirmed'}</strong>
        </div>
        <div>
            <span style="opacity:0.7;"><i class="fa-solid fa-weight-scale"></i> Weight:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.weight ? data.weight + ' kg' : '[Weight]'}</strong>
        </div>
        <div>
            <span style="opacity:0.7;"><i class="fa-solid fa-ruler-vertical"></i> Height:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.height ? data.height + ' cm' : '[Height]'}</strong>
        </div>
    </div>
    <div style="margin-top: 10px; border-top: 1px solid var(--SmartThemeBorderColor); padding-top: 8px;">
        <div style="margin-bottom: 4px;">
            <span style="color: var(--SmartThemeAccent); font-weight: bold;"><i class="fa-solid fa-dna"></i> Genetics & Heritage:</span>
        </div>
        <div style="font-size: 0.9em; padding-left: 10px; border-left: 2px solid var(--SmartThemeBorderColor); margin-bottom: 8px;">
            <span style="opacity: 0.8;">Dominance:</span> <strong>${data.dominance || '[Dominance]'}</strong><br>
            <span style="opacity: 0.8;">Features:</span> ${data.features || '[Features]'}<br>
            <span style="opacity: 0.8;">Temperament:</span> ${data.temperament || '[Temperament]'}
        </div>
    </div>
    <div style="margin-top: 8px; background: rgba(0,0,0,0.15); padding: 8px; border-radius: 4px;">
        <div style="margin-bottom: 4px;">
            <span style="color: #2a9d8f;"><i class="fa-solid fa-heart-pulse"></i> Vital Health:</span>
            <span style="font-weight: bold; opacity: 0.9;">${data.health || 'Stable'}</span>
        </div>
        <div>
            <span style="color: #e76f51;"><i class="fa-solid fa-microscope"></i> Pathology/Defects:</span>
            <span style="opacity: 0.9; font-style: italic;">${data.pathology || 'None Detected'}</span>
        </div>
    </div>
</div>`;
}

function generateBabyCareHTML(data) {
    return `<div style="
    background: color-mix(in srgb, var(--SmartThemeBodyColor) 5%, transparent);
    border: 1px solid var(--SmartThemeBorderColor);
    border-radius: 6px;
    padding: 10px;
    margin-top: 5px;
    margin-bottom: 20px;
    font-family: 'Courier New', monospace;
    font-size: 0.85em;
    line-height: 1.5;
    color: var(--SmartThemeBodyColor);
">
    <div style="
        border-bottom: 1px dashed var(--SmartThemeBorderColor);
        margin-bottom: 4px;
        padding-bottom: 4px;
        font-weight: bold;
        color: var(--SmartThemeAccent);
        text-transform: uppercase;
        letter-spacing: 1px;
    ">
        <i class="fa-solid fa-baby"></i> Baby Care Monitor
    </div>
    <div style="
        font-size: 0.75em;
        text-transform: uppercase;
        margin-bottom: 8px;
        color: var(--SmartThemeAccent);
        opacity: 0.8;
    ">
        <i class="fa-solid fa-id-card"></i> Name: <span style="font-weight: bold;">${data.name || '[Name]'}</span> | Age: <span style="font-weight: bold;">${data.age || '[Age]'}</span>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
        <div>
            <span style="opacity:0.7;"><i class="fa-solid fa-utensils"></i> Hunger:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.hunger || 'Full'}</strong>
        </div>
        <div>
            <span style="opacity:0.7;"><i class="fa-solid fa-soap"></i> Hygiene:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.hygiene || 'Clean'}</strong>
        </div>
        <div>
            <span style="opacity:0.7;"><i class="fa-solid fa-bed"></i> Energy:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.energy || 'Rested'}</strong>
        </div>
        <div>
            <span style="opacity:0.7;"><i class="fa-solid fa-face-smile"></i> Mood:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.mood || 'Content'}</strong>
        </div>
    </div>
    <div style="margin-top: 8px; border-top: 1px dotted var(--SmartThemeBorderColor); padding-top: 5px;">
        <div style="margin-bottom: 4px;">
            <span style="color: var(--SmartThemeAccent);"><i class="fa-solid fa-dna"></i> Traits:</span>
            <span style="opacity: 0.9;">${data.traits || '[Traits]'}</span>
        </div>
        <div style="margin-bottom: 4px;">
            <span style="color: var(--SmartThemeAccent);"><i class="fa-solid fa-star"></i> Milestone:</span>
            <span style="opacity: 0.9;">Next: ${data.milestone || '[Milestone]'}</span>
        </div>
        <div style="margin-bottom: 4px;">
            <span style="color: var(--SmartThemeAccent);"><i class="fa-solid fa-user-doctor"></i> Medical:</span>
            <span style="opacity: 0.9;">${data.medical || '[Medical]'}</span>
        </div>
        <div style="background: rgba(231, 111, 81, 0.1); padding: 3px; border-radius: 3px; margin-top: 5px;">
            <span style="color: #e76f51;"><i class="fa-solid fa-circle-exclamation"></i> Immediate Need:</span>
            <span style="opacity: 0.9; font-style: italic;">${data.immediateNeed || 'None'}</span>
        </div>
    </div>
</div>`;
}

/* ═══════════════════════════════════════════════════════════════
   FORM GENERATION
   ═══════════════════════════════════════════════════════════════ */

function generateFieldHTML(field, value, isMobile) {
    const currentValue = value || field.default || '';
    const padding = isMobile ? '14px' : '10px';
    const fontSize = isMobile ? '14px' : '13px';

    let inputHTML = '';

    switch (field.type) {
        case 'select':
            inputHTML = `
                <select id="flt-field-${field.id}" name="${field.id}" style="
                    width: 100%;
                    padding: ${padding};
                    background: var(--SmartThemeInputColor);
                    border: 1px solid var(--SmartThemeBorderColor);
                    border-radius: 8px;
                    color: var(--SmartThemeBodyColor);
                    font-size: ${fontSize};
                    font-family: monospace;
                ">
                    ${field.options.map(opt =>
                        `<option value="${opt}" ${currentValue === opt ? 'selected' : ''}>${opt}</option>`
                    ).join('')}
                </select>
            `;
            break;
        case 'textarea':
            inputHTML = `
                <textarea id="flt-field-${field.id}" name="${field.id}" style="
                    width: 100%;
                    height: ${isMobile ? '80px' : '60px'};
                    padding: ${padding};
                    background: var(--SmartThemeInputColor);
                    border: 1px solid var(--SmartThemeBorderColor);
                    border-radius: 8px;
                    color: var(--SmartThemeBodyColor);
                    font-size: ${fontSize};
                    font-family: monospace;
                    resize: vertical;
                " placeholder="Enter ${field.label.toLowerCase()}...">${currentValue}</textarea>
            `;
            break;
        case 'number':
            inputHTML = `
                <input type="number" id="flt-field-${field.id}" name="${field.id}" value="${currentValue}"
                    ${field.min !== undefined ? `min="${field.min}"` : ''}
                    ${field.max !== undefined ? `max="${field.max}"` : ''}
                    placeholder="${field.label}"
                    style="
                        width: 100%;
                        padding: ${padding};
                        background: var(--SmartThemeInputColor);
                        border: 1px solid var(--SmartThemeBorderColor);
                        border-radius: 8px;
                        color: var(--SmartThemeBodyColor);
                        font-size: ${fontSize};
                        font-family: monospace;
                    ">
            `;
            break;
        case 'date':
            inputHTML = `
                <input type="date" id="flt-field-${field.id}" name="${field.id}" value="${currentValue}"
                    style="
                        width: 100%;
                        padding: ${padding};
                        background: var(--SmartThemeInputColor);
                        border: 1px solid var(--SmartThemeBorderColor);
                        border-radius: 8px;
                        color: var(--SmartThemeBodyColor);
                        font-size: ${fontSize};
                        font-family: monospace;
                    ">
            `;
            break;
        default:
            inputHTML = `
                <input type="text" id="flt-field-${field.id}" name="${field.id}" value="${currentValue}"
                    placeholder="Enter ${field.label.toLowerCase()}..."
                    style="
                        width: 100%;
                        padding: ${padding};
                        background: var(--SmartThemeInputColor);
                        border: 1px solid var(--SmartThemeBorderColor);
                        border-radius: 8px;
                        color: var(--SmartThemeBodyColor);
                        font-size: ${fontSize};
                        font-family: monospace;
                    ">
            `;
    }

    return `
        <div style="margin-bottom: ${isMobile ? '16px' : '12px'};">
            <label style="
                display: block;
                font-size: ${isMobile ? '13px' : '12px'};
                color: var(--SmartThemeBodyColor);
                margin-bottom: 6px;
                opacity: 0.8;
            ">${field.label}</label>
            ${inputHTML}
        </div>
    `;
}

/* ═══════════════════════════════════════════════════════════════
   TRACKER MODAL
   ═══════════════════════════════════════════════════════════════ */

function showTrackerModal(trackerId) {
    const tracker = TRACKERS[trackerId];
    if (!tracker) return;

    const isMobile = window.innerWidth <= 768;
    const savedData = chatTrackerData[trackerId] || {};

    const fieldsHTML = tracker.fields.map(field =>
        generateFieldHTML(field, savedData[field.id], isMobile)
    ).join('');

    const content = `
        <div style="color:var(--SmartThemeBodyColor); font-size:${isMobile ? '18px' : '16px'}; font-weight:500; margin-bottom:${isMobile ? '20px' : '16px'}; display:flex; align-items:center; gap:8px;">
            <i class="${tracker.icon}"></i> ${tracker.name}
        </div>

        <div style="
            background: color-mix(in srgb, var(--SmartThemeAccent) 10%, transparent);
            border-left: 3px solid var(--SmartThemeAccent);
            padding: 12px;
            border-radius: 0 6px 6px 0;
            margin-bottom: 16px;
            font-size: ${isMobile ? '13px' : '12px'};
            color: var(--SmartThemeBodyColor);
            opacity: 0.9;
        ">
            <i class="fa-solid fa-circle-info"></i>
            Fill in the fields manually or click "Let AI Fill" to insert empty template for AI to populate.
        </div>

        <form id="flt-tracker-form" data-tracker="${trackerId}">
            ${fieldsHTML}
        </form>

        <div style="
            background: color-mix(in srgb, var(--SmartThemeBodyColor) 3%, transparent);
            border: 1px dashed var(--SmartThemeBorderColor);
            border-radius: 8px;
            padding: 15px;
            margin-top: 16px;
            margin-bottom: 20px;
        ">
            <div style="
                font-size: 11px;
                text-transform: uppercase;
                color: var(--SmartThemeAccent);
                margin-bottom: 10px;
                opacity: 0.8;
            ">
                <i class="fa-solid fa-eye"></i> Preview
            </div>
            <div id="flt-preview-content" style="font-size: 12px;">
                ${generateTrackerHTML(trackerId, savedData)}
            </div>
        </div>

        <div style="display:flex; gap:${isMobile ? '10px' : '8px'}; justify-content:center; ${isMobile ? 'flex-direction: column;' : ''}">
            <button id="flt-btn-apply" class="menu_button" style="
                background: var(--SmartThemeButtonColor);
                color: var(--SmartThemeButtonTextColor);
                padding: ${isMobile ? '14px 20px' : '10px 16px'};
                border-radius: ${isMobile ? '8px' : '6px'};
                border: none;
                font-size: ${isMobile ? '15px' : '13px'};
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                ${isMobile ? 'width: 100%; margin-bottom: 8px;' : 'flex: 1;'}
                justify-content: center;
            ">
                <i class="fa-solid fa-check"></i> Apply
            </button>
            <button id="flt-btn-ai" class="menu_button" style="
                background: color-mix(in srgb, #2a9d8f 20%, transparent);
                color: #2a9d8f;
                padding: ${isMobile ? '14px 20px' : '10px 16px'};
                border-radius: ${isMobile ? '8px' : '6px'};
                border: 1px solid #2a9d8f;
                font-size: ${isMobile ? '15px' : '13px'};
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                ${isMobile ? 'width: 100%; margin-bottom: 8px;' : 'flex: 1;'}
                justify-content: center;
            ">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Let AI Fill
            </button>
            <button id="flt-btn-cancel" class="menu_button" style="
                background: transparent;
                color: var(--SmartThemeBodyColor);
                padding: ${isMobile ? '14px 20px' : '10px 16px'};
                border-radius: ${isMobile ? '8px' : '6px'};
                border: 1px solid var(--SmartThemeBorderColor);
                font-size: ${isMobile ? '15px' : '13px'};
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                ${isMobile ? 'width: 100%;' : 'flex: 1;'}
                justify-content: center;
            ">
                <i class="fa-solid fa-xmark"></i> Cancel
            </button>
        </div>
    `;

    createPopup(content, "550px");

    // Add event listeners for live preview
    const form = document.getElementById('flt-tracker-form');
    form.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', () => updatePreview(trackerId));
        input.addEventListener('change', () => updatePreview(trackerId));
    });

    // Button handlers
    document.getElementById('flt-btn-apply').addEventListener('click', () => applyTracker(trackerId, false));
    document.getElementById('flt-btn-ai').addEventListener('click', () => applyTracker(trackerId, true));
    document.getElementById('flt-btn-cancel').addEventListener('click', closePopup);

    // Close menu
    const menu = document.getElementById("flt-menu");
    if (menu) menu.style.display = "none";
}

function updatePreview(trackerId) {
    const form = document.getElementById('flt-tracker-form');
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    const preview = document.getElementById('flt-preview-content');
    if (preview) {
        preview.innerHTML = generateTrackerHTML(trackerId, data);
    }
}

function applyTracker(trackerId, letAiFill = false) {
    const form = document.getElementById('flt-tracker-form');
    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData.entries()) {
        data[key] = letAiFill ? '' : value;
    }

    // Save to chat data
    if (!letAiFill) {
        chatTrackerData[trackerId] = data;
        saveChatData();
    }

    // Generate HTML
    const html = generateTrackerHTML(trackerId, data);

    // Get textarea and insert
    const textarea = document.getElementById('send_textarea');
    if (textarea) {
        // Save for undo
        undoHistory.push({
            trackerId: trackerId,
            previousContent: textarea.value,
            timestamp: Date.now()
        });
        if (undoHistory.length > 10) undoHistory.shift();

        // Insert HTML
        const currentText = textarea.value;
        const newText = currentText + (currentText ? '\n\n' : '') + html;
        textarea.value = newText;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));

        updateMenuState();
    }

    closePopup();
    showToast(`${TRACKERS[trackerId].name} ${letAiFill ? 'template' : 'data'} inserted!`, 'success');
}

function undoLastInsert() {
    if (undoHistory.length === 0) {
        showToast('Nothing to undo', 'error');
        return;
    }

    const lastAction = undoHistory.pop();
    const textarea = document.getElementById('send_textarea');

    if (textarea) {
        textarea.value = lastAction.previousContent;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    updateMenuState();
    showToast('Undone!', 'success');

    const menu = document.getElementById("flt-menu");
    if (menu) menu.style.display = "none";
}

/* ═══════════════════════════════════════════════════════════════
   MENU STATE
   ═══════════════════════════════════════════════════════════════ */

function updateMenuState() {
    const undoOption = document.getElementById("flt-undo-option");
    if (undoOption) {
        undoOption.style.display = undoHistory.length > 0 ? "flex" : "none";
    }

    // Update tracker status indicators
    Object.keys(TRACKERS).forEach(trackerId => {
        const statusEl = document.getElementById(`flt-status-${trackerId}`);
        if (statusEl) {
            const hasData = chatTrackerData[trackerId] && Object.keys(chatTrackerData[trackerId]).length > 0;
            statusEl.textContent = hasData ? 'Has Data' : '';
            statusEl.style.display = hasData ? 'inline' : 'none';
        }
    });
}

/* ═══════════════════════════════════════════════════════════════
   MAIN BUTTON AND MENU
   ═══════════════════════════════════════════════════════════════ */

function addFLTMenu() {
    if (document.getElementById("flt-btn")) return true;

    const container = document.getElementById("leftSendForm") ||
                     document.getElementById("form_sheld") ||
                     document.querySelector("#send_form");

    if (!container) {
        console.log("FLT: Container not found");
        return false;
    }

    // Get button styles from existing buttons
    const existingButtons = container.querySelectorAll("button, .menu_button, .fa-icon-button");
    let buttonSize = "32px";
    let buttonPadding = "0";
    let fontSize = "14px";

    if (existingButtons.length > 0) {
        const referenceButton = existingButtons[0];
        const rect = referenceButton.getBoundingClientRect();
        buttonSize = Math.max(rect.width, rect.height) + "px";
        buttonPadding = window.getComputedStyle(referenceButton).padding || "6px";
        const faIcons = container.querySelectorAll(".fa, .fas, .far, .fab");
        if (faIcons.length > 0) {
            const faStyle = window.getComputedStyle(faIcons[0]);
            fontSize = faStyle.fontSize || "14px";
        }
    }

    // Create button
    const btn = document.createElement("div");
    btn.id = "flt-btn";
    btn.title = "Fawn's Life Tracker";
    btn.innerHTML = '<i class="fa-solid fa-heart-pulse"></i>';
    btn.style.cssText = `
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: ${buttonSize};
        height: ${buttonSize};
        min-width: ${buttonSize};
        min-height: ${buttonSize};
        padding: ${buttonPadding};
        color: var(--SmartThemeBodyColor);
        font-size: ${fontSize};
        margin: 0 2px;
        border-radius: 5px;
        transition: all 0.2s;
        user-select: none;
        opacity: 0.8;
        flex-shrink: 0;
    `;

    btn.addEventListener("mouseenter", function() {
        this.style.background = "var(--SmartThemeBorderColor)";
        this.style.opacity = "1";
    });

    btn.addEventListener("mouseleave", function() {
        this.style.background = "";
        this.style.opacity = "0.8";
    });

    // Create menu
    const menu = document.createElement("div");
    menu.id = "flt-menu";
    menu.style.cssText = `
        display: none;
        position: absolute;
        bottom: calc(100% + 5px);
        left: 0;
        background: var(--SmartThemeBlurTintColor);
        backdrop-filter: blur(10px);
        border: 1px solid var(--SmartThemeBorderColor);
        border-radius: 6px;
        padding: 6px;
        z-index: 1001;
        min-width: 220px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        max-height: 400px;
        overflow-y: auto;
    `;

    // Generate tracker options
    const trackerOptionsHTML = Object.values(TRACKERS).map(tracker => `
        <div class="flt-option" data-action="tracker" data-tracker="${tracker.id}" style="
            padding: 10px 12px;
            cursor: pointer;
            color: var(--SmartThemeBodyColor);
            border-radius: 4px;
            margin: 2px 0;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
        ">
            <i class="${tracker.icon}" style="width: 18px; opacity: 0.7;"></i>
            <div style="flex: 1;">
                <div>${tracker.name}</div>
                <div style="font-size: 10px; opacity: 0.6;">${tracker.description}</div>
            </div>
            <span id="flt-status-${tracker.id}" style="
                font-size: 9px;
                padding: 2px 6px;
                background: var(--SmartThemeQuoteColor);
                color: white;
                border-radius: 10px;
                display: none;
            ">Has Data</span>
        </div>
    `).join('');

    menu.innerHTML = `
        <div style="
            padding: 8px 12px;
            color: var(--SmartThemeAccent);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px solid var(--SmartThemeBorderColor);
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 6px;
        ">
            <i class="fa-solid fa-heart-pulse"></i> Life Tracker
        </div>
        ${trackerOptionsHTML}
        <hr style="border: none; border-top: 1px solid var(--SmartThemeBorderColor); margin: 6px 0;">
        <div id="flt-undo-option" class="flt-option" data-action="undo" style="
            padding: 10px 12px;
            cursor: pointer;
            color: #e76f51;
            border-radius: 4px;
            margin: 2px 0;
            display: none;
            align-items: center;
            gap: 10px;
            font-size: 13px;
        ">
            <i class="fa-solid fa-rotate-left" style="width: 18px;"></i>
            <span>Undo Last Insert</span>
        </div>
    `;

    container.insertBefore(btn, container.firstChild);
    document.body.appendChild(menu);

    // Button click handler
    btn.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        closePopup();
        updateMenuState();

        const btnRect = btn.getBoundingClientRect();
        menu.style.left = btnRect.left + "px";
        menu.style.bottom = (window.innerHeight - btnRect.top + 5) + "px";

        const isMenuVisible = menu.style.display === "block";
        menu.style.display = isMenuVisible ? "none" : "block";
    });

    // Menu option handlers
    menu.querySelectorAll(".flt-option").forEach(opt => {
        opt.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();

            const action = this.dataset.action;

            if (action === "tracker") {
                const trackerId = this.dataset.tracker;
                menu.style.display = "none";
                showTrackerModal(trackerId);
            } else if (action === "undo") {
                undoLastInsert();
            }
        });

        opt.addEventListener("mouseenter", function() {
            if (this.dataset.action === "undo") {
                this.style.background = "#e76f51";
                this.style.color = "white";
            } else {
                this.style.background = "var(--SmartThemeQuoteColor)";
                this.style.color = "white";
            }
        });

        opt.addEventListener("mouseleave", function() {
            this.style.background = "";
            if (this.dataset.action === "undo") {
                this.style.color = "#e76f51";
            } else {
                this.style.color = "var(--SmartThemeBodyColor)";
            }
        });
    });

    // Close menu on outside click
    document.addEventListener("click", function(e) {
        if (!btn.contains(e.target) && !menu.contains(e.target)) {
            menu.style.display = "none";
        }
    });

    window.addEventListener("scroll", () => menu.style.display = "none");
    window.addEventListener("resize", () => menu.style.display = "none");

    console.log("FLT: Menu created successfully");
    return true;
}

/* ═══════════════════════════════════════════════════════════════
   EVENTS
   ═══════════════════════════════════════════════════════════════ */

eventSource.on(event_types.CHAT_CHANGED, function() {
    console.log('FLT: Chat changed, reloading data...');
    loadChatData();
    undoHistory = [];
    setTimeout(updateMenuState, 300);
});

eventSource.on(event_types.CHAT_LOADED, function() {
    loadChatData();
    setTimeout(updateMenuState, 500);
});

/* ═══════════════════════════════════════════════════════════════
   INITIALIZATION
   ═══════════════════════════════════════════════════════════════ */

jQuery(() => {
    loadChatData();

    // Create button with delay
    setTimeout(() => {
        if (!document.getElementById("flt-btn")) {
            const success = addFLTMenu();
            console.log('FLT: Menu creation:', success ? 'successful' : 'failed');
        }
        setTimeout(updateMenuState, 200);
    }, 800);

    // Fallback
    setTimeout(() => {
        if (!document.getElementById("flt-btn")) {
            const success = addFLTMenu();
            console.log('FLT: Fallback menu creation:', success ? 'successful' : 'failed');
        }
        updateMenuState();
    }, 2500);

    console.log("Fawn's Life Tracker: Initialized for chat", getCurrentChatId());
});
