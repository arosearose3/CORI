import { writable } from 'svelte/store';
import { AbilityBuilder, PureAbility } from '@casl/ability';
import { navItems } from '$lib/navConfig.js'; // Import the navItems that have roles

// Initialize PureAbility with an empty rule set
const initialAbilities = new PureAbility([]);

// Initial state for user and practitioner
const initialUserState = {
  user: {
    id: null,
    email: null,
    name: null,
    picture: null,
  },
  practitioner: {
    id: null,
    name: null,
    organizationId: null,
    organizationName: null,
    availability: null,
    PractitionerRoleId: null,
    sms: null,
    dob: null,
    npi: null,
    roles: [], // Array to store roles
  },
};

// Function to create a writable store with persistent storage
const createPersistentStore = (key, startValue) => {
  const store = writable(startValue);

  if (typeof window !== 'undefined') {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        store.set(JSON.parse(storedValue));
      }
    } catch (error) {
      console.error(`Error reading localStorage key ${key}:`, error);
    }

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
 * Updates abilities based on the user's roles by using navItems.
 * @param {Array<string>} userRoles - The roles assigned to the user.
 */
export function updateAbilities(userRoles) {
  if (!userRoles || !Array.isArray(userRoles)) return;

  try {
    const { can, build } = new AbilityBuilder(PureAbility);

    // Iterate over navItems and dynamically set abilities based on userRoles
    navItems.forEach(item => {
      item.roles.forEach(role => {
        if (userRoles.includes(role)) {
          can('view', item.subject); // Grant the user the ability to 'view' the subject for this role
          console.log(`Role '${role}' can view '${item.subject}'`);
        }

        // If the item has subItems, iterate through them as well
        if (item.subItems) {
          item.subItems.forEach(subItem => {
            if (userRoles.includes(role)) {
              can('view', subItem.subject);
              console.log(`Role '${role}' can view '${subItem.subject}'`);
            }
          });
        }
      });
    });

    const builtAbility = build();
    abilities.set(builtAbility);
    console.log("=== Abilities Updated ===");
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
    if (!store) {
      store = initialUserState;
    }

    // Update user information
    store.user = {
      id: userData.id || null,
      email: userData.email || null,
      name: userData.name || null,
      picture: userData.picture || null,
      roles: userData.roles || [],
    };

    // Update abilities based on roles
    updateAbilities(store.user.roles);

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
      roles: Array.isArray(practitionerData.roles) ? practitionerData.roles : [],
    };

    // Update abilities based on practitioner roles
    updateAbilities(store.practitioner.roles);

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
      roles: [],
    };
    console.log("Practitioner Store Cleared:", store.practitioner);
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
  updateAbilities,
};
