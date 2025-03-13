import React from 'react';

const Timer = ({ timerString }) => {
  if (timerString === "") {
    return <h1>Runde noch nicht gestartet</h1>;
  }  
  if (parseInt(timerString, 10) === 0) {
    return <h1>Runde beendet</h1>;
  }  
  return <h1>{timerString}</h1>;
};

export default Timer;
