const LoadingSpinner = ({ message = "LOADING..." }) => {
  return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-primary text-xl font-heading animate-pulse">{message}</div>
    </div>
  );
};

export default LoadingSpinner;
