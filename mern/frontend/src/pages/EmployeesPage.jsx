import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

const initialForm = {
  name: "",
  email: "",
  position: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get("/employees");
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to load employees." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setMessage({ type: "", text: "" });

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    const trimmedPosition = form.position.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPosition) {
      setMessage({ type: "error", text: "Name, email, and position are required." });
      return;
    }

    if (!emailPattern.test(trimmedEmail)) {
      setMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    const payload = {
      name: trimmedName,
      email: trimmedEmail,
      position: trimmedPosition,
    };

    try {
      setSubmitting(true);

      if (editingId) {
        await api.put(`/employees/${editingId}`, payload);
        setMessage({ type: "success", text: "Employee updated successfully." });
      } else {
        await api.post("/employees", payload);
        setMessage({ type: "success", text: "Employee created successfully." });
      }

      resetForm();
      await loadEmployees();
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : "Failed to save employee.";
      setMessage({ type: "error", text: fallbackMessage || "Failed to save employee." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingId(employee._id);
    setForm({
      name: employee.name || "",
      email: employee.email || "",
      position: employee.position || "",
    });
    setMessage({ type: "", text: "" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }

    try {
      setDeletingId(id);
      setMessage({ type: "", text: "" });
      await api.delete(`/employees/${id}`);
      setMessage({ type: "success", text: "Employee deleted successfully." });

      if (editingId === id) {
        resetForm();
      }

      await loadEmployees();
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to delete employee." });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Employee Management</h1>
        <p className="mt-1 text-sm text-slate-600">Create, view, edit, and delete employee records.</p>
      </div>

      {message.text ? (
        <div
          role="alert"
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-slate-900">
          {editingId ? "Edit Employee" : "Add Employee"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              Employee Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              placeholder="Enter employee name"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label htmlFor="position" className="mb-1 block text-sm font-medium text-slate-700">
              Position
            </label>
            <input
              id="position"
              name="position"
              type="text"
              required
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              placeholder="Enter position"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Saving..." : "Save Employee"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-slate-900">Employee List</h2>

        {loading ? (
          <p className="text-sm text-slate-500">Loading employees...</p>
        ) : employees.length === 0 ? (
          <p className="text-sm text-slate-500">No employees found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Position</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee._id} className="border-b border-slate-100">
                    <td className="px-3 py-3 text-slate-900">{employee.name}</td>
                    <td className="px-3 py-3 text-slate-700">{employee.email}</td>
                    <td className="px-3 py-3 text-slate-700">{employee.position}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(employee)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(employee._id)}
                          disabled={deletingId === employee._id}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {deletingId === employee._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
