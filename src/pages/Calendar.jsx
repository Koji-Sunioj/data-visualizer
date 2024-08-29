import moment from "moment";
import { onMount } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { createSignal, createResource, createEffect } from "solid-js";
import {
  Col,
  Row,
  Table,
  Button,
  Form,
  Alert,
  InputGroup,
  FormControl,
} from "solid-bootstrap";

import { GlobalState } from "../index";
import { getContract, getCalendarDays } from "../utils/apis";

export const Calendar = () => {
  const { auth } = GlobalState();
  const { year, month } = useParams();
  const params = useParams();
  const today = moment(new Date(year, month - 1, 1)); //moment().startOf("days");

  const [date, setDate] = createSignal(today);
  const [end, setEnd] = createSignal(null);
  const [start, setStart] = createSignal(null);
  const [formDay, setFormDay] = createSignal(null);
  const [newShifts, setNewShifts] = createSignal([]);
  const [pushFlag, setPushFlag] = createSignal(false);
  const [endDayOffset, setEndDayOffset] = createSignal(0);
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
    const [uiYear, uiMonth] = [
      Number(date().format("YYYY")),
      Number(date().format("MM")),
    ];
    const [newMonth, newYear] = [Number(params.month), Number(params.year)];

    if (uiYear !== newYear || uiMonth !== newMonth) {
      const newDate = new Date(newYear, newMonth - 1, 1);
      setDate(moment(newDate));
      (async () => {
        console.log("refetching");
        const days = await getCalendarDays([auth(), newMonth, newYear]);
        const [firstDay, lastDay] = [
          days[0][0].day,
          days[days.length - 1][6].day,
        ];

        const areShiftsBetweenNewDates =
          newShifts().length > 0 &&
          newShifts().some(
            (shift) => shift.date >= firstDay && shift.date <= lastDay
          );

        if (areShiftsBetweenNewDates) {
          const newDays = mergeShiftToCalender(days);
          setCalendarDays(newDays);
        } else {
          setCalendarDays(days);
        }
      })();
    }

    if (newShifts().length > 0 && pushFlag()) {
      const calendarDaysClone = JSON.parse(JSON.stringify(calendarDays()));
      const days = mergeShiftToCalender(calendarDaysClone);
      setCalendarDays(days);
      setPushFlag(false);
    }

    if (start() !== null && end() !== null && newShifts().length === 0) {
      console.log("parsing multiple shifts");
      const shifts = [];
      const newStartDate = start().format("YYYY-MM-DD");
      const newEndDate = end().format("YYYY-MM-DD");
      const newStartTime = start().format("HH:mm");
      const newEndTime = end().format("HH:mm");
      const employer = document.querySelector("[name='employer']").value;

      const newShift = {
        employer: employer,
        start: newStartTime,
        end: null,
        state: "unsaved",
        date: newStartDate,
      };

      if (newEndDate === newStartDate) {
        newShift.end = newEndTime;
        shifts.push(newShift);
      } else if (newEndDate > newStartDate) {
        newShift.end = start().clone().endOf("day").format("HH:mm");
        shifts.push(newShift);
        const endDayOne = start().clone().startOf("day").add(24, "hours");
        const minuteDiff = end().clone().diff(endDayOne, "minutes");
        const daysForward = Math.ceil(minuteDiff / 1440);

        for (let i = 0; i < daysForward; i++) {
          const dayForward = endDayOne.clone().add(i, "days");
          let endForward = null;
          if (dayForward.format("YYYY-MM-DD") === newEndDate) {
            endForward = newEndTime;
          } else {
            endForward = dayForward.clone().endOf("day").format("HH:mm");
          }

          shifts.push({
            employer: employer,
            start: dayForward.format("HH:mm"),
            end: endForward,
            state: "unsaved",
            date: dayForward.format("YYYY-MM-DD"),
          });
        }
      }
      setNewShifts(shifts);
      setPushFlag(true);
    }
  });

  const mergeShiftToCalender = (days) => {
    days.forEach((array) => {
      array.forEach((day) => {
        if (day.shifts.length > 0) {
          day.shifts = day.shifts.filter((shift) => shift.state === "saved");
        }
      });
    });

    newShifts().forEach((shift) => {
      const [parentIndex, childIndex] = getIndexes(days, moment(shift.date));

      if (parentIndex !== null && childIndex !== null) {
        const { employer, end, state, start: startTime } = shift;
        days[parentIndex][childIndex].shifts.push({
          employer: employer,
          end: end,
          state: state,
          start: startTime,
        });
      }
    });

    return days;
  };

  const getIndexes = (days, targetDate) => {
    let parentIndex = null,
      childIndex = null;

    days.forEach((shift, index) => {
      const foundIndex = shift.findIndex(
        (date) => date.day === targetDate.format("YYYY-MM-DD")
      );
      if (foundIndex > -1) {
        [parentIndex, childIndex] = [index, foundIndex];
      }
    });

    return [parentIndex, childIndex];
  };

  const checkAvailability = async (startDate, endDate) => {
    const tzFormat = "YYYY-MM-DD HH:mm:ssZ";
    const [uriStart, uriEnd] = [
      encodeURIComponent(startDate.format(tzFormat).substring(0, 22)),
      encodeURIComponent(endDate.format(tzFormat).substring(0, 22)),
    ];
    const uri = `http://localhost:8000/shifts/availability?start=${uriStart}&end=${uriEnd}`;

    const request = await fetch(uri, {
      method: "GET",
      headers: { Authorization: `Bearer ${auth()}` },
    });
    return await request.json();
  };

  const setShiftRange = async (day) => {
    if (start() !== null) {
      const newStart = day.clone().add(start().hours(), "hours");
      const days = newStart.diff(start(), "days");
      setStart(newStart);
      if (end() !== null) {
        const newEnd = end().clone().add(days, "day");
        setEnd(newEnd);
        const { shifts } = await checkAvailability(newStart, newEnd);
        console.log(shifts);
      }
    }
    setFormDay(day);
    newShifts().length > 0 && setNewShifts([]);
  };

  const setShiftRangeFromTime = (id, futureValue) => {
    const [hours, minutes] = futureValue.split(":");
    const newDate = formDay().clone().set({ hour: hours, minute: minutes });

    switch (id) {
      case "start-time-input":
        if (end() !== null) {
          const correctEnd = formDay()
            .clone()
            .set({ hour: end().hours(), minute: end().minutes() })
            .add(endDayOffset(), "days");

          correctEnd.diff(newDate, "minutes") <= 1440 &&
            correctEnd.add(1, "days");
          setEnd(correctEnd);
        }
        setStart(newDate);
        break;
      case "end-time-input":
        const addedDay =
          newDate.diff(start(), "minutes") <= 0
            ? 1 + endDayOffset()
            : endDayOffset();

        newDate.add(addedDay, "days");
        setEnd(newDate);
        break;
    }
  };

  const colonPattern = /^(0[0-9]|1[0-9]|2[0-3])$/;
  const finalPattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  const timePattern = /^(0[0-9]?|1[0-9]?|2[0-3]?)?(:[0-5][0-9]?)?$/;

  const parseTime = (event) => {
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
        const isInvalid = !timePattern.test(futureValue);
        if (isInvalid) {
          event.preventDefault();
        } else if (finalPattern.test(futureValue)) {
          setShiftRangeFromTime(event.target.id, futureValue);
        }
        break;
      default:
        event.preventDefault();
    }
  };

  const deMergeShifts = (shifts) => {
    shifts.forEach((rows) => {
      rows.forEach((day) => {
        day.shifts = day.shifts.filter((shift) => shift.state !== "unsaved");
      });
    });
    return shifts;
  };

  const validatePattern = (event) => {
    const { inputType } = event;
    const id = event.target.id;
    const unfitsPattern = !finalPattern.test(event.target.value);
    const validStart = start() !== null;
    const validEnd = end() !== null;

    switch (id) {
      case "start-time-input":
        console.log("validating start pattern");
        unfitsPattern && validStart && setStart(null);
        break;
      case "end-time-input":
        unfitsPattern && validEnd && setEnd(null);
        break;
    }

    if (
      (unfitsPattern && validEnd && newShifts().length > 0) ||
      (unfitsPattern && validStart && newShifts().length > 0)
    ) {
      const calendarDaysClone = JSON.parse(JSON.stringify(calendarDays()));
      const filteredDates = deMergeShifts(calendarDaysClone);
      setCalendarDays(filteredDates);
      setNewShifts([]);
    }

    if (colonPattern.test(event.target.value) && inputType === "insertText") {
      document.getElementById(id).value += ":";
    }
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

  const parseOffset = (offset) => {
    const newEnd = end().clone().add(offset, "days");
    setEndDayOffset(endDayOffset() + offset);
    setEnd(newEnd);
    newShifts().length > 0 && setNewShifts([]);
  };

  const showRange = () => {
    if (newShifts().length > 1) {
      const firstDate = moment(newShifts()[0].date);
      const secondDate = moment(newShifts()[newShifts().length - 1].date);
      const lastRange =
        firstDate.month() === secondDate.month() ? "DD" : "MMMM DD";
      return `shift range: ${firstDate.format("MMMM DD")} - ${secondDate.format(
        lastRange
      )}`;
    } else {
      return `shift date: ${formDay().format("MMMM DD")}`;
    }
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
              <h2 className="text-center">Choose a date</h2>
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
                      const momentDayString = momentDay.format("MMDDYYYY");

                      let focusThisDay = false;

                      const hasShifts = shifts.some(
                        (shift) => shift.state === "unsaved"
                      );

                      if (
                        (formDay() !== null &&
                          formDay().format("MMDDYYYY") === momentDayString) ||
                        hasShifts
                      ) {
                        focusThisDay = true;
                      }

                      const focusToday =
                        momentDayString === moment().format("MMDDYYYY")
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
                              color: focusToday,
                              "background-color": focusThisDay
                                ? "#F0F8FF"
                                : "white",
                            }}
                            onClick={() => {
                              setShiftRange(momentDay);
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
              <h3 className="text-center mb-3 mt-3">{showRange()}</h3>
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
                        onKeyDown={parseTime}
                        onInput={validatePattern}
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
                        onKeyDown={parseTime}
                        onInput={validatePattern}
                        inputmode="numeric"
                        id="end-time-input"
                        placeholder={
                          start() !== null
                            ? start().clone().add(8, "hours").format("HH:mm")
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
                        Add days to end
                      </Form.Label>
                      <InputGroup>
                        <Button
                          onClick={() => {
                            parseOffset(-1);
                          }}
                          style={{ width: "25%" }}
                          variant="danger"
                          disabled={
                            endDayOffset() === 0 || newShifts().length === 0
                          }
                        >
                          -
                        </Button>
                        <FormControl
                          disabled
                          value={endDayOffset()}
                          style={{ "text-align": "center" }}
                        />
                        <Button
                          onClick={() => {
                            parseOffset(1);
                          }}
                          style={{ width: "25%" }}
                          variant="warning"
                          disabled={
                            endDayOffset() === 5 || newShifts().length === 0
                          }
                        >
                          +
                        </Button>
                      </InputGroup>
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
