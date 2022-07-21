import "./App.css";
import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Caller from "./pages/Caller";
import Receiver from "./pages/Receiver";
import Test from "./pages/Test_storage";
import { Toast } from "./components/index";
import { useStore } from "./global_stores";

function App() {
  const showToast = useStore((state) => state.showToast);
  const toastMessage = useStore((state) => state.toastMessage);

  return (
    <div className="App">
      <Routes>
        <Route path="/caller/:id" element={<Caller />} />
        <Route path="/receiver/:id" element={<Receiver />} />
        <Route path="/test" element={<Test />} />
        <Route path="/" element={<Home />} />
      </Routes>
      <Toast showToast={showToast} toastMessage={toastMessage} />{" "}
    </div>
  );
}

export default App;
