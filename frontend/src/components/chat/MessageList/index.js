import React from 'react';

const MessageList = ({ messages }) => {
  return (
    <div>
      {messages.map((msg, index) => (
        <div key={index}>
          <span>{msg}</span>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
