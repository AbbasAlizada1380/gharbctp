import express from "express";
import {
  createAttendance,
  getAttendances,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
} from "../Controllers/AttendenceController.js";

const AttendenceRoute = express.Router();

AttendenceRoute.post("/", createAttendance);
AttendenceRoute.get("/", getAttendances);
AttendenceRoute.get("/:id", getAttendanceById);
AttendenceRoute.put("/:id", updateAttendance);
AttendenceRoute.delete("/:id", deleteAttendance);

export default AttendenceRoute;
