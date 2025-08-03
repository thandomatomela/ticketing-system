import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { token, logout, user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // New states for creating ticket
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [landlordId, setLandlordId] = useState(""); // only if tenant creates ticket
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await fetch("http://localhost:3000/api/tickets", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setTickets(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, [token]);

  async function handleCreateTicket(e) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError("Title and description are required");
      return;
    }
    if (user.role === "tenant" && !landlordId.trim()) {
      setError("Landlord ID is required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("http://localhost:3000/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          landlordId: user.role === "tenant" ? landlordId : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create ticket");
      }
      const newTicket = await res.json();
      setTickets((prev) => [newTicket, ...prev]);
      setTitle("");
      setDescription("");
      setLandlordId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={logout}>Logout</button>

      {/* New Ticket Creation Form */}
      <h2>Create New Ticket</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleCreateTicket}>
        <div>
          <label>
            Title:
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Description:
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </label>
        </div>
        {/* Show landlordId input only for tenant users */}
        {user.role === "tenant" && (
          <div>
            <label>
              Landlord ID:
              <input
                type="text"
                value={landlordId}
                onChange={(e) => setLandlordId(e.target.value)}
                required
              />
            </label>
          </div>
        )}
        <button type="submit" disabled={creating}>
          {creating ? "Creating..." : "Create Ticket"}
        </button>
      </form>

      <hr />

      {/* Ticket list */}
      {loading ? (
        <p>Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p>No tickets found</p>
      ) : (
        <ul>
          {tickets.map((ticket) => (
            <li key={ticket._id}>
              <Link to={`/tickets/${ticket._id}`}>{ticket.title}</Link> -{" "}
              {ticket.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
