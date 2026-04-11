import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function UserLayout() {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}