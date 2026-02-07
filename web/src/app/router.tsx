import { createBrowserRouter } from "react-router-dom"
import Home from "../pages/home/index.tsx"
import RedirectPage from "../pages/redirect/index.tsx"
import NotFound from "../pages/notfound/index.tsx"

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/:short", element: <RedirectPage /> },
  { path: "*", element: <NotFound /> },
])
