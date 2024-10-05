import { base } from '$app/paths'; // Import the base path

export const navItems = [
  {
    label: 'Clients',
    icon: '⚙️',
    path: `${base}/clients/provider`,
    subject: 'Provider Clients',
    roles: ['provider', 'admin'], // Accessible by provider and admin roles
  },
  {
    label: 'Clients',
    icon: '⚙️',
    path: `${base}/clients/orgadmin`,
    subject: 'Organization Clients',
    roles: ['orgadmin', 'admin'], // Accessible by orgadmin and admin roles
  },
  {
    label: 'Cori Clients',
    icon: '⚙️',
    path: `${base}/clients/admin`,
    subject: 'Cori Clients',
    roles: ['admin'], // Accessible only by admin
  },
  {
    label: 'Staff',
    icon: '⚙️',
    path: `${base}/staff/orgadmin`,
    subject: 'Organization Staff',
    roles: ['orgadmin'], // Accessible by orgadmin and admin roles
  },
  {
    label: 'Organization Settings',
    icon: '⚙️',
    path: `${base}/staff/orgadmin`,
    subject: 'Organization Settings',
    roles: ['orgadmin', 'admin'], // Accessible by orgadmin and admin roles
  },
  {
    label: 'All Cori Staff',
    icon: '⚙️',
    path: `${base}/staff/admin`,
    subject: 'Cori Staff',
    roles: ['admin'], // Accessible only by admin
  },
  {
    label: 'Settings',
    icon: '⚙️',
    path: `${base}/settings/admin`,
    subject: 'Admin Settings',
    roles: ['admin'], // Accessible by multiple roles

  },
  {
    label: 'Settings',
    icon: '⚙️',
    path: `${base}/settings/org`,
    subject: 'Org Settings',
    roles: ['orgadmin'], // Accessible by multiple roles

  },
  {
    label: 'Settings',
    icon: '⚙️',
    path: `${base}/settings/provider`,
    subject: 'Provider Settings',
    roles: ['provider'], // Accessible by multiple roles

  },
  {
    label: 'Settings',
    icon: '⚙️',
    path: `${base}/settings/client`,
    subject: 'Client Settings',
    roles: ['client'], // Accessible by multiple roles

  },
  
  {
    label: 'Consents',
    icon: '✅',
    path: `${base}/consents`,
    subject: 'Consents',
    roles: ['client', 'provider', 'orgadmin','admin'],

  },
  {
    label: 'Organization Search',
    icon: '🔍',
    path: `${base}/organizationsearch`,
    subject: 'Organization Search',
    roles: ['provider', 'admin', 'orgadmin'],
  },
  {
    label: 'Notifications',
    icon: '🔔',
    path: `${base}/notifications`,
    subject: 'Notifications',
    roles: ['client','orgadmin', 'admin', 'provider'],

  },
  {
    label: 'Messages',
    icon: '✉️',
    path: `${base}/messages`,
    subject: 'Messages',
    roles: ['client', 'provider','orgadmin', 'admin'],
  },
  {
    label: 'Capacity and Availability',
    icon: '✉️',
    path: `${base}/capacity`,
    subject: 'Capacity',
    roles: ['provider', 'admin'], // Accessible by provider and admin roles
  },
  {
    label: 'Staff Capacity and Availability',
    icon: '✉️',
    path: `${base}/org/capacity`,
    subject: 'Capacity',
    roles: ['orgadmin'], // Accessible by provider and admin roles
  },
  {
    label: 'Referrals',
    icon: '📄',
    path: `${base}/referrals`,
    subject: 'Referrals',
    roles: ['client', 'provider','org admin', 'admin'],

  },
  {
    label: 'All Cori Organizations',
    icon: '🛠️',
    path: `${base}/admin/organizations`,
    subject: 'Admin',
    roles: ['admin'], // Accessible only by admin

  },
];
