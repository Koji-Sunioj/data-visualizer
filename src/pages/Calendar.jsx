import moment from "moment";
import { createSignal, createResource, createEffect } from "solid-js";
import { Col, Row, Table, Button, Form, Alert } from "solid-bootstrap";

import { GlobalState } from "..";
import { getDays } from "../utils/utils";
import { getContract } from "../utils/apis";

export const Calendar = () => {
  const { auth } = GlobalState();
  const today = moment().startOf("days");
  const [flow, setFlow] = createSignal("start");
  const [date, setDate] = createSignal(today);
  const [start, setStart] = createSignal(null);
  const [end, setEnd] = createSignal(null);
  const [formDay, setFormDay] = createSignal(null);
  const [contracts] = createResource(auth(), getContract, {
    initialValue: [],
  });
  const [calendarDays, setCalendarDays] = createSignal(getDays(today) || []);

  createEffect(() => {
    if (end() === null) {
      setFlow("start");
    }
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
    switch (flow()) {
      case "start":
        setFormDay(day);
        if (start() !== null) {
          const changedDate = formDay().clone().add(start().hours(), "hours");
          const days = changedDate.diff(start(), "days");
          const newStart = start().clone().add(days, "day");
          setStart(newStart);
          end() !== null && setEnd(end().clone().add(days, "day"));
        }
        break;
      case "end":
        if (end() !== null) {
          const changedDate = day.clone().add(end().hours(), "hours");
          setEnd(changedDate);
          const hourDiff = changedDate.diff(start(), "hours");
          if (hourDiff <= 0) {
            const newStart = start()
              .clone()
              .subtract(Math.ceil((hourDiff * -1) / 24), "days");
            setStart(newStart);
            setFormDay(newStart.clone().startOf("day"));
          }
        }
        break;
    }
  };

  const twoPatterh =
    /^[2]$|^[2][0-3]$|^[2][0-3][\:]$|^[2][0-3][\:][0-5]$|^[2][0-3][\:][0-5][0-9]$/;

  const tenPattern =
    /^[01]$|^[01][0-9]$|^[01][0-9][\:]$|^[01][0-9][\:][0-5]$|^[01][0-9][\:][0-5][0-9]$/;

  const onePattern =
    /^[0-9]$|^[0-9][\:]$|^[0-9][\:][0-5]$|^[0-9][\:][0-5][0-9]$/;

  const finalPattern =
    /^[2][0-3][\:][0-5][0-9]$|^[01][0-9][\:][0-5][0-9]$|^[0-9][\:][0-5][0-9]$/;

  const setTime = (id, futureValue) => {
    const addZero = futureValue.length === 4 ? "0" : "";
    const newDate = moment(
      `${formDay().format("YYYY-MM-DD")}T${addZero}${futureValue}`
    );
    switch (id) {
      case "start-time-input":
        setStart(newDate);
        break;
      case "end-time-input":
        const hourDiff = newDate.diff(start(), "hours");
        hourDiff <= 0 && newDate.add(1, "days");
        setEnd(newDate);
        document.getElementById("end-time-input").focus();
        break;
    }
  };

  const checkTime = (event) => {
    const key = !isNaN(event.key) ? "number" : event.key;

    switch (key) {
      case "Backspace":
      case "Delete":
      case "Enter":
      case "ArrowRight":
      case "ArrowLeft":
      case ":":
      case "Tab":
        break;
      case "number":
        const futureValue = event.target.value + event.key;
        const isInvalid = [onePattern, twoPatterh, tenPattern].every(
          (pattern) => !pattern.test(futureValue)
        );
        if (isInvalid) {
          event.preventDefault();
        } else if (finalPattern.test(futureValue)) {
          setTime(event.target.id, futureValue);
        }
        break;
      default:
        event.preventDefault();
    }
  };

  const checkSomething = (event) => {
    const id = event.target.id;
    const fitsPattern = !finalPattern.test(event.target.value);
    const booleanPointer = {
      "start-time-input": fitsPattern && start() !== null,
      "end-time-input": fitsPattern && end() !== null,
    };

    const idWAction = booleanPointer[id] ? id + " set" : id;

    switch (idWAction) {
      case "start-time-input set":
        setStart(null);
        break;
      case "end-time-input set":
        setEnd(null);
        break;
    }
  };

  const chooseFlow = (event) => {
    switch (event.target.id) {
      case "start-time-input":
        setFlow("start");
        break;
      case "end-time-input":
        setFlow("end");
        break;
    }
    console.log(event.target.id);
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
              <h2 className="text-center">Choose a {flow()} date</h2>
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
            <>
              <h3 className="text-center mb-3">
                shift date: {formDay().format("MMMM DD")}
              </h3>
              <Form class="mb-3">
                <Row>
                  <Col span={6}>
                    <Form.Group class="mb-3" as={Col}>
                      <Form.Label>Start</Form.Label>
                      <Form.Control
                        type="text"
                        inputmode="numeric"
                        onKeyDown={checkTime}
                        onInput={checkSomething}
                        id="start-time-input"
                        placeholder="08:00"
                        onFocus={chooseFlow}
                      />
                    </Form.Group>
                  </Col>
                  <Col span={6}>
                    {start() !== null && (
                      <Form.Group class="mb-3" as={Col}>
                        <Form.Label>End</Form.Label>
                        <Form.Control
                          type="text"
                          onKeyDown={checkTime}
                          onInput={checkSomething}
                          inputmode="numeric"
                          id="end-time-input"
                          placeholder={start()
                            .clone()
                            .add("8", "hours")
                            .format("HH:mm")}
                          onFocus={chooseFlow}
                        />
                      </Form.Group>
                    )}
                  </Col>
                </Row>
                {start() !== null && end() !== null && (
                  <>
                    <Form.Group class="mb-3">
                      <Form.Label>Employer</Form.Label>
                      <Form.Select aria-label="Default select example">
                        {contracts().map((contract) => (
                          <option value={contract.employer}>
                            {contract.employer} - {contract.hourly}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Button variant="primary" type="submit" class="mb-3">
                      Submit
                    </Button>
                    <Alert variant="info">
                      shift is between {start().format("YYYY-MM-DD HH:mm")} and{" "}
                      {end().format("YYYY-MM-DD HH:mm")}
                    </Alert>
                  </>
                )}
              </Form>
            </>
          )}
        </Col>
      </Row>
    </>
  );
};
