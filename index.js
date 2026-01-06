// ╔══════════════════════════════════════════════════════════════╗
// ║                    LIFE TRACKER EXTENSION                      ║
// ║         Conception • Pregnancy • Birth • Baby Care             ║
// ╚══════════════════════════════════════════════════════════════╝

import { getContext, extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
import { eventSource, event_types } from "../../../../script.js";

const extensionName = "life-tracker";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// ══════════════════════════════════════════════════════════════
// DEFAULT SETTINGS
// ══════════════════════════════════════════════════════════════
const defaultSettings = {
    enabled: true,
    autoInsert: false,
    chatData: {} // Stores data per chat: { chatId: { conception: {...}, pregnancy: {...}, etc } }
};

// ══════════════════════════════════════════════════════════════
// HTML TEMPLATES
// ══════════════════════════════════════════════════════════════
const TEMPLATES = {
    conception: (data) => `
<div style="
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
        ${data.roll}/100
    </span>
    <span style="margin: 0 8px; color: var(--SmartThemeBorderColor);">|</span>
    <span style="color: var(--SmartThemeBodyColor); opacity: 0.7;">
        <i class="fa-solid fa-baby"></i> CONCEPTION:
    </span>
    <span style="color: var(--SmartThemeQuoteColor); font-weight: bold;">
        ${data.success ? 'Yes' : 'No'}
    </span>
    <span style="margin: 0 8px; color: var(--SmartThemeBorderColor);">|</span>
    <span style="color: var(--SmartThemeAccent); font-weight: bold;">
        <i class="fa-regular fa-calendar-check"></i> DUE: ${data.dueDate || 'N/A'}
    </span>
</div>`,

    pregnancy: (data) => `
<div style="
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
        <i class="fa-solid fa-eye${data.disclosed ? '' : '-slash'}"></i> Knowledge: <span style="font-weight: bold;">${data.disclosed ? 'DISCLOSED' : 'HIDDEN'}</span>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
        <div>
            <span style="opacity:0.7;"><i class="fa-regular fa-clock"></i> Week:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.week || '??'}</strong>
        </div>
        <div>
            <span style="opacity:0.7;"><i class="fa-solid fa-apple-whole"></i> Size:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.size || 'Poppy seed'}</strong>
        </div>
        <div>
            <span style="opacity:0.7;"><i class="fa-regular fa-calendar-check"></i> Due:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.dueDate || 'TBD'}</strong>
        </div>
        <div>
            <span style="opacity:0.7;"><i class="fa-solid fa-venus-mars"></i> Gender:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.gender || 'Unknown'}</strong>
        </div>
    </div>
    <div style="margin-top: 8px; border-top: 1px dotted var(--SmartThemeBorderColor); padding-top: 5px;">
        <div style="margin-bottom: 4px;">
            <span style="color: var(--SmartThemeAccent);"><i class="fa-solid fa-head-side-virus"></i> Symptoms:</span>
            <span style="opacity: 0.9;">${data.symptoms || 'None noted'}</span>
        </div>
        <div style="margin-bottom: 4px;">
            <span style="color: var(--SmartThemeAccent);"><i class="fa-solid fa-user-doctor"></i> Next Visit:</span>
            <span style="opacity: 0.9;">${data.nextVisit || 'Not scheduled'}</span>
        </div>
        <div>
            <span style="color: #e76f51;"><i class="fa-solid fa-triangle-exclamation"></i> Risks:</span>
            <span style="opacity: 0.9; font-style: italic;">${data.risks || 'Stable'}</span>
        </div>
    </div>
</div>`,

    birth: (data) => `
<div style="
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
    ">
        <span><i class="fa-solid fa-baby-carriage"></i> Newborn Birth Report</span>
        <span style="font-size: 0.8em; opacity: 0.7;">${data.timestamp || new Date().toLocaleDateString()}</span>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div>
            <span style="opacity:0.7;"><i class="fa-solid fa-venus-mars"></i> Gender:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.gender || 'Unknown'}</strong>
        </div>
        <div>
            <span style="opacity:0.7;"><i class="fa-solid fa-circle-check"></i> US-Accuracy:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.usAccuracy || 'Confirmed'}</strong>
        </div>
        <div>
            <span style="opacity:0.7;"><i class="fa-solid fa-weight-scale"></i> Weight:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.weight || '3.2'} kg</strong>
        </div>
        <div>
            <span style="opacity:0.7;"><i class="fa-solid fa-ruler-vertical"></i> Height:</span>
            <strong style="color: var(--SmartThemeQuoteColor);">${data.height || '50'} cm</strong>
        </div>
    </div>
    <div style="margin-top: 10px; border-top: 1px solid var(--SmartThemeBorderColor); padding-top: 8px;">
        <div style="margin-bottom: 4px;">
            <span style="color: var(--SmartThemeAccent); font-weight: bold;"><i class="fa-solid fa-dna"></i> Genetics & Heritage:</span>
        </div>
        <div style="font-size: 0.9em; padding-left: 10px; border-left: 2px solid var(--SmartThemeBorderColor); margin-bottom: 8px;">
            <span style="opacity: 0.8;">Dominance:</span> <strong>${data.dominance || 'Mother (60%)'}</strong><br>
            <span style="opacity: 0.8;">Features:</span> ${data.features || "Mother's eyes, Father's hair"}<br>
            <span style="opacity: 0.8;">Temperament:</span> ${data.temperament || 'Calm, Curious, Alert'}
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
</div>`,

    babyCare: (data) => `
<div style="
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
        <i class="fa-solid fa-id-card"></i> Name: <span style="font-weight: bold;">${data.name || 'Unnamed'}</span> | Age: <span style="font-weight: bold;">${data.age || '0 Weeks'}</span>
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
            <span style="opacity: 0.9;">${data.traits || 'Observant, Calm'}</span>
        </div>
        <div style="margin-bottom: 4px;">
            <span style="color: var(--SmartThemeAccent);"><i class="fa-solid fa-star"></i> Milestone:</span>
            <span style="opacity: 0.9;">Next: ${data.milestone || 'Social smiling'}</span>
        </div>
        <div style="margin-bottom: 4px;">
            <span style="color: var(--SmartThemeAccent);"><i class="fa-solid fa-user-doctor"></i> Medical:</span>
            <span style="opacity: 0.9;">${data.medical || 'Next Visit: TBD'}</span>
        </div>
        <div style="background: rgba(231, 111, 81, 0.1); padding: 3px; border-radius: 3px; margin-top: 5px;">
            <span style="color: #e76f51;"><i class="fa-solid fa-circle-exclamation"></i> Immediate Need:</span>
            <span style="opacity: 0.9; font-style: italic;">${data.immediateNeed || 'None - Baby is content'}</span>
        </div>
    </div>
</div>`
};

// ══════════════════════════════════════════════════════════════
// BABY SIZE BY WEEK
// ══════════════════════════════════════════════════════════════
const BABY_SIZES = {
    4: "Poppy seed", 5: "Sesame seed", 6: "Lentil", 7: "Blueberry",
    8: "Raspberry", 9: "Cherry", 10: "Strawberry", 11: "Lime",
    12: "Plum", 13: "Lemon", 14: "Nectarine", 15: "Orange",
    16: "Avocado", 17: "Pear", 18: "Bell pepper", 19: "Mango",
    20: "Banana", 21: "Pomegranate", 22: "Papaya", 23: "Grapefruit",
    24: "Cantaloupe", 25: "Cauliflower", 26: "Lettuce head", 27: "Cabbage",
    28: "Eggplant", 29: "Butternut squash", 30: "Coconut", 31: "Pineapple",
    32: "Jicama", 33: "Honeydew", 34: "Cantaloupe", 35: "Coconut",
    36: "Honeydew melon", 37: "Winter melon", 38: "Pumpkin", 39: "Watermelon",
    40: "Small pumpkin"
};

// ══════════════════════════════════════════════════════════════
// PANEL HTML
// ══════════════════════════════════════════════════════════════
const panelHtml = `
<div id="life-tracker-panel">
    <div class="lt-header">
        <h3><i class="fa-solid fa-heart-pulse"></i> Life Tracker</h3>
        <button class="lt-close-btn" id="lt-close"><i class="fa-solid fa-xmark"></i></button>
    </div>

    <div class="lt-tabs">
        <button class="lt-tab active" data-tab="conception">
            <i class="fa-solid fa-dice"></i>
            <span>Conception</span>
        </button>
        <button class="lt-tab" data-tab="pregnancy">
            <i class="fa-solid fa-person-pregnant"></i>
            <span>Pregnancy</span>
        </button>
        <button class="lt-tab" data-tab="birth">
            <i class="fa-solid fa-baby-carriage"></i>
            <span>Birth</span>
        </button>
        <button class="lt-tab" data-tab="babyCare">
            <i class="fa-solid fa-baby"></i>
            <span>Baby Care</span>
        </button>
    </div>

    <div class="lt-content">
        <!-- CONCEPTION TAB -->
        <div class="lt-section active" id="lt-conception">
            <div class="lt-info-box">
                <i class="fa-solid fa-info-circle"></i>
                Roll for conception chance! Base is 20-30%, or set your own.
            </div>

            <div class="lt-saved-data" id="lt-conception-saved" style="display:none;">
                <h4><i class="fa-solid fa-database"></i> Current Data</h4>
                <div id="lt-conception-saved-content"></div>
            </div>

            <div class="lt-form-group">
                <label>Base Chance (%)</label>
                <input type="number" id="lt-conception-chance" value="25" min="1" max="100">
            </div>

            <div class="lt-form-row">
                <div class="lt-form-group">
                    <label>Current Story Date</label>
                    <input type="date" id="lt-conception-date">
                </div>
                <div class="lt-form-group">
                    <label>Or Manual Roll (1-100)</label>
                    <input type="number" id="lt-conception-manual" placeholder="Leave empty for auto" min="1" max="100">
                </div>
            </div>

            <div class="lt-btn-group">
                <button class="lt-btn lt-btn-primary" id="lt-conception-roll">
                    <i class="fa-solid fa-dice"></i> Roll & Insert
                </button>
                <button class="lt-btn lt-btn-secondary" id="lt-conception-insert">
                    <i class="fa-solid fa-paste"></i> Insert Only
                </button>
            </div>
        </div>

        <!-- PREGNANCY TAB -->
        <div class="lt-section" id="lt-pregnancy">
            <div class="lt-info-box">
                <i class="fa-solid fa-info-circle"></i>
                Track pregnancy progress. Week auto-calculates size!
            </div>

            <div class="lt-saved-data" id="lt-pregnancy-saved" style="display:none;">
                <h4><i class="fa-solid fa-database"></i> Current Data</h4>
                <div id="lt-pregnancy-saved-content"></div>
            </div>

            <div class="lt-form-row">
                <div class="lt-form-group">
                    <label>Current Week</label>
                    <input type="number" id="lt-pregnancy-week" value="8" min="1" max="42">
                </div>
                <div class="lt-form-group">
                    <label>Due Date</label>
                    <input type="date" id="lt-pregnancy-due">
                </div>
            </div>

            <div class="lt-form-row">
                <div class="lt-form-group">
                    <label>Knowledge Status</label>
                    <select id="lt-pregnancy-disclosed">
                        <option value="false">Hidden</option>
                        <option value="true">Disclosed</option>
                    </select>
                </div>
                <div class="lt-form-group">
                    <label>Gender (if known)</label>
                    <select id="lt-pregnancy-gender">
                        <option value="Unknown">Unknown</option>
                        <option value="Boy">Boy</option>
                        <option value="Girl">Girl</option>
                        <option value="Twins">Twins</option>
                    </select>
                </div>
            </div>

            <div class="lt-form-group">
                <label>Symptoms (comma separated)</label>
                <input type="text" id="lt-pregnancy-symptoms" placeholder="Morning sickness, Fatigue, Cravings">
            </div>

            <div class="lt-form-row">
                <div class="lt-form-group">
                    <label>Next Visit</label>
                    <input type="text" id="lt-pregnancy-visit" placeholder="Date | Procedure">
                </div>
                <div class="lt-form-group">
                    <label>Risks</label>
                    <input type="text" id="lt-pregnancy-risks" placeholder="Stable">
                </div>
            </div>

            <div class="lt-btn-group">
                <button class="lt-btn lt-btn-primary" id="lt-pregnancy-insert">
                    <i class="fa-solid fa-paste"></i> Insert Tracker
                </button>
                <button class="lt-btn lt-btn-secondary" id="lt-pregnancy-save">
                    <i class="fa-solid fa-save"></i> Save Data
                </button>
            </div>
        </div>

        <!-- BIRTH TAB -->
        <div class="lt-section" id="lt-birth">
            <div class="lt-info-box">
                <i class="fa-solid fa-info-circle"></i>
                Generate birth report with genetics!
            </div>

            <div class="lt-form-row">
                <div class="lt-form-group">
                    <label>Gender</label>
                    <select id="lt-birth-gender">
                        <option value="Girl">Girl</option>
                        <option value="Boy">Boy</option>
                        <option value="Twins (Girls)">Twins (Girls)</option>
                        <option value="Twins (Boys)">Twins (Boys)</option>
                        <option value="Twins (Mixed)">Twins (Mixed)</option>
                    </select>
                </div>
                <div class="lt-form-group">
                    <label>US Accuracy</label>
                    <select id="lt-birth-accuracy">
                        <option value="Confirmed">Confirmed</option>
                        <option value="MISSED (Surprise!)">Missed - Surprise!</option>
                    </select>
                </div>
            </div>

            <div class="lt-form-row">
                <div class="lt-form-group">
                    <label>Weight (kg)</label>
                    <input type="number" id="lt-birth-weight" value="3.2" step="0.1" min="1" max="6">
                </div>
                <div class="lt-form-group">
                    <label>Height (cm)</label>
                    <input type="number" id="lt-birth-height" value="50" min="30" max="60">
                </div>
            </div>

            <div class="lt-form-group">
                <label>Dominance (e.g., "Mother (60%)")</label>
                <input type="text" id="lt-birth-dominance" placeholder="Mother (60%)">
            </div>

            <div class="lt-form-group">
                <label>Features</label>
                <input type="text" id="lt-birth-features" placeholder="Mother's eyes, Father's hair">
            </div>

            <div class="lt-form-group">
                <label>Temperament (3 traits)</label>
                <input type="text" id="lt-birth-temperament" placeholder="Calm, Curious, Alert">
            </div>

            <div class="lt-form-row">
                <div class="lt-form-group">
                    <label>Health Status</label>
                    <select id="lt-birth-health">
                        <option value="Excellent">Excellent</option>
                        <option value="Stable">Stable</option>
                        <option value="Under Observation">Under Observation</option>
                        <option value="Critical">Critical</option>
                    </select>
                </div>
                <div class="lt-form-group">
                    <label>Pathology</label>
                    <input type="text" id="lt-birth-pathology" placeholder="None Detected">
                </div>
            </div>

            <button class="lt-btn lt-btn-primary" id="lt-birth-insert">
                <i class="fa-solid fa-paste"></i> Insert Birth Report
            </button>
        </div>

        <!-- BABY CARE TAB -->
        <div class="lt-section" id="lt-babyCare">
            <div class="lt-info-box">
                <i class="fa-solid fa-info-circle"></i>
                Track baby's daily needs and development!
            </div>

            <div class="lt-saved-data" id="lt-baby-saved" style="display:none;">
                <h4><i class="fa-solid fa-database"></i> Current Baby Data</h4>
                <div id="lt-baby-saved-content"></div>
            </div>

            <div class="lt-form-row">
                <div class="lt-form-group">
                    <label>Baby Name</label>
                    <input type="text" id="lt-baby-name" placeholder="Name">
                </div>
                <div class="lt-form-group">
                    <label>Age</label>
                    <input type="text" id="lt-baby-age" placeholder="2 Weeks">
                </div>
            </div>

            <div class="lt-form-row">
                <div class="lt-form-group">
                    <label>Hunger</label>
                    <select id="lt-baby-hunger">
                        <option value="Full">Full</option>
                        <option value="Satisfied">Satisfied</option>
                        <option value="Hungry">Hungry</option>
                        <option value="Starving">Starving</option>
                    </select>
                </div>
                <div class="lt-form-group">
                    <label>Hygiene</label>
                    <select id="lt-baby-hygiene">
                        <option value="Clean">Clean</option>
                        <option value="Needs change">Needs change</option>
                        <option value="Soiled">Soiled</option>
                    </select>
                </div>
            </div>

            <div class="lt-form-row">
                <div class="lt-form-group">
                    <label>Energy</label>
                    <select id="lt-baby-energy">
                        <option value="Rested">Rested</option>
                        <option value="Awake">Awake</option>
                        <option value="Tired">Tired</option>
                        <option value="Exhausted">Exhausted</option>
                    </select>
                </div>
                <div class="lt-form-group">
                    <label>Mood</label>
                    <select id="lt-baby-mood">
                        <option value="Content">Content</option>
                        <option value="Happy">Happy</option>
                        <option value="Fussy">Fussy</option>
                        <option value="Crying">Crying</option>
                        <option value="Inconsolable">Inconsolable</option>
                    </select>
                </div>
            </div>

            <div class="lt-form-group">
                <label>Traits</label>
                <input type="text" id="lt-baby-traits" placeholder="Observant, Calm">
            </div>

            <div class="lt-form-group">
                <label>Next Milestone</label>
                <input type="text" id="lt-baby-milestone" placeholder="Social smiling">
            </div>

            <div class="lt-form-group">
                <label>Medical (Next Visit)</label>
                <input type="text" id="lt-baby-medical" placeholder="Next Visit: 01/15 | 2-month vaccines">
            </div>

            <div class="lt-form-group">
                <label>Immediate Need</label>
                <input type="text" id="lt-baby-need" placeholder="None - Baby is content">
            </div>

            <div class="lt-btn-group">
                <button class="lt-btn lt-btn-primary" id="lt-baby-insert">
                    <i class="fa-solid fa-paste"></i> Insert Tracker
                </button>
                <button class="lt-btn lt-btn-secondary" id="lt-baby-save">
                    <i class="fa-solid fa-save"></i> Save Data
                </button>
            </div>
        </div>
    </div>
</div>
`;

// ══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════

function getCurrentChatId() {
    const context = getContext();
    return context.chatId || 'default';
}

function getChatData(type) {
    const chatId = getCurrentChatId();
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = { ...defaultSettings };
    }
    if (!extension_settings[extensionName].chatData[chatId]) {
        extension_settings[extensionName].chatData[chatId] = {};
    }
    return extension_settings[extensionName].chatData[chatId][type] || null;
}

function saveChatData(type, data) {
    const chatId = getCurrentChatId();
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = { ...defaultSettings };
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

function getBabySize(week) {
    return BABY_SIZES[week] || "Growing baby";
}

function insertTextAtCursor(text) {
    const textarea = document.getElementById('send_textarea');
    if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);
        textarea.value = before + text + after;
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

function showSavedData(type) {
    const data = getChatData(type);
    const container = document.getElementById(`lt-${type}-saved`);
    const content = document.getElementById(`lt-${type}-saved-content`);

    if (data && container && content) {
        container.style.display = 'block';
        let html = '';
        for (const [key, value] of Object.entries(data)) {
            if (value) {
                html += `<div class="lt-data-row">
                    <span class="lt-data-label">${key}:</span>
                    <span class="lt-data-value">${value}</span>
                </div>`;
            }
        }
        content.innerHTML = html;
    }
}

// ══════════════════════════════════════════════════════════════
// MAIN INITIALIZATION
// ══════════════════════════════════════════════════════════════

jQuery(async () => {
    // Load settings
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = { ...defaultSettings };
    }

    // Add panel to body
    $('body').append(panelHtml);

    // Add button to bottom bar (left side, near other extension buttons)
    const buttonHtml = `
        <div id="life-tracker-button" class="fa-solid fa-heart-pulse" title="Life Tracker"></div>
    `;
    $('#leftSendForm').prepend(buttonHtml);

    // ═══════════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════

    // Toggle panel
    $('#life-tracker-button').on('click', () => {
        $('#life-tracker-panel').toggleClass('open');
        if ($('#life-tracker-panel').hasClass('open')) {
            showSavedData('conception');
            showSavedData('pregnancy');
            showSavedData('baby');
        }
    });

    // Close panel
    $('#lt-close').on('click', () => {
        $('#life-tracker-panel').removeClass('open');
    });

    // Tab switching
    $('.lt-tab').on('click', function() {
        const tab = $(this).data('tab');
        $('.lt-tab').removeClass('active');
        $(this).addClass('active');
        $('.lt-section').removeClass('active');
        $(`#lt-${tab}`).addClass('active');
    });

    // ═══════════════════════════════════════════════════════════
    // CONCEPTION HANDLERS
    // ═══════════════════════════════════════════════════════════

    $('#lt-conception-roll').on('click', () => {
        const chance = parseInt($('#lt-conception-chance').val()) || 25;
        const manualRoll = $('#lt-conception-manual').val();
        const roll = manualRoll ? parseInt(manualRoll) : Math.floor(Math.random() * 100) + 1;
        const success = roll <= chance;

        const conceptionDate = $('#lt-conception-date').val() || new Date().toISOString().split('T')[0];
        const dueDate = success ? formatDate(calculateDueDate(conceptionDate)) : 'N/A';

        const data = {
            roll: roll,
            success: success,
            dueDate: dueDate,
            conceptionDate: conceptionDate
        };

        saveChatData('conception', data);
        insertTextAtCursor(TEMPLATES.conception(data));
        showSavedData('conception');
    });

    $('#lt-conception-insert').on('click', () => {
        const data = getChatData('conception') || {
            roll: '??',
            success: false,
            dueDate: 'N/A'
        };
        insertTextAtCursor(TEMPLATES.conception(data));
    });

    // ═══════════════════════════════════════════════════════════
    // PREGNANCY HANDLERS
    // ═══════════════════════════════════════════════════════════

    // Auto-update size when week changes
    $('#lt-pregnancy-week').on('change', function() {
        const week = parseInt($(this).val());
        // Could show size preview here if desired
    });

    $('#lt-pregnancy-save').on('click', () => {
        const data = {
            week: $('#lt-pregnancy-week').val(),
            size: getBabySize(parseInt($('#lt-pregnancy-week').val())),
            dueDate: formatDate($('#lt-pregnancy-due').val()),
            disclosed: $('#lt-pregnancy-disclosed').val() === 'true',
            gender: $('#lt-pregnancy-gender').val(),
            symptoms: $('#lt-pregnancy-symptoms').val() || 'None noted',
            nextVisit: $('#lt-pregnancy-visit').val() || 'Not scheduled',
            risks: $('#lt-pregnancy-risks').val() || 'Stable'
        };
        saveChatData('pregnancy', data);
        showSavedData('pregnancy');
        alert('Pregnancy data saved! 💾');
    });

    $('#lt-pregnancy-insert').on('click', () => {
        const week = parseInt($('#lt-pregnancy-week').val()) || 8;
        const data = {
            week: week,
            size: getBabySize(week),
            dueDate: formatDate($('#lt-pregnancy-due').val()),
            disclosed: $('#lt-pregnancy-disclosed').val() === 'true',
            gender: $('#lt-pregnancy-gender').val(),
            symptoms: $('#lt-pregnancy-symptoms').val() || 'None noted',
            nextVisit: $('#lt-pregnancy-visit').val() || 'Not scheduled',
            risks: $('#lt-pregnancy-risks').val() || 'Stable'
        };
        saveChatData('pregnancy', data);
        insertTextAtCursor(TEMPLATES.pregnancy(data));
    });

    // ═══════════════════════════════════════════════════════════
    // BIRTH HANDLERS
    // ═══════════════════════════════════════════════════════════

    $('#lt-birth-insert').on('click', () => {
        const data = {
            gender: $('#lt-birth-gender').val(),
            usAccuracy: $('#lt-birth-accuracy').val(),
            weight: $('#lt-birth-weight').val(),
            height: $('#lt-birth-height').val(),
            dominance: $('#lt-birth-dominance').val() || 'Mother (60%)',
            features: $('#lt-birth-features').val() || "Mother's eyes, Father's hair",
            temperament: $('#lt-birth-temperament').val() || 'Calm, Curious, Alert',
            health: $('#lt-birth-health').val(),
            pathology: $('#lt-birth-pathology').val() || 'None Detected',
            timestamp: new Date().toLocaleDateString()
        };
        saveChatData('birth', data);
        insertTextAtCursor(TEMPLATES.birth(data));
    });

    // ═══════════════════════════════════════════════════════════
    // BABY CARE HANDLERS
    // ═══════════════════════════════════════════════════════════

    $('#lt-baby-save').on('click', () => {
        const data = {
            name: $('#lt-baby-name').val(),
            age: $('#lt-baby-age').val(),
            hunger: $('#lt-baby-hunger').val(),
            hygiene: $('#lt-baby-hygiene').val(),
            energy: $('#lt-baby-energy').val(),
            mood: $('#lt-baby-mood').val(),
            traits: $('#lt-baby-traits').val(),
            milestone: $('#lt-baby-milestone').val(),
            medical: $('#lt-baby-medical').val(),
            immediateNeed: $('#lt-baby-need').val()
        };
        saveChatData('baby', data);
        showSavedData('baby');
        alert('Baby data saved! 👶');
    });

    $('#lt-baby-insert').on('click', () => {
        const data = {
            name: $('#lt-baby-name').val() || 'Unnamed',
            age: $('#lt-baby-age').val() || '0 Weeks',
            hunger: $('#lt-baby-hunger').val(),
            hygiene: $('#lt-baby-hygiene').val(),
            energy: $('#lt-baby-energy').val(),
            mood: $('#lt-baby-mood').val(),
            traits: $('#lt-baby-traits').val() || 'Observant, Calm',
            milestone: $('#lt-baby-milestone').val() || 'Social smiling',
            medical: $('#lt-baby-medical').val() || 'Next Visit: TBD',
            immediateNeed: $('#lt-baby-need').val() || 'None - Baby is content'
        };
        saveChatData('baby', data);
        insertTextAtCursor(TEMPLATES.babyCare(data));
    });

    // ═══════════════════════════════════════════════════════════
    // LOAD SAVED DATA ON CHAT CHANGE
    // ═══════════════════════════════════════════════════════════

    eventSource.on(event_types.CHAT_CHANGED, () => {
        // Load saved data into forms
        const conception = getChatData('conception');
        const pregnancy = getChatData('pregnancy');
        const baby = getChatData('baby');

        if (conception) {
            $('#lt-conception-date').val(conception.conceptionDate);
        }

        if (pregnancy) {
            $('#lt-pregnancy-week').val(pregnancy.week);
            $('#lt-pregnancy-disclosed').val(pregnancy.disclosed ? 'true' : 'false');
            $('#lt-pregnancy-gender').val(pregnancy.gender);
            $('#lt-pregnancy-symptoms').val(pregnancy.symptoms);
            $('#lt-pregnancy-visit').val(pregnancy.nextVisit);
            $('#lt-pregnancy-risks').val(pregnancy.risks);
        }

        if (baby) {
            $('#lt-baby-name').val(baby.name);
            $('#lt-baby-age').val(baby.age);
            $('#lt-baby-hunger').val(baby.hunger);
            $('#lt-baby-hygiene').val(baby.hygiene);
            $('#lt-baby-energy').val(baby.energy);
            $('#lt-baby-mood').val(baby.mood);
            $('#lt-baby-traits').val(baby.traits);
            $('#lt-baby-milestone').val(baby.milestone);
            $('#lt-baby-medical').val(baby.medical);
            $('#lt-baby-need').val(baby.immediateNeed);
        }
    });

    console.log('[Life Tracker] Extension loaded! 💕');
});
