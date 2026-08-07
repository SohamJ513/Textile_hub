'use client';

export default function TextileDivider() {
  return (
    <div className="flex items-center gap-4 my-8">
      <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-textile-gold to-transparent" />
      <div className="text-2xl animate-float">🧵</div>
      <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-textile-gold to-transparent" />
    </div>
  );
}