import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Home from "./pages/Home";
import PrivateRoute from "./pages/PrivateRoute";

export const router = createBrowserRouter([
  {path: "/",element: <App />},
  {path: "/signup",element: <SignUp />},
  {path: "/signin",element: <SignIn />},
  {
    path: "/homepage",
    element:(
      <PrivateRoute>
        <Home />{" "}
      </PrivateRoute>
    ),
  },
]);