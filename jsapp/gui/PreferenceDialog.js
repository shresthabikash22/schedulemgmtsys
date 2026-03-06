/**
 * PreferenceDialog.js — mirrors PreferenceDialog.java
 *
 * Java uses a JDialog (modal window) with a GridLayout grid of JComboBoxes.
 * JS uses a CSS modal overlay with a CSS grid of <select> elements.
 *
 * Behaviour mirrored 1:1:
 *   - One row per day, 4 columns: Day | 1st Choice | 2nd Choice | 3rd Choice
 *   - Null option ("—") at index 0 = no preference for that day
 *   - Pre-fills from existing employee preferences on open
 *   - Save validates no duplicate non-null choices on the same row
 *   - Cancel closes without saving
 */

import DAYS   from "../model/Day.js";
import SHIFTS from "../model/Shift.js";

export default class PreferenceDialog {

    /**
     * mirrors: PreferenceDialog(JFrame owner, Employee employee)
     * @param {Employee} employee  — the employee whose prefs are being edited
     * @param {Function} onSave    — callback fired after successful save
     */
    constructor(employee, onSave) {
        this.employee = employee;
        this.onSave   = onSave;
        this._buildDOM();
    }

    // ── Build DOM ──────────────────────────────────────────────────────

    /**
     * mirrors: initializeUI() in PreferenceDialog.java
     * Builds the modal overlay, header, 7-row pref grid, and buttons.
     */
    _buildDOM() {

        // ── Overlay (backdrop) ──
        this.overlay = document.createElement("div");
        this.overlay.className = "modal-overlay";

        // ── Dialog box ──
        const box = document.createElement("div");
        box.className = "modal-box";

        // ── Title bar ──
        const title = document.createElement("div");
        title.className   = "modal-titlebar";
        title.textContent = `Preferences — ${this.employee.name}`;

        // ── Preference grid ──
        // mirrors: JPanel grid = new JPanel(new GridLayout(7, 4, 8, 6))
        const body = document.createElement("div");
        body.className = "modal-body";

        const grid = document.createElement("div");
        grid.className = "pref-grid";

        // Column headers
        // mirrors: String[] titles = {"Day","1st Choice","2nd Choice","3rd Choice"}
        for (const h of ["Day", "1st Choice", "2nd Choice", "3rd Choice"]) {
            const lbl = document.createElement("div");
            lbl.className   = "pref-header";
            lbl.textContent = h;
            grid.appendChild(lbl);
        }

        // Day rows
        // mirrors: for (Day day : Day.values()) { grid.add(dayLbl); ... 3 combos ... }
        this._selects = {};   // day -> [sel0, sel1, sel2]  mirrors Map<Day, JComboBox[]>

        for (const day of DAYS) {
            // Day label
            const dayLbl = document.createElement("div");
            dayLbl.className   = "pref-day";
            dayLbl.textContent = day;
            grid.appendChild(dayLbl);

            const row = [];
            const saved = this.employee.getPreferences(day);   // pre-fill data

            for (let rank = 0; rank < 3; rank++) {
                const sel = document.createElement("select");
                sel.className = "pref-select";

                // Null / no-preference option — mirrors cb.addItem(null)
                const none = document.createElement("option");
                none.value       = "";
                none.textContent = "—";
                sel.appendChild(none);

                // Shift options — mirrors for (Shift s : Shift.values()) cb.addItem(s)
                for (const shift of SHIFTS) {
                    const opt = document.createElement("option");
                    opt.value       = shift;
                    opt.textContent = shift;
                    sel.appendChild(opt);
                }

                // Pre-fill — mirrors loadExistingPreferences()
                if (saved[rank]) sel.value = saved[rank];

                grid.appendChild(sel);
                row.push(sel);
            }

            this._selects[day] = row;
        }

        body.appendChild(grid);

        // ── Buttons ──
        // mirrors: JButton saveBtn + JButton cancelBtn
        const btnRow = document.createElement("div");
        btnRow.className = "modal-btns";

        const cancelBtn = document.createElement("button");
        cancelBtn.className   = "modal-btn modal-btn-cancel";
        cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener("click", () => this.close());

        const saveBtn = document.createElement("button");
        saveBtn.className   = "modal-btn modal-btn-save";
        saveBtn.textContent = "Save";
        saveBtn.addEventListener("click", () => { if (this._save()) this.close(); });

        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(saveBtn);

        // Assemble
        box.appendChild(title);
        box.appendChild(body);
        box.appendChild(btnRow);
        this.overlay.appendChild(box);
        document.body.appendChild(this.overlay);

        // Clicking the backdrop closes the dialog
        // mirrors: cancelBtn.addActionListener(e -> dispose())
        this.overlay.addEventListener("click", e => {
            if (e.target === this.overlay) this.close();
        });
    }

    // ── Save ───────────────────────────────────────────────────────────

    /**
     * mirrors: save() in PreferenceDialog.java
     * Validates no duplicates, then calls employee.setPreferences().
     * Returns true on success, false if validation fails.
     */
    _save() {
        for (const day of DAYS) {
            const [sel0, sel1, sel2] = this._selects[day];
            const s1 = sel0.value || null;
            const s2 = sel1.value || null;
            const s3 = sel2.value || null;

            // Validate — mirrors if/else duplicate checks in save()
            if (s1 && (s1 === s2 || s1 === s3)) {
                this._warn(`Duplicate choices on ${day}. All three must be different.`);
                return false;
            }
            if (s2 && s2 === s3) {
                this._warn(`2nd and 3rd choices on ${day} cannot be the same.`);
                return false;
            }

            // Store if at least one choice was set
            // mirrors: if (s1 != null || s2 != null || s3 != null) employee.setPreferences(...)
            if (s1 || s2 || s3) {
                this.employee.setPreferences(day, s1, s2, s3);
            }
        }

        if (this.onSave) this.onSave();
        return true;
    }

    // ── Show / Close ───────────────────────────────────────────────────

    /**
     * mirrors: dialog.setVisible(true)
     */
    show() {
        this.overlay.classList.add("open");
    }

    /**
     * mirrors: dispose()
     */
    close() {
        this.overlay.classList.remove("open");
        this.overlay.remove();
    }

    // ── Helpers ────────────────────────────────────────────────────────

    /**
     * mirrors: warn(String msg) → JOptionPane.showMessageDialog(...)
     * Delegates to MainFrame's warn() via a custom DOM event.
     */
    _warn(msg) {
        document.dispatchEvent(new CustomEvent("app:warn", { detail: msg }));
    }
}