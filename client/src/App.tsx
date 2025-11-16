// src/App.tsx
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RoomPage from "./pages/RoomPage";
import { useTheme } from "./context/ThemeContext";

function App() {
  const { theme } = useTheme();

  const router = createBrowserRouter([
    {
      path: "/",
      element: <OutletWrapper theme={theme} />,
      children: [
        { path: "/", element: <HomePage /> },
        { path: "room/:roomId", element: <RoomPage /> }
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

// layout wrapper (replaces your old <div className="App">)
function OutletWrapper({ theme }: { theme: string }) {
  return (
    <div
      data-theme={theme}
      className="min-h-screen w-full bg-white text-black dark:bg-[#0f0f0f] dark:text-white"
    >
      <Outlet />
    </div>
  );
}

export default App;
