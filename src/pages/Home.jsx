import { Row, Col } from "solid-bootstrap";
import { GlobalState } from "..";

export const Home = () => {
  const { auth } = GlobalState();

  return (
    <Row>
      <Col md={{ span: 6, offset: 3 }}>
        <h1 className="text-center">Welcome</h1>
        {auth.state === "ready" && auth() === null && (
          <p className="text-center">
            You are not signed in. Please <a href="/sign-in">sign in</a>.{" "}
          </p>
        )}
      </Col>
    </Row>
  );
};
