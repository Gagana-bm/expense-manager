import { useEffect, useState } from "react";
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

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState("All");

  // Fetch Expenses
  const fetchExpenses = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/expenses`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setExpenses(res.data.expenses);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!token) navigate("/");
    else fetchExpenses();
  }, []);

  // Filter Logic
  const filteredExpenses =
    filterCategory === "All"
      ? expenses
      : expenses.filter(
          (expense) =>
            expense.category.toLowerCase() ===
            filterCategory.toLowerCase()
        );

  // Summary
  const totalAmount = filteredExpenses.reduce(
    (acc, curr) => acc + Number(curr.amount),
    0
  );

  const totalEntries = filteredExpenses.length;

  // Chart Data
  const categoryTotals = {};

  filteredExpenses.forEach((expense) => {
    const cat = expense.category;
    categoryTotals[cat] =
      (categoryTotals[cat] || 0) + Number(expense.amount);
  });

  const pieData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        data: Object.values(categoryTotals),
        backgroundColor: [
          "#4e73df",
          "#1cc88a",
          "#f6c23e",
          "#e74a3b",
          "#36b9cc",
          "#858796",
        ],
      },
    ],
  };

  const barData = {
    labels: filteredExpenses.map((exp) => exp.title),
    datasets: [
      {
        label: "Expense Amount",
        data: filteredExpenses.map((exp) => exp.amount),
        backgroundColor: "#4e73df",
      },
    ],
  };
// ==========================
// Monthly Analytics Logic
// ==========================

const monthlyTotals = {};

expenses.forEach((expense) => {
  const date = new Date(expense.createdAt);

  const monthYear = date.toLocaleString("default", {
    month: "short",
    year: "numeric",
  });

  monthlyTotals[monthYear] =
    (monthlyTotals[monthYear] || 0) + Number(expense.amount);
});

const monthlyLabels = Object.keys(monthlyTotals);
const monthlyValues = Object.values(monthlyTotals);

const monthlyBarData = {
  labels: monthlyLabels,
  datasets: [
    {
      label: "Monthly Expenses",
      data: monthlyValues,
      backgroundColor: "#1cc88a",
    },
  ],
}; 
  // Add / Update
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/expenses/${editingId}`,
          { title, amount, category },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEditingId(null);
      } else {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/expenses`,
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
    }
  };

  // Delete
  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/expenses/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchExpenses();
    } catch (error) {
      console.log(error);
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
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

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
            <Pie data={pieData} />
          </div>
          <div style={{ width: "60%" }}>
            <Bar
              data={barData}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </div>
        {/* Monthly Expense Chart */}
<div style={{ marginTop: "40px" }}>
  <h3 style={{ marginBottom: "20px" }}>Monthly Expense Overview</h3>

  <Bar
    data={monthlyBarData}
    options={{
      responsive: true,
      plugins: {
        legend: { display: false },
      },
    }}
  />
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

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select Category</option>
            <option value="Food">Food</option>
            <option value="Travel">Travel</option>
            <option value="Shopping">Shopping</option>
            <option value="Bills">Bills</option>
            <option value="Other">Other</option>
          </select>

          <button type="submit">
            {editingId ? "Update" : "Add"}
          </button>
        </form>

        {/* Filter */}
        <div style={{ marginBottom: "15px" }}>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          >
            <option value="All">All Categories</option>
            <option value="Food">Food</option>
            <option value="Travel">Travel</option>
            <option value="Shopping">Shopping</option>
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
          <button
            className="edit-btn"
            onClick={() => handleEdit(expense)}
          >
            Edit
          </button>
          <button
            className="delete-btn"
            onClick={() => handleDelete(expense._id)}
          >
            Delete
          </button>
        </td>
      </tr>
    ))
  )}
</tbody>
        </table>
        <table>...</table>

<div style={{ marginTop: "40px", textAlign: "center", opacity: 0.7 }}>
  © 2026 Expense Manager | Built with MERN Stack
</div>

</div>
</div>
      
  
  );
}

export default Dashboard;