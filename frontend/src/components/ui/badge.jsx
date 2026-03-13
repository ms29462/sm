const Badge = ({ count, className = '' }) => {
  if (!count || count === 0) return null;

  return (
    <span
      className={`absolute -top-1 -right-1 bg-primary text-black text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default Badge;