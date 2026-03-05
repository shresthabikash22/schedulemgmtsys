package com.example.employeeschedulemanagementsys.model;

import java.util.*;

public class Employee {

    private final String name;
    private final Map<Day, List<Shift>> preferences = new EnumMap<>(Day.class);
    private boolean[][] assignments = new boolean[7][3];
    private int daysWorked = 0;

    public Employee(String name) {
        this.name = name;
    }

    public String getName() { return name; }
    public int getDaysWorked() { return daysWorked; }


    /** Store ranked preferences for one day. Nulls are silently ignored. */
    public void setPreferences(Day day, Shift first, Shift second, Shift third) {
        List<Shift> ranked = new ArrayList<>();
        if (first  != null) ranked.add(first);
        if (second != null) ranked.add(second);
        if (third  != null) ranked.add(third);
        preferences.put(day, ranked);
    }

    /** Preferences in priority order (index 0 = highest). Empty list if none set. */
    public List<Shift> getPreferences(Day day) {
        return preferences.getOrDefault(day, Collections.emptyList());
    }

    public boolean hasPreference(Day day) {
        return !getPreferences(day).isEmpty();
    }


    /**
     * True if the employee has not yet been assigned on this day AND
     * has not reached the 5-day weekly cap.
     */
    public boolean isAvailable(Day day) {
        if (daysWorked >= 5) return false;
        for (Shift s : Shift.values()) {
            if (assignments[day.ordinal()][s.ordinal()]) return false;
        }
        return true;
    }


    public void assign(Day day, Shift shift) {
        assignments[day.ordinal()][shift.ordinal()] = true;
        daysWorked++;
    }

    public void reset() {
        assignments = new boolean[7][3];
        daysWorked = 0;
    }

    @Override public String toString() { return name; }
}