

import DAYS   from "../model/Day.js";
import SHIFTS from "../model/Shift.js";

const MIN_PER_SHIFT = 2;   // mirrors: static final int MIN_PER_SHIFT = 2
const MAX_PER_SHIFT = 4;   // mirrors: static final int MAX_PER_SHIFT = 4

export default class SchedulingService {

    constructor() {
        // Initialise all slots as empty arrays
        // mirrors: for (Day day) { for (Shift shift) { shiftMap.put(shift, new ArrayList<>()) } }
        this.schedule = {};
        for (const day of DAYS) {
            this.schedule[day] = {};
            for (const shift of SHIFTS) {
                this.schedule[day][shift] = [];
            }
        }
    }

    // ── Public entry point ─────────────────────────────────────────────

    /**
     * mirrors: buildSchedule(List<Employee> employees)
     */
    buildSchedule(employees) {
        // Clear from any previous run
        for (const day of DAYS)
            for (const shift of SHIFTS)
                this.schedule[day][shift] = [];

        for (const emp of employees) emp.reset();   // mirrors employees.forEach(Employee::reset)

        this._assignByPreference(employees);         // Phase 1
        this._enforceMinimum(employees);             // Phase 2
    }

    // ── Phase 1: preference-based assignment ──────────────────────────

    /**
     * mirrors: assignByPreference(List<Employee> employees)
     */
    _assignByPreference(employees) {
        for (const emp of employees) {                       // for-each: employees
            for (const day of DAYS) {                          // for-each: days
                if (!emp.isAvailable(day)) continue;
                if (!emp.hasPreference(day)) continue;

                const prefs  = emp.getPreferences(day);
                let   placed = false;

                // Try each ranked preference in order — Bonus: ranked priority
                for (let rank = 0; rank < prefs.length; rank++) {   // for: rank order
                    const candidate = prefs[rank];
                    const slot      = this.schedule[day][candidate];

                    if (slot.length < MAX_PER_SHIFT) {     // slot not overfull
                        slot.push(emp);
                        emp.assign(day, candidate);
                        placed = true;
                        break;                               // stop at first successful placement
                    }
                    // else: CONFLICT — slot is full, loop tries next ranked choice
                }

                // Conflict resolution: all same-day preferences full → try next day
                // mirrors: if (!placed) { Day next = nextDay(day); ... }
                if (!placed) {
                    const next = this._nextDay(day);
                    if (next !== null && emp.isAvailable(next)) {
                        for (const fallback of SHIFTS) {              // for-each: shifts
                            const slot = this.schedule[next][fallback];
                            if (slot.length < MAX_PER_SHIFT) {
                                slot.push(emp);
                                emp.assign(next, fallback);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    // ── Phase 2: enforce minimum 2 employees per shift ────────────────

    /**
     * mirrors: enforceMinimum(List<Employee> employees)
     */
    _enforceMinimum(employees) {
        for (const day of DAYS) {
            for (const shift of SHIFTS) {
                const slot = this.schedule[day][shift];

                // while: keep adding until minimum staffing is reached
                while (slot.length < MIN_PER_SHIFT) {
                    // for-each: find eligible employees
                    const eligible = employees.filter(e => e.isAvailable(day));

                    if (eligible.length === 0) break;      // no one left — move on

                    // Randomly pick (per spec)
                    // mirrors: eligible.get(random.nextInt(eligible.size()))
                    const picked = eligible[Math.floor(Math.random() * eligible.length)];
                    slot.push(picked);
                    picked.assign(day, shift);
                }
            }
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────

    /**
     * mirrors: nextDay(Day day)
     * Returns the next day string, or null if day is SUNDAY.
     */
    _nextDay(day) {
        const i = DAYS.indexOf(day);
        return i + 1 < DAYS.length ? DAYS[i + 1] : null;
    }

    /**
     * mirrors: buildReport(List<Employee> employees)
     * Returns the formatted plain-text weekly schedule string.
     */
    buildReport(employees) {
        const sep  = "=".repeat(54);
        const dash = "-".repeat(40);
        const lines = [sep, "        WEEKLY EMPLOYEE SCHEDULE", sep];

        for (const day of DAYS) {
            lines.push(`\n  ${day}`, `  ${dash}`);

            for (const shift of SHIFTS) {
                const assigned = this.schedule[day][shift];
                const label    = shift.padEnd(12);

                let body;
                if (assigned.length === 0) {
                    body = "(nobody assigned)";
                } else {
                    body = assigned.map(e => e.name).join(", ");
                    if (assigned.length < MIN_PER_SHIFT) body += "  [UNDERSTAFFED]";
                }
                lines.push(`  ${label}: ${body}`);
            }
        }

        // Days-worked summary
        // mirrors: for (Employee emp : employees) { sb.append(...) }
        lines.push(`\n${sep}`, "  DAYS WORKED", `  ${dash}`);
        for (const emp of employees) {
            const n   = emp.daysWorked;
            const bar = "#".repeat(n) + ".".repeat(Math.max(0, 5 - n));
            lines.push(`  ${emp.name.padEnd(16)} [${bar}] ${n}/5`);
        }
        lines.push(sep);

        return lines.join("\n");
    }
}