// src/components/TicketList.js
import React from "react";

const TicketList = ({ tickets }) => {
  if (!tickets.length) return <p>No tickets found</p>;

  return (
    <ul>
      {tickets.map((ticket) => (
        <li key={ticket._id}>
          <strong>{ticket.title}</strong> - Status: {ticket.status}
        </li>
      ))}
    </ul>
  );
};

export default TicketList;
