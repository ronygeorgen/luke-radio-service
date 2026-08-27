import { useEffect, useState } from 'react';
import { X, Plus, Trash2, Mail, Bell } from 'lucide-react';
import { fetchAcrSyncAlertSettings, saveAcrSyncAlertSettings } from '../services/acrSyncAlertApi';

const EMAIL_PATTERN = /\S+@\S+\.\S+/;

const AcrSyncAlertModal = ({ isOpen, onClose, channelId, onSuccess, onError }) => {
  const [emails, setEmails] = useState(['']);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !channelId) return;

    let cancelled = false;
    setErrors({});
    setIsLoading(true);

    fetchAcrSyncAlertSettings(channelId)
      .then((data) => {
        if (cancelled) return;
        const nextEmails = Array.isArray(data?.emails) && data.emails.length > 0
          ? data.emails
          : [''];
        setEmails(nextEmails);
      })
      .catch((err) => {
        if (cancelled) return;
        setEmails(['']);
        onError?.(err || 'Failed to load ACR Cloud alert settings.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, channelId]);

  if (!isOpen) return null;

  const handleEmailChange = (index, value) => {
    setEmails((prev) => prev.map((email, i) => (i === index ? value : email)));
    if (errors.emails) {
      setErrors((prev) => ({ ...prev, emails: '' }));
    }
  };

  const handleAddEmail = () => {
    setEmails((prev) => [...prev, '']);
  };

  const handleRemoveEmail = (index) => {
    setEmails((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const validate = () => {
    const nextErrors = {};
    const trimmed = emails.map((email) => email.trim()).filter(Boolean);

    if (trimmed.length === 0) {
      nextErrors.emails = 'Add at least one email address.';
    } else {
      const invalid = trimmed.filter((email) => !EMAIL_PATTERN.test(email));
      if (invalid.length > 0) {
        nextErrors.emails = 'Enter a valid email address for every field.';
      } else if (new Set(trimmed.map((email) => email.toLowerCase())).size !== trimmed.length) {
        nextErrors.emails = 'Remove duplicate email addresses.';
      }
    }

    setErrors(nextErrors);
    return { isValid: Object.keys(nextErrors).length === 0, trimmed };
  };

  const handleSave = async () => {
    const { isValid, trimmed } = validate();
    if (!isValid) return;

    setIsSaving(true);
    try {
      await saveAcrSyncAlertSettings(channelId, {
        emails: trimmed,
      });
      onSuccess?.('ACR Cloud sync alert settings saved. Backend wiring is still pending.');
      onClose();
    } catch (err) {
      onError?.(err || 'Failed to save ACR Cloud alert settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isSaving) return;
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
      onClick={(e) => e.target === e.currentTarget && handleCancel()}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-amber-50 p-2 text-amber-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">ACR Cloud sync alerts</h3>
              <p className="text-sm text-gray-500 mt-1">
                Send email alerts when this channel has not received ACR Cloud data for too long.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert emails
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Add one or more addresses that should receive delay alerts.
              </p>
              <div className="space-y-2">
                {emails.map((email, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => handleEmailChange(index, e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(index)}
                      disabled={emails.length <= 1}
                      className="flex items-center justify-center w-9 h-9 rounded-md text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
                      aria-label="Remove email"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddEmail}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add another email
              </button>
              {errors.emails && <p className="mt-2 text-sm text-red-600">{errors.emails}</p>}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save alerts'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AcrSyncAlertModal;
