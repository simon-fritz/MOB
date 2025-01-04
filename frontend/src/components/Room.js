import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import StudentPanel from "./StudentPanel";
import TeacherPanel from "./TeacherPanel";
import API from "./api";

function Room() {
  const [isStudent, setIsStudent] = useState(null);

  useEffect(() => {
    API.get("/accounts/get-role/")
      .then((response) => {
        if (response.data.role === "student") {
          setIsStudent(true);
        } else if (response.data.role === "teacher") {
          setIsStudent(false);
        } else {
          setIsStudent(null);
        }
      })
      .catch((error) => {
        console.error("Error fetching role:", error);
        setIsStudent(null);
      });
  }, []);

  return (
    <div>
      {isStudent === true && <StudentPanel />}
      {isStudent === false && <TeacherPanel />}
      {isStudent === null && <p>Loading...</p>}
    </div>
  );
}

export default Room;
