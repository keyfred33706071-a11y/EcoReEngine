export default function VerifiedBadge() {
  return (
    <svg className="w-4 h-4 inline-block ml-0.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="11" fill="#3b82f6" />
      <circle cx="12" cy="12" r="9.5" stroke="white" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M7 12.5l3 3 7-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
