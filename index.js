/* ═══════════════════════════════════════════════════════════════
   FAWN'S LIFE TRACKER
   All trackers + Full medical details + AI autonomous
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

// Recommended tests by trimester
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
    conception: {
        id: 'conception',
        name: 'Conception Roll',
        icon: 'fa-solid fa-dice',
        color: '#9b59b6',
        description: 'Roll for pregnancy'
    },
    pregnancy: {
        id: 'pregnancy',
        name: 'Pregnancy Tracker',
        icon: 'fa-solid fa-person-pregnant',
        color: '#e91e63',
        description: 'Track pregnancy progress'
    },
    birth: {
        id: 'birth',
        name: 'Birth Report',
        icon: 'fa-solid fa-baby-carriage',
        color: '#2196f3',
        description: 'Record birth & baby'
    },
    babyCare: {
        id: 'babyCare',
        name: 'Baby Care',
        icon: 'fa-solid fa-baby',
        color: '#4caf50',
        description: 'Track baby needs'
    },
    miscarriage: {
        id: 'miscarriage',
        name: 'Loss Report',
        icon: 'fa-solid fa-heart-crack',
        color: '#6c757d',
        description: 'Pregnancy loss'
    }
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
    actualGender: null, // Real gender (may differ from ultrasound)
    ultrasoundGender: null // What ultrasound showed (can be wrong!)
};

/* ═══════════════════════════════════════════════════════════════
   SYSTEM PROMPTS - Instructions for AI
   ═══════════════════════════════════════════════════════════════ */

function generateSystemPrompt() {
    if (!state.active) return '';

    const s = extension_settings[extensionName];

    let prompt = `[OOC: LIFE TRACKER ACTIVE - ${state.active.toUpperCase()}]
At the END of your response, include a tracker update line.
Format: [TRACKER:type|field=value|field=value|...]
Fill in ALL fields based on the scene. The extension will render it as a visual widget.
Do NOT write HTML yourself.

`;

    switch (state.active) {
        case 'conception':
            prompt += `CONCEPTION ATTEMPT
Result: ${state.data.result || 'Pending'}
${state.data.result === 'Yes' ? `Character is NOW PREGNANT but doesn't know yet. Show subtle early signs. Due date: ${state.data.dueDate || '??'}` : ''}

[TRACKER:conception|roll=${state.data.roll || '??'}|threshold=${state.data.threshold || 20}|result=${state.data.result || '??'}|dueDate=${state.data.dueDate || '??'}]`;
            break;

        case 'pregnancy':
            const week = parseInt(state.data.week) || 1;
            const size = BABY_SIZES[week] || '??';
            const trimester = week <= 13 ? 'first' : week <= 26 ? 'second' : 'third';
            const recommendedTests = PREGNANCY_TESTS[trimester].join(', ');

            prompt += `PREGNANCY TRACKING - Week ${week}, Trimester ${trimester === 'first' ? '1st' : trimester === 'second' ? '2nd' : '3rd'}
Current data: ${JSON.stringify(state.data)}

YOUR TASKS:
• week: Increment when time passes in RP
• size: ${size} for week ${week}
• knowledge: Hidden → Suspected → Confirmed
• symptoms: Based on week and events
• risks: Stable/Mild Concern/Moderate Risk/High Risk/Critical
• riskDetails: Explain risks
• nextVisit: When is next checkup
• testsNeeded: What tests/procedures are due (recommended for this trimester: ${recommendedTests})

GENDER & ULTRASOUND:
• ultrasoundGender: What ultrasound shows (can be WRONG! ${s.ultrasoundErrorChance}% error chance)
• actualGender: Real gender - ${state.actualGender ? `LOCKED as ${state.actualGender}` : 'NOT YET DETERMINED - you decide when first ultrasound happens'}
${state.actualGender && state.ultrasoundGender && state.actualGender !== state.ultrasoundGender ? '⚠️ ULTRASOUND IS WRONG! Real gender will be revealed at birth!' : ''}

${s.miscarriageEnabled ? `MISCARRIAGE: If risks are High/Critical AND character ignores advice or trauma occurs, you MAY switch to [TRACKER:miscarriage|...]. Use sparingly.` : ''}
${s.autoLaborEnabled ? `LABOR: Week ≥37 = can start labor. Switch to [TRACKER:birth|...]` : ''}

[TRACKER:pregnancy|week=??|size=??|knowledge=??|ultrasoundGender=??|symptoms=??|risks=??|riskDetails=??|nextVisit=??|testsNeeded=??|dueDate=${state.data.dueDate || '??'}]`;
            break;

        case 'birth':
            prompt += `BIRTH/LABOR IN PROGRESS
${state.data.name ? `Baby name: ${state.data.name}` : 'Generate name based on characters/culture'}

GENDER: ${state.actualGender ? `CONFIRMED ${state.actualGender}` : state.ultrasoundGender ? `Ultrasound said ${state.ultrasoundGender} but VERIFY at birth!` : 'Determine now'}
${state.actualGender && state.ultrasoundGender && state.actualGender !== state.ultrasoundGender ? `🎉 SURPRISE! Ultrasound was WRONG! Baby is actually ${state.actualGender}!` : ''}

Generate realistic newborn data:
• weight: 2.5-4.5 kg typical (preterm = lower)
• height: 45-55 cm typical
• hair/eyes: Based on parent genetics
• features: Mix of parent features
• apgar: APGAR score 1-10 (7+ is good)
• health: Healthy / Needs observation / Critical
• congenitalConditions: Any birth defects or conditions (usually None, but can occur)
• birthComplications: Any complications during delivery

After birth, switch to [TRACKER:babyCare|...]

[TRACKER:birth|name=??|gender=??|weight=??|height=??|hair=??|eyes=??|features=??|apgar=??|health=??|congenitalConditions=??|birthComplications=??|time=??]`;
            break;

        case 'babyCare':
            prompt += `BABY CARE TRACKING
Baby: ${state.data.name || 'Baby'}, Age: ${state.data.age || 'Newborn'}
${state.data.congenitalConditions && state.data.congenitalConditions !== 'None' ? `⚠️ MEDICAL CONDITIONS: ${state.data.congenitalConditions} - factor into care!` : ''}
Current: ${JSON.stringify(state.data)}

UPDATE based on RP:
• age: Newborn → X days → X weeks → X months
• hunger: Full/Satisfied/Hungry/Starving
• hygiene: Clean/Needs Change/Soiled
• energy: Rested/Active/Tired/Exhausted
• mood: Happy/Content/Fussy/Crying/Sleeping
• health: Current health status
• medicalConditions: Ongoing conditions (from birth or developed)
• nextCheckup: When is next pediatric visit
• vaccinations: What's due
• milestone: New achievements

[TRACKER:babyCare|name=${state.data.name || '??'}|age=??|hunger=??|hygiene=??|energy=??|mood=??|health=??|medicalConditions=??|nextCheckup=??|milestone=??]`;
            break;

        case 'miscarriage':
            prompt += `PREGNANCY LOSS
Week: ${state.data.week || '??'}

Document the loss. Handle with sensitivity.
• cause: Natural/Medical Complications/Trauma/Unknown
• physical: Physical symptoms and recovery
• medicalCare: What medical care is needed/received

NOTE: Emotional state is controlled by the player, not auto-generated.
${state.data.emotional ? `Player specified emotional state: ${state.data.emotional}` : 'Player will roleplay emotional response.'}

[TRACKER:miscarriage|week=${state.data.week || '??'}|cause=??|physical=??|medicalCare=??${state.data.emotional ? `|emotional=${state.data.emotional}` : ''}]`;
            break;
    }

    prompt += `\n[/OOC]`;
    return prompt;
}

function updateSystemPrompt() {
    const prompt = generateSystemPrompt();
    if (prompt) {
        setExtensionPrompt('fawn-life-tracker', prompt, extension_prompt_types.IN_CHAT, 0, true, true, null, extension_prompt_roles.SYSTEM);
    } else {
        clearSystemPrompt();
    }
}

function clearSystemPrompt() {
    setExtensionPrompt('fawn-life-tracker', '', extension_prompt_types.IN_CHAT, 0, true, true, null, extension_prompt_roles.SYSTEM);
}

/* ═══════════════════════════════════════════════════════════════
   PARSE AI RESPONSE
   ═══════════════════════════════════════════════════════════════ */

function parseTrackerFromText(text) {
    const regex = /\[TRACKER:(\w+)\|([^\]]+)\]/i;
    const match = text.match(regex);
    if (!match) return null;

    const trackerId = match[1].toLowerCase();
    const dataString = match[2];
    const data = {};

    dataString.split('|').forEach(pair => {
        const eqIndex = pair.indexOf('=');
        if (eqIndex > 0) {
            const key = pair.substring(0, eqIndex).trim();
            const value = pair.substring(eqIndex + 1).trim();
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

    console.log('FLT: Parsed tracker:', parsed);

    // Handle tracker transitions
    if (parsed.trackerId !== state.active) {
        handleTransition(parsed.trackerId, parsed.data);
    }

    // Handle gender reveal at birth
    if (parsed.trackerId === 'birth' && parsed.data.gender) {
        if (!state.actualGender) {
            state.actualGender = parsed.data.gender;
        }
        // Check for ultrasound surprise
        if (state.ultrasoundGender && state.ultrasoundGender !== state.actualGender) {
            showToast(`🎉 Surprise! Baby is ${state.actualGender}, not ${state.ultrasoundGender}!`, 'info');
        }
    }

    // Track ultrasound gender separately
    if (parsed.trackerId === 'pregnancy' && parsed.data.ultrasoundGender) {
        state.ultrasoundGender = parsed.data.ultrasoundGender;
        // Determine actual gender if not set (with error chance)
        if (!state.actualGender && parsed.data.ultrasoundGender !== 'Unknown') {
            const errorChance = extension_settings[extensionName].ultrasoundErrorChance || 5;
            if (Math.random() * 100 < errorChance) {
                // Ultrasound is WRONG!
                state.actualGender = parsed.data.ultrasoundGender === 'Boy' ? 'Girl' : 'Boy';
                console.log('FLT: Ultrasound error! Actual gender:', state.actualGender);
            } else {
                state.actualGender = parsed.data.ultrasoundGender;
            }
        }
    }

    // Merge new data
    state.data = { ...state.data, ...parsed.data };
    state.lastMessageId = messageIndex;

    // Add to history
    state.history.push({
        type: parsed.trackerId,
        data: { ...parsed.data },
        messageId: messageIndex,
        timestamp: Date.now()
    });
    if (state.history.length > 50) state.history = state.history.slice(-50);

    saveState();
    saveTrackerDisplay(messageIndex, parsed.trackerId, state.data);

    setTimeout(() => renderTracker(messageIndex), 100);
    updateSystemPrompt();
    updateMenuState();
}

function handleTransition(newType, newData) {
    const oldType = state.active;
    if (newType === oldType) return;

    console.log('FLT: Transition:', oldType, '→', newType);
    removeOldTrackerDisplay();
    state.active = newType;

    // Carry over relevant data
    if (newType === 'babyCare' && oldType === 'birth') {
        // Carry over baby info from birth
        state.data.name = newData.name || state.data.name;
        state.data.congenitalConditions = newData.congenitalConditions || state.data.congenitalConditions;
        showToast('🎉 Baby born! Now tracking care.', 'success');
    } else if (newType === 'birth' && oldType === 'pregnancy') {
        showToast('Labor started!', 'info');
    } else if (newType === 'miscarriage' && oldType === 'pregnancy') {
        state.data.week = state.data.week; // Carry over week
        showToast('Pregnancy loss...', 'warning');
    } else if (newType === 'pregnancy' && oldType === 'conception') {
        showToast('Pregnancy confirmed!', 'success');
    }
}

/* ═══════════════════════════════════════════════════════════════
   TRACKER DISPLAY
   ═══════════════════════════════════════════════════════════════ */

function getDisplayKey() {
    return `flt_display_${getCurrentChatId()}`;
}

function saveTrackerDisplay(messageId, trackerId, data) {
    try {
        localStorage.setItem(getDisplayKey(), JSON.stringify({ messageId, trackerId, data }));
    } catch (e) { }
}

function loadTrackerDisplay() {
    try {
        const s = localStorage.getItem(getDisplayKey());
        return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
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
    if (display?.messageId !== undefined) {
        renderTracker(display.messageId);
    }
}

/* ═══════════════════════════════════════════════════════════════
   HTML GENERATORS
   ═══════════════════════════════════════════════════════════════ */

function generateTrackerHTML(trackerId, data) {
    const isMobile = window.innerWidth <= 768;
    const baseStyle = `font-family:'Courier New',monospace;font-size:${isMobile ? '0.8em' : '0.85em'};color:var(--SmartThemeBodyColor);`;

    switch (trackerId) {
        case 'conception': return genConceptionHTML(data, baseStyle);
        case 'pregnancy': return genPregnancyHTML(data, baseStyle, isMobile);
        case 'birth': return genBirthHTML(data, baseStyle, isMobile);
        case 'babycare':
        case 'babyCare': return genBabyCareHTML(data, baseStyle, isMobile);
        case 'miscarriage': return genMiscarriageHTML(data, baseStyle, isMobile);
        default: return '';
    }
}

function genConceptionHTML(d, baseStyle) {
    const isYes = (d.result || '').toLowerCase() === 'yes';
    const isNo = (d.result || '').toLowerCase() === 'no';
    const color = isYes ? '#4caf50' : isNo ? '#e76f51' : '#888';

    return `<div style="${baseStyle}padding:12px;margin:10px 0;text-align:center;border:1px dashed var(--SmartThemeBorderColor);border-radius:8px;">
<div style="opacity:0.7;font-size:0.9em;margin-bottom:8px;"><i class="fa-solid fa-dice"></i> CONCEPTION ROLL</div>
<div style="font-size:1.5em;margin-bottom:8px;">
    <span style="color:var(--SmartThemeAccent);font-weight:bold;">${d.roll || '??'}</span>
    <span style="opacity:0.4;font-size:0.6em;"> / ${d.threshold || 20}</span>
</div>
<div style="font-weight:bold;color:${color};font-size:1.2em;">
    ${isYes ? '✓ CONCEIVED' : isNo ? '✗ NOT THIS TIME' : '⏳ ' + (d.result || 'PENDING')}
</div>
${isYes && d.dueDate ? `<div style="margin-top:8px;font-size:0.85em;opacity:0.7;"><i class="fa-regular fa-calendar"></i> Due: ${d.dueDate}</div>` : ''}
</div>`;
}

function genPregnancyHTML(d, baseStyle, isMobile) {
    const week = d.week || '??';
    const size = d.size || BABY_SIZES[parseInt(week)] || '??';
    const riskColors = { 'Stable': '#4caf50', 'Mild Concern': '#8bc34a', 'Moderate Risk': '#f4a261', 'High Risk': '#e76f51', 'Critical': '#dc3545' };
    const riskColor = riskColors[d.risks] || '#4caf50';
    const knowledgeIcon = (d.knowledge || '').toLowerCase().includes('hidden') ? 'eye-slash' : (d.knowledge || '').toLowerCase().includes('suspect') ? 'question' : 'eye';

    // Gender display - show ultrasound result with possible uncertainty
    const genderDisplay = d.ultrasoundGender && d.ultrasoundGender !== 'Unknown'
        ? `${d.ultrasoundGender} <span style="font-size:0.8em;opacity:0.6;">(ultrasound)</span>`
        : d.gender || 'Unknown';

    return `<div style="${baseStyle}background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;padding:12px;margin:10px 0;">
<div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:10px;padding-bottom:8px;font-weight:bold;color:#e91e63;text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
    <i class="fa-solid fa-person-pregnant"></i> Pregnancy
    <span style="margin-left:auto;font-size:0.8em;opacity:0.7;font-weight:normal;text-transform:none;"><i class="fa-solid fa-${knowledgeIcon}"></i> ${d.knowledge || 'Hidden'}</span>
</div>
<div style="display:grid;grid-template-columns:${isMobile ? '1fr 1fr' : 'repeat(4, 1fr)'};gap:8px;margin-bottom:10px;">
    <div><span style="opacity:0.5;font-size:0.85em;">Week</span><br><strong style="color:var(--SmartThemeQuoteColor);font-size:1.1em;">${week}</strong></div>
    <div><span style="opacity:0.5;font-size:0.85em;">Size</span><br><strong style="color:var(--SmartThemeQuoteColor);">${size}</strong></div>
    <div><span style="opacity:0.5;font-size:0.85em;">Due</span><br><strong style="color:var(--SmartThemeQuoteColor);">${d.dueDate || '??'}</strong></div>
    <div><span style="opacity:0.5;font-size:0.85em;">Gender</span><br><strong style="color:var(--SmartThemeQuoteColor);">${genderDisplay}</strong></div>
</div>
${d.symptoms ? `<div style="padding:8px;background:color-mix(in srgb,var(--SmartThemeBodyColor) 3%,transparent);border-radius:6px;margin-bottom:10px;font-size:0.9em;"><i class="fa-solid fa-head-side-virus" style="opacity:0.5;"></i> ${d.symptoms}</div>` : ''}
${d.nextVisit || d.testsNeeded ? `
<div style="padding:8px;background:color-mix(in srgb,#2196f3 10%,transparent);border-radius:6px;margin-bottom:10px;font-size:0.9em;">
    <i class="fa-solid fa-calendar-check" style="color:#2196f3;"></i>
    ${d.nextVisit ? `<strong>Next visit:</strong> ${d.nextVisit}` : ''}
    ${d.testsNeeded ? `<br><span style="opacity:0.8;"><i class="fa-solid fa-vial" style="opacity:0.5;"></i> ${d.testsNeeded}</span>` : ''}
</div>
` : ''}
<div style="padding:8px 10px;background:color-mix(in srgb,${riskColor} 15%,transparent);border-left:3px solid ${riskColor};border-radius:0 6px 6px 0;">
    <span style="color:${riskColor};font-weight:bold;"><i class="fa-solid fa-heart-pulse"></i> ${d.risks || 'Stable'}</span>
    ${d.riskDetails ? `<span style="opacity:0.7;font-size:0.9em;"> — ${d.riskDetails}</span>` : ''}
</div>
</div>`;
}

function genBirthHTML(d, baseStyle, isMobile) {
    const healthColor = (d.health || '').toLowerCase().includes('health') ? '#4caf50' : '#f4a261';
    const hasConditions = d.congenitalConditions && d.congenitalConditions !== 'None';
    const hasComplications = d.birthComplications && d.birthComplications !== 'None';

    return `<div style="${baseStyle}background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;padding:12px;margin:10px 0;border-left:4px solid #2196f3;">
<div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:10px;padding-bottom:8px;font-weight:bold;color:#2196f3;text-transform:uppercase;letter-spacing:1px;">
    <i class="fa-solid fa-baby-carriage"></i> Birth Report ${d.name ? `— ${d.name}` : ''}
</div>
<div style="display:grid;grid-template-columns:${isMobile ? '1fr 1fr' : 'repeat(4, 1fr)'};gap:10px;margin-bottom:10px;">
    <div><i class="fa-solid fa-venus-mars" style="opacity:0.5;"></i> <strong>${d.gender || '??'}</strong></div>
    <div><i class="fa-solid fa-weight-scale" style="opacity:0.5;"></i> <strong>${d.weight || '??'}</strong></div>
    <div><i class="fa-solid fa-ruler-vertical" style="opacity:0.5;"></i> <strong>${d.height || '??'}</strong></div>
    <div><i class="fa-solid fa-clock" style="opacity:0.5;"></i> <strong>${d.time || '??'}</strong></div>
</div>
${d.apgar ? `<div style="font-size:0.9em;margin-bottom:8px;"><i class="fa-solid fa-chart-simple" style="opacity:0.5;"></i> APGAR: <strong style="color:${parseInt(d.apgar) >= 7 ? '#4caf50' : '#e76f51'};">${d.apgar}/10</strong></div>` : ''}
${d.hair || d.eyes ? `<div style="font-size:0.9em;margin-bottom:8px;"><i class="fa-solid fa-palette" style="opacity:0.5;"></i> Hair: ${d.hair || '??'} • Eyes: ${d.eyes || '??'}</div>` : ''}
${d.features ? `<div style="font-size:0.9em;margin-bottom:8px;"><i class="fa-solid fa-dna" style="opacity:0.5;"></i> ${d.features}</div>` : ''}
${hasConditions ? `<div style="padding:8px;background:color-mix(in srgb,#e76f51 15%,transparent);border-radius:6px;margin-bottom:8px;font-size:0.9em;color:#e76f51;"><i class="fa-solid fa-triangle-exclamation"></i> <strong>Condition:</strong> ${d.congenitalConditions}</div>` : ''}
${hasComplications ? `<div style="padding:8px;background:color-mix(in srgb,#f4a261 15%,transparent);border-radius:6px;margin-bottom:8px;font-size:0.9em;"><i class="fa-solid fa-notes-medical"></i> <strong>Complications:</strong> ${d.birthComplications}</div>` : ''}
<div style="padding:8px;background:color-mix(in srgb,${healthColor} 15%,transparent);border-radius:6px;text-align:center;">
    <i class="fa-solid fa-heart-pulse"></i> ${d.health || 'Checking...'}
</div>
</div>`;
}

function genBabyCareHTML(d, baseStyle, isMobile) {
    const moodEmoji = { 'Happy': '😊', 'Content': '😌', 'Fussy': '😣', 'Crying': '😭', 'Sleeping': '😴' };
    const getColor = (val, type) => {
        const colors = {
            hunger: { 'Full': '#4caf50', 'Satisfied': '#8bc34a', 'Hungry': '#f4a261', 'Starving': '#e76f51' },
            hygiene: { 'Clean': '#4caf50', 'Needs Change': '#f4a261', 'Soiled': '#e76f51' },
            energy: { 'Rested': '#4caf50', 'Active': '#8bc34a', 'Tired': '#f4a261', 'Exhausted': '#e76f51' }
        };
        return colors[type]?.[val] || '#888';
    };
    const hasConditions = d.medicalConditions && d.medicalConditions !== 'None' && d.medicalConditions !== 'Healthy';

    return `<div style="${baseStyle}background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;padding:12px;margin:10px 0;">
<div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:10px;padding-bottom:8px;font-weight:bold;color:#4caf50;text-transform:uppercase;letter-spacing:1px;">
    <i class="fa-solid fa-baby"></i> ${d.name || 'Baby'} <span style="font-weight:normal;opacity:0.7;text-transform:none;font-size:0.85em;">• ${d.age || 'Newborn'}</span>
</div>
<div style="display:grid;grid-template-columns:${isMobile ? '1fr 1fr' : 'repeat(4, 1fr)'};gap:8px;margin-bottom:10px;">
    <div><i class="fa-solid fa-utensils" style="opacity:0.5;"></i> <span style="color:${getColor(d.hunger, 'hunger')};">${d.hunger || '??'}</span></div>
    <div><i class="fa-solid fa-soap" style="opacity:0.5;"></i> <span style="color:${getColor(d.hygiene, 'hygiene')};">${d.hygiene || '??'}</span></div>
    <div><i class="fa-solid fa-bed" style="opacity:0.5;"></i> <span style="color:${getColor(d.energy, 'energy')};">${d.energy || '??'}</span></div>
    <div>${moodEmoji[d.mood] || '😶'} ${d.mood || '??'}</div>
</div>
${hasConditions ? `<div style="padding:8px;background:color-mix(in srgb,#e76f51 15%,transparent);border-radius:6px;margin-bottom:10px;font-size:0.9em;color:#e76f51;"><i class="fa-solid fa-heart-pulse"></i> ${d.medicalConditions}</div>` : ''}
${d.nextCheckup ? `<div style="font-size:0.9em;margin-bottom:8px;"><i class="fa-solid fa-calendar-check" style="opacity:0.5;color:#2196f3;"></i> Next checkup: ${d.nextCheckup}</div>` : ''}
${d.milestone ? `<div style="padding:8px;background:color-mix(in srgb,#9b59b6 15%,transparent);border-radius:6px;font-size:0.9em;"><i class="fa-solid fa-star" style="color:#9b59b6;"></i> ${d.milestone}</div>` : ''}
</div>`;
}

function genMiscarriageHTML(d, baseStyle, isMobile) {
    return `<div style="${baseStyle}background:color-mix(in srgb,#6c757d 10%,transparent);border:1px solid #6c757d;border-radius:8px;padding:12px;margin:10px 0;">
<div style="border-bottom:1px dashed #6c757d;margin-bottom:10px;padding-bottom:8px;font-weight:bold;color:#6c757d;text-transform:uppercase;letter-spacing:1px;">
    <i class="fa-solid fa-heart-crack"></i> Loss Report
</div>
<div style="display:grid;${isMobile ? '' : 'grid-template-columns:1fr 1fr;'}gap:10px;">
    <div><span style="opacity:0.5;">Week:</span> <strong>${d.week || '??'}</strong></div>
    <div><span style="opacity:0.5;">Cause:</span> ${d.cause || '??'}</div>
    <div style="${isMobile ? '' : 'grid-column:1/-1;'}"><span style="opacity:0.5;">Physical:</span> ${d.physical || '??'}</div>
    ${d.medicalCare ? `<div style="${isMobile ? '' : 'grid-column:1/-1;'}"><span style="opacity:0.5;">Medical care:</span> ${d.medicalCare}</div>` : ''}
    ${d.emotional ? `<div style="${isMobile ? '' : 'grid-column:1/-1;'}"><span style="opacity:0.5;">Emotional:</span> <em>${d.emotional}</em></div>` : ''}
</div>
</div>`;
}

/* ═══════════════════════════════════════════════════════════════
   UTILITY
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
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--SmartThemeBlurTintColor);
        border: 1px solid var(--SmartThemeBorderColor);
        border-left: 3px solid ${colors[type]};
        border-radius: 6px;
        padding: 8px 16px;
        z-index: 10001;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        color: var(--SmartThemeBodyColor);
        font-size: 13px;
        animation: flt-toastIn 0.3s ease;
        white-space: nowrap;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'flt-toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

/* ═══════════════════════════════════════════════════════════════
   POPUP SYSTEM
   ═══════════════════════════════════════════════════════════════ */
function closePopup() {
    const popup = document.getElementById("flt-popup");
    if (popup) {
        popup.remove();
    }
    // Восстанавливаем ВСЁ для body
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

    // ВАЖНО для мобильных!
    if (isMobile) {
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
    }

    document.getElementById("flt-popup-bg").addEventListener("click", closePopup);

    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closePopup();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    // Автофокус
    setTimeout(() => {
        const firstInput = popup.querySelector('textarea, input, select, button');
        if (firstInput && !firstInput.disabled) {
            firstInput.focus();
        }
    }, 100);

    return popup;
}

/* ═══════════════════════════════════════════════════════════════
   TRACKER FORMS
   ═══════════════════════════════════════════════════════════════ */

function showTrackerForm(trackerId) {
    const tracker = TRACKERS[trackerId];
    if (!tracker) return;

    const isMobile = window.innerWidth <= 768;
    const savedData = state.active === trackerId ? state.data : {};

    let formContent = '';

    switch (trackerId) {
        case 'conception':
            formContent = buildConceptionForm(savedData, isMobile);
            break;
        case 'pregnancy':
            formContent = buildPregnancyForm(savedData, isMobile);
            break;
        case 'birth':
            formContent = buildBirthForm(savedData, isMobile);
            break;
        case 'babyCare':
            formContent = buildBabyCareForm(savedData, isMobile);
            break;
        case 'miscarriage':
            formContent = buildMiscarriageForm(savedData, isMobile);
            break;
    }

    const content = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
            <div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,${tracker.color} 20%,transparent);border-radius:50%;color:${tracker.color};font-size:18px;">
                <i class="${tracker.icon}"></i>
            </div>
            <div>
                <div style="font-size:18px;font-weight:bold;color:var(--SmartThemeBodyColor);">${tracker.name}</div>
                <div style="font-size:12px;opacity:0.6;">${tracker.description}</div>
            </div>
            <button id="flt-close-x" style="margin-left:auto;background:none;border:none;color:var(--SmartThemeBodyColor);font-size:20px;cursor:pointer;opacity:0.6;">×</button>
        </div>

        <div style="background:color-mix(in srgb,var(--SmartThemeAccent) 10%,transparent);border-left:3px solid var(--SmartThemeAccent);padding:10px 12px;border-radius:0 8px 8px 0;margin-bottom:20px;font-size:13px;">
            <i class="fa-solid fa-magic-wand-sparkles"></i> Fill what you want — AI handles the rest!
        </div>

        <form id="flt-form">${formContent}</form>

        <div style="background:color-mix(in srgb,var(--SmartThemeBodyColor) 3%,transparent);border:1px dashed var(--SmartThemeBorderColor);border-radius:8px;padding:12px;margin:20px 0;">
            <div style="font-size:11px;text-transform:uppercase;color:var(--SmartThemeAccent);margin-bottom:10px;"><i class="fa-solid fa-eye"></i> Preview</div>
            <div id="flt-preview">${generateTrackerHTML(trackerId, savedData)}</div>
        </div>

        <div style="display:flex;gap:10px;${isMobile ? 'flex-direction:column;' : ''}">
            <button id="flt-start" class="menu_button" style="flex:1;background:${tracker.color};color:white;padding:14px;border-radius:8px;border:none;cursor:pointer;font-size:14px;font-weight:500;">
                <i class="fa-solid fa-play"></i> Start Tracking
            </button>
            <button id="flt-cancel" class="menu_button" style="${isMobile ? '' : 'width:100px;'}background:transparent;color:var(--SmartThemeBodyColor);padding:14px;border-radius:8px;border:1px solid var(--SmartThemeBorderColor);cursor:pointer;">
                Cancel
            </button>
        </div>
    `;

    createPopup(content, "600px");

    document.getElementById('flt-close-x').addEventListener('click', closePopup);
    document.getElementById('flt-cancel').addEventListener('click', closePopup);

    document.querySelectorAll('#flt-form input, #flt-form select, #flt-form textarea').forEach(el => {
        el.addEventListener('input', () => updatePreview(trackerId));
        el.addEventListener('change', () => updatePreview(trackerId));
    });

    setupTrackerHandlers(trackerId, savedData);

    document.getElementById('flt-start').addEventListener('click', () => {
        const formData = getFormData();
        startTracker(trackerId, formData);
    });

    document.getElementById("flt-menu").style.display = "none";
}

function buildConceptionForm(data, isMobile) {
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

function buildPregnancyForm(data, isMobile) {
    const week = data.week || '';
    const gridStyle = isMobile ? 'grid-template-columns:1fr;' : 'grid-template-columns:1fr 1fr;';
    const trimester = parseInt(week) <= 13 ? 'first' : parseInt(week) <= 26 ? 'second' : 'third';
    const suggestedTests = week ? PREGNANCY_TESTS[trimester].slice(0, 3).join(', ') : '';

    return `
        <div style="display:grid;${gridStyle}gap:15px;">
            <div>
                <label style="font-size:12px;opacity:0.7;">Week (1-42)</label>
                <input type="number" name="week" id="flt-week" value="${week}" min="1" max="42" placeholder="Current week" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Size (auto from week)</label>
                <input type="text" name="size" id="flt-size" value="${data.size || ''}" placeholder="Auto-calculated" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Knowledge Status</label>
                <select name="knowledge" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
                    <option value="Hidden" ${data.knowledge === 'Hidden' ? 'selected' : ''}>Hidden (doesn't know)</option>
                    <option value="Suspected" ${data.knowledge === 'Suspected' ? 'selected' : ''}>Suspected</option>
                    <option value="Confirmed" ${data.knowledge === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                </select>
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Ultrasound Gender <span style="font-size:10px;color:#f4a261;">(can be wrong!)</span></label>
                <select name="ultrasoundGender" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
                    <option value="Unknown" ${!data.ultrasoundGender || data.ultrasoundGender === 'Unknown' ? 'selected' : ''}>Unknown / Not checked</option>
                    <option value="Boy" ${data.ultrasoundGender === 'Boy' ? 'selected' : ''}>Boy (ultrasound)</option>
                    <option value="Girl" ${data.ultrasoundGender === 'Girl' ? 'selected' : ''}>Girl (ultrasound)</option>
                </select>
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Due Date</label>
                <input type="date" name="dueDate" id="flt-dueDate" value="${data.dueDate || ''}" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Next Visit</label>
                <input type="text" name="nextVisit" value="${data.nextVisit || ''}" placeholder="e.g., 2 weeks, March 15" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
            </div>
            <div style="grid-column:1/-1;">
                <label style="font-size:12px;opacity:0.7;">Tests/Procedures Needed</label>
                <input type="text" name="testsNeeded" value="${data.testsNeeded || ''}" placeholder="${suggestedTests || 'e.g., Blood work, Ultrasound, Glucose test'}" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
                ${week ? `<div style="font-size:10px;opacity:0.5;margin-top:4px;">Suggested for trimester: ${PREGNANCY_TESTS[trimester].join(', ')}</div>` : ''}
            </div>
            <div style="grid-column:1/-1;">
                <label style="font-size:12px;opacity:0.7;">Current Symptoms</label>
                <textarea name="symptoms" rows="2" placeholder="AI will fill based on week if empty" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);resize:vertical;">${data.symptoms || ''}</textarea>
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Risks</label>
                <select name="risks" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
                    <option value="Stable" ${data.risks === 'Stable' ? 'selected' : ''}>Stable</option>
                    <option value="Mild Concern" ${data.risks === 'Mild Concern' ? 'selected' : ''}>Mild Concern</option>
                    <option value="Moderate Risk" ${data.risks === 'Moderate Risk' ? 'selected' : ''}>Moderate Risk</option>
                    <option value="High Risk" ${data.risks === 'High Risk' ? 'selected' : ''}>High Risk</option>
                    <option value="Critical" ${data.risks === 'Critical' ? 'selected' : ''}>Critical</option>
                </select>
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Risk Details</label>
                <input type="text" name="riskDetails" value="${data.riskDetails || ''}" placeholder="Optional" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
            </div>
        </div>
    `;
}

function buildBirthForm(data, isMobile) {
    const gridStyle = isMobile ? 'grid-template-columns:1fr;' : 'grid-template-columns:1fr 1fr;';

    const conditionsOptions = CONGENITAL_CONDITIONS.map(c =>
        `<option value="${c}" ${data.congenitalConditions === c ? 'selected' : ''}>${c}</option>`
    ).join('');

    return `
        <div style="display:grid;${gridStyle}gap:15px;">
            <div>
                <label style="font-size:12px;opacity:0.7;">Baby Name (optional)</label>
                <input type="text" name="name" value="${data.name || ''}" placeholder="AI can choose" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Gender</label>
                <select name="gender" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
                    <option value="">AI decides / Reveal at birth</option>
                    <option value="Boy" ${data.gender === 'Boy' ? 'selected' : ''}>Boy</option>
                    <option value="Girl" ${data.gender === 'Girl' ? 'selected' : ''}>Girl</option>
                </select>
                ${state.ultrasoundGender ? `<div style="font-size:10px;opacity:0.6;margin-top:4px;">Ultrasound said: ${state.ultrasoundGender}</div>` : ''}
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Weight (kg)</label>
                <input type="text" name="weight" value="${data.weight || ''}" placeholder="AI generates (2.5-4.5 typical)" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Height (cm)</label>
                <input type="text" name="height" value="${data.height || ''}" placeholder="AI generates (45-55 typical)" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Health Status</label>
                <select name="health" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
                    <option value="">AI determines</option>
                    <option value="Healthy" ${data.health === 'Healthy' ? 'selected' : ''}>Healthy</option>
                    <option value="Needs Observation" ${data.health === 'Needs Observation' ? 'selected' : ''}>Needs Observation</option>
                    <option value="NICU Required" ${data.health === 'NICU Required' ? 'selected' : ''}>NICU Required</option>
                    <option value="Critical" ${data.health === 'Critical' ? 'selected' : ''}>Critical</option>
                </select>
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">APGAR Score (1-10)</label>
                <input type="number" name="apgar" value="${data.apgar || ''}" min="1" max="10" placeholder="AI scores (7+ is good)" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
            </div>
            <div style="grid-column:1/-1;">
                <label style="font-size:12px;opacity:0.7;">Congenital Conditions</label>
                <select name="congenitalConditions" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
                    ${conditionsOptions}
                </select>
            </div>
            <div style="grid-column:1/-1;">
                <label style="font-size:12px;opacity:0.7;">Birth Complications</label>
                <input type="text" name="birthComplications" value="${data.birthComplications || ''}" placeholder="None, or describe..." style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
            </div>
            <div style="grid-column:1/-1;">
                <label style="font-size:12px;opacity:0.7;">Physical Features</label>
                <textarea name="features" rows="2" placeholder="AI describes based on genetics" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);resize:vertical;">${data.features || ''}</textarea>
            </div>
        </div>
    `;
}

function buildBabyCareForm(data, isMobile) {
    const gridStyle = isMobile ? 'grid-template-columns:1fr;' : 'grid-template-columns:1fr 1fr;';

    return `
        <div style="display:grid;${gridStyle}gap:15px;">
            <div>
                <label style="font-size:12px;opacity:0.7;">Baby Name</label>
                <input type="text" name="name" value="${data.name || ''}" placeholder="Required" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Age</label>
                <input type="text" name="age" value="${data.age || ''}" placeholder="Newborn, 2 weeks, 3 months..." style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Hunger</label>
                <select name="hunger" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
                    <option value="Full" ${data.hunger === 'Full' ? 'selected' : ''}>Full</option>
                    <option value="Satisfied" ${data.hunger === 'Satisfied' ? 'selected' : ''}>Satisfied</option>
                    <option value="Hungry" ${data.hunger === 'Hungry' ? 'selected' : ''}>Hungry</option>
                    <option value="Starving" ${data.hunger === 'Starving' ? 'selected' : ''}>Starving</option>
                </select>
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Hygiene</label>
                <select name="hygiene" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
                    <option value="Clean" ${data.hygiene === 'Clean' ? 'selected' : ''}>Clean</option>
                    <option value="Needs Change" ${data.hygiene === 'Needs Change' ? 'selected' : ''}>Needs Change</option>
                    <option value="Soiled" ${data.hygiene === 'Soiled' ? 'selected' : ''}>Soiled</option>
                </select>
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Energy</label>
                <select name="energy" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
                    <option value="Rested" ${data.energy === 'Rested' ? 'selected' : ''}>Rested</option>
                    <option value="Active" ${data.energy === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Tired" ${data.energy === 'Tired' ? 'selected' : ''}>Tired</option>
                    <option value="Exhausted" ${data.energy === 'Exhausted' ? 'selected' : ''}>Exhausted</option>
                </select>
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Mood</label>
                <select name="mood" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
                    <option value="Happy" ${data.mood === 'Happy' ? 'selected' : ''}>😊 Happy</option>
                    <option value="Content" ${data.mood === 'Content' ? 'selected' : ''}>😌 Content</option>
                    <option value="Fussy" ${data.mood === 'Fussy' ? 'selected' : ''}>😣 Fussy</option>
                    <option value="Crying" ${data.mood === 'Crying' ? 'selected' : ''}>😭 Crying</option>
                    <option value="Sleeping" ${data.mood === 'Sleeping' ? 'selected' : ''}>😴 Sleeping</option>
                </select>
            </div>
            <div style="grid-column:1/-1;">
                <label style="font-size:12px;opacity:0.7;">Medical Conditions (from birth or developed)</label>
                <input type="text" name="medicalConditions" value="${data.medicalConditions || ''}" placeholder="None, or describe ongoing conditions" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Next Checkup</label>
                <input type="text" name="nextCheckup" value="${data.nextCheckup || ''}" placeholder="e.g., 2 week visit" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Health Status</label>
                <input type="text" name="health" value="${data.health || 'Healthy'}" placeholder="Healthy" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
            </div>
        </div>
    `;
}

function buildMiscarriageForm(data, isMobile) {
    return `
        <div style="background:color-mix(in srgb,#6c757d 10%,transparent);border:1px solid #6c757d;border-radius:8px;padding:12px;margin-bottom:15px;font-size:13px;">
            <i class="fa-solid fa-info-circle"></i> Emotional response is <strong>your choice</strong> to roleplay. Fill it only if you want it tracked.
        </div>
        <div style="display:grid;gap:15px;">
            <div>
                <label style="font-size:12px;opacity:0.7;">Week of Loss</label>
                <input type="number" name="week" value="${data.week || ''}" min="1" max="42" placeholder="Pregnancy week" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Cause (optional - AI can determine)</label>
                <select name="cause" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
                    <option value="">AI determines</option>
                    <option value="Natural/Unknown" ${data.cause === 'Natural/Unknown' ? 'selected' : ''}>Natural/Unknown</option>
                    <option value="Medical Complications" ${data.cause === 'Medical Complications' ? 'selected' : ''}>Medical Complications</option>
                    <option value="Trauma" ${data.cause === 'Trauma' ? 'selected' : ''}>Trauma</option>
                    <option value="Ignored Medical Advice" ${data.cause === 'Ignored Medical Advice' ? 'selected' : ''}>Ignored Medical Advice</option>
                </select>
            </div>
            <div>
                <label style="font-size:12px;opacity:0.7;">Emotional State (optional - your choice)</label>
                <select name="emotional" style="width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
                    <option value="">Not tracked / I'll roleplay it</option>
                    <option value="Devastated" ${data.emotional === 'Devastated' ? 'selected' : ''}>Devastated</option>
                    <option value="Grieving" ${data.emotional === 'Grieving' ? 'selected' : ''}>Grieving</option>
                    <option value="Numb" ${data.emotional === 'Numb' ? 'selected' : ''}>Numb</option>
                    <option value="In Denial" ${data.emotional === 'In Denial' ? 'selected' : ''}>In Denial</option>
                    <option value="Angry" ${data.emotional === 'Angry' ? 'selected' : ''}>Angry</option>
                    <option value="Relieved" ${data.emotional === 'Relieved' ? 'selected' : ''}>Relieved (complicated feelings)</option>
                    <option value="Coping" ${data.emotional === 'Coping' ? 'selected' : ''}>Coping</option>
                </select>
            </div>
        </div>
    `;
}

function setupTrackerHandlers(trackerId, data) {
    if (trackerId === 'conception') {
        const slider = document.getElementById('flt-threshold');
        const display = document.getElementById('flt-threshold-display');

        slider?.addEventListener('input', () => {
            display.textContent = slider.value + '%';
        });

        document.getElementById('flt-roll-btn')?.addEventListener('click', () => {
            const threshold = parseInt(slider.value) || 20;
            const roll = Math.floor(Math.random() * 100) + 1;
            const success = roll <= threshold;

            document.getElementById('flt-roll').value = roll;
            document.getElementById('flt-result').value = success ? 'Yes' : 'No';

            if (success) {
                const dueDate = calculateDueDate();
                document.getElementById('flt-dueDate').value = formatDate(dueDate);
            }

            const resultDiv = document.getElementById('flt-roll-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div style="font-size:50px;animation:flt-bounce 0.5s;">${success ? '🎉' : '😔'}</div>
                <div style="font-size:28px;font-weight:bold;color:${success ? '#4caf50' : '#e76f51'};">${roll} / ${threshold}</div>
                <div style="font-size:16px;margin-top:8px;color:${success ? '#4caf50' : '#e76f51'};">
                    ${success ? '✓ Conceived!' : '✗ Not this time'}
                </div>
                ${success ? `<div style="margin-top:8px;font-size:13px;opacity:0.7;">Due: ${formatDate(calculateDueDate())}</div>` : ''}
            `;

            updatePreview('conception');
        });
    }

    if (trackerId === 'pregnancy') {
        document.getElementById('flt-week')?.addEventListener('change', (e) => {
            const week = parseInt(e.target.value);
            if (week && BABY_SIZES[week]) {
                document.getElementById('flt-size').value = BABY_SIZES[week];
            }

            const dueDateEl = document.getElementById('flt-dueDate');
            if (week && !dueDateEl.value) {
                const today = new Date();
                const conception = new Date(today);
                conception.setDate(conception.getDate() - (week * 7));
                const dueDate = calculateDueDate(conception);
                dueDateEl.value = dueDate.toISOString().split('T')[0];
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
    const data = getFormData();
    const preview = document.getElementById('flt-preview');
    if (preview) {
        preview.innerHTML = generateTrackerHTML(trackerId, data);
    }
}

function startTracker(trackerId, formData) {
    state.active = trackerId;
    state.data = formData;
    state.history = [];
    state.lastMessageId = null;

    if (trackerId === 'conception' && formData.result === 'Yes') {
        state.dueDate = formData.dueDate;
    }

    // Handle ultrasound gender setting
    if (trackerId === 'pregnancy' && formData.ultrasoundGender && formData.ultrasoundGender !== 'Unknown') {
        state.ultrasoundGender = formData.ultrasoundGender;
        // Determine actual gender with error chance
        const errorChance = extension_settings[extensionName].ultrasoundErrorChance || 5;
        if (Math.random() * 100 < errorChance) {
            state.actualGender = formData.ultrasoundGender === 'Boy' ? 'Girl' : 'Boy';
            console.log('FLT: Ultrasound will be wrong! Actual:', state.actualGender);
        } else {
            state.actualGender = formData.ultrasoundGender;
        }
    }

    saveState();
    updateSystemPrompt();
    closePopup();
    updateMenuState();

    showToast(`${TRACKERS[trackerId].name} started! AI will track automatically.`, 'success');
}

/* ═══════════════════════════════════════════════════════════════
   STATUS POPUP
   ═══════════════════════════════════════════════════════════════ */

function showStatusPopup() {
    if (!state.active) {
        showToast('No active tracker', 'warning');
        return;
    }

    const tracker = TRACKERS[state.active];
    const isMobile = window.innerWidth <= 768;

    const historyHTML = state.history.slice(-10).reverse().map((h, i) => `
        <div style="padding:8px 10px;background:${i === 0 ? 'color-mix(in srgb,var(--SmartThemeAccent) 10%,transparent)' : 'transparent'};border-radius:6px;margin-bottom:4px;font-size:12px;display:flex;justify-content:space-between;">
            <span style="color:${TRACKERS[h.type]?.color || '#888'};">${TRACKERS[h.type]?.name || h.type}</span>
            <span style="opacity:0.5;">${new Date(h.timestamp).toLocaleTimeString()}</span>
        </div>
    `).join('') || '<div style="opacity:0.5;font-size:12px;">No updates yet</div>';

    // Show gender info if pregnancy
    let genderInfo = '';
    if (state.active === 'pregnancy' && (state.ultrasoundGender || state.actualGender)) {
        genderInfo = `
        <div style="padding:10px;background:color-mix(in srgb,#9b59b6 10%,transparent);border-radius:8px;margin-bottom:15px;font-size:12px;">
            <i class="fa-solid fa-venus-mars" style="color:#9b59b6;"></i>
            ${state.ultrasoundGender ? `Ultrasound: <strong>${state.ultrasoundGender}</strong>` : ''}
            ${state.actualGender && state.actualGender !== state.ultrasoundGender ? `<br><span style="color:#f4a261;">⚠️ Actual gender differs! Will be revealed at birth.</span>` : ''}
        </div>`;
    }

    const content = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
            <div style="width:50px;height:50px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,${tracker.color} 20%,transparent);border-radius:50%;color:${tracker.color};font-size:22px;">
                <i class="${tracker.icon}"></i>
            </div>
            <div style="flex:1;">
                <div style="font-size:18px;font-weight:bold;color:var(--SmartThemeBodyColor);">${tracker.name}</div>
                <div style="font-size:12px;padding:3px 8px;background:${tracker.color};color:white;border-radius:10px;display:inline-block;">ACTIVE</div>
            </div>
            <button id="flt-close-x" style="background:none;border:none;color:var(--SmartThemeBodyColor);font-size:24px;cursor:pointer;opacity:0.6;">×</button>
        </div>

        ${genderInfo}

        <div style="margin-bottom:20px;">
            ${generateTrackerHTML(state.active, state.data)}
        </div>

        <div style="border-top:1px solid var(--SmartThemeBorderColor);padding-top:15px;margin-bottom:20px;">
            <div style="font-size:12px;opacity:0.7;margin-bottom:10px;text-transform:uppercase;">Recent Updates</div>
            <div style="max-height:150px;overflow-y:auto;">${historyHTML}</div>
        </div>

        <div style="display:flex;gap:10px;${isMobile ? 'flex-direction:column;' : ''}">
            <button id="flt-edit" class="menu_button" style="flex:1;background:var(--SmartThemeAccent);color:white;padding:12px;border-radius:8px;border:none;cursor:pointer;">
                <i class="fa-solid fa-pen"></i> Edit Data
            </button>
            <button id="flt-stop" class="menu_button" style="flex:1;background:#e76f51;color:white;padding:12px;border-radius:8px;border:none;cursor:pointer;">
                <i class="fa-solid fa-stop"></i> Stop Tracking
            </button>
        </div>
    `;

    createPopup(content, "500px");

    document.getElementById('flt-close-x').addEventListener('click', closePopup);

    document.getElementById('flt-edit').addEventListener('click', () => {
        closePopup();
        showTrackerForm(state.active);
    });

    document.getElementById('flt-stop').addEventListener('click', () => {
        if (confirm('Stop tracking? Current data will be cleared.')) {
            resetState();
            saveState();
            removeOldTrackerDisplay();
            clearSystemPrompt();
            closePopup();
            updateMenuState();
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
    const isMobile = window.innerWidth <= 768;

    const toggle = (id, label, desc, key) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border-radius:8px;margin-bottom:10px;">
            <div style="flex:1;">
                <div style="font-size:14px;">${label}</div>
                <div style="font-size:11px;opacity:0.6;">${desc}</div>
            </div>
            <div id="${id}" data-key="${key}" style="width:50px;height:26px;background:${s[key] ? 'var(--SmartThemeAccent)' : 'var(--SmartThemeBorderColor)'};border-radius:13px;cursor:pointer;position:relative;flex-shrink:0;margin-left:10px;">
                <div style="position:absolute;top:3px;left:${s[key] ? '27px' : '3px'};width:20px;height:20px;background:white;border-radius:50%;transition:left 0.2s;"></div>
            </div>
        </div>
    `;

    const content = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
            <div style="font-size:18px;font-weight:bold;"><i class="fa-solid fa-sliders"></i> Settings</div>
            <button id="flt-close-x" style="background:none;border:none;color:var(--SmartThemeBodyColor);font-size:24px;cursor:pointer;opacity:0.6;">×</button>
        </div>

        ${toggle('flt-toggle-misc', 'Miscarriage Events', 'AI can trigger pregnancy loss based on risks', 'miscarriageEnabled')}
        ${toggle('flt-toggle-labor', 'Auto Labor', 'AI can start labor at 37+ weeks', 'autoLaborEnabled')}

        <div style="margin-bottom:15px;">
            <label style="font-size:13px;">Default Conception Threshold (%)</label>
            <input type="number" id="flt-set-threshold" value="${s.conceptionThreshold || 20}" min="1" max="100" style="width:100%;padding:10px;margin-top:5px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
        </div>

        <div style="margin-bottom:15px;">
            <label style="font-size:13px;">Ultrasound Error Chance (%)</label>
            <input type="number" id="flt-set-ultrasound-error" value="${s.ultrasoundErrorChance || 5}" min="0" max="50" style="width:100%;padding:10px;margin-top:5px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);">
            <div style="font-size:10px;opacity:0.6;margin-top:4px;">Chance that ultrasound gender is wrong (revealed at birth)</div>
        </div>

        <div style="padding:15px;background:color-mix(in srgb,#e76f51 10%,transparent);border:1px solid #e76f51;border-radius:8px;margin-bottom:20px;">
            <div style="font-size:13px;color:#e76f51;margin-bottom:10px;"><i class="fa-solid fa-triangle-exclamation"></i> Danger Zone</div>
            <button id="flt-clear-all" style="background:#e76f51;color:white;padding:10px 20px;border:none;border-radius:6px;cursor:pointer;font-size:13px;">
                <i class="fa-solid fa-trash"></i> Clear All Data
            </button>
        </div>

        <div style="display:flex;gap:10px;${isMobile ? 'flex-direction:column;' : ''}">
            <button id="flt-save-settings" class="menu_button" style="flex:1;background:var(--SmartThemeAccent);color:white;padding:12px;border-radius:8px;border:none;cursor:pointer;">
                <i class="fa-solid fa-check"></i> Save
            </button>
            <button id="flt-cancel-settings" class="menu_button" style="flex:1;background:transparent;color:var(--SmartThemeBodyColor);padding:12px;border-radius:8px;border:1px solid var(--SmartThemeBorderColor);cursor:pointer;">
                Cancel
            </button>
        </div>
    `;

    createPopup(content, "450px");

    document.getElementById('flt-close-x').addEventListener('click', closePopup);
    document.getElementById('flt-cancel-settings').addEventListener('click', closePopup);

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
        if (confirm('Clear ALL tracker data?')) {
            resetState();
            saveState();
            removeOldTrackerDisplay();
            clearSystemPrompt();
            updateMenuState();
            showToast('All data cleared', 'success');
        }
    });

    document.getElementById('flt-save-settings').addEventListener('click', () => {
        extension_settings[extensionName].conceptionThreshold = parseInt(document.getElementById('flt-set-threshold').value) || 20;
        extension_settings[extensionName].ultrasoundErrorChance = parseInt(document.getElementById('flt-set-ultrasound-error').value) || 5;
        saveSettings();
        closePopup();
        showToast('Settings saved!', 'success');
    });

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
    btn.innerHTML = `
        <i class="fa-solid fa-heart-pulse"></i>
        <span id="flt-active-badge" style="display:none;position:absolute;top:-3px;right:-3px;width:16px;height:16px;border-radius:50%;color:white;font-size:8px;align-items:center;justify-content:center;"></span>
    `;
    btn.style.cssText = `cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;color:var(--SmartThemeBodyColor);font-size:14px;margin:0 2px;border-radius:5px;opacity:0.8;position:relative;`;

    btn.addEventListener("mouseenter", () => { btn.style.background = "var(--SmartThemeBorderColor)"; btn.style.opacity = "1"; });
    btn.addEventListener("mouseleave", () => { btn.style.background = ""; btn.style.opacity = "0.8"; });

    const menu = document.createElement("div");
    menu.id = "flt-menu";
    menu.style.cssText = `display:none;position:absolute;bottom:calc(100% + 8px);left:0;background:var(--SmartThemeBlurTintColor);backdrop-filter:blur(10px);border:1px solid var(--SmartThemeBorderColor);border-radius:12px;padding:8px;z-index:1001;min-width:260px;box-shadow:0 4px 20px rgba(0,0,0,0.25);`;

    const trackersHTML = Object.values(TRACKERS).map(t => `
        <div class="flt-menu-item" data-action="tracker" data-tracker="${t.id}" style="padding:12px;cursor:pointer;border-radius:8px;display:flex;align-items:center;gap:12px;margin:2px 0;">
            <div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,${t.color} 20%,transparent);border-radius:50%;color:${t.color};font-size:14px;">
                <i class="${t.icon}"></i>
            </div>
            <div>
                <div style="font-size:13px;font-weight:500;">${t.name}</div>
                <div style="font-size:10px;opacity:0.6;">${t.description}</div>
            </div>
        </div>
    `).join('');

    menu.innerHTML = `
        <div style="padding:8px 12px;color:var(--SmartThemeAccent);font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid var(--SmartThemeBorderColor);margin-bottom:6px;display:flex;align-items:center;gap:8px;">
            <i class="fa-solid fa-heart-pulse"></i> Life Tracker
        </div>

        <div id="flt-status-opt" class="flt-menu-item" data-action="status" style="padding:12px;cursor:pointer;border-radius:8px;display:${state.active ? 'flex' : 'none'};align-items:center;gap:12px;margin:2px 0;background:color-mix(in srgb,var(--SmartThemeAccent) 10%,transparent);border:1px solid var(--SmartThemeAccent);">
            <div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:var(--SmartThemeAccent);border-radius:50%;color:white;font-size:14px;">
                <i class="fa-solid fa-chart-line"></i>
            </div>
            <div>
                <div style="font-size:13px;font-weight:500;">Current Status</div>
                <div style="font-size:10px;opacity:0.6;">View & manage active tracker</div>
            </div>
        </div>

        ${trackersHTML}

        <hr style="border:none;border-top:1px solid var(--SmartThemeBorderColor);margin:8px 0;">

        <div class="flt-menu-item" data-action="settings" style="padding:10px 12px;cursor:pointer;border-radius:6px;display:flex;align-items:center;gap:10px;opacity:0.8;">
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
        menu.style.left = Math.max(10, rect.left) + "px";
        menu.style.bottom = (window.innerHeight - rect.top + 8) + "px";
        menu.style.display = menu.style.display === "block" ? "none" : "block";
    });

    menu.querySelectorAll(".flt-menu-item").forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            menu.style.display = "none";

            const action = item.dataset.action;
            if (action === "tracker") showTrackerForm(item.dataset.tracker);
            else if (action === "status") showStatusPopup();
            else if (action === "settings") showSettingsPopup();
        });

        item.addEventListener("mouseenter", () => item.style.background = "color-mix(in srgb, var(--SmartThemeAccent) 15%, transparent)");
        item.addEventListener("mouseleave", () => {
            if (item.dataset.action !== 'status' || !state.active) {
                item.style.background = "";
            } else {
                item.style.background = "color-mix(in srgb,var(--SmartThemeAccent) 10%,transparent)";
            }
        });
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
    if (state.active) updateSystemPrompt();
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
        @keyframes flt-toastIn { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes flt-toastOut { from { opacity: 1; transform: translate(-50%, 0); } to { opacity: 0; transform: translate(-50%, -20px); } }
        @keyframes flt-bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
        .flt-tracker-container { animation: flt-fadeIn 0.3s ease; }
        @keyframes flt-fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
            #flt-menu { min-width: calc(100vw - 40px) !important; left: 20px !important; right: 20px !important; }
        }
    `;
    document.head.appendChild(style);

    console.log("Fawn's Life Tracker: Ready!");
});
