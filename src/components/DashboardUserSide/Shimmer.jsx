const Shimmer = ({ type = "default", className = "" }) => {
  const getShimmerClass = () => {
    switch (type) {
      case "card":
        return "h-32 rounded-xl";
      case "chart":
        return "h-64 rounded-xl";
      case "gauge":
        return "h-48 rounded-xl";
      case "text":
        return "h-4 rounded";
      default:
        return "rounded";
    }
  };

  return (
    <div 
      className={`${getShimmerClass()} ${className} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer`}
    />
  );
};

export default Shimmer;