import { useState } from "react";
import axios from "axios";

function ApplyLeave() {
  const [leaveType, setLeaveType] = useState("SICK");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("access_token");

      const response = await axios.post(
        "http://127.0.0.1:8000/api/leaves/",
        {
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason: reason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Leave Applied Successfully ✅");
      console.log(response.data);
    } catch (error) {
      alert("Error applying leave ❌");
      console.log(error.response);
    }
  };

  return (
    <div style={{ marginTop: "40px" }}>
      <h2>Apply Leave</h2>

      <form onSubmit={handleSubmit}>
        <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
          <option value="SICK">Sick Leave</option>
          <option value="CASUAL">Casual Leave</option>
          <option value="PAID">Paid Leave</option>
        </select>

        <br /><br />

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />

        <br /><br />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />

        <br /><br />

        <textarea
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />

        <br /><br />

        <button type="submit">Apply</button>
      </form>
    </div>
  );
}

export default ApplyLeave;