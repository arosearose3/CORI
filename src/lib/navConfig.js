// src/lib/navConfig.js
// { label: 'All Organizations', path: '/avail/admin/organizations', subject: 'AllOrganizations' },
export const navItems = [

  {
    label: 'Clients',
    icon: '⚙️',
    path: '/avail/clients/provider',
    subject: 'Provider Clients',

  },
  {
    label: 'Organization Clients',
    icon: '⚙️',
    path: '/avail/clients/orgadmin',
    subject: 'Organization Clients',

  },
  {
    label: 'Cori Clients',
    icon: '⚙️',
    path: '/avail/clients/admin',
    subject: 'Cori Clients',

  },
  {
    label: 'Organization Staff',
    icon: '⚙️',
    path: '/avail/staff/admin',
    subject: 'Organization Staff',

  },
  {
    label: 'Organization Admin',
    icon: '⚙️',
    path: '/avail/staff/orgadmin',
    subject: 'Organization Admin',

  },
  {
    label: 'Cori Staff',
    icon: '⚙️',
    path: '/avail/staff/admin',
    subject: 'Cori Staff',

  },
  {
    label: 'Settings',
    icon: '⚙️',
    path: '/avail/usersettings',
    subject: 'User Settings',
    subItems: [
      { label: 'SMS', path: '/settings/sms', subject: 'SMSSettings' },
      { label: 'Email', path: '/settings/email', subject: 'EmailSettings' },
      { label: 'Government Name', path: '/settings/govt-name', subject: 'GovernmentName' },
      { label: 'Preferred Name', path: '/settings/preferred-name', subject: 'PreferredName' },
      { label: 'Pronouns', path: '/settings/pronouns', subject: 'Pronouns' },
      { label: 'Demo Data', path: '/settings/demo-data', subject: 'DemoData' },
    ]
  },
  {
    label: 'Consents',
    icon: '✅',
    path: '/avail/consents',
    subject: 'Consents',
    subItems: [
      { label: 'SMS Consents', path: '/consents/sms', subject: 'SMSConsents' },
      { label: 'Email Consents', path: '/consents/email', subject: 'EmailConsents' },
      { label: 'ROIs', path: '/consents/rois', subject: 'ROIs' },
    ]
  },
  {
    label: 'Organization Search',
    icon: '🔍',
    path: '/avail/organizationsearch',
    subject: 'OrganizationSearch',
  },
  {
    label: 'Notifications',
    icon: '🔔',
    path: '/avail/notifications',
    subject: 'Notifications',
    subItems: [
      { label: 'Read Notifications', path: '/notifications/read', subject: 'ReadNotifications' },
      { label: 'Delete Notifications', path: '/notifications/delete', subject: 'DeleteNotifications' },
    ]
  },
  {
    label: 'Messages',
    icon: '✉️',
    path: '/avail/messages',
    subject: 'Messages',
    subItems: [
      { label: 'Create Message', path: '/messages/create', subject: 'CreateMessage' },
      { label: 'Read Messages', path: '/messages/read', subject: 'ReadMessages' },
      { label: 'Reply Message', path: '/messages/reply', subject: 'ReplyMessage' },
      { label: 'Forward Message', path: '/messages/forward', subject: 'ForwardMessage' },
      { label: 'Delete Message', path: '/messages/delete', subject: 'DeleteMessage' },
    ]
  },
  {
    label: 'Capacity and Availability',
    icon: '✉️',
    path: '/avail/capacity',
    subject: 'Capacity',

  },
  {
    label: 'Referrals',
    icon: '📄',
    path: '/avail/referrals',
    subject: 'Referrals',
    subItems: [
      { label: 'Create Referral', path: '/avail/referrals/create', subject: 'CreateReferral' },
      { label: 'Delete Referral', path: '/avail/referrals/delete', subject: 'DeleteReferral' },
      { label: 'Referral History', path: '/avail/referrals/history', subject: 'ReferralHistory' },
      { label: 'Revoke Consents', path: '/avail/referrals/revoke-consents', subject: 'RevokeConsents' },
      { label: 'Leave Referral', path: '/avail/referrals/leave', subject: 'LeaveReferral' },
      { label: 'Own Records', path: '/avail/referrals/own-records', subject: 'OwnRecords' },
      { label: 'Insurance Info', path: '/avail/referrals/insurance-info', subject: 'InsuranceInfo' },
    ]
  },
  {
    label: 'Admin',
    icon: '🛠️',
    path: '/avail/admin/organizations',
    subject: 'Admin',
    subItems: [
      { label: 'All Organizations', path: '/avail/admin/organizations', subject: 'AllOrganizations' },
      { label: 'All Staff', path: '/avail/admin/staff', subject: 'AllStaff' },
      { label: 'All Referrals', path: '/avail/admin/referrals', subject: 'AllReferrals' },
    ]
  },
];
