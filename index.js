/* ═══════════════════════════════════════════════════════════════
   FAWN'S LIFE TRACKER - STYLES
   ═══════════════════════════════════════════════════════════════ */

/* Main Button in Input Panel */
#flt-main-button {
    background: transparent;
    border: 1px solid var(--SmartThemeBorderColor);
    border-radius: 4px;
    color: var(--SmartThemeBodyColor);
    cursor: pointer;
    padding: 6px 10px;
    margin: 0 4px;
    font-size: 1em;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 5px;
}

#flt-main-button:hover {
    background: color-mix(in srgb, var(--SmartThemeAccent) 20%, transparent);
    border-color: var(--SmartThemeAccent);
    color: var(--SmartThemeAccent);
}

#flt-main-button.active {
    background: color-mix(in srgb, var(--SmartThemeAccent) 30%, transparent);
    border-color: var(--SmartThemeAccent);
}

/* Popup Menu Container */
#flt-popup-menu {
    position: absolute;
    bottom: 100%;
    left: 0;
    margin-bottom: 8px;
    background: var(--SmartThemeBlurTintColor, var(--SmartThemeBodyColor));
    border: 1px solid var(--SmartThemeBorderColor);
    border-radius: 8px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
    min-width: 280px;
    max-width: 350px;
    z-index: 9999;
    display: none;
    overflow: hidden;
    backdrop-filter: blur(10px);
}

#flt-popup-menu.show {
    display: block;
    animation: flt-slideUp 0.2s ease;
}

@keyframes flt-slideUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Menu Header */
.flt-menu-header {
    background: color-mix(in srgb, var(--SmartThemeAccent) 15%, transparent);
    padding: 10px 15px;
    border-bottom: 1px solid var(--SmartThemeBorderColor);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.flt-menu-title {
    font-weight: bold;
    color: var(--SmartThemeAccent);
    font-size: 0.9em;
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.flt-menu-close {
    background: transparent;
    border: none;
    color: var(--SmartThemeBodyColor);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    opacity: 0.7;
    transition: all 0.2s;
}

.flt-menu-close:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
}

/* Tracker List */
.flt-tracker-list {
    max-height: 400px;
    overflow-y: auto;
    padding: 8px;
}

.flt-tracker-item {
    display: flex;
    align-items: center;
    padding: 12px;
    margin: 4px 0;
    background: color-mix(in srgb, var(--SmartThemeBodyColor) 5%, transparent);
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    gap: 12px;
}

.flt-tracker-item:hover {
    background: color-mix(in srgb, var(--SmartThemeAccent) 10%, transparent);
    border-color: var(--SmartThemeAccent);
}

.flt-tracker-item.active {
    background: color-mix(in srgb, var(--SmartThemeAccent) 20%, transparent);
    border-color: var(--SmartThemeAccent);
}

.flt-tracker-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--SmartThemeAccent) 20%, transparent);
    border-radius: 50%;
    color: var(--SmartThemeAccent);
    font-size: 1em;
    flex-shrink: 0;
}

.flt-tracker-info {
    flex: 1;
    min-width: 0;
}

.flt-tracker-name {
    font-weight: bold;
    color: var(--SmartThemeBodyColor);
    font-size: 0.9em;
    margin-bottom: 2px;
}

.flt-tracker-desc {
    font-size: 0.75em;
    color: var(--SmartThemeBodyColor);
    opacity: 0.6;
}

.flt-tracker-status {
    font-size: 0.7em;
    padding: 2px 6px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--SmartThemeQuoteColor) 20%, transparent);
    color: var(--SmartThemeQuoteColor);
}

.flt-tracker-status.inactive {
    background: color-mix(in srgb, var(--SmartThemeBorderColor) 30%, transparent);
    color: var(--SmartThemeBodyColor);
    opacity: 0.5;
}

/* Undo Section */
.flt-undo-section {
    padding: 8px;
    border-top: 1px solid var(--SmartThemeBorderColor);
    display: none;
}

.flt-undo-section.show {
    display: block;
}

.flt-undo-btn {
    width: 100%;
    padding: 10px;
    background: color-mix(in srgb, #e76f51 20%, transparent);
    border: 1px solid #e76f51;
    border-radius: 6px;
    color: #e76f51;
    cursor: pointer;
    font-size: 0.85em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
}

.flt-undo-btn:hover {
    background: color-mix(in srgb, #e76f51 30%, transparent);
}

/* Modal Overlay */
.flt-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 20px;
    backdrop-filter: blur(4px);
}

.flt-modal-overlay.show {
    display: flex;
    animation: flt-fadeIn 0.2s ease;
}

@keyframes flt-fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Modal Container */
.flt-modal {
    background: var(--SmartThemeBlurTintColor, #1a1a2e);
    border: 1px solid var(--SmartThemeBorderColor);
    border-radius: 12px;
    max-width: 500px;
    width: 100%;
    max-height: 85vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: flt-scaleIn 0.2s ease;
}

@keyframes flt-scaleIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.flt-modal-header {
    padding: 15px 20px;
    background: color-mix(in srgb, var(--SmartThemeAccent) 15%, transparent);
    border-bottom: 1px solid var(--SmartThemeBorderColor);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.flt-modal-title {
    font-weight: bold;
    color: var(--SmartThemeAccent);
    font-size: 1em;
    display: flex;
    align-items: center;
    gap: 10px;
}

.flt-modal-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
}

.flt-modal-footer {
    padding: 15px 20px;
    border-top: 1px solid var(--SmartThemeBorderColor);
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

/* Form Elements */
.flt-form-group {
    margin-bottom: 15px;
}

.flt-form-label {
    display: block;
    font-size: 0.85em;
    color: var(--SmartThemeBodyColor);
    margin-bottom: 6px;
    opacity: 0.8;
}

.flt-form-input,
.flt-form-select,
.flt-form-textarea {
    width: 100%;
    padding: 10px 12px;
    background: color-mix(in srgb, var(--SmartThemeBodyColor) 5%, transparent);
    border: 1px solid var(--SmartThemeBorderColor);
    border-radius: 6px;
    color: var(--SmartThemeBodyColor);
    font-size: 0.9em;
    font-family: inherit;
    transition: all 0.2s;
}

.flt-form-input:focus,
.flt-form-select:focus,
.flt-form-textarea:focus {
    outline: none;
    border-color: var(--SmartThemeAccent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--SmartThemeAccent) 20%, transparent);
}

.flt-form-textarea {
    min-height: 80px;
    resize: vertical;
}

.flt-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

/* Buttons */
.flt-btn {
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 0.9em;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid transparent;
}

.flt-btn-primary {
    background: var(--SmartThemeAccent);
    color: white;
    border-color: var(--SmartThemeAccent);
}

.flt-btn-primary:hover {
    filter: brightness(1.1);
}

.flt-btn-secondary {
    background: transparent;
    color: var(--SmartThemeBodyColor);
    border-color: var(--SmartThemeBorderColor);
}

.flt-btn-secondary:hover {
    background: color-mix(in srgb, var(--SmartThemeBodyColor) 10%, transparent);
}

.flt-btn-ai {
    background: color-mix(in srgb, #2a9d8f 20%, transparent);
    color: #2a9d8f;
    border-color: #2a9d8f;
}

.flt-btn-ai:hover {
    background: color-mix(in srgb, #2a9d8f 30%, transparent);
}

/* Toggle Switch */
.flt-toggle-group {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
}

.flt-toggle {
    position: relative;
    width: 44px;
    height: 24px;
    background: var(--SmartThemeBorderColor);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s;
}

.flt-toggle.active {
    background: var(--SmartThemeAccent);
}

.flt-toggle::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: all 0.3s;
}

.flt-toggle.active::after {
    left: 22px;
}

.flt-toggle-label {
    font-size: 0.85em;
    color: var(--SmartThemeBodyColor);
}

/* Section Divider */
.flt-section-divider {
    border: none;
    border-top: 1px dashed var(--SmartThemeBorderColor);
    margin: 20px 0;
}

.flt-section-title {
    font-size: 0.8em;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--SmartThemeAccent);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Preview Box */
.flt-preview-box {
    background: color-mix(in srgb, var(--SmartThemeBodyColor) 3%, transparent);
    border: 1px dashed var(--SmartThemeBorderColor);
    border-radius: 8px;
    padding: 15px;
    margin-top: 15px;
}

.flt-preview-title {
    font-size: 0.75em;
    text-transform: uppercase;
    color: var(--SmartThemeAccent);
    margin-bottom: 10px;
    opacity: 0.8;
}

/* Info Box */
.flt-info-box {
    background: color-mix(in srgb, var(--SmartThemeAccent) 10%, transparent);
    border-left: 3px solid var(--SmartThemeAccent);
    padding: 12px;
    border-radius: 0 6px 6px 0;
    margin-bottom: 15px;
    font-size: 0.85em;
    color: var(--SmartThemeBodyColor);
    opacity: 0.9;
}

/* Mobile Responsive */
@media (max-width: 768px) {
    #flt-popup-menu {
        position: fixed;
        bottom: 60px;
        left: 10px;
        right: 10px;
        max-width: none;
        margin-bottom: 0;
    }

    .flt-modal {
        max-height: 90vh;
        margin: 10px;
    }

    .flt-form-row {
        grid-template-columns: 1fr;
    }

    .flt-modal-footer {
        flex-direction: column;
    }

    .flt-btn {
        width: 100%;
        justify-content: center;
    }

    #flt-main-button span.flt-btn-text {
        display: none;
    }
}

/* Scrollbar Styling */
.flt-tracker-list::-webkit-scrollbar,
.flt-modal-body::-webkit-scrollbar {
    width: 6px;
}

.flt-tracker-list::-webkit-scrollbar-track,
.flt-modal-body::-webkit-scrollbar-track {
    background: transparent;
}

.flt-tracker-list::-webkit-scrollbar-thumb,
.flt-modal-body::-webkit-scrollbar-thumb {
    background: var(--SmartThemeBorderColor);
    border-radius: 3px;
}

.flt-tracker-list::-webkit-scrollbar-thumb:hover,
.flt-modal-body::-webkit-scrollbar-thumb:hover {
    background: var(--SmartThemeAccent);
}

/* Notification Toast */
.flt-toast {
    position: fixed;
    bottom: 80px;
    right: 20px;
    background: var(--SmartThemeBlurTintColor, #1a1a2e);
    border: 1px solid var(--SmartThemeBorderColor);
    border-radius: 8px;
    padding: 12px 20px;
    z-index: 10001;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    animation: flt-slideIn 0.3s ease;
}

.flt-toast.success {
    border-left: 3px solid #2a9d8f;
}

.flt-toast.error {
    border-left: 3px solid #e76f51;
}

.flt-toast.hiding {
    animation: flt-slideOut 0.3s ease forwards;
}

@keyframes flt-slideIn {
    from {
        opacity: 0;
        transform: translateX(100px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes flt-slideOut {
    from {
        opacity: 1;
        transform: translateX(0);
    }
    to {
        opacity: 0;
        transform: translateX(100px);
    }
}

/* Chip/Tag Style */
.flt-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    background: color-mix(in srgb, var(--SmartThemeAccent) 15%, transparent);
    border-radius: 20px;
    font-size: 0.75em;
    color: var(--SmartThemeAccent);
    margin: 2px;
}

/* Data Display in Tracker Items */
.flt-tracker-data {
    font-size: 0.7em;
    color: var(--SmartThemeQuoteColor);
    margin-top: 4px;
}
