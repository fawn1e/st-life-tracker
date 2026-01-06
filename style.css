/* ═══════════════════════════════════════════════════════════════
   FAWN'S LIFE TRACKER - Version 3.3.0
   Smart: Short OOC + Auto-insert HTML after AI response
   ═══════════════════════════════════════════════════════════════ */

console.log("Fawn's Life Tracker: Initializing v3.3...");

import { extension_settings, getContext } from "../../../extensions.js";
import { eventSource, event_types, chat } from "../../../../script.js";
import { setExtensionPrompt, extension_prompt_types, extension_prompt_roles } from "../../../../script.js";

const extensionName = "fawns-life-tracker";

const defaultSettings = {
    enabled: true,
    autoLaborEnabled: true,
    autoTransitionEnabled: true,
    miscarriageEnabled: true,
    miscarriageBaseChance: 3,
    laborChanceBase: 15,
    laborChancePerWeek: 10
};

if (!extension_settings[extensionName]) {
    extension_settings[extensionName] = { ...defaultSettings };
}

const TRACKERS = {
    conception: {
        id: 'conception',
        name: 'Conception Roll',
        icon: 'fa-solid fa-dice',
        description: 'Pregnancy chance calculation',
        color: '#9b59b6',
        fields: [
            { id: 'roll', label: 'Roll Result (1-100)', type: 'number', min: 1, max: 100, default: '' },
            { id: 'threshold', label: 'Success Threshold', type: 'number', min: 1, max: 100, default: 20 },
            { id: 'conception', label: 'Conception Result', type: 'select', options: ['Pending', 'Yes', 'No'], default: 'Pending' },
            { id: 'conceptionDate', label: 'Conception Date', type: 'date', default: '' },
            { id: 'dueDate', label: 'Due Date', type: 'date', default: '' }
        ]
    },
    pregnancy: {
        id: 'pregnancy',
        name: 'Pregnancy Tracker',
        icon: 'fa-solid fa-person-pregnant',
        description: 'Track pregnancy progress',
        color: '#e91e63',
        fields: [
            { id: 'knowledge', label: 'Knowledge Status', type: 'select', options: ['Hidden', 'Suspected', 'Confirmed'], default: 'Hidden' },
            { id: 'week', label: 'Current Week', type: 'number', min: 1, max: 42, default: 1 },
            { id: 'size', label: 'Baby Size', type: 'text', default: '' },
            { id: 'dueDate', label: 'Due Date', type: 'date', default: '' },
            { id: 'gender', label: 'Gender', type: 'select', options: ['Unknown', 'Boy', 'Girl', 'Twins'], default: 'Unknown' },
            { id: 'symptoms', label: 'Current Symptoms', type: 'textarea', default: '' },
            { id: 'nextVisit', label: 'Next Checkup', type: 'text', default: '' },
            { id: 'risks', label: 'Risks', type: 'select', options: ['Stable', 'Mild Concern', 'Moderate Risk', 'High Risk', 'Critical'], default: 'Stable' },
            { id: 'riskDetails', label: 'Risk Details', type: 'textarea', default: '' },
            { id: 'doctorAdvice', label: "Doctor's Advice", type: 'text', default: '' },
            { id: 'adviceFollowed', label: 'Advice Followed?', type: 'select', options: ['Yes', 'Partially', 'No', 'N/A'], default: 'N/A' }
        ]
    },
    birth: {
        id: 'birth',
        name: 'Birth Report',
        icon: 'fa-solid fa-baby-carriage',
        description: 'Newborn stats & genetics',
        color: '#2196f3',
        fields: [
            { id: 'babyName', label: 'Baby Name', type: 'text', default: '' },
            { id: 'gender', label: 'Gender', type: 'select', options: ['Boy', 'Girl', 'Twins (Boys)', 'Twins (Girls)', 'Twins (Mixed)'], default: 'Boy' },
            { id: 'usAccuracy', label: 'Ultrasound Accuracy', type: 'select', options: ['Confirmed', 'Missed (Surprise!)'], default: 'Confirmed' },
            { id: 'weight', label: 'Weight (kg)', type: 'text', default: '' },
            { id: 'height', label: 'Height (cm)', type: 'text', default: '' },
            { id: 'dominance', label: 'Genetic Dominance', type: 'text', default: '' },
            { id: 'features', label: 'Physical Features', type: 'textarea', default: '' },
            { id: 'temperament', label: 'Temperament', type: 'text', default: '' },
            { id: 'health', label: 'Health', type: 'select', options: ['Stable', 'Under Observation', 'Critical'], default: 'Stable' },
            { id: 'pathology', label: 'Pathology/Defects', type: 'text', default: 'None Detected' }
        ]
    },
    babyCare: {
        id: 'babyCare',
        name: 'Baby Care Monitor',
        icon: 'fa-solid fa-baby',
        description: 'Track baby needs',
        color: '#4caf50',
        fields: [
            { id: 'name', label: 'Baby Name', type: 'text', default: '' },
            { id: 'age', label: 'Age', type: 'text', default: '' },
            { id: 'hunger', label: 'Hunger', type: 'select', options: ['Full', 'Satisfied', 'Hungry', 'Starving'], default: 'Full' },
            { id: 'hygiene', label: 'Hygiene', type: 'select', options: ['Clean', 'Needs Change', 'Soiled'], default: 'Clean' },
            { id: 'energy', label: 'Energy', type: 'select', options: ['Rested', 'Active', 'Tired', 'Exhausted'], default: 'Rested' },
            { id: 'mood', label: 'Mood', type: 'select', options: ['Happy', 'Content', 'Fussy', 'Crying', 'Sleeping'], default: 'Content' },
            { id: 'traits', label: 'Personality', type: 'text', default: '' },
            { id: 'milestone', label: 'Next Milestone', type: 'text', default: '' },
            { id: 'medical', label: 'Next Medical', type: 'text', default: '' },
            { id: 'immediateNeed', label: 'Immediate Need', type: 'text', default: 'None' }
        ]
    },
    miscarriage: {
        id: 'miscarriage',
        name: 'Loss Report',
        icon: 'fa-solid fa-heart-crack',
        description: 'Pregnancy loss',
        color: '#6c757d',
        fields: [
            { id: 'weekLost', label: 'Week of Loss', type: 'number', min: 1, max: 42, default: '' },
            { id: 'cause', label: 'Cause', type: 'select', options: ['Unknown/Natural', 'Medical Complications', 'Ignored Risks', 'Trauma/Accident', 'Health Condition'], default: 'Unknown/Natural' },
            { id: 'causeDetails', label: 'Details', type: 'textarea', default: '' },
            { id: 'medicalCare', label: 'Medical Care', type: 'select', options: ['Yes - Hospital', 'Yes - Home', 'No', 'Refused'], default: 'Yes - Hospital' },
            { id: 'physicalRecovery', label: 'Physical Recovery', type: 'select', options: ['Recovering', 'Stable', 'Complications'], default: 'Recovering' },
            { id: 'emotionalState', label: 'Emotional State', type: 'select', options: ['Devastated', 'Grieving', 'Numb', 'Coping', 'In Denial'], default: 'Grieving' },
            { id: 'support', label: 'Support System', type: 'text', default: '' },
            { id: 'notes', label: 'Notes', type: 'textarea', default: '' }
        ]
    }
};

const RISK_MULTIPLIERS = { 'Stable': 1, 'Mild Concern': 1.5, 'Moderate Risk': 2.5, 'High Risk': 4, 'Critical': 6 };
const HIGH_RISK_KEYWORDS = ['critical', 'severe', 'emergency', 'bleeding', 'contractions', 'preterm', 'water broke', 'preeclampsia', 'distress'];
const BABY_SIZES = { 4: 'Poppy seed', 5: 'Sesame seed', 6: 'Lentil', 7: 'Blueberry', 8: 'Kidney bean', 9: 'Grape', 10: 'Kumquat', 11: 'Fig', 12: 'Lime', 13: 'Pea pod', 14: 'Lemon', 15: 'Apple', 16: 'Avocado', 17: 'Turnip', 18: 'Bell pepper', 19: 'Tomato', 20: 'Banana', 21: 'Carrot', 22: 'Spaghetti squash', 23: 'Mango', 24: 'Corn', 25: 'Rutabaga', 26: 'Scallion', 27: 'Cauliflower', 28: 'Eggplant', 29: 'Butternut squash', 30: 'Cabbage', 31: 'Coconut', 32: 'Jicama', 33: 'Pineapple', 34: 'Cantaloupe', 35: 'Honeydew', 36: 'Lettuce', 37: 'Swiss chard', 38: 'Leek', 39: 'Mini watermelon', 40: 'Pumpkin', 41: 'Watermelon', 42: 'Jackfruit' };

let chatTrackerData = {};
let activeTracker = null;
let activeOOC = null; // { trackerId, data, letAiDecide, insertAfterResponse }
let pregnancyHistory = [];

/* ═══════════════════════════════════════════════════════════════
   COMPACT OOC - Only instructions, NO HTML!
   ═══════════════════════════════════════════════════════════════ */

function generateCompactOOC(trackerId, data, letAiDecide = false) {
    // Super short OOC - just the essential info for AI to write the scene
    // HTML will be auto-inserted AFTER the response!

    if (letAiDecide) {
        switch (trackerId) {
            case 'conception':
                return `[Scene: Intimate moment. Conception attempt happening.]`;
            case 'pregnancy':
                return `[Scene: Character is pregnant but may not know. Show subtle pregnancy signs naturally.]`;
            case 'birth':
                return `[Scene: Labor/birth. Write the delivery scene with emotional moments.]`;
            case 'babyCare':
                return `[Scene: Caring for newborn baby. Show parenting moments.]`;
            case 'miscarriage':
                return `[Scene: Pregnancy loss. Handle with sensitivity - show physical and emotional experience.]`;
            default:
                return `[Scene instruction for ${trackerId}]`;
        }
    }

    // User provided specific data - give AI the context
    switch (trackerId) {
        case 'conception':
            if (data.conception === 'Yes') {
                return `[Conception: SUCCESS. Character now pregnant (doesn't know yet). Show subtle early signs - fatigue, mild nausea, mood shifts. Don't reveal directly.]`;
            } else if (data.conception === 'No') {
                return `[Conception: Did not occur. Continue scene normally.]`;
            }
            return `[Conception attempt in progress.]`;

        case 'pregnancy':
            const week = data.week || '?';
            const knowledge = data.knowledge || 'Hidden';
            const risks = data.risks || 'Stable';
            let ooc = `[Pregnancy: Week ${week}`;
            if (knowledge === 'Hidden') ooc += ` - Character DOESN'T KNOW, show symptoms subtly`;
            else if (knowledge === 'Suspected') ooc += ` - Character suspects but unconfirmed`;
            if (data.symptoms) ooc += `. Symptoms: ${data.symptoms}`;
            if (risks !== 'Stable') ooc += `. ⚠ Risk: ${risks}`;
            if (data.adviceFollowed === 'No') ooc += `. IGNORING medical advice - show consequences!`;
            ooc += `]`;
            return ooc;

        case 'birth':
            let birthOoc = `[Birth scene: `;
            if (data.babyName) birthOoc += `Baby "${data.babyName}", `;
            birthOoc += `${data.gender || 'Unknown gender'}`;
            if (data.usAccuracy === 'Missed (Surprise!)') birthOoc += ` (SURPRISE - ultrasound was wrong!)`;
            if (data.features) birthOoc += `. Features: ${data.features}`;
            if (data.temperament) birthOoc += `. Temperament: ${data.temperament}`;
            if (data.health !== 'Stable') birthOoc += `. Health: ${data.health}`;
            birthOoc += `]`;
            return birthOoc;

        case 'babyCare':
            let babyOoc = `[Baby ${data.name || 'care'}: `;
            babyOoc += `Hunger=${data.hunger || 'Full'}, Mood=${data.mood || 'Content'}`;
            if (data.immediateNeed && data.immediateNeed !== 'None') {
                babyOoc += `. ⚠ NEEDS: ${data.immediateNeed}`;
            }
            babyOoc += `]`;
            return babyOoc;

        case 'miscarriage':
            return `[Pregnancy loss: Week ${data.weekLost || '?'}, Cause: ${data.cause || 'Unknown'}. Emotional state: ${data.emotionalState || 'Grieving'}. Handle sensitively.]`;

        case 'labor':
            const laborWeek = data.week || '?';
            const isPreterm = parseInt(laborWeek) < 37;
            return `[Labor: Week ${laborWeek}${isPreterm ? ' (PRETERM - urgent!)' : ''}. ${data.risks !== 'Stable' ? `Risk: ${data.risks}. ` : ''}Write contractions, delivery, first moments.]`;

        default:
            return `[${trackerId} scene]`;
    }
}

function sendTrackerOOC(trackerId, data, letAiDecide = false) {
    const prompt = generateCompactOOC(trackerId, data, letAiDecide);

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

    // Save what to insert after AI responds
    activeOOC = {
        trackerId,
        data: letAiDecide ? {} : data,
        letAiDecide,
        insertAfterResponse: true
    };
    saveActiveOOC();
    updateMenuState();

    console.log('FLT: Compact OOC sent for', trackerId, '| Will auto-insert HTML after response');
}

function clearTrackerOOC() {
    setExtensionPrompt('fawn-life-tracker', '', extension_prompt_types.IN_CHAT, 0, true, true, null, extension_prompt_roles.SYSTEM);
    activeOOC = null;
    clearActiveOOCStorage();
    updateMenuState();
}

/* ═══════════════════════════════════════════════════════════════
   AUTO-INSERT HTML AFTER AI RESPONSE
   ═══════════════════════════════════════════════════════════════ */

function insertTrackerAfterResponse() {
    if (!activeOOC || !activeOOC.insertAfterResponse) return;

    const { trackerId, data, letAiDecide } = activeOOC;

    // Generate HTML with saved data (or empty for AI-decided)
    const html = generateTrackerHTML(trackerId, data, letAiDecide);

    // Find the last AI message in DOM and append HTML
    setTimeout(() => {
        const messages = document.querySelectorAll('.mes[is_user="false"]');
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            const mesText = lastMessage.querySelector('.mes_text');

            if (mesText) {
                // Create tracker container
                const trackerDiv = document.createElement('div');
                trackerDiv.className = 'flt-tracker-insert';
                trackerDiv.innerHTML = html;
                trackerDiv.style.marginTop = '15px';

                mesText.appendChild(trackerDiv);

                console.log('FLT: HTML tracker inserted after AI response');
                showToast('Tracker added!', 'success');
            }
        }

        // Clear OOC after inserting
        clearTrackerOOC();
    }, 100);
}

/* ═══════════════════════════════════════════════════════════════
   HTML GENERATORS
   ═══════════════════════════════════════════════════════════════ */

function generateTrackerHTML(trackerId, data, isEmpty = false) {
    switch (trackerId) {
        case 'conception': return generateConceptionHTML(data, isEmpty);
        case 'pregnancy': return generatePregnancyHTML(data, isEmpty);
        case 'birth': return generateBirthHTML(data, isEmpty);
        case 'babyCare': return generateBabyCareHTML(data, isEmpty);
        case 'miscarriage': return generateMiscarriageHTML(data, isEmpty);
        default: return '';
    }
}

function generateConceptionHTML(data, isEmpty) {
    const roll = isEmpty ? '??' : (data.roll || '??');
    const threshold = isEmpty ? '20' : (data.threshold || 20);
    const conception = isEmpty ? '??' : (data.conception || 'Pending');
    const dueDate = isEmpty ? '??' : (data.dueDate ? formatDate(data.dueDate) : '??');
    const resultColor = conception === 'Yes' ? '#4caf50' : conception === 'No' ? '#e76f51' : 'var(--SmartThemeQuoteColor)';
    const resultText = conception === 'Yes' ? '✓ CONCEIVED' : conception === 'No' ? '✗ NOT THIS TIME' : '⏳ PENDING';

    return `<div style="background:transparent;color:var(--SmartThemeBodyColor);font-family:'Courier New',monospace;font-size:0.85em;padding:8px;margin:10px 0;text-align:center;letter-spacing:1px;border:1px dashed var(--SmartThemeBorderColor);border-radius:6px;">
<div style="margin-bottom:6px;opacity:0.7;font-size:0.9em;"><i class="fa-solid fa-dice"></i> CONCEPTION ROLL</div>
<div style="font-size:1.3em;margin-bottom:6px;"><span style="color:var(--SmartThemeAccent);font-weight:bold;">${roll}</span><span style="opacity:0.5;font-size:0.8em;"> / ${threshold}</span></div>
<div style="font-weight:bold;color:${resultColor};">${resultText}</div>
${conception === 'Yes' ? `<div style="margin-top:6px;font-size:0.85em;opacity:0.7;"><i class="fa-regular fa-calendar"></i> Due: ${dueDate}</div>` : ''}
</div>`;
}

function generatePregnancyHTML(data, isEmpty) {
    const week = isEmpty ? '??' : (data.week || '??');
    const size = isEmpty ? '??' : (data.size || BABY_SIZES[parseInt(data.week)] || '??');
    const knowledge = isEmpty ? '??' : (data.knowledge || 'Hidden');
    const dueDate = isEmpty ? '??' : (data.dueDate ? formatDate(data.dueDate) : '??');
    const gender = isEmpty ? '??' : (data.gender || 'Unknown');
    const symptoms = isEmpty ? '' : (data.symptoms || '');
    const risks = isEmpty ? 'Stable' : (data.risks || 'Stable');
    const riskDetails = isEmpty ? '' : (data.riskDetails || '');

    const riskColors = { 'Stable': '#4caf50', 'Mild Concern': '#f4a261', 'Moderate Risk': '#e76f51', 'High Risk': '#dc3545', 'Critical': '#6c757d' };
    const riskColor = riskColors[risks] || '#4caf50';
    const knowledgeIcon = knowledge === 'Hidden' ? 'eye-slash' : knowledge === 'Suspected' ? 'question' : 'eye';

    return `<div style="background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:6px;padding:10px;margin:10px 0;font-family:'Courier New',monospace;font-size:0.85em;color:var(--SmartThemeBodyColor);">
<div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:8px;padding-bottom:4px;font-weight:bold;color:var(--SmartThemeAccent);text-transform:uppercase;letter-spacing:1px;font-size:0.9em;">
<i class="fa-solid fa-person-pregnant"></i> Pregnancy Status
</div>
<div style="font-size:0.75em;margin-bottom:8px;opacity:0.8;"><i class="fa-solid fa-${knowledgeIcon}"></i> ${knowledge}</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:0.95em;">
<div><span style="opacity:0.6;">Week:</span> <strong style="color:var(--SmartThemeQuoteColor);">${week}</strong></div>
<div><span style="opacity:0.6;">Size:</span> <strong style="color:var(--SmartThemeQuoteColor);">${size}</strong></div>
<div><span style="opacity:0.6;">Due:</span> <strong style="color:var(--SmartThemeQuoteColor);">${dueDate}</strong></div>
<div><span style="opacity:0.6;">Gender:</span> <strong style="color:var(--SmartThemeQuoteColor);">${gender}</strong></div>
</div>
${symptoms ? `<div style="margin-top:6px;font-size:0.9em;opacity:0.85;"><i class="fa-solid fa-head-side-virus" style="opacity:0.6;"></i> ${symptoms}</div>` : ''}
<div style="margin-top:6px;padding:4px 6px;background:color-mix(in srgb,${riskColor} 15%,transparent);border-left:3px solid ${riskColor};border-radius:0 4px 4px 0;font-size:0.9em;">
<span style="color:${riskColor};font-weight:bold;"><i class="fa-solid fa-triangle-exclamation"></i> ${risks}</span>
${riskDetails ? `<span style="opacity:0.7;"> — ${riskDetails}</span>` : ''}
</div>
</div>`;
}

function generateBirthHTML(data, isEmpty) {
    const name = isEmpty ? '??' : (data.babyName || '');
    const gender = isEmpty ? '??' : (data.gender || '??');
    const weight = isEmpty ? '??' : (data.weight || '??');
    const height = isEmpty ? '??' : (data.height || '??');
    const features = isEmpty ? '' : (data.features || '');
    const temperament = isEmpty ? '' : (data.temperament || '');
    const health = isEmpty ? 'Stable' : (data.health || 'Stable');
    const pathology = isEmpty ? '' : (data.pathology || 'None Detected');

    return `<div style="background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;padding:12px;margin:10px 0;font-family:'Courier New',monospace;font-size:0.85em;color:var(--SmartThemeBodyColor);border-left:4px solid #2196f3;">
<div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:8px;padding-bottom:4px;font-weight:bold;color:#2196f3;text-transform:uppercase;font-size:0.9em;">
<i class="fa-solid fa-baby-carriage"></i> Birth Report${name ? ` — ${name}` : ''}
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.95em;">
<div><i class="fa-solid fa-venus-mars" style="opacity:0.6;width:16px;"></i> <strong>${gender}</strong></div>
<div><i class="fa-solid fa-weight-scale" style="opacity:0.6;width:16px;"></i> <strong>${weight} kg</strong></div>
<div><i class="fa-solid fa-ruler-vertical" style="opacity:0.6;width:16px;"></i> <strong>${height} cm</strong></div>
<div><i class="fa-solid fa-heart-pulse" style="opacity:0.6;width:16px;"></i> <strong>${health}</strong></div>
</div>
${features ? `<div style="margin-top:8px;padding-top:6px;border-top:1px dotted var(--SmartThemeBorderColor);font-size:0.9em;"><i class="fa-solid fa-dna" style="opacity:0.6;"></i> ${features}</div>` : ''}
${temperament ? `<div style="margin-top:4px;font-size:0.9em;opacity:0.85;"><i class="fa-solid fa-brain" style="opacity:0.6;"></i> ${temperament}</div>` : ''}
${pathology && pathology !== 'None Detected' ? `<div style="margin-top:6px;color:#e76f51;font-size:0.85em;"><i class="fa-solid fa-microscope"></i> ${pathology}</div>` : ''}
</div>`;
}

function generateBabyCareHTML(data, isEmpty) {
    const name = isEmpty ? '??' : (data.name || 'Baby');
    const age = isEmpty ? '??' : (data.age || 'Newborn');
    const hunger = isEmpty ? '??' : (data.hunger || 'Full');
    const hygiene = isEmpty ? '??' : (data.hygiene || 'Clean');
    const energy = isEmpty ? '??' : (data.energy || 'Rested');
    const mood = isEmpty ? '??' : (data.mood || 'Content');
    const immediateNeed = isEmpty ? '' : (data.immediateNeed || 'None');

    const moodEmoji = { 'Happy': '😊', 'Content': '😌', 'Fussy': '😣', 'Crying': '😭', 'Sleeping': '😴' };
    const statusColors = {
        hunger: { 'Full': '#4caf50', 'Satisfied': '#8bc34a', 'Hungry': '#f4a261', 'Starving': '#e76f51' },
        hygiene: { 'Clean': '#4caf50', 'Needs Change': '#f4a261', 'Soiled': '#e76f51' },
        energy: { 'Rested': '#4caf50', 'Active': '#8bc34a', 'Tired': '#f4a261', 'Exhausted': '#e76f51' }
    };

    return `<div style="background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:6px;padding:10px;margin:10px 0;font-family:'Courier New',monospace;font-size:0.85em;color:var(--SmartThemeBodyColor);">
<div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:8px;padding-bottom:4px;font-weight:bold;color:#4caf50;text-transform:uppercase;font-size:0.9em;">
<i class="fa-solid fa-baby"></i> ${name} <span style="font-weight:normal;opacity:0.7;text-transform:none;">• ${age}</span>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:0.95em;">
<div><i class="fa-solid fa-utensils" style="opacity:0.6;"></i> <span style="color:${statusColors.hunger[hunger] || '#888'};">${hunger}</span></div>
<div><i class="fa-solid fa-soap" style="opacity:0.6;"></i> <span style="color:${statusColors.hygiene[hygiene] || '#888'};">${hygiene}</span></div>
<div><i class="fa-solid fa-bed" style="opacity:0.6;"></i> <span style="color:${statusColors.energy[energy] || '#888'};">${energy}</span></div>
<div>${moodEmoji[mood] || '😌'} ${mood}</div>
</div>
${immediateNeed && immediateNeed !== 'None' ? `<div style="margin-top:8px;background:rgba(231,111,81,0.15);padding:6px 8px;border-radius:4px;color:#e76f51;font-size:0.9em;"><i class="fa-solid fa-exclamation-circle"></i> ${immediateNeed}</div>` : ''}
</div>`;
}

function generateMiscarriageHTML(data, isEmpty) {
    const weekLost = isEmpty ? '??' : (data.weekLost || '??');
    const cause = isEmpty ? '??' : (data.cause || 'Unknown/Natural');
    const emotionalState = isEmpty ? '??' : (data.emotionalState || 'Grieving');
    const physicalRecovery = isEmpty ? '??' : (data.physicalRecovery || 'Recovering');

    return `<div style="background:color-mix(in srgb,#6c757d 8%,transparent);border:1px solid #6c757d;border-radius:6px;padding:10px;margin:10px 0;font-family:'Courier New',monospace;font-size:0.85em;color:var(--SmartThemeBodyColor);">
<div style="border-bottom:1px dashed #6c757d;margin-bottom:8px;padding-bottom:4px;font-weight:bold;color:#6c757d;text-transform:uppercase;font-size:0.9em;">
<i class="fa-solid fa-heart-crack"></i> Loss Report
</div>
<div style="font-size:0.95em;">
<div style="margin-bottom:4px;"><span style="opacity:0.6;">Week:</span> <strong>${weekLost}</strong></div>
<div style="margin-bottom:4px;"><span style="opacity:0.6;">Cause:</span> ${cause}</div>
<div style="margin-bottom:4px;"><span style="opacity:0.6;">Physical:</span> ${physicalRecovery}</div>
<div><span style="opacity:0.6;">Emotional:</span> <em>${emotionalState}</em></div>
</div>
</div>`;
}

/* ═══════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */

function getCurrentChatId() {
    try { return getContext()?.chatId?.toString() || 'global'; }
    catch (e) { return 'global'; }
}

function loadChatData() {
    try {
        const saved = localStorage.getItem(`flt_data_${getCurrentChatId()}`);
        if (saved) {
            const parsed = JSON.parse(saved);
            chatTrackerData = parsed.trackers || {};
            activeTracker = parsed.activeTracker || null;
            pregnancyHistory = parsed.pregnancyHistory || [];
        } else {
            chatTrackerData = {};
            activeTracker = null;
            pregnancyHistory = [];
        }
        loadActiveOOC();
    } catch (e) {
        chatTrackerData = {};
        activeTracker = null;
        pregnancyHistory = [];
    }
}

function saveChatData() {
    try {
        localStorage.setItem(`flt_data_${getCurrentChatId()}`, JSON.stringify({
            trackers: chatTrackerData,
            activeTracker,
            pregnancyHistory
        }));
    } catch (e) { }
}

function saveSettings() {
    localStorage.setItem('flt_settings', JSON.stringify(extension_settings[extensionName]));
}

function loadSettingsFromStorage() {
    try {
        const saved = localStorage.getItem('flt_settings');
        if (saved) extension_settings[extensionName] = { ...defaultSettings, ...JSON.parse(saved) };
    } catch (e) { }
}

function saveActiveOOC() {
    try { localStorage.setItem(`flt_ooc_${getCurrentChatId()}`, JSON.stringify(activeOOC)); } catch (e) { }
}

function loadActiveOOC() {
    try {
        const saved = localStorage.getItem(`flt_ooc_${getCurrentChatId()}`);
        if (saved) activeOOC = JSON.parse(saved);
    } catch (e) { }
}

function clearActiveOOCStorage() {
    try { localStorage.removeItem(`flt_ooc_${getCurrentChatId()}`); } catch (e) { }
}

function hasActiveOOC() {
    return activeOOC !== null && activeOOC.trackerId;
}

function formatDate(dateString) {
    if (!dateString) return '??';
    try {
        const d = new Date(dateString);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
    } catch (e) { return dateString; }
}

function showToast(message, type = 'success') {
    const existing = document.querySelector('.flt-toast');
    if (existing) existing.remove();

    const colors = { success: '#2a9d8f', warning: '#f4a261', error: '#e76f51' };
    const icons = { success: 'check-circle', warning: 'exclamation-triangle', error: 'exclamation-circle' };

    const toast = document.createElement('div');
    toast.className = 'flt-toast';
    toast.innerHTML = `<i class="fa-solid fa-${icons[type]}"></i><span>${message}</span>`;
    toast.style.cssText = `position:fixed;bottom:80px;right:20px;background:var(--SmartThemeBlurTintColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;padding:12px 20px;z-index:10001;display:flex;align-items:center;gap:10px;box-shadow:0 4px 20px rgba(0,0,0,0.3);color:var(--SmartThemeBodyColor);font-size:13px;border-left:3px solid ${colors[type]};animation:flt-slideIn 0.3s ease;`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'flt-slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function rollConception(threshold = 20) {
    const roll = Math.floor(Math.random() * 100) + 1;
    return { roll, success: roll <= threshold };
}

function calculateDueDate(conceptionDate) {
    const d = conceptionDate ? new Date(conceptionDate) : new Date();
    d.setDate(d.getDate() + 280);
    return d.toISOString().split('T')[0];
}

/* ═══════════════════════════════════════════════════════════════
   LABOR & MISCARRIAGE CHECKS
   ═══════════════════════════════════════════════════════════════ */

function checkForMiscarriage(data, prevData = null) {
    if (!extension_settings[extensionName].miscarriageEnabled) return { triggered: false };

    const week = parseInt(data.week) || 1;
    const risks = data.risks || 'Stable';
    const adviceFollowed = data.adviceFollowed || 'N/A';

    let baseChance = week <= 12 ? (extension_settings[extensionName].miscarriageBaseChance || 3) : week <= 20 ? 1 : 0.3;
    let finalChance = baseChance * (RISK_MULTIPLIERS[risks] || 1);

    if (adviceFollowed === 'No') finalChance *= 2;
    else if (adviceFollowed === 'Partially') finalChance *= 1.3;

    finalChance = Math.min(finalChance, 40);
    const roll = Math.random() * 100;

    if (roll < finalChance) {
        let cause = 'Unknown/Natural';
        if (adviceFollowed === 'No') cause = 'Ignored Risks';
        else if (risks === 'Critical' || risks === 'High Risk') cause = 'Medical Complications';
        return { triggered: true, cause, week };
    }

    return { triggered: false };
}

function checkForLabor(data) {
    if (!extension_settings[extensionName].autoLaborEnabled) return false;

    const week = parseInt(data.week) || 0;
    const hasHighRisk = HIGH_RISK_KEYWORDS.some(kw => (data.riskDetails || '').toLowerCase().includes(kw));

    let chance = 0;
    if (week >= 42) chance = 80;
    else if (week >= 40) chance = 50;
    else if (week >= 37) chance = extension_settings[extensionName].laborChanceBase + ((week - 37) * extension_settings[extensionName].laborChancePerWeek);
    else if (week >= 34 && hasHighRisk) chance = 30;

    return Math.random() * 100 < chance;
}

/* ═══════════════════════════════════════════════════════════════
   POPUP SYSTEM
   ═══════════════════════════════════════════════════════════════ */

function closePopup() {
    const popup = document.getElementById("flt-popup");
    if (popup) popup.remove();
    document.body.style.overflow = '';
}

function createPopup(content, width = "500px") {
    closePopup();
    const isMobile = window.innerWidth <= 768;

    const popup = document.createElement("div");
    popup.id = "flt-popup";
    popup.innerHTML = `
        <div id="flt-popup-bg" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99998;"></div>
        <div style="position:fixed;top:${isMobile ? '20px' : '50%'};left:50%;transform:${isMobile ? 'translateX(-50%)' : 'translate(-50%,-50%)'};width:${isMobile ? 'calc(100vw - 40px)' : `min(${width},90vw)`};max-height:${isMobile ? 'calc(100vh - 40px)' : '85vh'};background:var(--SmartThemeBlurTintColor);border:1px solid var(--SmartThemeBorderColor);border-radius:12px;padding:20px;z-index:99999;overflow-y:auto;">
            ${content}
        </div>
    `;

    document.body.appendChild(popup);
    document.body.style.overflow = 'hidden';

    document.getElementById("flt-popup-bg").addEventListener("click", closePopup);
    document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { closePopup(); document.removeEventListener('keydown', esc); }
    });

    return popup;
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS POPUP
   ═══════════════════════════════════════════════════════════════ */

function showSettingsPopup() {
    const s = extension_settings[extensionName];

    const toggle = (id, label, desc, key) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border-radius:8px;margin-bottom:10px;">
            <div><div style="font-size:14px;font-weight:500;">${label}</div><div style="font-size:11px;opacity:0.6;">${desc}</div></div>
            <div id="${id}" data-key="${key}" style="width:50px;height:26px;background:${s[key] ? 'var(--SmartThemeAccent)' : 'var(--SmartThemeBorderColor)'};border-radius:13px;cursor:pointer;position:relative;">
                <div style="position:absolute;top:3px;left:${s[key] ? '27px' : '3px'};width:20px;height:20px;background:white;border-radius:50%;transition:left 0.2s;"></div>
            </div>
        </div>
    `;

    const content = `
        <div style="font-size:16px;font-weight:500;margin-bottom:20px;"><i class="fa-solid fa-sliders"></i> Life Tracker Settings</div>
        ${toggle('flt-t-enabled', 'Extension Enabled', 'Show/hide button', 'enabled')}
        ${toggle('flt-t-labor', 'Auto Labor Events', 'Random labor at 37+ weeks', 'autoLaborEnabled')}
        ${toggle('flt-t-misc', 'Miscarriage Events', 'Enable pregnancy loss', 'miscarriageEnabled')}
        ${toggle('flt-t-trans', 'Auto Transitions', 'Offer next tracker', 'autoTransitionEnabled')}

        <div style="padding:12px;background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border-radius:8px;margin-bottom:15px;">
            <div style="font-size:14px;font-weight:500;margin-bottom:10px;"><i class="fa-solid fa-percent"></i> Chances</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div>
                    <label style="font-size:11px;opacity:0.7;">Labor Base %</label>
                    <input type="number" id="flt-labor-base" value="${s.laborChanceBase}" style="width:100%;padding:8px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:6px;color:var(--SmartThemeBodyColor);">
                </div>
                <div>
                    <label style="font-size:11px;opacity:0.7;">Miscarriage Base %</label>
                    <input type="number" id="flt-misc-base" value="${s.miscarriageBaseChance}" style="width:100%;padding:8px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:6px;color:var(--SmartThemeBodyColor);">
                </div>
            </div>
        </div>

        ${hasActiveOOC() ? `
        <div style="padding:12px;background:color-mix(in srgb,#2a9d8f 15%,transparent);border:1px solid #2a9d8f;border-radius:8px;margin-bottom:15px;">
            <div style="color:#2a9d8f;font-weight:500;margin-bottom:8px;"><i class="fa-solid fa-paper-plane"></i> Pending: ${TRACKERS[activeOOC?.trackerId]?.name || 'Unknown'}</div>
            <div style="font-size:11px;opacity:0.7;margin-bottom:8px;">HTML will be inserted after next AI response</div>
            <button id="flt-clear-ooc" style="background:transparent;color:#2a9d8f;padding:6px 12px;border:1px solid #2a9d8f;border-radius:6px;cursor:pointer;font-size:12px;">Cancel</button>
        </div>
        ` : ''}

        <div style="padding:12px;background:color-mix(in srgb,#e76f51 10%,transparent);border:1px solid #e76f51;border-radius:8px;margin-bottom:20px;">
            <div style="color:#e76f51;font-weight:500;margin-bottom:8px;"><i class="fa-solid fa-trash"></i> Clear All Data</div>
            <button id="flt-clear-data" style="background:#e76f51;color:white;padding:8px 16px;border:none;border-radius:6px;cursor:pointer;font-size:12px;">Clear</button>
        </div>

        <div style="display:flex;gap:10px;justify-content:center;">
            <button id="flt-save" class="menu_button" style="background:var(--SmartThemeButtonColor);color:var(--SmartThemeButtonTextColor);padding:12px 24px;border-radius:8px;border:none;cursor:pointer;">Save</button>
            <button id="flt-close" class="menu_button" style="background:transparent;color:var(--SmartThemeBodyColor);padding:12px 24px;border-radius:8px;border:1px solid var(--SmartThemeBorderColor);cursor:pointer;">Close</button>
        </div>
    `;

    createPopup(content, "450px");

    document.querySelectorAll('[id^="flt-t-"]').forEach(el => {
        el.addEventListener('click', function() {
            const key = this.dataset.key;
            const newVal = !extension_settings[extensionName][key];
            extension_settings[extensionName][key] = newVal;
            this.style.background = newVal ? 'var(--SmartThemeAccent)' : 'var(--SmartThemeBorderColor)';
            this.querySelector('div').style.left = newVal ? '27px' : '3px';
            if (key === 'enabled') updateButtonVisibility();
        });
    });

    document.getElementById('flt-clear-ooc')?.addEventListener('click', () => {
        clearTrackerOOC();
        showToast('Cancelled', 'success');
        closePopup();
    });

    document.getElementById('flt-clear-data').addEventListener('click', () => {
        if (confirm('Clear all data?')) {
            chatTrackerData = {};
            activeTracker = null;
            pregnancyHistory = [];
            saveChatData();
            clearTrackerOOC();
            showToast('Data cleared', 'success');
        }
    });

    document.getElementById('flt-save').addEventListener('click', () => {
        extension_settings[extensionName].laborChanceBase = parseInt(document.getElementById('flt-labor-base').value) || 15;
        extension_settings[extensionName].miscarriageBaseChance = parseInt(document.getElementById('flt-misc-base').value) || 3;
        saveSettings();
        showToast('Saved!', 'success');
        closePopup();
    });

    document.getElementById('flt-close').addEventListener('click', closePopup);

    const menu = document.getElementById("flt-menu");
    if (menu) menu.style.display = "none";
}

/* ═══════════════════════════════════════════════════════════════
   TRACKER MODAL
   ═══════════════════════════════════════════════════════════════ */

function showTrackerModal(trackerId) {
    const tracker = TRACKERS[trackerId];
    if (!tracker) return;

    const isMobile = window.innerWidth <= 768;
    const savedData = chatTrackerData[trackerId] || {};

    if (trackerId === 'pregnancy' && savedData.week && !savedData.size) {
        savedData.size = BABY_SIZES[parseInt(savedData.week)] || '';
    }

    const fieldsHTML = tracker.fields.map(f => {
        const val = savedData[f.id] !== undefined ? savedData[f.id] : f.default || '';
        const style = `width:100%;padding:10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;color:var(--SmartThemeBodyColor);font-size:13px;`;

        let input = '';
        if (f.type === 'select') {
            input = `<select id="flt-f-${f.id}" name="${f.id}" style="${style}">${f.options.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
        } else if (f.type === 'textarea') {
            input = `<textarea id="flt-f-${f.id}" name="${f.id}" style="${style}height:60px;resize:vertical;">${val}</textarea>`;
        } else {
            input = `<input type="${f.type}" id="flt-f-${f.id}" name="${f.id}" value="${val}" ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.max !== undefined ? `max="${f.max}"` : ''} style="${style}">`;
        }

        return `<div style="margin-bottom:12px;"><label style="display:block;font-size:12px;opacity:0.8;margin-bottom:4px;">${f.label}</label>${input}</div>`;
    }).join('');

    const otherTrackers = Object.values(TRACKERS).filter(t => t.id !== trackerId).map(t => `<option value="${t.id}">${t.name}</option>`).join('');

    const rollButton = trackerId === 'conception' ? `
        <button id="flt-roll" class="menu_button" style="background:#9b59b6;color:white;padding:12px 20px;border-radius:8px;border:none;cursor:pointer;${isMobile ? 'width:100%;' : 'flex:1;'}">
            <i class="fa-solid fa-dice"></i> Roll!
        </button>
    ` : '';

    const content = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;flex-wrap:wrap;gap:10px;">
            <div style="display:flex;align-items:center;gap:8px;font-size:16px;font-weight:500;">
                <i class="${tracker.icon}" style="color:${tracker.color};"></i> ${tracker.name}
            </div>
            <select id="flt-switch" style="padding:6px 10px;background:var(--SmartThemeInputColor);border:1px solid var(--SmartThemeBorderColor);border-radius:6px;color:var(--SmartThemeBodyColor);font-size:12px;">
                <option value="">Switch to...</option>
                ${otherTrackers}
            </select>
        </div>

        <div style="background:color-mix(in srgb,#2a9d8f 10%,transparent);border-left:3px solid #2a9d8f;padding:10px;border-radius:0 6px 6px 0;margin-bottom:15px;font-size:12px;">
            <i class="fa-solid fa-magic"></i> <strong>Smart mode:</strong> Short OOC to AI → HTML auto-inserts after response!
        </div>

        <form id="flt-form">${fieldsHTML}</form>

        <div style="background:color-mix(in srgb,var(--SmartThemeBodyColor) 3%,transparent);border:1px dashed var(--SmartThemeBorderColor);border-radius:8px;padding:12px;margin:15px 0;">
            <div style="font-size:11px;text-transform:uppercase;color:var(--SmartThemeAccent);margin-bottom:8px;"><i class="fa-solid fa-eye"></i> Preview (will be inserted after AI responds)</div>
            <div id="flt-preview">${generateTrackerHTML(trackerId, savedData, false)}</div>
        </div>

        <div style="display:flex;gap:10px;justify-content:center;${isMobile ? 'flex-direction:column;' : 'flex-wrap:wrap;'}">
            ${rollButton}
            <button id="flt-apply" class="menu_button" style="background:var(--SmartThemeButtonColor);color:var(--SmartThemeButtonTextColor);padding:12px 20px;border-radius:8px;border:none;cursor:pointer;${isMobile ? 'width:100%;' : 'flex:1;'}">
                <i class="fa-solid fa-paper-plane"></i> Apply
            </button>
            <button id="flt-ai" class="menu_button" style="background:color-mix(in srgb,#9b59b6 20%,transparent);color:#9b59b6;padding:12px 20px;border-radius:8px;border:1px solid #9b59b6;cursor:pointer;${isMobile ? 'width:100%;' : 'flex:1;'}">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Let AI Decide
            </button>
            <button id="flt-cancel" class="menu_button" style="background:transparent;color:var(--SmartThemeBodyColor);padding:12px 20px;border-radius:8px;border:1px solid var(--SmartThemeBorderColor);cursor:pointer;${isMobile ? 'width:100%;' : 'flex:1;'}">
                <i class="fa-solid fa-xmark"></i> Cancel
            </button>
        </div>
    `;

    createPopup(content, "550px");

    document.getElementById('flt-switch').addEventListener('change', function() {
        if (this.value) { closePopup(); setTimeout(() => showTrackerModal(this.value), 200); }
    });

    const form = document.getElementById('flt-form');
    form.querySelectorAll('input, select, textarea').forEach(el => {
        el.addEventListener('input', () => updatePreview(trackerId));
        el.addEventListener('change', () => updatePreview(trackerId));
    });

    if (trackerId === 'pregnancy') {
        const weekEl = document.getElementById('flt-f-week');
        const sizeEl = document.getElementById('flt-f-size');
        if (weekEl && sizeEl) {
            weekEl.addEventListener('change', () => {
                const w = parseInt(weekEl.value);
                if (BABY_SIZES[w]) { sizeEl.value = BABY_SIZES[w]; updatePreview(trackerId); }
            });
        }
    }

    document.getElementById('flt-roll')?.addEventListener('click', (e) => {
        e.preventDefault();
        const thresholdEl = document.getElementById('flt-f-threshold');
        const rollEl = document.getElementById('flt-f-roll');
        const conceptionEl = document.getElementById('flt-f-conception');
        const dueDateEl = document.getElementById('flt-f-dueDate');
        const concDateEl = document.getElementById('flt-f-conceptionDate');

        const threshold = parseInt(thresholdEl?.value) || 20;
        const result = rollConception(threshold);

        if (rollEl) rollEl.value = result.roll;
        if (conceptionEl) conceptionEl.value = result.success ? 'Yes' : 'No';

        if (result.success) {
            const today = new Date().toISOString().split('T')[0];
            if (concDateEl) concDateEl.value = today;
            if (dueDateEl) dueDateEl.value = calculateDueDate(today);
        }

        updatePreview(trackerId);
        showToast(`Rolled ${result.roll}! ${result.success ? '🎉 Conceived!' : 'Not this time.'}`, result.success ? 'success' : 'warning');
    });

    // APPLY - Send compact OOC, HTML inserts after AI response
    document.getElementById('flt-apply').addEventListener('click', () => {
        const data = getFormData();

        chatTrackerData[trackerId] = data;
        activeTracker = trackerId;
        saveChatData();

        // Check events for pregnancy
        if (trackerId === 'pregnancy') {
            const miscResult = checkForMiscarriage(data);
            if (miscResult.triggered) {
                closePopup();
                triggerMiscarriagePopup(data, miscResult);
                return;
            }
            if (checkForLabor(data)) {
                closePopup();
                triggerLaborPopup(data);
                return;
            }
        }

        // Send compact OOC + queue HTML insert
        sendTrackerOOC(trackerId, data, false);
        closePopup();
        showToast(`${tracker.name} ready! Send a message.`, 'success');
    });

    // LET AI DECIDE - Empty data, AI fills in
    document.getElementById('flt-ai').addEventListener('click', () => {
        sendTrackerOOC(trackerId, {}, true);
        closePopup();
        showToast(`AI will decide! Send a message.`, 'success');
    });

    document.getElementById('flt-cancel').addEventListener('click', closePopup);

    const menu = document.getElementById("flt-menu");
    if (menu) menu.style.display = "none";
}

function getFormData() {
    const form = document.getElementById('flt-form');
    const data = {};
    new FormData(form).forEach((v, k) => data[k] = v);
    return data;
}

function updatePreview(trackerId) {
    const data = getFormData();
    const preview = document.getElementById('flt-preview');
    if (preview) preview.innerHTML = generateTrackerHTML(trackerId, data, false);
}

/* ═══════════════════════════════════════════════════════════════
   EVENT POPUPS (Labor, Miscarriage)
   ═══════════════════════════════════════════════════════════════ */

function triggerLaborPopup(data) {
    const week = data.week || '??';
    const isPreterm = parseInt(week) < 37;

    const content = `
        <div style="text-align:center;padding:20px;">
            <div style="font-size:60px;margin-bottom:20px;animation:flt-pulse 1s infinite;"><i class="fa-solid fa-heart-pulse" style="color:#e91e63;"></i></div>
            <div style="font-size:20px;font-weight:bold;margin-bottom:10px;">${isPreterm ? '⚠️ Early Labor!' : '🎉 Labor Begins!'}</div>
            <div style="font-size:13px;opacity:0.8;margin-bottom:20px;">Week ${week}</div>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                <button id="flt-labor-go" class="menu_button" style="background:#e91e63;color:white;padding:12px 20px;border-radius:8px;border:none;cursor:pointer;"><i class="fa-solid fa-paper-plane"></i> Send to AI</button>
                <button id="flt-labor-birth" class="menu_button" style="background:#2196f3;color:white;padding:12px 20px;border-radius:8px;border:none;cursor:pointer;"><i class="fa-solid fa-baby-carriage"></i> Skip to Birth</button>
            </div>
        </div>
        <style>@keyframes flt-pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.1);}}</style>
    `;

    createPopup(content, "400px");

    document.getElementById('flt-labor-go').addEventListener('click', () => {
        closePopup();
        sendTrackerOOC('labor', data, false);
        showToast('Labor scene ready!', 'success');
    });

    document.getElementById('flt-labor-birth').addEventListener('click', () => {
        closePopup();
        chatTrackerData['birth'] = { gender: data.gender || 'Unknown' };
        delete chatTrackerData['pregnancy'];
        saveChatData();
        showTrackerModal('birth');
    });
}

function triggerMiscarriagePopup(data, result) {
    const content = `
        <div style="text-align:center;padding:20px;">
            <div style="font-size:60px;margin-bottom:20px;color:#6c757d;"><i class="fa-solid fa-heart-crack"></i></div>
            <div style="font-size:18px;font-weight:bold;margin-bottom:10px;">Pregnancy Loss</div>
            <div style="font-size:13px;opacity:0.8;margin-bottom:20px;">Week ${result.week} — ${result.cause}</div>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                <button id="flt-misc-go" class="menu_button" style="background:#6c757d;color:white;padding:12px 20px;border-radius:8px;border:none;cursor:pointer;"><i class="fa-solid fa-paper-plane"></i> Send to AI</button>
                <button id="flt-misc-no" class="menu_button" style="background:transparent;color:#e76f51;padding:12px 20px;border-radius:8px;border:1px solid #e76f51;cursor:pointer;"><i class="fa-solid fa-rotate-left"></i> Override</button>
            </div>
        </div>
    `;

    createPopup(content, "400px");

    document.getElementById('flt-misc-go').addEventListener('click', () => {
        closePopup();
        const miscData = { weekLost: result.week, cause: result.cause, emotionalState: 'Grieving' };
        chatTrackerData['miscarriage'] = miscData;
        delete chatTrackerData['pregnancy'];
        activeTracker = 'miscarriage';
        saveChatData();
        sendTrackerOOC('miscarriage', miscData, false);
        showToast('Loss scene ready.', 'warning');
    });

    document.getElementById('flt-misc-no').addEventListener('click', () => {
        closePopup();
        showToast('Overridden', 'success');
    });
}

/* ═══════════════════════════════════════════════════════════════
   MENU & BUTTON
   ═══════════════════════════════════════════════════════════════ */

function updateButtonVisibility() {
    const btn = document.getElementById("flt-btn");
    if (btn) btn.style.display = extension_settings[extensionName].enabled ? 'inline-flex' : 'none';
}

function updateMenuState() {
    const clearOpt = document.getElementById("flt-clear-ooc-opt");
    if (clearOpt) clearOpt.style.display = hasActiveOOC() ? "flex" : "none";

    Object.keys(TRACKERS).forEach(id => {
        const item = document.querySelector(`[data-tracker="${id}"]`);
        if (item) {
            const activeInd = item.querySelector('.flt-active');
            const dataInd = item.querySelector('.flt-data');
            if (activeInd) activeInd.style.display = activeTracker === id ? 'inline' : 'none';
            if (dataInd) dataInd.style.display = chatTrackerData[id] ? 'inline' : 'none';
        }
    });
}

function addFLTMenu() {
    if (document.getElementById("flt-btn")) return true;

    const container = document.getElementById("leftSendForm") || document.getElementById("form_sheld") || document.querySelector("#send_form");
    if (!container) return false;

    const btn = document.createElement("div");
    btn.id = "flt-btn";
    btn.title = "Life Tracker";
    btn.innerHTML = '<i class="fa-solid fa-heart-pulse"></i>';
    btn.style.cssText = `cursor:pointer;display:${extension_settings[extensionName].enabled ? 'inline-flex' : 'none'};align-items:center;justify-content:center;width:32px;height:32px;color:var(--SmartThemeBodyColor);font-size:14px;margin:0 2px;border-radius:5px;opacity:0.8;`;

    btn.addEventListener("mouseenter", () => { btn.style.background = "var(--SmartThemeBorderColor)"; btn.style.opacity = "1"; });
    btn.addEventListener("mouseleave", () => { btn.style.background = ""; btn.style.opacity = "0.8"; });

    const menu = document.createElement("div");
    menu.id = "flt-menu";
    menu.style.cssText = `display:none;position:absolute;bottom:calc(100% + 5px);left:0;background:var(--SmartThemeBlurTintColor);backdrop-filter:blur(10px);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;padding:8px;z-index:1001;min-width:260px;box-shadow:0 4px 12px rgba(0,0,0,0.2);`;

    const trackersHTML = Object.values(TRACKERS).map(t => `
        <div class="flt-opt" data-action="tracker" data-tracker="${t.id}" style="padding:10px;cursor:pointer;border-radius:6px;margin:3px 0;display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,${t.color} 20%,transparent);border-radius:50%;color:${t.color};"><i class="${t.icon}"></i></div>
            <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:5px;font-size:13px;">
                    ${t.name}
                    <span class="flt-active" style="font-size:9px;padding:2px 5px;background:var(--SmartThemeAccent);color:white;border-radius:8px;display:none;">ACTIVE</span>
                    <span class="flt-data" style="font-size:9px;padding:2px 5px;background:${t.color};color:white;border-radius:8px;display:none;">DATA</span>
                </div>
                <div style="font-size:10px;opacity:0.6;">${t.description}</div>
            </div>
        </div>
    `).join('');

    menu.innerHTML = `
        <div style="padding:6px 10px;color:var(--SmartThemeAccent);font-size:10px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid var(--SmartThemeBorderColor);margin-bottom:5px;display:flex;align-items:center;justify-content:space-between;">
            <span><i class="fa-solid fa-heart-pulse"></i> Life Tracker</span>
            ${hasActiveOOC() ? '<span style="font-size:8px;padding:2px 5px;background:#2a9d8f;color:white;border-radius:6px;">PENDING</span>' : ''}
        </div>
        ${trackersHTML}
        <hr style="border:none;border-top:1px solid var(--SmartThemeBorderColor);margin:6px 0;">
        <div id="flt-clear-ooc-opt" class="flt-opt" data-action="clearooc" style="padding:8px 10px;cursor:pointer;border-radius:6px;color:#2a9d8f;display:${hasActiveOOC() ? 'flex' : 'none'};align-items:center;gap:8px;font-size:12px;">
            <i class="fa-solid fa-eraser"></i> Cancel Pending
        </div>
        <div class="flt-opt" data-action="settings" style="padding:8px 10px;cursor:pointer;border-radius:6px;display:flex;align-items:center;gap:8px;font-size:12px;opacity:0.8;">
            <i class="fa-solid fa-sliders"></i> Settings
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
            const action = opt.dataset.action;
            menu.style.display = "none";

            if (action === "tracker") showTrackerModal(opt.dataset.tracker);
            else if (action === "clearooc") { clearTrackerOOC(); showToast('Cancelled', 'success'); }
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
   EVENTS - Auto-insert HTML after AI response!
   ═══════════════════════════════════════════════════════════════ */

eventSource.on(event_types.MESSAGE_RECEIVED, () => {
    if (hasActiveOOC() && activeOOC.insertAfterResponse) {
        console.log('FLT: AI responded, inserting HTML tracker...');
        insertTrackerAfterResponse();
    }
});

eventSource.on(event_types.MESSAGE_SWIPED, () => {
    // On swipe/regenerate, re-send OOC
    if (activeOOC?.trackerId) {
        console.log('FLT: Swiped, re-sending OOC');
        sendTrackerOOC(activeOOC.trackerId, activeOOC.data, activeOOC.letAiDecide);
    }
});

eventSource.on(event_types.CHAT_CHANGED, () => {
    loadChatData();
    setTimeout(updateMenuState, 300);
});

eventSource.on(event_types.CHAT_LOADED, () => {
    loadChatData();
    setTimeout(updateMenuState, 500);
});

/* ═══════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════ */

jQuery(() => {
    loadSettingsFromStorage();
    loadChatData();

    setTimeout(() => { addFLTMenu(); updateMenuState(); }, 800);
    setTimeout(() => { addFLTMenu(); updateMenuState(); }, 2500);

    const style = document.createElement('style');
    style.textContent = `
        @keyframes flt-slideIn{from{opacity:0;transform:translateX(100px);}to{opacity:1;transform:translateX(0);}}
        @keyframes flt-slideOut{from{opacity:1;transform:translateX(0);}to{opacity:0;transform:translateX(100px);}}
        .flt-tracker-insert{animation:flt-fadeIn 0.3s ease;}
        @keyframes flt-fadeIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
    `;
    document.head.appendChild(style);

    console.log("Fawn's Life Tracker v3.3: Ready!");
});
