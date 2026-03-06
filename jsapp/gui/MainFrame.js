import Employee         from "../model/Employee.js";
import SchedulingService from "../service/SchedulingService.js";
import PreferenceDialog  from "./PreferenceDialog.js";

export default class MainFrame {

    constructor() {
        this.employees     = [];       // mirrors: List<Employee> employees
        this.service       = new SchedulingService();
        this.selectedIndex = -1;       // mirrors: empList.getSelectedIndex()

        this._buildDOM();
        this._bindEvents();
    }

    _buildDOM() {
        // Root container
        const app = document.getElementById("app");

        //  Left panel
        const left = document.createElement("div");
        left.id = "left-panel";

        // Name row
        const nameRow = document.createElement("div");
        nameRow.id = "name-row";

        const nameLabel = document.createElement("label");
        nameLabel.textContent = "Name:";
        nameLabel.htmlFor     = "nameInput";

        this.nameInput = document.createElement("input");
        this.nameInput.id          = "nameInput";
        this.nameInput.type        = "text";
        this.nameInput.placeholder = "type name…";
        this.nameInput.autocomplete = "off";

        this.addBtn = this._btn("Add", "btn-green");

        nameRow.appendChild(nameLabel);
        nameRow.appendChild(this.nameInput);
        nameRow.appendChild(this.addBtn);

        // Employee list — mirrors JScrollPane + JList
        const listBox = document.createElement("div");
        listBox.id = "list-box";

        const listLegend = document.createElement("span");
        listLegend.className   = "box-legend";
        listLegend.textContent = "Employees  (double-click to edit)";

        this.empListEl = document.createElement("div");
        this.empListEl.id = "empList";

        listBox.appendChild(listLegend);
        listBox.appendChild(this.empListEl);

        // Action buttons — mirrors 3 JButtons in GridLayout
        const btnStack = document.createElement("div");
        btnStack.id = "btn-stack";

        this.prefsBtn  = this._btn("Set Preferences",  "btn-blue");
        this.removeBtn = this._btn("Remove Selected",   "btn-red");
        this.genBtn    = this._btn("Generate Schedule", "btn-black");

        btnStack.appendChild(this.prefsBtn);
        btnStack.appendChild(this.removeBtn);
        btnStack.appendChild(this.genBtn);

        left.appendChild(nameRow);
        left.appendChild(listBox);
        left.appendChild(btnStack);

        // ── Right panel ──────────────────────────────────────────────────
        const right = document.createElement("div");
        right.id = "right-panel";

        const outputLegend = document.createElement("span");
        outputLegend.className   = "box-legend";
        outputLegend.textContent = "Schedule Output";

        // mirrors: JTextArea outputArea (read-only, monospaced)
        this.outputArea = document.createElement("div");
        this.outputArea.id = "output";
        this.outputArea.textContent = [
            "How to use:",
            "  1. Type a name and click Add (or press Enter).",
            "  2. The new employee is auto-selected in the list.",
            '  3. Click "Set Preferences" (or double-click the name).',
            "  4. Repeat for each employee (need at least 2).",
            '  5. Click "Generate Schedule".'
        ].join("\n");

        right.appendChild(outputLegend);
        right.appendChild(this.outputArea);

        app.appendChild(left);
        app.appendChild(right);

        // ── Alert box — mirrors JOptionPane.showMessageDialog ────────────
        this.alertOverlay = document.createElement("div");
        this.alertOverlay.id = "alert-overlay";

        const alertBox = document.createElement("div");
        alertBox.id = "alert-box";

        this.alertMsg = document.createElement("div");
        this.alertMsg.id = "alert-msg";

        const alertOk = document.createElement("button");
        alertOk.id          = "alert-ok";
        alertOk.textContent = "OK";
        alertOk.addEventListener("click", () =>
            this.alertOverlay.classList.remove("open")
        );

        alertBox.appendChild(this.alertMsg);
        alertBox.appendChild(alertOk);
        this.alertOverlay.appendChild(alertBox);
        document.body.appendChild(this.alertOverlay);
    }

    // ── Bind events ────────────────────────────────────────────────────

    /**
     * Wires up all button listeners and keyboard shortcuts.
     * mirrors: addActionListener calls in MainFrame.java constructor
     */
    _bindEvents() {
        // Add button + Enter key
        // mirrors: addBtn.addActionListener(e -> addEmployee())
        //          nameField.addActionListener(e -> addEmployee())
        this.addBtn  .addEventListener("click",   () => this.addEmployee());
        this.nameInput.addEventListener("keydown", e => {
            if (e.key === "Enter") this.addEmployee();
        });

        // mirrors: prefsBtn.addActionListener(e -> openPreferences())
        this.prefsBtn .addEventListener("click", () => this.openPreferences());

        // mirrors: removeBtn.addActionListener(e -> removeEmployee())
        this.removeBtn.addEventListener("click", () => this.removeEmployee());

        // mirrors: genBtn.addActionListener(e -> generateSchedule())
        this.genBtn   .addEventListener("click", () => this.generateSchedule());

        // PreferenceDialog delegates warn() via a custom event
        document.addEventListener("app:warn", e => this._warn(e.detail));
    }

    // ── Actions ────────────────────────────────────────────────────────

    /**
     * mirrors: addEmployee()
     */
    addEmployee() {
        const name = this.nameInput.value.trim();
        if (!name) { this._warn("Enter a name first."); return; }

        // Duplicate check — mirrors equalsIgnoreCase loop
        for (const e of this.employees) {
            if (e.name.toLowerCase() === name.toLowerCase()) {
                this._warn(`"${name}" is already in the list.`);
                return;
            }
        }

        this.employees.push(new Employee(name));
        this.nameInput.value = "";

        // Auto-select — mirrors empList.setSelectedIndex(listModel.getSize() - 1)
        this.selectedIndex = this.employees.length - 1;
        this._renderList();
    }

    /**
     * mirrors: removeEmployee()
     */
    removeEmployee() {
        if (this.selectedIndex < 0) {
            this._warn("Select an employee from the list first.");
            return;
        }
        this.employees.splice(this.selectedIndex, 1);
        this.selectedIndex = Math.min(this.selectedIndex, this.employees.length - 1);
        this._renderList();
    }

    /**
     * mirrors: openPreferences() → new PreferenceDialog(this, employees.get(idx)).setVisible(true)
     */
    openPreferences() {
        if (this.selectedIndex < 0) {
            this._warn("Select an employee from the list first.");
            return;
        }
        const emp    = this.employees[this.selectedIndex];
        const dialog = new PreferenceDialog(emp, () => {});
        dialog.show();
    }

    /**
     * mirrors: generateSchedule()
     */
    generateSchedule() {
        if (this.employees.length < 2) {
            this._warn("Add at least 2 employees before generating.");
            return;
        }
        this.service.buildSchedule(this.employees);
        this.outputArea.textContent = this.service.buildReport(this.employees);
    }

    // ── Rendering ──────────────────────────────────────────────────────

    /**
     * mirrors: JList rendering via DefaultListModel
     * Rebuilds the employee list DOM from this.employees[].
     */
    _renderList() {
        this.empListEl.innerHTML = "";

        for (let i = 0; i < this.employees.length; i++) {
            const item = document.createElement("div");
            item.className   = "emp-item" + (i === this.selectedIndex ? " selected" : "");
            item.textContent = this.employees[i].name;

            // Single click → select
            // mirrors: empList selection listener
            item.addEventListener("click", () => {
                this.selectedIndex = i;
                this._renderList();
            });

            // Double click → open preferences
            // mirrors: MouseAdapter mouseClicked with getClickCount() == 2
            item.addEventListener("dblclick", () => {
                this.selectedIndex = i;
                this._renderList();
                this.openPreferences();
            });

            this.empListEl.appendChild(item);
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────

    /**
     * mirrors: warn(String msg) → JOptionPane.showMessageDialog(...)
     */
    _warn(msg) {
        this.alertMsg.textContent = msg;
        this.alertOverlay.classList.add("open");
    }

    /**
     * mirrors: btn(String text, Color bg) — styled button factory
     */
    _btn(text, colorClass) {
        const b = document.createElement("button");
        b.className   = `btn ${colorClass}`;
        b.textContent = text;
        return b;
    }
}