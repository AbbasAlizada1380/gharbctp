import Attendance from "../Models/Attendence.js";
import Staff from "../Models/staff/staff.js"

const calculateAmounts = (attendance, dailySalary, overTimePerHour,workingDaysPerWeek) => {
  let attendanceDays = 0;
  let overtimeHours = 0;

  Object.values(attendance).forEach(day => {
    if (day.attendance) attendanceDays++;
    overtimeHours += Number(day.overtime || 0);
  });

  const salary = attendanceDays * (dailySalary/workingDaysPerWeek);
  const overtime = overtimeHours * overTimePerHour;
  const total = salary + overtime;

  return { salary, overtime, total };
};

export const createAttendance = async (req, res) => {
  try {
    const { staffId, attendance } = req.body;

    const staff = await Staff.findByPk(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const { salary, overtime, total } = calculateAmounts(
      attendance,
      staff.salary,
      staff.overTimePerHour,
      staff.workingDaysPerWeek
    );

    const record = await Attendance.create({
      staffId,
      attendance,
      salary,
      overtime,
      total,
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getAttendances = async (req, res) => {
  try {
    const data = await Attendance.findAll({
      include: {
        model: Staff,
        attributes: ["id", "name"],
      },
      order: [["id", "DESC"]],
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getAttendanceById = async (req, res) => {
  try {
    const record = await Attendance.findByPk(req.params.id, {
      include: Staff,
    });

    if (!record) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const updateAttendance = async (req, res) => {
  try {
    const { attendance } = req.body;

    const record = await Attendance.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    const staff = await Staff.findByPk(record.staffId);

    const { salary, overtime, total } = calculateAmounts(
      attendance,
      staff.salary,
      staff.overTimePerHour,
      staff.workingDaysPerWeek
    );

    await record.update({
      attendance,
      salary,
      overtime,
      total,
    });

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByPk(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    await record.destroy();
    res.json({ message: "Attendance deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};