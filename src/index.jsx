/* @refresh reload */
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import { createSignal, createContext, useContext } from "solid-js";

import "./index.css";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import { Container, Offcanvas, Navbar, Nav, Button } from "solid-bootstrap";

const StateContext = createContext();
const [show, setShow] = createSignal(false);
const handleOpen = () => setShow(true);
const handleClose = () => setShow(false);

const StateProvider = (props) => {
  const [auth, setAuth] = createSignal(null);

  return (
    <StateContext.Provider value={{ auth: auth, setAuth: setAuth }}>
      {props.children}
    </StateContext.Provider>
  );
};

export const GlobalState = () => {
  return useContext(StateContext);
};

const root = document.getElementById("root");

render(
  () => (
    <>
      <Offcanvas show={show()} onHide={handleClose} class="w-50">
        <Offcanvas.Header
          closeButton
          style={{ "background-color": "black" }}
          closeVariant="white"
        >
          <Offcanvas.Title>Site Directory</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body style={{ "background-color": "black" }}>
          <a href="/">Home</a>
          <br />
          <a href="/sign-in">Sign in</a>
        </Offcanvas.Body>
      </Offcanvas>
      <div style={{ display: "flex", "justify-content": "end" }}>
        <button onClick={handleOpen} class="menu-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            fill="currentColor"
            class="bi bi-gear-fill"
            viewBox="0 0 16 16"
          >
            <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
          </svg>
        </button>
      </div>
      {/*  <Navbar bg="black" variant="dark">
        <Container>
          <Nav style={{ "justify-content": "end", width: "100%" }}>
            <Nav.Link onClick={handleOpen}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-gear"
                viewBox="0 0 16 16"
              >
                <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0" />
                <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z" />
              </svg>
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar> */}
      <StateProvider>
        <Container>
          <Router>
            <Route path="/" component={Home} />
            <Route path="/sign-in" component={SignIn} />
          </Router>
        </Container>
      </StateProvider>
    </>
  ),
  root
);
