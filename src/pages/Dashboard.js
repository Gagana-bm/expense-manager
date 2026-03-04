import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/expenses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(res.data.expenses);
    } catch (error) {
      console.log(error);
      setError("Failed to fetch expenses");
    }
  }, [token, API]);

  useEffect(() => {
    if (!token) {
      navigate("/");
    } else {
      fetchExpenses();
    }
  }, [token, navigate, fetchExpenses]);

  // Filter Logic
  const filteredExpenses =
    filterCategory === "All"
      ? expenses
      : expenses.filter(
          (expense) =>
            expense.category.toLowerCase() === filterCategory.toLowerCase()
        );

  // Summary
  const totalAmount = filteredExpenses.reduce(
    (acc, curr) => acc + Number(curr.amount), 0
  );
  const totalEntries = filteredExpenses.length;

  // Chart Data
  const categoryTotals = {};
  filteredExpenses.forEach((expense) => {
    const cat = expense.category;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(expense.amount);
  });

  const pieData = {
    labels: Object.keys(categoryTotals),
    datasets: [{
      data: Object.values(categoryTotals),
      backgroundColor: ["#4e73df", "#1cc88a", "#f6c23e", "#e74a3b", "#36b9cc", "#858796"],
    }],
  };

  const barData = {
    labels: filteredExpenses.map((exp) => exp.title),
    datasets: [{
      label: "Expense Amount",
      data: filteredExpenses.map((exp) => exp.amount),
      backgroundColor: "#4e73df",
    }],
  };

  // Monthly Analytics
  const monthlyTotals = {};
  expenses.forEach((expense) => {
    const date = new Date(expense.createdAt);
    const monthYear = date.toLocaleString("default", { month: "short", year: "numeric" });
    monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + Number(expense.amount);
  });

  const monthlyBarData = {
    labels: Object.keys(monthlyTotals),
    datasets: [{
      label: "Monthly Expenses",
      data: Object.values(monthlyTotals),
      backgroundColor: "#1cc88a",
    }],
  };

  // Add / Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editingId) {
        await axios.put(
          `${API}/api/expenses/${editingId}`,
          { title, amount, category },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEditingId(null);
      } else {
        await axios.post(
          `${API}/api/expenses`,
          { title, amount, category },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setTitle("");
      setAmount("");
      setCategory("");
      fetchExpenses();

    } catch (error) {
      console.log(error);
      setError(error.response?.data?.message || "Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    setError("");
    try {
      await axios.delete(`${API}/api/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchExpenses();
    } catch (error) {
      console.log(error);
      setError("Failed to delete expense");
    }
  };

  // Edit
  const handleEdit = (expense) => {
    setTitle(expense.title);
    setAmount(expense.amount);
    setCategory(expense.category);
    setEditingId(expense._id);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Expense Dashboard</h2>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>

        {error && <p className="error-msg">{error}</p>}

        {/* Summary */}
        <div className="summary-section">
          <div className="summary-card">
            <h4>Total Expenses</h4>
            <p>₹ {totalAmount}</p>
          </div>
          <div className="summary-card">
            <h4>Total Entries</h4>
            <p>{totalEntries}</p>
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: "flex", gap: "40px", marginBottom: "30px" }}>
          <div style={{ width: "40%" }}>
            {Object.keys(categoryTotals).length > 0 && <Pie data={pieData} />}
          </div>
          <div style={{ width: "60%" }}>
            <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        {/* Monthly Chart */}
        <div style={{ marginTop: "40px" }}>
          <h3 style={{ marginBottom: "20px" }}>Monthly Expense Overview</h3>
          <Bar data={monthlyBarData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>

        {/* Form */}
        <form className="expense-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="">Select Category</option>
            <option value="Food">Food</option>
            <option value="Travel">Travel</option>
            <option value="Shopping">Shopping</option>
            <option value="Bills">Bills</option>
            <option value="Other">Other</option>
          </select>
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : editingId ? "Update" : "Add"}
          </button>
        </form>

        {/* Filter */}
        <div style={{ marginBottom: "15px" }}>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
          >
            <option value="All">All Categories</option>
            <option value="Food">Food</option>
            <option value="Travel">Travel</option>
            <option value="Shopping">Shopping</option>
            <option value="Bills">Bills</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Table */}
        <table className="expense-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                  No expenses found.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((expense) => (
                <tr key={expense._id}>
                  <td>{expense.title}</td>
                  <td>₹ {expense.amount}</td>
                  <td>{expense.category}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(expense)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(expense._id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div style={{ marginTop: "40px", textAlign: "center", opacity: 0.7 }}>
          © 2026 Expense Manager | Built with MERN Stack
        </div>
      </div>
    </div>
  );
}

export default Dashboard;