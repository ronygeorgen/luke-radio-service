/** System admin or channel admin — can use admin menu and /admin routes */
export const hasAdminMenuAccess = (user) => Boolean(user?.isAdmin || user?.isChannelAdmin);

/** General Settings — system admin only */
export const canAccessGeneralSettings = (user) => Boolean(user?.isAdmin);

/** User Management — system admin only */
export const canAccessUserManagement = (user) => Boolean(user?.isAdmin);
