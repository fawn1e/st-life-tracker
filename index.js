/* ═══════════════════════════════════════════════════════════════
   FAWN'S LIFE TRACKER v2.2 - COMPLETE
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

const TRACKERS = {
    conception: { id: 'conception', name: 'Conception Roll', icon: 'fa-solid fa-dice', color: '#9b59b6', description: 'Roll for pregnancy' },
    pregnancy: { id: 'pregnancy', name: 'Pregnancy Tracker', icon: 'fa-solid fa-person-pregnant', color: '#e91e63', description: 'Track pregnancy progress' },
    birth: { id: 'birth', name: 'Birth Report', icon: 'fa-solid fa-baby-carriage', color: '#2196f3', description: 'Record birth & baby' },
    babyCare: { id: 'babyCare', name: 'Baby Care', icon: 'fa-solid fa-baby', color: '#4caf50', description: 'Track baby needs' },
    miscarriage: { id: 'miscarriage', name: 'Loss Report', icon: 'fa-solid fa-heart-crack', color: '#6c757d', description: 'Pregnancy loss' }
};

let state = {
    active: null,
    data: {},
    history: [],
    lastMessageId: null,
    dueDate: null,
    actualGender: null,
    ultrasoundGender: null
};

let currentFormTracker = null;

function getBabies() {
    return state.data.babies || [];
}

function getCurrentBaby() {
    const babies = getBabies();
    const id = state.data.currentBabyId || 1;
    return babies.find(b => b.id === id) || babies[0] || null;
}

function addBaby(babyData) {
    if (!state.data.babies) state.data.babies = [];
    const newId = state.data.babies.length > 0
        ? Math.max(...state.data.babies.map(b => b.id)) + 1
        : 1;
    state.data.babies.push({ id: newId, ...babyData });
    state.data.currentBabyId = newId;
    state.active = 'babyCare';  // ← ДОБАВЬ ЭТУ СТРОКУ!
    saveState();
    return newId;
}

function updateBaby(id, babyData) {
    if (!state.data.babies) return;
    const idx = state.data.babies.findIndex(b => b.id === id);
    if (idx >= 0) {
        state.data.babies[idx] = { ...state.data.babies[idx], ...babyData };
        saveState();
    }
}

function removeBaby(id) {
    if (!state.data.babies) return;
    state.data.babies = state.data.babies.filter(b => b.id !== id);
    if (state.data.currentBabyId === id) {
        state.data.currentBabyId = state.data.babies[0]?.id || null;
    }
    saveState();
}

function selectBaby(id) {
    state.data.currentBabyId = id;
    saveState();
}

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

function calculateDueDate(fromDate, weeksPregnant = 0) {
    const d = fromDate ? new Date(fromDate) : new Date();
    const daysToAdd = 280 - (weeksPregnant * 7);
    d.setDate(d.getDate() + daysToAdd);
    return d;
}

function showToast(message, type = 'success') {
    document.querySelectorAll('.flt-toast').forEach(t => t.remove());
    const colors = { success: '#4caf50', warning: '#f4a261', error: '#e76f51', info: '#2196f3' };
    const toast = document.createElement('div');
    toast.className = 'flt-toast';
    toast.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i> ${message}`;
    toast.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);background:var(--SmartThemeBlurTintColor);border:1px solid var(--SmartThemeBorderColor);border-left:3px solid ${colors[type]};border-radius:6px;padding:8px 16px;z-index:10001;display:flex;align-items:center;gap:8px;box-shadow:0 2px 10px rgba(0,0,0,0.2);color:var(--SmartThemeBodyColor);font-size:13px;animation:flt-toastIn 0.3s ease;`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'flt-toastOut 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); }, 2500);
}

function btn(id, icon, text, primary = false, danger = false) {
    const m = window.innerWidth <= 768;
    let bg = 'transparent', color = 'var(--SmartThemeBodyColor)', border = '1px solid var(--SmartThemeBorderColor)';
    if (danger) { bg = '#e76f51'; color = 'white'; border = 'none'; }
    else if (primary) { bg = 'var(--SmartThemeButtonColor)'; color = 'var(--SmartThemeButtonTextColor)'; border = 'none'; }
    return `<button id="${id}" style="background:${bg};color:${color};padding:${m ? '14px 20px' : '10px 16px'};border-radius:${m ? '8px' : '6px'};border:${border};font-size:${m ? '15px' : '13px'};cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;${m ? 'width:100%;' : 'flex:1;min-width:100px;'}"><i class="${icon}"></i> ${text}</button>`;
}

function btnRow(...buttons) {
    const m = window.innerWidth <= 768;
    return `<div style="display:flex;gap:${m ? '10px' : '8px'};justify-content:center;margin-top:${m ? '20px' : '16px'};${m ? 'flex-direction:column;' : ''}">${buttons.join('')}</div>`;
}

function modeButton(id, icon, title, subtitle, isActive = false, color = '#9b59b6') {
    const m = window.innerWidth <= 768;
    return `<button type="button" id="${id}" class="flt-mode-btn" style="flex:1;padding:${m ? '16px 12px' : '14px 10px'};border-radius:10px;border:2px solid ${isActive ? color : 'var(--SmartThemeBorderColor)'};background:${isActive ? `color-mix(in srgb,${color} 20%,transparent)` : 'transparent'};color:${isActive ? color : 'var(--SmartThemeBodyColor)'};font-size:${m ? '14px' : '13px'};cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;opacity:${isActive ? '1' : '0.6'};transition:all 0.2s;"><i class="${icon}" style="font-size:${m ? '22px' : '20px'};"></i><span style="font-weight:bold;font-size:${m ? '13px' : '12px'};">${title}</span><span style="font-size:${m ? '11px' : '10px'};opacity:0.7;">${subtitle}</span></button>`;
}

function dateModeButton(mode, icon, label, isActive = false) {
    const m = window.innerWidth <= 768;
    return `<button type="button" class="flt-date-mode" data-datemode="${mode}" style="flex:1;padding:${m ? '12px 8px' : '10px 8px'};border-radius:8px;border:2px solid ${isActive ? 'var(--SmartThemeAccent)' : 'var(--SmartThemeBorderColor)'};background:${isActive ? 'color-mix(in srgb,var(--SmartThemeAccent) 15%,transparent)' : 'transparent'};color:var(--SmartThemeBodyColor);font-size:${m ? '12px' : '11px'};cursor:pointer;opacity:${isActive ? '1' : '0.6'};transition:all 0.2s;"><i class="${icon}"></i> ${label}</button>`;
}

function formField(label, inputHtml, icon = null) {
    const m = window.innerWidth <= 768;
    return `<div style="margin-bottom:${m ? '16px' : '12px'};"><label style="font-size:${m ? '13px' : '12px'};opacity:0.7;display:flex;align-items:center;gap:6px;margin-bottom:6px;">${icon ? `<i class="${icon}" style="opacity:0.6;"></i>` : ''} ${label}</label>${inputHtml}</div>`;
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

function closePopup() {
    const popup = document.getElementById("flt-popup");
    if (popup) popup.remove();
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    currentFormTracker = null;
}

function createPopup(content, width = "500px") {
    closePopup();
    const m = window.innerWidth <= 768;
    const popup = document.createElement("div");
    popup.id = "flt-popup";
    popup.innerHTML = `<div id="flt-popup-bg" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99998;"></div><div id="flt-popup-content" style="position:fixed;top:${m ? '20px' : '50%'};left:50%;transform:${m ? 'translateX(-50%)' : 'translate(-50%,-50%)'};width:${m ? 'calc(100vw - 40px)' : `min(${width}, 90vw)`};max-height:${m ? 'calc(100vh - 40px)' : '85vh'};background:var(--SmartThemeBlurTintColor);border:1px solid var(--SmartThemeBorderColor);border-radius:12px;padding:${m ? '20px 16px' : '20px'};z-index:99999;box-sizing:border-box;overflow-y:auto;box-shadow:0 10px 30px rgba(0,0,0,0.3);">${content}</div>`;
    document.body.appendChild(popup);
    document.body.style.overflow = 'hidden';
    if (m) { document.body.style.position = 'fixed'; document.body.style.width = '100%'; }
    document.getElementById("flt-popup-bg").addEventListener("click", closePopup);
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { closePopup(); document.removeEventListener('keydown', esc); } });
    return popup;
}

function generateSystemPrompt() {
    if (!state.active) return '';
    const d = state.data;
    let prompt = `[OOC: LIFE TRACKER ACTIVE - ${state.active.toUpperCase()}]\nAt END of response, include: [TRACKER:type|field=value|...]\n\n`;

    switch (state.active) {
        case 'conception':
            prompt += d.mode === 'ai' ? `CONCEPTION - AI DECIDES based on context.\n` : `CONCEPTION - Result: ${d.result || 'Pending'}\n${d.result === 'Yes' ? 'Character NOW PREGNANT but may not know.' : ''}\n`;
            prompt += `[TRACKER:conception|roll=${d.roll || '??'}|threshold=${d.threshold || '??'}|result=${d.result || '??'}|dueDate=${d.dueDate || '??'}]`;
            break;
        case 'pregnancy':
            const week = parseInt(d.week) || 1;
            prompt += `PREGNANCY - Week ${week}, Size: ${BABY_SIZES[week] || '??'}\nUpdate: symptoms, risks, risksDetails, nextVisit, testsNeeded\n`;
            prompt += `[TRACKER:pregnancy|week=${week}|size=${BABY_SIZES[week] || '??'}|knowledge=${d.knowledge || '??'}|ultrasoundGender=${d.ultrasoundGender || '??'}|symptoms=??|risks=${d.risks || 'Stable'}|risksDetails=${d.risksDetails || ''}|nextVisit=${d.nextVisit || '??'}|testsNeeded=${d.testsNeeded || '??'}|dueDate=${d.dueDate || '??'}]`;
            break;
        case 'birth':
            prompt += `BIRTH - Generate: name, gender, weight, height, apgar, health, features, pathology\n`;
            prompt += `[TRACKER:birth|name=??|gender=??|weight=??|height=??|apgar=??|health=??|features=??|pathology=??|time=??]`;
            break;
        case 'babyCare':
            prompt += `BABY CARE - ${d.name || 'Baby'}\nUpdate: hunger, hygiene, energy, mood, health, milestone\n`;
            prompt += `[TRACKER:babyCare|name=${d.name || '??'}|age=${d.age || '??'}|hunger=??|hygiene=??|energy=??|mood=??|health=??|milestone=??]`;
            break;
        case 'miscarriage':
            prompt += `PREGNANCY LOSS - Week ${d.week || '??'}. Handle sensitively.\n`;
            prompt += `[TRACKER:miscarriage|week=${d.week || '??'}|cause=??|physical=??|medicalCare=??]`;
            break;
    }
    return prompt + '\n[/OOC]';
}

function updateSystemPrompt() {
    setExtensionPrompt('fawn-life-tracker', generateSystemPrompt(), extension_prompt_types.IN_CHAT, 0, true, true, null, extension_prompt_roles.SYSTEM);
}

function clearSystemPrompt() {
    setExtensionPrompt('fawn-life-tracker', '', extension_prompt_types.IN_CHAT, 0, true, true, null, extension_prompt_roles.SYSTEM);
}

function generateTrackerHTML(trackerId, data) {
    const m = window.innerWidth <= 768;
    const baseStyle = `font-family:'Courier New',monospace;font-size:${m ? '0.8em' : '0.85em'};color:var(--SmartThemeBodyColor);`;
    switch ((trackerId || '').toLowerCase()) {
        case 'conception': return genConceptionHTML(data, baseStyle);
        case 'pregnancy': return genPregnancyHTML(data, baseStyle, m);
        case 'birth': return genBirthHTML(data, baseStyle, m);
        case 'babycare': return genBabyCareHTML(data, baseStyle, m);
        case 'miscarriage': return genMiscarriageHTML(data, baseStyle, m);
        default: return '<div style="opacity:0.5;text-align:center;padding:20px;">Select a tracker</div>';
    }
}

function genConceptionHTML(d, baseStyle) {
    const mode = d.mode || 'roll';
    const isYes = (d.result || '').toLowerCase() === 'yes';
    const isPending = !d.result || d.result === '' || d.result === '??';
    const color = isPending ? '#9b59b6' : (isYes ? '#4caf50' : '#e76f51');
    let resultText = mode === 'ai' && isPending ? '<span style="opacity:0.7;">AI will decide...</span>' : isPending ? '<span style="opacity:0.7;">Roll the dice!</span>' : `<span style="color:${color};font-weight:bold;">${isYes ? '✓ CONCEIVED' : '✗ NOT THIS TIME'}</span>`;
    return `<div style="${baseStyle}padding:12px;text-align:center;border:1px dashed var(--SmartThemeBorderColor);border-radius:8px;"><div style="opacity:0.7;font-size:0.9em;margin-bottom:8px;"><i class="fa-solid fa-${mode === 'ai' ? 'wand-magic-sparkles' : 'dice'}"></i> CONCEPTION ${mode === 'ai' ? '(AI)' : 'ROLL'}</div>${mode !== 'ai' && d.roll ? `<div style="font-size:1.5em;margin-bottom:8px;"><span style="color:var(--SmartThemeAccent);font-weight:bold;">${d.roll}</span><span style="opacity:0.4;font-size:0.6em;"> / ${d.threshold || 20}</span></div>` : ''}<div style="font-size:1.1em;margin-bottom:8px;">${resultText}</div>${isYes && d.dueDate && d.dueDate !== '??' ? `<div style="font-size:0.85em;opacity:0.7;"><i class="fa-regular fa-calendar"></i> Due: ${d.dueDate}</div>` : ''}</div>`;
}

function genPregnancyHTML(d, baseStyle, m) {
    const week = d.week || '??';
    const size = d.size || BABY_SIZES[parseInt(week)] || '??';
    const riskColors = { 'Stable': '#4caf50', 'Mild Concern': '#8bc34a', 'Moderate Risk': '#f4a261', 'High Risk': '#e76f51', 'Critical': '#dc3545' };
    const riskColor = riskColors[d.risks] || '#4caf50';
    return `<div style="${baseStyle}background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;padding:12px;">
        <div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:10px;padding-bottom:8px;font-weight:bold;color:#e91e63;text-transform:uppercase;letter-spacing:1px;"><i class="fa-solid fa-person-pregnant"></i> Pregnancy <span style="font-size:0.7em;opacity:0.7;">• ${d.knowledge || 'Hidden'}</span></div>
        <div style="display:grid;grid-template-columns:${m ? '1fr 1fr' : 'repeat(4, 1fr)'};gap:8px;margin-bottom:10px;">
            <div><span style="opacity:0.5;font-size:0.85em;">Week</span><br><strong>${week}</strong></div>
            <div><span style="opacity:0.5;font-size:0.85em;">Size</span><br><strong>${size}</strong></div>
            <div><span style="opacity:0.5;font-size:0.85em;">Due</span><br><strong>${d.dueDate || '??'}</strong></div>
            <div><span style="opacity:0.5;font-size:0.85em;">Gender</span><br><strong>${d.ultrasoundGender || '??'}</strong></div>
        </div>
        ${d.fetalCount && d.fetalCount !== '1' && d.fetalCount !== 'Unknown' ? `<div style="padding:6px 8px;background:color-mix(in srgb,#9b59b6 15%,transparent);border-radius:6px;margin-bottom:10px;font-size:0.9em;"><i class="fa-solid fa-baby" style="color:#9b59b6;"></i> ${d.fetalCount === '2' ? 'Twins' : d.fetalCount === '3' ? 'Triplets' : d.fetalCount}</div>` : ''}
        ${d.symptoms ? `<div style="padding:8px;background:color-mix(in srgb,var(--SmartThemeBodyColor) 3%,transparent);border-radius:6px;margin-bottom:10px;font-size:0.9em;"><i class="fa-solid fa-head-side-virus" style="opacity:0.5;"></i> ${d.symptoms}</div>` : ''}
        ${d.nextVisit || d.testsNeeded || d.visitType ? `<div style="padding:8px;background:color-mix(in srgb,#2196f3 10%,transparent);border-radius:6px;margin-bottom:10px;font-size:0.9em;"><i class="fa-solid fa-calendar-check" style="color:#2196f3;"></i> ${d.nextVisit ? `Next: ${d.nextVisit}` : ''}${d.visitType ? ` (${d.visitType})` : ''}${(d.nextVisit || d.visitType) && d.testsNeeded ? ' • ' : ''}${d.testsNeeded ? `Tests: ${d.testsNeeded}` : ''}</div>` : ''}
        ${d.medications ? `<div style="padding:8px;background:color-mix(in srgb,#4caf50 10%,transparent);border-radius:6px;margin-bottom:10px;font-size:0.9em;"><i class="fa-solid fa-pills" style="color:#4caf50;"></i> ${d.medications}</div>` : ''}
        ${d.doctorAdvice ? `<div style="padding:8px;background:color-mix(in srgb,#ff9800 10%,transparent);border-radius:6px;margin-bottom:10px;font-size:0.9em;"><i class="fa-solid fa-user-doctor" style="color:#ff9800;"></i> ${d.doctorAdvice}${d.adviceFollowed && d.adviceFollowed !== 'N/A' ? `<div style="margin-top:4px;font-size:0.85em;opacity:0.8;"><i class="fa-solid fa-clipboard-check"></i> ${d.adviceFollowed}</div>` : ''}</div>` : ''}
        <div style="padding:8px 10px;background:color-mix(in srgb,${riskColor} 15%,transparent);border-left:3px solid ${riskColor};border-radius:0 6px 6px 0;">
            <span style="color:${riskColor};font-weight:bold;"><i class="fa-solid fa-heart-pulse"></i> ${d.risks || 'Stable'}</span>
            ${d.riskType && d.riskType !== '' ? `<div style="font-size:0.85em;opacity:0.9;margin-top:4px;">${d.riskType === 'other' ? (d.riskTypeCustom || 'Other') : d.riskType}</div>` : ''}
            ${d.risksDetails ? `<div style="font-size:0.85em;opacity:0.8;margin-top:4px;">${d.risksDetails}</div>` : ''}
        </div>
    </div>`;
}

function genBirthHTML(d, baseStyle, m) {
    const healthColors = { 'Healthy': '#4caf50', 'Needs Observation': '#f4a261', 'NICU Required': '#e76f51', 'Critical': '#dc3545' };
    const healthColor = healthColors[d.health] || '#4caf50';
    const displayGender = d.gender === 'other' ? (d.genderCustom || 'Other') : (d.gender || '??');
    const displayPathology = d.pathology === 'other' ? (d.pathologyCustom || 'Other') : (d.pathology || 'None');
    return `<div style="${baseStyle}background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;padding:12px;border-left:4px solid #2196f3;">
        <div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:10px;padding-bottom:8px;font-weight:bold;color:#2196f3;text-transform:uppercase;"><i class="fa-solid fa-baby-carriage"></i> Birth Report ${d.name ? `— ${d.name}` : ''}</div>
        <div style="display:grid;grid-template-columns:${m ? '1fr 1fr' : 'repeat(4, 1fr)'};gap:10px;margin-bottom:10px;">
            <div><i class="fa-solid fa-venus-mars" style="opacity:0.5;"></i> <strong>${displayGender}</strong></div>
            <div><i class="fa-solid fa-weight-scale" style="opacity:0.5;"></i> <strong>${d.weight || '??'}${d.weight && d.weight !== '??' ? ' kg' : ''}</strong></div>
            <div><i class="fa-solid fa-ruler-vertical" style="opacity:0.5;"></i> <strong>${d.height || '??'}${d.height && d.height !== '??' ? ' cm' : ''}</strong></div>
            <div><i class="fa-solid fa-clock" style="opacity:0.5;"></i> <strong>${d.time || '??'}</strong></div>
        </div>
        ${d.apgar ? `<div style="font-size:0.9em;margin-bottom:8px;"><i class="fa-solid fa-chart-simple" style="opacity:0.5;"></i> APGAR: <strong style="color:${parseInt(d.apgar) >= 7 ? '#4caf50' : '#e76f51'};">${d.apgar}/10</strong></div>` : ''}
        ${d.features ? `<div style="padding:8px;background:color-mix(in srgb,var(--SmartThemeBodyColor) 3%,transparent);border-radius:6px;margin-bottom:8px;font-size:0.9em;"><i class="fa-solid fa-dna" style="opacity:0.5;"></i> ${d.features}</div>` : ''}
        ${d.temperament ? `<div style="font-size:0.9em;margin-bottom:8px;"><i class="fa-solid fa-brain" style="opacity:0.5;"></i> ${d.temperament}</div>` : ''}
        ${displayPathology && displayPathology !== 'None' && displayPathology !== 'None Detected' ? `<div style="padding:8px;background:color-mix(in srgb,#e76f51 10%,transparent);border-radius:6px;margin-bottom:8px;font-size:0.9em;color:#e76f51;"><i class="fa-solid fa-notes-medical"></i> ${displayPathology}</div>` : ''}
        <div style="padding:8px;background:color-mix(in srgb,${healthColor} 15%,transparent);border-radius:6px;text-align:center;"><i class="fa-solid fa-heart-pulse"></i> ${d.health || 'Checking...'}</div>
    </div>`;
}

function genBabyCareHTML(d, baseStyle, m) {
    const babies = d.babies || [];

    if (babies.length === 0) {
        return `<div style="${baseStyle}padding:20px;text-align:center;opacity:0.6;">
            <i class="fa-solid fa-baby" style="font-size:30px;margin-bottom:10px;display:block;"></i>
            No babies registered
        </div>`;
    }

    const moodEmoji = { 'Happy': '😊', 'Content': '😌', 'Fussy': '😣', 'Crying': '😭', 'Sleeping': '😴' };
    const healthColors = { 'Healthy': '#4caf50', 'Mild Cold': '#8bc34a', 'Fever': '#e76f51', 'Teething': '#f4a261', 'Colic': '#f4a261', 'Needs Attention': '#e76f51', 'Under Treatment': '#2196f3' };

    return babies.map(baby => {
        const healthColor = healthColors[baby.health] || '#4caf50';

        return `<div style="${baseStyle}background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;padding:12px;margin-bottom:10px;">
            <div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:10px;padding-bottom:8px;font-weight:bold;color:#4caf50;text-transform:uppercase;"><i class="fa-solid fa-baby"></i> ${baby.name || 'Baby'} <span style="font-weight:normal;opacity:0.7;text-transform:none;font-size:0.85em;">• ${baby.age || 'Newborn'}</span></div>

            <div style="display:grid;grid-template-columns:${m ? '1fr 1fr' : 'repeat(4, 1fr)'};gap:8px;margin-bottom:10px;">
                <div><i class="fa-solid fa-utensils" style="opacity:0.5;"></i> ${baby.hunger || '??'}</div>
                <div><i class="fa-solid fa-soap" style="opacity:0.5;"></i> ${baby.hygiene || '??'}</div>
                <div><i class="fa-solid fa-bed" style="opacity:0.5;"></i> ${baby.energy || '??'}</div>
                <div>${moodEmoji[baby.mood] || '😶'} ${baby.mood || '??'}</div>
            </div>

            ${baby.health && baby.health !== 'Healthy' ? `<div style="padding:6px 8px;background:color-mix(in srgb,${healthColor} 15%,transparent);border-radius:6px;margin-bottom:10px;font-size:0.9em;color:${healthColor};"><i class="fa-solid fa-heart-pulse"></i> ${baby.health}</div>` : ''}

            ${baby.feeding ? `<div style="padding:6px 8px;background:color-mix(in srgb,var(--SmartThemeBodyColor) 3%,transparent);border-radius:6px;margin-bottom:10px;font-size:0.9em;"><i class="fa-solid fa-bottle-water" style="opacity:0.5;"></i> ${baby.feeding}</div>` : ''}

            ${baby.nextCheckup || baby.visitType || baby.vaccinations ? `<div style="padding:8px;background:color-mix(in srgb,#2196f3 10%,transparent);border-radius:6px;margin-bottom:10px;font-size:0.9em;"><i class="fa-solid fa-calendar-check" style="color:#2196f3;"></i> ${baby.nextCheckup ? `Next: ${baby.nextCheckup}` : ''}${baby.visitType ? ` (${baby.visitType})` : ''}${baby.vaccinations ? `<div style="margin-top:4px;"><i class="fa-solid fa-syringe" style="opacity:0.6;"></i> ${baby.vaccinations}</div>` : ''}</div>` : ''}

            ${baby.medications ? `<div style="padding:8px;background:color-mix(in srgb,#4caf50 10%,transparent);border-radius:6px;margin-bottom:10px;font-size:0.9em;"><i class="fa-solid fa-pills" style="color:#4caf50;"></i> ${baby.medications}</div>` : ''}

            ${baby.doctorAdvice ? `<div style="padding:8px;background:color-mix(in srgb,#ff9800 10%,transparent);border-radius:6px;margin-bottom:10px;font-size:0.9em;"><i class="fa-solid fa-user-doctor" style="color:#ff9800;"></i> ${baby.doctorAdvice}</div>` : ''}

            ${baby.milestone ? `<div style="padding:8px;background:color-mix(in srgb,#9b59b6 15%,transparent);border-radius:6px;font-size:0.9em;"><i class="fa-solid fa-trophy" style="color:#9b59b6;"></i> ${baby.milestone}</div>` : ''}
        </div>`;
    }).join('');
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

function parseTrackerFromText(text) {
    const match = text.match(/\[TRACKER:(\w+)\|([^\]]+)\]/i);
    if (!match) return null;
    const trackerId = match[1].toLowerCase();
    const data = {};
    match[2].split('|').forEach(pair => {
        const eq = pair.indexOf('=');
        if (eq > 0) { const key = pair.substring(0, eq).trim(); const value = pair.substring(eq + 1).trim(); if (key && value && value !== '??') data[key] = value; }
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
    const preserveKeys = ['mode', 'dateMode', 'loreDate', 'loreStartDate'];
    const preserved = {};
    preserveKeys.forEach(k => { if (state.data[k]) preserved[k] = state.data[k]; });
    if (parsed.trackerId !== state.active) state.active = parsed.trackerId;
    state.data = { ...state.data, ...parsed.data, ...preserved };
    state.lastMessageId = messageIndex;
    state.history.push({ type: parsed.trackerId, data: { ...state.data }, messageId: messageIndex, timestamp: Date.now() });
    saveState();
    saveTrackerDisplay(messageIndex, parsed.trackerId, state.data);
    setTimeout(() => renderTracker(messageIndex), 100);
    updateSystemPrompt();
    updateMenuState();
}

function getDisplayKey() { return `flt_display_${getCurrentChatId()}`; }
function saveTrackerDisplay(messageId, trackerId, data) { try { localStorage.setItem(getDisplayKey(), JSON.stringify({ messageId, trackerId, data })); } catch (e) { } }
function loadTrackerDisplay() { try { const s = localStorage.getItem(getDisplayKey()); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function removeOldTrackerDisplay() { document.querySelectorAll('.flt-tracker-container').forEach(el => el.remove()); try { localStorage.removeItem(getDisplayKey()); } catch (e) { } }

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

function showTrackerForm(trackerId) {
    const tracker = TRACKERS[trackerId];
    if (!tracker) return;
    currentFormTracker = trackerId;
    const m = window.innerWidth <= 768;
    const savedData = (state.active === trackerId || trackerId === 'babyCare') ? state.data : {};
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
            <div style="flex:1;"><div style="font-size:${m ? '18px' : '16px'};font-weight:bold;color:var(--SmartThemeBodyColor);">${tracker.name}</div><div style="font-size:${m ? '12px' : '11px'};opacity:0.6;">${tracker.description}</div></div>
        </div>
        <div style="background:color-mix(in srgb,var(--SmartThemeAccent) 10%,transparent);border-left:3px solid var(--SmartThemeAccent);padding:10px 12px;border-radius:0 8px 8px 0;margin-bottom:${m ? '20px' : '16px'};font-size:${m ? '13px' : '12px'};"><i class="fa-solid fa-magic-wand-sparkles"></i> Fill what you want — AI handles the rest!</div>
        <form id="flt-form" data-tracker="${trackerId}">${formContent}</form>
        <div style="background:color-mix(in srgb,var(--SmartThemeBodyColor) 3%,transparent);border:1px dashed var(--SmartThemeBorderColor);border-radius:8px;padding:12px;margin:${m ? '20px' : '16px'} 0;">
            <div style="font-size:11px;text-transform:uppercase;color:var(--SmartThemeAccent);margin-bottom:10px;"><i class="fa-solid fa-eye"></i> Preview</div>
            <div id="flt-preview">${generateTrackerHTML(trackerId, savedData)}</div>
        </div>
        ${btnRow(btn('flt-start', 'fa-solid fa-play', 'Start Tracking', true), btn('flt-cancel', 'fa-solid fa-xmark', 'Cancel'))}
    `;
    createPopup(content, "650px");
const form = document.getElementById('flt-form');
if (form) {
    form.addEventListener('input', () => updatePreview(currentFormTracker));
    form.addEventListener('change', () => updatePreview(currentFormTracker));
}
    setupTrackerHandlers(trackerId, savedData);
    document.getElementById('flt-start').addEventListener('click', () => { startTracker(trackerId, getFormData()); });
    document.getElementById('flt-cancel').addEventListener('click', closePopup);
    const menu = document.getElementById("flt-menu");
    if (menu) menu.style.display = "none";
}

function buildConceptionForm(data) {
    const m = window.innerWidth <= 768;
    const threshold = data.threshold || extension_settings[extensionName].conceptionThreshold || 20;
    const mode = data.mode || 'roll';
    const dateMode = data.dateMode || 'ai';
    return `
        <div style="display:flex;gap:${m ? '10px' : '12px'};margin-bottom:20px;${m ? 'flex-direction:column;' : ''}">${modeButton('flt-mode-roll', 'fa-solid fa-dice', 'Roll Dice', 'You control odds', mode === 'roll', '#9b59b6')}${modeButton('flt-mode-ai', 'fa-solid fa-wand-magic-sparkles', 'AI Decides', 'Story-driven', mode === 'ai', '#9b59b6')}</div>
        <div id="flt-roll-section" style="display:${mode === 'roll' ? 'block' : 'none'};text-align:center;padding:15px;border:1px dashed var(--SmartThemeBorderColor);border-radius:10px;margin-bottom:20px;">
            <div style="margin-bottom:15px;"><label style="font-size:13px;opacity:0.7;display:block;margin-bottom:8px;">Conception Chance</label><input type="range" id="flt-threshold" name="threshold" min="1" max="100" value="${threshold}" style="width:80%;max-width:250px;"><div id="flt-threshold-display" style="font-size:28px;color:#9b59b6;font-weight:bold;margin-top:5px;">${threshold}%</div></div>
            <button type="button" id="flt-roll-btn" style="background:#9b59b6;color:white;padding:${m ? '16px 30px' : '14px 30px'};border-radius:10px;border:none;font-size:${m ? '16px' : '15px'};cursor:pointer;"><i class="fa-solid fa-dice"></i> Roll!</button>
            <div id="flt-roll-result" style="margin-top:20px;display:${data.roll ? 'block' : 'none'};">${data.roll ? `<div style="font-size:36px;color:${data.result === 'Yes' ? '#4caf50' : '#e76f51'};font-weight:bold;">${data.roll}</div><div style="font-size:14px;opacity:0.6;">needed ≤ ${data.threshold || threshold}</div><div style="font-size:16px;margin-top:8px;color:${data.result === 'Yes' ? '#4caf50' : '#e76f51'};">${data.result === 'Yes' ? '✓ Conceived!' : '✗ Not this time'}</div>` : ''}</div>
        </div>
        <div id="flt-ai-section" style="display:${mode === 'ai' ? 'block' : 'none'};text-align:center;padding:20px;border:1px dashed var(--SmartThemeBorderColor);border-radius:10px;margin-bottom:20px;"><div style="font-size:40px;margin-bottom:10px;">🎭</div><div style="font-size:${m ? '14px' : '13px'};opacity:0.8;">AI will decide based on scene context</div></div>
        <hr style="border:none;border-top:1px dashed var(--SmartThemeBorderColor);margin:20px 0;">
        <div style="margin-bottom:15px;"><label style="font-size:${m ? '14px' : '13px'};opacity:0.8;display:flex;align-items:center;gap:8px;margin-bottom:12px;"><i class="fa-solid fa-calendar"></i> Due Date</label>
            <div style="display:flex;gap:8px;margin-bottom:12px;${m ? 'flex-wrap:wrap;' : ''}">${dateModeButton('ai', 'fa-solid fa-robot', 'AI calculates', dateMode === 'ai')}${dateModeButton('system', 'fa-solid fa-clock', 'From now', dateMode === 'system')}${dateModeButton('lore', 'fa-solid fa-book', 'Lore date', dateMode === 'lore')}${dateModeButton('manual', 'fa-solid fa-pen', 'Manual', dateMode === 'manual')}</div>
            <div id="flt-date-ai" style="display:${dateMode === 'ai' ? 'block' : 'none'};padding:10px;background:color-mix(in srgb,var(--SmartThemeAccent) 10%,transparent);border-radius:8px;font-size:12px;"><i class="fa-solid fa-info-circle"></i> AI will calculate due date based on your world's calendar</div>
            <div id="flt-date-system" style="display:${dateMode === 'system' ? 'block' : 'none'};padding:10px;background:color-mix(in srgb,var(--SmartThemeAccent) 10%,transparent);border-radius:8px;font-size:12px;"><i class="fa-solid fa-info-circle"></i> Due date: <strong>${formatDate(calculateDueDate())}</strong> (280 days from now)</div>
            <div id="flt-date-lore" style="display:${dateMode === 'lore' ? 'block' : 'none'};margin-top:10px;"><input type="text" name="loreDate" value="${data.loreDate || ''}" placeholder="e.g., March 15, Year 847" style="width:100%;padding:${m ? '12px' : '10px'};background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);font-size:${m ? '14px' : '13px'};box-sizing:border-box;"><div style="font-size:11px;opacity:0.5;margin-top:6px;">AI adds 280 days to this date</div></div>
            <div id="flt-date-manual" style="display:${dateMode === 'manual' ? 'block' : 'none'};margin-top:10px;"><input type="text" name="dueDate" value="${data.dueDate || ''}" placeholder="e.g., December 20, Year 847" style="width:100%;padding:${m ? '12px' : '10px'};background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);font-size:${m ? '14px' : '13px'};box-sizing:border-box;"></div>
        </div>
        <input type="hidden" name="mode" id="flt-mode" value="${mode}"><input type="hidden" name="dateMode" id="flt-date-mode" value="${dateMode}"><input type="hidden" name="roll" id="flt-roll" value="${data.roll || ''}"><input type="hidden" name="result" id="flt-result" value="${data.result || ''}">
    `;
}

function buildPregnancyForm(data) {
    const m = window.innerWidth <= 768;
    const dateMode = data.dateMode || 'ai';
    const week = data.week || '';
    return `
        <div style="margin-bottom:20px;"><label style="font-size:${m ? '14px' : '13px'};opacity:0.8;display:flex;align-items:center;gap:8px;margin-bottom:12px;"><i class="fa-solid fa-calendar"></i> Due Date Calculation</label>
            <div style="display:flex;gap:8px;margin-bottom:12px;${m ? 'flex-wrap:wrap;' : ''}">${dateModeButton('ai', 'fa-solid fa-robot', 'AI decides', dateMode === 'ai')}${dateModeButton('system', 'fa-solid fa-clock', 'Auto (real time)', dateMode === 'system')}${dateModeButton('lore', 'fa-solid fa-book', 'From lore date', dateMode === 'lore')}${dateModeButton('manual', 'fa-solid fa-pen', 'Set manually', dateMode === 'manual')}</div>
            <div id="flt-date-ai" style="display:${dateMode === 'ai' ? 'block' : 'none'};padding:10px;background:color-mix(in srgb,var(--SmartThemeAccent) 10%,transparent);border-radius:8px;font-size:12px;"><i class="fa-solid fa-info-circle"></i> AI will determine due date based on story context</div>
            <div id="flt-date-system" style="display:${dateMode === 'system' ? 'block' : 'none'};padding:10px;background:color-mix(in srgb,var(--SmartThemeAccent) 10%,transparent);border-radius:8px;font-size:12px;"><i class="fa-solid fa-info-circle"></i> Calculated from current week: <strong id="flt-system-due">${week ? formatDate(calculateDueDate(new Date(), parseInt(week))) : '(enter week first)'}</strong></div>
            <div id="flt-date-lore" style="display:${dateMode === 'lore' ? 'block' : 'none'};margin-top:10px;"><input type="text" name="loreStartDate" value="${data.loreStartDate || ''}" placeholder="Pregnancy started: e.g., January 1, Year 847" style="width:100%;padding:${m ? '12px' : '10px'};background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);font-size:${m ? '14px' : '13px'};box-sizing:border-box;"><div style="font-size:11px;opacity:0.5;margin-top:6px;">AI calculates due date from this + remaining weeks</div></div>
            <div id="flt-date-manual" style="display:${dateMode === 'manual' ? 'block' : 'none'};margin-top:10px;"><input type="text" name="dueDate" value="${data.dueDate || ''}" placeholder="Due date: e.g., October 8, Year 847" style="width:100%;padding:${m ? '12px' : '10px'};background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);font-size:${m ? '14px' : '13px'};box-sizing:border-box;"></div>
        </div>
        <hr style="border:none;border-top:1px dashed var(--SmartThemeBorderColor);margin:20px 0;">
        ${formGrid(2, `${formField('Current Week (1-42)', numberInput('week', data.week || '', '1', '42', 'Week of pregnancy'), 'fa-solid fa-calendar-week')}${formField('Knowledge', selectInput('knowledge', ['Hidden', 'Suspected', 'Confirmed'], data.knowledge || 'Hidden'), 'fa-solid fa-eye')}`)}
        ${formGrid(2, `${formField('Ultrasound Gender', selectInput('ultrasoundGender', ['Unknown', 'Boy', 'Girl', 'Twins (Boys)', 'Twins (Girls)', 'Twins (Mixed)', 'Unclear/Uncertain'], data.ultrasoundGender || 'Unknown'), 'fa-solid fa-venus-mars')}${formField('Fetal Count', selectInput('fetalCount', [{value: '1', label: 'Single'}, {value: '2', label: 'Twins'}, {value: '3', label: 'Triplets'}, {value: 'unknown', label: 'Unknown'}], data.fetalCount || '1'), 'fa-solid fa-baby')}`)}
        ${formField('Current Symptoms', textareaInput('symptoms', data.symptoms || '', 'Leave empty for AI to fill, or describe: nausea, fatigue, cravings...', 2), 'fa-solid fa-head-side-virus')}
        <hr style="border:none;border-top:1px dashed var(--SmartThemeBorderColor);margin:20px 0;">
        <div style="font-size:${m ? '14px' : '13px'};font-weight:bold;margin-bottom:12px;color:var(--SmartThemeBodyColor);"><i class="fa-solid fa-triangle-exclamation"></i> Risk Assessment</div>
        ${formField('Risk Level', selectInput('risks', ['Stable', 'Mild Concern', 'Moderate Risk', 'High Risk', 'Critical'], data.risks || 'Stable'), 'fa-solid fa-heart-pulse')}
        ${formField('Risk Type', selectInput('riskType', [{value: '', label: 'None / AI decides'}, 'Gestational Diabetes', 'Preeclampsia', 'Placenta Previa', 'Preterm Labor Risk', 'IUGR (Growth Restriction)', 'Multiple Pregnancy Complications', 'Maternal Age Risk', 'Previous C-Section', 'Rh Incompatibility', {value: 'other', label: 'Other (specify below)'}], data.riskType || ''), 'fa-solid fa-list-check')}
        <div id="flt-risk-other" style="display:${data.riskType === 'other' ? 'block' : 'none'};margin-bottom:${m ? '16px' : '12px'};">${textInput('riskTypeCustom', data.riskTypeCustom || '', 'Specify risk type...')}</div>
        ${formField('Risk Details / Complications', textareaInput('risksDetails', data.risksDetails || '', 'Describe specific concerns, test results, doctor notes...', 2), 'fa-solid fa-notes-medical')}
        ${formField("Doctor's Advice", textareaInput('doctorAdvice', data.doctorAdvice || '', 'Bed rest, medication, diet restrictions, activity limits...', 2), 'fa-solid fa-user-doctor')}
        ${formField('Advice Followed?', selectInput('adviceFollowed', [{value: 'N/A', label: 'N/A - No advice given'}, 'Yes - Following all advice', 'Partially - Some compliance', 'No - Ignoring advice'], data.adviceFollowed || 'N/A'), 'fa-solid fa-clipboard-check')}
        <hr style="border:none;border-top:1px dashed var(--SmartThemeBorderColor);margin:20px 0;">
        <div style="font-size:${m ? '14px' : '13px'};font-weight:bold;margin-bottom:12px;color:var(--SmartThemeBodyColor);"><i class="fa-solid fa-calendar-check"></i> Medical Schedule</div>
        ${formGrid(2, `${formField('Next Visit', textInput('nextVisit', data.nextVisit || '', 'e.g., In 2 weeks, March 20...'), 'fa-solid fa-calendar-plus')}${formField('Visit Type', selectInput('visitType', [{value: '', label: 'Regular checkup'}, 'Ultrasound', 'Blood Work', 'Glucose Test', 'Amniocentesis', 'NST (Non-Stress Test)', 'Specialist Consultation', {value: 'other', label: 'Other'}], data.visitType || ''), 'fa-solid fa-stethoscope')}`)}
        ${formField('Tests Needed', textareaInput('testsNeeded', data.testsNeeded || '', 'e.g., Glucose screening, Group B strep, blood pressure monitoring...', 2), 'fa-solid fa-vial')}
        ${formField('Medications', textInput('medications', data.medications || '', 'Prenatal vitamins, iron supplements, etc.'), 'fa-solid fa-pills')}
        <input type="hidden" name="dateMode" id="flt-date-mode" value="${dateMode}">
    `;
}

function buildBirthForm(data) {
    const m = window.innerWidth <= 768;
    return `
        ${formGrid(2, `${formField('Baby Name', textInput('name', data.name || '', 'AI can choose'), 'fa-solid fa-signature')}${formField('Gender', selectInput('gender', [{value: '', label: 'AI decides'}, 'Boy', 'Girl', 'Twins (Boys)', 'Twins (Girls)', 'Twins (Mixed)', {value: 'other', label: 'Other (specify below)'}], data.gender || ''), 'fa-solid fa-venus-mars')}`)}
        <div id="flt-gender-other" style="display:${data.gender === 'other' ? 'block' : 'none'};margin-bottom:${m ? '16px' : '12px'};">${textInput('genderCustom', data.genderCustom || '', 'Specify gender...')}</div>
        ${formGrid(2, `${formField('Weight (kg)', textInput('weight', data.weight || '', '2.5-4.5 typical'), 'fa-solid fa-weight-scale')}${formField('Height (cm)', textInput('height', data.height || '', '45-55 typical'), 'fa-solid fa-ruler-vertical')}${formField('APGAR Score (1-10)', numberInput('apgar', data.apgar || '', '1', '10', '7+ is good'), 'fa-solid fa-chart-simple')}${formField('Birth Time', textInput('time', data.time || '', 'AI can fill'), 'fa-solid fa-clock')}`)}
        ${formField('Health Status', selectInput('health', [{value: '', label: 'AI determines'}, 'Healthy', 'Needs Observation', 'NICU Required', 'Critical'], data.health || ''), 'fa-solid fa-heart-pulse')}
        <hr style="border:none;border-top:1px dashed var(--SmartThemeBorderColor);margin:20px 0;">
        <div style="font-size:${m ? '14px' : '13px'};font-weight:bold;margin-bottom:12px;color:var(--SmartThemeBodyColor);"><i class="fa-solid fa-dna"></i> Physical Features & Genetics</div>
        ${formField('Genetic Dominance', textInput('dominance', data.dominance || '', "e.g., Father's eyes, mother's hair..."), 'fa-solid fa-dna')}
        ${formField('Physical Features', textareaInput('features', data.features || '', 'Hair color, eye color, birthmarks, resemblance...', 2), 'fa-solid fa-face-smile')}
        ${formField('Temperament', textInput('temperament', data.temperament || '', 'e.g., Calm, fussy, alert, sleepy...'), 'fa-solid fa-brain')}
        <hr style="border:none;border-top:1px dashed var(--SmartThemeBorderColor);margin:20px 0;">
        <div style="font-size:${m ? '14px' : '13px'};font-weight:bold;margin-bottom:12px;color:var(--SmartThemeBodyColor);"><i class="fa-solid fa-stethoscope"></i> Medical Notes</div>
        ${formField('Pathology / Birth Defects', selectInput('pathology', [{value: '', label: 'AI determines / None'}, 'None Detected', 'Heart Defect', 'Respiratory Issues', 'Jaundice', 'Cleft Lip/Palate', 'Down Syndrome', 'Clubfoot', 'Spina Bifida', {value: 'other', label: 'Other (specify below)'}], data.pathology || ''), 'fa-solid fa-notes-medical')}
        <div id="flt-pathology-other" style="display:${data.pathology === 'other' ? 'block' : 'none'};margin-bottom:${m ? '16px' : '12px'};">${textareaInput('pathologyCustom', data.pathologyCustom || '', 'Describe condition...', 2)}</div>
        ${formField('Additional Medical Notes', textareaInput('medicalNotes', data.medicalNotes || '', 'Complications during birth, special care needed...', 2), 'fa-solid fa-file-medical')}
    `;
}

function buildBabyCareForm(data) {
    const m = window.innerWidth <= 768;
    const babies = data.babies || [];
    const currentId = data.currentBabyId || 1;
    const currentBaby = babies.find(b => b.id === currentId) || {};

    // Baby tabs
    const babyTabs = babies.length > 0 ? `
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:15px;">
            ${babies.map(b => `
                <button type="button" class="flt-baby-tab" data-baby-id="${b.id}" style="
                    padding:8px 16px;
                    border-radius:20px;
                    border:2px solid ${b.id === currentId ? '#4caf50' : 'var(--SmartThemeBorderColor)'};
                    background:${b.id === currentId ? 'color-mix(in srgb,#4caf50 20%,transparent)' : 'transparent'};
                    color:${b.id === currentId ? '#4caf50' : 'var(--SmartThemeBodyColor)'};
                    cursor:pointer;
                    font-size:${m ? '14px' : '13px'};
                    display:flex;align-items:center;gap:6px;
                ">
                    <i class="fa-solid fa-baby"></i> ${b.name || `Baby ${b.id}`}
                </button>
            `).join('')}
            <button type="button" id="flt-add-baby" style="
                padding:8px 16px;
                border-radius:20px;
                border:2px dashed var(--SmartThemeBorderColor);
                background:transparent;
                color:var(--SmartThemeBodyColor);
                cursor:pointer;
                font-size:${m ? '14px' : '13px'};
                opacity:0.7;
            ">
                <i class="fa-solid fa-plus"></i> Add Baby
            </button>
        </div>
    ` : `
        <div style="text-align:center;padding:20px;border:2px dashed var(--SmartThemeBorderColor);border-radius:10px;margin-bottom:15px;">
            <div style="font-size:40px;margin-bottom:10px;">👶</div>
            <div style="margin-bottom:15px;opacity:0.7;">No babies registered yet</div>
            <button type="button" id="flt-add-baby" style="
                padding:12px 24px;
                border-radius:8px;
                border:none;
                background:#4caf50;
                color:white;
                cursor:pointer;
                font-size:${m ? '15px' : '14px'};
            ">
                <i class="fa-solid fa-plus"></i> Add First Baby
            </button>
        </div>
    `;

    // Form fields for current baby
    const babyForm = babies.length > 0 ? `
        <input type="hidden" name="currentBabyId" value="${currentId}">

        <!-- Basic Info -->
        ${formGrid(2, `
            ${formField('Baby Name', textInput('babyName', currentBaby.name || '', 'Required'), 'fa-solid fa-signature')}
            ${formField('Age', textInput('babyAge', currentBaby.age || '', 'Newborn, 2 weeks, 3 months...'), 'fa-solid fa-cake-candles')}
        `)}

        <hr style="border:none;border-top:1px dashed var(--SmartThemeBorderColor);margin:20px 0;">

        <!-- Status -->
        ${formGrid(2, `
            ${formField('Hunger', selectInput('babyHunger', ['Full', 'Satisfied', 'Hungry', 'Starving'], currentBaby.hunger || 'Satisfied'), 'fa-solid fa-utensils')}
            ${formField('Hygiene', selectInput('babyHygiene', ['Clean', 'Needs Change', 'Soiled'], currentBaby.hygiene || 'Clean'), 'fa-solid fa-soap')}
            ${formField('Energy', selectInput('babyEnergy', ['Rested', 'Active', 'Tired', 'Exhausted'], currentBaby.energy || 'Rested'), 'fa-solid fa-bed')}
            ${formField('Mood', selectInput('babyMood', ['Happy', 'Content', 'Fussy', 'Crying', 'Sleeping'], currentBaby.mood || 'Content'), 'fa-solid fa-face-smile')}
        `)}

        ${formField('Health Status', selectInput('babyHealth', ['Healthy', 'Mild Cold', 'Fever', 'Teething', 'Colic', 'Needs Attention', 'Under Treatment'], currentBaby.health || 'Healthy'), 'fa-solid fa-heart-pulse')}

        <hr style="border:none;border-top:1px dashed var(--SmartThemeBorderColor);margin:20px 0;">

        <!-- Medical -->
        <div style="font-size:${m ? '14px' : '13px'};font-weight:bold;margin-bottom:12px;color:var(--SmartThemeAccent);"><i class="fa-solid fa-stethoscope"></i> Medical</div>

        ${formGrid(2, `
            ${formField('Next Checkup', textInput('babyNextCheckup', currentBaby.nextCheckup || '', 'e.g., 2 month visit...'), 'fa-solid fa-calendar-check')}
            ${formField('Visit Type', selectInput('babyVisitType', [
                {value: '', label: 'Select...'},
                'Regular Checkup',
                'Vaccination',
                'Sick Visit',
                'Weight Check',
                'Development Assessment',
                'Emergency',
                'Follow-up'
            ], currentBaby.visitType || ''), 'fa-solid fa-clipboard-list')}
        `)}

        ${formField('Vaccinations', textInput('babyVaccinations', currentBaby.vaccinations || '', 'e.g., 2-month shots...'), 'fa-solid fa-syringe')}
        ${formField('Tests/Screenings', textInput('babyTests', currentBaby.testsNeeded || '', 'e.g., Hearing test...'), 'fa-solid fa-vial')}
        ${formField('Medications', textInput('babyMedications', currentBaby.medications || '', 'e.g., Vitamin D drops...'), 'fa-solid fa-pills')}
        ${formField("Doctor's Advice", textareaInput('babyDoctorAdvice', currentBaby.doctorAdvice || '', 'Feeding tips, sleep advice...', 2), 'fa-solid fa-user-doctor')}

        <hr style="border:none;border-top:1px dashed var(--SmartThemeBorderColor);margin:20px 0;">

        <!-- Development -->
        <div style="font-size:${m ? '14px' : '13px'};font-weight:bold;margin-bottom:12px;color:#9b59b6;"><i class="fa-solid fa-star"></i> Development</div>

        ${formField('Latest Milestone', textInput('babyMilestone', currentBaby.milestone || '', 'e.g., First smile, rolled over...'), 'fa-solid fa-trophy')}
        ${formField('Development Notes', textareaInput('babyDevelopmentNotes', currentBaby.developmentNotes || '', 'Weight gain, growth, new skills...', 2), 'fa-solid fa-chart-line')}

        ${formGrid(2, `
            ${formField('Feeding', selectInput('babyFeeding', [
                {value: '', label: 'Select...'},
                'Breastfeeding only',
                'Formula only',
                'Mixed feeding',
                'Starting solids',
                'Mostly solids',
                'Weaned'
            ], currentBaby.feeding || ''), 'fa-solid fa-bottle-water')}
            ${formField('Sleep Pattern', textInput('babySleepPattern', currentBaby.sleepPattern || '', 'e.g., 3 naps/day...'), 'fa-solid fa-moon')}
        `)}

        <!-- Delete button -->
        ${babies.length > 0 ? `
    <div style="margin-top:20px;padding-top:15px;border-top:1px dashed #e76f51;">
        <button type="button" id="flt-remove-baby" data-baby-id="${currentId}" style="
                    background:transparent;
                    color:#e76f51;
                    border:1px solid #e76f51;
                    padding:8px 16px;
                    border-radius:6px;
                    cursor:pointer;
                    font-size:12px;
                ">
                    <i class="fa-solid fa-trash"></i> Remove ${currentBaby.name || 'this baby'}
                </button>
            </div>
        ` : ''}
    ` : '';

    return babyTabs + babyForm;
}


function buildMiscarriageForm(data) {
    const m = window.innerWidth <= 768;
    return `
        <div style="background:color-mix(in srgb,#6c757d 10%,transparent);border:1px solid #6c757d;border-radius:8px;padding:12px;margin-bottom:15px;font-size:${m ? '13px' : '12px'};"><i class="fa-solid fa-info-circle"></i> Emotional response is <strong>your choice</strong> to roleplay.</div>
        ${formField('Week of Loss', numberInput('week', data.week || '', '1', '42', 'Pregnancy week'), 'fa-solid fa-calendar')}
        ${formField('Cause', selectInput('cause', [{value: '', label: 'AI determines'}, 'Natural/Unknown', 'Medical Complications', 'Trauma', {value: 'other', label: 'Other (specify)'}], data.cause || ''), 'fa-solid fa-question')}
        <div id="flt-cause-other" style="display:${data.cause === 'other' ? 'block' : 'none'};margin-bottom:${m ? '16px' : '12px'};">${textInput('causeCustom', data.causeCustom || '', 'Specify cause...')}</div>
    `;
}

function setupTrackerHandlers(trackerId, data) {
    setupDateModeHandlers();
    if (trackerId === 'conception') setupConceptionHandlers(data);
    if (trackerId === 'pregnancy') setupPregnancyHandlers(data);
    if (trackerId === 'birth') setupBirthHandlers(data);
    if (trackerId === 'miscarriage') setupMiscarriageHandlers(data);
    if (trackerId === 'babyCare') setupBabyCareHandlers(data);  // ← ДОБАВЬ ЭТУ СТРОКУ
}

function setupDateModeHandlers() {
    document.querySelectorAll('.flt-date-mode').forEach(btn => {
        btn.addEventListener('click', function() {
            const mode = this.dataset.datemode;
            document.getElementById('flt-date-mode').value = mode;
            document.querySelectorAll('.flt-date-mode').forEach(b => {
                const isActive = b.dataset.datemode === mode;
                b.style.border = `2px solid ${isActive ? 'var(--SmartThemeAccent)' : 'var(--SmartThemeBorderColor)'}`;
                b.style.background = isActive ? 'color-mix(in srgb,var(--SmartThemeAccent) 15%,transparent)' : 'transparent';
                b.style.opacity = isActive ? '1' : '0.6';
            });
            ['ai', 'system', 'lore', 'manual'].forEach(m => { const el = document.getElementById(`flt-date-${m}`); if (el) el.style.display = m === mode ? 'block' : 'none'; });
            if (currentFormTracker) updatePreview(currentFormTracker);
        });
    });
}

function setupConceptionHandlers(data) {
    ['roll', 'ai'].forEach(mode => {
        document.getElementById(`flt-mode-${mode}`)?.addEventListener('click', function() {
            document.getElementById('flt-mode').value = mode;
            ['roll', 'ai'].forEach(m => {
                const btn = document.getElementById(`flt-mode-${m}`);
                if (btn) { const isActive = m === mode; btn.style.border = `2px solid ${isActive ? '#9b59b6' : 'var(--SmartThemeBorderColor)'}`; btn.style.background = isActive ? 'color-mix(in srgb,#9b59b6 20%,transparent)' : 'transparent'; btn.style.color = isActive ? '#9b59b6' : 'var(--SmartThemeBodyColor)'; btn.style.opacity = isActive ? '1' : '0.6'; }
            });
            document.getElementById('flt-roll-section').style.display = mode === 'roll' ? 'block' : 'none';
            document.getElementById('flt-ai-section').style.display = mode === 'ai' ? 'block' : 'none';
            if (mode === 'ai') { document.getElementById('flt-roll').value = ''; document.getElementById('flt-result').value = ''; }
            updatePreview(currentFormTracker);
        });
    });
    const slider = document.getElementById('flt-threshold');
    const display = document.getElementById('flt-threshold-display');
    slider?.addEventListener('input', () => { display.textContent = slider.value + '%'; });
    document.getElementById('flt-roll-btn')?.addEventListener('click', () => {
        const threshold = parseInt(slider?.value) || 20;
        const roll = Math.floor(Math.random() * 100) + 1;
        const success = roll <= threshold;
        document.getElementById('flt-roll').value = roll;
        document.getElementById('flt-result').value = success ? 'Yes' : 'No';
        if (document.getElementById('flt-date-mode')?.value === 'system' && success) {
            const dueDateInput = document.querySelector('[name="dueDate"]');
            if (dueDateInput) dueDateInput.value = formatDate(calculateDueDate());
        }
        const resultDiv = document.getElementById('flt-roll-result');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `<div style="font-size:50px;animation:flt-bounce 0.5s;">${success ? '🎉' : '😔'}</div><div style="font-size:36px;font-weight:bold;color:${success ? '#4caf50' : '#e76f51'};">${roll}</div><div style="font-size:14px;opacity:0.6;">needed ≤ ${threshold}</div><div style="font-size:18px;margin-top:10px;color:${success ? '#4caf50' : '#e76f51'};font-weight:bold;">${success ? '✓ Conceived!' : '✗ Not this time'}</div>`;
        updatePreview(currentFormTracker);
    });
}

function setupPregnancyHandlers(data) {
    const weekInput = document.querySelector('[name="week"]');
    weekInput?.addEventListener('input', () => {
        const week = parseInt(weekInput.value) || 0;
        const systemDue = document.getElementById('flt-system-due');
        if (systemDue && week > 0) systemDue.textContent = formatDate(calculateDueDate(new Date(), week));
        updatePreview(currentFormTracker);
    });
    const riskTypeSelect = document.querySelector('[name="riskType"]');
    riskTypeSelect?.addEventListener('change', () => {
        const riskOther = document.getElementById('flt-risk-other');
        if (riskOther) riskOther.style.display = riskTypeSelect.value === 'other' ? 'block' : 'none';
        updatePreview(currentFormTracker);
    });
}

function setupBirthHandlers(data) {
    const genderSelect = document.querySelector('[name="gender"]');
    genderSelect?.addEventListener('change', () => {
        const genderOther = document.getElementById('flt-gender-other');
        if (genderOther) genderOther.style.display = genderSelect.value === 'other' ? 'block' : 'none';
        updatePreview(currentFormTracker);
    });
    const pathologySelect = document.querySelector('[name="pathology"]');
    pathologySelect?.addEventListener('change', () => {
        const pathologyOther = document.getElementById('flt-pathology-other');
        if (pathologyOther) pathologyOther.style.display = pathologySelect.value === 'other' ? 'block' : 'none';
        updatePreview(currentFormTracker);
    });
}

function setupMiscarriageHandlers(data) {
    const causeSelect = document.querySelector('[name="cause"]');
    causeSelect?.addEventListener('change', () => {
        const causeOther = document.getElementById('flt-cause-other');
        if (causeOther) causeOther.style.display = causeSelect.value === 'other' ? 'block' : 'none';
        updatePreview(currentFormTracker);
    });
}

function setupBabyCareHandlers(data) {
    // Baby tab switching
    document.querySelectorAll('.flt-baby-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const babyId = parseInt(this.dataset.babyId);
            selectBaby(babyId);
            closePopup();
            showTrackerForm('babyCare');
        });
    });

    // Add baby button
    document.getElementById('flt-add-baby')?.addEventListener('click', () => {
        const name = prompt('Baby name:');
        if (name && name.trim()) {
            addBaby({
                name: name.trim(),
                age: 'Newborn',
                hunger: 'Satisfied',
                hygiene: 'Clean',
                energy: 'Rested',
                mood: 'Content',
                health: 'Healthy'
            });
            closePopup();
            showTrackerForm('babyCare');
        }
    });

    // Remove baby button
    document.getElementById('flt-remove-baby')?.addEventListener('click', function() {
        const babyId = parseInt(this.dataset.babyId);
        const babies = getBabies();
        const baby = babies.find(b => b.id === babyId);

        if (babies.length === 1) {
            // Единственный бейби — спрашиваем и очищаем всё
            if (confirm(`Remove ${baby?.name || 'this baby'}? This will clear the Baby Care tracker.`)) {
                state.data.babies = [];
                state.data.currentBabyId = null;
                saveState();
                closePopup();
                showTrackerForm('babyCare');
            }
        } else {
            // Несколько бейби — просто удаляем одного
            if (confirm(`Remove ${baby?.name || 'this baby'}?`)) {
                removeBaby(babyId);
                closePopup();
                showTrackerForm('babyCare');
            }
        }
    });
}

function getFormData() {
    const form = document.getElementById('flt-form');
    const data = {};
    new FormData(form).forEach((value, key) => { if (value && value.trim()) data[key] = value.trim(); });

    // Handle babyCare multi-baby
    if (currentFormTracker === 'babyCare') {
        const currentId = parseInt(data.currentBabyId) || state.data.currentBabyId || 1;

        // Собираем данные текущего бейби из формы
        const babyData = {
            id: currentId,
            name: data.babyName || '',
            age: data.babyAge || '',
            hunger: data.babyHunger || 'Satisfied',
            hygiene: data.babyHygiene || 'Clean',
            energy: data.babyEnergy || 'Rested',
            mood: data.babyMood || 'Content',
            health: data.babyHealth || 'Healthy',
            nextCheckup: data.babyNextCheckup || '',
            visitType: data.babyVisitType || '',
            vaccinations: data.babyVaccinations || '',
            testsNeeded: data.babyTests || '',
            medications: data.babyMedications || '',
            doctorAdvice: data.babyDoctorAdvice || '',
            milestone: data.babyMilestone || '',
            developmentNotes: data.babyDevelopmentNotes || '',
            feeding: data.babyFeeding || '',
            sleepPattern: data.babySleepPattern || ''
        };

        // Копируем существующих бейби или создаём новый массив
        let babies = [...(state.data.babies || [])];

        // Находим и обновляем текущего бейби
        const idx = babies.findIndex(b => b.id === currentId);
        if (idx >= 0) {
            babies[idx] = { ...babies[idx], ...babyData };
        } else if (babyData.name) {
            // Если бейби нет в массиве но есть имя — добавляем
            babies.push(babyData);
        }

        data.babies = babies;
        data.currentBabyId = currentId;
    }

    if (data.dateMode === 'system' && data.week) {
        data.dueDate = formatDate(calculateDueDate(new Date(), parseInt(data.week)));
    }

    return data;
}

function updatePreview(trackerId) {
    const form = document.getElementById('flt-form');
    const tracker = trackerId || form?.dataset?.tracker || currentFormTracker;
    if (!tracker) return;

    const preview = document.getElementById('flt-preview');
    if (preview) {
        preview.innerHTML = generateTrackerHTML(tracker, getFormData());
    }
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

function showStatusPopup() {
    if (!state.active) { showToast('No active tracker', 'warning'); return; }
    const tracker = TRACKERS[state.active];
    const m = window.innerWidth <= 768;
    const content = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:${m ? '20px' : '16px'};">
            <div style="width:50px;height:50px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,${tracker.color} 20%,transparent);border-radius:50%;color:${tracker.color};font-size:22px;"><i class="${tracker.icon}"></i></div>
            <div style="flex:1;"><div style="font-size:${m ? '18px' : '16px'};font-weight:bold;color:var(--SmartThemeBodyColor);">${tracker.name}</div><div style="font-size:12px;padding:3px 8px;background:${tracker.color};color:white;border-radius:10px;display:inline-block;">ACTIVE</div></div>
        </div>
        <div style="margin-bottom:${m ? '20px' : '16px'};">${generateTrackerHTML(state.active, state.data)}</div>
        ${btnRow(btn('flt-edit', 'fa-solid fa-pen', 'Edit', true), btn('flt-stop', 'fa-solid fa-stop', 'Stop', false, true))}
    `;
    createPopup(content, "500px");
    document.getElementById('flt-edit').addEventListener('click', () => { closePopup(); showTrackerForm(state.active); });
    document.getElementById('flt-stop').addEventListener('click', () => { if (confirm('Stop tracking?')) { resetState(); saveState(); removeOldTrackerDisplay(); clearSystemPrompt(); closePopup(); updateMenuState(); showToast('Tracking stopped', 'warning'); } });
    document.getElementById("flt-menu").style.display = "none";
}

function showSettingsPopup() {
    const s = extension_settings[extensionName];
    const m = window.innerWidth <= 768;
    const toggle = (id, label, key) => `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border-radius:8px;margin-bottom:10px;"><span style="font-size:${m ? '14px' : '13px'};">${label}</span><div id="${id}" data-key="${key}" style="width:50px;height:26px;background:${s[key] ? 'var(--SmartThemeAccent)' : 'var(--SmartThemeBorderColor)'};border-radius:13px;cursor:pointer;position:relative;transition:background 0.2s;"><div style="position:absolute;top:3px;left:${s[key] ? '27px' : '3px'};width:20px;height:20px;background:white;border-radius:50%;transition:left 0.2s;"></div></div></div>`;
    const content = `
        <div style="font-size:${m ? '18px' : '16px'};font-weight:bold;margin-bottom:${m ? '20px' : '16px'};display:flex;align-items:center;gap:10px;"><i class="fa-solid fa-sliders"></i> Settings</div>
        ${toggle('flt-toggle-misc', 'Miscarriage Events', 'miscarriageEnabled')}
        ${toggle('flt-toggle-labor', 'Auto Labor (37+ weeks)', 'autoLaborEnabled')}
        ${formField('Default Conception Threshold (%)', numberInput('threshold', s.conceptionThreshold || 20, '1', '100'))}
        ${formField('Ultrasound Error Chance (%)', numberInput('ultrasoundError', s.ultrasoundErrorChance || 5, '0', '50'))}
        <div style="padding:15px;background:color-mix(in srgb,#e76f51 10%,transparent);border:1px solid #e76f51;border-radius:8px;margin:${m ? '20px' : '16px'} 0;"><div style="font-size:13px;color:#e76f51;margin-bottom:10px;"><i class="fa-solid fa-triangle-exclamation"></i> Danger Zone</div>${btn('flt-clear-all', 'fa-solid fa-trash', 'Clear All Data', false, true)}</div>
        ${btnRow(btn('flt-save-settings', 'fa-solid fa-save', 'Save', true), btn('flt-cancel-settings', 'fa-solid fa-xmark', 'Cancel'))}
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
    document.getElementById('flt-clear-all').addEventListener('click', () => { if (confirm('Clear ALL tracker data for this chat?')) { resetState(); saveState(); removeOldTrackerDisplay(); clearSystemPrompt(); updateMenuState(); showToast('All data cleared', 'success'); } });
    document.getElementById('flt-save-settings').addEventListener('click', () => { extension_settings[extensionName].conceptionThreshold = parseInt(document.querySelector('[name="threshold"]').value) || 20; extension_settings[extensionName].ultrasoundErrorChance = parseInt(document.querySelector('[name="ultrasoundError"]').value) || 5; saveSettings(); closePopup(); showToast('Settings saved!', 'success'); });
    document.getElementById('flt-cancel-settings').addEventListener('click', closePopup);
    document.getElementById("flt-menu").style.display = "none";
}

function updateMenuState() {
    const statusOpt = document.getElementById('flt-status-opt');
    const badge = document.getElementById('flt-active-badge');
    if (statusOpt) statusOpt.style.display = state.active ? 'flex' : 'none';
    if (badge) { if (state.active) { const t = TRACKERS[state.active]; badge.innerHTML = `<i class="${t.icon}" style="font-size:10px;"></i>`; badge.style.background = t.color; badge.style.display = 'flex'; } else { badge.style.display = 'none'; } }
}

function addMenu() {
    if (document.getElementById("flt-btn")) return true;
    const container = document.getElementById("leftSendForm") || document.getElementById("form_sheld") || document.querySelector("#send_form");
    if (!container) return false;
    const mainBtn = document.createElement("div");
    mainBtn.id = "flt-btn";
    mainBtn.title = "Life Tracker";
    mainBtn.innerHTML = `<i class="fa-solid fa-heart-pulse"></i><span id="flt-active-badge" style="display:none;position:absolute;top:-3px;right:-3px;width:16px;height:16px;border-radius:50%;color:white;font-size:8px;align-items:center;justify-content:center;"></span>`;
    mainBtn.style.cssText = `cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;color:var(--SmartThemeBodyColor);font-size:14px;margin:0 2px;border-radius:5px;opacity:0.8;position:relative;transition:all 0.2s;`;
    mainBtn.addEventListener("mouseenter", () => { mainBtn.style.background = "var(--SmartThemeBorderColor)"; mainBtn.style.opacity = "1"; });
    mainBtn.addEventListener("mouseleave", () => { mainBtn.style.background = ""; mainBtn.style.opacity = "0.8"; });
    const menu = document.createElement("div");
    menu.id = "flt-menu";
    menu.style.cssText = `display:none;position:absolute;bottom:calc(100% + 8px);left:0;background:var(--SmartThemeBlurTintColor);backdrop-filter:blur(10px);border:1px solid var(--SmartThemeBorderColor);border-radius:12px;padding:8px;z-index:1001;min-width:260px;box-shadow:0 4px 20px rgba(0,0,0,0.25);`;
    const trackersHTML = Object.values(TRACKERS).map(t => `<div class="flt-menu-item" data-action="tracker" data-tracker="${t.id}" style="padding:12px;cursor:pointer;border-radius:8px;display:flex;align-items:center;gap:12px;margin:2px 0;transition:background 0.15s;"><div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,${t.color} 20%,transparent);border-radius:50%;color:${t.color};font-size:14px;"><i class="${t.icon}"></i></div><div><div style="font-size:13px;font-weight:500;">${t.name}</div><div style="font-size:10px;opacity:0.6;">${t.description}</div></div></div>`).join('');
    menu.innerHTML = `<div style="padding:8px 12px;color:var(--SmartThemeAccent);font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid var(--SmartThemeBorderColor);margin-bottom:6px;display:flex;align-items:center;gap:8px;"><i class="fa-solid fa-heart-pulse"></i> Life Tracker</div><div id="flt-status-opt" class="flt-menu-item" data-action="status" style="padding:12px;cursor:pointer;border-radius:8px;display:${state.active ? 'flex' : 'none'};align-items:center;gap:12px;margin:2px 0;background:color-mix(in srgb,var(--SmartThemeAccent) 10%,transparent);border:1px solid var(--SmartThemeAccent);"><div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:var(--SmartThemeAccent);border-radius:50%;color:white;font-size:14px;"><i class="fa-solid fa-chart-line"></i></div><div><div style="font-size:13px;font-weight:500;">Current Status</div><div style="font-size:10px;opacity:0.6;">View & manage active tracker</div></div></div>${trackersHTML}<hr style="border:none;border-top:1px solid var(--SmartThemeBorderColor);margin:8px 0;"><div class="flt-menu-item" data-action="settings" style="padding:10px 12px;cursor:pointer;border-radius:6px;display:flex;align-items:center;gap:10px;opacity:0.8;"><i class="fa-solid fa-sliders" style="width:20px;text-align:center;"></i><span style="font-size:12px;">Settings</span></div>`;
    container.insertBefore(mainBtn, container.firstChild);
    document.body.appendChild(menu);
    mainBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); updateMenuState(); const rect = mainBtn.getBoundingClientRect(); menu.style.left = Math.max(10, rect.left) + "px"; menu.style.bottom = (window.innerHeight - rect.top + 8) + "px"; menu.style.display = menu.style.display === "block" ? "none" : "block"; });
    menu.querySelectorAll(".flt-menu-item").forEach(item => {
        item.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); menu.style.display = "none"; const action = item.dataset.action; if (action === "tracker") showTrackerForm(item.dataset.tracker); else if (action === "status") showStatusPopup(); else if (action === "settings") showSettingsPopup(); });
        item.addEventListener("mouseenter", () => item.style.background = "color-mix(in srgb, var(--SmartThemeAccent) 15%, transparent)");
        item.addEventListener("mouseleave", () => item.style.background = item.dataset.action === 'status' && state.active ? "color-mix(in srgb,var(--SmartThemeAccent) 10%,transparent)" : "");
    });
    document.addEventListener("click", (e) => { if (!mainBtn.contains(e.target) && !menu.contains(e.target)) menu.style.display = "none"; });
    return true;
}

eventSource.on(event_types.MESSAGE_RECEIVED, (messageIndex) => { if (state.active) setTimeout(() => processAIResponse(messageIndex), 150); });
eventSource.on(event_types.MESSAGE_SWIPED, () => { if (state.active) updateSystemPrompt(); });
eventSource.on(event_types.CHAT_CHANGED, () => { loadState(); setTimeout(() => { if (state.active) updateSystemPrompt(); renderAllTrackers(); updateMenuState(); }, 500); });

jQuery(() => {
    loadSettings();
    loadState();
    setTimeout(() => { addMenu(); if (state.active) updateSystemPrompt(); renderAllTrackers(); updateMenuState(); }, 1000);
    setTimeout(() => { addMenu(); renderAllTrackers(); updateMenuState(); }, 3000);
    const style = document.createElement('style');
    style.textContent = `@keyframes flt-toastIn{from{opacity:0;transform:translate(-50%,-20px);}to{opacity:1;transform:translate(-50%,0);}}@keyframes flt-toastOut{from{opacity:1;transform:translate(-50%,0);}to{opacity:0;transform:translate(-50%,-20px);}}@keyframes flt-bounce{0%,100%{transform:scale(1);}50%{transform:scale(1.2);}}@keyframes flt-fadeIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}.flt-tracker-container{animation:flt-fadeIn 0.3s ease;}`;
    document.head.appendChild(style);
    console.log("Fawn's Life Tracker v2.2: Ready! 🦌");
});
