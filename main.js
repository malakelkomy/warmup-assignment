const fs = require("fs");
// helper methods
function parseTimeToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0; 
  
  const lower = timeStr.trim().toLowerCase();
  const isPM = lower.includes("pm");
  
  const match = lower.match(/(\d+):(\d+):(\d+)/);
  if (!match) return 0;

  let h = parseInt(match[1]);
  let m = parseInt(match[2]);
  let s = parseInt(match[3]);

  if (isPM && h !== 12) h += 12;
  if (!isPM && h === 12) h = 0;

  return h * 3600 + m * 60 + s;
}

function parseDurationToSeconds(durStr) {
  
  if (!durStr || typeof durStr !== 'string' || !durStr.includes(":")) return 0;
  
  const parts = durStr.trim().split(":").map(Number);
  
  
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;
  
  return h * 3600 + m * 60 + s;
}

function secondsToDuration(totalSeconds) {
  totalSeconds = Math.abs(Math.round(totalSeconds));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function secondsToLongDuration(totalSeconds) {
  return secondsToDuration(totalSeconds); 
}

function readLines(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  return content.split(/\r?\n/).filter((l) => l.trim() !== "");
}

function parseShiftLine(line) {
  const parts = line.split(",");
  if (parts.length < 10) return null;
  return {
    driverID: (parts[0] || "").trim(),
    driverName: (parts[1] || "").trim(),
    date: (parts[2] || "").trim(),
    startTime: (parts[3] || "").trim(),
    endTime: (parts[4] || "").trim(),
    shiftDuration: (parts[5] || "").trim(),
    idleTime: (parts[6] || "").trim(),
    activeTime: (parts[7] || "").trim(),
    metQuota: (parts[8] || "").trim().toLowerCase() === "true",
    hasBonus: (parts[9] || "").trim().toLowerCase() === "true",
  };
}

function shiftToLine(obj) {
  return [
    obj.driverID,
    obj.driverName,
    obj.date,
    obj.startTime,
    obj.endTime,
    obj.shiftDuration,
    obj.idleTime,
    obj.activeTime,
    obj.metQuota,
    obj.hasBonus,
  ].join(",");
}

function parseRateLine(line) {
  const parts = line.split(",");
  return {
    driverID: parts[0].trim(),
    dayOff: parts[1].trim(),
    basePay: parseInt(parts[2].trim()),
    tier: parseInt(parts[3].trim()),
  };
}

function getDriverRate(rateFile, driverID) {
  const lines = readLines(rateFile);
  for (const line of lines) {
    const rate = parseRateLine(line);
    if (rate.driverID === driverID) return rate;
  }
  return null;
}

function getDayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
}


function isEidPeriod(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return y === 2025 && m === 4 && d >= 10 && d <= 30;
}

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
  const startSec = parseTimeToSeconds(startTime);
  const endSec = parseTimeToSeconds(endTime);
  const diff = endSec - startSec;
  return secondsToDuration(diff);
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
  const startSec = parseTimeToSeconds(startTime);
  const endSec = parseTimeToSeconds(endTime);
 
  const deliveryStart = 8 * 3600;   
  const deliveryEnd = 22 * 3600;    
 
  let idleSec = 0;
 
  if (startSec < deliveryStart) {
    const earlyEnd = Math.min(endSec, deliveryStart);
    idleSec += earlyEnd - startSec;
  }
 
  if (endSec > deliveryEnd) {
    const lateStart = Math.max(startSec, deliveryEnd);
    idleSec += endSec - lateStart;
  }
 
  return secondsToDuration(idleSec);
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
  const shiftSec = parseDurationToSeconds(shiftDuration);
  const idleSec = parseDurationToSeconds(idleTime);
  return secondsToDuration(shiftSec - idleSec);
}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
  const activeSec = parseDurationToSeconds(activeTime);
  const quotaSec = isEidPeriod(date) ? 6 * 3600 : 8 * 3600 + 24 * 60; 
  return activeSec >= quotaSec;
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    // TODO: Implement this function
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    // TODO: Implement this function
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    // TODO: Implement this function
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
