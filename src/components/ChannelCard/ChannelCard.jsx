import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSelectedChannel } from '../../store/slices/channelSlice';

const ChannelCard = ({ channel }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleClick = () => {
    dispatch(setSelectedChannel(channel));
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    navigate(`/admin/channels/${channel.id}/segments?date=${today}&hour=0`);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}
    >
      <h3 className="text-lg font-semibold">{channel.name}</h3>
      <p className="text-gray-600">Channel ID: {channel.channel_id}</p>
      <p className="text-gray-600">Project ID: {channel.project_id}</p>
    </div>
  );
};

export default ChannelCard;