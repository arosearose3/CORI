// src/lib/navConfig.js
// { label: 'All Organizations', path: '/avail/admin/organizations', subject: 'AllOrganizations' },
export const navItems = [
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
    path: '/consents',
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
    path: '/organizations',
    subject: 'OrganizationSearch',
  },
  {
    label: 'Notifications',
    icon: '🔔',
    path: '/notifications',
    subject: 'Notifications',
    subItems: [
      { label: 'Read Notifications', path: '/notifications/read', subject: 'ReadNotifications' },
      { label: 'Delete Notifications', path: '/notifications/delete', subject: 'DeleteNotifications' },
    ]
  },
  {
    label: 'Messages',
    icon: '✉️',
    path: '/messages',
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
    path: '/referrals',
    subject: 'Referrals',
    subItems: [
      { label: 'Create Referral', path: '/referrals/create', subject: 'CreateReferral' },
      { label: 'Delete Referral', path: '/referrals/delete', subject: 'DeleteReferral' },
      { label: 'Referral History', path: '/referrals/history', subject: 'ReferralHistory' },
      { label: 'Revoke Consents', path: '/referrals/revoke-consents', subject: 'RevokeConsents' },
      { label: 'Leave Referral', path: '/referrals/leave', subject: 'LeaveReferral' },
      { label: 'Own Records', path: '/referrals/own-records', subject: 'OwnRecords' },
      { label: 'Insurance Info', path: '/referrals/insurance-info', subject: 'InsuranceInfo' },
    ]
  },
  {
    label: 'Admin',
    icon: '🛠️',
    path: '/admin',
    subject: 'Admin',
    subItems: [
      { label: 'All Organizations', path: '/avail/admin/organizations', subject: 'AllOrganizations' },
      { label: 'All Staff', path: '/admin/staff', subject: 'AllStaff' },
      { label: 'All Referrals', path: '/admin/referrals', subject: 'AllReferrals' },
    ]
  },
];
