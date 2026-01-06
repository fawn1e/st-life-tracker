/* ═══════════════════════════════════════════════════════════════
   FAWN'S LIFE TRACKER - Version 5.0.0
   FULLY AUTONOMOUS - AI controls everything after initial trigger
   User input is OPTIONAL after first action
   ═══════════════════════════════════════════════════════════════ */

console.log("Fawn's Life Tracker: Initializing v5.0 (Autonomous Mode)...");

import { extension_settings, getContext } from "../../../extensions.js";
import { eventSource, event_types } from "../../../../script.js";
import { setExtensionPrompt, extension_prompt_types, extension_prompt_roles } from "../../../../script.js";

const extensionName = "fawns-life-tracker";

const defaultSettings = {
    enabled: true,
    autoMode: true, // AI controls everything
    conceptionThreshold: 20,
    language: 'en' // or 'ru' for Russian
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

const TRACKERS = {
    conception: { id: 'conception', name: 'Conception', icon: 'fa-solid fa-dice', color: '#9b59b6' },
    pregnancy: { id: 'pregnancy', name: 'Pregnancy', icon: 'fa-solid fa-person-pregnant', color: '#e91e63' },
    birth: { id: 'birth', name: 'Birth', icon: 'fa-solid fa-baby-carriage', color: '#2196f3' },
    babyCare: { id: 'babyCare', name: 'Baby Care', icon: 'fa-solid fa-baby', color: '#4caf50' },
    miscarriage: { id: 'miscarriage', name: 'Loss', icon: 'fa-solid fa-heart-crack', color: '#6c757d' }
};

/* ═══════════════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════════════ */

let state = {
    active: null,           // 'conception' | 'pregnancy' | 'birth' | 'babyCare' | 'miscarriage' | null
    data: {},               // Current tracker data
    history: [],            // History of all tracker updates
    lastMessageId: null,    // Message ID with last tracker
    conceptionDate: null,   // For due date calculation
    dueDate: null
};

/* ═══════════════════════════════════════════════════════════════
   SYSTEM PROMPT - Sent to AI while tracker is active
   ═══════════════════════════════════════════════════════════════ */

function generateSystemPrompt() {
    if (!state.active) return '';

    const base = `[LIFE TRACKER ACTIVE - ${state.active.toUpperCase()}]
You MUST include a tracker line at the END of EVERY response.
Format: [TRACKER:type|field=value|field=value|...]
Do NOT write HTML. The extension renders it automatically.

`;

    switch (state.active) {
        case 'pregnancy':
            const week = state.data.week || 1;
            const dueDate = state.dueDate ? formatDate(state.dueDate) : '??';
            const size = BABY_SIZES[week] || '??';
            return base + `PREGNANCY - Week ${week}, Due: ${dueDate}, Size: ${size}
Current data: ${JSON.stringify(state.data)}

RULES:
- Update "week" based on time passing in RP (days/weeks mentioned)
- Update "symptoms" based on what character experiences
- Update "knowledge": Hidden→Suspected→Confirmed as character realizes
- Update "risks": Stable/Mild/Moderate/High/Critical based on events
- "gender" stays Unknown until ultrasound/birth (or you decide to reveal)
- When week ≥37 and labor starts, switch to [TRACKER:birth|...]
- If miscarriage happens, switch to [TRACKER:miscarriage|...]

TRACKER FORMAT:
[TRACKER:pregnancy|week=X|size=X|knowledge=X|gender=X|symptoms=X|risks=X|riskDetails=X]

EXAMPLE (week 8, morning sickness):
[TRACKER:pregnancy|week=8|size=Raspberry|knowledge=Suspected|gender=Unknown|symptoms=Morning sickness, fatigue, tender breasts|risks=Stable|riskDetails=None]`;

        case 'birth':
            return base + `BIRTH IN PROGRESS
Generate realistic newborn data based on:
- Genetics of parents (if known)
- Pregnancy history (risks, health)
- Current scene context

TRACKER FORMAT:
[TRACKER:birth|name=X|gender=X|weight=X|height=X|hair=X|eyes=X|features=X|health=X|time=X]

EXAMPLE:
[TRACKER:birth|name=Emma|gender=Girl|weight=3.2kg|height=49cm|hair=Dark brown|eyes=Blue-gray|features=Father's nose, mother's lips|health=Healthy|time=3:42 AM]

After birth scene, switch to [TRACKER:babyCare|...] for ongoing baby tracking.`;

        case 'babyCare':
            const babyName = state.data.name || 'Baby';
            const babyAge = state.data.age || 'Newborn';
            return base + `BABY CARE - ${babyName}, ${babyAge}
Current: ${JSON.stringify(state.data)}

RULES:
- Update "age" as time passes (Newborn → 1 week → 2 weeks → 1 month...)
- Update "hunger": Full→Satisfied→Hungry→Starving (based on feeding)
- Update "hygiene": Clean→Needs change→Soiled (based on diaper)
- Update "energy": Rested→Active→Tired→Exhausted (based on sleep)
- Update "mood": Happy/Content/Fussy/Crying/Sleeping
- Update "milestone" when baby achieves something new

TRACKER FORMAT:
[TRACKER:babyCare|name=X|age=X|hunger=X|hygiene=X|energy=X|mood=X|health=X|milestone=X]`;

        case 'miscarriage':
            return base + `PREGNANCY LOSS
Handle with sensitivity. Document the experience.

TRACKER FORMAT:
[TRACKER:miscarriage|week=X|cause=X|physical=X|emotional=X|support=X]`;

        case 'conception':
            return base + `CONCEPTION ATTEMPT
A conception attempt is happening or just happened.
Result already determined: ${state.data.result || 'Pending'}

If result=Yes: Character is now pregnant but doesn't know. Show subtle hints.
After this scene, tracker will auto-switch to pregnancy.

[TRACKER:conception|roll=${state.data.roll || '??'}|threshold=${state.data.threshold || 20}|result=${state.data.result || '??'}|dueDate=${state.data.dueDate || '??'}]`;

        default:
            return '';
    }
}

function updateSystemPrompt() {
    const prompt = generateSystemPrompt();

    if (prompt) {
        setExtensionPrompt(
            'fawn-life-tracker',
            prompt,
            extension_prompt_types.IN_CHAT,
            0,
            true,
            true,
            null,
            extension_prompt_roles.SYSTEM
        );
        console.log('FLT: System prompt updated for', state.active);
    } else {
        clearSystemPrompt();
    }
}

function clearSystemPrompt() {
    setExtensionPrompt('fawn-life-tracker', '', extension_prompt_types.IN_CHAT, 0, true, true, null, extension_prompt_roles.SYSTEM);
}

/* ═══════════════════════════════════════════════════════════════
   CONCEPTION SYSTEM
   ═══════════════════════════════════════════════════════════════ */

function rollConception() {
    const threshold = extension_settings[extensionName].conceptionThreshold || 20;
    const roll = Math.floor(Math.random() * 100) + 1;
    const success = roll <= threshold;

    // Calculate due date if success
    let dueDate = null;
    let conceptionDate = null;
    if (success) {
        conceptionDate = new Date();
        dueDate = new Date(conceptionDate);
        dueDate.setDate(dueDate.getDate() + 280); // 40 weeks
    }

    state.active = 'conception';
    state.conceptionDate = conceptionDate;
    state.dueDate = dueDate;
    state.data = {
        roll: roll,
        threshold: threshold,
        result: success ? 'Yes' : 'No',
        dueDate: dueDate ? formatDate(dueDate) : null
    };

    saveState();
    updateSystemPrompt();

    // If success, auto-transition to pregnancy after next AI response
    if (success) {
        state.pendingTransition = 'pregnancy';
    }

    return { roll, threshold, success, dueDate };
}

function startPregnancy() {
    state.active = 'pregnancy';
    state.data = {
        week: 1,
        size: BABY_SIZES[1],
        knowledge: 'Hidden',
        gender: 'Unknown',
        symptoms: 'None yet',
        risks: 'Stable',
        riskDetails: 'None',
        dueDate: state.dueDate ? formatDate(state.dueDate) : '??'
    };

    saveState();
    updateSystemPrompt();
}

/* ═══════════════════════════════════════════════════════════════
   PARSE AI RESPONSE
   ═══════════════════════════════════════════════════════════════ */

function parseTrackerFromText(text) {
    // Match [TRACKER:type|field=value|...]
    const regex = /\[TRACKER:(\w+)\|([^\]]+)\]/i;
    const match = text.match(regex);

    if (!match) return null;

    const trackerId = match[1].toLowerCase();
    const dataString = match[2];
    const data = {};

    // Parse field=value pairs
    dataString.split('|').forEach(pair => {
        const eqIndex = pair.indexOf('=');
        if (eqIndex > 0) {
            const key = pair.substring(0, eqIndex).trim();
            const value = pair.substring(eqIndex + 1).trim();
            if (key && value) data[key] = value;
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

    if (parsed) {
        console.log('FLT: Parsed tracker from AI:', parsed);

        // Handle tracker type transitions
        handleTrackerTransition(parsed.trackerId);

        // Update state with AI's data
        state.data = { ...state.data, ...parsed.data };
        state.lastMessageId = messageIndex;

        // Add to history
        state.history.push({
            type: parsed.trackerId,
            data: { ...parsed.data },
            messageId: messageIndex,
            timestamp: Date.now()
        });

        // Keep history manageable
        if (state.history.length > 100) state.history = state.history.slice(-100);

        saveState();
        saveTrackerDisplay(messageIndex, parsed.trackerId, state.data);

        // Render
        setTimeout(() => renderTracker(messageIndex), 100);

        // Update prompt with new data
        updateSystemPrompt();
    }

    // Check for pending transition (conception → pregnancy)
    if (state.pendingTransition === 'pregnancy' && state.active === 'conception') {
        delete state.pendingTransition;
        startPregnancy();
    }
}

function handleTrackerTransition(newType) {
    const oldType = state.active;

    if (newType !== oldType) {
        console.log('FLT: Tracker transition:', oldType, '→', newType);

        // Clear old tracker display
        removeOldTrackerDisplay();

        // Update active type
        state.active = newType;

        // Handle specific transitions
        if (newType === 'birth' && oldType === 'pregnancy') {
            // Pregnancy ended with birth
            showToast('🎉 Baby born!', 'success');
        } else if (newType === 'miscarriage' && oldType === 'pregnancy') {
            // Pregnancy ended with loss
            showToast('Pregnancy loss recorded', 'warning');
        } else if (newType === 'babyCare' && oldType === 'birth') {
            // Birth complete, now tracking baby
            showToast('Now tracking baby care', 'success');
        }
    }
}

/* ═══════════════════════════════════════════════════════════════
   TRACKER DISPLAY PERSISTENCE
   ═══════════════════════════════════════════════════════════════ */

function getStorageKey() {
    return `flt_display_${getCurrentChatId()}`;
}

function saveTrackerDisplay(messageId, trackerId, data) {
    try {
        const stored = { messageId, trackerId, data, timestamp: Date.now() };
        localStorage.setItem(getStorageKey(), JSON.stringify(stored));
    } catch (e) { console.error('FLT: Save display error', e); }
}

function loadTrackerDisplay() {
    try {
        const stored = localStorage.getItem(getStorageKey());
        return stored ? JSON.parse(stored) : null;
    } catch (e) { return null; }
}

function removeOldTrackerDisplay() {
    const existing = document.querySelector('.flt-tracker-container');
    if (existing) existing.remove();

    try {
        localStorage.removeItem(getStorageKey());
    } catch (e) { }
}

function renderTracker(messageIndex) {
    const display = loadTrackerDisplay();
    if (!display) return;

    const { trackerId, data } = display;
    const html = generateTrackerHTML(trackerId, data);

    // Find message
    const messages = document.querySelectorAll('#chat .mes');
    const messageEl = messages[messageIndex];
    if (!messageEl) return;

    const mesText = messageEl.querySelector('.mes_text');
    if (!mesText) return;

    // Remove [TRACKER:...] from display
    mesText.innerHTML = mesText.innerHTML.replace(/\[TRACKER:[^\]]+\]/gi, '');

    // Remove old tracker container if exists
    const oldContainer = messageEl.querySelector('.flt-tracker-container');
    if (oldContainer) oldContainer.remove();

    // Add new container
    const container = document.createElement('div');
    container.className = 'flt-tracker-container';
    container.innerHTML = html;
    container.style.marginTop = '15px';
    mesText.appendChild(container);
}

function renderAllTrackers() {
    const display = loadTrackerDisplay();
    if (display && display.messageId !== undefined) {
        renderTracker(display.messageId);
    }
}

/* ═══════════════════════════════════════════════════════════════
   HTML GENERATORS
   ═══════════════════════════════════════════════════════════════ */

function generateTrackerHTML(trackerId, data) {
    switch (trackerId) {
        case 'conception': return genConceptionHTML(data);
        case 'pregnancy': return genPregnancyHTML(data);
        case 'birth': return genBirthHTML(data);
        case 'babycare':
        case 'babyCare': return genBabyCareHTML(data);
        case 'miscarriage': return genMiscarriageHTML(data);
        default: return `<div style="opacity:0.5;">[Unknown: ${trackerId}]</div>`;
    }
}

function genConceptionHTML(d) {
    const isYes = (d.result || '').toLowerCase() === 'yes';
    const isNo = (d.result || '').toLowerCase() === 'no';
    const color = isYes ? '#4caf50' : isNo ? '#e76f51' : '#888';
    const icon = isYes ? '✓' : isNo ? '✗' : '?';

    return `<div style="font-family:'Courier New',monospace;font-size:0.85em;padding:10px;margin:10px 0;text-align:center;border:1px dashed var(--SmartThemeBorderColor);border-radius:6px;color:var(--SmartThemeBodyColor);">
<div style="opacity:0.7;font-size:0.9em;margin-bottom:6px;"><i class="fa-solid fa-dice"></i> CONCEPTION</div>
<div style="font-size:1.4em;margin-bottom:6px;"><span style="color:var(--SmartThemeAccent);font-weight:bold;">${d.roll || '??'}</span><span style="opacity:0.4;font-size:0.7em;"> / ${d.threshold || 20}</span></div>
<div style="font-weight:bold;color:${color};font-size:1.1em;">${icon} ${isYes ? 'CONCEIVED' : isNo ? 'NOT CONCEIVED' : d.result || 'PENDING'}</div>
${isYes && d.dueDate ? `<div style="margin-top:6px;font-size:0.85em;opacity:0.7;"><i class="fa-regular fa-calendar"></i> Due: ${d.dueDate}</div>` : ''}
</div>`;
}

function genPregnancyHTML(d) {
    const week = d.week || '??';
    const size = d.size || BABY_SIZES[parseInt(week)] || '??';
    const riskColors = { 'Stable': '#4caf50', 'Mild': '#8bc34a', 'Moderate': '#f4a261', 'High': '#e76f51', 'Critical': '#dc3545' };
    const riskColor = Object.entries(riskColors).find(([k]) => (d.risks || '').includes(k))?.[1] || '#4caf50';
    const knowledgeIcon = (d.knowledge || '').toLowerCase().includes('hidden') ? 'eye-slash' : (d.knowledge || '').toLowerCase().includes('suspect') ? 'question' : 'eye';

    return `<div style="background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:6px;padding:12px;margin:10px 0;font-family:'Courier New',monospace;font-size:0.85em;color:var(--SmartThemeBodyColor);">
<div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:10px;padding-bottom:6px;font-weight:bold;color:#e91e63;text-transform:uppercase;letter-spacing:1px;">
<i class="fa-solid fa-person-pregnant"></i> Pregnancy
</div>
<div style="display:flex;align-items:center;gap:6px;font-size:0.8em;margin-bottom:10px;opacity:0.8;">
<i class="fa-solid fa-${knowledgeIcon}"></i> ${d.knowledge || 'Hidden'}
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
<div><span style="opacity:0.5;">Week</span> <strong style="color:var(--SmartThemeQuoteColor);">${week}</strong></div>
<div><span style="opacity:0.5;">Size</span> <strong style="color:var(--SmartThemeQuoteColor);">${size}</strong></div>
<div><span style="opacity:0.5;">Due</span> <strong style="color:var(--SmartThemeQuoteColor);">${d.dueDate || '??'}</strong></div>
<div><span style="opacity:0.5;">Gender</span> <strong style="color:var(--SmartThemeQuoteColor);">${d.gender || '??'}</strong></div>
</div>
${d.symptoms && d.symptoms !== 'None yet' ? `<div style="margin-top:10px;padding-top:8px;border-top:1px dotted var(--SmartThemeBorderColor);font-size:0.9em;"><i class="fa-solid fa-head-side-virus" style="opacity:0.5;"></i> ${d.symptoms}</div>` : ''}
<div style="margin-top:10px;padding:6px 8px;background:color-mix(in srgb,${riskColor} 15%,transparent);border-left:3px solid ${riskColor};border-radius:0 4px 4px 0;">
<span style="color:${riskColor};font-weight:bold;"><i class="fa-solid fa-heart-pulse"></i> ${d.risks || 'Stable'}</span>
${d.riskDetails && d.riskDetails !== 'None' ? `<span style="opacity:0.7;font-size:0.9em;"> — ${d.riskDetails}</span>` : ''}
</div>
</div>`;
}

function genBirthHTML(d) {
    return `<div style="background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;padding:12px;margin:10px 0;font-family:'Courier New',monospace;font-size:0.85em;color:var(--SmartThemeBodyColor);border-left:4px solid #2196f3;">
<div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:10px;padding-bottom:6px;font-weight:bold;color:#2196f3;text-transform:uppercase;">
<i class="fa-solid fa-baby-carriage"></i> Birth Report${d.name ? ` — ${d.name}` : ''}
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
<div><i class="fa-solid fa-venus-mars" style="opacity:0.5;width:18px;"></i> <strong>${d.gender || '??'}</strong></div>
<div><i class="fa-solid fa-weight-scale" style="opacity:0.5;width:18px;"></i> <strong>${d.weight || '??'}</strong></div>
<div><i class="fa-solid fa-ruler-vertical" style="opacity:0.5;width:18px;"></i> <strong>${d.height || '??'}</strong></div>
<div><i class="fa-solid fa-clock" style="opacity:0.5;width:18px;"></i> <strong>${d.time || '??'}</strong></div>
</div>
${d.hair || d.eyes ? `<div style="margin-top:10px;padding-top:8px;border-top:1px dotted var(--SmartThemeBorderColor);font-size:0.9em;"><i class="fa-solid fa-palette" style="opacity:0.5;"></i> Hair: ${d.hair || '??'}, Eyes: ${d.eyes || '??'}</div>` : ''}
${d.features ? `<div style="margin-top:6px;font-size:0.9em;"><i class="fa-solid fa-dna" style="opacity:0.5;"></i> ${d.features}</div>` : ''}
<div style="margin-top:10px;padding:6px 8px;background:color-mix(in srgb,${d.health === 'Healthy' ? '#4caf50' : '#f4a261'} 15%,transparent);border-radius:4px;">
<i class="fa-solid fa-heart-pulse"></i> ${d.health || 'Checking...'}
</div>
</div>`;
}

function genBabyCareHTML(d) {
    const moodEmoji = { 'Happy': '😊', 'Content': '😌', 'Fussy': '😣', 'Crying': '😭', 'Sleeping': '😴' };
    const statusColor = (val, type) => {
        const colors = {
            hunger: { 'Full': '#4caf50', 'Satisfied': '#8bc34a', 'Hungry': '#f4a261', 'Starving': '#e76f51' },
            hygiene: { 'Clean': '#4caf50', 'Needs change': '#f4a261', 'Soiled': '#e76f51' },
            energy: { 'Rested': '#4caf50', 'Active': '#8bc34a', 'Tired': '#f4a261', 'Exhausted': '#e76f51' }
        };
        return colors[type]?.[val] || '#888';
    };

    return `<div style="background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:6px;padding:12px;margin:10px 0;font-family:'Courier New',monospace;font-size:0.85em;color:var(--SmartThemeBodyColor);">
<div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:10px;padding-bottom:6px;font-weight:bold;color:#4caf50;text-transform:uppercase;">
<i class="fa-solid fa-baby"></i> ${d.name || 'Baby'} <span style="font-weight:normal;opacity:0.7;text-transform:none;">• ${d.age || 'Newborn'}</span>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
<div><i class="fa-solid fa-utensils" style="opacity:0.5;"></i> <span style="color:${statusColor(d.hunger, 'hunger')};">${d.hunger || '??'}</span></div>
<div><i class="fa-solid fa-soap" style="opacity:0.5;"></i> <span style="color:${statusColor(d.hygiene, 'hygiene')};">${d.hygiene || '??'}</span></div>
<div><i class="fa-solid fa-bed" style="opacity:0.5;"></i> <span style="color:${statusColor(d.energy, 'energy')};">${d.energy || '??'}</span></div>
<div>${moodEmoji[d.mood] || '😶'} ${d.mood || '??'}</div>
</div>
${d.milestone ? `<div style="margin-top:10px;padding:6px 8px;background:color-mix(in srgb,#9b59b6 15%,transparent);border-radius:4px;font-size:0.9em;"><i class="fa-solid fa-star" style="color:#9b59b6;"></i> ${d.milestone}</div>` : ''}
${d.health && d.health !== 'Healthy' ? `<div style="margin-top:6px;color:#e76f51;font-size:0.9em;"><i class="fa-solid fa-triangle-exclamation"></i> ${d.health}</div>` : ''}
</div>`;
}

function genMiscarriageHTML(d) {
    return `<div style="background:color-mix(in srgb,#6c757d 8%,transparent);border:1px solid #6c757d;border-radius:6px;padding:12px;margin:10px 0;font-family:'Courier New',monospace;font-size:0.85em;color:var(--SmartThemeBodyColor);">
<div style="border-bottom:1px dashed #6c757d;margin-bottom:10px;padding-bottom:6px;font-weight:bold;color:#6c757d;text-transform:uppercase;">
<i class="fa-solid fa-heart-crack"></i> Loss
</div>
<div style="line-height:1.6;">
<div><span style="opacity:0.5;">Week:</span> <strong>${d.week || '??'}</strong></div>
<div><span style="opacity:0.5;">Cause:</span> ${d.cause || '??'}</div>
<div><span style="opacity:0.5;">Physical:</span> ${d.physical || '??'}</div>
<div><span style="opacity:0.5;">Emotional:</span> <em>${d.emotional || '??'}</em></div>
${d.support ? `<div><span style="opacity:0.5;">Support:</span> ${d.support}</div>` : ''}
</div>
</div>`;
}

/* ═══════════════════════════════════════════════════════════════
   STATE PERSISTENCE
   ═══════════════════════════════════════════════════════════════ */

function getCurrentChatId() {
    try { return getContext()?.chatId?.toString() || 'global'; }
    catch (e) { return 'global'; }
}

function saveState() {
    try {
        localStorage.setItem(`flt_state_${getCurrentChatId()}`, JSON.stringify(state));
    } catch (e) { }
}

function loadState() {
    try {
        const saved = localStorage.getItem(`flt_state_${getCurrentChatId()}`);
        if (saved) {
            state = JSON.parse(saved);
            // Restore Date objects
            if (state.conceptionDate) state.conceptionDate = new Date(state.conceptionDate);
            if (state.dueDate) state.dueDate = new Date(state.dueDate);
        } else {
            resetState();
        }
    } catch (e) {
        resetState();
    }
}

function resetState() {
    state = {
        active: null,
        data: {},
        history: [],
        lastMessageId: null,
        conceptionDate: null,
        dueDate: null
    };
}

function saveSettings() {
    localStorage.setItem('flt_settings', JSON.stringify(extension_settings[extensionName]));
}

function loadSettings() {
    try {
        const saved = localStorage.getItem('flt_settings');
        if (saved) extension_settings[extensionName] = { ...defaultSettings, ...JSON.parse(saved) };
    } catch (e) { }
}

/* ═══════════════════════════════════════════════════════════════
   UTILITY
   ═══════════════════════════════════════════════════════════════ */

function formatDate(date) {
    if (!date) return '??';
    const d = date instanceof Date ? date : new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
}

function showToast(message, type = 'success') {
    const existing = document.querySelector('.flt-toast');
    if (existing) existing.remove();

    const colors = { success: '#4caf50', warning: '#f4a261', error: '#e76f51' };

    const toast = document.createElement('div');
    toast.className = 'flt-toast';
    toast.textContent = message;
    toast.style.cssText = `position:fixed;bottom:80px;right:20px;background:var(--SmartThemeBlurTintColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;padding:12px 20px;z-index:10001;box-shadow:0 4px 20px rgba(0,0,0,0.3);color:var(--SmartThemeBodyColor);font-size:13px;border-left:3px solid ${colors[type]};animation:flt-slideIn 0.3s ease;`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'flt-slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* ═══════════════════════════════════════════════════════════════
   POPUP SYSTEM
   ═══════════════════════════════════════════════════════════════ */

function closePopup() {
    const popup = document.getElementById("flt-popup");
    if (popup) popup.remove();
    document.body.style.overflow = '';
}

function createPopup(content, width = "400px") {
    closePopup();
    const isMobile = window.innerWidth <= 768;

    const popup = document.createElement("div");
    popup.id = "flt-popup";
    popup.innerHTML = `
        <div id="flt-popup-bg" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99998;"></div>
        <div style="position:fixed;top:${isMobile ? '20px' : '50%'};left:50%;transform:${isMobile ? 'translateX(-50%)' : 'translate(-50%,-50%)'};width:${isMobile ? 'calc(100vw - 40px)' : `min(${width},90vw)`};max-height:${isMobile ? 'calc(100vh - 40px)' : '80vh'};background:var(--SmartThemeBlurTintColor);border:1px solid var(--SmartThemeBorderColor);border-radius:12px;padding:20px;z-index:99999;overflow-y:auto;">
            ${content}
        </div>
    `;

    document.body.appendChild(popup);
    document.body.style.overflow = 'hidden';

    document.getElementById("flt-popup-bg").addEventListener("click", closePopup);
    document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { closePopup(); document.removeEventListener('keydown', esc); }
    });
}

/* ═══════════════════════════════════════════════════════════════
   MAIN ACTIONS
   ═══════════════════════════════════════════════════════════════ */

function showConceptionPopup() {
    const threshold = extension_settings[extensionName].conceptionThreshold || 20;

    const content = `
        <div style="text-align:center;">
            <div style="font-size:50px;margin-bottom:15px;">🎲</div>
            <div style="font-size:18px;font-weight:bold;margin-bottom:10px;color:var(--SmartThemeBodyColor);">Conception Roll</div>
            <div style="font-size:13px;opacity:0.7;margin-bottom:20px;">Threshold: ${threshold}% chance</div>

            <div style="margin-bottom:20px;">
                <label style="font-size:12px;opacity:0.7;">Adjust threshold:</label>
                <input type="range" id="flt-threshold" min="1" max="100" value="${threshold}" style="width:100%;margin-top:5px;">
                <div id="flt-threshold-val" style="font-size:14px;color:var(--SmartThemeAccent);">${threshold}%</div>
            </div>

            <button id="flt-roll-btn" style="background:#9b59b6;color:white;padding:15px 40px;border-radius:10px;border:none;font-size:16px;cursor:pointer;width:100%;">
                <i class="fa-solid fa-dice"></i> Roll!
            </button>

            <div id="flt-result" style="margin-top:20px;display:none;"></div>
        </div>
    `;

    createPopup(content, "350px");

    const slider = document.getElementById('flt-threshold');
    const valDisplay = document.getElementById('flt-threshold-val');

    slider.addEventListener('input', () => {
        valDisplay.textContent = slider.value + '%';
    });

    document.getElementById('flt-roll-btn').addEventListener('click', () => {
        extension_settings[extensionName].conceptionThreshold = parseInt(slider.value);
        saveSettings();

        const result = rollConception();
        const resultDiv = document.getElementById('flt-result');

        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div style="font-size:40px;margin-bottom:10px;animation:flt-bounce 0.5s;">${result.success ? '🎉' : '😔'}</div>
            <div style="font-size:24px;font-weight:bold;color:${result.success ? '#4caf50' : '#e76f51'};">
                ${result.roll} / ${result.threshold}
            </div>
            <div style="font-size:16px;margin-top:10px;color:${result.success ? '#4caf50' : '#e76f51'};">
                ${result.success ? '✓ Conceived!' : '✗ Not this time'}
            </div>
            ${result.success ? `<div style="margin-top:10px;font-size:13px;opacity:0.7;">Due: ${formatDate(result.dueDate)}</div>` : ''}
            <div style="margin-top:20px;font-size:12px;opacity:0.7;">
                ${result.success ? 'AI will now track the pregnancy automatically!' : 'You can try again anytime.'}
            </div>
            <button id="flt-close-result" style="margin-top:15px;background:var(--SmartThemeBorderColor);color:var(--SmartThemeBodyColor);padding:10px 30px;border-radius:8px;border:none;cursor:pointer;">
                ${result.success ? 'Start!' : 'Close'}
            </button>
        `;

        document.getElementById('flt-close-result').addEventListener('click', closePopup);
    });

    const menu = document.getElementById("flt-menu");
    if (menu) menu.style.display = "none";
}

function showStatusPopup() {
    if (!state.active) {
        showToast('No active tracker', 'warning');
        return;
    }

    const tracker = TRACKERS[state.active];
    const html = generateTrackerHTML(state.active, state.data);

    const historyHTML = state.history.slice(-10).reverse().map((h, i) => `
        <div style="padding:8px;background:${i === 0 ? 'color-mix(in srgb,var(--SmartThemeAccent) 10%,transparent)' : 'transparent'};border-radius:4px;margin-bottom:4px;font-size:11px;">
            <span style="opacity:0.5;">${new Date(h.timestamp).toLocaleTimeString()}</span>
            <span style="color:${TRACKERS[h.type]?.color || '#888'};">${h.type}</span>
        </div>
    `).join('');

    const content = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:15px;">
            <i class="${tracker.icon}" style="color:${tracker.color};font-size:20px;"></i>
            <span style="font-size:16px;font-weight:bold;color:var(--SmartThemeBodyColor);">${tracker.name}</span>
            <span style="margin-left:auto;font-size:11px;padding:3px 8px;background:${tracker.color};color:white;border-radius:10px;">ACTIVE</span>
        </div>

        <div style="margin-bottom:20px;">${html}</div>

        ${state.history.length > 0 ? `
        <div style="border-top:1px solid var(--SmartThemeBorderColor);padding-top:15px;">
            <div style="font-size:12px;opacity:0.7;margin-bottom:10px;">Recent updates:</div>
            <div style="max-height:150px;overflow-y:auto;">${historyHTML}</div>
        </div>
        ` : ''}

        <div style="display:flex;gap:10px;margin-top:20px;">
            <button id="flt-stop" style="flex:1;background:#e76f51;color:white;padding:10px;border-radius:8px;border:none;cursor:pointer;">
                <i class="fa-solid fa-stop"></i> Stop Tracking
            </button>
            <button id="flt-close-status" style="flex:1;background:var(--SmartThemeBorderColor);color:var(--SmartThemeBodyColor);padding:10px;border-radius:8px;border:none;cursor:pointer;">
                Close
            </button>
        </div>
    `;

    createPopup(content, "420px");

    document.getElementById('flt-stop').addEventListener('click', () => {
        if (confirm('Stop tracking? This will clear current data.')) {
            resetState();
            saveState();
            removeOldTrackerDisplay();
            clearSystemPrompt();
            showToast('Tracking stopped', 'warning');
            closePopup();
            updateMenuState();
        }
    });

    document.getElementById('flt-close-status').addEventListener('click', closePopup);

    const menu = document.getElementById("flt-menu");
    if (menu) menu.style.display = "none";
}

function showSettingsPopup() {
    const s = extension_settings[extensionName];

    const content = `
        <div style="font-size:16px;font-weight:bold;margin-bottom:20px;color:var(--SmartThemeBodyColor);">
            <i class="fa-solid fa-sliders"></i> Settings
        </div>

        <div style="margin-bottom:15px;">
            <label style="font-size:13px;display:block;margin-bottom:5px;">Default conception threshold:</label>
            <input type="number" id="flt-set-threshold" value="${s.conceptionThreshold || 20}" min="1" max="100" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
        </div>

        <div style="padding:15px;background:color-mix(in srgb,#e76f51 10%,transparent);border:1px solid #e76f51;border-radius:8px;margin-bottom:20px;">
            <div style="font-size:13px;color:#e76f51;margin-bottom:10px;"><i class="fa-solid fa-trash"></i> Danger Zone</div>
            <button id="flt-clear-all" style="background:#e76f51;color:white;padding:8px 16px;border:none;border-radius:6px;cursor:pointer;font-size:12px;">
                Clear All Data
            </button>
        </div>

        <div style="display:flex;gap:10px;">
            <button id="flt-save-settings" style="flex:1;background:var(--SmartThemeAccent);color:white;padding:10px;border-radius:8px;border:none;cursor:pointer;">Save</button>
            <button id="flt-close-settings" style="flex:1;background:var(--SmartThemeBorderColor);color:var(--SmartThemeBodyColor);padding:10px;border-radius:8px;border:none;cursor:pointer;">Close</button>
        </div>
    `;

    createPopup(content, "380px");

    document.getElementById('flt-clear-all').addEventListener('click', () => {
        if (confirm('Clear ALL tracker data for this chat?')) {
            resetState();
            saveState();
            removeOldTrackerDisplay();
            clearSystemPrompt();
            showToast('All data cleared', 'success');
            closePopup();
            updateMenuState();
        }
    });

    document.getElementById('flt-save-settings').addEventListener('click', () => {
        extension_settings[extensionName].conceptionThreshold = parseInt(document.getElementById('flt-set-threshold').value) || 20;
        saveSettings();
        showToast('Settings saved!', 'success');
        closePopup();
    });

    document.getElementById('flt-close-settings').addEventListener('click', closePopup);

    const menu = document.getElementById("flt-menu");
    if (menu) menu.style.display = "none";
}

/* ═══════════════════════════════════════════════════════════════
   MENU
   ═══════════════════════════════════════════════════════════════ */

function updateMenuState() {
    const statusOpt = document.getElementById('flt-status-opt');
    if (statusOpt) {
        statusOpt.style.display = state.active ? 'flex' : 'none';
    }

    const statusBadge = document.getElementById('flt-status-badge');
    if (statusBadge) {
        if (state.active) {
            const tracker = TRACKERS[state.active];
            statusBadge.innerHTML = `<i class="${tracker.icon}" style="color:${tracker.color};"></i>`;
            statusBadge.style.display = 'inline-flex';
        } else {
            statusBadge.style.display = 'none';
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
    btn.innerHTML = `
        <i class="fa-solid fa-heart-pulse"></i>
        <span id="flt-status-badge" style="display:none;position:absolute;top:-2px;right:-2px;width:12px;height:12px;background:var(--SmartThemeBlurTintColor);border-radius:50%;font-size:8px;align-items:center;justify-content:center;"></span>
    `;
    btn.style.cssText = `cursor:pointer;display:${extension_settings[extensionName].enabled ? 'inline-flex' : 'none'};align-items:center;justify-content:center;width:32px;height:32px;color:var(--SmartThemeBodyColor);font-size:14px;margin:0 2px;border-radius:5px;opacity:0.8;position:relative;`;

    btn.addEventListener("mouseenter", () => { btn.style.background = "var(--SmartThemeBorderColor)"; btn.style.opacity = "1"; });
    btn.addEventListener("mouseleave", () => { btn.style.background = ""; btn.style.opacity = "0.8"; });

    const menu = document.createElement("div");
    menu.id = "flt-menu";
    menu.style.cssText = `display:none;position:absolute;bottom:calc(100% + 5px);left:0;background:var(--SmartThemeBlurTintColor);backdrop-filter:blur(10px);border:1px solid var(--SmartThemeBorderColor);border-radius:10px;padding:8px;z-index:1001;min-width:200px;box-shadow:0 4px 15px rgba(0,0,0,0.2);`;

    menu.innerHTML = `
        <div style="padding:8px 12px;color:var(--SmartThemeAccent);font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid var(--SmartThemeBorderColor);margin-bottom:6px;">
            <i class="fa-solid fa-heart-pulse"></i> Life Tracker
        </div>

        <div class="flt-opt" data-action="conception" style="padding:12px;cursor:pointer;border-radius:8px;display:flex;align-items:center;gap:12px;">
            <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,#9b59b6 20%,transparent);border-radius:50%;color:#9b59b6;">
                <i class="fa-solid fa-dice"></i>
            </div>
            <div>
                <div style="font-size:13px;font-weight:500;">Start Conception</div>
                <div style="font-size:10px;opacity:0.6;">Roll for pregnancy</div>
            </div>
        </div>

        <div id="flt-status-opt" class="flt-opt" data-action="status" style="padding:12px;cursor:pointer;border-radius:8px;display:${state.active ? 'flex' : 'none'};align-items:center;gap:12px;">
            <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,#e91e63 20%,transparent);border-radius:50%;color:#e91e63;">
                <i class="fa-solid fa-chart-line"></i>
            </div>
            <div>
                <div style="font-size:13px;font-weight:500;">View Status</div>
                <div style="font-size:10px;opacity:0.6;">Current tracker data</div>
            </div>
        </div>

        <hr style="border:none;border-top:1px solid var(--SmartThemeBorderColor);margin:8px 0;">

        <div class="flt-opt" data-action="settings" style="padding:10px 12px;cursor:pointer;border-radius:6px;display:flex;align-items:center;gap:10px;opacity:0.8;">
            <i class="fa-solid fa-sliders" style="width:20px;text-align:center;"></i>
            <span style="font-size:12px;">Settings</span>
        </div>
    `;

    container.insertBefore(btn, container.firstChild);
    document.body.appendChild(menu);

    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        updateMenuState();
        const rect = btn.getBoundingClientRect();
        menu.style.left = rect.left + "px";
        menu.style.bottom = (window.innerHeight - rect.top + 5) + "px";
        menu.style.display = menu.style.display === "block" ? "none" : "block";
    });

    menu.querySelectorAll(".flt-opt").forEach(opt => {
        opt.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            menu.style.display = "none";

            const action = opt.dataset.action;
            if (action === "conception") showConceptionPopup();
            else if (action === "status") showStatusPopup();
            else if (action === "settings") showSettingsPopup();
        });

        opt.addEventListener("mouseenter", () => opt.style.background = "color-mix(in srgb, var(--SmartThemeAccent) 15%, transparent)");
        opt.addEventListener("mouseleave", () => opt.style.background = "");
    });

    document.addEventListener("click", (e) => {
        if (!btn.contains(e.target) && !menu.contains(e.target)) menu.style.display = "none";
    });

    return true;
}

/* ═══════════════════════════════════════════════════════════════
   EVENTS
   ═══════════════════════════════════════════════════════════════ */

eventSource.on(event_types.MESSAGE_RECEIVED, (messageIndex) => {
    if (state.active) {
        setTimeout(() => processAIResponse(messageIndex), 150);
    }
});

eventSource.on(event_types.MESSAGE_SWIPED, () => {
    // Re-apply system prompt on swipe
    if (state.active) {
        updateSystemPrompt();
    }
});

eventSource.on(event_types.CHAT_CHANGED, () => {
    loadState();
    setTimeout(() => {
        if (state.active) updateSystemPrompt();
        renderAllTrackers();
        updateMenuState();
    }, 500);
});

/* ═══════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════ */

jQuery(() => {
    loadSettings();
    loadState();

    setTimeout(() => {
        addMenu();
        if (state.active) updateSystemPrompt();
        renderAllTrackers();
        updateMenuState();
    }, 1000);

    setTimeout(() => {
        addMenu();
        renderAllTrackers();
        updateMenuState();
    }, 3000);

    const style = document.createElement('style');
    style.textContent = `
        @keyframes flt-slideIn{from{opacity:0;transform:translateX(100px);}to{opacity:1;transform:translateX(0);}}
        @keyframes flt-slideOut{from{opacity:1;transform:translateX(0);}to{opacity:0;transform:translateX(100px);}}
        @keyframes flt-bounce{0%,100%{transform:scale(1);}50%{transform:scale(1.2);}}
        .flt-tracker-container{animation:flt-fadeIn 0.3s ease;}
        @keyframes flt-fadeIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
    `;
    document.head.appendChild(style);

    console.log("Fawn's Life Tracker v5.0: AUTONOMOUS MODE Ready!");
});
