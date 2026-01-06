// ═══════════════════════════════════════════════════════════════
//  LIFE TRACKER v3.0 - AI-Powered
// ═══════════════════════════════════════════════════════════════

import { getContext, extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "life-tracker";

// ═══════════════════════════════════════════════════════════════
//  TEMPLATES FOR AI TO FILL
// ═══════════════════════════════════════════════════════════════

const TEMPLATES = {
    conception: (hints) => `
[CONCEPTION ROLL - Fill based on story context${hints.notes ? ` | User notes: ${hints.notes}` : ''}]
<div style="background:transparent;color:var(--SmartThemeBodyColor);font-family:'Courier New',monospace;font-size:0.85em;padding:5px;margin-top:-15px;margin-bottom:20px;text-align:center;letter-spacing:1px;opacity:0.9;border-bottom:1px dashed var(--SmartThemeBorderColor);">
<span style="opacity:0.7;"><i class="fa-solid fa-dice"></i> ROLL:</span>
<span style="color:var(--SmartThemeQuoteColor);font-weight:bold;">{ROLL_1-100}/100</span>
<span style="margin:0 8px;color:var(--SmartThemeBorderColor);">|</span>
<span style="opacity:0.7;"><i class="fa-solid fa-baby"></i> CONCEPTION:</span>
<span style="color:var(--SmartThemeQuoteColor);font-weight:bold;">{YES/NO}</span>
<span style="margin:0 8px;color:var(--SmartThemeBorderColor);">|</span>
<span style="color:var(--SmartThemeQuoteColor);font-weight:bold;"><i class="fa-regular fa-calendar-check"></i> DUE: {DATE or N/A}</span>
</div>`,

    pregnancy: (hints) => `
[PREGNANCY STATUS - Fill based on story context${hints.week ? ` | Week: ${hints.week}` : ''}${hints.notes ? ` | Notes: ${hints.notes}` : ''}]
<div style="background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:6px;padding:10px;margin-top:5px;margin-bottom:20px;font-family:'Courier New',monospace;font-size:0.85em;line-height:1.5;color:var(--SmartThemeBodyColor);">
<div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:4px;padding-bottom:4px;font-weight:bold;color:var(--SmartThemeQuoteColor);text-transform:uppercase;letter-spacing:1px;">
<i class="fa-solid fa-person-pregnant"></i> Pregnancy Status</div>
<div style="font-size:0.75em;text-transform:uppercase;margin-bottom:8px;color:var(--SmartThemeQuoteColor);opacity:0.8;">
<i class="fa-solid fa-eye-slash"></i> Knowledge: <span style="font-weight:bold;">{HIDDEN/DISCLOSED}</span></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
<div><span style="opacity:0.7;"><i class="fa-regular fa-clock"></i> Week:</span> <strong style="color:var(--SmartThemeQuoteColor);">{WEEK}</strong></div>
<div><span style="opacity:0.7;"><i class="fa-solid fa-apple-whole"></i> Size:</span> <strong style="color:var(--SmartThemeQuoteColor);">{FRUIT/VEGGIE COMPARISON}</strong></div>
<div><span style="opacity:0.7;"><i class="fa-regular fa-calendar-check"></i> Due:</span> <strong style="color:var(--SmartThemeQuoteColor);">{DATE}</strong></div>
<div><span style="opacity:0.7;"><i class="fa-solid fa-venus-mars"></i> Gender:</span> <strong style="color:var(--SmartThemeQuoteColor);">{UNKNOWN/BOY/GIRL/TWINS}</strong></div>
</div>
<div style="margin-top:8px;border-top:1px dotted var(--SmartThemeBorderColor);padding-top:5px;">
<div style="margin-bottom:4px;"><span style="color:var(--SmartThemeQuoteColor);"><i class="fa-solid fa-head-side-virus"></i> Symptoms:</span> <span style="opacity:0.9;">{2-3 REALISTIC SYMPTOMS}</span></div>
<div style="margin-bottom:4px;"><span style="color:var(--SmartThemeQuoteColor);"><i class="fa-solid fa-user-doctor"></i> Next Visit:</span> <span style="opacity:0.9;">{DATE | PROCEDURE}</span></div>
<div><span style="color:#e76f51;"><i class="fa-solid fa-triangle-exclamation"></i> Risks:</span> <span style="opacity:0.9;font-style:italic;">{STABLE or SPECIFIC RISK}</span></div>
</div></div>`,

    birth: (hints) => `
[BIRTH REPORT - Generate based on pregnancy history${hints.notes ? ` | Notes: ${hints.notes}` : ''}]
<div style="background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:8px;padding:12px;margin-top:5px;margin-bottom:20px;font-family:'Courier New',monospace;font-size:0.85em;line-height:1.5;color:var(--SmartThemeBodyColor);border-left:4px solid var(--SmartThemeQuoteColor);">
<div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:6px;padding-bottom:4px;font-weight:bold;color:var(--SmartThemeQuoteColor);text-transform:uppercase;letter-spacing:1.5px;display:flex;justify-content:space-between;">
<span><i class="fa-solid fa-baby-carriage"></i> Birth Report</span>
<span style="font-size:0.8em;opacity:0.7;">{STORY_DATE}</span></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
<div><span style="opacity:0.7;"><i class="fa-solid fa-venus-mars"></i> Gender:</span> <strong style="color:var(--SmartThemeQuoteColor);">{GENDER}</strong></div>
<div><span style="opacity:0.7;"><i class="fa-solid fa-circle-check"></i> US:</span> <strong style="color:var(--SmartThemeQuoteColor);">{CONFIRMED/MISSED}</strong></div>
<div><span style="opacity:0.7;"><i class="fa-solid fa-weight-scale"></i> Weight:</span> <strong style="color:var(--SmartThemeQuoteColor);">{X.X} kg</strong></div>
<div><span style="opacity:0.7;"><i class="fa-solid fa-ruler-vertical"></i> Height:</span> <strong style="color:var(--SmartThemeQuoteColor);">{XX} cm</strong></div>
</div>
<div style="margin-top:10px;border-top:1px solid var(--SmartThemeBorderColor);padding-top:8px;">
<div style="margin-bottom:4px;"><span style="color:var(--SmartThemeQuoteColor);font-weight:bold;"><i class="fa-solid fa-dna"></i> Genetics:</span></div>
<div style="font-size:0.9em;padding-left:10px;border-left:2px solid var(--SmartThemeBorderColor);margin-bottom:8px;">
<span style="opacity:0.8;">Dominance:</span> <strong>{PARENT (XX%)}</strong><br>
<span style="opacity:0.8;">Features:</span> {INHERITED FEATURES}<br>
<span style="opacity:0.8;">Temperament:</span> {3 TRAITS}</div></div>
<div style="margin-top:8px;background:rgba(0,0,0,0.15);padding:8px;border-radius:4px;">
<div style="margin-bottom:4px;"><span style="color:#2a9d8f;"><i class="fa-solid fa-heart-pulse"></i> Health:</span> <span style="font-weight:bold;opacity:0.9;">{HEALTH STATUS}</span></div>
<div><span style="color:#e76f51;"><i class="fa-solid fa-microscope"></i> Pathology:</span> <span style="opacity:0.9;font-style:italic;">{NONE or ISSUE}</span></div>
</div></div>`,

    babyCare: (hints) => `
[BABY CARE - Update based on story events${hints.name ? ` | Name: ${hints.name}` : ''}${hints.age ? ` | Age: ${hints.age}` : ''}${hints.notes ? ` | Notes: ${hints.notes}` : ''}]
<div style="background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent);border:1px solid var(--SmartThemeBorderColor);border-radius:6px;padding:10px;margin-top:5px;margin-bottom:20px;font-family:'Courier New',monospace;font-size:0.85em;line-height:1.5;color:var(--SmartThemeBodyColor);">
<div style="border-bottom:1px dashed var(--SmartThemeBorderColor);margin-bottom:4px;padding-bottom:4px;font-weight:bold;color:var(--SmartThemeQuoteColor);text-transform:uppercase;letter-spacing:1px;">
<i class="fa-solid fa-baby"></i> Baby Care</div>
<div style="font-size:0.75em;text-transform:uppercase;margin-bottom:8px;color:var(--SmartThemeQuoteColor);opacity:0.8;">
<i class="fa-solid fa-id-card"></i> {NAME} | {AGE}</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
<div><span style="opacity:0.7;"><i class="fa-solid fa-utensils"></i> Hunger:</span> <strong style="color:var(--SmartThemeQuoteColor);">{FULL/HUNGRY/STARVING}</strong></div>
<div><span style="opacity:0.7;"><i class="fa-solid fa-soap"></i> Hygiene:</span> <strong style="color:var(--SmartThemeQuoteColor);">{CLEAN/SOILED}</strong></div>
<div><span style="opacity:0.7;"><i class="fa-solid fa-bed"></i> Energy:</span> <strong style="color:var(--SmartThemeQuoteColor);">{RESTED/TIRED}</strong></div>
<div><span style="opacity:0.7;"><i class="fa-solid fa-face-smile"></i> Mood:</span> <strong style="color:var(--SmartThemeQuoteColor);">{HAPPY/FUSSY/CRYING}</strong></div>
</div>
<div style="margin-top:8px;border-top:1px dotted var(--SmartThemeBorderColor);padding-top:5px;">
<div style="margin-bottom:4px;"><span style="color:var(--SmartThemeQuoteColor);"><i class="fa-solid fa-dna"></i> Traits:</span> <span style="opacity:0.9;">{PERSONALITY TRAITS}</span></div>
<div style="margin-bottom:4px;"><span style="color:var(--SmartThemeQuoteColor);"><i class="fa-solid fa-star"></i> Milestone:</span> <span style="opacity:0.9;">{NEXT MILESTONE}</span></div>
<div style="margin-bottom:4px;"><span style="color:var(--SmartThemeQuoteColor);"><i class="fa-solid fa-user-doctor"></i> Medical:</span> <span style="opacity:0.9;">{NEXT VISIT}</span></div>
<div style="background:rgba(231,111,81,0.1);padding:3px;border-radius:3px;margin-top:5px;">
<span style="color:#e76f51;"><i class="fa-solid fa-circle-exclamation"></i></span> <span style="opacity:0.9;font-style:italic;">{IMMEDIATE NEED}</span></div>
</div></div>`
};

// ═══════════════════════════════════════════════════════════════
//  SETTINGS FORMS
// ═══════════════════════════════════════════════════════════════

const FORMS = {
    conception: `
        <div class="lt-settings-header">
            <span class="lt-settings-title"><i class="fa-solid fa-dice"></i> Conception</span>
            <button class="lt-back-btn" id="lt-back"><i class="fa-solid fa-arrow-left"></i></button>
        </div>
        <div class="lt-hint">Optional hints for AI. Leave empty to let AI decide everything.</div>
        <div class="lt-field">
            <label>Story Date (optional)</label>
            <input type="date" id="lt-date">
        </div>
        <div class="lt-field">
            <label>Notes for AI</label>
            <input type="text" id="lt-notes" placeholder="e.g., high fertility, use protection failed...">
        </div>
        <div class="lt-actions">
            <button class="lt-btn lt-btn-primary" id="lt-insert" data-type="conception">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Insert for AI
            </button>
            <button class="lt-btn lt-btn-secondary" id="lt-cancel">
                <i class="fa-solid fa-xmark"></i> Cancel
            </button>
        </div>`,

    pregnancy: `
        <div class="lt-settings-header">
            <span class="lt-settings-title"><i class="fa-solid fa-person-pregnant"></i> Pregnancy</span>
            <button class="lt-back-btn" id="lt-back"><i class="fa-solid fa-arrow-left"></i></button>
        </div>
        <div class="lt-hint">Optional hints. AI will fill everything else based on story.</div>
        <div class="lt-field">
            <label>Week (optional)</label>
            <input type="text" id="lt-week" placeholder="e.g., 12">
        </div>
        <div class="lt-field">
            <label>Notes for AI</label>
            <input type="text" id="lt-notes" placeholder="e.g., twins, high risk, gender revealed...">
        </div>
        <div class="lt-actions">
            <button class="lt-btn lt-btn-primary" id="lt-insert" data-type="pregnancy">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Insert for AI
            </button>
            <button class="lt-btn lt-btn-secondary" id="lt-cancel">
                <i class="fa-solid fa-xmark"></i> Cancel
            </button>
        </div>`,

    birth: `
        <div class="lt-settings-header">
            <span class="lt-settings-title"><i class="fa-solid fa-baby-carriage"></i> Birth</span>
            <button class="lt-back-btn" id="lt-back"><i class="fa-solid fa-arrow-left"></i></button>
        </div>
        <div class="lt-hint">Optional hints. AI generates genetics and stats.</div>
        <div class="lt-field">
            <label>Notes for AI</label>
            <input type="text" id="lt-notes" placeholder="e.g., premature, complications, healthy...">
        </div>
        <div class="lt-actions">
            <button class="lt-btn lt-btn-primary" id="lt-insert" data-type="birth">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Insert for AI
            </button>
            <button class="lt-btn lt-btn-secondary" id="lt-cancel">
                <i class="fa-solid fa-xmark"></i> Cancel
            </button>
        </div>`,

    babyCare: `
        <div class="lt-settings-header">
            <span class="lt-settings-title"><i class="fa-solid fa-baby"></i> Baby Care</span>
            <button class="lt-back-btn" id="lt-back"><i class="fa-solid fa-arrow-left"></i></button>
        </div>
        <div class="lt-hint">Optional hints. AI tracks needs based on story events.</div>
        <div class="lt-field">
            <label>Name (optional)</label>
            <input type="text" id="lt-name" placeholder="Baby's name">
        </div>
        <div class="lt-field">
            <label>Age (optional)</label>
            <input type="text" id="lt-age" placeholder="e.g., 2 weeks, 3 months">
        </div>
        <div class="lt-field">
            <label>Notes for AI</label>
            <input type="text" id="lt-notes" placeholder="e.g., just fed, needs diaper, fussy...">
        </div>
        <div class="lt-actions">
            <button class="lt-btn lt-btn-primary" id="lt-insert" data-type="babyCare">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Insert for AI
            </button>
            <button class="lt-btn lt-btn-secondary" id="lt-cancel">
                <i class="fa-solid fa-xmark"></i> Cancel
            </button>
        </div>`
};

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

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

function closePopup() {
    $('#lt-popup').removeClass('open');
    $('#life-tracker-button').removeClass('active');
    showMenu();
}

function showMenu() {
    $('#lt-menu').show();
    $('#lt-settings').removeClass('open').empty();
}

function showSettings(type) {
    $('#lt-menu').hide();
    $('#lt-settings').html(FORMS[type]).addClass('open');
    bindSettingsEvents(type);
}

function bindSettingsEvents(type) {
    $('#lt-back').on('click', showMenu);
    $('#lt-cancel').on('click', closePopup);

    $('#lt-insert').on('click', function() {
        const hints = {
            date: $('#lt-date').val(),
            week: $('#lt-week').val(),
            name: $('#lt-name').val(),
            age: $('#lt-age').val(),
            notes: $('#lt-notes').val()
        };

        const template = TEMPLATES[type](hints);
        insertToTextarea(template);
        closePopup();
    });
}

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════

jQuery(async () => {
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = {};
    }

    // Create wrapper with button and popup
    const html = `
    <div id="lt-wrapper">
        <div id="life-tracker-button" class="fa-solid fa-heart-pulse" title="Life Tracker"></div>
        <div id="lt-popup">
            <div class="lt-menu" id="lt-menu">
                <button class="lt-menu-item" data-type="conception">
                    <i class="fa-solid fa-dice"></i> Conception Roll
                </button>
                <button class="lt-menu-item" data-type="pregnancy">
                    <i class="fa-solid fa-person-pregnant"></i> Pregnancy
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

    $('#leftSendForm').prepend(html);

    // Toggle popup
    $('#life-tracker-button').on('click', (e) => {
        e.stopPropagation();
        const isOpen = $('#lt-popup').hasClass('open');
        if (isOpen) {
            closePopup();
        } else {
            $('#lt-popup').addClass('open');
            $('#life-tracker-button').addClass('active');
        }
    });

    // Menu item click
    $('.lt-menu-item').on('click', function() {
        showSettings($(this).data('type'));
    });

    // Close on outside click
    $(document).on('click', (e) => {
        if (!$(e.target).closest('#lt-wrapper').length) {
            closePopup();
        }
    });

    // Close on Escape
    $(document).on('keydown', (e) => {
        if (e.key === 'Escape') closePopup();
    });

    console.log('[Life Tracker] Ready');
});
