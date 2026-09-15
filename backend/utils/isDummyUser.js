/**
 * Visual Vault - Dummy/Seed Account Filter
 * Identifies the built-in demo accounts (used to make the app browsable
 * out-of-the-box) so they can be excluded from public creator listings.
 */

export const isDummyUser = (u) => {
  if (!u) return true;
  const id = String(u._id || u.id || '');
  const email = String(u.email || '').toLowerCase();
  const name = String(u.name || '').toLowerCase();
  return (
    id.startsWith('usr_creator_') ||
    id.startsWith('usr_demo_') ||
    email.endsWith('@visualvault.io') ||
    name === 'marcus vance' ||
    name === 'elena rostova'
  );
};
