import { Col, Row, Form, Button, Alert } from "solid-bootstrap";

import { createSignal, createResource } from "solid-js";
import { GlobalState } from "..";

export const Contracts = () => {
  const { auth } = GlobalState();
  const url = "http://localhost:8000/contracts";

  const getContract = async (token) => {
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}s` },
    });
    const { employer, per_hour } = await response.json();
    const contract = { employer: employer || "", per_hour: per_hour || "" };
    return contract;
  };

  const [notify, setNotify] = createSignal({
    trigger: false,
    message: "",
    variant: "",
  });
  const [initContract] = createResource(auth(), getContract);
  const [show, setSHow] = createSignal(initContract());

  const saveContract = async (event) => {
    event.preventDefault();
    const {
      target: {
        employer: { value: employer },
        rate: { value: rate },
      },
    } = event;

    let variant = "danger",
      message = "";

    if (!isNaN(rate) && employer.length <= 30) {
      const request = await fetch(url, {
        method: "POST",
        body: JSON.stringify({ employer: employer, rate: rate }),
        headers: { Authorization: `Bearer ${auth()}` },
      });

      const status = request.status;
      const { detail } = await request.json();
      message = detail;
      variant = status === 200 ? "success" : variant;
      status === 200 &&
        setTimeout(() => {
          window.location.reload();
        }, 2000);
    } else {
      message =
        "name of employer must be 30 characters or less, and rate must be numeric";
    }

    setNotify({ trigger: true, message: message, variant: variant });
  };

  return (
    <Row>
      <Col md={{ span: 6, offset: 3 }} onSubmit={saveContract}>
        <h2 className="text-center">Manage your contracts here</h2>

        <Form>
          <fieldset disabled={!show()}>
            <Form.Group class="mb-3">
              <Form.Label>Employer name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter name of your employer"
                name="employer"
                maxLength={30}
                value={initContract() ? initContract().employer : ""}
              />
            </Form.Group>
            <Form.Group class="mb-3">
              <Form.Label>Hourly rate</Form.Label>
              <Form.Control
                type="number"
                step=".01"
                placeholder="12.01"
                name="rate"
                value={initContract() ? initContract().per_hour : ""}
              />
            </Form.Group>
          </fieldset>
          <Form.Group class="mb-3" controlId="formBasicCheckbox">
            <Form.Check
              type="checkbox"
              label="Edit"
              disabled={!initContract()}
              onChange={(e) => {
                setSHow(e.target.checked);
              }}
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
        {notify().trigger && (
          <Alert variant={notify().variant} class="mt-3">
            {notify().message}
          </Alert>
        )}
      </Col>
    </Row>
  );
};
