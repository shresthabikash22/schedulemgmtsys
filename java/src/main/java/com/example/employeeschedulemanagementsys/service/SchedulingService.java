package com.example.employeeschedulemanagementsys.service;

import com.example.employeeschedulemanagementsys.model.Day;
import com.example.employeeschedulemanagementsys.model.Employee;
import com.example.employeeschedulemanagementsys.model.Shift;

import java.util.*;

public class SchedulingService {

    private static final int MIN_PER_SHIFT = 2;
    // Soft cap: don't overfill one shift beyond this during preference assignment
    private static final int MAX_PER_SHIFT = 4;

    // schedule.get(day).get(shift) → list of assigned employees
    private final Map<Day, Map<Shift, List<Employee>>> schedule = new EnumMap<>(Day.class);
    private final Random random = new Random();

    public SchedulingService() {
        for (Day day : Day.values()) {
            Map<Shift, List<Employee>> row = new EnumMap<>(Shift.class);
            for (Shift shift : Shift.values()) row.put(shift, new ArrayList<>());
            schedule.put(day, row);
        }
    }

    public void buildSchedule(List<Employee> employees) {
        // Clear from any previous run
        for (Day day : Day.values())
            for (Shift shift : Shift.values())
                schedule.get(day).get(shift).clear();
        employees.forEach(Employee::reset);

        assignByPreference(employees);   // Phase 1
        enforceMinimum(employees);       // Phase 2
    }

    public Map<Day, Map<Shift, List<Employee>>> getSchedule() { return schedule; }


    private void assignByPreference(List<Employee> employees) {
        for (Employee emp : employees) {                      // for-each: employees
            for (Day day : Day.values()) {                    // for-each: days
                if (!emp.isAvailable(day)) continue;
                if (!emp.hasPreference(day)) continue;

                List<Shift> prefs = emp.getPreferences(day);
                boolean placed = false;

                // Try each ranked preference in order (Bonus: ranked priority)
                for (int rank = 0; rank < prefs.size(); rank++) {  // for: ranked list
                    Shift candidate = prefs.get(rank);
                    List<Employee> slot = schedule.get(day).get(candidate);

                    if (slot.size() < MAX_PER_SHIFT) {   // slot not overfull
                        slot.add(emp);
                        emp.assign(day, candidate);
                        placed = true;
                        break;  // stop at first successful placement
                    }
                    // else: CONFLICT — slot is full, loop tries the next ranked choice
                }

                // Conflict resolution: all same-day preferences were full → try next day
                if (!placed) {
                    Day next = nextDay(day);
                    if (next != null && emp.isAvailable(next)) {
                        for (Shift fallback : Shift.values()) {      // for-each: shifts
                            List<Employee> slot = schedule.get(next).get(fallback);
                            if (slot.size() < MAX_PER_SHIFT) {
                                slot.add(emp);
                                emp.assign(next, fallback);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }


    private void enforceMinimum(List<Employee> employees) {
        for (Day day : Day.values()) {
            for (Shift shift : Shift.values()) {
                List<Employee> slot = schedule.get(day).get(shift);

                // while: keep adding until minimum staffing is reached
                while (slot.size() < MIN_PER_SHIFT) {
                    List<Employee> eligible = new ArrayList<>();
                    for (Employee emp : employees) {          // for-each: find eligible
                        if (emp.isAvailable(day)) eligible.add(emp);
                    }

                    if (eligible.isEmpty()) break;            // no one left — move on

                    // Randomly pick (per spec)
                    Employee picked = eligible.get(random.nextInt(eligible.size()));
                    slot.add(picked);
                    picked.assign(day, shift);
                }
            }
        }
    }

    private Day nextDay(Day day) {
        Day[] days = Day.values();
        int next = day.ordinal() + 1;
        return next < days.length ? days[next] : null;
    }

    /** Produce a plain-text schedule report for display in the output area. */
    public String buildReport(List<Employee> employees) {
        String sep = "=".repeat(54);
        StringBuilder sb = new StringBuilder();
        sb.append(sep).append("\n");
        sb.append("        WEEKLY EMPLOYEE SCHEDULE\n");
        sb.append(sep).append("\n");

        for (Day day : Day.values()) {
            sb.append("\n  ").append(day).append("\n");
            sb.append("  ").append("-".repeat(40)).append("\n");

            for (Shift shift : Shift.values()) {
                List<Employee> assigned = schedule.get(day).get(shift);
                sb.append(String.format("  %-12s: ", shift));

                if (assigned.isEmpty()) {
                    sb.append("(nobody assigned)");
                } else {
                    for (int i = 0; i < assigned.size(); i++) {
                        if (i > 0) sb.append(", ");
                        sb.append(assigned.get(i).getName());
                    }
                    if (assigned.size() < MIN_PER_SHIFT)
                        sb.append("  [UNDERSTAFFED]");
                }
                sb.append("\n");
            }
        }

        sb.append("\n").append(sep).append("\n");
        sb.append("  DAYS WORKED\n");
        sb.append("  ").append("-".repeat(40)).append("\n");
        for (Employee emp : employees) {
            int n = emp.getDaysWorked();
            sb.append(String.format("  %-16s %s %d/5\n",
                    emp.getName(),
                    "#".repeat(n) + ".".repeat(5 - n),
                    n));
        }
        sb.append(sep).append("\n");
        return sb.toString();
    }
}
