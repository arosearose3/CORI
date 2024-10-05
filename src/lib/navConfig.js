// src/lib/navConfig.js

import { base } from '$app/paths'; // Import the base path

export const navItems = [
  {
    label: 'Clients',
    icon: '⚙️',
    path: `${base}/clients/provider`,
    subject: 'Provider Clients',
  },
  {
    label: 'Organization Clients',
    icon: '⚙️',
    path: `${base}/clients/orgadmin`,
    subject: 'Organization Clients',
  },
  {
    label: 'Cori Clients',
    icon: '⚙️',
    path: `${base}/clients/admin`,
    subject: 'Cori Clients',
  },
  {
    label: 'Organization Staff',
    icon: '⚙️',
    path: `${base}/staff/admin`,
    subject: 'Organization Staff',
  },
  {
    label: 'Organization Admin',
    icon: '⚙️',
    path: `${base}/staff/orgadmin`,
    subject: 'Organization Admin',
  },
  {
    label: 'Cori Staff',
    icon: '⚙️',
    path: `${base}/staff/admin`,
    subject: 'Cori Staff',
  },
  {
    label: 'Settings',
    icon: '⚙️',
    path: `${base}/usersettings`,
    subject: 'User Settings',
    subItems: [
      { label: 'SMS', path: `${base}/settings/sms`, subject: 'SMSSettings' },
      { label: 'Email', path: `${base}/settings/email`, subject: 'EmailSettings' },
      { label: 'Government Name', path: `${base}/settings/govt-name`, subject: 'GovernmentName' },
      { label: 'Preferred Name', path: `${base}/settings/preferred-name`, subject: 'PreferredName' },
      { label: 'Pronouns', path: `${base}/settings/pronouns`, subject: 'Pronouns' },
      { label: 'Demo Data', path: `${base}/settings/demo-data`, subject: 'DemoData' },
    ]
  },
  {
    label: 'Consents',
    icon: '✅',
    path: `${base}/consents`,
    subject: 'Consents',
    subItems: [
      { label: 'SMS Consents', path: `${base}/consents/sms`, subject: 'SMSConsents' },
      { label: 'Email Consents', path: `${base}/consents/email`, subject: 'EmailConsents' },
      { label: 'ROIs', path: `${base}/consents/rois`, subject: 'ROIs' },
    ]
  },
  {
    label: 'Organization Search',
    icon: '🔍',
    path: `${base}/organizationsearch`,
    subject: 'OrganizationSearch',
  },
  {
    label: 'Notifications',
    icon: '🔔',
    path: `${base}/notifications`,
    subject: 'Notifications',
    subItems: [
      { label: 'Read Notifications', path: `${base}/notifications/read`, subject: 'ReadNotifications' },
      { label: 'Delete Notifications', path: `${base}/notifications/delete`, subject: 'DeleteNotifications' },
    ]
  },
  {
    label: 'Messages',
    icon: '✉️',
    path: `${base}/messages`,
    subject: 'Messages',
    subItems: [
      { label: 'Create Message', path: `${base}/messages/create`, subject: 'CreateMessage' },
      { label: 'Read Messages', path: `${base}/messages/read`, subject: 'ReadMessages' },
      { label: 'Reply Message', path: `${base}/messages/reply`, subject: 'ReplyMessage' },
      { label: 'Forward Message', path: `${base}/messages/forward`, subject: 'ForwardMessage' },
      { label: 'Delete Message', path: `${base}/messages/delete`, subject: 'DeleteMessage' },
    ]
  },
  {
    label: 'Capacity and Availability',
    icon: '✉️',
    path: `${base}/capacity`,
    subject: 'Capacity',
  },
  {
    label: 'Referrals',
    icon: '📄',
    path: `${base}/referrals`,
    subject: 'Referrals',
    subItems: [
      { label: 'Create Referral', path: `${base}/referrals/create`, subject: 'CreateReferral' },
      { label: 'Delete Referral', path: `${base}/referrals/delete`, subject: 'DeleteReferral' },
      { label: 'Referral History', path: `${base}/referrals/history`, subject: 'ReferralHistory' },
      { label: 'Revoke Consents', path: `${base}/referrals/revoke-consents`, subject: 'RevokeConsents' },
      { label: 'Leave Referral', path: `${base}/referrals/leave`, subject: 'LeaveReferral' },
      { label: 'Own Records', path: `${base}/referrals/own-records`, subject: 'OwnRecords' },
      { label: 'Insurance Info', path: `${base}/referrals/insurance-info`, subject: 'InsuranceInfo' },
    ]
  },
  {
    label: 'Admin',
    icon: '🛠️',
    path: `${base}/admin/organizations`,
    subject: 'Admin',
    subItems: [
      { label: 'All Organizations', path: `${base}/admin/organizations`, subject: 'AllOrganizations' },
      { label: 'All Staff', path: `${base}/admin/staff`, subject: 'AllStaff' },
      { label: 'All Referrals', path: `${base}/admin/referrals`, subject: 'AllReferrals' },
    ]
  },
];
