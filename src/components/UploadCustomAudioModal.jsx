import React, { useState, useEffect } from 'react';
import { X, Upload, Loader } from 'lucide-react';
import { axiosInstance } from '../services/api';

const UploadCustomAudioModal = ({ isOpen, onClose }) => {
    const [buckets, setBuckets] = useState([]);
    const [loadingBuckets, setLoadingBuckets] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        bucket_id: '',
        url: '',
        title: ''
    });
    const [errors, setErrors] = useState({});

    // Fetch buckets when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchBuckets();
        }
    }, [isOpen]);

    const fetchBuckets = async () => {
        setLoadingBuckets(true);
        try {
            console.log('Fetching ACR Cloud buckets...');
            const response = await axiosInstance.get('/acr-cloud/buckets/');
            console.log('Buckets response:', response.data);
            setBuckets(response.data.data || []);
        } catch (error) {
            console.error('Error fetching buckets:', error);
            console.error('Error response:', error.response?.data);
            alert(`Failed to load buckets: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoadingBuckets(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.bucket_id) {
            newErrors.bucket_id = 'Bucket is required';
        }

        if (!formData.url) {
            newErrors.url = 'URL is required';
        } else if (!isValidUrl(formData.url)) {
            newErrors.url = 'Please enter a valid URL';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        try {
            const params = new URLSearchParams({
                bucket_id: formData.bucket_id,
                url: formData.url
            });

            if (formData.title) {
                params.append('title', formData.title);
            }

            const response = await axiosInstance.post(
                `/acr-cloud/upload-file/?${params.toString()}`,
                {}
            );

            // Success - close modal and reset form
            alert('Audio file uploaded successfully!');
            handleClose();
        } catch (error) {
            console.error('Error uploading audio file:', error);
            alert(error.response?.data?.message || 'Failed to upload audio file. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({
            bucket_id: '',
            url: '',
            title: ''
        });
        setErrors({});
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
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
                    {/* Bucket Dropdown */}
                    <div>
                        <label htmlFor="bucket_id" className="block text-sm font-semibold text-gray-700 mb-2">
                            Bucket <span className="text-red-500">*</span>
                        </label>
                        {loadingBuckets ? (
                            <div className="flex items-center justify-center py-3 text-gray-500">
                                <Loader className="w-5 h-5 animate-spin mr-2" />
                                Loading buckets...
                            </div>
                        ) : (
                            <select
                                id="bucket_id"
                                name="bucket_id"
                                value={formData.bucket_id}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 border ${errors.bucket_id ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                                disabled={submitting}
                            >
                                <option value="">Select a bucket</option>
                                {buckets.map((bucket) => (
                                    <option key={bucket.id} value={bucket.id}>
                                        {bucket.name} (ID: {bucket.id})
                                    </option>
                                ))}
                            </select>
                        )}
                        {errors.bucket_id && (
                            <p className="mt-1 text-sm text-red-500">{errors.bucket_id}</p>
                        )}
                    </div>

                    {/* URL Input */}
                    <div>
                        <label htmlFor="url" className="block text-sm font-semibold text-gray-700 mb-2">
                            URL <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="url"
                            name="url"
                            value={formData.url}
                            onChange={handleChange}
                            placeholder="https://example.com/audio.mp3"
                            className={`w-full px-4 py-2.5 border ${errors.url ? 'border-red-500' : 'border-gray-300'
                                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                            disabled={submitting}
                        />
                        {errors.url && (
                            <p className="mt-1 text-sm text-red-500">{errors.url}</p>
                        )}
                    </div>

                    {/* Title Input */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                            Title <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="My Audio File"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            disabled={submitting}
                        />
                    </div>

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
