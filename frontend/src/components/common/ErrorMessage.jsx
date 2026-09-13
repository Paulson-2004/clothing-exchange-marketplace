function ErrorMessage({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="error-message">
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
