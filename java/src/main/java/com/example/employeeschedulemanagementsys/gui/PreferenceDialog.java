package com.example.employeeschedulemanagementsys.gui;

import com.example.employeeschedulemanagementsys.model.Day;
import com.example.employeeschedulemanagementsys.model.Employee;
import com.example.employeeschedulemanagementsys.model.Shift;

import javax.swing.*;
import java.awt.*;
import java.util.EnumMap;
import java.util.Map;


public class PreferenceDialog extends JDialog {

    private final Employee employee;

    private final Map<Day, JComboBox<Shift>[]> rows = new EnumMap<>(Day.class);

    @SuppressWarnings("unchecked")
    public PreferenceDialog(JFrame owner, Employee employee) {
        super(owner, "Preferences — " + employee.getName(), true);
        this.employee = employee;
        setSize(660, 490);
        setLocationRelativeTo(owner);
        setLayout(new BorderLayout(6, 6));
        getRootPane().setBorder(BorderFactory.createEmptyBorder(10, 10, 6, 10));

        JPanel header = new JPanel(new GridLayout(1, 4, 6, 0));
        for (String h : new String[]{"Day", "1st Choice", "2nd Choice", "3rd Choice"}) {
            JLabel lbl = new JLabel(h, SwingConstants.CENTER);
            lbl.setFont(lbl.getFont().deriveFont(Font.BOLD, 12f));
            header.add(lbl);
        }

        JPanel grid = new JPanel(new GridLayout(Day.values().length, 4, 6, 4));

        for (Day day : Day.values()) {
            grid.add(new JLabel(day.toString(), SwingConstants.RIGHT));

            JComboBox<Shift>[] row = new JComboBox[3];
            for (int i = 0; i < 3; i++) {
                JComboBox<Shift> cb = new JComboBox<>();
                cb.addItem(null);                      // null = no preference
                for (Shift s : Shift.values()) cb.addItem(s);
                row[i] = cb;
                grid.add(cb);
            }
            rows.put(day, row);
        }

        // Pre-fill from existing preferences
        for (Day day : Day.values()) {
            var prefs = employee.getPreferences(day);
            JComboBox<Shift>[] row = rows.get(day);
            for (int i = 0; i < prefs.size() && i < 3; i++) {
                if (prefs.get(i) != null) row[i].setSelectedItem(prefs.get(i));
            }
        }

        JButton saveBtn   = styledBtn("Save",   new Color(34, 139, 34), Color.WHITE);
        JButton cancelBtn = styledBtn("Cancel", new Color(90, 90, 90),  Color.WHITE);

        saveBtn.addActionListener(e -> { if (save()) dispose(); });
        cancelBtn.addActionListener(e -> dispose());

        JPanel btnRow = new JPanel(new FlowLayout(FlowLayout.RIGHT, 6, 0));
        btnRow.add(cancelBtn);
        btnRow.add(saveBtn);

        add(header,                BorderLayout.NORTH);
        add(new JScrollPane(grid), BorderLayout.CENTER);
        add(btnRow,                BorderLayout.SOUTH);
    }

    private boolean save() {
        for (Day day : Day.values()) {
            JComboBox<Shift>[] row = rows.get(day);
            Shift s1 = (Shift) row[0].getSelectedItem();
            Shift s2 = (Shift) row[1].getSelectedItem();
            Shift s3 = (Shift) row[2].getSelectedItem();

            // if/else: validate no duplicates among non-null choices
            if (s1 != null && (s1.equals(s2) || s1.equals(s3))) {
                warn("Duplicate choices on " + day + ". All three must be different.");
                return false;
            }
            if (s2 != null && s2.equals(s3)) {
                warn("2nd and 3rd choices on " + day + " cannot be the same.");
                return false;
            }

            // Store — only if at least one choice was made for this day
            if (s1 != null || s2 != null || s3 != null) {
                employee.setPreferences(day, s1, s2, s3);
            }
        }
        return true;
    }

    private void warn(String msg) {
        JOptionPane.showMessageDialog(this, msg, "Invalid Input", JOptionPane.WARNING_MESSAGE);
    }

    private JButton styledBtn(String text, Color bg, Color fg) {
        JButton btn = new JButton(text);
        btn.setBackground(bg);
        btn.setForeground(fg);
        btn.setOpaque(true);            // macOS fix: must be opaque to show bg
        btn.setBorderPainted(false);    // remove default border
        btn.setFocusPainted(false);
        btn.setFont(btn.getFont().deriveFont(Font.BOLD, 12f));
        return btn;
    }
}
