import { GlobalState } from ".";

function App() {
  const { auth, setAuth } = GlobalState();

  return (
    <>
      <div>asd</div>
      <div>{auth()}</div>
      <button
        onClick={() => {
          setAuth("authenticated");
        }}
      >
        asdasd
      </button>
    </>
  );
}

export default App;
