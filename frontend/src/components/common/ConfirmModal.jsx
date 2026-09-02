// Generic confirmation dialog for destructive actions.
// Renders as a modal overlay with a message and Confirm/Cancel buttons.

function ConfirmModal({ title = 'Confirm Action', message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {message && <p>{message}</p>}
        <div className="confirm-modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
