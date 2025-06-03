import ModalContainer from "../template/modalContainer";
import WorldForm from "./WorldForm";

/**
 * @param {boolean} open - Whether the modal is open
 * @param {object|null} initialData - The world to edit, or null to create
 * @param {function} onSubmit - Called with (data) when user submits form
 * @param {boolean} loading - Whether submission is in progress
 * @param {string} error - Optional error message to display
 * @param {array} worlds - List of all existing worlds for duplicate check
 * @param {function} onClose - Called when user cancels or closes modal
 */
export default function WorldFormModal({
  open,
  initialData,
  onSubmit,
  loading,
  error,
  worlds,
  onClose,
}) {
  if (!open) return null;

  return (
    <ModalContainer
      title={initialData ? "Edit World" : "Create a New World"}
      onClose={onClose}
      className="max-w-2xl"
    >
      <WorldForm
        initialData={initialData}
        onSubmit={onSubmit}
        loading={loading}
        error={error}
        worlds={worlds}
        onCancel={onClose}
      />
    </ModalContainer>
  );
}
