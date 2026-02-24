import React, { useState, useEffect } from 'react';
import { X, Upload, Loader } from 'lucide-react';
import { axiosInstance } from '../services/api';

const ACRCustomFileUploadModal = ({ isOpen, onClose, channelId }) => {
    const [submitting, setSubmitting] = useState(false);
    const [loadingBuckets, setLoadingBuckets] = useState(false);
    const [buckets, setBuckets] = useState([]);
    const [formData, setFormData] = useState({
        bucket_id: '',
        url: '',
        title: ''
    });
    const [errors, setErrors] = useState({});

    const effectiveChannelId = channelId || localStorage.getItem('channelId');

    useEffect(() => {
        if (isOpen && effectiveChannelId) {
            setLoadingBuckets(true);
            axiosInstance
                .get('/acr-cloud/buckets/', { params: { channel_id: effectiveChannelId } })
                .then((res) => {
                    const list = Array.isArray(res.data) ? res.data : res.data?.results || res.data?.data || [];
                    setBuckets(list);
                    if (list.length && !formData.bucket_id) {
                        const firstId = list[0].id ?? list[0].bucket_id ?? list[0];
                        setFormData((prev) => ({ ...prev, bucket_id: String(firstId) }));
                    }
                })
                .catch((err) => {
                    console.error('Failed to load ACR buckets', err);
                    setBuckets([]);
                })
                .finally(() => setLoadingBuckets(false));
        }
    }, [isOpen, effectiveChannelId]);

    const validate = () => {
        const next = {};
        if (!formData.bucket_id) next.bucket_id = 'Select a bucket';
        if (!formData.url?.trim()) next.url = 'URL is required';
        if (!formData.title?.trim()) next.title = 'Title is required';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate() || !effectiveChannelId) return;
        setSubmitting(true);
        try {
            await axiosInstance.post('/acr-cloud/upload-file/', null, {
                params: {
                    bucket_id: formData.bucket_id,
                    url: formData.url.trim(),
                    title: formData.title.trim(),
                    channel_id: effectiveChannelId
                }
            });
            alert('File uploaded successfully.');
            handleClose();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Upload failed.';
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({ bucket_id: '', url: '', title: '' });
        setErrors({});
        onClose();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={handleClose} />
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
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" disabled={submitting}>
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {!effectiveChannelId ? (
                    <div className="p-6 text-sm text-gray-600">Select a channel first.</div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div>
                            <label htmlFor="bucket_id" className="block text-sm font-semibold text-gray-700 mb-2">
                                ACR Bucket <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="bucket_id"
                                name="bucket_id"
                                value={formData.bucket_id}
                                onChange={handleChange}
                                disabled={loadingBuckets || submitting}
                                className={`w-full px-4 py-2.5 border ${errors.bucket_id ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            >
                                <option value="">{loadingBuckets ? 'Loading...' : 'Select bucket'}</option>
                                {buckets.map((b) => {
                                    const id = b.id ?? b.bucket_id;
                                    const label = b.name ?? b.title ?? String(id);
                                    return (
                                        <option key={id} value={id}>
                                            {label}
                                        </option>
                                    );
                                })}
                            </select>
                            {errors.bucket_id && <p className="mt-1 text-sm text-red-500">{errors.bucket_id}</p>}
                        </div>

                        <div>
                            <label htmlFor="url" className="block text-sm font-semibold text-gray-700 mb-2">
                                URL <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="url"
                                id="url"
                                name="url"
                                value={formData.url}
                                onChange={handleChange}
                                placeholder="https://example.com/audio.mp3"
                                disabled={submitting}
                                className={`w-full px-4 py-2.5 border ${errors.url ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                            {errors.url && <p className="mt-1 text-sm text-red-500">{errors.url}</p>}
                        </div>

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
                                disabled={submitting}
                                className={`w-full px-4 py-2.5 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                        </div>

                        <div className="flex items-center justify-end space-x-3 pt-4">
                            <button type="button" onClick={handleClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg" disabled={submitting}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={submitting || loadingBuckets}
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
                )}
            </div>
        </div>
    );
};

export default ACRCustomFileUploadModal;
