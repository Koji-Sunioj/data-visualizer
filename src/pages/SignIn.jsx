import { Form, Button, Row, Col } from "solid-bootstrap";
import { useNavigate } from "@solidjs/router";
import { GlobalState } from "..";

const SignIn = () => {
  const { setAuth } = GlobalState();
  const navigate = useNavigate();

  const logIn = async (event) => {
    event.preventDefault();

    const {
      target: {
        email: { value: email },
        password: { value: password },
      },
    } = event;

    const url = "http://localhost:8000/sign-in";

    const request = await fetch(url, {
      body: JSON.stringify({ email: email, password: password }),
      method: "POST",
    });

    const { status } = request;

    switch (status) {
      case 200:
        const { token } = await request.json();
        localStorage.setItem("token", token);
        setAuth(token);
        navigate("/", { replace: true });
        break;
    }
  };

  return (
    <Row>
      <Col md={{ span: 6, offset: 3 }}>
        <Form
          style={{ marginTop: "20px" }}
          data-bs-theme="light"
          onSubmit={logIn}
        >
          <h2 className="text-center">Sign in</h2>
          <Form.Group className="mb-3">
            <Form.Label>Email address</Form.Label>
            <Form.Control type="email" placeholder="Enter email" name="email" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              name="password"
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
      </Col>
    </Row>
  );
};

export default SignIn;
