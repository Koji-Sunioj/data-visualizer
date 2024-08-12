import moment from "moment";
import { onMount } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { createSignal, createResource, createEffect } from "solid-js";
import { Col, Row, Table, Button, Form, Alert } from "solid-bootstrap";

import { GlobalState } from "..";
import { getContract, getCalendarDays } from "../utils/apis";

export const Calendar = () => {
  const { auth } = GlobalState();
  const { year, month } = useParams();
  const params = useParams();
  const today = moment(new Date(year, month - 1, 1)); //moment().startOf("days");

  const [flow, setFlow] = createSignal("start");
  const [date, setDate] = createSignal(today);
  const [start, setStart] = createSignal(null);
  const [end, setEnd] = createSignal(null);
  const [pushFlag, setPushFlag] = createSignal(false);
  const [formDay, setFormDay] = createSignal(null);
  const [calendarDays, setCalendarDays] = createSignal([]);
  const [contracts] = createResource(auth(), getContract, {
    initialValue: [],
  });

  onMount(() => {
    (async () => {
      if (calendarDays().length === 0) {
        console.log("mounted and fetching");
        const days = await getCalendarDays([
          auth(),
          Number(month),
          Number(year),
        ]);
        setCalendarDays(days);
      }
    })();
  });

  createEffect(() => {
    console.log(start());
    const [uiYear, uiMonth] = [
      Number(date().format("YYYY")),
      Number(date().format("MM")),
    ];
    const [newMonth, newYear] = [Number(params.month), Number(params.year)];

    if (uiYear !== newYear || uiMonth !== newMonth) {
      const newDate = new Date(newYear, newMonth - 1, 1);
      setDate(moment(newDate));
      (async () => {
        console.log("fetching new dates");
        const days = await getCalendarDays([auth(), newMonth, newYear]);
        setCalendarDays(days);
      })();
    }

    if (end() === null) {
      setFlow("start");
    }

    if (pushFlag()) {
      const newStartDate = start().format("YYYY-MM-DD");
      const newEndDate = end().format("YYYY-MM-DD");
      const newStartTime = start().format("HH:mm");
      const newEndTime = end().format("HH:mm");

      let parentIndex = null,
        childIndex = null;
      const calendarDaysClone = JSON.parse(JSON.stringify(calendarDays()));
      [parentIndex, childIndex] = getIndexes(calendarDaysClone, start());

      const employer = document.querySelector("[name='employer']").value;

      if (
        calendarDaysClone[parentIndex][childIndex] !== undefined &&
        newEndDate === newStartDate
      ) {
        calendarDaysClone[parentIndex][childIndex].shifts.push({
          employer: employer,
          start: newStartTime,
          end: newEndTime,
          state: "unsaved",
        });
      } else if (
        calendarDaysClone[parentIndex][childIndex] !== undefined &&
        newEndDate > newStartDate
      ) {
        const endDayOne = start().clone().startOf("day").add(24, "hours");
        const hourDiff = end().clone().diff(endDayOne, "hours");
        const daysForward = Math.ceil(hourDiff / 24);

        calendarDaysClone[parentIndex][childIndex].shifts.push({
          employer: employer,
          start: newStartTime,
          end: start().clone().endOf("day").format("HH:mm"),
          state: "unsaved",
        });

        for (let i = 0; i < daysForward; i++) {
          const dayForward = endDayOne.clone().add(i, "days");
          let endForward = null;
          if (dayForward.format("YYYY-MM-DD") === newEndDate) {
            endForward = newEndTime;
          } else {
            endForward = dayForward.clone().endOf("day").format("HH:mm");
          }

          [parentIndex, childIndex] = getIndexes(calendarDaysClone, dayForward);

          calendarDaysClone[parentIndex][childIndex].shifts.push({
            employer: employer,
            start: dayForward.format("HH:mm"),
            end: endForward,
            state: "unsaved",
          });
        }
      }
      setCalendarDays(calendarDaysClone);
      setPushFlag(false);
    }
  });

  const getIndexes = (calendarDaysClone, targetDate) => {
    let parentIndex = null,
      childIndex = null;

    calendarDaysClone.forEach((shift, index) => {
      const something = shift.findIndex(
        (date) => date.day === targetDate.format("YYYY-MM-DD")
      );
      if (something > -1) {
        [parentIndex, childIndex] = [index, something];
      }
    });

    return [parentIndex, childIndex];
  };

  const shiftForm = (day) => {
    console.log("shift");
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
          setPushFlag(true);
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
        start() !== null && setPushFlag(true);
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
    request.status === 200 && window.location.reload();
  };

  return (
    <>
      <Row>
        <Col>
          <div style={{ display: "flex", "justify-content": "space-between" }}>
            <a
              class="menu-button"
              href={`/calendar/${date().format("YYYY")}/${date()
                .clone()
                .add(-1, "month")
                .format("M")}`}
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
            </a>
            <div>
              <h2 className="text-center">Choose a {flow()} date</h2>
              <p className="text-center">
                period: {date().format("MMMM")} {date().format("YYYY")}
              </p>
            </div>
            <a
              class="menu-button"
              href={`/calendar/${date().format("YYYY")}/${date()
                .clone()
                .add(1, "month")
                .format("M")}`}
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
            </a>
          </div>

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

                      const momentDay = moment(day);

                      const sameMonth = momentDay.month() === date().month();

                      const bg = sameMonth ? "white" : "#d6d6d6";

                      const focusColor =
                        momentDay.format("MMDDYYYY") ===
                        moment().format("MMDDYYYY")
                          ? "blue"
                          : "black";

                      const shiftDisplay =
                        shifts.length === 0 ? 0 : shifts.length > 3 ? 2 : 3;

                      return (
                        <td
                          style={{
                            "background-color": bg,
                          }}
                        >
                          <Button
                            disabled={!sameMonth}
                            variant="outline"
                            class="calendar-button"
                            style={{
                              color: focusColor,
                            }}
                            onClick={() => {
                              shiftForm(momentDay);
                            }}
                          >
                            <div class="calendar-info">
                              <div>{day.substring(8, 10)}</div>
                              <div class={"calendar-shift"}>
                                {shifts.slice(0, shiftDisplay).map((shift) => (
                                  <div
                                    class="shift"
                                    style={{
                                      color:
                                        shift.state === "unsaved"
                                          ? "red"
                                          : "black",
                                    }}
                                  >
                                    <div class="shift-employer">
                                      {shift.employer}
                                    </div>
                                    <div class="shift-times">
                                      {shift.start}-{shift.end}
                                    </div>
                                  </div>
                                ))}

                                {shiftDisplay == 2 && (
                                  <div class="shift-overflow">
                                    +{shifts.length - 2}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Button>
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
        <Col sm={{ span: 6, offset: 3 }}>
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
