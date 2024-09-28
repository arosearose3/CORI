import { writable } from 'svelte/store';
import { AbilityBuilder, PureAbility } from '@casl/ability';

// Initialize PureAbility with an empty rule set
const initialAbilities = new PureAbility([]);

// Initial state for user and practitioner
//user is data from google's auth for the user
//practitioner is for FHIR Google store Id, and PractitionerRoleId
const initialUserState = {
  user: {
    id: null,
    email: null,
    name: null,
    picture: null,
    roles: [],
  },
  practitioner: {
    id: null,
    name: null,
    organizationId: null,
    organizationName: null,
    availability: null,
    capacity: null,
    PractitionerRoleId: null,
  },
};

// Function to create a writable store with persistent storage
const createPersistentStore = (key, startValue) => {
  // Initialize the writable store with the starting value
  const store = writable(startValue);

  if (typeof window !== 'undefined') { // Ensure code runs only on the client side
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        store.set(JSON.parse(storedValue)); // Set store with the parsed value from localStorage
      }
    } catch (error) {
      console.error(`Error reading localStorage key ${key}:`, error);
    }

    // Subscribe to store changes and update localStorage
    store.subscribe(value => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error setting localStorage key ${key}:`, error);
      }
    });
  }

  return store;
};

// Main store combining user data and practitioner data
export const user = createPersistentStore('userStore', initialUserState);

// Writable store to manage CASL abilities
export const abilities = writable(new PureAbility([]));

/**
 * Updates abilities based on the user's roles.
 * @param {Array<string>} userRoles - The roles assigned to the user.
 */
export function updateAbilities(userRoles) {
  try {
    const { can, cannot, build } = new AbilityBuilder(PureAbility);

    console.log("=== Updating Abilities ===");
    console.log("User Roles:", userRoles);

    if (userRoles.includes('admin')) {
      can('manage', 'all'); // Admin can do everything
      console.log("Role 'admin': can manage all");
    }
    if (userRoles.includes('org_admin')) {
      can('manage', 'Settings');
      can('manage', 'Consents');
      can('manage', 'Notifications');
      can('manage', 'Messages');
      can('manage', 'Referrals');
      can('manage', 'Admin');
      console.log("Role 'org_admin': can manage multiple subjects");
    }
    if (userRoles.includes('supervisor')) {
      can('view', 'ProviderReferrals');
      can('manage', 'Provenance');
      console.log("Role 'supervisor': can view ProviderReferrals and manage Provenance");
    }
    if (userRoles.includes('provider')) {
      can('view', 'Capacity')
      can('view', 'Settings');
      can('view', 'Consents');
      can('view', 'Notifications');
      can('view', 'Messages');
      can('view', 'Referrals');
      can('create', 'Referrals');
      can('manage', 'DemoData');
      can('manage', 'AvailabilityCapacity');
      console.log("Role 'provider': can view Referrals and manage DemoData & AvailabilityCapacity");
    }
    if (userRoles.includes('coordinator')) {
      can('manage', 'Referrals');
      can('create', 'Referrals');
      can('view', 'Referrals');
      console.log("Role 'coordinator': can manage, create, and view Referrals");
    }
    if (userRoles.includes('referrer')) {
      can('manage', 'Referrals');
      can('create', 'Referrals');
      can('changeStatus', 'Referrals');
      can('view', 'Referrals');
      console.log("Role 'referrer': can manage, create, change status, and view Referrals");
    }
    if (userRoles.includes('client')) {
      can('manage', 'Referrals');
      can('referSelf', 'Referrals');
      can('deleteSelf', 'Referrals');
      can('getHistory', 'Referrals');
      can('revokeConsents', 'Consents');
      can('leaveReferral', 'Referrals');
      can('view', 'OwnRecords');
      can('view', 'InsuranceInfo');

      can('view', 'ServiceRequests');
      can('view', 'Consents');
      can('view', 'Settings');
      can('view', 'OrganizationSearch');
      can('view', 'Notifications');
      can('view', 'Messages');
      console.log("Role 'client': various manage and view permissions");
    }
    // Add more role-based permissions as needed

    const builtAbility = build();
    abilities.set(builtAbility);
    console.log("=== Abilities Updated ===");
    console.log("Ability Rules:", builtAbility.rules);
  } catch (error) {
    console.error('Error updating abilities:', error);
  }
}

/**
 * Sets user data from authentication.
 * @param {Object} userData - The user data received from authentication.
 */
export function setUser(userData) {
  if (!userData || typeof userData !== 'object') {
    console.error('Invalid user data:', userData);
    return;
  }

  user.update(store => {
    store.user = {
      id: userData.id || null,
      email: userData.email || null,
      name: userData.name || null,
      picture: userData.picture || null,
      roles: Array.isArray(userData.roles) ? userData.roles : [],
    };
    console.log("User Store Updated:", store.user);
    updateAbilities(store.user.roles); // Update abilities based on roles
    return store;
  });
}

/**
 * Sets practitioner data from FHIR store authentication.
 * @param {Object} practitionerData - The practitioner data received from FHIR authentication.
 */
export function setPractitioner(practitionerData) {
  if (!practitionerData || typeof practitionerData !== 'object') {
    console.error('Invalid practitioner data:', practitionerData);
    return;
  }

  user.update(store => {
    store.practitioner = {
      id: practitionerData.id || null,
      name: practitionerData.name || null,
      organizationId: practitionerData.organizationId || null,
      organizationName: practitionerData.organizationName || null,
      availability: practitionerData.availability || null,
      PractitionerRoleId: practitionerData.PractitionerRoleId || null,
    };
    return store;
  });
}

/**
 * Clears all user and practitioner data from the store.
 */
export function clearUserStore() {
  user.set(initialUserState);
  abilities.set(new PureAbility([])); // Reset abilities on logout
}

/**
 * Clears only the practitioner data from the store.
 */
export function clearFhirStore() {
  user.update(store => {
    store.practitioner = {
      id: null,
      name: null,
      organizationId: null,
      organizationName: null,
      availability: null,
      PractitionerRoleId: null,
    };
    return store;
  });
}

/**
 * Combined actions for ease of import.
 */
export const actions = {
  setUser,
  setPractitioner,
  clearUserStore,
  clearFhirStore,
  updateAbilities
}; 