-- Enforce the MVP invariant "one librería per owner" at the DB level so a race
-- between two concurrent createOrganization calls can't create duplicates
-- (createOrganization also checks it in app code). Drop this constraint when
-- multi-store ownership (F3) is introduced.
alter table public.organizations
  add constraint organizations_owner_id_unique unique (owner_id);
