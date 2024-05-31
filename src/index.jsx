import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import {
  createSignal,
  createContext,
  useContext,
  createEffect,
  createResource,
} from "solid-js";

import "./index.css";

import { Home } from "./pages/Home";
import { SignIn } from "./pages/SignIn";
import { checkSession } from "./utils/apis";
import { Calendar } from "./pages/Calendar.jsx";
import { Contracts } from "./pages/Contracts";
import { Container, Offcanvas } from "solid-bootstrap";

const StateContext = createContext();

const [show, setShow] = createSignal(false);
const [auth, { mutate }] = createResource(
  localStorage.getItem("token"),
  checkSession,
  { initialValue: null }
);

const handleOpen = () => {
  const menuButton = document.getElementById("menu-button");
  menuButton.setAttribute("transform", "rotate(45)");
  setShow(true);
};
const handleClose = () => {
  setShow(false);
};

export const GlobalState = () => {
  return useContext(StateContext);
};

const root = document.getElementById("root");

const signOut = () => {
  localStorage.removeItem("token");
  mutate(null);
};
``;
render(
  () => (
    <>
      <Offcanvas
        show={show()}
        onHide={handleClose}
        class="w-50"
        scroll={true}
        backdrop={false}
      >
        <Offcanvas.Header
          closeButton
          style={{ "background-color": "black" }}
          closeVariant="white"
        >
          <Offcanvas.Title>Site Directory</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body style={{ "background-color": "black" }}>
          <ul>
            <li>
              <a href="/">Home</a>
            </li>

            {auth() !== null ? (
              <>
                <li>
                  <a href="/calendar">Shift calendar</a>
                </li>
                <li>
                  <a href="/contracts">Manage contracts</a>
                </li>
                <li>
                  <a href="/" onClick={signOut}>
                    Sign out
                  </a>
                </li>
              </>
            ) : (
              <>
                <li>
                  <a href="/sign-in">Sign in</a>
                </li>
              </>
            )}
          </ul>
        </Offcanvas.Body>
      </Offcanvas>
      <div style={{ display: "flex", "justify-content": "end" }}>
        <button onClick={handleOpen} class="menu-button">
          <svg
            id="menu-button"
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            fill="currentColor"
            class="bi bi-gear-fill"
            viewBox="0 0 16 16"
            style={{ margin: "20px 20px 0px 0px" }}
          >
            <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
          </svg>
        </button>
      </div>
      <StateContext.Provider
        value={{
          auth: auth,
          setAuth: mutate,
        }}
      >
        <Container fluid>
          <Router>
            <Route path="/" component={Home} />
            <Route path="/sign-in" component={SignIn} />
            {auth() !== null && (
              <>
                <Route path="/calendar" component={Calendar} />
                <Route path="/contracts" component={Contracts} />
              </>
            )}
          </Router>
        </Container>
      </StateContext.Provider>
    </>
  ),
  root
);
