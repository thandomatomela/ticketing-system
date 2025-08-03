import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function TicketDetails() {
  const { ticketId } = useParams();
  const { token, user } = useContext(AuthContext);
  const [ticket, setTicket] = useState(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [assignedWorkerId, setAssignedWorkerId] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchTicket() {
      try {
        const res = await fetch(
          `http://localhost:3000/api/tickets/${ticketId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Ticket not found");
        const data = await res.json();
        setTicket(data);
        setStatus(data.status || "");
        setAssignedWorkerId(data.assignedWorker || "");
      } catch (err) {
        setError(err.message);
      }
    }
    fetchTicket();
  }, [ticketId, token]);

  async function handleCommentSubmit(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const res = await fetch(
        `http://localhost:3000/api/tickets/${ticketId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: comment }),
        }
      );
      if (!res.ok) throw new Error("Failed to add comment");
      const newComment = await res.json();
      setTicket((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), newComment],
      }));
      setComment("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateTicket(e) {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await fetch(`http://localhost:3000/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          assignedWorkerId: assignedWorkerId || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update ticket");
      }
      const updatedTicket = await res.json();
      setTicket(updatedTicket);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!ticket) return <p>Loading ticket...</p>;

  return (
    <div>
      <h2>{ticket.title}</h2>
      <p>{ticket.description}</p>
      <p>Status: {ticket.status}</p>

      <h3>Comments</h3>
      <ul>
        {(ticket.comments || []).map((c) => (
          <li key={c._id}>
            <b>{c.role}:</b> {c.message}{" "}
            <i>({new Date(c.createdAt).toLocaleString()})</i>
          </li>
        ))}
      </ul>

      <form onSubmit={handleCommentSubmit}>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment"
          rows={4}
          cols={50}
        />
        <br />
        <button type="submit">Add Comment</button>
      </form>

      {/* Update form - show only for landlord, admin, worker */}
      {(user.role === "landlord" ||
        user.role === "admin" ||
        user.role === "worker") && (
        <>
          <h3>Update Ticket</h3>
          <form onSubmit={handleUpdateTicket}>
            <label>
              Status:
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="unassigned">Unassigned</option>
                <option value="in progress">In Progress</option>
                <option value="waiting">Waiting</option>
                <option value="completed">Completed</option>
                <option value="resolved">Resolved</option>
              </select>
            </label>
            <br />
            {/* Only landlord/admin can assign worker */}
            {(user.role === "landlord" || user.role === "admin") && (
              <label>
                Assign Worker ID:
                <input
                  type="text"
                  value={assignedWorkerId || ""}
                  onChange={(e) => setAssignedWorkerId(e.target.value)}
                  placeholder="Worker user ID"
                />
              </label>
            )}
            <br />
            <button type="submit" disabled={updating}>
              {updating ? "Updating..." : "Update Ticket"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
