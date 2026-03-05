import { useNavigate } from "react-router-dom";
import ApplyLeave from "./ApplyLeave";

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h1>HRMS Dashboard 🎉</h1>
      <button onClick={handleLogout}>Logout</button>

      <ApplyLeave />
    </div>
  );
}

export default Dashboard;