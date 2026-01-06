// ═══════════════════════════════════════════════════════════════
//  LIFE TRACKER v2.0
//  Conception | Pregnancy | Birth | Baby Care
// ═══════════════════════════════════════════════════════════════

import { getContext, extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
import { eventSource, event_types } from "../../../../script.js";

const extensionName = "life-tracker";

// ═══════════════════════════════════════════════════════════════
//  LOCALIZATION
// ═══════════════════════════════════════════════════════════════

const LANG = {
    en: {
        title: "Life Tracker",
        conception: "Conception",
        pregnancy: "Pregnancy",
        birth: "Birth",
        babyCare: "Baby",
        insert: "Insert",
        cancel: "Cancel",
        save: "Save",
        rollInsert: "Roll & Insert",
        baseChance: "Base Chance (%)",
        storyDate: "Story Date",
        manualRoll: "Manual Roll",
        manualRollHint: "Empty = auto",
        week: "Week",
        dueDate: "Due Date",
        knowledge: "Knowledge",
        hidden: "Hidden",
        disclosed: "Disclosed",
        gender: "Gender",
        unknown: "Unknown",
        boy: "Boy",
        girl: "Girl",
        twins: "Twins",
        symptoms: "Symptoms",
        symptomsHint: "Fatigue, Nausea...",
        nextVisit: "Next Visit",
        risks: "Risks",
        stable: "Stable",
        usAccuracy: "Ultrasound",
        confirmed: "Confirmed",
        missed: "Missed",
        weight: "Weight (kg)",
        height: "Height (cm)",
        dominance: "Dominance",
        features: "Features",
        featuresHint: "Mother's eyes...",
        temperament: "Temperament",
        temperamentHint: "Calm, Curious...",
        health: "Health",
        excellent: "Excellent",
        underObs: "Under Observation",
        critical: "Critical",
        pathology: "Pathology",
        noneDetected: "None Detected",
        babyName: "Name",
        age: "Age",
        hunger: "Hunger",
        full: "Full",
        satisfied: "Satisfied",
        hungry: "Hungry",
        starving: "Starving",
        hygiene: "Hygiene",
        clean: "Clean",
        needsChange: "Needs Change",
        soiled: "Soiled",
        energy: "Energy",
        rested: "Rested",
        awake: "Awake",
        tired: "Tired",
        exhausted: "Exhausted",
        mood: "Mood",
        content: "Content",
        happy: "Happy",
        fussy: "Fussy",
        crying: "Crying",
        traits: "Traits",
        milestone: "Next Milestone",
        medical: "Medical",
        immediateNeed: "Immediate Need",
        saved: "Saved",
        infoConception: "Roll for conception chance. Base 20-30% or set custom.",
        infoPregnancy: "Track pregnancy. Week auto-calculates baby size.",
        infoBirth: "Generate birth report with genetics.",
        infoBaby: "Track baby needs and development."
    },
    ru: {
        title: "Трекер Жизни",
        conception: "Зачатие",
        pregnancy: "Беременность",
        birth: "Роды",
        babyCare: "Малыш",
        insert: "Вставить",
        cancel: "Отмена",
        save: "Сохранить",
        rollInsert: "Бросить",
        baseChance: "Шанс (%)",
        storyDate: "Дата",
        manualRoll: "Вручную",
        manualRollHint: "Пусто = авто",
        week: "Неделя",
        dueDate: "Дата родов",
        knowledge: "Известность",
        hidden: "Скрыто",
        disclosed: "Известно",
        gender: "Пол",
        unknown: "Неизвестно",
        boy: "Мальчик",
        girl: "Девочка",
        twins: "Двойня",
        symptoms: "Симптомы",
        symptomsHint: "Усталость, тошнота...",
        nextVisit: "Визит",
        risks: "Риски",
        stable: "Стабильно",
        usAccuracy: "УЗИ",
        confirmed: "Верно",
        missed: "Ошибка",
        weight: "Вес (кг)",
        height: "Рост (см)",
        dominance: "Доминанта",
        features: "Черты",
        featuresHint: "Глаза мамы...",
        temperament: "Темперамент",
        temperamentHint: "Спокойный...",
        health: "Здоровье",
        excellent: "Отлично",
        underObs: "Наблюдение",
        critical: "Критично",
        pathology: "Патологии",
        noneDetected: "Нет",
        babyName: "Имя",
        age: "Возраст",
        hunger: "Голод",
        full: "Сыт",
        satisfied: "Доволен",
        hungry: "Голоден",
        starving: "Очень голоден",
        hygiene: "Гигиена",
        clean: "Чисто",
        needsChange: "Сменить",
        soiled: "Грязно",
        energy: "Энергия",
        rested: "Отдохнул",
        awake: "Бодр",
        tired: "Устал",
        exhausted: "Измотан",
        mood: "Настроение",
        content: "Доволен",
        happy: "Счастлив",
        fussy: "Капризный",
        crying: "Плачет",
        traits: "Черты",
        milestone: "Веха",
        medical: "Медицина",
        immediateNeed: "Потребность",
        saved: "Сохранено",
        infoConception: "Бросок на зачатие. База 20-30% или своя.",
        infoPregnancy: "Трекер беременности. Размер по неделе.",
        infoBirth: "Отчёт о рождении с генетикой.",
        infoBaby: "Потребности и развитие малыша."
    }
};

// ═══════════════════════════════════════════════════════════════
//  BABY SIZE
// ═══════════════════════════════════════════════════════════════

const BABY_SIZES = {
    en: {
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
    },
    ru: {
        4: "Мак", 5: "Кунжут", 6: "Чечевица", 7: "Черника",
        8: "Малина", 9: "Вишня", 10: "Клубника", 11: "Лайм",
        12: "Слива", 13: "Лимон", 14: "Нектарин", 15: "Апельсин",
        16: "Авокадо", 17: "Груша", 18: "Перец", 19: "Манго",
        20: "Банан", 21: "Гранат", 22: "Папайя", 23: "Грейпфрут",
        24: "Дыня", 25: "Капуста", 26: "Салат", 27: "Кочан",
        28: "Баклажан", 29: "Кабачок", 30: "Кокос", 31: "Ананас",
        32: "Хикама", 33: "Дыня", 34: "Канталупа", 35: "Кокос",
        36: "Дыня", 37: "Тыква", 38: "Тыква", 39: "Арбуз",
        40: "Тыква"
    }
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
//  HELPERS
// ═══════════════════════════════════════════════════════════════

function getLang() {
    const stLang = localStorage.getItem('language') || 'en';
    return LANG[stLang] ? stLang : 'en';
}

function t(key) {
    return LANG[getLang()][key] || LANG.en[key] || key;
}

function getBabySize(week) {
    const lang = getLang();
    return BABY_SIZES[lang][week] || BABY_SIZES.en[week] || "Baby";
}

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
//  PANEL HTML
// ═══════════════════════════════════════════════════════════════

function getPanelHTML() {
    const saved = {
        conception: getChatData('conception'),
        pregnancy: getChatData('pregnancy'),
        birth: getChatData('birth'),
        babyCare: getChatData('babyCare')
    };

    return `
<div id="life-tracker-panel">
    <div class="lt-header">
        <h3><i class="fa-solid fa-heart-pulse"></i> ${t('title')}</h3>
        <button class="lt-close-btn" id="lt-close"><i class="fa-solid fa-xmark"></i></button>
    </div>

    <div class="lt-tabs">
        <button class="lt-tab active" data-tab="conception">
            <i class="fa-solid fa-dice"></i>
            <span>${t('conception')}</span>
        </button>
        <button class="lt-tab" data-tab="pregnancy">
            <i class="fa-solid fa-person-pregnant"></i>
            <span>${t('pregnancy')}</span>
        </button>
        <button class="lt-tab" data-tab="birth">
            <i class="fa-solid fa-baby-carriage"></i>
            <span>${t('birth')}</span>
        </button>
        <button class="lt-tab" data-tab="babyCare">
            <i class="fa-solid fa-baby"></i>
            <span>${t('babyCare')}</span>
        </button>
    </div>

    <div class="lt-content">
        <!-- CONCEPTION -->
        <div class="lt-section active" id="lt-conception">
            <div class="lt-info"><i class="fa-solid fa-circle-info"></i>${t('infoConception')}</div>
            <div class="lt-row">
                <div class="lt-field">
                    <label>${t('baseChance')}</label>
                    <input type="number" id="lt-c-chance" value="25" min="1" max="100">
                </div>
                <div class="lt-field">
                    <label>${t('manualRoll')}</label>
                    <input type="number" id="lt-c-manual" placeholder="${t('manualRollHint')}" min="1" max="100">
                </div>
            </div>
            <div class="lt-field">
                <label>${t('storyDate')}</label>
                <input type="date" id="lt-c-date" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="lt-actions">
                <button class="lt-btn lt-btn-secondary" id="lt-c-cancel"><i class="fa-solid fa-xmark"></i> ${t('cancel')}</button>
                <button class="lt-btn lt-btn-primary" id="lt-c-roll"><i class="fa-solid fa-dice"></i> ${t('rollInsert')}</button>
            </div>
        </div>

        <!-- PREGNANCY -->
        <div class="lt-section" id="lt-pregnancy">
            <div class="lt-info"><i class="fa-solid fa-circle-info"></i>${t('infoPregnancy')}${saved.pregnancy ? `<span class="lt-saved-badge"><i class="fa-solid fa-check"></i> ${t('saved')}</span>` : ''}</div>
            <div class="lt-row">
                <div class="lt-field">
                    <label>${t('week')}</label>
                    <input type="number" id="lt-p-week" value="${saved.pregnancy?.week || 8}" min="1" max="42">
                </div>
                <div class="lt-field">
                    <label>${t('dueDate')}</label>
                    <input type="date" id="lt-p-due" value="${saved.pregnancy?.rawDue || ''}">
                </div>
            </div>
            <div class="lt-row">
                <div class="lt-field">
                    <label>${t('knowledge')}</label>
                    <select id="lt-p-disclosed">
                        <option value="false">${t('hidden')}</option>
                        <option value="true" ${saved.pregnancy?.disclosed ? 'selected' : ''}>${t('disclosed')}</option>
                    </select>
                </div>
                <div class="lt-field">
                    <label>${t('gender')}</label>
                    <select id="lt-p-gender">
                        <option value="${t('unknown')}">${t('unknown')}</option>
                        <option value="${t('boy')}">${t('boy')}</option>
                        <option value="${t('girl')}">${t('girl')}</option>
                        <option value="${t('twins')}">${t('twins')}</option>
                    </select>
                </div>
            </div>
            <div class="lt-field">
                <label>${t('symptoms')}</label>
                <input type="text" id="lt-p-symptoms" placeholder="${t('symptomsHint')}" value="${saved.pregnancy?.symptoms || ''}">
            </div>
            <div class="lt-row">
                <div class="lt-field">
                    <label>${t('nextVisit')}</label>
                    <input type="text" id="lt-p-visit" value="${saved.pregnancy?.nextVisit || ''}">
                </div>
                <div class="lt-field">
                    <label>${t('risks')}</label>
                    <input type="text" id="lt-p-risks" placeholder="${t('stable')}" value="${saved.pregnancy?.risks || ''}">
                </div>
            </div>
            <div class="lt-actions">
                <button class="lt-btn lt-btn-secondary" id="lt-p-cancel"><i class="fa-solid fa-xmark"></i> ${t('cancel')}</button>
                <button class="lt-btn lt-btn-primary" id="lt-p-insert"><i class="fa-solid fa-paste"></i> ${t('insert')}</button>
            </div>
        </div>

        <!-- BIRTH -->
        <div class="lt-section" id="lt-birth">
            <div class="lt-info"><i class="fa-solid fa-circle-info"></i>${t('infoBirth')}</div>
            <div class="lt-row">
                <div class="lt-field">
                    <label>${t('gender')}</label>
                    <select id="lt-b-gender">
                        <option value="${t('girl')}">${t('girl')}</option>
                        <option value="${t('boy')}">${t('boy')}</option>
                        <option value="${t('twins')}">${t('twins')}</option>
                    </select>
                </div>
                <div class="lt-field">
                    <label>${t('usAccuracy')}</label>
                    <select id="lt-b-accuracy">
                        <option value="${t('confirmed')}">${t('confirmed')}</option>
                        <option value="${t('missed')}">${t('missed')}</option>
                    </select>
                </div>
            </div>
            <div class="lt-row">
                <div class="lt-field">
                    <label>${t('weight')}</label>
                    <input type="number" id="lt-b-weight" value="3.2" step="0.1" min="1" max="6">
                </div>
                <div class="lt-field">
                    <label>${t('height')}</label>
                    <input type="number" id="lt-b-height" value="50" min="30" max="60">
                </div>
            </div>
            <div class="lt-field">
                <label>${t('dominance')}</label>
                <input type="text" id="lt-b-dominance" placeholder="Mother (60%)">
            </div>
            <div class="lt-field">
                <label>${t('features')}</label>
                <input type="text" id="lt-b-features" placeholder="${t('featuresHint')}">
            </div>
            <div class="lt-field">
                <label>${t('temperament')}</label>
                <input type="text" id="lt-b-temperament" placeholder="${t('temperamentHint')}">
            </div>
            <div class="lt-row">
                <div class="lt-field">
                    <label>${t('health')}</label>
                    <select id="lt-b-health">
                        <option value="${t('excellent')}">${t('excellent')}</option>
                        <option value="${t('stable')}">${t('stable')}</option>
                        <option value="${t('underObs')}">${t('underObs')}</option>
                        <option value="${t('critical')}">${t('critical')}</option>
                    </select>
                </div>
                <div class="lt-field">
                    <label>${t('pathology')}</label>
                    <input type="text" id="lt-b-pathology" placeholder="${t('noneDetected')}">
                </div>
            </div>
            <div class="lt-actions">
                <button class="lt-btn lt-btn-secondary" id="lt-b-cancel"><i class="fa-solid fa-xmark"></i> ${t('cancel')}</button>
                <button class="lt-btn lt-btn-primary" id="lt-b-insert"><i class="fa-solid fa-paste"></i> ${t('insert')}</button>
            </div>
        </div>

        <!-- BABY CARE -->
        <div class="lt-section" id="lt-babyCare">
            <div class="lt-info"><i class="fa-solid fa-circle-info"></i>${t('infoBaby')}${saved.babyCare ? `<span class="lt-saved-badge"><i class="fa-solid fa-check"></i> ${t('saved')}</span>` : ''}</div>
            <div class="lt-row">
                <div class="lt-field">
                    <label>${t('babyName')}</label>
                    <input type="text" id="lt-bc-name" value="${saved.babyCare?.name || ''}">
                </div>
                <div class="lt-field">
                    <label>${t('age')}</label>
                    <input type="text" id="lt-bc-age" placeholder="2 weeks" value="${saved.babyCare?.age || ''}">
                </div>
            </div>
            <div class="lt-row">
                <div class="lt-field">
                    <label>${t('hunger')}</label>
                    <select id="lt-bc-hunger">
                        <option value="${t('full')}">${t('full')}</option>
                        <option value="${t('satisfied')}">${t('satisfied')}</option>
                        <option value="${t('hungry')}">${t('hungry')}</option>
                        <option value="${t('starving')}">${t('starving')}</option>
                    </select>
                </div>
                <div class="lt-field">
                    <label>${t('hygiene')}</label>
                    <select id="lt-bc-hygiene">
                        <option value="${t('clean')}">${t('clean')}</option>
                        <option value="${t('needsChange')}">${t('needsChange')}</option>
                        <option value="${t('soiled')}">${t('soiled')}</option>
                    </select>
                </div>
            </div>
            <div class="lt-row">
                <div class="lt-field">
                    <label>${t('energy')}</label>
                    <select id="lt-bc-energy">
                        <option value="${t('rested')}">${t('rested')}</option>
                        <option value="${t('awake')}">${t('awake')}</option>
                        <option value="${t('tired')}">${t('tired')}</option>
                        <option value="${t('exhausted')}">${t('exhausted')}</option>
                    </select>
                </div>
                <div class="lt-field">
                    <label>${t('mood')}</label>
                    <select id="lt-bc-mood">
                        <option value="${t('content')}">${t('content')}</option>
                        <option value="${t('happy')}">${t('happy')}</option>
                        <option value="${t('fussy')}">${t('fussy')}</option>
                        <option value="${t('crying')}">${t('crying')}</option>
                    </select>
                </div>
            </div>
            <div class="lt-field">
                <label>${t('traits')}</label>
                <input type="text" id="lt-bc-traits" value="${saved.babyCare?.traits || ''}">
            </div>
            <div class="lt-field">
                <label>${t('milestone')}</label>
                <input type="text" id="lt-bc-milestone" value="${saved.babyCare?.milestone || ''}">
            </div>
            <div class="lt-field">
                <label>${t('medical')}</label>
                <input type="text" id="lt-bc-medical" value="${saved.babyCare?.medical || ''}">
            </div>
            <div class="lt-field">
                <label>${t('immediateNeed')}</label>
                <input type="text" id="lt-bc-need" value="${saved.babyCare?.immediateNeed || ''}">
            </div>
            <div class="lt-actions">
                <button class="lt-btn lt-btn-secondary" id="lt-bc-cancel"><i class="fa-solid fa-xmark"></i> ${t('cancel')}</button>
                <button class="lt-btn lt-btn-primary" id="lt-bc-insert"><i class="fa-solid fa-paste"></i> ${t('insert')}</button>
            </div>
        </div>
    </div>
</div>`;
}

// ═══════════════════════════════════════════════════════════════
//  HANDLERS
// ═══════════════════════════════════════════════════════════════

function closePanel() {
    $('#life-tracker-panel').removeClass('open');
    $('#life-tracker-button').removeClass('active');
}

function togglePanel() {
    const $panel = $('#life-tracker-panel');
    const $btn = $('#life-tracker-button');
    if ($panel.hasClass('open')) {
        closePanel();
    } else {
        $panel.addClass('open');
        $btn.addClass('active');
    }
}

function handleConceptionRoll() {
    const chance = parseInt($('#lt-c-chance').val()) || 25;
    const manual = $('#lt-c-manual').val();
    const roll = manual ? parseInt(manual) : Math.floor(Math.random() * 100) + 1;
    const success = roll <= chance;
    const storyDate = $('#lt-c-date').val() || new Date().toISOString().split('T')[0];
    const dueDate = success ? formatDate(calculateDueDate(storyDate)) : 'N/A';

    const data = { roll, success, dueDate, conceptionDate: storyDate };
    saveChatData('conception', data);
    insertToTextarea(TEMPLATES.conception(data));
    closePanel();
}

function handlePregnancyInsert() {
    const week = parseInt($('#lt-p-week').val()) || 8;
    const rawDue = $('#lt-p-due').val();

    const data = {
        week,
        size: getBabySize(week),
        dueDate: formatDate(rawDue),
        rawDue,
        disclosed: $('#lt-p-disclosed').val() === 'true',
        gender: $('#lt-p-gender').val(),
        symptoms: $('#lt-p-symptoms').val() || t('stable'),
        nextVisit: $('#lt-p-visit').val() || 'TBD',
        risks: $('#lt-p-risks').val() || t('stable')
    };

    saveChatData('pregnancy', data);
    insertToTextarea(TEMPLATES.pregnancy(data));
    closePanel();
}

function handleBirthInsert() {
    const data = {
        gender: $('#lt-b-gender').val(),
        usAccuracy: $('#lt-b-accuracy').val(),
        weight: $('#lt-b-weight').val(),
        height: $('#lt-b-height').val(),
        dominance: $('#lt-b-dominance').val() || 'Mother (60%)',
        features: $('#lt-b-features').val() || "Mother's eyes, Father's hair",
        temperament: $('#lt-b-temperament').val() || 'Calm, Curious, Alert',
        health: $('#lt-b-health').val(),
        pathology: $('#lt-b-pathology').val() || t('noneDetected'),
        timestamp: new Date().toLocaleDateString()
    };

    saveChatData('birth', data);
    insertToTextarea(TEMPLATES.birth(data));
    closePanel();
}

function handleBabyCareInsert() {
    const data = {
        name: $('#lt-bc-name').val() || 'Unnamed',
        age: $('#lt-bc-age').val() || '0 weeks',
        hunger: $('#lt-bc-hunger').val(),
        hygiene: $('#lt-bc-hygiene').val(),
        energy: $('#lt-bc-energy').val(),
        mood: $('#lt-bc-mood').val(),
        traits: $('#lt-bc-traits').val() || 'Calm, Curious',
        milestone: $('#lt-bc-milestone').val() || 'Social smiling',
        medical: $('#lt-bc-medical').val() || 'TBD',
        immediateNeed: $('#lt-bc-need').val() || 'None'
    };

    saveChatData('babyCare', data);
    insertToTextarea(TEMPLATES.babyCare(data));
    closePanel();
}

function bindEvents() {
    // Toggle panel
    $('#life-tracker-button').on('click', (e) => {
        e.stopPropagation();
        togglePanel();
    });

    // Close button
    $('#lt-close').on('click', closePanel);

    // Tab switching
    $('.lt-tab').on('click', function() {
        const tab = $(this).data('tab');
        $('.lt-tab').removeClass('active');
        $(this).addClass('active');
        $('.lt-section').removeClass('active');
        $(`#lt-${tab}`).addClass('active');
    });

    // Conception
    $('#lt-c-roll').on('click', handleConceptionRoll);
    $('#lt-c-cancel').on('click', closePanel);

    // Pregnancy
    $('#lt-p-insert').on('click', handlePregnancyInsert);
    $('#lt-p-cancel').on('click', closePanel);

    // Birth
    $('#lt-b-insert').on('click', handleBirthInsert);
    $('#lt-b-cancel').on('click', closePanel);

    // Baby Care
    $('#lt-bc-insert').on('click', handleBabyCareInsert);
    $('#lt-bc-cancel').on('click', closePanel);

    // Close on outside click
    $(document).on('click', (e) => {
        if (!$(e.target).closest('#life-tracker-panel').length &&
            !$(e.target).closest('#life-tracker-button').length) {
            closePanel();
        }
    });

    // Close on Escape
    $(document).on('keydown', (e) => {
        if (e.key === 'Escape') closePanel();
    });
}

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════

jQuery(async () => {
    // Settings
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = { chatData: {} };
    }

    // Add button (same way as original working version)
    const buttonHtml = `<div id="life-tracker-button" class="fa-solid fa-heart-pulse" title="Life Tracker"></div>`;
    $('#leftSendForm').prepend(buttonHtml);

    // Add panel to body
    $('body').append(getPanelHTML());

    // Bind all events
    bindEvents();

    console.log('[Life Tracker] Ready');
});
