import { useEffect, useRef, useState } from 'react';
import { X, Plus, Trash2, Mail, Bell, User } from 'lucide-react';
import {
  fetchAcrSyncAlertSettings,
  saveAcrSyncAlertSettings,
  getMonitoringErrorMessage,
} from '../services/acrSyncAlertApi';

const EMAIL_PATTERN = /\S+@\S+\.\S+/;
const emptyRecipient = () => ({ email: '', name: '' });

const AcrSyncAlertModal = ({ isOpen, onClose, channelId, onSuccess, onError }) => {
  const [recipients, setRecipients] = useState([emptyRecipient()]);
  const [expectedSegmentsPerHour, setExpectedSegmentsPerHour] = useState(20);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const lowVolumeAlertEnabledRef = useRef(true);

  useEffect(() => {
    if (!isOpen || !channelId) return;

    let cancelled = false;
    setErrors({});
    setIsLoading(true);

    fetchAcrSyncAlertSettings(channelId)
      .then((data) => {
        if (cancelled) return;
        const nextRecipients = Array.isArray(data?.alert_recipients) && data.alert_recipients.length > 0
          ? data.alert_recipients.map((recipient) => ({
              email: recipient.email || '',
              name: recipient.name || '',
            }))
          : [emptyRecipient()];
        setRecipients(nextRecipients);
        setExpectedSegmentsPerHour(
          Number(data?.expected_segments_per_hour) > 0
            ? Number(data.expected_segments_per_hour)
            : 20
        );
        lowVolumeAlertEnabledRef.current = data?.low_volume_alert_enabled !== false;
      })
      .catch((err) => {
        if (cancelled) return;
        setRecipients([emptyRecipient()]);
        setExpectedSegmentsPerHour(20);
        lowVolumeAlertEnabledRef.current = true;
        const status = err?.response?.status;
        if (status && status !== 404 && status !== 405) {
          onError?.(getMonitoringErrorMessage(err, 'Failed to load monitoring alert settings.'));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, channelId]);

  if (!isOpen) return null;

  const handleRecipientChange = (index, field, value) => {
    setRecipients((prev) => prev.map((recipient, i) => (
      i === index ? { ...recipient, [field]: value } : recipient
    )));
    if (errors.recipients) {
      setErrors((prev) => ({ ...prev, recipients: '' }));
    }
  };

  const handleAddRecipient = () => {
    setRecipients((prev) => [...prev, emptyRecipient()]);
  };

  const handleRemoveRecipient = (index) => {
    setRecipients((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const validate = () => {
    const nextErrors = {};
    const trimmedRecipients = recipients
      .map((recipient) => ({
        email: recipient.email.trim(),
        name: recipient.name.trim(),
      }))
      .filter((recipient) => recipient.email || recipient.name);

    if (trimmedRecipients.length === 0) {
      nextErrors.recipients = 'Add at least one alert recipient.';
    } else if (trimmedRecipients.some((recipient) => !recipient.email)) {
      nextErrors.recipients = 'Each recipient needs an email address.';
    } else if (trimmedRecipients.some((recipient) => !EMAIL_PATTERN.test(recipient.email))) {
      nextErrors.recipients = 'Enter a valid email address for every recipient.';
    } else if (new Set(trimmedRecipients.map((recipient) => recipient.email.toLowerCase())).size !== trimmedRecipients.length) {
      nextErrors.recipients = 'Remove duplicate email addresses.';
    }

    const segments = Number(expectedSegmentsPerHour);
    if (!Number.isInteger(segments) || segments < 1) {
      nextErrors.expectedSegmentsPerHour = 'Enter a whole number of at least 1.';
    }

    setErrors(nextErrors);
    return { isValid: Object.keys(nextErrors).length === 0, trimmedRecipients, segments };
  };

  const handleSave = async () => {
    const { isValid, trimmedRecipients, segments } = validate();
    if (!isValid) return;

    setIsSaving(true);
    try {
      await saveAcrSyncAlertSettings(channelId, {
        expected_segments_per_hour: segments,
        low_volume_alert_enabled: lowVolumeAlertEnabledRef.current,
        alert_recipients: trimmedRecipients.map((recipient) => {
          const payload = { email: recipient.email };
          if (recipient.name) payload.name = recipient.name;
          return payload;
        }),
      });
      onSuccess?.('Monitoring alert settings saved.');
      onClose();
    } catch (err) {
      onError?.(getMonitoringErrorMessage(err, 'Failed to save monitoring alert settings.'));
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
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto"
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
                Choose who gets alert emails and how many segments this channel should produce each hour.
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
            <div className="mb-5">
              <label htmlFor="expectedSegmentsPerHour" className="block text-sm font-medium text-gray-700 mb-1">
                Expected segments per hour
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Used to detect a break in ACR Cloud syncing when volume drops.
              </p>
              <input
                id="expectedSegmentsPerHour"
                type="number"
                min={1}
                step={1}
                value={expectedSegmentsPerHour}
                onChange={(e) => {
                  setExpectedSegmentsPerHour(e.target.value);
                  if (errors.expectedSegmentsPerHour) {
                    setErrors((prev) => ({ ...prev, expectedSegmentsPerHour: '' }));
                  }
                }}
                className="w-36 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.expectedSegmentsPerHour && (
                <p className="mt-2 text-sm text-red-600">{errors.expectedSegmentsPerHour}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert recipients
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Add one or more people. Name is optional; email is required.
              </p>
              <div className="space-y-2">
                {recipients.map((recipient, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="relative flex-1 min-w-0">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={recipient.name}
                        onChange={(e) => handleRecipientChange(index, 'name', e.target.value)}
                        placeholder="Name (optional)"
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="relative flex-[1.3] min-w-0">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={recipient.email}
                        onChange={(e) => handleRecipientChange(index, 'email', e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient(index)}
                      disabled={recipients.length <= 1}
                      className="flex items-center justify-center w-9 h-9 rounded-md text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
                      aria-label="Remove recipient"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddRecipient}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add another recipient
              </button>
              {errors.recipients && <p className="mt-2 text-sm text-red-600">{errors.recipients}</p>}
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
