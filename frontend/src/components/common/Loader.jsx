function Loader({ message = 'Loading…' }) {
  return (
    <div className="loader">
      <div className="loader-spinner" />
      <p>{message}</p>
    </div>
  );
}

export default Loader;
