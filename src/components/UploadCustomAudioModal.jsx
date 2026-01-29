import React, { useState, useEffect } from 'react';
import { X, Upload, Loader } from 'lucide-react';
import { axiosInstance } from '../services/api';

const UploadCustomAudioModal = ({ isOpen, onClose, channelId }) => {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        file: null,
        title: '',
        notes: '',
        recorded_at: ''
    });
    const [errors, setErrors] = useState({});
    const [filePreview, setFilePreview] = useState(null);

    // Set default recorded_at to current date/time when modal opens
    useEffect(() => {
        if (isOpen) {
            const now = new Date().toISOString();
            setFormData(prev => ({
                ...prev,
                recorded_at: now
            }));
        }
    }, [isOpen]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.file) {
            newErrors.file = 'File is required';
        }

        if (!formData.title || formData.title.trim() === '') {
            newErrors.title = 'Title is required';
        }

        if (!channelId) {
            newErrors.channel_id = 'Channel ID is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        try {
            // Create FormData for multipart/form-data
            const formDataToSend = new FormData();
            formDataToSend.append('file', formData.file);
            formDataToSend.append('channel_id', channelId);
            formDataToSend.append('title', formData.title);
            
            if (formData.notes && formData.notes.trim() !== '') {
                formDataToSend.append('notes', formData.notes);
            }
            
            // Use provided recorded_at or current date/time
            const recordedAt = formData.recorded_at || new Date().toISOString();
            formDataToSend.append('recorded_at', recordedAt);

            const response = await axiosInstance.post(
                '/v2/custom-audio/download/',
                formDataToSend,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            // Success - close modal and reset form
            if (response.data.success) {
                alert('Audio file uploaded successfully!');
                handleClose();
            } else {
                alert('Upload completed but response was not successful.');
            }
        } catch (error) {
            console.error('Error uploading audio file:', error);
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.error ||
                               error.message ||
                               'Failed to upload audio file. Please try again.';
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({
            file: null,
            title: '',
            notes: '',
            recorded_at: ''
        });
        setErrors({});
        setFilePreview(null);
        onClose();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                file: file
            }));
            setFilePreview(file.name);
            // Clear error
            if (errors.file) {
                setErrors(prev => ({
                    ...prev,
                    file: ''
                }));
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div 
                className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0 z-10">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                            <Upload className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Upload Custom Audio</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={submitting}
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* File Upload */}
                    <div>
                        <label htmlFor="file" className="block text-sm font-semibold text-gray-700 mb-2">
                            Audio File <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center space-x-3">
                            <label className="flex-1 cursor-pointer">
                                <input
                                    type="file"
                                    id="file"
                                    name="file"
                                    accept="audio/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    disabled={submitting}
                                />
                                <div className={`w-full px-4 py-2.5 border ${errors.file ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all bg-white hover:bg-gray-50`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">
                                            {filePreview || 'Choose audio file...'}
                                        </span>
                                        <Upload className="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                            </label>
                        </div>
                        {errors.file && (
                            <p className="mt-1 text-sm text-red-500">{errors.file}</p>
                        )}
                    </div>

                    {/* Title Input */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="My Audio File"
                            className={`w-full px-4 py-2.5 border ${errors.title ? 'border-red-500' : 'border-gray-300'
                                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                            disabled={submitting}
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                        )}
                    </div>

                    {/* Notes Input */}
                    <div>
                        <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                            Notes <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Additional notes about this audio..."
                            rows={3}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                            disabled={submitting}
                        />
                    </div>

                    {/* Recorded At Input */}
                    <div>
                        <label htmlFor="recorded_at" className="block text-sm font-semibold text-gray-700 mb-2">
                            Recorded At <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                        </label>
                        <input
                            type="datetime-local"
                            id="recorded_at"
                            name="recorded_at"
                            value={formData.recorded_at ? new Date(formData.recorded_at).toISOString().slice(0, 16) : ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                // Convert to ISO string format
                                const isoString = value ? new Date(value).toISOString() : '';
                                setFormData(prev => ({
                                    ...prev,
                                    recorded_at: isoString
                                }));
                            }}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            disabled={submitting}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Defaults to current date and time if not provided
                        </p>
                    </div>

                    {errors.channel_id && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{errors.channel_id}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    <span>Uploading...</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    <span>Upload</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadCustomAudioModal;
