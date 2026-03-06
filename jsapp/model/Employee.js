
import DAYS   from "./Day.js";
import SHIFTS from "./Shift.js";

export default class Employee {

    constructor(name) {
        this.name        = name;
        this.preferences = {};                              // Map<day, Shift[]>
        this.assignments = Array.from(                      // boolean[7][3]
            { length: 7 },
            () => [false, false, false]
        );
        this.daysWorked  = 0;
    }

     /**
     * mirrors: setPreferences(Day day, Shift first, Shift second, Shift third)
     * Null/undefined values are filtered out — same as Java null-guard.
     */
    setPreferences(day, first, second, third) {
        const ranked = [first, second, third].filter(s => s != null);
        this.preferences[day] = ranked;
    }

    /**
     * mirrors: getPreferences(Day day) → List<Shift>
     * Returns preferences in priority order. Empty array if none set.
     */
    getPreferences(day) {
        return this.preferences[day] ?? [];
    }

    /**
     * mirrors: hasPreference(Day day)
     */
    hasPreference(day) {
        return this.getPreferences(day).length > 0;
    }

    // ── Availability ───────────────────────────────────────────────────

    /**
     * mirrors: isAvailable(Day day)
     * True if under 5-day cap AND not already assigned on this day.
     */
    isAvailable(day) {
        if (this.daysWorked >= 5) return false;           // 5-day cap
        const di = DAYS.indexOf(day);
        for (let si = 0; si < SHIFTS.length; si++) {
            if (this.assignments[di][si]) return false;     // already working today
        }
        return true;
    }

    // ── Assignment ─────────────────────────────────────────────────────

    /**
     * mirrors: assign(Day day, Shift shift)
     * Uses indexOf() in place of Java's .ordinal()
     */
    assign(day, shift) {
        this.assignments[DAYS.indexOf(day)][SHIFTS.indexOf(shift)] = true;
        this.daysWorked++;
    }

    /**
     * mirrors: reset()
     * Called at the start of each buildSchedule() run.
     */
    reset() {
        this.assignments = Array.from(
            { length: 7 },
            () => [false, false, false]
        );
        this.daysWorked = 0;
    }
}