const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const colomboParts = (now) => {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Colombo",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map(({ type, value }) => [type, value]),
  );
  return {
    day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      values.weekday,
    ),
    minutes: Number(values.hour) * 60 + Number(values.minute),
  };
};

export function classAvailability(classItem, now = new Date()) {
  if (classItem.active_session_id)
    return { state: "active", label: "Active session" };
  const current = colomboParts(now);
  const [startHour, startMinute] = String(classItem.start_time)
    .split(":")
    .map(Number);
  const [endHour, endMinute] = String(classItem.end_time)
    .split(":")
    .map(Number);
  const opens = startHour * 60 + startMinute - 30;
  const closes = endHour * 60 + endMinute;
  if (
    current.day === Number(classItem.day) &&
    current.minutes >= opens &&
    current.minutes <= closes
  ) {
    return { state: "available", label: "Available now" };
  }
  if (current.day === Number(classItem.day) && current.minutes > closes)
    return { state: "ended", label: "Today’s session ended" };
  return {
    state: "upcoming",
    label: `Available ${days[classItem.day]} at ${String(classItem.start_time).slice(0, 5)}`,
  };
}

export function normalizeSriLankanPhone(value) {
  let digits = String(value || "")
    .trim()
    .replace(/[\s()-]/g, "");
  if (digits.startsWith("+94")) digits = digits.slice(3);
  else if (digits.startsWith("94")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  if (!/^7\d{8}$/.test(digits))
    throw new Error("Enter a valid Sri Lankan mobile number.");
  return `+94${digits}`;
}
