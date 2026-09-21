import React, { useState, useEffect, useCallback } from 'react';
import { houseApi, type EnrichedMember } from '../services/houseApi';
import { MemberCard } from '../components/members/MemberCard';
import { AvatarLightbox } from '../components/members/AvatarLightbox';
import { AddVirtualModal } from '../components/members/AddVirtualModal';
import { AddPetModal } from '../components/members/AddPetModal';
import { AddAssetModal } from '../components/members/AddAssetModal';
import { EditAliasModal } from '../components/members/EditAliasModal';
import { InviteModal } from '../components/members/InviteModal';
import { PageHeader } from '../components/common/PageHeader';
import { CartoonIcon } from '../components/common/CartoonIcon';
import { useAuth } from '../context/AuthContext';
import type { House } from '../types';

interface MembersPageProps {
  activeHouse: House | null;
  isActionSheetOpen?: boolean;
  onCloseActionSheet?: () => void;
}

export const MembersPage: React.FC<MembersPageProps> = ({
  activeHouse,
  isActionSheetOpen,
  onCloseActionSheet,
}) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<EnrichedMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lightboxMember, setLightboxMember] = useState<EnrichedMember | null>(null);


  const [isAddVirtualOpen, setIsAddVirtualOpen] = useState(false);
  const [isAddPetOpen, setIsAddPetOpen] = useState(false);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editAliasMember, setEditAliasMember] = useState<EnrichedMember | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!activeHouse) return;
    setIsLoading(true);
    try {
      const res = await houseApi.listMembers(activeHouse.id);
      setMembers(res.members);
    } catch (_err) {
    } finally {
      setIsLoading(false);
    }
  }, [activeHouse]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleAddVirtual = async (data: { name: string; gender: 'MALE' | 'FEMALE' | 'OTHER'; themeColor: string }) => {
    if (!activeHouse) return;
    await houseApi.createVirtualMember(activeHouse.id, data);
    await fetchMembers();
  };

  const handleAddPet = async (data: { name: string; category: string; themeColor: string; metadata?: Record<string, any> }) => {
    if (!activeHouse) return;
    await houseApi.createEntity(activeHouse.id, {
      memberType: 'PET',
      name: data.name,
      category: data.category,
      themeColor: data.themeColor,
    });
    await fetchMembers();
  };

  const handleAddAsset = async (data: { name: string; category: string; themeColor: string; metadata?: Record<string, any> }) => {
    if (!activeHouse) return;
    await houseApi.createEntity(activeHouse.id, {
      memberType: 'ASSET',
      name: data.name,
      category: data.category,
      themeColor: data.themeColor,
    });
    await fetchMembers();
  };

  const handleInvite = async (phone: string, role: 'ADMIN' | 'MEMBER') => {
    if (!activeHouse) return;
    await houseApi.inviteMember(activeHouse.id, { phone, role });
    await fetchMembers();
  };

  const handleSetAlias = async (aliasName: string, relationshipTag: string) => {
    if (!activeHouse || !editAliasMember?.userId) return;
    await houseApi.setPerspectiveAlias(activeHouse.id, editAliasMember.userId, {
      aliasName,
      relationshipTag,
    });
    await fetchMembers();
  };

  if (!activeHouse) {
    return (
      <div className="p-6 text-center text-xs text-text-muted">
        กรุณาสร้างหรือเลือกบ้านก่อน
      </div>
    );
  }

  const people = members.filter((m) => m.memberType === 'PERSON' && !m.isVirtual);
  const virtuals = members.filter((m) => m.isVirtual);
  const pets = members.filter((m) => m.memberType === 'PET');
  const assets = members.filter((m) => m.memberType === 'ASSET');

  return (
    <div className="p-4 space-y-5 pb-20">
      <PageHeader
        title="สมาชิกในบ้าน"
        subtitle="คน สัตว์เลี้ยง ทรัพย์สิน และคนจำลอง"
        badge={`รวม ${members.length} รายการ`}
      />

      {isLoading && members.length === 0 ? (
        <div className="text-center py-8 text-xs text-text-muted">กำลังโหลดข้อมูล...</div>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
              คนในบ้าน ({people.length})
            </h2>
            <div className="space-y-2">
              {people.map((m) => (
                <MemberCard
                  key={m.id}
                  member={m}
                  isSelf={m.userId === user?.id}
                  onTapAvatar={() => setLightboxMember(m)}
                  onEditAlias={() => setEditAliasMember(m)}
                />
              ))}
            </div>
          </div>

          {virtuals.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                คนจำลอง ({virtuals.length})
              </h2>
              <div className="space-y-2">
                {virtuals.map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    onTapAvatar={() => setLightboxMember(m)}
                    onEditAlias={() => setEditAliasMember(m)}
                  />
                ))}
              </div>
            </div>
          )}

          {pets.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                สัตว์เลี้ยง ({pets.length})
              </h2>
              <div className="space-y-2">
                {pets.map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    onTapAvatar={() => setLightboxMember(m)}
                    onEditAlias={() => setEditAliasMember(m)}
                  />
                ))}
              </div>
            </div>
          )}

          {assets.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                ทรัพย์สินและสิ่งของ ({assets.length})
              </h2>
              <div className="space-y-2">
                {assets.map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    onTapAvatar={() => setLightboxMember(m)}
                    onEditAlias={() => setEditAliasMember(m)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <AvatarLightbox
        isOpen={!!lightboxMember}
        onClose={() => setLightboxMember(null)}
        imageUrl={lightboxMember?.avatarUrl}
        name={lightboxMember?.displayName || ''}
        themeColor={lightboxMember?.themeColor}
      />

      <AddVirtualModal
        isOpen={isAddVirtualOpen}
        onClose={() => setIsAddVirtualOpen(false)}
        onSubmit={handleAddVirtual}
      />

      <AddPetModal
        isOpen={isAddPetOpen}
        onClose={() => setIsAddPetOpen(false)}
        onSubmit={handleAddPet}
      />

      <AddAssetModal
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        onSubmit={handleAddAsset}
      />

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSubmit={handleInvite}
      />

      <EditAliasModal
        isOpen={!!editAliasMember}
        onClose={() => setEditAliasMember(null)}
        targetName={editAliasMember?.name || ''}
        initialAlias={editAliasMember?.perspectiveAlias}
        initialTag={editAliasMember?.relationshipTag}
        onSubmit={handleSetAlias}
      />

      {/* Action Sheet when Center (+) is tapped on Members page (SPEC 4.2) */}
      {isActionSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in"
          onClick={onCloseActionSheet}
        >
          <div
            className="w-full max-w-sm bg-surface rounded-3xl p-4 shadow-xl border border-surface-muted space-y-2 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center pb-2 border-b border-surface-muted">
              <span className="text-xs font-bold text-text-main">เพิ่มสมาชิกหรือสิ่งของในบ้าน</span>
            </div>
            <button
              onClick={() => {
                onCloseActionSheet?.();
                setIsInviteOpen(true);
              }}
              className="w-full p-3 rounded-2xl bg-surface-subtle hover:bg-surface-muted text-text-main text-xs font-semibold flex items-center gap-3 transition"
            >
              <CartoonIcon name="person" size={24} />
              <span>เชิญคนเข้าบ้าน</span>
            </button>
            <button
              onClick={() => {
                onCloseActionSheet?.();
                setIsAddPetOpen(true);
              }}
              className="w-full p-3 rounded-2xl bg-surface-subtle hover:bg-surface-muted text-text-main text-xs font-semibold flex items-center gap-3 transition"
            >
              <CartoonIcon name="pet" size={24} />
              <span>เพิ่มสัตว์เลี้ยง</span>
            </button>
            <button
              onClick={() => {
                onCloseActionSheet?.();
                setIsAddAssetOpen(true);
              }}
              className="w-full p-3 rounded-2xl bg-surface-subtle hover:bg-surface-muted text-text-main text-xs font-semibold flex items-center gap-3 transition"
            >
              <CartoonIcon name="asset" size={24} />
              <span>เพิ่มทรัพย์สิน</span>
            </button>
            <button
              onClick={() => {
                onCloseActionSheet?.();
                setIsAddVirtualOpen(true);
              }}
              className="w-full p-3 rounded-2xl bg-surface-subtle hover:bg-surface-muted text-text-main text-xs font-semibold flex items-center gap-3 transition"
            >
              <CartoonIcon name="virtual" size={24} />
              <span>เพิ่มคนจำลอง</span>
            </button>
            <button
              onClick={onCloseActionSheet}
              className="w-full py-2.5 rounded-2xl bg-surface border border-surface-muted text-text-muted text-xs font-medium text-center mt-2"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

