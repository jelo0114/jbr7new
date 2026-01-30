// user-storage.js
// Simple wrapper around localStorage so existing cart/save code keeps working.
// NOTE: This is a revert to shared storage (no per-user isolation).

// For now we don't change keys based on user – we just reuse the plain key.
function getUserStorageKey(baseKey) {
    return baseKey;
}

// Lightweight storage helper used by other scripts (cart, saved, profile, signin, etc.)
const UserStorage = {
    getItem(key) {
        const k = getUserStorageKey(key);
        return localStorage.getItem(k);
    },
    setItem(key, value) {
        const k = getUserStorageKey(key);
        localStorage.setItem(k, value);
    },
    removeItem(key) {
        const k = getUserStorageKey(key);
        localStorage.removeItem(k);
    },
    // Keep this so logout/settings/profile can call it safely.
    clearUserData() {
        // Clear the same legacy keys those pages already handle.
        const keys = [
            'cart',
            'savedBags',
            'jbr7_default_payment',
            'jbr7_default_courier',
            'jbr7_customer_email',
            'jbr7_customer_phone',
            'pendingCheckout',
            'appliedPromo'
        ];
        keys.forEach(k => localStorage.removeItem(k));
    },
    // Used by signin.html – safe helper that just clears old generic keys.
    clearLegacyData() {
        const legacyKeys = [
            'cart',
            'savedBags',
            'jbr7_default_payment',
            'jbr7_default_courier',
            'jbr7_customer_email',
            'jbr7_customer_phone',
            'pendingCheckout',
            'appliedPromo'
        ];
        legacyKeys.forEach(k => localStorage.removeItem(k));
    }
};

// Restore session from "Remember me" when user returns (e.g. after closing browser)
(function() {
    try {
        if (!sessionStorage.getItem('jbr7_user_id') &&
            localStorage.getItem('jbr7_remember_me') === '1' &&
            localStorage.getItem('jbr7_user_id')) {
            sessionStorage.setItem('jbr7_user_id', localStorage.getItem('jbr7_user_id'));
            sessionStorage.setItem('jbr7_auth_uid', localStorage.getItem('jbr7_user_id'));
            if (localStorage.getItem('jbr7_user_email')) {
                sessionStorage.setItem('jbr7_user_email', localStorage.getItem('jbr7_user_email'));
            }
        }
    } catch (e) {
        console.warn('Remember me restore failed', e);
    }
})();

