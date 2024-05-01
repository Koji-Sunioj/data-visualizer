import { GlobalState } from "..";
import { createSignal, createResource } from "solid-js";
import { Col, Row, Form, Button, Alert, Card } from "solid-bootstrap";

import TimePicker from "react-time-picker";
import { getContract } from "../utils/apis";

export const Contracts = () => {
  const url = "http://localhost:8000/contracts/";

  const { auth } = GlobalState();
  const [notify, setNotify] = createSignal({
    trigger: false,
    message: "",
    variant: "",
  });
  const [time, setTime] = createSignal("08:00");
  const [contract, setContract] = createSignal(null);
  const [contracts] = createResource(auth(), getContract, {
    initialValue: [],
  });

  const editContract = (contract_id) => {
    const shouldUnEdit =
      contract() !== null && contract_id === contract().contract_id;

    if (shouldUnEdit) {
      setContract(null);
    } else {
      window.scrollTo(0, 0);
      const targetContract = contracts().find(
        (contract) => contract.contract_id === contract_id
      );
      setContract(targetContract);
    }
  };

  const deleteContract = async (contract_id) => {
    const request = await fetch(`${url}${contract_id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth()}` },
    });
    const { detail } = await request.json();
    setNotify({ message: detail, variant: "success", trigger: true });
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const saveContract = async (event) => {
    event.preventDefault();
    const {
      target: {
        employer: { value: employer },
        hourly: { value: hourly },
      },
    } = event;

    let variant = "danger",
      message = "";

    const shouldPost =
      !isNaN(hourly) && employer.length <= 30 && employer.length > 2;

    if (shouldPost) {
      const payload = { employer: employer, hourly: hourly };

      contract() !== null &&
        Object.assign(payload, { contract_id: contract().contract_id });

      const request = await fetch(url, {
        method: "POST",
        body: JSON.stringify(payload),
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
        "name of employer must be 30 characters or less, and hourly must be numeric";
    }

    setNotify({ trigger: true, message: message, variant: variant });
  };

  return (
    <>
      <Row>
        <Col md={{ span: 6, offset: 3 }} onSubmit={saveContract}>
          <h2 className="text-center">
            {contract() === null
              ? "Manage your contracts here"
              : `Now editing contract for ${contract().employer}`}
          </h2>
          <Form>
            <Form.Group class="mb-3">
              <Form.Label>Employer name</Form.Label>
              <Form.Control
                type="text"
                id="employer"
                placeholder="Enter name of your employer"
                name="employer"
                maxLength={30}
                value={contract() !== null ? contract().employer : ""}
              />
            </Form.Group>
            <Form.Group class="mb-3">
              <Form.Label>Hourly rate</Form.Label>
              <Form.Control
                type="number"
                step=".01"
                id="hourly"
                placeholder="12.01"
                name="hourly"
                value={contract() !== null ? contract().hourly : ""}
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

      {contracts().length > 0 &&
        contracts().map((dBcontract) => {
          const { contract_id, hourly, employer } = dBcontract;

          const border =
            contract() !== null && contract_id == contract().contract_id
              ? "warning"
              : "";

          return (
            <Row class="mt-3" key={contract_id}>
              <Col md={{ span: 6, offset: 3 }}>
                <Card style={{ color: "black" }} border={border}>
                  <Card.Body>
                    <Card.Title>{employer}</Card.Title>
                    <p>hourly rate: {hourly}</p>
                    <p>contract id: {contract_id}</p>
                    <Button
                      variant="warning"
                      onClick={() => {
                        editContract(contract_id);
                      }}
                    >
                      edit
                    </Button>{" "}
                    <Button
                      variant="danger"
                      onClick={() => {
                        deleteContract(contract_id);
                      }}
                    >
                      delete
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          );
        })}
    </>
  );
};
