import React from 'react';
import { useDispatch } from 'react-redux';
import { clearError } from '../../store/slices/shiftManagementSlice';

const ErrorDisplay = ({ error }) => {
  const dispatch = useDispatch();

  if (!error) return null;

  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
      <strong>Error:</strong> {error.message || error.error || JSON.stringify(error)}
      <button
        onClick={() => dispatch(clearError())}
        className="float-right text-red-800 hover:text-red-900"
      >
        ×
      </button>
    </div>
  );
};

export default ErrorDisplay;