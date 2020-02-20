/* eslint-disable class-methods-use-this */
import PBKDF2 from 'react-native-pbkdf2';
import SimpleCryptoJS from 'simple-crypto-js';
import { encrypt, decrypt } from 'react-native-simple-encryption';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-community/async-storage';

const STORAGE_KEY = 'secured-storage-key'; // Stores the local storage decryption key in the keychain/keystore
const MAP_KEY = 'secured-storage-keys'; // Stores all the encrypted db keys
const DB_KEY = 'secured-storage-data'; // Used to encrypt the storage keys

const SecuredAsyncStorage = class {
    localStorageKey = '';

    storage = null;

    async init(password) {
        try {
            // User logged in with their password, generate encryption key for local storage
            this.localStorageKey = await PBKDF2.derivationKey(password, SimpleCryptoJS.generateRandom(), 10000);

            // Write storage key to keychain
            const service = STORAGE_KEY;
            await Keychain.setGenericPassword(STORAGE_KEY, this.localStorageKey, { service });
            await AsyncStorage.setItem('secured-storage-initialised', 'true');
            console.log('Secured storage key written to keychain');
        } catch (e) {
            console.log('Failed to write secured storage key to keychain', e);
            return Promise.reject(e);
        }
    }

    async clear() { // Clear out any secured storage
        await Keychain.resetGenericPassword({ service: STORAGE_KEY }).catch(err => console.log('Error clearing keychain'));
        AsyncStorage.removeItem(DB_KEY);
        AsyncStorage.getItem(MAP_KEY, (err, res) => {
            if (err) return Promise.reject(err);
            if (res) {
                const keys = JSON.parse(res).map(key => DB_KEY + key);
                _.each(keys, (key) => {
                    AsyncStorage.removeItem(key);
                });
            }
        });
        this.storage = null;
    }

    async get() {
        try {
            // Get storage key from keychain
            ({ password: this.localStorageKey } = await Keychain.getGenericPassword({ service: STORAGE_KEY }));

            if (!this.localStorageKey) {
                return null;
            }

            // Decrypt local storage and return
            const storage = await this.unlock();

            return storage;
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async unlock() {
        if (!this.localStorageKey) {
            console.warn('Attempt to decrypt local storage without key');
            return Promise.reject();
        }
        try {
            const keymap = await AsyncStorage.getItem(MAP_KEY);
            if (keymap) {
                const keys = JSON.parse(keymap).map(key => DB_KEY + key);
                const encryptedData = await AsyncStorage.multiGet(keys);
                this.storage = {};
                _.each(encryptedData, (val) => {
                    const storageKey = val[0].replace(DB_KEY, '');
                    if (val[1]) {
                        const str = decrypt(this.localStorageKey, val[1]);
                        // strings[storageKey] = str;
                        this.storage[storageKey] = JSON.parse(str);
                    }
                });

                return this.storage;
            }
            return null;
        } catch (e) {
            console.log('Failed to decrypt local storage', e);
            return Promise.reject(e);
        }
    }

    setItem(key, val, string) {
        this.storage = this.storage || {};
        this.storage[key] = val;

        // todo: this may perform slightly better in a staggered queue
        if (this.localStorageKey) {
            AsyncStorage.setItem(MAP_KEY, JSON.stringify(Object.keys(this.storage))); // Update keys in secured storage
            const encryptedStorage = encrypt(this.localStorageKey, string || JSON.stringify(val)); // Encrypt string with local storage key
            console.log('Encrypting', key);
            return AsyncStorage.setItem(DB_KEY + key, encryptedStorage); // Update local storage
        }

        console.warn('Attempted to set secured storage item without a key');
    }

    removeItem(key) {
        this.storage = this.storage || {};
        if (this.storage[key]) delete this.storage[key];

        if (this.localStorageKey) return AsyncStorage.removeItem(DB_KEY + key);

        console.warn('Attempted to remove secured storage item without a key');
    }
};

export default new SecuredAsyncStorage();
