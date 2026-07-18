import React from "react";

export default function Tabs({ users, activeId, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {users.map((u) => (
        <button
          key={u.id}
          onClick={() => onSelect(u.id)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition ${
            activeId === u.id
              ? "bg-ink text-white border-ink"
              : "bg-white text-ink/70 border-ink/15 hover:border-ink/40"
          }`}
        >
          {u.label}
        </button>
      ))}
    </div>
  );
}
