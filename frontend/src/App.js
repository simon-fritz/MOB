import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import RoleSelection from './components/RoleSelection';
import TeacherPanel from './components/TeacherPanel';
import Chat from './components/Chat';

function App() {
  const [role, setRole] = useState(null);
  if (role === null) {
    return <RoleSelection setRole={setRole} />;
  } else if (role === 'teacher') {
    return <TeacherPanel />;
  } else {
    return <Chat />;
  }
}

export default App;
