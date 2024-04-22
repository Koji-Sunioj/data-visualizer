import { createSignal } from "solid-js";
import { Col, Row, Table, Button } from "solid-bootstrap";
import moment from "moment";

export const Calendar = () => {
  const today = moment().startOf("days");

  const getDays = (today) => {
    const calendar = [];

    const normalized = today.clone().startOf("month");
    const dayOfWeek = normalized.day();
    const calendarStartDay = today
      .clone()
      .startOf("month")
      .subtract(dayOfWeek, "days");

    const endOfMonth = today.clone().endOf("month");
    const daysFromStartToEnd =
      calendarStartDay.diff(endOfMonth, "days") * -1 + 1;

    const calendarRuns = Math.ceil(daysFromStartToEnd / 7) * 7;

    for (let i = 0; i <= calendarRuns - 1; i++) {
      const day = calendarStartDay.clone().add(i, "days");
      const cDay = day.date();

      calendar.push({ cDay: cDay, day: day });
    }

    return calendar;
  };

  const [date, setDate] = createSignal(today);
  const [calendarDays, setCalendarDays] = createSignal(getDays(today) || []);

  const shiftCalender = (position) => {
    const newDate = date()
      .clone()
      .startOf("month")
      .startOf("days")
      .add(position, "months");

    const newCalendar = getDays(newDate);

    setDate(newDate);
    setCalendarDays(newCalendar);
  };

  return (
    <>
      <Row>
        <Col md={{ span: 6, offset: 3 }}>
          <div style={{ display: "flex", "justify-content": "space-between" }}>
            <button
              class="menu-button"
              onClick={() => {
                shiftCalender(-1);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                fill="currentColor"
                class="bi bi-arrow-left"
                viewBox="0 0 16 16"
              >
                <path
                  fill-rule="evenodd"
                  d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"
                ></path>
              </svg>
            </button>
            <div>
              <h2 className="text-center">Calendar</h2>
              <p className="text-center">
                period: {date().format("MMMM")} {date().format("YYYY")}
              </p>
            </div>
            <button
              class="menu-button"
              onClick={() => {
                shiftCalender(1);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                fill="currentColor"
                class="bi bi-arrow-right"
                viewBox="0 0 16 16"
              >
                <path
                  fill-rule="evenodd"
                  d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"
                ></path>
              </svg>
            </button>
          </div>
          <Table bordered variant="light" responsive>
            <thead>
              <tr>
                <th>Sun</th>
                <th>Mon</th>
                <th>Tue</th>
                <th>Wed</th>
                <th>Thu</th>
                <th>Fri</th>
                <th>Sat</th>
              </tr>
            </thead>
            <tbody>
              {calendarDays().length > 0 &&
                Array(calendarDays().length / 7)
                  .fill()
                  .map((value, i) => (
                    <tr>
                      {calendarDays()
                        .slice(i * 7, i * 7 + 7)
                        .map((day) => {
                          const bg =
                            day.day.month() === date().month()
                              ? "white"
                              : "#d6d6d6";

                          const hRefColor =
                            day.day.format("MMDDYYYY") ===
                            moment().format("MMDDYYYY")
                              ? "blue"
                              : "black";

                          const hRef = `/calendar/${day.day.format(
                            "MM-DD-YYYY"
                          )}`;

                          return (
                            <td style={{ "background-color": bg }}>
                              <a
                                href={hRef}
                                style={{
                                  color: hRefColor,
                                  "text-decoration": "none",
                                }}
                              >
                                {day.cDay}
                              </a>
                            </td>
                          );
                        })}
                    </tr>
                  ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </>
  );
};
