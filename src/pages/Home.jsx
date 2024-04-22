import { Row, Col } from "solid-bootstrap";
import { GlobalState } from "..";

const Home = () => {
  const { auth, setAuth } = GlobalState();

  return (
    <Row>
      <Col md={{ span: 6, offset: 3 }}>
        <h1 className="text-center">Welcome bitch</h1>
        {auth() === null && (
          <p className="text-center">
            You are not signed in. Please <a href="/sign-in">sign in</a>.{" "}
          </p>
        )}
      </Col>
    </Row>
  );
};

export default Home;
