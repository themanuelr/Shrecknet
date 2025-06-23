import ModalContainer from "../template/modalContainer";
import WorldForm from "./WorldForm";
import { useTranslation } from "../hooks/useTranslation";

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
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <ModalContainer
      title={initialData ? t("edit_world") : t("create_new_world")}
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
