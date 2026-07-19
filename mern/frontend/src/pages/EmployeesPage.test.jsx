import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EmployeesPage from "./EmployeesPage";
import { api } from "../lib/api";

vi.mock("../lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockEmployees = [
  {
    _id: "507f1f77bcf86cd799439011",
    name: "Jane Doe",
    email: "jane@example.com",
    position: "Engineer",
  },
  {
    _id: "507f1f77bcf86cd799439012",
    name: "John Smith",
    email: "john@example.com",
    position: "Designer",
  },
];

describe("EmployeesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue(mockEmployees);
    window.confirm = vi.fn(() => true);
  });

  it("renders the employee form with required fields", async () => {
    render(<EmployeesPage />);

    expect(screen.getByRole("heading", { name: "Employee Management" })).toBeInTheDocument();
    expect(screen.getByLabelText("Employee Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Position")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Employee" })).toBeInTheDocument();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/employees");
    });
  });

  it("displays existing employees in the list", async () => {
    render(<EmployeesPage />);

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText("Engineer")).toBeInTheDocument();
    expect(screen.getByText("John Smith")).toBeInTheDocument();
  });

  it("shows a loading indicator while fetching employees", () => {
    api.get.mockReturnValue(new Promise(() => {}));

    render(<EmployeesPage />);

    expect(screen.getByText("Loading employees...")).toBeInTheDocument();
  });

  it("shows validation error when required fields are empty", async () => {
    const user = userEvent.setup();
    render(<EmployeesPage />);

    await screen.findByText("Jane Doe");

    await user.click(screen.getByRole("button", { name: "Save Employee" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Name, email, and position are required."
    );
    expect(api.post).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid email format", async () => {
    const user = userEvent.setup();
    render(<EmployeesPage />);

    await screen.findByText("Jane Doe");

    await user.type(screen.getByLabelText("Employee Name"), "Test User");
    await user.type(screen.getByLabelText("Email Address"), "invalid-email");
    await user.type(screen.getByLabelText("Position"), "Tester");
    await user.click(screen.getByRole("button", { name: "Save Employee" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please enter a valid email address."
    );
    expect(api.post).not.toHaveBeenCalled();
  });

  it("creates a new employee successfully", async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValue({
      _id: "507f1f77bcf86cd799439013",
      name: "New Employee",
      email: "new@example.com",
      position: "Analyst",
    });
    api.get
      .mockResolvedValueOnce(mockEmployees)
      .mockResolvedValueOnce([
        ...mockEmployees,
        {
          _id: "507f1f77bcf86cd799439013",
          name: "New Employee",
          email: "new@example.com",
          position: "Analyst",
        },
      ]);

    render(<EmployeesPage />);
    await screen.findByText("Jane Doe");

    await user.type(screen.getByLabelText("Employee Name"), "New Employee");
    await user.type(screen.getByLabelText("Email Address"), "new@example.com");
    await user.type(screen.getByLabelText("Position"), "Analyst");
    await user.click(screen.getByRole("button", { name: "Save Employee" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/employees", {
        name: "New Employee",
        email: "new@example.com",
        position: "Analyst",
      });
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Employee created successfully."
    );
    expect(await screen.findByText("New Employee")).toBeInTheDocument();
  });

  it("prevents duplicate submissions while a save request is pending", async () => {
    const user = userEvent.setup();
    let resolvePost;
    api.post.mockReturnValue(
      new Promise((resolve) => {
        resolvePost = resolve;
      })
    );
    api.get.mockResolvedValue(mockEmployees);

    render(<EmployeesPage />);
    await screen.findByText("Jane Doe");

    await user.type(screen.getByLabelText("Employee Name"), "Pending User");
    await user.type(screen.getByLabelText("Email Address"), "pending@example.com");
    await user.type(screen.getByLabelText("Position"), "Role");

    const saveButton = screen.getByRole("button", { name: "Save Employee" });
    await user.click(saveButton);
    await user.click(saveButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(1);
    });

    resolvePost({
      _id: "507f1f77bcf86cd799439014",
      name: "Pending User",
      email: "pending@example.com",
      position: "Role",
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Employee created successfully."
    );
  });

  it("loads employee data into the form when Edit is clicked", async () => {
    const user = userEvent.setup();
    render(<EmployeesPage />);

    await screen.findByText("Jane Doe");

    const janeRow = screen.getByText("Jane Doe").closest("tr");
    await user.click(within(janeRow).getByRole("button", { name: "Edit" }));

    expect(screen.getByLabelText("Employee Name")).toHaveValue("Jane Doe");
    expect(screen.getByLabelText("Email Address")).toHaveValue("jane@example.com");
    expect(screen.getByLabelText("Position")).toHaveValue("Engineer");
    expect(screen.getByRole("heading", { name: "Edit Employee" })).toBeInTheDocument();
  });

  it("updates an employee successfully", async () => {
    const user = userEvent.setup();
    api.put.mockResolvedValue({
      ...mockEmployees[0],
      position: "Senior Engineer",
    });
    api.get
      .mockResolvedValueOnce(mockEmployees)
      .mockResolvedValueOnce([
        { ...mockEmployees[0], position: "Senior Engineer" },
        mockEmployees[1],
      ]);

    render(<EmployeesPage />);
    await screen.findByText("Jane Doe");

    const janeRow = screen.getByText("Jane Doe").closest("tr");
    await user.click(within(janeRow).getByRole("button", { name: "Edit" }));

    const positionInput = screen.getByLabelText("Position");
    await user.clear(positionInput);
    await user.type(positionInput, "Senior Engineer");
    await user.click(screen.getByRole("button", { name: "Save Employee" }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/employees/507f1f77bcf86cd799439011", {
        name: "Jane Doe",
        email: "jane@example.com",
        position: "Senior Engineer",
      });
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Employee updated successfully."
    );
    expect(await screen.findByText("Senior Engineer")).toBeInTheDocument();
  });

  it("deletes an employee after confirmation", async () => {
    const user = userEvent.setup();
    api.delete.mockResolvedValue({ message: "Employee deleted" });
    api.get
      .mockResolvedValueOnce(mockEmployees)
      .mockResolvedValueOnce([mockEmployees[1]]);

    render(<EmployeesPage />);
    await screen.findByText("Jane Doe");

    const janeRow = screen.getByText("Jane Doe").closest("tr");
    await user.click(within(janeRow).getByRole("button", { name: "Delete" }));

    expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to delete this employee?");

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/employees/507f1f77bcf86cd799439011");
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Employee deleted successfully."
    );
    await waitFor(() => {
      expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
    });
  });

  it("does not delete an employee when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    window.confirm = vi.fn(() => false);

    render(<EmployeesPage />);
    await screen.findByText("Jane Doe");

    const janeRow = screen.getByText("Jane Doe").closest("tr");
    await user.click(within(janeRow).getByRole("button", { name: "Delete" }));

    expect(api.delete).not.toHaveBeenCalled();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("displays error message when loading employees fails", async () => {
    api.get.mockRejectedValue(new Error("Network error"));

    render(<EmployeesPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Network error");
  });

  it("displays error message when creating an employee fails", async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValue(new Error("Create failed"));

    render(<EmployeesPage />);
    await screen.findByText("Jane Doe");

    await user.type(screen.getByLabelText("Employee Name"), "Fail User");
    await user.type(screen.getByLabelText("Email Address"), "fail@example.com");
    await user.type(screen.getByLabelText("Position"), "Role");
    await user.click(screen.getByRole("button", { name: "Save Employee" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Create failed");
  });

  it("shows saving state while submitting the form", async () => {
    const user = userEvent.setup();
    let resolvePost;
    api.post.mockReturnValue(
      new Promise((resolve) => {
        resolvePost = resolve;
      })
    );

    render(<EmployeesPage />);
    await screen.findByText("Jane Doe");

    await user.type(screen.getByLabelText("Employee Name"), "Pending User");
    await user.type(screen.getByLabelText("Email Address"), "pending@example.com");
    await user.type(screen.getByLabelText("Position"), "Role");
    await user.click(screen.getByRole("button", { name: "Save Employee" }));

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();

    resolvePost({
      _id: "507f1f77bcf86cd799439014",
      name: "Pending User",
      email: "pending@example.com",
      position: "Role",
    });
    api.get.mockResolvedValueOnce(mockEmployees);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save Employee" })).toBeInTheDocument();
    });
  });
});
