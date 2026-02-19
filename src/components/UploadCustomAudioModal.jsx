import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Upload, Loader } from 'lucide-react';
import { axiosInstance } from '../services/api';
import { fetchUserChannels, selectUserChannels } from '../store/slices/channelSlice';
import SimpleChannelSelectionModal from '../pages/user/SimpleChannelSelectionModal';

const ACR_BUCKETS_PATH = '/acr-cloud/buckets/';
const ACR_UPLOAD_URL = '/acr-cloud/upload-file/';

const UploadCustomAudioModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const userChannels = useSelector(selectUserChannels);
    const channelId = localStorage.getItem('channelId');
    const [, setChannelSelectedVersion] = useState(0);
    const justSelectedChannelRef = useRef(false);

    const [submitting, setSubmitting] = useState(false);
    const [buckets, setBuckets] = useState([]);
    const [bucketsLoading, setBucketsLoading] = useState(false);
    const [bucketsError, setBucketsError] = useState(null);
    const [formData, setFormData] = useState({
        file: null,
        title: '',
        bucketId: ''
    });
    const [errors, setErrors] = useState({});
    const [filePreview, setFilePreview] = useState(null);

    // When no channel: fetch user channels for the selection modal
    useEffect(() => {
        if (isOpen && !channelId && userChannels.length === 0) {
            dispatch(fetchUserChannels());
        }
    }, [isOpen, channelId, userChannels.length, dispatch]);

    // Fetch ACR buckets only when modal is open and we have a channel (with channel_id)
    useEffect(() => {
        if (!isOpen || !channelId) return;
        setBucketsLoading(true);
        setBucketsError(null);
        const url = `${ACR_BUCKETS_PATH}?channel_id=${encodeURIComponent(channelId)}`;
        axiosInstance.get(url)
            .then((res) => {
                const data = res.data?.data;
                setBuckets(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                setBucketsError(err.response?.data?.message || err.message || 'Failed to load ACR buckets');
                setBuckets([]);
            })
            .finally(() => setBucketsLoading(false));
    }, [isOpen, channelId]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.file) newErrors.file = 'File is required';
        if (!formData.title || formData.title.trim() === '') newErrors.title = 'Title is required';
        if (!formData.bucketId) newErrors.bucketId = 'Please select an ACR bucket';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Channel selection modal: only close ACR modal when user cancels, not when they select
    const handleChannelModalClose = () => {
        if (justSelectedChannelRef.current) {
            justSelectedChannelRef.current = false;
            return;
        }
        onClose();
    };
    const handleChannelSelect = () => {
        justSelectedChannelRef.current = true;
        setChannelSelectedVersion((n) => n + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const channelId = localStorage.getItem('channelId');
        if (!channelId) return;

        setSubmitting(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('file', formData.file);

            const params = new URLSearchParams({
                bucket_id: formData.bucketId,
                title: formData.title.trim(),
                channel_id: channelId
            });

            const response = await axiosInstance.post(
                `${ACR_UPLOAD_URL}?${params.toString()}`,
                formDataToSend,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            if (response.data?.success !== false) {
                alert('Audio file uploaded to ACR Cloud successfully!');
                handleClose();
            } else {
                alert(response.data?.message || 'Upload completed but response was not successful.');
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
        setFormData({ file: null, title: '', bucketId: '' });
        setErrors({});
        setFilePreview(null);
        onClose();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData((prev) => ({ ...prev, file }));
            setFilePreview(file.name);
            if (errors.file) setErrors((prev) => ({ ...prev, file: '' }));
        }
    };

    if (!isOpen) return null;

    // No channel selected: show channel selection modal first (same UX as General Settings)
    if (!channelId) {
        return (
            <SimpleChannelSelectionModal
                isOpen={true}
                onClose={handleChannelModalClose}
                onChannelSelect={handleChannelSelect}
                channels={userChannels}
                title="Select a Channel"
                description="Choose a channel to upload ACR custom audio to"
            />
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
        >
            <div
                className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={handleClose}
            />
            <div
                className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0 z-10">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                            <Upload className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">ACR Custom File Upload</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={submitting}
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* ACR Bucket dropdown */}
                    <div>
                        <label htmlFor="bucketId" className="block text-sm font-semibold text-gray-700 mb-2">
                            ACR Bucket <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="bucketId"
                            name="bucketId"
                            value={formData.bucketId}
                            onChange={handleChange}
                            disabled={submitting || bucketsLoading}
                            className={`w-full px-4 py-2.5 border ${errors.bucketId ? 'border-red-500' : 'border-gray-300'
                                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white`}
                        >
                            <option value="">Select a bucket...</option>
                            {buckets.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.id} · {b.region || '—'} · {b.name || 'Unnamed'}
                                </option>
                            ))}
                        </select>
                        {bucketsLoading && (
                            <p className="mt-1 text-sm text-gray-500">Loading buckets...</p>
                        )}
                        {bucketsError && (
                            <p className="mt-1 text-sm text-red-500">{bucketsError}</p>
                        )}
                        {errors.bucketId && (
                            <p className="mt-1 text-sm text-red-500">{errors.bucketId}</p>
                        )}
                    </div>

                    {/* File Upload */}
                    <div>
                        <label htmlFor="file" className="block text-sm font-semibold text-gray-700 mb-2">
                            Audio File <span className="text-red-500">*</span>
                        </label>
                        <label className="block cursor-pointer">
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
                                } rounded-lg focus-within:ring-2 focus-within:ring-blue-500 bg-white hover:bg-gray-50 flex items-center justify-between`}>
                                <span className="text-sm text-gray-600">
                                    {filePreview || 'Choose audio file...'}
                                </span>
                                <Upload className="w-4 h-4 text-gray-400" />
                            </div>
                        </label>
                        {errors.file && (
                            <p className="mt-1 text-sm text-red-500">{errors.file}</p>
                        )}
                    </div>

                    {/* Title */}
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

                    <div className="flex justify-end gap-3 pt-4">
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
                            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Upload
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
