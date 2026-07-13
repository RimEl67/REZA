import React from "react";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = "Êtes-vous sûr ?",
  description = "Cette action est irréversible.",
  confirmLabel,
  cancelLabel,
  confirmText,
  cancelText,
  variant,
  loading = false,
  onConfirm,
  onOpenChange,
}) => {
  const finalConfirmLabel = confirmText || confirmLabel || "Confirmer";
  const finalCancelLabel = cancelText || cancelLabel || "Annuler";
  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  const handleConfirm = async () => {
    if (loading) return;
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
        {description && (
          <p className="text-sm text-gray-600 mb-5 whitespace-pre-line">
            {description}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {finalCancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-full text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              variant === 'destructive' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Chargement...' : finalConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;


