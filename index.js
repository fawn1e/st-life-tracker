/* ═══════════════════════════════════════════════════════════════
   FAWN'S LIFE TRACKER - FULL VERSION
   Mobile-friendly, all fixes applied
   ═══════════════════════════════════════════════════════════════ */

import { extension_settings, getContext } from "../../../extensions.js";
import { eventSource, event_types } from "../../../../script.js";
import { setExtensionPrompt, extension_prompt_types, extension_prompt_roles } from "../../../../script.js";

const extensionName = "fawns-life-tracker";

const defaultSettings = {
    enabled: true,
    conceptionThreshold: 20,
    miscarriageEnabled: true,
    autoLaborEnabled: true,
    ultrasoundErrorChance: 5
};

if (!extension_settings[extensionName]) {
    extension_settings[extensionName] = { ...defaultSettings };
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const BABY_SIZES = {
    1: 'Vanilla seed', 2: 'Poppy seed', 3: 'Sesame seed', 4: 'Lentil',
    5: 'Blueberry', 6: 'Pea', 7: 'Raspberry', 8: 'Kidney bean',
    9: 'Grape', 10: 'Kumquat', 11: 'Fig', 12: 'Lime',
    13: 'Pea pod', 14: 'Lemon', 15: 'Apple', 16: 'Avocado',
    17: 'Turnip', 18: 'Bell pepper', 19: 'Tomato', 20: 'Banana',
    21: 'Carrot', 22: 'Papaya', 23: 'Mango', 24: 'Corn',
    25: 'Cauliflower', 26: 'Lettuce', 27: 'Cabbage', 28: 'Eggplant',
    29: 'Squash', 30: 'Cucumber', 31: 'Coconut', 32: 'Pineapple',
    33: 'Cantaloupe', 34: 'Butternut', 35: 'Honeydew', 36: 'Romaine',
    37: 'Swiss chard', 38: 'Leek', 39: 'Watermelon', 40: 'Pumpkin',
    41: 'Watermelon+', 42: 'Jackfruit'
};

const PREGNANCY_TESTS = {
    first: ['Blood type & Rh', 'CBC', 'HIV/Hepatitis', 'Rubella immunity', 'First trimester screening', 'NT ultrasound (11-13w)'],
    second: ['Anatomy scan (18-22w)', 'Glucose screening (24-28w)', 'Quad screen', 'Amniocentesis (if indicated)'],
    third: ['Group B strep (35-37w)', 'Non-stress test', 'Biophysical profile', 'Growth ultrasound']
};

const CONGENITAL_CONDITIONS = [
    'None', 'Heart defect', 'Cleft lip/palate', 'Down syndrome', 'Spina bifida',
    'Clubfoot', 'Hip dysplasia', 'Hearing impairment', 'Vision impairment',
    'Chromosomal abnormality', 'Other (specify)'
];

const TRACKERS = {
    conception: { id: 'conception', name: 'Conception Roll', icon: 'fa-solid fa-dice', color: '#9b59b6', description: 'Roll for pregnancy' },
    pregnancy: { id: 'pregnancy', name: 'Pregnancy Tracker', icon: 'fa-solid fa-person-pregnant', color: '#e91e63', description: 'Track pregnancy progress' },
    birth: { id: 'birth', name: 'Birth Report', icon: 'fa-solid fa-baby-carriage', color: '#2196f3', description: 'Record birth & baby' },
    babyCare: { id: 'babyCare', name: 'Baby Care', icon: 'fa-solid fa-baby', color: '#4caf50', description: 'Track baby needs' },
    miscarriage: { id: 'miscarriage', name: 'Loss Report', icon: 'fa-solid fa-heart-crack', color: '#6c757d', description: 'Pregnancy loss' }
};

/* ═══════════════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════════════ */

let state = {
    active: null,
    data: {},
    history: [],
    lastMessageId: null,
    dueDate: null,
    actualGender: null,
    ultrasoundGender: null
};

/* ═══════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */

function getCurrentChatId() {
    try { return getContext()?.chatId?.toString() || 'global'; }
    catch (e) { return 'global'; }
}

function saveState() {
    try { localStorage.setItem(`flt_state_${getCurrentChatId()}`, JSON.stringify(state)); } catch (e) { }
}

function loadState() {
    try {
        const s = localStorage.getItem(`flt_state_${getCurrentChatId()}`);
        if (s) state = JSON.parse(s);
        else resetState();
    } catch (e) { resetState(); }
}

function resetState() {
    state = { active: null, data: {}, history: [], lastMessageId: null, dueDate: null, actualGender: null, ultrasoundGender: null };
}

function saveSettings() {
    localStorage.setItem('flt_settings', JSON.stringify(extension_settings[extensionName]));
}

function loadSettings() {
    try {
        const s = localStorage.getItem('flt_settings');
        if (s) extension_settings[extensionName] = { ...defaultSettings, ...JSON.parse(s) };
    } catch (e) { }
}

function formatDate(date) {
    if (!date) return '??';
    const d = date instanceof Date ? date : new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
}

function calculateDueDate(fromDate) {
    const d = fromDate ? new Date(fromDate) : new Date();
    d.setDate(d.getDate() + 280);
    return d;
}

function showToast(message, type = 'success') {
    document.querySelectorAll('.flt-toast').forEach(t => t.remove());
    const colors = { success: '#4caf50', warning: '#f4a261', error: '#e76f51', info: '#2196f3' };
    const icons = { success: 'check-circle', warning: 'exclamation-triangle', error: 'times-circle', info: 'info-circle' };

    const toast = document.createElement('div');
    toast.className = 'flt-toast';
    toast.innerHTML = `<i class="fa-solid fa-${icons[type]}"></i> ${message}`;
    toast.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);background:var(--SmartThemeBlurTintColor);border:1px solid var(--SmartThemeBorderColor);border-left:3px solid ${colors[type]};border-radius:6px;padding:8px 16px;z-index:10001;display:flex;align-items:center;gap:8px;box-shadow:0 2px 10px rgba(0,0,0,0.2);color:var(--SmartThemeBodyColor);font-size:13px;animation:flt-toastIn 0.3s ease;white-space:nowrap;`;

    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'flt-toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

/* ═══════════════════════════════════════════════════════════════
   BUTTON HELPER - Generates consistent button HTML
   ═══════════════════════════════════════════════════════════════ */

function btn(id, icon, text, primary = false, danger = false) {
    const m = window.innerWidth <= 768;
    let bg, color, border;

    if (danger) {
        bg = '#e76f51';
        color = 'white';
        border = 'none';
    } else if (primary) {
        bg = 'var(--SmartThemeButtonColor)';
        color = 'var(--SmartThemeButtonTextColor)';
        border = 'none';
    } else {
        bg = 'transparent';
        color = 'var(--SmartThemeBodyColor)';
        border = '1px solid var(--SmartThemeBorderColor)';
    }

    return `<button id="${id}" style="
        background:${bg};
        color:${color};
        padding:${m ? '14px 20px' : '10px 16px'};
        border-radius:${m ? '8px' : '6px'};
        border:${border};
        font-size:${m ? '15px' : '13px'};
        cursor:pointer;
        display:flex;
        align-items:center;
        justify-content:center;
        gap:8px;
        ${m ? 'width:100%;' : 'flex:1;min-width:100px;'}
    "><i class="${icon}"></i> ${text}</button>`;
}

function btnRow(...buttons) {
    const m = window.innerWidth <= 768;
    return `<div style="display:flex;gap:${m ? '10px' : '8px'};justify-content:center;margin-top:${m ? '20px' : '16px'};${m ? 'flex-direction:column;' : ''}">${buttons.join('')}</div>`;
}

/* ═══════════════════════════════════════════════════════════════
   POPUP SYSTEM
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
    const m = window.innerWidth <= 768;
    const maxWidth = m ? "calc(100vw - 40px)" : `min(${width}, 90vw)`;

    const popup = document.createElement("div");
    popup.id = "flt-popup";
    popup.innerHTML = `
        <div id="flt-popup-bg" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99998;touch-action:pan-y;"></div>
        <div id="flt-popup-content" style="
            position:fixed;
            top:${m ? '20px' : '50%'};
            left:50%;
            transform:${m ? 'translateX(-50%)' : 'translate(-50%,-50%)'};
            width:${maxWidth};
            max-height:${m ? 'calc(100vh - 40px)' : '80vh'};
            background:var(--SmartThemeBlurTintColor);
            border:1px solid var(--SmartThemeBorderColor);
            border-radius:12px;
            padding:${m ? '20px 16px' : '20px'};
            z-index:99999;
            box-sizing:border-box;
            overflow-y:auto;
            overscroll-behavior:contain;
            -webkit-overflow-scrolling:touch;
            box-shadow:0 10px 30px rgba(0,0,0,0.3);
        ">${content}</div>
    `;

    document.body.appendChild(popup);
    document.body.style.overflow = 'hidden';
    if (m) {
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
    }

    document.getElementById("flt-popup-bg").addEventListener("click", closePopup);
    const escHandler = (e) => { if (e.key === 'Escape') { closePopup(); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);

    setTimeout(() => {
        const firstInput = popup.querySelector('textarea, input, select');
        if (firstInput) firstInput.focus();
    }, 100);

    return popup;
}

/* ═══════════════════════════════════════════════════════════════
   FORM INPUT HELPER
   ═══════════════════════════════════════════════════════════════ */

function formField(label, inputHtml, icon = null) {
    const m = window.innerWidth <= 768;
    return `
        <div style="margin-bottom:${m ? '16px' : '12px'};">
            <label style="font-size:${m ? '13px' : '12px'};opacity:0.7;display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                ${icon ? `<i class="${icon}" style="opacity:0.6;"></i>` : ''} ${label}
            </label>
            ${inputHtml}
        </div>
    `;
}

function textInput(name, value = '', placeholder = '') {
    const m = window.innerWidth <= 768;
    return `<input type="text" name="${name}" value="${value}" placeholder="${placeholder}" style="width:100%;padding:${m ? '12px' : '10px'};background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);font-size:${m ? '14px' : '13px'};box-sizing:border-box;">`;
}

function numberInput(name, value = '', min = '', max = '', placeholder = '') {
    const m = window.innerWidth <= 768;
    return `<input type="number" name="${name}" value="${value}" min="${min}" max="${max}" placeholder="${placeholder}" style="width:100%;padding:${m ? '12px' : '10px'};background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);font-size:${m ? '14px' : '13px'};box-sizing:border-box;">`;
}

function selectInput(name, options, selected = '') {
    const m = window.innerWidth <= 768;
    const opts = options.map(o => {
        const val = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? o : o.label;
        return `<option value="${val}" ${val === selected ? 'selected' : ''}>${label}</option>`;
    }).join('');
    return `<select name="${name}" style="width:100%;padding:${m ? '12px' : '10px'};background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);font-size:${m ? '14px' : '13px'};box-sizing:border-box;">${opts}</select>`;
}

function textareaInput(name, value = '', placeholder = '', rows = 2) {
    const m = window.innerWidth <= 768;
    return `<textarea name="${name}" rows="${rows}" placeholder="${placeholder}" style="width:100%;padding:${m ? '12px' : '10px'};background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);font-size:${m ? '14px' : '13px'};resize:vertical;box-sizing:border-box;">${value}</textarea>`;
}

function formGrid(columns, content) {
    const m = window.innerWidth <= 768;
    return `<div style="display:grid;grid-template-columns:${m ? '1fr' : `repeat(${columns}, 1fr)`};gap:${m ? '12px' : '15px'};">${content}</div>`;
}

/* ═══════════════════════════════════════════════════════════════
   SYSTEM PROMPT
   ═══════════════════════════════════════════════════════════════ */

function generateSystemPrompt() {
    if (!state.active) return '';
    const s = extension_settings[extensionName];

    let prompt = `[OOC: LIFE TRACKER ACTIVE - ${state.active.toUpperCase()}]
At the END of your response, include a tracker update.
Format: [TRACKER:type|field=value|field=value|...]
Fill ALL fields based on scene. Extension renders it as widget.

`;

    switch (state.active) {
        case 'conception':
            prompt += `CONCEPTION ATTEMPT - Result: ${state.data.result || 'Pending'}
${state.data.result === 'Yes' ? `Character NOW PREGNANT but doesn't know. Show subtle signs. Due: ${state.data.dueDate}` : ''}
[TRACKER:conception|roll=${state.data.roll || '??'}|threshold=${state.data.threshold || 20}|result=${state.data.result || '??'}|dueDate=${state.data.dueDate || '??'}]`;
            break;

        case 'pregnancy':
            const week = parseInt(state.data.week) || 1;
            const trimester = week <= 13 ? 'first' : week <= 26 ? 'second' : 'third';
            prompt += `PREGNANCY - Week ${week}
Update: week, size, symptoms, risks, nextVisit, testsNeeded
Gender: ultrasoundGender can be WRONG (${s.ultrasoundErrorChance}% error)
${s.miscarriageEnabled ? 'MISCARRIAGE possible if High/Critical risks ignored' : ''}
${s.autoLaborEnabled ? 'LABOR can start at 37+ weeks' : ''}
[TRACKER:pregnancy|week=??|size=??|knowledge=??|ultrasoundGender=??|symptoms=??|risks=??|nextVisit=??|testsNeeded=??|dueDate=${state.data.dueDate || '??'}]`;
            break;

        case 'birth':
            prompt += `BIRTH IN PROGRESS
Generate: name, gender, weight, height, apgar, health, features
${state.ultrasoundGender ? `Ultrasound said ${state.ultrasoundGender} - verify at birth!` : ''}
[TRACKER:birth|name=??|gender=??|weight=??|height=??|apgar=??|health=??|congenitalConditions=??|time=??]`;
            break;

        case 'babyCare':
            prompt += `BABY CARE - ${state.data.name || 'Baby'}
Update: hunger, hygiene, energy, mood, health, milestones
[TRACKER:babyCare|name=${state.data.name || '??'}|age=??|hunger=??|hygiene=??|energy=??|mood=??|health=??|milestone=??]`;
            break;

        case 'miscarriage':
            prompt += `PREGNANCY LOSS - Week ${state.data.week || '??'}
Document sensitively. Emotional state is PLAYER'S CHOICE.
[TRACKER:miscarriage|week=${state.data.week || '??'}|cause=??|physical=??|medicalCare=??]`;
            break;
    }

    return prompt + '\n[/OOC]';
}

function updateSystemPrompt() {
    const prompt = generateSystemPrompt();
    if (prompt) {
        setExtensionPrompt('fawn-life-tracker', prompt, extension_prompt_types.IN_CHAT, 0, true, true, null, extension_prompt_roles.SYSTEM);
    } else {
        setExtensionPrompt('fawn-life-tracker', '', extension_prompt_types.IN_CHAT, 0, true, true, null, extension_prompt_roles.SYSTEM);
    }
}

/* ═══════════════════════════════════════════════════════════════
   TRACKER HTML GENERATORS
   ═══════════════════════════════════════════════════════════════ */

function generateTrackerHTML(trackerId, data) {
    const m = window.innerWidth <= 768;
    const baseStyle = `font-family:'Courier New',monospace;font-size:${m ? '0.8em' : '0.85em'};color:var(--SmartThemeBodyColor);`;

    switch (trackerId) {
        case 'conception': return genConceptionHTML(data, baseStyle);
        case 'pregnancy': return genPregnancyHTML(data, baseStyle, m);
        case 'birth': return genBirthHTML(data, baseStyle, m);
        case 'babycare':
        case 'babyCare': return genBabyCareHTML(data, baseStyle, m);
        case 'miscarriage': return genMiscarriageHTML(data, baseStyle, m);
        default: return '';
    }
}

function genConceptionHTML(d, baseStyle) {
    const isYes = (d.result || '').toLowerCase() === 'yes';
    const color = isYes ? '#4caf50' : '#e76f51';
    return `<div style="${baseStyle}padding:12px;text-align:center;border:1px dashed var(--SmartThemeBorderColor);border-radius:8px;">
        <div style="opacity:0.7;font-size:0.9em;margin-bottom:8px;"><i class="fa-solid fa-dice"></i> CONCEPTION ROLL</div>
        <div style="font-size:1.5em;margin-bottom:8px;"><span style="color:var(--SmartThemeAccent);font-weight:bold;">${d.roll || '??'}</span><span style="opacity:0.4;font-size:0.6em;"> / ${d.threshold || 20}</span></div>
        <div style="font-weight:bold;color:${color};font-size:1.2em;">${isYes ? '✓ CONCEIVED' : '✗ NOT THIS TIME'}</div>
        ${isYes && d.dueDate ? `<div style="margin-top:8px;font-size:0.85em;opacity:0.7;"><i class="fa-regular fa-calendar"></i> Due: ${d.dueDate}</div>` : ''}
    </div>`;
}

function genPregnancyHTML(d, baseStyle, m) {
    const week = d.week || '??';
    const size = d.size || BABY_SIZES[parseInt(week)] || '??';
    const riskColors = { 'Stable': '#4caf50', 'Mild Concern': '#8bc34a', 'Moderate Risk': '#f4a261', 'High Risk': '#e76f51', 'Critical': '#dc3545' };
    const riskColor = riskColors[d.risks] || '#4caf50';

    return `<div style="${baseStyle}background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;padding:12px;">
        <div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:10px;padding-bottom:8px;font-weight:bold;color:#e91e63;text-transform:uppercase;letter-spacing:1px;"><i class="fa-solid fa-person-pregnant"></i> Pregnancy</div>
        <div style="display:grid;grid-template-columns:${m ? '1fr 1fr' : 'repeat(4, 1fr)'};gap:8px;margin-bottom:10px;">
            <div><span style="opacity:0.5;font-size:0.85em;">Week</span><br><strong>${week}</strong></div>
            <div><span style="opacity:0.5;font-size:0.85em;">Size</span><br><strong>${size}</strong></div>
            <div><span style="opacity:0.5;font-size:0.85em;">Due</span><br><strong>${d.dueDate || '??'}</strong></div>
            <div><span style="opacity:0.5;font-size:0.85em;">Gender</span><br><strong>${d.ultrasoundGender || '??'}</strong></div>
        </div>
        ${d.symptoms ? `<div style="padding:8px;background:color-mix(in srgb,var(--SmartThemeBodyColor) 3%,transparent);border-radius:6px;margin-bottom:10px;font-size:0.9em;"><i class="fa-solid fa-head-side-virus" style="opacity:0.5;"></i> ${d.symptoms}</div>` : ''}
        ${d.nextVisit ? `<div style="padding:8px;background:color-mix(in srgb,#2196f3 10%,transparent);border-radius:6px;margin-bottom:10px;font-size:0.9em;"><i class="fa-solid fa-calendar-check" style="color:#2196f3;"></i> Next: ${d.nextVisit}${d.testsNeeded ? ` • ${d.testsNeeded}` : ''}</div>` : ''}
        <div style="padding:8px 10px;background:color-mix(in srgb,${riskColor} 15%,transparent);border-left:3px solid ${riskColor};border-radius:0 6px 6px 0;"><span style="color:${riskColor};font-weight:bold;"><i class="fa-solid fa-heart-pulse"></i> ${d.risks || 'Stable'}</span></div>
    </div>`;
}

function genBirthHTML(d, baseStyle, m) {
    const healthColor = (d.health || '').toLowerCase().includes('health') ? '#4caf50' : '#f4a261';
    return `<div style="${baseStyle}background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;padding:12px;border-left:4px solid #2196f3;">
        <div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:10px;padding-bottom:8px;font-weight:bold;color:#2196f3;text-transform:uppercase;"><i class="fa-solid fa-baby-carriage"></i> Birth Report ${d.name ? `— ${d.name}` : ''}</div>
        <div style="display:grid;grid-template-columns:${m ? '1fr 1fr' : 'repeat(4, 1fr)'};gap:10px;margin-bottom:10px;">
            <div><i class="fa-solid fa-venus-mars" style="opacity:0.5;"></i> <strong>${d.gender || '??'}</strong></div>
            <div><i class="fa-solid fa-weight-scale" style="opacity:0.5;"></i> <strong>${d.weight || '??'}</strong></div>
            <div><i class="fa-solid fa-ruler-vertical" style="opacity:0.5;"></i> <strong>${d.height || '??'}</strong></div>
            <div><i class="fa-solid fa-clock" style="opacity:0.5;"></i> <strong>${d.time || '??'}</strong></div>
        </div>
        ${d.apgar ? `<div style="font-size:0.9em;margin-bottom:8px;"><i class="fa-solid fa-chart-simple" style="opacity:0.5;"></i> APGAR: <strong style="color:${parseInt(d.apgar) >= 7 ? '#4caf50' : '#e76f51'};">${d.apgar}/10</strong></div>` : ''}
        <div style="padding:8px;background:color-mix(in srgb,${healthColor} 15%,transparent);border-radius:6px;text-align:center;"><i class="fa-solid fa-heart-pulse"></i> ${d.health || 'Checking...'}</div>
    </div>`;
}

function genBabyCareHTML(d, baseStyle, m) {
    const moodEmoji = { 'Happy': '😊', 'Content': '😌', 'Fussy': '😣', 'Crying': '😭', 'Sleeping': '😴' };
    return `<div style="${baseStyle}background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;padding:12px;">
        <div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:10px;padding-bottom:8px;font-weight:bold;color:#4caf50;text-transform:uppercase;"><i class="fa-solid fa-baby"></i> ${d.name || 'Baby'} <span style="font-weight:normal;opacity:0.7;text-transform:none;font-size:0.85em;">• ${d.age || 'Newborn'}</span></div>
        <div style="display:grid;grid-template-columns:${m ? '1fr 1fr' : 'repeat(4, 1fr)'};gap:8px;margin-bottom:10px;">
            <div><i class="fa-solid fa-utensils" style="opacity:0.5;"></i> ${d.hunger || '??'}</div>
            <div><i class="fa-solid fa-soap" style="opacity:0.5;"></i> ${d.hygiene || '??'}</div>
            <div><i class="fa-solid fa-bed" style="opacity:0.5;"></i> ${d.energy || '??'}</div>
            <div>${moodEmoji[d.mood] || '😶'} ${d.mood || '??'}</div>
        </div>
        ${d.milestone ? `<div style="padding:8px;background:color-mix(in srgb,#9b59b6 15%,transparent);border-radius:6px;font-size:0.9em;"><i class="fa-solid fa-star" style="color:#9b59b6;"></i> ${d.milestone}</div>` : ''}
    </div>`;
}

function genMiscarriageHTML(d, baseStyle, m) {
    return `<div style="${baseStyle}background:color-mix(in srgb,#6c757d 10%,transparent);border:1px solid #6c757d;border-radius:8px;padding:12px;">
        <div style="border-bottom:1px dashed #6c757d;margin-bottom:10px;padding-bottom:8px;font-weight:bold;color:#6c757d;text-transform:uppercase;"><i class="fa-solid fa-heart-crack"></i> Loss Report</div>
        <div style="display:grid;gap:10px;">
            <div><span style="opacity:0.5;">Week:</span> <strong>${d.week || '??'}</strong></div>
            <div><span style="opacity:0.5;">Cause:</span> ${d.cause || '??'}</div>
            <div><span style="opacity:0.5;">Physical:</span> ${d.physical || '??'}</div>
        </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   PARSE AI RESPONSE
   ═══════════════════════════════════════════════════════════════ */

function parseTrackerFromText(text) {
    const match = text.match(/\[TRACKER:(\w+)\|([^\]]+)\]/i);
    if (!match) return null;

    const trackerId = match[1].toLowerCase();
    const data = {};
    match[2].split('|').forEach(pair => {
        const eq = pair.indexOf('=');
        if (eq > 0) {
            const key = pair.substring(0, eq).trim();
            const value = pair.substring(eq + 1).trim();
            if (key && value && value !== '??') data[key] = value;
        }
    });

    return { trackerId, data, fullMatch: match[0] };
}

function processAIResponse(messageIndex) {
    const context = getContext();
    if (!context.chat || messageIndex < 0) return;

    const message = context.chat[messageIndex];
    if (!message || message.is_user) return;

    const parsed = parseTrackerFromText(message.mes);
    if (!parsed) return;

    if (parsed.trackerId !== state.active) {
        state.active = parsed.trackerId;
    }

    state.data = { ...state.data, ...parsed.data };
    state.lastMessageId = messageIndex;
    state.history.push({ type: parsed.trackerId, data: { ...parsed.data }, messageId: messageIndex, timestamp: Date.now() });

    saveState();
    saveTrackerDisplay(messageIndex, parsed.trackerId, state.data);
    setTimeout(() => renderTracker(messageIndex), 100);
    updateSystemPrompt();
    updateMenuState();
}

/* ═══════════════════════════════════════════════════════════════
   TRACKER DISPLAY
   ═══════════════════════════════════════════════════════════════ */

function getDisplayKey() { return `flt_display_${getCurrentChatId()}`; }

function saveTrackerDisplay(messageId, trackerId, data) {
    try { localStorage.setItem(getDisplayKey(), JSON.stringify({ messageId, trackerId, data })); } catch (e) { }
}

function loadTrackerDisplay() {
    try { const s = localStorage.getItem(getDisplayKey()); return s ? JSON.parse(s) : null; } catch (e) { return null; }
}

function removeOldTrackerDisplay() {
    document.querySelectorAll('.flt-tracker-container').forEach(el => el.remove());
    try { localStorage.removeItem(getDisplayKey()); } catch (e) { }
}

function renderTracker(messageIndex) {
    const display = loadTrackerDisplay();
    if (!display) return;

    const messages = document.querySelectorAll('#chat .mes');
    const messageEl = messages[messageIndex];
    if (!messageEl) return;

    const mesText = messageEl.querySelector('.mes_text');
    if (!mesText) return;

    mesText.innerHTML = mesText.innerHTML.replace(/\[TRACKER:[^\]]+\]/gi, '');
    messageEl.querySelector('.flt-tracker-container')?.remove();

    const container = document.createElement('div');
    container.className = 'flt-tracker-container';
    container.innerHTML = generateTrackerHTML(display.trackerId, display.data);
    container.style.marginTop = '15px';
    mesText.appendChild(container);
}

function renderAllTrackers() {
    const display = loadTrackerDisplay();
    if (display?.messageId !== undefined) renderTracker(display.messageId);
}

/* ═══════════════════════════════════════════════════════════════
   TRACKER FORMS
   ═══════════════════════════════════════════════════════════════ */

function showTrackerForm(trackerId) {
    const tracker = TRACKERS[trackerId];
    if (!tracker) return;

    const m = window.innerWidth <= 768;
    const savedData = state.active === trackerId ? state.data : {};

    let formContent = '';
    switch (trackerId) {
        case 'conception': formContent = buildConceptionForm(savedData); break;
        case 'pregnancy': formContent = buildPregnancyForm(savedData); break;
        case 'birth': formContent = buildBirthForm(savedData); break;
        case 'babyCare': formContent = buildBabyCareForm(savedData); break;
        case 'miscarriage': formContent = buildMiscarriageForm(savedData); break;
    }

    const content = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:${m ? '20px' : '16px'};">
            <div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,${tracker.color} 20%,transparent);border-radius:50%;color:${tracker.color};font-size:18px;"><i class="${tracker.icon}"></i></div>
            <div style="flex:1;">
                <div style="font-size:${m ? '18px' : '16px'};font-weight:bold;color:var(--SmartThemeBodyColor);">${tracker.name}</div>
                <div style="font-size:${m ? '12px' : '11px'};opacity:0.6;">${tracker.description}</div>
            </div>
        </div>

        <div style="background:color-mix(in srgb,var(--SmartThemeAccent) 10%,transparent);border-left:3px solid var(--SmartThemeAccent);padding:10px 12px;border-radius:0 8px 8px 0;margin-bottom:${m ? '20px' : '16px'};font-size:${m ? '13px' : '12px'};">
            <i class="fa-solid fa-magic-wand-sparkles"></i> Fill what you want — AI handles the rest!
        </div>

        <form id="flt-form">${formContent}</form>

        <div style="background:color-mix(in srgb,var(--SmartThemeBodyColor) 3%,transparent);border:1px dashed var(--SmartThemeBorderColor);border-radius:8px;padding:12px;margin:${m ? '20px' : '16px'} 0;">
            <div style="font-size:11px;text-transform:uppercase;color:var(--SmartThemeAccent);margin-bottom:10px;"><i class="fa-solid fa-eye"></i> Preview</div>
            <div id="flt-preview">${generateTrackerHTML(trackerId, savedData)}</div>
        </div>

        ${btnRow(
            btn('flt-start', 'fa-solid fa-play', 'Start Tracking', true),
            btn('flt-cancel', 'fa-solid fa-xmark', 'Cancel')
        )}
    `;

    createPopup(content, "600px");

    document.querySelectorAll('#flt-form input, #flt-form select, #flt-form textarea').forEach(el => {
        el.addEventListener('input', () => updatePreview(trackerId));
        el.addEventListener('change', () => updatePreview(trackerId));
    });

    setupTrackerHandlers(trackerId, savedData);

    document.getElementById('flt-start').addEventListener('click', () => {
        const formData = getFormData();
        startTracker(trackerId, formData);
    });
    document.getElementById('flt-cancel').addEventListener('click', closePopup);
    document.getElementById("flt-menu").style.display = "none";
}

function buildConceptionForm(data) {
    const threshold = data.threshold || extension_settings[extensionName].conceptionThreshold || 20;
    return `
        <div style="text-align:center;padding:20px 0;">
            <div style="font-size:60px;margin-bottom:15px;">🎲</div>
            <div style="margin-bottom:20px;">
                <label style="font-size:13px;opacity:0.7;">Conception Threshold (%)</label>
                <input type="range" id="flt-threshold" name="threshold" min="1" max="100" value="${threshold}" style="width:100%;margin-top:8px;">
                <div id="flt-threshold-display" style="font-size:18px;color:var(--SmartThemeAccent);font-weight:bold;">${threshold}%</div>
            </div>
            <button type="button" id="flt-roll-btn" style="background:#9b59b6;color:white;padding:15px 40px;border-radius:10px;border:none;font-size:16px;cursor:pointer;width:100%;">
                <i class="fa-solid fa-dice"></i> Roll for Conception!
            </button>
            <div id="flt-roll-result" style="margin-top:20px;display:none;"></div>
            <input type="hidden" name="roll" id="flt-roll" value="${data.roll || ''}">
            <input type="hidden" name="result" id="flt-result" value="${data.result || ''}">
            <input type="hidden" name="dueDate" id="flt-dueDate" value="${data.dueDate || ''}">
        </div>
    `;
}

function buildPregnancyForm(data) {
    return formGrid(2, `
        ${formField('Week (1-42)', numberInput('week', data.week || '', '1', '42', 'Current week'), 'fa-solid fa-calendar-week')}
        ${formField('Knowledge', selectInput('knowledge', ['Hidden', 'Suspected', 'Confirmed'], data.knowledge || 'Hidden'), 'fa-solid fa-eye')}
        ${formField('Ultrasound Gender', selectInput('ultrasoundGender', ['Unknown', 'Boy', 'Girl'], data.ultrasoundGender || 'Unknown'), 'fa-solid fa-venus-mars')}
        ${formField('Due Date', `<input type="date" name="dueDate" value="${data.dueDate || ''}" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);box-sizing:border-box;">`, 'fa-solid fa-calendar')}
        ${formField('Next Visit', textInput('nextVisit', data.nextVisit || '', 'e.g., 2 weeks'), 'fa-solid fa-calendar-check')}
        ${formField('Risks', selectInput('risks', ['Stable', 'Mild Concern', 'Moderate Risk', 'High Risk', 'Critical'], data.risks || 'Stable'), 'fa-solid fa-heart-pulse')}
    `) + formField('Current Symptoms', textareaInput('symptoms', data.symptoms || '', 'AI will fill based on week'), 'fa-solid fa-head-side-virus');
}

function buildBirthForm(data) {
    return formGrid(2, `
        ${formField('Baby Name', textInput('name', data.name || '', 'AI can choose'), 'fa-solid fa-signature')}
        ${formField('Gender', selectInput('gender', [{value:'', label:'AI decides'}, 'Boy', 'Girl'], data.gender || ''), 'fa-solid fa-venus-mars')}
        ${formField('Weight (kg)', textInput('weight', data.weight || '', '2.5-4.5 typical'), 'fa-solid fa-weight-scale')}
        ${formField('Height (cm)', textInput('height', data.height || '', '45-55 typical'), 'fa-solid fa-ruler-vertical')}
        ${formField('Health', selectInput('health', [{value:'', label:'AI determines'}, 'Healthy', 'Needs Observation', 'Critical'], data.health || ''), 'fa-solid fa-heart-pulse')}
        ${formField('APGAR (1-10)', numberInput('apgar', data.apgar || '', '1', '10', '7+ is good'), 'fa-solid fa-chart-simple')}
    `);
}

function buildBabyCareForm(data) {
    return formGrid(2, `
        ${formField('Baby Name', textInput('name', data.name || '', 'Required'), 'fa-solid fa-signature')}
        ${formField('Age', textInput('age', data.age || '', 'Newborn, 2 weeks...'), 'fa-solid fa-cake-candles')}
        ${formField('Hunger', selectInput('hunger', ['Full', 'Satisfied', 'Hungry', 'Starving'], data.hunger || 'Satisfied'), 'fa-solid fa-utensils')}
        ${formField('Hygiene', selectInput('hygiene', ['Clean', 'Needs Change', 'Soiled'], data.hygiene || 'Clean'), 'fa-solid fa-soap')}
        ${formField('Energy', selectInput('energy', ['Rested', 'Active', 'Tired', 'Exhausted'], data.energy || 'Rested'), 'fa-solid fa-bed')}
        ${formField('Mood', selectInput('mood', ['Happy', 'Content', 'Fussy', 'Crying', 'Sleeping'], data.mood || 'Content'), 'fa-solid fa-face-smile')}
    `);
}

function buildMiscarriageForm(data) {
    return `
        <div style="background:color-mix(in srgb,#6c757d 10%,transparent);border:1px solid #6c757d;border-radius:8px;padding:12px;margin-bottom:15px;font-size:13px;">
            <i class="fa-solid fa-info-circle"></i> Emotional response is <strong>your choice</strong> to roleplay.
        </div>
        ${formField('Week of Loss', numberInput('week', data.week || '', '1', '42', 'Pregnancy week'), 'fa-solid fa-calendar')}
        ${formField('Cause', selectInput('cause', [{value:'', label:'AI determines'}, 'Natural/Unknown', 'Medical Complications', 'Trauma'], data.cause || ''), 'fa-solid fa-question')}
    `;
}

function setupTrackerHandlers(trackerId, data) {
    if (trackerId === 'conception') {
        const slider = document.getElementById('flt-threshold');
        const display = document.getElementById('flt-threshold-display');
        slider?.addEventListener('input', () => display.textContent = slider.value + '%');

        document.getElementById('flt-roll-btn')?.addEventListener('click', () => {
            const threshold = parseInt(slider.value) || 20;
            const roll = Math.floor(Math.random() * 100) + 1;
            const success = roll <= threshold;

            document.getElementById('flt-roll').value = roll;
            document.getElementById('flt-result').value = success ? 'Yes' : 'No';
            if (success) document.getElementById('flt-dueDate').value = formatDate(calculateDueDate());

            document.getElementById('flt-roll-result').style.display = 'block';
            document.getElementById('flt-roll-result').innerHTML = `
                <div style="font-size:50px;animation:flt-bounce 0.5s;">${success ? '🎉' : '😔'}</div>
                <div style="font-size:28px;font-weight:bold;color:${success ? '#4caf50' : '#e76f51'};">${roll} / ${threshold}</div>
                <div style="font-size:16px;margin-top:8px;color:${success ? '#4caf50' : '#e76f51'};">${success ? '✓ Conceived!' : '✗ Not this time'}</div>
            `;
            updatePreview('conception');
        });
    }

    if (trackerId === 'pregnancy') {
        document.querySelector('[name="week"]')?.addEventListener('change', (e) => {
            const week = parseInt(e.target.value);
            if (week && BABY_SIZES[week]) {
                const sizeField = document.querySelector('[name="size"]');
                if (sizeField) sizeField.value = BABY_SIZES[week];
            }
            updatePreview('pregnancy');
        });
    }
}

function getFormData() {
    const form = document.getElementById('flt-form');
    const data = {};
    new FormData(form).forEach((value, key) => {
        if (value && value.trim()) data[key] = value.trim();
    });
    return data;
}

function updatePreview(trackerId) {
    const preview = document.getElementById('flt-preview');
    if (preview) preview.innerHTML = generateTrackerHTML(trackerId, getFormData());
}

function startTracker(trackerId, formData) {
    state.active = trackerId;
    state.data = formData;
    state.history = [];
    if (trackerId === 'conception' && formData.result === 'Yes') state.dueDate = formData.dueDate;

    saveState();
    updateSystemPrompt();
    closePopup();
    updateMenuState();
    showToast(`${TRACKERS[trackerId].name} started!`, 'success');
}

/* ═══════════════════════════════════════════════════════════════
   STATUS POPUP
   ═══════════════════════════════════════════════════════════════ */

function showStatusPopup() {
    if (!state.active) { showToast('No active tracker', 'warning'); return; }

    const tracker = TRACKERS[state.active];
    const m = window.innerWidth <= 768;

    const content = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:${m ? '20px' : '16px'};">
            <div style="width:50px;height:50px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,${tracker.color} 20%,transparent);border-radius:50%;color:${tracker.color};font-size:22px;"><i class="${tracker.icon}"></i></div>
            <div style="flex:1;">
                <div style="font-size:${m ? '18px' : '16px'};font-weight:bold;color:var(--SmartThemeBodyColor);">${tracker.name}</div>
                <div style="font-size:12px;padding:3px 8px;background:${tracker.color};color:white;border-radius:10px;display:inline-block;">ACTIVE</div>
            </div>
        </div>

        <div style="margin-bottom:${m ? '20px' : '16px'};">${generateTrackerHTML(state.active, state.data)}</div>

        ${btnRow(
            btn('flt-edit', 'fa-solid fa-pen', 'Edit Data', true),
            btn('flt-stop', 'fa-solid fa-stop', 'Stop', false, true)
        )}
    `;

    createPopup(content, "500px");

    document.getElementById('flt-edit').addEventListener('click', () => { closePopup(); showTrackerForm(state.active); });
    document.getElementById('flt-stop').addEventListener('click', () => {
        if (confirm('Stop tracking?')) {
            resetState(); saveState(); removeOldTrackerDisplay(); updateSystemPrompt(); closePopup(); updateMenuState();
            showToast('Tracking stopped', 'warning');
        }
    });
    document.getElementById("flt-menu").style.display = "none";
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS POPUP
   ═══════════════════════════════════════════════════════════════ */

function showSettingsPopup() {
    const s = extension_settings[extensionName];
    const m = window.innerWidth <= 768;

    const toggle = (id, label, key) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border-radius:8px;margin-bottom:10px;">
            <span style="font-size:${m ? '14px' : '13px'};">${label}</span>
            <div id="${id}" data-key="${key}" style="width:50px;height:26px;background:${s[key] ? 'var(--SmartThemeAccent)' : 'var(--SmartThemeBorderColor)'};border-radius:13px;cursor:pointer;position:relative;">
                <div style="position:absolute;top:3px;left:${s[key] ? '27px' : '3px'};width:20px;height:20px;background:white;border-radius:50%;transition:left 0.2s;"></div>
            </div>
        </div>
    `;

    const content = `
        <div style="font-size:${m ? '18px' : '16px'};font-weight:bold;margin-bottom:${m ? '20px' : '16px'};display:flex;align-items:center;gap:10px;"><i class="fa-solid fa-sliders"></i> Settings</div>

        ${toggle('flt-toggle-misc', 'Miscarriage Events', 'miscarriageEnabled')}
        ${toggle('flt-toggle-labor', 'Auto Labor (37+ weeks)', 'autoLaborEnabled')}

        ${formField('Conception Threshold (%)', numberInput('threshold', s.conceptionThreshold || 20, '1', '100'))}
        ${formField('Ultrasound Error Chance (%)', numberInput('ultrasoundError', s.ultrasoundErrorChance || 5, '0', '50'))}

        <div style="padding:15px;background:color-mix(in srgb,#e76f51 10%,transparent);border:1px solid #e76f51;border-radius:8px;margin:${m ? '20px' : '16px'} 0;">
            <div style="font-size:13px;color:#e76f51;margin-bottom:10px;"><i class="fa-solid fa-triangle-exclamation"></i> Danger Zone</div>
            ${btn('flt-clear-all', 'fa-solid fa-trash', 'Clear All Data', false, true)}
        </div>

        ${btnRow(
            btn('flt-save-settings', 'fa-solid fa-save', 'Save', true),
            btn('flt-cancel-settings', 'fa-solid fa-xmark', 'Cancel')
        )}
    `;

    createPopup(content, "450px");

    document.querySelectorAll('[id^="flt-toggle-"]').forEach(el => {
        el.addEventListener('click', function() {
            const key = this.dataset.key;
            const newVal = !extension_settings[extensionName][key];
            extension_settings[extensionName][key] = newVal;
            this.style.background = newVal ? 'var(--SmartThemeAccent)' : 'var(--SmartThemeBorderColor)';
            this.querySelector('div').style.left = newVal ? '27px' : '3px';
        });
    });

    document.getElementById('flt-clear-all').addEventListener('click', () => {
        if (confirm('Clear ALL data?')) {
            resetState(); saveState(); removeOldTrackerDisplay(); updateSystemPrompt(); updateMenuState();
            showToast('All data cleared', 'success');
        }
    });

    document.getElementById('flt-save-settings').addEventListener('click', () => {
        extension_settings[extensionName].conceptionThreshold = parseInt(document.querySelector('[name="threshold"]').value) || 20;
        extension_settings[extensionName].ultrasoundErrorChance = parseInt(document.querySelector('[name="ultrasoundError"]').value) || 5;
        saveSettings(); closePopup();
        showToast('Settings saved!', 'success');
    });

    document.getElementById('flt-cancel-settings').addEventListener('click', closePopup);
    document.getElementById("flt-menu").style.display = "none";
}

/* ═══════════════════════════════════════════════════════════════
   MENU
   ═══════════════════════════════════════════════════════════════ */

function updateMenuState() {
    const statusOpt = document.getElementById('flt-status-opt');
    const badge = document.getElementById('flt-active-badge');

    if (statusOpt) statusOpt.style.display = state.active ? 'flex' : 'none';
    if (badge) {
        if (state.active) {
            const t = TRACKERS[state.active];
            badge.innerHTML = `<i class="${t.icon}" style="font-size:10px;"></i>`;
            badge.style.background = t.color;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function addMenu() {
    if (document.getElementById("flt-btn")) return true;

    const container = document.getElementById("leftSendForm") || document.getElementById("form_sheld") || document.querySelector("#send_form");
    if (!container) return false;

    const btn = document.createElement("div");
    btn.id = "flt-btn";
    btn.title = "Life Tracker";
    btn.innerHTML = `<i class="fa-solid fa-heart-pulse"></i><span id="flt-active-badge" style="display:none;position:absolute;top:-3px;right:-3px;width:16px;height:16px;border-radius:50%;color:white;font-size:8px;align-items:center;justify-content:center;"></span>`;
    btn.style.cssText = `cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;color:var(--SmartThemeBodyColor);font-size:14px;margin:0 2px;border-radius:5px;opacity:0.8;position:relative;`;

    btn.addEventListener("mouseenter", () => { btn.style.background = "var(--SmartThemeBorderColor)"; btn.style.opacity = "1"; });
    btn.addEventListener("mouseleave", () => { btn.style.background = ""; btn.style.opacity = "0.8"; });

    const menu = document.createElement("div");
    menu.id = "flt-menu";
    menu.style.cssText = `display:none;position:absolute;bottom:calc(100% + 8px);left:0;background:var(--SmartThemeBlurTintColor);backdrop-filter:blur(10px);border:1px solid var(--SmartThemeBorderColor);border-radius:12px;padding:8px;z-index:1001;min-width:260px;box-shadow:0 4px 20px rgba(0,0,0,0.25);`;

    const trackersHTML = Object.values(TRACKERS).map(t => `
        <div class="flt-menu-item" data-action="tracker" data-tracker="${t.id}" style="padding:12px;cursor:pointer;border-radius:8px;display:flex;align-items:center;gap:12px;margin:2px 0;">
            <div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,${t.color} 20%,transparent);border-radius:50%;color:${t.color};font-size:14px;"><i class="${t.icon}"></i></div>
            <div><div style="font-size:13px;font-weight:500;">${t.name}</div><div style="font-size:10px;opacity:0.6;">${t.description}</div></div>
        </div>
    `).join('');

    menu.innerHTML = `
        <div style="padding:8px 12px;color:var(--SmartThemeAccent);font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid var(--SmartThemeBorderColor);margin-bottom:6px;display:flex;align-items:center;gap:8px;"><i class="fa-solid fa-heart-pulse"></i> Life Tracker</div>
        <div id="flt-status-opt" class="flt-menu-item" data-action="status" style="padding:12px;cursor:pointer;border-radius:8px;display:${state.active ? 'flex' : 'none'};align-items:center;gap:12px;margin:2px 0;background:color-mix(in srgb,var(--SmartThemeAccent) 10%,transparent);border:1px solid var(--SmartThemeAccent);">
            <div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:var(--SmartThemeAccent);border-radius:50%;color:white;font-size:14px;"><i class="fa-solid fa-chart-line"></i></div>
            <div><div style="font-size:13px;font-weight:500;">Current Status</div><div style="font-size:10px;opacity:0.6;">View & manage active tracker</div></div>
        </div>
        ${trackersHTML}
        <hr style="border:none;border-top:1px solid var(--SmartThemeBorderColor);margin:8px 0;">
        <div class="flt-menu-item" data-action="settings" style="padding:10px 12px;cursor:pointer;border-radius:6px;display:flex;align-items:center;gap:10px;opacity:0.8;"><i class="fa-solid fa-sliders" style="width:20px;text-align:center;"></i><span style="font-size:12px;">Settings</span></div>
    `;

    container.insertBefore(btn, container.firstChild);
    document.body.appendChild(menu);

    btn.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        updateMenuState();
        const rect = btn.getBoundingClientRect();
        menu.style.left = Math.max(10, rect.left) + "px";
        menu.style.bottom = (window.innerHeight - rect.top + 8) + "px";
        menu.style.display = menu.style.display === "block" ? "none" : "block";
    });

    menu.querySelectorAll(".flt-menu-item").forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault(); e.stopPropagation();
            menu.style.display = "none";
            const action = item.dataset.action;
            if (action === "tracker") showTrackerForm(item.dataset.tracker);
            else if (action === "status") showStatusPopup();
            else if (action === "settings") showSettingsPopup();
        });
        item.addEventListener("mouseenter", () => item.style.background = "color-mix(in srgb, var(--SmartThemeAccent) 15%, transparent)");
        item.addEventListener("mouseleave", () => item.style.background = item.dataset.action === 'status' && state.active ? "color-mix(in srgb,var(--SmartThemeAccent) 10%,transparent)" : "");
    });

    document.addEventListener("click", (e) => { if (!btn.contains(e.target) && !menu.contains(e.target)) menu.style.display = "none"; });

    return true;
}

/* ═══════════════════════════════════════════════════════════════
   EVENTS & INIT
   ═══════════════════════════════════════════════════════════════ */

eventSource.on(event_types.MESSAGE_RECEIVED, (messageIndex) => { if (state.active) setTimeout(() => processAIResponse(messageIndex), 150); });
eventSource.on(event_types.MESSAGE_SWIPED, () => { if (state.active) updateSystemPrompt(); });
eventSource.on(event_types.CHAT_CHANGED, () => { loadState(); setTimeout(() => { if (state.active) updateSystemPrompt(); renderAllTrackers(); updateMenuState(); }, 500); });

jQuery(() => {
    loadSettings();
    loadState();

    setTimeout(() => { addMenu(); if (state.active) updateSystemPrompt(); renderAllTrackers(); updateMenuState(); }, 1000);
    setTimeout(() => { addMenu(); renderAllTrackers(); updateMenuState(); }, 3000);

    const style = document.createElement('style');
    style.textContent = `
        @keyframes flt-toastIn { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes flt-toastOut { from { opacity: 1; transform: translate(-50%, 0); } to { opacity: 0; transform: translate(-50%, -20px); } }
        @keyframes flt-bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
        .flt-tracker-container { animation: flt-fadeIn 0.3s ease; }
        @keyframes flt-fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);

    console.log("Fawn's Life Tracker: Ready!");
});
