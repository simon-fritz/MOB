import React from "react";

function RoomMembers({ members }) {
  return (
    <div className="mt-4">
      <h3>Mitglieder im Raum:</h3>
      <ul>
        {members.map((member, index) => (
          <li key={index}>{member}</li>
        ))}
      </ul>
    </div>
  );
}

export default RoomMembers;
