import moment from "moment";
import { createSignal, createResource, createEffect } from "solid-js";
import { Col, Row, Table, Button, Form } from "solid-bootstrap";

import { GlobalState } from "..";
import { getDays } from "../utils/utils";
import { getContract } from "../utils/apis";

export const Calendar = () => {
  const { auth } = GlobalState();
  const today = moment().startOf("days");
  const [date, setDate] = createSignal(today);
  const [formDay, setFormDay] = createSignal(null);
  const [contracts] = createResource(auth(), getContract, {
    initialValue: [],
  });
  const [calendarDays, setCalendarDays] = createSignal(getDays(today) || []);

  createEffect(() => {
    console.log(contracts());
  });

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

  const shiftForm = (day) => {
    setFormDay(day);
    console.log(day.toISOString());
  };

  const checkTime = (event) => {
    console.log(event);

    const twoPatterh =
      /^[2]$|^[2][0-3]$|^[2][0-3][\:]$|^[2][0-3][\:][0-5]$|^[2][0-3][\:][0-5][0-9]$/;

    const tenPattern =
      /^[01]$|^[01][0-9]$|^[01][0-9][\:]$|^[01][0-9][\:][0-5]$|^[01][0-9][\:][0-5][0-9]$/;

    const onePattern =
      /^[0-9]$|^[0-9][\:]$|^[0-9][\:][0-5]$|^[0-9][\:][0-5][0-9]$/;

    switch (event.key) {
      case "Backspace":
      case "Delete":
      case "Enter":
      case "ArrowRight":
      case "ArrowLeft":
        break;
      default:
        if (!isNaN(event.key) || event.key === ":") {
          const futureValue = event.target.value + event.key;
          const isInvalid = [onePattern, twoPatterh, tenPattern].every(
            (pattern) => !pattern.test(futureValue)
          );
          /* const timeInput = document.getElementById("time-input");
          if (futureValue.length == 2) {
            alert("asds");
            timeInput.dispatchEvent(new KeyboardEvent("keydown", { key: ":" }));
          } */

          if (isInvalid) {
            event.preventDefault();
          }
        } else {
          event.preventDefault();
        }
    }
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

                          const focusColor =
                            day.day.format("MMDDYYYY") ===
                            moment().format("MMDDYYYY")
                              ? "blue"
                              : "black";

                          return (
                            <td style={{ "background-color": bg }}>
                              <Button
                                variant="outline"
                                style={{ color: focusColor }}
                                onClick={() => {
                                  shiftForm(day.day);
                                }}
                              >
                                {day.cDay}
                              </Button>
                            </td>
                          );
                        })}
                    </tr>
                  ))}
            </tbody>
          </Table>
        </Col>
      </Row>
      <Row>
        <Col md={{ span: 6, offset: 3 }}>
          {formDay() !== null && (
            <Form>
              <Form.Group class="mb-3" controlId="formBasicEmail">
                <Form.Label>Start</Form.Label>
                <Form.Control
                  type="text"
                  inputmode="numeric"
                  onKeyDown={checkTime}
                  id="time-input"
                  placeholder="08:00"
                />
              </Form.Group>
              <Form.Group class="mb-3" controlId="formBasicPassword">
                <Form.Label>End</Form.Label>
                <Form.Control type="datetime-local" value={"08:00"} />
              </Form.Group>
              <Button variant="primary" type="submit">
                Submit
              </Button>
            </Form>
          )}
        </Col>
      </Row>
    </>
  );
};
