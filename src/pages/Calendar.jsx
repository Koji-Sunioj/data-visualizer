import moment from "moment";
import { createSignal, createResource, createEffect } from "solid-js";
import { Col, Row, Table, Button, Form, Alert } from "solid-bootstrap";

import { GlobalState } from "..";
import { getContract, getCalendarDays } from "../utils/apis";

export const Calendar = () => {
  const { auth } = GlobalState();
  const today = moment().startOf("days");
  const [flow, setFlow] = createSignal("start");
  const [date, setDate] = createSignal(today);
  const [start, setStart] = createSignal(null);
  const [end, setEnd] = createSignal(null);
  const [formDay, setFormDay] = createSignal(null);
  const [calendarParams, setCalendarParams] = createSignal([
    auth(),
    date().month() + 1,
    date().year(),
  ]);

  const [contracts] = createResource(auth(), getContract, {
    initialValue: [],
  });
  const [calendarDays] = createResource(calendarParams, getCalendarDays, {
    initialValue: [],
  });

  createEffect(() => {
    console.log(calendarDays());
    const [, month, year] = calendarParams();
    const newDate = new Date(year, month - 1, 1);
    if (calendarDays().length > 0 && calendarDays.state === "ready") {
      setDate(moment(newDate));
    }
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
    setCalendarParams([auth(), newDate.month() + 1, newDate.year()]);
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
          if (end() !== null) {
            const hourDiff = end().diff(start(), "hours");
            if (hourDiff <= 0) {
              const newEnd = end()
                .clone()
                .add(Math.ceil((hourDiff * -1) / 24), "days");
              setEnd(newEnd);
            }
          }
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

  const colonPattern = /^[01][0-9]$|^[2][0-3]$/;

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
    const { inputType } = event;
    const id = event.target.id;
    const unfitsPattern = !finalPattern.test(event.target.value);

    switch (id) {
      case "start-time-input":
        unfitsPattern && start() !== null && setStart(null);
        break;
      case "end-time-input":
        unfitsPattern && end() !== null && setEnd(null);
        break;
    }

    if (colonPattern.test(event.target.value) && inputType === "insertText") {
      document.getElementById(id).value += ":";
    }
  };

  const chooseFlow = (event) => {
    const nextFlow = event.target.checked ? "end" : "start";
    setFlow(nextFlow);
  };

  const sendShift = async (event) => {
    event.preventDefault();
    const {
      target: {
        employer: { value: employer },
      },
    } = event;

    const { contract_id } = contracts().find(
      (contract) => contract.employer === employer
    );

    const tzFormat = "YYYY-MM-DD HH:mm:ssZ";
    const payload = {
      contract_id: contract_id,
      start_time: start().format(tzFormat).substring(0, 22),
      end_time: end().format(tzFormat).substring(0, 22),
    };

    const request = await fetch("http://localhost:8000/shifts/", {
      method: "POST",
      headers: { Authorization: `Bearer ${auth()}` },
      body: JSON.stringify(payload),
    });

    alert(request.status);
  };

  return (
    <>
      <Row>
        <Col md={{ span: 6, offset: 3 }}>
          <div style={{ display: "flex", "justify-content": "space-between" }}>
            <button
              disabled={calendarDays.loading}
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
              disabled={calendarDays.loading}
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
          {/*  {calendarDays.loading && <TableSkeleton />} */}

          {calendarDays().length > 0 && (
            <Table bordered variant="light" responsive className="mb-6">
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
                {calendarDays().map((list, i) => (
                  <tr>
                    {list.map((record) => {
                      const { day, shifts } = record;
                      console.log(shifts);
                      const momentDay = moment(day);

                      const bg =
                        momentDay.month() === date().month()
                          ? "white"
                          : "#d6d6d6";

                      const focusColor =
                        momentDay.format("MMDDYYYY") ===
                        moment().format("MMDDYYYY")
                          ? "blue"
                          : "black";

                      return (
                        <td style={{ "background-color": bg }}>
                          <Button
                            variant="outline"
                            style={{ color: focusColor }}
                            onClick={() => {
                              shiftForm(momentDay);
                            }}
                          >
                            {day.substring(8, 10)}
                          </Button>
                          {shifts.length > 0 &&
                            shifts.map((shift) => (
                              <p style={{ "font-weight": "2px" }}>
                                {shift.start}-{shift.end}
                              </p>
                            ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Col>
      </Row>
      <Row>
        <Col md={{ span: 6, offset: 3 }}>
          {formDay() !== null && (
            <>
              <h3 className="text-center mb-3 mt-3">
                shift date: {formDay().format("MMMM DD")}
              </h3>
              <Form class="mb-3" onSubmit={sendShift}>
                <Row>
                  <Col md={12}>
                    <Form.Group class="mb-3">
                      <Form.Label>Employer</Form.Label>
                      <Form.Select
                        aria-label="Default select example"
                        name="employer"
                      >
                        {contracts().map((contract) => (
                          <option value={contract.employer}>
                            {contract.employer} - {contract.hourly}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group class="mb-3">
                      <Form.Label>Start</Form.Label>
                      <Form.Control
                        type="text"
                        inputmode="numeric"
                        onKeyDown={checkTime}
                        onInput={checkSomething}
                        id="start-time-input"
                        placeholder="08:00"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group class="mb-3">
                      <Form.Label>End</Form.Label>
                      <Form.Control
                        type="text"
                        disabled={start() === null}
                        onKeyDown={checkTime}
                        onInput={checkSomething}
                        inputmode="numeric"
                        id="end-time-input"
                        placeholder={
                          start() !== null
                            ? start().clone().add("8", "hours").format("HH:mm")
                            : "16:00"
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group class="mb-3">
                      <Form.Label
                        style={{
                          overflow: "clip",
                          "text-overflow": "ellipsis",
                        }}
                      >
                        Select end date
                      </Form.Label>
                      <Form.Check
                        disabled={end() === null}
                        type="switch"
                        id="custom-switch"
                        onChange={chooseFlow}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {start() !== null && end() !== null && (
                  <Row>
                    <Col>
                      <Button variant="primary" type="submit" class="mb-3">
                        Submit
                      </Button>
                      <Alert variant="warning">
                        shift is between {start().format("YYYY-MM-DD HH:mm")}{" "}
                        and {end().format("YYYY-MM-DD HH:mm")}
                      </Alert>
                    </Col>
                  </Row>
                )}
              </Form>
            </>
          )}
        </Col>
      </Row>
    </>
  );
};
