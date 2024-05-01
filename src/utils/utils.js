export const getDays = (today) => {
  const calendar = [];

  const normalized = today.clone().startOf("month");
  const dayOfWeek = normalized.day();
  const calendarStartDay = today
    .clone()
    .startOf("month")
    .subtract(dayOfWeek, "days");

  const endOfMonth = today.clone().endOf("month");
  const daysFromStartToEnd = calendarStartDay.diff(endOfMonth, "days") * -1 + 1;

  const calendarRuns = Math.ceil(daysFromStartToEnd / 7) * 7;

  for (let i = 0; i <= calendarRuns - 1; i++) {
    const day = calendarStartDay.clone().add(i, "days");
    const cDay = day.date();

    calendar.push({ cDay: cDay, day: day });
  }

  return calendar;
};
