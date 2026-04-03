import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import { Home } from "./pages/Home";
import { Layout } from "./components/Layout";
import { Shop } from "./pages/Shop";
import { ProductDetail } from "./pages/Product";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Tracking } from "./pages/Tracking";
import PrivateRoute from "./pages/PrivateRoute";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/signup", element: <SignUp /> },
  { path: "/signin", element: <SignIn /> },
  {
    element: <Layout />,
    children: [
      { path: "/homepage", 
        element:(
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        ),
      },
      { path: "/shop", element: <Shop /> },
      { path: "/product/:id", element: <ProductDetail /> },
      { path: "/cart", element: <Cart /> },
      { path: "/checkout", element: <Checkout /> },
      { path: "/tracking", element: <Tracking /> },
    ],
    
  },
]);