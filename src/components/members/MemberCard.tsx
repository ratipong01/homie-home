import React from 'react';
import type { EnrichedMember } from '../../services/houseApi';

interface MemberCardProps {
  member: EnrichedMember;
  isSelf?: boolean;
  onTapAvatar: () => void;
  onEditAlias: () => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  isSelf = false,
  onTapAvatar,
  onEditAlias,
}) => {
  const getBadge = () => {
    if (member.role === 'OWNER') return { text: 'ผู้สร้าง', bg: 'bg-orange-100 text-orange-800' };
    if (member.role === 'ADMIN') return { text: 'ผู้ดูแล', bg: 'bg-blue-100 text-blue-800' };
    if (member.isVirtual) return { text: 'คนจำลอง', bg: 'bg-purple-100 text-purple-800' };
    if (member.memberType === 'PET') return { text: 'สัตว์เลี้ยง', bg: 'bg-amber-100 text-amber-800' };
    if (member.memberType === 'ASSET') return { text: 'ทรัพย์สิน', bg: 'bg-blue-100 text-blue-800' };
    if (member.isPlaceholder) return { text: 'รอตอบรับ', bg: 'bg-gray-100 text-gray-700' };
    return { text: 'สมาชิก', bg: 'bg-stone-100 text-stone-700' };
  };

  const badge = getBadge();

  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-surface-muted shadow-sm">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onTapAvatar}
          className="relative active:scale-95 transition-transform"
        >
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.displayName}
              className="w-12 h-12 rounded-full aspect-square object-cover border border-surface-muted"
            />
          ) : (
            <div
              style={{ backgroundColor: member.themeColor || '#F97316' }}
              className="w-12 h-12 rounded-full aspect-square flex items-center justify-center text-white font-black text-sm shadow-sm"
            >
              {member.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </button>

        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-xs font-bold text-text-main">
              {isSelf ? `${member.displayName} (ฉัน)` : member.displayName}
            </h4>
            {member.perspectiveAlias && (
              <span className="text-[10px] text-text-muted">({member.name})</span>
            )}
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${badge.bg}`}>
              {badge.text}
            </span>
          </div>
          {isSelf ? (
            <span className="text-[10px] text-brand-primary font-semibold">
              #ฉัน
            </span>
          ) : member.relationshipTag ? (
            <span className="text-[10px] text-brand-primary font-medium">
              #{member.relationshipTag}
            </span>
          ) : null}
          {member.invitedPhone && !member.userId && (
            <span className="text-[10px] text-text-muted block">
              เบอร์: {member.invitedPhone}
            </span>
          )}
        </div>
      </div>

      {member.userId && !isSelf && (
        <button
          type="button"
          onClick={onEditAlias}
          className="text-xs text-text-muted hover:text-brand-primary p-1.5 active:scale-95 transition"
          title="ตั้งชื่อเรียกเฉพาะตัว"
        >
          ✏️
        </button>
      )}
    </div>
  );
};
