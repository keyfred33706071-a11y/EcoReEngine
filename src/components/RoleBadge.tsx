const ROLE_CONFIG: Record<string, { label: string; class: string }> = {
  owner: { label: 'Dueño', class: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
  admin: { label: 'Admin', class: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
  mod: { label: 'Mod', class: 'text-purple-400 bg-purple-500/15 border-purple-500/30' },
};

export default function RoleBadge({ role }: { role?: string }) {
  const config = role ? ROLE_CONFIG[role] : null;
  if (!config) return null;
  return (
    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${config.class}`}>
      {config.label}
    </span>
  );
}
