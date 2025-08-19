import React from "react";

class ErrorPage extends React.Component {
  render() {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Oops! Something went wrong.</h1>
        <p>We are sorry, but a critical error occurred on this page.</p>
        <p>Please try refreshing or contact support if the problem persists.</p>
      </div>
    );
  }
}

export default ErrorPage;
