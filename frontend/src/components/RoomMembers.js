import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

function RoomMembers({ members }) {

  const customColors = [
    "#3498db", // Vibrant Blue
    "#2ecc71", // Bright Green
    "#e74c3c", // Energetic Red
    "#f1c40f", // Cheerful Yellow
    "#1abc9c", // Futuristic Teal
    "#9b59b6"  // Playful Purple
  ];

  return (
    <div className="mt-4">
      <h3 className="mb-3">Mitglieder im Raum:</h3>
      <div className="row">
        {members.map((member, index) => (
          <div className="col-sm-6 col-md-4 col-lg-3 mb-3" key={index}>
            <div className="card text-white" style={{ backgroundColor: customColors[index % customColors.length] }}>
              <div className="card-body">
                <h5 className="card-title">{member}</h5>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RoomMembers;
